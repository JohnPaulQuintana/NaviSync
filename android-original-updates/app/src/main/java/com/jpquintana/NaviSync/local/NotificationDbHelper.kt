package com.jpquintana.NaviSync.local

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class NotificationDbHelper(context: Context) :
    SQLiteOpenHelper(context, "navisync.db", null, 1) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clientId TEXT UNIQUE,
                userId TEXT,
                deviceId TEXT,
                packageName TEXT,
                title TEXT,
                text TEXT,
                postTime INTEGER,
                isSynced INTEGER DEFAULT 0
            )
        """.trimIndent())
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS notifications")
        onCreate(db)
    }

    fun insert(
        clientId: String,
        userId: String?,
        deviceId: String?,
        packageName: String,
        title: String?,
        text: String?,
        postTime: Long
    ) {
        val db = writableDatabase

        val values = ContentValues().apply {
            put("clientId", clientId)
            put("userId", userId)
            put("deviceId", deviceId)
            put("packageName", packageName)
            put("title", title)
            put("text", text)
            put("postTime", postTime)
            put("isSynced", 0)
        }

        db.insertWithOnConflict(
            "notifications",
            null,
            values,
            SQLiteDatabase.CONFLICT_IGNORE
        )
    }

    fun getUnsynced(limit: Int): Cursor {
        val db = readableDatabase
        return db.rawQuery(
            "SELECT * FROM notifications WHERE isSynced = 0 LIMIT $limit",
            null
        )
    }

// by clientId
    fun markSynced(clientId: String) {
        val values = ContentValues().apply {
            put("isSynced", 1)
        }

        writableDatabase.update(
            "notifications",
            values,
            "clientId=?",
            arrayOf(clientId)
        )
    }

    // by id
    fun markSyncedById(id: Long) {
        val values = ContentValues().apply {
            put("isSynced", 1)
        }

        writableDatabase.update(
            "notifications",
            values,
            "id=?",
            arrayOf(id.toString())
        )
    }

    fun markSyncedBatch(clientIds: List<String>) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            clientIds.forEach { id ->
                db.execSQL(
                    "UPDATE notifications SET isSynced = 1 WHERE clientId = ?",
                    arrayOf(id)
                )
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }
}