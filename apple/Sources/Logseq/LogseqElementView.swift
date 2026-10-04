import AppKit
import Foundation
import LUIAppleBackend
import SwiftUI

/// String-keyed memo for the two hot parsers: `attrs` JSON and
/// `LogseqStyle.parse(style-class)`. Both are pure functions of their input
/// string and every element body eval re-parses them 10-20× (plus once per
/// child in `childStyle`), so a ~500-element re-render used to run ~10k
/// `JSONSerialization` calls per pass. Values change only when the raw string
/// changes, so the string itself is the correct cache key; a size cap keeps
/// churned strings from growing the maps unboundedly.
@MainActor enum LogseqParseMemo {
  private static var attrsCache: [String: [String: Any]] = [:]
  private static var styleCache: [String: LogseqStyle] = [:]

  static func attrs(_ json: String) -> [String: Any] {
    if let hit = attrsCache[json] { return hit }
    let dict =
      (try? JSONSerialization.jsonObject(with: Data(json.utf8)))
      as? [String: Any] ?? [:]
    if attrsCache.count > 4096 { attrsCache.removeAll(keepingCapacity: true) }
    attrsCache[json] = dict
    return dict
  }

  static func style(_ classes: String) -> LogseqStyle {
    if let hit = styleCache[classes] { return hit }
    let parsed = LogseqStyle.parse(classes)
    if styleCache.count > 4096 { styleCache.removeAll(keepingCapacity: true) }
    styleCache[classes] = parsed
    return parsed
  }
}

enum LogseqPerf {
  /// Chatty per-call probes (view evals, layout measure/place, dom-ops,
  /// domfocus) gate here instead of LOGSEQ_PERF — thousands of synchronous
  /// stderr writes inside a main-turn drain were inflating the very stalls
  /// the probes measure.
  nonisolated static let detail =
    ProcessInfo.processInfo.environment["LOGSEQ_PERF_DETAIL"] != nil
}

