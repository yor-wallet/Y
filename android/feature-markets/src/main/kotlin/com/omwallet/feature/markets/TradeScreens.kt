package com.omwallet.feature.markets

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.omwallet.core.data.FeedMode
import com.omwallet.core.data.Fmt
import com.omwallet.core.data.MoneyRepository
import com.omwallet.core.data.OmGraph
import com.omwallet.core.design.AssetLogo
import com.omwallet.core.design.ChipTone
import com.omwallet.core.design.GlassCard
import com.omwallet.core.design.LocalOmMotion
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmIcons
import com.omwallet.core.design.OmPrimaryButton
import com.omwallet.core.design.OmSecondaryButton
import com.omwallet.core.design.OmSheet
import com.omwallet.core.design.OmSprings
import com.omwallet.core.design.RefHeader
import com.omwallet.core.design.StatusChip
import com.omwallet.core.design.StatusSteps
import com.omwallet.core.design.StepState
import com.omwallet.core.design.pressable
import com.omwallet.core.design.rememberOmHaptics
import com.omwallet.core.network.ApiException
import com.omwallet.core.network.Book
import com.omwallet.core.network.MarketTrade
import com.omwallet.core.network.Ohlc
import com.omwallet.core.network.PairEvent
import com.omwallet.core.ui.FeedBadge
import com.omwallet.core.ui.PinSheet
import com.omwallet.core.ui.R
import com.omwallet.core.ui.errorText
import com.omwallet.core.ui.omGraph
import com.omwallet.core.ui.omViewModel
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.Locale

/* ============================================================
   OM Wallet 14.5 — SPOT · SWAP (Android)
   Live market: Binance public stream for the selected pair (order book, market trades, current candle) with its state always shown.
   REAL execution, same rules as every money movement: the server fixes the price (crypto-swap, 30 s), swap_execute (PIN) holds the amount
   paid and records the operation IN PROGRESS; only the administrator's confirmation credits the crypto bought. Spot = market order
   against USDT; limit orders are not offered (no button that would not really execute).
   ============================================================ */
object Trade {
    val SUP = listOf("BTC", "ETH", "USDT", "USDC", "BNB", "SOL", "XRP", "LTC")
    val PAIRS = listOf("BTC", "ETH", "BNB", "SOL", "XRP", "LTC", "USDC")
    val SRV_NETS = mapOf("BTC" to listOf("bitcoin"), "ETH" to listOf("ethereum"), "USDT" to listOf("tron", "ethereum", "bsc", "polygon"),
        "USDC" to listOf("ethereum", "bsc", "polygon", "solana"), "BNB" to listOf("bsc"), "SOL" to listOf("solana"), "XRP" to listOf("xrp"), "LTC" to listOf("litecoin"))
    val DEF_NET = mapOf("BTC" to "bitcoin", "ETH" to "ethereum", "USDT" to "tron", "USDC" to "ethereum", "BNB" to "bsc", "SOL" to "solana", "XRP" to "xrp", "LTC" to "litecoin")
    val TFS = linkedMapOf("15m" to "15m", "1H" to "1h", "4H" to "4h", "1D" to "1d")
    /* the live market reaches the screen at most every FEED_MS (same rhythm as the web app) */
    const val FEED_MS = 200L
    fun price(v: Double?): String = if (v == null || v <= 0) "—" else {
        val dp = when { v >= 1000 -> 2; v >= 10 -> 3; v >= 1 -> 4; v >= 0.01 -> 5; else -> 8 }
        String.format(Locale.US, "%,.${dp}f", v)
    }
    fun qty(v: Double): String = String.format(Locale.US, if (v >= 1000) "%,.2f" else if (v >= 1) "%.4f" else "%.6f", v).trimEnd('0').trimEnd('.')
    fun cut8(v: Double): BigDecimal = BigDecimal.valueOf(v).setScale(8, RoundingMode.DOWN).stripTrailingZeros()
    /* « 1 BTC = 96,972 USDT » rather than « 1 USDT = 0.00001 BTC » */
    fun rate(fa: String, ta: String, p: Double, approx: Boolean): String = if (p <= 0) "—" else if (p >= 1) "1 $fa ${if (approx) "≈" else "="} ${price(p)} $ta" else "1 $ta ${if (approx) "≈" else "="} ${price(1 / p)} $fa"
}

/* ---------- shared state: balances, quote, result ---------- */
data class Leg(val asset: String, val network: String, val available: Double)
sealed interface TradeStep {
    data object Form : TradeStep
    data class Review(val q: MoneyRepository.SwapQuote) : TradeStep
    data object Submitting : TradeStep
    data class Done(val id: String?, val reference: String?, val q: MoneyRepository.SwapQuote) : TradeStep
    data class Failed(val code: String, val uncertain: Boolean) : TradeStep
}

class TradeViewModel(private val g: OmGraph) : ViewModel() {
    val step = MutableStateFlow<TradeStep>(TradeStep.Form)
    val busy = MutableStateFlow(false)
    val error = MutableStateFlow<String?>(null)
    private var key: String? = null

