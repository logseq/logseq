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

@CapacitorPlugin(name = "NativeSelectionActionBarPlugin")
class NativeSelectionActionBarPlugin : Plugin() {
    private var barView: SelectionActionBarView? = null

    @PluginMethod
    fun present(call: PluginCall) {
        val activity = activity ?: run {
            call.reject("No activity")
            return
        }

        val actions = parseActions(call.getArray("actions"))
        val tintHex = call.getString("tintColor")
        val bgHex = call.getString("backgroundColor")

        activity.runOnUiThread {
            if (actions.isEmpty()) {
                dismissInternal()
                call.resolve()
                return@runOnUiThread
            }

            val view = barView ?: SelectionActionBarView(activity).also { v ->
                v.onAction = { id ->
                    notifyListeners("action", JSObject().put("id", id))
                }
                barView = v
            }

            view.bind(actions, tintHex, bgHex)

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
        barView?.let { root.removeView(it) }
        barView = null
    }

    private fun parseActions(array: JSArray?): List<SelectionAction> {
        if (array == null) return emptyList()
        val result = mutableListOf<SelectionAction>()
        for (i in 0 until array.length()) {
            val obj = array.optJSONObject(i) ?: continue
            SelectionAction.from(obj)?.let { result.add(it) }
        }
        return result
    }
}

data class SelectionAction(
    val id: String,
    val title: String,
    val systemIcon: String?
) {
    companion object {
        fun from(obj: org.json.JSONObject): SelectionAction? {
            val id = obj.optString("id", "")
            if (id.isBlank()) return null
            val title = obj.optString("title", id)
            val icon = obj.optString("systemIcon", null)
            return SelectionAction(id, title, icon)
        }
    }
}

private class SelectionActionBarView(context: android.content.Context) : FrameLayout(context) {
    var onAction: ((String) -> Unit)? = null

    private val scrollView = HorizontalScrollView(context)
    private val actionsContainer = LinearLayout(context)

    init {
        val bg = GradientDrawable().apply {
            cornerRadius = NativeUiUtils.dp(context, 14f).toFloat()
            setColor(Color.parseColor("#F8F8F8"))
        }
        background = bg
        elevation = NativeUiUtils.dp(context, 6f).toFloat()
        setPadding(
            NativeUiUtils.dp(context, 10f),
            NativeUiUtils.dp(context, 10f),
            NativeUiUtils.dp(context, 10f),
            NativeUiUtils.dp(context, 10f)
        )

        scrollView.isHorizontalScrollBarEnabled = false
        scrollView.overScrollMode = OVER_SCROLL_NEVER

        actionsContainer.orientation = LinearLayout.HORIZONTAL
        actionsContainer.gravity = Gravity.CENTER_VERTICAL

        scrollView.addView(
            actionsContainer,
            LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        )

        val lp = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        addView(scrollView, lp)
    }

    fun bind(actions: List<SelectionAction>, tintHex: String?, bgHex: String?) {
        val tint = NativeUiUtils.parseColor(tintHex, Color.BLACK)
        bgHex?.let {
            (background as? GradientDrawable)?.setColor(NativeUiUtils.parseColor(it, Color.parseColor("#F8F8F8")))
        }

        actionsContainer.removeAllViews()
        actions.forEach { action ->
            actionsContainer.addView(makeButton(action, tint))
        }
    }

    private fun makeButton(action: SelectionAction, tint: Int): TextView {
        return TextView(context).apply {
            text = action.title
            setTextColor(tint)
            textSize = 13f
            gravity = Gravity.CENTER
            minWidth = NativeUiUtils.dp(context, 48f)
            setPadding(
                NativeUiUtils.dp(context, 10f),
                NativeUiUtils.dp(context, 6f),
                NativeUiUtils.dp(context, 10f),
                NativeUiUtils.dp(context, 6f)
            )
            isClickable = true
            isFocusable = true
            setOnClickListener { onAction?.invoke(action.id) }
        }
    }
}
