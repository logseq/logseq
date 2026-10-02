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
  ]

  static let identifiers = tags.map { "logseq-" + $0 }
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
