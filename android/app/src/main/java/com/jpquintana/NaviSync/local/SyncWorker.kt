package com.jpquintana.NaviSync.local

import android.content.Context
import android.util.Log
import androidx.work.*
import com.jpquintana.NaviSync.model.NotificationItem
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class SyncWorker(
    context: Context,
    params: WorkerParameters
) : Worker(context, params) {

    companion object {
        private const val TAG = "NaviSync-WORKER"
        private const val URL = "https://navisync.onrender.com/notification/captured"
        private const val BATCH_SIZE = 25

        fun enqueue(context: Context) {

            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(constraints)
                .setInitialDelay(3, java.util.concurrent.TimeUnit.SECONDS)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    10,
                    java.util.concurrent.TimeUnit.SECONDS
                )
                .build()

            WorkManager.getInstance(context).enqueueUniqueWork(
                "navisync_sync",
                ExistingWorkPolicy.REPLACE,
                request
            )
        }
    }

    private val client = OkHttpClient()

    override fun doWork(): Result {

        val db = NotificationDbHelper(applicationContext)
        val userId = NaviSyncPrefs.getUserId(applicationContext)
        val deviceId = NaviSyncPrefs.getDeviceId(applicationContext)

        if (userId.isNullOrEmpty() || deviceId.isNullOrEmpty()) {
            Log.e(TAG, "Missing user/device id. Cannot sync.")
            return Result.retry()
        }

        try {

            while (true) {

                val cursor = db.getUnsynced(BATCH_SIZE)

                if (cursor.count == 0) {
                    cursor.close()
                    Log.d(TAG, "No unsynced data")
                    break
                }

                val batch = mutableListOf<NotificationItem>()

                while (cursor.moveToNext()) {

                    val item = NotificationItem(
                        clientId = cursor.getString(cursor.getColumnIndexOrThrow("clientId")),
                        userId = cursor.getString(cursor.getColumnIndexOrThrow("userId")),
                        deviceId = cursor.getString(cursor.getColumnIndexOrThrow("deviceId")),
                        app = cursor.getString(cursor.getColumnIndexOrThrow("packageName")),
                        title = cursor.getString(cursor.getColumnIndexOrThrow("title")),
                        text = cursor.getString(cursor.getColumnIndexOrThrow("text")),
                        time = cursor.getLong(cursor.getColumnIndexOrThrow("postTime"))
                    )

                    batch.add(item)

                    // 🔥 DEBUG: per-item log
                    Log.d(TAG, "ITEM → $item")
                }

                cursor.close()

                Log.d(TAG, "==============================")
                Log.d(TAG, "BATCH SIZE: ${batch.size}")

                // 🔥 DEBUG: full payload BEFORE sending
                val debugPayload = batch.map {
                    mapOf(
                        "clientId" to it.clientId,
                        "userId" to it.userId,
                        "deviceId" to it.deviceId,
                        "appPackage" to it.app,
                        "title" to it.title,
                        "text" to it.text,
                        "time" to it.time
                    )
                }

                Log.d(TAG, "PAYLOAD → $debugPayload")
                Log.d(TAG, "==============================")

                val success = sendBatchToServer(batch)

                if (!success) {
                    Log.e(TAG, "Batch failed → will retry next run")
                    continue
                }

                db.markSyncedBatch(batch.map { it.clientId })
            }

            return Result.success()

        } catch (e: Exception) {
            Log.e(TAG, "Worker crash", e)
            return Result.retry()

        } finally {
            db.close()
        }
    }

    private fun sendBatchToServer(batch: List<NotificationItem>): Boolean {

        val jsonArray = org.json.JSONArray()

        batch.forEach {
            val obj = JSONObject().apply {
                put("clientId", it.clientId)
                put("userId", it.userId)
                put("deviceId", it.deviceId)
                put("appPackage", it.app)
                put("title", it.title)
                put("text", it.text)
                put("time", it.time)
            }
            jsonArray.put(obj)
        }

        val body = jsonArray.toString()
            .toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url(URL)
            .post(body)
            .build()

        return try {
            val response = client.newCall(request).execute()
            val success = response.isSuccessful
            response.close()
            success
        } catch (e: IOException) {
            Log.e(TAG, "Batch network error", e)
            false
        }
    }
}