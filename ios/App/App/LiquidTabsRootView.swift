import SwiftUI

struct LiquidTabsRootView: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    var body: some View {
        Group {
            if store.tabs.isEmpty {
                // Fallback: just show your existing nav + webview
                NativeNavHost(navController: navController)
                    .ignoresSafeArea()
            } else {
                TabView(selection: Binding(
                    get: { store.effectiveSelectedId() },
                    set: { newValue in
                        guard let id = newValue else { return }
                        store.selectedId = id
                        LiquidTabsPlugin.shared?.notifyTabSelected(id: id)
                    }
                )) {
                    ForEach(store.tabs) { tab in
                        tabView(for: tab)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func tabView(for tab: LiquidTab) -> some View {
        switch tab.role {
        case .normal:
            NativeNavHost(navController: navController)
                .ignoresSafeArea()
                .tabItem {
                    Label(tab.title, systemImage: tab.systemImage)
                }
                .tag(tab.id as String?)

        case .search:
            SearchTabView()
                .tabItem {
                    Label(tab.title, systemImage: tab.systemImage)
                }
                .tag(tab.id as String?)
        }
    }
}
