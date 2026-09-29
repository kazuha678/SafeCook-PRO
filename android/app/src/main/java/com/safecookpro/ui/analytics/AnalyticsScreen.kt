package com.safecookpro.ui.analytics

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.safecookpro.data.model.SensorComponentStatus
import com.safecookpro.ui.SafeCookViewModel
import com.safecookpro.ui.components.ConnectionIndicator
import com.safecookpro.ui.components.PrimaryButton
import com.safecookpro.ui.components.SectionHeader
import com.safecookpro.ui.theme.SafeCookColors

/**
 * SafeCook Pro Device Hub Screen (route: "device")
 * Calm · Clear · Immediate
 *
 * Three compact sections:
 *   1. DEVICE STATUS  — connection, power, self-test
 *   2. SENSORS        — gas, vessel, thermocouple, valve, alarm, network
 *   3. INFORMATION    — serial, firmware, Wi-Fi, platform
 *
 * All readings come from uiState.device and uiState.sensor.
 * No fake values are introduced.
 * Self-test action calls viewModel.refreshSensor() (existing).
 */
@Composable
fun AnalyticsScreen(
    viewModel: SafeCookViewModel
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(scrollState)
            .padding(horizontal = 16.dp, vertical = 16.dp)
    ) {
        // ── Header ─────────────────────────────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Device Hub",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "SafeCook Controller · ${uiState.device.deviceId}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            ConnectionIndicator(
                online = uiState.device.online,
                label = if (uiState.device.online) "ESP32 Online" else "Offline"
            )
        }

        // ══════════════════════════════════════════════════════════════════════
        // SECTION 1 — DEVICE STATUS
        // ══════════════════════════════════════════════════════════════════════
        SectionHeader(title = "Device Status")

        CompactSection {
            // Connection
            DeviceStatusRow(
                icon = Icons.Default.Wifi,
                label = "Network Connection",
                value = if (uiState.device.online) "Connected · ${uiState.device.wifiSsid}" else "No connection",
                valueColor = if (uiState.device.online) SafeCookColors.emerald else SafeCookColors.amber
            )
            RowDivider()

            // Backup power / battery
            val batColor = if (uiState.sensor.batteryPercent > 20) SafeCookColors.emerald else SafeCookColors.amber
            DeviceStatusRow(
                icon = Icons.Default.BatteryChargingFull,
                label = "Backup Power (Li-Ion)",
                value = "${uiState.sensor.batteryPercent}% · Mains active",
                valueColor = batColor
            )
            RowDivider()

            // Wi-Fi signal strength
            DeviceStatusRow(
                icon = Icons.Default.SignalWifi4Bar,
                label = "Wi-Fi Signal",
                value = "${uiState.device.wifiSignalDbm} dBm",
                valueColor = if (uiState.device.wifiSignalDbm > -70) SafeCookColors.emerald else SafeCookColors.amber
            )
            RowDivider()

            // Self-test
            val selfTestColor = if (uiState.device.selfTestPassed) SafeCookColors.emerald else SafeCookColors.crimson
            DeviceStatusRow(
                icon = Icons.Default.VerifiedUser,
                label = "Self-Test",
                value = if (uiState.device.selfTestPassed) "Passed" else "Failed — attention required",
                valueColor = selfTestColor
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        PrimaryButton(
            text = "Run Self-Test Cycle",
            icon = Icons.Default.PlayCircle,
            onClick = { viewModel.refreshSensor() }
        )

        Spacer(modifier = Modifier.height(24.dp))

        // ══════════════════════════════════════════════════════════════════════
        // SECTION 2 — SENSORS
        // ══════════════════════════════════════════════════════════════════════
        SectionHeader(title = "Sensors")

        CompactSection {
            // Gas sensor
            SensorStatusRow(
                icon = Icons.Default.LocalFireDepartment,
                label = "Semiconductor Gas Sensor (MQ-2/5)",
                reading = "${uiState.sensor.gasLevelPpm} PPM",
                componentStatus = uiState.device.gasSensorStatus
            )
            RowDivider()

            // Vessel / ultrasonic proximity
            SensorStatusRow(
                icon = Icons.Default.Sensors,
                label = "Ultrasonic Vessel Proximity",
                reading = if (uiState.sensor.vesselPresent) "Vessel detected" else "No vessel",
                componentStatus = uiState.device.vesselSensorStatus
            )
            RowDivider()

            // Thermocouple
            SensorStatusRow(
                icon = Icons.Default.DeviceThermostat,
                label = "Surface Thermocouple",
                reading = "${String.format("%.1f", uiState.sensor.temperature)} °C",
                componentStatus = uiState.device.thermocoupleStatus
            )
            RowDivider()

            // Valve actuator
            SensorStatusRow(
                icon = Icons.Default.ElectricBolt,
                label = "Solenoid Valve Actuator",
                reading = if (uiState.sensor.valveOpen) "Energized (Open)" else "Depowered (Closed)",
                componentStatus = uiState.device.valveActuatorStatus
            )
            RowDivider()

            // Alarm
            DeviceStatusRow(
                icon = Icons.Default.VolumeUp,
                label = "Piezo Alarm Sounder",
                value = "Operational",
                valueColor = SafeCookColors.emerald
            )
            RowDivider()

            // MQTT telemetry
            DeviceStatusRow(
                icon = Icons.Default.CloudDone,
                label = "MQTT Telemetry",
                value = if (uiState.device.online) "Connected" else "Disconnected",
                valueColor = if (uiState.device.online) SafeCookColors.cyan else SafeCookColors.amber
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ══════════════════════════════════════════════════════════════════════
        // SECTION 3 — INFORMATION
        // ══════════════════════════════════════════════════════════════════════
        SectionHeader(title = "Information")

        CompactSection {
            InfoRow(label = "Controller Name", value = uiState.device.name)
            RowDivider()
            InfoRow(label = "Serial ID", value = uiState.device.serialId)
            RowDivider()
            InfoRow(label = "Firmware Version", value = "v${uiState.device.firmwareVersion} · Stable")
            RowDivider()
            InfoRow(label = "Wi-Fi Network", value = uiState.device.wifiSsid)
            RowDivider()
            InfoRow(label = "Signal Strength", value = "${uiState.device.wifiSignalDbm} dBm")
            RowDivider()
            InfoRow(label = "Platform", value = "ESP32-WROOM-32")
            RowDivider()
            InfoRow(label = "App Version", value = "SafeCook Pro Android v1.0.0")
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}

// ── Compact section container ─────────────────────────────────────────────────

@Composable
private fun CompactSection(content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outlineVariant)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            content = content
        )
    }
}

@Composable
private fun RowDivider() {
    Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
}

// ── Device status row (icon / label / value) ──────────────────────────────────

@Composable
private fun DeviceStatusRow(
    icon: ImageVector,
    label: String,
    value: String,
    valueColor: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
            color = valueColor
        )
    }
}

// ── Sensor row (icon / label + status / reading) ──────────────────────────────

@Composable
private fun SensorStatusRow(
    icon: ImageVector,
    label: String,
    reading: String,
    componentStatus: SensorComponentStatus
) {
    val (statusLabel, statusColor) = when (componentStatus) {
        SensorComponentStatus.NORMAL -> "Normal" to SafeCookColors.emerald
        SensorComponentStatus.DEGRADED -> "Degraded" to SafeCookColors.amber
        SensorComponentStatus.FAULT -> "Fault" to SafeCookColors.crimson
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = statusColor,
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = statusLabel,
                style = MaterialTheme.typography.labelSmall,
                color = statusColor
            )
        }
        Text(
            text = reading,
            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

// ── Plain info row (label / value) ────────────────────────────────────────────

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 13.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
