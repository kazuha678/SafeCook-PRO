package com.safecookpro.ui.monitoring

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.safecookpro.data.model.AppStatus
import com.safecookpro.ui.SafeCookViewModel
import com.safecookpro.ui.components.*
import com.safecookpro.ui.theme.SafeCookColors

/**
 * Refined Live Monitoring Screen
 * Calm · Clear · Immediate
 * Real-time kitchen telemetry, sensor status grids, and detailed hardware feeds.
 */
@Composable
fun LiveMonitoringScreen(
    viewModel: SafeCookViewModel,
    onNavigateToEmergency: (() -> Unit)? = null
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
        // ── Top Title ──────────────────────────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Live Telemetry",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Kitchen Burner Subsystem",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            ConnectionIndicator(
                online = uiState.device.online,
                label = if (uiState.device.online) "Live Sync" else "Offline"
            )
        }

        // ── System State Overview ──────────────────────────────────────────────
        SafetyStatusBadge(
            status = uiState.appStatus,
            subtext = when (uiState.appStatus) {
                AppStatus.SAFE -> "Continuous monitoring active · No gas leakage detected"
                AppStatus.WARNING -> "Auto-shutoff countdown: ${uiState.countdown}s remaining"
                AppStatus.EMERGENCY -> "Hazard active! Check emergency instructions immediately"
            },
            onClick = if (uiState.appStatus == AppStatus.EMERGENCY && onNavigateToEmergency != null) {
                { onNavigateToEmergency() }
            } else null
        )

        Spacer(modifier = Modifier.height(20.dp))

        // ── Primary 2×2 Subsystem Status ───────────────────────────────────────
        SectionHeader(title = "Core Subsystems")

        val gasColor = when {
            uiState.sensor.gasLevelPpm >= 300 -> SafeCookColors.crimson
            uiState.sensor.gasLevelPpm >= 100 -> SafeCookColors.amber
            else -> SafeCookColors.emerald
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatusTile(
                label = "Gas Detection",
                value = "${uiState.sensor.gasLevelPpm} PPM",
                icon = Icons.Default.LocalFireDepartment,
                statusColor = gasColor,
                sublabel = if (uiState.sensor.gasLevelPpm < 100) "Normal" else "Hazard",
                modifier = Modifier.weight(1f)
            )
            StatusTile(
                label = "Vessel Detection",
                value = if (uiState.sensor.vesselPresent) "Vessel On" else "Vessel Off",
                icon = Icons.Default.SoupKitchen,
                statusColor = if (uiState.sensor.vesselPresent) SafeCookColors.emerald else SafeCookColors.amber,
                sublabel = if (uiState.sensor.vesselPresent) "Safe" else "Absent",
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatusTile(
                label = "Solenoid Valve",
                value = if (uiState.sensor.valveOpen) "Open" else "Closed",
                icon = if (uiState.sensor.valveOpen) Icons.Default.LockOpen else Icons.Default.Lock,
                statusColor = if (uiState.sensor.valveOpen) SafeCookColors.emerald else SafeCookColors.amber,
                sublabel = if (uiState.sensor.valveOpen) "Flow active" else "Secured",
                modifier = Modifier.weight(1f)
            )
            StatusTile(
                label = "Burner State",
                value = if (uiState.sensor.burnerActive) "Flame Active" else "Flame Off",
                icon = Icons.Default.Whatshot,
                statusColor = if (uiState.sensor.burnerActive) SafeCookColors.emerald else MaterialTheme.colorScheme.onSurfaceVariant,
                sublabel = if (uiState.sensor.burnerActive) "Monitored" else "Standby",
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ── Real-Time Sensor Metrics ───────────────────────────────────────────
        SectionHeader(
            title = "Hardware Telemetry",
            actionText = "Refresh",
            onActionClick = { viewModel.refreshSensor() }
        )

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Gas PPM detailed with progress bar
            SensorMetricRow(
                label = "Gas Concentration (MQ-2 / MQ-5)",
                value = "${uiState.sensor.gasLevelPpm} PPM",
                icon = Icons.Default.LocalFireDepartment,
                statusText = if (uiState.sensor.gasLevelPpm < 100) "Normal (Threshold: 300 PPM)" else "High Gas Concentration",
                statusColor = gasColor,
                progress = (uiState.sensor.gasLevelPpm.toFloat() / 500f)
            )

            // Temperature / Thermocouple
            SensorMetricRow(
                label = "Surface Thermocouple",
                value = "${String.format("%.1f", uiState.sensor.temperature)} °C",
                icon = Icons.Default.DeviceThermostat,
                statusText = if (uiState.sensor.temperature < 80f) "Operating within safe limits" else "High temperature",
                statusColor = if (uiState.sensor.temperature < 80f) SafeCookColors.emerald else SafeCookColors.amber
            )

            // Cookware Proximity / Ultrasonic
            SensorMetricRow(
                label = "Cookware Proximity Sensor",
                value = if (uiState.sensor.vesselPresent) "Engaged" else "Disengaged",
                icon = Icons.Default.Sensors,
                statusText = if (uiState.sensor.vesselPresent) "Vessel confirmed on burner" else "Burner unattended",
                statusColor = if (uiState.sensor.vesselPresent) SafeCookColors.emerald else SafeCookColors.amber
            )

            // Valve Actuator State
            SensorMetricRow(
                label = "Gas Shutoff Actuator",
                value = if (uiState.sensor.valveOpen) "Open (Gas ON)" else "Closed (Gas OFF)",
                icon = if (uiState.sensor.valveOpen) Icons.Default.CheckCircle else Icons.Default.Lock,
                statusText = if (uiState.sensor.valveOpen) "Ready for auto-shutoff" else "Gas supply cut off",
                statusColor = if (uiState.sensor.valveOpen) SafeCookColors.emerald else SafeCookColors.amber
            )

            // Battery / Power
            SensorMetricRow(
                label = "Internal Backup Power",
                value = "${uiState.sensor.batteryPercent}%",
                icon = Icons.Default.BatteryFull,
                statusText = "Mains power connected · Battery healthy",
                statusColor = if (uiState.sensor.batteryPercent > 20) SafeCookColors.emerald else SafeCookColors.amber,
                progress = (uiState.sensor.batteryPercent.toFloat() / 100f)
            )

            // Wi-Fi Signal
            SensorMetricRow(
                label = "Wi-Fi Connectivity",
                value = "${uiState.device.wifiSignalDbm} dBm",
                icon = Icons.Default.Wifi,
                statusText = "Excellent signal · MQTT connected",
                statusColor = SafeCookColors.cyan
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ── Direct Safety Controls ─────────────────────────────────────────────
        SectionHeader(title = "Immediate Action")

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            PrimaryButton(
                text = "Emergency Shut Valve",
                onClick = { viewModel.shutValve() },
                containerColor = SafeCookColors.crimson,
                icon = Icons.Default.Lock,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}
