package com.omwallet.feature.send

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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.omwallet.core.data.Catalog
import com.omwallet.core.data.Fmt
import com.omwallet.core.data.Holding
import com.omwallet.core.data.OmGraph
import com.omwallet.core.data.Recipient
import com.omwallet.core.data.Stage
import com.omwallet.core.data.Status
import com.omwallet.core.data.Validation
import com.omwallet.core.design.AssetLogo
import com.omwallet.core.design.EmptyState
import com.omwallet.core.design.FieldError
import com.omwallet.core.design.GlassCard
import com.omwallet.core.design.NetworkLogo
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmIcons
import com.omwallet.core.design.OmPrimaryButton
import com.omwallet.core.design.OmRadius
import com.omwallet.core.design.OmSecondaryButton
import com.omwallet.core.design.OmSheet
import com.omwallet.core.design.StatusSteps
import com.omwallet.core.design.pressable
import com.omwallet.core.network.ApiException
import com.omwallet.core.ui.PinSheet
import com.omwallet.core.ui.R
import com.omwallet.core.ui.errorText
import com.omwallet.core.ui.ltr
import com.omwallet.core.ui.internalSteps
import com.omwallet.core.ui.omViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.math.BigDecimal

/* Internal send by e-mail: the server identifies the account and returns only a masked name. The send is recorded
   « À confirmer »; the amount is held; ONLY the administrator's confirmation credits the recipient (one e-mail). */
sealed interface Lookup {
    data object Idle : Lookup
    data object Searching : Lookup
    data class Found(val r: Recipient) : Lookup
    data object NotFound : Lookup
    data class Failed(val code: String) : Lookup
}
data class Sent(val txId: String?, val reference: String?, val amount: String, val to: String)
data class SendForm(val email: String = "", val lookup: Lookup = Lookup.Idle, val submitting: Boolean = false, val error: String? = null, val uncertain: Boolean = false,
                    val key: String? = null, val sent: Sent? = null)
data class SendUiState(val form: SendForm = SendForm(), val holdings: List<Holding> = emptyList(), val sentStage: Stage? = null)

class SendViewModel(private val g: OmGraph) : ViewModel() {
    private val form = MutableStateFlow(SendForm())
    val state: StateFlow<SendUiState> = combine(form, g.wallet.state) { f, w ->
        val hs = w.positions.flatMap { it.networks }.filter { it.available > 0 && it.network != null && Catalog.asset(it.asset) != null }
        val stage = f.sent?.txId?.let { id -> w.transactions.firstOrNull { it.id == id }?.let(Status::tx) }
        SendUiState(f, hs, stage)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SendUiState())
    private var lookupJob: Job? = null
    private var pollJob: Job? = null

    fun email(v: String) {
        form.update { it.copy(email = v, lookup = Lookup.Idle, error = null) }
        lookupJob?.cancel()
        if (!Validation.emailOk(v)) return
        lookupJob = viewModelScope.launch {
            delay(450)                                                  /* debounce while typing */
            form.update { it.copy(lookup = Lookup.Searching) }
            val r = try { g.money.findByEmail(v)?.let { Lookup.Found(it) } ?: Lookup.NotFound } catch (e: ApiException) { Lookup.Failed(e.code) }
            if (form.value.email == v) form.update { it.copy(lookup = r) }
        }
    }

    fun prepare() { if (form.value.key == null) form.update { it.copy(key = g.money.newIdempotencyKey()) } }
    fun forgetKey() { form.update { it.copy(key = null, error = null, uncertain = false) } }

    fun submit(to: Recipient, h: Holding, amount: BigDecimal, note: String, grant: String) {
        val key = form.value.key ?: return
        if (form.value.submitting) return
        form.update { it.copy(submitting = true, error = null) }
        viewModelScope.launch {
            try {
                val r = g.money.sendInternal(to.yorId, h.asset, h.network!!, amount, note, key, grant)
                form.update { it.copy(submitting = false, sent = Sent(r.id, r.reference, Fmt.qty(amount.toDouble(), h.asset), to.displayName)) }
                g.auth.userId?.let { g.wallet.refresh(it) }
                pollJob?.cancel()
                pollJob = viewModelScope.launch { while (true) { delay(15_000); g.auth.userId?.let { g.wallet.refresh(it) } } }   /* the status follows the server */
            } catch (e: ApiException) {
                /* uncertain: keep the SAME key, a retry can never create a second send */
                form.update { it.copy(submitting = false, error = e.code, uncertain = e.uncertain, key = if (e.uncertain) key else null) }
            }
        }
    }
    fun reset() { pollJob?.cancel(); form.value = SendForm() }
}

