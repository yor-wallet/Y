package com.omwallet.core.design

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.material3.pulltorefresh.PullToRefreshState
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.layout.onPlaced
import androidx.compose.ui.layout.positionInParent
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/* ==========================================================================================================================================
   14.10.0 — live feedback (same ideas as the web motion pack, js/ui/motion.js):
   · a figure that moves flashes green / red, nudges 2 dp in the direction of the move and settles back;
   · a balance counts up when it first appears and rolls to its new value instead of jumping;
   · the active option of a segmented control is a yellow pill that glides to the chosen option;
   · skeletons shimmer; a success draws itself.
   Everything is drawn in the draw / layer phase where possible. Under « remove animations » nothing moves: the flash is only a short colour change.
   ========================================================================================================================================== */

/* ---------- a figure that moves ---------- */

@Stable
class LiveTick internal constructor() {
    /** +1 the figure went up, −1 it went down, 0 nothing yet */
    var dir by mutableIntStateOf(0)
        internal set
    internal val glow = Animatable(0f)
    /** 1 right after a move, then eases to 0 */
    val level: Float get() = glow.value
    val color: Color get() = if (dir >= 0) OmColors.Success else OmColors.Error
}

/** Watches [value]; when it moves (and, if given, the text [shown] on screen changes with it) the tick flashes for the direction of the move.
 *  The first value never flashes. */
@Composable
fun rememberLiveTick(value: Double?, shown: String? = null): LiveTick {
    val reduced = LocalOmMotion.current.reduced
    val tick = remember { LiveTick() }
    val last = remember { arrayOfNulls<Any>(2) }                    // previous value, previous shown text
    LaunchedEffect(value, shown) {
        val prev = last[0] as Double?; val prevShown = last[1] as String?
        last[0] = value; last[1] = shown
        if (value == null || prev == null || value == prev) return@LaunchedEffect
        if (shown != null && shown == prevShown) return@LaunchedEffect          // the move is smaller than what the screen can show
        tick.dir = if (value > prev) 1 else -1
        tick.glow.snapTo(1f)
        if (reduced) { delay(1200); tick.glow.snapTo(0f) }                      // no movement: a short colour change only
        else tick.glow.animateTo(0f, tween(950, easing = FastOutSlowInEasing))
    }
    return tick
}

/** Text that flashes with the tick: colour towards green / red, a soft halo behind, a 2 dp nudge in the direction of the move. */
@Composable
fun LiveText(
    text: AnnotatedString, tick: LiveTick, modifier: Modifier = Modifier, style: TextStyle = MaterialTheme.typography.titleSmall,
    base: Color = OmColors.Ink, maxLines: Int = 1, textAlign: TextAlign? = null,
) {
    val reduced = LocalOmMotion.current.reduced
    Text(
        text,
        modifier
            .drawBehind {
                val g = tick.glow.value
                if (!reduced && g > 0.01f) drawRect(Brush.radialGradient(listOf(tick.color.copy(alpha = 0.22f * g), Color.Transparent), center = center, radius = size.maxDimension * 0.75f))
            }
            .graphicsLayer { if (!reduced) translationY = -tick.dir * 2.dp.toPx() * tick.glow.value },
        color = lerp(base, tick.color, tick.level), style = style, maxLines = maxLines, textAlign = textAlign,
    )
}

@Composable
fun LiveText(
    text: String, tick: LiveTick, modifier: Modifier = Modifier, style: TextStyle = MaterialTheme.typography.titleSmall,
    base: Color = OmColors.Ink, maxLines: Int = 1, textAlign: TextAlign? = null,
) = LiveText(AnnotatedString(text), tick, modifier, style, base, maxLines, textAlign)

/* ---------- a figure that rolls ---------- */

private class CountState(var seen: Boolean, start: Double) {
    var from = start; var to = start; var restart: Any? = null
    val p = Animatable(1f)
    val value: Double get() = from + (to - from) * p.value
    suspend fun moveTo(target: Double, ms: Int) {
        if (!seen) { seen = true; from = 0.0; to = target; p.snapTo(0f); p.animateTo(1f, tween(ms + 200, easing = FastOutSlowInEasing)); return }   // first reveal: count up from zero
        if (target == to) return
        from = value; to = target                                                                                          // chained: starts from what is shown
        p.snapTo(0f); p.animateTo(1f, tween(ms, easing = FastOutSlowInEasing))
    }
}

/** The figure to show for [target]: it counts up from zero when it first appears (or after [restartKey] changes, e.g. the eye is opened)
 *  and rolls to every later value; [resetKey] changes (currency) snap without animation. Under « remove animations » it is [target] itself. */
