package com.jpquintana.NaviSync.modules

import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*

class NotificationIntentModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NotificationIntent"
    }

    @ReactMethod
    fun openNotificationSettings() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun isNotificationEnabled(promise: Promise) {
        val flat = Settings.Secure.getString(
            reactApplicationContext.contentResolver,
            "enabled_notification_listeners"
        )

        val packageName = reactApplicationContext.packageName
        val enabled = flat?.contains(packageName) == true

        promise.resolve(enabled)
    }
}