@Composable
fun SendScreen(initialAsset: String?, onBack: () -> Unit, onActivity: () -> Unit) {
    val vm = omViewModel { SendViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    val f = s.form
    var pick by rememberSaveable { mutableStateOf<String?>(null) }                /* "ASSET/network" */
    var amount by rememberSaveable { mutableStateOf("") }
    var note by rememberSaveable { mutableStateOf("") }
    var tried by rememberSaveable { mutableStateOf(false) }
    var review by remember { mutableStateOf(false) }
    var pin by remember { mutableStateOf(false) }
    LaunchedEffect(s.holdings) {
        if (pick == null) pick = (s.holdings.firstOrNull { it.asset == initialAsset } ?: s.holdings.firstOrNull())?.let { it.asset + "/" + it.network }
    }
    val h = s.holdings.firstOrNull { it.asset + "/" + it.network == pick }
    val dp = Catalog.asset(h?.asset)?.dp ?: 6
    val aErr = Validation.checkAmount(amount, dp, h?.available ?: 0.0)
    val found = (f.lookup as? Lookup.Found)?.r?.takeIf { !it.self }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 40.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            val back = stringResource(R.string.back)
            Row(Modifier.statusBarsPadding().padding(horizontal = 12.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(Modifier.size(44.dp).pressable(onClick = onBack).semantics { contentDescription = back }, contentAlignment = Alignment.Center) { OmIcon(OmIcons.Back, null) }
                Text(stringResource(R.string.send_title), style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink)
            }
        }
        val sent = f.sent
        if (sent != null) {
            item {
                GlassCard(Modifier.padding(horizontal = 16.dp), strong = true) {
                    Text(stringResource(R.string.send_done_t), style = MaterialTheme.typography.titleLarge, color = OmColors.Ink)
                    Text(sent.amount + " → " + sent.to, style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink)
                    sent.reference?.let { Text(stringResource(R.string.detail_reference) + " " + it, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary) }
                    StatusSteps(internalSteps(s.sentStage ?: Stage.Pending))
                    if ((s.sentStage ?: Stage.Pending) == Stage.Pending) Text(stringResource(R.string.send_done_b), style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary)
                    OmPrimaryButton(stringResource(R.string.nav_activity), onClick = onActivity)
                    OmSecondaryButton(stringResource(R.string.send_another)) { vm.reset(); amount = ""; note = ""; tried = false }
                }
            }
            return@LazyColumn
        }
        if (s.holdings.isEmpty()) { item { EmptyState(stringResource(R.string.send_no_funds_t), stringResource(R.string.send_no_funds_b), Modifier.padding(16.dp)) }; return@LazyColumn }
        item {
            Column(Modifier.padding(horizontal = 16.dp)) {
                OutlinedTextField(
                    f.email, vm::email, label = { Text(stringResource(R.string.send_email)) }, singleLine = true, modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), shape = RoundedCornerShape(OmRadius.S),
                    isError = tried && found == null, textStyle = MaterialTheme.typography.bodyLarge.copy(textDirection = TextDirection.Ltr),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OmColors.Blue600, unfocusedBorderColor = OmColors.Sky300, focusedContainerColor = OmColors.SurfaceBright, unfocusedContainerColor = OmColors.SurfaceBright),
                )
                when (val l = f.lookup) {
                    Lookup.Searching -> Text(stringResource(R.string.send_searching), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                    is Lookup.Found -> if (l.r.self) FieldError(stringResource(R.string.e_self_transfer))
                        else Text(stringResource(R.string.send_found, ltr(l.r.displayName)), style = MaterialTheme.typography.labelLarge, color = OmColors.Success, modifier = Modifier.padding(top = 4.dp))
                    Lookup.NotFound -> FieldError(stringResource(R.string.send_not_found))
                    is Lookup.Failed -> FieldError(errorText(l.code))
                    Lookup.Idle -> if (tried && !Validation.emailOk(f.email)) FieldError(stringResource(R.string.login_e_email))
                }
            }
        }
        item {
            LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(s.holdings, key = { it.asset + "/" + it.network }) { x ->
                    val id = x.asset + "/" + x.network
                    val on = id == pick
                    val shape = RoundedCornerShape(50)
                    Row(
                        Modifier.clip(shape).background(if (on) OmColors.Sky100 else OmColors.SurfaceBright, shape)
                            .border(if (on) 1.5.dp else 1.dp, if (on) OmColors.Blue600 else OmColors.Sky300, shape)
                            .semantics { selected = on }.pressable(role = Role.RadioButton) { pick = id; amount = ""; vm.forgetKey() }.padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically,
                    ) {
                        AssetLogo(x.asset, 24.dp)
                        Text(x.asset + " · " + (Catalog.network(x.network)?.std ?: x.network), style = MaterialTheme.typography.labelLarge, color = if (on) OmColors.Blue600 else OmColors.Ink)
                    }
                }
            }
        }
        item {
            Column(Modifier.padding(horizontal = 16.dp)) {
                Text(stringResource(R.string.wd_available, ltr(Fmt.qty(h?.available ?: 0.0, h?.asset ?: ""))), style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary)
                OutlinedTextField(
                    amount, { amount = it; vm.forgetKey() }, label = { Text(stringResource(R.string.wd_amount) + " (" + (h?.asset ?: "") + ")") }, singleLine = true, modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), shape = RoundedCornerShape(OmRadius.S), isError = (tried || amount.isNotEmpty()) && aErr != null,
                    textStyle = MaterialTheme.typography.bodyLarge.copy(textDirection = TextDirection.Ltr),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OmColors.Blue600, unfocusedBorderColor = OmColors.Sky300, focusedContainerColor = OmColors.SurfaceBright, unfocusedContainerColor = OmColors.SurfaceBright),
                )
                if (tried || amount.isNotEmpty()) FieldError(when (aErr) {
                    null -> null
                    Validation.AmountError.TooManyDecimals -> stringResource(R.string.e_decimals, dp)
                    Validation.AmountError.Insufficient -> stringResource(R.string.e_insufficient_balance)
                    else -> stringResource(R.string.e_amount)
                })
                OutlinedTextField(
                    note, { if (it.length <= 140) note = it }, label = { Text(stringResource(R.string.send_note)) }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    shape = RoundedCornerShape(OmRadius.S),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OmColors.Blue600, unfocusedBorderColor = OmColors.Sky300, focusedContainerColor = OmColors.SurfaceBright, unfocusedContainerColor = OmColors.SurfaceBright),
                )
            }
        }
        item {
            Box(Modifier.padding(horizontal = 16.dp)) {
                OmPrimaryButton(stringResource(R.string.wd_review)) {
                    tried = true
                    if (found != null && h != null && aErr == null && Validation.parseAmount(amount, dp) != null) { vm.prepare(); review = true }
                }
            }
        }
        item { Text(stringResource(R.string.send_rule), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.padding(horizontal = 20.dp)) }
    }

    if (review && found != null && h != null) {
        val v = Validation.parseAmount(amount, dp)
        if (!pin && v != null) OmSheet(stringResource(R.string.send_review_title), { if (!f.submitting) review = false }, dismissible = !f.submitting) {
            Text(Fmt.qty(v.toDouble(), h.asset), style = MaterialTheme.typography.displaySmall, color = OmColors.Ink)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(stringResource(R.string.send_to), color = OmColors.InkSecondary); Text(found.displayName, color = OmColors.Ink)
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(stringResource(R.string.wd_network), color = OmColors.InkSecondary); Text(Catalog.network(h.network)?.name ?: "", color = OmColors.Ink)
            }
            Text(stringResource(R.string.send_done_b), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
            f.error?.let { FieldError(errorText(if (f.uncertain) "network" else it)) }
            OmPrimaryButton(stringResource(R.string.send_submit), loading = f.submitting) { pin = true }
            OmSecondaryButton(stringResource(R.string.cancel), enabled = !f.submitting) { review = false }
        }
        if (pin && v != null) PinSheet(onGranted = { grant -> pin = false; vm.submit(found, h, v, note, grant) }, onDismiss = { pin = false })
        if (f.sent != null) review = false
    }
}
