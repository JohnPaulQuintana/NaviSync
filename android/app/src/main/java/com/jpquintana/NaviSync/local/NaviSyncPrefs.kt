package com.jpquintana.NaviSync.local

import android.content.Context
import android.content.SharedPreferences

object NaviSyncPrefs {

    private const val PREF = "navisync_prefs"

    private fun prefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREF, Context.MODE_PRIVATE)
    }

    // =====================
    // USER ID
    // =====================
    fun saveUserId(context: Context, userId: String) {
        prefs(context).edit()
            .putString("userId", userId)
            .apply()
    }

    fun getUserId(context: Context): String? {
        return prefs(context).getString("userId", null)
    }

    // =====================
    // DEVICE ID
    // =====================
    fun saveDeviceId(context: Context, deviceId: String) {
        prefs(context).edit()
            .putString("deviceId", deviceId)
            .apply()
    }

    fun getDeviceId(context: Context): String? {
        return prefs(context).getString("deviceId", null)
    }

    // =====================
    // CLEAR (optional for logout/reset)
    // =====================
    fun clear(context: Context) {
        prefs(context).edit().clear().apply()
    }
}