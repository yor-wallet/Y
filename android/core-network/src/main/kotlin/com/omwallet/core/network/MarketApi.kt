package com.omwallet.core.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.net.URLEncoder

/* REAL market data: Binance public market-data endpoints (REST + WebSocket mini-ticker). Prices in USDT ≈ USD (shown as such).
   USDT itself is derived from USDC/USDT. Nothing is generated: without an answer, the app shows "—" and the connection state. */
data class Ticker(val pair: String, val price: Double, val open: Double, val high: Double, val low: Double, val volume: Double, val quoteVolume: Double, val at: Long) {
    val changePct: Double? get() = if (open > 0) (price / open - 1) * 100 else null
}
data class Candle(val time: Long, val close: Double)

class MarketApi(
    private val http: OkHttpClient = SupabaseApi.defaultClient(),
    private val rest: String = "https://data-api.binance.vision/api/v3",
    private val ws: String = "wss://data-stream.binance.vision/stream?streams=",
) {
    suspend fun tickers(pairs: List<String>): List<Ticker> = withContext(Dispatchers.IO) {
        val q = URLEncoder.encode(pairs.joinToString(",", "[", "]") { "\"$it\"" }, "UTF-8")
        http.newCall(Request.Builder().url("$rest/ticker/24hr?symbols=$q").build()).execute().use { r ->
            if (!r.isSuccessful) throw ApiException("market_unavailable", "http ${r.code}", r.code)
            val now = System.currentTimeMillis()
            (OmJson.parseToJsonElement(r.body!!.string()) as JsonArray).map {
                val o = it.jsonObject
                fun d(k: String) = o[k]?.jsonPrimitive?.content?.toDoubleOrNull() ?: 0.0
                Ticker(o["symbol"]!!.jsonPrimitive.content, d("lastPrice"), d("openPrice"), d("highPrice"), d("lowPrice"), d("volume"), d("quoteVolume"), now)
            }
        }
    }

    suspend fun klines(pair: String, interval: String, limit: Int): List<Candle> = withContext(Dispatchers.IO) {
        http.newCall(Request.Builder().url("$rest/klines?symbol=$pair&interval=$interval&limit=$limit").build()).execute().use { r ->
            if (!r.isSuccessful) throw ApiException("market_unavailable", "http ${r.code}", r.code)
            (OmJson.parseToJsonElement(r.body!!.string()) as JsonArray).map { k ->
                val a = k.jsonArray
                Candle(a[0].jsonPrimitive.content.toLong(), a[4].jsonPrimitive.content.toDouble())
            }.filter { it.close > 0 }
        }
    }

    /* Live stream of mini-tickers; the flow ends on failure so the caller can fall back to polling and reconnect with backoff. */
    fun stream(pairs: List<String>): Flow<Ticker> = callbackFlow {
        val url = ws + pairs.joinToString("/") { it.lowercase() + "@miniTicker" }
        val socket = http.newWebSocket(Request.Builder().url(url).build(), object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                runCatching {
                    val d = OmJson.parseToJsonElement(text).jsonObject["data"]!!.jsonObject
                    fun n(k: String) = d[k]!!.jsonPrimitive.content.toDouble()
                    trySend(Ticker(d["s"]!!.jsonPrimitive.content, n("c"), n("o"), n("h"), n("l"), n("v"), n("q"), System.currentTimeMillis()))
                }
            }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) { close(t) }
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) { close() }
        })
        awaitClose { socket.cancel() }
    }
}