@Composable
fun rememberCountedValue(target: Double?, resetKey: Any? = null, restartKey: Any? = null, ms: Int = 650): Double? {
    val reduced = LocalOmMotion.current.reduced
    val st = remember(resetKey) { CountState(seen = target != null, start = target ?: 0.0).also { it.restart = restartKey } }
    if (reduced || target == null) return target
    LaunchedEffect(target, restartKey) {
        if (st.restart != restartKey) { st.restart = restartKey; st.seen = false }
        st.moveTo(target, ms)
    }
    return st.value
}

/* ---------- the yellow pill that glides ---------- */

@Stable
class PillState internal constructor() {
    internal val xs = mutableStateMapOf<Int, Float>()
    internal val ws = mutableStateMapOf<Int, Float>()
    internal val x = Animatable(0f)
    internal val w = Animatable(0f)
    internal var placed = false
    /** left edge and width of the pill right now (for tests and tooling) */
    val left: Float get() = x.value
    val width: Float get() = w.value
}

@Composable
fun rememberPill(selected: Int): PillState {
    val reduced = LocalOmMotion.current.reduced
    val s = remember { PillState() }
    val tx = s.xs[selected]; val tw = s.ws[selected]
    LaunchedEffect(selected, tx, tw, reduced) {
        if (tx == null || tw == null) return@LaunchedEffect
        if (!s.placed || reduced) { s.x.snapTo(tx); s.w.snapTo(tw); s.placed = true }
        else {
            val spec = spring<Float>(dampingRatio = 0.72f, stiffness = 420f)
            launch { s.x.animateTo(tx, spec) }
            launch { s.w.animateTo(tw, spec) }
        }
    }
    return s
}

/** Mark an option of the control: its place and width are reported to [s]. Put it AFTER weight() and BEFORE the padding of the option. */
fun Modifier.pillItem(s: PillState, index: Int): Modifier = onPlaced { c ->
    val x = c.positionInParent().x; val w = c.size.width.toFloat()
    if (s.xs[index] != x) s.xs[index] = x
    if (s.ws[index] != w) s.ws[index] = w
}

/** Draw the pill behind the options. Put it AFTER the padding of the track so both share one coordinate space. */
fun Modifier.pillTrack(s: PillState, brush: Brush): Modifier = drawBehind {
    val w = s.w.value
    if (w > 0f) drawRoundRect(brush, topLeft = Offset(s.x.value, 0f), size = Size(w, size.height), cornerRadius = CornerRadius(size.height / 2f))
}

/** Segmented control (All / Favourites, USD / OMR, 1D / 1W …): the selected option is a pill that glides (spring) instead of switching. */
@Composable
fun SlidingSegments(
    labels: List<String>, selected: Int, onSelect: (Int) -> Unit, modifier: Modifier = Modifier,
    track: Color = OmColors.Sky100,
    pill: Brush = Brush.verticalGradient(listOf(OmColors.GradTop, OmColors.GradMid, OmColors.GradBottom)),
    onPill: Color = OmColors.OnAccent, off: Color = OmColors.InkSecondary, spread: Boolean = false,
    style: TextStyle = MaterialTheme.typography.labelLarge, hPad: Dp = 14.dp, vPad: Dp = 7.dp,
) {
    val state = rememberPill(selected)
    val haptics = rememberOmHaptics()
    Row(modifier.clip(RoundedCornerShape(50)).background(track).padding(3.dp).pillTrack(state, pill)) {
        labels.forEachIndexed { i, label ->
            val on = i == selected
            val c by animateColorAsState(if (on) onPill else off, tween(200), label = "seg$i")
            Box(
                Modifier.then(if (spread) Modifier.weight(1f) else Modifier).pillItem(state, i).clip(RoundedCornerShape(50))
                    .pressable(role = Role.Tab) { if (!on) { haptics.tap(); onSelect(i) } }.padding(horizontal = hPad, vertical = vPad)
                    .semantics { this.selected = on },
                contentAlignment = Alignment.Center,
            ) { Text(label, style = style, color = c, maxLines = 1) }
        }
    }
}

/* ---------- shimmer ---------- */

/** One sweep phase (0 → 1, repeating) shared by all the placeholders of a list, so they shine together. Fixed at −1 (no sweep) under « remove animations ». */
@Composable
fun rememberShimmerPhase(): State<Float> {
    if (LocalOmMotion.current.reduced) return remember { mutableFloatStateOf(-1f) }
    return rememberInfiniteTransition(label = "shimmer").animateFloat(0f, 1f, infiniteRepeatable(tween(1500, easing = LinearEasing)), label = "sweep")
}

