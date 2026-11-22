package com.omwallet.feature.withdraw

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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.omwallet.core.data.BankOverview
import com.omwallet.core.data.Catalog
import com.omwallet.core.data.CryptoOverview
import com.omwallet.core.data.Fmt
import com.omwallet.core.data.OmGraph
import com.omwallet.core.data.Status
import com.omwallet.core.data.Validation
import com.omwallet.core.design.AssetLogo
import com.omwallet.core.design.ErrorState
import com.omwallet.core.design.FieldError
import com.omwallet.core.design.GlassCard
import com.omwallet.core.design.NetworkLogo
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmIcons
import com.omwallet.core.design.OmPrimaryButton
import com.omwallet.core.design.OmSecondaryButton
import com.omwallet.core.design.OmSheet
import com.omwallet.core.design.SkeletonRows
import com.omwallet.core.design.StatusChip
import com.omwallet.core.design.StatusSteps
import com.omwallet.core.design.pressable
import com.omwallet.core.network.ApiException
import com.omwallet.core.ui.PinSheet
import com.omwallet.core.ui.R
import com.omwallet.core.ui.Tabs
import com.omwallet.core.ui.dateTime
import com.omwallet.core.ui.errorText
import com.omwallet.core.ui.ltr
import com.omwallet.core.ui.omViewModel
import com.omwallet.core.ui.openUrl
import com.omwallet.core.ui.stageTone
import com.omwallet.core.ui.withdrawalSteps
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.math.BigDecimal

data class Review(val bank: Boolean, val key: String, val amount: BigDecimal, val title: String, val lines: List<Pair<Int, String>>,
                  val bankArgs: List<String> = emptyList(), val asset: String = "", val network: String = "", val address: String = "", val memo: String? = null)
data class Outcome(val ok: Boolean, val reference: String?, val error: String?, val uncertain: Boolean)

data class WithdrawUiState(
    val loading: Boolean = true, val loadError: String? = null, val bank: BankOverview? = null, val crypto: CryptoOverview? = null,
    val review: Review? = null, val submitting: Boolean = false, val outcome: Outcome? = null, val busyId: String? = null,
)

class WithdrawViewModel(private val g: OmGraph) : ViewModel() {
    private val _s = MutableStateFlow(WithdrawUiState())
    val state: StateFlow<WithdrawUiState> = _s.asStateFlow()
    init { load() }

    fun load() = viewModelScope.launch {
        _s.update { it.copy(loading = it.bank == null, loadError = null) }
        try {
            val b = g.money.bankOverview(); val c = g.money.cryptoOverview()
            _s.update { it.copy(loading = false, bank = b, crypto = c) }
        } catch (e: ApiException) { _s.update { it.copy(loading = false, loadError = e.code) } }
    }

    /* One idempotency key per reviewed operation, reused if the person retries after an uncertain network failure. */
    fun review(r: Review) { _s.update { it.copy(review = r, outcome = null) } }
    fun closeReview() { _s.update { it.copy(review = null) } }
    fun newKey() = g.money.newIdempotencyKey()

    fun submit(grant: String?) {
        val r = _s.value.review ?: return
        if (_s.value.submitting) return
        _s.update { it.copy(submitting = true) }
        viewModelScope.launch {
            val out = try {
                val res = if (r.bank) g.money.requestBankWithdrawal(r.amount, r.bankArgs[0], r.bankArgs[1], r.bankArgs[2], r.bankArgs.getOrNull(3), r.key)
                else g.money.requestCryptoWithdrawal(r.asset, r.network, r.address, r.memo, r.amount, r.key, grant ?: "")
                Outcome(true, res.reference, null, false)
            } catch (e: ApiException) { Outcome(false, null, e.code, e.uncertain) }
            _s.update { it.copy(submitting = false, outcome = out, review = if (out.ok || !out.uncertain) null else it.review) }
            if (out.ok) { load(); g.auth.userId?.let { g.wallet.refresh(it) } }
        }
    }

