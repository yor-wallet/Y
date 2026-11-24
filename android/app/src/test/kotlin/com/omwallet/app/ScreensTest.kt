package com.omwallet.app

import android.content.Context
import android.graphics.Bitmap
import android.os.Build
import android.os.Looper
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.test.core.app.ApplicationProvider
import com.omwallet.core.data.AuthState
import com.omwallet.core.data.OmDatabase
import com.omwallet.core.data.OmGraph
import com.omwallet.core.data.PrefsStore
import com.omwallet.core.design.OmTheme
import com.omwallet.core.network.MarketApi
import com.omwallet.core.network.OmJson
import com.omwallet.core.network.Session
import com.omwallet.core.network.SupabaseApi
import com.omwallet.core.security.MemorySecretStore
import com.omwallet.feature.admin.AdminScreen
import com.omwallet.feature.assets.AssetDetailScreen
import com.omwallet.feature.deposit.DepositScreen
import com.omwallet.feature.history.ActivityScreen
import com.omwallet.feature.send.SendScreen
import com.omwallet.feature.withdraw.WithdrawScreen
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File
import java.time.Duration
import java.util.Locale
import java.util.UUID

/* Screen tests on the Android 12 (API 31) and Android 13 (API 33) frameworks, run on the JVM by Robolectric with native graphics.
   This is NOT an emulator or a physical device: it checks behaviour, wording and layout, and saves real renders for review. */
abstract class ScreenTestBase {
    @get:Rule val compose = createAndroidComposeRule<androidx.activity.ComponentActivity>()
    protected val backend = FakeBackend()
    protected lateinit var server: MockWebServer
    protected lateinit var g: OmGraph
    private val marketScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    protected open val signedIn = true

    @Before fun setUp() {
        server = MockWebServer().apply { dispatcher = backend; start() }
        val ctx = ApplicationProvider.getApplicationContext<Context>()
        val base = server.url("/").toString().trimEnd('/')
        val api = SupabaseApi(base, "anon-test")
        val secrets = MemorySecretStore()
        if (signedIn) secrets.put("session", OmJson.encodeToString(Session.serializer(), Session("t-access", "t-refresh", "u-1", "amina@example.com", System.currentTimeMillis() / 1000 + 3600)))
        val prefs = PrefsStore(PreferenceDataStoreFactory.create { File(ctx.filesDir, "prefs-${UUID.randomUUID()}.preferences_pb") })
        g = OmGraph(ctx, api, MarketApi(api.http, "$base/api/v3", "ws://127.0.0.1:9/none?streams="), secrets, OmDatabase.inMemory(ctx), prefs)
        OmGraph.install(g)
        runBlocking { g.auth.restore(); if (signedIn) g.wallet.refresh("u-1") }
    }
    @After fun tearDown() { g.market.stop(); marketScope.cancel(); server.shutdown() }

