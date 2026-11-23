package com.omwallet.core.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

val OmJson = Json { ignoreUnknownKeys = true; explicitNulls = false; isLenient = true; coerceInputValues = true }

/* A server refusal carries the database's error code (e.g. insufficient_balance, pin_required): the UI translates it.
   A network failure is "uncertain": the request may have reached the server, so the same idempotency key is reused on retry. */
class ApiException(val code: String, override val message: String, val http: Int = 0, val uncertain: Boolean = false) : Exception(message)

@Serializable data class Session(val accessToken: String, val refreshToken: String, val userId: String, val email: String? = null, val expiresAt: Long = 0)

/* The backend is the source of authority for every balance and status. This client only calls it (auth, PostgREST tables, RPC functions). */
class SupabaseApi(
    private val baseUrl: String = BuildConfig.SUPABASE_URL,
    private val anonKey: String = BuildConfig.SUPABASE_ANON_KEY,
    val http: OkHttpClient = defaultClient(),
) {
    @Volatile var session: Session? = null
    var onSessionChanged: (Session?) -> Unit = {}

    companion object {
        private val JSON = "application/json".toMediaType()
        fun defaultClient(): OkHttpClient = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS).readTimeout(30, TimeUnit.SECONDS).writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(false)              /* never replay a financial POST silently */
            .build()
    }

    private suspend fun execute(req: Request): Response = suspendCancellableCoroutine { cont ->
        val call = http.newCall(req)
        cont.invokeOnCancellation { call.cancel() }
        call.enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) { cont.resumeWithException(ApiException("network", e.message ?: "network", uncertain = true)) }
            override fun onResponse(call: Call, response: Response) { cont.resume(response) }
        })
    }

    private fun parseError(code: Int, body: String, auth: Boolean = false): ApiException {
        val obj = runCatching { OmJson.parseToJsonElement(body).jsonObject }.getOrNull()
        val msg = obj?.get("message")?.jsonPrimitive?.content ?: obj?.get("msg")?.jsonPrimitive?.content
            ?: obj?.get("error_description")?.jsonPrimitive?.content ?: obj?.get("error")?.jsonPrimitive?.content ?: body.take(200)
        val explicit = (obj?.get("error_code") as? kotlinx.serialization.json.JsonPrimitive)?.content?.takeIf { it.contains('_') }
        val key = explicit ?: Regex("[a-z]+(?:_[a-z]+)+").find(msg)?.value ?: when (code) { 400 -> if (auth) "invalid_credentials" else "bad_request"; 401 -> "unauthenticated"; 403 -> "forbidden"; else -> "server_error" }
        return ApiException(key, msg, code)
    }

    /* ---------- auth (GoTrue) ---------- */
    suspend fun signIn(email: String, password: String): Session = auth("password", buildJsonObject { put("email", email); put("password", password) })
    suspend fun refresh(refreshToken: String): Session = auth("refresh_token", buildJsonObject { put("refresh_token", refreshToken) })

    private suspend fun auth(grant: String, body: JsonObject): Session = withContext(Dispatchers.IO) {
        val req = Request.Builder().url("$baseUrl/auth/v1/token?grant_type=$grant").header("apikey", anonKey)
            .post(body.toString().toRequestBody(JSON)).build()
        execute(req).use { r ->
            val text = r.body?.string().orEmpty()
            if (!r.isSuccessful) throw parseError(r.code, text, auth = true)
            val o = OmJson.parseToJsonElement(text).jsonObject
            val user = o["user"]?.jsonObject
            Session(
                accessToken = o["access_token"]!!.jsonPrimitive.content, refreshToken = o["refresh_token"]!!.jsonPrimitive.content,
                userId = user?.get("id")?.jsonPrimitive?.content.orEmpty(), email = user?.get("email")?.jsonPrimitive?.content,
                expiresAt = (o["expires_at"]?.jsonPrimitive?.content?.toLongOrNull() ?: 0L),
            ).also { session = it; onSessionChanged(it) }
        }
    }

    suspend fun signOut() {
        val s = session ?: return
        runCatching {
            withContext(Dispatchers.IO) {
                execute(Request.Builder().url("$baseUrl/auth/v1/logout").header("apikey", anonKey).header("Authorization", "Bearer ${s.accessToken}")
                    .post("{}".toRequestBody(JSON)).build()).close()
            }
        }
        session = null; onSessionChanged(null)
    }

    /* Supabase rotates refresh tokens: two refreshes with the same token would make the second fail (or revoke the session). One refresh at a time,
       and the expiry is checked again inside the lock — whoever waited finds the new token already in place. */
    private val refreshLock = kotlinx.coroutines.sync.Mutex()
    private suspend fun refreshIfStale(stale: Session?) {
        refreshLock.withLock {
            val cur = session ?: throw ApiException("unauthenticated", "not signed in", 401)
            if (stale != null && cur.accessToken != stale.accessToken) return            /* somebody else already refreshed */
            if (stale == null && !(cur.expiresAt > 0 && cur.expiresAt - System.currentTimeMillis() / 1000 < 60)) return
            refresh(cur.refreshToken)
        }
    }
    private suspend fun ensureFresh() { refreshIfStale(null) }

    private fun authed(path: String): Request.Builder = Request.Builder().url("$baseUrl$path").header("apikey", anonKey)
        .header("Authorization", "Bearer ${session?.accessToken ?: anonKey}")

    /* ---------- RPC (database functions) ---------- */
    suspend fun rpc(fn: String, args: JsonObject = JsonObject(emptyMap())): JsonElement = withContext(Dispatchers.IO) {
        ensureFresh()
        suspend fun once(): Response = execute(authed("/rest/v1/rpc/$fn").post(args.toString().toRequestBody(JSON)).build())
        var r = once()
        if (r.code == 401) { val used = session; r.close(); refreshIfStale(used ?: Session("", "", "")); r = once() }    /* expired token: refresh once, shared with concurrent calls */
        r.use {
            val text = it.body?.string().orEmpty()
            if (!it.isSuccessful) throw parseError(it.code, text)
            if (text.isBlank()) JsonNull else OmJson.parseToJsonElement(text)
        }
    }

    /* Asks the server to create THIS account's deposit addresses (idempotent; the server never returns a key). */
    suspend fun ensureWalletAddresses() = withContext(Dispatchers.IO) {
        ensureFresh()
        execute(authed("/functions/v1/wallet-addresses").post("{}".toRequestBody(JSON)).build()).use {
            val text = it.body?.string().orEmpty()
            if (!it.isSuccessful) throw ApiException("address_creation_failed", text.take(200), it.code)
        }
    }

    /* ---------- tables (row-level security: each user reads only their own rows) ---------- */
    suspend fun select(table: String, query: String): JsonArray = withContext(Dispatchers.IO) {
        ensureFresh()
        execute(authed("/rest/v1/$table?$query").get().build()).use {
            val text = it.body?.string().orEmpty()
            if (!it.isSuccessful) throw parseError(it.code, text)
            OmJson.parseToJsonElement(text) as? JsonArray ?: JsonArray(emptyList())
        }
    }
}
