package com.omwallet.app

import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import com.omwallet.core.design.OmTheme
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/* 15.2.0 — the main screens on SMALL phones (320 dp in French, the longest texts; 360 dp in Arabic, right to left): real renders saved to
   app/build/screenshots/api33-<lang>/sm_*.png for review. On the web the same sizes showed names cut to 4 letters, a status clipped out of sight and cards leaving
   the screen; here a failure is a screen that does not open or a main menu entry that is missing. It is a JVM render (Robolectric), not a phone. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [33], qualifiers = "fr-rFR-w320dp-h640dp-xhdpi", application = android.app.Application::class)
class SmallPhoneFrTest : ScreenTestBase() {
    @Test fun the_main_screens_open_on_a_320_dp_phone() {
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        startMarket()
        waitText("SOLDE TOTAL")
        shot("sm_home")
        compose.onNodeWithTag("tab_markets").performClick(); waitText("Bitcoin"); shot("sm_markets")
        compose.onNodeWithTag("tab_assets").performClick(); waitText("Mes actifs"); shot("sm_assets")
        compose.onNodeWithTag("tab_home").performClick(); idle(600)
        compose.onNodeWithTag("home_activity").performClick(); idle(900); shot("sm_activity")
        compose.onNodeWithTag("tab_home").performClick(); idle(600)
        compose.onNodeWithTag("home_account").performClick(); waitText("Admin Control"); shot("sm_account")
        compose.onNodeWithTag("tab_swap").performClick(); waitText("Vous payez", substring = true); shot("sm_swap")
    }
}

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [33], qualifiers = "ar-w360dp-h740dp-xhdpi", application = android.app.Application::class)
class SmallPhoneArTest : ScreenTestBase() {
    @Test fun the_main_screens_open_on_a_360_dp_phone_in_arabic() {
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        startMarket()
        compose.waitUntil(10_000) { has("$", substring = true) }
        shot("sm_home")
        compose.onNodeWithTag("tab_markets").performClick(); idle(900); shot("sm_markets")
        compose.onNodeWithTag("tab_assets").performClick(); idle(900); shot("sm_assets")
        compose.onNodeWithTag("tab_home").performClick(); idle(600)
        compose.onNodeWithTag("home_activity").performClick(); idle(900); shot("sm_activity")
        compose.onNodeWithTag("tab_home").performClick(); idle(600)
        compose.onNodeWithTag("home_account").performClick(); idle(900); shot("sm_account")
        compose.onNodeWithTag("tab_swap").performClick(); idle(900); shot("sm_swap")
    }
}
