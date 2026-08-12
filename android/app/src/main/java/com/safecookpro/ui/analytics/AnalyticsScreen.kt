package com.safecookpro.ui.analytics

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun AnalyticsScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("📊", fontSize = 60.sp)
        Text("Analytics Reports", fontSize = 24.sp, style = MaterialTheme.typography.titleLarge)
        Text("Gas usage logs, safety scores, and cooking analytics diagrams are loaded.", fontSize = 14.sp, modifier = Modifier.padding(top = 12.dp))
    }
}
