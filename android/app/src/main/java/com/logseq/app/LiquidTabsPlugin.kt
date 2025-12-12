package com.logseq.app

import android.graphics.Color
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Circle
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.doOnNextLayout
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "LiquidTabsPlugin")
class LiquidTabsPlugin : Plugin() {
    private var bottomNav: ComposeView? = null
    private var searchContainer: LinearLayout? = null
    private var searchInput: EditText? = null
    private var resultsContainer: LinearLayout? = null
    private var originalBottomPadding: Int? = null
    private var navBaseBottomInset: Int = 0

    private var tabsState by mutableStateOf<List<TabSpec>>(emptyList())
    private var currentTabId by mutableStateOf<String?>(null)

    @PluginMethod
    fun configureTabs(call: PluginCall) {
        val activity = activity ?: run {
            call.reject("No activity")
            return
        }
        val tabs = parseTabs(call.getArray("tabs"))

        activity.runOnUiThread {
            tabsState = tabs
            val activeId = currentTabId?.takeIf { id -> tabs.any { it.id == id } }
                ?: tabs.firstOrNull()?.id
            currentTabId = activeId
            ensureNav()
            currentTabId?.let { id ->
                tabsState.find { it.id == id }?.let { tab ->
                    handleSelection(tab, reselected = false)
                }
            } ?: hideSearchUi()
            adjustWebViewPadding()
            call.resolve()
        }
    }

    @PluginMethod
    fun selectTab(call: PluginCall) {
        val id = call.getString("id") ?: run {
            call.reject("Missing id")
            return
        }
        val tab = tabsState.find { it.id == id }
        if (tab == null) {
            call.resolve()
            return
        }
        val nav = bottomNav
        if (nav == null) {
            call.resolve()
            return
        }
        nav.post {
            val reselected = currentTabId == tab.id
            handleSelection(tab, reselected)
            call.resolve()
        }
    }

    @PluginMethod
    fun updateNativeSearchResults(call: PluginCall) {
        val results = parseResults(call.getArray("results"))
        activity?.runOnUiThread {
            ensureSearchUi()
            val container = resultsContainer ?: return@runOnUiThread
            container.removeAllViews()
            results.forEach { result ->
                container.addView(makeResultRow(result))
            }
            call.resolve()
        } ?: call.resolve()
    }

    private fun ensureNav(): ComposeView {
        val activity = activity ?: throw IllegalStateException("No activity")
        val root = NativeUiUtils.contentRoot(activity)
        val nav = bottomNav ?: ComposeView(activity).also { view ->
            view.id = R.id.liquid_tabs_bottom_nav
            view.setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
            view.layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM
            )
            view.setBackgroundColor(Color.WHITE)
            bottomNav = view
            root.addView(view)
            setupImeBehaviorForNav(view)
        }

        nav.setContent {
            BottomNavBar(
                tabs = tabsState,
                currentId = currentTabId,
                onSelect = { tab ->
                    val reselected = tab.id == currentTabId
                    handleSelection(tab, reselected)
                }
            )
        }

