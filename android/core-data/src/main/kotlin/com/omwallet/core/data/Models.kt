package com.omwallet.core.data

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import java.time.OffsetDateTime

/* ---------- small JSON helpers (the server answers with jsonb / PostgREST rows) ---------- */
internal fun JsonElement?.obj(): JsonObject? = this as? JsonObject
internal fun JsonElement?.arr(): List<JsonElement> = (this as? JsonArray)?.toList() ?: emptyList()
internal fun JsonObject.str(k: String): String? = (this[k] as? JsonPrimitive)?.takeIf { it !is JsonNull }?.content?.takeIf { it.isNotEmpty() }
internal fun JsonObject.num(k: String): Double = str(k)?.toDoubleOrNull() ?: 0.0
internal fun JsonObject.bool(k: String): Boolean = (this[k] as? JsonPrimitive)?.booleanOrNull ?: false
internal fun JsonObject.time(k: String): Long = str(k)?.let { runCatching { OffsetDateTime.parse(it.replace(" ", "T").let { s -> if (Regex("[+-]\\d\\d$").containsMatchIn(s)) "$s:00" else s }).toInstant().toEpochMilli() }.getOrNull() } ?: 0L

/* ---------- domain ---------- */
data class Profile(val uid: String, val yorId: String?, val email: String?, val role: String?, val firstName: String, val lastName: String, val status: String?) {
    val displayName get() = listOf(firstName, lastName).filter { it.isNotBlank() }.joinToString(" ").ifBlank { email ?: "OM Wallet" }
}

data class FiatAccount(val currency: String, val balance: Double, val available: Double, val reserved: Double)

data class Holding(val asset: String, val network: String?, val balance: Double, val available: Double, val locked: Double)

/* Totals per asset across networks (what the user owns; network detail stays available). */
data class AssetPosition(val asset: String, val balance: Double, val available: Double, val locked: Double, val networks: List<Holding>)

enum class Direction { IN, OUT, SELF }

data class Tx(
    val id: String, val reference: String?, val kind: String, val direction: Direction, val asset: String?, val network: String?,
    val amount: Double, val fee: Double, val total: Double, val status: String, val note: String?,
    val counterpartyName: String?, val counterpartyId: String?, val createdAt: Long,
    val adminConfirm: Boolean, val flow: String?, val address: String?,
) {
    /* CFA (XOF) history stays on the server and in the archive view: it is never converted, never shown as a crypto balance. */
    val isLegacyCfa get() = asset.equals("XOF", true)
}

data class Recipient(val yorId: String, val displayName: String, val self: Boolean)

data class BankWithdrawal(val id: String, val reference: String?, val amount: Double, val holder: String?, val bankName: String?, val account: String?, val status: String,
                          val adminNote: String?, val paidRef: String?, val createdAt: Long, val decidedAt: Long, val paidAt: Long)
data class Bank(val code: String, val en: String, val fr: String, val ar: String)
data class BankOverview(val enabled: Boolean, val min: Double, val available: Double, val reserved: Double, val banks: List<Bank>, val items: List<BankWithdrawal>)

data class WithdrawNetwork(val asset: String, val network: String, val fee: Double)
data class CryptoWithdrawal(val id: String, val reference: String?, val asset: String, val network: String, val address: String, val memo: String?, val amount: Double, val fee: Double,
                            val status: String, val txHash: String?, val adminNote: String?, val createdAt: Long, val processingAt: Long, val completedAt: Long,
                            val userName: String? = null, val userYorId: String? = null)
data class CryptoOverview(val enabled: Boolean, val kycRequired: Boolean, val networks: List<WithdrawNetwork>, val balances: Map<String, Double>, val items: List<CryptoWithdrawal>)

data class AdminTx(val id: String, val reference: String?, val kind: String, val asset: String?, val network: String?, val amount: Double, val status: String,
                   val createdAt: Long, val confirmedAt: Long, val note: String?, val senderName: String?, val senderId: String?,
                   val receiverName: String?, val receiverId: String?, val receiverHasEmail: Boolean, val emailStatus: String?, val paused: Boolean = false)

