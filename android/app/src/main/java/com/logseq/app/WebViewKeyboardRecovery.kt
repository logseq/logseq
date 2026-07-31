package com.logseq.app

import android.app.Activity
import android.graphics.Rect
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.core.view.ViewCompat
import java.util.WeakHashMap

/**
 * Defensive recovery for Android WebView/IME interactions.
 *
 * In this app the Capacitor WebView is re-parented into a Compose host. On some
 * Android/WebView combinations, focusing an input while the IME is shown can
 * leave the native WebView host chain panned/resized after the IME hides. The
 * web content itself may remain scrolled, which is valid; this class only resets
 * native view/container state that should always return to full-screen.
 */
object WebViewKeyboardRecovery {
    private val listeners = WeakHashMap<Activity, ViewTreeObserver.OnGlobalLayoutListener>()

    @JvmStatic
    fun install(activity: Activity, webView: WebView) {
        if (listeners.containsKey(activity)) return

        val content = activity.findViewById<FrameLayout>(android.R.id.content) ?: return
        val root = content.rootView ?: content
        val keyboardThreshold = NativeUiUtils.dp(activity, 120f)
        var wasKeyboardVisible = isKeyboardVisible(root, keyboardThreshold)

        val listener = ViewTreeObserver.OnGlobalLayoutListener {
            val keyboardVisible = isKeyboardVisible(root, keyboardThreshold)
            if (wasKeyboardVisible && !keyboardVisible) {
                recoverAfterKeyboardHidden(activity, content, webView)
            }
            wasKeyboardVisible = keyboardVisible
        }

        listeners[activity] = listener
        content.viewTreeObserver.addOnGlobalLayoutListener(listener)
    }

    @JvmStatic
    fun uninstall(activity: Activity) {
        val listener = listeners.remove(activity) ?: return
        val content = activity.findViewById<FrameLayout>(android.R.id.content) ?: return
        if (content.viewTreeObserver.isAlive) {
            content.viewTreeObserver.removeOnGlobalLayoutListener(listener)
        }
    }

    private fun isKeyboardVisible(root: View, thresholdPx: Int): Boolean {
        if (root.height <= 0) return false

        val visibleFrame = Rect()
        root.getWindowVisibleDisplayFrame(visibleFrame)
        val coveredHeight = root.height - visibleFrame.bottom
        return coveredHeight > thresholdPx
    }

    private fun recoverAfterKeyboardHidden(
        activity: Activity,
        content: FrameLayout,
        webView: WebView
    ) {
        longArrayOf(0L, 80L, 240L).forEach { delay ->
            content.postDelayed({
                resetNativeHostState(content, webView)
                ViewCompat.requestApplyInsets(activity.window.decorView)
                ViewCompat.requestApplyInsets(content)
                ViewCompat.requestApplyInsets(webView)
            }, delay)
        }
    }

    private fun resetNativeHostState(content: FrameLayout, webView: WebView) {
        content.translationY = 0f
        content.scrollTo(0, 0)

        var current: View? = webView
        while (current != null) {
            current.translationY = 0f

            if (current !== webView && current is ViewGroup) {
                current.scrollTo(0, 0)
            }

            resetLayoutParamsIfWebViewHost(current, webView)
            current.requestLayout()
            current.invalidate()

            if (current === content) break
            current = current.parent as? View
        }
    }

    private fun resetLayoutParamsIfWebViewHost(view: View, webView: WebView) {
        val shouldFillParent = view === webView ||
            view.id == R.id.webview_container ||
            view.tag == "compose-host-webview"

        if (!shouldFillParent) return

        val lp = view.layoutParams ?: return
        var changed = false
        if (lp.width != ViewGroup.LayoutParams.MATCH_PARENT) {
            lp.width = ViewGroup.LayoutParams.MATCH_PARENT
            changed = true
        }
        if (lp.height != ViewGroup.LayoutParams.MATCH_PARENT) {
            lp.height = ViewGroup.LayoutParams.MATCH_PARENT
            changed = true
        }
        if (changed) {
            view.layoutParams = lp
        }
    }
}

