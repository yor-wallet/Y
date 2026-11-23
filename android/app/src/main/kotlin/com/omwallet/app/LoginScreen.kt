package com.omwallet.app

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.unit.dp
import com.omwallet.core.data.Validation
import com.omwallet.core.design.FieldError
import com.omwallet.core.design.GlassCard
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.OmPrimaryButton
import com.omwallet.core.design.OmRadius
import com.omwallet.core.design.pressable
import com.omwallet.core.design.rememberOmHaptics
import com.omwallet.core.network.ApiException
import com.omwallet.core.ui.R
import com.omwallet.core.ui.errorText
import com.omwallet.core.ui.omGraph
import com.omwallet.core.ui.openUrl
import kotlinx.coroutines.launch

@Composable
fun LoginScreen() {
    val g = omGraph()
    val scope = rememberCoroutineScope()
    val ctx = LocalContext.current
    val haptics = rememberOmHaptics()
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var tried by rememberSaveable { mutableStateOf(false) }
    var busy by rememberSaveable { mutableStateOf(false) }
    var error by rememberSaveable { mutableStateOf<String?>(null) }
    val emailErr = if (tried && !Validation.emailOk(email)) stringResource(R.string.login_e_email) else null
    val passErr = if (tried && password.isEmpty()) stringResource(R.string.login_e_password) else null
    val colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OmColors.Blue600, unfocusedBorderColor = OmColors.Sky300, focusedContainerColor = OmColors.SurfaceBright, unfocusedContainerColor = OmColors.SurfaceBright)

    fun submit() {
        tried = true; error = null
        if (!Validation.emailOk(email) || password.isEmpty() || busy) return
        busy = true
        scope.launch {
            try { g.auth.signIn(email, password); haptics.confirm() }
            catch (e: ApiException) { error = e.code; haptics.warn() }
            finally { busy = false }
        }
    }

    Column(
        Modifier.fillMaxSize().statusBarsPadding().imePadding().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Image(painterResource(com.omwallet.app.R.drawable.om_logo_stacked), contentDescription = stringResource(R.string.app_name), modifier = Modifier.width(190.dp).padding(top = 24.dp))
        Text(stringResource(R.string.login_title), style = MaterialTheme.typography.displaySmall, color = OmColors.Ink)
        Text(stringResource(R.string.login_sub), style = MaterialTheme.typography.bodyLarge, color = OmColors.InkSecondary)
        GlassCard(Modifier.fillMaxWidth(), strong = true) {
            OutlinedTextField(
                email, { email = it.trim(); error = null }, label = { Text(stringResource(R.string.email)) }, singleLine = true, isError = emailErr != null, modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next), shape = RoundedCornerShape(OmRadius.S), colors = colors,
                textStyle = MaterialTheme.typography.bodyLarge.copy(textDirection = TextDirection.Ltr),
            )
            FieldError(emailErr)
            OutlinedTextField(
                password, { password = it; error = null }, label = { Text(stringResource(R.string.password)) }, singleLine = true, isError = passErr != null, modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                keyboardActions = androidx.compose.foundation.text.KeyboardActions(onDone = { submit() }), shape = RoundedCornerShape(OmRadius.S), colors = colors,
            )
            FieldError(passErr ?: error?.let { errorText(it) })
            OmPrimaryButton(stringResource(R.string.login_btn), loading = busy) { submit() }
        }
        Text(
            stringResource(R.string.login_signup), style = MaterialTheme.typography.labelLarge, color = OmColors.Blue600, textAlign = TextAlign.Center,
            modifier = Modifier.pressable { openUrl(ctx, "https://yor-wallet.vercel.app/") }.padding(8.dp),
        )
    }
}
