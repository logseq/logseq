import AppKit
import Foundation
import LUIAppleBackend
import SwiftUI

/// Bridge between the DOM sidebar subtree and the window's
/// NavigationSplitView column: `left-sidebar-inner` registers its context
/// here (LogseqSidebarMount) and its `cp__sidebar-left-layout` parent
/// drives `open` from the DOM `is-open` class. The App-level split view
/// renders LogseqNativeSidebar in the column from this store.
@MainActor final class LogseqSidebarStore: ObservableObject {
  static let shared = LogseqSidebarStore()
  @Published var context: LUIAppleExtensionViewContext?
  @Published var open = false
}

/// Zero-size mount for `left-sidebar-inner` inside the detail pane — the
/// real sidebar renders in the split-view column; this keeps the DOM
/// subtree's emitters live and registers the context for the column.
struct LogseqSidebarMount: View {
  let context: LUIAppleExtensionViewContext

  var body: some View {
    let _ = context.revision
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
    .onAppear {
      LogseqSidebarStore.shared.context = context
      if ProcessInfo.processInfo.environment["LOGSEQ_DUMP"] != nil {
        try? "{\"nodeID\":\(context.nodeID)}".write(
          toFile: "/tmp/sidebar-mount.json", atomically: true,
          encoding: .utf8)
      }
    }
    .onDisappear {
      if LogseqSidebarStore.shared.context?.nodeID == context.nodeID {
        LogseqSidebarStore.shared.context = nil
      }
    }
  }
}

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

  /// Theme flips bump appearanceVersion — colors resolve per body eval.
  @ObservedObject private var appState = LogseqAppState.shared

  private struct Item: Identifiable {
    let nodeID: Int
    let title: String
    let icon: String
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
    // Keep the model reads below subscribed on their own — the DOM subtree
    // lookup is untracked, so a dropped parent re-render must not strand us.
    let _ = context.revision
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
          return Item(
            nodeID: a, title: title, icon: icon,
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
    .accessibilityLabel("Switch graph")
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
                let p = LogseqFrameStore.surfacePoint(v.location)
                emitClick(
                  more,
                  extra: [
                    "clientX": Double(p.x),
                    "clientY": Double(p.y),
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
        if let actionsID = item.actionsNodeID, hovering {
          Image(systemName: "ellipsis")
            .font(.system(size: 11))
            .foregroundStyle(.secondary)
            .frame(width: 20, height: 20)
            .contentShape(Rectangle())
            .highPriorityGesture(
              SpatialTapGesture(coordinateSpace: .named("logseqWindow"))
                .onEnded { v in
                  let p = LogseqFrameStore.surfacePoint(v.location)
                  emit(
                    target: actionsID,
                    extra: [
                      "targetClass": "sidebar-page-actions",
                      "clientX": Double(p.x),
                      "clientY": Double(p.y),
                      "shiftKey": false,
                    ])
                })
        }
      }
      .onHover { hovering = $0 }
      .overlay(LogseqSidebarContextMenu(item: item, context: context))
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

  /// Right-click passthrough for the native column: the global
  /// right-click monitor resolves hits through the DOM frame store,
  /// which has no entries for sidebar rows — this NSView emits the DOM
  /// `contextmenu` on the row's node so OCaml opens its own lp menu at
  /// the click point. It only claims rightMouseDown; left clicks pass
  /// through to the row.
  private struct LogseqSidebarContextMenu: NSViewRepresentable {
    let item: Item
    let context: LUIAppleExtensionViewContext

    func makeNSView(context _: Context) -> Catcher {
      Catcher(item: item, ext: self.context)
    }

    func updateNSView(_ nsView: Catcher, context _: Context) {
      nsView.item = item
    }

    final class Catcher: NSView {
      var item: Item
      let ext: LUIAppleExtensionViewContext

      init(item: Item, ext: LUIAppleExtensionViewContext) {
        self.item = item
        self.ext = ext
        super.init(frame: .zero)
      }

      @available(*, unavailable)
      required init?(coder _: NSCoder) { fatalError() }

      override func hitTest(_: NSPoint) -> NSView? {
        NSApp.currentEvent?.type == .rightMouseDown ? self : nil
      }

      override func rightMouseDown(with event: NSEvent) {
        guard let window, let contentView = window.contentView
        else { return }
        let point = LogseqFrameStore.surfacePoint(
          LogseqPlatform.windowPoint(event, in: contentView))
        var payload: [String: Any] = [
          "clientX": Double(point.x), "clientY": Double(point.y),
          "button": 2, "nodeId": item.nodeID,
        ]
        payload["target"] = LogseqDOMSnapshot.snapshot(
          of: item.nodeID, context: ext)
        guard
          let data = try? JSONSerialization.data(withJSONObject: payload),
          let json = String(data: data, encoding: .utf8)
        else { return }
        try? ext.emit(
          on: item.nodeID, name: "dom-event",
          values: ["name": .string("contextmenu"), "payload": .string(json)])
      }
    }
  }
}

/// Right sidebar `.resizer` — the OCaml element is a static separator
/// (aria-valuenow is fixed); the web stores width client-side, so the drag
/// lives in native view state (LogseqRightSidebarLayout) and the sidebar's
/// fixedWidth reads it back.
struct LogseqSidebarResizer: View {
  @State private var dragStart: CGFloat?

  var body: some View {
    Rectangle()
      .fill(LogseqColors.border)
      .frame(width: 3)
      .frame(maxHeight: .infinity)
      .padding(.trailing, 7)
      .contentShape(Rectangle())
      .onHover { inside in
        if inside { NSCursor.resizeLeftRight.push() } else { NSCursor.pop() }
      }
      .gesture(
        DragGesture()
          .onChanged { value in
            let start = dragStart ?? {
              dragStart = LogseqRightSidebarLayout.shared.width
              return LogseqRightSidebarLayout.shared.width
            }()
            let limit = (NSApp.keyWindow?.frame.width ?? 1200) * 0.7
            LogseqRightSidebarLayout.shared.width =
              min(max(start - value.translation.width, 240), limit)
          }
          .onEnded { _ in dragStart = nil })
  }
}
