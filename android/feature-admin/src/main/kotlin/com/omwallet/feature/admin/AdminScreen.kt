package com.omwallet.feature.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.omwallet.core.data.AdminTx
import com.omwallet.core.data.AuthState
import com.omwallet.core.data.BankAdminItem
import com.omwallet.core.data.Catalog
import com.omwallet.core.data.CryptoWithdrawal
import com.omwallet.core.data.Fmt
import com.omwallet.core.data.OmGraph
import com.omwallet.core.data.Status
import com.omwallet.core.design.AssetLogo
import com.omwallet.core.design.ChipTone
import com.omwallet.core.design.EmptyState
import com.omwallet.core.design.ErrorState
import com.omwallet.core.design.FieldError
import com.omwallet.core.design.GlassCard
import com.omwallet.core.design.NetworkLogo
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmDialog
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmIcons
import com.omwallet.core.design.OmPrimaryButton
import com.omwallet.core.design.OmRadius
import com.omwallet.core.design.OmSecondaryButton
import com.omwallet.core.design.OmSheet
import com.omwallet.core.design.SkeletonRows
import com.omwallet.core.design.StatusChip
import com.omwallet.core.design.pressable
import com.omwallet.core.design.rememberOmHaptics
import com.omwallet.core.network.ApiException
import com.omwallet.core.ui.R
import com.omwallet.core.ui.Tabs
import com.omwallet.core.ui.dateTime
import com.omwallet.core.ui.errorText
import com.omwallet.core.ui.omViewModel
import com.omwallet.core.ui.stageTone
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/* Admin Control. The role comes from the server (is_admin()); every action is re-checked there.
   Internal transfers: ONE Confirm button — confirmation and credit are one atomic server step, a repeated tap answers "already".
   A processed item stays in place (marked) so the next tap can never land on another transaction. */
data class AdminUiState(
    val loading: Boolean = true, val error: String? = null,
    val internal: List<AdminTx> = emptyList(), val crypto: List<CryptoWithdrawal> = emptyList(), val bank: List<BankAdminItem> = emptyList(),
    val processed: Map<String, String> = emptyMap(), val busy: String? = null, val actionError: Pair<String, String>? = null, val toast: Int? = null,
)

class AdminViewModel(private val g: OmGraph) : ViewModel() {
    private val _s = MutableStateFlow(AdminUiState())
    val state: StateFlow<AdminUiState> = _s.asStateFlow()
    val isAdmin get() = (g.auth.state.value as? AuthState.SignedIn)?.isAdmin == true
    init { load() }

    fun load() = viewModelScope.launch {
        _s.update { it.copy(loading = it.internal.isEmpty() && it.crypto.isEmpty() && it.bank.isEmpty(), error = null) }
        try {
            val i = g.admin.transactions("PENDING"); val c = g.admin.cryptoWithdrawals(null); val b = g.admin.bankWithdrawals(null)
            _s.update { st ->
                /* keep already-processed rows where they are until the next manual refresh clears them */
                val keep = st.internal.filter { it.id in st.processed && i.none { n -> n.id == it.id } }
                st.copy(loading = false, internal = i + keep, crypto = c.filter { it.status in setOf("PENDING", "PROCESSING") }, bank = b.filter { it.status in setOf("PENDING", "APPROVED") })
            }
        } catch (e: ApiException) { _s.update { it.copy(loading = false, error = e.code) } }
    }

    private fun act(id: String, done: String, toast: Int?, block: suspend () -> Unit) {
        if (_s.value.busy != null) return
        _s.update { it.copy(busy = id, actionError = null) }
        viewModelScope.launch {
            try { block(); _s.update { it.copy(busy = null, processed = it.processed + (id to done), toast = toast) } }
            catch (e: ApiException) { _s.update { it.copy(busy = null, actionError = id to e.code) } }
        }
    }

