import SwiftUI

struct LiquidTabsRootView: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    @State private var searchText: String = ""

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
                // Fallback: just show your existing nav + webview
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

                    // ---- Tab 2 (optional normal) ----
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

                    // ---- Search tab (static, special pill) ----
                    Tab(role: .search) {
                        SearchView(searchText: $searchText)
                          .onAppear {
                              // Use a fixed id for search, or map it from CLJS if you prefer
                              LiquidTabsPlugin.shared?.notifyTabSelected(id: "search")
                          }
                    }
                }}

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


struct SearchView: View {
    @Binding var searchText: String

    var body: some View {
        if #available(iOS 26.0, *) {
            NavigationStack {
                if #available(iOS 17.0, *) {
                    ContentUnavailableView("Search", systemImage: "magnifyingglass")
                      .navigationTitle("Search")
                } else {
                    Text("Search")
                }
            }
              .searchable(
                text: $searchText,
                placement: .automatic,
                prompt: "Search"
              )
              .searchToolbarBehavior(.minimize)   // Liquid behavior on iOS 26
              .onChange(of: searchText) { newValue in
                  LiquidTabsPlugin.shared?.notifySearchChanged(query: newValue)
              }
        } else {
            // Fallback on earlier versions
        }
    }
}
