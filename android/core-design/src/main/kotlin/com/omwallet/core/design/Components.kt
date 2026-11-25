package com.omwallet.core.design

import androidx.annotation.DrawableRes
import kotlinx.coroutines.delay
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/* Glass surface: translucent white over the sky background, hairline light border, very soft shadow.
   Used on the dashboard, sheets and wallet cards; financial input screens use the stronger, calmer variant (strong = true). */
@Composable
fun GlassCard(modifier: Modifier = Modifier, strong: Boolean = false, padding: Dp = OmSpace.L, fill: Boolean = true, rise: Int = 0, content: @Composable ColumnScope.() -> Unit) {
    /* 14.8.0: a dark grey card on the black page with a hairline edge; the stronger variant (financial input screens) is one step lighter.
       The card still rises into place when it first appears. */
    val shape = RoundedCornerShape(OmRadius.M)
    Column(
        modifier
            .then(if (fill) Modifier.fillMaxWidth() else Modifier)
            .riseIn(rise)
            .clip(shape)
            .background(if (strong) OmColors.Track else OmColors.Card)
            .border(BorderStroke(1.dp, OmColors.Edge), shape)
            .padding(padding),
        content = content,
    )
}

/* Sky background with two very diffuse halos (login / dashboard). */
@Composable
fun SkyBackground(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    /* 14.8.0: a plain black page (the 14.5 blue gradient and glass waves are gone) */
    Box(modifier.background(OmColors.Surface)) { content() }
}

/* Press feedback (14.4.0): the control springs to 0.96 and a soft light blooms from the exact point the finger touched, then fades.
   Draw-phase only (graphicsLayer / drawWithContent); skipped under « remove animations ». Haptic tap on click. */
@Composable
fun Modifier.pressable(enabled: Boolean = true, role: Role = Role.Button, onClick: () -> Unit): Modifier {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val reduced = LocalOmMotion.current.reduced
    val scale by animateFloatAsState(if (pressed && !reduced) 0.97f else 1f, OmSprings.press(), label = "press")
    val glow by animateFloatAsState(if (pressed) 1f else 0f, tween(if (pressed) 60 else 320), label = "dim")
    var at by remember { mutableStateOf(Offset.Unspecified) }
    LaunchedEffect(source) { source.interactions.collect { if (it is PressInteraction.Press) at = it.pressPosition } }
    val haptics = rememberOmHaptics()
    /* 15.3.0 — iOS press: the control dims at once (a UIButton « highlighted » state) and settles a hair smaller, then springs back.
       The coloured light that used to bloom under the finger is gone (an Android ripple idea, not an iPhone one). */
    return this
        .graphicsLayer { scaleX = scale; scaleY = scale; alpha = 1f - 0.28f * glow }
        .clickable(interactionSource = source, indication = null, enabled = enabled, role = role) { haptics.tap(); onClick() }
}

/* Cards and rows rise into place one after the other when a screen opens (index × 55 ms); nothing moves under « remove animations ». */
@Composable
fun Modifier.riseIn(index: Int): Modifier {
    if (LocalOmMotion.current.reduced) return this
    val a = remember { Animatable(0f) }
    LaunchedEffect(Unit) { delay(index * 55L); a.animateTo(1f, tween(560, easing = FastOutSlowInEasing)) }
    return graphicsLayer { alpha = a.value; translationY = (1f - a.value) * 16.dp.toPx() }
}

/* Loading inside a button: three dots that hop one after the other (replaces the spinner). */
@Composable
fun LoadingDots(color: Color = Color.White) {
    val t = rememberInfiniteTransition(label = "dots")
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
        repeat(3) { k ->
            val y by t.animateFloat(0f, 1f, infiniteRepeatable(keyframes { durationMillis = 900; 0f at (k * 120); 1f at (k * 120 + 220); 0f at (k * 120 + 440) }), label = "d$k")
            Box(Modifier.size(9.dp).graphicsLayer { translationY = -6.dp.toPx() * y }.clip(CircleShape).background(color))
        }
    }
}

