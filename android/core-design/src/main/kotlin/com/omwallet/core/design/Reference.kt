package com.omwallet.core.design

import androidx.annotation.DrawableRes
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/* Building blocks taken from the owner's reference screens (home, settings, « my assets »). Appearance only: every block calls the
   action it is given; nothing here knows what an action does. Ambient motion (the floating emblem) never runs under « remove animations ». */

/* The OM Wallet word mark heading a page (logo used as a logo). */
@Composable
fun BrandLockup(modifier: Modifier = Modifier, height: Dp = 40.dp) {
    Image(painterResource(R.drawable.om_logo_lockup), "OM Wallet", modifier.height(height))
}

/* Glass square / round control (back, search, avatar), as in the references. */
@Composable
fun GlassSquare(@DrawableRes icon: Int, description: String, modifier: Modifier = Modifier, round: Boolean = false, onClick: () -> Unit) {
    val shape = if (round) CircleShape else RoundedCornerShape(18.dp)
    Box(
        modifier.size(50.dp).shadow(10.dp, shape, ambientColor = Color(0x33145AB4), spotColor = Color(0x55145AB4)).clip(shape)
            .background(Brush.linearGradient(listOf(Color(0x3DFFFFFF), Color(0x14FFFFFF)))).glassSheen().border(1.dp, OmGlass.Rim, shape)
            .pressable(grow = true, onClick = onClick).semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) { OmIcon(icon, null, tint = OmColors.Ink, size = 22.dp) }
}

/* Large centred page title between two equal sides (settings / assets references). */
@Composable
fun ReferenceTitle(title: String, modifier: Modifier = Modifier, start: (@Composable () -> Unit)? = null, end: (@Composable () -> Unit)? = null) {
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.width(50.dp)) { start?.invoke() }
        Text(title, style = MaterialTheme.typography.displaySmall, color = OmColors.Ink, textAlign = TextAlign.Center, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
        Box(Modifier.width(50.dp)) { end?.invoke() }
    }
}

/* Square action tile; the first one of a row is filled blue (home reference). */
@Composable
fun ActionTile(@DrawableRes icon: Int, label: String, modifier: Modifier = Modifier, primary: Boolean = false, onClick: () -> Unit) {
    val shape = RoundedCornerShape(24.dp)
    Column(
        modifier.aspectRatio(0.92f).shadow(if (primary) 18.dp else 12.dp, shape, ambientColor = Color(if (primary) 0x661677F2 else 0x33145AB4), spotColor = Color(if (primary) 0x991677F2 else 0x55145AB4))
            .clip(shape)
            .background(if (primary) Brush.verticalGradient(listOf(OmColors.GradTop, OmColors.GradMid, OmColors.GradBottom)) else Brush.linearGradient(listOf(Color(0x3DFFFFFF), Color(0x14FFFFFF))))
            .glassSheen(if (primary) 1.4f else 1f)
            .border(1.dp, if (primary) OmGlass.RimStrong else OmGlass.Rim, shape)
            .pressable(onClick = onClick).padding(6.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center,
    ) {
        OmIcon(icon, null, tint = if (primary) Color.White else OmColors.Blue600, size = 26.dp)
        Spacer(Modifier.height(8.dp))
        Text(label, style = MaterialTheme.typography.labelMedium, color = if (primary) Color.White else OmColors.Ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/* The glass app icon used as the balance card emblem; it floats gently unless motion is reduced. */
@Composable
fun GlassEmblem(modifier: Modifier = Modifier, size: Dp = 84.dp) {
    val reduced = LocalOmMotion.current.reduced
    val lift = if (reduced) 0f else {
        val t = rememberInfiniteTransition(label = "float")
        val v by t.animateFloat(0f, 1f, infiniteRepeatable(tween(3000), RepeatMode.Reverse), label = "lift"); v
    }
    /* the icon file has light square corners: crop slightly and round them so only the glass tile shows */
    Image(painterResource(R.drawable.om_glass_icon), null, modifier.size(size).graphicsLayer { translationY = -6.dp.toPx() * lift; rotationZ = -6f + 3f * lift }
        .clip(RoundedCornerShape(percent = 26)), contentScale = androidx.compose.ui.layout.ContentScale.Crop, alignment = Alignment.Center, colorFilter = null)
}

/* Glass wallet illustration of the « my assets » reference, edges faded into the card. */
@Composable
fun WalletArt(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxWidth(0.62f).aspectRatio(338f / 295f)) {
        /* the photo's light edges fade to transparent, so only the glass wallet shows on the blue (no white box) */
        Image(painterResource(R.drawable.om_wallet_glass), null, Modifier.matchParentSizeCompat()
            .graphicsLayer { compositingStrategy = androidx.compose.ui.graphics.CompositingStrategy.Offscreen }
            .drawWithContent { drawContent(); drawRect(Brush.radialGradient(0.40f to Color.Black, 0.70f to Color(0x88000000), 0.96f to Color.Transparent), blendMode = androidx.compose.ui.graphics.BlendMode.DstIn) })
    }
}
private fun Modifier.matchParentSizeCompat() = this.fillMaxWidth().aspectRatio(338f / 295f)

/* Settings-style row: glass tile, bold label, optional value, chevron (settings reference). */
@Composable
fun ReferenceRow(@DrawableRes icon: Int, label: String, modifier: Modifier = Modifier, value: String? = null, role: Role = Role.Button, onClick: () -> Unit) {
    Row(modifier.fillMaxWidth().heightIn(min = 72.dp).pressable(role = role, onClick = onClick).padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        GlassTile(icon)
        Column(Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.titleLarge, color = OmColors.Ink)
            if (value != null) Text(value, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
        }
        OmIcon(OmIcons.Chevron, null, tint = OmColors.InkSecondary, size = 18.dp)
    }
}

/* Page header used by every inner screen (settings / assets references): the logo on its own line, then a large centred title between
   a glass back square (when the page has a parent) and an optional trailing control. */
@Composable
fun RefHeader(title: String, onBack: (() -> Unit)? = null, backDescription: String = "", trailing: (@Composable () -> Unit)? = null, below: (@Composable () -> Unit)? = null) {
    Column(Modifier.androidx_statusBars().padding(horizontal = 16.dp, vertical = 6.dp), verticalArrangement = Arrangement.spacedBy(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Row(Modifier.fillMaxWidth()) { BrandLockup(height = 36.dp) }
        ReferenceTitle(title, start = onBack?.let { { GlassSquare(OmIcons.Back, backDescription, onClick = it) } }, end = trailing)
        below?.invoke()
    }
}
private fun Modifier.androidx_statusBars() = this.statusBarsPadding()
