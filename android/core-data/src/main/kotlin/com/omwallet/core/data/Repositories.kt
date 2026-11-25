package com.omwallet.core.data

import com.omwallet.core.network.ApiException
import com.omwallet.core.network.Candle
import com.omwallet.core.network.MarketApi
import com.omwallet.core.network.OmJson
import com.omwallet.core.network.SupabaseApi
import com.omwallet.core.network.Ticker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.math.BigDecimal
import java.util.UUID

/* ============================================================
   AUTH — the role comes from the SERVER (is_admin()), never from the device.
   ============================================================ */
sealed interface AuthState {
    data object Loading : AuthState
    data object SignedOut : AuthState
    data class SignedIn(val profile: Profile, val isAdmin: Boolean) : AuthState
}

class AuthRepository(private val api: SupabaseApi, private val sessions: SessionStore, private val onSignedOut: suspend (String) -> Unit = {}) {
    private val _state = MutableStateFlow<AuthState>(AuthState.Loading)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    init { api.onSessionChanged = { sessions.save(it) } }

    suspend fun restore() {
        val s = sessions.load()
        if (s == null) { _state.value = AuthState.SignedOut; return }
        api.session = s
        try { api.refresh(s.refreshToken); loadProfile() }
        catch (e: ApiException) {
            if (e.uncertain) {                                   /* offline: keep the session, the screens show the last known state */
                _state.value = AuthState.SignedIn(Profile(s.userId, null, s.email, null, "", "", null), false)
            } else { sessions.save(null); api.session = null; _state.value = AuthState.SignedOut }
        }
    }

    suspend fun signIn(email: String, password: String) { api.signIn(email.trim(), password); loadProfile() }

    /* true: the account is open and signed in; false: an e-mail confirmation link was sent first (the person then signs in) */
    suspend fun signUp(email: String, password: String, firstName: String, lastName: String, phone: String, country: String, language: String): Boolean {
        val data = kotlinx.serialization.json.buildJsonObject {
            put("first_name", JsonPrimitive(firstName.trim().take(80))); put("last_name", JsonPrimitive(lastName.trim().take(80)))
            put("phone", JsonPrimitive(phone)); put("country", JsonPrimitive(country.uppercase().take(2)))
            put("language", JsonPrimitive(language.takeIf { it in setOf("fr", "en", "ar") } ?: "en"))
        }
        val s = api.signUp(email.trim(), password, data) ?: return false
        loadProfile(); return s.accessToken.isNotEmpty()
    }

    private suspend fun loadProfile() {
        val uid = api.session?.userId ?: throw ApiException("unauthenticated", "no session", 401)
        val row = api.select("profiles", "select=id,yor_id,email,role,first_name,last_name,status&id=eq.$uid").firstOrNull().obj()
            ?: throw ApiException("profile_missing", "profile missing")
        val admin = runCatching { (api.rpc("is_admin") as? JsonPrimitive)?.content == "true" }.getOrDefault(false)
        _state.value = AuthState.SignedIn(Parse.profile(row), admin)
    }

    suspend fun signOut() {
        val uid = api.session?.userId
        api.signOut(); sessions.save(null)
        if (uid != null) onSignedOut(uid)
        _state.value = AuthState.SignedOut
    }

    val userId: String? get() = api.session?.userId
}

/* ============================================================
   WALLET — balances and activity, read from the server (row-level security). Offline: the last mirror, with its time.
   ============================================================ */
data class WalletState(
    val loading: Boolean = true, val accounts: List<FiatAccount> = emptyList(), val positions: List<AssetPosition> = emptyList(),
    val transactions: List<Tx> = emptyList(), val archivedCfa: List<Tx> = emptyList(), val syncedAt: Long = 0, val offline: Boolean = false, val error: String? = null,
)

class WalletRepository(private val api: SupabaseApi, private val db: OmDatabase) {
    private val _state = MutableStateFlow(WalletState())
    val state: StateFlow<WalletState> = _state.asStateFlow()

    suspend fun loadMirror(uid: String) {
        val rows = db.mirror().transactions(uid).first()
        if (rows.isNotEmpty() && _state.value.transactions.isEmpty()) {
            val txs = rows.mapNotNull { runCatching { Parse.tx(OmJson.parseToJsonElement(it.json) as JsonObject) }.getOrNull() }
            _state.update { it.copy(transactions = txs.filterNot(Tx::isLegacyCfa), archivedCfa = txs.filter(Tx::isLegacyCfa), syncedAt = rows.maxOf { r -> r.syncedAt }, offline = true) }
        }
    }