    private fun wallets(): List<com.omwallet.core.data.Holding> = g.wallet.state.value.positions.flatMap { it.networks }
        .filter { h -> h.network != null && Trade.SRV_NETS[h.asset.uppercase()]?.contains(h.network) == true }
    fun from(sym: String): Leg { val l = wallets().filter { it.asset.equals(sym, true) }.maxByOrNull { it.available }; return Leg(sym, l?.network ?: Trade.DEF_NET[sym]!!, l?.available ?: 0.0) }
    fun to(sym: String): Leg { val l = wallets().filter { it.asset.equals(sym, true) }.maxByOrNull { it.balance }; return Leg(sym, l?.network ?: Trade.DEF_NET[sym]!!, l?.available ?: 0.0) }
    fun px(sym: String): Double? = if (sym == "USDT") 1.0 else g.market.state.value.quotes[sym]?.price

    fun quote(f: Leg, t: Leg, amount: Double, side: String?) {
        if (busy.value) return
        if (!(amount > 0)) { error.value = "invalid_amount"; return }
        if (amount > f.available + 1e-12) { error.value = "insufficient_balance"; return }
        busy.value = true; error.value = null
        viewModelScope.launch {
            try { val q = g.money.swapQuote(f.asset, f.network, t.asset, t.network, Trade.cut8(amount), side); key = g.money.newIdempotencyKey(); step.value = TradeStep.Review(q) }
            catch (e: ApiException) { error.value = if (e.code == "network") "price_unavailable" else e.code }
            finally { busy.value = false }
        }
    }
    fun execute(q: MoneyRepository.SwapQuote, grant: String) {
        if (System.currentTimeMillis() >= q.expiresAt) { error.value = "quote_expired"; return }
        step.value = TradeStep.Submitting
        viewModelScope.launch {
            try {
                val r = g.money.swapExecute(q.id, key ?: g.money.newIdempotencyKey(), grant)
                step.value = TradeStep.Done(r.id, r.reference, q)
                g.auth.state.value.let { s -> if (s is com.omwallet.core.data.AuthState.SignedIn) runCatching { g.wallet.refresh(s.profile.uid) } }
            } catch (e: ApiException) { step.value = TradeStep.Failed(if (e.uncertain) "network" else e.code, e.uncertain) }
        }
    }
    fun reset() { step.value = TradeStep.Form; error.value = null; key = null }
    /* the real status of the recorded operation (refreshed from the server); a normal user sees « En cours » until it is decided */
    fun status(id: String?): String = g.wallet.state.value.transactions.firstOrNull { it.id == id }?.status ?: "PENDING"
    fun refresh() = viewModelScope.launch { g.auth.state.value.let { s -> if (s is com.omwallet.core.data.AuthState.SignedIn) runCatching { g.wallet.refresh(s.profile.uid) } } }
}

/* ---------- Spot live market ---------- */
data class SpotState(val base: String = "BTC", val tf: String = "1H", val candles: List<Ohlc> = emptyList(), val book: Book = Book(emptyList(), emptyList()),
                     val trades: List<MarketTrade> = emptyList(), val last: Double? = null, val dir: Int = 0, val mode: FeedMode = FeedMode.Idle, val at: Long = 0)

class SpotViewModel(private val g: OmGraph) : ViewModel() {
    private val _s = MutableStateFlow(SpotState())
    val state: StateFlow<SpotState> = _s.asStateFlow()
    private var job: Job? = null
    /* 14.5.1 — the feed runs only while the Spot screen is on screen (lifecycle STARTED): nothing is downloaded and no battery is
       spent in the background or on another tab. Paused, the figures stay, shown as « updated at … ». */
    private var active = false
    fun active(on: Boolean) {
        if (on == active) return
        active = on
        if (on) open() else {
            job?.cancel(); job = null
            _s.update { if (it.mode == FeedMode.Live) it.copy(mode = if (it.at > 0) FeedMode.Polling else FeedMode.Offline) else it }
        }
    }
    fun pair(base: String) { if (base != _s.value.base) { _s.value = SpotState(base = base, tf = _s.value.tf); if (active) open() } }
    fun tf(tf: String) { if (tf != _s.value.tf) { _s.update { it.copy(tf = tf, candles = emptyList()) }; if (active) open() } }
    private fun withLast(s: SpotState, p: Double) = s.copy(last = p, dir = s.last?.let { l -> if (p > l) 1 else if (p < l) -1 else s.dir } ?: 0)
    private fun sane(c: Ohlc) = c.copy(open = if (c.open > 0) c.open else c.close, high = maxOf(c.high, c.open, c.close), low = listOf(c.low, c.open, c.close).filter { it > 0 }.minOrNull() ?: c.close)
    private fun applyEvent(s: SpotState, ev: PairEvent): SpotState = when (ev) {
        is PairEvent.BookEv -> s.copy(book = ev.book)
        is PairEvent.TradeEv -> withLast(s.copy(trades = (listOf(ev.trade) + s.trades).take(16)), ev.trade.price)
        is PairEvent.CandleEv -> {
            val k = sane(ev.candle); val l = s.candles.lastOrNull()
            withLast(s.copy(candles = if (l != null && l.time == k.time) s.candles.dropLast(1) + k else (s.candles + k).takeLast(64)), k.close)
        }
    }
    private fun open() {
        job?.cancel()
        val st = _s.value; val pair = st.base + "USDT"; val iv = Trade.TFS[st.tf] ?: "1h"
        job = viewModelScope.launch {
            var retry = 0
            while (true) {
                try {
                    val c = g.marketApi.ohlc(pair, iv, 64).map(::sane); val b = g.marketApi.depth(pair, 10); val t = g.marketApi.trades(pair, 16)
                    _s.update { it.copy(candles = c, book = b, trades = t, last = c.lastOrNull()?.close ?: it.last, mode = if (it.mode == FeedMode.Live) FeedMode.Live else FeedMode.Polling, at = System.currentTimeMillis()) }
                } catch (e: CancellationException) { throw e } catch (e: Exception) { _s.update { it.copy(mode = FeedMode.Offline) } }
                try {
                    /* every message is applied at once to a working copy; the screen receives it at most every FEED_MS
                       (a busy market sends dozens of messages a second: one recomposition per message is wasted work) */
                    coroutineScope {
                        var buf = _s.value; var dirty = false
                        val tick = launch { while (true) { delay(Trade.FEED_MS); if (dirty) { _s.value = buf; dirty = false } } }
                        try {
                            g.marketApi.pairStream(pair, iv).collect { ev ->
                                val first = buf.mode != FeedMode.Live
                                buf = applyEvent(buf, ev).copy(mode = FeedMode.Live, at = System.currentTimeMillis())
                                if (first) { _s.value = buf; dirty = false } else dirty = true      /* « Live » is shown at once */
                                retry = 0
                            }
                        } finally { tick.cancel(); if (dirty) _s.value = buf }
                    }
                } catch (e: CancellationException) { throw e } catch (e: Exception) { /* stream ended: fall back to snapshots, then reconnect */ }
                if (_s.value.mode == FeedMode.Live) _s.update { it.copy(mode = if (it.at > 0) FeedMode.Polling else FeedMode.Offline) }
                delay(minOf(30_000L, 2_000L shl minOf(retry++, 4)))
            }
        }
    }
    override fun onCleared() { job?.cancel() }
}

