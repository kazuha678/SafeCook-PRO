package com.safecookpro.ui.settings

import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.os.LocaleListCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.safecookpro.data.model.TextScale
import com.safecookpro.ui.SafeCookViewModel
import com.safecookpro.ui.components.PrimaryButton
import com.safecookpro.ui.components.SectionHeader
import com.safecookpro.ui.theme.SafeCookColors

/**
 * Refined Settings Screen
 * Calm · Clear · Immediate
 * Accessibility preferences, notifications, language settings, and emergency contacts.
 */
@Composable
fun SettingsScreen(
    viewModel: SafeCookViewModel,
    onLogout: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val scrollState = rememberScrollState()

    var highContrast by remember { mutableStateOf(false) }
    var voiceGuidance by remember { mutableStateOf(true) }
    var pushNotifications by remember { mutableStateOf(true) }
    var hapticFeedback by remember { mutableStateOf(true) }

    // Read the currently active locale from AppCompatDelegate so the picker
    // always reflects the real system locale — even after activity recreation.
    val currentTag = remember {
        AppCompatDelegate.getApplicationLocales().get(0)?.toLanguageTag() ?: "en"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(scrollState)
            .padding(horizontal = 16.dp, vertical = 16.dp)
    ) {
        // ── Header ─────────────────────────────────────────────────────────────
        Text(
            text = "Settings",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = "Safety parameters & accessibility",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(20.dp))

        // ── Accessibility & Display ────────────────────────────────────────────
        SectionHeader(title = "Accessibility & Display")

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outlineVariant)
            )
        ) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                SettingToggleRow(
                    title = "High Contrast Mode",
                    subtitle = "Enhance contrast for emergency alerts",
                    icon = Icons.Default.Contrast,
                    checked = highContrast,
                    onCheckedChange = { highContrast = it }
                )
                Divider(color = MaterialTheme.colorScheme.outlineVariant)
                SettingToggleRow(
                    title = "Haptic Vibration Alerts",
                    subtitle = "Vibrate phone during safety warnings",
                    icon = Icons.Default.Vibration,
                    checked = hapticFeedback,
                    onCheckedChange = { hapticFeedback = it }
                )
                Divider(color = MaterialTheme.colorScheme.outlineVariant)
                
                // Text Size scaling
                Column(modifier = Modifier.padding(vertical = 12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.FormatSize,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.secondary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(14.dp))
                        Column {
                            Text(
                                text = "Text Scaling",
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Adjust typography scale for all screens",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        TextScale.values().forEach { scale ->
                            val isSelected = uiState.textScale == scale
                            OutlinedButton(
                                onClick = { viewModel.setTextScale(scale) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surface
                                ),
                                border = androidx.compose.foundation.BorderStroke(
                                    1.dp,
                                    if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant
                                ),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    text = scale.label,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal),
                                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // ── Safety Notifications ───────────────────────────────────────────────
        SectionHeader(title = "Safety Notifications")

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outlineVariant)
            )
        ) {
            Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                SettingToggleRow(
                    title = "Instant Push Alerts",
                    subtitle = "Receive notifications when gas or vessel issues occur",
                    icon = Icons.Default.NotificationsActive,
                    checked = pushNotifications,
                    onCheckedChange = { pushNotifications = it }
                )
                Divider(color = MaterialTheme.colorScheme.outlineVariant)
                SettingToggleRow(
                    title = "Spoken Voice Guidance",
                    subtitle = "Audio instructions in regional language during leaks",
                    icon = Icons.Default.RecordVoiceOver,
                    checked = voiceGuidance,
                    onCheckedChange = { voiceGuidance = it }
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // ── Language & Regional ────────────────────────────────────────────────
        SectionHeader(title = "Language / மொழி / भाषा")

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outlineVariant)
            )
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // Each entry: display label → BCP-47 tag
                val languages = listOf(
                    "English"           to "en",
                    "தமிழ் (Tamil)"     to "ta",
                    "हिंदी (Hindi)"     to "hi",
                    "తెలుగు (Telugu)"   to "te",
                    "ಕನ್ನಡ (Kannada)"   to "kn",
                    "മലയാളം (Malayalam)" to "ml"
                )
                languages.chunked(2).forEach { rowLangs ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        rowLangs.forEach { (label, tag) ->
                            val isSelected = currentTag.startsWith(tag)
                            OutlinedButton(
                                onClick = {
                                    // Sets the app-level locale; AppCompat triggers
                                    // an automatic activity recreation so all
                                    // stringResource() calls update immediately.
                                    AppCompatDelegate.setApplicationLocales(
                                        LocaleListCompat.forLanguageTags(tag)
                                    )
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(vertical = 4.dp),
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surface
                                ),
                                border = androidx.compose.foundation.BorderStroke(
                                    1.dp,
                                    if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant
                                )
                            ) {
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // ── Emergency Contact ──────────────────────────────────────────────────
        SectionHeader(title = "Emergency Contact")

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.outlineVariant)
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.ContactPhone,
                        contentDescription = null,
                        tint = SafeCookColors.crimson,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Emergency Dial Target",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "National Emergency (112)",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Text(
                    text = "Configured",
                    style = MaterialTheme.typography.labelSmall,
                    color = SafeCookColors.emerald
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ── App & Hardware Info ────────────────────────────────────────────────
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "SafeCook Pro Android v1.0.0",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Hardware Target: SafeCook Controller (ESP32-WROOM-32)",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Licensed under Apache 2.0 · Privacy First Safety Architecture",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // ── Logout ─────────────────────────────────────────────────────────────
        PrimaryButton(
            text = "Log Out of Controller",
            icon = Icons.Default.Logout,
            containerColor = SafeCookColors.crimson,
            onClick = {
                viewModel.logout()
                onLogout()
            }
        )

        Spacer(modifier = Modifier.height(20.dp))
    }
}

@Composable
private fun SettingToggleRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(14.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}