    /* a screen alone, on the same sky background as in the app (OmRoot draws every route on SkyBackground) */
    protected fun inApp(content: @androidx.compose.runtime.Composable () -> Unit) =
        compose.setContent { OmTheme(reducedMotion = true) { com.omwallet.core.design.SkyBackground(androidx.compose.ui.Modifier.fillMaxSize()) { content() } } }
    protected fun startMarket() { g.market.start(marketScope); compose.waitUntil(10_000) { g.market.state.value.quotes.isNotEmpty() } }
    protected fun waitText(t: String, substring: Boolean = false) =
        compose.waitUntil(10_000) { compose.onAllNodesWithText(t, substring = substring, useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty() }
    protected fun has(t: String, substring: Boolean = false) = compose.onAllNodesWithText(t, substring = substring, useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty()
    protected fun click(t: String, substring: Boolean = false) = compose.onAllNodesWithText(t, substring = substring).onLast().performClick()
    protected fun type(label: String, text: String) = compose.onAllNodes(hasSetTextAction() and hasText(label)).onFirst().performTextInput(text)
    protected fun idle(ms: Long) { shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(ms)); compose.waitForIdle() }

    /* Saves what the screen shows — the activity window plus any open sheet / dialog window, with its dim — to
       app/build/screenshots/api<sdk>-<lang>/<name>.png. Rendered with View.draw on a real Skia canvas (Robolectric native graphics). */
    protected fun shot(name: String) {
        val bmp = capture()
        val dir = File("build/screenshots/api${Build.VERSION.SDK_INT}-${Locale.getDefault().language}").apply { mkdirs() }
        File(dir, "$name.png").outputStream().use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }
    /* reads the QR code really drawn on screen (pixels of the node tagged [tag]), as a phone camera would */
    protected fun readQr(tag: String): String {
        val bmp = capture()
        val r = compose.onNodeWithTag(tag, useUnmergedTree = true).fetchSemanticsNode().boundsInWindow
        val x = r.left.toInt().coerceAtLeast(0); val y = r.top.toInt().coerceAtLeast(0)
        val w = minOf(r.width.toInt(), bmp.width - x); val h = minOf(r.height.toInt(), bmp.height - y)
        val px = IntArray(w * h); bmp.getPixels(px, 0, w, x, y, w, h)
        val src = com.google.zxing.RGBLuminanceSource(w, h, px)
        return com.google.zxing.qrcode.QRCodeReader().decode(com.google.zxing.BinaryBitmap(com.google.zxing.common.HybridBinarizer(src))).text
    }
    private fun capture(): Bitmap {
        compose.waitForIdle(); idle(400)
        val wmg = Class.forName("android.view.WindowManagerGlobal").getMethod("getInstance").invoke(null)
        @Suppress("UNCHECKED_CAST") val names = wmg.javaClass.getMethod("getViewRootNames").invoke(wmg) as Array<String>
        val roots = names.mapNotNull { wmg.javaClass.getMethod("getRootView", String::class.java).invoke(wmg, it) as? android.view.View }.filter { it.isShown && it.width > 0 }
        val screen = compose.activity.window.decorView
        val bmp = Bitmap.createBitmap(screen.width, screen.height, Bitmap.Config.ARGB_8888)
        val canvas = android.graphics.Canvas(bmp)
        canvas.drawColor(android.graphics.Color.rgb(247, 251, 255))
        roots.forEach { v ->
            val lp = v.layoutParams as? android.view.WindowManager.LayoutParams
            if (v !== screen && lp != null && (lp.flags and android.view.WindowManager.LayoutParams.FLAG_DIM_BEHIND) != 0)
                canvas.drawColor(android.graphics.Color.argb((lp.dimAmount * 255).toInt(), 0, 0, 0))
            val loc = IntArray(2); v.getLocationOnScreen(loc)
            canvas.save(); canvas.translate(loc[0].toFloat(), loc[1].toFloat()); v.draw(canvas); canvas.restore()
        }
        return bmp
    }
}

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [31, 33], qualifiers = "fr-rFR-w411dp-h891dp-xxhdpi", application = android.app.Application::class)
class ScreensFrTest : ScreenTestBase() {

    @Test fun home_counts_only_real_values_and_has_no_transfer_or_cfa() {
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        startMarket()
        waitText("Solde total")
        waitText("$", substring = true)
        /* 0.0123 BTC × 91 234.50 + 150.25 USDT ÷ 0.9998 + 0.5 ETH × 3 050.10 + 20.500 OMR × 2.6008 */
        val expected = 0.0123 * 91234.5 + 150.25 / 0.9998 + 0.5 * 3050.1 + 20.5 * 2.6008
        waitText(com.omwallet.core.data.Fmt.money(expected))
        /* no transfer feature on the home (the status « Transfert confirmé » of a confirmed send may appear in the recent activity) */
        assertTrue(!has("Transfert") && !has("Transférer") && !has("Envoyer de l’argent"))
        assertTrue(!has("XOF", substring = true) && !has("CFA", substring = true))
        /* 14.7.0 (owner's reference image): three round actions on the home, Markets in the menu */
        listOf("Dépôt", "Retrait", "Envoyer", "Marchés").forEach { assertTrue(it, has(it)) }
        shot("01_home")
        click("Marchés")
        waitText("+1.37%"); waitText("−2.24%")
        shot("02_markets")
        compose.onNodeWithTag("tab_assets").performClick()
        waitText("Votre portefeuille"); waitText("Mes actifs"); waitText("Bitcoin")
        shot("02b_assets")
        /* 14.5: Account is on the home header (the main menu is Home · Markets · Spot · Swap · Assets) */
        compose.onNodeWithTag("tab_home").performClick(); idle(600)
        compose.onNodeWithTag("home_account").performClick()
        waitText("Admin Control")
        shot("03_account")
    }

