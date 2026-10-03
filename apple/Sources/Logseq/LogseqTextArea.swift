import AppKit
import Foundation
import Highlightr
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
  /// DOM `id` dom-ops resolve against (accessibility-identifier).
  let domID: String

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
    // Code blocks (.code-editor textarea[data-lang]) get highlight.js
    // syntax coloring via Highlightr's JSC-backed text storage — the
    // native counterpart of the web's hljs scan over pre.CodeMirror-line.
    if let lang = attrs["data-lang"] as? String, !lang.isEmpty {
      let codeStorage = CodeAttributedString()
      _ = codeStorage.highlightr.setTheme(
        to: LogseqColors.isDark ? "atom-one-dark" : "atom-one-light")
      textView.layoutManager?.replaceTextStorage(codeStorage)
      codeStorage.language = lang.lowercased()
    }
    context.coordinator.textView = textView
    context.coordinator.owner = self
    // Elements without a DOM id are still addressable by node ref —
    // OCaml's doc_query_selector emits "#ref": "node-<id>" for them.
    LogseqElementRegistry.shared.register(
      "node-\(self.context.nodeID)", context.coordinator)
    if !domID.isEmpty {
      LogseqElementRegistry.shared.register(domID, context.coordinator)
    }
    textView.string = text
    return scrollView
  }

  func updateNSView(_ scrollView: NSScrollView, context: NSViewRepresentableContext<Self>) {
    let textView = scrollView.documentView as! NSTextView
    context.coordinator.owner = self
    // While the view has focus, the user's typing is authoritative: a
    // re-render carrying the not-yet-updated buffer must not clobber
    // fresh keystrokes. Imperative domSetValue still applies directly.
    let focused = scrollView.window?.firstResponder === textView
    if !focused, textView.string != text {
      let selected = textView.selectedRange()
      context.coordinator.suppressEvents = true
      textView.string = text
      let length = (text as NSString).length
      textView.setSelectedRange(
        NSRange(location: min(selected.location, length),
                length: min(selected.length, length - selected.location)))
      context.coordinator.suppressEvents = false
    }
    LogseqElementRegistry.shared.register(
      "node-\(self.context.nodeID)", context.coordinator)
    if !domID.isEmpty {
      LogseqElementRegistry.shared.register(domID, context.coordinator)
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
      // Report the DOM-shaped keydown to OCaml, which decides semantics.
      // For keys the editor owns (Enter/Tab/Escape) swallow the command so
      // AppKit doesn't also insert a newline/indent — OCaml's keymap runs
      // the outliner op and the textarea updates from patches.
      let key: String
      var shift = false
      var which = 0
      switch commandSelector {
      case #selector(NSResponder.insertNewline(_:)):
        key = "Enter"; which = 13
      case #selector(NSResponder.insertTab(_:)):
        key = "Tab"; which = 9
      case #selector(NSResponder.insertBacktab(_:)):
        key = "Tab"; which = 9; shift = true
      case #selector(NSResponder.cancelOperation(_:)):
        key = "Escape"; which = 27
      default:
        return false
      }
      emit("keydown", payload: [
        "key": key, "which": which,
        "shiftKey": shift,
        "metaKey": false, "ctrlKey": false, "altKey": false,
      ])
      return true
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

    // On the web el.textContent is not el.value — setting it never
    // touches the user's text. The block editor calls
    // el_set_text_content on every input to keep innerText in lockstep;
    // mapping it to the native string would write a stale buffer back
    // over fresh keystrokes, so it is a no-op here.
    func domSetTextContent(_ text: String) {}

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
      var target = LogseqDOMSnapshot.snapshot(for: owner.context)
      // OCaml's el_value reads "value" off the target snapshot — carry the
      // live string so on_input sees the current buffer, not the last patch.
      target["value"] = textView?.string ?? ""
      // live_fields only updates from event payloads — carry the caret on
      // every event so arrow/Cmd-movement between events can't leave a
      // stale position for the next split/merge op.
      let sel = textView?.selectedRange() ?? NSRange()
      enriched["selectionStart"] = sel.location
      enriched["selectionEnd"] = sel.location + sel.length
      enriched["target"] = target
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
  let domID: String

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
    LogseqElementRegistry.shared.register(
      "node-\(self.context.nodeID)", context.coordinator)
    if !domID.isEmpty {
      LogseqElementRegistry.shared.register(domID, context.coordinator)
    }
    return field
  }

  func updateNSView(_ field: NSTextField, context: NSViewRepresentableContext<Self>) {
    context.coordinator.owner = self
    // Same rule as the textarea: focused input keeps its own text.
    let focused = field.window?.firstResponder === field
    if !focused, field.stringValue != text {
      field.stringValue = text
    }
    field.placeholderString = attrs["placeholder"] as? String
  }

  func makeCoordinator() -> Coordinator { Coordinator() }

  @MainActor final class Coordinator: NSObject, NSTextFieldDelegate, LogseqElement {
    weak var field: NSTextField?
    var owner: LogseqInputField?

    func control(
      _ control: NSControl, textView: NSTextView,
      doCommandBy commandSelector: Selector
    ) -> Bool {
      // DOM-shaped keydown for navigation keys — cmdk/list keymaps on the
      // OCaml side decide semantics. Swallow Enter/Escape so the field's
      // default action/abortEditing doesn't fire alongside.
      let key: String
      var which = 0
      var swallow = false
      switch commandSelector {
      case #selector(NSResponder.insertNewline(_:)):
        key = "Enter"; which = 13; swallow = true
      case #selector(NSResponder.moveUp(_:)):
        key = "ArrowUp"; which = 38
      case #selector(NSResponder.moveDown(_:)):
        key = "ArrowDown"; which = 40
      case #selector(NSResponder.cancelOperation(_:)):
        key = "Escape"; which = 27; swallow = true
      case #selector(NSResponder.insertTab(_:)):
        key = "Tab"; which = 9
      case #selector(NSResponder.insertBacktab(_:)):
        key = "Tab"; which = 9
      default:
        return false
      }
      let shift = commandSelector == #selector(NSResponder.insertBacktab(_:))
      emit("keydown", payload: [
        "key": key, "which": which,
        "shiftKey": shift,
        "metaKey": false, "ctrlKey": false, "altKey": false,
      ])
      return swallow
    }

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

    func domSetSelectionRange(_ start: Int, _ end: Int) {
      field?.currentEditor()?.selectedRange =
        NSRange(location: start, length: max(0, end - start))
    }

    func emit(_ name: String, payload: [String: Any] = [:]) {
      guard let owner else { return }
      guard owner.wired.contains(name)
        || ["input", "keydown", "focus", "blur", "change"].contains(name)
      else { return }
      var enriched = payload
      enriched["nodeId"] = owner.context.nodeID
      var target = LogseqDOMSnapshot.snapshot(for: owner.context)
      target["value"] = field?.stringValue ?? ""
      enriched["target"] = target
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
    // Never report infinity back — a nil width proposal would return
    // CGSize(width: .infinity) and crash layout with a NaN origin.
    return CGSize(
      width: width.isFinite ? width : x,
      height: y + rowHeight)
  }

  func placeSubviews(
    in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews,
    cache: inout ()
  ) {
    var x = bounds.minX
    var y = bounds.minY
    let maxX = bounds.maxX.isFinite ? bounds.maxX : CGFloat.greatestFiniteMagnitude
    var rowHeight: CGFloat = 0
    for subview in subviews {
      let size = subview.sizeThatFits(.unspecified)
      if x + size.width > maxX && x > bounds.minX {
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
