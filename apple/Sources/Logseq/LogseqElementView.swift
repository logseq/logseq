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
  /// Rendered by the window-level overlay layer rather than inline —
  /// skips the presenter branch so the element draws normally.
  var inOverlay = false

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
    // cmdk rows signal the keyboard/mouse highlight via data-* attrs —
    // the web stylesheet paints the row bg from them.
    if (attrs["data-highlighted"] as? String) == "true"
      || (attrs["data-kb-highlighted"] as? String) == "true"
    {
      s.background = LogseqColors.gray(4)
      if s.cornerRadius == nil { s.cornerRadius = 6 }
    }
    return s
  }

  private var isBullet: Bool {
    guard case .string(let classes) = context.property("style-class")
    else { return false }
    return classes.split(separator: " ").contains { $0 == "bullet" }
  }

  /// `left-sidebar-inner` div — intercepted by LogseqNativeSidebar, which
  /// renders the subtree's data through a native macOS sidebar instead of
  /// the web-shaped DOM.
  private var isNativeSidebar: Bool {
    guard tag == "div",
      case .string(let classes) = context.property("style-class")
    else { return false }
    return classes.split(separator: " ").contains { $0 == "left-sidebar-inner" }
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
      // `ui__icon ti ls-icon-*` marks the icon by name class, not ti-* —
      // e.g. sidebar nav's ls-icon-calendar/cards/files/hierarchy.
      if cls.hasPrefix("ls-icon-") {
        return String(cls.dropFirst(8))
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
      .background(
        GeometryReader { g in
          Color.clear.preference(
            key: LogseqFrameKey.self,
            value: [context.nodeID: LogseqFrameEntry(
              rect: g.frame(in: .named("logseqWindow")), tag: tag)])
        })
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

    } else if isNativeSidebar {
      // Out-style native sidebar — the OCaml DOM subtree serves as the data
      // model while SwiftUI renders the native chrome.
      LogseqNativeSidebar(context: context)

    } else if style.fillsOverlay && !inOverlay {
      // position:fixed layers — the web renders these at window scope; our
      // collapsed overlay containers can't give them bounds, so the element
      // re-renders in LogseqOverlayLayer instead.
      LogseqOverlayPresenter(nodeID: context.nodeID, priority: style.overlayZ) {
        if style.fixedX != nil || style.fixedY != nil || style.fixedRight != nil
          || style.fixedBottom != nil {
          // Anchored element (dropdown/context menus, corner popups):
          // size-to-content at the fixed offsets, like CSS left/top/
          // right/bottom. .fixedSize() stops the alignment frame's
          // full-window proposal from expanding fill-style layouts —
          // CSS position:fixed elements shrink-wrap their content.
          let alignment: Alignment =
            style.fixedBottom != nil
            ? (style.fixedRight != nil ? .bottomTrailing : .bottomLeading)
            : (style.fixedRight != nil ? .topTrailing : .topLeading)
          LogseqElementView(tag: tag, context: context, inOverlay: true)
            .fixedSize()
            .padding(.leading, style.fixedX ?? 0)
            .padding(.trailing, style.fixedRight ?? 0)
            .padding(.top, style.fixedY ?? 0)
            .padding(.bottom, style.fixedBottom ?? 0)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: alignment)
        } else {
          // Full-viewport layer (dialog scrims, dismiss surfaces).
          LogseqElementView(tag: tag, context: context, inOverlay: true)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
      }
    } else {
      contentBody
    }
  }

  @ViewBuilder private var contentBody: some View {
    switch tag {
    // ---- text inputs ----
    case "textarea":
      // Code editors (data-lang) approximate CSS `field-sizing: content`
      // — size to the code's line count instead of a fixed one-liner.
      let codeMinHeight: CGFloat =
        (attrs["data-lang"] as? String).map { _ in
          max(24, CGFloat(text.split(
            separator: "\n", omittingEmptySubsequences: false).count) * 20)
        } ?? 24
      LogseqTextArea(
        context: context, attrs: attrs, style: style,
        wired: wiredEvents, text: text, domID: domID)
        .frame(minHeight: codeMinHeight)
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
    case "pdf":
      LogseqPDFView(context: context, attrs: attrs)
    // ---- svg family ----
    case "svg", "path", "circle", "rect", "line", "polyline", "polygon", "g",
         "defs", "use", "ellipse", "tspan":
      LogseqSVGView(tag: tag, attrs: attrs, context: context)
        .modifier(LogseqStyleModifier(style: style, tag: tag))
    // ---- misc ----
    case "br":
      Text("\n")
    case "hr":
      Divider()
    case "select":
      selectBody
    default:
      if let latex = latexInfo {
        LogseqLatexView(
          tex: latex.tex, displayMode: latex.display,
          fontSize: style.fontSize ?? defaultFontSize)
          .modifier(LogseqStyleModifier(style: style, tag: tag))
      } else if let icon = tablerIconName {
        LogseqTablerIcon(
          name: icon,
          color: style.foreground ?? LogseqColors.primaryText)
          .modifier(LogseqStyleModifier(style: style, tag: tag))
      } else {
        styledContainer
      }
    }
  }

  /// `.latex`/`.latex-inline` elements carry the raw TeX in a
  /// `span.opacity-0` child's `text` prop (the web katex scan renders it
  /// into the element; natively SwiftMath does).
  private var latexInfo: (tex: String, display: Bool)? {
    guard case .string(let classes) = context.property("style-class")
    else { return nil }
    let set = Set(classes.split(separator: " ").map(String.init))
    let isInline = set.contains("latex-inline")
    guard isInline || set.contains("latex") else { return nil }
    var tex = ""
    if let child = context.childIDs.first,
      case .string(let t) = context.childProperty(node: child, "text")
    {
      tex = t
    }
    return (tex, !isInline)
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
      // give it a phantom ~14pt line. A background-colored element is a
      // painted surface instead (dialog scrims, dividers): .background on a
      // zero-size EmptyView draws nothing, so fill directly.
      if let bg = style.background {
        // Painted surface (dialog scrim/dismiss layer, divider). It fills
        // its proposal, so a plain tap gesture doubles as the click target
        // the OCaml document listener uses for outside-click dismissal.
        Rectangle().fill(bg)
          .frame(width: style.fixedWidth, height: style.fixedHeight)
          .opacity(style.alpha)
          .contentShape(Rectangle())
          .onTapGesture {
            emit("click", payload: ["button": 0])
          }
      } else {
        EmptyView()
          .modifier(LogseqStyleModifier(style: style, tag: tag))
      }
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
      .layoutValue(
        key: LogseqAnchorKey.self,
        value: LogseqAnchor(
          x: s.fixedX, y: s.fixedY,
          right: s.fixedRight, bottom: s.fixedBottom))
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
        LogseqRowLayout(
          nodeID: context.nodeID, spacing: style.stackSpacing ?? 0,
          spaceBetween: style.spaceBetween) {
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
      stackBody
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
      stackBody
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

/// CSS absolute-position anchors for out-of-flow children — nil fields pin
/// that axis to the container's leading/top edge.
private struct LogseqAnchor: Equatable {
  var x: CGFloat?
  var y: CGFloat?
  var right: CGFloat?
  var bottom: CGFloat?
}

private struct LogseqAnchorKey: LayoutValueKey {
  static let defaultValue = LogseqAnchor()
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
  var spaceBetween = false

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
    let leftover = bounds.width - total
    // CSS resolves flex-grow before justify-content: grow-weighted
    // children absorb the leftover first; space-between only spreads
    // gaps when no child grows.
    var gap = spacing
    if spaceBetween && flowIndex > 1 && totalWeight == 0 {
      gap = spacing + max(0, leftover) / CGFloat(flowIndex - 1)
    }
    var x = bounds.minX
    for (index, subview) in subviews.enumerated() {
      if subview[LogseqOutOfFlowKey.self] {
        // position:absolute analogue — pinned inside the container at the
        // declared anchors (top-leading when none).
        let anchor = subview[LogseqAnchorKey.self]
        let w = ideals[index]
        let h = subview.sizeThatFits(.unspecified).height
        let px = anchor.x.map { bounds.minX + $0 }
          ?? anchor.right.map { bounds.maxX - $0 - w }
          ?? bounds.minX
        let py = anchor.y.map { bounds.minY + $0 }
          ?? anchor.bottom.map { bounds.maxY - $0 - h }
          ?? bounds.minY
        subview.place(
          at: CGPoint(x: px, y: py),
          proposal: ProposedViewSize(width: w, height: h))
        continue
      }
      var w = ideals[index]
      if totalWeight > 0 {
        // grow-weighted children absorb both the positive leftover
        // (flex-grow) and the deficit (flex-shrink defaults to 1) so a
        // flex-1 sibling yields to fixed-width siblings.
        w += leftover * CGFloat(weights[index]) / CGFloat(totalWeight)
      }
      w = max(0, w)
      subview.place(
        at: CGPoint(x: x, y: bounds.minY),
        proposal: ProposedViewSize(width: w, height: bounds.height))
      x += w + gap
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
    let leftover = bounds.height - total
    var y = bounds.minY
    for (index, subview) in subviews.enumerated() {
      if subview[LogseqOutOfFlowKey.self] {
        let anchor = subview[LogseqAnchorKey.self]
        let w = subview.sizeThatFits(
          ProposedViewSize(width: bounds.width, height: heights[index])).width
        let px = anchor.x.map { bounds.minX + $0 }
          ?? anchor.right.map { bounds.maxX - $0 - w }
          ?? bounds.minX
        let py = anchor.y.map { bounds.minY + $0 }
          ?? anchor.bottom.map { bounds.maxY - $0 - heights[index] }
          ?? bounds.minY
        subview.place(
          at: CGPoint(x: px, y: py),
          proposal: ProposedViewSize(
            width: bounds.width, height: heights[index]))
        continue
      }
      var h = heights[index]
      if totalWeight > 0 {
        h += leftover * CGFloat(weights[index]) / CGFloat(totalWeight)
      }
      h = max(0, h)
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

/// Frame bookkeeping: every element reports its window-space frame through
/// a preference. Feeds `dump-frames` (debug) and right-click hit-testing —
/// DOM contextmenu needs the deepest element at the pointer, which SwiftUI
/// gestures can't reach (they don't exist for right-click).
struct LogseqFrameEntry: Equatable {
  let rect: CGRect
  let tag: String
}

@MainActor enum LogseqFrameStore {
  static var entries: [Int: LogseqFrameEntry] = [:]

  /// Deepest element at the point: smallest containing frame wins,
  /// approximating DOM hit order (children paint over ancestors).
  static func hitTest(_ point: CGPoint) -> (nodeID: Int, tag: String)? {
    var best: (id: Int, area: CGFloat)?
    for (id, entry) in entries where entry.rect.contains(point) {
      let area = entry.rect.width * entry.rect.height
      if best == nil || area < best!.area { best = (id, area) }
    }
    guard let best, let entry = entries[best.id] else { return nil }
    return (best.id, entry.tag)
  }
}

struct LogseqFrameKey: PreferenceKey {
  static let defaultValue: [Int: LogseqFrameEntry] = [:]
  static func reduce(value: inout [Int: LogseqFrameEntry], nextValue: () -> [Int: LogseqFrameEntry]) {
    value.merge(nextValue()) { _, new in new }
  }
}

/// Applies the parsed style-class hints that map to native modifiers.
private struct LogseqStyleModifier: ViewModifier {
  let style: LogseqStyle
  let tag: String
  @Environment(\.insideVerticalScroll) private var insideScroll
  @State private var hovering = false

  func body(content: Content) -> some View {
    // Inside a vertical ScrollView, `h-full`/`flex-1` must not become an
    // unbounded height: the scroll area proposes unbounded height, so
    // .infinity would expand the content to a degenerate size and push
    // siblings offscreen. Width stays bounded by the viewport.
    // Block-level elements (div/main/section/…) fill the offered width like
    // CSS `display: block` (width: auto → 100%); only inline tags stay
    // shrink-wrapped unless w-full/grow is set.
    let inline = LogseqElementView.inlineTags.contains(tag)
    // Anchored overlays (position:fixed with left/top/right/bottom) must
    // size to content — a fill frame would expand them to the window and
    // re-center their fixed-width box instead of pinning the anchor.
    let anchored = style.fixedX != nil || style.fixedY != nil
      || style.fixedRight != nil || style.fixedBottom != nil
    return content
      .frame(minWidth: style.minWidth, minHeight: style.minHeight)
      .frame(width: style.fixedWidth, height: style.fixedHeight)
      .padding(style.padding ?? EdgeInsets())
      .background {
        if style.sidebarMaterial {
          ZStack {
            LogseqSidebarMaterial()
            // lx-gray-02 wash over the vibrancy — keeps the Logseq tone
            // readable over busy wallpapers while staying native.
            LogseqColors.gray(2).opacity(0.6)
          }
        } else {
          (hovering ? (style.hoverBackground ?? style.background) : style.background)
            ?? Color.clear
        }
      }
      .cornerRadius(style.cornerRadius ?? 0)
      .onHover { hovering = $0 }
      // CSS default content alignment is start — SwiftUI's frame default
      // is .center, which would center short text in a grown span.
      .frame(
        maxWidth: (!inline || style.grow || style.fullWidth) && !anchored
          ? .infinity : nil,
        maxHeight: (style.fullHeight && !insideScroll) ? .infinity : nil,
        alignment: .leading)
      .frame(maxWidth: style.maxWidth, maxHeight: style.maxHeight)
      .frame(
        maxWidth: style.centerHorizontally ? .infinity : nil,
        alignment: .center)
      .shadow(
        color: style.hasShadow ? Color.black.opacity(0.3) : .clear,
        radius: style.hasShadow ? 16 : 0, y: style.hasShadow ? 8 : 0)
      .padding(style.margin ?? EdgeInsets())
      .opacity(style.alpha)
      .layoutPriority(style.grow ? 1 : 0)
  }
}

/// macOS sidebar vibrancy (NSVisualEffectView `.sidebar` material) — the
/// native translucent backdrop Out's NavigationSplitView sidebar gets for
/// free; adapts to dark mode and window key state automatically.
struct LogseqSidebarMaterial: NSViewRepresentable {
  func makeNSView(context: Context) -> NSVisualEffectView {
    let view = NSVisualEffectView()
    view.material = .sidebar
    view.blendingMode = .behindWindow
    view.state = .active
    return view
  }
  func updateNSView(_ nsView: NSVisualEffectView, context: Context) {}
}

/// Window-level overlay: elements styled `fillsOverlay` (position:fixed
/// viewport layers — dialog overlays, dismiss surfaces) register here and
/// render above the app content at full window bounds, preserving DOM tree
/// order as z-order.
@MainActor final class LogseqOverlayStore: ObservableObject {
  static let shared = LogseqOverlayStore()
  @Published private(set) var order: [Int] = []
  private var views: [Int: AnyView] = [:]
  private var keys: [Int: (priority: Int, seq: Int)] = [:]
  private var seq = 0

  func present(_ id: Int, _ view: AnyView, priority: Int) {
    if keys[id] == nil {
      seq += 1
      keys[id] = (priority, seq)
    }
    views[id] = view
    order = keys.keys.sorted {
      let a = keys[$0]!, b = keys[$1]!
      return (a.priority, a.seq) < (b.priority, b.seq)
    }
  }

  func dismiss(_ id: Int) {
    views[id] = nil
    keys[id] = nil
    order.removeAll { $0 == id }
  }

  func view(for id: Int) -> AnyView { views[id] ?? AnyView(EmptyView()) }
}

struct LogseqOverlayLayer: View {
  @ObservedObject private var store = LogseqOverlayStore.shared

  var body: some View {
    ZStack(alignment: .topLeading) {
      ForEach(store.order, id: \.self) { id in
        store.view(for: id)
      }
    }
  }
}

/// Placeholder left in the normal layout flow; the real render happens in
/// LogseqOverlayLayer.
private struct LogseqOverlayPresenter<Content: View>: View {
  let nodeID: Int
  let priority: Int
  let body_: () -> Content

  init(nodeID: Int, priority: Int, @ViewBuilder content: @escaping () -> Content) {
    self.nodeID = nodeID
    self.priority = priority
    body_ = content
  }

  var body: some View {
    Color.clear
      .frame(width: 0, height: 0)
      .onAppear {
        LogseqOverlayStore.shared.present(nodeID, AnyView(body_()), priority: priority)
      }
      .onDisappear { LogseqOverlayStore.shared.dismiss(nodeID) }
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
    // Elements without a DOM id are still addressable by node ref —
    // OCaml's doc_query_selector emits "#ref": "node-<id>" for them.
    let handle = LogseqElementHandle(nodeID: context.nodeID)
    LogseqElementRegistry.shared.register("node-\(context.nodeID)", handle)
    LogseqElementRegistry.shared.registerContext(context)
    guard !id.isEmpty else { return }
    LogseqElementRegistry.shared.register(id, handle)
    LogseqElementRegistry.shared.registerAnchor(id, context)
  }

  private func unregister() {
    LogseqElementRegistry.shared.unregister("node-\(context.nodeID)")
    LogseqElementRegistry.shared.unregisterContext(context.nodeID)
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