@Composable
private fun pctColor(v: Double?) = if (v == null) OmColors.InkSecondary else if (v >= 0) OmColors.Success else OmColors.Error

@Composable
fun SpotScreen(contentPadding: PaddingValues) {
    val g = omGraph()
    val vm = omViewModel { SpotViewModel(it) }
    val tvm = omViewModel(key = "spot-trade") { TradeViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    /* live feed only while this screen is visible: started on ON_START, stopped on ON_STOP and when the screen is left */
    val owner = LocalLifecycleOwner.current
    DisposableEffect(owner, vm) {
        val obs = LifecycleEventObserver { _, e -> if (e == Lifecycle.Event.ON_START) vm.active(true) else if (e == Lifecycle.Event.ON_STOP) vm.active(false) }
        owner.lifecycle.addObserver(obs)
        onDispose { owner.lifecycle.removeObserver(obs); vm.active(false) }
    }
    val market by g.market.state.collectAsStateWithLifecycle()
    val wallet by g.wallet.state.collectAsStateWithLifecycle()
    val step by tvm.step.collectAsStateWithLifecycle()
    val busy by tvm.busy.collectAsStateWithLifecycle()
    val err by tvm.error.collectAsStateWithLifecycle()
    var side by remember { mutableStateOf("BUY") }
    var amount by remember { mutableStateOf("") }
    var pickPair by remember { mutableStateOf(false) }
    val q = market.quotes[s.base]
    val buy = side == "BUY"
    val legFrom = remember(side, s.base, wallet) { if (buy) tvm.from("USDT") else tvm.from(s.base) }
    val legTo = remember(side, s.base, wallet) { if (buy) tvm.to(s.base) else tvm.to("USDT") }

    if (step !is TradeStep.Form) { TradeFlow(tvm, step, contentPadding, onDone = { tvm.reset(); amount = "" }); return }

    LazyColumn(Modifier.fillMaxSize().testTag("spot"), contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            RefHeader(stringResource(R.string.tr_spot), below = {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    Row(Modifier.clip(RoundedCornerShape(18.dp)).background(Brush.linearGradient(listOf(Color(0x3DFFFFFF), Color(0x14FFFFFF)))).border(1.dp, OmColors.Edge, RoundedCornerShape(18.dp))
                        .pressable(role = Role.Button) { pickPair = true }.padding(horizontal = 12.dp, vertical = 8.dp).testTag("spot_pair"),
                        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        AssetLogo(s.base, 28.dp); Text(s.base + "/USDT", style = MaterialTheme.typography.titleLarge, color = OmColors.Ink)
                    }
                    LiveBadge(s.mode, s.at)
                }
            })
        }
        item {
            Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp), verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.SpaceBetween) {
                FlashPrice(s.last ?: q?.price, s.dir)
                Text(Fmt.pct(q?.changePct), style = MaterialTheme.typography.titleMedium, color = pctColor(q?.changePct),
                    modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(Color(0x1FFFFFFF)).padding(horizontal = 10.dp, vertical = 5.dp))
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), padding = 12.dp) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Stat(stringResource(R.string.tr_h24), Trade.price(q?.high)); Stat(stringResource(R.string.tr_l24), Trade.price(q?.low))
                    Stat(stringResource(R.string.tr_v24), q?.quoteVolume?.let { if (it >= 1e9) String.format(Locale.US, "%.2fB", it / 1e9) else String.format(Locale.US, "%.2fM", it / 1e6) } ?: "—")
                }
            }
        }
        item {
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp).clip(RoundedCornerShape(18.dp)).background(Color(0x14FFFFFF)).border(1.dp, OmColors.Edge, RoundedCornerShape(18.dp)).padding(4.dp)) {
                Trade.TFS.keys.forEach { k -> Seg(k, s.tf == k, Modifier.weight(1f).testTag("tf_$k")) { vm.tf(k) } }
            }
        }
        item { GlassCard(Modifier.padding(horizontal = 16.dp), padding = 8.dp) { CandleChart(s.candles, s.last, Modifier.fillMaxWidth().height(200.dp)) } }
        item {
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                GlassCard(Modifier.weight(1.08f), padding = 12.dp) {
                    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color(0x14FFFFFF)).padding(4.dp)) {
                        SideSeg(stringResource(R.string.tr_buy), buy, true, Modifier.weight(1f).testTag("side_buy")) { side = "BUY"; amount = "" }
                        SideSeg(stringResource(R.string.tr_sell), !buy, false, Modifier.weight(1f).testTag("side_sell")) { side = "SELL"; amount = "" }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(stringResource(R.string.tr_market), style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary)
                    AmountField(amount, legFrom.asset, Modifier.testTag("spot_amount")) { amount = it }
                    Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        listOf(25, 50, 75, 100).forEach { p ->
                            Text("$p%", style = MaterialTheme.typography.labelSmall, color = OmColors.Ink, textAlign = TextAlign.Center,
                                modifier = Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(Color(0x1FFFFFFF)).pressable { amount = Trade.cut8(legFrom.available * p / 100).toPlainString() }.padding(vertical = 6.dp).testTag("pct_$p"))
                        }
                    }
                    Text(stringResource(R.string.tr_avail, Trade.qty(legFrom.available) + " " + legFrom.asset), style = MaterialTheme.typography.labelSmall, color = OmColors.InkSecondary, modifier = Modifier.padding(top = 6.dp))
                    val a = amount.replace(',', '.').toDoubleOrNull(); val p = s.last ?: q?.price
                    if (a != null && a > 0 && p != null) Text("≈ " + Trade.qty(if (buy) a / p else a * p) + " " + (if (buy) s.base else "USDT"), style = MaterialTheme.typography.labelMedium, color = OmColors.Ink)
                    Spacer(Modifier.height(8.dp))
                    TradeButton(if (buy) stringResource(R.string.tr_buy_x, s.base) else stringResource(R.string.tr_sell_x, s.base), buy, busy, Modifier.testTag("spot_go")) {
                        tvm.quote(legFrom, legTo, amount.replace(',', '.').toDoubleOrNull() ?: 0.0, side)
                    }
                    err?.let { Text(errorTextTr(it), style = MaterialTheme.typography.bodySmall, color = OmColors.Error, modifier = Modifier.padding(top = 6.dp)) }
                    Text(stringResource(R.string.tr_market_info), style = MaterialTheme.typography.labelSmall, color = OmColors.InkSecondary, modifier = Modifier.padding(top = 6.dp))
                }
                GlassCard(Modifier.weight(1f), padding = 10.dp) { OrderBook(s.book, s.last, s.dir) }
            }
        }
        item { GlassCard(Modifier.padding(horizontal = 16.dp), padding = 12.dp) { Trades(s.trades) } }
        item { Text(stringResource(R.string.tr_risk), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.padding(horizontal = 20.dp)) }
    }
    if (pickPair) OmSheet(stringResource(R.string.tr_pick), onDismiss = { pickPair = false }) {
        Trade.PAIRS.forEach { b ->
            val qq = market.quotes[b]
            Row(Modifier.fillMaxWidth().pressable { vm.pair(b); pickPair = false }.padding(vertical = 10.dp).testTag("pair_$b"), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AssetLogo(b, 34.dp); Text("$b/USDT", style = MaterialTheme.typography.titleMedium, color = OmColors.Ink, modifier = Modifier.weight(1f))
                Column(horizontalAlignment = Alignment.End) { Text(Trade.price(qq?.price), color = OmColors.Ink); Text(Fmt.pct(qq?.changePct), color = pctColor(qq?.changePct), style = MaterialTheme.typography.labelSmall) }
            }
        }
    }
}

