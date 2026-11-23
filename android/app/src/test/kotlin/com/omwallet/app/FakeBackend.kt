package com.omwallet.app

import okhttp3.mockwebserver.Dispatcher
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.RecordedRequest
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Collections
import kotlin.math.sin

/* TEST FIXTURE ONLY: a local HTTP server answering like Supabase (PostgREST / GoTrue) and Binance REST, so screens can be
   exercised end-to-end on the JVM. None of these values is ever shipped in the app or shown to a real user. */
class FakeBackend : Dispatcher() {
    val calls: MutableList<Pair<String, String>> = Collections.synchronizedList(mutableListOf())
    @Volatile var admin = true
    @Volatile var confirmed = false
    @Volatile var paused = false
    /* deposit address: "unavailable" (server has none) · "pending" (created on first request) · "ok" */
    @Volatile var addr = "unavailable"
    @Volatile var addrCreated = false
    private fun ago(minutes: Long) = Instant.now().minus(minutes, ChronoUnit.MINUTES).toString()
    private fun ok(body: String) = MockResponse().setHeader("Content-Type", "application/json").setBody(body)
    private fun err(code: Int, msg: String) = MockResponse().setResponseCode(code).setHeader("Content-Type", "application/json").setBody("""{"code":"P0001","message":"$msg"}""")

