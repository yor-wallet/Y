package com.omwallet.core.design

import android.os.Build
import android.view.HapticFeedbackConstants
import android.view.View
import androidx.compose.animation.core.FiniteAnimationSpec
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalView

/* Motion language (cahier OM Wallet): standard spring for financial UI, expressive spring only for non-critical premium moments.
   Colour / opacity changes never bounce. Everything is animated in the draw phase (graphicsLayer) to stay inside the frame budget
   (16.67 ms at 60 Hz, 11.11 ms at 90 Hz, 8.33 ms at 120 Hz): the screen's real refresh rate is left to Android. */
object OmSprings {
    fun <T> standard(): FiniteAnimationSpec<T> = spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessMediumLow)
    fun <T> spatial(): FiniteAnimationSpec<T> = spring(dampingRatio = 0.82f, stiffness = Spring.StiffnessMediumLow)
    fun <T> expressive(): FiniteAnimationSpec<T> = spring(dampingRatio = 0.62f, stiffness = Spring.StiffnessLow)
    fun <T> press(): FiniteAnimationSpec<T> = spring(dampingRatio = 0.7f, stiffness = Spring.StiffnessHigh)
    fun <T> fade(ms: Int = 160): FiniteAnimationSpec<T> = tween(durationMillis = ms)
}

/* Native haptics: action-oriented predefined effects, never long "buzzy" vibrations. CONFIRM / REJECT exist from Android 11 (API 30). */
class OmHaptics(private val view: View) {
    fun tap() { view.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY) }
    fun confirm() {
        view.performHapticFeedback(if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.CONTEXT_CLICK)
    }
    fun warn() {
        view.performHapticFeedback(if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.REJECT else HapticFeedbackConstants.LONG_PRESS)
    }
}

@Composable
fun rememberOmHaptics(): OmHaptics { val v = LocalView.current; return remember(v) { OmHaptics(v) } }
