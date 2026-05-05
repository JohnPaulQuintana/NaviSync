package com.jpquintana.NaviSync

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.jpquintana.NaviSync.local.NaviSyncPrefs

class NaviSyncStorageModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NaviSyncStorage"
    }

    @ReactMethod
    fun saveUserAndDevice(userId: String, deviceId: String) {
        val context = reactApplicationContext

        NaviSyncPrefs.saveUserId(context, userId)
        NaviSyncPrefs.saveDeviceId(context, deviceId)
    }

    @ReactMethod
    fun saveUserId(userId: String) {
        NaviSyncPrefs.saveUserId(reactApplicationContext, userId)
    }

    @ReactMethod
    fun saveDeviceId(deviceId: String) {
        NaviSyncPrefs.saveDeviceId(reactApplicationContext, deviceId)
    }
}