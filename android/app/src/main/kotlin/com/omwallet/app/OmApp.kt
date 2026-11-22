package com.omwallet.app

import android.app.Application
import com.omwallet.core.data.CacheCleanupWorker
import com.omwallet.core.data.OmGraph

class OmApp : Application() {
    override fun onCreate() {
        super.onCreate()
        OmGraph.get(this)                       /* small graph, created once, no reflection */
        CacheCleanupWorker.schedule(this)       /* recreatable cache only — never financial data */
    }
}
