import AppKit
import Foundation
import LUIAppleBackend
import OSLog
import SwiftUI

/// One live native view backing an OCaml-side DOM element. Views register
/// themselves by their DOM `id` attr so imperative dom-ops (focus, set-value,
/// class toggles) can reach them.
@MainActor protocol LogseqElement: AnyObject {
  /// Placeholder handles (the per-element registration's default
  /// `LogseqElementHandle`) may fill an empty slot but never replace a
  /// handle that implements real dom-ops — mount order between the
  /// registration view's onAppear and NSViewRepresentable makeNSView is
  /// not guaranteed, and the placeholder would otherwise clobber the
  /// coordinator the ops are meant to reach.
  var isPlaceholder: Bool { get }
  func domFocus()
  func domSetValue(_ value: String)
  func domSetTextContent(_ text: String)
  func domSetAttribute(_ name: String, _ value: String?)
  func domClassAdd(_ name: String)
  func domClassRemove(_ name: String)
  func domSetClass(_ name: String)
  func domScrollIntoView()
  func domSetSelectionRange(_ start: Int, _ end: Int)
  func domRemove()
}

extension LogseqElement {
  var isPlaceholder: Bool { false }
  /// nodeID of the element this handle fronts, when the handle knows
  /// it — lets ref-resolved dom-ops emit dom-events on the element's
  /// own context without a full LogseqElement implementation.
  var emitNodeID: Int? { nil }
  func domFocus() {}
  func domSetValue(_ value: String) {}
  func domSetTextContent(_ text: String) {}
  func domSetAttribute(_ name: String, _ value: String?) {}
  func domClassAdd(_ name: String) {}
  func domClassRemove(_ name: String) {}
  func domSetClass(_ name: String) {}
  func domScrollIntoView() {}
  func domSetSelectionRange(_ start: Int, _ end: Int) {}
  func domRemove() {}
}

/// Runtime `style` mutations from dom-ops (`element.style.setProperty` on
/// the web). OCaml re-emits the `style` attr on its own schedule; these
/// declarations merge on top of it at render time, exactly where the
/// popup flip's --available-height lift lands. A re-emitted `style` attr
/// supersedes earlier mutations — web/React writes the new inline style
/// over them — so decls are keyed to the emitted style they were added on.
/// Per-node override record. Views read this object's fields inside body,
/// so each element subscribes to its own entry only — a dict-wide
/// @Published store re-evaluated every element in the tree on any write.
@Observable @MainActor final class LogseqStyleOverride {
  var decls: [String] = []
  var signature = ""
}

@MainActor final class LogseqStyleOverrides {
  static let shared = LogseqStyleOverrides()
  /// Not @Observable itself: liveDecls hands out the per-node object, and
  /// only writes to that object invalidate the element that reads it.
  private var entries: [Int: LogseqStyleOverride] = [:]

  private func entry(for nodeID: Int) -> LogseqStyleOverride {
    if let o = entries[nodeID] { return o }
    let o = LogseqStyleOverride()
    entries[nodeID] = o
    return o
  }

  func add(nodeID: Int, emitted: String, _ decl: String) {
    let o = entry(for: nodeID)
    if o.signature != emitted {
      o.decls = []
      o.signature = emitted
    }
    o.decls.append(decl)
  }

  func liveDecls(for nodeID: Int, emitted: String) -> [String] {
    let o = entry(for: nodeID)
    guard o.signature == emitted else { return [] }
    return o.decls
  }

  func clear(_ nodeID: Int) {
    // Emptying the entry (not removing it) notifies that node's readers;
    // the dict entry then evicts so the next liveDecls starts fresh.
    guard let o = entries[nodeID] else { return }
    o.decls = []
    o.signature = ""
    entries.removeValue(forKey: nodeID)
  }
}

@MainActor final class LogseqElementRegistry {
  static let shared = LogseqElementRegistry()
  private var elements: [String: NSReferenceBox] = [:]
  /// A long-lived extension context used to emit lifecycle events for
  /// nodes whose own context is already dead (drop-node during reconcile).
  /// `app-container` is the stable root — it outlives everything below it.
  var eventAnchor: LUIAppleExtensionViewContext?
  /// Live nodeID → extension context, so window-level hit resolution
  /// (right-click → contextmenu) can emit through the hit node's context.
  private var contexts: [Int: LUIAppleExtensionViewContext] = [:]