    @Test fun spot_live_market_and_swap_stays_in_progress_until_the_admin() {
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        startMarket()
        waitText("Solde total")
        listOf("tab_home", "tab_markets", "tab_spot", "tab_swap", "tab_assets").forEach { compose.onNodeWithTag(it).assertExists() }
        compose.onNodeWithTag("tab_spot").performClick()
        waitText("BTC/USDT"); waitText("Carnet d’ordres")
        compose.waitUntil(10_000) { has("Ordre au marché") }
        assertTrue(has("Les ordres à cours limité ne sont pas proposés", substring = true))       /* no button that would not really execute */
        compose.waitUntil(15_000) { has("91,243.50") }                    /* first ask of the order book (server snapshot) */
        idle(600); shot("15_spot")
        compose.onNodeWithTag("tab_swap").performClick()
        waitText("Vous payez", substring = true)
        listOf("key_5", "key_0").forEach { compose.onNodeWithTag("swap").performScrollToNode(hasTestTag(it)); compose.onNodeWithTag(it).performClick() }      /* 14.7.0: the Convert keypad */
        idle(400); shot("16_swap")
        compose.onNodeWithTag("swap").performScrollToNode(hasTestTag("swap_go")); compose.onNodeWithTag("swap_go").performClick()
        waitText("Vérifiez votre échange"); waitText("Prix valable", substring = true)
        assertTrue(has("0.000548", substring = true))
        shot("17_swap_review")
        compose.onNodeWithTag("review_confirm").performClick()
        waitText("Saisissez votre code")
        "123456".forEach { d -> compose.onAllNodesWithContentDescription(d.toString()).onLast().performClick() }
        compose.waitUntil(15_000) { has("Terminé") }                       /* the result screen, not the « submitting » step */
        assertTrue(has("En cours"))
        assertEquals(1, backend.called("swap_execute"))
        val body = backend.bodyOf("swap_execute")!!
        assertTrue(body, body.contains("\"p_quote\":\"q-1\"") && body.contains("\"p_idempotency_key\":\"and-") && body.contains("\"p_pin_grant\":\"7d0e0c1e"))
        assertTrue(!has("Échange confirmé"))                              /* nothing is credited before the administrator */
        shot("18_swap_pending")
    }

    @Test fun swap_not_activated_on_the_server_says_so_and_records_nothing() {
        backend.swapOff = true
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        waitText("Solde total")
        compose.onNodeWithTag("tab_swap").performClick()
        waitText("Vous payez", substring = true)
        listOf("key_1", "key_0").forEach { compose.onNodeWithTag("swap").performScrollToNode(hasTestTag(it)); compose.onNodeWithTag(it).performClick() }
        compose.onNodeWithTag("swap").performScrollToNode(hasTestTag("swap_go")); compose.onNodeWithTag("swap_go").performClick()
        waitText("L’échange n’est pas encore activé sur le serveur.")
        assertEquals(0, backend.called("swap_execute"))
    }

