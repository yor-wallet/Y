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
    /* owner references: white-to-sky glass, a bright white rim, a soft blue shadow; the card rises into place when it first appears */
    val shape = RoundedCornerShape(OmRadius.L)
    Column(
        modifier
            .then(if (fill) Modifier.fillMaxWidth() else Modifier)
            .riseIn(rise)
            .shadow(20.dp, shape, ambientColor = Color(0x33145AB4), spotColor = Color(0x55145AB4))
            .clip(shape)
            .background(Brush.linearGradient(if (strong) listOf(Color(0xF2FFFFFF), Color(0xD9EAF5FF)) else listOf(Color(0xD1FFFFFF), Color(0x94EAF5FF))))
            .border(BorderStroke(1.dp, Color(0xF2FFFFFF)), shape)
            .padding(padding),
        content = content,
    )
}

/* Sky background with two very diffuse halos (login / dashboard). */
@Composable
fun SkyBackground(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    /* white to sky, with the two soft glass waves of the owner's references (top-left, bottom-right) */
    Box(modifier.background(Brush.verticalGradient(listOf(Color(0xFFF7FBFF), OmColors.Surface, Color(0xFFE3F0FD))))) {
        Canvas(Modifier.matchParentSize()) {
            drawCircle(Brush.radialGradient(listOf(Color(0x5A8CCDFF), Color.Transparent), center = Offset(size.width * 1.0f, 0f), radius = size.width * 0.9f))
            drawCircle(Brush.radialGradient(listOf(Color(0x4D78C3FF), Color.Transparent), center = Offset(0f, size.height), radius = size.width * 0.9f))
            drawOval(Brush.radialGradient(listOf(Color(0xF2FFFFFF), Color(0x00FFFFFF)), center = Offset(size.width * 0.05f, size.height * 0.02f), radius = size.width * 0.85f),
                topLeft = Offset(-size.width * 0.8f, -size.height * 0.28f), size = androidx.compose.ui.geometry.Size(size.width * 1.7f, size.height * 0.62f))
            drawOval(Color(0xB3FFFFFF), topLeft = Offset(-size.width * 0.8f, -size.height * 0.28f), size = androidx.compose.ui.geometry.Size(size.width * 1.7f, size.height * 0.62f), style = Stroke(width = 1.5.dp.toPx()))
            drawOval(Color(0x8CFFFFFF), topLeft = Offset(size.width * 0.35f, size.height * 0.82f), size = androidx.compose.ui.geometry.Size(size.width * 1.4f, size.height * 0.4f), style = Stroke(width = 1.5.dp.toPx()))
        }
        content()
    }
}

/* Press feedback (14.4.0): the control springs to 0.96 and a soft light blooms from the exact point the finger touched, then fades.
   Draw-phase only (graphicsLayer / drawWithContent); skipped under « remove animations ». Haptic tap on click. */