  /// dom-op dispatch hooks this so ops parked on an unmounted ref fire the
  /// moment the element registers (instead of a timer retry loop).
  var onElementRegistered: ((String) -> Void)?

  func register(_ id: String, _ element: LogseqElement) {
    if element.isPlaceholder, let existing = elements[id]?.object, !existing.isPlaceholder {
      return
    }
    elements[id] = NSReferenceBox(element)
    if ProcessInfo.processInfo.environment["LOGSEQ_PERF"] != nil,
      id.hasPrefix("edit-block-")
    {
      FileHandle.standardError.write(
        "PERF reg t=\(CFAbsoluteTimeGetCurrent()) id=\(id)\n"
          .data(using: .utf8)!)
    }
    onElementRegistered?(id)
  }

  func registerAnchor(_ id: String, _ context: LUIAppleExtensionViewContext) {
    if id == "app-container" || eventAnchor == nil { eventAnchor = context }
  }

  func registerContext(_ context: LUIAppleExtensionViewContext) {
    contexts[context.nodeID] = context
  }

  func unregisterContext(_ nodeID: Int) {
    contexts[nodeID] = nil
  }

  func context(forNode nodeID: Int) -> LUIAppleExtensionViewContext? {
    contexts[nodeID]
  }

  func unregister(_ id: String) {
    elements[id] = nil
  }

  func element(_ id: String) -> LogseqElement? {
    elements[id]?.object
  }
}

/// Holds the dom-op handle strongly: default `LogseqElementHandle`s have no
/// other owner, so a weak box leaves `element(_:)` returning nil almost
/// immediately after registration. Unmount `unregister` drops the entry.
final class NSReferenceBox {
  var object: LogseqElement?
  init(_ object: LogseqElement) { self.object = object }
}

/// Live `ScrollViewReader` proxies keyed by the scrollable element's node
/// id, so dom-ops can scroll a child row into view (AC chosen-item
/// scroll). Scrollable elements register their proxy in `styledContainer`.
@MainActor final class LogseqScrollProxyStore {
  static let shared = LogseqScrollProxyStore()
  private var proxies: [Int: ScrollViewProxy] = [:]

  func set(_ nodeID: Int, _ proxy: ScrollViewProxy?) {
    proxies[nodeID] = proxy
  }

  func proxy(for nodeID: Int) -> ScrollViewProxy? {
    proxies[nodeID]
  }
}

/// Handles "<op>\n<payload>" envelopes from OCaml's Host.host_op plus
/// window/appearance events the OCaml side expects on the platform channel.
@MainActor final class LogseqPlatform {
  weak var runtime: LogseqRuntime?
  private var appearanceObservation: NSKeyValueObservation?
  private var keyMonitor: Any?
  /// DOM id of the most recently focus-op'ed element + when. While a
  /// `LogseqBlockTextView` that isn't this one still holds first
  /// responder, plain keys belong to the block OCaml is focusing — the
  /// stale textview would eat them during a split/remount gap.
  static var lastFocusRequest: (id: String, at: Date)?
  private var contextMenuMonitor: Any?
  private var mouseMonitor: Any?
  private var mouseDownMonitor: Any?
  private var mouseUpMonitor: Any?
  private var lastMouseHitNode: Int?
  private var windowSizeTimer: Timer?
  private let logger = Logger(subsystem: "com.logseq.native", category: "platform")

