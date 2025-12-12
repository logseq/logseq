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
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.unit.dp // New Import for DP units
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.doOnNextLayout
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

// NOTE: NativeUiUtils and MaterialIconResolver are assumed to be defined elsewhere in your project
// and are necessary for this code to compile.

@CapacitorPlugin(name = "LiquidTabsPlugin")
class LiquidTabsPlugin : Plugin() {
    private var bottomNav: ComposeView? = null
    private var searchContainer: LinearLayout? = null
    private var searchInput: EditText? = null
    private var resultsContainer: LinearLayout? = null
    private var closeButton: TextView? = null
    private var originalBottomPadding: Int? = null

    private var tabsState by mutableStateOf<List<TabSpec>>(emptyList())
    private var currentTabId by mutableStateOf<String?>(null)

    // Define a standard horizontal padding for consistency
    private val HORIZONTAL_PADDING_DP = 16f
    private val VERTICAL_PADDING_DP = 12f
    private val RESULT_ROW_VERTICAL_PADDING_DP = 10f

    // 💡 NEW: Define padding for the Tab Bar edges (makes it compact and adds left/right space)
    private val TAB_BAR_HORIZONTAL_PADDING = 12.dp

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

    /**
     * FIX: Allows the web view to explicitly show the search UI again,
     * typically after backing out of an opened search result item.
     */
    @PluginMethod
    fun showSearchUiNative(call: PluginCall) {
        activity?.runOnUiThread {
            showSearchUi()
            // Ensure padding is correct when search UI is manually shown
            adjustWebViewPadding()
            call.resolve()
        } ?: call.resolve()
    }


    private fun ensureNav(): ComposeView {
        val activity = activity ?: throw IllegalStateException("No activity")
        val root = NativeUiUtils.contentRoot(activity)
        val nav = bottomNav ?: ComposeView(activity).also { view ->
            view.id = R.id.liquid_tabs_bottom_nav // Assuming R.id.liquid_tabs_bottom_nav is defined
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
            val newPadding = if (searchContainer?.visibility == View.VISIBLE) {
                padding
            } else {
                padding + h
            }
            webView.setPadding(webView.paddingLeft, webView.paddingTop, webView.paddingRight, newPadding)
        }
    }

