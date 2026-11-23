package com.omwallet.app

import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.Brush
import com.omwallet.core.design.riseIn
import com.omwallet.core.design.OmIcon
import com.omwallet.core.design.OmPrimaryButton
import com.omwallet.core.design.OmColors
import com.omwallet.core.design.GlassCard
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
    val colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OmColors.Blue600, unfocusedBorderColor = OmColors.Edge, focusedContainerColor = Color(0x2EFFFFFF), unfocusedContainerColor = Color(0x1AFFFFFF), cursorColor = OmColors.Blue600, focusedLeadingIconColor = OmColors.Blue600)

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

    /* Sign-in from the owner's reference: the glass app icon, the word mark, « Welcome back », one glass card (e-mail and password with
       their icons, « Forgot your password? », the gradient button), then the sign-up link. */
    Column(
        Modifier.fillMaxSize().statusBarsPadding().imePadding().verticalScroll(rememberScrollState()).padding(horizontal = 22.dp, vertical = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Image(painterResource(com.omwallet.app.R.drawable.app_icon_glass), contentDescription = stringResource(R.string.app_name),
            modifier = Modifier.padding(top = 18.dp).size(168.dp).riseIn(0).clip(RoundedCornerShape(percent = 26)))
        Text("OM Wallet", style = MaterialTheme.typography.displaySmall.copy(brush = Brush.verticalGradient(listOf(Color(0xFFFFFFFF), Color(0xFFA6E1FF)))), modifier = Modifier.riseIn(1))
        Spacer(Modifier.height(18.dp))
        Text(stringResource(R.string.login_title), style = MaterialTheme.typography.headlineMedium, color = OmColors.Ink, textAlign = TextAlign.Center, modifier = Modifier.riseIn(2))
        Spacer(Modifier.height(6.dp))
        Text(stringResource(R.string.login_sub), style = MaterialTheme.typography.bodyLarge, color = OmColors.InkSecondary, textAlign = TextAlign.Center, modifier = Modifier.riseIn(2))
        Spacer(Modifier.height(24.dp))
        GlassCard(Modifier.fillMaxWidth(), strong = true, padding = 18.dp, rise = 3) {
            OutlinedTextField(
                email, { email = it.trim(); error = null }, placeholder = { Text(stringResource(R.string.email)) }, singleLine = true, isError = emailErr != null, modifier = Modifier.fillMaxWidth(),
                leadingIcon = { OmIcon(com.omwallet.core.design.OmIcons.Mail, null, tint = OmColors.InkSecondary) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next), shape = RoundedCornerShape(18.dp), colors = colors,
                textStyle = MaterialTheme.typography.bodyLarge.copy(textDirection = TextDirection.Ltr),
            )
            FieldError(emailErr)
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                password, { password = it; error = null }, placeholder = { Text(stringResource(R.string.password)) }, singleLine = true, isError = passErr != null, modifier = Modifier.fillMaxWidth(),
                leadingIcon = { OmIcon(com.omwallet.core.design.OmIcons.Lock, null, tint = OmColors.InkSecondary) },
                visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                keyboardActions = androidx.compose.foundation.text.KeyboardActions(onDone = { submit() }), shape = RoundedCornerShape(18.dp), colors = colors,
            )
            FieldError(passErr ?: error?.let { errorText(it) })
            Text(
                stringResource(R.string.login_forgot), style = MaterialTheme.typography.titleMedium, color = OmColors.Blue600,
                modifier = Modifier.padding(top = 10.dp).pressable { openUrl(ctx, "https://yor-wallet.vercel.app/") }.padding(vertical = 6.dp),
            )
            Spacer(Modifier.height(14.dp))
            OmPrimaryButton(stringResource(R.string.login_btn), loading = busy) { submit() }
        }
        Spacer(Modifier.height(20.dp))
        Text(
            stringResource(R.string.login_signup), style = MaterialTheme.typography.titleSmall, color = OmColors.Blue600, textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().pressable { openUrl(ctx, "https://yor-wallet.vercel.app/") }.padding(vertical = 12.dp),
        )
    }
}

