package com.omwallet.app

import android.text.format.Formatter
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.omwallet.core.data.AuthState
import com.omwallet.core.data.DisplayCurrency
import com.omwallet.core.data.UserPrefs
import com.omwallet.core.design.GlassCard
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmIcons
import com.omwallet.core.design.OmSecondaryButton
import com.omwallet.core.design.OmSheet
import com.omwallet.core.design.pressable
import com.omwallet.core.ui.R
import com.omwallet.core.ui.omGraph
import kotlinx.coroutines.launch

@Composable
fun AccountScreen(isAdmin: Boolean, onAdmin: () -> Unit, contentPadding: PaddingValues) {
    val g = omGraph()
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val auth by g.auth.state.collectAsStateWithLifecycle()
    val prefs by g.prefs.prefs.collectAsStateWithLifecycle(UserPrefs())
    val profile = (auth as? AuthState.SignedIn)?.profile
    var languages by remember { mutableStateOf(false) }
    var cache by remember { mutableLongStateOf(-1L) }
    var cleared by remember { mutableStateOf(false) }
    LaunchedEffect(cleared) { cache = g.cache.sizeBytes() }
    val lang = AppCompatDelegate.getApplicationLocales().toLanguageTags().substringBefore('-')

    LazyColumn(Modifier.fillMaxSize(), contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text(stringResource(R.string.account_title), style = MaterialTheme.typography.headlineMedium, color = OmColors.Ink, modifier = Modifier.statusBarsPadding().padding(horizontal = 20.dp, vertical = 8.dp)) }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), strong = true) {
                Text(profile?.displayName ?: "—", style = MaterialTheme.typography.titleLarge, color = OmColors.Ink)
                profile?.email?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary) }
                profile?.yorId?.let { Text(stringResource(R.string.acc_id) + " · " + it, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary) }
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp)) {
                Line(stringResource(R.string.acc_language), when (lang) { "ar" -> "العربية"; "fr" -> "Français"; "en" -> "English"; else -> stringResource(R.string.lang_system) }) { languages = true }
                Line(stringResource(R.string.acc_currency), prefs.currency.name) {
                    scope.launch { g.prefs.setCurrency(if (prefs.currency == DisplayCurrency.USD) DisplayCurrency.OMR else DisplayCurrency.USD) }
                }
                Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(stringResource(R.string.acc_hide), style = MaterialTheme.typography.bodyLarge, color = OmColors.Ink, modifier = Modifier.weight(1f))
                    Switch(prefs.hideBalance, { v -> scope.launch { g.prefs.setHidden(v) } }, colors = SwitchDefaults.colors(checkedTrackColor = OmColors.Blue600))
                }
            }
        }
        if (isAdmin) item {
            GlassCard(Modifier.padding(horizontal = 16.dp).pressable(onClick = onAdmin)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OmIcon(OmIcons.Shield, null, tint = OmColors.Blue600)
                    Text(stringResource(R.string.acc_admin), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink, modifier = Modifier.weight(1f))
                    OmIcon(OmIcons.Chevron, null, tint = OmColors.InkSecondary, size = 18.dp)
                }
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp)) {
                Text(stringResource(R.string.acc_cache), style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
                Text(stringResource(R.string.acc_cache_size, if (cache < 0) "—" else Formatter.formatShortFileSize(ctx, cache)), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                if (cleared) Text(stringResource(R.string.acc_cache_cleared), style = MaterialTheme.typography.bodySmall, color = OmColors.Success)
                OmSecondaryButton(stringResource(R.string.acc_cache_clear)) { scope.launch { g.cache.purge(maxBytes = 0); cleared = true } }
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp)) {
                Text(stringResource(R.string.acc_licenses), style = MaterialTheme.typography.titleSmall, color = OmColors.Ink)
                Text(stringResource(R.string.acc_licenses_b), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                Text(stringResource(R.string.acc_version, BuildConfig.VERSION_NAME), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
            }
        }
        item {
            Column(Modifier.padding(horizontal = 16.dp)) {
                OmSecondaryButton(stringResource(R.string.acc_logout)) { scope.launch { g.auth.signOut() } }
            }
        }
    }

    if (languages) OmSheet(stringResource(R.string.acc_language), { languages = false }) {
        listOf("" to stringResource(R.string.lang_system), "en" to "English", "fr" to "Français", "ar" to "العربية").forEach { (tag, label) ->
            Text(label, style = MaterialTheme.typography.bodyLarge, color = if (tag == lang || (tag.isEmpty() && lang.isEmpty())) OmColors.Blue600 else OmColors.Ink,
                modifier = Modifier.fillMaxWidth().pressable(role = Role.RadioButton) {
                    languages = false
                    AppCompatDelegate.setApplicationLocales(if (tag.isEmpty()) LocaleListCompat.getEmptyLocaleList() else LocaleListCompat.forLanguageTags(tag))
                }.padding(vertical = 12.dp))
        }
    }
}

@Composable
private fun Line(label: String, value: String, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().pressable(onClick = onClick).padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.bodyLarge, color = OmColors.Ink, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.bodyMedium, color = OmColors.Blue600)
        OmIcon(OmIcons.Chevron, null, tint = OmColors.InkSecondary, size = 16.dp, modifier = Modifier.padding(start = 6.dp))
    }
}
