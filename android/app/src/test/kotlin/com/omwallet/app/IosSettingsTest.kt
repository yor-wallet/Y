package com.omwallet.app

import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsOff
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onLast
import com.omwallet.core.design.OmTheme
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/* 15.3.0 — the account screen as the iPhone's Settings: inset grouped rows, an iOS switch that the whole row toggles, « Log out » as a red row.
   Real renders: app/build/screenshots/api33-<lang>/ios_account*.png. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [33], qualifiers = "fr-rFR-w411dp-h891dp-xxhdpi", application = android.app.Application::class)
class IosSettingsFrTest : ScreenTestBase() {
    private val switchRow = SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Switch)

    @Test fun the_account_screen_is_an_ios_settings_list_and_the_row_toggles_its_switch() {
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        waitText("SOLDE TOTAL")
        compose.onNodeWithTag("home_account").performClick()
        waitText("Admin Control"); waitText("Masquer les soldes"); waitText("Langue"); waitText("Devise d’affichage")
        shot("ios_account")
        val hidden0 = runBlocking { g.prefs.prefs.first().hideBalance }
        val sw = compose.onNode(switchRow)
        if (hidden0) sw.assertIsOn() else sw.assertIsOff()
        sw.performClick()
        compose.waitUntil(10_000) { runBlocking { g.prefs.prefs.first().hideBalance } == !hidden0 }      /* the preference is written asynchronously (DataStore) */
        idle(300)
        assertEquals("the whole row toggles the setting", !hidden0, runBlocking { g.prefs.prefs.first().hideBalance })
        if (!hidden0) compose.onNode(switchRow).assertIsOn() else compose.onNode(switchRow).assertIsOff()
        compose.onAllNodes(SemanticsMatcher.keyIsDefined(SemanticsProperties.VerticalScrollAxisRange)).onLast().performScrollToNode(hasText("Se déconnecter"))
        waitText("Se déconnecter"); shot("ios_account_bottom")
        click("Langue"); waitText("Français"); waitText("✓"); shot("ios_account_language")
    }
}

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [33], qualifiers = "ar-w411dp-h891dp-xxhdpi", application = android.app.Application::class)
class IosSettingsArTest : ScreenTestBase() {
    @Test fun the_account_screen_in_arabic_mirrors_tiles_chevrons_and_switch() {
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        compose.waitUntil(10_000) { has("$", substring = true) }
        compose.onNodeWithTag("home_account").performClick(); idle(900)
        shot("ios_account")
    }
}
