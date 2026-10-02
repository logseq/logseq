import AppKit
import Foundation
import LUIAppleBackend
import SwiftUI

/// One `logseq-<tag>` extension node rendered natively. The OCaml view layer
/// emits DOM-shaped elements: `attrs` (JSON object), `events` (space-separated
/// DOM names), `text`/`html` content, `style-class` (tailwind-ish classes), and
/// expects `dom-event` emissions for the wired events.
struct LogseqElementView: View {
  let tag: String
  let context: LUIAppleExtensionViewContext

  private var attrs: [String: Any] {
    guard case .string(let json) = context.property("attrs"),
      let data = json.data(using: .utf8),
      let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return [:] }
    return dict
  }

  private var wiredEvents: Set<String> {
    guard case .string(let names) = context.property("events") else { return [] }
    return Set(names.split(separator: " ").map(String.init))
  }

  private var style: LogseqStyle {
    guard case .string(let classes) = context.property("style-class") else {
      return LogseqStyle()
    }
    return LogseqStyle.parse(classes)
  }

  private var text: String {
    if case .string(let t) = context.property("text") { return t }
    return ""
  }

  private var html: String {
    if case .string(let h) = context.property("html") { return h }
    return ""
  }

  var body: some View {
    content
      .id(context.nodeID)
      .background(LogseqElementRegistration(
        id: attrs["id"] as? String ?? "",
        context: context))
  }

  @ViewBuilder private var content: some View {
    switch tag {
    // ---- text inputs ----
    case "textarea":
      LogseqTextArea(
        context: context, attrs: attrs, style: style,
        wired: wiredEvents, text: text)
    case "input":
      LogseqInputField(
        context: context, attrs: attrs, style: style,
        wired: wiredEvents, text: text)
    // ---- links / buttons ----
    case "a":
      linkBody
    case "button":
      buttonBody
    // ---- media ----
    case "img":
      imageBody
    // ---- svg family ----
    case "svg", "path", "circle", "rect", "line", "polyline", "polygon", "g",
         "defs", "use", "ellipse", "tspan":
      LogseqSVGView(tag: tag, attrs: attrs, context: context)
    // ---- misc ----
    case "br":
      Text("\n")
    case "hr":
      Divider()
    case "select":
      selectBody
    default:
      elementBody
    }
  }

  // MARK: - leaf + inline rendering

  @ViewBuilder private var elementBody: some View {
    let children = context.childIDs
    let inline = isInlineTag
    if children.isEmpty && html.isEmpty {
      styledText
    } else {
      Group {
        if inline {
          LogseqFlowLayout {
            if !text.isEmpty { styledText }
            if !html.isEmpty { htmlText }
            ForEach(children, id: \.self) { child in
              context.content(for: child)
            }
          }
        } else {
          VStack(alignment: .leading, spacing: 0) {
            if !text.isEmpty { styledText }
            if !html.isEmpty { htmlText }
            ForEach(children, id: \.self) { child in
              context.content(for: child)
            }
          }
        }
      }
      .modifier(LogseqStyleModifier(style: style, tag: tag))
    }
  }

  private var isInlineTag: Bool {
    ["span", "strong", "em", "code", "small", "kbd", "u", "mark", "b", "i",
     "sup", "tspan", "em-emoji", "raw-text", "label"].contains(tag)
  }

  @ViewBuilder private var styledText: some View {
    let s = style
    Text(attributedText)
      .font(fontFor(s))
      .foregroundStyle(s.foreground ?? LogseqColors.primaryText)
      .modifier(LogseqStyleModifier(style: s, tag: tag))
  }

  @ViewBuilder private var htmlText: some View {
    if let nsAttributed = try? NSAttributedString(
      html: Data(html.utf8),
      options: [.documentType: NSAttributedString.DocumentType.html],
      documentAttributes: nil),
      let attributed = try? AttributedString(nsAttributed, including: \.appKit)
    {
      Text(attributed)
    } else {
      Text(html)
    }
  }

  private var attributedText: AttributedString {
    var base = text
    if base.isEmpty {
      switch tag {
      case "em-emoji":
        base = (attrs["data-emoji"] as? String) ?? (attrs["emoji"] as? String) ?? ""
      default: break
      }
    }
    var result = AttributedString(base)
    let s = style
    var intent = result.inlinePresentationIntent ?? []
    if s.isBold || tag == "strong" || tag == "b" {
      intent.insert(.stronglyEmphasized)
    }
    if s.isItalic || tag == "em" || tag == "i" {
      intent.insert(.emphasized)
    }
    result.inlinePresentationIntent = intent
    if s.isUnderline || tag == "u" { result.underlineStyle = .single }
    if tag == "mark" {
      result.backgroundColor = Color.yellow.opacity(0.45)
    }
    return result
  }

  private func fontFor(_ s: LogseqStyle) -> Font {
    let size = s.fontSize ?? defaultFontSize
    let design: Font.Design =
      (s.isMono || tag == "code" || tag == "pre" || tag == "kbd")
      ? .monospaced : .default
    var font = Font.system(size: size, weight: s.fontWeight ?? .regular, design: design)
    if s.isItalic { font = font.italic() }
    return font
  }

  private var defaultFontSize: CGFloat {
    switch tag {
    case "h1": return 28
    case "h2": return 23
    case "h3": return 19
    case "h4": return 16
    case "h5": return 14
    case "h6": return 13
    case "small": return 11
    case "code", "pre", "kbd": return 12
    default: return 14
    }
  }

  // MARK: - interactive elements

  @ViewBuilder private var linkBody: some View {
    let href = attrs["href"] as? String ?? ""
    Text(attributedText)
      .font(fontFor(style))
      .foregroundStyle(LogseqColors.link)
      .underline()
      .contentShape(Rectangle())
      .onTapGesture {
        emit("click", payload: ["href": href, "button": 0])
      }
  }

  @ViewBuilder private var buttonBody: some View {
    Button(action: {
      emit("click", payload: ["button": 0])
    }) {
      VStack(alignment: .leading, spacing: 0) {
        if !text.isEmpty { styledText }
        ForEach(context.childIDs, id: \.self) { child in
          context.content(for: child)
        }
      }
    }
    .buttonStyle(.plain)
    .modifier(LogseqStyleModifier(style: style, tag: tag))
  }

  @ViewBuilder private var imageBody: some View {
    let src = attrs["src"] as? String ?? ""
    if let url = URL(string: src), url.scheme == "file" || url.scheme == nil {
      if let image = NSImage(contentsOfFile: url.path) {
        Image(nsImage: image).resizable().aspectRatio(contentMode: .fit)
      } else {
        Color.clear.frame(width: 0, height: 0)
      }
    } else if let url = URL(string: src) {
      AsyncImage(url: url) { phase in
        switch phase {
        case .success(let image): image.resizable().aspectRatio(contentMode: .fit)
        case .failure: Image(systemName: "photo")
        default: ProgressView()
        }
      }
    } else {
      EmptyView()
    }
  }

  @ViewBuilder private var selectBody: some View {
    let options = context.childIDs.compactMap { childID -> (String, String)? in
      guard case .string(let value) = context.childProperty(node: childID, "attrs"),
        let data = value.data(using: .utf8),
        let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
      else { return nil }
      let v = dict["value"] as? String ?? ""
      let label: String
      if case .string(let t) = context.childProperty(node: childID, "text") {
        label = t
      } else {
        label = v
      }
      return (v, label)
    }
    Picker("", selection: .constant(attrs["value"] as? String ?? "")) {
      ForEach(options, id: \.0) { option in
        Text(option.1).tag(option.0)
      }
    }
    .labelsHidden()
  }

  // MARK: - dom-event emission

  func emit(_ name: String, payload: [String: Any] = [:]) {
    guard wiredEvents.contains(name) || name == "click" else { return }
    var enriched = payload
    enriched["nodeId"] = context.nodeID
    if let id = attrs["id"] as? String { enriched["targetId"] = id }
    guard let data = try? JSONSerialization.data(withJSONObject: enriched),
      let json = String(data: data, encoding: .utf8)
    else { return }
    try? context.emit(
      name: "dom-event",
      values: ["name": .string(name), "payload": .string(json)])
  }
}

