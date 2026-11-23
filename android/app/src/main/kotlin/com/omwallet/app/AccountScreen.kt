package com.omwallet.app

import com.omwallet.core.design.ReferenceTitle

import com.omwallet.core.design.ReferenceRow

import com.omwallet.core.design.GlassTile

import com.omwallet.core.design.BrandLockup

import androidx.compose.ui.draw.clip

import androidx.compose.foundation.shape.CircleShape

import androidx.compose.foundation.layout.size

import androidx.compose.foundation.layout.height

import androidx.compose.foundation.layout.Spacer

import androidx.compose.foundation.layout.Box

import androidx.compose.foundation.background

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

    /* settings / profile references: logo, large centred title, profile card, one glass list (glass tiles, labels, chevrons),
       then the log-out pill. Every row keeps its existing action. */
    LazyColumn(Modifier.fillMaxSize(), contentPadding = contentPadding, verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Column(Modifier.statusBarsPadding().padding(horizontal = 16.dp, vertical = 6.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                BrandLockup(height = 38.dp)
                ReferenceTitle(stringResource(R.string.account_title))
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), strong = true, rise = 0) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    val initials = (profile?.displayName ?: "").split(' ').filter { it.isNotBlank() }.take(2).joinToString("") { it.take(1).uppercase() }
                    Box(Modifier.size(64.dp).clip(CircleShape).background(androidx.compose.ui.graphics.Brush.verticalGradient(listOf(OmColors.SkyGlow, OmColors.Blue700))), contentAlignment = Alignment.Center) {
                        Text(initials.ifBlank { "OM" }, style = MaterialTheme.typography.titleLarge, color = androidx.compose.ui.graphics.Color.White)
                    }
                    Column(Modifier.weight(1f)) {
                        Text(profile?.displayName ?: "—", style = MaterialTheme.typography.titleLarge, color = OmColors.Ink)
                        profile?.email?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary) }
                        profile?.yorId?.let { Text(stringResource(R.string.acc_id) + " · " + it, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary) }
                    }
                }
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), padding = 14.dp, rise = 1) {
                ReferenceRow(OmIcons.Globe, stringResource(R.string.acc_language), value = when (lang) { "ar" -> "العربية"; "fr" -> "Français"; "en" -> "English"; else -> stringResource(R.string.lang_system) }) { languages = true }
                ReferenceRow(OmIcons.Coin, stringResource(R.string.acc_currency), value = prefs.currency.name) {
                    scope.launch { g.prefs.setCurrency(if (prefs.currency == DisplayCurrency.USD) DisplayCurrency.OMR else DisplayCurrency.USD) }
                }
                Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    GlassTile(OmIcons.Eye)
                    Text(stringResource(R.string.acc_hide), style = MaterialTheme.typography.titleLarge, color = OmColors.Ink, modifier = Modifier.weight(1f))
                    Switch(prefs.hideBalance, { v -> scope.launch { g.prefs.setHidden(v) } }, colors = SwitchDefaults.colors(checkedTrackColor = OmColors.Blue600))
                }
                if (isAdmin) ReferenceRow(OmIcons.Shield, stringResource(R.string.acc_admin), onClick = onAdmin)
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), rise = 2) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    GlassTile(OmIcons.Refresh)
                    Column(Modifier.weight(1f)) {
                        Text(stringResource(R.string.acc_cache), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink)
                        Text(stringResource(R.string.acc_cache_size, if (cache < 0) "—" else Formatter.formatShortFileSize(ctx, cache)), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary)
                        if (cleared) Text(stringResource(R.string.acc_cache_cleared), style = MaterialTheme.typography.bodySmall, color = OmColors.Success)
                    }
                }
                Spacer(Modifier.height(10.dp))
                OmSecondaryButton(stringResource(R.string.acc_cache_clear)) { scope.launch { g.cache.purge(maxBytes = 0); cleared = true } }
            }
        }
        item {
            GlassCard(Modifier.padding(horizontal = 16.dp), rise = 3) {
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
