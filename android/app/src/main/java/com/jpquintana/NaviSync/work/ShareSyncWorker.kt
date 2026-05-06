package com.jpquintana.NaviSync.work

import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.jpquintana.NaviSync.local.NotificationDbHelper
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class ShareSyncWorker(
    context: Context,
    params: WorkerParameters
) : Worker(context, params) {

    override fun doWork(): Result {

        val db = NotificationDbHelper(applicationContext)
        val syncedIds = mutableListOf<String>()

        return try {

            val cursor = db.getUnsyncedShares(50)

            cursor.use { c ->

                while (c.moveToNext()) {

                    val userId = c.getString(c.getColumnIndexOrThrow("userId"))
                    val deviceId = c.getString(c.getColumnIndexOrThrow("deviceId"))
                    val clientId = c.getString(c.getColumnIndexOrThrow("clientId"))
                    val text = c.getString(c.getColumnIndexOrThrow("text"))
                    val source = c.getString(c.getColumnIndexOrThrow("source"))
                    val time = c.getLong(c.getColumnIndexOrThrow("postTime"))

                    Log.d("SYNC_WORKER", "Sending: $clientId")

                    val success = sendToServer(
                        text,
                        source,
                        time,
                        userId,
                        deviceId
                    )

                    if (success) {
                        syncedIds.add(clientId)
                    }
                }
            }

            if (syncedIds.isNotEmpty()) {
                db.markShareSyncedBatch(syncedIds)
            }

            Log.d("SYNC_WORKER", "Synced: ${syncedIds.size}")

            Result.success()

        } catch (e: Exception) {
            Log.e("SYNC_WORKER", "FAILED: ${e.message}")
            Result.retry() // 🔥 retry on timeout / offline
        }
    }

    private fun sendToServer(
        text: String,
        source: String,
        time: Long,
        userId: String?,
        deviceId: String?
    ): Boolean {

        try {

            val url = URL("https://navisync.onrender.com/share/captured")

            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")

            // 🔥 IMPORTANT TIMEOUT FIX
            conn.connectTimeout = 15000
            conn.readTimeout = 15000

            conn.doOutput = true

            val json = JSONObject().apply {
                put("text", text)
                put("source", source)
                put("time", time)
                put("userId", userId)
                put("deviceId", deviceId)
            }

            conn.outputStream.use { os ->
                os.write(json.toString().toByteArray())
            }

            val responseCode = conn.responseCode

            Log.d("SYNC_WORKER", "response=$responseCode")

            if (responseCode in 200..299) {
                return true
            } else {
                throw Exception("HTTP $responseCode")
            }

        } catch (e: Exception) {
            Log.e("SYNC_WORKER", "API ERROR: ${e.message}")
            throw e // 🔥 force retry
        }
    }
}