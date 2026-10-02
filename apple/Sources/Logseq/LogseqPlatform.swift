import AppKit
import Foundation
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

  func register(_ id: String, _ element: LogseqElement) {
    elements[id] = NSWeakReferenceBox(element)
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
  }

  func detach() {
    appearanceObservation?.invalidate()
    appearanceObservation = nil
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

  private func domOp(name: String, json: String) {
    let dict = jsonDict(json)
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
