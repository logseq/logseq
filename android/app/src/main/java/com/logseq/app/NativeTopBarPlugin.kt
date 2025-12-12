package com.logseq.app

import android.graphics.Color
import android.os.Build
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.doOnNextLayout
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativeTopBarPlugin")
class NativeTopBarPlugin : Plugin() {
    private var topBarView: NativeTopBarView? = null
    private var originalWebViewPaddingTop: Int? = null

    @PluginMethod
    fun configure(call: PluginCall) {
        val activity = activity ?: run {
            call.reject("No activity")
            return
        }

        activity.runOnUiThread {
            val hidden = call.getBoolean("hidden") ?: false
            val title = call.getString("title") ?: ""
            val leftButtons = parseButtons(call.getArray("leftButtons"))
            val rightButtons = parseButtons(call.getArray("rightButtons"))
            val titleClickable = call.getBoolean("titleClickable") ?: false
            val tintHex = call.getString("tintColor")
            val tintColorOverride =
                tintHex?.takeIf { it.isNotBlank() }?.let { NativeUiUtils.parseColor(it, LogseqTheme.current().tint) }

            val webView = bridge.webView

            if (hidden) {
                removeBar()
                restorePadding(webView)
                call.resolve()
                return@runOnUiThread
            }

            val bar = topBarView ?: NativeTopBarView(activity).also { view ->
                view.onTap = { id ->
                    notifyListeners("buttonTapped", JSObject().put("id", id))
                }
                attachBar(view)
                topBarView = view
            }

            bar.bind(title, titleClickable, leftButtons, rightButtons, tintColorOverride)
            bar.post {
                adjustWebViewPadding(webView, bar.height)
            }
            call.resolve()
        }
    }

    private fun attachBar(bar: NativeTopBarView) {
        val root = NativeUiUtils.contentRoot(activity)
        if (bar.parent !== root) {
            NativeUiUtils.detachView(bar)
            val lp = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            root.addView(bar, lp)
        }
    }

    private fun removeBar() {
        val root = activity?.let { NativeUiUtils.contentRoot(it) } ?: return
        topBarView?.let { view ->
            root.removeView(view)
        }
        topBarView = null
    }

    private fun statusBarInset(webView: android.webkit.WebView?): Int {
        if (webView == null) return 0
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            webView.rootWindowInsets?.getInsets(android.view.WindowInsets.Type.statusBars())?.top ?: 0
        } else {
            @Suppress("DEPRECATION")
            webView.rootWindowInsets?.stableInsetTop ?: 0
        }
    }

    private fun adjustWebViewPadding(webView: android.webkit.WebView?, barHeight: Int) {
        if (webView == null) return
        if (originalWebViewPaddingTop == null) {
            originalWebViewPaddingTop = webView.paddingTop
        }
        val insetTop = statusBarInset(webView)
        val target = (barHeight - insetTop).coerceAtLeast(0)
            .takeIf { it > 0 } ?: NativeUiUtils.dp(webView.context, 56f)
        webView.setPadding(
            webView.paddingLeft,
            target,
            webView.paddingRight,
            webView.paddingBottom
        )
    }

    private fun restorePadding(webView: android.webkit.WebView?) {
        if (webView == null) return
        val original = originalWebViewPaddingTop
        if (original != null) {
            webView.setPadding(webView.paddingLeft, original, webView.paddingRight, webView.paddingBottom)
        }
    }

    private fun parseButtons(array: JSArray?): List<ButtonSpec> {
        if (array == null) return emptyList()
        val result = mutableListOf<ButtonSpec>()
        for (i in 0 until array.length()) {
            val obj = array.optJSONObject(i) ?: continue
            val id = obj.optString("id", "")
            if (id.isBlank()) continue
            val systemIcon = obj.optString("systemIcon", "")
            val title = obj.optString("title", id)
            val tintHex = obj.optString("tintColor", obj.optString("color", ""))
            val iconSize = if (id == "sync") {
                "small"
            } else {
                "medium"
            }

            val size = obj.optString("size", iconSize)
            result.add(
                ButtonSpec(
                    id = id,
                    title = if (title.isNotBlank()) title else id,
                    systemIcon = systemIcon.takeIf { it.isNotBlank() },
                    tint = tintHex,
                    size = size
                )
            )
        }
        return result
    }
}

