import SwiftUI

struct LiquidTabsRootView: View {
    @StateObject private var store = LiquidTabsStore.shared
    let navController: UINavigationController

    var body: some View {
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

    @ViewBuilder
    private func tabView(for tab: LiquidTab) -> some View {
        switch tab.role {
        case .normal:
            // Normal tab: your existing nav + webview
            NativeNavHost(navController: navController)
                .ignoresSafeArea()
                .tabItem {
                    Label(tab.title, systemImage: tab.systemImage)
                }
                .tag(tab.id as String?)

        case .search:
            // Search tab: uses SwiftUI's searchable() for the liquid search UI
            SearchTabView()
                .tabItem {
                    Label(tab.title, systemImage: tab.systemImage)
                }
                .tag(tab.id as String?)
        }
    }
}