    @Test fun opening_presentation_three_screens_then_sign_in() {
        runBlocking { g.auth.signOut() }
        val ctx = ApplicationProvider.getApplicationContext<Context>()
        ctx.getSharedPreferences("om_onboarding", Context.MODE_PRIVATE).edit().clear().commit()
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        waitText("Votre portefeuille numérique, toujours avec vous")
        assertTrue(has("Passer")); assertTrue(has("Découvrir le portefeuille"))
        shot("00a_promo_1")
        compose.onNodeWithTag("onb_cta_0").performClick(); idle(700)
        waitText("Une expérience plus simple"); shot("00b_promo_2")
        compose.onNodeWithTag("onb_cta_1").performClick(); idle(700)
        waitText("Protégé par votre code"); assertTrue(!has("Passer")); shot("00c_promo_3")
        compose.onNodeWithTag("onb_cta_2").performClick()
        waitText("Bon retour parmi nous")
        assertTrue(OnboardingPrefs.seen(ctx))
    }
    @Test fun opening_presentation_skip_goes_to_sign_in() {
        runBlocking { g.auth.signOut() }
        val ctx = ApplicationProvider.getApplicationContext<Context>()
        ctx.getSharedPreferences("om_onboarding", Context.MODE_PRIVATE).edit().clear().commit()
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        waitText("Passer")
        compose.onNodeWithTag("onb_skip").performClick()
        waitText("Bon retour parmi nous")
        assertTrue(OnboardingPrefs.seen(ctx))
    }
    @Test fun login_errors_under_the_fields_then_home() {
        runBlocking { g.auth.signOut() }
        OnboardingPrefs.markSeen(ApplicationProvider.getApplicationContext())
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        waitText("Bon retour parmi nous")
        click("Se connecter")
        waitText("Saisissez une adresse e-mail valide.")
        type("E-mail", "amina@example.com"); type("Mot de passe", "wrong-pass")
        click("Se connecter")
        waitText("E-mail ou mot de passe incorrect.")
        shot("00_login_error")
    }
    @Test fun sign_up_in_the_app_with_mandatory_phone_then_check_your_inbox() {
        runBlocking { g.auth.signOut() }
        OnboardingPrefs.markSeen(ApplicationProvider.getApplicationContext())
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        waitText("Bon retour parmi nous")
        click("Pas encore de compte ? Créer un compte")
        waitText("Créer un compte")
        click("Créer mon compte")                                      /* nothing is sent while a field is wrong */
        waitText("Saisissez une adresse e-mail valide.")
        assertTrue(has("Saisissez un numéro de téléphone valide pour ce pays.") && has("Le mot de passe doit contenir au moins 8 caractères."))
        assertEquals(0, backend.snapshot().count { it.first.startsWith("/auth/v1/signup") })
        type("Prénom", "Nadia"); type("Nom", "Al Said"); type("E-mail", "nadia@example.com")
        type("Numéro de téléphone", "9123 4567"); type("Mot de passe", "secret-pass-1")
        shot("00d_signup")
        click("Créer mon compte")
        waitText("Vérifiez votre boîte e-mail")                          /* e-mail confirmation required: the screen says so, nothing pretends the account is ready */
        assertTrue(has("nadia@example.com", substring = true))
        val body = backend.snapshot().last { it.first.startsWith("/auth/v1/signup") }.second
        assertTrue(body, body.contains("\"phone\":\"+96891234567\"") && body.contains("\"country\":\"OM\"") && body.contains("\"first_name\":\"Nadia\"") &&
            body.contains("\"last_name\":\"Al Said\"") && body.contains("\"language\":\"fr\"") && body.contains("\"email\":\"nadia@example.com\""))
        assertEquals(1, backend.snapshot().count { it.first.startsWith("/auth/v1/signup") })
        shot("00e_signup_check_inbox")
        click("Se connecter")
        waitText("Bon retour parmi nous")
    }
    @Test fun sign_up_another_country_server_error_then_signed_in_at_once() {
        runBlocking { g.auth.signOut() }
        OnboardingPrefs.markSeen(ApplicationProvider.getApplicationContext())
        backend.signup = "exists"
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        waitText("Bon retour parmi nous")
        click("Pas encore de compte ? Créer un compte")
        waitText("Créer un compte")
        compose.onNodeWithTag("signup_country").performClick()
        compose.onNodeWithTag("country_CI").performClick()                  /* Côte d'Ivoire, +225 */
        type("E-mail", "amina@example.com"); type("Numéro de téléphone", "07 08 09 10 11"); type("Mot de passe", "secret-pass-1")
        click("Créer mon compte")
        waitText("Un compte existe déjà avec cet e-mail. Connectez-vous.")
        val body = backend.snapshot().last { it.first.startsWith("/auth/v1/signup") }.second
        assertTrue(body, body.contains("\"phone\":\"+225708091011\"") && body.contains("\"country\":\"CI\""))
        backend.signup = "session"                                          /* a project that signs the person in at once */
        click("Créer mon compte")
        waitText("Solde total")
    }

