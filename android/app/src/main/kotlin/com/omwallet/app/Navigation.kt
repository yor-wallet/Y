package com.omwallet.app

import androidx.compose.ui.platform.testTag
import androidx.compose.foundation.layout.size
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.foundation.shape.CircleShape

import androidx.compose.runtime.setValue

import androidx.compose.animation.togetherWith

import androidx.compose.ui.graphics.graphicsLayer

import androidx.compose.ui.draw.shadow

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.omwallet.core.data.AuthState
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmIcons
import com.omwallet.core.design.OmSprings
import com.omwallet.core.design.SkyBackground
import com.omwallet.core.design.pressable
import com.omwallet.core.design.rememberOmHaptics
import com.omwallet.core.ui.R
import com.omwallet.core.ui.omGraph
import com.omwallet.feature.admin.AdminScreen
import com.omwallet.feature.assets.AssetDetailScreen
import com.omwallet.feature.assets.AssetsScreen
import com.omwallet.feature.dashboard.HomeActions
import com.omwallet.feature.dashboard.HomeScreen
import com.omwallet.feature.deposit.DepositScreen
import com.omwallet.feature.history.ActivityScreen
import com.omwallet.feature.markets.MarketsScreen
import com.omwallet.feature.send.SendScreen
import com.omwallet.feature.withdraw.WithdrawScreen

enum class Tab(val route: String, val label: Int, val icon: Int) {
    /* 14.5 main menu (owner's request): Home · Markets · Spot · Swap · Assets. Activity and Account stay one tap away on the home header. */
    /* 14.7.0 (owner's reference image): Home · Markets · Swap (raised circle in the middle) · Wallet (the assets page) · Spot */
    Home("home", R.string.nav_home, OmIcons.Home), Markets("markets", R.string.nav_markets, OmIcons.Chart),
    Swap("swap", R.string.nav_swap, OmIcons.Swap), Assets("assets", R.string.nav_wallet, OmIcons.Wallet), Spot("spot", R.string.nav_spot, OmIcons.Trend),
}
private const val ACTIVITY = "activity"
private const val ACCOUNT = "account"

@Composable
fun OmRoot() {
    val g = omGraph()
    val auth by g.auth.state.collectAsStateWithLifecycle()
    SkyBackground(Modifier.fillMaxSize()) {
        when (val a = auth) {
            AuthState.Loading -> Box(Modifier.fillMaxSize())
            AuthState.SignedOut -> {
                /* the opening presentation is shown once, before the first sign-in */
                val ctx = androidx.compose.ui.platform.LocalContext.current
                var showIntro by androidx.compose.runtime.saveable.rememberSaveable { androidx.compose.runtime.mutableStateOf(!OnboardingPrefs.seen(ctx)) }
                androidx.compose.animation.AnimatedContent(showIntro, transitionSpec = {
                    (fadeIn(OmSprings.fade(320)) + androidx.compose.animation.scaleIn(initialScale = 0.94f)) togetherWith (fadeOut(OmSprings.fade(220)) + androidx.compose.animation.scaleOut(targetScale = 1.04f))
                }, label = "intro") { intro ->
                    var signUp by androidx.compose.runtime.saveable.rememberSaveable { androidx.compose.runtime.mutableStateOf(false) }
                    if (intro) OnboardingScreen { OnboardingPrefs.markSeen(ctx); showIntro = false }
                    else if (signUp) SignUpScreen(onBack = { signUp = false }) else LoginScreen(onSignUp = { signUp = true })
                }
            }
            is AuthState.SignedIn -> {
                LaunchedEffect(a.profile.uid) { g.wallet.loadMirror(a.profile.uid); g.wallet.refresh(a.profile.uid) }
                MainNav(a.isAdmin)
            }
        }
    }
}

private fun NavHostController.tab(route: String) = navigate(route) {
    popUpTo(graph.findStartDestination().id) { saveState = true }
    launchSingleTop = true; restoreState = true
}

