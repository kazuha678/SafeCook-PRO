package com.safecookpro.ui.monitoring

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun LiveMonitoringScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("📈", fontSize = 60.sp)
        Text("Live Sensor Feeds", fontSize = 24.sp, style = MaterialTheme.typography.titleLarge)
        Text("Visual charts, graphs, and hardware calibration diagnostics stats are loading.", fontSize = 14.sp, modifier = Modifier.padding(top = 12.dp))
    }
}
