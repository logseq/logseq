package com.logseq.app

import android.app.DatePickerDialog
import android.content.Intent
import android.view.View
import android.view.ViewGroup
import android.widget.DatePicker
import android.widget.FrameLayout
import android.widget.Toast
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

@CapacitorPlugin(name = "UILocal")
class UILocal : Plugin() {
  private var toast: Toast? = null
  companion object {
    const val ACTION_ROUTE_CHANGED = "com.logseq.app.ROUTE_DID_CHANGE"
  }

  @PluginMethod
  fun showDatePicker(call: PluginCall) {
    val defaultDate = call.getString("defaultDate")
    val calendar = Calendar.getInstance()

    if (!defaultDate.isNullOrEmpty()) {
      try {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val date = defaultDate?.let { sdf.parse(it) }
        if (date != null) {
          calendar.time = date
        }
      } catch (e: Exception) {
        call.reject("Invalid default date format. Use YYYY-MM-DD", e)
        return
      }
    }

    val year = calendar.get(Calendar.YEAR)
    val month = calendar.get(Calendar.MONTH)
    val day = calendar.get(Calendar.DAY_OF_MONTH)

    // create date picker dialog
    val datePickerDialog = DatePickerDialog(
      activity,
      null,
      year, month, day
    )

    datePickerDialog.datePicker.setOnDateChangedListener { _, selectedYear: Int, selectedMonth: Int, selectedDay: Int ->
      // format selected date
      val selectedDate = Calendar.getInstance().apply {
        set(selectedYear, selectedMonth, selectedDay)
      }

      val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
      val formattedDate = sdf.format(selectedDate.time)

      // return to js
      val res = JSObject()
      res.put("value", formattedDate)
      call.resolve(res)

      // close dialog
      datePickerDialog.dismiss()
    }

    datePickerDialog.setOnShowListener {
      val parent = datePickerDialog.getButton(DatePickerDialog.BUTTON_POSITIVE).parent.parent
      if (parent is ViewGroup) {
        parent.visibility = View.GONE
      }
    }

    if (call.getBoolean("restrictFuture", false) == true) {
      datePickerDialog.datePicker.maxDate = System.currentTimeMillis()
    }

    try {
      datePickerDialog.show()
    } catch (e: Exception) {
      call.reject("Error showing date picker", e)
    }
  }

  @PluginMethod
  fun alert(call: PluginCall) {
    val message = call.getString("title") ?: call.getString("message")
    val duration = if ((call.getDouble("duration") ?: 0.0) > 3.5) Toast.LENGTH_LONG else Toast.LENGTH_SHORT
    val ctx = context ?: run {
      call.reject("No context")
      return
    }
    if (message.isNullOrBlank()) {
      call.reject("title or message is required")
      return
    }
    toast?.cancel()
    toast = Toast.makeText(ctx, message, duration).also { it.show() }
    call.resolve()
  }

  @PluginMethod
  fun hideAlert(call: PluginCall) {
    toast?.cancel()
    toast = null
    call.resolve()
  }

  @PluginMethod
  fun routeDidChange(call: PluginCall) {
    val navigationType = call.getString("navigationType") ?: "push"
    val push = call.getBoolean("push") ?: (navigationType == "push")
    val path = call.getString("path") ?: "/"
    val stack = call.getString("stack") ?: "home"

    // Drive Compose Nav for native animations/back handling.
    ComposeHost.applyNavigation(navigationType, path)

    val ctx = context
    if (ctx != null) {
      val intent = Intent(ACTION_ROUTE_CHANGED).apply {
        putExtra("navigationType", navigationType)
        putExtra("push", push)
        putExtra("stack", stack)
        putExtra("path", path)
      }
      ctx.sendBroadcast(intent)
    }

    call.resolve()
  }

  @PluginMethod
  fun transcribeAudio2Text(call: PluginCall) {
    call.reject("transcription not supported on Android")
  }
}
