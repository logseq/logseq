import SwiftUI
import Combine

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
}
