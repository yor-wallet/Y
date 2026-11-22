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
    val Surface = Color(0xFFF7FBFF)
    val SurfaceBright = Color(0xFFFFFFFF)
    val GlassWhite = Color(0xB8FFFFFF)        // rgba(255,255,255,0.72)
    val GlassStrong = Color(0xDBFFFFFF)       // rgba(255,255,255,0.86)
    val Sky100 = Color(0xFFDDF4FF)
    val Sky300 = Color(0xFFA8DFFF)
    val Sky500 = Color(0xFF63C3F2)
    val Blue600 = Color(0xFF2E9CD3)
    val Ink = Color(0xFF102333)
    val InkSecondary = Color(0xFF637483)
    val Success = Color(0xFF1FAF72)
    val Warning = Color(0xFFE5A332)
    val Error = Color(0xFFD94F5B)
    val Hairline = Color(0x1A637483)
    val Sheet = Color(0xF7FFFFFF)              // sheets / dialogs: almost opaque, the content behind never competes with the text
}

object OmRadius { val S = 14.dp; val M = 20.dp; val L = 28.dp; val XL = 34.dp }
object OmSpace { val Base = 4.dp; val S = 8.dp; val M = 12.dp; val L = 16.dp; val XL = 24.dp; val XXL = 32.dp }

/* IBM Plex Sans Arabic (OFL) covers Arabic AND Latin (é, œ, €): one family, bundled for offline use. Android falls back to the system Noto fonts for any missing glyph. */
val OmFont = FontFamily(
    Font(R.font.ibm_plex_sans_arabic_regular, FontWeight.Normal),
    Font(R.font.ibm_plex_sans_arabic_medium, FontWeight.Medium),
    Font(R.font.ibm_plex_sans_arabic_semibold, FontWeight.SemiBold),
    Font(R.font.ibm_plex_sans_arabic_bold, FontWeight.Bold),
)

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
private fun style(size: Int, line: Int, weight: FontWeight, tracking: Double = 0.0) =
    TextStyle(fontFamily = OmFont, fontSize = size.sp, lineHeight = line.sp, fontWeight = weight, letterSpacing = tracking.sp,
        textDirection = androidx.compose.ui.text.style.TextDirection.ContentOrLtr)

val OmTypography = Typography(
    displayLarge = style(40, 46, FontWeight.Bold, -0.8),
    displaySmall = style(32, 38, FontWeight.Bold, -0.5),
    headlineMedium = style(24, 30, FontWeight.Bold, -0.2),
    headlineSmall = style(20, 26, FontWeight.SemiBold),
    titleLarge = style(18, 24, FontWeight.SemiBold),
    titleMedium = style(16, 22, FontWeight.SemiBold),
    titleSmall = style(14, 20, FontWeight.SemiBold),
    bodyLarge = style(16, 24, FontWeight.Normal),
    bodyMedium = style(14, 20, FontWeight.Normal),
    bodySmall = style(12, 16, FontWeight.Normal),
    labelLarge = style(15, 20, FontWeight.SemiBold),
    labelMedium = style(13, 18, FontWeight.Medium),
    labelSmall = style(11, 14, FontWeight.Medium, 0.2),
)

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
        MaterialTheme(colorScheme = OmColorScheme, typography = OmTypography, shapes = OmShapes, content = content)
    }
}
