package com.omwallet.core.data

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.io.File
import java.util.concurrent.TimeUnit

/* ============================================================
   CACHE ENGINE — only RECREATABLE content, by category, each with its own time-to-live:
     http (network responses), charts (rendered chart data), images (logos / promo pictures), prices (market mirror rows).
   It NEVER touches: the Room transaction mirror, preferences, the encrypted session, and of course nothing on the server.
   Financial records are never purged by any engine (server rule: no deletion of data).
   ============================================================ */
class CacheEngine(private val ctx: Context, private val db: OmDatabase? = null) {
    enum class Category(val dir: String, val ttlMs: Long) {
        Http("http", TimeUnit.DAYS.toMillis(2)),
        Charts("charts", TimeUnit.HOURS.toMillis(6)),
        Images("images", TimeUnit.DAYS.toMillis(14)),
    }
    val pricesTtlMs = TimeUnit.DAYS.toMillis(7)

    fun dir(c: Category): File = File(ctx.cacheDir, c.dir).apply { mkdirs() }

    data class Report(val files: Int, val bytes: Long, val prices: Int)

    /* Purges expired files of each category, then trims the oldest while the total is above [maxBytes]. */
    suspend fun purge(now: Long = System.currentTimeMillis(), maxBytes: Long = 64L * 1024 * 1024): Report {
        var files = 0; var bytes = 0L
        Category.entries.forEach { c ->
            dir(c).walkBottomUp().filter { it.isFile && now - it.lastModified() > c.ttlMs }.forEach { f -> val l = f.length(); if (f.delete()) { files++; bytes += l } }
        }
        val all = Category.entries.flatMap { c -> dir(c).walkBottomUp().filter { it.isFile }.toList() }.sortedBy { it.lastModified() }
        var total = all.sumOf { it.length() }
        for (f in all) { if (total <= maxBytes) break; val l = f.length(); if (f.delete()) { files++; bytes += l; total -= l } }
        val prices = db?.mirror()?.dropPricesBefore(now - pricesTtlMs) ?: 0
        return Report(files, bytes, prices)
    }

    fun sizeBytes(): Long = Category.entries.sumOf { c -> dir(c).walkBottomUp().filter { it.isFile }.sumOf { it.length() } }
}

/* Runs the cache engine once a day, only when the device is idle-friendly (battery not low, storage not low). */
class CacheCleanupWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result = runCatching { OmGraph.get(applicationContext).cache.purge() }.fold({ Result.success() }, { Result.retry() })

    companion object {
        fun schedule(ctx: Context) {
            val req = PeriodicWorkRequestBuilder<CacheCleanupWorker>(1, TimeUnit.DAYS)
                .setConstraints(Constraints.Builder().setRequiresBatteryNotLow(true).setRequiresStorageNotLow(false).build()).build()
            WorkManager.getInstance(ctx).enqueueUniquePeriodicWork("om-cache-cleanup", ExistingPeriodicWorkPolicy.KEEP, req)
        }
    }
}
