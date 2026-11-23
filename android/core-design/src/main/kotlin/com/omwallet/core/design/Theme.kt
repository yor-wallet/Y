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
   Material 3 surfaces as the technical base; 14.5.0: transparent glass over a luminous blue (no white surfaces).
   ============================================================ */
object OmColors {
    /* 14.5.0 « Verre » — the owner: « une interface glass transparente, pas blanc qui fait mal aux yeux ». Every surface is transparent
       glass over a luminous blue; text is light. Token NAMES are unchanged, so every screen follows without being rewritten. */
    val Surface = Color(0xFF1A6FE6)            // page blue (top of the gradient)
    val SurfaceBright = Color(0x2EFFFFFF)      // glass fill 18 %
    val GlassWhite = Color(0x21FFFFFF)         // glass 13 %
    val GlassStrong = Color(0x30FFFFFF)        // glass 19 %
    val Sky100 = Color(0x26FFFFFF)             // light glass (chips, tracks)
    val Sky300 = Color(0x4DFFFFFF)             // glass edge
    val Sky500 = Color(0xFF86D6FF)
    val Blue600 = Color(0xFFA6E1FF)            // accent for text and icons on the blue (readable)
    val Blue700 = Color(0xFF1A70EC)
    val SkyGlow = Color(0xFF8DE0FF)
    val Ink = Color(0xFFFFFFFF)
    val InkSecondary = Color(0xD1EAF3FF)
    val Success = Color(0xFF45E39A)
    val Warning = Color(0xFFFFC766)
    val Error = Color(0xFFFF7D89)
    val Hairline = Color(0x26FFFFFF)
    val Sheet = Color(0xF51A5FD0)              // sheets / dialogs: nearly opaque blue glass, the content behind never competes with the text
    val PageMid = Color(0xFF1153C8)
    val PageBottom = Color(0xFF0A3591)
    val GradTop = Color(0xFF8DE0FF)            // primary button: luminous sky → blue
    val GradMid = Color(0xFF3EA8FF)
    val GradBottom = Color(0xFF1A70EC)
    val Edge = Color(0x4DFFFFFF)               // 1 dp light edge of every glass surface
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
    primary = OmColors.GradMid, onPrimary = Color.White,
    primaryContainer = OmColors.Sky100, onPrimaryContainer = OmColors.Ink,
    secondary = OmColors.Sky500, onSecondary = Color(0xFF04204F),
    background = OmColors.Surface, onBackground = OmColors.Ink,
    surface = OmColors.Surface, onSurface = OmColors.Ink,
    surfaceVariant = OmColors.Sky100, onSurfaceVariant = OmColors.InkSecondary,
    surfaceContainerLowest = Color(0xFF1660D6), surfaceContainerLow = Color(0xFF1A66DA),
    surfaceContainer = Color(0xFF1E6CDE), surfaceContainerHigh = Color(0xFF2473E2), surfaceContainerHighest = Color(0xFF2A7AE6),
    outline = OmColors.Edge, outlineVariant = OmColors.Hairline,
    error = OmColors.Error, onError = Color(0xFF3A0610),
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
