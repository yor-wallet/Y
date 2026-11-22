package com.omwallet.feature.deposit

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.Canvas
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.common.BitMatrix
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import com.omwallet.core.data.Catalog
import com.omwallet.core.data.MoneyRepository
import com.omwallet.core.data.OmGraph
import com.omwallet.core.design.AssetLogo
import com.omwallet.core.design.EmptyState
import com.omwallet.core.design.ErrorState
import com.omwallet.core.design.GlassCard
import com.omwallet.core.design.NetworkLogo
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmIcons
import com.omwallet.core.design.OmPrimaryButton
import com.omwallet.core.design.OmSecondaryButton
import com.omwallet.core.design.SkeletonRows
import com.omwallet.core.design.pressable
import com.omwallet.core.design.rememberOmHaptics
import com.omwallet.core.network.ApiException
import com.omwallet.core.ui.R
import com.omwallet.core.ui.errorText
import com.omwallet.core.ui.omViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/* Deposit: asset → network → the address the SERVER gives for this account. No address is ever generated on the device;
   while the server has no custody address it answers "deposit_address_unavailable" and the screen says exactly that. */
sealed interface AddressState {
    data object Idle : AddressState
    data object Loading : AddressState
    data class Ready(val address: String) : AddressState
    data object Unavailable : AddressState
    data class Failed(val code: String) : AddressState
}
data class DepositUiState(val asset: String? = null, val network: String? = null, val address: AddressState = AddressState.Idle)

class DepositViewModel(private val g: OmGraph, initialAsset: String?) : ViewModel() {
    private val _s = MutableStateFlow(DepositUiState(asset = initialAsset?.takeIf { Catalog.asset(it)?.nets?.isNotEmpty() == true }))
    val state: StateFlow<DepositUiState> = _s.asStateFlow()
    init { _s.value.asset?.let { a -> Catalog.asset(a)?.nets?.singleOrNull()?.let { pickNetwork(it) } } }
    fun pickAsset(a: String?) { _s.value = DepositUiState(asset = a); Catalog.asset(a)?.nets?.singleOrNull()?.let { pickNetwork(it) } }
    fun pickNetwork(n: String?) {
        val a = _s.value.asset ?: return
        _s.value = _s.value.copy(network = n, address = if (n == null) AddressState.Idle else AddressState.Loading)
        if (n == null) return
        viewModelScope.launch {
            val r = try {
                when (val d = g.money.depositAddress(a, n)) { is MoneyRepository.DepositAddress.Ready -> AddressState.Ready(d.address); else -> AddressState.Unavailable }
            } catch (e: ApiException) { AddressState.Failed(e.code) }
            if (_s.value.network == n) _s.value = _s.value.copy(address = r)
        }
    }
}

@Composable
fun DepositScreen(initialAsset: String?, onBack: () -> Unit) {
    val vm = omViewModel(key = "deposit-$initialAsset") { DepositViewModel(it, initialAsset) }
    val s by vm.state.collectAsStateWithLifecycle()
    val back = { if (s.network != null && (Catalog.asset(s.asset)?.nets?.size ?: 0) > 1) vm.pickNetwork(null) else if (s.asset != null) vm.pickAsset(null) else onBack() }
    androidx.activity.compose.BackHandler(enabled = s.asset != null) { back() }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { Header(stringResource(R.string.deposit_title), back) }
        val asset = Catalog.asset(s.asset)
        when {
            asset == null -> {
                item { Text(stringResource(R.string.deposit_choose_asset), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink, modifier = Modifier.padding(horizontal = 20.dp)) }
                items(Catalog.assets.filter { it.nets.isNotEmpty() }, key = { it.sym }) { a ->
                    PickRow({ AssetLogo(a.sym) }, a.name, a.sym) { vm.pickAsset(a.sym) }
                }
            }
            s.network == null -> {
                item { Text(stringResource(R.string.deposit_choose_network), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink, modifier = Modifier.padding(horizontal = 20.dp)) }
                items(asset.nets, key = { it }) { id ->
                    val n = Catalog.network(id)!!
                    PickRow({ NetworkLogo(id, 40.dp) }, n.name, n.std) { vm.pickNetwork(id) }
                }
            }
            else -> item { AddressCard(asset.sym, s.network!!, s.address, retry = { vm.pickNetwork(s.network) }, other = if (asset.nets.size > 1) ({ vm.pickNetwork(null) }) else null) }
        }
    }
}

