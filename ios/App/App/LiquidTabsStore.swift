import SwiftUI
import Combine

struct NativeSearchResult: Identifiable, Hashable {
    let id: String          // page or block id from JS
    let title: String
    let subtitle: String?   // optional: page path, snippet, etc.
}

struct NativeGraphLabels: Equatable {
    var refresh: String = ""
    var preparing: String = ""
    var downloading: String = ""
}

struct NativeGraphItem: Identifiable, Hashable {
    let id: String
    let url: String?
    let displayName: String
    let subtitle: String?
    let remote: Bool
    let local: Bool
    let readyForUse: Bool
    let downloading: Bool
    let e2ee: Bool
    let graphName: String?
    let graphUUID: String?
    let graphSchemaVersion: String?
    let actions: [NativeGraphAction]

    var tappable: Bool {
        if local { return true }
        return remote && readyForUse && !downloading
    }
}

struct NativeGraphAction: Identifiable, Hashable {
    let id: String
    let title: String
    let destructive: Bool
    let confirmTitle: String
    let confirmMessage: String
    let confirmButton: String
    let cancelButton: String
}

struct NativeGraphSection: Identifiable, Hashable {
    let id: String
    let title: String
    let refreshable: Bool
    let graphs: [NativeGraphItem]
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
    var suppressSearchNotifications = false

    // Native-rendered graph list supplied by JS.
    @Published var graphSections: [NativeGraphSection] = []
    @Published var graphLabels = NativeGraphLabels()
    @Published var nativeGraphsVisible = true

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

    func updateGraphs(sections: [NativeGraphSection], labels: NativeGraphLabels, visible: Bool?) {
        DispatchQueue.main.async {
            self.graphSections = sections
            self.graphLabels = labels
            if let visible {
                self.nativeGraphsVisible = visible
            }
        }
    }

}
