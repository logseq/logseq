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
    var s = LogseqStyle()
    if case .string(let classes) = context.property("style-class") {
      s = LogseqStyle.parse(classes)
    }
    if case .string(let accId) = context.property("accessibility-identifier") {
      s.applyAccessibilityId(accId)
    }
    if let inline = attrs["style"] as? String {
      s.applyInline(inline)
    }
    return s
  }

  private var isBullet: Bool {
    guard case .string(let classes) = context.property("style-class")
    else { return false }
    return classes.split(separator: " ").contains { $0 == "bullet" }
  }

  /// `ti-<name>`/`tie-<name>` classes on `i`/`span` mark a tabler font icon;
  /// resolve the icon name (nil when the node isn't an icon).
  private var tablerIconName: String? {
    guard tag == "i" || tag == "span" else { return nil }
    guard case .string(let classes) = context.property("style-class")
    else { return nil }
    for cls in classes.split(separator: " ") {
      if cls.hasPrefix("ti-") || cls.hasPrefix("tie-") {
        return String(cls.dropFirst(cls.hasPrefix("tie-") ? 4 : 3))
      }
    }
    return nil
  }

  private var text: String {
    if case .string(let t) = context.property("text") { return t }
    return ""
  }

  /// The DOM `id` dom-ops resolve against — carried on the
  /// `accessibility-identifier` prop (see LogseqStyles).
  private var domID: String {
    if case .string(let accId) = context.property("accessibility-identifier") {
      return accId
    }
    return attrs["id"] as? String ?? ""
  }

  private var html: String {
    if case .string(let h) = context.property("html") { return h }
    return ""
  }

  var body: some View {
    content
      .id(context.nodeID)
      .onAppear {
        // OCaml's get_element_by_id only resolves elements that have
        // announced themselves — its DOM probes (e.g. #ui__ac-inner for an
        // open autocomplete) depend on truthful mount state.
        emitLifecycle("element-mount")
      }
      .onDisappear { emitLifecycle("element-unmount") }
      .background(Group {
        // text inputs register their real coordinator handle themselves —
        // the generic no-op handle must not clobber it.
        if tag != "textarea" && tag != "input" {
          LogseqElementRegistration(id: domID, context: context)
        }
      })
  }

  @ViewBuilder private var content: some View {
    // The HTML `hidden` attribute is display:none (e.g. the asset upload input).
    if style.isHidden || attrs["hidden"] != nil {
      EmptyView()
    } else {
      contentBody
    }
  }

  @ViewBuilder private var contentBody: some View {
    switch tag {
    // ---- text inputs ----
    case "textarea":
      LogseqTextArea(
        context: context, attrs: attrs, style: style,
        wired: wiredEvents, text: text, domID: domID)
        .frame(minHeight: 24)
        .frame(maxWidth: .infinity)
    case "input":
      LogseqInputField(
        context: context, attrs: attrs, style: style,
        wired: wiredEvents, text: text, domID: domID)
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
      if let icon = tablerIconName {
        LogseqTablerIcon(
          name: icon,
          color: style.foreground ?? LogseqColors.primaryText)
      } else {
        styledContainer
      }
    }
  }

  // MARK: - leaf + inline rendering

  @ViewBuilder private var elementBody: some View {
    let children = context.childIDs
    if style.isHidden {
      EmptyView()
    } else if isBullet {
      // CSS draws .bullet via ::before — draw the outliner dot natively
      Circle()
        .fill(Color.secondary.opacity(0.5))
        .frame(width: 5, height: 5)
        .frame(width: 14, height: 14)
        .contentShape(Rectangle())
        .onTapGesture { emit("click", payload: ["button": 0]) }
    } else if children.isEmpty && html.isEmpty && effectiveText.isEmpty {
      // An empty DOM element occupies zero height — rendering Text("") would
      // give it a phantom ~14pt line.
      EmptyView()
        .modifier(LogseqStyleModifier(style: style, tag: tag))
    } else if children.isEmpty && html.isEmpty {
      styledText
    } else {
      stackBody
        .modifier(LogseqStyleModifier(style: style, tag: tag))
        .contentShape(Rectangle())
        .onTapGesture {
          // Emit unconditionally like a DOM click: SwiftUI gestures don't
          // bubble, so the deepest view emits and the OCaml document
          // listener walks `target.ancestors` via closest() — the same way
          // a real click resolves .block-add-button from an inner child.
          emit("click", payload: ["button": 0])
        }
    }
  }

  /// Wraps a child element view so the parent Row/Column layout can read the
  /// child's `grow` (flex-grow) weight via LayoutValueKey. The value has to be
  /// attached at the subview boundary — the parent parses the child's
  /// style-class/accessibility-identifier here.
  private func childStyle(of child: Int) -> LogseqStyle {
    var s = LogseqStyle()
    if case .string(let classes) = context.childProperty(node: child, "style-class") {
      s = LogseqStyle.parse(classes)
    }
    if case .string(let accId) = context.childProperty(node: child, "accessibility-identifier") {
      s.applyAccessibilityId(accId)
    }
    if case .string(let attrJson) = context.childProperty(node: child, "attrs"),
      let data = attrJson.data(using: .utf8),
      let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let inline = dict["style"] as? String
    {
      s.applyInline(inline)
    }
    return s
  }

  private func childView(_ child: Int) -> some View {
    let s = childStyle(of: child)
    // `.editor-inner textarea { width: 100% }` (lui-core.css) — text inputs
    // fill their flex-row parent the way width:100% behaves in a row.
    let isTextInput =
      context.extensionIdentifier(of: child) == "logseq-textarea"
      || context.extensionIdentifier(of: child) == "logseq-input"
    return context.content(for: child)
      .layoutValue(
        key: LogseqGrowXKey.self,
        value: (s.grow || s.fullWidth || isTextInput) ? 1 : 0)
      .layoutValue(key: LogseqGrowYKey.self, value: (s.grow || s.fullHeight) ? 1 : 0)
      .layoutValue(key: LogseqOutOfFlowKey.self, value: s.outOfFlow)
  }

  /// The child layout stack (no style modifier) — used bare inside a
  /// ScrollView so the scroll container's own frames land outside it.
  @ViewBuilder private var stackBody: some View {
    let children = context.childIDs
    let inline = isInlineTag
    Group {
      if inline {
        LogseqFlowLayout {
          if !effectiveText.isEmpty { styledText }
          if !html.isEmpty { htmlText }
          ForEach(children, id: \.self) { child in
            childView(child)
          }
        }
      } else if style.isRow {
        LogseqRowLayout(nodeID: context.nodeID, spacing: style.stackSpacing ?? 0) {
          if !effectiveText.isEmpty { styledText }
          if !html.isEmpty { htmlText }
          ForEach(children, id: \.self) { child in
            childView(child)
          }
        }
      } else {
        LogseqColumnLayout(nodeID: context.nodeID, spacing: style.stackSpacing ?? 0) {
          if !effectiveText.isEmpty { styledText }
          if !html.isEmpty { htmlText }
          ForEach(children, id: \.self) { child in
            childView(child)
          }
        }
      }
    }
  }

  @ViewBuilder private var styledContainer: some View {
    if style.isScrollable {
      // ScrollView must sit OUTSIDE the flex-height frame: inside it, a
      // `h-full` descendant would expand to the scroll area's unbounded
      // height proposal. The env flag suppresses flex height in there.
      ScrollView {
        elementBody
      }
      .environment(\.insideVerticalScroll, true)
      .frame(
        maxWidth: .infinity,
        maxHeight: (style.fullHeight || style.grow) ? .infinity : nil)
    } else {
      elementBody
    }
  }


  static let inlineTags: Set<String> = [
    "span", "strong", "em", "code", "small", "kbd", "u", "mark", "b", "i",
    "sup", "tspan", "em-emoji", "raw-text", "label",
  ]

  private var isInlineTag: Bool {
    LogseqElementView.inlineTags.contains(tag)
  }

  @ViewBuilder private var styledText: some View {
    let s = style
    Text(attributedText)
      .font(fontFor(s))
      .foregroundStyle(s.foreground ?? LogseqColors.primaryText)
      .lineLimit(s.lineLimitOne ? 1 : nil)
      .lineSpacing(s.lineSpacing ?? 0)
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

  /// Text prop — or, for <raw-text> placeholders, the attr carrying the
  /// text. OCaml's `txt` mounts a placeholder whose real DOM text node a
  /// web MutationObserver swaps in; on native the attr IS the text.
  /// (`nothing` carries an empty string and still renders nil.)
  private var effectiveText: String {
    if !text.isEmpty { return text }
    if tag == "raw-text" { return attrs["data-raw-text"] as? String ?? "" }
    return ""
  }

  private var attributedText: AttributedString {
    var base = effectiveText
    if base.isEmpty && tag == "em-emoji" {
      base = (attrs["data-emoji"] as? String) ?? (attrs["emoji"] as? String) ?? ""
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
    let children = context.childIDs
    if children.isEmpty {
      Text(attributedText)
        .font(fontFor(style))
        .foregroundStyle(LogseqColors.link)
        .underline()
        .modifier(LogseqStyleModifier(style: style, tag: tag))
        .contentShape(Rectangle())
        .onTapGesture {
          emit("click", payload: ["href": href, "button": 0])
        }
    } else {
      // Links carrying block children (nav items, page refs with icons) lay
      // their content out like a normal element — the whole row is the link.
      HStack(alignment: .center, spacing: style.stackSpacing ?? 4) {
        if !text.isEmpty { styledText }
        ForEach(children, id: \.self) { child in
          context.content(for: child)
        }
      }
      .modifier(LogseqStyleModifier(style: style, tag: tag))
      .contentShape(Rectangle())
      .onTapGesture {
        emit("click", payload: ["href": href, "button": 0])
      }
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

  /// Synthetic lifecycle events — always emitted regardless of `wired`,
  /// the OCaml side consumes them to keep its live-element set truthful.
  /// Emitted on the next main-actor tick: a synchronous emit during apply
  /// gets deferred to the end of apply and then re-enters the OCaml runtime
  /// while the outer C call is still on the stack. Unmounts go through the
  /// registry's anchor context: a node dropped by the patch is exactly when
  /// its own emit would throw "unknown extension event" and lose the unmount.
  private func emitLifecycle(_ name: String) {
    let id = domID
    guard !id.isEmpty else { return }
    let emitter =
      name == "element-unmount"
      ? LogseqElementRegistry.shared.eventAnchor : context
    Task { @MainActor [emitter] in
      guard let emitter,
        let data = try? JSONSerialization.data(withJSONObject: ["id": id]),
        let json = String(data: data, encoding: .utf8)
      else { return }
      try? emitter.emit(
        name: "dom-event",
        values: ["name": .string(name), "payload": .string(json)])
    }
  }

  func emit(_ name: String, payload: [String: Any] = [:]) {
    guard wiredEvents.contains(name) || name == "click" else { return }
    var enriched = payload
    enriched["nodeId"] = context.nodeID
    if let id = attrs["id"] as? String { enriched["targetId"] = id }
    // Document listeners decode `target` for closest()/scope resolution.
    enriched["target"] = LogseqDOMSnapshot.snapshot(for: context)
    guard let data = try? JSONSerialization.data(withJSONObject: enriched),
      let json = String(data: data, encoding: .utf8)
    else { return }
    do {
      try context.emit(
        name: "dom-event",
        values: ["name": .string(name), "payload": .string(json)])
    } catch {
      FileHandle.standardError.write(
        "[emit] FAILED \(tag) \(name) node=\(context.nodeID): \(error)\n"
          .data(using: .utf8)!)
    }
  }
}

/// Expansion weight read by the custom layouts on their direct children.
/// grow (flex-1) expands on both axes; fullWidth only horizontally,
/// fullHeight only vertically.
private struct LogseqGrowXKey: LayoutValueKey {
  static let defaultValue = 0
}

private struct LogseqGrowYKey: LayoutValueKey {
  static let defaultValue = 0
}

/// position:fixed analogue — the subview renders at its ideal size pinned to
/// the container's top-leading corner but consumes no flow space.
private struct LogseqOutOfFlowKey: LayoutValueKey {
  static let defaultValue = false
}

/// Non-wrapping horizontal row. Implemented as a custom Layout instead of
/// HStack: an HStack measures children through an iterative proposal
/// negotiation that livelocks (infinite resize/re-measure, 100% CPU) when a
/// `.frame(maxWidth: .infinity)` element sits anywhere inside a nested row
/// chain. This layout proposes bounded, concrete slices to each child so the
/// negotiation can't bounce.
struct LogseqRowLayout: Layout {
  var nodeID: Int = 0
  var spacing: CGFloat = 0

  func sizeThatFits(
    proposal: ProposedViewSize, subviews: Subviews, cache: inout ()
  ) -> CGSize {
    var width: CGFloat = 0
    var height: CGFloat = 0
    var flowIndex = 0
    for subview in subviews {
      let size = subview.sizeThatFits(.unspecified)
      if subview[LogseqOutOfFlowKey.self] { continue }
      if flowIndex > 0 { width += spacing }
      flowIndex += 1
      width += size.width
      height = max(height, size.height)
    }
    // A flex row fills the offered width like a block element, and stretches
    // to the offered height (align-items: stretch); its children then share
    // the real bounds in placeSubviews.
    return CGSize(
      width: proposal.width ?? width,
      height: proposal.height ?? height)
  }

  func placeSubviews(
    in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews,
    cache: inout ()
  ) {
    // Ideal widths first; leftover goes to grow-weighted children (flex-grow),
    // matching CSS — plain block children keep their ideal width.
    var ideals = [CGFloat]()
    var weights = [Int]()
    ideals.reserveCapacity(subviews.count)
    var total: CGFloat = 0
    var totalWeight = 0
    var flowIndex = 0
    for subview in subviews {
      let w = subview.sizeThatFits(.unspecified).width
      ideals.append(w)
      let weight = subview[LogseqGrowXKey.self]
      weights.append(weight)
      if subview[LogseqOutOfFlowKey.self] { continue }
      if flowIndex > 0 { total += spacing }
      flowIndex += 1
      totalWeight += weight
      total += w
    }
    let leftover = max(0, bounds.width - total)
    var x = bounds.minX
    for (index, subview) in subviews.enumerated() {
      if subview[LogseqOutOfFlowKey.self] {
        // position:fixed analogue — renders at ideal size pinned top-leading.
        subview.place(
          at: CGPoint(x: bounds.minX, y: bounds.minY),
          proposal: ProposedViewSize(
            width: ideals[index], height: bounds.height))
        continue
      }
      var w = ideals[index]
      if totalWeight > 0 {
        w += leftover * CGFloat(weights[index]) / CGFloat(totalWeight)
      }
      subview.place(
        at: CGPoint(x: x, y: bounds.minY),
        proposal: ProposedViewSize(width: w, height: bounds.height))
      x += w + spacing
    }
  }
}

/// Vertical stack with CSS block semantics: reports the offered width (like
/// `display: block`, width: auto → 100%) and proposes the full width to every
/// child. VStack can't be used here — it collapses to the widest child's
/// *ideal* width, so `.frame(maxWidth: .infinity)` descendants never see the
/// real proposal.
struct LogseqColumnLayout: Layout {
  var nodeID: Int = 0
  var spacing: CGFloat = 0

  func sizeThatFits(
    proposal: ProposedViewSize, subviews: Subviews, cache: inout ()
  ) -> CGSize {
    var idealWidth: CGFloat = 0
    var height: CGFloat = 0
    var flowIndex = 0
    for subview in subviews {
      let size = subview.sizeThatFits(
        ProposedViewSize(width: proposal.width, height: nil))
      if subview[LogseqOutOfFlowKey.self] { continue }
      if flowIndex > 0 { height += spacing }
      flowIndex += 1
      idealWidth = max(idealWidth, size.width)
      height += size.height
    }
    let width = proposal.width ?? idealWidth
    // Report the offered height when bounded — a bounded proposal comes from
    // a flex frame or a slice in placeSubviews, and the column must accept it
    // so leftover distribution can reach grow-weighted children.
    return CGSize(width: width, height: proposal.height ?? height)
  }

  func placeSubviews(
    in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews,
    cache: inout ()
  ) {
    // Ideal heights first; leftover goes to grow-weighted children so
    // flex-1/h-full content fills the column.
    var heights = [CGFloat]()
    var weights = [Int]()
    var total: CGFloat = 0
    var totalWeight = 0
    var flowIndex = 0
    let childProposal = ProposedViewSize(width: bounds.width, height: nil)
    for subview in subviews {
      let h = subview.sizeThatFits(childProposal).height
      heights.append(h)
      let weight = subview[LogseqGrowYKey.self]
      weights.append(weight)
      let oof = subview[LogseqOutOfFlowKey.self]
      if oof { continue }
      if flowIndex > 0 { total += spacing }
      flowIndex += 1
      totalWeight += weight
      total += h
    }
    let leftover = max(0, bounds.height - total)
    var y = bounds.minY
    for (index, subview) in subviews.enumerated() {
      if subview[LogseqOutOfFlowKey.self] {
        subview.place(
          at: CGPoint(x: bounds.minX, y: bounds.minY),
          proposal: ProposedViewSize(
            width: bounds.width, height: heights[index]))
        continue
      }
      var h = heights[index]
      if totalWeight > 0 {
        h += leftover * CGFloat(weights[index]) / CGFloat(totalWeight)
      }
      subview.place(
        at: CGPoint(x: bounds.minX, y: y),
        proposal: ProposedViewSize(width: bounds.width, height: h))
      y += h + spacing
    }
  }
}

private struct InsideVerticalScrollKey: EnvironmentKey {
  static let defaultValue = false
}

extension EnvironmentValues {
  var insideVerticalScroll: Bool {
    get { self[InsideVerticalScrollKey.self] }
    set { self[InsideVerticalScrollKey.self] = newValue }
  }
}

/// Applies the parsed style-class hints that map to native modifiers.
private struct LogseqStyleModifier: ViewModifier {
  let style: LogseqStyle
  let tag: String
  @Environment(\.insideVerticalScroll) private var insideScroll

  func body(content: Content) -> some View {
    // Inside a vertical ScrollView, `h-full`/`flex-1` must not become an
    // unbounded height: the scroll area proposes unbounded height, so
    // .infinity would expand the content to a degenerate size and push
    // siblings offscreen. Width stays bounded by the viewport.
    // Block-level elements (div/main/section/…) fill the offered width like
    // CSS `display: block` (width: auto → 100%); only inline tags stay
    // shrink-wrapped unless w-full/grow is set.
    let inline = LogseqElementView.inlineTags.contains(tag)
    return content
      .frame(minWidth: style.minWidth, minHeight: style.minHeight)
      .frame(width: style.fixedWidth, height: style.fixedHeight)
      .padding(style.padding ?? EdgeInsets())
      .background(style.background ?? Color.clear)
      .cornerRadius(style.cornerRadius ?? 0)
      .frame(
        maxWidth: (!inline || style.grow || style.fullWidth) ? .infinity : nil,
        maxHeight: (style.fullHeight && !insideScroll) ? .infinity : nil)
      .frame(maxWidth: style.maxWidth, maxHeight: style.maxHeight)
      .frame(
        maxWidth: style.centerHorizontally ? .infinity : nil,
        alignment: .center)
      .padding(style.margin ?? EdgeInsets())
      .opacity(style.alpha)
      .layoutPriority(style.grow ? 1 : 0)
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
    LogseqElementRegistry.shared.registerAnchor(id, context)
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
