package com.omwallet.app

import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.metrics.performance.JankStats
import com.omwallet.core.data.AuthState
import com.omwallet.core.data.OmGraph
import com.omwallet.core.design.OmTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private var jank: JankStats? = null
    private var frames = 0L
    private var janky = 0L

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        /* balances and addresses are not captured in screenshots / the recent-apps preview */
        if (!BuildConfig.DEBUG) window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
        val g = OmGraph.get(this)
        splash.setKeepOnScreenCondition { g.auth.state.value is AuthState.Loading }
        lifecycleScope.launch { g.auth.restore() }

        /* Live data only while the app is visible: market stream + a 20 s refresh of balances and activity. */
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                g.market.start(this)
                try {
                    while (true) {
                        if (g.auth.state.value is AuthState.SignedIn) g.auth.userId?.let { g.wallet.refresh(it) }
                        /* near real time: every 5 s while a sending or withdrawal is in progress, every 20 s otherwise */
                        val busy = g.wallet.state.value.transactions.any { com.omwallet.core.data.Status.tx(it).let { s -> s == com.omwallet.core.data.Stage.Pending || s == com.omwallet.core.data.Stage.Approved } }
                        delay(if (busy) 5_000 else 20_000)
                    }
                } finally { g.market.stop() }
            }
        }
        setContent { OmTheme { OmRoot() } }

        /* JankStats: counts frames over budget on the real device refresh rate (debug log only). */
        jank = JankStats.createAndTrack(window) { f -> frames++; if (f.isJank) janky++ }
    }

    override fun onResume() { super.onResume(); jank?.isTrackingEnabled = true }
    override fun onPause() {
        super.onPause(); jank?.isTrackingEnabled = false
        if (BuildConfig.DEBUG && frames > 0) Log.d("OMJank", "frames=$frames janky=$janky (${"%.2f".format(100.0 * janky / frames)} %)")
    }
}
