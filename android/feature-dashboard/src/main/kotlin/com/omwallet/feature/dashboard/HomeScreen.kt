package com.omwallet.feature.dashboard

import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.sp
import androidx.compose.ui.draw.drawBehind
import com.omwallet.core.ui.MiniSpark
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.offset
import com.omwallet.core.design.LogoMark

import androidx.compose.animation.core.animateFloat
import kotlinx.coroutines.delay
import com.omwallet.core.design.riseIn
import com.omwallet.core.design.GlassSquare
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
import com.omwallet.core.design.LiveText
import com.omwallet.core.design.OmPullRefresh
import com.omwallet.core.design.holdRefresh
import com.omwallet.core.design.SkeletonRows
import com.omwallet.core.design.SlidingSegments
import com.omwallet.core.design.rememberCountedValue
import com.omwallet.core.design.rememberLiveTick
import com.omwallet.core.design.shimmer
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
    /** pull to refresh: the account (balances, activity) AND the live prices are really read again */
    suspend fun reload() { g.auth.userId?.let { g.wallet.refresh(it) }; g.market.refreshNow() }
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
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    var refreshing by remember { mutableStateOf(false) }

    /* 14.7.0 — composition of the owner's reference image, with the real content: a blue-violet header with the balance, three round
       actions overlapping its edge, the biggest market moves, the favourites, then the recent activity. Every figure comes from the
       server (balances) or the live market (prices, 24 h changes); nothing is invented. */
    OmPullRefresh(refreshing, { scope.launch { refreshing = true; try { holdRefresh { vm.reload() } } finally { refreshing = false } } }) {
    LazyColumn(Modifier.fillMaxSize(), contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            /* 14.8.0 — Liv X / Binance: header buttons, a small-caps label, the big balance with light decimals, the 24 h change, then
               round dark actions with yellow icons; a soft yellow light sits behind the balance */
            Column(
                Modifier.fillMaxWidth()
                    .drawBehind {
                        drawRect(Brush.radialGradient(listOf(OmColors.Glow.copy(alpha = 0.26f), OmColors.Glow.copy(alpha = 0.07f), Color.Transparent),
                            center = androidx.compose.ui.geometry.Offset(size.width / 2f, -size.height * 0.08f), radius = size.width * 0.95f))
                    }
                    .statusBarsPadding().padding(start = 16.dp, end = 16.dp, top = 6.dp, bottom = 6.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    HeaderButton(OmIcons.Menu, stringResource(R.string.nav_account), Modifier.testTag("home_account"), actions.account)
                    Box(Modifier.weight(1f), contentAlignment = Alignment.Center) { LogoMark(size = 34.dp) }
                    HeaderButton(OmIcons.Activity, stringResource(R.string.nav_activity), Modifier.testTag("home_activity"), actions.activity)
                }
                Row(Modifier.padding(top = 18.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(stringResource(R.string.home_total).uppercase(), style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 1.4.sp), color = OmColors.InkSecondary)
                    val eyeDesc = stringResource(if (s.prefs.hideBalance) R.string.home_show else R.string.home_hide)
                    Box(
                        Modifier.size(32.dp).clip(RoundedCornerShape(50)).pressable(role = Role.Switch) { vm.toggleHidden() }
                            .semantics { contentDescription = eyeDesc },
                        contentAlignment = Alignment.Center,
                    ) { OmIcon(if (s.prefs.hideBalance) OmIcons.EyeOff else OmIcons.Eye, null, tint = OmColors.InkSecondary, size = 18.dp) }
                }
                if (s.loading) Box(Modifier.padding(vertical = 8.dp).width(180.dp).height(34.dp).clip(RoundedCornerShape(10.dp)).background(OmColors.Track).shimmer())
                else BalanceText(s.totalUsd, s.prefs.currency, s.prefs.hideBalance)
                Row(Modifier.padding(top = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    s.change24h?.let { c ->
                        val d = stringResource(R.string.home_change_24h)
                        val tick = rememberLiveTick(c, Fmt.pct(c))
                        LiveText(Fmt.pct(c), tick, style = MaterialTheme.typography.labelMedium, base = if (c >= 0) OmColors.Success else OmColors.Error,
                            modifier = Modifier.clip(RoundedCornerShape(50)).background(if (c >= 0) OmColors.ChipUp else OmColors.ChipDown)
                                .padding(horizontal = 10.dp, vertical = 3.dp).semantics { contentDescription = d + " " + Fmt.pct(c) })
                    }
                    CurrencyPill(s.prefs.currency) { haptics.tap(); vm.toggleCurrency() }
                }
                if (s.unpriced > 0) Text(stringResource(R.string.home_incomplete), style = MaterialTheme.typography.bodySmall, color = OmColors.Warning, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 6.dp))
                if (s.prefs.currency == DisplayCurrency.OMR) Text(stringResource(R.string.peg_note), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp))
                if (s.offline && s.syncedAt > 0) Text(stringResource(R.string.offline_since, relative(s.syncedAt)), style = MaterialTheme.typography.bodySmall, color = OmColors.Warning, modifier = Modifier.padding(top = 4.dp))
                /* three round actions (Liv X: Top up / Send / Request) */
                Row(Modifier.fillMaxWidth().padding(top = 18.dp, start = 24.dp, end = 24.dp).riseIn(1), horizontalArrangement = Arrangement.SpaceEvenly) {
                    ActionTile(OmIcons.Deposit, stringResource(R.string.action_deposit), Modifier.weight(1f), onClick = actions.deposit)
                    ActionTile(OmIcons.Withdraw, stringResource(R.string.action_withdraw), Modifier.weight(1f), onClick = actions.withdraw)
                    ActionTile(OmIcons.Send, stringResource(R.string.action_send), Modifier.weight(1f), onClick = actions.send)
                }
            }
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
    }
    detail?.let { TxDetailSheet(it, s.prefs.hideBalance) { detail = null } }
}

