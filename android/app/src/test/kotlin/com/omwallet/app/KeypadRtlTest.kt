package com.omwallet.app

import android.view.View
import androidx.activity.ComponentActivity
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import com.omwallet.core.design.OmTheme
import com.omwallet.core.design.PinPad
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/* 15.2.0 — a number pad is never mirrored: in Arabic (right-to-left) the digits keep 1 2 3 from left to right, as on phones, on the web pad and on the PIN lock. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [33], qualifiers = "ar-rOM-w411dp-h891dp-xxhdpi", application = android.app.Application::class)
class KeypadRtlTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()

    @Test fun the_pin_pad_keeps_1_2_3_from_left_to_right_in_arabic() {
        compose.setContent { OmTheme(reducedMotion = true) { PinPad("", "", null, false, {}, {}, "x") } }
        assertEquals("the screen really is right-to-left here", View.LAYOUT_DIRECTION_RTL, compose.activity.resources.configuration.layoutDirection)
        val x = { d: String -> compose.onNodeWithContentDescription(d).fetchSemanticsNode().boundsInRoot.left }
        assertTrue("1 is left of 2 (" + x("1") + " / " + x("2") + ")", x("1") < x("2"))
        assertTrue("2 is left of 3 (" + x("2") + " / " + x("3") + ")", x("2") < x("3"))
        assertTrue("7 is left of 9", x("7") < x("9"))
    }
}
