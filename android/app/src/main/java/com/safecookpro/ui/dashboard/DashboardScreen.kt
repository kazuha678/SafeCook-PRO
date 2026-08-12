package com.safecookpro.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

@Composable
fun DashboardScreen(onNavigateToEmergency: () -> Unit) {
    var gasPpm by remember { mutableStateOf(42) }
    var valveOpen by remember { mutableStateOf(true) }
    var vesselPresent by remember { mutableStateOf(true) }
    var batteryPercent by remember { mutableStateOf(87) }

    // Live Simulator Tick matching web prototype
    LaunchedEffect(Unit) {
        while (true) {
            delay(2000)
            gasPpm = (gasPpm + (-5..5).random()).coerceIn(20, 450)
            batteryPercent = (batteryPercent - (0..1).random()).coerceAtLeast(10)
            
            if (gasPpm >= 300) {
                onNavigateToEmergency()
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Good evening, Govind 👋", fontSize = 14.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
                Text("SafeCook Pro", fontSize = 24.sp, fontWeight = FontWeight.Bold)
            }
            Box(
                modifier = Modifier
                    .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(20.dp))
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(8.dp).background(Color.Green, RoundedCornerShape(4.dp)))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Kitchen - Home", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Safety Banner card
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f))
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("✅", fontSize = 32.sp)
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text("All Systems Normal", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text("Your kitchen is safe and monitored", fontSize = 14.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
                }
            }
        }

        Text("Quick Actions", fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 12.dp))
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Button(
                onClick = { valveOpen = false },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
                Text("🔒 Shut Valve")
            }
            Button(
                onClick = { gasPpm = 350 },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
            ) {
                Text("🚨 Test Leak")
            }
            Button(
                onClick = { gasPpm = 42; valveOpen = true; vesselPresent = true },
                colors = ButtonDefaults.buttonColors(containerColor = Color.Gray)
            ) {
                Text("🔄 Reset")
            }
        }

        Text("Sensor Readings", fontSize = 18.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 12.dp))
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.weight(1f)
        ) {
            item {
                SensorGridItem("🔥 Gas Level", "$gasPpm PPM", if (gasPpm < 100) "Safe level" else "Elevated", if (gasPpm < 100) Color.Green else Color.Red)
            }
            item {
                SensorGridItem("🔌 Valve", if (valveOpen) "Open" else "Closed", if (valveOpen) "Gas flowing" else "Gas blocked", if (valveOpen) Color.Green else Color.Red)
            }
            item {
                SensorGridItem("🫕 Vessel", if (vesselPresent) "Present" else "Missing", if (vesselPresent) "On burner" else "Removed", Color.Green)
            }
            item {
                SensorGridItem("🔋 Battery", "$batteryPercent%", "Backup power", Color.Green)
            }
        }
    }
}

@Composable
fun SensorGridItem(label: String, value: String, sub: String, color: Color) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, fontSize = 14.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = color)
            Spacer(modifier = Modifier.height(2.dp))
            Text(sub, fontSize = 12.sp, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f))
        }
    }
}
