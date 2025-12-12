package com.logseq.app

import android.graphics.Color
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.doOnNextLayout
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
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
        val bottomNav = activity.findViewById<View>(R.id.liquid_tabs_bottom_nav)
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
    private val composeView: ComposeView

    init {
        composeView = ComposeView(context).apply {
            setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
            layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
        }
        addView(composeView)
    }

    fun bind(actions: List<SelectionAction>, tintHex: String?, bgHex: String?) {
        val tint = ComposeColor(NativeUiUtils.parseColor(tintHex, Color.BLACK))
        val backgroundColor = ComposeColor(NativeUiUtils.parseColor(bgHex, Color.parseColor("#F8F8F8")))
        val onActionFn = onAction

        composeView.setContent {
            SelectionActionBar(actions, tint, backgroundColor) { id ->
                onActionFn?.invoke(id)
            }
        }
        composeView.doOnNextLayout { requestLayout() }
    }
}

@Composable
private fun SelectionActionBar(
    actions: List<SelectionAction>,
    tint: ComposeColor,
    background: ComposeColor,
    onAction: (String) -> Unit
) {
    val (mainActions, trailingAction) = remember(actions) {
        val primary = if (actions.size > 1) actions.dropLast(1) else emptyList()
        Pair(primary, actions.lastOrNull())
    }
    val scrollState = rememberScrollState()

    Surface(
        color = background,
        shadowElevation = 6.dp,
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (mainActions.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .horizontalScroll(scrollState),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    mainActions.forEach { action ->
                        SelectionActionButton(action, tint, onAction)
                    }
                }
            }

            trailingAction?.let { action ->
                if (mainActions.isNotEmpty()) {
                    Spacer(modifier = Modifier.width(10.dp))
                    Divider(
                        modifier = Modifier
                            .height(28.dp)
                            .width(1.dp),
                        color = tint.copy(alpha = 0.15f)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                }
                SelectionActionButton(action, tint, onAction)
            }
        }
    }
}

@Composable
private fun SelectionActionButton(
    action: SelectionAction,
    tint: ComposeColor,
    onAction: (String) -> Unit
) {
    val icon = remember(action.systemIcon) { MaterialIconResolver.resolve(action.systemIcon) }
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier
            .defaultMinSize(minWidth = 56.dp)
            .clickable { onAction(action.id) }
            .padding(horizontal = 6.dp, vertical = 8.dp)
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = action.title.ifBlank { action.id },
                tint = tint,
                modifier = Modifier.size(22.dp)
            )
        }
        Text(
            text = action.title,
            color = tint,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center
        )
    }
}