@Composable
fun OmPrimaryButton(text: String, modifier: Modifier = Modifier, enabled: Boolean = true, loading: Boolean = false, successText: String? = null, onClick: () -> Unit) {
    /* 14.8.0: a yellow pill, a soft yellow glow, dark text ON the yellow (Binance / Liv X).
       14.10.0: [successText] morphs the pill — it turns green and a check is written before the words (a copy, a saved choice…). */
    val shape = RoundedCornerShape(50)
    val ok by animateFloatAsState(if (successText != null) 1f else 0f, tween(260), label = "btn-ok")
    Box(
        modifier
            .heightIn(min = 50.dp)
            .fillMaxWidth()
            .clip(shape)
            .background(if (enabled) OmColors.Blue600 else OmColors.Track)   /* 15.3.0: a flat filled capsule, like an iOS prominent button */
            .drawBehind { if (ok > 0f) drawRect(OmColors.Success.copy(alpha = ok)) }
            .pressable(enabled = enabled && !loading, onClick = onClick)
            .semantics { if (loading) contentDescription = text },
        contentAlignment = Alignment.Center,
    ) {
        if (loading) LoadingDots(OmColors.OnAccent)
        else if (successText != null) Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(horizontal = 16.dp)) {
            CheckGlyph(OmColors.OnAccent)
            Text(successText, style = MaterialTheme.typography.labelLarge, color = OmColors.OnAccent, textAlign = TextAlign.Center)
        }
        else Text(text, style = MaterialTheme.typography.labelLarge, color = if (enabled) OmColors.OnAccent else OmColors.InkSecondary, textAlign = TextAlign.Center, modifier = Modifier.padding(horizontal = 16.dp))
    }
}

@Composable
fun OmSecondaryButton(text: String, modifier: Modifier = Modifier, enabled: Boolean = true, onClick: () -> Unit) {
    /* 14.8.0: a yellow-tinted pill with yellow text (secondary action next to the yellow primary pill) */
    val shape = RoundedCornerShape(50)
    Box(
        modifier.heightIn(min = 50.dp).fillMaxWidth().clip(shape)
            .background(OmColors.AccentSoft).pressable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) { Text(text, style = MaterialTheme.typography.labelLarge, color = if (enabled) OmColors.Blue600 else OmColors.InkSecondary) }
}

/* Icon tile (14.7.0): light violet circle with a violet line icon. */
@Composable
fun GlassTile(@DrawableRes icon: Int, modifier: Modifier = Modifier, size: Dp = 52.dp, tint: Color = OmColors.Blue600) {
    /* 14.8.0: a yellow-tinted circle with a yellow line icon */
    val shape = CircleShape
    Box(
        modifier.size(size).clip(shape).background(OmColors.AccentSoft),
        contentAlignment = Alignment.Center,
    ) { OmIcon(icon, null, tint = tint, size = size * 0.46f) }
}

/* Official asset / network logos (web3icons 4.0.61, MIT, round-badge variant; XRP from the XRPL Brand Kit 2026) as vector drawables: never blurry at any density. */
@Composable
fun AssetLogo(symbol: String, size: Dp = 40.dp, modifier: Modifier = Modifier) {
    val res = tokenLogo(symbol)
    Box(modifier.size(size).clip(CircleShape).background(OmColors.Track), contentAlignment = Alignment.Center) {
        /* 14.5.0: the official round coin badge fills the circle, as on the projects' own sites and on exchanges */
        if (res != null) Image(painterResource(res), contentDescription = null, modifier = Modifier.size(size))
        else Text(symbol.take(3), style = MaterialTheme.typography.labelSmall, color = OmColors.InkSecondary)
    }
}

@Composable
fun NetworkLogo(network: String, size: Dp = 28.dp, modifier: Modifier = Modifier) {
    val res = networkLogo(network)
    Box(modifier.size(size).clip(CircleShape).background(OmColors.Track), contentAlignment = Alignment.Center) {
        if (res != null) Image(painterResource(res), contentDescription = null, modifier = Modifier.size(size))
    }
}

