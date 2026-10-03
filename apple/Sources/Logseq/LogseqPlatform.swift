import AppKit
import Foundation
import LUIAppleBackend
import OSLog

/// One live native view backing an OCaml-side DOM element. Views register
/// themselves by their DOM `id` attr so imperative dom-ops (focus, set-value,
/// class toggles) can reach them.
@MainActor protocol LogseqElement: AnyObject {
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

@MainActor final class LogseqElementRegistry {
  static let shared = LogseqElementRegistry()
  private var elements: [String: NSWeakReferenceBox] = [:]
  /// A long-lived extension context used to emit lifecycle events for
  /// nodes whose own context is already dead (drop-node during reconcile).
  /// `app-container` is the stable root — it outlives everything below it.
  var eventAnchor: LUIAppleExtensionViewContext?
  /// Live nodeID → extension context, so window-level hit resolution
  /// (right-click → contextmenu) can emit through the hit node's context.
  private var contexts: [Int: LUIAppleExtensionViewContext] = [:]

  func register(_ id: String, _ element: LogseqElement) {
    elements[id] = NSWeakReferenceBox(element)
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

final class NSWeakReferenceBox {
  weak var object: LogseqElement?
  init(_ object: LogseqElement) { self.object = object }
}

/// Handles "<op>\n<payload>" envelopes from OCaml's Host.host_op plus
/// window/appearance events the OCaml side expects on the platform channel.
@MainActor final class LogseqPlatform {
  weak var runtime: LogseqRuntime?
  private var appearanceObservation: NSKeyValueObservation?
  private var keyMonitor: Any?
  private var contextMenuMonitor: Any?
  private var mouseMonitor: Any?
  private var mouseDownMonitor: Any?
  private var lastMouseHitNode: Int?
  private let logger = Logger(subsystem: "com.logseq.native", category: "platform")

  func attach() {
    pushAppearance()
    pushWindowSize()
    appearanceObservation = NSApp.observe(\.effectiveAppearance) { [weak self] _, _ in
      Task { @MainActor in self?.pushAppearance() }
    }
    NotificationCenter.default.addObserver(
      forName: NSWindow.didResizeNotification, object: nil, queue: .main
    ) { [weak self] _ in
      Task { @MainActor in self?.pushWindowSize() }
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
      if editing && !chord { return event }
      let char = (event.charactersIgnoringModifiers ?? "").lowercased()
      // Clipboard/edit/quit chords stay native; forwarding them would
      // swallow AppKit behavior the OCaml side does not reproduce.
      if chord && ["q", "w", "c", "v", "x", "a", "z", "h"].contains(char) {
        return event
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
      guard let hit = LogseqFrameStore.hitTest(point),
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
      guard let hit = LogseqFrameStore.hitTest(point),
        let context = LogseqElementRegistry.shared.context(forNode: hit.nodeID)
      else { return event }
      LogseqPlatform.emitMouseDown(context: context, nodeID: hit.nodeID, point: point)
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
      try? JSONSerialization.data(withJSONObject: [
        "nodeId": nodeID, "x": point.x, "y": point.y,
        "hasContext": LogseqElementRegistry.shared.context(forNode: nodeID)
          != nil,
      ]).write(to: URL(fileURLWithPath: "/tmp/cm-hit.json"))
    }
    guard let context = LogseqElementRegistry.shared.context(forNode: nodeID)
    else { return }
    var payload: [String: Any] = [
      "clientX": Double(point.x),
      "clientY": Double(point.y),
      "button": 2,
      "nodeId": nodeID,
    ]
    payload["target"] = LogseqDOMSnapshot.snapshot(for: context)
    guard
      let data = try? JSONSerialization.data(withJSONObject: payload),
      let json = String(data: data, encoding: .utf8)
    else { return }
    try? context.emit(
      name: "dom-event",
      values: ["name": .string("contextmenu"), "payload": .string(json)])
  }

  private static func emitMouseMove(
    context: LUIAppleExtensionViewContext, nodeID: Int, point: CGPoint
  ) {
    var payload: [String: Any] = [
      "clientX": Double(point.x),
      "clientY": Double(point.y),
      "nodeId": nodeID,
    ]
    payload["target"] = LogseqDOMSnapshot.snapshot(for: context)
    guard
      let data = try? JSONSerialization.data(withJSONObject: payload),
      let json = String(data: data, encoding: .utf8)
    else { return }
    try? context.emit(
      name: "dom-event",
      values: ["name": .string("mousemove"), "payload": .string(json)])
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
    payload["target"] = LogseqDOMSnapshot.snapshot(for: context)
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
      break // reserved: renderer ui-state broadcast
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

  private func domOp(name: String, json: String, attempt: Int = 0) {
    let dict = jsonDict(json)
    // Element-targeted ops can arrive before SwiftUI mounts the fresh
    // node — commit happens synchronously in OCaml but makeNSView
    // registration lands on a later runloop turn. Retry briefly rather
    // than dropping the op (on the web the node always exists already).
    if attempt < 40, dict["ref"] != nil, refID(dict) != nil,
      target(dict) == nil
    {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) {
        self.domOp(name: name, json: json, attempt: attempt + 1)
      }
      return
    }
    switch name {
    case "document-title":
      if let title = dict["title"] as? String {
        NSApp.windows.first?.title = title
      }
    case "focus":
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
    case "set-selection-range":
      let start = (dict["start"] as? NSNumber)?.intValue ?? 0
      let end = (dict["end"] as? NSNumber)?.intValue ?? start
      target(dict)?.domSetSelectionRange(start, end)
    case "style-set-property":
      if let prop = dict["property"] as? String {
        target(dict)?.domSetAttribute("style:" + prop, dict["value"] as? String)
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
