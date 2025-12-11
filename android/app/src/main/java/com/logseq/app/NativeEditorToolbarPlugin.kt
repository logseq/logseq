package com.logseq.app

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeEditorToolbarPlugin")
class NativeEditorToolbarPlugin : Plugin() {
    private var toolbarView: EditorToolbarView? = null

    @PluginMethod
    fun present(call: PluginCall) {
        val activity = activity ?: run {
            call.reject("No activity")
            return
        }

        val actions = parseActions(call.getArray("actions"))
        val trailing = call.getObject("trailingAction")?.let { EditorAction.from(it) }
        val tintHex = call.getString("tintColor")
        val bgHex = call.getString("backgroundColor")

        activity.runOnUiThread {
            if (actions.isEmpty() && trailing == null) {
                dismissInternal()
                call.resolve()
                return@runOnUiThread
            }

            val view = toolbarView ?: EditorToolbarView(activity).also { v ->
                v.onAction = { id ->
                    notifyListeners("action", JSObject().put("id", id))
                }
                toolbarView = v
            }

            view.bind(actions, trailing, tintHex, bgHex)

            val root = NativeUiUtils.contentRoot(activity)
            if (view.parent !== root) {
                NativeUiUtils.detachView(view)
                val lp = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    Gravity.BOTTOM
                ).apply {
                    val margin = NativeUiUtils.dp(activity, 12f)
                    setMargins(margin, margin, margin, margin)
                }
                root.addView(view, lp)
            }

            call.resolve()
        }
    }

    @PluginMethod
    fun dismiss(call: PluginCall) {
        activity?.runOnUiThread {
            dismissInternal()
            call.resolve()
        } ?: call.resolve()
    }

    private fun dismissInternal() {
        val root = activity?.let { NativeUiUtils.contentRoot(it) } ?: return
        toolbarView?.let { root.removeView(it) }
        toolbarView = null
    }

    private fun parseActions(array: JSArray?): List<EditorAction> {
        if (array == null) return emptyList()
        val result = mutableListOf<EditorAction>()
        for (i in 0 until array.length()) {
            val obj = array.optJSONObject(i) ?: continue
            EditorAction.from(obj)?.let { result.add(it) }
        }
        return result
    }
}

data class EditorAction(
    val id: String,
    val title: String,
    val systemIcon: String?
) {
    companion object {
        fun from(obj: org.json.JSONObject): EditorAction? {
            val id = obj.optString("id", "")
            if (id.isBlank()) return null
            val title = obj.optString("title", id)
            val icon = obj.optString("systemIcon", null)
            return EditorAction(id, title, icon)
        }
    }
}

private class EditorToolbarView(context: android.content.Context) : FrameLayout(context) {
    var onAction: ((String) -> Unit)? = null

    private val scrollView = HorizontalScrollView(context)
    private val actionsContainer = LinearLayout(context)
    private val trailingContainer = LinearLayout(context)

    init {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        setPadding(
            NativeUiUtils.dp(context, 8f),
            NativeUiUtils.dp(context, 6f),
            NativeUiUtils.dp(context, 8f),
            NativeUiUtils.dp(context, 6f)
        )

        val bg = GradientDrawable().apply {
            cornerRadius = NativeUiUtils.dp(context, 16f).toFloat()
            setColor(Color.parseColor("#F5F5F5"))
        }
        background = bg
        elevation = NativeUiUtils.dp(context, 6f).toFloat()

        scrollView.isHorizontalScrollBarEnabled = false
        scrollView.overScrollMode = OVER_SCROLL_NEVER
        scrollView.layoutParams = LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT, Gravity.START)

        actionsContainer.orientation = LinearLayout.HORIZONTAL
        actionsContainer.gravity = Gravity.CENTER_VERTICAL
        scrollView.addView(
            actionsContainer,
            LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        )

        trailingContainer.orientation = LinearLayout.HORIZONTAL
        trailingContainer.gravity = Gravity.CENTER_VERTICAL

        val row = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val rowLp = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        addView(row, rowLp)

        row.addView(scrollView, LinearLayout.LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        row.addView(trailingContainer, LinearLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))
    }

    fun bind(
        actions: List<EditorAction>,
        trailing: EditorAction?,
        tintHex: String?,
        bgHex: String?
    ) {
        val tint = NativeUiUtils.parseColor(tintHex, Color.BLACK)
        bgHex?.let {
            val drawable = (background as? GradientDrawable)
            drawable?.setColor(NativeUiUtils.parseColor(it, Color.parseColor("#F5F5F5")))
        }

        actionsContainer.removeAllViews()
        actions.forEach { action ->
            actionsContainer.addView(makeButton(action, tint))
        }

        trailingContainer.removeAllViews()
        trailing?.let { trailingAction ->
            trailingContainer.addView(makeButton(trailingAction, tint))
        }
    }

    private fun makeButton(action: EditorAction, tint: Int): TextView {
        return TextView(context).apply {
            text = action.title
            setTextColor(tint)
            textSize = 14f
            gravity = Gravity.CENTER
            minWidth = NativeUiUtils.dp(context, 44f)
            setPadding(
                NativeUiUtils.dp(context, 10f),
                NativeUiUtils.dp(context, 8f),
                NativeUiUtils.dp(context, 10f),
                NativeUiUtils.dp(context, 8f)
            )
            isClickable = true
            isFocusable = true
            setOnClickListener { onAction?.invoke(action.id) }
        }
    }
}
