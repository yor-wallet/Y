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
   Material 3 surfaces as the technical base; 14.7.0: white pages, light grey cards, blue-violet accent (owner's reference image).
   ============================================================ */
object OmColors {
    /* 14.7.0 « Clair » — the owner's reference image (24/11): white pages, light grey cards, one blue-violet accent, dark text, pill buttons.
       Replaces the 14.5.0 blue glass at the owner's request. Token NAMES are unchanged, so every screen follows without being rewritten. */
    val Surface = Color(0xFFFFFFFF)            // page
    val SurfaceBright = Color(0xFFF5F6FA)      // card fill
    val GlassWhite = Color(0xFFF7F8FB)         // soft card
    val GlassStrong = Color(0xFFEEF0F6)        // stronger card
    val Sky100 = Color(0xFFF0F1F7)             // chips, tracks
    val Sky300 = Color(0xFFD9DCE8)             // edges, disabled fill
    val Sky500 = Color(0xFF8C8FFA)             // light accent
    val Blue600 = Color(0xFF5A5DF0)            // the accent (links, icons, selected states)
    val Blue700 = Color(0xFF4447D8)            // pressed accent
    val SkyGlow = Color(0xFF9EA0FF)
    val Ink = Color(0xFF11131F)                // text
    val InkSecondary = Color(0xFF8A90A5)       // secondary text
    val Success = Color(0xFF14A866)
    val Warning = Color(0xFFE08F0B)
    val Error = Color(0xFFEB4458)
    val Hairline = Color(0xFFEEF0F5)
    val Sheet = Color(0xFFFFFFFF)
    val PageMid = Color(0xFFFFFFFF)
    val PageBottom = Color(0xFFFFFFFF)
    val GradTop = Color(0xFF6E71FF)            // primary button: blue-violet
    val GradMid = Color(0xFF5F62F4)
    val GradBottom = Color(0xFF5053E6)
    val Edge = Color(0xFFECEEF4)               // 1 dp edge where a surface needs one
    /* 14.7.0 additions */
    val Card = Color(0xFFF5F6FA)               // light grey card on the white page
    val Track = Color(0xFFF0F1F6)              // field / segmented track
    val AccentSoft = Color(0xFFEEEFFF)         // light accent fill (secondary buttons, selected chips)
    val Header = Color(0xFF5A5DF0)             // the blue-violet header of the home screen
    val OnHeader = Color(0xFFFFFFFF)           // text on that header
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
    primaryContainer = OmColors.AccentSoft, onPrimaryContainer = OmColors.Blue700,
    secondary = OmColors.Sky500, onSecondary = Color.White,
    background = OmColors.Surface, onBackground = OmColors.Ink,
    surface = OmColors.Surface, onSurface = OmColors.Ink,
    surfaceVariant = OmColors.Card, onSurfaceVariant = OmColors.InkSecondary,
    surfaceContainerLowest = Color.White, surfaceContainerLow = Color(0xFFFAFAFC),
    surfaceContainer = OmColors.Card, surfaceContainerHigh = Color(0xFFF0F1F6), surfaceContainerHighest = Color(0xFFEBECF2),
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
