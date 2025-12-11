package com.logseq.app

import android.graphics.Color
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.KeyEvent
import android.view.Menu
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.material.bottomnavigation.BottomNavigationView

@CapacitorPlugin(name = "LiquidTabsPlugin")
class LiquidTabsPlugin : Plugin() {
    private var bottomNav: BottomNavigationView? = null
    private var searchContainer: LinearLayout? = null
    private var searchInput: EditText? = null
    private var resultsContainer: LinearLayout? = null
    private val tabIds: MutableMap<String, Int> = mutableMapOf()
    private var searchTabId: String? = null
    private var originalBottomPadding: Int? = null
    private var currentTabId: String? = null

    @PluginMethod
    fun configureTabs(call: PluginCall) {
        val activity = activity ?: run {
            call.reject("No activity")
            return
        }
        val tabs = parseTabs(call.getArray("tabs"))
        searchTabId = tabs.firstOrNull { it.role == "search" }?.id

        activity.runOnUiThread {
            val nav = ensureNav()
            nav.menu.clear()

            tabs.forEachIndexed { index, tab ->
                val itemId = tabIds.getOrPut(tab.id) { View.generateViewId() }
                val iconRes = iconFor(tab)
                val item = nav.menu.add(Menu.NONE, itemId, index, tab.title)
                if (iconRes != null) {
                    item.setIcon(iconRes)
                }
            }

            nav.setOnItemSelectedListener { item ->
                val selected = tabs.find { tabIds[it.id] == item.itemId } ?: return@setOnItemSelectedListener false
                val reselected = selected.id == currentTabId

                // Always notify, even on reselect.
                notifyListeners("tabSelected", JSObject().put("id", selected.id).put("reselected", reselected))

                if (reselected) {
                    // Keep currentTabId unchanged, but still refresh UI if needed.
                    if (selected.role == "search") {
                        showSearchUi()
                    } else {
                        hideSearchUi()
                    }
                    return@setOnItemSelectedListener true
                }

                currentTabId = selected.id
                if (selected.role == "search") {
                    showSearchUi()
                } else {
                    hideSearchUi()
                }
                true
            }

            if (nav.menu.size() > 0) {
                val firstId = tabs.firstOrNull()?.id
                val firstMenuItemId = nav.menu.getItem(0).itemId
                currentTabId = firstId
                nav.selectedItemId = firstMenuItemId
            }
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
        val nav = bottomNav ?: run {
            call.resolve()
            return
        }
        nav.post {
            val itemId = tabIds[id] ?: return@post
            if (currentTabId == id) {
                // Still notify so JS can pop to root on reselect.
                notifyListeners("tabSelected", JSObject().put("id", id).put("reselected", true))
                call.resolve()
                return@post
            }
            currentTabId = id
            nav.selectedItemId = itemId
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

    private fun ensureNav(): BottomNavigationView {
        val activity = activity
        val root = NativeUiUtils.contentRoot(activity)
        val nav = bottomNav ?: BottomNavigationView(activity).also { view ->
            view.labelVisibilityMode = BottomNavigationView.LABEL_VISIBILITY_LABELED
            view.layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM
            )
            view.setBackgroundColor(Color.WHITE)
            bottomNav = view
            root.addView(view)
        }
        return nav
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

    private fun iconFor(tab: TabSpec): Int? {
        return when {
            tab.role == "search" -> android.R.drawable.ic_menu_search
            tab.systemImage.contains("house") -> android.R.drawable.ic_menu_view
            tab.systemImage.contains("tray") -> android.R.drawable.ic_menu_upload
            tab.systemImage.contains("square") -> android.R.drawable.ic_menu_agenda
            else -> android.R.drawable.ic_menu_view
        }
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