/// Applies the parsed style-class hints that map to native modifiers.
private struct LogseqStyleModifier: ViewModifier {
  let style: LogseqStyle
  let tag: String

  func body(content: Content) -> some View {
    content
      .padding(style.padding ?? EdgeInsets())
      .background(style.background ?? Color.clear)
      .cornerRadius(style.cornerRadius ?? 0)
      .frame(maxWidth: style.maxWidth)
  }
}

/// Registers the rendered element in the dom-op registry under its DOM id so
/// OCaml's imperative calls (focus, set-value, class toggles) can reach it.
private struct LogseqElementRegistration: View {
  let id: String
  let context: LUIAppleExtensionViewContext

  var body: some View {
    Color.clear
      .frame(width: 0, height: 0)
      .onAppear { register() }
      .onDisappear { unregister() }
  }

  private func register() {
    guard !id.isEmpty else { return }
    LogseqElementRegistry.shared.register(id, LogseqElementHandle(nodeID: context.nodeID))
  }

  private func unregister() {
    guard !id.isEmpty else { return }
    LogseqElementRegistry.shared.unregister(id)
  }
}

/// Default element handle — dom-ops land on a no-op surface until richer
/// per-tag handles (text views etc.) register themselves.
private final class LogseqElementHandle: LogseqElement {
  let nodeID: Int
  init(nodeID: Int) { self.nodeID = nodeID }
}
