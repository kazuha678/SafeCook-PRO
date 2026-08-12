package com.safecookpro.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SettingsScreen(onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("⚙️", fontSize = 60.sp)
        Text("App Settings", fontSize = 24.sp, style = MaterialTheme.typography.titleLarge)
        
        Button(onClick = {}, modifier = Modifier.fillMaxWidth()) {
            Text("🌐 Languages (English, தமிழ், हिंदी)")
        }
        
        Button(onClick = {}, modifier = Modifier.fillMaxWidth()) {
            Text("♿ Accessibility (Large fonts, high contrast)")
        }

        Button(onClick = {}, modifier = Modifier.fillMaxWidth()) {
            Text("🚨 Emergency Contacts")
        }

        Button(
            onClick = onLogout,
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("🚪 Log Out")
        }
    }
}