@Composable
fun MainNav(isAdmin: Boolean) {
    val nav = rememberNavController()
    val entry by nav.currentBackStackEntryAsState()
    val route = entry?.destination?.route
    val current = Tab.entries.firstOrNull { it.route == route }
    val pad = PaddingValues(bottom = 112.dp)
    Box(Modifier.fillMaxSize()) {
        NavHost(
            nav, startDestination = Tab.Home.route, modifier = Modifier.fillMaxSize(),
            /* 14.4.0 « glass depth »: a new screen comes forward (from slightly behind and low), the old one recedes; back reverses it.
               Under « remove animations » Android scales every duration to zero, so nothing moves. */
            enterTransition = { fadeIn(OmSprings.fade(260)) + androidx.compose.animation.scaleIn(OmSprings.spatial(), initialScale = 0.92f) + androidx.compose.animation.slideInVertically(OmSprings.spatial()) { it / 28 } },
            exitTransition = { fadeOut(OmSprings.fade(180)) + androidx.compose.animation.scaleOut(OmSprings.standard(), targetScale = 1.04f) },
            popEnterTransition = { fadeIn(OmSprings.fade(260)) + androidx.compose.animation.scaleIn(OmSprings.spatial(), initialScale = 1.04f) },
            popExitTransition = { fadeOut(OmSprings.fade(180)) + androidx.compose.animation.scaleOut(OmSprings.standard(), targetScale = 0.9f) + androidx.compose.animation.slideOutVertically(OmSprings.standard()) { it / 28 } },
        ) {
            composable(Tab.Home.route) {
                HomeScreen(HomeActions(
                    deposit = { nav.navigate("deposit") }, withdraw = { nav.navigate("withdraw") }, crypto = { nav.tab(Tab.Assets.route) },
                    markets = { nav.tab(Tab.Markets.route) }, send = { nav.navigate("send") }, asset = { nav.navigate("asset/$it") }, activity = { nav.tab(ACTIVITY) },
                    account = { nav.tab(ACCOUNT) },
                ), pad)
            }
            composable(Tab.Assets.route) { AssetsScreen(onAsset = { nav.navigate("asset/$it") }, onDeposit = { nav.navigate("deposit") }, onSend = { nav.navigate("send") }, contentPadding = pad) }
            composable(Tab.Markets.route) { MarketsScreen(onAsset = { nav.navigate("asset/$it") }, contentPadding = pad) }
            composable(Tab.Spot.route) { com.omwallet.feature.markets.SpotScreen(pad) }
            composable(Tab.Swap.route) { com.omwallet.feature.markets.SwapScreen(pad) }
            composable(ACTIVITY) { ActivityScreen(pad) }
            composable(ACCOUNT) { AccountScreen(isAdmin, onAdmin = { nav.navigate("admin") }, contentPadding = pad) }
            composable("asset/{sym}", listOf(navArgument("sym") { type = NavType.StringType })) { e ->
                val sym = e.arguments?.getString("sym").orEmpty()
                AssetDetailScreen(sym, onBack = { nav.popBackStack() }, onDeposit = { nav.navigate("deposit?asset=$it") }, onWithdraw = { nav.navigate("withdraw?asset=$it") }, onSend = { nav.navigate("send?asset=$it") })
            }
            composable("deposit?asset={asset}", listOf(navArgument("asset") { type = NavType.StringType; nullable = true; defaultValue = null })) { e ->
                DepositScreen(e.arguments?.getString("asset"), onBack = { nav.popBackStack() })
            }
            composable("withdraw?asset={asset}", listOf(navArgument("asset") { type = NavType.StringType; nullable = true; defaultValue = null })) { e ->
                WithdrawScreen(e.arguments?.getString("asset"), onBack = { nav.popBackStack() })
            }
            composable("send?asset={asset}", listOf(navArgument("asset") { type = NavType.StringType; nullable = true; defaultValue = null })) { e ->
                SendScreen(e.arguments?.getString("asset"), onBack = { nav.popBackStack() }, onActivity = { nav.popBackStack(); nav.tab(ACTIVITY) })
            }
            /* the admin destination exists only for a server-confirmed administrator */
            if (isAdmin) composable("admin") { AdminScreen(onBack = { nav.popBackStack() }) }
        }
        /* the bar stays on Activity and Account too (no tab highlighted there), so the main menu is always one tap away */
        if (current != null || route == ACTIVITY || route == ACCOUNT) BottomBar(current) { nav.tab(it.route) }
    }
}

/* Bottom bar — 14.8.0 (Noir & Jaune): a near-black bar with a hairline top edge and rounded top corners; Home · Markets ·
   [Swap: a raised YELLOW circle in the middle, dark glyph on it] · Wallet · Spot. The active tab is yellow (icon + label), the others grey;
   the touched item springs. Same destinations, same test tags and the same navigation as before: appearance only. */
