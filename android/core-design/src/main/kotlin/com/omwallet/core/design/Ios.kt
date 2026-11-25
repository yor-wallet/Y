package com.omwallet.core.design

import androidx.annotation.DrawableRes
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/* ==========================================================================================================================
   15.3.0 — « comme les Réglages de l'iPhone » (owner, 25/11: the settings and all the buttons like the iPhone's; the whole interface more
   professional, more precise motion, above all the fonts). The same vocabulary as the web (css/ios.css):
   · an inset grouped list (IosGroup) of rows (IosRow): 52 dp, a 30 dp rounded-square icon tile in a colour per kind of setting, 17 sp regular title,
     13 sp secondary subtitle, a thin tertiary chevron, a hairline between rows inset to where the text starts;
   · a row is highlighted at once when touched and fades back (it does not shrink), like a UITableViewCell;
   · IosSwitch: UISwitch geometry (51 × 31, a 27 dp knob), a spring for the knob, the knob stretching by 6 dp while the finger is down;
   · section headers / footers, a red destructive row. Colours: black and yellow (no blue); tile colours from iOS minus its blues.
   ========================================================================================================================== */
object IosColors {
    val Group = OmColors.Card
    val Separator = Color(0x94545046)          // rgba(84,80,70,.58)
    val Press = Color(0x12FFFFFF)              // the highlight of a touched row
    val Fill = Color(0x52787880)               // switch track off, round buttons
    val Chevron = Color(0x4DEBEBF5)            // tertiary label
    val Yellow = OmColors.Blue600              // the brand yellow (token name kept)
    val Green = Color(0xFF30D158)
    val Orange = Color(0xFFFF9F0A)
    val Red = Color(0xFFFF453A)
    val Gray = Color(0xFF8E8E93)
    val Brown = Color(0xFFA2845E)
}

private val GroupShape = RoundedCornerShape(22.dp)
private val TileShape = RoundedCornerShape(8.dp)
internal val RowTextStart = 58.dp           // 16 padding + 30 tile + 12 gap: where the hairline starts

/** An inset grouped section: the rows sit on one rounded card. */
@Composable
fun IosGroup(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(modifier.fillMaxWidth().padding(horizontal = 16.dp).clip(GroupShape).background(IosColors.Group), content = content)
}

/** Section header (iOS: footnote, secondary, uppercase except in Arabic) — 32 dp from the screen edge, aligned with the rows' text. */
@Composable
fun IosSectionHeader(text: String, modifier: Modifier = Modifier) {
    val arabic = LocalLayoutDirection.current == LayoutDirection.Rtl
    Text(if (arabic) text else text.uppercase(), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary,
        modifier = modifier.fillMaxWidth().padding(start = 32.dp, end = 32.dp, top = 22.dp, bottom = 7.dp))
}

/** Section footer note. */
@Composable
fun IosFooter(text: String, modifier: Modifier = Modifier) {
    Text(text, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = modifier.fillMaxWidth().padding(start = 32.dp, end = 32.dp, top = 7.dp))
}

/** The 30 dp rounded-square icon tile; a white glyph, a dark one on yellow. */
@Composable
fun IosTile(@DrawableRes icon: Int, color: Color, modifier: Modifier = Modifier) {
    val glyph = if (color == IosColors.Yellow) OmColors.OnAccent else Color.White
    Box(modifier.size(30.dp).clip(TileShape).background(color), contentAlignment = Alignment.Center) { OmIcon(icon, null, tint = glyph, size = 18.dp) }
}

/** The disclosure chevron of a row (thin, tertiary). */
@Composable
fun IosChevron() = OmIcon(OmIcons.Chevron, null, tint = IosColors.Chevron, size = 16.dp)

/* the press highlight of a row: on at once, fades back in 320 ms */
@Composable
private fun rowHighlight(source: MutableInteractionSource): Color {
    val pressed by source.collectIsPressedAsState()
    val c by animateColorAsState(if (pressed) IosColors.Press else Color.Transparent, if (pressed) snap() else tween(320), label = "row-press")
    return c
}

/* the hairline at the top of a row (not the first one of its group), inset to where the text starts; mirrored in right to left */
private fun Modifier.topHairline(show: Boolean, start: androidx.compose.ui.unit.Dp, rtl: Boolean): Modifier = if (!show) this else drawBehind {
    val s = start.toPx(); val y = 0.25.dp.toPx()
    if (rtl) drawLine(IosColors.Separator, Offset(0f, y), Offset(size.width - s, y), 0.5.dp.toPx())
    else drawLine(IosColors.Separator, Offset(s, y), Offset(size.width, y), 0.5.dp.toPx())
}

/**
 * A settings row. [icon] + [tile]: the coloured tile (none: the text starts at 16 dp). [value]: the current choice, secondary, before the chevron.
 * [checked] not null: an [IosSwitch] at the end and the whole row toggles it. [chevron]: a disclosure indicator. [divider]: the hairline above (all rows but the first).
 */
