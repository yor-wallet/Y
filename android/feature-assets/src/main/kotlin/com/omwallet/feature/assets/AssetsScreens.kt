package com.omwallet.feature.assets

import com.omwallet.core.design.WalletArt

import com.omwallet.core.design.ReferenceTitle

import com.omwallet.core.design.BrandLockup

import androidx.compose.ui.graphics.Color

import androidx.compose.ui.graphics.Brush

import androidx.compose.foundation.lazy.itemsIndexed

import androidx.compose.foundation.border

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.omwallet.core.data.AssetPosition
import com.omwallet.core.data.Catalog
import com.omwallet.core.data.DisplayCurrency
import com.omwallet.core.data.Fmt
import com.omwallet.core.data.OmGraph
import com.omwallet.core.data.Period
import com.omwallet.core.data.Quote
import com.omwallet.core.data.Tx
import com.omwallet.core.design.AreaChart
import com.omwallet.core.design.AssetLogo
import com.omwallet.core.design.EmptyState
import com.omwallet.core.design.GlassCard
import com.omwallet.core.design.NetworkLogo
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmIcons
import com.omwallet.core.design.OmPrimaryButton
import com.omwallet.core.design.OmSecondaryButton
import com.omwallet.core.design.OmSprings
import com.omwallet.core.design.SkeletonRows
import com.omwallet.core.design.pressable
import com.omwallet.core.ui.FeedBadge
import com.omwallet.core.ui.R
import com.omwallet.core.ui.TxDetailSheet
import com.omwallet.core.ui.TxItem
import com.omwallet.core.ui.Tabs
import com.omwallet.core.ui.money
import com.omwallet.core.ui.omViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/* ======================= ASSETS LIST ======================= */
data class AssetLine(val position: AssetPosition, val quote: Quote?) { val usd get() = quote?.price?.let { it * position.balance } }
data class AssetsUiState(val lines: List<AssetLine> = emptyList(), val loading: Boolean = true, val hidden: Boolean = false, val currency: DisplayCurrency = DisplayCurrency.USD)

class AssetsViewModel(g: OmGraph) : ViewModel() {
    val state: StateFlow<AssetsUiState> = combine(g.wallet.state, g.market.state, g.prefs.prefs) { w, m, p ->
        AssetsUiState(w.positions.map { AssetLine(it, m.quotes[it.asset]) }.sortedByDescending { it.usd ?: -1.0 }, w.loading && w.syncedAt == 0L, p.hideBalance, p.currency)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), AssetsUiState())
}

@Composable
fun AssetsScreen(onAsset: (String) -> Unit, onDeposit: () -> Unit, onSend: () -> Unit, contentPadding: PaddingValues) {
    val vm = omViewModel { AssetsViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    /* « my assets » reference: logo, large centred title, hero glass card with the glass wallet, then one glass card per asset
       with « View details » (opens the real asset page) */
    LazyColumn(Modifier.fillMaxSize(), contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Column(Modifier.statusBarsPadding().padding(horizontal = 16.dp, vertical = 6.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                BrandLockup(height = 38.dp)
                ReferenceTitle(stringResource(R.string.assets_title))
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), strong = true, padding = 20.dp, rise = 0) {
                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    WalletArt()
                    Text(stringResource(R.string.assets_digital), style = MaterialTheme.typography.headlineMedium, color = OmColors.Ink)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OmPrimaryButton(stringResource(R.string.action_deposit), Modifier.weight(1f), onClick = onDeposit)
                        OmSecondaryButton(stringResource(R.string.action_send), Modifier.weight(1f), onClick = onSend)
                    }
                }
            }
        }
        if (s.loading) item { SkeletonRows(4, Modifier.padding(horizontal = 20.dp)) }
        else if (s.lines.isEmpty()) item { EmptyState(stringResource(R.string.home_no_holdings_t), stringResource(R.string.home_no_holdings_b), Modifier.padding(16.dp), stringResource(R.string.action_deposit), onDeposit) }
        itemsIndexed(s.lines, key = { _, l -> l.position.asset }) { i, l ->
            GlassCard(Modifier.padding(horizontal = 16.dp).pressable { onAsset(l.position.asset) }, padding = 16.dp, rise = i + 1) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    AssetLogo(l.position.asset, size = 52.dp)
                    Column(Modifier.weight(1f)) {
                        Text(l.position.asset, style = MaterialTheme.typography.titleLarge, color = OmColors.Ink)
                        Text(Catalog.asset(l.position.asset)?.name ?: l.position.asset, style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary)
                        Text(Fmt.masked(Fmt.qty(l.position.balance, l.position.asset), s.hidden) + "  ·  " + money(l.usd, s.currency, s.hidden), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                        if (l.position.locked > 0) Text(stringResource(R.string.assets_locked) + " " + Fmt.masked(Fmt.qty(l.position.locked, l.position.asset), s.hidden), style = MaterialTheme.typography.labelSmall, color = OmColors.Warning)
                    }
                    Text(stringResource(R.string.assets_details), style = MaterialTheme.typography.labelLarge, color = OmColors.Blue600,
                        modifier = Modifier.clip(RoundedCornerShape(16.dp)).background(Brush.linearGradient(listOf(Color(0xF2FFFFFF), Color(0xBFDCEEFF))))
                            .border(1.dp, Color.White, RoundedCornerShape(16.dp)).pressable { onAsset(l.position.asset) }.padding(horizontal = 14.dp, vertical = 10.dp))
                }
            }
        }
    }
}

