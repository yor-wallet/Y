package com.omwallet.core.data

import com.omwallet.core.network.ApiException
import com.omwallet.core.network.Session
import com.omwallet.core.network.SupabaseApi
import kotlinx.coroutines.test.runTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.SocketPolicy
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import java.math.BigDecimal

/* The app's side of the server contract, against a local HTTP server that answers like Supabase (PostgREST / GoTrue). */
class ServerContractTest {
    private lateinit var server: MockWebServer
    private lateinit var api: SupabaseApi

    @Before fun setUp() {
        server = MockWebServer(); server.start()
        api = SupabaseApi(server.url("/").toString().trimEnd('/'), "anon-test")
        api.session = Session("access-1", "refresh-1", "user-1", "me@example.com", System.currentTimeMillis() / 1000 + 3600)
    }
    @After fun tearDown() { server.shutdown() }

    private fun json(body: String, code: Int = 200) = MockResponse().setResponseCode(code).setHeader("Content-Type", "application/json").setBody(body)

    @Test fun sign_in_stores_the_session() = runTest {
        api.session = null
        server.enqueue(json("""{"access_token":"a","refresh_token":"r","expires_at":9999999999,"user":{"id":"u-9","email":"x@y.zz"}}"""))
        val s = api.signIn("x@y.zz", "secret")
        assertEquals("u-9", s.userId)
        val req = server.takeRequest()
        assertEquals("/auth/v1/token?grant_type=password", req.path)
        assertEquals("anon-test", req.getHeader("apikey"))
    }

    @Test fun server_refusal_keeps_its_code() = runTest {
        server.enqueue(json("""{"code":"23514","message":"insufficient_balance"}""", 400))
        try { MoneyRepository(api).sendInternal("OM2", "USDT", "tron", BigDecimal("5"), null, "and-key-1", "grant"); fail() }
        catch (e: ApiException) { assertEquals("insufficient_balance", e.code); assertFalse(e.uncertain) }
    }

    @Test fun expired_token_is_refreshed_once_then_the_call_is_replayed() = runTest {
        server.enqueue(json("""{"message":"JWT expired"}""", 401))
        server.enqueue(json("""{"access_token":"access-2","refresh_token":"refresh-2","expires_at":9999999999,"user":{"id":"user-1"}}"""))
        server.enqueue(json("""{"has_pin":true,"locked_until":null}"""))
        assertTrue(MoneyRepository(api).hasPin())
        assertEquals("/rest/v1/rpc/pin_status", server.takeRequest().path)
        assertEquals("/auth/v1/token?grant_type=refresh_token", server.takeRequest().path)
        assertEquals("Bearer access-2", server.takeRequest().getHeader("Authorization"))
    }

    @Test fun network_failure_is_uncertain_and_the_same_key_is_sent_again() = runTest {
        val money = MoneyRepository(api)
        val key = money.newIdempotencyKey()
        server.enqueue(MockResponse().setSocketPolicy(SocketPolicy.DISCONNECT_AFTER_REQUEST))
        try { money.sendInternal("OM2", "USDT", "tron", BigDecimal("5"), null, key, "g1"); fail() } catch (e: ApiException) { assertTrue(e.uncertain) }
        server.enqueue(json("""{"ok":true,"transaction_id":"tx-1","reference":"OMW-1","status":"PENDING"}"""))
        val r = money.sendInternal("OM2", "USDT", "tron", BigDecimal("5"), null, key, "g2")
        assertEquals("PENDING", r.status)
        val first = server.takeRequest().body.readUtf8(); val second = server.takeRequest().body.readUtf8()
        assertTrue(first.contains("\"p_idempotency_key\":\"$key\"")); assertTrue(second.contains("\"p_idempotency_key\":\"$key\""))
    }

    @Test fun pin_answers() = runTest {
        val money = MoneyRepository(api)
        server.enqueue(json("""{"ok":true,"grant":"7d0e0c1e-0000-4000-8000-000000000001"}"""))
        assertTrue(money.verifyPin("123456") is PinResult.Granted)
        server.enqueue(json("""{"ok":false,"error":"wrong_pin","remaining":2}"""))
        assertEquals(PinResult.Wrong(2), money.verifyPin("000000"))
        server.enqueue(json("""{"ok":false,"error":"pin_locked","locked_until":"2026-11-22T12:00:00Z"}"""))
        assertTrue(money.verifyPin("000000") is PinResult.Locked)
    }

    @Test fun no_deposit_address_is_ever_made_up() = runTest {
        server.enqueue(json("""{"code":"22023","message":"deposit_address_unavailable"}""", 400))
        assertEquals(MoneyRepository.DepositAddress.Unavailable, MoneyRepository(api).depositAddress("USDT", "tron"))
        server.enqueue(json("\"not-a-tron-address\""))                  /* something came back but it is not a valid address: reported as Invalid, never shown, never hidden */
        assertEquals(MoneyRepository.DepositAddress.Invalid, MoneyRepository(api).depositAddress("USDT", "tron"))
        server.enqueue(json("\"\""))
        assertEquals(MoneyRepository.DepositAddress.Unavailable, MoneyRepository(api).depositAddress("USDT", "tron"))
        server.enqueue(json("\"TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t\""))
        assertEquals(MoneyRepository.DepositAddress.Ready("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"), MoneyRepository(api).depositAddress("USDT", "tron"))
    }

    @Test fun admin_confirm_is_idempotent() = runTest {
        val admin = AdminRepository(api)
        server.enqueue(json("""{"ok":true,"id":"t1","status":"CONFIRMED","email":true}"""))
        assertEquals(AdminRepository.Confirmed(already = false, emailQueued = true), admin.confirm("t1"))
        server.enqueue(json("""{"ok":true,"already":true,"id":"t1"}"""))
        assertTrue(admin.confirm("t1").already)
        assertTrue(server.takeRequest().body.readUtf8().contains("\"p_tx\":\"t1\""))
    }

    @Test fun find_by_email_returns_only_a_masked_name() = runTest {
        server.enqueue(json("""[{"yor_id":"OM2","display_name":"Sara K.","self":false}]"""))
        assertEquals(Recipient("OM2", "Sara K.", false), MoneyRepository(api).findByEmail(" sara@example.com "))
        assertTrue(server.takeRequest().body.readUtf8().contains("\"p_email\":\"sara@example.com\""))
        server.enqueue(json("[]"))
        assertEquals(null, MoneyRepository(api).findByEmail("nobody@example.com"))
    }
}
