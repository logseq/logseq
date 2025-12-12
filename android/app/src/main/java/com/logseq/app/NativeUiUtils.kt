package com.logseq.app

import android.app.Activity
import android.content.Context
import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout

object NativeUiUtils {
    fun dp(context: Context, value: Float): Int =
        (value * context.resources.displayMetrics.density).toInt()

    fun parseColor(hex: String?, defaultColor: Int): Int {
        if (hex.isNullOrBlank()) return defaultColor
        return try {
            Color.parseColor(hex)
        } catch (_: IllegalArgumentException) {
            defaultColor
        }
    }

    fun contentRoot(activity: Activity): FrameLayout =
        activity.findViewById(android.R.id.content)

    fun detachView(view: View?): ViewGroup? {
        val parent = view?.parent as? ViewGroup ?: return null
        parent.removeView(view)
        return parent
    }
}
