import AppKit
import Foundation
import LUIAppleBackend
import SwiftUI

/// NSTextView-backed `logseq-textarea`. This is the block editor surface: the
/// OCaml editor drives it through `text` prop updates and imperative dom-ops
/// (set-value, set-selection-range, focus), and every edit/keypress goes back
/// as a `dom-event` the OCaml keymap dispatches on.
struct LogseqTextArea: NSViewRepresentable {
  let context: LUIAppleExtensionViewContext
  let attrs: [String: Any]
  let style: LogseqStyle
  let wired: Set<String>
  let text: String

  func makeNSView(context: NSViewRepresentableContext<Self>) -> NSScrollView {
    let scrollView = NSTextView.scrollableTextView()
    let textView = scrollView.documentView as! NSTextView
    textView.delegate = context.coordinator
    textView.isRichText = false
    textView.allowsUndo = true
    textView.font = .monospacedSystemFont(
      ofSize: style.fontSize ?? 14, weight: .regular)
    textView.textColor = LogseqColors.grayNS(12)
    textView.backgroundColor = .clear
    textView.drawsBackground = false
    textView.isVerticallyResizable = true
    textView.isHorizontallyResizable = false
    textView.textContainer?.widthTracksTextView = true
    textView.textContainer?.lineFragmentPadding = 0
    scrollView.hasVerticalScroller = false
    scrollView.hasHorizontalScroller = false
    scrollView.drawsBackground = false
    scrollView.borderType = .noBorder
    context.coordinator.textView = textView
    context.coordinator.owner = self
    if let id = attrs["id"] as? String, !id.isEmpty {
      LogseqElementRegistry.shared.register(id, context.coordinator)
    }
    textView.string = text
    return scrollView
  }

  func updateNSView(_ scrollView: NSScrollView, context: NSViewRepresentableContext<Self>) {
    let textView = scrollView.documentView as! NSTextView
    context.coordinator.owner = self
    if textView.string != text {
      let selected = textView.selectedRange()
      context.coordinator.suppressEvents = true
      textView.string = text
      let length = (text as NSString).length
      textView.setSelectedRange(
        NSRange(location: min(selected.location, length),
                length: min(selected.length, length - selected.location)))
      context.coordinator.suppressEvents = false
    }
    if let id = attrs["id"] as? String, !id.isEmpty {
      LogseqElementRegistry.shared.register(id, context.coordinator)
    }
  }

  func makeCoordinator() -> Coordinator { Coordinator() }

  @MainActor final class Coordinator: NSObject, NSTextViewDelegate, LogseqElement {
    weak var textView: NSTextView?
    var owner: LogseqTextArea?
    var suppressEvents = false

    // MARK: NSTextViewDelegate

    func textDidChange(_ notification: Notification) {
      guard !suppressEvents, let textView else { return }
      emit("input", payload: [
        "value": textView.string,
        "inputType": "insertText",
        "selectionStart": textView.selectedRange().location,
        "selectionEnd": textView.selectedRange().location
          + textView.selectedRange().length,
      ])
    }

    func textView(
      _ textView: NSTextView, doCommandBy commandSelector: Selector
    ) -> Bool {
      // Return false: the raw key event path (keyDown) reports to OCaml, which
      // decides semantics. Letting AppKit also run insertNewline etc. would
      // double-apply.
      false
    }

    func textDidBeginEditing(_ notification: Notification) {
      emit("focus")
    }

    func textDidEndEditing(_ notification: Notification) {
      emit("blur")
    }

    // MARK: LogseqElement (dom-ops)

    func domFocus() {
      textView?.window?.makeFirstResponder(textView)
    }

    func domSetValue(_ value: String) {
      guard let textView, textView.string != value else { return }
      suppressEvents = true
      textView.string = value
      suppressEvents = false
    }

    func domSetTextContent(_ text: String) { domSetValue(text) }

    func domSetSelectionRange(_ start: Int, _ end: Int) {
      textView?.setSelectedRange(NSRange(location: start, length: max(0, end - start)))
    }

    func domScrollIntoView() {
      textView?.scrollRangeToVisible(textView?.selectedRange() ?? NSRange())
    }

    // MARK: emission

