package com.omwallet.feature.markets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.omwallet.core.data.Asset
import com.omwallet.core.data.Catalog
import com.omwallet.core.data.DisplayCurrency
import com.omwallet.core.data.FeedMode
import com.omwallet.core.data.Fmt
import com.omwallet.core.data.OmGraph
import com.omwallet.core.data.Quote
import com.omwallet.core.design.AssetLogo
import com.omwallet.core.design.EmptyState
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmIcons
import com.omwallet.core.design.OmPullRefresh
import com.omwallet.core.design.LiveText
import com.omwallet.core.design.SkeletonRows
import com.omwallet.core.design.SlidingSegments
import com.omwallet.core.design.holdRefresh
import com.omwallet.core.design.pressable
import com.omwallet.core.design.rememberLiveTick
import com.omwallet.core.design.rememberOmHaptics
import com.omwallet.core.ui.FeedBadge
import com.omwallet.core.ui.R
import com.omwallet.core.ui.omViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class MarketRow(val asset: Asset, val quote: Quote?, val favorite: Boolean)
data class MarketsUiState(val rows: List<MarketRow> = emptyList(), val mode: FeedMode = FeedMode.Idle, val lastSync: Long = 0, val currency: DisplayCurrency = DisplayCurrency.USD)

class MarketsViewModel(private val g: OmGraph) : ViewModel() {
    val state: StateFlow<MarketsUiState> = combine(g.market.state, g.prefs.prefs) { m, p ->
        MarketsUiState(Catalog.assets.map { MarketRow(it, m.quotes[it.sym], it.sym in p.favorites) }, m.mode, m.lastSync, p.currency)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), MarketsUiState())
    fun toggleFavorite(sym: String) = viewModelScope.launch { g.prefs.toggleFavorite(sym) }
    /** pull to refresh: the prices are really read again (the live stream keeps running) */
    suspend fun reload() { g.market.refreshNow() }
}

@Composable
fun MarketsScreen(onAsset: (String) -> Unit, contentPadding: PaddingValues) {
    val vm = omViewModel { MarketsViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    var favOnly by rememberSaveable { mutableStateOf(false) }
    val rows = if (favOnly) s.rows.filter { it.favorite } else s.rows
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    var refreshing by remember { mutableStateOf(false) }

    OmPullRefresh(refreshing, { scope.launch { refreshing = true; try { holdRefresh { vm.reload() } } finally { refreshing = false } } }) {
    LazyColumn(Modifier.fillMaxSize(), contentPadding = contentPadding) {
        item {
            com.omwallet.core.design.RefHeader(stringResource(R.string.markets_title), below = {
                FeedBadge(s.mode, s.lastSync)
                SlidingSegments(listOf(stringResource(R.string.filter_all), stringResource(R.string.filter_fav)), if (favOnly) 1 else 0, { favOnly = it == 1 })
            })
        }
        if (s.mode == FeedMode.Idle && s.rows.all { it.quote == null }) item { SkeletonRows(6, Modifier.padding(horizontal = 20.dp)) }
        if (s.mode == FeedMode.Offline && s.rows.all { it.quote == null }) item {
            EmptyState(stringResource(R.string.markets_error), stringResource(R.string.markets_source), Modifier.padding(16.dp))
        }
        if (favOnly && rows.isEmpty()) item { EmptyState(stringResource(R.string.markets_fav_empty_t), stringResource(R.string.markets_fav_empty_b), Modifier.padding(16.dp)) }
        /* one glass card per asset, as in the « my assets » reference */
        items(rows, key = { it.asset.sym }) { r -> com.omwallet.core.design.GlassCard(Modifier.padding(horizontal = 16.dp, vertical = 6.dp), padding = 4.dp) { MarketItem(r, s.currency, onClick = { onAsset(r.asset.sym) }, onStar = { vm.toggleFavorite(r.asset.sym) }) } }
        item { Text(stringResource(R.string.markets_source), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.padding(20.dp)) }
    }
    }
}

/* Each row is keyed by its symbol and only reads its own quote: when one price changes, only that row is recomposed.
   15.1.0: the price and the percentage flash green / red for the direction of the move, nudge 2 dp and settle back (LiveText); nothing moves under « remove animations ». */
@Composable
private fun MarketItem(r: MarketRow, cur: DisplayCurrency, onClick: () -> Unit, onStar: () -> Unit) {
    val q = r.quote
    val priceText = Fmt.money(q?.price, cur)
    val priceTick = rememberLiveTick(q?.price, priceText)
    val ch = q?.changePct
    val pctText = Fmt.pct(ch)
    val pctTick = rememberLiveTick(ch, pctText)
    val haptics = rememberOmHaptics()
    val favLabel = stringResource(if (r.favorite) R.string.fav_remove else R.string.fav_add)
    Row(Modifier.fillMaxWidth().pressable(onClick = onClick).padding(horizontal = 20.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        AssetLogo(r.asset.sym)
        Column(Modifier.weight(1f)) {
            Text(r.asset.name, style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
            Text(r.asset.sym + if (q?.derived == true) " · USDC/USDT" else "", style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
        }
        Column(horizontalAlignment = Alignment.End) {
            LiveText(priceText, priceTick, style = MaterialTheme.typography.titleSmall)
            LiveText(pctText, pctTick, style = MaterialTheme.typography.labelMedium, base = if (ch == null) OmColors.InkSecondary else if (ch >= 0) OmColors.Success else OmColors.Error)
        }
        Box(Modifier.size(36.dp).pressable(role = Role.Checkbox) { haptics.tap(); onStar() }.semantics { contentDescription = favLabel }, contentAlignment = Alignment.Center) {
            OmIcon(if (r.favorite) OmIcons.StarFilled else OmIcons.Star, null, tint = if (r.favorite) OmColors.Warning else OmColors.InkSecondary, size = 20.dp)
        }
    }
}