/* ---------- Swap ---------- */
@Composable
fun SwapScreen(contentPadding: PaddingValues) {
    val g = omGraph()
    val tvm = omViewModel(key = "swap-trade") { TradeViewModel(it) }
    val market by g.market.state.collectAsStateWithLifecycle()
    val wallet by g.wallet.state.collectAsStateWithLifecycle()
    val step by tvm.step.collectAsStateWithLifecycle()
    val busy by tvm.busy.collectAsStateWithLifecycle()
    val err by tvm.error.collectAsStateWithLifecycle()
    var fromSym by remember { mutableStateOf("USDT") }
    var toSym by remember { mutableStateOf("BTC") }
    var amount by remember { mutableStateOf("") }
    var pick by remember { mutableStateOf<String?>(null) }
    var spin by remember { mutableStateOf(false) }
    val reduced = LocalOmMotion.current.reduced
    val turn by animateFloatAsState(if (spin && !reduced) 180f else 0f, OmSprings.spatial(), label = "flip")
    val f = remember(fromSym, wallet) { tvm.from(fromSym) }
    val t = remember(toSym, wallet) { tvm.to(toSym) }
    val pf = if (fromSym == "USDT") 1.0 else market.quotes[fromSym]?.price
    val pt = if (toSym == "USDT") 1.0 else market.quotes[toSym]?.price
    val rate = if (pf != null && pt != null) pf / pt else null

    if (step !is TradeStep.Form) { TradeFlow(tvm, step, contentPadding, onDone = { tvm.reset(); amount = "" }); return }

    LazyColumn(Modifier.fillMaxSize().testTag("swap"), contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { RefHeader(stringResource(R.string.tr_swap)) }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), padding = 16.dp) {
                Text(stringResource(R.string.tr_from), style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary)
                Row(Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    AssetPick(f, Modifier.testTag("swap_from")) { pick = "from" }
                    AmountField(amount, null, Modifier.weight(1f).testTag("swap_amount")) { amount = it }
                }
                Row(Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(stringResource(R.string.tr_avail, Trade.qty(f.available) + " " + f.asset), style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary)
                    Text(stringResource(R.string.tr_max), style = MaterialTheme.typography.labelLarge, color = OmColors.Ink,
                        modifier = Modifier.clip(RoundedCornerShape(10.dp)).background(Color(0x24FFFFFF)).pressable { amount = Trade.cut8(f.available).toPlainString() }.padding(horizontal = 12.dp, vertical = 5.dp).testTag("swap_max"))
                }
            }
        }
        item {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                Box(Modifier.size(54.dp).graphicsLayer { rotationZ = turn }.clip(CircleShape).background(Brush.verticalGradient(listOf(OmColors.GradTop, OmColors.GradMid, OmColors.GradBottom)))
                    .border(1.dp, Color(0x8CFFFFFF), CircleShape).pressable(role = Role.Button) { val x = fromSym; fromSym = toSym; toSym = x; amount = ""; spin = !spin }
                    .semantics { contentDescription = "flip" }.testTag("swap_flip"), contentAlignment = Alignment.Center) {
                    Text("⇅", color = Color.White, style = MaterialTheme.typography.headlineSmall)
                }
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), padding = 16.dp) {
                Text(stringResource(R.string.tr_to), style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary)
                Row(Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    AssetPick(t, Modifier.testTag("swap_to")) { pick = "to" }
                    val a = amount.replace(',', '.').toDoubleOrNull()
                    Text(if (a != null && a > 0 && rate != null) Trade.qty(Trade.cut8(a * rate).toDouble()) else "—", style = MaterialTheme.typography.headlineMedium, color = OmColors.Ink,
                        textAlign = TextAlign.End, modifier = Modifier.weight(1f).testTag("swap_out"))
                }
                Text((rate?.let { stringResource(R.string.tr_rate_l) + " " + Trade.rate(fromSym, toSym, it, true) } ?: "—"), style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary, modifier = Modifier.padding(top = 8.dp))
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), padding = 14.dp) {
                Detail(stringResource(R.string.tr_fee), "0 $fromSym"); Detail(stringResource(R.string.tr_price_l), stringResource(R.string.tr_price_v))
                Detail(stringResource(R.string.tr_follow), stringResource(R.string.tr_follow_v)); Detail(stringResource(R.string.tr_src), "Binance")
            }
        }
        item {
            Column(Modifier.padding(horizontal = 16.dp)) {
                OmPrimaryButton(stringResource(R.string.tr_go), Modifier.testTag("swap_go"), enabled = !busy) { tvm.quote(f, t, amount.replace(',', '.').toDoubleOrNull() ?: 0.0, null) }
                err?.let { Text(errorTextTr(it), style = MaterialTheme.typography.bodyMedium, color = OmColors.Error, modifier = Modifier.padding(top = 8.dp).testTag("swap_error")) }
                Text(stringResource(R.string.tr_rule), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.padding(top = 10.dp))
            }
        }
    }
    pick?.let { which ->
        OmSheet(stringResource(R.string.tr_pick_a), onDismiss = { pick = null }) {
            Trade.SUP.filter { it != (if (which == "from") toSym else fromSym) }.forEach { sym ->
                val leg = if (which == "from") tvm.from(sym) else tvm.to(sym)
                Row(Modifier.fillMaxWidth().pressable { if (which == "from") fromSym = sym else toSym = sym; amount = if (which == "from") "" else amount; pick = null }.padding(vertical = 10.dp).testTag("asset_$sym"),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    AssetLogo(sym, 34.dp); Text(sym, style = MaterialTheme.typography.titleMedium, color = OmColors.Ink, modifier = Modifier.weight(1f))
                    if (which == "from") Text(Trade.qty(leg.available), style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary)
                }
            }
        }
    }
}

