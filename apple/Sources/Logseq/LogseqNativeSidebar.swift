import AppKit
import Foundation
import LUIAppleBackend
import SwiftUI

/// Out-style native sidebar. The OCaml view emits `left-sidebar-inner` with
/// the same DOM tree web/electron render; that subtree doubles as the data
/// model (item node ids, classes, attrs stay intact) while the render here
/// is a native macOS sidebar. Clicks are emitted on the DOM item nodes via
/// `context.emit(on:)` so the OCaml handlers run unchanged — no OCaml
/// sidebar code is touched.
struct LogseqNativeSidebar: View {
  let context: LUIAppleExtensionViewContext
  /// Local disclosure state keyed by the content-group node id. Upstream
  /// doesn't drive collapse (web's `.hd` has no click handler), so this is
  /// view-local like a macOS sidebar's own expand memory.
  @State private var collapsed: Set<Int> = []
  /// List selection doubles as the active-row highlight (system pill);
  /// synced from the DOM `active` class and cleared nowhere — re-taps
  /// re-emit are not needed since navigating to the current page is a
  /// no-op upstream.
  @State private var selection: Int?

  private struct Item: Identifiable {
    let nodeID: Int
    let title: String
    let icon: String
    let shortcuts: [String]
    let active: Bool
    let actionsNodeID: Int?
    var id: Int { nodeID }
  }

  private struct Section: Identifiable {
    let nodeID: Int
    let title: String
    let collapsible: Bool
    let moreNodeID: Int?
    let items: [Item]
    var id: Int { nodeID }
  }

  var body: some View {
    let model = read()
    let activeID =
      model.sections.lazy.flatMap(\.items).first(where: \.active)?.nodeID
    List(selection: $selection) {
      SwiftUI.Section {
        graphRow(model)
      }
      ForEach(model.sections) { section in
        SwiftUI.Section {
          if !collapsed.contains(section.nodeID) {
            ForEach(section.items) { item in
              SidebarItemRow(item: item, context: context)
                .tag(item.nodeID)
            }
          }
        } header: {
          sectionHeader(section)
        }
      }
    }
    .listStyle(.sidebar)
    .background {
      // Mount the DOM subtree invisibly: mount/unmount emitters still fire
      // and node models stay live for emits — the tree is the data source.
      VStack(spacing: 0) {
        ForEach(context.childIDs, id: \.self) { childID in
          context.content(for: childID)
        }
      }
      .frame(width: 0, height: 0)
      .opacity(0)
      .clipped()
      .allowsHitTesting(false)
      .accessibilityHidden(true)
    }
    .onChange(of: activeID) { _, new in
      selection = new
    }
    .onChange(of: selection) { _, sel in
      // Arrow keys and clicks both land here (native List selection);
      // skip the emit when selection is the already-active page.
      guard let sel, sel != activeID else { return }
      emitClick(
        sel,
        extra: ["shiftKey": NSEvent.modifierFlags.contains(.shift)])
    }
  }

  /// ls-icon/tabler names -> SF symbols (Out's vocabulary).
  private func sfSymbol(for icon: String) -> String {
    switch icon {
    case "calendar": return "calendar"
    case "cards": return "rectangle.on.rectangle"
    case "files": return "doc.text"
    case "hierarchy", "topology-star":
      return "point.3.connected.trianglepath.dotted"
    case "pin", "pinned": return "pin"
    case "circle-check", "checkbox": return "checkmark.square"
    case "photo", "asset": return "photo"
    case "hash", "tag": return "number"
    case "star": return "star"
    case "search": return "magnifyingglass"
    default: return "doc.text"
    }
  }

  // MARK: - DOM -> model

  private func classes(_ n: Int) -> String {
    if case let .string(s)? = context.childProperty(node: n, "style-class") {
      return s
    }
    return ""
  }

  private func hasClass(_ n: Int, _ name: String) -> Bool {
    classes(n).split(separator: " ").contains { $0 == name }
  }

  private func textProp(_ n: Int) -> String {
    if case let .string(s)? = context.childProperty(node: n, "text") {
      return s
    }
    return ""
  }

