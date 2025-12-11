package com.logseq.app

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.material.bottomnavigation.BottomNavigationView
import kotlin.math.max

@CapacitorPlugin(name = "NativeSelectionActionBarPlugin")
class NativeSelectionActionBarPlugin : Plugin() {
    private var barView: SelectionActionBarView? = null

    @PluginMethod
    fun present(call: PluginCall) {
        val activity = activity ?: run {
            call.reject("No activity")
            return
        }

        val actionsArray = call.getArray("actions")
        val actions = parseActions(actionsArray)
        val tintHex = call.getString("tintColor")
        val bgHex = call.getString("backgroundColor")

        activity.runOnUiThread {
            if (actions.isEmpty()) {
                dismissInternal()
                call.resolve()
                return@runOnUiThread
            }

            val root = NativeUiUtils.contentRoot(activity)
            val view = barView ?: SelectionActionBarView(activity).also { v ->
                v.onAction = { id ->
                    notifyListeners("action", JSObject().put("id", id))
                }
                barView = v
            }

            view.bind(actions, tintHex, bgHex)

            if (view.parent !== root) {
                NativeUiUtils.detachView(view)

                val lp = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    Gravity.BOTTOM
                ).apply {
                    val margin = NativeUiUtils.dp(activity, 12f)
                    val bottomOffset = computeBottomOffset(activity, root)
                    // top / left / right: margin
                    // bottom: margin + bottom nav height + system/IME inset
                    setMargins(margin, margin, margin, margin + bottomOffset)
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
        val activity = activity ?: return
        val root = NativeUiUtils.contentRoot(activity)

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

    /**
     * Compute how far we must lift the bar from the bottom so that it
     * sits above:
     *  - the BottomNavigationView created by LiquidTabsPlugin
     *  - system nav / gesture bar
     *  - IME (when showing)
     */
    private fun computeBottomOffset(activity: android.app.Activity, root: ViewGroup): Int {
        val insets = ViewCompat.getRootWindowInsets(root)
        val systemBarsBottom = insets?.getInsets(WindowInsetsCompat.Type.systemBars())?.bottom ?: 0
        val imeBottom = insets?.getInsets(WindowInsetsCompat.Type.ime())?.bottom ?: 0

        // Find the bottom nav created by LiquidTabsPlugin (must have this ID set there)
        val bottomNav = activity.findViewById<BottomNavigationView>(R.id.liquid_tabs_bottom_nav)
        // Fallback height if nav not measured yet
        val navHeight = bottomNav?.height ?: NativeUiUtils.dp(activity, 56f)

        val insetBottom = max(systemBarsBottom, imeBottom)
        return navHeight + insetBottom
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
            dp(10f),
            dp(10f),
            dp(10f),
            dp(10f)
        )

        scrollView.isHorizontalScrollBarEnabled = false
        scrollView.overScrollMode = OVER_SCROLL_NEVER

        actionsContainer.orientation = LinearLayout.HORIZONTAL
        actionsContainer.gravity = Gravity.CENTER_VERTICAL

        scrollView.addView(
            actionsContainer,
            LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
        )

        addView(
            scrollView,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        )
    }

    private fun dp(v: Float) = NativeUiUtils.dp(context, v)

    fun bind(actions: List<SelectionAction>, tintHex: String?, bgHex: String?) {
        val tint = NativeUiUtils.parseColor(tintHex, Color.BLACK)
        bgHex?.let {
            (background as? GradientDrawable)?.setColor(
                NativeUiUtils.parseColor(it, Color.parseColor("#F8F8F8"))
            )
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
            minWidth = dp(48f)
            setPadding(
                dp(10f),
                dp(6f),
                dp(10f),
                dp(6f)
            )
            isClickable = true
            isFocusable = true
            setOnClickListener { onAction?.invoke(action.id) }
        }
    }
}
