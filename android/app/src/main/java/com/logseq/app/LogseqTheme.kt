package com.logseq.app

import android.content.Context
import android.content.res.Configuration
import android.graphics.Color
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class LogseqThemeColors(
  val background: Int,
  val tint: Int,
  val isDark: Boolean,
)

object LogseqTheme {
  private val _colors = MutableStateFlow(compute(isDark = false))
  val colors: StateFlow<LogseqThemeColors> = _colors.asStateFlow()

  fun update(context: Context) {
    _colors.value = compute(context)
  }

  fun current(): LogseqThemeColors = _colors.value

  fun isDark(context: Context): Boolean {
    val mask = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
    return mask == Configuration.UI_MODE_NIGHT_YES
  }

  private fun compute(context: Context): LogseqThemeColors = compute(isDark(context))

  private fun compute(isDark: Boolean): LogseqThemeColors {
    val background =
      if (isDark) Color.parseColor("#002B36") else Color.parseColor("#FCFCFC")
    val tint =
      if (isDark) Color.parseColor("#F5F7FA") else Color.parseColor("#000000")
    return LogseqThemeColors(
      background = background,
      tint = tint,
      isDark = isDark,
    )
  }
}
