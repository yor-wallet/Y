package com.omwallet.feature.dashboard

import androidx.compose.ui.platform.testTag

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.animateFloat
import kotlinx.coroutines.delay
import com.omwallet.core.design.riseIn
import com.omwallet.core.design.GlassSquare
import com.omwallet.core.design.GlassEmblem
import com.omwallet.core.design.BrandLockup
import com.omwallet.core.design.ActionTile
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.Image
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
                       val asset: (String) -> Unit, val activity: () -> Unit, val account: () -> Unit = {})

@Composable
fun HomeScreen(actions: HomeActions, contentPadding: PaddingValues) {
    val vm = omViewModel { HomeViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    LaunchedEffect(Unit) { vm.refresh() }
    var detail by remember { mutableStateOf<Tx?>(null) }
    val haptics = rememberOmHaptics()

    /* composition of the owner's home reference, with the real crypto content: logo header, greeting, Omani coast, balance card with the
       glass emblem, four action tiles (the first one filled), shortcut banners, then holdings and recent activity in glass cards */
    LazyColumn(Modifier.fillMaxSize(), contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Column(Modifier.statusBarsPadding().padding(horizontal = 16.dp, vertical = 6.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    /* 14.5: Activity left the main menu (now Home · Markets · Spot · Swap · Assets): it sits here, one tap away */
                    GlassSquare(OmIcons.Activity, stringResource(R.string.nav_activity), round = true, onClick = actions.activity, modifier = Modifier.testTag("home_activity"))
                    Box(Modifier.weight(1f), contentAlignment = Alignment.Center) { BrandLockup(height = 40.dp) }
                    GlassSquare(OmIcons.User, stringResource(R.string.nav_account), round = true, onClick = actions.account, modifier = Modifier.testTag("home_account"))
                }
                Text(if (s.name.isBlank()) stringResource(R.string.app_name) else stringResource(R.string.home_hello, s.name), style = MaterialTheme.typography.headlineMedium, color = OmColors.Ink,
                    textAlign = TextAlign.Center, modifier = Modifier.padding(top = 10.dp).riseIn(0))
                FeedBadge(s.feed, s.lastSync)
            }
        }
        item {
            Box {
                GlassWaves(Modifier.fillMaxWidth().height(110.dp))
                GlassCard(Modifier.padding(start = 16.dp, end = 16.dp, top = 70.dp), strong = true, padding = 20.dp, rise = 1) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(stringResource(R.string.home_total), style = MaterialTheme.typography.titleMedium, color = OmColors.InkSecondary)
                                EyePill(s.prefs.hideBalance, stringResource(if (s.prefs.hideBalance) R.string.home_show else R.string.home_hide)) { vm.toggleHidden() }
                            }
                            if (s.loading) SkeletonRows(1)
                            else AnimatedContent(money(s.totalUsd, s.prefs.currency, s.prefs.hideBalance), transitionSpec = { fadeIn() togetherWith fadeOut() }, label = "total") { v ->
                                Text(v, style = MaterialTheme.typography.displaySmall, color = OmColors.Ink, maxLines = 1, modifier = Modifier.semantics { contentDescription = v })
                            }
                            CurrencyPill(s.prefs.currency) { haptics.tap(); vm.toggleCurrency() }
                        }
                        GlassEmblem(size = 86.dp)
                    }
                    if (s.unpriced > 0) Text(stringResource(R.string.home_incomplete), style = MaterialTheme.typography.bodySmall, color = OmColors.Warning)
                    if (s.prefs.currency == DisplayCurrency.OMR) Text(stringResource(R.string.peg_note), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                    if (s.offline && s.syncedAt > 0) Text(stringResource(R.string.offline_since, relative(s.syncedAt)), style = MaterialTheme.typography.bodySmall, color = OmColors.Warning)
                }
            }
        }
        item {
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp).riseIn(2), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ActionTile(OmIcons.Deposit, stringResource(R.string.action_deposit), Modifier.weight(1f), primary = true, onClick = actions.deposit)
                ActionTile(OmIcons.Withdraw, stringResource(R.string.action_withdraw), Modifier.weight(1f), onClick = actions.withdraw)
                ActionTile(OmIcons.Coin, stringResource(R.string.action_crypto), Modifier.weight(1f), onClick = actions.crypto)
                ActionTile(OmIcons.Chart, stringResource(R.string.action_markets), Modifier.weight(1f), onClick = actions.markets)
            }
        }
        if (s.omrAvailable != null) item {
            GlassCard(Modifier.padding(horizontal = 16.dp), rise = 3) {
                Text(stringResource(R.string.home_omr), style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
                Text(com.omwallet.core.data.Fmt.masked(String.format(java.util.Locale.US, "%,.3f OMR", s.omrAvailable), s.prefs.hideBalance), style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink)
                if (s.omrReserved > 0) Text(stringResource(R.string.home_reserved, com.omwallet.core.ui.ltr(Fmt.masked(String.format(java.util.Locale.US, "%,.3f OMR", s.omrReserved), s.prefs.hideBalance))), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
            }
        }
        item { Promotions(actions) }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), rise = 4) {
                SectionTitle(stringResource(R.string.home_recent), Modifier, stringResource(R.string.see_all), actions.activity)
                if (!s.loading && s.recent.isEmpty()) EmptyState(stringResource(R.string.home_no_activity_t), stringResource(R.string.home_no_activity_b), Modifier)
                s.recent.forEach { t -> TxItem(t, s.prefs.hideBalance, onClick = { detail = t }) }
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), rise = 5) {
                SectionTitle(stringResource(R.string.home_holdings), Modifier, stringResource(R.string.see_all), actions.crypto)
                if (!s.loading && s.lines.none { it.position.balance > 0 }) EmptyState(stringResource(R.string.home_no_holdings_t), stringResource(R.string.home_no_holdings_b), Modifier, stringResource(R.string.action_deposit), actions.deposit)
                s.lines.filter { it.position.balance > 0 }.take(5).forEach { l ->
                    Row(Modifier.fillMaxWidth().pressable { actions.asset(l.position.asset) }.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
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
            }
        }
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

/* Shortcut banners (home reference): one glass banner at a time, swipe or wait; each opens a real screen. Dots below.
   Auto-advance only when motion is not reduced. */
@Composable
private fun Promotions(actions: HomeActions) {
    data class Promo(val t: Int, val b: Int, val go: () -> Unit)
    val promos = listOf(
        Promo(R.string.promo_send_t, R.string.promo_send_b, actions.send),
        Promo(R.string.promo_markets_t, R.string.promo_markets_b, actions.markets),
        Promo(R.string.promo_withdraw_t, R.string.promo_withdraw_b, actions.withdraw),
    )
    val pager = rememberPagerState { promos.size }
    val reduced = com.omwallet.core.design.LocalOmMotion.current.reduced
    if (!reduced) LaunchedEffect(pager) { while (true) { delay(5200); pager.animateScrollToPage((pager.currentPage + 1) % promos.size) } }
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        HorizontalPager(pager, contentPadding = PaddingValues(horizontal = 16.dp), pageSpacing = 12.dp) { k ->
            val p = promos[k]
            GlassCard(Modifier.pressable(onClick = p.go), padding = 16.dp) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    GlassEmblem(size = 64.dp)
                    Column(Modifier.weight(1f)) {
                        Text(stringResource(p.t), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink)
                        Text(stringResource(p.b), style = MaterialTheme.typography.bodySmall, color = OmColors.Blue600, maxLines = 2)
                    }
                    OmIcon(OmIcons.Chevron, null, tint = OmColors.Blue600, size = 18.dp)          /* mirrors itself in Arabic */
                }
            }
        }
        Row(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            promos.indices.forEach { j ->
                val on = j == pager.currentPage
                Box(Modifier.height(8.dp).width(if (on) 22.dp else 8.dp).clip(RoundedCornerShape(5.dp)).background(if (on) OmColors.Blue600 else Color(0x52FFFFFF)))
            }
        }
    }
}

