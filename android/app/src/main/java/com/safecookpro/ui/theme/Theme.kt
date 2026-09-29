package com.safecookpro.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/**
 * SafeCook Pro Design Tokens
 *
 * Design language: Calm · Clear · Immediate
 * A consumer kitchen safety application — trustworthy, professional, accessible.
 *
 * Semantic colors:
 *   emerald  → safe / normal state
 *   amber    → warning / attention
 *   crimson  → danger / emergency
 *   cyan     → telemetry / informational
 *   navy     → dark background
 *   charcoal → dark surface
 */
object SafeCookColors {
    // ── Semantic states ──────────────────────────────────────
    val emerald  = Color(0xFF10B981)    // Safe / normal
    val amber    = Color(0xFFF59E0B)    // Warning / attention
    val crimson  = Color(0xFFEF4444)    // Danger / emergency
    val cyan     = Color(0xFF06B6D4)    // Telemetry / info

    // ── Dark surface palette ─────────────────────────────────
    val navy     = Color(0xFF0B1021)    // Base background
    val charcoal = Color(0xFF151B2E)    // Primary surface
    val slate    = Color(0xFF1E2A3E)    // Elevated surface

    // ── Text on dark ─────────────────────────────────────────
    val onDark      = Color(0xFFF1F5F9)
    val onDarkMuted = Color(0xFF94A3B8)

    // ── Light surface palette ────────────────────────────────
    val lightBg      = Color(0xFFF8FAFB)
    val lightSurface = Color.White
    val lightSurfaceVariant = Color(0xFFF1F5F9)

    // ── Text on light ────────────────────────────────────────
    val onLight      = Color(0xFF0F172A)
    val onLightMuted = Color(0xFF475569)
}

// ── Dark color scheme — primary usage ─────────────────────────────────────
private val DarkColorScheme = darkColorScheme(
    primary          = SafeCookColors.emerald,
    secondary        = SafeCookColors.cyan,
    tertiary         = SafeCookColors.amber,
    error            = SafeCookColors.crimson,
    background       = SafeCookColors.navy,
    surface          = SafeCookColors.charcoal,
    surfaceVariant   = SafeCookColors.slate,
    onPrimary        = Color.White,
    onSecondary      = Color.White,
    onTertiary       = Color(0xFF1C1410),
    onError          = Color.White,
    onBackground     = SafeCookColors.onDark,
    onSurface        = SafeCookColors.onDark,
    onSurfaceVariant = SafeCookColors.onDarkMuted,
    outline          = Color(0xFF334155),
    outlineVariant   = Color(0xFF1E293B)
)

// ── Light color scheme — system override ──────────────────────────────────
private val LightColorScheme = lightColorScheme(
    primary          = Color(0xFF059669),
    secondary        = Color(0xFF0891B2),
    tertiary         = SafeCookColors.amber,
    error            = SafeCookColors.crimson,
    background       = SafeCookColors.lightBg,
    surface          = SafeCookColors.lightSurface,
    surfaceVariant   = SafeCookColors.lightSurfaceVariant,
    onPrimary        = Color.White,
    onSecondary      = Color.White,
    onTertiary       = Color(0xFF1C1410),
    onError          = Color.White,
    onBackground     = SafeCookColors.onLight,
    onSurface        = SafeCookColors.onLight,
    onSurfaceVariant = SafeCookColors.onLightMuted,
    outline          = Color(0xFFCBD5E1),
    outlineVariant   = Color(0xFFE2E8F0)
)

@Composable
fun SafeCookProTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