@Composable
fun androidx.compose.foundation.layout.BoxScope.BottomBar(current: Tab?, onTab: (Tab) -> Unit) {
    val haptics = rememberOmHaptics()
    val reduced = com.omwallet.core.design.LocalOmMotion.current.reduced
    val top = RoundedCornerShape(topStart = 26.dp, topEnd = 26.dp)
    val swapLabel = stringResource(Tab.Swap.label)
    /* 15.1.0 — a small yellow tab hangs from the top edge of the bar over the active destination and glides (spring) to the next one;
       it fades out on Activity / Account. Drawn only (no layout); it jumps instead of gliding under « remove animations ». */
    val slot = Tab.entries.indexOf(current).coerceAtLeast(0)
    val glide by androidx.compose.animation.core.animateFloatAsState(slot.toFloat(), if (reduced) androidx.compose.animation.core.snap() else OmSprings.standard(), label = "indicator")
    val shown by androidx.compose.animation.core.animateFloatAsState(if (current != null && current != Tab.Swap) 1f else 0f, androidx.compose.animation.core.tween(if (reduced) 0 else 180), label = "indicator-a")
    Box(Modifier.align(Alignment.BottomCenter).fillMaxWidth()) {
        Row(
            Modifier.fillMaxWidth().padding(top = 24.dp)
                .androidx_shadow(top).clip(top).background(OmColors.Nav).border(1.dp, OmColors.Edge, top)
                .navigationBarsPadding().padding(horizontal = 6.dp).height(64.dp)
                .androidx_drawIndicator(glide, shown, Tab.entries.size),
            horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically,
        ) {
            Tab.entries.forEach { t ->
                if (t == Tab.Swap) { Box(Modifier.weight(1f)) ; return@forEach }       /* the raised circle sits above this slot */
                val on = t == current
                val pop by androidx.compose.animation.core.animateFloatAsState(if (on && !reduced) 1.08f else 1f, OmSprings.expressive(), label = "pop")
                Column(
                    Modifier.weight(1f).fillMaxHeight().clip(RoundedCornerShape(16.dp)).testTag("tab_" + t.route).semantics { selected = on }
                        .pressable(role = Role.Tab) { if (!on) haptics.tap(); onTab(t) },
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center,
                ) {
                    Box(Modifier.graphicsLayer { scaleX = pop; scaleY = pop }) { OmIcon(t.icon, null, tint = if (on) OmColors.Blue600 else OmColors.InkSecondary, size = 24.dp) }
                    Text(stringResource(t.label), style = MaterialTheme.typography.labelSmall, color = if (on) OmColors.Blue600 else OmColors.InkSecondary, maxLines = 1)
                }
            }
        }
        /* Swap: the raised yellow circle in the middle of the bar, ringed with the bar colour */
        val onSwap = current == Tab.Swap
        Box(
            Modifier.align(Alignment.TopCenter).size(66.dp).shadow(16.dp, CircleShape, ambientColor = Color(0x66FFC800), spotColor = Color(0x99FFC800))
                .clip(CircleShape).background(OmColors.Nav).padding(5.dp).clip(CircleShape)
                .background(androidx.compose.ui.graphics.Brush.verticalGradient(listOf(OmColors.GradTop, OmColors.GradMid, OmColors.GradBottom)))
                .testTag("tab_" + Tab.Swap.route).semantics { selected = onSwap; contentDescription = swapLabel }
                .pressable(role = Role.Tab) { if (!onSwap) haptics.tap(); onTab(Tab.Swap) },
            contentAlignment = Alignment.Center,
        ) { OmIcon(Tab.Swap.icon, null, tint = OmColors.OnAccent, size = 26.dp) }
    }
}

/** Horizontal centre of the indicator for a (possibly fractional) tab [slot] among [count] tabs in a bar [width] px wide; in a right-to-left layout the tabs are mirrored, so is the indicator. */
internal fun indicatorX(slot: Float, count: Int, width: Float, rtl: Boolean): Float = (slot + 0.5f) / count * width.let { w -> if (rtl) -w else w } + (if (rtl) width else 0f)

private fun Modifier.androidx_drawIndicator(slot: Float, alpha: Float, count: Int) = this.then(Modifier.androidx_drawBehind {
    if (alpha <= 0.01f) return@androidx_drawBehind
    val cx = indicatorX(slot, count, size.width, layoutDirection == androidx.compose.ui.unit.LayoutDirection.Rtl)
    drawRoundRect(OmColors.Blue600.copy(alpha = alpha), androidx.compose.ui.geometry.Offset(cx - 14.dp.toPx(), -1.dp.toPx()), androidx.compose.ui.geometry.Size(28.dp.toPx(), 3.5.dp.toPx()), androidx.compose.ui.geometry.CornerRadius(2.dp.toPx()))
})
private fun Modifier.androidx_drawBehind(block: androidx.compose.ui.graphics.drawscope.DrawScope.() -> Unit) = this.then(Modifier.drawBehind(block))

private fun Modifier.androidx_shadow(shape: androidx.compose.ui.graphics.Shape) = this.then(Modifier.shadow(24.dp, shape, ambientColor = Color(0x66000000), spotColor = Color(0x99000000)))
