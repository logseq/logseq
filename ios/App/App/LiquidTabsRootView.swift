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

    // Capture Backspace/Enter on the hidden field and forward to JS.
    class KeyboardHackTextField: UITextField {
        var onKeyPress: ((String) -> Void)?

        override func deleteBackward() {
            super.deleteBackward()
            onKeyPress?("backspace")
            text = ""
        }

        override func insertText(_ text: String) {
            super.insertText(text)
            if text == "\n" {
                onKeyPress?("enter")
            }
            self.text = ""
        }
    }

    class Coordinator {
        let textField = KeyboardHackTextField()
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        let container = UIView(frame: .zero)
        let tf = context.coordinator.textField
        tf.isHidden = true
        tf.keyboardType = .default
        tf.onKeyPress = { key in
            LiquidTabsPlugin.shared?.notifyKeyboardHackKey(key: key)
        }
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

// MARK: - Root Tabs View (dispatch to 26+ vs 16–25)

struct LiquidTabsRootView: View {
    let navController: UINavigationController

    var body: some View {
        if #available(iOS 26.0, *) {
            LiquidTabs26View(navController: navController)
        } else {
            LiquidTabs16View(navController: navController)
        }
    }
}

// MARK: - Shared selection helpers

enum LiquidTabsTabSelection: Hashable {
    case content(Int)
    case search
}

private extension LiquidTabsStore {
    var firstTab: LiquidTab? { tabs.first }

    func tabId(for selection: LiquidTabsTabSelection) -> String? {
        switch selection {
        case .content(let index):
            guard index >= 0 && index < tabs.count else { return nil }
            return tabs[index].id
        case .search:
            return "search"
        }
    }

    func selection(forId id: String) -> LiquidTabsTabSelection? {
        if id == "search" { return .search }
        if let idx = tabs.firstIndex(where: { $0.id == id }) {
            return .content(idx)
        }
        return nil
    }
}

// MARK: - iOS 26+ implementation using Tab(...) API + search role

@available(iOS 26.0, *)
private struct LiquidTabs26View: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    @State private var searchText: String = ""
    @State private var isSearchPresented: Bool = false
    @FocusState private var isSearchFocused: Bool

    @State private var hackShowKeyboard: Bool = false
    @State private var selectedTab: LiquidTabsTabSelection = .content(0)

    private let maxMainTabs = 6

    // Proxy binding to intercept re-taps
    private var tabSelectionProxy: Binding<LiquidTabsTabSelection> {
        Binding(
            get: { selectedTab },
            set: { newValue in
                if newValue == selectedTab {
                    handleRetap(on: newValue)
                } else {
                    selectedTab = newValue
                }
            }
        )
    }

    private func handleRetap(on selection: LiquidTabsTabSelection) {
        print("User re-tapped tab: \(selection)")
        navController.popToRootViewController(animated: true)

        if let id = store.tabId(for: selection) {
            LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
        }
    }

    private func initialSelection() -> LiquidTabsTabSelection {
        if let id = store.selectedId,
           let sel = store.selection(forId: id) {
            return sel
        }

        if !store.tabs.isEmpty {
            return .content(0)
        }

        return .search
    }

    var body: some View {
        if store.tabs.isEmpty {
            // bootstrap webview so JS can configure tabs
            NativeNavHost(navController: navController)
                .ignoresSafeArea()
                .background(Color.logseqBackground)
        } else {
            ZStack {
                Color.logseqBackground.ignoresSafeArea()

                TabView(selection: tabSelectionProxy) {
                    // Dynamic main tabs using Tab(...) API
                    ForEach(Array(store.tabs.prefix(maxMainTabs).enumerated()),
                            id: \.element.id) { index, tab in
                        Tab(
                            tab.title,
                            systemImage: tab.systemImage,
                            value: LiquidTabsTabSelection.content(index)
                        ) {
                            NativeNavHost(navController: navController)
                                .ignoresSafeArea()
                                .background(Color.logseqBackground)
                        }
                    }

                    // Search Tab
                    Tab(value: .search, role: .search) {
                        SearchTabHost26(
                            navController: navController,
                            isSearchFocused: $isSearchFocused,
                            selectedTab: $selectedTab,
                            firstTabId: store.tabs.first?.id,
                            store: store
                        )
                        .ignoresSafeArea()
                    }
                }
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
                appearance.configureWithTransparentBackground()

                // Selected text color
                appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
                    .foregroundColor: UIColor.label
                ]

                // Unselected text color (70%)
                let dimmed = UIColor.label.withAlphaComponent(0.7)
                appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
                    .foregroundColor: dimmed
                ]

                // Unselected icon color (90%)
                appearance.stackedLayoutAppearance.normal.iconColor =
                    UIColor.label.withAlphaComponent(0.9)

                let tabBar = UITabBar.appearance()
                tabBar.tintColor = .label
                tabBar.standardAppearance = appearance
                tabBar.scrollEdgeAppearance = appearance
            }
            .onChange(of: selectedTab) { newValue in
                if let id = store.tabId(for: newValue) {
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
                      let newSelection = store.selection(forId: id) else {
                    return
                }

                if newSelection != selectedTab {
                    selectedTab = newSelection
                }
            }
            .animation(nil, value: selectedTab)
        }
    }
}