/* ---------- review → PIN → « En cours » ---------- */
@Composable
private fun TradeFlow(tvm: TradeViewModel, step: TradeStep, contentPadding: PaddingValues, onDone: () -> Unit) {
    var pin by remember { mutableStateOf(false) }
    val err by tvm.error.collectAsStateWithLifecycle()
    LazyColumn(Modifier.fillMaxSize().testTag("trade_flow"), contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        when (step) {
            is TradeStep.Review -> {
                item { RefHeader(stringResource(R.string.tr_review), onBack = onDone, backDescription = stringResource(R.string.back)) }
                item {
                    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
                    LaunchedEffect(step.q.id) { while (now < step.q.expiresAt) { delay(500); now = System.currentTimeMillis() } }
                    val left = ((step.q.expiresAt - now) / 1000).coerceAtLeast(0)
                    GlassCard(Modifier.padding(horizontal = 16.dp), padding = 18.dp) {
                        Text(stringResource(R.string.tr_pay), style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary)
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) { AssetLogo(step.q.fromAsset, 30.dp); Text(Trade.qty(step.q.fromAmount) + " " + step.q.fromAsset, style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink) }
                        Spacer(Modifier.height(10.dp))
                        Text(stringResource(R.string.tr_get), style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary)
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) { AssetLogo(step.q.toAsset, 30.dp); Text(Trade.qty(step.q.toAmount) + " " + step.q.toAsset, style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink, modifier = Modifier.testTag("review_get")) }
                        Spacer(Modifier.height(12.dp))
                        Detail(stringResource(R.string.tr_price_l), Trade.rate(step.q.fromAsset, step.q.toAsset, step.q.price, false))
                        Detail(stringResource(R.string.tr_fee), "0 " + step.q.fromAsset)
                        Detail(stringResource(R.string.tr_src), step.q.source.replace(Regex("^binance:?", RegexOption.IGNORE_CASE), "Binance · ").trimEnd(' ', '·'))
                        Spacer(Modifier.height(8.dp))
                        Text(if (left > 0) stringResource(R.string.tr_valid, left.toInt()) else stringResource(R.string.tr_expired), style = MaterialTheme.typography.labelLarge,
                            color = if (left > 0) OmColors.InkSecondary else OmColors.Warning, modifier = Modifier.testTag("review_ttl"))
                        Spacer(Modifier.height(14.dp))
                        if (left > 0) OmPrimaryButton(stringResource(R.string.tr_confirm), Modifier.testTag("review_confirm")) { pin = true }
                        else OmSecondaryButton(stringResource(R.string.tr_refresh), Modifier.testTag("review_refresh")) { tvm.reset() }
                        err?.let { Text(errorTextTr(it), color = OmColors.Error, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 8.dp)) }
                    }
                }
                item { Text(stringResource(R.string.tr_rule), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.padding(horizontal = 20.dp)) }
            }
            TradeStep.Submitting -> item { RefHeader(stringResource(R.string.tr_swap)); StatusSteps(listOf(stringResource(R.string.tr_st_rec) to StepState.Current, stringResource(R.string.tr_st_wait) to StepState.Todo, stringResource(R.string.tr_st_done) to StepState.Todo), Modifier.padding(20.dp)) }
            is TradeStep.Done -> {
                item { RefHeader(stringResource(R.string.tr_swap)) }
                item {
                    LaunchedEffect(step.id) { while (true) { delay(5000); tvm.refresh() } }
                    val st = tvm.status(step.id)
                    val confirmed = st == "CONFIRMED" || st == "SUCCESS"; val refused = st == "REJECTED" || st == "REFUNDED"
                    GlassCard(Modifier.padding(horizontal = 16.dp), padding = 18.dp) {
                        Text(Trade.qty(step.q.fromAmount) + " " + step.q.fromAsset + " → " + Trade.qty(step.q.toAmount) + " " + step.q.toAsset, style = MaterialTheme.typography.titleLarge, color = OmColors.Ink)
                        Spacer(Modifier.height(10.dp))
                        StatusChip(stringResource(if (confirmed) R.string.tr_s_confirmed else if (refused) R.string.tr_s_rejected else R.string.tr_s_pending),
                            if (confirmed) ChipTone.Success else if (refused) ChipTone.Failed else ChipTone.Pending, Modifier.testTag("trade_status"), animated = !confirmed && !refused)
                        step.reference?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.padding(top = 8.dp)) }
                    }
                    StatusSteps(listOf(stringResource(R.string.tr_st_rec) to StepState.Done, stringResource(R.string.tr_st_wait) to (if (confirmed || refused) StepState.Done else StepState.Current),
                        stringResource(R.string.tr_st_done) to (if (confirmed) StepState.Done else if (refused) StepState.Failed else StepState.Todo)), Modifier.padding(20.dp))
                    Box(Modifier.padding(horizontal = 16.dp)) { OmPrimaryButton(stringResource(R.string.tr_home), Modifier.testTag("trade_done")) { onDone() } }
                }
            }
            is TradeStep.Failed -> item {
                RefHeader(stringResource(R.string.tr_swap))
                GlassCard(Modifier.padding(16.dp), padding = 18.dp) {
                    Text(stringResource(R.string.tr_s_failed), style = MaterialTheme.typography.titleLarge, color = OmColors.Ink)
                    Text(errorTextTr(step.code), style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary, modifier = Modifier.padding(top = 8.dp))
                    Spacer(Modifier.height(12.dp)); OmPrimaryButton(stringResource(R.string.tr_again)) { onDone() }
                }
            }
            TradeStep.Form -> Unit
        }
    }
    val r = step as? TradeStep.Review
    if (pin && r != null) PinSheet(onGranted = { grant -> pin = false; tvm.execute(r.q, grant) }, onDismiss = { pin = false })
}