@Composable
fun Modifier.pressable(enabled: Boolean = true, role: Role = Role.Button, onClick: () -> Unit): Modifier {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val reduced = LocalOmMotion.current.reduced
    val scale by animateFloatAsState(if (pressed && !reduced) 0.96f else 1f, OmSprings.press(), label = "press")
    val glow by animateFloatAsState(if (pressed && !reduced) 1f else 0f, tween(if (pressed) 140 else 460), label = "glow")
    var at by remember { mutableStateOf(Offset.Unspecified) }
    LaunchedEffect(source) { source.interactions.collect { if (it is PressInteraction.Press) at = it.pressPosition } }
    val haptics = rememberOmHaptics()
    return this
        .graphicsLayer { scaleX = scale; scaleY = scale }
        .drawWithContent {
            drawContent()
            if (glow > 0.01f && at != Offset.Unspecified) clipRect {
                val r = size.maxDimension * (0.25f + 0.55f * glow)
                drawCircle(Brush.radialGradient(listOf(Color.White.copy(alpha = 0.5f * glow), Color.Transparent), center = at, radius = r), radius = r, center = at)
            }
        }
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
fun OmPrimaryButton(text: String, modifier: Modifier = Modifier, enabled: Boolean = true, loading: Boolean = false, onClick: () -> Unit) {
    /* gradient blue with a light sheen on the top half and a blue glow (owner references) */
    val shape = RoundedCornerShape(OmRadius.M)
    Box(
        modifier
            .heightIn(min = 58.dp)
            .fillMaxWidth()
            .shadow(if (enabled) 16.dp else 0.dp, shape, ambientColor = Color(0x661677F2), spotColor = Color(0x991677F2))
            .clip(shape)
            .background(if (enabled) Brush.verticalGradient(listOf(OmColors.SkyGlow, OmColors.Blue600, OmColors.Blue700)) else Brush.verticalGradient(listOf(OmColors.Sky300, OmColors.Sky300)))
            .drawWithContent { drawContent(); drawRect(Brush.verticalGradient(listOf(Color(0x52FFFFFF), Color.Transparent), endY = size.height * 0.55f)) }
            .border(1.dp, Color(0x59FFFFFF), shape)
            .pressable(enabled = enabled && !loading, onClick = onClick)
            .semantics { if (loading) contentDescription = text },
        contentAlignment = Alignment.Center,
    ) {
        if (loading) LoadingDots()
        else Text(text, style = MaterialTheme.typography.labelLarge, color = Color.White, textAlign = TextAlign.Center, modifier = Modifier.padding(horizontal = 16.dp))
    }
}

@Composable
fun OmSecondaryButton(text: String, modifier: Modifier = Modifier, enabled: Boolean = true, onClick: () -> Unit) {
    val shape = RoundedCornerShape(OmRadius.M)
    Box(
        modifier.heightIn(min = 54.dp).fillMaxWidth().shadow(10.dp, shape, ambientColor = Color(0x33145AB4), spotColor = Color(0x44145AB4)).clip(shape)
            .background(Brush.linearGradient(listOf(Color(0xF2FFFFFF), Color(0xBFE6F2FF)))).border(1.dp, Color(0xF2FFFFFF), shape).pressable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) { Text(text, style = MaterialTheme.typography.labelLarge, color = if (enabled) OmColors.Blue600 else OmColors.InkSecondary) }
}

/* Glass icon tile (settings / assets references): light glass square with a blue line icon. */
@Composable
fun GlassTile(@DrawableRes icon: Int, modifier: Modifier = Modifier, size: Dp = 52.dp, tint: Color = OmColors.Blue600) {
    val shape = RoundedCornerShape(16.dp)
    Box(
        modifier.size(size).shadow(8.dp, shape, ambientColor = Color(0x33145AB4), spotColor = Color(0x55145AB4)).clip(shape)
            .background(Brush.linearGradient(listOf(Color(0xFAFFFFFF), Color(0xEBE2F1FF)))).border(1.dp, Color(0xF2FFFFFF), shape),
        contentAlignment = Alignment.Center,
    ) { OmIcon(icon, null, tint = tint, size = size * 0.46f) }
}

/* Official asset / network logos (web3icons, MIT) as vector drawables: never blurry at any density. */
@Composable
fun AssetLogo(symbol: String, size: Dp = 40.dp, modifier: Modifier = Modifier) {
    val res = tokenLogo(symbol)
    Box(modifier.size(size).clip(CircleShape).background(Color.White), contentAlignment = Alignment.Center) {
        if (res != null) Image(painterResource(res), contentDescription = null, modifier = Modifier.size(size * 0.82f))
        else Text(symbol.take(3), style = MaterialTheme.typography.labelSmall, color = OmColors.InkSecondary)
    }
}

@Composable
fun NetworkLogo(network: String, size: Dp = 28.dp, modifier: Modifier = Modifier) {
    val res = networkLogo(network)
    Box(modifier.size(size).clip(RoundedCornerShape(8.dp)).background(Color.White), contentAlignment = Alignment.Center) {
        if (res != null) Image(painterResource(res), contentDescription = null, modifier = Modifier.size(size * 0.8f))
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
        ChipTone.Success -> Color(0x241FAF72) to Color(0xFF137A4F)
        ChipTone.Pending -> Color(0x29E5A332) to Color(0xFF8A5A00)
        ChipTone.Failed -> Color(0x1FD94F5B) to Color(0xFFB23542)
        ChipTone.Neutral -> Color(0x1F637483) to OmColors.InkSecondary
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
fun EmptyState(title: String, body: String, modifier: Modifier = Modifier, action: String? = null, onAction: (() -> Unit)? = null) {
    Column(modifier.fillMaxWidth().padding(vertical = 24.dp, horizontal = 12.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = OmColors.Ink, textAlign = TextAlign.Center)
        Text(body, style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary, textAlign = TextAlign.Center)
        if (action != null && onAction != null) { Spacer(Modifier.height(4.dp)); OmSecondaryButton(action, Modifier.width(220.dp), onClick = onAction) }
    }
}

@Composable
fun ErrorState(message: String, retry: String, modifier: Modifier = Modifier, onRetry: () -> Unit) =
    EmptyState(title = message, body = "", modifier = modifier, action = retry, onAction = onRetry)

/* Loading placeholder: shape only, never fake data. */
@Composable
fun SkeletonRows(count: Int = 3, modifier: Modifier = Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        repeat(count) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(40.dp).clip(CircleShape).background(OmColors.Sky100))
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Box(Modifier.fillMaxWidth(0.6f).height(12.dp).clip(RoundedCornerShape(6.dp)).background(OmColors.Sky100))
                    Box(Modifier.fillMaxWidth(0.35f).height(10.dp).clip(RoundedCornerShape(6.dp)).background(OmColors.Sky100))
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

@Composable
fun AreaChart(values: List<Double>, modifier: Modifier = Modifier, lineColor: Color = OmColors.Blue600) {
    Canvas(modifier) {
        if (values.size < 2) return@Canvas
        val min = values.min(); val max = values.max(); val span = (max - min).takeIf { it > 0 } ?: 1.0
        val pts = values.mapIndexed { i, v -> Offset(i / (values.size - 1f) * size.width, (1 - ((v - min) / span)).toFloat() * (size.height - 8f) + 4f) }
        val line = Path().apply { pts.forEachIndexed { i, p -> if (i == 0) moveTo(p.x, p.y) else lineTo(p.x, p.y) } }
        val area = Path().apply { addPath(line); lineTo(size.width, size.height); lineTo(0f, size.height); close() }
        drawPath(area, Brush.verticalGradient(listOf(lineColor.copy(alpha = 0.22f), Color.Transparent)))
        drawPath(line, lineColor, style = Stroke(width = 2.2.dp.toPx(), cap = StrokeCap.Round))
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
    val Send = R.drawable.ic_om_send; val Copy = R.drawable.ic_om_copy; val Back = R.drawable.ic_om_back; val Chevron = R.drawable.ic_om_chevron
    val Shield = R.drawable.ic_om_shield; val Share = R.drawable.ic_om_share; val Refresh = R.drawable.ic_om_refresh; val Close = R.drawable.ic_om_close
    val Logout = R.drawable.ic_om_logout; val Mail = R.drawable.ic_om_mail; val Lock = R.drawable.ic_om_lock; val Globe = R.drawable.ic_om_globe
}

@Composable
fun OmIcon(@DrawableRes res: Int, contentDescription: String?, modifier: Modifier = Modifier, tint: Color = OmColors.Ink, size: Dp = 22.dp) {
    androidx.compose.material3.Icon(painterResource(res), contentDescription, modifier.size(size), tint = tint)
}