  func attach() {
    pushAppearance()
    pushWindowSize()
    LogseqElementRegistry.shared.onElementRegistered = { [weak self] id in
      self?.drainPendingDomOps(id)
    }
    appearanceObservation = NSApp.observe(\.effectiveAppearance) { [weak self] _, _ in
      Task { @MainActor in self?.pushAppearance() }
    }
    // didResizeNotification fires continuously while dragging the
    // resize handle; debounce so OCaml only hears about the settled
    // size. `Timer.scheduledTimer` lives in the default runloop mode,
    // so during live resize tracking it only fires once the drag
    // releases — exactly the debounce window.
    NotificationCenter.default.addObserver(
      forName: NSWindow.didResizeNotification, object: nil, queue: .main
    ) { [weak self] _ in
      guard let self else { return }
      self.windowSizeTimer?.invalidate()
      self.windowSizeTimer = Timer.scheduledTimer(
        withTimeInterval: 0.15, repeats: false
      ) { [weak self] _ in
        Task { @MainActor in self?.pushWindowSize() }
      }
    }
    // Document-level keydown: web dispatches DOM keydown to document
    // listeners for every key; the native side only emits from the text
    // controls while they are first responder. Forward window-level keys
    // the same way so global handlers (cmdk open, Escape menus, mod
    // chords) fire regardless of focus. Chords the OS/editing owns are
    // left alone; plain keys while a text control is focused also stay
    // local to avoid double-dispatch with the field's own emit path.
    keyMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) {
      [weak self] event in
      guard let self else { return event }
      let editing = event.window?.firstResponder is NSTextView
        || event.window?.firstResponder is NSTextField
      let chord =
        event.modifierFlags.contains(.command)
        || event.modifierFlags.contains(.control)
      if editing && !chord {
        // A different block's textview still owns the first responder
        // while OCaml's focus request lands — route the key through the
        // platform path so it reaches the block being entered instead
        // of dying in the stale view.
        if let tv = event.window?.firstResponder as? LogseqBlockTextView,
          let req = LogseqPlatform.lastFocusRequest,
          Date().timeIntervalSince(req.at) < 0.5,
          tv.domID != req.id
        {
          self.sendKeyDown(event)
          return nil
        }
        return event
      }
      let char = (event.charactersIgnoringModifiers ?? "").lowercased()
      let shift = event.modifierFlags.contains(.shift)
      // Chords the OS/AppKit owns stay native — quit/close/hide always;
      // clipboard keys only while a text control is editing, and only
      // the plain chord (shift variants are Logseq commands, as are
      // block-selection copies when not editing). Everything else —
      // mod+z/a included — reaches OCaml so outliner undo/redo,
      // select-parent/all and block copy/cut actually fire.
      if chord {
        if ["q", "w", "h"].contains(char) {
          return event
        }
        if editing && !shift && ["c", "v", "x"].contains(char) {
          return event
        }
        if char == "v" && !shift {
          // The block textarea never holds the first responder — ⌘V
          // would die in OCaml's keymap, which has no mod+v binding.
          // Synthesize the web `paste` event instead: file URLs and
          // image data go to the asset-upload path, plain text splices
          // via paste_blocks.
          var cb: [String: Any] = [:]
          if let files = LogseqPasteboard.files() { cb["files"] = files }
          if let plain = NSPasteboard.general.string(forType: .string) {
            cb["text"] = plain
          }
          if !cb.isEmpty,
            let data = try? JSONSerialization.data(
              withJSONObject: ["clipboardData": cb]),
            let json = String(data: data, encoding: .utf8)
          {
            runtime?.sendPlatformEvent(name: "paste", json: json)
          }
          return nil
        }
      }
      self.sendKeyDown(event)
      return chord ? nil : event
    }
    // DOM contextmenu: SwiftUI has no right-click gesture, so resolve the
    // hit from the frame registry and emit through the hit node's context —
    // OCaml's document listener does closest(.ls-block/.block-tag) on the
    // payload's ancestor chain and opens its own menu at clientX/Y.
    // The event is consumed (no default menu) except over text inputs,
    // where the NSTextView edit menu still applies.
    contextMenuMonitor = NSEvent.addLocalMonitorForEvents(matching: .rightMouseDown) {
      event in
      guard let window = event.window, let contentView = window.contentView
      else { return event }
      let point = LogseqPlatform.windowPoint(event, in: contentView)
      guard let hit = LogseqFrameStore.hitTest(point) else { return event }
      if hit.tag == "textarea" || hit.tag == "input" { return event }
      LogseqPlatform.emitContextMenu(nodeID: hit.nodeID, point: point)
      return nil
    }
    // DOM mousemove at node granularity — the OCaml listeners only need
    // which element the pointer is over (context-menu submenu hovers,
    // ref preview arming), so emit once per entered node rather than per
    // pixel. The event is never consumed.
    mouseMonitor = NSEvent.addLocalMonitorForEvents(matching: .mouseMoved) {
      [weak self] event in
      guard let self,
        let window = event.window, let contentView = window.contentView
      else { return event }
      let point = LogseqPlatform.windowPoint(event, in: contentView)
      guard let hit = LogseqFrameStore.hitTest(point, prefer: lastMouseHitNode),
        let context = LogseqElementRegistry.shared.context(forNode: hit.nodeID)
      else { return event }
      if hit.nodeID == lastMouseHitNode { return event }
      lastMouseHitNode = hit.nodeID
      LogseqPlatform.emitMouseMove(context: context, nodeID: hit.nodeID, point: point)
      return event
    }
    // DOM mousedown: web dismisses popups/menus on a document mousedown
    // outside them, so emit through the hit node's context the same way
    // contextmenu does. The event is never consumed — SwiftUI still
    // delivers the click itself.
    mouseDownMonitor = NSEvent.addLocalMonitorForEvents(matching: .leftMouseDown) {
      event in
      guard let window = event.window, let contentView = window.contentView
      else { return event }
      let point = LogseqPlatform.windowPoint(event, in: contentView)
      let hit = LogseqFrameStore.hitTest(point)
      guard let hit,
        let context = LogseqElementRegistry.shared.context(forNode: hit.nodeID)
      else { return event }
      LogseqPlatform.emitMouseDown(context: context, nodeID: hit.nodeID, point: point)
      return event
    }
    // DOM click: SwiftUI taps only emit from views carrying their own
    // gesture, so clicks on plain content (block text, empty rows,
    // container padding) never reach the document click listeners the
    // web relies on — a leftMouseUp over a hit emits "click" for every
    // element. Deferred one runloop tick so an element's own gesture
    // emit lands first and wins OCaml's click coalescing. The event is
    // never consumed.
    mouseUpMonitor = NSEvent.addLocalMonitorForEvents(matching: .leftMouseUp) {
      event in
      guard let window = event.window, let contentView = window.contentView
      else { return event }
      let point = LogseqPlatform.windowPoint(event, in: contentView)
      guard let hit = LogseqFrameStore.hitTest(point),
        let context = LogseqElementRegistry.shared.context(forNode: hit.nodeID)
      else { return event }
      runOnMainDeferred {
        LogseqPlatform.emitClick(context: context, nodeID: hit.nodeID, point: point)
      }
      return event
    }
  }

  func detach() {
    appearanceObservation?.invalidate()
    appearanceObservation = nil
    if let keyMonitor {
      NSEvent.removeMonitor(keyMonitor)
      self.keyMonitor = nil
    }
    if let contextMenuMonitor {
      NSEvent.removeMonitor(contextMenuMonitor)
      self.contextMenuMonitor = nil
    }
    if let mouseMonitor {
      NSEvent.removeMonitor(mouseMonitor)
      self.mouseMonitor = nil
    }
    if let mouseDownMonitor {
      NSEvent.removeMonitor(mouseDownMonitor)
      self.mouseDownMonitor = nil
    }
    if let mouseUpMonitor {
      NSEvent.removeMonitor(mouseUpMonitor)
      self.mouseUpMonitor = nil
    }
  }

  /// `event.locationInWindow` into the top-left-origin space the frame
  /// store reports in (`.named("logseqWindow")`). `convert(_:from:)`
  /// honors the content view's flippedness — flip only when it doesn't.
  private static func windowPoint(_ event: NSEvent, in contentView: NSView)
    -> CGPoint
  {
    let p = contentView.convert(event.locationInWindow, from: nil)
    return contentView.isFlipped
      ? CGPoint(x: p.x, y: p.y)
      : CGPoint(x: p.x, y: contentView.bounds.height - p.y)
  }

  private static func emitContextMenu(nodeID: Int, point: CGPoint) {
    if ProcessInfo.processInfo.environment["LOGSEQ_DUMP"] != nil {
      var dbg: [String: Any] = [
        "nodeId": nodeID, "x": point.x, "y": point.y,
        "hasContext": LogseqElementRegistry.shared.context(forNode: nodeID)
          != nil,
      ]
      if let f = LogseqFrameStore.entries[nodeID] {
        dbg["frame"] = [
          f.rect.origin.x, f.rect.origin.y,
          f.rect.width, f.rect.height,
        ]
      }
      if let ctx = LogseqElementRegistry.shared.context(forNode: nodeID),
        case .string(let cls) = ctx.childProperty(
          node: nodeID, "style-class")
      {
        dbg["cls"] = cls
      }
      try? JSONSerialization.data(withJSONObject: dbg)
        .write(to: URL(fileURLWithPath: "/tmp/cm-hit.json"))
    }
    guard let context = LogseqElementRegistry.shared.context(forNode: nodeID)
    else { return }
    var payload: [String: Any] = [
      "clientX": Double(point.x),
      "clientY": Double(point.y),
      "button": 2,
      "nodeId": nodeID,
    ]
    payload["target"] = LogseqDOMSnapshot.snapshot(of: nodeID, context: context)
    guard
      let data = try? JSONSerialization.data(withJSONObject: payload),
      let json = String(data: data, encoding: .utf8)
    else { return }
    if ProcessInfo.processInfo.environment["LOGSEQ_DUMP"] != nil {
      try? data.write(to: URL(fileURLWithPath: "/tmp/cm-target.json"))
    }
    try? context.emit(
      name: "dom-event",
      values: ["name": .string("contextmenu"), "payload": .string(json)])
  }

  private static func emitMouseMove(
    context: LUIAppleExtensionViewContext, nodeID: Int, point: CGPoint
  ) {
    if ProcessInfo.processInfo.environment["LOGSEQ_DUMP"] != nil {
      var dbg: [String: Any] = [
        "nodeId": nodeID, "x": point.x, "y": point.y,
      ]
      if let f = LogseqFrameStore.entries[nodeID] {
        dbg["frame"] = [
          f.rect.origin.x, f.rect.origin.y,
          f.rect.width, f.rect.height,
        ]
        dbg["z"] = f.z
      }
      if case .string(let cls) = context.childProperty(
        node: nodeID, "style-class")
      {
        dbg["cls"] = cls
      }
      try? JSONSerialization.data(withJSONObject: dbg)
        .write(to: URL(fileURLWithPath: "/tmp/mm-hit.json"))
    }
    var payload: [String: Any] = [
      "clientX": Double(point.x),
      "clientY": Double(point.y),
      "nodeId": nodeID,
    ]
    payload["target"] = LogseqDOMSnapshot.snapshot(of: nodeID, context: context)
    guard
      let data = try? JSONSerialization.data(withJSONObject: payload),
      let json = String(data: data, encoding: .utf8)
    else { return }
    try? context.emit(
      name: "dom-event",
      values: ["name": .string("mousemove"), "payload": .string(json)])
  }

  private static func emitClick(
    context: LUIAppleExtensionViewContext, nodeID: Int, point: CGPoint
  ) {
    // Mirrors the element emit()'s enrichment so a monitor-sourced click
    // is interchangeable with a gesture-sourced one.
    var payload: [String: Any] = [
      "clientX": Double(point.x),
      "clientY": Double(point.y),
      "button": 0,
      "nodeId": nodeID,
    ]
    if case .string(let classes) = context.childProperty(
      node: nodeID, "style-class")
    {
      payload["targetClass"] = classes
    }
    if case .string(let rawAttrs) = context.childProperty(
      node: nodeID, "attrs"),
      let attrsData = rawAttrs.data(using: .utf8),
      let attrsDict = try? JSONSerialization.jsonObject(with: attrsData)
        as? [String: Any],
      let targetId = attrsDict["id"] as? String
    {
      payload["targetId"] = targetId
    }
    payload["target"] = LogseqDOMSnapshot.snapshot(of: nodeID, context: context)
    guard
      let data = try? JSONSerialization.data(withJSONObject: payload),
      let json = String(data: data, encoding: .utf8)
    else { return }
    try? context.emit(
      name: "dom-event",
      values: ["name": .string("click"), "payload": .string(json)])
  }

  private static func emitMouseDown(
    context: LUIAppleExtensionViewContext, nodeID: Int, point: CGPoint
  ) {
    var payload: [String: Any] = [
      "clientX": Double(point.x),
      "clientY": Double(point.y),
      "button": 0,
      "nodeId": nodeID,
    ]
    payload["target"] = LogseqDOMSnapshot.snapshot(of: nodeID, context: context)
    guard
      let data = try? JSONSerialization.data(withJSONObject: payload),
      let json = String(data: data, encoding: .utf8)
    else { return }
    try? context.emit(
      name: "dom-event",
      values: ["name": .string("mousedown"), "payload": .string(json)])
  }

  private func sendKeyDown(_ event: NSEvent) {
    var key = event.charactersIgnoringModifiers?.lowercased() ?? ""
    var which = Int(event.keyCode)
    switch event.keyCode {
    case 36: key = "Enter"; which = 13
    case 48: key = "Tab"; which = 9
    case 51: key = "Backspace"; which = 8
    case 53: key = "Escape"; which = 27
    case 49: key = " "; which = 32
    case 117: key = "Delete"; which = 46
    case 115: key = "Home"; which = 36
    case 116: key = "End"; which = 35
    case 123: key = "ArrowLeft"; which = 37
    case 124: key = "ArrowRight"; which = 39
    case 125: key = "ArrowDown"; which = 40
    case 126: key = "ArrowUp"; which = 38
    default: break
    }
    let flags = event.modifierFlags
    let json =
      "{\"key\":\(jsonString(key)),\"which\":\(which)"
      + ",\"metaKey\":\(flags.contains(.command))"
      + ",\"ctrlKey\":\(flags.contains(.control))"
      + ",\"shiftKey\":\(flags.contains(.shift))"
      + ",\"altKey\":\(flags.contains(.option))}"
    runtime?.sendPlatformEvent(name: "keydown", json: json)
  }

  private func jsonString(_ s: String) -> String {
    let escaped = s
      .replacingOccurrences(of: "\\", with: "\\\\")
      .replacingOccurrences(of: "\"", with: "\\\"")
    return "\"\(escaped)\""
  }

  private func pushAppearance() {
    let dark = NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
    runtime?.sendPlatformEvent(name: "appearance", json: "{\"dark\":\(dark)}")
  }

  private func pushWindowSize() {
    guard let window = NSApp.keyWindow ?? NSApp.windows.first else { return }
    let size = window.frame.size
    runtime?.sendPlatformEvent(
      name: "window-size",
      json: "{\"width\":\(size.width),\"height\":\(size.height)}")
  }

  // MARK: - op dispatch

  func handle(op: String, payload: String) {
    switch op {
    case "dom-op":
      let split = payload.split(
        separator: "\n", maxSplits: 1, omittingEmptySubsequences: false)
      domOp(name: String(split.first ?? ""), json: split.count > 1 ? String(split[1]) : "")
    case "open-url":
      if let url = URL(string: payload) { NSWorkspace.shared.open(url) }
    case "clipboard", "clipboard-write":
      NSPasteboard.general.clearContents()
      NSPasteboard.general.setString(payload, forType: .string)
    case "ui-state":
      // OCaml mirrors the web's <html>/<body> document state here;
      // data.theme is the settings-page theme choice. Map it onto the
      // app appearance override so NSApp.effectiveAppearance (what every
      // LogseqColors.isDark read keys off) follows the setting instead
      // of only the system mode. Bumping appearanceVersion re-runs the
      // root view body — the palette is computed per body eval.
      let dict = jsonDict(payload)
      if let data = dict["data"] as? [String: Any],
        let theme = data["theme"] as? String
      {
        switch theme {
        case "dark": NSApp.appearance = NSAppearance(named: .darkAqua)
        case "light": NSApp.appearance = NSAppearance(named: .aqua)
        default: NSApp.appearance = nil
        }
        LogseqAppState.shared.appearanceVersion += 1
      }
    default:
      logger.debug("unhandled platform op: \(op)")
    }
  }

  // MARK: - dom-op

  private func jsonDict(_ text: String) -> [String: Any] {
    guard let data = text.data(using: .utf8),
      let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return [:] }
    return dict
  }

  /// The "ref" field of a dom-op payload is the OCaml element shell:
  /// {"#ref": "id"} (host registry id = the element's DOM id attr).
  private func refID(_ dict: [String: Any]) -> String? {
    guard let ref = dict["ref"] as? [String: Any] else { return nil }
    if let id = ref["#ref"] as? String { return id }
    if let id = ref["ref-id"] as? String { return id }
    return nil
  }

  private func target(_ dict: [String: Any]) -> LogseqElement? {
    guard let id = refID(dict) else { return nil }
    return LogseqElementRegistry.shared.element(id)
  }

  /// Element-targeted ops can arrive before SwiftUI mounts the fresh
  /// node — commit happens synchronously in OCaml but makeNSView
  /// registration lands on a later runloop turn. Ops whose ref isn't
  /// registered yet park here; `register()` drains them the moment the
  /// element exists (plus one timer fallback for stragglers). Queued by
  /// ref id so a batch of ops doesn't each spin a retry loop on the
  /// main queue.
  private var pendingDomOps: [String: [(name: String, dict: [String: Any])]] = [:]

  private func domOp(name: String, json: String) {
    domOpDict(name: name, dict: jsonDict(json))
  }

  private func drainPendingDomOps(_ id: String) {
    guard let ops = pendingDomOps.removeValue(forKey: id), !ops.isEmpty else {
      return
    }
    for op in ops {
      domOpDict(name: op.name, dict: op.dict, attempt: 1)
    }
  }

  private func domOpDict(name: String, dict: [String: Any], attempt: Int = 0) {
    if LogseqPerf.detail {
      let id = refID(dict) ?? "-"
      let hit = target(dict) != nil
      FileHandle.standardError.write(
        "PERF domop t=\(CFAbsoluteTimeGetCurrent()) name=\(name) ref=\(id) hit=\(hit) attempt=\(attempt)\n"
          .data(using: .utf8)!)
    }
    // pick-files runs without a mounted element: hidden file inputs
    // (e.g. #upload-file) never register, and the ref is only the pick's
    // report-back identifier.
    if dict["ref"] != nil, name != "pick-files", let id = refID(dict),
      target(dict) == nil
    {
      pendingDomOps[id, default: []].append((name, dict))
      if attempt == 0 {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
          // Elements that never materialized (stale refs) drop here.
          _ = self.pendingDomOps.removeValue(forKey: id)
        }
      }
      return
    }
    switch name {
    case "document-title":
      if let title = dict["title"] as? String {
        NSApp.windows.first?.title = title
      }
    case "focus":
      if let id = refID(dict) {
        LogseqPlatform.lastFocusRequest = (id, Date())
      }
      target(dict)?.domFocus()
    case "set-value":
      if let value = dict["value"] as? String { target(dict)?.domSetValue(value) }
    case "set-text-content":
      if let text = dict["text"] as? String { target(dict)?.domSetTextContent(text) }
    case "set-attr":
      if let attr = dict["name"] as? String {
        target(dict)?.domSetAttribute(attr, dict["value"] as? String)
      }
    case "remove-attr":
      if let attr = dict["name"] as? String {
        target(dict)?.domSetAttribute(attr, nil)
      }
    case "class-add":
      if let cls = dict["class"] as? String { target(dict)?.domClassAdd(cls) }
    case "class-remove":
      if let cls = dict["class"] as? String { target(dict)?.domClassRemove(cls) }
    case "set-class":
      if let cls = dict["class"] as? String { target(dict)?.domSetClass(cls) }
    case "scroll-into-view":
      target(dict)?.domScrollIntoView()
    case "scroll-row-into-view":
      // AC chosen-item scroll: `{scroller: el, row: el}` element
      // snapshots — scroll the row node inside the scroller's ScrollView.
      if let scroller = dict["scroller"] as? [String: Any],
        let scrollerID = (scroller["node-id"] as? NSNumber)?.intValue,
        let row = dict["row"] as? [String: Any],
        let rowID = (row["node-id"] as? NSNumber)?.intValue,
        let proxy = LogseqScrollProxyStore.shared.proxy(for: scrollerID)
      {
        proxy.scrollTo(rowID, anchor: .center)
      }
    case "measure-node":
      // Document-tree element snapshots carry no rect; OCaml's popup
      // flip/clamp measurements ask for the frame on demand and read the
      // pushed "node-rect" event on their next retry.
      if let ref = dict["ref"] as? [String: Any],
        let nodeID = (ref["node-id"] as? NSNumber)?.intValue
      {
        var body: [String: Any] = ["nodeId": nodeID]
        if let entry = LogseqFrameStore.entries[nodeID] {
          let r = entry.rect
          body["rect"] = [
            "left": Double(r.minX), "top": Double(r.minY),
            "right": Double(r.maxX), "bottom": Double(r.maxY),
            "width": Double(r.width), "height": Double(r.height),
          ]
        }
        if let data = try? JSONSerialization.data(withJSONObject: body),
          let json = String(data: data, encoding: .utf8)
        {
          runtime?.sendPlatformEvent(name: "node-rect", json: json)
        }
      }
    case "set-selection-range":
      let start = (dict["start"] as? NSNumber)?.intValue ?? 0
      let end = (dict["end"] as? NSNumber)?.intValue ?? start
      target(dict)?.domSetSelectionRange(start, end)
    case "style-set-property":
      if let ref = dict["ref"] as? [String: Any],
        let nodeID = (ref["node-id"] as? NSNumber)?.intValue,
        let prop = dict["property"] as? String,
        let value = dict["value"] as? String
      {
        let emitted =
          (ref["attrs"] as? [String: Any])?["style"] as? String ?? ""
        LogseqStyleOverrides.shared.add(
          nodeID: nodeID, emitted: emitted, "\(prop):\(value)")
      }
    case "remove":
      target(dict)?.domRemove()
    case "imperative-attach":
      // OCaml imperative_dom materialized a popup/menu node that has no
      // in-tree parent — render it in the window-level imperative layer.
      if let nodeID = (dict["nodeId"] as? NSNumber)?.intValue {
        LogseqImperativeStore.shared.attach(nodeID)
      }
    case "imperative-detach":
      if let nodeID = (dict["nodeId"] as? NSNumber)?.intValue {
        LogseqImperativeStore.shared.detach(nodeID)
      }
    case "download-text", "download-binary", "save-file":
      saveFile(name: name, dict: dict)
    case "pick-files":
      // NSOpenPanel for an input[type=file] — results report back as a
      // "file-picked" platform event (see LogseqFilePicker.report).
      guard let id = refID(dict) else { break }
      LogseqFilePicker.pick(
        id: id,
        accept: dict["accept"] as? String ?? "",
        multiple: dict["multiple"] as? Bool ?? false,
        directory: dict["directory"] as? Bool ?? false)
    case "snapshot-png":
      snapshotPNG(dict: dict)
    case "clipboard-write-png":
      if let path = dict["path"] as? String,
        let data = try? Data(contentsOf: URL(fileURLWithPath: path))
      {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setData(data, forType: .png)
      }
    case "save-file-binary":
      // copy an existing temp/rendered file out via NSSavePanel — used
      // by the export-view PNG download (text goes through saveFile).
      guard let path = dict["path"] as? String else { break }
      let filename = (dict["filename"] as? String)
        ?? (dict["name"] as? String) ?? "export"
      let panel = NSSavePanel()
      panel.nameFieldStringValue = filename
      panel.begin { response in
        guard response == .OK, let url = panel.url else { return }
        try? FileManager.default.copyItem(
          at: URL(fileURLWithPath: path), to: url)
      }
    case "dump-frames":
      let parts = LogseqFrameStore.entries.sorted(by: { $0.key < $1.key }).map {
        let r = $0.value.rect
        return "\"\($0.key)\":[\(r.origin.x),\(r.origin.y),\(r.width),\(r.height)]"
      }
      let out = "{" + parts.joined(separator: ",") + "}"
      try? out.write(
        toFile: "/tmp/frames.json", atomically: true, encoding: .utf8)
    case "open-icon-picker", "katex-pending", "hljs-pending":
      logger.debug("dom-op pending implementation: \(name)")
    default:
      logger.debug("unhandled dom-op: \(name)")
    }
  }

  /// Snapshot the window content region behind a node ref into a temp
  /// PNG — the native stand-in for export_page's html2canvas. Reports
  /// "snapshot-png-done" {req, path} on the platform event channel.
  private func snapshotPNG(dict: [String: Any]) {
    let req = (dict["req"] as? NSNumber)?.intValue ?? 0
    var nodeID: Int? = nil
    if let ref = dict["ref"] as? [String: Any] {
      nodeID = (ref["node-id"] as? NSNumber)?.intValue
    }
    if nodeID == nil {
      nodeID = target(dict)?.emitNodeID
    }
    let rect = nodeID.flatMap { LogseqFrameStore.entries[$0]?.rect }
    guard let window = NSApp.windows.first, let content = window.contentView
    else { return }
    let region = rect ?? content.bounds
    // frame-store rects are top-left-origin window points; NSView is
    // bottom-left unless flipped.
    let flipped = content.isFlipped
    let bounds =
      flipped
      ? region
      : CGRect(
        x: region.minX,
        y: content.bounds.height - region.minY - region.height,
        width: region.width, height: region.height)
    guard let rep = content.bitmapImageRepForCachingDisplay(in: bounds)
    else { return }
    content.cacheDisplay(in: bounds, to: rep)
    guard let png = rep.representation(using: .png, properties: [:]) else {
      return
    }
    let path =
      NSTemporaryDirectory() + "logseq-export-\(req).png"
    do {
      try png.write(to: URL(fileURLWithPath: path))
      if let data = try? JSONSerialization.data(withJSONObject: [
        "req": req, "path": path,
      ]), let json = String(data: data, encoding: .utf8)
      {
        runtime?.sendPlatformEvent(name: "snapshot-png-done", json: json)
      }
    } catch {}
  }

  private func saveFile(name: String, dict: [String: Any]) {
    let filename = (dict["filename"] as? String)
      ?? (dict["name"] as? String) ?? "export"
    guard let dataText = dict["text"] as? String ?? dict["data"] as? String else {
      return
    }
    let panel = NSSavePanel()
    panel.nameFieldStringValue = filename
    panel.begin { response in
      guard response == .OK, let url = panel.url else { return }
      try? dataText.write(to: url, atomically: true, encoding: .utf8)
    }
  }
}