    private fun setupImeBehaviorForNav(nav: View) {
        ViewCompat.setOnApplyWindowInsetsListener(nav) { v, insets ->
            val imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime())
            val imeVisible = insets.isVisible(WindowInsetsCompat.Type.ime())

            val extra = if (imeVisible) {
                imeInsets.bottom
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

        // Calculate status bar height for safe area padding
        val insets = ViewCompat.getRootWindowInsets(root)
        val statusBarHeight = insets?.getInsets(WindowInsetsCompat.Type.statusBars())?.top ?: 0

        val container = searchContainer ?: LinearLayout(activity).also { layout ->
            layout.orientation = LinearLayout.VERTICAL
            layout.setBackgroundColor(Color.WHITE)

            val lp = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )

            // Set bottom margin to clear the bottom navigation bar
            lp.setMargins(0, 0, 0, bottomNav?.height ?: NativeUiUtils.dp(activity, 56f))

            // Remove elevation/shadow
            layout.elevation = 0f

            // Apply status bar height as top padding for safe area
            layout.setPadding(0, statusBarHeight, 0, 0)

            root.addView(layout, lp)
            searchContainer = layout
        }

        // Re-apply top padding in case insets were not available on first run
        container.setPadding(0, statusBarHeight, 0, 0)

        // Search Input Setup
        if (searchInput == null) {
            // Container for input and close button
            val searchRow = LinearLayout(activity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL // Center items vertically
            }

            val input = EditText(activity).apply {
                hint = "Search"
                setSingleLine(true)
                // Remove EditText default background/border for a flat look
                setBackgroundColor(Color.TRANSPARENT)

                // Fine-tune padding inside the EditText for text alignment
                setPadding(
                    NativeUiUtils.dp(activity, 0f),
                    NativeUiUtils.dp(activity, 10f),
                    NativeUiUtils.dp(activity, 0f),
                    NativeUiUtils.dp(activity, 10f)
                )

                // Layout params to make EditText take most of the horizontal space
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f)

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
                    override fun afterTextChanged(s: Editable?) {
                        // Toggle close button visibility based on text
                        val hasText = !s.isNullOrEmpty()
                        closeButton?.visibility = if (hasText) View.VISIBLE else View.GONE
                    }
                    override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                    override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                        notifyListeners("searchChanged", JSObject().put("query", s?.toString() ?: ""))
                    }
                })
            }

            // Close Button
            val button = TextView(activity).apply {
                text = "X" // Close icon (using simple 'X')
                setTextColor(Color.DKGRAY)
                textSize = 18f
                gravity = Gravity.CENTER
                setPadding(
                    NativeUiUtils.dp(activity, 8f),
                    NativeUiUtils.dp(activity, 8f),
                    NativeUiUtils.dp(activity, 8f),
                    NativeUiUtils.dp(activity, 8f)
                )
                visibility = View.GONE // Initially hidden

                setOnClickListener {
                    input.setText("") // Clear the EditText
                    // TextWatcher will handle notifying the web view and hiding the button
                }
                // Set layout params for the button
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            }

            // 1. Add EditText
            searchRow.addView(input)
            // 2. Add Close Button
            searchRow.addView(button)

            // inputContainer (was the old search container wrapper)
            val inputContainer = LinearLayout(activity).apply {
                // Add horizontal padding for the search box container
                setPadding(
                    NativeUiUtils.dp(activity, HORIZONTAL_PADDING_DP),
                    NativeUiUtils.dp(activity, VERTICAL_PADDING_DP),
                    NativeUiUtils.dp(activity, HORIZONTAL_PADDING_DP),
                    NativeUiUtils.dp(activity, VERTICAL_PADDING_DP)
                )
                orientation = LinearLayout.VERTICAL
                // Add the new searchRow (input + button)
                addView(searchRow, 0, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

                // Add a divider below the search box (optional visual polish)
                val divider = View(activity).apply {
                    layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, NativeUiUtils.dp(activity, 1f))
                    setBackgroundColor(Color.parseColor("#E0E0E0")) // Light Gray
                }
                addView(divider, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, NativeUiUtils.dp(activity, 1f)))
            }

            // Insert the inputContainer into the main searchContainer
            container.addView(inputContainer, 0, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
            searchInput = input
            closeButton = button
        }

        // Search Results Setup
        if (resultsContainer == null) {
            val scroll = ScrollView(activity)
            val inner = LinearLayout(activity).apply {
                orientation = LinearLayout.VERTICAL
                // Apply horizontal padding for the list of results
                setPadding(
                    NativeUiUtils.dp(activity, HORIZONTAL_PADDING_DP), // Left
                    NativeUiUtils.dp(activity, 0f),  // Top
                    NativeUiUtils.dp(activity, HORIZONTAL_PADDING_DP), // Right
                    NativeUiUtils.dp(activity, 12f)  // Bottom
                )
            }
            scroll.addView(inner, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
            // The ScrollView should take up the rest of the vertical space
            container.addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
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

            // Apply vertical padding for the row item, using RESULT_ROW_VERTICAL_PADDING_DP (10f)
            // for both top and bottom to ensure they are equal.
            setPadding(0,
                NativeUiUtils.dp(activity, RESULT_ROW_VERTICAL_PADDING_DP), // TOP: 10f
                0,
                NativeUiUtils.dp(activity, RESULT_ROW_VERTICAL_PADDING_DP)  // BOTTOM: 10f
            )

            val subtitleText = result.subtitle
            if (subtitleText != null &&
                !subtitleText.isNullOrBlank() &&
                subtitleText.lowercase() != "null") {

                val sub = TextView(activity).apply {
                    text = subtitleText
                    setTextColor(Color.DKGRAY)
                    textSize = 13f
                }
                addView(sub)
            }

            val titleView = TextView(activity).apply {
                text = result.title
                setTextColor(Color.BLACK)
                textSize = 15f
            }
            addView(titleView)

            setOnClickListener {
                hideSearchUi()
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
        NavigationBar(
            // ⭐️ IMPROVEMENT: Apply horizontal padding to the NavigationBar for a compact look and edge spacing
            modifier = Modifier.padding(horizontal = TAB_BAR_HORIZONTAL_PADDING),
            containerColor = ComposeColor.White
        ) {
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
