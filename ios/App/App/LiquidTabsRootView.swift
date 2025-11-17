import SwiftUI

struct LiquidTabsRootView: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    @State private var searchText: String = ""
    @FocusState private var isSearchFocused: Bool

    // Convenience helpers: first two tabs from CLJS, rest ignored
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
            // iOS 26+: static TabView with a dedicated search tab (role: .search)
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

                        // ---- Search tab: same webview, CLJS shows search page ----
                        Tab(role: .search) {
                            NativeNavHost(navController: navController)
                              .ignoresSafeArea()
                              .onAppear {
                                  store.selectedId = "search"
                                  LiquidTabsPlugin.shared?.notifyTabSelected(id: "search")

                                  // Focus the native search field when entering search tab
                                  DispatchQueue.main.async {
                                      isSearchFocused = true
                                  }
                              }
                              .onDisappear {
                                  isSearchFocused = false
                              }
                        } label: {
                            Label("Search", systemImage: "magnifyingglass")
                        }

                    }
                    // 👇 Key part: toolbar placement ties search to the bottom “liquid” bar
                      .searchable(
                        text: $searchText,
                        placement: .toolbar,
                        prompt: "Search"
                      )
                      .searchFocused($isSearchFocused)
                      .searchToolbarBehavior(.minimize)
                      .onChange(of: searchText) { newValue in
                          LiquidTabsPlugin.shared?.notifySearchChanged(query: newValue)
                      }

            }

        } else {
            // iOS < 26: fall back to the old dynamic tabItem-based tabs
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
