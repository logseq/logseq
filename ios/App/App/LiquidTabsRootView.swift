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

struct LiquidTabsRootView: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    @State private var searchText: String = ""
    @State private var isSearchPresented: Bool = false
    @FocusState private var isSearchFocused: Bool

    // Controls whether the hidden UITextField should grab keyboard focus.
    @State private var hackShowKeyboard: Bool = false

    // Native selection type for iOS 26+ TabView
    enum TabSelection: Hashable {
        case first
        case second
        case third
        case fourth
        case search
    }

    @State private var selectedTab: TabSelection = .first

    // Convenience wrappers for the first four tabs (CLJS-provided)
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

    // Map native TabSelection → CLJS tab ID
    private func tabId(for selection: TabSelection) -> String? {
        switch selection {
        case .first:  return firstTab?.id
        case .second: return secondTab?.id
        case .third:  return thirdTab?.id
        case .fourth: return fourthTab?.id
        case .search: return "search"
        }
    }

    // Determine the first tab to show on launch.
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
            if store.tabs.isEmpty {
                // No tabs loaded yet — pass through to web host.
                NativeNavHost(navController: navController)
                    .ignoresSafeArea()
            } else {
                ZStack {
                    // Main TabView
                    TabView(selection: $selectedTab) {

                        // ---- Tab 1 ----
                        if let tab = firstTab {
                            Tab(tab.title,
                                systemImage: tab.systemImage,
                                value: TabSelection.first
                            ) {
                                NativeNavHost(navController: navController)
                                    .ignoresSafeArea()
                            }
                        }

                        // ---- Tab 2 ----
                        if let tab = secondTab {
                            Tab(tab.title,
                                systemImage: tab.systemImage,
                                value: TabSelection.second
                            ) {
                                NativeNavHost(navController: navController)
                                    .ignoresSafeArea()
                            }
                        }

                        // ---- Tab 3 ----
                        if let tab = thirdTab {
                            Tab(tab.title,
                                systemImage: tab.systemImage,
                                value: TabSelection.third
                            ) {
                                NativeNavHost(navController: navController)
                                    .ignoresSafeArea()
                            }
                        }

                        // ---- Tab 4 ----
                        if let tab = fourthTab {
                            Tab(tab.title,
                                systemImage: tab.systemImage,
                                value: TabSelection.fourth
                            ) {
                                NativeNavHost(navController: navController)
                                    .ignoresSafeArea()
                            }
                        }

                        // ---- Search Tab ----
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

                    // SwiftUI search system integration
                    .searchable(
                        text: $searchText,
                        isPresented: $isSearchPresented
                    )
                    .searchFocused($isSearchFocused)
                    .searchToolbarBehavior(.minimize)
                    .searchPresentationToolbarBehavior(.avoidHidingContent)
                    .onChange(of: searchText) { query in
                        // Forward query to CLJS
                        LiquidTabsPlugin.shared?.notifySearchChanged(query: query)
                    }

                    // Hidden UITextField that pre-invokes keyboard
                    KeyboardHackField(shouldShow: $hackShowKeyboard)
                        .frame(width: 0, height: 0)
                }

                // Set initial selection and initial search state
                .onAppear {
                    let initial = initialSelection()
                    selectedTab = initial
                    if initial == .search {
                        isSearchPresented = true
                    }
                }

                // Handle tab selection
                .onChange(of: selectedTab) { newValue in
                    if let id = tabId(for: newValue) {
                        store.selectedId = id
                        LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
                    }

                    if newValue == .search {
                        // Start the search view expansion animation
                        isSearchPresented = true
                    } else {
                        // Leaving search tab — clean up keyboard and state
                        hackShowKeyboard = false
                        isSearchFocused = false
                        isSearchPresented = false
                    }
                }

                // Search UI presentation state changes
                .onChange(of: isSearchPresented) { presented in
                    if presented {
                        // When the search UI finishes expanding,
                        // hand focus to the real search field.
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                            hackShowKeyboard = true       // Grab keyboard early
                            isSearchFocused = true        // Then focus real field
                        }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                            hackShowKeyboard = false
                        }
                    } else {
                        // Search UI dismissed
                        isSearchFocused = false
                        hackShowKeyboard = false
                    }
                }
            }

        } else {
            // Fallback for iOS < 26
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
        // Apple requires search-tab content to be wrapped in a NavigationStack.
        NavigationStack {
            NativeNavHost(navController: navController)
                .ignoresSafeArea()
                .onAppear {
                    // When entering Search tab, give focus to the search field.
                    DispatchQueue.main.async {
                        isSearchFocused = true
                    }
                    print("Search tab appeared, isSearching:", isSearching)
                }
                .onDisappear {
                    // Remove focus when leaving Search tab.
                    isSearchFocused = false
                }
                .onChange(of: isSearching) { searching in
                    if searching {
                        wasSearching = true
                    } else if wasSearching,
                              selectedTab.wrappedValue == .search,
                              let firstId = firstTabId {

                        // User tapped “Cancel” — return to the first tab.
                        wasSearching = false
                        selectedTab.wrappedValue = .first
                        store.selectedId = firstId
                        LiquidTabsPlugin.shared?.notifyTabSelected(id: firstId)
                    }
                }
        }
    }
}