/* ---------- pieces ---------- */
@Composable
fun errorTextTr(code: String): String = when (code) {
    "quote_expired" -> stringResource(R.string.tr_e_quote_expired)
    "quote_used" -> stringResource(R.string.tr_e_quote_used)
    "min_amount" -> stringResource(R.string.tr_e_min_amount)
    "price_unavailable" -> stringResource(R.string.tr_e_price_unavailable)
    "too_many_requests" -> stringResource(R.string.tr_e_too_many)
    "server_off" -> stringResource(R.string.tr_e_server_off)
    "unsupported_pair" -> stringResource(R.string.tr_e_unsupported_pair)
    "amount_too_small" -> stringResource(R.string.tr_e_amount_too_small)
    "sender_wallet_missing" -> stringResource(R.string.tr_e_no_wallet)
    else -> errorText(code)
}

@Composable private fun Stat(a: String, b: String) = Column { Text(a, style = MaterialTheme.typography.labelSmall, color = OmColors.InkSecondary); Text(b, style = MaterialTheme.typography.titleSmall, color = OmColors.Ink) }
@Composable private fun Detail(a: String, b: String) = Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
    Text(a, style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary); Spacer(Modifier.width(12.dp))
    Text(b, style = MaterialTheme.typography.bodyMedium, color = OmColors.Ink, textAlign = TextAlign.End, modifier = Modifier.weight(1f, fill = false))
}
@Composable private fun Seg(text: String, on: Boolean, modifier: Modifier, onClick: () -> Unit) = Box(
    modifier.clip(RoundedCornerShape(14.dp)).background(if (on) Brush.verticalGradient(listOf(OmColors.GradTop, OmColors.GradMid, OmColors.GradBottom)) else androidx.compose.ui.graphics.SolidColor(Color.Transparent))
        .pressable(role = Role.Tab, onClick = onClick).padding(vertical = 9.dp), contentAlignment = Alignment.Center) { Text(text, style = MaterialTheme.typography.labelLarge, color = if (on) Color.White else OmColors.InkSecondary) }
