package com.omwallet.core.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.text.format.DateUtils
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.semantics.Role
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import com.omwallet.core.data.Catalog
import com.omwallet.core.data.Direction
import com.omwallet.core.data.DisplayCurrency
import com.omwallet.core.data.FeedMode
import com.omwallet.core.data.Fmt
import com.omwallet.core.data.OmGraph
import com.omwallet.core.data.Stage
import com.omwallet.core.data.Status
import com.omwallet.core.data.Tx
import com.omwallet.core.design.AssetLogo
import com.omwallet.core.design.ChipTone
import com.omwallet.core.design.LocalOmMotion
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmSecondaryButton
import com.omwallet.core.design.OmSheet
import com.omwallet.core.design.OmSprings
import com.omwallet.core.design.StatusChip
import com.omwallet.core.design.StatusSteps
import com.omwallet.core.design.StepState
import com.omwallet.core.design.pressable
import java.text.DateFormat
import java.util.Date

@Composable fun omGraph(): OmGraph { val c = LocalContext.current; return remember(c) { OmGraph.get(c) } }

/* View models receive the graph explicitly (no reflection). */
@Composable inline fun <reified VM : ViewModel> omViewModel(key: String? = null, crossinline create: (OmGraph) -> VM): VM {
    val g = omGraph()
    return viewModel(key = key) { create(g) }
}

/* ---------- server error codes → words the person understands ---------- */
@Composable fun errorText(code: String?): String = stringResource(errorRes(code))
fun errorRes(code: String?): Int = when (code) {
    null, "" -> R.string.e_unknown
    "network" -> R.string.e_uncertain
    "invalid_credentials", "invalid_grant" -> R.string.e_invalid_credentials
    "email_not_confirmed" -> R.string.e_email_not_confirmed
    "insufficient_balance", "insufficient_funds" -> R.string.e_insufficient_balance
    "recipient_not_found" -> R.string.e_recipient_not_found
    "self_transfer" -> R.string.e_self_transfer
    "unsupported_asset_network" -> R.string.e_unsupported_asset_network
    "pin_required", "invalid_pin_grant", "pin_grant_invalid" -> R.string.e_pin_required
    "sender_inactive" -> R.string.e_sender_inactive
    "invalid_amount", "amount_below_minimum", "below_minimum" -> R.string.e_invalid_amount
    "withdraw_disabled", "withdrawals_disabled" -> R.string.e_withdraw_disabled
    "kyc_required" -> R.string.e_kyc_required
    "too_many_open" -> R.string.e_too_many_open
    "invalid_address" -> R.string.e_invalid_address
    "forbidden" -> R.string.e_forbidden
    "invalid_state", "already_processed" -> R.string.e_invalid_state
    "invalid_hash", "invalid_tx_hash" -> R.string.e_invalid_hash
    "market_unavailable" -> R.string.markets_error
    else -> R.string.e_unknown
}

/* ---------- dates ---------- */
fun dateTime(ms: Long): String = if (ms <= 0) "—" else DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT).format(Date(ms))
@Composable fun relative(ms: Long): String = relative(ms, System.currentTimeMillis(), stringResource(R.string.just_now))
fun relative(ms: Long, now: Long, justNow: String): String = when {
    ms <= 0 -> "—"
    now - ms in 0 until 60_000 -> justNow
    else -> DateUtils.getRelativeTimeSpanString(ms, now, DateUtils.MINUTE_IN_MILLIS, DateUtils.FORMAT_ABBREV_RELATIVE).toString()
}

fun openUrl(ctx: Context, url: String) { runCatching { ctx.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } }

/* ---------- live-data state, always visible ---------- */
@Composable
fun FeedBadge(mode: FeedMode, lastSync: Long, modifier: Modifier = Modifier) {
    val (txt, color) = when (mode) {
        FeedMode.Live -> stringResource(R.string.feed_live) to OmColors.Success
        FeedMode.Polling -> stringResource(R.string.feed_polling) to OmColors.Blue600
        FeedMode.Offline -> stringResource(R.string.feed_offline, relative(lastSync)) to OmColors.Warning
        FeedMode.Idle -> stringResource(R.string.feed_idle) to OmColors.InkSecondary
    }
    val reduced = LocalOmMotion.current.reduced
    val a by animateFloatAsState(if (mode == FeedMode.Live || reduced) 1f else 0.6f, OmSprings.fade(), label = "feed")
    Row(modifier, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(Modifier.size(8.dp).graphicsLayer { alpha = a }.clip(CircleShape).background(color))
        Text(txt, style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary)
    }
}

