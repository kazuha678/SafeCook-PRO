package com.safecookpro

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.safecookpro.data.model.AppStatus
import com.safecookpro.ui.SafeCookViewModel
import com.safecookpro.ui.alerts.AlertsScreen
import com.safecookpro.ui.analytics.AnalyticsScreen
import com.safecookpro.ui.auth.LoginScreen
import com.safecookpro.ui.dashboard.DashboardScreen
import com.safecookpro.ui.emergency.EmergencyScreen
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.safecookpro.ui.monitoring.LiveMonitoringScreen
import com.safecookpro.ui.onboarding.OnboardingScreen
import com.safecookpro.ui.recipes.RecipesScreen
import com.safecookpro.ui.settings.SettingsScreen
import com.safecookpro.ui.theme.SafeCookProTheme
import kotlinx.coroutines.launch

// ── Notification constants ──────────────────────────────────────────────────
private const val CHANNEL_ID            = "safecook_safety_alerts"
private const val CHANNEL_NAME          = "Safety Alerts"
private const val NOTIF_ID_EMERGENCY    = 1001
private const val NOTIF_ID_WARNING      = 1002

class MainActivity : AppCompatActivity() {

    // Runtime permission launcher for POST_NOTIFICATIONS (Android 13+)
    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* Permission result handled silently; notifications fire if granted */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        createNotificationChannel()
        requestNotificationPermissionIfNeeded()

        // Shared ViewModel — obtained before setContent so the notification
        // coroutine can hold a reference across the full Activity lifecycle.
        val sharedViewModel = androidx.lifecycle.ViewModelProvider(this)[SafeCookViewModel::class.java]

