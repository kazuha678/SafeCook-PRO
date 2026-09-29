package com.safecookpro.ui.emergency

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.safecookpro.data.model.AppStatus
import com.safecookpro.data.model.EmergencyState
import com.safecookpro.data.model.WarningTestState
import com.safecookpro.ui.SafeCookViewModel
import com.safecookpro.ui.components.PrimaryButton
import com.safecookpro.ui.components.SecondaryButton
import com.safecookpro.ui.theme.SafeCookColors

/**
 * SafeCook Pro Emergency Response Screen
 * Safety-Critical Hierarchy — Calm · Clear · Immediate
 *
 * Hierarchy:
 *   1. WHAT HAPPENED       — large, unambiguous state identification
 *   2. CURRENT STATE       — compact hardware status snapshot
 *   3. WHAT TO DO          — numbered safety protocol, state-conditional
 *   4. AVAILABLE ACTIONS   — only real ViewModel actions
 *
 * All 7 EmergencyState values are handled.
 * No fake hardware behavior. No invented emergency-call integration.
 * Emergency call opens the system dialer (ACTION_DIAL) with 112 pre-filled.
 * All actions route to existing ViewModel methods.
 */
@Composable
fun EmergencyScreen(
    viewModel: SafeCookViewModel,
    onReset: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    val emState = uiState.emergencyState
    val isCritical = emState == EmergencyState.GAS_LEAK_DETECTED ||
            uiState.appStatus == AppStatus.EMERGENCY

    // ── 1. WHAT HAPPENED — state descriptor ──────────────────────────────────
    val stateConfig = when {
        uiState.warningTestState == WarningTestState.ACTIVE -> EmergencyConfig(
            icon = Icons.Default.Warning,
            title = "WARNING TEST ACTIVE",
            description = "This is a simulated safety warning test. It remains active until acknowledged.",
            accentColor = SafeCookColors.amber,
            isCritical = false
        )
        emState == EmergencyState.GAS_LEAK_DETECTED -> EmergencyConfig(
            icon = Icons.Default.Dangerous,
            title = "GAS LEAK DETECTED",
            description = "High concentration of combustible gas detected in the kitchen area.",
            accentColor = SafeCookColors.crimson,
            isCritical = true
        )
        EmergencyState.GAS_WARNING -> EmergencyConfig(
            icon = Icons.Default.Warning,
            title = "GAS LEVEL WARNING",
            description = "Gas readings are rising above the safe baseline. Caution is advised.",
            accentColor = SafeCookColors.amber,
            isCritical = false
        )
        EmergencyState.VESSEL_REMOVED -> EmergencyConfig(
            icon = Icons.Default.SoupKitchen,
            title = "VESSEL REMOVED",
            description = "Cookware was removed from the active burner. Automatic shutoff is in progress.",
            accentColor = SafeCookColors.amber,
            isCritical = false
        )
        EmergencyState.VALVE_CLOSING -> EmergencyConfig(
            icon = Icons.Default.HourglassTop,
            title = "CLOSING GAS VALVE",
            description = "Safety interlock engaged. The solenoid valve is cutting off gas flow now.",
            accentColor = SafeCookColors.amber,
            isCritical = false
        )
        EmergencyState.VALVE_CLOSED -> EmergencyConfig(
            icon = Icons.Default.CheckCircle,
            title = "GAS SUPPLY SECURED",
            description = "Valve closed successfully. Gas flow has been completely stopped.",
            accentColor = SafeCookColors.emerald,
            isCritical = false
        )
        EmergencyState.DEVICE_OFFLINE -> EmergencyConfig(
            icon = Icons.Default.SignalWifiConnectedNoInternet4,
            title = "HARDWARE OFFLINE",
            description = "Loss of telemetry signal from the kitchen sensor node.",
            accentColor = SafeCookColors.amber,
            isCritical = false
        )
        EmergencyState.NORMAL -> EmergencyConfig(
            icon = Icons.Default.CheckCircle,
            title = "SAFETY VERIFIED",
            description = "All kitchen parameters have returned to normal operating range.",
            accentColor = SafeCookColors.emerald,
            isCritical = false
        )
    }

    // ── Protocol steps — state-conditional ───────────────────────────────────
    val protocolSteps: List<String> = when (emState) {
        EmergencyState.GAS_LEAK_DETECTED -> listOf(
            "Do NOT operate electrical switches, appliances, or open flames.",
            "Open all windows and exterior doors for immediate ventilation.",
            "Evacuate the kitchen and keep others away from the area.",
            "Wait for the system to close the valve automatically, or tap Shut Valve below.",
            "Do not re-enter until gas readings return to normal."
        )
        EmergencyState.GAS_WARNING -> listOf(
            "Increase ventilation — open windows or switch on the kitchen exhaust fan.",
            "Do not use open flames or ignition sources.",
            "Monitor the gas reading on the Live Monitor screen.",
            "If the reading continues to rise, evacuate and tap Shut Valve."
        )
        EmergencyState.VESSEL_REMOVED -> listOf(
            "Replace the cookware on the burner to cancel the automatic shutoff countdown.",
            "If you intended to stop cooking, the valve will close automatically in ${uiState.countdown} seconds.",
            "You can manually shut the valve immediately using the control below."
        )
        EmergencyState.VALVE_CLOSING -> listOf(
            "The gas supply is being cut off — remain clear of the stove.",
            "Do not attempt to reopen the valve manually during this process.",
            "Once closed, verify the kitchen is safe before resetting."
        )
        EmergencyState.VALVE_CLOSED -> listOf(
            "The gas supply is secured. Verify the kitchen area is safe.",
            "Check that no gas smell remains before reopening the valve.",
            "When the area is confirmed safe, tap Verify Safety & Reset below."
        )
        EmergencyState.DEVICE_OFFLINE -> listOf(
            "Check the controller power supply and Wi-Fi connection.",
            "The app cannot monitor or control the device while offline.",
            "If the device remains offline, inspect the hardware manually."
        )
        EmergencyState.NORMAL -> listOf(
            "All systems are operating normally.",
            "Continue monitoring the kitchen as usual.",
            "Tap Reset to return to the dashboard."
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                if (isCritical) Color(0xFF200808)
                else MaterialTheme.colorScheme.background
            )
            .verticalScroll(scrollState)
            .padding(horizontal = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(24.dp))

        // ── 1. WHAT HAPPENED ──────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
                .background(stateConfig.accentColor.copy(alpha = 0.18f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = stateConfig.icon,
                contentDescription = stateConfig.title,
                tint = stateConfig.accentColor,
                modifier = Modifier.size(44.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = stateConfig.title,
            style = MaterialTheme.typography.headlineMedium.copy(
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 0.5.sp
            ),
            color = stateConfig.accentColor,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = stateConfig.description,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 8.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        // ── 2. CURRENT HARDWARE STATE ─────────────────────────────────────────
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.SolidColor(
                    if (isCritical) SafeCookColors.crimson.copy(alpha = 0.4f)
                    else MaterialTheme.colorScheme.outlineVariant
                )
            )
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "HARDWARE STATUS",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    ),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(12.dp))

                HardwareStatusRow(
                    label = "Gas Concentration",
                    value = "${uiState.sensor.gasLevelPpm} PPM",
                    valueColor = when {
                        uiState.sensor.gasLevelPpm >= 300 -> SafeCookColors.crimson
                        uiState.sensor.gasLevelPpm >= 100 -> SafeCookColors.amber
                        else -> SafeCookColors.emerald
                    }
                )
                Divider(
                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f),
                    modifier = Modifier.padding(vertical = 8.dp)
                )
                HardwareStatusRow(
                    label = "Gas Valve",
                    value = if (uiState.sensor.valveOpen) "OPEN — Gas ON" else "CLOSED — Gas OFF",
                    valueColor = if (uiState.sensor.valveOpen) SafeCookColors.crimson else SafeCookColors.emerald
                )
                Divider(
                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f),
                    modifier = Modifier.padding(vertical = 8.dp)
                )
                HardwareStatusRow(
                    label = "Cookware Presence",
                    value = if (uiState.sensor.vesselPresent) "Detected on burner" else "Removed",
                    valueColor = if (uiState.sensor.vesselPresent) SafeCookColors.emerald else SafeCookColors.amber
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // ── 3. WHAT TO DO — safety protocol ───────────────────────────────────
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = stateConfig.accentColor.copy(alpha = 0.06f)
            ),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.SolidColor(
                    stateConfig.accentColor.copy(alpha = 0.25f)
                )
            )
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "SAFETY PROTOCOL",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    ),
                    color = stateConfig.accentColor
                )
                Spacer(modifier = Modifier.height(14.dp))

                protocolSteps.forEachIndexed { index, step ->
                    SafetyStepRow(
                        stepNumber = (index + 1).toString(),
                        instruction = step,
                        accentColor = stateConfig.accentColor
                    )
                    if (index < protocolSteps.lastIndex) {
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ── 4. AVAILABLE ACTIONS ──────────────────────────────────────────────
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Emergency call — opens system dialer with 112 pre-filled (ACTION_DIAL, not ACTION_CALL)
            if (isCritical) {
                PrimaryButton(
                    text = "Call Emergency (112)",
                    icon = Icons.Default.Phone,
                    containerColor = SafeCookColors.crimson,
                    onClick = {
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:112"))
                        context.startActivity(intent)
                    }
                )
                Text(
                    text = "Opens the system phone dialer with 112 pre-filled",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(2.dp))
            }

            // Shut valve — only shown when valve is currently open
            if (uiState.sensor.valveOpen) {
                SecondaryButton(
                    text = "Shut Gas Valve",
                    icon = Icons.Default.Lock,
                    onClick = { viewModel.shutValve() }
                )
            }

            // Silence alarm
            SecondaryButton(
                text = if (uiState.alarmSilenced) "Alarm Silenced" else "Silence Alarm",
                icon = Icons.Default.VolumeOff,
                onClick = { viewModel.silenceAlarm() },
                enabled = !uiState.alarmSilenced
            )

            // Acknowledge warning test — prominent when test is active
            if (uiState.warningTestState == WarningTestState.ACTIVE) {
                PrimaryButton(
                    text = "ACKNOWLEDGE WARNING",
                    icon = Icons.Default.CheckCircle,
                    containerColor = SafeCookColors.amber,
                    onClick = {
                        viewModel.acknowledgeWarningTest()
                        onReset()
                    }
                )
            }

            // Verify & reset — always available
            SecondaryButton(
                text = "Verify Safety & Reset",
                icon = Icons.Default.CheckCircle,
                onClick = {
                    viewModel.resetEmergency()
                    onReset()
                }
            )
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

// ── Supporting composables ────────────────────────────────────────────────────

private data class EmergencyConfig(
    val icon: ImageVector,
    val title: String,
    val description: String,
    val accentColor: Color,
    val isCritical: Boolean
)

@Composable
private fun HardwareStatusRow(
    label: String,
    value: String,
    valueColor: Color
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
            color = valueColor
        )
    }
}

@Composable
private fun SafetyStepRow(
    stepNumber: String,
    instruction: String,
    accentColor: Color
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(26.dp)
                .clip(CircleShape)
                .background(accentColor.copy(alpha = 0.18f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = stepNumber,
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                color = accentColor
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = instruction,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(top = 3.dp)
        )
    }
}
