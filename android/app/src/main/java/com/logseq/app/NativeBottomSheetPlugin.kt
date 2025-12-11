package com.logseq.app

import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog

@CapacitorPlugin(name = "NativeBottomSheetPlugin")
class NativeBottomSheetPlugin : Plugin() {
    private var dialog: BottomSheetDialog? = null
    private var previousParent: ViewGroup? = null
    private var previousIndex: Int = -1
    private var previousLayoutParams: ViewGroup.LayoutParams? = null
    private var placeholder: View? = null

    @PluginMethod
    fun present(call: PluginCall) {
        val activity = activity ?: run {
            call.reject("No activity")
            return
        }
        val webView = bridge.webView ?: run {
            call.reject("No webview")
            return
        }

        activity.runOnUiThread {
            if (dialog != null) {
                call.resolve()
                return@runOnUiThread
            }

            val ctx = activity
            val container = FrameLayout(ctx)
            container.layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )

            val sheet = BottomSheetDialog(ctx)
            sheet.setContentView(container)

            detachWebView(webView, ctx)
            container.addView(
                webView,
                FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            )

            val behavior = sheet.behavior
            val defaultHeight = call.getInt("defaultHeight", null)
            val allowFullHeight = call.getBoolean("allowFullHeight") ?: true
            if (defaultHeight != null) {
                val peek = NativeUiUtils.dp(ctx, defaultHeight.toFloat())
                behavior.peekHeight = peek
                behavior.state = BottomSheetBehavior.STATE_COLLAPSED
            } else {
                behavior.state = BottomSheetBehavior.STATE_COLLAPSED
            }
            behavior.skipCollapsed = !allowFullHeight

            sheet.setOnDismissListener {
                notifyListeners("state", JSObject().put("dismissing", true))
                restoreWebView(webView)
                notifyListeners(
                    "state",
                    JSObject()
                        .put("presented", false)
                        .put("dismissing", false)
                )
                dialog = null
            }

            notifyListeners("state", JSObject().put("presenting", true))
            sheet.show()
            notifyListeners("state", JSObject().put("presented", true))
            dialog = sheet
            call.resolve()
        }
    }

    @PluginMethod
    fun dismiss(call: PluginCall) {
        activity?.runOnUiThread {
            dialog?.dismiss()
            dialog = null
            call.resolve()
        } ?: call.resolve()
    }

    private fun detachWebView(webView: View, ctx: android.content.Context) {
        val parent = webView.parent as? ViewGroup ?: return
        previousParent = parent
        previousIndex = parent.indexOfChild(webView)
        previousLayoutParams = webView.layoutParams

        parent.removeView(webView)
        placeholder = View(ctx).apply {
            setBackgroundColor(Color.WHITE)
            layoutParams = previousLayoutParams ?: ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        parent.addView(placeholder, previousIndex)
    }

    private fun restoreWebView(webView: View) {
        val parent = previousParent ?: return
        val lp = previousLayoutParams ?: ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
        (webView.parent as? ViewGroup)?.removeView(webView)
        placeholder?.let { parent.removeView(it) }
        placeholder = null

        if (previousIndex in 0..parent.childCount) {
            parent.addView(webView, previousIndex, lp)
        } else {
            parent.addView(webView, lp)
        }

        previousParent = null
        previousLayoutParams = null
        previousIndex = -1
    }
}
