package com.omwallet.core.data

import com.omwallet.core.network.OmJson
import kotlinx.serialization.json.JsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class RulesTest {
    @Test fun addresses_follow_the_server_formats() {
        assertTrue(Validation.addressOk("tron", "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"))
        assertFalse(Validation.addressOk("tron", "0xdAC17F958D2ee523a2206206994597C13D831ec7"))
        assertTrue(Validation.addressOk("ethereum", "0xdAC17F958D2ee523a2206206994597C13D831ec7"))
        assertFalse(Validation.addressOk("ethereum", "0xdAC17F958D2ee523a2206206994597C13D831ec"))      /* 39 hex */
        assertTrue(Validation.addressOk("bitcoin", "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"))
        assertFalse(Validation.addressOk("bitcoin", "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdO"))      /* O is not bech32 */
        assertTrue(Validation.addressOk("solana", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"))
        assertTrue(Validation.addressOk("xrp", "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"))
        assertFalse(Validation.addressOk("unknown-net", "anything"))
    }

    @Test fun amounts_are_checked_like_the_server() {
        assertEquals("1.5", Validation.parseAmount("1,5", 6)!!.toPlainString())
        assertNull(Validation.parseAmount("0", 6))
        assertNull(Validation.parseAmount("-1", 6))
        assertNull(Validation.parseAmount("1e3", 6))
        assertNull(Validation.parseAmount("1.1234567", 6))
        assertEquals(Validation.AmountError.TooManyDecimals, Validation.checkAmount("1.1234567", 6, 10.0))
        assertEquals(Validation.AmountError.Insufficient, Validation.checkAmount("9.5", 6, 10.0, fee = 1.0))
        assertEquals(Validation.AmountError.BelowMinimum, Validation.checkAmount("5", 3, 100.0, minimum = 10.0))
        assertNull(Validation.checkAmount("9", 6, 10.0, fee = 1.0))
        assertTrue(Validation.emailOk("person@example.com"))
        assertFalse(Validation.emailOk("person@example"))
    }

    @Test fun honest_status_wording() {
        assertEquals(Stage.Pending, Status.internal("PENDING"))
        assertEquals(Stage.Done, Status.internal("CONFIRMED"))
        assertEquals(Stage.Failed, Status.internal("REJECTED"))
        assertEquals(Stage.Approved, Status.cryptoWithdrawal("PROCESSING"))
        assertEquals(Stage.Done, Status.cryptoWithdrawal("COMPLETED"))
        assertEquals(Stage.Approved, Status.bankWithdrawal("APPROVED"))
        assertEquals(Stage.Done, Status.bankWithdrawal("PAID"))
    }

    @Test fun formats_always_show_the_sign_and_never_invent() {
        assertEquals("+1.25%", Fmt.pct(1.25))
        assertEquals("−0.50%", Fmt.pct(-0.5))
        assertEquals("—", Fmt.pct(null))
        assertEquals("—", Fmt.money(null))
        assertEquals("$64,000.50", Fmt.money(64000.5))
        assertEquals("1.000 OMR", Fmt.money(2.6008, DisplayCurrency.OMR))
        assertEquals("0.5 BTC", Fmt.qty(0.5, "BTC"))
        assertEquals("••••••", Fmt.masked("$1.00", true))
    }

    @Test fun explorer_links_only_for_real_hashes() {
        assertEquals("https://tronscan.org/#/transaction/" + "a".repeat(64), Catalog.explorerUrl("tron", "a".repeat(64)))
        assertNull(Catalog.explorerUrl("tron", "not a hash"))
        assertNull(Catalog.explorerUrl("nope", "a".repeat(64)))
    }

    @Test fun parse_my_transactions_row() {
        val row = OmJson.parseToJsonElement(
            """{"id":"7b0c","reference":"OMW-1","kind":"CRYPTO_TRANSFER","direction":"OUT","asset":"USDT","network":"tron","amount":"12.5","fee":"0","total":"12.5",
               "status":"PENDING","note":null,"meta":{"confirm":"ADMIN"},"counterparty_yor_id":"OM123","counterparty_name":"Sara K.","created_at":"2026-11-22T10:15:00.123+00:00"}""",
        ) as JsonObject
        val t = Parse.tx(row)
        assertEquals(Direction.OUT, t.direction)
        assertTrue(t.adminConfirm)
        assertEquals(12.5, t.amount, 0.0)
        assertEquals(Stage.Pending, Status.tx(t))
        assertEquals(1795342500123L, t.createdAt)
        val cfa = Parse.tx(OmJson.parseToJsonElement("""{"id":"x","kind":"FIAT_TRANSFER","asset":"XOF","amount":"5000","status":"CONFIRMED","created_at":"2025-01-01 10:00:00+00"}""") as JsonObject)
        assertTrue(cfa.isLegacyCfa)
        assertTrue(cfa.createdAt > 0)
    }

    @Test fun parse_admin_list_item() {
        val o = OmJson.parseToJsonElement(
            """{"id":"t1","reference":"OMW-9","kind":"CRYPTO_TRANSFER","asset":"BTC","network":"bitcoin","amount":0.01,"status":"PENDING","created_at":"2026-11-22T10:00:00+00:00",
               "sender":{"name":"A B","yor_id":"OM1"},"receiver":{"name":"C D","yor_id":"OM2","has_email":true},"email":null}""",
        ) as JsonObject
        val a = Parse.adminTx(o)
        assertEquals("A B", a.senderName); assertEquals("C D", a.receiverName); assertTrue(a.receiverHasEmail); assertNull(a.emailStatus)
    }
}