    fun confirm(t: AdminTx) = act(t.id, "CONFIRMED", null) {
        val r = g.admin.confirm(t.id)
        _s.update { it.copy(toast = if (r.already) R.string.adm_already else R.string.adm_confirmed_toast) }
    }
    fun reject(t: AdminTx, reason: String) = act(t.id, "REJECTED", null) { g.admin.reject(t.id, reason) }
    /* Pause is not final: the row stays actionable (Confirm / Refuse), only marked as paused */
    fun pause(t: AdminTx) {
        if (_s.value.busy != null) return
        _s.update { it.copy(busy = t.id, actionError = null) }
        viewModelScope.launch {
            try { g.admin.pause(t.id); _s.update { st -> st.copy(busy = null, internal = st.internal.map { if (it.id == t.id) it.copy(paused = true) else it }, toast = R.string.adm_pause_toast) } }
            catch (e: ApiException) { _s.update { it.copy(busy = null, actionError = t.id to e.code) } }
        }
    }
    fun cryptoProcess(w: CryptoWithdrawal) = act(w.id, "PROCESSING", null) { g.admin.cryptoProcess(w.id); reloadLater() }
    fun cryptoComplete(w: CryptoWithdrawal, hash: String) = act(w.id, "COMPLETED", null) { g.admin.cryptoComplete(w.id, hash) }
    fun cryptoReject(w: CryptoWithdrawal, reason: String) = act(w.id, "REJECTED", null) { g.admin.cryptoReject(w.id, reason) }
    fun bankDecide(b: BankAdminItem, approve: Boolean, note: String?) = act(b.id, if (approve) "APPROVED" else "REJECTED", null) { g.admin.bankDecide(b.id, approve, note); if (approve) reloadLater() }
    fun bankPaid(b: BankAdminItem, ref: String) = act(b.id, "PAID", null) { g.admin.bankMarkPaid(b.id, ref) }
    private fun reloadLater() { viewModelScope.launch { kotlinx.coroutines.delay(300); _s.update { it.copy(processed = it.processed - it.processed.keys.filter { k -> it.processed[k] in setOf("PROCESSING", "APPROVED") }.toSet()) }; load() } }
    fun toastShown() { _s.update { it.copy(toast = null) } }
    fun refresh() { _s.update { it.copy(processed = emptyMap()) }; load() }
}