@Composable private fun SideSeg(text: String, on: Boolean, buy: Boolean, modifier: Modifier, onClick: () -> Unit) = Box(
    modifier.clip(RoundedCornerShape(11.dp)).background(if (!on) androidx.compose.ui.graphics.SolidColor(Color.Transparent) else Brush.verticalGradient(if (buy) listOf(Color(0xFF5BEAA6), Color(0xFF1FB673)) else listOf(Color(0xFFFF98A2), Color(0xFFE8505E))))
        .pressable(role = Role.Tab, onClick = onClick).padding(vertical = 8.dp), contentAlignment = Alignment.Center) { Text(text, style = MaterialTheme.typography.labelLarge, color = if (on) Color(if (buy) 0xFF04301C else 0xFF3A0610) else OmColors.InkSecondary) }
@Composable private fun TradeButton(text: String, buy: Boolean, busy: Boolean, modifier: Modifier, onClick: () -> Unit) = Box(
    modifier.fillMaxWidth().heightIn(min = 50.dp).clip(RoundedCornerShape(16.dp))
        .background(Brush.verticalGradient(if (buy) listOf(Color(0xFF5BEAA6), Color(0xFF22C07B), Color(0xFF14995E)) else listOf(Color(0xFFFF98A2), Color(0xFFEF5E6B), Color(0xFFC93A49))))
        .border(1.dp, Color(0x73FFFFFF), RoundedCornerShape(16.dp)).pressable(enabled = !busy, role = Role.Button, onClick = onClick), contentAlignment = Alignment.Center) {
    if (busy) com.omwallet.core.design.LoadingDots(Color.White) else Text(text, style = MaterialTheme.typography.labelLarge, color = Color.White)
}
@Composable private fun AmountField(v: String, unit: String?, modifier: Modifier, onChange: (String) -> Unit) = OutlinedTextField(
    v, { x -> onChange(x.filter { it.isDigit() || it == '.' || it == ',' }.take(20)) }, modifier.fillMaxWidth().padding(top = 4.dp), singleLine = true,
    placeholder = { Text("0", color = OmColors.InkSecondary) }, suffix = unit?.let { u -> { Text(u, color = OmColors.InkSecondary) } },
    textStyle = MaterialTheme.typography.titleLarge.copy(color = OmColors.Ink, textAlign = if (unit == null) TextAlign.End else TextAlign.Start),
    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), shape = RoundedCornerShape(14.dp),
    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OmColors.Blue600, unfocusedBorderColor = OmColors.Edge, focusedContainerColor = Color(0x24FFFFFF), unfocusedContainerColor = Color(0x14FFFFFF), cursorColor = Color.White),
)
@Composable private fun AssetPick(leg: Leg, modifier: Modifier, onClick: () -> Unit) = Row(
    modifier.clip(RoundedCornerShape(18.dp)).background(Color(0x1FFFFFFF)).border(1.dp, OmColors.Edge, RoundedCornerShape(18.dp)).pressable(role = Role.Button, onClick = onClick).padding(horizontal = 10.dp, vertical = 8.dp),
    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
    AssetLogo(leg.asset, 30.dp)
    Column { Text(leg.asset, style = MaterialTheme.typography.titleMedium, color = OmColors.Ink); Text(com.omwallet.core.data.Catalog.network(leg.network)?.name ?: leg.network, style = MaterialTheme.typography.labelSmall, color = OmColors.InkSecondary) }
}
@Composable
private fun LiveBadge(mode: FeedMode, at: Long) = FeedBadge(mode, at)

