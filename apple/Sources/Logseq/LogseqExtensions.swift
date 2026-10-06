import Foundation
import SwiftUI
import LUIAppleBackend

/// Reproduces `Lui_extension.fingerprint` in OCaml (lui/lui_extension.ml):
/// the backend rejects `create-extension` ops whose fingerprint does not
/// match the registered schema byte-for-byte.
enum LogseqExtensionFingerprint {
  struct Property {
    let name: String
    let kind: String
    let required: Bool
    let defaultValue: String?
  }
  struct Event {
    let name: String
    let fields: [(name: String, kind: String, required: Bool)]
  }

  static func make(
    identifier: String,
    profiles: [String],
    standardChildren: Bool,
    children: [String],
    properties: [Property],
    events: [Event]
  ) -> String {
    func token(_ value: String) -> String {
      "\(value.utf8.count):\(value)"
    }
    func propertyToken(_ property: Property) -> String {
      let fallback = property.defaultValue.map { "some:s\(token($0))" } ?? "none"
      return token(property.name) + ":" + property.kind + ":"
        + (property.required ? "required" : "optional") + ":" + fallback
    }
    func eventToken(_ event: Event) -> String {
      let fields = event.fields
        .map { token($0.name) + ":" + $0.kind + ":"
               + ($0.required ? "required" : "optional") }
        .sorted()
        .joined(separator: ",")
      return token(event.name) + "[" + fields + "]"
    }
    return "lui-extension-v1|" + token(identifier)
      + "|profiles:" + profiles.sorted().joined(separator: ",")
      + "|standard-children:" + (standardChildren ? "1" : "0")
      + "|children:" + children.sorted().map(token).joined(separator: ",")
      + "|properties:" + properties.map(propertyToken).sorted().joined(separator: ",")
      + "|events:" + events.map(eventToken).sorted().joined(separator: ",")
  }
}

/// Schema mirror of deps/ui/apple/logseq_dom.ml. Every `logseq-<tag>`
/// extension shares one schema: five string props (attrs, events, text,
/// style-class, accessibility-identifier) plus the `dom-event` event with
/// name (required) + payload (optional) string fields.
@MainActor enum LogseqExtensions {
  /// Must stay in sync with `tags` in apple/logseq_dom.ml.
  static let tags: [String] = [
    "div", "span", "a", "button", "textarea", "input", "img", "main",
    "header", "h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "li", "nav",
    "section", "strong", "em", "code", "pre", "label", "form", "select",
    "option", "video", "audio", "iframe", "small", "kbd", "table", "thead",
    "tbody", "tr", "td", "th", "br", "hr", "canvas", "article",
    "aside", "footer", "details", "summary", "u", "mark", "b", "i",
    "svg", "path", "circle", "rect", "line", "polyline", "polygon", "g",
    "defs", "use", "ellipse", "tspan", "sup", "em-emoji", "raw-text",
    "pdf",
  ]

  /// `tags` mirror the `logseq-<tag>` dom twins; `identifiers` adds the
  /// dedicated widget extensions that may nest inside them — must stay
  /// in sync with `child_identifiers` in apple/logseq_dom.ml (it feeds
  /// the fingerprint's `children:`).
  static let identifiers = tags.map { "logseq-" + $0 } + ["logseq-codemirror"]
  private static let profiles = ["web/web", "macos/swiftui"]

  private static let propertySchemas: [LogseqExtensionFingerprint.Property] = [
    .init(name: "attrs", kind: "string", required: false, defaultValue: nil),
    .init(name: "events", kind: "string", required: false, defaultValue: nil),
    .init(name: "text", kind: "string", required: false, defaultValue: nil),
    .init(name: "style-class", kind: "string", required: false, defaultValue: nil),
    .init(name: "accessibility-identifier", kind: "string", required: false, defaultValue: nil),
  ]

  private static let domEvent = LogseqExtensionFingerprint.Event(
    name: "dom-event",
    fields: [
      (name: "name", kind: "string", required: true),
      (name: "payload", kind: "string", required: false),
    ])

  private static let domEventSchema = LUIExtensionEvent(
    name: "dom-event",
    fields: [
      .init(name: "name", kind: .string, isRequired: true),
      .init(name: "payload", kind: .string, isRequired: false),
    ])

  private static let propertyDecls: [LUIExtensionProperty] = [
    .init(name: "attrs", kind: .string),
    .init(name: "events", kind: .string),
    .init(name: "text", kind: .string),
    .init(name: "style-class", kind: .string),
    .init(name: "accessibility-identifier", kind: .string),
  ]

  /// Schema mirror of deps/ui/apple/logseq_codemirror.ml — the OCaml
  /// apple schema registers all three profiles.
  private static let codemirrorProfiles = ["web/web", "macos/swiftui", "macos/gpui"]