/* ======================= ASSET DETAIL ======================= */
data class DetailUiState(
    val sym: String, val quote: Quote? = null, val position: AssetPosition? = null, val chart: List<Double> = emptyList(), val chartLoading: Boolean = true,
    val chartError: Boolean = false, val period: Period = Period.D1, val history: List<Tx> = emptyList(), val hidden: Boolean = false,
    val currency: DisplayCurrency = DisplayCurrency.USD, val mode: com.omwallet.core.data.FeedMode = com.omwallet.core.data.FeedMode.Idle, val lastSync: Long = 0,
    val fees: Map<String, Double> = emptyMap(),
)

class AssetDetailViewModel(private val g: OmGraph, private val sym: String) : ViewModel() {
    private val chart = MutableStateFlow(Triple(Period.D1, emptyList<Double>(), 0))    /* period, values, 0 loading · 1 ok · 2 error */
    private val fees = MutableStateFlow<Map<String, Double>>(emptyMap())
    val state: StateFlow<DetailUiState> = combine(g.wallet.state, g.market.state, g.prefs.prefs, chart, fees) { w, m, p, c, f ->
        DetailUiState(sym, m.quotes[sym], w.positions.firstOrNull { it.asset == sym }, c.second, c.third == 0, c.third == 2, c.first,
            w.transactions.filter { it.asset.equals(sym, true) }, p.hideBalance, p.currency, m.mode, m.lastSync, f)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), DetailUiState(sym))
    private var job: Job? = null

    init {
        load(Period.D1)
        viewModelScope.launch { runCatching { g.money.cryptoOverview() }.onSuccess { o -> fees.value = o.networks.filter { it.asset == sym }.associate { it.network to it.fee } } }
    }
    fun load(p: Period) {
        job?.cancel()
        chart.value = Triple(p, chart.value.second, 0)
        job = viewModelScope.launch {
            chart.value = runCatching { g.market.history(sym, p).map { it.close } }.fold({ Triple(p, it, if (it.size > 1) 1 else 2) }, { Triple(p, emptyList(), 2) })
        }
    }
}

