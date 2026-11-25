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
fun LogoMark(modifier: Modifier = Modifier, size: Dp = 34.dp) {
    /* the app icon alone (logo kept on every screen, at the owner's request) */
    Image(painterResource(R.drawable.om_glass_icon), "OM Wallet", modifier.size(size).clip(RoundedCornerShape(percent = 26)), contentScale = androidx.compose.ui.layout.ContentScale.Crop)
}

@Composable
fun BrandLockup(modifier: Modifier = Modifier, height: Dp = 40.dp) {
    Image(painterResource(R.drawable.om_logo_lockup), "OM Wallet", modifier.height(height))
}

/* Round header control (back, menu, avatar) — 14.8.0: a dark grey circle with a light line icon. */
@Composable
fun GlassSquare(@DrawableRes icon: Int, description: String, modifier: Modifier = Modifier, round: Boolean = false, onClick: () -> Unit) {
    val shape = CircleShape
    Box(
        modifier.size(46.dp).clip(shape).background(OmColors.Track)
            .pressable(onClick = onClick).semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) { OmIcon(icon, null, tint = OmColors.Ink, size = 22.dp) }
}

/* Large centred page title between two equal sides (settings / assets references). */
@Composable
fun ReferenceTitle(title: String, modifier: Modifier = Modifier, start: (@Composable () -> Unit)? = null, end: (@Composable () -> Unit)? = null) {
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.width(46.dp)) { start?.invoke() }
        Text(title, style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink, textAlign = TextAlign.Center, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
        Box(Modifier.width(46.dp), contentAlignment = Alignment.CenterEnd) { end?.invoke() }
    }
}

/* Round action (14.8.0, Liv X style): a dark circle with a yellow line icon and a hairline edge, the label under it.
   `primary` fills the circle with the yellow (dark icon on it). */
@Composable
fun ActionTile(@DrawableRes icon: Int, label: String, modifier: Modifier = Modifier, primary: Boolean = false, onClick: () -> Unit) {
    Column(modifier.clip(RoundedCornerShape(18.dp)).pressable(onClick = onClick).padding(vertical = 4.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            Modifier.size(60.dp).clip(CircleShape).background(if (primary) OmColors.Blue600 else OmColors.Track)
                .border(1.dp, if (primary) Color.Transparent else OmColors.Edge, CircleShape),
            contentAlignment = Alignment.Center,
        ) { OmIcon(icon, null, tint = if (primary) OmColors.OnAccent else OmColors.Blue600, size = 24.dp) }
        Spacer(Modifier.height(8.dp))
        Text(label, style = MaterialTheme.typography.labelMedium.copy(fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold), color = OmColors.Ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
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
        /* the photo's light edges fade to transparent, so only the glass wallet shows on the blue (no white box).
           14.5.3: the fade is baked into the image (transparent WebP) instead of an off-screen layer with a blend mode on every
           frame — cheaper, and identical on every device (the run-time mask could show a black square on some renderers). */
        Image(painterResource(R.drawable.om_wallet_glass), null, Modifier.matchParentSizeCompat())
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

/* Page header used by every inner screen — 14.7.0 (owner's reference image): back control, centred bold title, trailing control.
   The app logo stays on every screen (owner's rule): small, on the trailing side when the page has no control of its own. */
@Composable
fun RefHeader(title: String, onBack: (() -> Unit)? = null, backDescription: String = "", trailing: (@Composable () -> Unit)? = null, below: (@Composable () -> Unit)? = null) {
    Column(Modifier.androidx_statusBars().padding(horizontal = 16.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        ReferenceTitle(title, start = onBack?.let { { GlassSquare(OmIcons.Back, backDescription, onClick = it) } }, end = trailing ?: { LogoMark() })
        below?.invoke()
    }
}
private fun Modifier.androidx_statusBars() = this.statusBarsPadding()
