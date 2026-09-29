package com.safecookpro.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.safecookpro.data.model.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * SafeCookViewModel — single ViewModel for the entire app.
 *
 * Demo mode: runs a tick coroutine that simulates sensor fluctuation,
 *            preserving the original dashboard simulator behavior.
 *
 * Production: replace demo tick with real data sources
 *             (MQTT subscription / Firebase Firestore listener).
 *             The composables do NOT need to change — they consume uiState.
 *
 * Design rule: all UI actions (shutValve, silenceAlarm, etc.) are methods here.
 * Production implementations will call real repositories; demo implementations
 * update the in-memory state directly.
 */
class SafeCookViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(
        SafeCookUiState(
            isDemoMode = true,
            recentAlerts = buildDemoAlerts()
        )
    )
    val uiState: StateFlow<SafeCookUiState> = _uiState.asStateFlow()

    // Emits whenever appStatus transitions to a new value.
    // MainActivity collects this to fire local push notifications.
    private val _statusTransitions = MutableSharedFlow<AppStatus>(extraBufferCapacity = 1)
    val statusTransitions: SharedFlow<AppStatus> = _statusTransitions.asSharedFlow()

    private var demoTickJob: Job? = null

    init {
        if (_uiState.value.isDemoMode) startDemoTick()
        // Production: init { connectMqtt(); subscribeFirestore() }
    }

    // ── Demo simulation ────────────────────────────────────────────────────
    // Replicates the original LaunchedEffect/random tick from DashboardScreen.
    // Isolated here so composables are tick-free and testable.
    private fun startDemoTick() {
        demoTickJob = viewModelScope.launch {
            while (true) {
                delay(2000L)
                _uiState.update { state ->
                    if (!state.isDemoMode) return@update state

                    // If a warning test is active, it must NOT be ended automatically by the demo tick.
                    // Keep the warning state active indefinitely until explicit user acknowledgement.
                    if (state.warningTestState == WarningTestState.ACTIVE) {
                        return@update state.copy(
                            sensor = state.sensor.copy(
                                updatedAt = System.currentTimeMillis()
                            )
                        )
                    }

                    val currentGas = state.sensor.gasLevelPpm
                    val newGas = (currentGas + (-5..5).random()).coerceIn(20, 450)
                    val newBat = (state.sensor.batteryPercent - (0..1).random()).coerceAtLeast(10)

                    val newAppStatus = when {
                        newGas >= 300 -> AppStatus.EMERGENCY
                        !state.sensor.vesselPresent && state.sensor.valveOpen -> AppStatus.WARNING
                        else -> AppStatus.SAFE
                    }

                    // Emit status transition if the status actually changed
                    if (newAppStatus != state.appStatus) {
                        _statusTransitions.tryEmit(newAppStatus)
                    }

                    val newEmState = when {
                        newGas >= 300 -> EmergencyState.GAS_LEAK_DETECTED
                        !state.sensor.vesselPresent && state.sensor.valveOpen -> EmergencyState.VESSEL_REMOVED
                        !state.sensor.valveOpen -> EmergencyState.VALVE_CLOSED
                        else -> EmergencyState.NORMAL
                    }

                    val newCountdown = if (newAppStatus == AppStatus.WARNING) {
                        (state.countdown - 1).coerceAtLeast(0)
                    } else 30

                    state.copy(
                        sensor = state.sensor.copy(
                            gasLevelPpm = newGas,
                            batteryPercent = newBat,
                            updatedAt = System.currentTimeMillis()
                        ),
                        appStatus = newAppStatus,
                        emergencyState = newEmState,
                        countdown = newCountdown
                    )
                }
            }
        }
    }

    // ── Safety actions ─────────────────────────────────────────────────────

    /** Close the gas valve. Production: send MQTT command. */
    fun shutValve() {
        _uiState.update { state ->
            state.copy(
                sensor = state.sensor.copy(valveOpen = false, burnerActive = false),
                emergencyState = EmergencyState.VALVE_CLOSED,
                appStatus = AppStatus.SAFE
            )
        }
    }

    /** Reset after safety inspection. Production: call repository clearEmergency(). */
    fun resetEmergency() {
        _uiState.update { state ->
            state.copy(
                appStatus = AppStatus.SAFE,
                emergencyState = EmergencyState.NORMAL,
                warningTestState = WarningTestState.IDLE,
                alarmSilenced = false,
                sensor = state.sensor.copy(
                    gasLevelPpm = 42,
                    valveOpen = true,
                    vesselPresent = true,
                    burnerActive = true,
                    leakDetected = false
                ),
                countdown = 30
            )
        }
    }

    /** Silence the audible alarm. Production: call FCM/local notification API. */
    fun silenceAlarm() {
        _uiState.update { it.copy(alarmSilenced = true) }
    }

    /** Acknowledge a history alert. Production: update Firestore document. */
    fun acknowledgeAlert(id: String) {
        _uiState.update { state ->
            state.copy(
                recentAlerts = state.recentAlerts.map { alert ->
                    if (alert.id == id) alert.copy(acknowledged = true) else alert
                }
            )
        }
    }

    /**
     * Start warning test.
     * State is set to ACTIVE and remains active indefinitely until user acknowledges.
     * Does NOT automatically reset after 2 seconds.
     */
    fun startWarningTest() {
        _uiState.update { state ->
            state.copy(
                warningTestState = WarningTestState.ACTIVE,
                appStatus = AppStatus.WARNING,
                emergencyState = EmergencyState.GAS_WARNING,
                alarmSilenced = false,
                sensor = state.sensor.copy(gasLevelPpm = 230)
            )
        }
        _statusTransitions.tryEmit(AppStatus.WARNING)
    }

    /**
     * Acknowledge the active warning test.
     * Stops the alarm/visual warning, sets warningTestState to ACKNOWLEDGED,
     * resets safety status back to SAFE, and enables brief confirmation.
     */
    fun acknowledgeWarningTest() {
        _uiState.update { state ->
            state.copy(
                warningTestState = WarningTestState.ACKNOWLEDGED,
                appStatus = AppStatus.SAFE,
                emergencyState = EmergencyState.NORMAL,
                alarmSilenced = true,
                sensor = state.sensor.copy(gasLevelPpm = 42)
            )
        }
        _statusTransitions.tryEmit(AppStatus.SAFE)
    }

    /** Reset warning test state from ACKNOWLEDGED back to IDLE. */
    fun dismissWarningTestConfirmation() {
        _uiState.update { state ->
            if (state.warningTestState == WarningTestState.ACKNOWLEDGED) {
                state.copy(warningTestState = WarningTestState.IDLE)
            } else {
                state
            }
        }
    }

    /** Test alarm cycle (calls startWarningTest for persistent acknowledgement-driven flow). */
    fun testAlarm() {
        startWarningTest()
    }

    /** Request fresh sensor poll. Production: publish MQTT refresh command. */
    fun refreshSensor() {
        // Production: mqttRepository.publishRefresh()
        // Demo: tick handles updates automatically
        _uiState.update { state ->
            state.copy(
                sensor = state.sensor.copy(updatedAt = System.currentTimeMillis())
            )
        }
    }

    /** Update text scaling preference across all screens. */
    fun setTextScale(scale: TextScale) {
        _uiState.update { it.copy(textScale = scale) }
    }

    /** Clear auth session and reset to initial state. */
    fun logout() {
        demoTickJob?.cancel()
        _uiState.value = SafeCookUiState(isDemoMode = true, recentAlerts = buildDemoAlerts())
        startDemoTick()
    }

    override fun onCleared() {
        super.onCleared()
        demoTickJob?.cancel()
    }

    // ── Demo data ──────────────────────────────────────────────────────────
    companion object {
        private fun buildDemoAlerts(): List<AlertEvent> {
            val now = System.currentTimeMillis()
            val oneHour = 3_600_000L
            val oneDay = 86_400_000L
            return listOf(
                AlertEvent(
                    id = "a1",
                    type = AlertType.VESSEL_REMOVED,
                    severity = AlertSeverity.WARNING,
                    title = "Vessel Removed",
                    description = "Pot removed from burner while gas was flowing.",
                    automatedAction = "Valve auto-closed after 30s",
                    timestamp = now - oneHour,
                    acknowledged = true
                ),
                AlertEvent(
                    id = "a2",
                    type = AlertType.SYSTEM_OK,
                    severity = AlertSeverity.INFO,
                    title = "System Check Passed",
                    description = "All sensors operating normally. Self-test complete.",
                    automatedAction = null,
                    timestamp = now - 2 * oneHour,
                    acknowledged = true
                ),
                AlertEvent(
                    id = "a3",
                    type = AlertType.GAS_LEAK,
                    severity = AlertSeverity.CRITICAL,
                    title = "Gas Level Elevated",
                    description = "Gas concentration reached 280 PPM.",
                    automatedAction = "Valve closed · Alert sent to family",
                    timestamp = now - oneDay,
                    acknowledged = false
                ),
                AlertEvent(
                    id = "a4",
                    type = AlertType.VALVE_CLOSED,
                    severity = AlertSeverity.INFO,
                    title = "Valve Closed — Safety",
                    description = "Gas valve shut after vessel was absent for 30 seconds.",
                    automatedAction = "Valve closed automatically",
                    timestamp = now - 2 * oneDay,
                    acknowledged = true
                )
            )
        }
    }
}
