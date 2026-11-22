package com.omwallet.core.data

import java.math.BigDecimal
import java.math.RoundingMode
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.util.Locale
import kotlin.math.abs

/* Reference data — identical to the web app (js/crypto/omx-data.js). Token contracts were read on-chain on 2026-11-22. */
data class Asset(val sym: String, val name: String, val pair: String?, val dp: Int, val nets: List<String>)
data class Network(val id: String, val name: String, val std: String, val native: String, val explorerTx: String, val memo: Boolean = false)

object Catalog {
    val assets = listOf(
        Asset("BTC", "Bitcoin", "BTCUSDT", 8, listOf("bitcoin")),
        Asset("ETH", "Ethereum", "ETHUSDT", 8, listOf("ethereum", "arbitrum", "base")),
        Asset("USDT", "Tether", null, 6, listOf("tron", "ethereum", "bsc", "polygon", "solana")),
        Asset("USDC", "USD Coin", "USDCUSDT", 6, listOf("ethereum", "bsc", "polygon", "solana", "arbitrum", "base", "avalanche")),
        Asset("BNB", "BNB", "BNBUSDT", 8, listOf("bsc")),
        Asset("SOL", "Solana", "SOLUSDT", 8, listOf("solana")),
        Asset("TRX", "TRON", "TRXUSDT", 6, listOf("tron")),
        Asset("XRP", "XRP", "XRPUSDT", 6, listOf("xrp")),
        Asset("LTC", "Litecoin", "LTCUSDT", 8, listOf("litecoin")),
        Asset("DOGE", "Dogecoin", "DOGEUSDT", 8, emptyList()),
        Asset("ADA", "Cardano", "ADAUSDT", 6, emptyList()),
        Asset("AVAX", "Avalanche", "AVAXUSDT", 8, listOf("avalanche")),
        Asset("POL", "Polygon", "POLUSDT", 8, listOf("polygon")),
    )
    val networks = listOf(
        Network("bitcoin", "Bitcoin", "BTC", "BTC", "https://mempool.space/tx/{h}"),
        Network("ethereum", "Ethereum", "ERC20", "ETH", "https://etherscan.io/tx/{h}"),
        Network("bsc", "BNB Smart Chain", "BEP20", "BNB", "https://bscscan.com/tx/{h}"),
        Network("tron", "TRON", "TRC20", "TRX", "https://tronscan.org/#/transaction/{h}"),
        Network("solana", "Solana", "SPL", "SOL", "https://solscan.io/tx/{h}"),
        Network("polygon", "Polygon PoS", "Polygon", "POL", "https://polygonscan.com/tx/{h}"),
        Network("arbitrum", "Arbitrum One", "Arbitrum", "ETH", "https://arbiscan.io/tx/{h}"),
        Network("base", "Base", "Base", "ETH", "https://basescan.org/tx/{h}"),
        Network("avalanche", "Avalanche C-Chain", "C-Chain", "AVAX", "https://snowtrace.io/tx/{h}"),
        Network("xrp", "XRP Ledger", "XRPL", "XRP", "https://xrpscan.com/tx/{h}", memo = true),
        Network("litecoin", "Litecoin", "LTC", "LTC", "https://litecoinspace.org/tx/{h}"),
    )
    val pairs: List<String> = assets.mapNotNull { it.pair }
    fun asset(sym: String?): Asset? = assets.firstOrNull { it.sym.equals(sym, ignoreCase = true) }
    fun network(id: String?): Network? = networks.firstOrNull { it.id.equals(id, ignoreCase = true) }
    fun explorerUrl(network: String?, hash: String?): String? {
        val n = network(network) ?: return null
        val h = hash?.trim().orEmpty()
        if (!Regex("^[0-9A-Za-z]{32,128}$").matches(h)) return null
        return n.explorerTx.replace("{h}", h)
    }

    /* Official peg: 1 OMR = 2.6008 USD (Central Bank of Oman). A fixed rate, shown as such — not a market quote. */
    const val OMR_PER_USD = 1 / 2.6008
}

enum class DisplayCurrency { USD, OMR }

object Fmt {
    private fun df(min: Int, max: Int) = DecimalFormat("#,##0" + if (max > 0) "." + "0".repeat(min) + "#".repeat(max - min) else "", DecimalFormatSymbols(Locale.US))

    fun money(usd: Double?, cur: DisplayCurrency = DisplayCurrency.USD): String {
        if (usd == null || usd.isNaN() || usd.isInfinite()) return "—"
        return if (cur == DisplayCurrency.OMR) {
            val v = usd * Catalog.OMR_PER_USD
            (if (v < 0) "-" else "") + df(3, 3).format(abs(v)) + " OMR"
        } else {
            val a = abs(usd)
            val d = if (a >= 1) 2 else if (a >= 0.01) 4 else 6
            (if (usd < 0) "-" else "") + "$" + df(d, d).format(a)
        }
    }

    fun qty(v: Double?, sym: String): String {
        if (v == null || v.isNaN()) return "—"
        val a = Catalog.asset(sym)
        val dp = minOf(a?.dp ?: 6, if (v >= 1000) 2 else if (v >= 1) 4 else 8)
        return df(0, dp).format(BigDecimal(v).setScale(dp, RoundingMode.DOWN)) + " " + sym.uppercase()
    }

    /* Always a sign: + for a rise, − (minus) for a fall. */
    fun pct(p: Double?): String = if (p == null || p.isNaN()) "—" else (if (p >= 0) "+" else "−") + String.format(Locale.US, "%.2f", abs(p)) + "%"

    fun masked(text: String, hidden: Boolean) = if (hidden) "••••••" else text
}