/* ---------- transactions ---------- */
@Composable
fun txTitle(t: Tx): String = stringResource(
    when {
        t.flow == "CRYPTO_WITHDRAWAL" -> R.string.tx_withdrawal_crypto
        t.kind == "BANK_WITHDRAWAL" -> R.string.tx_withdrawal_bank
        t.kind == "ADMIN_DEPOSIT" || t.kind == "ADMIN_DEPOSIT_CRYPTO" || t.kind == "CRYPTO_DEPOSIT" -> R.string.tx_deposit
        t.kind == "CRYPTO_BUY" -> R.string.tx_buy
        t.kind == "CRYPTO_SELL" -> R.string.tx_sell
        t.kind == "CRYPTO_SWAP" -> R.string.tx_swap
        t.kind == "SIGNUP_BONUS" -> R.string.tx_bonus
        t.direction == Direction.IN -> R.string.tx_received
        t.direction == Direction.OUT -> R.string.tx_sent
        else -> R.string.tx_other
    },
)

fun isInProgress(s: Stage) = s == Stage.Pending || s == Stage.Approved
fun stageTone(s: Stage) = when (s) { Stage.Done -> ChipTone.Success; Stage.Failed -> ChipTone.Failed; Stage.Cancelled -> ChipTone.Neutral; else -> ChipTone.Pending }

@Composable
fun stageText(t: Tx): String {
    val s = Status.tx(t)
    return stringResource(
        /* people only ever see « En cours » while anything is being handled; then the final result */
        if (t.flow == "CRYPTO_WITHDRAWAL") when (s) { Stage.Pending, Stage.Approved -> R.string.st_internal_pending; Stage.Done -> R.string.st_done_generic; Stage.Failed -> R.string.st_failed; Stage.Cancelled -> R.string.st_cancelled }
        else if (t.adminConfirm) when (s) { Stage.Done -> R.string.st_transfer_confirmed; Stage.Failed -> R.string.st_failed; Stage.Cancelled -> R.string.st_cancelled; else -> R.string.st_internal_pending }
        else when (s) { Stage.Done -> R.string.st_done_generic; Stage.Failed -> R.string.st_failed; Stage.Cancelled -> R.string.st_cancelled; else -> R.string.st_pending_generic },
    )
}

/* What people see: « Soumis → En cours → Confirmé » (internal send), « Soumis → En cours → Terminé » (withdrawal). Nothing about who handles it. */
@Composable
fun internalSteps(stage: Stage): List<Pair<String, StepState>> = when (stage) {
    Stage.Done -> listOf(stringResource(R.string.st_submitted) to StepState.Done, stringResource(R.string.st_internal_pending) to StepState.Done, stringResource(R.string.st_confirmed) to StepState.Done)
    Stage.Failed, Stage.Cancelled -> listOf(stringResource(R.string.st_submitted) to StepState.Done, stringResource(if (stage == Stage.Failed) R.string.st_failed else R.string.st_cancelled) to StepState.Failed)
    else -> listOf(stringResource(R.string.st_submitted) to StepState.Done, stringResource(R.string.st_internal_pending) to StepState.Current, stringResource(R.string.st_confirmed) to StepState.Todo)
}

@Composable
fun withdrawalSteps(stage: Stage, bank: Boolean): List<Pair<String, StepState>> {
    val last = stringResource(if (bank) R.string.st_bank_paid else R.string.st_done_generic)
    val a = stringResource(R.string.st_submitted); val b = stringResource(R.string.st_internal_pending)
    return when (stage) {
        Stage.Pending, Stage.Approved -> listOf(a to StepState.Done, b to StepState.Current, last to StepState.Todo)
        Stage.Done -> listOf(a to StepState.Done, b to StepState.Done, last to StepState.Done)
        Stage.Failed, Stage.Cancelled -> listOf(a to StepState.Done, stringResource(if (stage == Stage.Failed) R.string.st_failed else R.string.st_cancelled) to StepState.Failed)
    }
}

