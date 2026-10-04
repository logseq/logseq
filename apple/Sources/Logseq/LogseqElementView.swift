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
  /// LOGSEQ_BARE_CONTENT: mount every element as a bare text leaf —
  /// isolates the fixed per-node cost for mount-cost profiling.
  nonisolated static let bareMode =
    ProcessInfo.processInfo.environment["LOGSEQ_BARE_CONTENT"] != nil
  let tag: String
  let context: LUIAppleExtensionViewContext
  /// Rendered by the window-level overlay layer rather than inline —
  /// skips the presenter branch so the element draws normally.
  var inOverlay = false
  @Environment(\.logseqInOverlay) private var nestedInOverlay
  @Environment(\.logseqScroll) private var scrollEnv
  /// This element's own scroll viewport height (when `style.isScrollable`) —
  /// feeds the `logseqScroll` env its descendants virtualize against.
  @State private var scrollViewport: CGFloat = 0
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
    // the web stylesheet paints the row bg from them.
    if (attrs["data-highlighted"] as? String) == "true"
      || (attrs["data-kb-highlighted"] as? String) == "true"
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
  /// `nestedInOverlay` counts too — it is the env marker descendants of a
  /// hoisted overlay see (their `inOverlay` ctor flag is false), and dialog
  /// panel children need z>=1000 to out-hit the window-filling scrim.
  /// Descendants inherit the top stacking level of their overlay subtree:
  /// a `z-index:50` dialog scrim must not out-rank its own panel rows —
  /// same-z smallest-area then resolves hits inside the panel correctly.
  /// Style of an arbitrary node in this extension tree (hit-test ancestry
  /// walk reads ancestors' fillsOverlay/outOfFlow/overlayZ from it).
  private func styleOf(node id: Int) -> LogseqStyle {
    var s = LogseqStyle()
    if case .string(let classes) = context.childProperty(
      node: id, "style-class")
    {
      s = LogseqParseMemo.style(classes)
    }
    if case .string(let json) = context.childProperty(node: id, "attrs"),
      let inline = (LogseqParseMemo.attrs(json)["style"]) as? String
    {
      s.applyInline(inline)
    }
    return s
  }

  private var frameZ: Int {
    let inLayer = inOverlay || inImperativeLayer || nestedInOverlay
    var z = (inLayer ? 1000 : 0) + style.overlayZ
    if inLayer {
      var id = context.nodeID
      var hops = 0
      while let parent = context.parentID(of: id), hops < 32 {
        let s = styleOf(node: parent)
        if s.fillsOverlay || s.outOfFlow {
          z = max(z, 1000 + s.overlayZ)
        }
        id = parent
        hops += 1
      }
    }
    return z
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

  /// True when this render is inside an overlay/imperative layer — only
  /// those copies feed LogseqFrameStore.overlayEntries, so the geometry
  /// probe attaches only there (a preference write + combiner per node
  /// otherwise shows up on every DOM element's layout).
  private var reportsOverlayFrame: Bool {
    (inOverlay || inImperativeLayer || nestedInOverlay) && tag != "path"
  }

  /// The registration the `.background` used to mount: folded into the
  /// lifecycle hooks below so a node carries no extra view.
  private func registerElement() {
    guard tag != "textarea", tag != "input" else { return }
    let handle = LogseqElementHandle(nodeID: context.nodeID)
    LogseqElementRegistry.shared.register("node-\(context.nodeID)", handle)
    LogseqElementRegistry.shared.registerContext(context)
    let id = domID
    guard !id.isEmpty else { return }
    LogseqElementRegistry.shared.register(id, handle)
    LogseqElementRegistry.shared.registerAnchor(id, context)
  }

  private func unregisterElement() {
    guard tag != "textarea", tag != "input" else { return }
    LogseqElementRegistry.shared.unregister("node-\(context.nodeID)")
    LogseqElementRegistry.shared.unregisterContext(context.nodeID)
    LogseqStyleOverrides.shared.clear(context.nodeID)
    let id = domID
    guard !id.isEmpty else { return }
    LogseqElementRegistry.shared.unregister(id)
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
      .modifier(
        LogseqOverlayProbe(
          active: reportsOverlayFrame, nodeID: context.nodeID, tag: tag,
          z: frameZ))
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
        registerElement()
        // .block-children[data-lazy-mount]: cljs lazy-block-children
        // parity — the placeholder div is a zero-content leaf (if_ emits
        // nothing until `near`), so SwiftUI never fires its own onAppear.
        // Its .block-children-container parent does appear (it has
        // children → a real view), so the parent checks its kids' attrs
        // and emits lazy-mount on the placeholder's node.
        if case .string(let cls) = context.property("style-class"),
          cls.contains("block-children-container")
        {
          DispatchQueue.main.async {
            for kid in self.context.childIDs {
              guard case .string(let kAttrs) = self.context.childProperty(
                node: kid, "attrs"),
                kAttrs.contains("data-lazy-mount")
              else { continue }
              try? self.context.emit(
                on: kid, name: "dom-event",
                values: [
                  "name": .string("lazy-mount"),
                  "payload": .string("{\"nodeId\":\(kid)}"),
                ])
            }
          }
        }
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
        unregisterElement()
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
  }

  @ViewBuilder private var content: some View {
    if Self.bareMode {
      // LOGSEQ_BARE_CONTENT: mount every element as a bare text leaf —
      // isolates the fixed per-node cost (probe/hover/lifecycle/style)
      // from tag-specific views for mount-cost profiling.
      Text(" ")
    // The HTML `hidden` attribute is display:none (e.g. the asset upload input).
    } else if style.isHidden || attrs["hidden"] != nil {
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

    } else if style.fillsOverlay && !inOverlay && !nestedInOverlay {
      // position:fixed layers — the web renders these at window scope; our
      // collapsed overlay containers can't give them bounds, so the element
      // re-renders in LogseqOverlayLayer instead. The anchor/sizing lives in
      // the overlay copy's own body so it stays reactive to style changes.
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
      if ProcessInfo.processInfo.environment["LOGSEQ_FAST_TEXT"] != nil {
        Text(text).frame(maxWidth: .infinity, alignment: .leading)
      } else {
        LogseqTextArea(
          context: context, attrs: attrs, style: style,
          wired: wiredEvents, text: text, domID: domID)
          .frame(minHeight: codeMinHeight)
          .frame(maxWidth: .infinity)
      }
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
    } else if let flat = flatRowProbe {
      // Composite row: the ~30-node ls-block subtree folds into one view —
      // descendants never mount, so a row costs ~1 ext-view not ~30.
      LogseqFlatBlockRow(probe: flat, context: context)
        .modifier(LogseqStyleModifier(style: style, tag: tag))
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

  /// Non-nil when this element is an `ls-block` row whose whole subtree is
  /// safe to composite-render: only the inline-text / icon tags below, no
  /// editor textarea, media, or custom components. Rows holding an open
  /// editor (textarea), images, code blocks, or latex keep the full DOM
  /// mount so their bespoke views stay interactive.
  private var flatRowProbe: LogseqFlatRowProbe? {
    guard tag == "div", classSet.contains("ls-block") else { return nil }
    var probe = LogseqFlatRowProbe()
    var bailReason = ""
    var stack = context.childIDs
    var steps = 0
    let allowed: Set<String> = [
      "div", "span", "a", "raw-text", "em-emoji", "kbd", "strong", "em",
      "code", "u", "mark", "b", "i", "sup", "sub", "small", "br", "label",
      "svg", "path", "g", "defs", "use", "circle", "rect", "line",
      "polyline", "polygon", "ellipse", "tspan",
    ]
    while let id = stack.popLast() {
      steps += 1
      if steps > 400 { bailReason = "steps"; break }
      if let ident = context.extensionIdentifier(of: id) {
        let t = String(ident.dropFirst("logseq-".count))
        guard allowed.contains(t) else { bailReason = "tag:" + t; break }
        if case .string(let classes) = context.childProperty(node: id, "style-class") {
          let cs = Set(classes.split(separator: " ").map(String.init))
          if cs.contains("latex") || cs.contains("latex-inline") { bailReason = "latex"; break }
          if cs.contains("block-main-container") { probe.mainContainerID = id }
          if cs.contains("block-control") { probe.controlID = id }
          // .bullet-container is the span with id dot-<uuid> — the doc
          // listener resolves zoom via closest(".bullet-container") +
          // the dot- prefix; the wrapping .bullet-link-wrap anchor has
          // no id and never matches.
          if cs.contains("bullet-container") { probe.bulletID = id }
          if cs.contains("block-content-inner") { probe.contentID = id }
          if cs.contains("rotating-arrow") {
            probe.arrowCollapsed = cs.contains("collapsed")
          }
        }
      }
      for c in context.childIDs(of: id) { stack.append(c) }
    }
    // Flat rows carry the fold state on the .ls-block element itself:
    // children are stream siblings, never a nested
    // .block-children-container inside the row.
    probe.hasChildren =
      (attrs["haschild"] as? String) == "true"
      || (attrs["data-db-collapsable"] as? String) == "true"
    probe.arrowCollapsed = (attrs["data-collapsed"] as? String) == "true"
    if !bailReason.isEmpty {
      return nil
    }
    // Siblings of the main container (children column, properties area)
    // keep their normal mount.
    for c in context.childIDs where c != probe.mainContainerID {
      probe.siblings.append(c)
    }
    return probe
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
      .layoutValue(key: LogseqNodeIDKey.self, value: child)
      .layoutValue(
        key: LogseqGrowXKey.self,
        value: (s.grow || s.fullWidth || isTextInput) ? 1 : 0)
      .layoutValue(key: LogseqGrowYKey.self, value: (s.grow || s.fullHeight) ? 1 : 0)
      // Inside the overlay layer a nested fillsOverlay child renders inline
      // (no second hoist) — it participates in the overlay's own layout
      // (e.g. a flex-centered dialog overlay) rather than being pinned.
      .layoutValue(
        key: LogseqOutOfFlowKey.self,
        value: s.outOfFlow && !(nestedInOverlay && s.fillsOverlay))
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
          stamps: { context.measureStamp(of: $0) }, selfRev: context.revision,
          centerMain: style.centerMain, centerCross: style.centerCross) {
          if !effectiveText.isEmpty { styledText }
          if !html.isEmpty { htmlText }
          ForEach(children, id: \.self) { child in
            childView(child)
          }
        }
      } else if scrollEnv.space != 0, isVirtList {
        // OCaml `virt_list` emits every row; LazyVStack materializes only
        // the rows scrolled into view — the same model as logseq/chat.
        LazyVStack(alignment: .leading, spacing: style.stackSpacing ?? 0) {
          ForEach(children, id: \.self) { child in
            childView(child)
              .onAppear {
                if child == children.last { emitVirtEnd() }
              }
          }
        }
      } else if virtualizable(children) {
        LogseqVirtualColumn(
          nodeID: context.nodeID, children: children,
          spacing: style.stackSpacing ?? 0, scroll: scrollEnv,
          stamps: { context.measureStamp(of: $0) }
        ) { child in AnyView(childView(child)) }
      } else {
        LogseqColumnLayout(
          nodeID: context.nodeID, spacing: style.stackSpacing ?? 0,
          centerMain: style.centerMain, centerCross: style.centerCross,
          stamps: { context.measureStamp(of: $0) }, selfRev: context.revision) {
          if !effectiveText.isEmpty { styledText }
          if !html.isEmpty { htmlText }
          ForEach(children, id: \.self) { child in
            childView(child)
          }
        }
      }
    }
  }

  /// OCaml `virt_list` marker: every row is a real child — the
  /// LazyVStack branch renders them lazily.
  private var isVirtList: Bool {
    attrs["data-virt-count"] != nil
  }

  /// Pagination hook: the last emitted row appeared — ask the backend
  /// for more rows. Deferred a runloop turn like other scroll-driven
  /// emits (re-entrant patch apply during a render pass is expensive).
  private func emitVirtEnd() {
    let context = context
    DispatchQueue.main.async {
      try? context.emit(
        name: "dom-event",
        values: ["name": .string("virt-end"), "payload": .string("{}")])
    }
  }

  /// Column virtualization is only safe inside a tracked scroller
  /// (`scrollEnv.viewport > 0`) and when every child is a plain in-flow,
  /// non-growing row — grow/out-of-flow children need the whole-column
  /// flex pass, so those columns stay eager.
  private func virtualizable(_ children: [Int]) -> Bool {
    // `space != 0` (not viewport) gates this — the viewport height arrives a
    // frame later via onScrollGeometryChange, and an eager first frame would
    // lay out the entire 8k-node feed before virtualization could engage.
    if LogseqPerf.detail, children.count >= logseqVirtualColumnThreshold {
      FileHandle.standardError.write(
        "DBG virt-cand id=\(context.nodeID) kids=\(children.count) space=\(scrollEnv.space) vp=\(Int(scrollEnv.viewport)) cM=\(style.centerMain) cC=\(style.centerCross) txt=\(!effectiveText.isEmpty) html=\(!html.isEmpty)\n"
          .data(using: .utf8)!)
    }
    guard scrollEnv.space != 0,
          !style.centerMain, !style.centerCross,
          children.count >= logseqVirtualColumnThreshold,
          effectiveText.isEmpty, html.isEmpty
    else { return false }
    for child in children {
      let s = childStyle(of: child)
      let oof = s.outOfFlow && !(nestedInOverlay && s.fillsOverlay)
      if oof || s.grow || s.fullHeight || s.outOfFlowFillY { return false }
    }
    if LogseqPerf.detail {
      FileHandle.standardError.write(
        "DBG virt id=\(context.nodeID) kids=\(children.count)\n"
          .data(using: .utf8)!)
    }
    return true
  }

  @ViewBuilder private var styledContainer: some View {
    if style.isScrollable {
      // ScrollView must sit OUTSIDE the flex-height frame: inside it, a
      // `h-full` descendant would expand to the scroll area's unbounded
      // height proposal. The env flag suppresses flex height in there.
      ScrollViewReader { proxy in
        ScrollView {
          elementBody
            .environment(
              \.logseqScroll,
              LogseqScrollEnv(space: context.nodeID, viewport: scrollViewport))
            .scrollTargetLayout()
        }
        .coordinateSpace(name: context.nodeID)
        .scrollIndicators(style.hideScrollIndicators ? .never : .automatic)
        .onScrollGeometryChange(for: CGFloat.self, of: { $0.containerSize.height }) { _, h in
          if h != scrollViewport { scrollViewport = h }
        }
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
    // Web MouseEvent modifier fields — SwiftUI gestures don't carry the
    // triggering event, so read the live modifier state.
    if name == "click" || name == "mousedown" {
      let flags = NSEvent.modifierFlags
      enriched["shiftKey"] = flags.contains(.shift)
      enriched["metaKey"] = flags.contains(.command)
      enriched["ctrlKey"] = flags.contains(.control)
      enriched["altKey"] = flags.contains(.option)
    }
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
/// The DOM node id a layout child renders — lets parent layouts key their
/// measure cache by (nodeID, measureStamp) instead of re-walking subtrees.
private struct LogseqNodeIDKey: LayoutValueKey {
  static let defaultValue = -1
}

/// Cross-pass child-measure memoization. `sizes` returns a cached per-child
/// size list when every child's (nodeID, measureStamp) key — read live, so
/// a change anywhere in a child's subtree misses — and the width bucket
/// match a stored entry. Entries survive patch applies, which is what lets
/// a second mount pass skip re-measuring untouched subtrees.
final class LogseqMeasureCache: @unchecked Sendable {
  static let shared = LogseqMeasureCache()
  private var store: [Int: [UInt64: (keys: [UInt64], sizes: [CGSize])]] = [:]

  func sizes(
    nodeID: Int, width: CGFloat?, keys: [UInt64], stale: Bool,
    measure: () -> [CGSize]
  ) -> [CGSize] {
    if stale { LogseqLayoutStats.persistBypass += 1; return measure() }
    let wk = width.map { UInt64(bitPattern: Int64($0)) } ?? UInt64.max
    if let e = store[nodeID]?[wk], e.keys == keys {
      LogseqLayoutStats.persistHit += 1
      return e.sizes
    }
    LogseqLayoutStats.persistMiss += 1
    let s = measure()
    var b = store[nodeID] ?? [:]
    if b.count >= 8 { b.removeAll(keepingCapacity: true) }
    b[wk] = (keys, s)
    store[nodeID] = b
    return s
  }

  /// Key for one child: packs nodeID with the live subtree stamp; `nil`
  /// (stale) when the stamp is unknown so the parent skips caching.
  static func childKey(id: Int, stamp: Int) -> UInt64? {
    guard id >= 0, stamp >= 0 else { return nil }
    return (UInt64(bitPattern: Int64(id)) << 32)
      | UInt64(UInt32(truncatingIfNeeded: stamp))
  }
}

struct LogseqRowLayout: Layout {
  var nodeID: Int = 0
  var spacing: CGFloat = 0
  var spaceBetween = false
  /// Live subtree-version lookup — `context.measureStamp(of:)`.
  var stamps: (Int) -> Int = { _ in -1 }
  /// Parent content version — covers non-node children (styled text).
  var selfRev: Int = 0
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

  /// The default Layout.explicitAlignment walks every subview (and their
  /// whole subtrees) to resolve a guide — with thousands of DOM nodes that
  /// turns one HStack/VStack alignment query into a full-tree recursion
  /// storm. No DOM child defines custom alignment guides, so answering nil
  /// (resolve the guide against our bounds) is both correct and O(1).
  func explicitAlignment(
    of guide: HorizontalAlignment, in bounds: CGRect,
    proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache
  ) -> CGFloat? {
    nil
  }

  func explicitAlignment(
    of guide: VerticalAlignment, in bounds: CGRect,
    proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache
  ) -> CGFloat? {
    nil
  }

  /// Per-child cache keys: node children pack (nodeID, live measureStamp);
  /// non-node children (styled text) share one sentinel covered by selfRev.
  private func childKeys(_ subviews: Subviews) -> ([UInt64], stale: Bool) {
    var stale = false
    var keys = subviews.map { sub -> UInt64 in
      let id = sub[LogseqNodeIDKey.self]
      if id < 0 { return .max }
      if let k = LogseqMeasureCache.childKey(id: id, stamp: stamps(id)) {
        return k
      }
      stale = true
      return .max
    }
    keys.append(UInt64(bitPattern: Int64(selfRev)))
    return (keys, stale)
  }

  func sizeThatFits(
    proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache
  ) -> CGSize {
    LogseqLayoutStats.rowCalls += 1
    LogseqLayoutStats.rowKids += subviews.count
    if proposal.width == nil { LogseqLayoutStats.rowNilW += 1 }
    // Child measures are width-independent (.unspecified) — reuse them
    // across repeated calls and across passes via the shared cache.
    if cache.count != subviews.count {
      let (keys, stale) = childKeys(subviews)
      cache = LogseqMeasureCache.shared.sizes(
        nodeID: nodeID, width: nil, keys: keys, stale: stale
      ) { subviews.map { $0.sizeThatFits(.unspecified) } }
      LogseqLayoutStats.rowRemeasure += 1
    }
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
      let (keys, stale) = childKeys(subviews)
      cache = LogseqMeasureCache.shared.sizes(
        nodeID: nodeID, width: nil, keys: keys, stale: stale
      ) { subviews.map { $0.sizeThatFits(.unspecified) } }
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
  /// Live subtree-version lookup — `context.measureStamp(of:)`.
  var stamps: (Int) -> Int = { _ in -1 }
  /// Parent content version — covers non-node children (styled text).
  var selfRev: Int = 0

  /// Ideal size per child at a given proposal width, measured once in
  /// `sizeThatFits` and reused by `placeSubviews` — re-measuring inside
  /// place re-walks the whole child subtree per container, multiplying a
  /// single layout pass by the depth.
  struct Cache {
    var width: CGFloat?
    var sizes: [CGSize] = []
  }

  func makeCache(subviews: Subviews) -> Cache { Cache() }

  /// See LogseqRowLayout.explicitAlignment — answering nil keeps parent
  /// alignment queries O(1) instead of walking this column's whole subtree.
  func explicitAlignment(
    of guide: HorizontalAlignment, in bounds: CGRect,
    proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache
  ) -> CGFloat? {
    nil
  }

  func explicitAlignment(
    of guide: VerticalAlignment, in bounds: CGRect,
    proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache
  ) -> CGFloat? {
    nil
  }

  private func childKeys(_ subviews: Subviews) -> ([UInt64], stale: Bool) {
    var stale = false
    var keys = subviews.map { sub -> UInt64 in
      let id = sub[LogseqNodeIDKey.self]
      if id < 0 { return .max }
      if let k = LogseqMeasureCache.childKey(id: id, stamp: stamps(id)) {
        return k
      }
      stale = true
      return .max
    }
    keys.append(UInt64(bitPattern: Int64(selfRev)))
    return (keys, stale)
  }

  func sizeThatFits(
    proposal: ProposedViewSize, subviews: Subviews, cache: inout Cache
  ) -> CGSize {
    LogseqLayoutStats.colCalls += 1
    LogseqLayoutStats.colKids += subviews.count
    if proposal.width == nil { LogseqLayoutStats.colNilW += 1 }
    if cache.width != proposal.width || cache.sizes.count != subviews.count {
      LogseqLayoutStats.colRemeasure += 1
      let (keys, stale) = childKeys(subviews)
      let w = proposal.width
      cache.sizes = LogseqMeasureCache.shared.sizes(
        nodeID: nodeID, width: w, keys: keys, stale: stale
      ) {
        subviews.map {
          $0.sizeThatFits(ProposedViewSize(width: w, height: nil))
        }
      }
      cache.width = proposal.width
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
      let (keys, stale) = childKeys(subviews)
      let w = bounds.width
      cache.sizes = LogseqMeasureCache.shared.sizes(
        nodeID: nodeID, width: w, keys: keys, stale: stale
      ) {
        subviews.map {
          $0.sizeThatFits(ProposedViewSize(width: w, height: nil))
        }
      }
      cache.width = bounds.width
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

/// TEMP instrumentation: layout-measure call counters, dumped once after
/// launch so the mount's measure amplification is visible in the log.
final class LogseqLayoutStats: @unchecked Sendable {
  nonisolated(unsafe) static var rowCalls = 0
  nonisolated(unsafe) static var rowKids = 0
  nonisolated(unsafe) static var rowNilW = 0
  nonisolated(unsafe) static var colCalls = 0
  nonisolated(unsafe) static var colKids = 0
  nonisolated(unsafe) static var colNilW = 0
  nonisolated(unsafe) static var flowCalls = 0
  nonisolated(unsafe) static var flowKids = 0
  nonisolated(unsafe) static var rowRemeasure = 0
  nonisolated(unsafe) static var colRemeasure = 0
  nonisolated(unsafe) static var persistHit = 0
  nonisolated(unsafe) static var persistMiss = 0
  nonisolated(unsafe) static var persistBypass = 0
  nonisolated(unsafe) static var installed = false
  static func install() {
    guard !installed else { return }
    installed = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
      FileHandle.standardError.write(
        "PERF layout-stats row=\(rowCalls)/rem=\(rowRemeasure) kids=\(rowKids) nilW=\(rowNilW) col=\(colCalls)/rem=\(colRemeasure) kids=\(colKids) nilW=\(colNilW) flow=\(flowCalls)/\(flowKids) mc=\(persistHit)hit/\(persistMiss)miss/\(persistBypass)byp\n"
          .data(using: .utf8)!)
    }
  }
}

private struct InsideVerticalScrollKey: EnvironmentKey {
  static let defaultValue = false
}

/// Per-scroller virtualization context: the scroll viewport height plus the
/// named coordinate space the scrollable element declares. Column children
/// past `logseqVirtualColumnThreshold` render only the rows intersecting
/// the viewport (plus overscan); unmeasured rows use `estimate` height until
/// their real height lands in `LogseqHeightStore`.
struct LogseqScrollEnv: Equatable {
  var space: Int = 0
  var viewport: CGFloat = 0
}

private struct LogseqScrollEnvKey: EnvironmentKey {
  static let defaultValue = LogseqScrollEnv()
}

extension EnvironmentValues {
  var logseqScroll: LogseqScrollEnv {
    get { self[LogseqScrollEnvKey.self] }
    set { self[LogseqScrollEnvKey.self] = newValue }
  }
}

/// Column virtualization engages only above this child count — smaller
/// columns measure eagerly (the windowing overhead isn't worth it).
private let logseqVirtualColumnThreshold = 16

/// Measured heights of virtualized children. `heights` keys rows by node
/// id (stable identity across reorder).
final class LogseqHeightStore: @unchecked Sendable {
  static let shared = LogseqHeightStore()
  var heights: [Int: CGFloat] = [:]
}

/// Windowed column: mounts only the children overlapping the scroller's
/// viewport (±overscan) and pads the hidden prefix/suffix with spacers, so
/// a 1000-row list costs ~40 measured children instead of 1000. Nested
/// columns each self-anchor via their own frame in the scroller's named
/// coordinate space — virtualization cascades through arbitrarily deep
/// wrapper chains without env plumbing.
struct LogseqVirtualColumn<ChildContent: View>: View {

  var nodeID: Int
  var children: [Int]
  var spacing: CGFloat
  var scroll: LogseqScrollEnv
  var estimate: CGFloat = 32
  /// Live subtree-version lookup for the inner column's measure cache.
  var stamps: (Int) -> Int = { _ in -1 }
  var childBuilder: (Int) -> ChildContent

  /// The column's top edge in the scroller's coordinate space. Unknown
  /// until the first geometry report; the first window is a prefix guess.
  @State private var minY = CGFloat.greatestFiniteMagnitude

  private func childHeight(_ id: Int) -> CGFloat {
    LogseqHeightStore.shared.heights[id] ?? estimate
  }

  /// Window geometry in column-local points: cumulative row offsets, the
  /// total column height, and the mounted `[first, last]` index range —
  /// computed outside `body` because ViewBuilder rejects control flow.
  private func window() -> (
    starts: [CGFloat], total: CGFloat, first: Int, last: Int
  ) {
    var starts = [CGFloat](repeating: 0, count: children.count)
    var total: CGFloat = 0
    for (i, c) in children.enumerated() {
      starts[i] = total
      total += childHeight(c)
      if i < children.count - 1 { total += spacing }
    }
    let overscan = scroll.viewport / 2 + 100
    var first = 0
    var last = min(children.count, 48) - 1
    if minY.isFinite, scroll.viewport > 0 {
      let lo = -overscan - minY
      let hi = scroll.viewport + overscan - minY
      first = children.count
      last = -1
      for i in 0..<children.count {
        let y0 = starts[i]
        let y1 = y0 + childHeight(children[i])
        if y1 > lo && first == children.count { first = i }
        if y0 < hi { last = i }
      }
      if last < first { first = 0 }
    }
    return (starts, total, first, last)
  }

  var body: some View {
    let w = window()
    let topPad = w.last >= w.first ? w.starts[w.first] : w.total
    let bottomPad =
      w.last >= w.first
      ? w.total - (w.starts[w.last] + childHeight(children[w.last])) : 0
    LogseqColumnLayout(nodeID: nodeID, spacing: spacing, stamps: stamps) {
      if topPad > 0 { Color.clear.frame(height: topPad) }
      if w.last >= w.first {
        ForEach(children[w.first...w.last], id: \.self) { c in
          childBuilder(c)
            .onGeometryChange(for: CGSize.self, of: { $0.size }) { size in
              let h = max(0.5, size.height)
              if abs((LogseqHeightStore.shared.heights[c] ?? -1) - h) > 0.5 {
                LogseqHeightStore.shared.heights[c] = h
              }
            }
        }
      }
      if bottomPad > 0 { Color.clear.frame(height: bottomPad) }
    }
    .onGeometryChange(for: CGRect.self) {
      $0.frame(in: .named(scroll.space))
    } action: { f in
      if f.minY != minY { minY = f.minY }
    }
  }
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
  /// Sub-region frames reported by composite rows: the folded inner
  /// nodes (bullet, control, content) get a pseudo-frame so monitor
  /// hit-tests land on the same node a DOM click would, letting clicks
  /// and hovers resolve .block-content/.bullet-container via closest().
  static var aliasEntries: [Int: LogseqFrameEntry] = [:]

  static func setAlias(_ nodeID: Int, _ rect: CGRect, tag: String) {
    guard !rect.isEmpty, nodeID > 0 else { return }
    if aliasEntries[nodeID]?.rect == rect { return }
    aliasEntries[nodeID] = LogseqFrameEntry(rect: rect, tag: tag)
  }

  static func clearAlias(_ nodeID: Int) {
    aliasEntries.removeValue(forKey: nodeID)
  }

  /// Union for readers that want "whatever frame a node last painted"
  /// (dom-op rect answers, snapshots, dumps) — overlays shadow base.
  static var entries: [Int: LogseqFrameEntry] {
    overlayEntries.isEmpty
      ? baseEntries
      : baseEntries.merging(overlayEntries) { _, overlay in overlay }
  }

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
    if let preferID {
      if let overlay = overlayEntries[preferID], overlay.rect.contains(point) {
        return (preferID, overlay.tag)
      }
      if let alias = aliasEntries[preferID], alias.rect.contains(point) {
        return (preferID, alias.tag)
      }
      if let base = baseEntries[preferID], base.rect.contains(point),
        let tag = tag(of: preferID), tag != "path"
      {
        return (preferID, tag)
      }
    }
    var best: (id: Int, z: Int, area: CGFloat)?
    for (id, entry) in overlayEntries where entry.rect.contains(point) {
      let area = entry.rect.width * entry.rect.height
      if best == nil || entry.z > best!.z
        || (entry.z == best!.z && area < best!.area)
      {
        best = (id, entry.z, area)
      }
    }
    if let best, let entry = overlayEntries[best.id] {
      return (best.id, entry.tag)
    }
    // Composite-row alias frames stand in for folded inner nodes — the
    // only frame that can overlap them is their own (larger) row, so
    // smallest alias wins without competing against real children.
    var aliasHit: (id: Int, entry: LogseqFrameEntry)?
    for (id, entry) in aliasEntries where entry.rect.contains(point) {
      let area = entry.rect.width * entry.rect.height
      if aliasHit == nil
        || area < aliasHit!.entry.rect.width * aliasHit!.entry.rect.height
      {
        aliasHit = (id, entry)
      }
    }
    if let aliasHit { return (aliasHit.id, aliasHit.entry.tag) }
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

/// Applies the parsed style-class hints that map to native modifiers.
private struct LogseqStyleModifier: ViewModifier {
  let style: LogseqStyle
  let tag: String
  @Environment(\.insideVerticalScroll) private var insideScroll
  @State private var hovering = false

  @ViewBuilder func body(content: Content) -> some View {
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
    // Every modifier is a layout-engine hop measured on each of ~600+
    // elements — attach only what actually does something. Order matches
    // the old always-on chain: trailing > min > fixed > pad > bg > radius >
    // hover > border > fill > max > clip > center > border > shadow >
    // margin > opacity > priority.
    var v = AnyView(content)
    if style.alignTrailing {
      v = AnyView(v.frame(maxWidth: .infinity, alignment: .trailing))
    }
    if style.minWidth != nil || style.minHeight != nil {
      v = AnyView(v.frame(minWidth: style.minWidth, minHeight: style.minHeight))
    }
    if style.fixedWidth != nil || style.fixedHeight != nil {
      v = AnyView(v.frame(width: style.fixedWidth, height: style.fixedHeight))
    }
    if let padding = style.padding {
      v = AnyView(v.padding(padding))
    }
    if style.sidebarMaterial {
      v = AnyView(
        v.background(
          ZStack {
            LogseqSidebarMaterial()
            // lx-gray-02 wash over the vibrancy — keeps the Logseq tone
            // readable over busy wallpapers while staying native.
            LogseqColors.gray(2).opacity(0.6)
          }))
    } else if style.background != nil || style.hoverBackground != nil {
      v = AnyView(
        v.background(
          (hovering ? (style.hoverBackground ?? style.background)
            : style.background) ?? Color.clear))
    }
    if let r = style.cornerRadius, r > 0 {
      v = AnyView(v.cornerRadius(r))
    }
    if style.hoverBackground != nil {
      v = AnyView(v.onHover { hovering = $0 })
    }
    if let borderColor = style.borderColor, style.borderWidth > 0 {
      v = AnyView(
        v.overlay(
          RoundedRectangle(cornerRadius: style.cornerRadius ?? 0)
            .strokeBorder(borderColor, lineWidth: style.borderWidth)))
    }
    // CSS default content alignment is start — SwiftUI's frame default
    // is .center, which would center short text in a grown span. A
    // centerHorizontally element (dialog boxes) centers its painted box
    // in the grown frame instead.
    let fillW = (!inline || style.grow || style.fullWidth) && !anchored
    let fillH = style.fullHeight && !insideScroll
    if fillW || fillH || style.centerHorizontally {
      v = AnyView(
        v.frame(
          maxWidth: fillW ? .infinity : nil,
          maxHeight: fillH ? .infinity : nil,
          alignment: style.centerHorizontally ? .center : .leading))
    }
    if style.maxWidth != nil || style.maxHeight != nil {
      v = AnyView(v.frame(maxWidth: style.maxWidth, maxHeight: style.maxHeight))
    }
    if style.clipContent {
      v = AnyView(v.modifier(LogseqClipper(enabled: true)))
    }
    if style.centerHorizontally || style.centerVertically {
      v = AnyView(
        v.frame(
          maxWidth: style.centerHorizontally ? .infinity : nil,
          maxHeight: style.centerVertically ? .infinity : nil,
          alignment: style.centerVertically ? .center : .top))
    }
    if style.hasBorder {
      v = AnyView(
        v.overlay(
          RoundedRectangle(cornerRadius: style.cornerRadius ?? 0)
            .stroke(LogseqColors.border, lineWidth: 1)))
    }
    if style.hasShadow {
      v = AnyView(
        v.shadow(color: Color.black.opacity(0.3), radius: 16, y: 8))
    }
    if let margin = style.margin {
      v = AnyView(v.padding(margin))
    }
    if style.alpha != 1 {
      v = AnyView(v.opacity(style.alpha))
    }
    if style.grow {
      v = AnyView(v.layoutPriority(1))
    }
    return v
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

/// Overlay frame probe — installs the geometry preference only for nodes
/// rendered inside an overlay/imperative layer. On inactive nodes the body
/// is a bare `content`, so no preference combiner runs for them.
private struct LogseqOverlayProbe: ViewModifier {
  let active: Bool
  let nodeID: Int
  let tag: String
  let z: Int

  @ViewBuilder func body(content: Content) -> some View {
    if active {
      content
        .onGeometryChange(for: CGRect.self) { g in
          g.frame(in: .global)
        } action: { rect in
          LogseqFrameStore.overlayEntries[nodeID] =
            LogseqFrameEntry(rect: rect, tag: tag, z: z)
        }
        .onDisappear {
          LogseqFrameStore.overlayEntries.removeValue(forKey: nodeID)
        }
    } else {
      content
    }
  }
}

/// Default element handle — dom-ops land on a no-op surface until richer
/// per-tag handles (text views etc.) register themselves.
private final class LogseqElementHandle: LogseqElement {
  let isPlaceholder = true
  let nodeID: Int
  init(nodeID: Int) { self.nodeID = nodeID }

}

// MARK: - flat block-row composite

/// Result of `LogseqElementView.flatRowProbe`: the descendant ids a folded
/// `ls-block` row renders and emits through. Filled by a bounded DFS over
/// the row's subtree — pure property reads, no view work.
struct LogseqFlatRowProbe {
  var mainContainerID = -1  // .block-main-container (hover enter/leave)
  var controlID = -1        // a.block-control (collapse arrow)
  var bulletID = -1         // a.bullet-link-wrap (bullet target)
  var contentID = -1        // .block-content-inner (text-click target)
  var arrowCollapsed = false
  var hasChildren = false
  var siblings: [Int] = []  // children column / properties area — mounted
}

/// One mounted view for a whole `ls-block` row: bullet zone + the inline
/// text of every descendant concatenated into a single attributed string.
/// The ~30-node DOM subtree under the row never mounts — on the 1k-journal
/// benchmark this is what keeps first-paint mount inside the budget.
/// Inline links carry a `lseq-node://<id>` .link attribute; tapping one
/// routes through openURL and emits the real node's click so page refs
/// still navigate.
private struct LogseqFlatBlockRow: View {
  let probe: LogseqFlatRowProbe
  let context: LUIAppleExtensionViewContext
  @State private var hovering = false

  private struct Run {
    var text: String
    var nodeID: Int
    var link = false
    var bold = false
    var italic = false
    var mono = false
    var mark = false
    var underline = false
  }

  /// DFS the main-container subtree collecting inline text runs in DOM
  /// order. The control-wrap subtree (arrow/bullet icons) is skipped —
  /// the flat view draws its own. `a` nodes set link on their text
  /// descendants so refs navigate; ancestor tags carry emphasis.
  private var runs: [Run] {
    guard probe.mainContainerID >= 0 else { return [] }
    var out: [Run] = []
    // (id, link, bold, italic, mono, mark, underline)
    var stack: [(Int, Bool, Bool, Bool, Bool, Bool, Bool)] =
      context.childIDs(of: probe.mainContainerID)
        .reversed()
        .map { ($0, false, false, false, false, false, false) }
    let inlineTags = LogseqElementView.inlineTags
    while let (id, link, bold, italic, mono, mark, under) = stack.popLast() {
      let ident = context.extensionIdentifier(of: id) ?? "logseq-div"
      let t = String(ident.dropFirst("logseq-".count))
      var classes = Set<String>()
      if case .string(let c) = context.childProperty(node: id, "style-class") {
        classes = Set(c.split(separator: " ").map(String.init))
      }
      if classes.contains("block-control-wrap") { continue }
      var attrs: [String: Any] = [:]
      if case .string(let j) = context.childProperty(node: id, "attrs"),
        let data = j.data(using: .utf8),
        let d = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
      {
        attrs = d
      }
      var text = ""
      if case .string(let v) = context.childProperty(node: id, "text") {
        text = v
      }
      if text.isEmpty && t == "raw-text" {
        text = attrs["data-raw-text"] as? String ?? ""
      }
      if text.isEmpty && t == "em-emoji" {
        text = (attrs["data-emoji"] as? String) ?? (attrs["emoji"] as? String) ?? ""
      }
      let b2 = bold || t == "strong" || t == "b"
      let i2 = italic || t == "em" || t == "i"
      let m2 = mono || t == "code" || t == "kbd"
      let k2 = mark || t == "mark"
      let u2 = under || t == "u" || classes.contains("hash-symbol")
      let l2 = link || t == "a"
      if !text.isEmpty {
        out.append(
          Run(
            text: text, nodeID: id, link: l2, bold: b2, italic: i2,
            mono: m2, mark: k2, underline: u2))
      }
      for c in context.childIDs(of: id).reversed() {
        stack.append((c, l2, b2, i2, m2, k2, u2))
      }
      _ = inlineTags
    }
    return out
  }

  private var attributed: AttributedString {
    var all = AttributedString()
    for run in runs {
      var a = AttributedString(run.text)
      var intent = a.inlinePresentationIntent ?? []
      if run.bold { intent.insert(.stronglyEmphasized) }
      if run.italic { intent.insert(.emphasized) }
      if !intent.isEmpty { a.inlinePresentationIntent = intent }
      if run.mono {
        a.font = .system(size: 12, design: .monospaced)
      }
      if run.underline { a.underlineStyle = .single }
      if run.mark { a.backgroundColor = Color.yellow.opacity(0.45) }
      if run.link {
        a.foregroundColor = LogseqColors.link
        a.link = URL(string: "lseq-node://\(run.nodeID)")
      }
      all += a
    }
    return all
  }

  /// DOM-faithful click on a descendant node — same enrichment the real
  /// element views attach (nodeId, target snapshot, modifier flags) so the
  /// OCaml document listener resolves closest() identically.
  private func emitClick(on nodeID: Int) {
    guard nodeID > 0 else { return }
    var payload: [String: Any] = ["button": 0, "nodeId": nodeID]
    payload["target"] = LogseqDOMSnapshot.snapshot(of: nodeID, context: context)
    let flags = NSEvent.modifierFlags
    payload["shiftKey"] = flags.contains(.shift)
    payload["metaKey"] = flags.contains(.command)
    payload["ctrlKey"] = flags.contains(.control)
    payload["altKey"] = flags.contains(.option)
    guard
      let data = try? JSONSerialization.data(withJSONObject: payload),
      let json = String(data: data, encoding: .utf8)
    else { return }
    do {
      try context.emit(
        on: nodeID, name: "dom-event",
        values: ["name": .string("click"), "payload": .string(json)])
    } catch {
      FileHandle.standardError.write(
        "DBG emitClick FAIL node=\(nodeID) err=\(error)\n".data(using: .utf8)!)
    }
  }

  private func emitHover(_ name: String) {
    guard probe.mainContainerID > 0 else { return }
    let payload: [String: Any] = ["nodeId": probe.mainContainerID]
    guard
      let data = try? JSONSerialization.data(withJSONObject: payload),
      let json = String(data: data, encoding: .utf8)
    else { return }
    try? context.emit(
      on: probe.mainContainerID, name: "dom-event",
      values: ["name": .string(name), "payload": .string(json)])
  }

  private var bulletZone: some View {
    HStack(spacing: 0) {
      if probe.hasChildren {
        Image(systemName: "chevron.right")
          .font(.system(size: 8, weight: .bold))
          .foregroundStyle(.secondary)
          .rotationEffect(.degrees(probe.arrowCollapsed ? 0 : 90))
          .frame(width: 12, height: 12)
          .contentShape(Rectangle())
          .onTapGesture { emitClick(on: probe.controlID) }
          .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) }
            action: { rect in
              LogseqFrameStore.setAlias(probe.controlID, rect, tag: "a")
            }
      }
      Circle()
        .fill(Color.secondary.opacity(0.5))
        .frame(width: 5, height: 5)
        .frame(width: 12, height: 12)
        .contentShape(Rectangle())
        .onTapGesture {
          emitClick(on: probe.bulletID > 0 ? probe.bulletID : probe.controlID)
        }
        .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) }
          action: { rect in
            LogseqFrameStore.setAlias(
              probe.bulletID > 0 ? probe.bulletID : probe.controlID,
              rect, tag: "a")
          }
    }
    .frame(width: 24, height: 20)
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .firstTextBaseline, spacing: 2) {
        bulletZone
        Text(attributed)
          .font(.system(size: 14))
          .frame(maxWidth: .infinity, alignment: .leading)
          .contentShape(Rectangle())
          .onTapGesture {
            emitClick(on: probe.contentID > 0 ? probe.contentID : probe.mainContainerID)
          }
          .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) }
            action: { rect in
              LogseqFrameStore.setAlias(
                probe.contentID > 0 ? probe.contentID : probe.mainContainerID,
                rect, tag: "div")
            }
      }
      .environment(\.openURL, OpenURLAction { url in
        guard url.scheme == "lseq-node",
          let id = Int(url.host ?? "")
        else { return .systemAction }
        emitClick(on: id)
        return .handled
      })
      ForEach(probe.siblings, id: \.self) { sibling in
        context.content(for: sibling)
      }
    }
    .onDisappear {
      for id in [probe.controlID, probe.bulletID, probe.contentID,
                 probe.mainContainerID] where id > 0 {
        LogseqFrameStore.clearAlias(id)
      }
    }
    .onHover { inside in
      hovering = inside
      emitHover(inside ? "mouseenter" : "mouseleave")
    }
  }
}