    func emit(_ name: String, payload: [String: Any] = [:]) {
      guard let owner else { return }
      guard owner.wired.contains(name) || ["input", "keydown", "focus", "blur"].contains(name)
      else { return }
      var enriched = payload
      enriched["nodeId"] = owner.context.nodeID
      guard let data = try? JSONSerialization.data(withJSONObject: enriched),
        let json = String(data: data, encoding: .utf8)
      else { return }
      try? owner.context.emit(
        name: "dom-event",
        values: ["name": .string(name), "payload": .string(json)])
    }
  }
}

/// Single-line `logseq-input`.
struct LogseqInputField: NSViewRepresentable {
  let context: LUIAppleExtensionViewContext
  let attrs: [String: Any]
  let style: LogseqStyle
  let wired: Set<String>
  let text: String

  func makeNSView(context: NSViewRepresentableContext<Self>) -> NSTextField {
    let field = NSTextField()
    field.delegate = context.coordinator
    field.isBordered = false
    field.drawsBackground = false
    field.focusRingType = .none
    field.font = .systemFont(ofSize: style.fontSize ?? 14)
    field.textColor = LogseqColors.grayNS(12)
    field.placeholderString = attrs["placeholder"] as? String
    field.stringValue = text
    context.coordinator.field = field
    context.coordinator.owner = self
    if let id = attrs["id"] as? String, !id.isEmpty {
      LogseqElementRegistry.shared.register(id, context.coordinator)
    }
    return field
  }

  func updateNSView(_ field: NSTextField, context: NSViewRepresentableContext<Self>) {
    context.coordinator.owner = self
    if field.stringValue != text {
      field.stringValue = text
    }
    field.placeholderString = attrs["placeholder"] as? String
  }

  func makeCoordinator() -> Coordinator { Coordinator() }

  @MainActor final class Coordinator: NSObject, NSTextFieldDelegate, LogseqElement {
    weak var field: NSTextField?
    var owner: LogseqInputField?

    func controlTextDidChange(_ notification: Notification) {
      guard let field else { return }
      emit("input", payload: ["value": field.stringValue])
    }

    func controlTextDidBeginEditing(_ notification: Notification) {
      emit("focus")
    }

    func controlTextDidEndEditing(_ notification: Notification) {
      emit("blur")
      guard let field else { return }
      emit("change", payload: ["value": field.stringValue])
    }

    func domFocus() {
      field?.window?.makeFirstResponder(field)
    }

    func domSetValue(_ value: String) {
      field?.stringValue = value
    }

    func emit(_ name: String, payload: [String: Any] = [:]) {
      guard let owner else { return }
      guard owner.wired.contains(name)
        || ["input", "keydown", "focus", "blur", "change"].contains(name)
      else { return }
      var enriched = payload
      enriched["nodeId"] = owner.context.nodeID
      guard let data = try? JSONSerialization.data(withJSONObject: enriched),
        let json = String(data: data, encoding: .utf8)
      else { return }
      try? owner.context.emit(
        name: "dom-event",
        values: ["name": .string(name), "payload": .string(json)])
    }
  }
}

/// Simple wrapping flow for inline children (spans inside a paragraph).
struct LogseqFlowLayout: Layout {
  var spacing: CGFloat = 0

  func sizeThatFits(
    proposal: ProposedViewSize, subviews: Subviews, cache: inout ()
  ) -> CGSize {
    let width = proposal.width ?? .infinity
    var x: CGFloat = 0
    var y: CGFloat = 0
    var rowHeight: CGFloat = 0
    for subview in subviews {
      let size = subview.sizeThatFits(.unspecified)
      if x + size.width > width && x > 0 {
        x = 0
        y += rowHeight + spacing
        rowHeight = 0
      }
      rowHeight = max(rowHeight, size.height)
      x += size.width
    }
    return CGSize(width: width, height: y + rowHeight)
  }

  func placeSubviews(
    in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews,
    cache: inout ()
  ) {
    var x = bounds.minX
    var y = bounds.minY
    var rowHeight: CGFloat = 0
    for subview in subviews {
      let size = subview.sizeThatFits(.unspecified)
      if x + size.width > bounds.maxX && x > bounds.minX {
        x = bounds.minX
        y += rowHeight + spacing
        rowHeight = 0
      }
      subview.place(
        at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
      x += size.width
      rowHeight = max(rowHeight, size.height)
    }
  }
}
