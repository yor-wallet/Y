package com.omwallet.feature.dashboard

import androidx.compose.ui.platform.testTag
import com.omwallet.core.ui.MiniSpark
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.offset
import com.omwallet.core.design.LogoMark

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
    /* 14.7.0 (owner's reference image): biggest 24 h moves of the market, the person's favourites, and the 24 h change of the holdings */
    val movers: List<Quote> = emptyList(), val watch: List<Quote> = emptyList(), val change24h: Double? = null,
)

/* 24 h change of the crypto holdings, from the live prices and each asset's own 24 h change (Binance). Null when nothing is priced. */
fun change24h(lines: List<Line>): Double? {
    val priced = lines.filter { it.position.balance > 0 && it.usd != null && it.quote?.changePct != null }
    if (priced.isEmpty()) return null
    val now = priced.sumOf { it.usd!! }
    val before = priced.sumOf { it.usd!! / (1 + it.quote!!.changePct!! / 100) }
    return if (before > 0) (now - before) / before * 100 else null
}

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
            movers = m.quotes.values.filter { it.changePct != null && !it.derived && it.sym != "USDT" && it.sym != "USDC" }
                .sortedByDescending { kotlin.math.abs(it.changePct!!) }.take(6),
            watch = p.favorites.mapNotNull { m.quotes[it] }, change24h = change24h(lines),
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

    /* 14.7.0 — composition of the owner's reference image, with the real content: a blue-violet header with the balance, three round
       actions overlapping its edge, the biggest market moves, the favourites, then the recent activity. Every figure comes from the
       server (balances) or the live market (prices, 24 h changes); nothing is invented. */
    LazyColumn(Modifier.fillMaxSize(), contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Box(Modifier.fillMaxWidth()) {
                Column(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(bottomStart = 30.dp, bottomEnd = 30.dp))
                        .background(Brush.verticalGradient(listOf(Color(0xFF6A6DF8), OmColors.Header)))
                        .statusBarsPadding().padding(start = 16.dp, end = 16.dp, top = 6.dp, bottom = 62.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        HeaderButton(OmIcons.Menu, stringResource(R.string.nav_account), Modifier.testTag("home_account"), actions.account)
                        Box(Modifier.weight(1f), contentAlignment = Alignment.Center) { LogoMark(size = 34.dp) }
                        HeaderButton(OmIcons.Activity, stringResource(R.string.nav_activity), Modifier.testTag("home_activity"), actions.activity)
                    }
                    Row(Modifier.padding(top = 14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(stringResource(R.string.home_total), style = MaterialTheme.typography.titleSmall, color = OmColors.OnHeader.copy(alpha = 0.82f))
                        val eyeDesc = stringResource(if (s.prefs.hideBalance) R.string.home_show else R.string.home_hide)
                        Box(
                            Modifier.size(32.dp).clip(RoundedCornerShape(50)).pressable(role = Role.Switch) { vm.toggleHidden() }
                                .semantics { contentDescription = eyeDesc },
                            contentAlignment = Alignment.Center,
                        ) { OmIcon(if (s.prefs.hideBalance) OmIcons.EyeOff else OmIcons.Eye, null, tint = OmColors.OnHeader, size = 18.dp) }
                    }
                    if (s.loading) Box(Modifier.padding(vertical = 8.dp).width(180.dp).height(34.dp).clip(RoundedCornerShape(10.dp)).background(Color(0x33FFFFFF)))
                    else AnimatedContent(money(s.totalUsd, s.prefs.currency, s.prefs.hideBalance), transitionSpec = { fadeIn() togetherWith fadeOut() }, label = "total") { v ->
                        Text(v, style = MaterialTheme.typography.displaySmall, color = OmColors.OnHeader, maxLines = 1, modifier = Modifier.padding(top = 2.dp).semantics { contentDescription = v })
                    }
                    Row(Modifier.padding(top = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        s.change24h?.let { c ->
                            val d = stringResource(R.string.home_change_24h)
                            Text(Fmt.pct(c), style = MaterialTheme.typography.labelMedium, color = Color.White,
                                modifier = Modifier.clip(RoundedCornerShape(50)).background(if (c >= 0) Color(0xFF2BC48A) else Color(0xFFEF5A6B))
                                    .padding(horizontal = 10.dp, vertical = 3.dp).semantics { contentDescription = d + " " + Fmt.pct(c) })
                        }
                        CurrencyPill(s.prefs.currency) { haptics.tap(); vm.toggleCurrency() }
                    }
                    if (s.unpriced > 0) Text(stringResource(R.string.home_incomplete), style = MaterialTheme.typography.bodySmall, color = Color(0xFFFFE2A8), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 6.dp))
                    if (s.prefs.currency == DisplayCurrency.OMR) Text(stringResource(R.string.peg_note), style = MaterialTheme.typography.bodySmall, color = OmColors.OnHeader.copy(alpha = 0.8f), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp))
                    if (s.offline && s.syncedAt > 0) Text(stringResource(R.string.offline_since, relative(s.syncedAt)), style = MaterialTheme.typography.bodySmall, color = Color(0xFFFFE2A8), modifier = Modifier.padding(top = 4.dp))
                }
                /* three round actions overlapping the bottom edge of the header (reference image) */
                Row(
                    Modifier.align(Alignment.BottomCenter).offset(y = 46.dp).fillMaxWidth().padding(horizontal = 36.dp).riseIn(1),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    ActionTile(OmIcons.Deposit, stringResource(R.string.action_deposit), Modifier.weight(1f), onClick = actions.deposit)
                    ActionTile(OmIcons.Withdraw, stringResource(R.string.action_withdraw), Modifier.weight(1f), onClick = actions.withdraw)
                    ActionTile(OmIcons.Send, stringResource(R.string.action_send), Modifier.weight(1f), onClick = actions.send)
                }
            }
            Spacer(Modifier.height(50.dp))
        }
        /* biggest moves of the last 24 h (live market) */
        item {
            Column(Modifier.riseIn(2)) {
                SectionTitle(stringResource(R.string.home_movers), Modifier.padding(horizontal = 12.dp), stringResource(R.string.see_all), actions.markets)
                Box(Modifier.padding(horizontal = 16.dp)) { FeedBadge(s.feed, s.lastSync) }
                if (s.movers.isEmpty()) SkeletonRows(1, Modifier.padding(horizontal = 16.dp, vertical = 8.dp))
                else LazyRow(contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(s.movers, key = { it.sym }) { q -> MoverCard(q, s.prefs.hideBalance) { actions.asset(q.sym) } }
                }
            }
        }
        /* the person's favourites (the stars of the Markets page) */
        item {
            Column(Modifier.padding(horizontal = 16.dp).riseIn(3)) {
                SectionTitle(stringResource(R.string.home_watchlist), Modifier, stringResource(R.string.see_all), actions.markets)
                if (s.watch.isEmpty()) Text(stringResource(R.string.markets_fav_empty_b), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.padding(4.dp))
                s.watch.forEach { q -> QuoteRow(q) { actions.asset(q.sym) } }
            }
        }
        item {
            Column(Modifier.padding(horizontal = 16.dp).riseIn(4)) {
                SectionTitle(stringResource(R.string.home_recent), Modifier, stringResource(R.string.see_all), actions.activity)
                if (!s.loading && s.recent.isEmpty()) EmptyState(stringResource(R.string.home_no_activity_t), stringResource(R.string.home_no_activity_b), Modifier)
                s.recent.forEach { t -> TxItem(t, s.prefs.hideBalance, onClick = { detail = t }) }
            }
        }
        if (s.omrAvailable != null) item {
            GlassCard(Modifier.padding(horizontal = 16.dp), rise = 5) {
                Text(stringResource(R.string.home_omr), style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
                Text(com.omwallet.core.data.Fmt.masked(String.format(java.util.Locale.US, "%,.3f OMR", s.omrAvailable), s.prefs.hideBalance), style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink)
                if (s.omrReserved > 0) Text(stringResource(R.string.home_reserved, com.omwallet.core.ui.ltr(Fmt.masked(String.format(java.util.Locale.US, "%,.3f OMR", s.omrReserved), s.prefs.hideBalance))), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
            }
        }
    }
    detail?.let { TxDetailSheet(it, s.prefs.hideBalance) { detail = null } }
}