    fun cancel(id: String, bank: Boolean) = viewModelScope.launch {
        _s.update { it.copy(busyId = id) }
        runCatching { if (bank) g.money.cancelBank(id) else g.money.cancelCrypto(id) }
        _s.update { it.copy(busyId = null) }
        load(); g.auth.userId?.let { g.wallet.refresh(it) }
    }
    fun dismissOutcome() { _s.update { it.copy(outcome = null) } }
}

@Composable
fun WithdrawScreen(initialAsset: String?, onBack: () -> Unit) {
    val vm = omViewModel { WithdrawViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    var tab by rememberSaveable { mutableStateOf(if (initialAsset != null) 1 else 0) }
    var pin by remember { mutableStateOf(false) }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 40.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            val back = stringResource(R.string.back)
            Row(Modifier.statusBarsPadding().padding(horizontal = 12.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(Modifier.size(44.dp).pressable(onClick = onBack).semantics { contentDescription = back }, contentAlignment = Alignment.Center) { OmIcon(OmIcons.Back, null) }
                Text(stringResource(R.string.withdraw_title), style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink)
            }
        }
        item { Tabs(listOf(stringResource(R.string.wd_tab_bank), stringResource(R.string.wd_tab_crypto)), tab) { tab = it } }
        s.outcome?.let { o -> item { OutcomeCard(o, vm::dismissOutcome) } }
        when {
            s.loading -> item { SkeletonRows(4, Modifier.padding(horizontal = 20.dp)) }
            s.loadError != null && s.bank == null -> item { ErrorState(errorText(s.loadError), stringResource(R.string.retry), Modifier.padding(16.dp)) { vm.load() } }
            tab == 0 -> s.bank?.let { b -> bankSection(b, vm, s.busyId) }
            else -> s.crypto?.let { c -> cryptoSection(c, initialAsset, vm, s.busyId) }
        }
    }

    s.review?.let { r ->
        if (!pin) OmSheet(title = stringResource(R.string.wd_review_title), onDismiss = { if (!s.submitting) vm.closeReview() }, dismissible = !s.submitting) {
            Text(r.title, style = MaterialTheme.typography.displaySmall, color = OmColors.Ink)
            r.lines.forEach { (label, v) ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(stringResource(label), style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary)
                    Text(v, style = MaterialTheme.typography.bodyMedium, color = OmColors.Ink, modifier = Modifier.padding(start = 16.dp))
                }
            }
            if (!r.bank) Text(stringResource(R.string.wd_crypto_notice), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
            s.outcome?.takeIf { !it.ok }?.let { FieldError(errorText(it.error)) }
            OmPrimaryButton(stringResource(R.string.wd_submit), loading = s.submitting) { if (r.bank) vm.submit(null) else pin = true }
            OmSecondaryButton(stringResource(R.string.cancel), enabled = !s.submitting) { vm.closeReview() }
        }
        if (pin) PinSheet(onGranted = { grant -> pin = false; vm.submit(grant) }, onDismiss = { pin = false })
    }
}

@Composable
private fun OutcomeCard(o: Outcome, onClose: () -> Unit) {
    GlassCard(Modifier.padding(horizontal = 16.dp), strong = true) {
        if (o.ok) {
            Text(stringResource(R.string.wd_sent_t), style = MaterialTheme.typography.titleMedium, color = OmColors.Success)
            Text(stringResource(R.string.wd_sent_b, ltr(o.reference ?: "—")), style = MaterialTheme.typography.bodyMedium, color = OmColors.Ink)
        } else Text(errorText(if (o.uncertain) "network" else o.error), style = MaterialTheme.typography.bodyMedium, color = OmColors.Error)
        OmSecondaryButton(stringResource(R.string.close), onClick = onClose)
    }
}

@Composable
internal fun Field(value: String, onChange: (String) -> Unit, label: String, error: String?, keyboard: KeyboardType = KeyboardType.Text, ltr: Boolean = false) {
    Column(Modifier.padding(horizontal = 16.dp)) {
        OutlinedTextField(
            value, onChange, label = { Text(label) }, singleLine = true, isError = error != null, modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = keyboard), shape = androidx.compose.foundation.shape.RoundedCornerShape(com.omwallet.core.design.OmRadius.S),
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OmColors.Blue600, unfocusedBorderColor = OmColors.Sky300, focusedContainerColor = OmColors.SurfaceBright, unfocusedContainerColor = OmColors.SurfaceBright),
            textStyle = MaterialTheme.typography.bodyLarge.copy(textDirection = if (ltr) androidx.compose.ui.text.style.TextDirection.Ltr else androidx.compose.ui.text.style.TextDirection.Content),
        )
        FieldError(error)
    }
}

