import SwiftUI
import Combine

struct NativeSearchResult: Identifiable, Hashable {
    let id: String          // page or block id from JS
    let title: String
    let subtitle: String?   // optional: page path, snippet, etc.
}

struct LiquidTab: Identifiable, Equatable {
    let id: String
    let title: String
    let systemImage: String
    let role: Role

    enum Role {
        case normal
        case search
    }
}

final class LiquidTabsStore: ObservableObject {
    static let shared = LiquidTabsStore()

    @Published var tabs: [LiquidTab] = []
    @Published var selectedId: String?
    @Published var searchText: String = ""

    // Native-rendered search results supplied by JS.
    @Published var searchResults: [NativeSearchResult] = []

    // Helper to get a stable selection if JS forgets
    func effectiveSelectedId() -> String? {
        if let selectedId, tabs.contains(where: { $0.id == selectedId }) {
            return selectedId
        }
        return tabs.first?.id
    }

    func tab(for id: String) -> LiquidTab? {
        tabs.first(where: { $0.id == id })
    }

    func updateSearchResults(_ results: [NativeSearchResult]) {
        DispatchQueue.main.async {
            self.searchResults = results
        }
    }
}
