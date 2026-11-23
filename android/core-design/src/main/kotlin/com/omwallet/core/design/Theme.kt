package com.omwallet.core.design

import android.provider.Settings
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
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
   Material 3 surfaces as the technical base, OM Wallet's white / sky-blue glass as the visual layer.
   ============================================================ */
object OmColors {
    val Surface = Color(0xFFF3F8FE)
    val SurfaceBright = Color(0xFFFFFFFF)
    val GlassWhite = Color(0x94FFFFFF)        // rgba(255,255,255,0.58) — owner references
    val GlassStrong = Color(0xC7FFFFFF)       // rgba(255,255,255,0.78)
    val Sky100 = Color(0xFFE3F0FD)
    val Sky300 = Color(0xFFBFE3FF)
    val Sky500 = Color(0xFF55B9FF)
    val Blue600 = Color(0xFF1A84F5)
    val Blue700 = Color(0xFF0E6BEA)
    val SkyGlow = Color(0xFF5CC0FF)
    val Ink = Color(0xFF0E1B3D)
    val InkSecondary = Color(0xFF5E6E87)
    val Success = Color(0xFF1FAF72)
    val Warning = Color(0xFFE5A332)
    val Error = Color(0xFFD94F5B)
    val Hairline = Color(0x1A637483)
    val Sheet = Color(0xF7FFFFFF)              // sheets / dialogs: almost opaque, the content behind never competes with the text
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

private val OmColorScheme: ColorScheme = lightColorScheme(
    primary = OmColors.Blue600, onPrimary = Color.White,
    primaryContainer = OmColors.Sky100, onPrimaryContainer = OmColors.Ink,
    secondary = OmColors.Sky500, onSecondary = Color.White,
    background = OmColors.Surface, onBackground = OmColors.Ink,
    surface = OmColors.Surface, onSurface = OmColors.Ink,
    surfaceVariant = OmColors.Sky100, onSurfaceVariant = OmColors.InkSecondary,
    surfaceContainerLowest = OmColors.SurfaceBright, surfaceContainerLow = Color(0xFFF2F8FD),
    surfaceContainer = Color(0xFFEAF4FB), surfaceContainerHigh = Color(0xFFE2EFF8),
    outline = Color(0x33637483), outlineVariant = OmColors.Hairline,
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