@DrawableRes fun tokenLogo(symbol: String): Int? = when (symbol.uppercase()) {
    "BTC" -> R.drawable.ic_token_btc; "ETH" -> R.drawable.ic_token_eth; "USDT" -> R.drawable.ic_token_usdt; "USDC" -> R.drawable.ic_token_usdc
    "BNB" -> R.drawable.ic_token_bnb; "SOL" -> R.drawable.ic_token_sol; "TRX" -> R.drawable.ic_token_trx; "XRP" -> R.drawable.ic_token_xrp
    "LTC" -> R.drawable.ic_token_ltc; "DOGE" -> R.drawable.ic_token_doge; "ADA" -> R.drawable.ic_token_ada; "AVAX" -> R.drawable.ic_token_avax
    "POL" -> R.drawable.ic_token_pol; else -> null
}
@DrawableRes fun networkLogo(network: String): Int? = when (network.lowercase()) {
    "bitcoin" -> R.drawable.ic_net_bitcoin; "ethereum" -> R.drawable.ic_net_ethereum; "bsc" -> R.drawable.ic_net_bsc; "tron" -> R.drawable.ic_net_tron
    "solana" -> R.drawable.ic_net_solana; "polygon" -> R.drawable.ic_net_polygon; "arbitrum" -> R.drawable.ic_net_arbitrum; "base" -> R.drawable.ic_net_base
    "avalanche" -> R.drawable.ic_net_avalanche; "litecoin" -> R.drawable.ic_net_litecoin; "xrp" -> R.drawable.ic_net_xrp; else -> null
}

/* Status chip: colour AND text (colour is never the only indicator). */
enum class ChipTone { Success, Pending, Failed, Neutral }
@Composable
fun StatusChip(text: String, tone: ChipTone, modifier: Modifier = Modifier, animated: Boolean = false) {
    val (bg, fg) = when (tone) {
        ChipTone.Success -> OmColors.ChipUp to OmColors.Success
        ChipTone.Pending -> Color(0xFF3A2D0A) to OmColors.Warning
        ChipTone.Failed -> OmColors.ChipDown to OmColors.Error
        ChipTone.Neutral -> OmColors.Track to OmColors.InkSecondary
    }
    androidx.compose.foundation.layout.Row(
        modifier.clip(RoundedCornerShape(50)).background(bg).padding(horizontal = 10.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(6.dp),
    ) {
        if (animated) ProgressDots(fg)
        Text(text, style = MaterialTheme.typography.labelSmall, color = fg)
    }
}

/* « En cours » : three dots that pulse one after the other (alpha + scale in the draw phase only: no layout, no recomposition per frame).
   With "remove animations" on, the dots stay still. */
@Composable
fun ProgressDots(color: Color, modifier: Modifier = Modifier) {
    val reduced = LocalOmMotion.current.reduced
    val t = androidx.compose.animation.core.rememberInfiniteTransition(label = "progress")
    androidx.compose.foundation.layout.Row(modifier, horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(3.dp)) {
        repeat(3) { i ->
            val a by t.animateFloat(
                0.3f, 1f,
                androidx.compose.animation.core.infiniteRepeatable(androidx.compose.animation.core.tween(700, delayMillis = i * 140, easing = androidx.compose.animation.core.LinearEasing), androidx.compose.animation.core.RepeatMode.Reverse),
                label = "dot$i",
            )
            Box(Modifier.size(5.dp).graphicsLayer { val v = if (reduced) 0.85f else a; alpha = v; scaleX = 0.6f + 0.4f * v; scaleY = 0.6f + 0.4f * v }.clip(CircleShape).background(color))
        }
    }
}

@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier, action: String? = null, onAction: (() -> Unit)? = null) {
    Row(modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(text, style = MaterialTheme.typography.titleLarge, color = OmColors.Ink, modifier = Modifier.weight(1f))
        if (action != null && onAction != null) Text(action, style = MaterialTheme.typography.labelLarge, color = OmColors.Blue600, modifier = Modifier.clip(RoundedCornerShape(10.dp)).pressable(onClick = onAction).padding(8.dp))
    }
}

