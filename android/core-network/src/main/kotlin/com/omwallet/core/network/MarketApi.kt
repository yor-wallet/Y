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
/* 14.5 — Spot: full candles, order book and market trades of one pair (Binance public data), plus their live stream */
data class Ohlc(val time: Long, val open: Double, val high: Double, val low: Double, val close: Double)
data class Book(val bids: List<Pair<Double, Double>>, val asks: List<Pair<Double, Double>>)
data class MarketTrade(val price: Double, val qty: Double, val time: Long, val sell: Boolean)
sealed interface PairEvent {
    data class BookEv(val book: Book) : PairEvent
    data class TradeEv(val trade: MarketTrade) : PairEvent
    data class CandleEv(val candle: Ohlc) : PairEvent
}

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

    suspend fun ohlc(pair: String, interval: String, limit: Int): List<Ohlc> = withContext(Dispatchers.IO) {
        http.newCall(Request.Builder().url("$rest/klines?symbol=$pair&interval=$interval&limit=$limit").build()).execute().use { r ->
            if (!r.isSuccessful) throw ApiException("market_unavailable", "http ${r.code}", r.code)
            (OmJson.parseToJsonElement(r.body!!.string()) as JsonArray).map { k ->
                val a = k.jsonArray; fun d(i: Int) = a[i].jsonPrimitive.content.toDouble()
                Ohlc(a[0].jsonPrimitive.content.toLong(), d(1), d(2), d(3), d(4))
            }.filter { it.close > 0 }
        }
    }
    suspend fun depth(pair: String, limit: Int = 10): Book = withContext(Dispatchers.IO) {
        http.newCall(Request.Builder().url("$rest/depth?symbol=$pair&limit=$limit").build()).execute().use { r ->
            if (!r.isSuccessful) throw ApiException("market_unavailable", "http ${r.code}", r.code)
            parseBook(OmJson.parseToJsonElement(r.body!!.string()).jsonObject)
        }
    }
    suspend fun trades(pair: String, limit: Int = 16): List<MarketTrade> = withContext(Dispatchers.IO) {
        http.newCall(Request.Builder().url("$rest/trades?symbol=$pair&limit=$limit").build()).execute().use { r ->
            if (!r.isSuccessful) throw ApiException("market_unavailable", "http ${r.code}", r.code)
            (OmJson.parseToJsonElement(r.body!!.string()) as JsonArray).map {
                val o = it.jsonObject
                MarketTrade(o["price"]!!.jsonPrimitive.content.toDouble(), o["qty"]!!.jsonPrimitive.content.toDouble(), o["time"]!!.jsonPrimitive.content.toLong(),
                    o["isBuyerMaker"]?.jsonPrimitive?.content == "true")
            }.reversed()
        }
    }
    private fun parseBook(o: kotlinx.serialization.json.JsonObject): Book {
        fun side(k: String) = (o[k] as? JsonArray).orEmpty().map { val a = it.jsonArray; a[0].jsonPrimitive.content.toDouble() to a[1].jsonPrimitive.content.toDouble() }
        return Book(side("bids"), side("asks"))
    }
    /* order book (10 levels, every second), every market trade and the current candle of ONE pair; the flow ends on failure */
    fun pairStream(pair: String, interval: String): Flow<PairEvent> = callbackFlow {
        val p = pair.lowercase()
        val url = ws + listOf("$p@depth10@1000ms", "$p@aggTrade", "$p@kline_$interval").joinToString("/")
        val socket = http.newWebSocket(Request.Builder().url(url).build(), object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                runCatching {
                    val m = OmJson.parseToJsonElement(text).jsonObject
                    val stream = m["stream"]?.jsonPrimitive?.content.orEmpty(); val d = m["data"]!!.jsonObject
                    when {
                        stream.contains("@depth") -> trySend(PairEvent.BookEv(parseBook(d)))
                        d["e"]?.jsonPrimitive?.content == "aggTrade" -> trySend(PairEvent.TradeEv(MarketTrade(d["p"]!!.jsonPrimitive.content.toDouble(), d["q"]!!.jsonPrimitive.content.toDouble(),
                            d["T"]!!.jsonPrimitive.content.toLong(), d["m"]?.jsonPrimitive?.content == "true")))
                        d["e"]?.jsonPrimitive?.content == "kline" -> { val k = d["k"]!!.jsonObject; fun n(x: String) = k[x]!!.jsonPrimitive.content.toDouble()
                            trySend(PairEvent.CandleEv(Ohlc(k["t"]!!.jsonPrimitive.content.toLong(), n("o"), n("h"), n("l"), n("c")))) }
                        else -> Unit
                    }
                }
            }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) { close(t) }
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) { close() }
        })
        awaitClose { socket.cancel() }
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