fun signedQty(t: Tx): String {
    val sym = t.asset ?: ""
    val q = if (Catalog.asset(sym) != null) Fmt.qty(t.amount, sym) else String.format(java.util.Locale.US, "%,.3f %s", t.amount, sym)
    return when (t.direction) { Direction.IN -> "+$q"; Direction.OUT -> "−$q"; Direction.SELF -> q }
}

@Composable
fun TxItem(t: Tx, hidden: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier.fillMaxWidth().pressable(onClick = onClick).padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        AssetLogo(t.asset ?: "", 40.dp)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(txTitle(t), style = MaterialTheme.typography.titleSmall, color = OmColors.Ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(listOfNotNull(t.counterpartyName, relative(t.createdAt)).joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(Fmt.masked(signedQty(t), hidden), style = MaterialTheme.typography.titleSmall, color = if (t.direction == Direction.IN && Status.tx(t) == Stage.Done) OmColors.Success else OmColors.Ink)
            StatusChip(stageText(t), stageTone(Status.tx(t)), animated = isInProgress(Status.tx(t)))
        }
    }
}

@Composable
private fun DetailLine(label: String, value: String?) {
    if (value.isNullOrBlank()) return
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary)
        Text(value, style = MaterialTheme.typography.bodyMedium, color = OmColors.Ink, modifier = Modifier.padding(start = 16.dp))
    }
}

@Composable
fun TxDetailSheet(t: Tx, hidden: Boolean, onDismiss: () -> Unit) {
    OmSheet(title = txTitle(t), onDismiss = onDismiss) {
        val stage = Status.tx(t)
        Text(Fmt.masked(signedQty(t), hidden), style = MaterialTheme.typography.displaySmall, color = OmColors.Ink)
        when {
            t.flow == "CRYPTO_WITHDRAWAL" -> StatusSteps(withdrawalSteps(stage, bank = false))
            t.adminConfirm -> {
                StatusSteps(internalSteps(stage))
                if (stage == Stage.Pending) Text(stringResource(R.string.explain_internal_pending), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
            }
            else -> StatusChip(stageText(t), stageTone(stage), animated = isInProgress(stage))
        }
        DetailLine(stringResource(R.string.detail_reference), t.reference)
        DetailLine(stringResource(R.string.detail_date), dateTime(t.createdAt))
        DetailLine(stringResource(R.string.detail_counterparty), t.counterpartyName)
        DetailLine(stringResource(R.string.detail_network), Catalog.network(t.network)?.name ?: t.network)
        DetailLine(stringResource(R.string.detail_address), t.address)
        if (t.fee > 0) DetailLine(stringResource(R.string.detail_fee), Fmt.masked(Fmt.qty(t.fee, t.asset ?: ""), hidden))
        DetailLine(stringResource(R.string.detail_note), t.note)
        OmSecondaryButton(stringResource(R.string.close), onClick = onDismiss)
    }
}

fun money(usd: Double?, cur: DisplayCurrency, hidden: Boolean) = Fmt.masked(Fmt.money(usd, cur), hidden)

/* An amount placed inside a translated sentence is wrapped in a left-to-right isolate (U+2066 … U+2069) so that, in Arabic,
   "0.5 BTC" or "20.500 OMR" keeps its order instead of being reshuffled by the surrounding right-to-left text. */
fun ltr(s: String) = "\u2066$s\u2069"

/* Tabs with a sliding indicator (standard spring, draw-phase offset). */
@Composable
fun Tabs(labels: List<String>, selected: Int, onSelect: (Int) -> Unit) {
    BoxWithConstraints(Modifier.fillMaxWidth().padding(horizontal = 16.dp).clip(RoundedCornerShape(50)).background(OmColors.Sky100).padding(4.dp)) {
        val w = maxWidth / labels.size
        val x by animateDpAsState(w * selected, OmSprings.standard(), label = "tab")
        Box(Modifier.offset(x = x).width(w).height(36.dp).clip(RoundedCornerShape(50)).background(OmColors.SurfaceBright))
        Row(Modifier.fillMaxWidth().height(36.dp)) {
            labels.forEachIndexed { i, l ->
                Box(Modifier.weight(1f).fillMaxHeight().pressable(role = Role.Tab) { onSelect(i) }, contentAlignment = Alignment.Center) {
                    Text(l, style = MaterialTheme.typography.labelLarge, color = if (i == selected) OmColors.Blue600 else OmColors.InkSecondary)
                }
            }
        }
    }
}