    suspend fun refresh(uid: String) {
        _state.update { it.copy(loading = true, error = null) }
        try {
            val acc = api.select("accounts", "select=currency,balance,available_balance,reserved_balance&user_id=eq.$uid").mapNotNull { it.obj() }.map(Parse::account)
            val wal = api.select("crypto_wallets", "select=asset,network,balance,available_balance,locked_balance&user_id=eq.$uid").mapNotNull { it.obj() }.map(Parse::holding)
            val raw = api.rpc("my_transactions", buildJsonObject { put("p_limit", 200) }).arr().mapNotNull { it.obj() }
            val txs = raw.map(Parse::tx)
            val now = System.currentTimeMillis()
            db.mirror().putTransactions(raw.zip(txs).map { (o, t) -> TxRow(t.id, uid, t.createdAt, o.toString(), now) })
            val positions = wal.groupBy { it.asset.uppercase() }.map { (sym, list) ->
                AssetPosition(sym, list.sumOf { it.balance }, list.sumOf { it.available }, list.sumOf { it.locked }, list)
            }.sortedBy { p -> Catalog.assets.indexOfFirst { it.sym == p.asset }.let { if (it < 0) 99 else it } }
            _state.value = WalletState(false, acc.filterNot { it.currency == "XOF" }, positions, txs.filterNot(Tx::isLegacyCfa), txs.filter(Tx::isLegacyCfa), now, false, null)
        } catch (e: ApiException) {
            _state.update { it.copy(loading = false, offline = e.uncertain, error = e.code) }
        }
    }

    fun clear() { _state.value = WalletState() }
}

/* ============================================================
   MARKET — live WebSocket, REST polling fallback every 20 s, last values kept with their time when offline. Never invented.
   ============================================================ */
enum class FeedMode { Idle, Live, Polling, Offline }
data class Quote(val sym: String, val price: Double, val changePct: Double?, val high: Double, val low: Double, val quoteVolume: Double, val at: Long, val derived: Boolean = false)
data class MarketState(val mode: FeedMode = FeedMode.Idle, val quotes: Map<String, Quote> = emptyMap(), val lastSync: Long = 0)
enum class Period(val interval: String, val limit: Int) { D1("15m", 96), W1("1h", 168), M1("4h", 180), Y1("1d", 365) }

class MarketRepository(private val market: MarketApi, private val db: OmDatabase) {
    private val _state = MutableStateFlow(MarketState())
    val state: StateFlow<MarketState> = _state.asStateFlow()
    private var job: Job? = null
    private val symOf = Catalog.assets.filter { it.pair != null }.associate { it.pair!! to it.sym }

    private fun apply(tickers: List<Ticker>) {
        if (tickers.isEmpty()) return
        _state.update { st ->
            val q = st.quotes.toMutableMap()
            tickers.forEach { t -> symOf[t.pair]?.let { sym -> if (t.price > 0) q[sym] = Quote(sym, t.price, t.changePct, t.high, t.low, t.quoteVolume, t.at) } }
            q["USDC"]?.let { u -> /* USDT is priced through the USDC/USDT market: 1 / price */
                val open = if (u.changePct != null) u.price / (1 + u.changePct / 100) else null
                val p = 1 / u.price
                q["USDT"] = Quote("USDT", p, open?.let { (p / (1 / it) - 1) * 100 }, 0.0, 0.0, 0.0, u.at, derived = true)
            }
            if (q == st.quotes) st else st.copy(quotes = q, lastSync = maxOf(st.lastSync, tickers.maxOf { it.at }))
        }
    }

