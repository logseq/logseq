package com.logseq.app

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.view.View
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
    private val snapshotRefs: MutableMap<String, WeakReference<View>> = mutableMapOf()
    private val containerRefs: MutableMap<String, WeakReference<FrameLayout>> = mutableMapOf()
    private var snapshotBackgroundColor: Int = LogseqTheme.current().background

    fun setSnapshotBackgroundColor(color: Int) {
        snapshotBackgroundColor = color
        overlayRef?.get()?.setBackgroundColor(Color.TRANSPARENT)
    }

    fun registerOverlay(overlay: FrameLayout?) {
        overlayRef = overlay?.let { WeakReference(it) }
    }

    fun showSnapshot(tag: String, webView: View): View? {
        val overlay = ensureOverlay(webView) ?: return null
        val snapshotView = makeSnapshot(webView) ?: return null

        clearSnapshot(tag)

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

    private fun makeSnapshot(webView: View): View? {
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

        return try {
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            canvas.drawColor(snapshotBackgroundColor)
            webView.draw(canvas)

            ImageView(webView.context).apply {
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
        } catch (_: Exception) {
            null
        }
    }
}
