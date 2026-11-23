package com.omwallet.app

import androidx.compose.foundation.Image
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.draw.clip
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.background
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
    val colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Navy, unfocusedBorderColor = Hairline, focusedLabelColor = Navy, unfocusedLabelColor = Muted, cursorColor = Navy, focusedContainerColor = Color.White, unfocusedContainerColor = Color.White)

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

    /* Sober, flat sign-in page: plain white, small logo as a logo only, left-aligned type, hairline fields, one solid action. */
    Column(
        Modifier.fillMaxSize().background(Color.White).statusBarsPadding().imePadding().verticalScroll(rememberScrollState()).padding(horizontal = 28.dp, vertical = 28.dp),
        horizontalAlignment = Alignment.Start,
    ) {
        Image(painterResource(com.omwallet.app.R.drawable.om_logo_horizontal), contentDescription = stringResource(R.string.app_name), modifier = Modifier.width(150.dp))
        Spacer(Modifier.height(64.dp))
        Text(stringResource(R.string.login_title), style = MaterialTheme.typography.headlineMedium, color = Navy)
        Spacer(Modifier.height(8.dp))
        Text(stringResource(R.string.login_sub), style = MaterialTheme.typography.bodyLarge, color = Muted)
        Spacer(Modifier.height(36.dp))
        OutlinedTextField(
            email, { email = it.trim(); error = null }, label = { Text(stringResource(R.string.email)) }, singleLine = true, isError = emailErr != null, modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next), shape = RoundedCornerShape(12.dp), colors = colors,
            textStyle = MaterialTheme.typography.bodyLarge.copy(textDirection = TextDirection.Ltr),
        )
        FieldError(emailErr)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            password, { password = it; error = null }, label = { Text(stringResource(R.string.password)) }, singleLine = true, isError = passErr != null, modifier = Modifier.fillMaxWidth(),
            visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
            keyboardActions = androidx.compose.foundation.text.KeyboardActions(onDone = { submit() }), shape = RoundedCornerShape(12.dp), colors = colors,
        )
        FieldError(passErr ?: error?.let { errorText(it) })
        Spacer(Modifier.height(28.dp))
        SolidButton(stringResource(R.string.login_btn), loading = busy) { submit() }
        Spacer(Modifier.height(40.dp))
        Text(
            stringResource(R.string.login_signup), style = MaterialTheme.typography.bodyMedium, color = Muted, textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().pressable { openUrl(ctx, "https://yor-wallet.vercel.app/") }.padding(vertical = 12.dp),
        )
    }
}

/* Navy is the wordmark colour of the logo; hairline and muted are neutral greys. */
private val Navy = Color(0xFF0D2049)
private val Muted = Color(0xFF5B6878)
private val Hairline = Color(0xFFD3DAE3)

@Composable
private fun SolidButton(text: String, loading: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(12.dp)
    Box(
        Modifier.fillMaxWidth().heightIn(min = 54.dp).clip(shape).background(Navy).pressable(enabled = !loading, onClick = onClick).semantics { if (loading) contentDescription = text },
        contentAlignment = Alignment.Center,
    ) {
        if (loading) CircularProgressIndicator(Modifier.size(22.dp), color = Color.White, strokeWidth = 2.5.dp)
        else Text(text, style = MaterialTheme.typography.labelLarge, color = Color.White, textAlign = TextAlign.Center, modifier = Modifier.padding(horizontal = 16.dp))
    }
}
