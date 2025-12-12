package com.logseq.app

import android.graphics.Color
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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

    private val composeView = ComposeView(context).apply {
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
    }

    private var actions: List<EditorAction> = emptyList()
    private var trailing: EditorAction? = null
    private var tint: Int = defaultTint()
    private var backgroundColor: Int = defaultBackground()

    init {
        addView(composeView)
    }

    fun bind(
        actions: List<EditorAction>,
        trailing: EditorAction?,
        tintHex: String?,
        bgHex: String?
    ) {
        this.actions = actions
        this.trailing = trailing
        tint = NativeUiUtils.parseColor(tintHex, defaultTint())
        backgroundColor = NativeUiUtils.parseColor(bgHex, defaultBackground())
        render()
    }

    private fun defaultTint(): Int =
        if (LogseqTheme.current().isDark) Color.WHITE else Color.BLACK

    private fun defaultBackground(): Int = LogseqTheme.current().background

    private fun render() {
        val onActionFn = onAction
        val actionsSnapshot = actions
        val trailingSnapshot = trailing
        val tintColor = tint
        val bgColor = backgroundColor

        composeView.setContent {
            EditorToolbar(
                actions = actionsSnapshot,
                trailing = trailingSnapshot,
                tint = ComposeColor(tintColor),
                background = ComposeColor(bgColor),
                onAction = { id -> onActionFn?.invoke(id) }
            )
        }
    }
}

@Composable
private fun EditorToolbar(
    actions: List<EditorAction>,
    trailing: EditorAction?,
    tint: ComposeColor,
    background: ComposeColor,
    onAction: (String) -> Unit
) {
    Surface(
        color = background,
        shadowElevation = 6.dp,
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentHeight()
            .navigationBarsPadding()
            .imePadding() // Lift toolbar above system nav/IME when the keyboard opens
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier
                    .weight(1f)
                    .horizontalScroll(rememberScrollState()),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                actions.forEach { action ->
                    ToolbarButton(action, tint, onAction)
                }
            }

            trailing?.let { trailingAction ->
                if (actions.isNotEmpty()) {
                    Spacer(modifier = Modifier.width(8.dp))
                }
                ToolbarButton(trailingAction, tint, onAction)
            }
        }
    }
}

@Composable
private fun ToolbarButton(
    action: EditorAction,
    tint: ComposeColor,
    onAction: (String) -> Unit
) {
    val icon = remember(action.systemIcon) { MaterialIconResolver.resolve(action.systemIcon) }
    val contentTint = remember(tint) { tint.copy(alpha = 0.8f) }
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .defaultMinSize(minWidth = 44.dp)
            .clickable { onAction(action.id) }
            .padding(horizontal = 10.dp, vertical = 8.dp)
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = action.title.ifBlank { action.id },
                tint = contentTint,
                modifier = Modifier
                    .defaultMinSize(minWidth = 20.dp)
                    .padding(end = 2.dp)
            )
        } else {
            Text(
                text = action.title,
                color = contentTint,
                fontSize = 14.sp
            )
        }
    }
}
