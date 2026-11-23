package com.omwallet.core.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import com.omwallet.core.network.OmJson
import com.omwallet.core.network.Session
import com.omwallet.core.security.SecretStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/* ============================================================
   LOCAL DATA ENGINE
   - Room: an offline MIRROR of what the server returned (transactions, last prices). The server stays the authority; the mirror is
     replaced by every successful refresh and is only used to show the last known state (with its time) when the network is down.
     Nothing in this mirror is ever sent back as a financial fact.
   - DataStore: preferences (hide balance, display currency, favourites).
   - Keystore (core-security): the session token, encrypted.
   ============================================================ */
@Entity(tableName = "tx_mirror")
data class TxRow(@PrimaryKey val id: String, val userId: String, val createdAt: Long, val json: String, val syncedAt: Long)

@Entity(tableName = "price_mirror")
data class PriceRow(@PrimaryKey val pair: String, val price: Double, val open: Double, val at: Long)

@Dao
interface MirrorDao {
    @Query("select * from tx_mirror where userId = :uid order by createdAt desc limit 500") fun transactions(uid: String): Flow<List<TxRow>>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun putTransactions(rows: List<TxRow>)
    @Query("select * from price_mirror") suspend fun prices(): List<PriceRow>
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun putPrices(rows: List<PriceRow>)
    /* prices are recreatable market data: rows older than the TTL are dropped by the cache engine */
    @Query("delete from price_mirror where at < :before") suspend fun dropPricesBefore(before: Long): Int
    /* on sign-out the local copy of this user's activity is removed from the DEVICE only (privacy); the server keeps every record */
    @Query("delete from tx_mirror where userId = :uid") suspend fun forgetUser(uid: String)
}

@Database(entities = [TxRow::class, PriceRow::class], version = 1, exportSchema = true)
abstract class OmDatabase : RoomDatabase() {
    abstract fun mirror(): MirrorDao
    companion object {
        fun create(ctx: Context): OmDatabase = Room.databaseBuilder(ctx, OmDatabase::class.java, "om_wallet.db").build()
        fun inMemory(ctx: Context): OmDatabase = Room.inMemoryDatabaseBuilder(ctx, OmDatabase::class.java).allowMainThreadQueries().build()
    }
}

private val Context.omPrefs: DataStore<Preferences> by preferencesDataStore(name = "om_prefs")

data class UserPrefs(val hideBalance: Boolean = false, val currency: DisplayCurrency = DisplayCurrency.USD, val favorites: Set<String> = setOf("BTC", "ETH", "USDT"))

class PrefsStore(private val store: DataStore<Preferences>) {
    constructor(ctx: Context) : this(ctx.applicationContext.omPrefs)
    private val HIDE = booleanPreferencesKey("hide_balance")
    private val CUR = stringPreferencesKey("display_currency")
    private val FAV = stringSetPreferencesKey("favorites")

    val prefs: Flow<UserPrefs> = store.data.map { p ->
        UserPrefs(p[HIDE] ?: false, runCatching { DisplayCurrency.valueOf(p[CUR] ?: "USD") }.getOrDefault(DisplayCurrency.USD), p[FAV] ?: setOf("BTC", "ETH", "USDT"))
    }
    suspend fun setHidden(v: Boolean) { store.edit { it[HIDE] = v } }
    suspend fun setCurrency(c: DisplayCurrency) { store.edit { it[CUR] = c.name } }
    suspend fun toggleFavorite(sym: String) { store.edit { val cur = it[FAV] ?: setOf("BTC", "ETH", "USDT"); it[FAV] = if (sym in cur) cur - sym else cur + sym } }
}

/* Session persisted encrypted (Android Keystore AES-GCM). Never the password, never a seed phrase. */
class SessionStore(private val secrets: SecretStore) {
    fun load(): Session? = secrets.get("session")?.let { runCatching { OmJson.decodeFromString(Session.serializer(), it) }.getOrNull() }
    fun save(s: Session?) = secrets.put("session", s?.let { OmJson.encodeToString(Session.serializer(), it) })
}