  private static let codemirrorPropertySchemas: [LogseqExtensionFingerprint.Property] = [
    .init(name: "uuid", kind: "string", required: false, defaultValue: nil),
    .init(name: "lang", kind: "string", required: false, defaultValue: nil),
    .init(name: "value", kind: "string", required: false, defaultValue: nil),
    .init(name: "read-only", kind: "bool", required: false, defaultValue: nil),
    .init(name: "source-role", kind: "string", required: false, defaultValue: nil),
    .init(name: "style-class", kind: "string", required: false, defaultValue: nil),
    .init(name: "accessibility-identifier", kind: "string", required: false, defaultValue: nil),
  ]

  private static let codemirrorEvent = LogseqExtensionFingerprint.Event(
    name: "cm-event",
    fields: [
      (name: "name", kind: "string", required: true),
      (name: "value", kind: "string", required: false),
      (name: "key", kind: "string", required: false),
    ])

  private static let codemirrorPropertyDecls: [LUIExtensionProperty] = [
    .init(name: "uuid", kind: .string),
    .init(name: "lang", kind: .string),
    .init(name: "value", kind: .string),
    .init(name: "read-only", kind: .bool),
    .init(name: "source-role", kind: .string),
    .init(name: "style-class", kind: .string),
    .init(name: "accessibility-identifier", kind: .string),
  ]

  private static let codemirrorEventSchema = LUIExtensionEvent(
    name: "cm-event",
    fields: [
      .init(name: "name", kind: .string, isRequired: true),
      .init(name: "value", kind: .string, isRequired: false),
      .init(name: "key", kind: .string, isRequired: false),
    ])

  private static func codemirrorExtension() -> LUIAppleExtension {
    LUIAppleExtension(
      identifier: "logseq-codemirror",
      fingerprint: LogseqExtensionFingerprint.make(
        identifier: "logseq-codemirror",
        profiles: codemirrorProfiles,
        standardChildren: false,
        children: [],
        properties: codemirrorPropertySchemas,
        events: [codemirrorEvent]),
      acceptsStandardChildren: false,
      childIdentifiers: [],
      properties: codemirrorPropertyDecls,
      events: [codemirrorEventSchema]
    ) { context in
      AnyView(LogseqCodeMirrorView(context: context))
    }
  }

  /// Schema mirror of deps/ui/apple/logseq_editor.ml — the OCaml apple
  /// schema registers all three profiles. The extension carries no
  /// visual content: it is the text-input/IME/measurement conduit for
  /// one block editor (docs/editor-surface-extension.md).
  private static let editorProfiles = ["web/web", "macos/swiftui", "macos/gpui"]

  private static let editorPropertySchemas: [LogseqExtensionFingerprint.Property] = [
    .init(name: "block-id", kind: "string", required: true, defaultValue: nil),
    .init(name: "caret", kind: "int", required: false, defaultValue: nil),
    .init(name: "composition", kind: "string", required: false, defaultValue: nil),
    .init(name: "runs", kind: "string", required: false, defaultValue: nil),
  ]

  private static let editorEventSchemas: [LogseqExtensionFingerprint.Event] = [
    .init(
      name: "key",
      fields: [
        (name: "key", kind: "string", required: true),
        (name: "shift", kind: "bool", required: false),
        (name: "alt", kind: "bool", required: false),
        (name: "meta", kind: "bool", required: false),
        (name: "ctrl", kind: "bool", required: false),
        (name: "repeat", kind: "bool", required: false),
      ]),
    .init(
      name: "insert",
      fields: [(name: "text", kind: "string", required: true)]),
    .init(
      name: "delete",
      fields: [(name: "kind", kind: "string", required: true)]),
    .init(
      name: "composition",
      fields: [
        (name: "state", kind: "string", required: true),
        (name: "text", kind: "string", required: false),
        (name: "range", kind: "string", required: false),
      ]),
    .init(name: "focus", fields: []),
    .init(name: "blur", fields: []),
    .init(
      name: "pointer",
      fields: [
        (name: "offset", kind: "int", required: true),
        (name: "extend", kind: "bool", required: false),
      ]),
  ]

  private static let editorPropertyDecls: [LUIExtensionProperty] = [
    .init(name: "block-id", kind: .string, isRequired: true),
    .init(name: "caret", kind: .int),
    .init(name: "composition", kind: .string),
    .init(name: "runs", kind: .string),
  ]

