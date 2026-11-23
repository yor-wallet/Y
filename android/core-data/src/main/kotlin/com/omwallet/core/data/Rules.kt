package com.omwallet.core.data

import java.math.BigDecimal

/* Domain rules shared by the screens. The SERVER re-checks every one of them: these only give an immediate answer under the field. */
object Validation {
    /* Same formats as public._crypto_address_ok() on the server. */
    private val ADDRESS = mapOf(
        "bitcoin" to Regex("^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$"),
        "litecoin" to Regex("^(ltc1[02-9ac-hj-np-z]{11,71}|[LM3][1-9A-HJ-NP-Za-km-z]{26,33})$"),
        "ethereum" to Regex("^0x[0-9a-fA-F]{40}$"), "bsc" to Regex("^0x[0-9a-fA-F]{40}$"), "polygon" to Regex("^0x[0-9a-fA-F]{40}$"),
        "arbitrum" to Regex("^0x[0-9a-fA-F]{40}$"), "base" to Regex("^0x[0-9a-fA-F]{40}$"), "avalanche" to Regex("^0x[0-9a-fA-F]{40}$"),
        "tron" to Regex("^T[1-9A-HJ-NP-Za-km-z]{33}$"),
        "solana" to Regex("^[1-9A-HJ-NP-Za-km-z]{32,44}$"),
        "xrp" to Regex("^r[1-9A-HJ-NP-Za-km-z]{24,34}$"),
    )
    fun addressOk(network: String, address: String): Boolean = ADDRESS[network.lowercase()]?.matches(address.trim()) ?: false

    private val EMAIL = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$")
    fun emailOk(email: String): Boolean = email.trim().length in 5..254 && EMAIL.matches(email.trim())

    /* Accepts "1,5" and "1.5"; refuses more decimals than the asset allows, negatives, zero and garbage. */
    fun parseAmount(text: String, maxDecimals: Int): BigDecimal? {
        val t = text.trim().replace(',', '.').replace(" ", "")
        if (!Regex("^\\d+(\\.\\d+)?$").matches(t)) return null
        val v = t.toBigDecimalOrNull() ?: return null
        if (v.signum() <= 0 || v.scale() > maxDecimals) return null
        return v
    }

    enum class AmountError { Invalid, TooManyDecimals, BelowMinimum, Insufficient }
    fun checkAmount(text: String, maxDecimals: Int, available: Double, fee: Double = 0.0, minimum: Double = 0.0): AmountError? {
        val t = text.trim().replace(',', '.')
        if (Regex("^\\d+\\.\\d+$").matches(t) && t.substringAfter('.').length > maxDecimals) return AmountError.TooManyDecimals
        val v = parseAmount(text, maxDecimals)?.toDouble() ?: return AmountError.Invalid
        if (v < minimum) return AmountError.BelowMinimum
        if (v + fee > available + 1e-12) return AmountError.Insufficient
        return null
    }
}

/* Honest status wording (cahier OM Wallet):
   - internal (OM Wallet → OM Wallet): « À confirmer » → « Confirmé par admin » → « Crédité » — confirmation and credit are one atomic server step;
   - blockchain (crypto withdrawal): « Demande reçue » → « Autorisé admin » → « Envoyé · hash enregistré ». The server records the hash typed by the
     administrator (format checked) but does NOT yet verify the network confirmation, so the app never writes « Confirmé blockchain »: it links the
     public explorer instead, where anyone can check it. */
enum class Stage { Pending, Approved, Done, Failed, Cancelled }

object Status {
    fun internal(status: String): Stage = when (status.uppercase()) {
        "CONFIRMED", "SUCCESS", "COMPLETED" -> Stage.Done
        "REJECTED", "FAILED" -> Stage.Failed
        "CANCELLED", "REVERSED" -> Stage.Cancelled
        else -> Stage.Pending
    }
    fun cryptoWithdrawal(status: String): Stage = when (status.uppercase()) {
        "PROCESSING" -> Stage.Approved
        "COMPLETED" -> Stage.Done
        "REJECTED" -> Stage.Failed
        "CANCELLED" -> Stage.Cancelled
        else -> Stage.Pending
    }
    fun bankWithdrawal(status: String): Stage = when (status.uppercase()) {
        "APPROVED", "PROCESSING" -> Stage.Approved
        "PAID", "COMPLETED" -> Stage.Done
        "REJECTED" -> Stage.Failed
        "CANCELLED" -> Stage.Cancelled
        else -> Stage.Pending
    }
    fun tx(t: Tx): Stage = if (t.flow == "CRYPTO_WITHDRAWAL") cryptoWithdrawal(if (t.status == "CONFIRMED") "COMPLETED" else t.status) else internal(t.status)
}
