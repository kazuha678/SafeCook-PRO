package com.safecookpro.ui.alerts

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.safecookpro.data.model.AlertEvent
import com.safecookpro.data.model.AlertSeverity
import com.safecookpro.ui.SafeCookViewModel
import com.safecookpro.ui.components.TimelineEventItem
import com.safecookpro.ui.theme.SafeCookColors
import java.text.SimpleDateFormat
import java.util.*

/**
 * Refined History / Alerts Screen
 * Calm · Clear · Immediate
 *
 * Events are grouped into date sections: Today · Yesterday · Earlier this week.
 * Within each group a lightweight vertical timeline is used — no heavy cards
 * around every row header.
 *
 * ViewModel state and acknowledgeAlert() are preserved exactly.
 * Filtering chips (All / Critical / Warnings / Info) are preserved.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AlertsScreen(
    viewModel: SafeCookViewModel
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var selectedFilter by remember { mutableStateOf<AlertSeverity?>(null) }

    val filteredAlerts = remember(uiState.recentAlerts, selectedFilter) {
        if (selectedFilter == null) uiState.recentAlerts
        else uiState.recentAlerts.filter { it.severity == selectedFilter }
    }

    // Group events by date bucket
    val grouped: List<Pair<String, List<AlertEvent>>> = remember(filteredAlerts) {
        groupAlertsByDate(filteredAlerts)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // ── Header ─────────────────────────────────────────────────────────────
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)) {
            Text(
                text = "Safety History",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Logged incidents & automated actions",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Filter chips
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedFilter == null,
                    onClick = { selectedFilter = null },
                    label = { Text("All (${uiState.recentAlerts.size})") }
                )
                FilterChip(
                    selected = selectedFilter == AlertSeverity.CRITICAL,
                    onClick = {
                        selectedFilter = if (selectedFilter == AlertSeverity.CRITICAL) null else AlertSeverity.CRITICAL
                    },
                    label = { Text("Critical") }
                )
                FilterChip(
                    selected = selectedFilter == AlertSeverity.WARNING,
                    onClick = {
                        selectedFilter = if (selectedFilter == AlertSeverity.WARNING) null else AlertSeverity.WARNING
                    },
                    label = { Text("Warnings") }
                )
                FilterChip(
                    selected = selectedFilter == AlertSeverity.INFO,
                    onClick = {
                        selectedFilter = if (selectedFilter == AlertSeverity.INFO) null else AlertSeverity.INFO
                    },
                    label = { Text("Info") }
                )
            }
        }

        Divider(color = MaterialTheme.colorScheme.outlineVariant)

        // ── Timeline list ──────────────────────────────────────────────────────
        if (filteredAlerts.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.History,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "No safety events found",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 24.dp)
            ) {
                grouped.forEach { (groupLabel, events) ->
                    // Date group header
                    item(key = "header_$groupLabel") {
                        DateGroupHeader(label = groupLabel)
                    }
                    // Timeline events in this group
                    items(events, key = { it.id }) { event ->
                        TimelineRow(
                            event = event,
                            onAcknowledge = { viewModel.acknowledgeAlert(event.id) }
                        )
                    }
                    // Spacer between groups
                    item(key = "spacer_$groupLabel") {
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

// ── Date group header ─────────────────────────────────────────────────────────

@Composable
private fun DateGroupHeader(label: String) {
    Text(
        text = label,
        style = MaterialTheme.typography.labelMedium.copy(
            fontWeight = FontWeight.SemiBold,
            letterSpacing = androidx.compose.ui.unit.TextUnit.Unspecified
        ),
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 20.dp, vertical = 10.dp)
    )
    Divider(color = MaterialTheme.colorScheme.outlineVariant)
}

// ── Lightweight timeline row ──────────────────────────────────────────────────
// A simpler alternative to the full TimelineEventItem card for the history list.
// Uses TimelineEventItem from AppComponents for full events.

@Composable
private fun TimelineRow(
    event: AlertEvent,
    onAcknowledge: () -> Unit
) {
    val dotColor = when (event.severity) {
        AlertSeverity.CRITICAL -> SafeCookColors.crimson
        AlertSeverity.WARNING -> SafeCookColors.amber
        AlertSeverity.INFO -> SafeCookColors.cyan
    }
    val severityLabel = when (event.severity) {
        AlertSeverity.CRITICAL -> "Critical"
        AlertSeverity.WARNING -> "Warning"
        AlertSeverity.INFO -> "Info"
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 20.dp, end = 16.dp, top = 12.dp, bottom = 4.dp),
        verticalAlignment = Alignment.Top
    ) {
        // Timeline spine + dot
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(20.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .clip(CircleShape)
                    .background(dotColor),
                contentAlignment = Alignment.Center
            ) {}
            // Vertical line below dot (visual connector)
            Box(
                modifier = Modifier
                    .width(1.dp)
                    .height(48.dp)
                    .background(MaterialTheme.colorScheme.outlineVariant)
            )
        }

        Spacer(modifier = Modifier.width(16.dp))

        // Event content
        Column(modifier = Modifier.weight(1f)) {
            // Severity + timestamp row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = severityLabel,
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = dotColor
                )
                Text(
                    text = formatTimestamp(event.timestamp),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(3.dp))

            // Title
            Text(
                text = event.title,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(2.dp))

            // Description
            Text(
                text = event.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            // Automated action / resolution
            if (event.automatedAction != null) {
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(SafeCookColors.emerald)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = event.automatedAction,
                        style = MaterialTheme.typography.labelSmall,
                        color = SafeCookColors.emerald
                    )
                }
            }

            // Acknowledge action
            if (!event.acknowledged) {
                Spacer(modifier = Modifier.height(6.dp))
                TextButton(
                    onClick = onAcknowledge,
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Text(
                        text = "Mark as acknowledged",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
        }
    }
}

// ── Date grouping helpers ─────────────────────────────────────────────────────

private fun groupAlertsByDate(events: List<AlertEvent>): List<Pair<String, List<AlertEvent>>> {
    if (events.isEmpty()) return emptyList()

    val cal = Calendar.getInstance()
    val todayMidnight = cal.apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.timeInMillis
    val yesterdayMidnight = todayMidnight - 86_400_000L
    val weekStartMidnight = todayMidnight - 7 * 86_400_000L

    val today = mutableListOf<AlertEvent>()
    val yesterday = mutableListOf<AlertEvent>()
    val earlier = mutableListOf<AlertEvent>()
    val older = mutableListOf<AlertEvent>()

    events.sortedByDescending { it.timestamp }.forEach { event ->
        when {
            event.timestamp >= todayMidnight -> today.add(event)
            event.timestamp >= yesterdayMidnight -> yesterday.add(event)
            event.timestamp >= weekStartMidnight -> earlier.add(event)
            else -> older.add(event)
        }
    }

    return buildList {
        if (today.isNotEmpty()) add("Today" to today)
        if (yesterday.isNotEmpty()) add("Yesterday" to yesterday)
        if (earlier.isNotEmpty()) add("Earlier this week" to earlier)
        if (older.isNotEmpty()) add("Older" to older)
    }
}

private fun formatTimestamp(timestamp: Long): String {
    val sdf = SimpleDateFormat("hh:mm a", Locale.getDefault())
    return sdf.format(Date(timestamp))
}
