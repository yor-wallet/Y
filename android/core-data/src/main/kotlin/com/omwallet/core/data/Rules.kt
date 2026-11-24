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

    /* Sign-up phone, same rule as the web app (js/core/helpers.js signupPhone) and the server (handle_new_user: ^\+[0-9]{8,15}$):
       the country's dial code + the national number; « +… » or « 00… » typed in full is accepted if it starts with that dial code;
       a leading 0 of the national number is dropped. Returns « +96891234567 », or null when the number is not usable. */
    fun signupPhone(dial: String, raw: String): String? {
        val dd = dial.filter { it.isDigit() }
        val v = raw.trim()
        if (dd.isEmpty() || v.isEmpty() || Regex("[^\\d+\\s().-]").containsMatchIn(v)) return null
        var d = v.replace(Regex("[^\\d+]"), "")
        val full = when {
            d.startsWith("+") -> d.drop(1)
            d.startsWith("00") -> d.drop(2)
            else -> { d = d.removePrefix("0"); dd + d }
        }
        if (!Regex("^\\d+$").matches(full) || !full.startsWith(dd)) return null
        if (full.length - dd.length < 5 || full.length < 8 || full.length > 15) return null
        return "+$full"
    }
    const val PASSWORD_MIN = 8

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

/* Countries offered for the sign-up phone (same list and order as the web app: js/data/reference-data.js COUNTRY_DATA). */
object Countries {
    data class Country(val iso: String, val dial: String, val en: String, val fr: String, val ar: String) {
        fun name(lang: String) = when (lang) { "fr" -> fr; "ar" -> ar; else -> en }
    }
    val all = listOf(
        Country("OM", "+968", "Oman", "Oman", "عُمان"),
        Country("AE", "+971", "United Arab Emirates", "Émirats arabes unis", "الإمارات"),
        Country("SA", "+966", "Saudi Arabia", "Arabie saoudite", "السعودية"),
        Country("QA", "+974", "Qatar", "Qatar", "قطر"),
        Country("KW", "+965", "Kuwait", "Koweït", "الكويت"),
        Country("BH", "+973", "Bahrain", "Bahreïn", "البحرين"),
        Country("US", "+1", "United States", "États-Unis", "الولايات المتحدة"),
        Country("FR", "+33", "France", "France", "فرنسا"),
        Country("GB", "+44", "United Kingdom", "Royaume-Uni", "المملكة المتحدة"),
        Country("CI", "+225", "Côte d'Ivoire", "Côte d'Ivoire", "ساحل العاج"),
        Country("ML", "+223", "Mali", "Mali", "مالي"),
        Country("BF", "+226", "Burkina Faso", "Burkina Faso", "بوركينا فاسو"),
        Country("GN", "+224", "Guinea", "Guinée", "غينيا"),
        Country("SD", "+249", "Sudan", "Soudan", "السودان"),
        Country("EG", "+20", "Egypt", "Égypte", "مصر"),
    )
    fun of(iso: String) = all.firstOrNull { it.iso == iso } ?: all.first()
}
