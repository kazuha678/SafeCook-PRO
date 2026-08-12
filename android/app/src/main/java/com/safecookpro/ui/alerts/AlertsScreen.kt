package com.safecookpro.ui.alerts

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun AlertsScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("🔔", fontSize = 60.sp)
        Text("Alerts Timeline", fontSize = 24.sp, style = MaterialTheme.typography.titleLarge)
        Text("No alerts — your kitchen is safe and monitored.", fontSize = 14.sp, modifier = Modifier.padding(top = 12.dp))
    }
}
