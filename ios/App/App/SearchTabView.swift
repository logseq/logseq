import SwiftUI

struct SearchTabView: View {
    @State private var searchText: String = ""

    var body: some View {
        if #available(iOS 26.0, *) {
            NavigationStack {
                // Placeholder content – your web app will react to search anyway
                if #available(iOS 17.0, *) {
                    ContentUnavailableView("Search", systemImage: "magnifyingglass")
                        .navigationTitle("Search")
                } else {
                    // Fallback on earlier versions
                }
            }
            .searchable(
                text: $searchText,
                placement: .automatic,
                prompt: "Search"
            )
            .searchToolbarBehavior(.minimize)
            .onChange(of: searchText) { newValue in
                LiquidTabsPlugin.shared?.notifySearchChanged(query: newValue)
            }
        } else {
            // Fallback on earlier versions
        }
    }
}