data class ButtonSpec(
    val id: String,
    val title: String,
    val systemIcon: String?,
    val tint: String?,
    val size: String
)

private class NativeTopBarView(context: android.content.Context) : FrameLayout(context) {
    var onTap: ((String) -> Unit)? = null
    private val composeView = ComposeView(context).apply {
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
    }

    init {
        addView(composeView)
    }

    fun bind(
        title: String,
        titleClickable: Boolean,
        leftButtons: List<ButtonSpec>,
        rightButtons: List<ButtonSpec>,
        tintColorOverride: Int?
    ) {
        val onTapFn = onTap
        composeView.setContent {
            TopBarContent(
                title = title,
                titleClickable = titleClickable,
                leftButtons = leftButtons,
                rightButtons = rightButtons,
                tintOverride = tintColorOverride,
                onTap = { id -> onTapFn?.invoke(id) }
            )
        }
        doOnNextLayout {
            requestLayout()
        }
    }
}

@Composable
private fun TopBarContent(
    title: String,
    titleClickable: Boolean,
    leftButtons: List<ButtonSpec>,
    rightButtons: List<ButtonSpec>,
    tintOverride: Int?,
    onTap: (String) -> Unit
) {
    val theme by LogseqTheme.colors.collectAsState()
    val background = ComposeColor(theme.background)
    val tint = tintOverride?.let { ComposeColor(it) } ?: ComposeColor(theme.tint)
    val contentTint = tint.copy(alpha = 0.8f)

    Surface(
        color = background,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .windowInsetsPadding(WindowInsets.statusBars)
                .padding(horizontal = 12.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.Start,
                verticalAlignment = Alignment.CenterVertically
            ) {
                leftButtons.forEachIndexed { index, button ->
                    if (index > 0) {
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    TopBarButton(button, contentTint, onTap)
                }
            }

            Text(
                text = title,
                color = contentTint,
                fontSize = 17.sp,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier
                    .padding(horizontal = 6.dp)
                    .let { mod ->
                        if (titleClickable) {
                            mod.clickable { onTap("title") }
                        } else {
                            mod
                        }
                    }
            )

            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                rightButtons.forEachIndexed { index, button ->
                    if (index > 0) {
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    TopBarButton(button, contentTint, onTap)
                }
            }
        }
    }
}

@Composable
private fun TopBarButton(
    spec: ButtonSpec,
    fallbackTint: ComposeColor,
    onTap: (String) -> Unit
) {
    val icon = remember(spec.systemIcon) { MaterialIconResolver.resolve(spec.systemIcon) }
    val baseTint = remember(spec.tint, fallbackTint) {
        spec.tint?.let { ComposeColor(NativeUiUtils.parseColor(it, fallbackTint.toArgb())) } ?: fallbackTint
    }
    val tint = remember(baseTint) { baseTint.copy(alpha = 0.8f) }
    val fontSize = when (spec.size.lowercase()) {
        "small" -> 13.sp
        "large" -> 17.sp
        else -> 15.sp
    }
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .clickable { onTap(spec.id) }
            .padding(horizontal = 8.dp, vertical = 6.dp)
    ) {
        if (icon != null) {
            val iconSize = if (spec.size.lowercase() == "small") {
                12.dp
            } else {
                22.dp
            }
            Icon(
                imageVector = icon,
                contentDescription = spec.title.ifBlank { spec.id },
                tint = tint,
                modifier = Modifier.size(iconSize)
            )
        } else {
            Text(
                text = spec.title,
                color = tint,
                fontSize = fontSize,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}
