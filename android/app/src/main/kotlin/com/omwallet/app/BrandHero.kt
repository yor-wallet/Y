package com.omwallet.app

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.layout
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.omwallet.core.design.LocalOmMotion
import kotlin.math.roundToInt

/* The sign-in / sign-up / welcome artwork: receding arches around a glowing coin — the original « Arche » hero (brand/om_art.py).
   The owner's logo is used for the launcher icon only; this and the in-app mark are our own design.
   The picture has transparent margins above and below: trimTop / trimBottom (fractions of its height) shrink the layout box so it does not push the page down.
   15.1.0 — it is alive: the arches breathe (a 2 % swell, 5 s), the coin floats and tilts a little (3.4 s). Both layers are the same 900 × 900 picture cut in two
   (om_hero_bg + om_hero_coin = om_hero), moved in the layer phase only — no recomposition per frame. Under « remove animations » the single still picture is shown. */
@Composable
fun BrandHero(modifier: Modifier = Modifier, trimTop: Float = 0.09f, trimBottom: Float = 0.11f) {
    val desc = stringResource(com.omwallet.core.ui.R.string.app_name)
    if (LocalOmMotion.current.reduced) {
        Image(painterResource(R.drawable.om_hero), contentDescription = desc, modifier = modifier.trimArt(trimTop, trimBottom), contentScale = ContentScale.Fit)
        return
    }
    val t = rememberInfiniteTransition(label = "hero")
    val float by t.animateFloat(-1f, 1f, infiniteRepeatable(tween(3400, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "coin")
    val breathe by t.animateFloat(0f, 1f, infiniteRepeatable(tween(5000, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "arches")
    Box(modifier.trimArt(trimTop, trimBottom).semantics { contentDescription = desc }) {
        Image(
            painterResource(R.drawable.om_hero_bg), contentDescription = null, contentScale = ContentScale.Fit,
            modifier = Modifier.fillMaxSize().graphicsLayer { val s = 1f + 0.02f * breathe; scaleX = s; scaleY = s },
        )
        Image(
            painterResource(R.drawable.om_hero_coin), contentDescription = null, contentScale = ContentScale.Fit,
            modifier = Modifier.fillMaxSize().graphicsLayer { translationY = float * 5.dp.toPx(); rotationZ = float * 1.4f },
        )
    }
}

fun Modifier.trimArt(top: Float, bottom: Float): Modifier = this.layout { measurable, constraints ->
    val p = measurable.measure(constraints)
    val t = (p.height * top).roundToInt(); val b = (p.height * bottom).roundToInt()
    layout(p.width, (p.height - t - b).coerceAtLeast(0)) { p.placeRelative(0, -t) }
}
