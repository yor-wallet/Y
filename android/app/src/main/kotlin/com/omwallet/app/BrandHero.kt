package com.omwallet.app

import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.layout
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import kotlin.math.roundToInt

/* The sign-in / sign-up / welcome artwork: receding arches around a glowing coin — the original « Arche » hero (brand/om_art.py).
   The owner's logo is used for the launcher icon only; this and the in-app mark are our own design.
   The picture has transparent margins above and below: trimTop / trimBottom (fractions of its height) shrink the layout box so it does not push the page down. */
@Composable
fun BrandHero(modifier: Modifier = Modifier, trimTop: Float = 0.09f, trimBottom: Float = 0.11f) {
    Image(
        painterResource(R.drawable.om_hero), contentDescription = stringResource(com.omwallet.core.ui.R.string.app_name),
        modifier = modifier.trimArt(trimTop, trimBottom), contentScale = ContentScale.Fit,
    )
}

fun Modifier.trimArt(top: Float, bottom: Float): Modifier = this.layout { measurable, constraints ->
    val p = measurable.measure(constraints)
    val t = (p.height * top).roundToInt(); val b = (p.height * bottom).roundToInt()
    layout(p.width, (p.height - t - b).coerceAtLeast(0)) { p.placeRelative(0, -t) }
}
