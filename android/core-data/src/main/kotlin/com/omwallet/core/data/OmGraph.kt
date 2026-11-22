package com.omwallet.core.data

import android.content.Context
import com.omwallet.core.network.MarketApi
import com.omwallet.core.network.SupabaseApi
import com.omwallet.core.security.KeystoreSecretStore
import com.omwallet.core.security.SecretStore

/* Small manual dependency graph (no reflection, no annotation processing at start-up: faster cold start). */
class OmGraph(
    ctx: Context,
    val api: SupabaseApi = SupabaseApi(),
    marketApi: MarketApi = MarketApi(api.http),
    secrets: SecretStore = KeystoreSecretStore(ctx.applicationContext),
    val db: OmDatabase = OmDatabase.create(ctx.applicationContext),
    val prefs: PrefsStore = PrefsStore(ctx),
) {
    val cache = CacheEngine(ctx.applicationContext, db)
    val wallet = WalletRepository(api, db)
    val market = MarketRepository(marketApi, db)
    val money = MoneyRepository(api)
    val admin = AdminRepository(api)
    val auth = AuthRepository(api, SessionStore(secrets)) { uid -> db.mirror().forgetUser(uid); wallet.clear() }

    companion object {
        @Volatile private var instance: OmGraph? = null
        fun get(ctx: Context): OmGraph = instance ?: synchronized(this) { instance ?: OmGraph(ctx.applicationContext).also { instance = it } }
        fun install(graph: OmGraph) { instance = graph }       /* tests */
    }
}