@Composable
fun EmptyState(title: String, body: String, modifier: Modifier = Modifier, action: String? = null, onAction: (() -> Unit)? = null, art: Boolean = true) {
    Column(modifier.fillMaxWidth().padding(vertical = 24.dp, horizontal = 12.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        /* « nothing here yet »: the original Arche illustration (an arch, the coin still to come); not for errors */
        if (art) androidx.compose.foundation.Image(androidx.compose.ui.res.painterResource(R.drawable.om_empty), contentDescription = null, modifier = Modifier.size(width = 112.dp, height = 92.dp))
        Text(title, style = MaterialTheme.typography.titleMedium, color = OmColors.Ink, textAlign = TextAlign.Center)
        Text(body, style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary, textAlign = TextAlign.Center)
        if (action != null && onAction != null) { Spacer(Modifier.height(4.dp)); OmSecondaryButton(action, Modifier.width(220.dp), onClick = onAction) }
    }
}

@Composable
fun ErrorState(message: String, retry: String, modifier: Modifier = Modifier, onRetry: () -> Unit) =
    EmptyState(title = message, body = "", modifier = modifier, action = retry, onAction = onRetry, art = false)

/* Loading placeholder: shape only, never fake data. */
@Composable
fun SkeletonRows(count: Int = 3, modifier: Modifier = Modifier) {
    /* 15.1.0: one soft light sweeps over every placeholder together (still under « remove animations ») */
    val phase = rememberShimmerPhase()
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        repeat(count) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(40.dp).clip(CircleShape).background(OmColors.Sky100).shimmerWith(phase))
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Box(Modifier.fillMaxWidth(0.6f).height(12.dp).clip(RoundedCornerShape(6.dp)).background(OmColors.Sky100).shimmerWith(phase))
                    Box(Modifier.fillMaxWidth(0.35f).height(10.dp).clip(RoundedCornerShape(6.dp)).background(OmColors.Sky100).shimmerWith(phase))
                }
            }
        }
    }
}

/* Small inline chart and a full area chart, drawn on Canvas from REAL closes (no generated data). */
@Composable
fun Sparkline(values: List<Double>, up: Boolean, modifier: Modifier = Modifier.width(72.dp).height(28.dp)) {
    Canvas(modifier) {
        if (values.size < 2) return@Canvas
        val min = values.min(); val max = values.max(); val span = (max - min).takeIf { it > 0 } ?: 1.0
        val path = Path()
        values.forEachIndexed { i, v ->
            val x = i / (values.size - 1f) * size.width
            val y = (1 - ((v - min) / span)).toFloat() * (size.height - 4f) + 2f
            if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        drawPath(path, if (up) OmColors.Success else OmColors.Error, style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round))
    }
}

/* 15.1.0: the curve is drawn from left to right when it first appears (and when the period changes); a finger moving along it shows a cursor, a dot on the
   curve and a light tick for every point it passes — [onScrub] receives the index (null when the finger lifts) so the screen can show that point's
   figure in its header. Only horizontal drags are taken, so the page still scrolls vertically. Nothing is invented: the points are the real closes. */
