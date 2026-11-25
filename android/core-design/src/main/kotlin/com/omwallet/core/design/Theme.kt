package com.omwallet.core.design

import android.provider.Settings
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/* ============================================================
   OM GLASS — design tokens (cahier OM Wallet Android).
   Material 3 surfaces as the technical base; 14.8.0: black page, dark grey cards, yellow accent (Liv X / Binance).
   ============================================================ */
object OmColors {
    /* 14.8.0 « Noir & Jaune » — the owner (24/11): yellow and black like Liv X (Emirates NBD) and Binance. A warm near-black page, dark grey
       cards, ONE vivid yellow for the most important thing on a screen (primary button, active tab, active segment, centre button) with dark
       text ON the yellow, green / red for gains / losses. Token NAMES are unchanged, so every screen follows without being rewritten. */
    val Surface = Color(0xFF0B0A07)            // page
    val SurfaceBright = Color(0xFF1B1A16)      // card fill
    val GlassWhite = Color(0xFF1B1A16)         // soft card
    val GlassStrong = Color(0xFF25231E)        // stronger card
    val Sky100 = Color(0xFF25231E)             // chips, tracks
    val Sky300 = Color(0xFF3A372D)             // edges, disabled fill
    val Sky500 = Color(0xFFFFD84A)             // light accent
    val Blue600 = Color(0xFFFFC800)            // THE accent (links, icons, selected states, fills)
    val Blue700 = Color(0xFFF5B800)            // pressed accent
    val SkyGlow = Color(0xFFFFD84A)
    val Ink = Color(0xFFF5F3EE)                // text
    val InkSecondary = Color(0xFFB0AC9F)       // secondary text (≥ 4.5:1 on every dark surface)
    val Success = Color(0xFF0ECB81)
    val Warning = Color(0xFFFFB020)
    val Error = Color(0xFFFF5A6E)               // loss / error (≥ 4.5:1 on the loss chip)
    val Hairline = Color(0xFF2F2D26)
    val Sheet = Color(0xFF1B1A16)
    val PageMid = Color(0xFF0B0A07)
    val PageBottom = Color(0xFF0B0A07)
    val GradTop = Color(0xFFFFD84A)            // primary button: yellow
    val GradMid = Color(0xFFFFC800)
    val GradBottom = Color(0xFFF5B800)
    val Edge = Color(0xFF2F2D26)               // 1 dp edge of cards
    val Card = Color(0xFF1B1A16)               // dark grey card on the black page
    val Track = Color(0xFF25231E)              // field / segmented track / round buttons
    val AccentSoft = Color(0xFF2B2410)         // yellow-tinted dark fill (secondary buttons, selected chips)
    val Header = Color(0xFF0B0A07)
    val OnHeader = Color(0xFFF5F3EE)
    val OnAccent = Color(0xFF14110A)           // text and icons ON the yellow
    val Nav = Color(0xFF12110D)                // bottom bar
    val ChipUp = Color(0xFF0E2E23)             // gain chip fill
    val ChipDown = Color(0xFF35151B)           // loss chip fill
    val Glow = Color(0xFFFFC800)               // the soft yellow light behind the balance
}

object OmRadius { val S = 14.dp; val M = 20.dp; val L = 28.dp; val XL = 34.dp }
object OmSpace { val Base = 4.dp; val S = 8.dp; val M = 12.dp; val L = 16.dp; val XL = 24.dp; val XXL = 32.dp }

/* 14.4.0 — Sora for Latin text and figures, Tajawal for Arabic (both OFL, bundled for offline use). The theme picks the family from the
   app language, so Arabic screens never fall back to a system font. */
val OmLatinFont = FontFamily(
    Font(R.font.sora_regular, FontWeight.Normal), Font(R.font.sora_medium, FontWeight.Medium),
    Font(R.font.sora_semibold, FontWeight.SemiBold), Font(R.font.sora_bold, FontWeight.Bold), Font(R.font.sora_bold, FontWeight.ExtraBold),
)
val OmArabicFont = FontFamily(
    Font(R.font.tajawal_regular, FontWeight.Normal), Font(R.font.tajawal_medium, FontWeight.Medium),
    Font(R.font.tajawal_bold, FontWeight.SemiBold), Font(R.font.tajawal_bold, FontWeight.Bold), Font(R.font.tajawal_extrabold, FontWeight.ExtraBold),
)
val OmFont = OmLatinFont