@Composable
fun AssetDetailScreen(sym: String, onBack: () -> Unit, onDeposit: (String) -> Unit, onWithdraw: (String) -> Unit, onSend: (String) -> Unit) {
    val vm = omViewModel(key = "asset-$sym") { AssetDetailViewModel(it, sym) }
    val s by vm.state.collectAsStateWithLifecycle()
    var tab by rememberSaveable { mutableStateOf(0) }
    var detail by remember { mutableStateOf<Tx?>(null) }
    val asset = Catalog.asset(sym)
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Row(Modifier.statusBarsPadding().padding(horizontal = 12.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                val back = stringResource(R.string.back)
                Box(Modifier.size(44.dp).pressable(onClick = onBack).semantics { contentDescription = back }, contentAlignment = Alignment.Center) { OmIcon(OmIcons.Back, null) }
                AssetLogo(sym, 36.dp)
                Column {
                    Text(asset?.name ?: sym, style = MaterialTheme.typography.titleLarge, color = OmColors.Ink)
                    FeedBadge(s.mode, s.lastSync)
                }
            }
        }
        item {
            Column(Modifier.padding(horizontal = 20.dp)) {
                Text(Fmt.money(s.quote?.price, s.currency), style = MaterialTheme.typography.displaySmall, color = OmColors.Ink)
                val ch = s.quote?.changePct
                Text(Fmt.pct(ch) + " · 24 h", style = MaterialTheme.typography.labelLarge, color = if (ch == null) OmColors.InkSecondary else if (ch >= 0) OmColors.Success else OmColors.Error)
                if (s.quote?.derived == true) Text(stringResource(R.string.usdt_derived), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
            }
        }
        item { Tabs(listOf(stringResource(R.string.tab_overview), stringResource(R.string.tab_history), stringResource(R.string.tab_networks)), tab) { tab = it } }
        when (tab) {
            0 -> {
                item {
                    GlassCard(Modifier.padding(horizontal = 16.dp)) {
                        /* periods switch with a crossfade; the previous curve stays until the new one is ready (no blank frame) */
                        Crossfade(targetState = Triple(s.chart, s.chartLoading, s.chartError), animationSpec = OmSprings.fade(220), label = "chart") { (values, loading, error) ->
                            Box(Modifier.fillMaxWidth().height(180.dp), contentAlignment = Alignment.Center) {
                                when {
                                    values.size > 1 -> AreaChart(values, Modifier.fillMaxSize(), if (values.last() >= values.first()) OmColors.Success else OmColors.Error)
                                    loading -> SkeletonRows(2)
                                    error -> Text(stringResource(R.string.chart_unavailable), style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary)
                                }
                            }
                        }
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                            listOf(Period.D1 to R.string.period_d1, Period.W1 to R.string.period_w1, Period.M1 to R.string.period_m1, Period.Y1 to R.string.period_y1).forEach { (p, label) ->
                                val on = p == s.period
                                Box(Modifier.clip(RoundedCornerShape(50)).background(if (on) OmColors.Sky100 else androidx.compose.ui.graphics.Color.Transparent).pressable(role = Role.Tab) { vm.load(p) }.padding(horizontal = 14.dp, vertical = 6.dp)) {
                                    Text(stringResource(label), style = MaterialTheme.typography.labelLarge, color = if (on) OmColors.Blue600 else OmColors.InkSecondary)
                                }
                            }
                        }
                    }
                }
                item {
                    GlassCard(Modifier.padding(horizontal = 16.dp)) {
                        Stat(stringResource(R.string.stat_high), Fmt.money(s.quote?.high?.takeIf { it > 0 }, s.currency))
                        Stat(stringResource(R.string.stat_low), Fmt.money(s.quote?.low?.takeIf { it > 0 }, s.currency))
                        Stat(stringResource(R.string.stat_volume), Fmt.money(s.quote?.quoteVolume?.takeIf { it > 0 }, s.currency))
                    }
                }
                item {
                    GlassCard(Modifier.padding(horizontal = 16.dp)) {
                        Text(stringResource(R.string.your_position), style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
                        val bal = s.position?.balance ?: 0.0
                        Text(Fmt.masked(Fmt.qty(bal, sym), s.hidden), style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink)
                        Text(money(s.quote?.price?.let { it * bal }, s.currency, s.hidden), style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary)
                        if ((s.position?.locked ?: 0.0) > 0) Text(stringResource(R.string.assets_locked) + " " + Fmt.masked(Fmt.qty(s.position!!.locked, sym), s.hidden), style = MaterialTheme.typography.bodySmall, color = OmColors.Warning)
                    }
                }
                if (asset != null && asset.nets.isNotEmpty()) item {
                    Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OmPrimaryButton(stringResource(R.string.action_deposit), Modifier.weight(1f)) { onDeposit(sym) }
                        OmSecondaryButton(stringResource(R.string.action_withdraw), Modifier.weight(1f)) { onWithdraw(sym) }
                        OmSecondaryButton(stringResource(R.string.action_send), Modifier.weight(1f)) { onSend(sym) }
                    }
                }
            }
            1 -> {
                if (s.history.isEmpty()) item { EmptyState(stringResource(R.string.home_no_activity_t), stringResource(R.string.home_no_activity_b), Modifier.padding(16.dp)) }
                items(s.history, key = { it.id }) { t -> TxItem(t, s.hidden, { detail = t }, Modifier.padding(horizontal = 20.dp)) }
            }
            else -> {
                if (asset == null || asset.nets.isEmpty()) item { EmptyState(stringResource(R.string.net_none_t), stringResource(R.string.net_none_b), Modifier.padding(16.dp)) }
                items(asset?.nets ?: emptyList(), key = { it }) { id ->
                    val n = Catalog.network(id) ?: return@items
                    Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        NetworkLogo(id, 36.dp)
                        Column(Modifier.weight(1f)) {
                            Text(n.name, style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
                            Text(stringResource(R.string.net_standard, n.std), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                        }
                        s.fees[id]?.let { Text(stringResource(R.string.net_withdraw_fee, com.omwallet.core.ui.ltr(Fmt.qty(it, sym))), style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary) }
                    }
                }
            }
        }
    }
    detail?.let { TxDetailSheet(it, s.hidden) { detail = null } }
}

@Composable
private fun Stat(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 2.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary)
        Text(value, style = MaterialTheme.typography.bodyMedium, color = OmColors.Ink)
    }
}