  private static let editorEventDecls: [LUIExtensionEvent] = [
    .init(
      name: "key",
      fields: [
        .init(name: "key", kind: .string, isRequired: true),
        .init(name: "shift", kind: .bool, isRequired: false),
        .init(name: "alt", kind: .bool, isRequired: false),
        .init(name: "meta", kind: .bool, isRequired: false),
        .init(name: "ctrl", kind: .bool, isRequired: false),
        .init(name: "repeat", kind: .bool, isRequired: false),
      ]),
    .init(
      name: "insert",
      fields: [.init(name: "text", kind: .string, isRequired: true)]),
    .init(
      name: "delete",
      fields: [.init(name: "kind", kind: .string, isRequired: true)]),
    .init(
      name: "composition",
      fields: [
        .init(name: "state", kind: .string, isRequired: true),
        .init(name: "text", kind: .string, isRequired: false),
        .init(name: "range", kind: .string, isRequired: false),
      ]),
    .init(name: "focus", fields: []),
    .init(name: "blur", fields: []),
    .init(
      name: "pointer",
      fields: [
        .init(name: "offset", kind: .int, isRequired: true),
        .init(name: "extend", kind: .bool, isRequired: false),
      ]),
  ]

  private static func editorExtension() -> LUIAppleExtension {
    LUIAppleExtension(
      identifier: "logseq-editor",
      fingerprint: LogseqExtensionFingerprint.make(
        identifier: "logseq-editor",
        profiles: editorProfiles,
        standardChildren: false,
        children: [],
        properties: editorPropertySchemas,
        events: editorEventSchemas),
      acceptsStandardChildren: false,
      childIdentifiers: [],
      properties: editorPropertyDecls,
      events: editorEventDecls
    ) { context in
      AnyView(LogseqEditorView(context: context))
    }
  }

  private static func elementExtension(tag: String) -> LUIAppleExtension {
    let identifier = "logseq-" + tag
    return LUIAppleExtension(
      identifier: identifier,
      fingerprint: LogseqExtensionFingerprint.make(
        identifier: identifier,
        profiles: profiles,
        standardChildren: true,
        children: identifiers,
        properties: propertySchemas,
        events: [domEvent]),
      acceptsStandardChildren: true,
      childIdentifiers: identifiers,
      properties: propertyDecls,
      events: [domEventSchema]
    ) { context in
      AnyView(LogseqElementView(tag: tag, context: context))
    }
  }

  static func registry(
    view: (@MainActor (LUIAppleExtensionViewContext) -> AnyView)? = nil
  ) throws -> LUIAppleExtensionRegistry {
    let registry = LUIAppleExtensionRegistry()
    try registry.register(codemirrorExtension())
    try registry.register(editorExtension())
    for tag in tags {
      if let view {
        let identifier = "logseq-" + tag
        try registry.register(
          LUIAppleExtension(
            identifier: identifier,
            fingerprint: LogseqExtensionFingerprint.make(
              identifier: identifier,
              profiles: profiles,
              standardChildren: true,
              children: identifiers,
              properties: propertySchemas,
              events: [domEvent]),
            acceptsStandardChildren: true,
            childIdentifiers: identifiers,
            properties: propertyDecls,
            events: [domEventSchema],
            viewFactory: view))
      } else {
        try registry.register(elementExtension(tag: tag))
      }
    }
    return registry
  }
}

/// Platform-gated stub for the logseq-codemirror extension: the web
/// adapter owns the real CodeMirror mount/unmount lifecycle; on
/// SwiftUI the extension renders its `value` prop read-only until a
/// native editor surface exists.
struct LogseqCodeMirrorView: View {
  let context: LUIAppleExtensionViewContext

  private var value: String {
    if case .string(let v) = context.property("value") {
      return v
    }
    return ""
  }

  var body: some View {
    Text(value)
      .font(.system(.body, design: .monospaced))
      .frame(maxWidth: .infinity, alignment: .leading)
      .textSelection(.enabled)
  }
}

/// Protocol stub for the logseq-editor extension: the sink node carries
/// no visual content — it binds one block editor's text-input/IME and
/// measurement conduit (deps/ui/apple/logseq_editor.ml documents the
/// contract). The schema is registered so the backend admits the node.
///
/// TODO(logseq-editor): replace this placeholder with the real conduit —
/// a hidden UIKeyInput (iOS) / NSTextInputClient (macOS) responder that
/// emits key/insert/delete/composition/focus/blur/pointer events via
/// `context.emit`, and TextKit-backed handling of the `caret-rect`,
/// `offset-at`, `line-ranges`, `scroll-height`, and `set-input-focus`
/// dom-ops, replying through the platform-event channel under the same
/// name (offsets in UTF-8 byte units — the host translates from UTF-16).
struct LogseqEditorView: View {
  let context: LUIAppleExtensionViewContext

  var body: some View {
    EmptyView()
  }
}