private val OmColorScheme: ColorScheme = darkColorScheme(
    primary = OmColors.Blue600, onPrimary = OmColors.OnAccent,
    primaryContainer = OmColors.AccentSoft, onPrimaryContainer = OmColors.Blue600,
    secondary = OmColors.Sky500, onSecondary = OmColors.OnAccent,
    background = OmColors.Surface, onBackground = OmColors.Ink,
    surface = OmColors.Surface, onSurface = OmColors.Ink,
    surfaceVariant = OmColors.Card, onSurfaceVariant = OmColors.InkSecondary,
    surfaceContainerLowest = OmColors.Surface, surfaceContainerLow = Color(0xFF14130F),
    surfaceContainer = OmColors.Card, surfaceContainerHigh = OmColors.Track, surfaceContainerHighest = Color(0xFF2F2D26),
    outline = OmColors.Sky300, outlineVariant = OmColors.Hairline,
    error = OmColors.Error, onError = Color.White,
)

/* textDirection ContentOrLtr: Arabic sentences run right-to-left, while amounts, prices and signs ("+1.37%", "0.5 BTC") stay left-to-right
   even inside the Arabic layout — the sign is never moved to the wrong end of a number. */
private fun style(size: Int, line: Int, weight: FontWeight, tracking: Double = 0.0, family: FontFamily = OmFont) =
    TextStyle(fontFamily = family, fontSize = size.sp, lineHeight = line.sp, fontWeight = weight, letterSpacing = tracking.sp,
        textDirection = androidx.compose.ui.text.style.TextDirection.ContentOrLtr)

fun omTypography(f: FontFamily) = Typography(
    displayLarge = style(40, 46, FontWeight.ExtraBold, -0.8, f),
    displaySmall = style(32, 38, FontWeight.ExtraBold, -0.5, f),
    headlineMedium = style(26, 32, FontWeight.ExtraBold, -0.3, f),
    headlineSmall = style(20, 26, FontWeight.Bold, 0.0, f),
    titleLarge = style(18, 24, FontWeight.Bold, 0.0, f),
    titleMedium = style(16, 22, FontWeight.SemiBold, 0.0, f),
    titleSmall = style(14, 20, FontWeight.SemiBold, 0.0, f),
    bodyLarge = style(16, 24, FontWeight.Normal, 0.0, f),
    bodyMedium = style(14, 20, FontWeight.Normal, 0.0, f),
    bodySmall = style(12, 16, FontWeight.Normal, 0.0, f),
    labelLarge = style(16, 20, FontWeight.Bold, 0.0, f),
    labelMedium = style(13, 18, FontWeight.Medium, 0.0, f),
    labelSmall = style(11, 14, FontWeight.SemiBold, 0.1, f),
)
val OmTypography = omTypography(OmLatinFont)

val OmShapes = Shapes(
    small = RoundedCornerShape(OmRadius.S), medium = RoundedCornerShape(OmRadius.M),
    large = RoundedCornerShape(OmRadius.L), extraLarge = RoundedCornerShape(OmRadius.XL),
)

/* "Remove animations" (Settings › Accessibility): decorative motion is dropped, state changes stay visible. */
@Immutable data class OmMotion(val reduced: Boolean)
val LocalOmMotion = staticCompositionLocalOf { OmMotion(reduced = false) }

@Composable
fun OmTheme(reducedMotion: Boolean? = null, content: @Composable () -> Unit) {
    val context = LocalContext.current
    val reduced = reducedMotion ?: remember {
        runCatching { Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f }.getOrDefault(false)
    }
    CompositionLocalProvider(LocalOmMotion provides OmMotion(reduced)) {
        val arabic = androidx.compose.ui.platform.LocalConfiguration.current.locales[0].language == "ar"
        MaterialTheme(colorScheme = OmColorScheme, typography = if (arabic) omTypography(OmArabicFont) else OmTypography, shapes = OmShapes, content = content)
    }
}