    fun start(scope: CoroutineScope) {
        if (job?.isActive == true) return
        job = scope.launch {
            if (_state.value.quotes.isEmpty()) {
                val cached = runCatching { db.mirror().prices() }.getOrDefault(emptyList())
                if (cached.isNotEmpty()) apply(cached.map { Ticker(it.pair, it.price, it.open, 0.0, 0.0, 0.0, 0.0, it.at) })
            }
            var backoff = 2_000L
            while (isActive) {
                try {
                    apply(market.tickers(Catalog.pairs)); persist()
                    _state.update { it.copy(mode = FeedMode.Polling) }
                    market.stream(Catalog.pairs).collect { t -> if (_state.value.mode != FeedMode.Live) _state.update { it.copy(mode = FeedMode.Live) }; apply(listOf(t)); backoff = 2_000L }
                } catch (e: Exception) {
                    if (e is kotlinx.coroutines.CancellationException) throw e
                }
                /* stream ended or failed: poll REST until the next reconnection attempt */
                val until = System.currentTimeMillis() + backoff
                while (isActive && System.currentTimeMillis() < until) {
                    val ok = runCatching { apply(market.tickers(Catalog.pairs)); persist() }.isSuccess
                    _state.update { it.copy(mode = if (ok) FeedMode.Polling else FeedMode.Offline) }
                    delay(minOf(20_000L, backoff))
                }
                backoff = minOf(backoff * 2, 60_000L)
            }
        }
    }
    /** One immediate read of all the prices (pull to refresh): the same data as the poll, applied at once. True when the market answered. */
    suspend fun refreshNow(): Boolean = runCatching { apply(market.tickers(Catalog.pairs)); persist() }.isSuccess
    fun stop() { job?.cancel(); job = null; _state.update { it.copy(mode = if (it.quotes.isEmpty()) FeedMode.Idle else FeedMode.Offline) } }

    private suspend fun persist() {
        val q = _state.value.quotes.values.filter { !it.derived }
        runCatching {
            db.mirror().putPrices(q.mapNotNull { v ->
                val pair = Catalog.asset(v.sym)?.pair ?: return@mapNotNull null
                PriceRow(pair, v.price, if (v.changePct != null) v.price / (1 + v.changePct / 100) else 0.0, v.at)
            })
        }
    }

    suspend fun history(sym: String, period: Period): List<Candle> {
        if (sym == "USDT") return market.klines("USDCUSDT", period.interval, period.limit).map { Candle(it.time, 1 / it.close) }
        val pair = Catalog.asset(sym)?.pair ?: return emptyList()
        return market.klines(pair, period.interval, period.limit)
    }

    fun usdValue(sym: String, qty: Double): Double? = _state.value.quotes[sym.uppercase()]?.price?.let { it * qty }
}

/* ============================================================
   MONEY — PIN, deposit address, withdrawals, internal send by e-mail. Every operation is decided by the server;
   an idempotency key is created once per operation and REUSED on retry, so a repeat can never debit twice.
   ============================================================ */
sealed interface PinResult {
    data class Granted(val grant: String) : PinResult
    data class Wrong(val remaining: Int?) : PinResult
    data class Locked(val until: String?) : PinResult
    data object NoPin : PinResult
}

class MoneyRepository(private val api: SupabaseApi) {
    fun newIdempotencyKey(): String = "and-" + UUID.randomUUID().toString()

    suspend fun hasPin(): Boolean = api.rpc("pin_status").obj()?.bool("has_pin") ?: false

    suspend fun verifyPin(pin: String): PinResult {
        val o = api.rpc("verify_pin", buildJsonObject { put("p_pin", pin) }).obj() ?: return PinResult.Wrong(null)
        o.str("grant")?.let { if (o.bool("ok")) return PinResult.Granted(it) }
        return when (o.str("error")) {
            "pin_locked" -> PinResult.Locked(o.str("locked_until"))
            "no_pin", "pin_not_set" -> PinResult.NoPin
            else -> PinResult.Wrong(o.str("remaining")?.toIntOrNull())
        }
    }

    /* Deposit: the address comes ONLY from the server (the account's own address for this network, created by the server on the first request).
       "Unavailable" is shown only when the server says it has none; an address that fails the local format check is reported as Invalid, never hidden. */
    sealed interface DepositAddress { data class Ready(val address: String) : DepositAddress; data object Unavailable : DepositAddress; data object Invalid : DepositAddress }
    suspend fun depositAddress(asset: String, network: String): DepositAddress {
        suspend fun read(): DepositAddress {
            val a = (api.rpc("get_receive_address", buildJsonObject { put("p_asset", asset); put("p_network", network) }) as? JsonPrimitive)?.content?.trim().orEmpty()
            return if (a.isEmpty()) DepositAddress.Unavailable else if (Validation.addressOk(network, a)) DepositAddress.Ready(a) else DepositAddress.Invalid
        }
        return try { read() } catch (e: ApiException) {
            when (e.code) {
                "deposit_address_unavailable" -> DepositAddress.Unavailable
                /* first request of this account: the server creates its addresses (one per network, each with its own key), then we read ours */
                "address_pending" -> { api.ensureWalletAddresses(); try { read() } catch (e2: ApiException) { if (e2.code == "deposit_address_unavailable" || e2.code == "address_pending") DepositAddress.Unavailable else throw e2 } }
                else -> throw e
            }
        }
    }

