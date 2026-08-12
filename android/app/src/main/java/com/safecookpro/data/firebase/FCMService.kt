package com.safecookpro.data.firebase

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log

// Firebase Messaging Service stubbed for demo build.
// Re-enable by adding Firebase dependencies and google-services.json.
class FCMService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("FCMService", "FCMService stub running (Firebase disabled in demo build)")
        return START_NOT_STICKY
    }
}
