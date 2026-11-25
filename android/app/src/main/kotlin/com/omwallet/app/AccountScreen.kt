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
import androidx.compose.foundation.layout.heightIn
import com.omwallet.core.design.IosGap
import com.omwallet.core.design.IosLargeTitle
import com.omwallet.core.design.IosColors
import com.omwallet.core.design.IosRow
import com.omwallet.core.design.IosGroup
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

    /* 15.3.0 — like the iPhone's Settings: the app mark, a large title at the start, the profile cell, then inset grouped lists of 52 dp rows
       (a coloured rounded-square tile per kind of setting, a thin chevron, a hairline between rows), an iOS switch, and « Log out » as a red row.
       Every row keeps its existing action. */
    LazyColumn(Modifier.fillMaxSize(), contentPadding = contentPadding) {
        item {
            Column(Modifier.statusBarsPadding().padding(top = 6.dp)) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.End) { com.omwallet.core.design.LogoMark(size = 30.dp) }
                IosLargeTitle(stringResource(R.string.account_title), Modifier.padding(top = 4.dp, bottom = 14.dp))
            }
        }
        item {
            IosGroup {
                Row(Modifier.fillMaxWidth().heightIn(min = 80.dp).padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    val initials = (profile?.displayName ?: "").split(' ').filter { it.isNotBlank() }.take(2).joinToString("") { it.take(1).uppercase() }
                    Box(Modifier.size(60.dp).clip(CircleShape).background(androidx.compose.ui.graphics.Brush.verticalGradient(listOf(OmColors.GradTop, OmColors.GradBottom))), contentAlignment = Alignment.Center) {
                        Text(initials.ifBlank { "OM" }, style = MaterialTheme.typography.titleLarge, color = OmColors.OnAccent)
                    }
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(profile?.displayName ?: "—", style = MaterialTheme.typography.titleLarge, color = OmColors.Ink)
                        profile?.email?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary) }
                        profile?.yorId?.let { Text(stringResource(R.string.acc_id) + " · " + it, style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary) }
                    }
                }
            }
        }
        item { IosGap() }
        item {
            IosGroup {
                IosRow(stringResource(R.string.acc_language), icon = OmIcons.Globe, tile = IosColors.Gray, chevron = true,
                    value = when (lang) { "ar" -> "العربية"; "fr" -> "Français"; "en" -> "English"; else -> stringResource(R.string.lang_system) }) { languages = true }
                IosRow(stringResource(R.string.acc_currency), icon = OmIcons.Coin, tile = IosColors.Yellow, value = prefs.currency.name, chevron = true, divider = true) {
                    scope.launch { g.prefs.setCurrency(if (prefs.currency == DisplayCurrency.USD) DisplayCurrency.OMR else DisplayCurrency.USD) }
                }
                IosRow(stringResource(R.string.acc_hide), icon = OmIcons.Eye, tile = IosColors.Red, divider = true,
                    checked = prefs.hideBalance, onCheckedChange = { v -> scope.launch { g.prefs.setHidden(v) } })
                if (isAdmin) IosRow(stringResource(R.string.acc_admin), icon = OmIcons.Shield, tile = IosColors.Green, chevron = true, divider = true, onClick = onAdmin)
            }
        }
        item { IosGap() }
        item {
            IosGroup {
                IosRow(stringResource(R.string.acc_cache), icon = OmIcons.Refresh, tile = IosColors.Orange,
                    subtitle = if (cleared) stringResource(R.string.acc_cache_cleared) else stringResource(R.string.acc_cache_size, if (cache < 0) "—" else Formatter.formatShortFileSize(ctx, cache)))
                IosRow(stringResource(R.string.acc_cache_clear), titleColor = IosColors.Yellow, divider = true) { scope.launch { g.cache.purge(maxBytes = 0); cleared = true } }
            }
        }
        item { IosGap() }
        item {
            IosGroup {
                IosRow(stringResource(R.string.acc_licenses), subtitle = stringResource(R.string.acc_licenses_b))
                IosRow(stringResource(R.string.acc_version, BuildConfig.VERSION_NAME), titleColor = OmColors.InkSecondary, divider = true)
            }
        }
        item { IosGap() }
        item {
            IosGroup { IosRow(stringResource(R.string.acc_logout), titleColor = IosColors.Red, centered = true) { scope.launch { g.auth.signOut() } } }
        }
        item { Spacer(Modifier.height(24.dp)) }
    }

    if (languages) OmSheet(stringResource(R.string.acc_language), { languages = false }) {
        val options = listOf("" to stringResource(R.string.lang_system), "en" to "English", "fr" to "Français", "ar" to "العربية")
        Column(Modifier.clip(androidx.compose.foundation.shape.RoundedCornerShape(22.dp)).background(IosColors.Group)) {
            options.forEachIndexed { i, (tag, label) ->
                val on = tag == lang || (tag.isEmpty() && lang.isEmpty())
                IosRow(label, divider = i > 0, trailing = { if (on) Text("✓", style = MaterialTheme.typography.titleMedium, color = IosColors.Yellow) }) {
                    languages = false
                    AppCompatDelegate.setApplicationLocales(if (tag.isEmpty()) LocaleListCompat.getEmptyLocaleList() else LocaleListCompat.forLanguageTags(tag))
                }
            }
        }
    }
}