/* the last price flashes green / red for the direction of the change (colour only, nothing jumps); never under « remove animations » */
@Composable
private fun FlashPrice(p: Double?, dir: Int) {
    val reduced = LocalOmMotion.current.reduced
    var flash by remember { mutableStateOf(0) }
    LaunchedEffect(p) { if (!reduced && dir != 0) { flash = dir; delay(650); flash = 0 } }
    val bg by animateColorAsState(when (flash) { 1 -> Color(0x5245E39A); -1 -> Color(0x52FF7D89); else -> Color.Transparent }, OmSprings.fade(260), label = "pxbg")
    Text(Trade.price(p), style = MaterialTheme.typography.displaySmall, color = when (dir) { 1 -> OmColors.Success; -1 -> OmColors.Error; else -> OmColors.Ink },
        modifier = Modifier.clip(RoundedCornerShape(10.dp)).background(bg).padding(horizontal = 4.dp).testTag("spot_price"))
}

@Composable
private fun OrderBook(b: Book, last: Double?, dir: Int) = Column(Modifier.testTag("spot_book")) {
    Text(stringResource(R.string.tr_book), style = MaterialTheme.typography.labelLarge, color = OmColors.InkSecondary)
    val asks = b.asks.take(7).reversed(); val bids = b.bids.take(7)
    val mx = (asks + bids).maxOfOrNull { it.second }?.takeIf { it > 0 } ?: 1.0
    @Composable fun row(r: Pair<Double, Double>, ask: Boolean) {
        Box(Modifier.fillMaxWidth().height(19.dp)) {
            val frac by animateFloatAsState((r.second / mx).toFloat().coerceIn(0f, 1f), OmSprings.standard(), label = "depth")
            Box(Modifier.align(Alignment.CenterEnd).fillMaxHeight().fillMaxWidth(frac).background(if (ask) Color(0x29FF7D89) else Color(0x2945E39A)))
            Row(Modifier.fillMaxSize().padding(horizontal = 2.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(Trade.price(r.first), style = MaterialTheme.typography.labelSmall, color = if (ask) OmColors.Error else OmColors.Success)
                Text(Trade.qty(r.second), style = MaterialTheme.typography.labelSmall, color = OmColors.Ink)
            }
        }
    }
    if (asks.isEmpty() && bids.isEmpty()) Text("—", color = OmColors.InkSecondary)
    asks.forEach { row(it, true) }
    Text(Trade.price(last), style = MaterialTheme.typography.titleMedium, color = when (dir) { 1 -> OmColors.Success; -1 -> OmColors.Error; else -> OmColors.Ink }, modifier = Modifier.padding(vertical = 4.dp))
    bids.forEach { row(it, false) }
}

@Composable
private fun Trades(list: List<MarketTrade>) = Column(Modifier.testTag("spot_trades")) {
    Text(stringResource(R.string.tr_trades), style = MaterialTheme.typography.labelLarge, color = OmColors.InkSecondary)
    if (list.isEmpty()) Text("—", color = OmColors.InkSecondary)
    val fmt = remember { java.text.SimpleDateFormat("HH:mm:ss", Locale.US) }
    list.take(12).forEach { x ->
        Row(Modifier.fillMaxWidth().padding(vertical = 3.dp)) {
            Text(Trade.price(x.price), style = MaterialTheme.typography.labelMedium, color = if (x.sell) OmColors.Error else OmColors.Success, modifier = Modifier.weight(1.2f))
            Text(Trade.qty(x.qty), style = MaterialTheme.typography.labelMedium, color = OmColors.Ink, textAlign = TextAlign.Center, modifier = Modifier.weight(1f))
            Text(fmt.format(java.util.Date(x.time)), style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary, textAlign = TextAlign.End, modifier = Modifier.weight(0.9f))
        }
    }
}

/* candlesticks with the live last-price line (Canvas: no allocation per frame beyond the visible candles) */
@Composable
private fun CandleChart(cs: List<Ohlc>, last: Double?, modifier: Modifier) {
    val pos = OmColors.Success; val neg = OmColors.Error
    Canvas(modifier.testTag("spot_chart")) {
        if (cs.isEmpty()) return@Canvas
        val padR = 4f; val n = cs.size; val cw = (size.width - padR) / n
        var lo = cs.minOf { it.low }; var hi = cs.maxOf { it.high }
        if (last != null && last > 0) { lo = minOf(lo, last); hi = maxOf(hi, last) }
        val span = (hi - lo).takeIf { it > 0 } ?: (hi * 0.002).coerceAtLeast(1e-9); lo -= span * 0.08; hi += span * 0.08
        fun y(v: Double) = (8f + (1 - (v - lo) / (hi - lo)) * (size.height - 16f)).toFloat()
        for (i in 0 until 4) { val yy = 8f + (size.height - 16f) * (i + 0.5f) / 4f; drawLine(Color(0x17FFFFFF), Offset(0f, yy), Offset(size.width, yy), 1f) }
        cs.forEachIndexed { i, c ->
            val up = c.close >= c.open; val col = if (up) pos else neg; val x = i * cw + cw / 2
            drawLine(col, Offset(x, y(c.high)), Offset(x, y(c.low)), 1.4f)
            val t = y(maxOf(c.open, c.close)); val b = y(minOf(c.open, c.close)); val bw = (cw * 0.62f).coerceAtLeast(1.6f)
            drawRoundRect(col, Offset(x - bw / 2, t), Size(bw, (b - t).coerceAtLeast(1.4f)), CornerRadius(1.5f, 1.5f))
        }
        val l = last ?: cs.last().close; val ly = y(l); val upL = l >= cs.last().open
        drawLine(if (upL) pos else neg, Offset(0f, ly), Offset(size.width, ly), 1.2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f)))
    }
}
