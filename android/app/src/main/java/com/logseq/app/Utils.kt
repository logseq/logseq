package com.logseq.app

import androidx.appcompat.app.AppCompatDelegate
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "Utils")
class Utils : Plugin() {
  @PluginMethod
  fun setInterfaceStyle(call: PluginCall) {
    val mode = (call.getString("mode") ?: "system").lowercase()
    val system = call.getBoolean("system") ?: (mode == "system")

    val nightMode =
      if (system || mode == "system") {
        AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
      } else if (mode == "dark") {
        AppCompatDelegate.MODE_NIGHT_YES
      } else {
        AppCompatDelegate.MODE_NIGHT_NO
      }

    val activity = activity
    if (activity == null) {
      call.reject("No activity")
      return
    }

    activity.runOnUiThread {
      AppCompatDelegate.setDefaultNightMode(nightMode)
      (activity as? MainActivity)?.applyLogseqThemeNow()
      call.resolve()
    }
  }
}