/* The balance (15.1.0): it counts up from zero when it first appears (and each time the eye is opened), rolls to every new value instead of jumping,
   and flashes green / red for the direction of a live move. Only this Text is recomposed while it counts. TalkBack reads the final figure. */
@Composable
private fun BalanceText(totalUsd: Double?, cur: DisplayCurrency, hidden: Boolean) {
    val shown = rememberCountedValue(totalUsd, resetKey = cur, restartKey = hidden)
    val final = money(totalUsd, cur, hidden)
    val tick = rememberLiveTick(totalUsd, final)
    LiveText(lightDecimals(money(shown, cur, hidden)), tick, style = MaterialTheme.typography.displayLarge, modifier = Modifier.padding(top = 2.dp).semantics { contentDescription = final })
}

/* The balance with its decimals in a lighter weight (Liv X / Binance); the characters are exactly those of the figure. */
private fun lightDecimals(v: String): androidx.compose.ui.text.AnnotatedString {
    val i = v.lastIndexOf('.')
    if (i < 0 || i == v.length - 1 || v.substring(i + 1).any { !it.isDigit() }) return androidx.compose.ui.text.AnnotatedString(v)
    return androidx.compose.ui.text.buildAnnotatedString {
        append(v.substring(0, i))
        pushStyle(androidx.compose.ui.text.SpanStyle(fontWeight = androidx.compose.ui.text.font.FontWeight.Normal, color = OmColors.InkSecondary))
        append(v.substring(i)); pop()
    }
}

/* Round header button: dark grey circle, light line icon. */
@Composable
private fun HeaderButton(icon: Int, description: String, modifier: Modifier, onClick: () -> Unit) {
    Box(
        modifier.size(44.dp).clip(RoundedCornerShape(50)).background(OmColors.Track).pressable(onClick = onClick).semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) { OmIcon(icon, null, tint = OmColors.Ink, size = 22.dp) }
}

/* Market mover card (reference image): logo and name, symbol and live price, the 24 h change in large type, the real 24 h curve. */
@Composable
private fun MoverCard(q: Quote, hidden: Boolean, onClick: () -> Unit) {
    val up = (q.changePct ?: 0.0) >= 0
    Column(
        Modifier.width(168.dp).clip(RoundedCornerShape(18.dp)).background(OmColors.Card).border(1.dp, OmColors.Edge, RoundedCornerShape(18.dp))
            .pressable(onClick = onClick).padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AssetLogo(q.sym, 30.dp)
            Text(Catalog.asset(q.sym)?.name ?: q.sym, style = MaterialTheme.typography.titleSmall, color = OmColors.Ink, maxLines = 1)
        }
        val priceTick = rememberLiveTick(q.price, Fmt.money(q.price))
        val pctTick = rememberLiveTick(q.changePct, Fmt.pct(q.changePct))
        LiveText(q.sym + "  " + Fmt.money(q.price), priceTick, style = MaterialTheme.typography.bodySmall, base = OmColors.InkSecondary)
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            LiveText(Fmt.pct(q.changePct), pctTick, style = MaterialTheme.typography.titleLarge, base = if (up) OmColors.Success else OmColors.Error, modifier = Modifier.weight(1f))
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
            LiveText(Fmt.pct(q.changePct) + " (24 h)", rememberLiveTick(q.changePct, Fmt.pct(q.changePct)), style = MaterialTheme.typography.bodySmall, base = if (up) OmColors.Success else OmColors.Error)
        }
        MiniSpark(q.sym, up)
        LiveText(Fmt.money(q.price), rememberLiveTick(q.price, Fmt.money(q.price)), style = MaterialTheme.typography.titleSmall, textAlign = TextAlign.End, modifier = Modifier.width(96.dp))
    }
}


/* USD / OMR selector: a two-option switch; the yellow pill glides (spring) to the active option. Any tap toggles, as before. */
@Composable
private fun CurrencyPill(cur: DisplayCurrency, onClick: () -> Unit) {
    val desc = stringResource(R.string.acc_currency)
    SlidingSegments(
        listOf(DisplayCurrency.USD.name, DisplayCurrency.OMR.name), if (cur == DisplayCurrency.USD) 0 else 1, { onClick() },
        Modifier.semantics { contentDescription = desc + " " + cur.name }, pill = Brush.verticalGradient(listOf(OmColors.Blue600, OmColors.Blue600)),
        style = MaterialTheme.typography.labelMedium, hPad = 10.dp, vPad = 4.dp,
    )
}
