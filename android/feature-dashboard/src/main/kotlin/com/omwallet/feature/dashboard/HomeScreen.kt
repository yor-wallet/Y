package com.omwallet.feature.dashboard

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
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
import com.omwallet.core.data.AuthState
import com.omwallet.core.data.Catalog
import com.omwallet.core.data.DisplayCurrency
import com.omwallet.core.data.FeedMode
import com.omwallet.core.data.Fmt
import com.omwallet.core.data.OmGraph
import com.omwallet.core.data.Quote
import com.omwallet.core.data.Tx
import com.omwallet.core.data.UserPrefs
import com.omwallet.core.design.AssetLogo
import com.omwallet.core.design.EmptyState
import com.omwallet.core.design.GlassCard
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmIcons
import com.omwallet.core.design.OmRadius
import com.omwallet.core.design.SectionTitle
import com.omwallet.core.design.SkeletonRows
import com.omwallet.core.design.pressable
import com.omwallet.core.design.rememberOmHaptics
import com.omwallet.core.ui.FeedBadge
import com.omwallet.core.ui.R
import com.omwallet.core.ui.TxDetailSheet
import com.omwallet.core.ui.TxItem
import com.omwallet.core.ui.money
import com.omwallet.core.ui.omViewModel
import com.omwallet.core.ui.relative
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class Line(val position: AssetPosition, val quote: Quote?) { val usd: Double? get() = quote?.price?.let { it * position.balance } }

data class HomeUiState(
    val name: String = "", val loading: Boolean = true, val prefs: UserPrefs = UserPrefs(),
    val totalUsd: Double? = null, val unpriced: Int = 0, val omrAvailable: Double? = null, val omrReserved: Double = 0.0,
    val lines: List<Line> = emptyList(), val recent: List<Tx> = emptyList(), val feed: FeedMode = FeedMode.Idle, val lastSync: Long = 0,
    val syncedAt: Long = 0, val offline: Boolean = false,
)

/* Total = crypto at the live market price + the OMR account at the official peg. An asset without a price is NOT counted and the screen says so. */
fun computeTotal(lines: List<Line>, omr: Double?): Pair<Double?, Int> {
    val priced = lines.filter { it.position.balance > 0 && it.usd != null }
    val unpriced = lines.count { it.position.balance > 0 && it.usd == null }
    val omrUsd = omr?.let { it / Catalog.OMR_PER_USD }
    if (priced.isEmpty() && omrUsd == null) return null to unpriced
    return (priced.sumOf { it.usd!! } + (omrUsd ?: 0.0)) to unpriced
}

