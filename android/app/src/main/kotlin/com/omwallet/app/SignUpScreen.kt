package com.omwallet.app

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.unit.dp
import com.omwallet.core.data.Countries
import com.omwallet.core.data.Validation
import com.omwallet.core.design.FieldError
import com.omwallet.core.design.GlassCard
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmIcons
import com.omwallet.core.design.OmPrimaryButton
import com.omwallet.core.design.OmSheet
import com.omwallet.core.design.pressable
import com.omwallet.core.design.rememberOmHaptics
import com.omwallet.core.design.riseIn
import com.omwallet.core.network.ApiException
import com.omwallet.core.ui.R
import com.omwallet.core.ui.errorText
import com.omwallet.core.ui.omGraph
import kotlinx.coroutines.launch
import java.util.Locale

/* 14.5.2 — account creation inside the app, with the same data and checks as the web app (js/screens/auth.js renderSignup):
   first name, last name, e-mail, phone (country dial code + number, mandatory, also checked by the server), password (8+).
   The server (handle_new_user) opens the profile, the OMR account and the crypto wallets. If the project asks for an e-mail
   confirmation, the screen says so (« check your inbox ») and nothing pretends the account is ready; otherwise the person is
   signed in at once and lands on the home screen. */
@Composable
fun SignUpScreen(onBack: () -> Unit) {
    val g = omGraph()
    val scope = rememberCoroutineScope()
    val haptics = rememberOmHaptics()
    val lang = Locale.getDefault().language.let { if (it in setOf("fr", "en", "ar")) it else "en" }
    var first by rememberSaveable { mutableStateOf("") }
    var last by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var iso by rememberSaveable { mutableStateOf("OM") }
    var phone by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var tried by rememberSaveable { mutableStateOf(false) }
    var busy by rememberSaveable { mutableStateOf(false) }
    var error by rememberSaveable { mutableStateOf<String?>(null) }
    var sentTo by rememberSaveable { mutableStateOf<String?>(null) }
    var pickCountry by rememberSaveable { mutableStateOf(false) }
    val country = Countries.of(iso)
    val fullPhone = Validation.signupPhone(country.dial, phone)
    val emailErr = if (tried && !Validation.emailOk(email)) stringResource(R.string.login_e_email) else null
    val phoneErr = if (tried && fullPhone == null) stringResource(R.string.signup_e_phone) else null
    val passErr = if (tried && password.length < Validation.PASSWORD_MIN) stringResource(R.string.signup_e_password) else null
    val colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OmColors.Blue600, unfocusedBorderColor = OmColors.Edge, focusedContainerColor = OmColors.Track, unfocusedContainerColor = OmColors.Card, cursorColor = OmColors.Blue600, focusedLeadingIconColor = OmColors.Blue600)
    BackHandler { if (!busy) onBack() }

    fun submit() {
        tried = true; error = null
        if (busy || !Validation.emailOk(email) || fullPhone == null || password.length < Validation.PASSWORD_MIN) { if (!busy) haptics.warn(); return }
        busy = true
        scope.launch {
            try {
                val signedIn = g.auth.signUp(email, password, first, last, fullPhone, country.iso, lang)
                haptics.confirm()
                if (!signedIn) sentTo = email.trim()                   /* confirmation e-mail sent: the account opens after the link */
            } catch (e: ApiException) { error = e.code; haptics.warn() }
            finally { busy = false }
        }
    }

    Column(
        Modifier.fillMaxSize().statusBarsPadding().imePadding().verticalScroll(rememberScrollState()).padding(horizontal = 22.dp, vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Image(painterResource(com.omwallet.app.R.drawable.app_icon_glass), contentDescription = stringResource(R.string.app_name),
            modifier = Modifier.padding(top = 6.dp).size(96.dp).riseIn(0).clip(RoundedCornerShape(percent = 26)))
        Spacer(Modifier.height(10.dp))
        Text(stringResource(R.string.signup_title), style = MaterialTheme.typography.headlineMedium, color = OmColors.Ink, textAlign = TextAlign.Center, modifier = Modifier.riseIn(1))
        Spacer(Modifier.height(4.dp))
        Text(stringResource(R.string.signup_sub), style = MaterialTheme.typography.bodyLarge, color = OmColors.InkSecondary, textAlign = TextAlign.Center, modifier = Modifier.riseIn(1))
        Spacer(Modifier.height(18.dp))

        val done = sentTo
        if (done != null) {
            GlassCard(Modifier.fillMaxWidth(), strong = true, padding = 18.dp, rise = 2) {
                OmIcon(OmIcons.Mail, null, tint = OmColors.Ink, size = 34.dp)
                Text(stringResource(R.string.signup_done_title), style = MaterialTheme.typography.titleLarge, color = OmColors.Ink)
                Text(stringResource(R.string.signup_done_body, done), style = MaterialTheme.typography.bodyLarge, color = OmColors.InkSecondary)
                Spacer(Modifier.height(6.dp))
                OmPrimaryButton(stringResource(R.string.login_btn)) { onBack() }
            }
            return@Column
        }

        GlassCard(Modifier.fillMaxWidth(), strong = true, padding = 18.dp, rise = 2) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(first, { first = it; error = null }, placeholder = { Text(stringResource(R.string.signup_first)) }, singleLine = true,
                    modifier = Modifier.weight(1f), keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next), shape = RoundedCornerShape(18.dp), colors = colors)
                OutlinedTextField(last, { last = it; error = null }, placeholder = { Text(stringResource(R.string.signup_last)) }, singleLine = true,
                    modifier = Modifier.weight(1f), keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next), shape = RoundedCornerShape(18.dp), colors = colors)
            }
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                email, { email = it.trim(); error = null }, placeholder = { Text(stringResource(R.string.email)) }, singleLine = true, isError = emailErr != null, modifier = Modifier.fillMaxWidth(),
                leadingIcon = { OmIcon(OmIcons.Mail, null, tint = OmColors.InkSecondary) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next), shape = RoundedCornerShape(18.dp), colors = colors,
                textStyle = MaterialTheme.typography.bodyLarge.copy(textDirection = TextDirection.Ltr),
            )
            FieldError(emailErr)
            Spacer(Modifier.height(12.dp))
            /* phone: country (dial code) + national number; always laid out left to right, like a phone number */
            androidx.compose.runtime.CompositionLocalProvider(androidx.compose.ui.platform.LocalLayoutDirection provides androidx.compose.ui.unit.LayoutDirection.Ltr) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    val pickLabel = stringResource(R.string.signup_country)
                    Text("${country.iso} ${country.dial}", style = MaterialTheme.typography.titleMedium, color = OmColors.Ink,
                        modifier = Modifier.clip(RoundedCornerShape(18.dp)).background(OmColors.Card).border(1.dp, OmColors.Edge, RoundedCornerShape(18.dp))
                            .pressable { pickCountry = true }.heightIn(min = 56.dp).padding(horizontal = 14.dp, vertical = 16.dp)
                            .semantics { contentDescription = "$pickLabel: ${country.name(lang)} ${country.dial}" }.testTag("signup_country"))
                    OutlinedTextField(
                        phone, { phone = it; error = null }, placeholder = { Text(stringResource(R.string.signup_phone)) }, singleLine = true, isError = phoneErr != null, modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Next), shape = RoundedCornerShape(18.dp), colors = colors,
                    )
                }
            }
            FieldError(phoneErr)
            if (phoneErr == null) Text(stringResource(R.string.signup_phone_hint), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.padding(top = 4.dp))
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                password, { password = it; error = null }, placeholder = { Text(stringResource(R.string.password)) }, singleLine = true, isError = passErr != null, modifier = Modifier.fillMaxWidth(),
                leadingIcon = { OmIcon(OmIcons.Lock, null, tint = OmColors.InkSecondary) },
                visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { submit() }), shape = RoundedCornerShape(18.dp), colors = colors,
            )
            FieldError(passErr ?: error?.let { errorText(it) })
            if (passErr == null && error == null) Text(stringResource(R.string.signup_password_hint), style = MaterialTheme.typography.bodySmall, color = OmColors.InkSecondary, modifier = Modifier.padding(top = 4.dp))
            Spacer(Modifier.height(16.dp))
            OmPrimaryButton(stringResource(R.string.signup_btn), loading = busy) { submit() }
        }
        Spacer(Modifier.height(16.dp))
        Text(
            stringResource(R.string.signup_have_account), style = MaterialTheme.typography.titleSmall, color = OmColors.Blue600, textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().pressable { if (!busy) onBack() }.padding(vertical = 12.dp),
        )
    }

    if (pickCountry) OmSheet(stringResource(R.string.signup_country), onDismiss = { pickCountry = false }) {
        Countries.all.forEach { c ->
            Row(Modifier.fillMaxWidth().pressable { iso = c.iso; pickCountry = false }.padding(vertical = 12.dp).testTag("country_${c.iso}"),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(c.name(lang), style = MaterialTheme.typography.titleMedium, color = OmColors.Ink, modifier = Modifier.weight(1f))
                Text(c.dial, style = MaterialTheme.typography.titleMedium, color = if (c.iso == iso) OmColors.Blue600 else OmColors.InkSecondary)
            }
        }
    }
}
