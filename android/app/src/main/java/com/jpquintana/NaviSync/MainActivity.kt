package com.jpquintana.NaviSync

import android.content.Intent
import android.util.Log

import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

// 
import com.jpquintana.NaviSync.local.NotificationDbHelper
import com.jpquintana.NaviSync.local.NaviSyncPrefs
import com.jpquintana.NaviSync.work.ShareSyncScheduler

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
    ShareSyncScheduler.start(this) // ONLY HERE
    handleSharedIntent(intent)
    // ShareSyncScheduler.triggerOnce(this) // optional but recommended
  }

override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)

    // ShareSyncScheduler.start(this) // 
    handleSharedIntent(intent)

    ShareSyncScheduler.triggerOnce(this) //

  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }


  // =========================
  // SHARE HANDLER (ONLY THIS)
  // =========================
    private fun handleSharedIntent(intent: Intent?) {

      when (intent?.action) {

          Intent.ACTION_SEND -> {
              intent.getStringExtra(Intent.EXTRA_TEXT)
                  ?.let { saveShare(it) }
          }

          Intent.ACTION_SEND_MULTIPLE -> {
              intent.clipData?.let { clip ->
                  for (i in 0 until clip.itemCount) {

                      val text = clip.getItemAt(i).text?.toString()
                          ?: clip.getItemAt(i).coerceToText(this)?.toString()

                      text?.let { saveShare(it) }
                  }
              }
          }
      }

      intent?.action = null
  }

fun cleanText(input: String): String {
    return input
        .replace(Regex("(?i)\\bmenu\\b"), "")
        .replace(Regex("\\n{3,}"), "\n\n")
        .trim()
}

  // =========================
  // SQLITE SAVE
  // =========================
    private fun saveShare(text: String) {

      val db = NotificationDbHelper(this)

      val userId = NaviSyncPrefs.getUserId(this)
      val deviceId = NaviSyncPrefs.getDeviceId(this)

      val clientId = java.util.UUID.randomUUID().toString()

      val cleanText = cleanText(text)

      db.insertShare(
          clientId = clientId,
          text = cleanText,
          source = "android_share",
          userId = userId,
          deviceId = deviceId,
          postTime = System.currentTimeMillis()
      )

      Log.d("SYNC_WORKER", "SAVED CLEAN: $cleanText")
  }
}