class HomeViewModel(private val g: OmGraph) : ViewModel() {
    val state: StateFlow<HomeUiState> = combine(g.wallet.state, g.market.state, g.prefs.prefs, g.auth.state) { w, m, p, a ->
        val lines = w.positions.map { Line(it, m.quotes[it.asset]) }.sortedByDescending { it.usd ?: -1.0 }
        val omr = w.accounts.firstOrNull { it.currency == "OMR" }
        val (total, unpriced) = computeTotal(lines, omr?.available)
        HomeUiState(
            name = (a as? AuthState.SignedIn)?.profile?.firstName.orEmpty(), loading = w.loading && w.syncedAt == 0L, prefs = p,
            totalUsd = total, unpriced = unpriced, omrAvailable = omr?.available, omrReserved = omr?.reserved ?: 0.0,
            lines = lines, recent = w.transactions.take(5), feed = m.mode, lastSync = m.lastSync, syncedAt = w.syncedAt, offline = w.offline,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HomeUiState())

    fun refresh() = viewModelScope.launch { g.auth.userId?.let { g.wallet.refresh(it) } }
    fun toggleHidden() = viewModelScope.launch { g.prefs.setHidden(!state.value.prefs.hideBalance) }
    fun toggleCurrency() = viewModelScope.launch { g.prefs.setCurrency(if (state.value.prefs.currency == DisplayCurrency.USD) DisplayCurrency.OMR else DisplayCurrency.USD) }
}

data class HomeActions(val deposit: () -> Unit, val withdraw: () -> Unit, val crypto: () -> Unit, val markets: () -> Unit, val send: () -> Unit,
                       val asset: (String) -> Unit, val activity: () -> Unit)

@Composable
fun HomeScreen(actions: HomeActions, contentPadding: PaddingValues) {
    val vm = omViewModel { HomeViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    LaunchedEffect(Unit) { vm.refresh() }
    var detail by remember { mutableStateOf<Tx?>(null) }
    val haptics = rememberOmHaptics()

    LazyColumn(Modifier.fillMaxSize(), contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Column(Modifier.statusBarsPadding().padding(horizontal = 20.dp, vertical = 8.dp)) {
                Text(if (s.name.isBlank()) stringResource(R.string.app_name) else stringResource(R.string.home_hello, s.name), style = MaterialTheme.typography.headlineMedium, color = OmColors.Ink)
                FeedBadge(s.feed, s.lastSync)
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), strong = true) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(stringResource(R.string.home_total), style = MaterialTheme.typography.labelLarge, color = OmColors.InkSecondary)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CurrencyPill(s.prefs.currency) { haptics.tap(); vm.toggleCurrency() }
                        EyePill(s.prefs.hideBalance, stringResource(if (s.prefs.hideBalance) R.string.home_show else R.string.home_hide)) { vm.toggleHidden() }
                    }
                }
                if (s.loading) SkeletonRows(1)
                else AnimatedContent(money(s.totalUsd, s.prefs.currency, s.prefs.hideBalance), transitionSpec = { fadeIn() togetherWith fadeOut() }, label = "total") { v ->
                    Text(v, style = MaterialTheme.typography.displayLarge, color = OmColors.Ink, modifier = Modifier.semantics { contentDescription = v })
                }
                if (s.unpriced > 0) Text(stringResource(R.string.home_incomplete), style = MaterialTheme.typography.bodySmall, color = OmColors.Warning)
                if (s.prefs.currency == DisplayCurrency.OMR) Text(stringResource(R.string.peg_note), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                if (s.offline && s.syncedAt > 0) Text(stringResource(R.string.offline_since, relative(s.syncedAt)), style = MaterialTheme.typography.bodySmall, color = OmColors.Warning)
                Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    QuickAction(OmIcons.Deposit, stringResource(R.string.action_deposit), actions.deposit)
                    QuickAction(OmIcons.Withdraw, stringResource(R.string.action_withdraw), actions.withdraw)
                    QuickAction(OmIcons.Coin, stringResource(R.string.action_crypto), actions.crypto)
                    QuickAction(OmIcons.Chart, stringResource(R.string.action_markets), actions.markets)
                }
            }
        }
        if (s.omrAvailable != null) item {
            GlassCard(Modifier.padding(horizontal = 16.dp)) {
                Text(stringResource(R.string.home_omr), style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
                Text(com.omwallet.core.data.Fmt.masked(String.format(java.util.Locale.US, "%,.3f OMR", s.omrAvailable), s.prefs.hideBalance), style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink)
                if (s.omrReserved > 0) Text(stringResource(R.string.home_reserved, com.omwallet.core.ui.ltr(Fmt.masked(String.format(java.util.Locale.US, "%,.3f OMR", s.omrReserved), s.prefs.hideBalance))), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
            }
        }
        item { Promotions(actions) }
        item { SectionTitle(stringResource(R.string.home_holdings), Modifier.padding(horizontal = 20.dp), stringResource(R.string.see_all), actions.crypto) }
        if (!s.loading && s.lines.none { it.position.balance > 0 }) item {
            EmptyState(stringResource(R.string.home_no_holdings_t), stringResource(R.string.home_no_holdings_b), Modifier.padding(horizontal = 16.dp), stringResource(R.string.action_deposit), actions.deposit)
        }
        items(s.lines.filter { it.position.balance > 0 }.take(5), key = { it.position.asset }) { l ->
            Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp).pressable { actions.asset(l.position.asset) }.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AssetLogo(l.position.asset)
                Column(Modifier.weight(1f)) {
                    Text(Catalog.asset(l.position.asset)?.name ?: l.position.asset, style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
                    Text(Fmt.masked(Fmt.qty(l.position.balance, l.position.asset), s.prefs.hideBalance), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(money(l.usd, s.prefs.currency, s.prefs.hideBalance), style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
                    Text(Fmt.pct(l.quote?.changePct), style = MaterialTheme.typography.bodySmall, color = if ((l.quote?.changePct ?: 0.0) >= 0) OmColors.Success else OmColors.Error)
                }
            }
        }
        item { SectionTitle(stringResource(R.string.home_recent), Modifier.padding(horizontal = 20.dp), stringResource(R.string.see_all), actions.activity) }
        if (!s.loading && s.recent.isEmpty()) item {
            EmptyState(stringResource(R.string.home_no_activity_t), stringResource(R.string.home_no_activity_b), Modifier.padding(horizontal = 16.dp))
        }
        items(s.recent, key = { "tx-" + it.id }) { t -> TxItem(t, s.prefs.hideBalance, onClick = { detail = t }, modifier = Modifier.padding(horizontal = 20.dp)) }
    }
    detail?.let { TxDetailSheet(it, s.prefs.hideBalance) { detail = null } }
}

/* USD / OMR selector: a two-segment switch; the active segment slides (spring), the other stays readable. */
@Composable
private fun CurrencyPill(cur: DisplayCurrency, onClick: () -> Unit) {
    val desc = stringResource(R.string.acc_currency)
    Row(
        Modifier.clip(RoundedCornerShape(50)).background(OmColors.Sky100).pressable(role = Role.Switch, onClick = onClick).padding(3.dp)
            .semantics { contentDescription = desc + " " + cur.name },
    ) {
        listOf(DisplayCurrency.USD, DisplayCurrency.OMR).forEach { c ->
            val on = c == cur
            Box(Modifier.clip(RoundedCornerShape(50)).background(if (on) OmColors.SurfaceBright else androidx.compose.ui.graphics.Color.Transparent).padding(horizontal = 10.dp, vertical = 4.dp)) {
                Text(c.name, style = MaterialTheme.typography.labelMedium, color = if (on) OmColors.Blue600 else OmColors.InkSecondary)
            }
        }
    }
}

@Composable
private fun EyePill(hidden: Boolean, description: String, onClick: () -> Unit) {
    Box(
        Modifier.size(32.dp).clip(RoundedCornerShape(50)).background(OmColors.Sky100).pressable(role = Role.Switch, onClick = onClick).semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) { OmIcon(if (hidden) OmIcons.EyeOff else OmIcons.Eye, null, tint = OmColors.Blue600, size = 18.dp) }
}

@Composable
private fun QuickAction(icon: Int, label: String, onClick: () -> Unit) {
    Column(Modifier.pressable(onClick = onClick).padding(4.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(Modifier.size(52.dp).clip(RoundedCornerShape(OmRadius.M)).background(OmColors.Sky100), contentAlignment = Alignment.Center) {
            OmIcon(icon, null, tint = OmColors.Blue600)
        }
        Text(label, style = MaterialTheme.typography.labelMedium, color = OmColors.Ink)
    }
}

/* Internal promotions only (1–3 cards), each leading to a real screen. No interstitial, no external advertising. */
@Composable
private fun Promotions(actions: HomeActions) {
    data class Promo(val t: Int, val b: Int, val cta: Int, val go: () -> Unit)
    val promos = listOf(
        Promo(R.string.promo_send_t, R.string.promo_send_b, R.string.promo_send_cta, actions.send),
        Promo(R.string.promo_markets_t, R.string.promo_markets_b, R.string.promo_markets_cta, actions.markets),
        Promo(R.string.promo_withdraw_t, R.string.promo_withdraw_b, R.string.promo_withdraw_cta, actions.withdraw),
    )
    LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        items(promos, key = { it.t }) { p ->
            GlassCard(Modifier.size(width = 260.dp, height = 150.dp).pressable(onClick = p.go), fill = false) {
                Text(stringResource(p.t), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink)
                Text(stringResource(p.b), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.weight(1f))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(stringResource(p.cta), style = MaterialTheme.typography.labelLarge, color = OmColors.Blue600)
                    OmIcon(OmIcons.Chevron, null, tint = OmColors.Blue600, size = 16.dp)          /* mirrors itself in Arabic */
                }
            }
        }
    }
}