@Composable
fun IosRow(
    title: String, modifier: Modifier = Modifier, subtitle: String? = null, value: String? = null,
    @DrawableRes icon: Int? = null, tile: Color = IosColors.Yellow, chevron: Boolean = false, divider: Boolean = false,
    checked: Boolean? = null, onCheckedChange: ((Boolean) -> Unit)? = null, titleColor: Color = OmColors.Ink, centered: Boolean = false,
    trailing: (@Composable () -> Unit)? = null, onClick: (() -> Unit)? = null,
) {
    val haptics = rememberOmHaptics()
    val source = remember { MutableInteractionSource() }
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val interactive = when {
        checked != null && onCheckedChange != null -> Modifier.toggleable(value = checked, interactionSource = source, indication = null, role = Role.Switch) { haptics.tap(); onCheckedChange(it) }
        onClick != null -> Modifier.clickable(interactionSource = source, indication = null, role = Role.Button) { haptics.tap(); onClick() }
        else -> Modifier
    }
    Row(
        modifier.fillMaxWidth().heightIn(min = 52.dp).topHairline(divider, if (icon != null) RowTextStart else 16.dp, rtl)
            .then(interactive).background(rowHighlight(source)).padding(horizontal = 16.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (icon != null) IosTile(icon, tile)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(title, style = MaterialTheme.typography.bodyLarge, color = titleColor, maxLines = 2, overflow = TextOverflow.Ellipsis,
                textAlign = if (centered) TextAlign.Center else null, modifier = if (centered) Modifier.fillMaxWidth() else Modifier)
            if (subtitle != null) Text(subtitle, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
        }
        if (value != null) Text(value, style = MaterialTheme.typography.bodyLarge, color = OmColors.InkSecondary, maxLines = 1)
        trailing?.invoke()
        if (checked != null) IosSwitch(checked, onCheckedChange = null, pressedSource = source)
        if (chevron) IosChevron()
    }
}

/**
 * UISwitch. [onCheckedChange] null: drawn only (the row toggles it, and its [pressedSource] makes the knob stretch while the row is touched).
 * The knob rides a spring (a hint of overshoot), stretches by 6 dp towards the middle while pressed; the track colour cross-fades.
 * Under « remove animations » it jumps.
 */
@Composable
fun IosSwitch(checked: Boolean, onCheckedChange: ((Boolean) -> Unit)?, modifier: Modifier = Modifier, enabled: Boolean = true, pressedSource: MutableInteractionSource? = null) {
    val reduced = LocalOmMotion.current.reduced
    val haptics = rememberOmHaptics()
    val own = remember { MutableInteractionSource() }
    val source = pressedSource ?: own
    val pressed by source.collectIsPressedAsState()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val pos by animateFloatAsState(if (checked) 1f else 0f, if (reduced) snap() else spring(dampingRatio = 0.78f, stiffness = 520f), label = "knob")
    val stretch by animateFloatAsState(if (pressed && !reduced && enabled) 1f else 0f, if (reduced) snap() else tween(160), label = "stretch")
    val track by animateColorAsState(if (checked) IosColors.Yellow else IosColors.Fill, if (reduced) snap() else tween(250), label = "track")
    val toggle = if (onCheckedChange != null) Modifier.minimumInteractiveComponentSize()
        .toggleable(value = checked, enabled = enabled, interactionSource = own, indication = null, role = Role.Switch) { haptics.tap(); onCheckedChange(it) } else Modifier
    Box(
        modifier.then(toggle).size(51.dp, 31.dp).drawBehind {
            val r = size.height / 2f
            drawRoundRect(track, cornerRadius = CornerRadius(r, r))
            val inset = 2.dp.toPx(); val kh = 27.dp.toPx(); val kw = kh + 6.dp.toPx() * stretch
            val travel = size.width - 2 * inset - kw
            var x = inset + travel * pos
            if (rtl) x = size.width - x - kw
            drawIntoCanvas { c ->
                val p = Paint().asFrameworkPaint().apply {
                    isAntiAlias = true; color = Color.White.toArgb()
                    setShadowLayer(3.dp.toPx(), 0f, 1.5.dp.toPx(), Color(0x33000000).toArgb())
                }
                c.nativeCanvas.drawRoundRect(x, inset, x + kw, inset + kh, kh / 2f, kh / 2f, p)
            }
            if (!enabled) drawRoundRect(Color(0x66000000), cornerRadius = CornerRadius(r, r))
        },
    )
}

/** A large title (iOS Large Title: 34 / 41 sp, bold) at the start of the page. */
@Composable
fun IosLargeTitle(text: String, modifier: Modifier = Modifier) {
    val arabic = LocalLayoutDirection.current == LayoutDirection.Rtl
    Text(text, style = MaterialTheme.typography.displaySmall.copy(fontSize = 34.sp, lineHeight = if (arabic) 45.sp else 41.sp, letterSpacing = if (arabic) 0.sp else interTracking(34f).sp),
        color = OmColors.Ink, modifier = modifier.fillMaxWidth().padding(horizontal = 20.dp))
}

/** Space between two groups. */
@Composable
fun IosGap() = Spacer(Modifier.height(22.dp))