    suspend fun bankOverview(): BankOverview = Parse.bankOverview(api.rpc("withdraw_overview").obj() ?: JsonObject(emptyMap()))
    suspend fun cryptoOverview(): CryptoOverview = Parse.cryptoOverview(api.rpc("crypto_withdraw_overview").obj() ?: JsonObject(emptyMap()))

    data class Submitted(val id: String?, val reference: String?, val status: String, val replayed: Boolean)
    private fun submitted(o: JsonObject?): Submitted {
        if (o == null || (o["ok"] as? JsonPrimitive)?.content == "false") throw ApiException(o?.str("error") ?: "unknown", o?.toString() ?: "empty")
        return Submitted(o.str("id") ?: o.str("transaction_id"), o.str("reference"), o.str("status") ?: "PENDING", o.bool("replayed"))
    }

    suspend fun requestBankWithdrawal(amount: BigDecimal, holder: String, bankCode: String, account: String, iban: String?, key: String) = submitted(api.rpc("withdraw_request", buildJsonObject {
        put("p_amount", JsonPrimitive(amount)); put("p_holder", holder); put("p_bank_code", bankCode); put("p_account", account); put("p_iban", iban?.ifBlank { null }); put("p_key", key)
    }).obj())

    suspend fun requestCryptoWithdrawal(asset: String, network: String, address: String, memo: String?, amount: BigDecimal, key: String, grant: String) = submitted(api.rpc("crypto_withdraw_request", buildJsonObject {
        put("p_asset", asset); put("p_network", network); put("p_address", address.trim()); put("p_memo", memo?.ifBlank { null }); put("p_amount", JsonPrimitive(amount))
        put("p_idempotency_key", key); put("p_pin_grant", grant)
    }).obj())

    suspend fun cancelBank(id: String) { api.rpc("withdraw_cancel", buildJsonObject { put("p_id", id) }) }
    suspend fun cancelCrypto(id: String) { api.rpc("crypto_withdraw_cancel", buildJsonObject { put("p_id", id) }) }

    /* Internal send by e-mail: the server finds the account (masked name only) — the sender never sees the e-mail list. */
    suspend fun findByEmail(email: String): Recipient? = api.rpc("find_user_by_email", buildJsonObject { put("p_email", email.trim()) }).arr().firstOrNull().obj()?.let {
        Recipient(it.str("yor_id") ?: return null, it.str("display_name") ?: "OM Wallet", it.bool("self"))
    }

    /* Recorded PENDING; the amount is held. Only the administrator's confirmation credits the recipient (and sends the one e-mail). */
    /* 14.5 — swap / Spot market order. 1) the server fixes the price (Edge function crypto-swap, Binance, 30 s);
       2) swap_execute (PIN grant, idempotency key) holds the amount paid and records the operation IN PROGRESS. Nothing is credited here:
       only the administrator's confirmation credits the crypto bought. */
    data class SwapQuote(val id: String, val fromAsset: String, val fromNetwork: String, val toAsset: String, val toNetwork: String,
                         val fromAmount: Double, val toAmount: Double, val price: Double, val source: String, val side: String?, val expiresAt: Long)
    suspend fun swapQuote(fromAsset: String, fromNetwork: String, toAsset: String, toNetwork: String, amount: BigDecimal, side: String?): SwapQuote {
        val o = api.function("crypto-swap", buildJsonObject {
            put("from_asset", fromAsset); put("from_network", fromNetwork); put("to_asset", toAsset); put("to_network", toNetwork)
            put("from_amount", amount.toPlainString()); if (side != null) put("side", side)
        }).obj() ?: throw ApiException("unknown", "empty answer")
        if (!o.bool("ok")) throw ApiException(o.str("error") ?: "unknown", o.str("error") ?: "refused")
        val q = o["quote"].obj() ?: throw ApiException("unknown", "no quote")
        return SwapQuote(q.str("id") ?: "", q.str("from_asset") ?: fromAsset, q.str("from_network") ?: fromNetwork, q.str("to_asset") ?: toAsset, q.str("to_network") ?: toNetwork,
            q.num("from_amount"), q.num("to_amount"), q.num("price"), q.str("source") ?: "binance", q.str("side"), q.time("expires_at"))
    }
    suspend fun swapExecute(quoteId: String, key: String, grant: String) = submitted(api.rpc("swap_execute", buildJsonObject {
        put("p_quote", quoteId); put("p_idempotency_key", key); put("p_pin_grant", grant)
    }).obj())

