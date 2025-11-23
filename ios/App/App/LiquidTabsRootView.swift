import SwiftUI
import UIKit

struct LiquidTabsRootView: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    @State private var searchText: String = ""
    @FocusState private var isSearchFocused: Bool

    // Native selection type for iOS 26+ TabView
    enum TabSelection: Hashable {
        case first
        case second
        case third
        case fourth
        case search
    }

    @State private var selectedTab: TabSelection = .first

    // Convenience: first four tabs from CLJS, rest ignored
    private var firstTab: LiquidTab? {
        store.tabs.first
    }

    private var secondTab: LiquidTab? {
        store.tabs.count > 1 ? store.tabs[1] : nil
    }

    private var thirdTab: LiquidTab? {
        store.tabs.count > 2 ? store.tabs[2] : nil
    }

    private var fourthTab: LiquidTab? {
        store.tabs.count > 3 ? store.tabs[3] : nil
    }

    // Map selection -> CLJS tab id
    private func tabId(for selection: TabSelection) -> String? {
        switch selection {
        case .first:
            return firstTab?.id
        case .second:
            return secondTab?.id
        case .third:
            return thirdTab?.id
        case .fourth:
            return fourthTab?.id
        case .search:
            return "search"
        }
    }

    // Decide an initial selection based on store / available tabs
    private func initialSelection() -> TabSelection {
        if let id = store.selectedId {
            if id == firstTab?.id { return .first }
            if id == secondTab?.id { return .second }
            if id == thirdTab?.id { return .third }
            if id == fourthTab?.id { return .fourth }
            if id == "search" { return .search }
        }
        if firstTab != nil { return .first }
        if secondTab != nil { return .second }
        if thirdTab != nil { return .third }
        if fourthTab != nil { return .fourth }
        return .search
    }

    var body: some View {
        if #available(iOS 26.0, *) {
            // iOS 26+: new TabView / Tab API
            if store.tabs.isEmpty {
                NativeNavHost(navController: navController)
                    .ignoresSafeArea()
            } else {
                TabView(selection: $selectedTab) {
                    // ---- Tab 1 (normal / home) ----
                    if let tab = firstTab {
                        Tab(tab.title,
                            systemImage: tab.systemImage,
                            value: TabSelection.first
                        ) {
                            NativeNavHost(navController: navController)
                                .ignoresSafeArea()
                        }
                    }

                    // ---- Tab 2 (normal) ----
                    if let tab = secondTab {
                        Tab(tab.title,
                            systemImage: tab.systemImage,
                            value: TabSelection.second
                        ) {
                            NativeNavHost(navController: navController)
                                .ignoresSafeArea()
                        }
                    }

                    // ---- Tab 3 (normal) ----
                    if let tab = thirdTab {
                        Tab(tab.title,
                            systemImage: tab.systemImage,
                            value: TabSelection.third
                        ) {
                            NativeNavHost(navController: navController)
                                .ignoresSafeArea()
                        }
                    }

                    // ---- Tab 4 (normal) ----
                    if let tab = fourthTab {
                        Tab(tab.title,
                            systemImage: tab.systemImage,
                            value: TabSelection.fourth
                        ) {
                            NativeNavHost(navController: navController)
                                .ignoresSafeArea()
                        }
                    }

                    // ---- Search tab (special role) ----
                    Tab(value: TabSelection.search, role: .search) {
                        SearchTabHost(
                            navController: navController,
                            isSearchFocused: $isSearchFocused,
                            selectedTab: $selectedTab,
                            firstTabId: firstTab?.id,
                            store: store
                        )
                    }
                }
                // Set initial selection once we have tabs
                .onAppear {
                    selectedTab = initialSelection()
                }
                // Native search integration
                .searchable(text: $searchText)
                .searchFocused($isSearchFocused)
                .searchToolbarBehavior(.minimize)
                .onChange(of: searchText) { newValue in
                    // Forward query to JS/CLJS
                    LiquidTabsPlugin.shared?.notifySearchChanged(query: newValue)
                }
                // Keep native selection ↔ CLJS in sync
                .onChange(of: selectedTab) { newValue in
                    guard let id = tabId(for: newValue) else { return }
                    store.selectedId = id
                    LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
                }
            }

        } else {
            // iOS < 26: old dynamic tabItem-based tabs
            TabView(selection: Binding(
                get: { store.selectedId ?? firstTab?.id },
                set: { newValue in
                    guard let id = newValue else { return }
                    store.selectedId = id
                    LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
                }
            )) {
                ForEach(store.tabs) { tab in
                    NativeNavHost(navController: navController)
                        .ignoresSafeArea()
                        .tabItem {
                            Label(tab.title, systemImage: tab.systemImage)
                        }
                        .tag(tab.id as String?)
                }
            }
        }
    }
}

private struct SearchTabHost: View {
    let navController: UINavigationController
    @FocusState.Binding var isSearchFocused: Bool
    var selectedTab: Binding<LiquidTabsRootView.TabSelection>
    let firstTabId: String?
    let store: LiquidTabsStore

    @Environment(\.isSearching) private var isSearching
    @State private var wasSearching: Bool = false

    var body: some View {
        // Apple requires search tab content inside NavigationStack
        NavigationStack {
            NativeNavHost(navController: navController)
                .ignoresSafeArea()
                .onAppear {
                    // Focus the search field when entering search tab
                    DispatchQueue.main.async {
                        isSearchFocused = true
                    }
                    print("search tab appear, isSearching:", isSearching)
                }
                .onDisappear {
                    // Clear focus when leaving search tab
                    isSearchFocused = false
                }
                .onChange(of: isSearching) { searching in
                    if searching {
                        // User is actively searching
                        wasSearching = true
                    } else if wasSearching,
                              selectedTab.wrappedValue == .search,
                              let firstId = firstTabId {
                        // User tapped Cancel: jump back to first tab
                        wasSearching = false
                        selectedTab.wrappedValue = .first
                        store.selectedId = firstId
                        LiquidTabsPlugin.shared?.notifyTabSelected(id: firstId)
                    }
                }
        }
    }
}