@Composable
fun AreaChart(values: List<Double>, modifier: Modifier = Modifier, lineColor: Color = OmColors.Blue600, onScrub: ((Int?) -> Unit)? = null) {
    val reduced = LocalOmMotion.current.reduced
    val haptics = rememberOmHaptics()
    val reveal = remember { Animatable(if (reduced) 1f else 0f) }
    LaunchedEffect(values.size, values.firstOrNull(), reduced) {
        if (reduced) { reveal.snapTo(1f); return@LaunchedEffect }
        reveal.snapTo(0f); reveal.animateTo(1f, tween(750, easing = FastOutSlowInEasing))
    }
    var cursor by remember { mutableStateOf<Int?>(null) }
    val cursorA by animateFloatAsState(if (cursor != null) 1f else 0f, tween(140), label = "cursor")
    var width by remember { mutableStateOf(1f) }
    fun at(x: Float) {
        if (values.size < 2) return
        val i = Math.round(x / width * (values.size - 1)).coerceIn(0, values.size - 1)
        if (i != cursor) { cursor = i; haptics.tick(); onScrub?.invoke(i) }
    }
    fun lift() { if (cursor != null) { cursor = null; onScrub?.invoke(null) } }
    Canvas(
        modifier.onSizeChanged { width = it.width.toFloat().coerceAtLeast(1f) }
            .pointerInput(values.size) {
                detectHorizontalDragGestures(onDragStart = { at(it.x) }, onDragEnd = { lift() }, onDragCancel = { lift() }) { change, _ -> change.consume(); at(change.position.x) }
            },
    ) {
        if (values.size < 2) return@Canvas
        val min = values.min(); val max = values.max(); val span = (max - min).takeIf { it > 0 } ?: 1.0
        val pts = values.mapIndexed { i, v -> Offset(i / (values.size - 1f) * size.width, (1 - ((v - min) / span)).toFloat() * (size.height - 8f) + 4f) }
        val line = Path().apply { pts.forEachIndexed { i, p -> if (i == 0) moveTo(p.x, p.y) else lineTo(p.x, p.y) } }
        val area = Path().apply { addPath(line); lineTo(size.width, size.height); lineTo(0f, size.height); close() }
        val head = reveal.value
        clipRect(right = size.width * head) {
            drawPath(area, Brush.verticalGradient(listOf(lineColor.copy(alpha = 0.22f), Color.Transparent)))
            drawPath(line, lineColor, style = Stroke(width = 2.2.dp.toPx(), cap = StrokeCap.Round))
        }
        if (head in 0.01f..0.99f) {                                                    // the pen that draws the curve
            val f = head * (pts.size - 1); val a = pts[f.toInt().coerceIn(0, pts.size - 1)]; val b = pts[(f.toInt() + 1).coerceIn(0, pts.size - 1)]
            val k = f - f.toInt(); val pen = Offset(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k)
            drawCircle(lineColor.copy(alpha = 0.25f), 8.dp.toPx(), pen); drawCircle(lineColor, 3.dp.toPx(), pen)
        }
        cursor?.let { i ->
            val p = pts[i.coerceIn(0, pts.size - 1)]
            drawLine(lineColor.copy(alpha = 0.55f * cursorA), Offset(p.x, 0f), Offset(p.x, size.height), 1.dp.toPx())
            drawCircle(lineColor.copy(alpha = 0.25f * cursorA), 10.dp.toPx(), p)
            drawCircle(OmColors.Surface, 5.5.dp.toPx(), p)
            drawCircle(lineColor, 3.8.dp.toPx(), p)
        }
    }
}

/* A field label + the error under the field (no popup for field errors). */
@Composable
fun FieldError(text: String?) {
    AnimatedVisibility(visible = !text.isNullOrBlank(), enter = fadeIn(OmSprings.fade()), exit = fadeOut(OmSprings.fade())) {
        Text(text.orEmpty(), style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold), color = OmColors.Error, modifier = Modifier.padding(top = 4.dp, start = 4.dp))
    }
}

val ContentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)

/* OM Wallet line icons (original drawings, res/drawable/ic_om_*.xml); directional ones mirror automatically in Arabic (RTL). */
object OmIcons {
    val Home = R.drawable.ic_om_home; val Wallet = R.drawable.ic_om_wallet; val Chart = R.drawable.ic_om_chart; val Activity = R.drawable.ic_om_activity
    val User = R.drawable.ic_om_user; val Deposit = R.drawable.ic_om_arrow_down; val Withdraw = R.drawable.ic_om_arrow_up; val Coin = R.drawable.ic_om_coin
    val Eye = R.drawable.ic_om_eye; val EyeOff = R.drawable.ic_om_eye_off; val Star = R.drawable.ic_om_star; val StarFilled = R.drawable.ic_om_star_filled
    val Swap = R.drawable.ic_om_swap; val Trend = R.drawable.ic_om_trend
    val Send = R.drawable.ic_om_send; val Copy = R.drawable.ic_om_copy; val Back = R.drawable.ic_om_back; val Chevron = R.drawable.ic_om_chevron
    val Shield = R.drawable.ic_om_shield; val Share = R.drawable.ic_om_share; val Refresh = R.drawable.ic_om_refresh; val Close = R.drawable.ic_om_close
    val Menu = R.drawable.ic_om_menu
    val Logout = R.drawable.ic_om_logout; val Mail = R.drawable.ic_om_mail; val Lock = R.drawable.ic_om_lock; val Globe = R.drawable.ic_om_globe
}

@Composable
fun OmIcon(@DrawableRes res: Int, contentDescription: String?, modifier: Modifier = Modifier, tint: Color = OmColors.Ink, size: Dp = 22.dp) {
    androidx.compose.material3.Icon(painterResource(res), contentDescription, modifier.size(size), tint = tint)
}
