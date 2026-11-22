package com.omwallet.feature.markets

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
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
import com.omwallet.core.design.OmSprings
import com.omwallet.core.design.SkeletonRows
import com.omwallet.core.design.pressable
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
}

@Composable
fun MarketsScreen(onAsset: (String) -> Unit, contentPadding: PaddingValues) {
    val vm = omViewModel { MarketsViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    var favOnly by rememberSaveable { mutableStateOf(false) }
    val rows = if (favOnly) s.rows.filter { it.favorite } else s.rows

    LazyColumn(Modifier.fillMaxSize(), contentPadding = contentPadding) {
        item {
            Column(Modifier.statusBarsPadding().padding(horizontal = 20.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(stringResource(R.string.markets_title), style = MaterialTheme.typography.headlineMedium, color = OmColors.Ink)
                FeedBadge(s.mode, s.lastSync)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 6.dp)) {
                    Segment(stringResource(R.string.filter_all), !favOnly) { favOnly = false }
                    Segment(stringResource(R.string.filter_fav), favOnly) { favOnly = true }
                }
            }
        }
        if (s.mode == FeedMode.Idle && s.rows.all { it.quote == null }) item { SkeletonRows(6, Modifier.padding(horizontal = 20.dp)) }
        if (s.mode == FeedMode.Offline && s.rows.all { it.quote == null }) item {
            EmptyState(stringResource(R.string.markets_error), stringResource(R.string.markets_source), Modifier.padding(16.dp))
        }
        if (favOnly && rows.isEmpty()) item { EmptyState(stringResource(R.string.markets_fav_empty_t), stringResource(R.string.markets_fav_empty_b), Modifier.padding(16.dp)) }
        items(rows, key = { it.asset.sym }) { r -> MarketItem(r, s.currency, onClick = { onAsset(r.asset.sym) }, onStar = { vm.toggleFavorite(r.asset.sym) }) }
        item { Text(stringResource(R.string.markets_source), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.padding(20.dp)) }
    }
}

@Composable
private fun Segment(text: String, on: Boolean, onClick: () -> Unit) {
    Box(Modifier.clip(RoundedCornerShape(50)).background(if (on) OmColors.Ink else OmColors.Sky100).pressable(role = Role.Tab, onClick = onClick).padding(horizontal = 14.dp, vertical = 7.dp)) {
        Text(text, style = MaterialTheme.typography.labelLarge, color = if (on) Color.White else OmColors.Ink)
    }
}

/* Each row is keyed by its symbol and only reads its own quote: when one price changes, only that row is recomposed.
   The price flashes softly green / red for the direction of the change (colour only — no bounce). */
@Composable
private fun MarketItem(r: MarketRow, cur: DisplayCurrency, onClick: () -> Unit, onStar: () -> Unit) {
    val q = r.quote
    var last by remember { mutableStateOf(q?.price) }
    var flash by remember { mutableStateOf(0) }
    LaunchedEffect(q?.price) {
        val p = q?.price; val l = last
        if (p != null && l != null && p != l) { flash = if (p > l) 1 else -1; kotlinx.coroutines.delay(650); flash = 0 }
        last = p
    }
    val priceColor by animateColorAsState(when (flash) { 1 -> OmColors.Success; -1 -> OmColors.Error; else -> OmColors.Ink }, OmSprings.fade(220), label = "flash")
    val haptics = rememberOmHaptics()
    val favLabel = stringResource(if (r.favorite) R.string.fav_remove else R.string.fav_add)
    Row(Modifier.fillMaxWidth().pressable(onClick = onClick).padding(horizontal = 20.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        AssetLogo(r.asset.sym)
        Column(Modifier.weight(1f)) {
            Text(r.asset.name, style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
            Text(r.asset.sym + if (q?.derived == true) " · USDC/USDT" else "", style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(Fmt.money(q?.price, cur), style = MaterialTheme.typography.titleSmall, color = priceColor)
            val ch = q?.changePct
            Text(Fmt.pct(ch), style = MaterialTheme.typography.labelMedium, color = if (ch == null) OmColors.InkSecondary else if (ch >= 0) OmColors.Success else OmColors.Error)
        }
        Box(Modifier.size(36.dp).pressable(role = Role.Checkbox) { haptics.tap(); onStar() }.semantics { contentDescription = favLabel }, contentAlignment = Alignment.Center) {
            OmIcon(if (r.favorite) OmIcons.StarFilled else OmIcons.Star, null, tint = if (r.favorite) OmColors.Warning else OmColors.InkSecondary, size = 20.dp)
        }
    }
}