@Composable
private fun amountError(e: Validation.AmountError?, dp: Int): String? = when (e) {
    null -> null
    Validation.AmountError.Invalid -> stringResource(R.string.e_amount)
    Validation.AmountError.TooManyDecimals -> stringResource(R.string.e_decimals, dp)
    Validation.AmountError.BelowMinimum -> stringResource(R.string.e_min)
    Validation.AmountError.Insufficient -> stringResource(R.string.e_insufficient_balance)
}

/* ---------------- bank (OMR) ---------------- */
private fun androidx.compose.foundation.lazy.LazyListScope.bankSection(b: BankOverview, vm: WithdrawViewModel, busyId: String?) {
    item {
        if (!b.enabled) { Text(stringResource(R.string.wd_disabled), color = OmColors.Warning, modifier = Modifier.padding(horizontal = 20.dp)); return@item }
        var amount by rememberSaveable { mutableStateOf("") }
        var holder by rememberSaveable { mutableStateOf("") }
        var bank by rememberSaveable { mutableStateOf<String?>(null) }
        var account by rememberSaveable { mutableStateOf("") }
        var iban by rememberSaveable { mutableStateOf("") }
        var tried by rememberSaveable { mutableStateOf(false) }
        var picking by remember { mutableStateOf(false) }
        val lang = LocalConfiguration.current.locales[0].language
        fun bankName(code: String?) = b.banks.firstOrNull { it.code == code }?.let { when (lang) { "ar" -> it.ar; "fr" -> it.fr; else -> it.en } }
        val aErr = Validation.checkAmount(amount, 3, b.available, minimum = b.min)
        val req = stringResource(R.string.e_required)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(stringResource(R.string.wd_available, ltr(String.format(java.util.Locale.US, "%,.3f OMR", b.available))) + " · " + stringResource(R.string.wd_min, ltr(String.format(java.util.Locale.US, "%,.3f OMR", b.min))),
                style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary, modifier = Modifier.padding(horizontal = 20.dp))
            Field(amount, { amount = it }, stringResource(R.string.wd_amount) + " (OMR)", if (tried || amount.isNotEmpty()) amountError(aErr, 3) else null, KeyboardType.Decimal, ltr = true)
            Field(holder, { holder = it }, stringResource(R.string.wd_holder), if (tried && holder.isBlank()) req else null)
            Column(Modifier.padding(horizontal = 16.dp)) {
                GlassCard(Modifier.fillMaxWidth().pressable { picking = true }, padding = 14.dp) {
                    Text(stringResource(R.string.wd_bank), style = MaterialTheme.typography.labelMedium, color = OmColors.InkSecondary)
                    Text(bankName(bank) ?: "—", style = MaterialTheme.typography.bodyLarge, color = OmColors.Ink)
                }
                FieldError(if (tried && bank == null) req else null)
            }
            Field(account, { account = it.filter { c -> c.isLetterOrDigit() } }, stringResource(R.string.wd_account), if (tried && account.length < 4) req else null, KeyboardType.Number, ltr = true)
            Field(iban, { iban = it.uppercase().filter { c -> c.isLetterOrDigit() } }, stringResource(R.string.wd_iban), null, ltr = true)
            val reviewTitle = String.format(java.util.Locale.US, "%,.3f OMR", amount.replace(',', '.').toDoubleOrNull() ?: 0.0)
            Box(Modifier.padding(horizontal = 16.dp)) {
                OmPrimaryButton(stringResource(R.string.wd_review)) {
                    tried = true
                    val v = Validation.parseAmount(amount, 3)
                    if (aErr == null && v != null && holder.isNotBlank() && bank != null && account.length >= 4)
                        vm.review(Review(true, vm.newKey(), v, reviewTitle, listOf(R.string.wd_holder to holder.trim(), R.string.wd_bank to (bankName(bank) ?: ""), R.string.wd_account to account) +
                            (if (iban.isNotBlank()) listOf(R.string.wd_iban to iban) else emptyList()), listOf(holder.trim(), bank!!, account, iban)))
                }
            }
        }
        if (picking) OmSheet(stringResource(R.string.wd_bank), { picking = false }) {
            b.banks.forEach { bk ->
                Text(when (lang) { "ar" -> bk.ar; "fr" -> bk.fr; else -> bk.en }, style = MaterialTheme.typography.bodyLarge, color = OmColors.Ink,
                    modifier = Modifier.fillMaxWidth().pressable { bank = bk.code; picking = false }.padding(vertical = 12.dp))
            }
        }
    }
    item { Text(stringResource(R.string.wd_requests), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink, modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp)) }
    if (b.items.isEmpty()) item { Text(stringResource(R.string.wd_none), color = OmColors.InkSecondary, modifier = Modifier.padding(horizontal = 20.dp)) }
    items(b.items, key = { "b-" + it.id }) { w ->
        val st = Status.bankWithdrawal(w.status)
        GlassCard(Modifier.padding(horizontal = 16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(String.format(java.util.Locale.US, "%,.3f OMR", w.amount), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink)
                StatusChip(stringResource(when (st) { com.omwallet.core.data.Stage.Pending, com.omwallet.core.data.Stage.Approved -> R.string.st_internal_pending
                    com.omwallet.core.data.Stage.Done -> R.string.st_bank_paid; com.omwallet.core.data.Stage.Failed -> R.string.st_failed; com.omwallet.core.data.Stage.Cancelled -> R.string.st_cancelled }), stageTone(st),
                    animated = com.omwallet.core.ui.isInProgress(st))
            }
            Text(listOfNotNull(w.reference, w.bankName, dateTime(w.createdAt)).joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
            StatusSteps(withdrawalSteps(st, bank = true))
            w.adminNote?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary) }
            if (w.status == "PENDING") OmSecondaryButton(stringResource(R.string.wd_cancel), enabled = busyId == null) { vm.cancel(w.id, bank = true) }
        }
    }
}

