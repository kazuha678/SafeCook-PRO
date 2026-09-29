package com.safecookpro.data.model

// ── Top-level application status ───────────────────────────────────────────
enum class AppStatus { SAFE, WARNING, EMERGENCY }

// ── Granular emergency/system state ────────────────────────────────────────
enum class EmergencyState {
    NORMAL,
    VESSEL_REMOVED,
    GAS_WARNING,
    GAS_LEAK_DETECTED,
    VALVE_CLOSING,
    VALVE_CLOSED,
    DEVICE_OFFLINE
}

// ── Hardware/sensor readings ────────────────────────────────────────────────
data class SensorData(
    val gasLevelPpm: Int = 42,
    val temperature: Float = 24.5f,
    val humidity: Int = 55,
    val vesselPresent: Boolean = true,
    val valveOpen: Boolean = true,
    val burnerActive: Boolean = true,
    val leakDetected: Boolean = false,
    val batteryPercent: Int = 87,
    val wifiRssi: Int = -58,
    val updatedAt: Long = System.currentTimeMillis()
)

// ── Device/hardware diagnostic state ───────────────────────────────────────
enum class DeviceStatus { ONLINE, OFFLINE }
enum class SensorComponentStatus { NORMAL, DEGRADED, FAULT }

data class DeviceData(
    val name: String = "Kitchen SafeCook",
    val status: DeviceStatus = DeviceStatus.ONLINE,
    val firmwareVersion: String = "2.4.1",
    val serialId: String = "SCP-0042-AB7F",
    val lastHeartbeat: Long = System.currentTimeMillis(),
    val gasSensorStatus: SensorComponentStatus = SensorComponentStatus.NORMAL,
    val vesselSensorStatus: SensorComponentStatus = SensorComponentStatus.NORMAL,
    val thermocoupleStatus: SensorComponentStatus = SensorComponentStatus.NORMAL,
    val valveActuatorStatus: SensorComponentStatus = SensorComponentStatus.NORMAL,
    val selfTestPassed: Boolean = true,
    val wifiSsid: String = "HomeNetwork"
) {
    val online: Boolean get() = status == DeviceStatus.ONLINE
    val deviceId: String get() = serialId
    val wifiSignalDbm: Int get() = -58
}

// ── Alert / event history ───────────────────────────────────────────────────
enum class AlertType { GAS_LEAK, VESSEL_REMOVED, VALVE_CLOSED, DEVICE_OFFLINE, POWER_FAIL, SYSTEM_OK }
enum class AlertSeverity { CRITICAL, WARNING, INFO }

data class AlertEvent(
    val id: String,
    val type: AlertType,
    val severity: AlertSeverity,
    val title: String,
    val description: String,
    val automatedAction: String? = null,
    val timestamp: Long,
    val acknowledged: Boolean = false
)

// ── Accessibility text scaling ──────────────────────────────────────────────
enum class TextScale(val factor: Float, val label: String) {
    STANDARD(1.0f, "Standard"),
    LARGE(1.2f, "Large 120%"),
    EXTRA_LARGE(1.4f, "Extra Large 140%")
}

// ── Warning test state (persistent, acknowledgement-driven) ───────────────
enum class WarningTestState {
    IDLE,
    ACTIVE,
    ACKNOWLEDGED
}

// ── Root UI state ───────────────────────────────────────────────────────────
// Single source of truth for all composables.
// Production: populated by MQTT/Firebase repositories.
// Demo: populated by SafeCookViewModel demo tick.
data class SafeCookUiState(
    val appStatus: AppStatus = AppStatus.SAFE,
    val emergencyState: EmergencyState = EmergencyState.NORMAL,
    val sensor: SensorData = SensorData(),
    val device: DeviceData = DeviceData(),
    val recentAlerts: List<AlertEvent> = emptyList(),
    val isDemoMode: Boolean = true,
    val alarmSilenced: Boolean = false,
    val countdown: Int = 30,
    val userName: String = "Govind",
    val textScale: TextScale = TextScale.STANDARD,
    val warningTestState: WarningTestState = WarningTestState.IDLE
) {
    val isWarningTestActive: Boolean get() = warningTestState == WarningTestState.ACTIVE
}