/// TODO(perf-experiment): Equatable conformance measured separately — see
/// NOTES.md stall investigation.

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
  @Environment(\.logseqInOverlay) private var nestedInOverlay
  @Environment(\.logseqInImperative) private var inImperativeLayer
  /// lui-overlay.css's `#ui__ac-inner` max-height: the enclosing
  /// `data-editor-popup-ref` popover pushes its --available-height budget
  /// down through this env so the AC list caps at
  /// `min(avail − chrome, cap)` like the web.
  @Environment(\.acInnerMaxHeight) private var acInnerMaxHeight
  /// Theme flips bump appearanceVersion — style parse reads isDark for
  /// `dark:` rules and step picks, so the body must re-eval then.
  @ObservedObject private var appState = LogseqAppState.shared

  private var attrs: [String: Any] {
    guard case .string(let json) = context.property("attrs") else { return [:] }
    return LogseqParseMemo.attrs(json)
  }

  private var wiredEvents: Set<String> {
    guard case .string(let names) = context.property("events") else { return [] }
    return Set(names.split(separator: " ").map(String.init))
  }

  private var style: LogseqStyle {
    var s = LogseqStyle()
    if case .string(let classes) = context.property("style-class") {
      s = LogseqParseMemo.style(classes)
    }
    if case .string(let accId) = context.property("accessibility-identifier") {
      s.applyAccessibilityId(accId)
    }
    if let inline = attrs["style"] as? String {
      s.applyInline(inline)
    }
    // cmdk rows signal the keyboard/mouse highlight via data-* attrs —
    // the web stylesheet paints the row bg from them. Context-menu rows
    // set data-highlighted="" (presence, not "true").
    if attrs["data-highlighted"] != nil
      || attrs["data-kb-highlighted"] != nil
    {
      s.background = LogseqColors.gray(4)
      if s.cornerRadius == nil { s.cornerRadius = 6 }
    }
    // lui-overlay.css attr rules for editor popovers:
    // [data-editor-popup-ref] → p-1.5 w-72; the search kinds widen to 32rem.
    if attrs["data-editor-popup-ref"] is String {
      s.padding = EdgeInsets(top: 6, leading: 6, bottom: 6, trailing: 6)
      switch attrs["data-editor-popup-ref"] as? String {
      case "page-search", "block-search", "page-search-hashtag":
        s.fixedWidth = 512
      case "datepicker":
        break // width: auto
      default:
        s.fixedWidth = 288
      }
      // .ui__popover-content[data-side=top] { top: -18px } — the flipped
      // positioner nudges the popup up to clear the caret line.
      if (attrs["data-side"] as? String) == "top" {
        s.fixedY = (s.fixedY ?? 0) - 18
      }
    }
    let live = LogseqStyleOverrides.shared.liveDecls(
      for: context.nodeID, emitted: attrs["style"] as? String ?? "")
    for decl in live {
      s.applyInline(decl)
    }
    return s
  }

  /// Hit-test layer for LogseqFrameStore: overlay/imperative popups paint
  /// above page content; overlayZ keeps same-layer stacking order.
  private var frameZ: Int {
    (inOverlay || nestedInOverlay || inImperativeLayer ? 1000 : 0)
      + style.overlayZ
  }

  private func hasClass(_ cls: String) -> Bool {
    guard case .string(let classes) = context.property("style-class")
    else { return false }
    return classes.split(separator: " ").contains { $0 == cls }
  }

  /// The popover's remaining vertical budget for a descendant
  /// `#ui__ac-inner` (the CSS `min(--available-height - chrome, cap)`).
  private var acPopupAvail: CGFloat? {
    guard hasClass("ui__popover-content"),
      attrs["data-editor-popup-ref"] is String
    else { return nil }
    let top = (attrs["data-side"] as? String) == "top"
    let avail = style.maxHeight ?? 480
    return min(avail - (top ? 60 : 20), top ? 460 : 480)
  }

  private var isBullet: Bool {
    guard case .string(let classes) = context.property("style-class")
    else { return false }
    return classes.split(separator: " ").contains { $0 == "bullet" }
  }

  /// `left-sidebar-inner` div — the node whose subtree backs the
  /// NavigationSplitView sidebar column (LogseqSidebarStore hands its
  /// context to the App-level split view); inline it mounts invisibly so
  /// element emitters stay live.
  private var isNativeSidebar: Bool {
    guard tag == "div",
      case .string(let classes) = context.property("style-class")
    else { return false }
    return classes.split(separator: " ").contains { $0 == "left-sidebar-inner" }
  }

  /// `cp__sidebar-left-layout` — the DOM sidebar container. The split
  /// view owns the chrome now; it still mounts (hidden) so its `is-open`
  /// class can drive the column visibility (style.wantsOpen marks it).
  private var isLeftSidebarLayout: Bool { style.wantsOpen }

  /// The split-view column visibility source-of-truth: open iff the DOM
  /// sidebar container carries `is-open`.
  private var sidebarOpen: Bool { style.wantsOpen && style.hasIsOpen }

  /// Right sidebar `.resizer` separator — the OCaml side emits a static
  /// element; the width drag is native view state (LogseqRightSidebarLayout).
  /// The drag handle renders as an overlay on `cp__right-sidebar` instead of
  /// the resizer node itself: the resizer is an out-of-flow *sibling* of the
  /// sidebar content, which covers it in hit-test order.
  private var isRightSidebarResizer: Bool {
    guard case .string(let classes) = context.property("style-class")
    else { return false }
    return classes.split(separator: " ").contains { $0 == "resizer" }
  }

  private var isRightSidebarContainer: Bool {
    guard case .string(let classes) = context.property("style-class")
    else { return false }
    return classes.split(separator: " ").contains { $0 == "cp__right-sidebar" }
  }

  /// `ti-<name>`/`tie-<name>` classes on `i`/`span` mark a tabler font icon;
  /// resolve the icon name + whether it's the extension font (nil when the
  /// node isn't an icon).
  private var tablerIconName: (name: String, ext: Bool)? {
    guard tag == "i" || tag == "span" else { return nil }
    guard case .string(let classes) = context.property("style-class")
    else { return nil }
    for cls in classes.split(separator: " ") {
      if cls.hasPrefix("tie-") {
        return (String(cls.dropFirst(4)), true)
      }
      if cls.hasPrefix("ti-") {
        return (String(cls.dropFirst(3)), false)
      }
      // `ui__icon ti ls-icon-*` marks the icon by name class, not ti-* —
      // e.g. sidebar nav's ls-icon-calendar/cards/files/hierarchy.
      if cls.hasPrefix("ls-icon-") {
        return (String(cls.dropFirst(8)), false)
      }
    }
    return nil
  }

  private var text: String {
    if case .string(let t) = context.property("text") { return t }
    return ""
  }

  /// `block-content-wrapper` — the page title row; its hover state
  /// reveals `ls-page-title-actions` descendants.
  private var isTitleHoverRegion: Bool {
    guard case .string(let classes) = context.property("style-class")
    else { return false }
    return classes.split(separator: " ").contains {
      $0 == "block-content-wrapper"
    }
  }

  /// `ls-page-title-actions` — the "Add icon"/"Set property" row; shows
  /// only while the pointer is over the title block (web parity).
  private var isTitleActions: Bool {
    guard case .string(let classes) = context.property("style-class")
    else { return false }
    return classes.split(separator: " ").contains {
      $0 == "ls-page-title-actions"
    }
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

  private func perfProbe() -> Int {
    guard LogseqPerf.detail else { return 0 }
    var s = ""
    if case .string(let v) = context.property("accessibility-identifier") { s = v }
    guard s.hasPrefix("journal") || context.nodeID < 700 else { return 0 }
    let kids = context.childIDs.prefix(6).map(String.init).joined(separator: ",")
    FileHandle.standardError.write(
      "PERF view id=\(context.nodeID) a=\(s) kids=[\(kids)] t=\(CFAbsoluteTimeGetCurrent())\n"
        .data(using: .utf8)!)
    return 1
  }

  var body: some View {
    // Subscribe to this node's model revision: childIDs/property reads are
    // untracked backend lookups, so the element must invalidate on its own
    // or a skipped parent re-render leaves it stale (white screen flake).
    let _ = context.revision
    let _ = perfProbe()
    if inOverlay {
      // Anchor/sizing for the overlay copy is applied here — inside the
      // element's own body — so it re-reads `style` on every prop change.
      // The store's AnyView snapshot can only freeze the placeholder, not
      // this body's modifiers (AC flip repositions must be live).
      if style.fixedX != nil || style.fixedY != nil || style.fixedRight != nil
        || style.fixedBottom != nil {
        let alignment: Alignment =
          style.fixedBottom != nil
          ? (style.fixedRight != nil ? .bottomTrailing : .bottomLeading)
          : (style.fixedRight != nil ? .topTrailing : .topLeading)
        core
          .fixedSize()
          .modifier(
            LogseqEdgeClamp(
              x: style.fixedX, y: style.fixedY,
              right: style.fixedRight, bottom: style.fixedBottom))
          .padding(.leading, style.fixedX ?? 0)
          .padding(.trailing, style.fixedRight ?? 0)
          .padding(.top, style.fixedY ?? 0)
          .padding(.bottom, style.fixedBottom ?? 0)
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: alignment)
      } else {
        // Full-viewport layer (dialog scrims, dismiss surfaces).
        core.frame(maxWidth: .infinity, maxHeight: .infinity)
      }
    } else {
      core
    }
  }

  private var core: some View {
    content
      .id(context.nodeID)
      // Base page frames arrive via the backend `onFramesReport` channel
      // (LogseqFrameStore.baseEntries); this overlay/imperative report is
      // the only per-element geometry hook left — it feeds the z≥1000
      // layer so popups out-hit the content below them. The fillsOverlay
      // presenter is a 0x0 placeholder (inOverlay=false there), so only
      // the real overlay/imperative render writes. `path` elements draw
      // their viewBox literally (a 0 0 192 512 arrow reports 192x512)
      // and swallow monitor hit-tests — the parent svg/a reports it.
      .onGeometryChange(for: CGRect.self) { g in
        g.frame(in: .global)
      } action: { rect in
        if (inOverlay || nestedInOverlay || inImperativeLayer)
          && tag != "path"
        {
          LogseqFrameStore.overlayEntries[context.nodeID] =
            LogseqFrameEntry(
              rect: rect, tag: tag, z: frameZ,
              scrim: style.overlayZ < 0 || hasClass("ls-popup-backdrop"))
        }
      }
      .onDisappear {
        LogseqFrameStore.overlayEntries.removeValue(forKey: context.nodeID)
      }
      .onHover { inside in
        if isTitleHoverRegion {
          LogseqTitleHoverStore.shared.set(context.nodeID, inside: inside)
          if ProcessInfo.processInfo.environment["LOGSEQ_DUMP"] != nil {
            try? "{\"hover\":\(inside),\"node\":\(context.nodeID)}".write(
              toFile: "/tmp/title-hover.json", atomically: true,
              encoding: .utf8)
          }
        }
      }
      .onAppear {
        // OCaml's get_element_by_id only resolves elements that have
        // announced themselves — its DOM probes (e.g. #ui__ac-inner for an
        // open autocomplete) depend on truthful mount state.
        emitLifecycle("element-mount")
        if isLeftSidebarLayout {
          LogseqSidebarStore.shared.open = sidebarOpen
          if ProcessInfo.processInfo.environment["LOGSEQ_DUMP"] != nil {
            try? "{\"open\":\(sidebarOpen)}".write(
              toFile: "/tmp/sidebar-open.json", atomically: true,
              encoding: .utf8)
          }
        }
      }
      .onDisappear {
        emitLifecycle("element-unmount")
        if isLeftSidebarLayout { LogseqSidebarStore.shared.open = false }
        if isTitleHoverRegion {
          LogseqTitleHoverStore.shared.set(context.nodeID, inside: false)
        }
      }
      .onChange(of: sidebarOpen) { _, open in
        if isLeftSidebarLayout {
          LogseqSidebarStore.shared.open = open
          if ProcessInfo.processInfo.environment["LOGSEQ_DUMP"] != nil {
            try? "{\"open\":\(open)}".write(
              toFile: "/tmp/sidebar-open.json", atomically: true,
              encoding: .utf8)
          }
        }
      }
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
      // The OCaml DOM subtree is the data model for the split view's
      // sidebar column; mount it invisibly so emitters stay live.
      LogseqSidebarMount(context: context)

    } else if isLeftSidebarLayout {
      // The split view owns the sidebar chrome; keep mounting children so
      // left-sidebar-inner can register for the column.
      contentBody

    } else if isRightSidebarResizer {
      LogseqSidebarResizer()

    } else if isRightSidebarContainer {
      contentBody.overlay(alignment: .topLeading) { LogseqSidebarResizer() }

    } else if style.fillsOverlay && !inOverlay
      && !(nestedInOverlay && !style.isAnchored)
    {
      // position:fixed layers — the web renders these at window scope; our
      // collapsed overlay containers can't give them bounds, so the element
      // re-renders in LogseqOverlayLayer instead. The anchor/sizing lives in
      // the overlay copy's own body so it stays reactive to style changes.
      // A fillsOverlay child already inside an overlay stays inline (the
      // scrim centers its dialog content) UNLESS it carries edge anchors —
      // those are window-space coords that need their own layer (a
      // dropdown-menu-sub-content beside its trigger).
      LogseqOverlayPresenter(nodeID: context.nodeID, priority: style.overlayZ) {
        LogseqElementView(tag: tag, context: context, inOverlay: true)
          .environment(\.logseqInOverlay, true)
      }
    } else if isTitleActions {
      LogseqTitleActionsBody(content: contentBody, context: context)
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
          name: icon.name, ext: icon.ext, size: style.fontSize ?? 16,
          color: style.foreground ?? LogseqColors.primaryText)
          .modifier(LogseqStyleModifier(style: style, tag: tag))
      } else if classSet.contains("ui__switch") {
        // shui Switch -> native toggle; the click wires the OCaml handler
        // which re-renders aria-checked (thumb child is not rendered)
        switchBody
      } else if classSet.contains("ui__checkbox") {
        checkboxBody
      } else if let theme = themePreviewMode {
        themePreviewBody(theme)
      } else {
        styledContainer
      }
    }
  }

  /// style-class set for the component-level branches (switch, checkbox,
  /// theme preview) — tag dispatch can't see class semantics otherwise.
  private var classSet: Set<String> {
    guard case .string(let classes) = context.property("style-class")
    else { return [] }
    return Set(classes.split(separator: " ").map(String.init))
  }

  /// `i.mode-light/dark/system` — the theme preview thumbnails bundled
  /// from resources/img (copied to Contents/Resources by build.sh).
  private var themePreviewMode: String? {
    for mode in ["light", "dark", "system"] where classSet.contains("mode-" + mode) {
      return mode
    }
    return nil
  }

  @ViewBuilder private func themePreviewBody(_ mode: String) -> some View {
    if let url = Bundle.main.url(forResource: mode + "-theme", withExtension: "png"),
       let img = NSImage(contentsOf: url) {
      Image(nsImage: img)
        .resizable()
        .aspectRatio(contentMode: .fill)
        .modifier(LogseqStyleModifier(style: style, tag: tag))
        .clipped()
    } else {
      Color.clear.modifier(LogseqStyleModifier(style: style, tag: tag))
    }
  }

  /// span.ui__switch[role=switch][aria-checked] -> Toggle(.switch). The
  /// setter emits click instead of mutating: OCaml owns the state and
  /// re-renders the attribute.
  @ViewBuilder private var switchBody: some View {
    let on = attrs["aria-checked"] as? String == "true"
      || attrs["data-checked"] != nil
    Toggle(
      "",
      isOn: Binding(
        get: { on },
        set: { _ in emit("click", payload: ["button": 0]) }))
    .labelsHidden()
    .toggleStyle(.switch)
    .modifier(LogseqStyleModifier(style: style, tag: tag))
  }

  /// button.ui__checkbox[role=checkbox][aria-checked] -> Toggle(.checkbox);
  /// same emit-on-set contract, check svg child stays unrendered.
  @ViewBuilder private var checkboxBody: some View {
    let on = attrs["aria-checked"] as? String == "true"
      || attrs["data-checked"] != nil
    Toggle(
      "",
      isOn: Binding(
        get: { on },
        set: { _ in emit("click", payload: ["button": 0]) }))
    .labelsHidden()
    .toggleStyle(.checkbox)
    .modifier(LogseqStyleModifier(style: style, tag: tag))
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

  private func perfBody(_ children: [Int]) -> Int {
    guard LogseqPerf.detail,
          (context.nodeID >= 139 && context.nodeID <= 141)
            || (context.nodeID >= 183 && context.nodeID <= 184) else { return 0 }
    FileHandle.standardError.write(
      "PERF ebody id=\(context.nodeID) hidden=\(style.isHidden) kids=\(children.count) text=\(!effectiveText.isEmpty) scroll=\(style.isScrollable)\n"
        .data(using: .utf8)!)
    return 1
  }

  @ViewBuilder private var elementBody: some View {
    let children = context.childIDs
    let _ = perfBody(children)
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
      s = LogseqParseMemo.style(classes)
    }
    if case .string(let accId) = context.childProperty(node: child, "accessibility-identifier") {
      s.applyAccessibilityId(accId)
    }
    if case .string(let attrJson) = context.childProperty(node: child, "attrs"),
      let inline = LogseqParseMemo.attrs(attrJson)["style"] as? String
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
      // Inside the overlay layer a nested fillsOverlay child renders inline
      // (no second hoist) — it participates in the overlay's own layout
      // (e.g. a flex-centered dialog overlay) rather than being pinned.
      // Anchored children are the exception: their left/top are window
      // coords, so they still hoist out of the parent's layout.
      .layoutValue(
        key: LogseqOutOfFlowKey.self,
        value: s.outOfFlow && !(nestedInOverlay && s.fillsOverlay && !s.isAnchored))
      .layoutValue(
        key: LogseqOutOfFlowFillYKey.self, value: s.outOfFlowFillY)
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
      if inline || style.flowWrap {
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
          spaceBetween: style.spaceBetween,
          centerMain: style.centerMain, centerCross: style.centerCross) {
          if !effectiveText.isEmpty { styledText }
          if !html.isEmpty { htmlText }
          ForEach(children, id: \.self) { child in
            childView(child)
          }
        }
      } else {
        LogseqColumnLayout(
          nodeID: context.nodeID, spacing: style.stackSpacing ?? 0,
          centerMain: style.centerMain, centerCross: style.centerCross) {
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
      ScrollViewReader { proxy in
        ScrollView {
          elementBody
            .scrollTargetLayout()
        }
        .scrollIndicators(style.hideScrollIndicators ? .never : .automatic)
        .onAppear {
          LogseqScrollProxyStore.shared.set(context.nodeID, proxy)
        }
        .onDisappear {
          LogseqScrollProxyStore.shared.set(context.nodeID, nil)
        }
      }
      .environment(\.insideVerticalScroll, true)
      .frame(
        maxWidth: .infinity,
        maxHeight: acInnerMaxHeight
          ?? ((style.fullHeight || style.grow) ? .infinity : nil))
    } else if let acAvail = acPopupAvail {
      // Editor popover — give a descendant #ui__ac-inner its height cap.
      elementBody
        .environment(\.acInnerMaxHeight, acAvail)
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
    if tag == "em-emoji" {
      return (attrs["data-emoji"] as? String) ?? (attrs["emoji"] as? String) ?? ""
    }
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
      let text = Text(attributedText)
        .font(fontFor(style))
        .foregroundStyle(LogseqColors.link)
      if style.suppressLinkDecoration {
        text
          .modifier(LogseqStyleModifier(style: style, tag: tag))
          .contentShape(Rectangle())
          .onTapGesture {
            emit("click", payload: ["href": href, "button": 0])
          }
      } else {
        text
          .underline()
          .modifier(LogseqStyleModifier(style: style, tag: tag))
          .contentShape(Rectangle())
          .onTapGesture {
            emit("click", payload: ["href": href, "button": 0])
          }
      }
    } else {
      // Links carrying block children (nav items, page refs with icons) lay
      // their content out like a normal element — the whole row is the link.
      stackBody
      .modifier(LogseqStyleModifier(style: style, tag: tag))
      .foregroundStyle(style.linkColoredText ? LogseqColors.link : .primary)
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
      // option value attr wins like HTML; options without one submit
      // their text (the date-format rows carry no value attr)
      return (v.isEmpty ? label : v, label)
    }
    Picker(
      "",
      selection: Binding(
        get: { attrs["value"] as? String ?? "" },
        set: { emit("change", payload: ["value": $0]) })) {
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
    // DOM-shaped fields document listeners read (overlay-click checks
    // targetClass for its own class, target for closest() walking).
    if case .string(let classes) = context.childProperty(
      node: context.nodeID, "style-class")
    {
      enriched["targetClass"] = classes
    }
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

/// Marks views re-rendered inside LogseqOverlayLayer — a `fillsOverlay`
/// descendant must NOT hoist again: its parent already provides window
/// bounds and (for dialog overlays) the centering layout the web relies on.
private struct LogseqInOverlayKey: EnvironmentKey {
  static let defaultValue = false
}

extension EnvironmentValues {
  var logseqInOverlay: Bool {
    get { self[LogseqInOverlayKey.self] }
    set { self[LogseqInOverlayKey.self] = newValue }
  }
}

/// Marks views rendered inside LogseqImperativeLayer — a body-attached
/// popup paints above page content, so its frames must outrank
/// underlying elements in LogseqFrameStore.hitTest regardless of size.
/// Distinct from logseqInOverlay: the imperative layer does NOT
/// suppress fillsOverlay hoisting (popups still pin to window bounds).
private struct LogseqInImperativeKey: EnvironmentKey {
  static let defaultValue = false
}

extension EnvironmentValues {
  var logseqInImperative: Bool {
    get { self[LogseqInImperativeKey.self] }
    set { self[LogseqInImperativeKey.self] = newValue }
  }
}

/// `block-content-wrapper` node ids currently under the pointer —
/// `ls-page-title-actions` ("Add icon"/"Set property") fades in only
/// while its own wrapper ancestor is hovered (web's
/// `.block-content-wrapper:hover .ls-page-title-actions`). A shared store,
/// not the environment: extension children resolve through AnyView
/// snapshots where env writes on the element view can get dropped.
@MainActor
final class LogseqTitleHoverStore: ObservableObject {
  static let shared = LogseqTitleHoverStore()
  @Published private(set) var hovered: Set<Int> = []

  func set(_ nodeID: Int, inside: Bool) {
    if inside {
      hovered.insert(nodeID)
    } else {
      hovered.remove(nodeID)
    }
  }
}

/// `ls-page-title-actions` wrapper — holds the ONLY titleHoverStore
/// subscription. If the store lived on LogseqElementView directly, every
/// publish (each title-block hover enter/exit AND each unmount's
/// set(false)) would re-eval all ~500 element bodies at once.
private struct LogseqTitleActionsBody<Content: View>: View {
  let content: Content
  let context: LUIAppleExtensionViewContext
  @ObservedObject private var store = LogseqTitleHoverStore.shared

  /// Web parity: visible only while an ancestor `block-content-wrapper`
  /// is hovered.
  private var visible: Bool {
    var ancestor = context.parentID(of: context.nodeID)
    while let id = ancestor {
      if store.hovered.contains(id) { return true }
      ancestor = context.parentID(of: id)
    }
    return false
  }

  var body: some View {
    content
      .opacity(visible ? 1 : 0)
      .allowsHitTesting(visible)
      .animation(.easeInOut(duration: 0.12), value: visible)
  }
}

private struct LogseqOutOfFlowKey: LayoutValueKey {
  static let defaultValue = false
}

/// position:absolute inset-y-0 — the OOF child is stretched to the
/// container's height instead of its ideal size.
private struct LogseqOutOfFlowFillYKey: LayoutValueKey {
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
  /// justify-center — center the packed row horizontally (ignored when a
  /// child grows or space-between already distributes the leftover).
  var centerMain = false
  /// items-center — center each child on the row's cross axis (vertically)
  /// instead of stretching it to the row height.
  var centerCross = false

  /// Ideal size per child, measured once in `sizeThatFits` and reused by
  /// `placeSubviews` — re-measuring inside place re-walks the whole child
  /// subtree per container, multiplying a single layout pass by the depth.
  typealias Cache = [CGSize]

  func makeCache(subviews: Subviews) -> Cache { [] }

  func sizeThatFits(
    proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache
  ) -> CGSize {
    cache = subviews.map { $0.sizeThatFits(.unspecified) }
    var width: CGFloat = 0
    var height: CGFloat = 0
    var flowIndex = 0
    for (index, subview) in subviews.enumerated() {
      let size = cache[index]
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
    cache: inout Cache
  ) {
    if cache.count != subviews.count {
      cache = subviews.map { $0.sizeThatFits(.unspecified) }
    }
    if LogseqPerf.detail,
       nodeID >= 1 && nodeID <= 270 {
      let ws = zip(subviews, cache).map {
        "\(Int($1.width))/\($0[LogseqGrowXKey.self])"
      }.joined(separator: ",")
      FileHandle.standardError.write(
        "PERF row-place id=\(nodeID) n=\(subviews.count) b=\(Int(bounds.minX)),\(Int(bounds.minY)) \(Int(bounds.width))x\(Int(bounds.height)) w=[\(ws)]\n"
          .data(using: .utf8)!)
    }
    // Ideal widths first; leftover goes to grow-weighted children (flex-grow),
    // matching CSS — plain block children keep their ideal width.
    var ideals = [CGFloat]()
    var weights = [Int]()
    ideals.reserveCapacity(subviews.count)
    var total: CGFloat = 0
    var totalWeight = 0
    var flowIndex = 0
    for (index, subview) in subviews.enumerated() {
      let w = cache[index].width
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
    if centerMain && totalWeight == 0 && !spaceBetween {
      x += max(0, leftover) / 2
    }
    for (index, subview) in subviews.enumerated() {
      if subview[LogseqOutOfFlowKey.self] {
        // position:absolute analogue — pinned inside the container at the
        // declared anchors (top-leading when none).
        let anchor = subview[LogseqAnchorKey.self]
        let w = ideals[index]
        let fillY = subview[LogseqOutOfFlowFillYKey.self]
        let h = fillY ? bounds.height : cache[index].height
        let px = anchor.x.map { bounds.minX + $0 }
          ?? anchor.right.map { bounds.maxX - $0 - w }
          ?? bounds.minX
        let py = fillY ? bounds.minY
          : anchor.y.map { bounds.minY + $0 }
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
      // align-items: stretch by default; items-center hugs the child to its
      // natural height and centers it on the cross axis.
      let h = centerCross ? cache[index].height : bounds.height
      let py = centerCross
        ? bounds.minY + max(0, bounds.height - h) / 2
        : bounds.minY
      subview.place(
        at: CGPoint(x: x, y: py),
        proposal: ProposedViewSize(width: w, height: h))
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
  /// justify-center — center the packed column vertically (ignored when a
  /// child grows, since the grow consumes the leftover).
  var centerMain = false
  /// items-center — center each child horizontally instead of stretching it
  /// to the container width.
  var centerCross = false

  /// Ideal size per child at a given proposal width, measured once in
  /// `sizeThatFits` and reused by `placeSubviews` — re-measuring inside
  /// place re-walks the whole child subtree per container, multiplying a
  /// single layout pass by the depth.
  struct Cache {
    var width: CGFloat?
    var sizes: [CGSize] = []
  }

  func makeCache(subviews: Subviews) -> Cache { Cache() }

  func sizeThatFits(
    proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache
  ) -> CGSize {
    cache.width = proposal.width
    cache.sizes = subviews.map {
      $0.sizeThatFits(ProposedViewSize(width: proposal.width, height: nil))
    }
    var idealWidth: CGFloat = 0
    var height: CGFloat = 0
    var flowIndex = 0
    for (index, subview) in subviews.enumerated() {
      let size = cache.sizes[index]
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
    let out = CGSize(width: width, height: proposal.height ?? height)
    if LogseqPerf.detail,
       nodeID >= 1 && nodeID <= 270 {
      FileHandle.standardError.write(
        "PERF col-measure id=\(nodeID) n=\(subviews.count) ideal=\(Int(height)) prop=\(proposal.height.map { "\(Int($0))" } ?? "nil") out=\(Int(out.height))\n"
          .data(using: .utf8)!)
    }
    return out
  }

  func placeSubviews(
    in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews,
    cache: inout Cache
  ) {
    // Ideal heights first; leftover goes to grow-weighted children so
    // flex-1/h-full content fills the column.
    if cache.width != bounds.width || cache.sizes.count != subviews.count {
      cache.width = bounds.width
      cache.sizes = subviews.map {
        $0.sizeThatFits(ProposedViewSize(width: bounds.width, height: nil))
      }
    }
    var heights = [CGFloat]()
    var weights = [Int]()
    var total: CGFloat = 0
    var totalWeight = 0
    var flowIndex = 0
    for (index, subview) in subviews.enumerated() {
      let h = cache.sizes[index].height
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
    if LogseqPerf.detail,
       nodeID >= 1 && nodeID <= 270 {
      let hs = heights.map { "\(Int($0))" }.joined(separator: ",")
      FileHandle.standardError.write(
        "PERF col-place id=\(nodeID) n=\(subviews.count) b=\(Int(bounds.minX)),\(Int(bounds.minY)) \(Int(bounds.width))x\(Int(bounds.height)) heights=[\(hs)] tw=\(totalWeight)\n"
          .data(using: .utf8)!)
      if nodeID == 1 && bounds.width < 10 && !LogseqLayoutProbeDumped.shared.done {
        LogseqLayoutProbeDumped.shared.done = true
        let stack = Thread.callStackSymbols.prefix(40).joined(separator: "\n")
        FileHandle.standardError.write(
          "PERF col-place-zero-STACK\n\(stack)\n".data(using: .utf8)!)
      }
    }
    if centerMain && totalWeight == 0 {
      y += max(0, leftover) / 2
    }
    for (index, subview) in subviews.enumerated() {
      if subview[LogseqOutOfFlowKey.self] {
        let anchor = subview[LogseqAnchorKey.self]
        let w = subview.sizeThatFits(
          ProposedViewSize(width: bounds.width, height: heights[index])).width
        let fillY = subview[LogseqOutOfFlowFillYKey.self]
        let h = fillY ? bounds.height : heights[index]
        let px = anchor.x.map { bounds.minX + $0 }
          ?? anchor.right.map { bounds.maxX - $0 - w }
          ?? bounds.minX
        let py = fillY ? bounds.minY
          : anchor.y.map { bounds.minY + $0 }
            ?? anchor.bottom.map { bounds.maxY - $0 - h }
            ?? bounds.minY
        subview.place(
          at: CGPoint(x: px, y: py),
          proposal: ProposedViewSize(width: bounds.width, height: h))
        continue
      }
      var h = heights[index]
      if totalWeight > 0 {
        h += leftover * CGFloat(weights[index]) / CGFloat(totalWeight)
      }
      h = max(0, h)
      // align-items: stretch by default; items-center hugs the child to its
      // natural width and centers it horizontally. A child whose ideal is
      // degenerate (0 — e.g. a bare .frame(maxWidth:.infinity) leaf) or
      // already ≥ the container fills the width either way.
      var px = bounds.minX
      var pw = bounds.width
      if centerCross {
        let natural = subview.sizeThatFits(
          ProposedViewSize(width: nil, height: h)).width
        if natural > 0 && natural < bounds.width {
          px = bounds.minX + (bounds.width - natural) / 2
          pw = natural
        }
      }
      subview.place(
        at: CGPoint(x: px, y: y),
        proposal: ProposedViewSize(width: pw, height: h))
      y += h + spacing
    }
  }
}

final class LogseqLayoutProbeDumped: @unchecked Sendable {
  static let shared = LogseqLayoutProbeDumped()
  var done = false
}

private struct InsideVerticalScrollKey: EnvironmentKey {
  static let defaultValue = false
}

private struct ACInnerMaxHeightKey: EnvironmentKey {
  static let defaultValue: CGFloat? = nil
}

extension EnvironmentValues {
  var insideVerticalScroll: Bool {
    get { self[InsideVerticalScrollKey.self] }
    set { self[InsideVerticalScrollKey.self] = newValue }
  }
  var acInnerMaxHeight: CGFloat? {
    get { self[ACInnerMaxHeightKey.self] }
    set { self[ACInnerMaxHeightKey.self] = newValue }
  }
}

/// `.clipped()` under a style flag (popover overflow bounds).
private struct LogseqClipper: ViewModifier {
  let enabled: Bool
  func body(content: Content) -> some View {
    if enabled { content.clipped() } else { content }
  }
}

/// Frame bookkeeping: every element reports its window-space frame through
/// a preference. Feeds `dump-frames` (debug) and right-click hit-testing —
/// DOM contextmenu needs the deepest element at the pointer, which SwiftUI
/// gestures can't reach (they don't exist for right-click).
struct LogseqFrameEntry: Equatable {
  let rect: CGRect
  let tag: String
  /// Painting layer: 0 = page content, 1000+ = overlay/imperative popup
  /// (plus overlayZ stacking). Monitor hit-tests prefer the top layer —
  /// a smaller element UNDER a popup must never steal its hit.
  var z: Int = 0
  /// A viewport-covering dismiss surface (dialog scrim, popup backdrop):
  /// real elements always beat it at a shared point, so dialog content
  /// is clickable while a click outside still lands on the dismiss layer.
  var scrim = false
}

@MainActor enum LogseqFrameStore {
  /// Page-content frames ride the backend's `onFramesReport` channel
  /// (`LUIFrameReportModifier` → `nodeFrames`), one dict hand-off per
  /// coalesced layout flush. Previously every element carried its own
  /// `GeometryReader` + preference that merged a per-node dict up the
  /// whole ancestor chain — O(nodes × depth) merges on EVERY layout
  /// pass, every frame during sidebar animations and window resizes.
  static var baseEntries: [Int: LogseqFrameEntry] = [:]
  /// Overlay/imperative popups paint at z≥1000 above page content, so
  /// they keep a view-layer report (only the few elements inside an open
  /// popup write this — the O(depth) merge cost only exists while a
  /// popup is up and for popup nodes alone).
  static var overlayEntries: [Int: LogseqFrameEntry] = [:]

  /// Union for readers that want "whatever frame a node last painted"
  /// (dom-op rect answers, snapshots, dumps) — overlays shadow base.
  static var entries: [Int: LogseqFrameEntry] {
    overlayEntries.isEmpty
      ? baseEntries
      : baseEntries.merging(overlayEntries) { _, overlay in overlay }
  }

  /// Node id of the LUI surface root (the app root element) — the
  /// "viewport" OCaml's `position:fixed` px resolve against. Set by
  /// App.swift once the runtime's rootID is known.
  static var surfaceNodeID: Int?

  /// The surface fills the NavigationSplitView detail column, offset
  /// from the window origin by the sidebar + titlebar. Reported frames
  /// and monitor points are window-space; every coordinate handed to
  /// OCaml (clientX/Y, snapshot rects, measure-node/dump-frames,
  /// imperative-rects, window-size) must be surface-local or anchored
  /// popups land that offset away.
  static var surfaceOrigin: CGPoint {
    guard let id = surfaceNodeID, let r = entries[id]?.rect
    else { return .zero }
    return r.origin
  }

  static func surfaceRect(_ r: CGRect) -> CGRect {
    r.offsetBy(dx: -surfaceOrigin.x, dy: -surfaceOrigin.y)
  }

  static func surfacePoint(_ p: CGPoint) -> CGPoint {
    let o = surfaceOrigin
    return CGPoint(x: p.x - o.x, y: p.y - o.y)
  }

  static var surfaceSize: CGSize? { entries[surfaceNodeID ?? -1]?.rect.size }

  /// Element tag ("textarea", "div", …) for a base-entry node, resolved
  /// lazily from its extension identifier — the backend frame channel
  /// reports every node kind, not just elements.
  private static func tag(of nodeID: Int) -> String? {
    guard let context = LogseqElementRegistry.shared.context(forNode: nodeID),
      let ident = context.extensionIdentifier(of: nodeID),
      ident.hasPrefix("logseq-")
    else { return nil }
    return String(ident.dropFirst("logseq-".count))
  }

  /// Whether `ancestor` sits in `node`'s model parent chain — DOM paint
  /// order puts descendants above ancestors, so an element containing
  /// the point always out-hits its own scrim/container ancestors
  /// regardless of stacking numbers. Depth-capped against malformed
  /// cycles.
  private static func isAncestor(_ ancestor: Int, of node: Int) -> Bool {
    guard let context = LogseqElementRegistry.shared.eventAnchor
    else { return false }
    var cursor = context.parentID(of: node)
    var steps = 0
    while let id = cursor, steps < 64 {
      if id == ancestor { return true }
      steps += 1
      cursor = context.parentID(of: id)
    }
    return false
  }

  /// A menu/dialog/popup layer is up — the key monitor swallows
  /// navigation keys then so they can't move selection behind it.
  static var popupOpen: Bool {
    if !LogseqImperativeStore.shared.attached.isEmpty { return true }
    return overlayEntries.contains { id, _ in
      guard let context = LogseqElementRegistry.shared.context(forNode: id),
        case .string(let cls) = context.childProperty(node: id, "style-class")
      else { return false }
      return cls.contains("dropdown-menu") || cls.contains("context-menu")
        || cls.contains("dialog-overlay") || cls.contains("popover-content")
        || cls.contains("cmdk") || cls.contains("popup-backdrop")
    }
  }

  /// The open cmdk dismiss scrim — Escape and scrim clicks both close the
  /// palette through this element (its click handler is what OCaml
  /// listens to).
  static var cmdkDismiss: (nodeID: Int, context: LUIAppleExtensionViewContext)? {
    for (id, _) in overlayEntries {
      guard let context = LogseqElementRegistry.shared.context(forNode: id),
        case .string(let cls) = context.childProperty(node: id, "style-class"),
        cls.split(separator: " ").contains("cp__cmdk-dismiss")
      else { continue }
      return (id, context)
    }
    return nil
  }

  /// Deepest element at the point: overlay layer first, then the
  /// smallest containing frame wins — approximating DOM hit order
  /// (overlays paint above content; children paint over ancestors).
  /// `prefer` is the node that last won at this pointer area (e.g. the
  /// mouseMoved monitor's last hit): the pointer sits still over it far
  /// more often than it moves to a new node, so check it before the
  /// O(n) scans below.
  static func hitTest(
    _ point: CGPoint,
    prefer preferID: Int? = nil
  ) -> (nodeID: Int, tag: String)? {
    // Overlay/imperative layer: an ancestor never beats a descendant
    // (DOM paint order — a menu's container overlayZ can't swallow its
    // items), scrim surfaces lose to everything else (dialog content
    // stays clickable), then highest z + smallest area settles siblings.
    let overlayHits = overlayEntries.filter { $0.value.rect.contains(point) }
    if !overlayHits.isEmpty {
      let real = overlayHits.filter { cand in
        !overlayHits.contains { other in
          other.key != cand.key && isAncestor(cand.key, of: other.key)
        }
      }
      let nonScrim = real.filter { !$0.value.scrim }
      let pool = nonScrim.isEmpty ? real : nonScrim
      if let best = pool.max(by: { a, b in
        a.value.z != b.value.z
          ? a.value.z < b.value.z
          : a.value.rect.width * a.value.rect.height
            > b.value.rect.width * b.value.rect.height
      }) {
        return (best.key, best.value.tag)
      }
    }
    if let preferID, let base = baseEntries[preferID],
      base.rect.contains(point),
      let tag = tag(of: preferID), tag != "path"
    {
      return (preferID, tag)
    }
    // Smallest containing element wins; `path` nodes don't hit-test
    // (their parent svg reports the same region), and non-element nodes
    // never did either.
    let hits = baseEntries
      .filter { $0.value.rect.contains(point) }
      .sorted { a, b in
        a.value.rect.width * a.value.rect.height
          < b.value.rect.width * b.value.rect.height
      }
    for (id, _) in hits {
      if let tag = tag(of: id), tag != "path" {
        return (id, tag)
      }
    }
    return nil
  }
}

/// Keeps an anchored overlay element inside the window: popups positioned
/// by `left:`/`top:` near an edge would otherwise draw outside the
/// overlay layer's bounds (menus clip instead of flipping). Measures the
/// fixed-size content and shifts it back in with a 4pt margin — the same
/// offset updates the frame-store entry, so hit resolution stays aligned.
private struct LogseqEdgeClamp: ViewModifier {
  let x: CGFloat?
  let y: CGFloat?
  let right: CGFloat?
  let bottom: CGFloat?
  @State private var size = CGSize.zero

  func body(content: Content) -> some View {
    content
      .onGeometryChange(for: CGSize.self) { $0.size } action: { size = $0 }
      .offset(clampShift)
  }

  private var clampShift: CGSize {
    guard let win = NSApp.mainWindow?.contentView?.bounds.size,
      win.width > 4, win.height > 4, size.width > 0, size.height > 0
    else { return .zero }
    let px = right.map { win.width - $0 - size.width } ?? (x ?? 0)
    let py = bottom.map { win.height - $0 - size.height } ?? (y ?? 0)
    return CGSize(
      width: min(max(px, 4), max(4, win.width - size.width - 4)) - px,
      height: min(max(py, 4), max(4, win.height - size.height - 4)) - py)
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
      .frame(
        maxWidth: style.alignTrailing ? .infinity : nil, alignment: .trailing)
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
      .overlay {
        if let borderColor = style.borderColor, style.borderWidth > 0 {
          RoundedRectangle(cornerRadius: style.cornerRadius ?? 0)
            .strokeBorder(borderColor, lineWidth: style.borderWidth)
        }
      }
      // CSS default content alignment is start — SwiftUI's frame default
      // is .center, which would center short text in a grown span. A
      // centerHorizontally element (dialog boxes) centers its painted box
      // in the grown frame instead.
      .frame(
        maxWidth: (!inline || style.grow || style.fullWidth) && !anchored
          ? .infinity : nil,
        maxHeight: (style.fullHeight && !insideScroll) ? .infinity : nil,
        alignment: style.centerHorizontally ? .center : .leading)
      .frame(maxWidth: style.maxWidth, maxHeight: style.maxHeight)
      .modifier(LogseqClipper(enabled: style.clipContent))
      .frame(
        maxWidth: style.centerHorizontally ? .infinity : nil,
        maxHeight: style.centerVertically ? .infinity : nil,
        alignment: style.centerVertically ? .center : .top)
      .overlay {
        if style.hasBorder {
          RoundedRectangle(cornerRadius: style.cornerRadius ?? 0)
            .stroke(LogseqColors.border, lineWidth: 1)
        }
      }
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
      .onDisappear {
        LogseqOverlayStore.shared.dismiss(nodeID)
      }
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
    LogseqStyleOverrides.shared.clear(context.nodeID)
    guard !id.isEmpty else { return }
    LogseqElementRegistry.shared.unregister(id)
  }
}

/// Default element handle — dom-ops land on a no-op surface until richer
/// per-tag handles (text views etc.) register themselves.
private final class LogseqElementHandle: LogseqElement {
  let isPlaceholder = true
  let nodeID: Int
  init(nodeID: Int) { self.nodeID = nodeID }

}