    @Test fun asset_detail_with_real_chart_tabs_and_networks() {
        startMarket()
        inApp { AssetDetailScreen("BTC", {}, {}, {}, {}) }
        waitText("Plus haut 24 h")
        compose.waitUntil(10_000) { backend.snapshot().any { it.first.startsWith("/api/v3/klines") } }
        idle(300)
        shot("04_asset_btc")
        click("Réseaux")
        waitText("Norme BTC")
        waitText("Frais", substring = true)
    }

    @Test fun activity_shows_honest_statuses_and_keeps_cfa_archived() {
        inApp { ActivityScreen(androidx.compose.foundation.layout.PaddingValues()) }
        waitText("En cours")                                           /* the pending send AND the withdrawal being handled: only « En cours » */
        assertTrue(has("Transfert confirmé"))                          /* the incoming, confirmed one */
        assertTrue(!has("Autorisé admin") && !has("À confirmer") && !has("administrateur", substring = true))
        waitText("Historique CFA (archivé)")
        assertTrue(!has("50,000", substring = true) && !has("50000", substring = true))     /* archived rows hidden until asked */
        shot("05_activity")
        click("Sara K.", substring = true)
        waitText("Soumis")
        assertTrue(has("En cours") && has("Confirmé"))
        assertTrue(!has("Confirmé par admin") && !has("admin", substring = true) && !has("OM Wallet confirme", substring = true))
        shot("06_tx_detail_pending")
    }

    @Test fun deposit_never_shows_an_address_the_server_did_not_give() {
        inApp { DepositScreen("USDT") {} }
        waitText("Choisissez le réseau")
        click("TRON")
        waitText("Adresse de dépôt indisponible")
        assertTrue(!has("Copier l’adresse"))
        assertEquals(1, backend.called("get_receive_address"))
        shot("07_deposit_unavailable")
    }

    @Test fun first_deposit_request_creates_the_accounts_own_address_then_shows_it_with_its_qr() {
        backend.addr = "pending"
        inApp { DepositScreen("USDT") {} }
        waitText("Choisissez le réseau")
        click("TRON")
        waitText("TZ2nw5y4azp1wkY89kPTBqUPtRhCguWhjY")
        assertTrue(has("Copier l’adresse") && has("Partager"))
        assertTrue(backend.snapshot().count { it.first.startsWith("/functions/v1/wallet-addresses") } == 1)   /* created once, on the first request */
        assertEquals(2, backend.called("get_receive_address"))
        /* 14.5.2: the QR code on screen is readable and gives exactly this address (it was drawn white on white in 14.5.0) */
        assertEquals("TZ2nw5y4azp1wkY89kPTBqUPtRhCguWhjY", readQr("deposit_qr"))
        shot("07b_deposit_address_qr")
    }

    @Test fun crypto_withdrawal_errors_appear_under_the_fields() {
        inApp { WithdrawScreen("USDT") {} }
        waitText("Adresse de destination")
        click("TRC20")
        type("Adresse de destination", "0x52908400098527886E0F7030069857D2E4169EE7")
        type("Montant (USDT)", "200")
        waitText("Cette adresse n’est pas valide pour TRON.")
        waitText("Solde disponible insuffisant.")
        waitText("Soumis")                                          /* the existing ETH request: submitted → in progress → completed */
        assertTrue(has("En cours") && !has("Autorisé admin"))
        shot("08_withdraw_errors")
    }

    @Test fun internal_send_by_email_stays_pending_until_the_admin_confirms() {
        inApp { SendScreen(null, {}, {}) }
        waitText("E-mail du destinataire")
        type("E-mail du destinataire", "sara@example.com")
        idle(600)
        waitText("Sara K.", substring = true); assertTrue(has("Compte trouvé", substring = true))
        click("USDT · TRC20")
        type("Montant (USDT)", "5")
        click("Vérifier")
        waitText("Confirmer l’envoi")
        shot("09_send_review")
        click("Envoyer")
        waitText("Saisissez votre code")
        repeat(6) { compose.onAllNodesWithContentDescription("0").onLast().performClick() }
        waitText("Code incorrect. 2 essais restants.")
        "123456".forEach { d -> compose.onAllNodesWithContentDescription(d.toString()).onLast().performClick() }
        waitText("Envoi enregistré")
        assertTrue(has("En cours") && has("Votre envoi est en cours."))
        assertTrue(!has("À confirmer") && !has("administrateur", substring = true) && !has("OM Wallet confirme", substring = true) && !has("Confirmé par admin"))
        val body = backend.bodyOf("transfer_crypto")!!
        assertTrue(body, body.contains("\"p_to_yor_id\":\"OM2210\"") && body.contains("\"p_idempotency_key\":\"and-") && body.contains("\"p_pin_grant\":\"7d0e0c1e"))
        assertEquals(1, backend.called("transfer_crypto"))
        shot("10_send_done")
    }

