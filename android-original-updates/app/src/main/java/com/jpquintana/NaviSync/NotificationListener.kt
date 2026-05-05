package com.jpquintana.NaviSync

import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.jpquintana.NaviSync.local.NotificationDbHelper
import com.jpquintana.NaviSync.local.SyncWorker
import com.jpquintana.NaviSync.local.NaviSyncPrefs

class NotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "NaviSync-LISTENER"
    }

    private fun extractNotificationText(extras: Bundle): String {

        val text = extras.getCharSequence("android.text")?.toString()?.trim()
        if (!text.isNullOrEmpty()) return text

        val bigText = extras.getCharSequence("android.bigText")?.toString()?.trim()
        if (!bigText.isNullOrEmpty()) return bigText

        val lines = extras.getCharSequenceArray("android.textLines")
        if (!lines.isNullOrEmpty()) {
            return lines.joinToString("\n") { it.toString() }.trim()
        }

        return ""
    }

    private fun extractNotificationTitle(extras: Bundle): String {
        return extras.getCharSequence("android.title")
            ?.toString()
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
            ?: ""
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {

        try {
            Log.d(TAG, "Notification from: ${sbn.packageName}")

            val extras = sbn.notification.extras

            val title = extractNotificationTitle(extras)
            val text = extractNotificationText(extras)

            val packageName = sbn.packageName
            val postTime = sbn.postTime

            // =====================
            // Identity layer
            // =====================
            val userId = NaviSyncPrefs.getUserId(this)
            val deviceId = NaviSyncPrefs.getDeviceId(this)

            val clientId = "$packageName-$postTime-$title"

            Log.d(TAG, "userId=$userId deviceId=$deviceId")

            val db = NotificationDbHelper(this)

            db.insert(
                clientId = clientId,
                userId = userId,
                deviceId = deviceId,
                packageName = packageName,
                title = title,
                text = text,
                postTime = postTime
            )

            Log.d(TAG, "Saved to SQLite (clientId=$clientId)")

            SyncWorker.enqueue(this)

        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification", e)
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "Notification Listener CONNECTED")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d(TAG, "Notification Listener DISCONNECTED")
    }
}