/* ---------------- crypto ---------------- */
private fun androidx.compose.foundation.lazy.LazyListScope.cryptoSection(c: CryptoOverview, initialAsset: String?, vm: WithdrawViewModel, busyId: String?) {
    item {
        when {
            !c.enabled -> { Text(stringResource(R.string.wd_disabled), color = OmColors.Warning, modifier = Modifier.padding(horizontal = 20.dp)); return@item }
            c.kycRequired -> { Text(stringResource(R.string.wd_kyc), color = OmColors.Warning, modifier = Modifier.padding(horizontal = 20.dp)); return@item }
        }
        val assets = c.networks.map { it.asset }.distinct().filter { Catalog.asset(it) != null }
        var asset by rememberSaveable { mutableStateOf(initialAsset?.takeIf { it in assets } ?: assets.firstOrNull()) }
        val nets = c.networks.filter { it.asset == asset }
        var network by rememberSaveable(asset) { mutableStateOf(nets.singleOrNull()?.network) }
        var address by rememberSaveable { mutableStateOf("") }
        var memo by rememberSaveable { mutableStateOf("") }
        var amount by rememberSaveable { mutableStateOf("") }
        var tried by rememberSaveable { mutableStateOf(false) }
        val a = Catalog.asset(asset)
        val dp = a?.dp ?: 6
        val fee = nets.firstOrNull { it.network == network }?.fee ?: 0.0
        val avail = c.balances[asset] ?: 0.0
        val aErr = Validation.checkAmount(amount, dp, avail, fee)
        val addrOk = network != null && Validation.addressOk(network!!, address)
        val n = Catalog.network(network)
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            androidx.compose.foundation.lazy.LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(assets, key = { it }) { sym ->
                    Chip(sym == asset, { AssetLogo(sym, 24.dp) }, sym) { asset = sym; amount = "" }
                }
            }
            if (nets.size > 1) androidx.compose.foundation.lazy.LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(nets, key = { it.network }) { wn ->
                    Chip(wn.network == network, { NetworkLogo(wn.network, 22.dp) }, Catalog.network(wn.network)?.std ?: wn.network) { network = wn.network }
                }
            }
            FieldError(if (tried && network == null) stringResource(R.string.wd_network) else null)
            Text(stringResource(R.string.wd_available, ltr(Fmt.qty(avail, asset ?: ""))), style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary, modifier = Modifier.padding(horizontal = 20.dp))
            Field(address, { address = it.trim() }, stringResource(R.string.wd_address), if ((tried || address.length > 6) && !addrOk && network != null) stringResource(R.string.e_address, n?.name ?: "") else null, ltr = true)
            if (n?.memo == true) Field(memo, { memo = it.filter(Char::isDigit) }, stringResource(R.string.wd_memo), null, KeyboardType.Number, ltr = true)
            Field(amount, { amount = it }, stringResource(R.string.wd_amount) + " (" + (asset ?: "") + ")", if (tried || amount.isNotEmpty()) amountError(aErr, dp) else null, KeyboardType.Decimal, ltr = true)
            if (network != null) Text(stringResource(R.string.wd_fee) + " " + Fmt.qty(fee, asset ?: ""), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.padding(horizontal = 20.dp))
            Box(Modifier.padding(horizontal = 16.dp)) {
                OmPrimaryButton(stringResource(R.string.wd_review), enabled = asset != null) {
                    tried = true
                    val v = Validation.parseAmount(amount, dp)
                    if (asset != null && network != null && addrOk && aErr == null && v != null)
                        vm.review(Review(false, vm.newKey(), v, Fmt.qty(v.toDouble(), asset!!), listOf(
                            R.string.wd_network to (n?.name ?: network!!), R.string.wd_address to address, R.string.wd_fee to Fmt.qty(fee, asset!!),
                        ) + (if (memo.isNotBlank()) listOf(R.string.wd_memo to memo) else emptyList()), asset = asset!!, network = network!!, address = address, memo = memo.ifBlank { null }))
                }
            }
        }
    }
    item { Text(stringResource(R.string.wd_requests), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink, modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp)) }
    if (c.items.isEmpty()) item { Text(stringResource(R.string.wd_none), color = OmColors.InkSecondary, modifier = Modifier.padding(horizontal = 20.dp)) }
    items(c.items, key = { "c-" + it.id }) { w ->
        val st = Status.cryptoWithdrawal(w.status)
        val ctx = LocalContext.current
        GlassCard(Modifier.padding(horizontal = 16.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) { AssetLogo(w.asset, 28.dp); Text(Fmt.qty(w.amount, w.asset), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink) }
                NetworkLogo(w.network, 24.dp)
            }
            Text(listOfNotNull(w.reference, dateTime(w.createdAt)).joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
            Text(w.address, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
            StatusSteps(withdrawalSteps(st, bank = false))
            w.adminNote?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary) }
            Catalog.explorerUrl(w.network, w.txHash)?.let { url ->
                Text(stringResource(R.string.explain_wd_sent), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                OmSecondaryButton(stringResource(R.string.open_explorer)) { openUrl(ctx, url) }
            }
            if (w.status == "PENDING") OmSecondaryButton(stringResource(R.string.wd_cancel), enabled = busyId == null) { vm.cancel(w.id, bank = false) }
        }
    }
}

/* Selection chip: the chosen one has a blue outline and tint (not colour alone: also announced as selected). */
@Composable
internal fun Chip(on: Boolean, logo: @Composable () -> Unit, label: String, onClick: () -> Unit) {
    val shape = androidx.compose.foundation.shape.RoundedCornerShape(50)
    Row(
        Modifier.clip(shape).background(if (on) OmColors.Sky100 else OmColors.SurfaceBright, shape)
            .border(if (on) 1.5.dp else 1.dp, if (on) OmColors.Blue600 else OmColors.Sky300, shape)
            .semantics { selected = on }
            .pressable(role = androidx.compose.ui.semantics.Role.RadioButton, onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically,
    ) { logo(); Text(label, style = MaterialTheme.typography.labelLarge, color = if (on) OmColors.Blue600 else OmColors.Ink) }
}