        // ── Status-transition notification collector ─────────────────────────
        // Lives on lifecycleScope (not Composition) so it survives locale-
        // triggered activity recreations without duplicating subscriptions.
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                sharedViewModel.statusTransitions.collect { status ->
                    when (status) {
                        AppStatus.EMERGENCY -> fireNotification(
                            id     = NOTIF_ID_EMERGENCY,
                            title  = "\uD83D\uDEA8 GAS LEAK DETECTED",
                            body   = "Leave the area immediately. Valve is being closed.",
                            urgent = true
                        )
                        AppStatus.WARNING -> fireNotification(
                            id     = NOTIF_ID_WARNING,
                            title  = "\u26A0\uFE0F Vessel Removed",
                            body   = "Cookware removed while gas is flowing. Valve closing in 30s.",
                            urgent = false
                        )
                        AppStatus.SAFE -> {
                            // Clear any outstanding alert notifications
                            NotificationManagerCompat.from(this@MainActivity).apply {
                                cancel(NOTIF_ID_EMERGENCY)
                                cancel(NOTIF_ID_WARNING)
                            }
                        }
                    }
                }
            }
        }

        setContent {
            // Re-obtain the same ViewModel instance inside Composition
            val composeViewModel: SafeCookViewModel = viewModel()
            val uiState by composeViewModel.uiState.collectAsStateWithLifecycle()
            val currentDensity = LocalDensity.current
            val customDensity = remember(currentDensity, uiState.textScale) {
                Density(
                    density   = currentDensity.density,
                    fontScale = currentDensity.fontScale * uiState.textScale.factor
                )
            }

            CompositionLocalProvider(LocalDensity provides customDensity) {
                SafeCookProTheme {
                    val navController = rememberNavController()
                    val navBackStackEntry by navController.currentBackStackEntryAsState()
                    val currentRoute = navBackStackEntry?.destination?.route

                    val noNavBarRoutes = listOf("splash", "onboarding", "login", "emergency")
                    val showBottomBar  = currentRoute != null && currentRoute !in noNavBarRoutes

                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        bottomBar = {
                            if (showBottomBar) {
                                NavigationBar(
                                    containerColor = MaterialTheme.colorScheme.surface
                                ) {
                                    NavigationBarItem(
                                        selected = currentRoute == "dashboard",
                                        onClick = {
                                            navController.navigate("dashboard") {
                                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        },
                                        icon  = { Icon(Icons.Default.Home, contentDescription = "Home") },
                                        label = { Text("Home") }
                                    )
                                    NavigationBarItem(
                                        selected = currentRoute == "monitoring",
                                        onClick = {
                                            navController.navigate("monitoring") {
                                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        },
                                        icon  = { Icon(Icons.Default.ShowChart, contentDescription = "Monitor") },
                                        label = { Text("Monitor") }
                                    )
                                    NavigationBarItem(
                                        selected = currentRoute == "history",
                                        onClick = {
                                            navController.navigate("history") {
                                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        },
                                        icon  = { Icon(Icons.Default.History, contentDescription = "History") },
                                        label = { Text("History") }
                                    )
                                    NavigationBarItem(
                                        selected = currentRoute == "recipes",
                                        onClick = {
                                            navController.navigate("recipes") {
                                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        },
                                        icon  = { Icon(Icons.Default.RestaurantMenu, contentDescription = stringResource(R.string.nav_recipes)) },
                                        label = { Text(stringResource(R.string.nav_recipes)) }
                                    )
                                    NavigationBarItem(
                                        selected = currentRoute == "device",
                                        onClick = {
                                            navController.navigate("device") {
                                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        },
                                        icon  = { Icon(Icons.Default.Memory, contentDescription = "Device") },
                                        label = { Text("Device") }
                                    )
                                    NavigationBarItem(
                                        selected = currentRoute == "settings",
                                        onClick = {
                                            navController.navigate("settings") {
                                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        },
                                        icon  = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                                        label = { Text("Settings") }
                                    )
                                }
                            }
                        }
                    ) { innerPadding ->
                        NavHost(
                            navController    = navController,
                            startDestination = "onboarding",
                            modifier         = Modifier.padding(innerPadding)
                        ) {
                            composable("onboarding") {
                                OnboardingScreen(
                                    onFinished = {
                                        navController.navigate("login") {
                                            popUpTo("onboarding") { inclusive = true }
                                        }
                                    }
                                )
                            }
                            composable("login") {
                                LoginScreen(
                                    onLoginSuccess = {
                                        navController.navigate("dashboard") {
                                            popUpTo("login") { inclusive = true }
                                        }
                                    }
                                )
                            }
                            composable("dashboard") {
                                DashboardScreen(
                                    viewModel             = composeViewModel,
                                    onNavigateToEmergency = { navController.navigate("emergency") },
                                    onNavigateToHistory   = { navController.navigate("history") },
                                    onNavigateToMonitor   = { navController.navigate("monitoring") },
                                    onNavigateToRecipes   = { navController.navigate("recipes") }
                                )
                            }
                            composable("monitoring") {
                                LiveMonitoringScreen(
                                    viewModel             = composeViewModel,
                                    onNavigateToEmergency = { navController.navigate("emergency") }
                                )
                            }
                            composable("history") {
                                AlertsScreen(viewModel = composeViewModel)
                            }
                            composable("recipes") {
                                RecipesScreen()
                            }
                            composable("device") {
                                AnalyticsScreen(viewModel = composeViewModel)
                            }
                            composable("settings") {
                                SettingsScreen(
                                    viewModel = composeViewModel,
                                    onLogout  = {
                                        navController.navigate("login") {
                                            popUpTo("dashboard") { inclusive = true }
                                        }
                                    }
                                )
                            }
                            composable("emergency") {
                                EmergencyScreen(
                                    viewModel = composeViewModel,
                                    onReset   = { navController.popBackStack() }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // ── Notification helpers ────────────────────────────────────────────────

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "SafeCook Pro safety and gas-leak alerts"
            enableVibration(true)
            enableLights(true)
        }
        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .createNotificationChannel(channel)
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private fun fireNotification(id: Int, title: String, body: String, urgent: Boolean) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) return

        val tapIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, id, tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(if (urgent) NotificationCompat.PRIORITY_MAX else NotificationCompat.PRIORITY_HIGH)
            .setCategory(if (urgent) NotificationCompat.CATEGORY_ALARM else NotificationCompat.CATEGORY_STATUS)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        NotificationManagerCompat.from(this).notify(id, notification)
    }
}
