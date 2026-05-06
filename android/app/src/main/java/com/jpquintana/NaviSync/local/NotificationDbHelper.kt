package com.jpquintana.NaviSync.local

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class NotificationDbHelper(context: Context) :
    SQLiteOpenHelper(context, "navisync.db", null, 2) {

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

    db.execSQL("""
        CREATE TABLE shared_receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientId TEXT UNIQUE,
            userId TEXT,
            deviceId TEXT,
            text TEXT,
            source TEXT,
            postTime INTEGER,
            isSynced INTEGER DEFAULT 0
        )
    """.trimIndent())
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) {

            db.execSQL("""
                CREATE TABLE IF NOT EXISTS shared_receipts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    clientId TEXT UNIQUE,
                    userId TEXT,
                    deviceId TEXT,
                    text TEXT,
                    source TEXT,
                    postTime INTEGER,
                    isSynced INTEGER DEFAULT 0
                )
            """.trimIndent())
        }
    }

 // =========================
    // NOTIFICATIONS (existing)
    // =========================

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

     // =========================
    // SHARED RECEIPTS (NEW)
    // =========================

    fun insertShare(
        clientId: String,
        text: String,
        source: String,
        userId: String?,
        deviceId: String?,
        postTime: Long
    ) {
        val db = writableDatabase

        val values = ContentValues().apply {
            put("clientId", clientId)
            put("userId", userId)
            put("deviceId", deviceId)
            put("text", text)
            put("source", source)
            put("postTime", postTime)
            put("isSynced", 0)
        }

        db.insertWithOnConflict(
            "shared_receipts",
            null,
            values,
            SQLiteDatabase.CONFLICT_IGNORE
        )
    }

    fun getUnsyncedShares(limit: Int): Cursor {
        val db = readableDatabase
        return db.rawQuery(
            "SELECT * FROM shared_receipts WHERE isSynced = 0 ORDER BY postTime DESC LIMIT $limit",
            null
        )
    }

    fun markShareSynced(clientId: String) {
        val values = ContentValues().apply {
            put("isSynced", 1)
        }

        writableDatabase.update(
            "shared_receipts",
            values,
            "clientId=?",
            arrayOf(clientId)
        )
    }

    fun markShareSyncedBatch(clientIds: List<String>) {
        val db = writableDatabase
        db.beginTransaction()
        try {
            clientIds.forEach { id ->
                db.execSQL(
                    "UPDATE shared_receipts SET isSynced = 1 WHERE clientId = ?",
                    arrayOf(id)
                )
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }
}