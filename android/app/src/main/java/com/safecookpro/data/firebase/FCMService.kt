package com.safecookpro.data.firebase

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log

/**
 * FCMService — Firebase Cloud Messaging stub.
 *
 * Currently disabled: the demo build does not include Firebase dependencies or
 * google-services.json. Local safety notifications are handled by MainActivity
 * using the device's NotificationManager instead.
 *
 * ── To enable real FCM push notifications ──────────────────────────────────
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Add the Android app (package: com.safecookpro) and download google-services.json
 *    → place it at:  android/app/google-services.json
 * 3. In build.gradle.kts (project-level): add the google-services classpath
 * 4. In android/app/build.gradle.kts: uncomment the google-services plugin alias
 * 5. In android/app/build.gradle.kts: uncomment the Firebase BOM + messaging deps
 * 6. Replace this class with a real FirebaseMessagingService:
 *      class FCMService : FirebaseMessagingService() {
 *          override fun onNewToken(token: String) { /* send token to your backend */ }
 *          override fun onMessageReceived(msg: RemoteMessage) { /* fire notification */ }
 *      }
 * 7. Update AndroidManifest.xml service declaration if needed.
 * ────────────────────────────────────────────────────────────────────────────
 */
class FCMService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("FCMService", "FCMService stub — Firebase not enabled in this build")
        return START_NOT_STICKY
    }
}
