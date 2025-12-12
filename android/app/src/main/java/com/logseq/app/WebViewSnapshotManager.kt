package com.logseq.app

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Rect
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import android.view.View
import android.view.Window
import android.widget.FrameLayout
import android.widget.ImageView
import java.lang.ref.WeakReference

/**
 * Utility to capture lightweight WebView snapshots and show them in the overlay container.
 * Used to keep the background stable while the shared WebView is being reparented
 * (navigation transitions, bottom sheet presentation/dismiss).
 */
object WebViewSnapshotManager {
    private var overlayRef: WeakReference<FrameLayout>? = null
    private var windowRef: WeakReference<Window>? = null
    private val snapshotRefs: MutableMap<String, WeakReference<View>> = mutableMapOf()
    private val containerRefs: MutableMap<String, WeakReference<FrameLayout>> = mutableMapOf()
    private var snapshotBackgroundColor: Int = LogseqTheme.current().background
    private val mainHandler = Handler(Looper.getMainLooper())

    fun setSnapshotBackgroundColor(color: Int) {
        snapshotBackgroundColor = color
        overlayRef?.get()?.setBackgroundColor(Color.TRANSPARENT)
    }

    fun registerWindow(window: Window?) {
        windowRef = window?.let { WeakReference(it) }
    }

    fun registerOverlay(overlay: FrameLayout?) {
        overlayRef = overlay?.let { WeakReference(it) }
    }

    fun showSnapshot(tag: String, webView: View): View? {
        val overlay = ensureOverlay(webView) ?: return null
        clearSnapshot(tag)
        overlay.visibility = View.VISIBLE

        val snapshotView = makeSnapshotView(webView)

        overlay.addView(
            snapshotView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )
        overlay.bringChildToFront(snapshotView)

        snapshotRefs[tag] = WeakReference(snapshotView)
        containerRefs[tag] = WeakReference(overlay)

        return snapshotView
    }

    fun clearSnapshot(tag: String) {
        val view = snapshotRefs.remove(tag)?.get()
        val container = containerRefs.remove(tag)?.get()
        if (view != null && container != null) {
            container.removeView(view)
            if (container.childCount == 0) {
                container.visibility = View.GONE
            }
        }
    }

    fun clearAll() {
        snapshotRefs.keys.toList().forEach { clearSnapshot(it) }
    }

    private fun ensureOverlay(webView: View): FrameLayout? {
        overlayRef?.get()?.let { return it }
        val root = webView.rootView
        val overlay = root.findViewById<FrameLayout>(R.id.webview_overlay_container)
        if (overlay != null) {
            overlayRef = WeakReference(overlay)
        }
        return overlay
    }

    private fun makeSnapshotView(webView: View): View {
        val width = webView.width
        val height = webView.height
        if (width <= 0 || height <= 0) {
            return View(webView.context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
                setBackgroundColor(snapshotBackgroundColor)
                isClickable = false
                isFocusable = false
            }
        }

        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        // Fast fallback: capture via View#draw (can be imperfect for WebView on some devices).
        try {
            val canvas = Canvas(bitmap)
            canvas.drawColor(snapshotBackgroundColor)
            webView.draw(canvas)
        } catch (_: Exception) {
            // Keep bitmap with background color only.
        }

        val imageView = ImageView(webView.context).apply {
            setImageBitmap(bitmap)
            scaleType = ImageView.ScaleType.FIT_XY
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(snapshotBackgroundColor)
            isClickable = false
            isFocusable = false
        }

        // Higher-fidelity capture: PixelCopy from the Window buffer.
        val window = windowRef?.get()
        if (window != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val loc = IntArray(2)
                webView.getLocationInWindow(loc)
                val rect = Rect(loc[0], loc[1], loc[0] + width, loc[1] + height)

                PixelCopy.request(window, rect, bitmap, { result ->
                    if (result == PixelCopy.SUCCESS) {
                        imageView.invalidate()
                    }
                }, mainHandler)
            } catch (_: Exception) {
                // Ignore; fallback bitmap already set.
            }
        }

        return imageView
    }
}
