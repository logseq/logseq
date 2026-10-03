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

  func register(_ id: String, _ element: LogseqElement) {
    elements[id] = NSWeakReferenceBox(element)
  }

  func registerAnchor(_ id: String, _ context: LUIAppleExtensionViewContext) {
    if id == "app-container" || eventAnchor == nil { eventAnchor = context }
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
  }

  func detach() {
    appearanceObservation?.invalidate()
    appearanceObservation = nil
    if let keyMonitor {
      NSEvent.removeMonitor(keyMonitor)
      self.keyMonitor = nil
    }
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
    case "download-text", "download-binary", "save-file":
      saveFile(name: name, dict: dict)
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