    suspend fun sendInternal(toYorId: String, asset: String, network: String, amount: BigDecimal, note: String?, key: String, grant: String) = submitted(api.rpc("transfer_crypto", buildJsonObject {
        put("p_to_yor_id", toYorId); put("p_asset", asset); put("p_network", network); put("p_amount", JsonPrimitive(amount)); put("p_note", note?.ifBlank { null })
        put("p_idempotency_key", key); put("p_pin_grant", grant)
    }).obj())
}

/* ============================================================
   ADMIN — every call is refused by the server unless is_admin(). One Confirm per transaction; a repeated call returns "already".
   ============================================================ */
data class BankAdminItem(val id: String, val reference: String?, val name: String?, val yorId: String?, val amount: Double, val holder: String?, val bankName: String?,
                         val account: String?, val iban: String?, val status: String, val createdAt: Long)

class AdminRepository(private val api: SupabaseApi) {
    suspend fun transactions(status: String?): List<AdminTx> =
        api.rpc("admin_tx_list", buildJsonObject { put("p_status", status); put("p_limit", 200) }).arr().mapNotNull { it.obj() }.map(Parse::adminTx)

    data class Confirmed(val already: Boolean, val emailQueued: Boolean)
    suspend fun confirm(id: String): Confirmed {
        val o = api.rpc("admin_tx_confirm", buildJsonObject { put("p_tx", id) }).obj()
        return Confirmed(o?.bool("already") ?: false, o?.bool("email") ?: false)
    }
    suspend fun reject(id: String, reason: String) { api.rpc("admin_tx_reject", buildJsonObject { put("p_tx", id); put("p_reason", reason) }) }
    /* Pause: the transaction stays PENDING (amount still held) and can be confirmed or refused afterwards. Idempotent on the server. */
    suspend fun pause(id: String) { api.rpc("admin_tx_pause", buildJsonObject { put("p_tx", id) }) }

    suspend fun cryptoWithdrawals(status: String?): List<CryptoWithdrawal> =
        api.rpc("admin_crypto_withdrawal_list", buildJsonObject { put("p_status", status); put("p_limit", 200) }).arr().mapNotNull { it.obj() }.map(Parse::cryptoWithdrawal)
    suspend fun cryptoProcess(id: String) { api.rpc("admin_crypto_withdrawal_process", buildJsonObject { put("p_id", id) }) }
    suspend fun cryptoComplete(id: String, hash: String) { api.rpc("admin_crypto_withdrawal_complete", buildJsonObject { put("p_id", id); put("p_tx_hash", hash.trim()) }) }
    suspend fun cryptoReject(id: String, reason: String) { api.rpc("admin_crypto_withdrawal_reject", buildJsonObject { put("p_id", id); put("p_reason", reason) }) }

    suspend fun bankWithdrawals(status: String?): List<BankAdminItem> =
        api.rpc("admin_withdrawal_list", buildJsonObject { put("p_status", status); put("p_limit", 200) }).arr().mapNotNull { it.obj() }.map {
            BankAdminItem(it.str("id") ?: "", it.str("reference"), it.str("full_name"), it.str("yor_id"), it.num("amount"), it.str("holder"), it.str("bank_name"),
                it.str("account_number"), it.str("iban"), it.str("status") ?: "PENDING", it.time("created_at"))
        }
    suspend fun bankDecide(id: String, approve: Boolean, note: String?) { api.rpc("admin_withdrawal_decide", buildJsonObject { put("p_id", id); put("p_approve", approve); put("p_note", note) }) }
    suspend fun bankMarkPaid(id: String, bankRef: String) { api.rpc("admin_withdrawal_mark_paid", buildJsonObject { put("p_id", id); put("p_bank_ref", bankRef.trim()) }) }

    suspend fun stats(): JsonObject? = api.rpc("admin_console_stats").obj()
}