/* Original glass decoration behind the balance card (drawn, no photo): two translucent waves, a bright rim and a soft glint that drift
   slowly; still under « remove animations ». */
@Composable
private fun GlassWaves(modifier: Modifier) {
    val reduced = com.omwallet.core.design.LocalOmMotion.current.reduced
    val drift = if (reduced) 0f else {
        val t = androidx.compose.animation.core.rememberInfiniteTransition(label = "waves")
        val v by t.animateFloat(-1f, 1f, androidx.compose.animation.core.infiniteRepeatable(androidx.compose.animation.core.tween(9000), androidx.compose.animation.core.RepeatMode.Reverse), label = "drift"); v
    }
    androidx.compose.foundation.Canvas(modifier) {
        val w = size.width; val h = size.height; val dx = drift * 10.dp.toPx()
        fun wave(y0: Float, amp: Float, shift: Float) = androidx.compose.ui.graphics.Path().apply {
            moveTo(-40f + shift, h * y0)
            cubicTo(w * 0.18f + shift, h * (y0 - amp), w * 0.4f + shift, h * (y0 + amp), w * 0.62f + shift, h * y0)
            cubicTo(w * 0.8f + shift, h * (y0 - amp), w * 0.95f + shift, h * (y0 - amp * 0.4f), w + 40f + shift, h * (y0 - amp * 0.2f))
        }
        val a = wave(0.65f, 0.38f, dx)
        val fillA = androidx.compose.ui.graphics.Path().apply { addPath(a); lineTo(w + 40f, h); lineTo(-40f, h); close() }
        drawPath(fillA, Brush.horizontalGradient(listOf(Color(0x1ABFE3FF), Color(0xB38FD0FF), Color(0x664FA8FF))))
        val b = wave(0.78f, 0.3f, -dx)
        val fillB = androidx.compose.ui.graphics.Path().apply { addPath(b); lineTo(w + 40f, h); lineTo(-40f, h); close() }
        drawPath(fillB, Brush.verticalGradient(listOf(Color(0xB3FFFFFF), Color(0x00FFFFFF))))
        drawPath(a, Color(0xF2FFFFFF), style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.6.dp.toPx()))
        drawCircle(Brush.radialGradient(listOf(Color(0x99FFFFFF), Color.Transparent), center = androidx.compose.ui.geometry.Offset(w * 0.8f - dx, h * 0.33f), radius = h * 0.3f),
            radius = h * 0.3f, center = androidx.compose.ui.geometry.Offset(w * 0.8f - dx, h * 0.33f))
    }
}
