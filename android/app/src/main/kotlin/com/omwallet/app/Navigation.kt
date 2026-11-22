package com.omwallet.app

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
    Home("home", R.string.nav_home, OmIcons.Home), Assets("assets", R.string.nav_assets, OmIcons.Wallet), Markets("markets", R.string.nav_markets, OmIcons.Chart),
    Activity("activity", R.string.nav_activity, OmIcons.Activity), Account("account", R.string.nav_account, OmIcons.User),
}

@Composable
fun OmRoot() {
    val g = omGraph()
    val auth by g.auth.state.collectAsStateWithLifecycle()
    SkyBackground(Modifier.fillMaxSize()) {
        when (val a = auth) {
            AuthState.Loading -> Box(Modifier.fillMaxSize())
            AuthState.SignedOut -> LoginScreen()
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
            enterTransition = { fadeIn(OmSprings.fade(180)) + slideInHorizontally(OmSprings.standard()) { it / 12 } },
            exitTransition = { fadeOut(OmSprings.fade(120)) },
            popEnterTransition = { fadeIn(OmSprings.fade(180)) },
            popExitTransition = { fadeOut(OmSprings.fade(120)) + slideOutHorizontally(OmSprings.standard()) { it / 12 } },
        ) {
            composable(Tab.Home.route) {
                HomeScreen(HomeActions(
                    deposit = { nav.navigate("deposit") }, withdraw = { nav.navigate("withdraw") }, crypto = { nav.tab(Tab.Assets.route) },
                    markets = { nav.tab(Tab.Markets.route) }, send = { nav.navigate("send") }, asset = { nav.navigate("asset/$it") }, activity = { nav.tab(Tab.Activity.route) },
                ), pad)
            }
            composable(Tab.Assets.route) { AssetsScreen(onAsset = { nav.navigate("asset/$it") }, onDeposit = { nav.navigate("deposit") }, onSend = { nav.navigate("send") }, contentPadding = pad) }
            composable(Tab.Markets.route) { MarketsScreen(onAsset = { nav.navigate("asset/$it") }, contentPadding = pad) }
            composable(Tab.Activity.route) { ActivityScreen(pad) }
            composable(Tab.Account.route) { AccountScreen(isAdmin, onAdmin = { nav.navigate("admin") }, contentPadding = pad) }
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
                SendScreen(e.arguments?.getString("asset"), onBack = { nav.popBackStack() }, onActivity = { nav.popBackStack(); nav.tab(Tab.Activity.route) })
            }
            /* the admin destination exists only for a server-confirmed administrator */
            if (isAdmin) composable("admin") { AdminScreen(onBack = { nav.popBackStack() }) }
        }
        if (current != null) BottomBar(current) { nav.tab(it.route) }
    }
}

/* Floating glass bar; the active pill slides under the selected tab (spatial spring). */
@Composable
fun androidx.compose.foundation.layout.BoxScope.BottomBar(current: Tab, onTab: (Tab) -> Unit) {
    val haptics = rememberOmHaptics()
    BoxWithConstraints(
        Modifier.align(Alignment.BottomCenter).navigationBarsPadding().padding(horizontal = 14.dp, vertical = 10.dp).fillMaxWidth().height(68.dp)
            .clip(RoundedCornerShape(34.dp)).background(OmColors.Sheet).border(1.dp, Color(0xCCFFFFFF), RoundedCornerShape(34.dp)).padding(6.dp),
    ) {
        val w = maxWidth / Tab.entries.size
        val x by animateDpAsState(w * current.ordinal, OmSprings.spatial(), label = "pill")
        Box(Modifier.offset(x = x).width(w).fillMaxHeight().clip(RoundedCornerShape(28.dp)).background(OmColors.Sky100))
        Row(Modifier.fillMaxSize(), horizontalArrangement = Arrangement.SpaceEvenly) {
            Tab.entries.forEach { t ->
                val on = t == current
                Column(
                    Modifier.weight(1f).fillMaxHeight().semantics { selected = on }.pressable(role = Role.Tab) { if (!on) haptics.tap(); onTab(t) },
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center,
                ) {
                    OmIcon(t.icon, null, tint = if (on) OmColors.Blue600 else OmColors.InkSecondary, size = 22.dp)
                    Text(stringResource(t.label), style = MaterialTheme.typography.labelSmall, color = if (on) OmColors.Blue600 else OmColors.InkSecondary, maxLines = 1)
                }
            }
        }
    }
}
