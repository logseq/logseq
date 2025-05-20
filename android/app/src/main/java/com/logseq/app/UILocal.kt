package com.logseq.app

import android.app.AlertDialog
import android.app.DatePickerDialog
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.widget.DatePicker
import android.widget.FrameLayout
import androidx.annotation.RequiresApi
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

  @RequiresApi(Build.VERSION_CODES.O)
  @PluginMethod
  fun showDatePicker(call: PluginCall) {
    val defaultDate = call.getString("defaultDate")
    val calendar = Calendar.getInstance()

    if (defaultDate.isNullOrEmpty()) {
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
}