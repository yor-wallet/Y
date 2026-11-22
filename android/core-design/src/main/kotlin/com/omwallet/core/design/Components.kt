package com.omwallet.core.design

import androidx.annotation.DrawableRes
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
fun GlassCard(modifier: Modifier = Modifier, strong: Boolean = false, padding: Dp = OmSpace.L, fill: Boolean = true, content: @Composable ColumnScope.() -> Unit) {
    val shape = RoundedCornerShape(OmRadius.L)
    Column(
        modifier
            .then(if (fill) Modifier.fillMaxWidth() else Modifier)
            .shadow(18.dp, shape, ambientColor = Color(0x2219405A), spotColor = Color(0x2219405A))
            .clip(shape)
            .background(if (strong) OmColors.GlassStrong else OmColors.GlassWhite)
            .border(BorderStroke(1.dp, Color(0xBFFFFFFF)), shape)
            .padding(padding),
        content = content,
    )
}

/* Sky background with two very diffuse halos (login / dashboard). */
@Composable
fun SkyBackground(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(
        modifier.background(
            Brush.verticalGradient(listOf(OmColors.Sky100, OmColors.Surface, OmColors.Surface))
        )
    ) {
        Canvas(Modifier.matchParentSize()) {
            drawCircle(Brush.radialGradient(listOf(Color(0x5563C3F2), Color.Transparent), center = Offset(size.width * 0.1f, size.height * 0.05f), radius = size.width * 0.8f))
            drawCircle(Brush.radialGradient(listOf(Color(0x44A8DFFF), Color.Transparent), center = Offset(size.width * 0.95f, size.height * 0.3f), radius = size.width * 0.7f))
        }
        content()
    }
}

/* Press feedback: scale 1.00 → 0.975 and opacity → 0.90 on touch-down, soft spring back; haptic tap on click. Draw-phase only. */
@Composable
fun Modifier.pressable(enabled: Boolean = true, role: Role = Role.Button, onClick: () -> Unit): Modifier {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val reduced = LocalOmMotion.current.reduced
    val scale by animateFloatAsState(if (pressed && !reduced) 0.975f else 1f, OmSprings.press(), label = "press")
    val alpha by animateFloatAsState(if (pressed) 0.9f else 1f, OmSprings.fade(90), label = "pressAlpha")
    val haptics = rememberOmHaptics()
    return this
        .graphicsLayer { scaleX = scale; scaleY = scale; this.alpha = alpha }
        .clickable(interactionSource = source, indication = null, enabled = enabled, role = role) { haptics.tap(); onClick() }
}

@Composable
fun OmPrimaryButton(text: String, modifier: Modifier = Modifier, enabled: Boolean = true, loading: Boolean = false, onClick: () -> Unit) {
    val shape = RoundedCornerShape(OmRadius.M)
    Box(
        modifier
            .heightIn(min = 54.dp)
            .fillMaxWidth()
            .clip(shape)
            .background(if (enabled) Brush.verticalGradient(listOf(OmColors.Sky500, OmColors.Blue600)) else Brush.verticalGradient(listOf(OmColors.Sky300, OmColors.Sky300)))
            .pressable(enabled = enabled && !loading, onClick = onClick)
            .semantics { if (loading) contentDescription = text },
        contentAlignment = Alignment.Center,
    ) {
        if (loading) CircularProgressIndicator(Modifier.size(22.dp), color = Color.White, strokeWidth = 2.5.dp)
        else Text(text, style = MaterialTheme.typography.labelLarge, color = Color.White, textAlign = TextAlign.Center, modifier = Modifier.padding(horizontal = 16.dp))
    }
}

@Composable
fun OmSecondaryButton(text: String, modifier: Modifier = Modifier, enabled: Boolean = true, onClick: () -> Unit) {
    val shape = RoundedCornerShape(OmRadius.M)
    Box(
        modifier.heightIn(min = 50.dp).fillMaxWidth().clip(shape).background(OmColors.GlassStrong)
            .border(1.dp, OmColors.Sky300, shape).pressable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) { Text(text, style = MaterialTheme.typography.labelLarge, color = if (enabled) OmColors.Blue600 else OmColors.InkSecondary) }
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
    val Logout = R.drawable.ic_om_logout
}

@Composable
fun OmIcon(@DrawableRes res: Int, contentDescription: String?, modifier: Modifier = Modifier, tint: Color = OmColors.Ink, size: Dp = 22.dp) {
    androidx.compose.material3.Icon(painterResource(res), contentDescription, modifier.size(size), tint = tint)
}
