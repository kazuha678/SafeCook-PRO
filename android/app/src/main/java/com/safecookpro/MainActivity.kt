package com.safecookpro

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.safecookpro.ui.theme.SafeCookProTheme
import com.safecookpro.ui.dashboard.DashboardScreen
import com.safecookpro.ui.monitoring.LiveMonitoringScreen
import com.safecookpro.ui.alerts.AlertsScreen
import com.safecookpro.ui.analytics.AnalyticsScreen
import com.safecookpro.ui.settings.SettingsScreen
import com.safecookpro.ui.emergency.EmergencyScreen
import com.safecookpro.ui.auth.LoginScreen
import com.safecookpro.ui.onboarding.OnboardingScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SafeCookProTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                val noNavBarRoutes = listOf("splash", "onboarding", "login", "emergency")
                val showBottomBar = currentRoute != null && currentRoute !in noNavBarRoutes

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        if (showBottomBar) {
                            NavigationBar(
                                containerColor = MaterialTheme.colorScheme.surface
                            ) {
                                NavigationBarItem(
                                    selected = currentRoute == "dashboard",
                                    onClick = { navController.navigate("dashboard") { popUpTo("dashboard") { inclusive = false } } },
                                    icon = { Text("🏠") },
                                    label = { Text("Home") }
                                )
                                NavigationBarItem(
                                    selected = currentRoute == "monitoring",
                                    onClick = { navController.navigate("monitoring") },
                                    icon = { Text("📈") },
                                    label = { Text("Monitor") }
                                )
                                NavigationBarItem(
                                    selected = currentRoute == "alerts",
                                    onClick = { navController.navigate("alerts") },
                                    icon = { Text("🔔") },
                                    label = { Text("Alerts") }
                                )
                                NavigationBarItem(
                                    selected = currentRoute == "analytics",
                                    onClick = { navController.navigate("analytics") },
                                    icon = { Text("📊") },
                                    label = { Text("Analytics") }
                                )
                                NavigationBarItem(
                                    selected = currentRoute == "settings",
                                    onClick = { navController.navigate("settings") },
                                    icon = { Text("⚙️") },
                                    label = { Text("Settings") }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "onboarding",
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable("onboarding") {
                            OnboardingScreen(
                                onFinished = { navController.navigate("login") { popUpTo("onboarding") { inclusive = true } } }
                            )
                        }
                        composable("login") {
                            LoginScreen(
                                onLoginSuccess = { navController.navigate("dashboard") { popUpTo("login") { inclusive = true } } }
                            )
                        }
                        composable("dashboard") {
                            DashboardScreen(
                                onNavigateToEmergency = { navController.navigate("emergency") }
                            )
                        }
                        composable("monitoring") {
                            LiveMonitoringScreen()
                        }
                        composable("alerts") {
                            AlertsScreen()
                        }
                        composable("analytics") {
                            AnalyticsScreen()
                        }
                        composable("settings") {
                            SettingsScreen(
                                onLogout = { navController.navigate("login") { popUpTo("dashboard") { inclusive = true } } }
                            )
                        }
                        composable("emergency") {
                            EmergencyScreen(
                                onReset = { navController.popBackStack() }
                            )
                        }
                    }
                }
            }
        }
    }
}