/* Round header button on the blue-violet header: translucent white circle, white line icon. */
@Composable
private fun HeaderButton(icon: Int, description: String, modifier: Modifier, onClick: () -> Unit) {
    Box(
        modifier.size(44.dp).clip(RoundedCornerShape(50)).background(Color(0x2EFFFFFF)).pressable(onClick = onClick).semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) { OmIcon(icon, null, tint = OmColors.OnHeader, size = 22.dp) }
}

/* Market mover card (reference image): logo and name, symbol and live price, the 24 h change in large type, the real 24 h curve. */
@Composable
private fun MoverCard(q: Quote, hidden: Boolean, onClick: () -> Unit) {
    val up = (q.changePct ?: 0.0) >= 0
    Column(
        Modifier.width(168.dp).clip(RoundedCornerShape(18.dp)).background(Color.White).border(1.dp, OmColors.Edge, RoundedCornerShape(18.dp))
            .pressable(onClick = onClick).padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AssetLogo(q.sym, 30.dp)
            Text(Catalog.asset(q.sym)?.name ?: q.sym, style = MaterialTheme.typography.titleSmall, color = OmColors.Ink, maxLines = 1)
        }
        Text(q.sym + "  " + Fmt.money(q.price), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, maxLines = 1)
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(Fmt.pct(q.changePct), style = MaterialTheme.typography.titleLarge, color = if (up) OmColors.Success else OmColors.Error, modifier = Modifier.weight(1f), maxLines = 1)
            MiniSpark(q.sym, up)
        }
    }
}

/* Favourite row (reference image « My Assets » / « Watchlist »): logo, name, 24 h change, the real 24 h curve, live price. */
@Composable
fun QuoteRow(q: Quote, onClick: () -> Unit) {
    val up = (q.changePct ?: 0.0) >= 0
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).pressable(onClick = onClick).padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        AssetLogo(q.sym, 42.dp)
        Column(Modifier.weight(1f)) {
            Text(Catalog.asset(q.sym)?.name ?: q.sym, style = MaterialTheme.typography.titleSmall, color = OmColors.Ink, maxLines = 1)
            Text(Fmt.pct(q.changePct) + " (24 h)", style = MaterialTheme.typography.bodySmall, color = if (up) OmColors.Success else OmColors.Error)
        }
        MiniSpark(q.sym, up)
        Text(Fmt.money(q.price), style = MaterialTheme.typography.titleSmall, color = OmColors.Ink, textAlign = TextAlign.End, modifier = Modifier.width(96.dp))
    }
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