/* ---------- parsing ---------- */
object Parse {
    fun profile(o: JsonObject) = Profile(o.str("id") ?: "", o.str("yor_id"), o.str("email"), o.str("role"), o.str("first_name") ?: "", o.str("last_name") ?: "", o.str("status"))
    fun account(o: JsonObject) = FiatAccount(o.str("currency") ?: "", o.num("balance"), o.num("available_balance"), o.num("reserved_balance"))
    fun holding(o: JsonObject) = Holding(o.str("asset") ?: "", o.str("network"), o.num("balance"), o.num("available_balance"), o.num("locked_balance"))
    fun tx(o: JsonObject): Tx {
        val meta = o["meta"].obj()
        return Tx(
            id = o.str("id") ?: "", reference = o.str("reference"), kind = o.str("kind") ?: "", asset = o.str("asset"), network = o.str("network"),
            direction = when (o.str("direction")?.uppercase()) { "IN" -> Direction.IN; "SELF" -> Direction.SELF; else -> Direction.OUT },
            amount = o.num("amount"), fee = o.num("fee"), total = o.num("total"), status = o.str("status")?.uppercase() ?: "PENDING", note = o.str("note"),
            counterpartyName = o.str("counterparty_name"), counterpartyId = o.str("counterparty_yor_id"), createdAt = o.time("created_at"),
            adminConfirm = meta?.str("confirm") == "ADMIN", flow = meta?.str("flow"), address = meta?.str("address"),
        )
    }
    fun bankOverview(o: JsonObject) = BankOverview(
        enabled = o.bool("enabled"), min = o.num("min"), available = o.num("available"), reserved = o.num("reserved"),
        banks = o["banks"].arr().mapNotNull { it.obj() }.map { Bank(it.str("code") ?: "", it.str("en") ?: "", it.str("fr") ?: it.str("en") ?: "", it.str("ar") ?: it.str("en") ?: "") },
        items = o["items"].arr().mapNotNull { it.obj() }.map {
            BankWithdrawal(it.str("id") ?: "", it.str("reference"), it.num("amount"), it.str("holder"), it.str("bank_name"), it.str("account_number"), it.str("status") ?: "PENDING",
                it.str("admin_note"), it.str("paid_ref"), it.time("created_at"), it.time("decided_at"), it.time("paid_at"))
        },
    )
    fun cryptoWithdrawal(o: JsonObject) = CryptoWithdrawal(
        o.str("id") ?: "", o.str("reference"), o.str("asset") ?: "", o.str("network") ?: "", o.str("address") ?: "", o.str("memo"), o.num("amount"), o.num("fee"),
        o.str("status") ?: "PENDING", o.str("tx_hash"), o.str("admin_note"), o.time("created_at"), o.time("processing_at"), o.time("completed_at"),
        o.str("full_name"), o.str("yor_id"),
    )
    fun cryptoOverview(o: JsonObject) = CryptoOverview(
        enabled = o.bool("enabled"), kycRequired = o.bool("kyc_required"),
        networks = o["networks"].arr().mapNotNull { it.obj() }.map { WithdrawNetwork(it.str("asset") ?: "", it.str("network") ?: "", it.num("fee")) },
        balances = o["balances"].obj()?.mapValues { (_, v) -> (v as? JsonPrimitive)?.content?.toDoubleOrNull() ?: 0.0 } ?: emptyMap(),
        items = o["items"].arr().mapNotNull { it.obj() }.map(::cryptoWithdrawal),
    )
    fun adminTx(o: JsonObject): AdminTx {
        val s = o["sender"].obj(); val r = o["receiver"].obj(); val e = o["email"].obj()
        return AdminTx(o.str("id") ?: "", o.str("reference"), o.str("kind") ?: "", o.str("asset"), o.str("network"), o.num("amount"), o.str("status") ?: "PENDING",
            o.time("created_at"), o.time("confirmed_at"), o.str("note"), s?.str("name"), s?.str("yor_id"), r?.str("name"), r?.str("yor_id"), r?.bool("has_email") ?: false, e?.str("status"), o.bool("paused"))
    }
}
