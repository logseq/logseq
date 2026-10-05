import SwiftUI
import LUIAppleBackend

/// Native host for the `logseq-codemirror` extension node
/// (deps/ui/apple/logseq_codemirror.ml).
///
/// The web adapter mounts CodeMirror for `source-role: "block"` and a
/// contenteditable line for `"query"`; here both roles share one
/// NSTextView/UITextView surface (`LUICodeEditor`) with regex syntax
/// coloring matched to the `lang` prop — no CodeMirror/webview on apple.
///
/// Events flow back over the extension's `cm-event` channel so the OCaml
/// model stays the source of truth:
///   - "input" (value = full text) on every edit
///   - "key"   (key = "Enter"/"Escape", value = full text) — matching the
///     web adapter, both keys are swallowed for `source-role: "query"`
///     (OCaml owns commit/cancel); block role inserts newlines normally.
///   - "focus"/"blur" — apple extras; web emits none (harmless when the
///     call site wires no handler).
///
/// Known delta: the web `block` role syncs edits through the CodeMirror
/// instance keyed by `uuid`, bypassing cm-event — apple has no such
/// channel, so block edits are emitted as "input" and land only where a
/// call site wires `on_event` (query does today; block call sites do not
/// — same observable behavior as a dropped event).
struct LogseqCodeMirrorView: View {
  let context: LUIAppleExtensionViewContext

  private func stringProp(_ name: String) -> String {
    if case .string(let v) = context.property(name) { return v }
    return ""
  }

  private var readOnly: Bool {
    if case .bool(let b) = context.property("read-only") { return b }
    return false
  }

  private func emit(_ name: String, fields: [String: LUIExtensionValue]) {
    var values = fields
    values["name"] = .string(name)
    try? context.emit(name: "cm-event", values: values)
  }

  var body: some View {
    let isQuery = stringProp("source-role") == "query"
    LUICodeEditor(
      text: stringProp("value"),
      language: stringProp("lang"),
      isEditable: !readOnly,
      onChange: { text in
        emit("input", fields: ["value": .string(text)])
      },
      onFocusChange: { focused in
        emit(focused ? "focus" : "blur", fields: [:])
      },
      onKey: { key in
        emit("key", fields: [
          "key": .string(key),
          "value": .string(stringProp("value")),
        ])
        // Swallow only for the query role (web preventDefaults
        // Enter/Escape there); block role keeps newline insertion.
        return isQuery && (key == "Enter" || key == "Escape")
      })
      .accessibilityIdentifier(stringProp("accessibility-identifier"))
  }
}