@Composable
fun AdminScreen(onBack: () -> Unit) {
    val vm = omViewModel { AdminViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    var tab by rememberSaveable { mutableStateOf(0) }
    val ctx = LocalContext.current
    s.toast?.let { val msg = stringResource(it); androidx.compose.runtime.LaunchedEffect(it) { android.widget.Toast.makeText(ctx, msg, android.widget.Toast.LENGTH_LONG).show(); vm.toastShown() } }
    var confirmTx by remember { mutableStateOf<AdminTx?>(null) }
    var reasonFor by remember { mutableStateOf<Pair<String, (String) -> Unit>?>(null) }
    var hashFor by remember { mutableStateOf<CryptoWithdrawal?>(null) }
    var refFor by remember { mutableStateOf<BankAdminItem?>(null) }
    val haptics = rememberOmHaptics()

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 40.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            val back = stringResource(R.string.back)
            Row(Modifier.statusBarsPadding().padding(horizontal = 12.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(Modifier.size(44.dp).pressable(onClick = onBack).semantics { contentDescription = back }, contentAlignment = Alignment.Center) { OmIcon(OmIcons.Back, null) }
                Text(stringResource(R.string.admin_title), style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink, modifier = Modifier.weight(1f))
                val refresh = stringResource(R.string.refresh)
                Box(Modifier.size(44.dp).pressable { vm.refresh() }.semantics { contentDescription = refresh }, contentAlignment = Alignment.Center) { OmIcon(OmIcons.Refresh, null) }
            }
        }
        if (!vm.isAdmin) { item { EmptyState(stringResource(R.string.adm_forbidden), "", Modifier.padding(16.dp)) }; return@LazyColumn }
        item {
            Tabs(listOf(stringResource(R.string.adm_tab_internal) + count(s.internal.count { it.id !in s.processed }), stringResource(R.string.adm_tab_crypto) + count(s.crypto.size),
                stringResource(R.string.adm_tab_bank) + count(s.bank.size), stringResource(R.string.adm_tab_trust)), tab) { tab = it }
        }
        if (s.loading) { item { SkeletonRows(4, Modifier.padding(horizontal = 20.dp)) }; return@LazyColumn }
        s.error?.let { e -> item { ErrorState(errorText(e), stringResource(R.string.retry), Modifier.padding(16.dp)) { vm.load() } }; return@LazyColumn }
        when (tab) {
            0 -> {
                if (s.internal.isEmpty()) item { EmptyState(stringResource(R.string.adm_empty), "", Modifier.padding(16.dp)) }
                items(s.internal, key = { it.id }) { t ->
                    val done = s.processed[t.id]
                    Card(done) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                AssetLogo(t.asset ?: "", 30.dp)
                                Text(amountOf(t.amount, t.asset), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink)
                            }
                            StatusChip(stringResource(if (done == "CONFIRMED") R.string.st_confirmed else if (done == "REJECTED") R.string.st_failed else if (t.paused) R.string.adm_paused else R.string.adm_to_decide),
                                if (done == "CONFIRMED") ChipTone.Success else if (done == "REJECTED") ChipTone.Failed else ChipTone.Pending)
                        }
                        Text(stringResource(R.string.adm_from_to, t.senderName ?: t.senderId ?: "—", t.receiverName ?: t.receiverId ?: "—"), style = MaterialTheme.typography.bodyMedium, color = OmColors.Ink)
                        Text(listOfNotNull(t.reference, Catalog.network(t.network)?.name, dateTime(t.createdAt)).joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                        t.note?.let { Text("“$it”", style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary) }
                        if (!t.receiverHasEmail) Text(stringResource(R.string.adm_no_email), style = MaterialTheme.typography.bodySmall, color = OmColors.Warning)
                        s.actionError?.takeIf { it.first == t.id }?.let { FieldError(errorText(it.second)) }
                        if (done == null) Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            OmPrimaryButton(stringResource(R.string.adm_confirm), Modifier.fillMaxWidth(), loading = s.busy == t.id, enabled = s.busy == null) { confirmTx = t }
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                if (!t.paused) OmSecondaryButton(stringResource(R.string.adm_pause), Modifier.weight(1f), enabled = s.busy == null) { vm.pause(t) }
                                OmSecondaryButton(stringResource(R.string.adm_reject), Modifier.weight(1f), enabled = s.busy == null) { reasonFor = t.id to { r -> vm.reject(t, r) } }
                            }
                        }
                    }
                }
            }
            1 -> {
                if (s.crypto.isEmpty()) item { EmptyState(stringResource(R.string.adm_empty), "", Modifier.padding(16.dp)) }
                items(s.crypto, key = { it.id }) { w ->
                    val done = s.processed[w.id]
                    Card(done) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) { AssetLogo(w.asset, 30.dp); Text(Fmt.qty(w.amount, w.asset), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink) }
                            NetworkLogo(w.network, 24.dp)
                        }
                        Text(listOfNotNull(w.userName, w.userYorId, w.reference).joinToString(" · "), style = MaterialTheme.typography.bodyMedium, color = OmColors.Ink)
                        Text(w.address, style = MaterialTheme.typography.bodySmall.copy(textDirection = TextDirection.Ltr), color = OmColors.InkSecondary)
                        w.memo?.let { Text("Memo $it", style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary) }
                        Text(stringResource(R.string.wd_fee) + " " + Fmt.qty(w.fee, w.asset) + " · " + dateTime(w.createdAt), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                        StatusChip(stringResource(when (done ?: w.status) { "PROCESSING" -> R.string.st_wd_approved; "COMPLETED" -> R.string.st_wd_sent; "REJECTED" -> R.string.st_failed; else -> R.string.st_wd_request }),
                            stageTone(Status.cryptoWithdrawal(done ?: w.status)))
                        s.actionError?.takeIf { it.first == w.id }?.let { FieldError(errorText(it.second)) }
                        if (done == null) Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            if (w.status == "PENDING") OmPrimaryButton(stringResource(R.string.adm_take), Modifier.weight(1f), loading = s.busy == w.id, enabled = s.busy == null) { vm.cryptoProcess(w) }
                            else OmPrimaryButton(stringResource(R.string.adm_complete), Modifier.weight(1f), loading = s.busy == w.id, enabled = s.busy == null) { hashFor = w }
                            OmSecondaryButton(stringResource(R.string.adm_reject), Modifier.weight(1f), enabled = s.busy == null) { reasonFor = w.id to { r -> vm.cryptoReject(w, r) } }
                        }
                    }
                }
            }
            2 -> {
                if (s.bank.isEmpty()) item { EmptyState(stringResource(R.string.adm_empty), "", Modifier.padding(16.dp)) }
                items(s.bank, key = { it.id }) { b ->
                    val done = s.processed[b.id]
                    Card(done) {
                        Text(String.format(java.util.Locale.US, "%,.3f OMR", b.amount), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink)
                        Text(listOfNotNull(b.name, b.yorId, b.reference).joinToString(" · "), style = MaterialTheme.typography.bodyMedium, color = OmColors.Ink)
                        Text(listOfNotNull(b.holder, b.bankName, b.account, b.iban).joinToString(" · "), style = MaterialTheme.typography.bodySmall.copy(textDirection = TextDirection.Content), color = OmColors.InkSecondary)
                        Text(dateTime(b.createdAt), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                        StatusChip(stringResource(when (done ?: b.status) { "APPROVED" -> R.string.st_wd_approved; "PAID" -> R.string.st_bank_paid; "REJECTED" -> R.string.st_failed; else -> R.string.st_wd_request }),
                            stageTone(Status.bankWithdrawal(done ?: b.status)))
                        s.actionError?.takeIf { it.first == b.id }?.let { FieldError(errorText(it.second)) }
                        if (done == null) Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            if (b.status == "PENDING") OmPrimaryButton(stringResource(R.string.adm_approve), Modifier.weight(1f), loading = s.busy == b.id, enabled = s.busy == null) { vm.bankDecide(b, true, null) }
                            else OmPrimaryButton(stringResource(R.string.adm_mark_paid), Modifier.weight(1f), loading = s.busy == b.id, enabled = s.busy == null) { refFor = b }
                            OmSecondaryButton(stringResource(R.string.adm_reject), Modifier.weight(1f), enabled = s.busy == null) { reasonFor = b.id to { r -> vm.bankDecide(b, false, r) } }
                        }
                    }
                }
            }
            else -> item {
                /* Trust Wallet: honest information only — there is deliberately no button until WalletConnect signing is really built. */
                GlassCard(Modifier.padding(horizontal = 16.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        OmIcon(OmIcons.Shield, null, tint = OmColors.Blue600)
                        Text(stringResource(R.string.adm_trust_t), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink)
                    }
                    Text(stringResource(R.string.adm_trust_b), style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary)
                }
            }
        }
    }

    confirmTx?.let { t ->
        OmDialog(
            title = stringResource(R.string.adm_confirm_q, com.omwallet.core.ui.ltr(amountOf(t.amount, t.asset))), body = stringResource(R.string.adm_confirm_qb),
            confirm = stringResource(R.string.adm_confirm), onConfirm = { confirmTx = null; haptics.confirm(); vm.confirm(t) },
            dismiss = stringResource(R.string.cancel), onDismiss = { confirmTx = null }, tone = ChipTone.Success,
        )
    }
    reasonFor?.let { (_, go) -> TextSheet(stringResource(R.string.adm_reject), stringResource(R.string.adm_reject_reason), 3, onDone = { reasonFor = null; go(it) }) { reasonFor = null } }
    hashFor?.let { w -> TextSheet(stringResource(R.string.adm_complete), stringResource(R.string.adm_hash), 32, note = stringResource(R.string.adm_hash_note), onDone = { hashFor = null; vm.cryptoComplete(w, it) }) { hashFor = null } }
    refFor?.let { b -> TextSheet(stringResource(R.string.adm_mark_paid), stringResource(R.string.adm_bank_ref), 3, onDone = { refFor = null; vm.bankPaid(b, it) }) { refFor = null } }
}

private fun count(n: Int) = if (n > 0) " ($n)" else ""
private fun amountOf(v: Double, sym: String?) = if (Catalog.asset(sym) != null) Fmt.qty(v, sym!!) else String.format(java.util.Locale.US, "%,.3f %s", v, sym ?: "")

@Composable
private fun Card(done: String?, content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit) {
    GlassCard(Modifier.padding(horizontal = 16.dp).then(if (done != null) Modifier.alpha(0.72f) else Modifier), content = content)
}

@Composable
private fun TextSheet(title: String, label: String, minLen: Int, note: String? = null, onDone: (String) -> Unit, onDismiss: () -> Unit) {
    var v by remember { mutableStateOf("") }
    var tried by remember { mutableStateOf(false) }
    OmSheet(title, onDismiss) {
        note?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary) }
        OutlinedTextField(v, { v = it }, label = { Text(label) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(OmRadius.S), isError = tried && v.trim().length < minLen)
        if (tried && v.trim().length < minLen) FieldError(stringResource(R.string.e_required))
        OmPrimaryButton(stringResource(R.string.confirm)) { tried = true; if (v.trim().length >= minLen) onDone(v.trim()) }
        OmSecondaryButton(stringResource(R.string.cancel), onClick = onDismiss)
    }
}
