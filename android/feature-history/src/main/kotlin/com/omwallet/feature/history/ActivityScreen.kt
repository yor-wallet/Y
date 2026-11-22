package com.omwallet.feature.history

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.omwallet.core.data.OmGraph
import com.omwallet.core.data.Tx
import com.omwallet.core.data.WalletState
import com.omwallet.core.design.EmptyState
import com.omwallet.core.design.GlassCard
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.SkeletonRows
import com.omwallet.core.design.pressable
import com.omwallet.core.ui.R
import com.omwallet.core.ui.TxDetailSheet
import com.omwallet.core.ui.TxItem
import com.omwallet.core.ui.errorText
import com.omwallet.core.ui.omViewModel
import com.omwallet.core.ui.relative
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

/* Group key per calendar day in the device's time zone (today / yesterday / date). */
fun dayKey(ms: Long, zone: ZoneId = ZoneId.systemDefault()): LocalDate = Instant.ofEpochMilli(ms).atZone(zone).toLocalDate()
fun groupByDay(list: List<Tx>, zone: ZoneId = ZoneId.systemDefault()): List<Pair<LocalDate, List<Tx>>> =
    list.sortedByDescending { it.createdAt }.groupBy { dayKey(it.createdAt, zone) }.toList()

data class ActivityUiState(val wallet: WalletState = WalletState(), val hidden: Boolean = false)

class ActivityViewModel(private val g: OmGraph) : ViewModel() {
    val state: StateFlow<ActivityUiState> = combine(g.wallet.state, g.prefs.prefs) { w, p -> ActivityUiState(w, p.hideBalance) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), ActivityUiState())
    fun refresh() = viewModelScope.launch { g.auth.userId?.let { g.wallet.refresh(it) } }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityScreen(contentPadding: PaddingValues) {
    val vm = omViewModel { ActivityViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    var detail by remember { mutableStateOf<Tx?>(null) }
    var showArchive by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(Unit) { vm.refresh() }
    val w = s.wallet
    val today = LocalDate.now()
    val fmt = remember { DateTimeFormatter.ofLocalizedDate(FormatStyle.FULL) }

    PullToRefreshBox(isRefreshing = w.loading && w.syncedAt > 0, onRefresh = { vm.refresh() }, modifier = Modifier.fillMaxSize()) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = contentPadding) {
            item {
                Column(Modifier.statusBarsPadding().padding(horizontal = 20.dp, vertical = 8.dp)) {
                    Text(stringResource(R.string.activity_title), style = MaterialTheme.typography.headlineMedium, color = OmColors.Ink)
                    if (w.syncedAt > 0) Text(stringResource(if (w.offline) R.string.offline_since else R.string.updated_at, relative(w.syncedAt)), style = MaterialTheme.typography.bodySmall,
                        color = if (w.offline) OmColors.Warning else OmColors.InkSecondary)
                    if (w.error != null && !w.offline) Text(errorText(w.error), style = MaterialTheme.typography.bodySmall, color = OmColors.Error)
                }
            }
            if (w.loading && w.syncedAt == 0L) item { SkeletonRows(6, Modifier.padding(horizontal = 20.dp)) }
            else if (w.transactions.isEmpty()) item { EmptyState(stringResource(R.string.home_no_activity_t), stringResource(R.string.home_no_activity_b), Modifier.padding(16.dp)) }
            groupByDay(w.transactions).forEach { (day, txs) ->
                item(key = "d-$day") {
                    Text(
                        when (day) { today -> stringResource(R.string.today); today.minusDays(1) -> stringResource(R.string.yesterday); else -> day.format(fmt) },
                        style = MaterialTheme.typography.labelLarge, color = OmColors.InkSecondary, modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 4.dp),
                    )
                }
                items(txs, key = { it.id }) { t -> TxItem(t, s.hidden, { detail = t }, Modifier.padding(horizontal = 20.dp)) }
            }
            /* CFA history: kept unchanged on the server, shown read-only — never converted, never counted in a crypto balance */
            if (w.archivedCfa.isNotEmpty()) item {
                GlassCard(Modifier.padding(16.dp)) {
                    Text(stringResource(R.string.archive_cfa_t), style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
                    Text(stringResource(R.string.archive_cfa_b, w.archivedCfa.size), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                    Text(stringResource(if (showArchive) R.string.hide_archive else R.string.show_archive), style = MaterialTheme.typography.labelLarge, color = OmColors.Blue600,
                        modifier = Modifier.padding(top = 6.dp).pressable { showArchive = !showArchive })
                }
            }
            if (showArchive) items(w.archivedCfa, key = { "cfa-" + it.id }) { t -> TxItem(t, s.hidden, { detail = t }, Modifier.padding(horizontal = 20.dp)) }
        }
    }
    detail?.let { TxDetailSheet(it, s.hidden) { detail = null } }
}
