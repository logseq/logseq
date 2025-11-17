import SwiftUI

struct LiquidTabsRootView: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    @State private var searchText: String = ""

    // Convenience helpers: first three tabs from CLJS, rest ignored
    private var firstTab: LiquidTab? {
        store.tabs.first
    }

    private var secondTab: LiquidTab? {
        store.tabs.count > 1 ? store.tabs[1] : nil
    }

    private var thirdTab: LiquidTab? {
        store.tabs.count > 2 ? store.tabs[2] : nil
    }

    var body: some View {
        if #available(iOS 26.0, *) {
            // iOS 26+: TabView with dedicated search tab role
            if store.tabs.isEmpty {
                NativeNavHost(navController: navController)
                    .ignoresSafeArea()
            } else {
                TabView {
                    // ---- Tab 1 (normal) ----
                    if let tab = firstTab {
                        Tab {
                            NativeNavHost(navController: navController)
                                .ignoresSafeArea()
                                .onAppear {
                                    store.selectedId = tab.id
                                    LiquidTabsPlugin.shared?.notifyTabSelected(id: tab.id)
                                }
                        } label: {
                            Label(tab.title, systemImage: tab.systemImage)
                        }
                    }

                    // ---- Tab 2 (normal) ----
                    if let tab = secondTab {
                        Tab {
                            NativeNavHost(navController: navController)
                                .ignoresSafeArea()
                                .onAppear {
                                    store.selectedId = tab.id
                                    LiquidTabsPlugin.shared?.notifyTabSelected(id: tab.id)
                                }
                        } label: {
                            Label(tab.title, systemImage: tab.systemImage)
                        }
                    }

                    // ---- Tab 3 (normal) ----
                    if let tab = thirdTab {
                        Tab {
                            NativeNavHost(navController: navController)
                                .ignoresSafeArea()
                                .onAppear {
                                    store.selectedId = tab.id
                                    LiquidTabsPlugin.shared?.notifyTabSelected(id: tab.id)
                                }
                        } label: {
                            Label(tab.title, systemImage: tab.systemImage)
                        }
                    }

                    // ---- Search tab (special role) ----
                    Tab(role: .search) {
                        // 👇 Apple requires search tab content inside NavigationStack
                        NavigationStack {
                            NativeNavHost(navController: navController)
                                .ignoresSafeArea()
                                .onAppear {
                                    // Tell CLJS to show the search page
                                    store.selectedId = "search"
                                    LiquidTabsPlugin.shared?.notifyTabSelected(id: "search")
                                }
                        }
                    } label: {
                        Label("Search", systemImage: "magnifyingglass")
                    }
                }
                // 👇 This is the key combo for “search tab → search field” UX:
                //  - Tab(role: .search) above
                //  - .searchable on the TabView
                .searchable(text: $searchText)
                .searchToolbarBehavior(.minimize)
                .onChange(of: searchText) { newValue in
                    // Forward query to JS/CLJS
                    LiquidTabsPlugin.shared?.notifySearchChanged(query: newValue)
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