        nav.doOnNextLayout { adjustWebViewPadding() }
        return nav
    }

    private fun handleSelection(tab: TabSpec, reselected: Boolean) {
        currentTabId = tab.id
        if (tab.role == "search") {
            showSearchUi()
        } else {
            hideSearchUi()
        }

        notifyListeners("tabSelected", JSObject().put("id", tab.id).put("reselected", reselected))
    }

    private fun adjustWebViewPadding() {
        val webView = bridge.webView ?: return
        val nav = bottomNav ?: return
        if (originalBottomPadding == null) {
            originalBottomPadding = webView.paddingBottom
        }
        nav.post {
            val padding = originalBottomPadding ?: 0
            val h = nav.height
            webView.setPadding(webView.paddingLeft, webView.paddingTop, webView.paddingRight, padding + h)
        }
    }

    private fun setupImeBehaviorForNav(nav: View) {
        ViewCompat.setOnApplyWindowInsetsListener(nav) { v, insets ->
            val imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime())
            val navInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
            val imeVisible = insets.isVisible(WindowInsetsCompat.Type.ime())

            if (!imeVisible) {
                navBaseBottomInset = navInsets.bottom
            }

            val lp = v.layoutParams as ViewGroup.MarginLayoutParams
            if (lp.bottomMargin != navBaseBottomInset) {
                lp.bottomMargin = navBaseBottomInset
                v.layoutParams = lp
            }

            val extra = if (imeVisible) {
                (imeInsets.bottom - navBaseBottomInset).coerceAtLeast(0)
            } else {
                0
            }
            v.translationY = extra.toFloat()
            insets
        }

        ViewCompat.requestApplyInsets(nav)
    }

    private fun ensureSearchUi() {
        if (searchContainer != null) return
        showSearchUi()
    }

    private fun showSearchUi() {
        val activity = activity ?: return
        val root = NativeUiUtils.contentRoot(activity)
        val container = searchContainer ?: LinearLayout(activity).also { layout ->
            layout.orientation = LinearLayout.VERTICAL
            layout.setBackgroundColor(Color.parseColor("#F5F5F5"))
            val lp = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM
            )
            lp.setMargins(
                NativeUiUtils.dp(activity, 12f),
                NativeUiUtils.dp(activity, 12f),
                NativeUiUtils.dp(activity, 12f),
                bottomNav?.height ?: NativeUiUtils.dp(activity, 56f)
            )
            layout.elevation = NativeUiUtils.dp(activity, 4f).toFloat()
            layout.setPadding(
                NativeUiUtils.dp(activity, 12f),
                NativeUiUtils.dp(activity, 12f),
                NativeUiUtils.dp(activity, 12f),
                NativeUiUtils.dp(activity, 12f)
            )
            root.addView(layout, lp)
            searchContainer = layout
        }

        if (searchInput == null) {
            val input = EditText(activity).apply {
                hint = "Search"
                setSingleLine(true)
                setPadding(
                    NativeUiUtils.dp(activity, 8f),
                    NativeUiUtils.dp(activity, 10f),
                    NativeUiUtils.dp(activity, 8f),
                    NativeUiUtils.dp(activity, 10f)
                )
                setOnKeyListener { _, keyCode, event ->
                    if (event.action == KeyEvent.ACTION_DOWN) {
                        when (keyCode) {
                            KeyEvent.KEYCODE_DEL -> notifyListeners("keyboardHackKey", JSObject().put("key", "backspace"))
                            KeyEvent.KEYCODE_ENTER -> notifyListeners("keyboardHackKey", JSObject().put("key", "enter"))
                        }
                    }
                    false
                }
                addTextChangedListener(object : TextWatcher {
                    override fun afterTextChanged(s: Editable?) {}
                    override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                    override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                        notifyListeners("searchChanged", JSObject().put("query", s?.toString() ?: ""))
                    }
                })
            }
            container.addView(input, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
            searchInput = input
        }

        if (resultsContainer == null) {
            val scroll = ScrollView(activity)
            val inner = LinearLayout(activity).apply {
                orientation = LinearLayout.VERTICAL
            }
            scroll.addView(inner, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
            container.addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
            resultsContainer = inner
        }

        container.visibility = View.VISIBLE
    }

    private fun hideSearchUi() {
        searchContainer?.visibility = View.GONE
    }

    private fun makeResultRow(result: SearchResult): View {
        val activity = activity ?: throw IllegalStateException("No activity")
        return LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(
                NativeUiUtils.dp(activity, 8f),
                NativeUiUtils.dp(activity, 10f),
                NativeUiUtils.dp(activity, 8f),
                NativeUiUtils.dp(activity, 10f)
            )
            val titleView = TextView(activity).apply {
                text = result.title
                setTextColor(Color.BLACK)
                textSize = 15f
            }
            addView(titleView)
            if (!result.subtitle.isNullOrBlank()) {
                val sub = TextView(activity).apply {
                    text = result.subtitle
                    setTextColor(Color.DKGRAY)
                    textSize = 13f
                }
                addView(sub)
            }
            setOnClickListener {
                notifyListeners("openSearchResultBlock", JSObject().put("id", result.id))
            }
        }
    }

    @Composable
    private fun BottomNavBar(
        tabs: List<TabSpec>,
        currentId: String?,
        onSelect: (TabSpec) -> Unit
    ) {
        NavigationBar(containerColor = ComposeColor.White) {
            tabs.forEach { tab ->
                val selected = tab.id == currentId
                val icon = remember(tab.systemImage, tab.id) {
                    MaterialIconResolver.resolve(tab.systemImage) ?: MaterialIconResolver.resolve(tab.id)
                }

                NavigationBarItem(
                    selected = selected,
                    onClick = { onSelect(tab) },
                    icon = {
                        Icon(
                            imageVector = icon ?: Icons.Filled.Circle,
                            contentDescription = tab.title
                        )
                    },
                    label = { Text(tab.title) }
                )
            }
        }
    }

    private fun parseTabs(array: JSArray?): List<TabSpec> {
        if (array == null) return emptyList()
        val result = mutableListOf<TabSpec>()
        for (i in 0 until array.length()) {
            val obj = array.optJSONObject(i) ?: continue
            val id = obj.optString("id", "")
            if (id.isBlank()) continue
            val title = obj.optString("title", id)
            val systemImage = obj.optString("systemImage", "")
            val role = obj.optString("role", "normal")
            result.add(TabSpec(id, title, systemImage, role))
        }
        return result
    }

    private fun parseResults(array: JSArray?): List<SearchResult> {
        if (array == null) return emptyList()
        val result = mutableListOf<SearchResult>()
        for (i in 0 until array.length()) {
            val obj = array.optJSONObject(i) ?: continue
            val id = obj.optString("id", "")
            if (id.isBlank()) continue
            val title = obj.optString("title", "")
            val subtitle = obj.optString("subtitle", null)
            result.add(SearchResult(id, title, subtitle))
        }
        return result
    }
}

data class TabSpec(
    val id: String,
    val title: String,
    val systemImage: String,
    val role: String
)

data class SearchResult(
    val id: String,
    val title: String,
    val subtitle: String?
)