@Composable
internal fun Header(title: String, onBack: () -> Unit) {
    val back = stringResource(R.string.back)
    Row(Modifier.statusBarsPadding().padding(horizontal = 12.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Box(Modifier.size(44.dp).pressable(onClick = onBack).semantics { contentDescription = back }, contentAlignment = Alignment.Center) { OmIcon(OmIcons.Back, null) }
        Text(title, style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink)
    }
}

@Composable
private fun PickRow(logo: @Composable () -> Unit, title: String, sub: String, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().pressable(onClick = onClick).padding(horizontal = 20.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        logo()
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
            Text(sub, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
        }
        OmIcon(OmIcons.Chevron, null, tint = OmColors.InkSecondary, size = 18.dp)
    }
}

@Composable
private fun AddressCard(sym: String, network: String, st: AddressState, retry: () -> Unit, other: (() -> Unit)?) {
    val n = Catalog.network(network)!!
    val ctx = LocalContext.current
    val haptics = rememberOmHaptics()
    AnimatedContent(st, label = "addr") { state ->
        when (state) {
            AddressState.Idle, AddressState.Loading -> SkeletonRows(3, Modifier.padding(20.dp))
            AddressState.Unavailable -> Column(Modifier.fillMaxWidth().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) { AssetLogo(sym, 36.dp); NetworkLogo(network, 30.dp) }
                EmptyState(stringResource(R.string.deposit_unavailable_t), stringResource(R.string.deposit_unavailable_b, sym, n.name), Modifier, if (other != null) stringResource(R.string.deposit_other_network) else null, other)
            }
            is AddressState.Failed -> ErrorState(errorText(state.code), stringResource(R.string.retry), Modifier.padding(16.dp), retry)
            is AddressState.Ready -> GlassCard(Modifier.padding(horizontal = 16.dp), strong = true) {
                Text(stringResource(R.string.deposit_address, sym, n.name), style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
                val matrix = remember(state.address) { qr(state.address) }
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { QrImage(matrix, Modifier.size(220.dp)) }
                Text(state.address, style = MaterialTheme.typography.bodyLarge, color = OmColors.Ink, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                Text(stringResource(R.string.deposit_warning, sym, n.name), style = MaterialTheme.typography.bodySmall, color = OmColors.Warning)
                val copied = stringResource(R.string.copied)
                OmPrimaryButton(stringResource(R.string.copy)) { copy(ctx, state.address); haptics.confirm(); android.widget.Toast.makeText(ctx, copied, android.widget.Toast.LENGTH_SHORT).show() }
                OmSecondaryButton(stringResource(R.string.share)) {
                    ctx.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, state.address), null).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                }
            }
        }
    }
}

private fun copy(ctx: Context, text: String) {
    (ctx.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("address", text))
}

/* Real QR code (ZXing encoder, error correction M), drawn as squares on a white quiet zone. */
fun qr(text: String): BitMatrix = QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, 0, 0, mapOf(EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M, EncodeHintType.MARGIN to 2))

@Composable
private fun QrImage(m: BitMatrix, modifier: Modifier) {
    Canvas(modifier) {
        drawRect(Color.White)
        val cell = size.minDimension / m.width
        for (y in 0 until m.height) for (x in 0 until m.width) if (m[x, y]) drawRect(OmColors.Ink, Offset(x * cell, y * cell), Size(cell + 0.5f, cell + 0.5f))
    }
}
