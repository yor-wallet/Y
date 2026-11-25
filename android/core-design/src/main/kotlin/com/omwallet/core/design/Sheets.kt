package com.omwallet.core.design

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.BottomSheetDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog

/* Glass bottom sheet: handle, title, content. Opens with a soft spatial spring (Material 3), dims the background. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OmSheet(title: String, onDismiss: () -> Unit, dismissible: Boolean = true, content: @Composable ColumnScope.() -> Unit) {
    val state = rememberModalBottomSheetState(skipPartiallyExpanded = true, confirmValueChange = { dismissible })
    ModalBottomSheet(
        onDismissRequest = { if (dismissible) onDismiss() },
        sheetState = state,
        containerColor = OmColors.Sheet,
        scrimColor = Color(0xA6050402),
        shape = RoundedCornerShape(topStart = OmRadius.XL, topEnd = OmRadius.XL),
        dragHandle = { BottomSheetDefaults.DragHandle(color = OmColors.Sky300) },
    ) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp).padding(bottom = 20.dp).navigationBarsPadding(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(title, style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink)
            content()
        }
    }
}

/* Glass dialog: always a title, context and at least one action — never an empty window. */
@Composable
fun OmDialog(title: String, body: String, confirm: String, onConfirm: () -> Unit, dismiss: String? = null, onDismiss: () -> Unit, tone: ChipTone = ChipTone.Neutral) {
    Dialog(onDismissRequest = onDismiss) {
        val reduced = LocalOmMotion.current.reduced
        var shown by remember { mutableStateOf(false) }
        val scale by animateFloatAsState(if (shown || reduced) 1f else 0.94f, OmSprings.spatial(), label = "dlg")
        androidx.compose.runtime.LaunchedEffect(Unit) { shown = true }
        Column(
            Modifier.graphicsLayer { scaleX = scale; scaleY = scale }.clip(RoundedCornerShape(OmRadius.L)).background(OmColors.Sheet)
                .border(1.dp, OmColors.Edge, RoundedCornerShape(OmRadius.L)).padding(22.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp), horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            val dot = when (tone) { ChipTone.Success -> OmColors.Success; ChipTone.Failed -> OmColors.Error; ChipTone.Pending -> OmColors.Warning; ChipTone.Neutral -> OmColors.Blue600 }
            Box(Modifier.size(12.dp).clip(CircleShape).background(dot))
            Text(title, style = MaterialTheme.typography.titleLarge, color = OmColors.Ink, textAlign = TextAlign.Center)
            if (body.isNotBlank()) Text(body, style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary, textAlign = TextAlign.Center)
            OmPrimaryButton(confirm, onClick = onConfirm)
            if (dismiss != null) OmSecondaryButton(dismiss, onClick = onDismiss)
        }
    }
}

/* 6-digit PIN pad. The code is checked by the SERVER (verify_pin → one-time grant); this only collects it. */
@Composable
fun PinPad(title: String, subtitle: String, error: String?, busy: Boolean, onComplete: (String) -> Unit, onCancel: () -> Unit, cancelLabel: String) {
    var code by remember { mutableStateOf("") }
    val haptics = rememberOmHaptics()
    if (error != null && code.length == 6 && !busy) { code = ""; haptics.warn() }
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(title, style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink)
        Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = OmColors.InkSecondary, textAlign = TextAlign.Center)
        /* 15.2.0 — the code dots fill from the left and the digits keep their order (1 2 3 left to right) in Arabic too: a PIN pad is never mirrored */
        androidx.compose.runtime.CompositionLocalProvider(androidx.compose.ui.platform.LocalLayoutDirection provides androidx.compose.ui.unit.LayoutDirection.Ltr) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.semantics { contentDescription = "${code.length} / 6" }) {
                repeat(6) { i -> Box(Modifier.size(14.dp).clip(CircleShape).background(if (i < code.length) OmColors.Blue600 else OmColors.Sky100)) }
            }
        }
        FieldError(error)
        androidx.compose.runtime.CompositionLocalProvider(androidx.compose.ui.platform.LocalLayoutDirection provides androidx.compose.ui.unit.LayoutDirection.Ltr) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
                val keys = listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫")
                keys.chunked(3).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        row.forEach { k ->
                            if (k.isEmpty()) Spacer(Modifier.width(72.dp))
                            else Box(
                                Modifier.width(72.dp).aspectRatio(1.25f).clip(RoundedCornerShape(OmRadius.M)).background(OmColors.GlassStrong)
                                    .border(1.dp, OmColors.Sky100, RoundedCornerShape(OmRadius.M))
                                    .pressable(enabled = !busy) {
                                        if (k == "⌫") code = code.dropLast(1)
                                        else if (code.length < 6) { code += k; if (code.length == 6) onComplete(code) }
                                    }
                                    .semantics { contentDescription = if (k == "⌫") "delete" else k },
                                contentAlignment = Alignment.Center,
                            ) { Text(k, style = MaterialTheme.typography.headlineSmall, color = OmColors.Ink) }
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(4.dp))
        OmSecondaryButton(cancelLabel, enabled = !busy, onClick = onCancel)
    }
}

/* Real-status steps: done / current / to do / failed. The check is written when a step becomes done; the current step breathes (only when motion is allowed). */
enum class StepState { Done, Current, Todo, Failed }
@Composable
fun StatusSteps(steps: List<Pair<String, StepState>>, modifier: Modifier = Modifier) {
    Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        steps.forEach { (label, st) ->
            Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                StepBadge(st)
                Text(label, style = MaterialTheme.typography.labelSmall, color = if (st == StepState.Todo) OmColors.InkSecondary else OmColors.Ink, textAlign = TextAlign.Center)
            }
        }
    }
}
