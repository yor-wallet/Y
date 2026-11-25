package com.omwallet.app

import android.content.Context
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.omwallet.core.design.LocalOmMotion
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmPrimaryButton
import com.omwallet.core.design.pressable
import com.omwallet.core.ui.R
import kotlinx.coroutines.launch
import kotlin.math.absoluteValue

/* Opening presentation (14.4.0), shown once before the first sign-in. Built from the owner's OM Wallet visuals:
   the two photos (their printed text removed: every word and button here is real and translated) and the glass app icon.
   Depth: while the finger drags, each photo moves at 35 % of the page speed and settles from a slight zoom; the glass card's lines rise in.
   « تخطي / Skip » on every page but the last. Nothing animates under « remove animations ». */
object OnboardingPrefs {
    private const val FILE = "om_onboarding"; private const val KEY = "seen"
    fun seen(c: Context) = c.getSharedPreferences(FILE, Context.MODE_PRIVATE).getBoolean(KEY, false)
    fun markSeen(c: Context) = c.getSharedPreferences(FILE, Context.MODE_PRIVATE).edit().putBoolean(KEY, true).apply()
}

private data class Page(val photo: Int?, val title: Int, val text: Int, val cta: Int, val focusX: Float)

@Composable
fun OnboardingScreen(onDone: () -> Unit) {
    val pages = listOf(
        Page(com.omwallet.app.R.drawable.promo_1_nj, R.string.onb_t1, R.string.onb_p1, R.string.onb_c1, 0.5f),
        Page(com.omwallet.app.R.drawable.promo_2_nj, R.string.onb_t2, R.string.onb_p2, R.string.onb_c2, 0.28f),
        Page(null, R.string.onb_t3, R.string.onb_p3, R.string.onb_c3, 0.5f),
    )
    val pager = rememberPagerState { pages.size }
    val scope = rememberCoroutineScope()
    val reduced = LocalOmMotion.current.reduced
    Box(Modifier.fillMaxSize().background(OmColors.Surface).testTag("onboarding")) {
        HorizontalPager(pager, Modifier.fillMaxSize()) { k ->
            val p = pages[k]
            val offset = (pager.currentPage - k) + pager.currentPageOffsetFraction
            val on = pager.currentPage == k
            val zoom by animateFloatAsState(if (on || reduced) 1f else 1.08f, tween(1100), label = "zoom")
            Box(Modifier.fillMaxSize()) {
                /* the art: photo (or glass icon) moving slower than the page */
                Box(Modifier.fillMaxWidth().fillMaxHeight(0.74f).graphicsLayer {
                    if (!reduced) translationX = offset * size.width * 0.35f
                    scaleX = zoom; scaleY = zoom
                }) {
                    if (p.photo != null) Image(painterResource(p.photo), null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop,
                        alignment = androidx.compose.ui.BiasAlignment(p.focusX * 2 - 1, -0.6f))
                    else Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        BrandHero(Modifier.fillMaxWidth(0.98f).aspectRatio(1f), trimTop = 0f, trimBottom = 0f)
                    }
                    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(0.5f to Color(0x000B0A07), 0.82f to Color(0xD10B0A07), 1f to OmColors.Surface)))
                }
                /* the glass card: message, button, dots */
                Column(
                    Modifier.align(Alignment.BottomCenter).navigationBarsPadding().padding(16.dp).fillMaxWidth()
                        .shadow(28.dp, RoundedCornerShape(34.dp), ambientColor = Color(0x99000000), spotColor = Color(0xCC000000))
                        .clip(RoundedCornerShape(34.dp))
                        .background(Color(0xE0120F0D))
                        .border(1.dp, OmColors.Edge, RoundedCornerShape(34.dp)).padding(22.dp),
                ) {
                    val rise by animateDpAsState(if (on || reduced) 0.dp else 18.dp, tween(700), label = "rise")
                    val fade by animateFloatAsState(if (on || reduced) 1f else 0f, tween(600), label = "fade")
                    Image(painterResource(com.omwallet.app.R.drawable.om_logo_horizontal_white), stringResource(R.string.app_name), Modifier.height(36.dp).graphicsLayer { alpha = fade })
                    Spacer(Modifier.height(12.dp))
                    Text(stringResource(p.title), style = MaterialTheme.typography.displaySmall, color = OmColors.Ink, modifier = Modifier.graphicsLayer { alpha = fade; translationY = rise.toPx() })
                    Spacer(Modifier.height(10.dp))
                    Text(stringResource(p.text), style = MaterialTheme.typography.bodyLarge, color = OmColors.InkSecondary, modifier = Modifier.graphicsLayer { alpha = fade; translationY = rise.toPx() * 1.4f })
                    Spacer(Modifier.height(20.dp))
                    OmPrimaryButton(stringResource(p.cta), Modifier.testTag("onb_cta_$k")) {
                        if (k < pages.lastIndex) scope.launch { if (reduced) pager.scrollToPage(k + 1) else pager.animateScrollToPage(k + 1) } else onDone()
                    }
                    Spacer(Modifier.height(16.dp))
                    Row(Modifier.align(Alignment.CenterHorizontally), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        pages.indices.forEach { j ->
                            val w by animateDpAsState(if (j == pager.currentPage) 26.dp else 10.dp, tween(380), label = "dot")
                            Box(Modifier.height(10.dp).width(w).clip(RoundedCornerShape(6.dp)).background(if (j == pager.currentPage) OmColors.Blue600 else Color(0xFF3A372D))
                                .semantics { contentDescription = "${j + 1} / ${pages.size}" })
                        }
                    }
                }
            }
        }
        /* Skip (not on the last page): goes straight to sign-in */
        if (pager.currentPage < pages.lastIndex) {
            Text(
                stringResource(R.string.onb_skip), style = MaterialTheme.typography.titleMedium, color = OmColors.Blue600,
                modifier = Modifier.align(Alignment.TopEnd).statusBarsPadding().padding(16.dp)
                    .clip(RoundedCornerShape(16.dp)).background(Color(0xC7120F0D)).border(1.dp, OmColors.Edge, RoundedCornerShape(16.dp))
                    .pressable(role = Role.Button) { onDone() }.padding(horizontal = 18.dp, vertical = 10.dp).testTag("onb_skip"),
            )
        }
    }
}