  private func tag(_ n: Int) -> String {
    String((context.extensionIdentifier(of: n) ?? "").dropFirst(7))
  }

  /// Breadth-first descendants (reading children/properties subscribes the
  /// view to each node's @Observable model, so patch batches re-run this).
  private func descendants(_ n: Int) -> [Int] {
    var out: [Int] = []
    var queue = context.childIDs(of: n)
    var i = 0
    while i < queue.count {
      let c = queue[i]
      out.append(c)
      queue.append(contentsOf: context.childIDs(of: c))
      i += 1
    }
    return out
  }

  private func iconName(_ n: Int) -> String {
    for cls in classes(n).split(separator: " ") {
      if cls.hasPrefix("ls-icon-") { return String(cls.dropFirst(8)) }
      if cls.hasPrefix("ti-") { return String(cls.dropFirst(3)) }
      if cls.hasPrefix("tie-") { return String(cls.dropFirst(4)) }
    }
    return ""
  }

  private struct Model {
    var graphTitle = ""
    var graphNodeID: Int?
    var sections: [Section] = []
  }

  private func read() -> Model {
    var m = Model()
    let all = descendants(context.nodeID)
    if let selector = all.first(where: { hasClass($0, "cp__graphs-selector") }) {
      let sd = descendants(selector)
      if let anchor = sd.first(where: { tag($0) == "a" }) {
        m.graphNodeID = anchor
      }
      if let name = sd.first(where: { tag($0) == "strong" }) {
        m.graphTitle = textProp(name)
      }
    }
    m.sections = all.filter { hasClass($0, "sidebar-content-group") }
      .map { group in
        let gd = descendants(group)
        let title =
          gd.first(where: {
            hasClass($0, "wrap-th")
              && tag($0) == "a"
          })
          .flatMap { wrapA in
            descendants(wrapA).first(where: { tag($0) == "strong" })
          }
          .map(textProp) ?? ""
        let more = gd.first(where: { hasClass($0, "as-edit") })
        let items = gd.filter {
          let c = classes($0)
          return tag($0) == "a"
            && (c.contains("item group") || c.contains("link-item group"))
        }.map { a in
          let ad = descendants(a)
          let title =
            ad.first(where: {
              hasClass($0, "page-title") || hasClass($0, "flex-1")
            }).map(textProp) ?? ""
          let icon = ad.lazy.map(iconName).first(where: { !$0.isEmpty }) ?? ""
          let shortcuts = ad.filter { tag($0) == "kbd" }.map(textProp)
          return Item(
            nodeID: a, title: title, icon: icon, shortcuts: shortcuts,
            active: hasClass(a, "active"),
            actionsNodeID: ad.first(where: {
              hasClass($0, "sidebar-page-actions")
            }))
        }
        return Section(
          nodeID: group, title: title,
          collapsible: !gd.contains(where: { hasClass($0, "non-collapsable") }),
          moreNodeID: more, items: items)
      }
    return m
  }

  // MARK: - emits

  /// Same wire shape as LogseqElementView.emit's element clicks: a
  /// `dom-event` carrying inner name "click" + JSON payload. `target`
  /// defaults to the emitted node but can be a descendant (the dots
  /// button) — document listeners closest() on it for menu exclusions.
  private func emitClick(
    _ nodeID: Int, target targetNodeID: Int? = nil,
    extra: [String: Any] = [:]
  ) {
    var payload = extra
    payload["nodeId"] = nodeID
    payload["button"] = payload["button"] ?? 0
    payload["target"] = LogseqDOMSnapshot.snapshot(
      of: targetNodeID ?? nodeID, context: context)
    guard let data = try? JSONSerialization.data(withJSONObject: payload),
      let json = String(data: data, encoding: .utf8)
    else { return }
    try? context.emit(
      on: nodeID, name: "dom-event",
      values: ["name": .string("click"), "payload": .string(json)])
  }

  // MARK: - rows