    override fun dispatch(request: RecordedRequest): MockResponse {
        val path = request.path ?: ""
        val body = request.body.readUtf8()
        calls += path to body
        val fn = path.substringAfter("/rest/v1/rpc/", "").substringBefore('?')
        return when {
            path.startsWith("/auth/v1/token") ->
                if (body.contains("wrong")) MockResponse().setResponseCode(400).setBody("""{"error":"invalid_grant","error_description":"Invalid login credentials"}""")
                else ok("""{"access_token":"t-access","refresh_token":"t-refresh","expires_at":${Instant.now().epochSecond + 3600},"user":{"id":"u-1","email":"amina@example.com"}}""")
            path.startsWith("/auth/v1/logout") -> MockResponse().setResponseCode(204)
            path.startsWith("/rest/v1/profiles") -> ok("""[{"id":"u-1","yor_id":"OM7731","email":"amina@example.com","role":"user","first_name":"Amina","last_name":"Al Balushi","status":"ACTIVE"}]""")
            path.startsWith("/rest/v1/accounts") -> ok("""[{"currency":"OMR","balance":"25.500","available_balance":"20.500","reserved_balance":"5.000"},{"currency":"XOF","balance":"120000","available_balance":"120000","reserved_balance":"0"}]""")
            path.startsWith("/rest/v1/crypto_wallets") -> ok("""[{"asset":"BTC","network":"bitcoin","balance":"0.0123","available_balance":"0.0123","locked_balance":"0"},
                {"asset":"USDT","network":"tron","balance":"150.25","available_balance":"137.75","locked_balance":"12.5"},
                {"asset":"ETH","network":"ethereum","balance":"0.5","available_balance":"0.4","locked_balance":"0.1"}]""")
            fn == "is_admin" -> ok(admin.toString())
            fn == "pin_status" -> ok("""{"has_pin":true,"locked_until":null}""")
            fn == "my_transactions" -> ok("""[
                {"id":"tx-send","reference":"OMW-24A1","kind":"CRYPTO_TRANSFER","direction":"OUT","asset":"USDT","network":"tron","amount":"12.5","fee":"0","total":"12.5","status":"PENDING","meta":{"confirm":"ADMIN"},"counterparty_yor_id":"OM2210","counterparty_name":"Sara K.","created_at":"${ago(12)}"},
                {"id":"tx-in","reference":"OMW-23F0","kind":"CRYPTO_TRANSFER","direction":"IN","asset":"BTC","network":"bitcoin","amount":"0.002","fee":"0","total":"0.002","status":"CONFIRMED","meta":{"confirm":"ADMIN"},"counterparty_name":"Yusuf R.","created_at":"${ago(60 * 26)}"},
                {"id":"tx-wd","reference":"OMW-22C9","kind":"CRYPTO_SEND","direction":"OUT","asset":"ETH","network":"ethereum","amount":"0.1","fee":"0.002","total":"0.102","status":"PROCESSING","meta":{"flow":"CRYPTO_WITHDRAWAL","address":"0x52908400098527886E0F7030069857D2E4169EE7"},"created_at":"${ago(60 * 30)}"},
                {"id":"tx-cfa","reference":"FP-0009","kind":"FIAT_TRANSFER","direction":"IN","asset":"XOF","amount":"50000","fee":"0","total":"50000","status":"CONFIRMED","meta":{},"created_at":"2025-03-02T09:00:00+00:00"}]""")
            path.startsWith("/functions/v1/wallet-addresses") -> { addrCreated = true; ok("""{"ok":true,"addresses":[]}""") }
            fn == "get_receive_address" -> when {
                addr == "ok" || (addr == "pending" && addrCreated) -> ok("\"TZ2nw5y4azp1wkY89kPTBqUPtRhCguWhjY\"")
                addr == "pending" -> err(400, "address_pending")
                else -> err(400, "deposit_address_unavailable")
            }
            fn == "crypto_withdraw_overview" -> ok("""{"enabled":true,"kyc_required":false,
                "networks":[{"asset":"USDT","network":"tron","fee":1},{"asset":"USDT","network":"ethereum","fee":4},{"asset":"BTC","network":"bitcoin","fee":0.0002},{"asset":"ETH","network":"ethereum","fee":0.002}],
                "balances":{"USDT":137.75,"BTC":0.0123,"ETH":0.4},
                "items":[{"id":"cw-1","reference":"OMW-22C9","asset":"ETH","network":"ethereum","address":"0x52908400098527886E0F7030069857D2E4169EE7","amount":0.1,"fee":0.002,"status":"PROCESSING","created_at":"${ago(60 * 30)}","processing_at":"${ago(60 * 29)}"}]}""")
            fn == "withdraw_overview" -> ok("""{"enabled":true,"min":10,"available":20.5,"reserved":5,"banks":[{"code":"BMCT","en":"Bank Muscat","fr":"Bank Muscat","ar":"بنك مسقط"},{"code":"NBO","en":"National Bank of Oman","fr":"National Bank of Oman","ar":"البنك الوطني العماني"}],
                "items":[{"id":"bw-1","reference":"WD-1001","amount":5,"holder":"Amina Al Balushi","bank_name":"Bank Muscat","account_number":"0123456789","status":"PENDING","created_at":"${ago(90)}"}]}""")
            fn == "find_user_by_email" -> if (body.contains("sara@example.com")) ok("""[{"yor_id":"OM2210","display_name":"Sara K.","self":false}]""") else ok("[]")
            fn == "verify_pin" -> if (body.contains("\"123456\"")) ok("""{"ok":true,"grant":"7d0e0c1e-0000-4000-8000-000000000001"}""") else ok("""{"ok":false,"error":"wrong_pin","remaining":2}""")
            fn == "transfer_crypto" -> ok("""{"ok":true,"transaction_id":"tx-new","reference":"OMW-25B7","status":"PENDING","amount":5,"asset":"USDT","network":"tron","receiver":{"yor_id":"OM2210","name":"Sara K."}}""")
            fn == "admin_tx_list" -> if (!admin) err(403, "forbidden") else ok(if (confirmed) "[]" else """[{"id":"atx-1","reference":"OMW-24A1","kind":"CRYPTO_TRANSFER","asset":"USDT","network":"tron","amount":12.5,"status":"PENDING","created_at":"${ago(12)}","note":"Loyer","paused":$paused,"sender":{"name":"Amina Al Balushi","yor_id":"OM7731"},"receiver":{"name":"Sara Khalid","yor_id":"OM2210","has_email":true},"email":null}]""")
            fn == "admin_tx_pause" -> { paused = true; ok("""{"ok":true,"status":"PENDING","paused":true}""") }
            fn == "admin_tx_confirm" -> { val already = confirmed; confirmed = true; ok(if (already) """{"ok":true,"already":true,"id":"atx-1"}""" else """{"ok":true,"id":"atx-1","status":"CONFIRMED","email":true}""") }
            fn == "admin_crypto_withdrawal_list" -> ok("""[{"id":"cw-1","reference":"OMW-22C9","asset":"ETH","network":"ethereum","address":"0x52908400098527886E0F7030069857D2E4169EE7","amount":0.1,"fee":0.002,"status":"PROCESSING","created_at":"${ago(60 * 30)}","full_name":"Amina Al Balushi","yor_id":"OM7731"}]""")
            fn == "admin_withdrawal_list" -> ok("[]")
            path.startsWith("/api/v3/ticker/24hr") -> ok("""[
                {"symbol":"BTCUSDT","lastPrice":"91234.50","openPrice":"90000.00","highPrice":"92000","lowPrice":"89500","volume":"1","quoteVolume":"1500000000"},
                {"symbol":"ETHUSDT","lastPrice":"3050.10","openPrice":"3120.00","highPrice":"3150","lowPrice":"3010","volume":"1","quoteVolume":"800000000"},
                {"symbol":"USDCUSDT","lastPrice":"0.9998","openPrice":"0.9999","highPrice":"1","lowPrice":"0.999","volume":"1","quoteVolume":"900000000"},
                {"symbol":"SOLUSDT","lastPrice":"142.30","openPrice":"138.00","highPrice":"145","lowPrice":"137","volume":"1","quoteVolume":"300000000"},
                {"symbol":"BNBUSDT","lastPrice":"610.00","openPrice":"615.00","highPrice":"620","lowPrice":"605","volume":"1","quoteVolume":"100000000"}]""")
            path.startsWith("/api/v3/klines") -> ok((0 until 96).joinToString(",", "[", "]") { i -> "[${1_790_000_000_000L + i * 900_000L},\"0\",\"0\",\"0\",\"${"%.2f".format(java.util.Locale.US, 90000 + 900 * sin(i / 9.0) + i * 12)}\"]" })
            else -> MockResponse().setResponseCode(404)
        }
    }
    /* the server thread appends while the test thread reads: always read a snapshot taken under the list's lock */
    fun snapshot(): List<Pair<String, String>> = synchronized(calls) { calls.toList() }
    fun called(fn: String) = snapshot().count { it.first.startsWith("/rest/v1/rpc/$fn") }
    fun bodyOf(fn: String) = snapshot().lastOrNull { it.first.startsWith("/rest/v1/rpc/$fn") }?.second
}
