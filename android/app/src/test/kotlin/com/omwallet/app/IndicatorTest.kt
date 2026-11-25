package com.omwallet.app

import org.junit.Assert.assertEquals
import org.junit.Test

/* 15.2.0 — the yellow tab that hangs over the active destination of the bottom bar follows the tabs when the layout is mirrored (Arabic): in right-to-left the first tab is on the right. */
class IndicatorTest {
    @Test fun left_to_right_the_first_tab_is_on_the_left() {
        assertEquals(10f, indicatorX(0f, 5, 100f, rtl = false), 0.001f)
        assertEquals(50f, indicatorX(2f, 5, 100f, rtl = false), 0.001f)
        assertEquals(90f, indicatorX(4f, 5, 100f, rtl = false), 0.001f)
    }
    @Test fun right_to_left_the_first_tab_is_on_the_right_and_the_middle_stays_in_the_middle() {
        assertEquals(90f, indicatorX(0f, 5, 100f, rtl = true), 0.001f)
        assertEquals(50f, indicatorX(2f, 5, 100f, rtl = true), 0.001f)
        assertEquals(10f, indicatorX(4f, 5, 100f, rtl = true), 0.001f)
        assertEquals("while it glides it is between the two (slot 0.5 is half way between tab 0 and tab 1)", 80f, indicatorX(0.5f, 5, 100f, rtl = true), 0.001f)
    }
}
