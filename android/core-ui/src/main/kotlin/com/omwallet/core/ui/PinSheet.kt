package com.omwallet.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.res.stringResource
import com.omwallet.core.data.PinResult
import com.omwallet.core.design.OmSheet
import com.omwallet.core.design.PinPad
import com.omwallet.core.design.rememberOmHaptics
import com.omwallet.core.network.ApiException
import kotlinx.coroutines.launch

/* The code is verified by the SERVER (verify_pin): on success it returns a one-time grant bound to this account,
   which the money operation consumes. Wrong attempts are counted and locked server-side. */
@Composable
fun PinSheet(onGranted: (String) -> Unit, onDismiss: () -> Unit) {
    val g = omGraph()
    val scope = rememberCoroutineScope()
    val haptics = rememberOmHaptics()
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val wrong = stringResource(R.string.pin_wrong_plain)
    val locked = stringResource(R.string.pin_locked)
    val none = stringResource(R.string.pin_none)
    val unknown = stringResource(R.string.e_uncertain)
    val res = androidx.compose.ui.platform.LocalContext.current.resources                 /* « n attempts left » agrees with the number (plurals: one / few / many… per language) */
    OmSheet(title = stringResource(R.string.pin_title), onDismiss = { if (!busy) onDismiss() }, dismissible = !busy) {
        PinPad(
            title = "", subtitle = stringResource(R.string.pin_sub), error = error, busy = busy, cancelLabel = stringResource(R.string.cancel), onCancel = onDismiss,
            onComplete = { pin ->
                busy = true; error = null
                scope.launch {
                    val r = try { g.money.verifyPin(pin) } catch (e: ApiException) { null }
                    busy = false
                    when (r) {
                        is PinResult.Granted -> { haptics.confirm(); onGranted(r.grant) }
                        is PinResult.Wrong -> error = r.remaining?.let { res.getQuantityString(R.plurals.pin_wrong, it, it) } ?: wrong
                        is PinResult.Locked -> error = locked
                        PinResult.NoPin -> error = none
                        null -> error = unknown
                    }
                }
            },
        )
    }
}
