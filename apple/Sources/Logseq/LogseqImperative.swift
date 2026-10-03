import LUIAppleBackend
import SwiftUI

/// Body-attached imperative elements (popups, menus, overlays emitted by
/// OCaml's imperative_dom). These nodes materialize as extension nodes in
/// the LUI runtime but have no in-tree parent to render under, so the
/// "imperative-attach"/"imperative-detach" dom-ops list them here and the
/// layer renders each by its runtime node id, above the app content.
@MainActor final class LogseqImperativeStore: ObservableObject {
  static let shared = LogseqImperativeStore()
  @Published private(set) var attached: [Int] = []

  func attach(_ nodeID: Int) {
    guard !attached.contains(nodeID) else { return }
    attached.append(nodeID)
  }

  func detach(_ nodeID: Int) {
    attached.removeAll { $0 == nodeID }
  }
}

/// Window-level layer for body-attached elements — the imperative
/// counterpart of `document.body.appendChild` on the web. `content(for:)`
/// on the long-lived app-container context is the public factory for a
/// node view by runtime id.
struct LogseqImperativeLayer: View {
  @ObservedObject private var store = LogseqImperativeStore.shared

  var body: some View {
    if let context = LogseqElementRegistry.shared.eventAnchor {
      ForEach(store.attached, id: \.self) { nodeID in
        context.content(for: nodeID)
      }
    }
  }
}