  /// Out-style graph switcher row: secondary SF icon + headline title +
  /// switch chevron; the whole row emits on the DOM graphs-selector
  /// anchor (upstream opens the graphs dialog).
  private func graphRow(_ m: Model) -> some View {
    HStack(spacing: 6) {
      Image(systemName: "point.3.connected.trianglepath.dotted")
        .foregroundStyle(.secondary)
      Text(m.graphTitle).font(.headline).lineLimit(1)
      Spacer(minLength: 0)
      Image(systemName: "chevron.up.chevron.down")
        .foregroundStyle(.secondary)
    }
    .contentShape(Rectangle())
    .onTapGesture {
      if let id = m.graphNodeID { emitClick(id) }
    }
  }

  /// Out's CollapsibleHeader: plain title, trailing chevron (rotates on
  /// collapse); the optional "…" sits before it (nav-edit menu anchor).
  private func sectionHeader(_ s: Section) -> some View {
    HStack(spacing: 4) {
      Text(s.title)
      Spacer(minLength: 0)
      if let more = s.moreNodeID {
        Image(systemName: "ellipsis")
          .font(.system(size: 11))
          .foregroundStyle(.secondary)
          .frame(width: 18, height: 18)
          .contentShape(Rectangle())
          .highPriorityGesture(
            SpatialTapGesture(coordinateSpace: .named("logseqWindow"))
              .onEnded { v in
                emitClick(
                  more,
                  extra: [
                    "clientX": Double(v.location.x),
                    "clientY": Double(v.location.y),
                  ])
              })
      }
      if s.collapsible {
        Image(systemName: "chevron.down")
          .font(.caption2.weight(.bold))
          .rotationEffect(
            .degrees(collapsed.contains(s.nodeID) ? -90 : 0))
      }
    }
    .contentShape(Rectangle())
    .onTapGesture {
      guard s.collapsible else { return }
      if collapsed.contains(s.nodeID) {
        collapsed.remove(s.nodeID)
      } else {
        collapsed.insert(s.nodeID)
      }
    }
  }

  private struct SidebarItemRow: View {
    let item: Item
    let context: LUIAppleExtensionViewContext
    @State private var hovering = false

    var body: some View {
      HStack(spacing: 0) {
        Label(item.title, systemImage: sfSymbol(for: item.icon))
          .lineLimit(1)
          .truncationMode(.tail)
        Spacer(minLength: 4)
        ForEach(item.shortcuts, id: \.self) { key in
          Text(key)
            .font(.system(size: 10, design: .monospaced))
            .foregroundStyle(.secondary)
        }
        if let actionsID = item.actionsNodeID, hovering {
          Image(systemName: "ellipsis")
            .font(.system(size: 11))
            .foregroundStyle(.secondary)
            .frame(width: 20, height: 20)
            .contentShape(Rectangle())
            .highPriorityGesture(
              SpatialTapGesture(coordinateSpace: .named("logseqWindow"))
                .onEnded { v in
                  emit(
                    target: actionsID,
                    extra: [
                      "targetClass": "sidebar-page-actions",
                      "clientX": Double(v.location.x),
                      "clientY": Double(v.location.y),
                      "shiftKey": false,
                    ])
                })
        }
      }
      .onHover { hovering = $0 }
    }

    private func sfSymbol(for icon: String) -> String {
      switch icon {
      case "calendar": return "calendar"
      case "cards": return "rectangle.on.rectangle"
      case "files": return "doc.text"
      case "hierarchy", "topology-star":
        return "point.3.connected.trianglepath.dotted"
      case "pin", "pinned": return "pin"
      case "circle-check", "checkbox": return "checkmark.square"
      case "photo", "asset": return "photo"
      case "hash", "tag": return "number"
      case "star": return "star"
      case "search": return "magnifyingglass"
      default: return "doc.text"
      }
    }

    private func emit(target targetNodeID: Int? = nil, extra: [String: Any]) {
      var payload = extra
      payload["nodeId"] = item.nodeID
      payload["button"] = 0
      payload["target"] = LogseqDOMSnapshot.snapshot(
        of: targetNodeID ?? item.nodeID, context: context)
      guard let data = try? JSONSerialization.data(withJSONObject: payload),
        let json = String(data: data, encoding: .utf8)
      else { return }
      try? context.emit(
        on: item.nodeID, name: "dom-event",
        values: ["name": .string("click"), "payload": .string(json)])
    }
  }
}
