package com.jpquintana.NaviSync.work

import android.content.Context
import androidx.work.*

import java.util.concurrent.TimeUnit

object ShareSyncScheduler {

    fun start(context: Context) {

        val request = PeriodicWorkRequestBuilder<ShareSyncWorker>(
            15, TimeUnit.MINUTES
        )
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(
                "share_sync",
                ExistingPeriodicWorkPolicy.REPLACE,
                request
            )
    }

    fun triggerOnce(context: Context) {

        val request = OneTimeWorkRequestBuilder<ShareSyncWorker>()
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        WorkManager.getInstance(context)
            .enqueueUniqueWork(
                "share_sync_once",
                ExistingWorkPolicy.KEEP,
                request
            )
    }

}