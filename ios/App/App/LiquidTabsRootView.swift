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

    // Native selection type
    enum TabSelection: Hashable {
        case first, second, third, fourth, search
    }

    @State private var selectedTab: TabSelection = .first

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
        // If your NativeNavHost uses this controller, this resets the stack.
        navController.popToRootViewController(animated: true)

        // 2. Notify Plugin (Optional)
        // You might want to let CLJS know a re-tap occurred
        if let id = tabId(for: selection) {
            // Re-sending the selection event, or a specific "reselected" event
            LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
        }
    }

    // MARK: - Tab Helpers

    private var firstTab: LiquidTab? { store.tabs.first }
    private var secondTab: LiquidTab? { store.tabs.count > 1 ? store.tabs[1] : nil }
    private var thirdTab: LiquidTab? { store.tabs.count > 2 ? store.tabs[2] : nil }
    private var fourthTab: LiquidTab? { store.tabs.count > 3 ? store.tabs[3] : nil }

    private func tabId(for selection: TabSelection) -> String? {
        switch selection {
        case .first:  return firstTab?.id
        case .second: return secondTab?.id
        case .third:  return thirdTab?.id
        case .fourth: return fourthTab?.id
        case .search: return "search"
        }
    }

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

    // MARK: - Body

    var body: some View {
        if #available(iOS 26.0, *) {
            if store.tabs.isEmpty {
                NativeNavHost(navController: navController)
                    .ignoresSafeArea()
            } else {
                ZStack {
                    // Main TabView using the PROXY BINDING
                    TabView(selection: tabSelectionProxy) {

                        // ---- Tab 1 ----
                        if let tab = firstTab {
                            Tab(tab.title, systemImage: tab.systemImage, value: TabSelection.first) {
                                NativeNavHost(navController: navController).ignoresSafeArea()
                            }
                        }

                        // ---- Tab 2 ----
                        if let tab = secondTab {
                            Tab(tab.title, systemImage: tab.systemImage, value: TabSelection.second) {
                                NativeNavHost(navController: navController).ignoresSafeArea()
                            }
                        }

                        // ---- Tab 3 ----
                        if let tab = thirdTab {
                            Tab(tab.title, systemImage: tab.systemImage, value: TabSelection.third) {
                                NativeNavHost(navController: navController).ignoresSafeArea()
                            }
                        }

                        // ---- Tab 4 ----
                        if let tab = fourthTab {
                            Tab(tab.title, systemImage: tab.systemImage, value: TabSelection.fourth) {
                                NativeNavHost(navController: navController).ignoresSafeArea()
                            }
                        }

                        // ---- Search Tab ----
                        Tab(value: TabSelection.search, role: .search) {
                            SearchTabHost(
                                navController: navController,
                                isSearchFocused: $isSearchFocused,
                                selectedTab: $selectedTab, // Pass real binding here for programmatic changes
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
                    .onChange(of: searchText) { query in
                        LiquidTabsPlugin.shared?.notifySearchChanged(query: query)
                    }

                    // Hidden UITextField that pre-invokes keyboard
                    KeyboardHackField(shouldShow: $hackShowKeyboard)
                        .frame(width: 0, height: 0)
                }
                .onAppear {
                    let initial = initialSelection()
                    selectedTab = initial
                    if initial == .search {
                        isSearchPresented = true
                    }
                }
                // Handle STANDARD tab selection changes
                .onChange(of: selectedTab) { newValue in
                    if let id = tabId(for: newValue) {
                        store.selectedId = id
                        LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
                    }

                    if newValue == .search {
                        isSearchPresented = true
                    } else {
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
            }

        } else {
            // MARK: Fallback for iOS < 26
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
                              selectedTab.wrappedValue == .search,
                              let firstId = firstTabId {
                        
                        // Cancel logic - Programmatic switch
                        wasSearching = false
                        selectedTab.wrappedValue = .first
                        store.selectedId = firstId
                        LiquidTabsPlugin.shared?.notifyTabSelected(id: firstId)
                    }
                }
        }
    }
}