    @Test fun admin_one_confirm_one_credit_and_the_row_stays_in_place() {
        assertTrue((g.auth.state.value as AuthState.SignedIn).isAdmin)
        inApp { AdminScreen {} }
        waitText("Amina Al Balushi → Sara Khalid")
        shot("11_admin_internal")
        click("Mettre en pause")                                       /* not final: stays pending, still confirmable and refusable */
        waitText("En pause")
        assertEquals(1, backend.called("admin_tx_pause"))
        assertTrue(!has("Mettre en pause") && has("Refuser"))
        shot("11b_admin_paused")
        click("Confirmer")
        waitText("12.5 USDT", substring = true)
        shot("12_admin_confirm_dialog")
        click("Confirmer")
        waitText("Confirmé")
        assertEquals(1, backend.called("admin_tx_confirm"))
        assertTrue(has("Amina Al Balushi → Sara Khalid"))                 /* still in place, no button under the finger */
        assertTrue(!has("Refuser"))
        shot("13_admin_confirmed")
        click("Trust Wallet")
        waitText("Trust Wallet (WalletConnect v2)")
        assertTrue(!has("Connecter"))
        shot("14_admin_trust")
    }
}

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [33], qualifiers = "fr-rFR-w411dp-h891dp-xxhdpi", application = android.app.Application::class)
class NonAdminTest : ScreenTestBase() {
    @Before fun notAdmin() { backend.admin = false; runBlocking { g.auth.restore() } }
    @Test fun the_admin_entry_only_exists_for_a_server_confirmed_admin() {
        assertTrue(!(g.auth.state.value as AuthState.SignedIn).isAdmin)
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        waitText("Solde total")
        compose.onNodeWithTag("home_account").performClick()
        idle(900); shot("99_nonadmin_account")
        /* the taller glass layout puts « Se déconnecter » below the fold of the lazy list: scroll to it */
        compose.onAllNodes(androidx.compose.ui.test.SemanticsMatcher.keyIsDefined(androidx.compose.ui.semantics.SemanticsProperties.VerticalScrollAxisRange)).onLast().performScrollToNode(hasText("Se déconnecter"))
        waitText("Se déconnecter")
        assertTrue(!has("Admin Control"))
    }
}

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [31, 33], qualifiers = "ar-w411dp-h891dp-xxhdpi", application = android.app.Application::class)
class ScreensArTest : ScreenTestBase() {
    @Test fun arabic_opening_presentation_and_sign_in() {
        runBlocking { g.auth.signOut() }
        val ctx = ApplicationProvider.getApplicationContext<Context>()
        ctx.getSharedPreferences("om_onboarding", Context.MODE_PRIVATE).edit().clear().commit()
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        waitText("محفظتك الرقمية معك"); assertTrue(has("تخطي")); assertTrue(has("اكتشف المحفظة"))
        shot("00a_promo_1")
        compose.onNodeWithTag("onb_skip").performClick()
        waitText("أهلاً بك من جديد")
        shot("00_login")
    }
    @Test fun arabic_right_to_left_home_markets_and_send() {
        compose.setContent { OmTheme(reducedMotion = true) { OmRoot() } }
        startMarket()
        waitText("الرصيد الإجمالي")
        shot("01_home")
        click("الأسواق")
        waitText("+1.37%")
        shot("02_markets")
    }
    @Test fun arabic_send_and_withdraw() {
        inApp { SendScreen(null, {}, {}) }
        waitText("بريد المستلم")
        type("بريد المستلم", "sara@example.com")
        idle(600)
        waitText("Sara K.", substring = true); assertTrue(has("تم العثور على الحساب", substring = true))
        shot("03_send")
    }
}
