package com.logseq.app

import android.graphics.Color
import android.os.Handler
import android.os.Looper
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
    private val snapshotTag = "bottom-sheet"
    private val mainHandler = Handler(Looper.getMainLooper())
    private var dialog: BottomSheetDialog? = null
    private var previousParent: ViewGroup? = null
    private var previousIndex: Int = -1
    private var previousLayoutParams: ViewGroup.LayoutParams? = null
    private var placeholder: View? = null
    private var container: FrameLayout? = null

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
            WebViewSnapshotManager.registerWindow(activity.window)
            if (dialog != null) {
                call.resolve()
                return@runOnUiThread
            }

            val ctx = activity
            container = FrameLayout(ctx)
            container!!.layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )

            val sheet = BottomSheetDialog(ctx)
            sheet.setContentView(container!!)

            WebViewSnapshotManager.showSnapshot(snapshotTag, webView)

            // Move the WebView into the BottomSheet container
            detachWebView(webView, ctx)
            container!!.addView(
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

                // Forcefully detach WebView before restoring
                try {
                    (webView.parent as? ViewGroup)?.removeView(webView)
                    container?.removeAllViews()
                } catch (_: Exception) {}

                // Delay restoration slightly to let Android clean up window surfaces
                mainHandler.post {
                    restoreWebView(webView)
                    webView.alpha = 0f

                    webView.postDelayed({
                        webView.alpha = 1f
                        WebViewSnapshotManager.clearSnapshot(snapshotTag)
                        notifyListeners(
                            "state",
                            JSObject()
                                .put("presented", false)
                                .put("dismissing", false)
                        )
                    }, 120)
                }

                dialog = null
                container = null
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
            if (dialog == null) {
                WebViewSnapshotManager.clearSnapshot(snapshotTag)
                call.resolve()
                return@runOnUiThread
            }

            dialog?.dismiss()
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
            setBackgroundColor(LogseqTheme.current().background)
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

        // Fully detach from any container
        (webView.parent as? ViewGroup)?.removeView(webView)
        placeholder?.let { parent.removeView(it) }
        placeholder = null

        // Reattach WebView
        if (previousIndex in 0..parent.childCount) {
            parent.addView(webView, previousIndex, lp)
        } else {
            parent.addView(webView, lp)
        }

        // ✅ Force WebView to recreate its SurfaceView and redraw
        webView.visibility = View.INVISIBLE
        webView.post {
            webView.visibility = View.VISIBLE
            webView.requestLayout()
            webView.invalidate()
            webView.dispatchWindowVisibilityChanged(View.VISIBLE)
        }

        previousParent = null
        previousLayoutParams = null
        previousIndex = -1
        container = null
    }
}
