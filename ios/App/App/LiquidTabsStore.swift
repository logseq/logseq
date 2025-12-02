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
        case action
    }
}

extension LiquidTab {
    /// Tabs that should behave like plain buttons instead of driving selection.
    /// Defaults to the existing capture tab unless explicitly marked as an action.
    var isActionButton: Bool {
        switch role {
        case .action:
            return true
        default:
            return id == "capture"
        }
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
