package com.omwallet.app

import androidx.activity.ComponentActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeRight
import androidx.compose.ui.unit.dp
import com.omwallet.core.design.AreaChart
import com.omwallet.core.design.LiveText
import com.omwallet.core.design.LiveTick
import com.omwallet.core.design.OmPrimaryButton
import com.omwallet.core.design.OmTheme
import com.omwallet.core.design.PillState
import com.omwallet.core.design.pillItem
import com.omwallet.core.design.pillTrack
import com.omwallet.core.design.rememberCountedValue
import com.omwallet.core.design.rememberLiveTick
import com.omwallet.core.design.rememberPill
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/* 15.1.0 — the live-feedback pack of core-design (LiveMotion.kt): what moves, when, and that nothing moves under « remove animations ».
   Run on the JVM by Robolectric with the Compose test clock (autoAdvance off), so each frame is read, not guessed. NOT a device: the feel of the
   springs and of the haptics still has to be judged on a phone. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [33], qualifiers = "en-rUS-w411dp-h891dp-xxhdpi", application = android.app.Application::class)
class MotionTest {
    @get:Rule val compose = createAndroidComposeRule<ComponentActivity>()

    @Test fun a_figure_counts_up_when_it_first_arrives_then_rolls_instead_of_jumping() {
        var target by mutableStateOf<Double?>(null)
        var shown: Double? = null
        compose.mainClock.autoAdvance = false
        compose.setContent { OmTheme(reducedMotion = false) { shown = rememberCountedValue(target); Text(shown?.toString() ?: "-") } }
        compose.mainClock.advanceTimeBy(100)
        assertNull("nothing to show yet", shown)
        write { target = 100.0 }
        compose.mainClock.advanceTimeBy(250)
        assertTrue("counting up from zero, now " + shown, shown!! > 0.0 && shown!! < 100.0)
        compose.mainClock.advanceTimeBy(2000)
        assertEquals(100.0, shown!!, 0.001)
        write { target = 120.0 }                                    // a later value: rolls from what is shown, no jump
        compose.mainClock.advanceTimeBy(150)
        assertTrue("rolling to the new value, now " + shown, shown!! > 100.0 && shown!! < 120.0)
        compose.mainClock.advanceTimeBy(1500)
        assertEquals(120.0, shown!!, 0.001)
    }

    @Test fun under_remove_animations_a_figure_is_its_value_at_once() {
        var target by mutableStateOf<Double?>(null)
        var shown: Double? = null
        compose.mainClock.autoAdvance = false
        compose.setContent { OmTheme(reducedMotion = true) { shown = rememberCountedValue(target); Text(shown?.toString() ?: "-") } }
        compose.mainClock.advanceTimeBy(50)
        write { target = 100.0 }
        compose.mainClock.advanceTimeBy(50)
        assertEquals(100.0, shown!!, 0.0)
        write { target = 120.0 }
        compose.mainClock.advanceTimeBy(50)
        assertEquals(120.0, shown!!, 0.0)
    }

    @Test fun a_price_that_moves_flashes_for_its_direction_the_first_value_and_invisible_moves_do_not() {
        var price by mutableStateOf(100.0)
        lateinit var tick: LiveTick
        compose.mainClock.autoAdvance = false
        compose.setContent { OmTheme(reducedMotion = false) { val txt = "%.2f".format(price); tick = rememberLiveTick(price, txt); LiveText(txt, tick) } }
        compose.mainClock.advanceTimeBy(100)
        assertEquals("the first value never flashes", 0, tick.dir)
        assertTrue(tick.level < 0.01f)
        write { price = 101.0 }
        compose.mainClock.advanceTimeBy(60)
        assertEquals(1, tick.dir); assertTrue("flash is on, level " + tick.level, tick.level > 0.5f)
        compose.mainClock.advanceTimeBy(1500)
        assertTrue("flash has settled, level " + tick.level, tick.level < 0.01f)
        write { price = 99.0 }
        compose.mainClock.advanceTimeBy(60)
        assertEquals(-1, tick.dir); assertTrue(tick.level > 0.5f)
        compose.mainClock.advanceTimeBy(1500)
        write { price = 99.001 }                                    // the screen still reads 99.00: nothing to show
        compose.mainClock.advanceTimeBy(100)
        assertTrue("a move the screen cannot show does not flash", tick.level < 0.01f)
    }

    @Test fun under_remove_animations_the_flash_is_a_short_colour_change_only() {
        var price by mutableStateOf(100.0)
        lateinit var tick: LiveTick
        compose.mainClock.autoAdvance = false
        compose.setContent { OmTheme(reducedMotion = true) { val txt = "%.2f".format(price); tick = rememberLiveTick(price, txt); LiveText(txt, tick) } }
        compose.mainClock.advanceTimeBy(100)
        write { price = 101.0 }
        compose.mainClock.advanceTimeBy(600)
        assertEquals("held at full colour, not eased", 1f, tick.level, 0.001f)
        compose.mainClock.advanceTimeBy(900)
        assertEquals(0f, tick.level, 0.001f)
    }

    @Test fun the_yellow_pill_glides_to_the_chosen_option() {
        var selected by mutableStateOf(0)
        lateinit var pill: PillState
        compose.mainClock.autoAdvance = false
        compose.setContent {
            OmTheme(reducedMotion = false) {
                pill = rememberPill(selected)
                Row(Modifier.width(300.dp).height(40.dp).pillTrack(pill, SolidColor(Color.Yellow))) {
                    repeat(3) { i -> Box(Modifier.weight(1f).height(40.dp).pillItem(pill, i).background(Color.Transparent)) }
                }
            }
        }
        compose.mainClock.advanceTimeBy(200)
        assertEquals("the pill starts under the first option", 0f, pill.left, 0.5f)
        assertTrue(pill.width > 50f)
        write { selected = 2 }
        compose.mainClock.advanceTimeBy(50)
        val mid = pill.left
        assertTrue("gliding: between the two options, at " + mid, mid > 1f && mid < 2f * pill.width - 1f)
        compose.mainClock.advanceTimeBy(1500)
        assertEquals("settled under the third option", 2f * pill.width, pill.left, 1.5f)
    }

    @Test fun under_remove_animations_the_pill_jumps() {
        var selected by mutableStateOf(0)
        lateinit var pill: PillState
        compose.mainClock.autoAdvance = false
        compose.setContent {
            OmTheme(reducedMotion = true) {
                pill = rememberPill(selected)
                Row(Modifier.width(300.dp).height(40.dp).pillTrack(pill, SolidColor(Color.Yellow))) { repeat(3) { i -> Box(Modifier.weight(1f).height(40.dp).pillItem(pill, i)) } }
            }
        }
        compose.mainClock.advanceTimeBy(200)
        write { selected = 1 }
        compose.mainClock.advanceTimeBy(100)
        assertEquals(pill.width, pill.left, 1.5f)
    }

    @Test fun a_finger_along_the_curve_reports_each_point_and_lifting_clears_it() {
        val got = mutableListOf<Int?>()
        compose.setContent { OmTheme(reducedMotion = true) { AreaChart((1..20).map { it.toDouble() }, Modifier.size(300.dp, 120.dp).testTag("chart"), onScrub = { got.add(it) }) } }
        compose.onNodeWithTag("chart").performTouchInput { swipeRight() }
        compose.waitForIdle()
        assertTrue("several points were reported: " + got, got.filterNotNull().size >= 3)
        assertNull("lifting the finger clears the cursor", got.last())
        val idx = got.filterNotNull()
        assertTrue("the cursor moved right, from " + idx.first() + " to " + idx.last(), idx.last() > idx.first())
        assertTrue("it reached the end of the curve: " + idx.last(), idx.last() >= 17)
    }

    @Test fun a_button_can_answer_for_itself_with_a_check_and_its_words() {
        var done by mutableStateOf(false)
        compose.setContent { OmTheme(reducedMotion = true) { OmPrimaryButton("Copy", successText = if (done) "Copied" else null) { done = true } } }
        compose.onNodeWithText("Copy").assertExists()
        compose.onNodeWithText("Copy").performClick()
        compose.waitForIdle()
        compose.onNodeWithText("Copied").assertExists()
        assertFalse("the old words are gone", compose.onAllNodesWithTextCount("Copy") > 0)
        assertTrue(done)
    }

    /* a state write from the test thread: made on the UI thread, then announced to the recomposer at once (the test clock is paused, so nothing else would) */
    private fun write(block: () -> Unit) { compose.runOnIdle { block(); androidx.compose.runtime.snapshots.Snapshot.sendApplyNotifications() } }

    private fun androidx.compose.ui.test.junit4.AndroidComposeTestRule<*, *>.onAllNodesWithTextCount(t: String) =
        onAllNodes(androidx.compose.ui.test.hasText(t)).fetchSemanticsNodes().size
}