/** A soft light sweeps across a placeholder (put it after clip + background). Drawn only, never laid out. */
fun Modifier.shimmerWith(phase: State<Float>): Modifier = drawWithContent {
    drawContent()
    val p = phase.value
    if (p < 0f) return@drawWithContent
    val band = size.width * 0.55f
    val x = -band + (size.width + band * 2f) * p
    drawRect(Brush.linearGradient(listOf(Color.Transparent, Color.White.copy(alpha = 0.075f), Color.Transparent), start = Offset(x, 0f), end = Offset(x + band, size.height * 0.35f)))
}

@Composable
fun Modifier.shimmer(): Modifier = shimmerWith(rememberShimmerPhase())

/* ---------- pull to refresh ---------- */

/** Pull down to refresh, with the « Arche » indicator: while the finger pulls, a yellow arc fills like the arch of the logo and the coin grows at its centre; a light tick
 *  marks the moment the pull is enough; while loading the arc turns. Nothing turns under « remove animations » (the arc stays fixed). [refreshing] must stay true until
 *  the data is really there — the caller sets it back to false when the reload is over. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OmPullRefresh(refreshing: Boolean, onRefresh: () -> Unit, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val state = rememberPullToRefreshState()
    val haptics = rememberOmHaptics()
    val armed = state.distanceFraction >= 1f
    LaunchedEffect(armed) { if (armed && !refreshing) haptics.tick() }
    PullToRefreshBox(
        isRefreshing = refreshing, onRefresh = onRefresh, modifier = modifier, state = state,
        indicator = { ArcheIndicator(state, refreshing, Modifier.align(Alignment.TopCenter)) },
    ) { content() }
}

/** Runs [block] (the real reload) and keeps the indicator for at least [ms], so a very quick reload does not flash. */
suspend fun holdRefresh(ms: Long = 650, block: suspend () -> Unit) = coroutineScope {
    val minimum = launch { delay(ms) }
    try { block() } finally { minimum.join() }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ArcheIndicator(state: PullToRefreshState, refreshing: Boolean, modifier: Modifier) {
    val reduced = LocalOmMotion.current.reduced
    val spin = if (refreshing && !reduced) rememberInfiniteTransition(label = "refresh").animateFloat(0f, 360f, infiniteRepeatable(tween(900, easing = LinearEasing)), label = "spin") else null
    Box(
        modifier.size(40.dp)
            .graphicsLayer {
                val f = if (refreshing) 1f else state.distanceFraction.coerceIn(0f, 1.2f)
                translationY = state.distanceFraction * PullToRefreshDefaults.PositionalThreshold.toPx() - size.height
                alpha = if (refreshing) 1f else (f * 1.5f).coerceIn(0f, 1f)
                val s = 0.7f + 0.3f * f.coerceAtMost(1f); scaleX = s; scaleY = s
            }
            .clip(CircleShape).background(OmColors.Card).border(1.dp, OmColors.Edge, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(Modifier.size(24.dp)) {
            val f = if (refreshing) 0.75f else state.distanceFraction.coerceIn(0f, 1f)
            val sw = 2.6.dp.toPx(); val r = size.minDimension / 2f - sw
            rotate(spin?.value ?: (if (reduced) 0f else f * 140f)) {
                drawArc(OmColors.Blue600, -90f, 330f * f, false, Offset(center.x - r, center.y - r), Size(r * 2, r * 2), style = Stroke(sw, cap = StrokeCap.Round))
            }
            drawCircle(OmColors.Blue600, radius = 3.2.dp.toPx() * (0.35f + 0.65f * f), center = center)
        }
    }
}

/* ---------- success ---------- */

private fun seg(p: Float, a: Float, b: Float) = FastOutSlowInEasing.transform(((p - a) / (b - a)).coerceIn(0f, 1f))

/** A success that draws itself: the ring closes, the disc fills, the check is written, the mark pops and a ring spreads out. A light haptic confirm
 *  lands with the check. Still (already complete) under « remove animations ». */
@Composable
fun SuccessMark(modifier: Modifier = Modifier, size: Dp = 76.dp, color: Color = OmColors.Success) {
    val reduced = LocalOmMotion.current.reduced
    val haptics = rememberOmHaptics()
    val t = remember { Animatable(if (reduced) 1f else 0f) }
    LaunchedEffect(Unit) {
        if (reduced) return@LaunchedEffect
        launch { delay(430); haptics.confirm() }
        t.animateTo(1f, tween(950, easing = LinearEasing))
    }
    Canvas(
        modifier.size(size).graphicsLayer { val k = 1f + 0.09f * kotlin.math.sin(Math.PI.toFloat() * seg(t.value, 0.68f, 1f)); scaleX = k; scaleY = k },
    ) {
        val p = t.value
        val w = this.size.width; val stroke = w * 0.065f; val r = (w - stroke) / 2f - w * 0.06f; val c = center
        val burst = seg(p, 0.7f, 1f)
        if (burst > 0f && burst < 1f) drawCircle(color.copy(alpha = 0.35f * (1f - burst)), radius = r * (1f + 0.42f * burst), center = c, style = Stroke(stroke * 0.7f))
        drawCircle(color.copy(alpha = 0.16f * seg(p, 0.25f, 0.6f)), radius = r, center = c)
        drawArc(color, -90f, 360f * seg(p, 0f, 0.42f), false, Offset(c.x - r, c.y - r), Size(r * 2, r * 2), style = Stroke(stroke, cap = StrokeCap.Round))
        val check = Path().apply { moveTo(w * 0.30f, w * 0.52f); lineTo(w * 0.45f, w * 0.66f); lineTo(w * 0.71f, w * 0.37f) }
        val m = PathMeasure(); m.setPath(check, false)
        val part = Path(); m.getSegment(0f, m.length * seg(p, 0.42f, 0.8f), part, true)
        drawPath(part, color, style = Stroke(stroke * 1.15f, cap = StrokeCap.Round, join = StrokeJoin.Round))
    }
}

/** A small check that is written once when it appears (a copy done, a choice saved). Already complete under « remove animations ». */
@Composable
internal fun CheckGlyph(color: Color, modifier: Modifier = Modifier, size: Dp = 18.dp) {
    val reduced = LocalOmMotion.current.reduced
    val p = remember { Animatable(if (reduced) 1f else 0f) }
    LaunchedEffect(Unit) { if (!reduced) p.animateTo(1f, tween(320, easing = FastOutSlowInEasing)) }
    Canvas(modifier.size(size)) {
        val w = this.size.width; val h = this.size.height
        val path = Path().apply { moveTo(w * 0.18f, h * 0.54f); lineTo(w * 0.42f, h * 0.76f); lineTo(w * 0.82f, h * 0.28f) }
        val m = PathMeasure(); m.setPath(path, false)
        val out = Path(); m.getSegment(0f, m.length * p.value, out, true)
        drawPath(out, color, style = Stroke(w * 0.13f, cap = StrokeCap.Round, join = StrokeJoin.Round))
    }
}

/** The small check / cross of a step: written when the step becomes done. [mark] 0 → 1 is the progress of the drawing. */
@Composable
internal fun StepBadge(state: StepState, modifier: Modifier = Modifier) {
    val reduced = LocalOmMotion.current.reduced
    val c by animateColorAsState(
        when (state) { StepState.Done -> OmColors.Success; StepState.Current -> OmColors.Blue600; StepState.Failed -> OmColors.Error; StepState.Todo -> OmColors.Sky300 },
        tween(300), label = "step",
    )
    val mark = remember { Animatable(if (reduced) 1f else 0f) }
    LaunchedEffect(state, reduced) {
        if (reduced) { mark.snapTo(1f); return@LaunchedEffect }
        if (state == StepState.Done || state == StepState.Failed) { mark.snapTo(0f); mark.animateTo(1f, tween(360, delayMillis = 120, easing = FastOutSlowInEasing)) } else mark.snapTo(0f)
    }
    /* the current step breathes: a ring that spreads and fades (never under « remove animations ») */
    val ring = if (state == StepState.Current && !reduced) rememberInfiniteTransition(label = "cur").animateFloat(0f, 1f, infiniteRepeatable(tween(1500, easing = LinearEasing)), label = "ring") else null
    Canvas(modifier.size(22.dp)) {
        val r = size.minDimension / 2f - 1.dp.toPx(); val sw = 2.dp.toPx()
        ring?.let { k -> drawCircle(c.copy(alpha = 0.45f * (1f - k.value)), radius = r + 7.dp.toPx() * k.value, style = Stroke(sw)) }
        if (state != StepState.Todo) drawCircle(c, radius = r)
        drawCircle(c, radius = r, style = Stroke(sw))
        val mk = mark.value
        if (state == StepState.Done && mk > 0f) {
            val pth = Path().apply { moveTo(size.width * 0.28f, size.height * 0.52f); lineTo(size.width * 0.44f, size.height * 0.67f); lineTo(size.width * 0.73f, size.height * 0.35f) }
            val m = PathMeasure(); m.setPath(pth, false); val out = Path(); m.getSegment(0f, m.length * mk, out, true)
            drawPath(out, Color.White, style = Stroke(sw * 0.95f, cap = StrokeCap.Round, join = StrokeJoin.Round))
        }
        if (state == StepState.Failed && mk > 0f) {
            val a = size.width * 0.32f; val b = size.width * 0.68f
            drawLine(Color.White, Offset(a, a), Offset(a + (b - a) * mk, a + (b - a) * mk), sw * 0.95f, StrokeCap.Round)
            drawLine(Color.White, Offset(b, a), Offset(b - (b - a) * mk, a + (b - a) * mk), sw * 0.95f, StrokeCap.Round)
        }
    }
}
