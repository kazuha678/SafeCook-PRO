package com.safecookpro.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF22C55E),
    secondary = Color(0xFF3B82F6),
    tertiary = Color(0xFFEA580C),
    background = Color(0xFF0A0F1E),
    surface = Color(0xFF111827),
    error = Color(0xFFEF4444),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFFF9FAFB),
    onSurface = Color(0xFFF9FAFB)
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF22C55E),
    secondary = Color(0xFF3B82F6),
    background = Color(0xFFF0FDF4),
    surface = Color.White,
    error = Color(0xFFEF4444)
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
