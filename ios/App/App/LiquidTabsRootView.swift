import SwiftUI
import UIKit

// MARK: - Hidden UITextField that forces the keyboard to appear early
//
// This invisible UITextField becomes first responder immediately when the user
// switches to the Search tab. This lets us show the keyboard *before*
// SwiftUI’s searchable view finishes its expansion animation.
//
struct KeyboardHackField: UIViewRepresentable {
    @Binding var shouldShow: Bool

    class Coordinator {
        let textField = UITextField()
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        let container = UIView(frame: .zero)
        let tf = context.coordinator.textField
        tf.isHidden = true
        tf.keyboardType = .default
        container.addSubview(tf)
        return container
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        let tf = context.coordinator.textField
        if shouldShow {
            if !tf.isFirstResponder {
                tf.becomeFirstResponder()
            }
        } else {
            if tf.isFirstResponder {
                tf.resignFirstResponder()
            }
        }
    }
}

// MARK: - Root Tabs View

struct LiquidTabsRootView: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    @State private var searchText: String = ""
    @State private var isSearchPresented: Bool = false
    @FocusState private var isSearchFocused: Bool

    // Controls whether the hidden UITextField should grab keyboard focus.
    @State private var hackShowKeyboard: Bool = false

    // Native selection type: dynamic tabs + search
    enum TabSelection: Hashable {
        case content(Int) // index into store.tabs
        case search
    }

    @State private var selectedTab: TabSelection = .content(0)

    // (optional) cap number of main tabs if you like
    private let maxMainTabs = 6

    // MARK: - Re-Tap Logic

    /// Proxy binding to intercept TabView interactions
    private var tabSelectionProxy: Binding<TabSelection> {
        Binding(
            get: { selectedTab },
            set: { newValue in
                if newValue == selectedTab {
                    // --- CAPTURE RE-TAP ---
                    handleRetap(on: newValue)
                } else {
                    // --- NORMAL SELECTION ---
                    selectedTab = newValue
                }
            }
        )
    }

    private func handleRetap(on selection: TabSelection) {
        print("User re-tapped tab: \(selection)")

        // 1. Standard iOS Behavior: Pop to root
        navController.popToRootViewController(animated: true)

        // 2. Notify Plugin
        if let id = tabId(for: selection) {
            LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
        }
    }

    // MARK: - Tab Helpers

    private var firstTab: LiquidTab? {
        store.tabs.first
    }

    /// Get tab id for a selection
    private func tabId(for selection: TabSelection) -> String? {
        switch selection {
        case .content(let index):
            guard index >= 0 && index < store.tabs.count else { return nil }
            return store.tabs[index].id
        case .search:
            return "search"
        }
    }

    /// Map a tab id back to TabSelection
    private func selection(forId id: String) -> TabSelection? {
        if id == "search" {
            return .search
        }

        if let index = store.tabs.firstIndex(where: { $0.id == id }) {
            return .content(index)
        }

        return nil
    }

    /// Compute initial selection based on store.selectedId or available tabs
    private func initialSelection() -> TabSelection {
        if let id = store.selectedId,
           let sel = selection(forId: id) {
            return sel
        }

        if !store.tabs.isEmpty {
            return .content(0)
        }

        return .search
    }

    // MARK: - Body

    var body: some View {
        if #available(iOS 26.0, *) {
            if store.tabs.isEmpty {
                NativeNavHost(navController: navController)
                    .ignoresSafeArea()
                    .background(Color.logseqBackground)
            } else {
                ZStack {
                    Color.logseqBackground.ignoresSafeArea()

                    // Main TabView using the PROXY BINDING
                    TabView(selection: tabSelectionProxy) {

                        // ---- Dynamic main tabs, using Tab(...) API ----
                        ForEach(Array(store.tabs.prefix(maxMainTabs).enumerated()),
                                id: \.element.id) { index, tab in
                            Tab(
                                tab.title,
                                systemImage: tab.systemImage,
                                value: TabSelection.content(index)
                            ) {
                                NativeNavHost(navController: navController)
                                    .ignoresSafeArea()
                                    .background(Color.logseqBackground)
                            }
                        }

                        // ---- Search Tab ----
                        Tab(value: TabSelection.search, role: .search) {
                            SearchTabHost(
                                navController: navController,
                                isSearchFocused: $isSearchFocused,
                                selectedTab: $selectedTab,
                                firstTabId: store.tabs.first?.id,
                                store: store
                            )
                            .ignoresSafeArea()
                        }
                    }
                    // SwiftUI search system integration
                    .searchable(
                        text: $searchText,
                        isPresented: $isSearchPresented
                    )
                    .searchFocused($isSearchFocused)
                    .searchToolbarBehavior(.minimize)
                    .onChange(of: searchText) { query in
                        LiquidTabsPlugin.shared?.notifySearchChanged(query: query)
                    }
                    .background(Color.logseqBackground)

                    // Hidden UITextField that pre-invokes keyboard
                    KeyboardHackField(shouldShow: $hackShowKeyboard)
                        .frame(width: 0, height: 0)
                }
                .onAppear {
                    let initial = initialSelection()
                    selectedTab = initial
                    if case .search = initial {
                        isSearchPresented = true
                    }

                    let appearance = UITabBarAppearance()
                    appearance.configureWithOpaqueBackground()

                    // Background
                    appearance.backgroundColor = UIColor.logseqBackground

                    // Selected text color
                    appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
                        .foregroundColor: UIColor.label
                    ]

                    // Unselected text color (70%)
                    let dimmed = UIColor.label.withAlphaComponent(0.7)
                    appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
                        .foregroundColor: dimmed
                    ]

                    // Apply the appearance
                    let tabBar = UITabBar.appearance()
                    tabBar.tintColor = .label
                    tabBar.standardAppearance = appearance
                    tabBar.scrollEdgeAppearance = appearance
                }
                // Handle STANDARD tab selection changes
                .onChange(of: selectedTab) { newValue in
                    if let id = tabId(for: newValue) {
                        store.selectedId = id
                        LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
                    }

                    switch newValue {
                    case .search:
                        isSearchPresented = true
                    case .content:
                        hackShowKeyboard = false
                        isSearchFocused = false
                        isSearchPresented = false
                    }
                }
                .onChange(of: isSearchPresented) { presented in
                    if presented {
                        // kick the keyboard hack after a short delay
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                            hackShowKeyboard = true
                            isSearchFocused = true
                        }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                            hackShowKeyboard = false
                        }
                    } else {
                        isSearchFocused = false
                        hackShowKeyboard = false
                    }
                }
                .onChange(of: store.selectedId) { newId in
                    guard let id = newId,
                          let newSelection = selection(forId: id) else {
                        return
                    }

                    // If it's already selected, treat it as a no-op for programmatic changes
                    if newSelection == selectedTab {
                        return
                    }

                    selectedTab = newSelection
                }
                // Disable content animation on selection changes (only tab bar animates)
                .animation(nil, value: selectedTab)
            }

        } else {
            // MARK: Fallback for iOS < 26
            ZStack {
                Color.logseqBackground.ignoresSafeArea()

                TabView(selection: Binding(
                    get: { store.selectedId ?? firstTab?.id },
                    set: { newValue in
                        guard let id = newValue else { return }

                        // Fallback Re-Tap Logic
                        if id == store.selectedId {
                            navController.popToRootViewController(animated: true)
                            LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
                        } else {
                            store.selectedId = id
                            LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
                        }
                    }
                )) {
                    ForEach(store.tabs) { tab in
                        NativeNavHost(navController: navController)
                            .ignoresSafeArea()
                            .background(Color.logseqBackground)
                            .tabItem {
                                Label(tab.title, systemImage: tab.systemImage)
                            }
                            .tag(tab.id as String?)
                    }
                }
                .background(Color.logseqBackground)
                .toolbarBackground(Color.logseqBackground, for: .tabBar)
            }
        }
    }
}

// MARK: - Search Tab Host

private struct SearchTabHost: View {
    let navController: UINavigationController
    @FocusState.Binding var isSearchFocused: Bool
    var selectedTab: Binding<LiquidTabsRootView.TabSelection>
    let firstTabId: String?
    let store: LiquidTabsStore

    @Environment(\.isSearching) private var isSearching
    @State private var wasSearching: Bool = false

    var body: some View {
        NavigationStack {
            NativeNavHost(navController: navController)
                .ignoresSafeArea()
                .onAppear {
                    DispatchQueue.main.async {
                        isSearchFocused = true
                    }
                }
                .onDisappear {
                    isSearchFocused = false
                }
                .onChange(of: isSearching) { searching in
                    if searching {
                        wasSearching = true
                    } else if wasSearching,
                              case .search = selectedTab.wrappedValue,
                              let firstId = firstTabId {

                        // Cancel logic - Programmatic switch back to first content tab
                        wasSearching = false
                        selectedTab.wrappedValue = .content(0)
                        store.selectedId = firstId
                        LiquidTabsPlugin.shared?.notifyTabSelected(id: firstId)
                    }
                }
        }
    }
}
