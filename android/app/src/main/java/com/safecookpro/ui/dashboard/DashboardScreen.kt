package com.safecookpro.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.safecookpro.R
import com.safecookpro.data.RecipeRepository
import com.safecookpro.data.model.AppStatus
import com.safecookpro.data.model.RecipeCategory
import com.safecookpro.data.model.WarningTestState
import com.safecookpro.ui.SafeCookViewModel
import com.safecookpro.ui.components.*
import com.safecookpro.ui.theme.SafeCookColors
import kotlinx.coroutines.delay

/**
 * Refined SafeCook Pro Dashboard
 * Calm · Clear · Immediate
 *
 * Consumes SafeCookViewModel's StateFlow.
 * Replaces all emoji with accessible Material Icons.
 */
@Composable
fun DashboardScreen(
    viewModel: SafeCookViewModel,
    onNavigateToEmergency: () -> Unit,
    onNavigateToHistory: (() -> Unit)? = null,
    onNavigateToMonitor: (() -> Unit)? = null,
    onNavigateToRecipes: (() -> Unit)? = null
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    // Auto-navigate to Emergency screen if an actual hazard occurs
    LaunchedEffect(uiState.appStatus) {
        if (uiState.appStatus == AppStatus.EMERGENCY) {
            onNavigateToEmergency()
        }
    }

    // Auto-dismiss the "Warning Acknowledged" confirmation after a brief delay to return to IDLE
    LaunchedEffect(uiState.warningTestState) {
        if (uiState.warningTestState == WarningTestState.ACKNOWLEDGED) {
            delay(3500L)
            viewModel.dismissWarningTestConfirmation()
        }
    }

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
                .padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Welcome Back",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "SafeCook Pro",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            ConnectionIndicator(
                online = uiState.device.online,
                label = if (uiState.device.online) "Kitchen · Online" else "Kitchen · Offline"
            )
        }

        // ── Primary Safety Anchor ──────────────────────────────────────────────
        SafetyStatusBadge(
            status = uiState.appStatus,
            onClick = {
                if (uiState.appStatus == AppStatus.EMERGENCY) {
                    onNavigateToEmergency()
                } else if (onNavigateToMonitor != null) {
                    onNavigateToMonitor()
                }
            }
        )

        // ── Warning / Emergency Prompt Strip ──────────────────────────────────
        if (uiState.warningTestState == WarningTestState.ACTIVE) {
            Spacer(modifier = Modifier.height(12.dp))
            WarningTestActiveCard(
                onAcknowledge = { viewModel.acknowledgeWarningTest() }
            )
        } else if (uiState.warningTestState == WarningTestState.ACKNOWLEDGED) {
            Spacer(modifier = Modifier.height(12.dp))
            WarningTestAcknowledgedCard(
                onDismiss = { viewModel.dismissWarningTestConfirmation() }
            )
        } else if (uiState.appStatus == AppStatus.WARNING) {
            Spacer(modifier = Modifier.height(12.dp))
            EmergencyBanner(
                title = "Vessel Removed (${uiState.countdown}s)",
                message = "Burner active without vessel. Valve will close automatically.",
                actionLabel = "VIEW",
                onAction = onNavigateToEmergency
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // ── Kitchen Status (2×2 Grid) ──────────────────────────────────────────
        SectionHeader(
            title = "Kitchen Status",
            actionText = if (onNavigateToMonitor != null) "Full Telemetry →" else null,
            onActionClick = onNavigateToMonitor
        )

        val gasColor = when {
            uiState.sensor.gasLevelPpm >= 300 -> SafeCookColors.crimson
            uiState.sensor.gasLevelPpm >= 100 -> SafeCookColors.amber
            else -> SafeCookColors.emerald
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // 1. GAS
            StatusTile(
                label = "Gas Concentration",
                value = "${uiState.sensor.gasLevelPpm} PPM",
                icon = Icons.Default.LocalFireDepartment,
                statusColor = gasColor,
                sublabel = if (uiState.sensor.gasLevelPpm < 100) "Normal level" else "Elevated",
                modifier = Modifier.weight(1f),
                onClick = onNavigateToMonitor
            )
            // 2. VESSEL
            StatusTile(
                label = "Cookware Vessel",
                value = if (uiState.sensor.vesselPresent) "Present" else "Absent",
                icon = Icons.Default.SoupKitchen,
                statusColor = if (uiState.sensor.vesselPresent) SafeCookColors.emerald else SafeCookColors.amber,
                sublabel = if (uiState.sensor.vesselPresent) "On burner" else "Removed",
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // 3. BURNER
            StatusTile(
                label = "Burner State",
                value = if (uiState.sensor.burnerActive) "Flame Active" else "Flame Off",
                icon = Icons.Default.Whatshot,
                statusColor = if (uiState.sensor.burnerActive) SafeCookColors.emerald else MaterialTheme.colorScheme.onSurfaceVariant,
                sublabel = if (uiState.sensor.burnerActive) "Monitored" else "Standby",
                modifier = Modifier.weight(1f)
            )
            // 4. VALVE
            StatusTile(
                label = "Gas Valve",
                value = if (uiState.sensor.valveOpen) "Open" else "Closed",
                icon = if (uiState.sensor.valveOpen) Icons.Default.LockOpen else Icons.Default.Lock,
                statusColor = if (uiState.sensor.valveOpen) SafeCookColors.emerald else SafeCookColors.amber,
                sublabel = if (uiState.sensor.valveOpen) "Gas flowing" else "Safety shutoff",
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // ── Secondary Telemetry (Temperature & Battery) ──────────────────────
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outlineVariant)
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Surface Temperature
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.DeviceThermostat,
                        contentDescription = "Temperature",
                        tint = SafeCookColors.cyan,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "Surface Temp",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${String.format("%.1f", uiState.sensor.temperature)} °C",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }

                Divider(
                    modifier = Modifier.width(1.dp).height(28.dp),
                    color = MaterialTheme.colorScheme.outlineVariant
                )

                // Backup Battery
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.BatteryChargingFull,
                        contentDescription = "Battery",
                        tint = if (uiState.sensor.batteryPercent > 20) SafeCookColors.emerald else SafeCookColors.amber,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = "Backup Battery",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${uiState.sensor.batteryPercent}% (Mains Active)",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ── Safety Quick Actions ───────────────────────────────────────────────
        SectionHeader(title = "Safety Controls")

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Button(
                onClick = { viewModel.shutValve() },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = SafeCookColors.crimson),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Shut Valve", style = MaterialTheme.typography.labelMedium)
            }

            Button(
                onClick = { viewModel.startWarningTest() },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (uiState.warningTestState == WarningTestState.ACTIVE) SafeCookColors.amber.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surfaceVariant
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.NotificationImportant,
                    contentDescription = null,
                    tint = SafeCookColors.amber,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Test Alert", color = MaterialTheme.colorScheme.onSurface, style = MaterialTheme.typography.labelMedium)
            }

            OutlinedButton(
                onClick = { viewModel.resetEmergency() },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Reset", style = MaterialTheme.typography.labelMedium)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ── Recent Activity / History Preview ──────────────────────────────────
        SectionHeader(
            title = "Recent Activity",
            actionText = if (onNavigateToHistory != null) "View All →" else null,
            onActionClick = onNavigateToHistory
        )

        if (uiState.recentAlerts.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No recent safety incidents",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                uiState.recentAlerts.take(2).forEach { event ->
                    TimelineEventItem(event = event)
                }
            }
        }

        // ── Today's Special Supporting Section ────────────────────────────────
        if (onNavigateToRecipes != null) {
            Spacer(modifier = Modifier.height(24.dp))
            SectionHeader(
                title = stringResource(R.string.todays_special),
                actionText = stringResource(R.string.view_recipe) + " →",
                onActionClick = onNavigateToRecipes
            )
            val todayRecipe = remember { RecipeRepository.todaysSpecial(RecipeCategory.VEG) }
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigateToRecipes() },
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = CardDefaults.outlinedCardBorder().copy(
                    brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outlineVariant)
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = todayRecipe.name,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${todayRecipe.prepMinutes} min prep · ${todayRecipe.cookMinutes} min cook",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    TextButton(
                        onClick = onNavigateToRecipes,
                        modifier = Modifier.heightIn(min = 48.dp)
                    ) {
                        Text(
                            text = stringResource(R.string.view_recipe),
                            color = SafeCookColors.emerald,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun WarningTestActiveCard(
    onAcknowledge: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SafeCookColors.amber.copy(alpha = 0.12f)),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(SafeCookColors.amber)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = "Warning",
                    tint = SafeCookColors.amber,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = stringResource(R.string.warning_test_active),
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = stringResource(R.string.warning_test_simulated),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Button(
                onClick = onAcknowledge,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = SafeCookColors.amber,
                    contentColor = Color.Black
                )
            ) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.warning_test_acknowledge),
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold)
                )
            }
        }
    }
}

@Composable
private fun WarningTestAcknowledgedCard(
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SafeCookColors.emerald.copy(alpha = 0.12f)),
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(SafeCookColors.emerald)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = "Confirmed",
                tint = SafeCookColors.emerald,
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = stringResource(R.string.warning_test_acknowledged),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = SafeCookColors.emerald
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = stringResource(R.string.warning_test_completed),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.heightIn(min = 48.dp)
            ) {
                Text("OK", fontWeight = FontWeight.Bold, color = SafeCookColors.emerald)
            }
        }
    }
}
