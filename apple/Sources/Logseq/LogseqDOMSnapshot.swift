import Foundation
import LUIAppleBackend

/// Builds the DOM-shaped element snapshot that OCaml document-event listeners
/// consume. `target` carries the element's tag/class/id/attrs plus an
/// `ancestors` array so `closest()`-style selectors can walk upward — the
/// same shape `editor_dom.ml`/`dom_ext.ml` decode on the OCaml side.
@MainActor
enum LogseqDOMSnapshot {
  static func snapshot(for context: LUIAppleExtensionViewContext) -> [String: Any] {
    element(of: context.nodeID, context: context, includeAncestors: true)
  }

  /// Snapshot of any node in the tree — composite native views emit on
  /// behalf of descendant DOM nodes (native sidebar rows), and document
  /// listeners still need a truthful `target` for closest()/exclusions.
  static func snapshot(of nodeID: Int, context: LUIAppleExtensionViewContext)
    -> [String: Any]
  {
    element(of: nodeID, context: context, includeAncestors: true)
  }

  /// Snapshot of an arbitrary node reachable from `context` (ancestors are
  /// fetched one hop at a time via `parentID(of:)`).
  private static func element(
    of nodeID: Int, context: LUIAppleExtensionViewContext,
    includeAncestors: Bool
  ) -> [String: Any] {
    var el: [String: Any] = [:]
    let ident = context.extensionIdentifier(of: nodeID) ?? "logseq-div"
    el["tag"] = tagName(of: ident)
    if case .string(let classes) = context.childProperty(node: nodeID, "style-class") {
      el["class"] = classes
    }
    var attrsDict: [String: Any] = [:]
    if case .string(let json) = context.childProperty(node: nodeID, "attrs"),
      let data = json.data(using: .utf8),
      let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    {
      attrsDict = dict
    }
    var domId = attrsDict["id"] as? String ?? ""
    if case .string(let accId) =
        context.childProperty(node: nodeID, "accessibility-identifier"),
      !accId.isEmpty
    {
      if domId.isEmpty { domId = accId }
      el["ref-id"] = accId
    }
    el["id"] = domId
    if !domId.isEmpty { el["#ref"] = domId }
    el["node-id"] = nodeID
    if let frame = LogseqFrameStore.entries[nodeID] {
      let r = frame.rect
      el["rect"] = [
        "left": r.minX, "top": r.minY, "right": r.maxX, "bottom": r.maxY,
        "width": r.width, "height": r.height,
      ]
    }
    el["attrs"] = attrsDict
    if includeAncestors {
      var ancestors: [[String: Any]] = []
      var parent = context.parentID(of: nodeID)
      var guardCount = 0
      while let parentID = parent, guardCount < 64 {
        ancestors.append(
          element(of: parentID, context: context, includeAncestors: false))
        parent = context.parentID(of: parentID)
        guardCount += 1
      }
      el["ancestors"] = ancestors
    }
    return el
  }

  private static func tagName(of identifier: String) -> String {
    if identifier.hasPrefix("logseq-") {
      return String(identifier.dropFirst("logseq-".count))
    }
    return identifier
  }
}