// Search host for 26+ (unchanged)
@available(iOS 26.0, *)
private struct SearchTabHost26: View {
    let navController: UINavigationController
    @FocusState.Binding var isSearchFocused: Bool
    var selectedTab: Binding<LiquidTabsTabSelection>
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

// MARK: - iOS 16–25 implementation
// Classic TabView + .tabItem; Search tab shows a custom search bar pinned at top.

private struct LiquidTabs16View: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    @State private var searchText: String = ""
    @State private var hackShowKeyboard: Bool = false

    var body: some View {
        ZStack {
            Color.logseqBackground.ignoresSafeArea()

            if store.tabs.isEmpty {
                // bootstrapping: attach shared webview until JS configures tabs
                NativeNavHost(navController: navController)
                    .ignoresSafeArea()
                    .background(Color.logseqBackground)
            } else {
                ZStack {
                    Color.logseqBackground.ignoresSafeArea()

                    TabView(selection: Binding<String?>(
                        get: {
                            store.selectedId ?? store.firstTab?.id
                        },
                        set: { newValue in
                            guard let id = newValue else { return }

                            // Re-tap: pop to root
                            if id == store.selectedId {
                                navController.popToRootViewController(animated: true)
                                LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
                            } else {
                                store.selectedId = id
                                LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
                            }

                            // Basic keyboard hack when selecting Search tab
                            if id == "search" {
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                                    hackShowKeyboard = true
                                }
                                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                                    hackShowKeyboard = false
                                }
                            } else {
                                hackShowKeyboard = false
                            }
                        }
                    )) {
                        // --- Normal dynamic tabs ---
                        ForEach(store.tabs) { tab in
                            NativeNavHost(navController: navController)
                                .ignoresSafeArea()
                                .background(Color.logseqBackground)
                                .tabItem {
                                    Label(tab.title, systemImage: tab.systemImage)
                                }
                                .tag(tab.id as String?)
                        }

                        // --- 🔍 SEARCH TAB (iOS 16–25) ---
                        SearchTab16Host(
                            navController: navController,
                            searchText: $searchText
                        )
                        .ignoresSafeArea()
                        .tabItem {
                            Label("Search", systemImage: "magnifyingglass")
                        }
                        .tag("search" as String?)
                    }

                    // Hidden UITextField that pre-invokes keyboard
                    KeyboardHackField(shouldShow: $hackShowKeyboard)
                        .frame(width: 0, height: 0)
                }
                .onAppear {
                    if store.selectedId == nil {
                        store.selectedId = store.tabs.first?.id
                    }

                    let appearance = UITabBarAppearance()
                    appearance.configureWithTransparentBackground()

                    appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
                        .foregroundColor: UIColor.label
                    ]

                    let dimmed = UIColor.label.withAlphaComponent(0.7)
                    appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
                        .foregroundColor: dimmed
                    ]
                    appearance.stackedLayoutAppearance.normal.iconColor =
                        UIColor.label.withAlphaComponent(0.9)

                    let tabBar = UITabBar.appearance()
                    tabBar.tintColor = .label
                    tabBar.standardAppearance = appearance
                    tabBar.scrollEdgeAppearance = appearance
                }
            }
        }
    }
}

private struct SearchTab16Host: View {
    let navController: UINavigationController
    @Binding var searchText: String

    var body: some View {
        NavigationStack {
            ZStack {
                // Main content (fills whole screen)
                NativeNavHost(navController: navController)
                    .ignoresSafeArea()

                // Bottom search bar
                VStack {
                    Spacer()

                    HStack(spacing: 8) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 16))

                        TextField("Search", text: $searchText)
                            .textInputAutocapitalization(.none)
                            .disableAutocorrection(true)

                        if !searchText.isEmpty {
                            Button("Clear") {
                                searchText = ""
                            }
                            .font(.system(size: 14, weight: .medium))
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color(.systemGray5))
                    )
                    .padding(.horizontal, 16)
                    .padding(.bottom, 12)
                }
            }
            .navigationBarHidden(true)
        }
        .onChange(of: searchText) { query in
            LiquidTabsPlugin.shared?.notifySearchChanged(query: query)
        }
    }
}
