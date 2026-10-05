import AppKit
import Foundation
import LUIAppleBackend
import PDFKit
import SwiftUI

// MARK: - attr model

/// One hls entry decoded from the `hls` attr JSON. Rects use the web
/// convention: PDF.js viewport units at scale 1, top-left origin —
/// converted to PDFKit page space (bottom-left origin) for rendering.
private struct HLRect: Codable {
  var x1 = 0.0, y1 = 0.0, x2 = 0.0, y2 = 0.0, w = 0.0, h = 0.0
}

private struct HLItem: Codable {
  var id = ""
  var page = 1
  var color: String?
  var bounding = HLRect()
  var rects: [HLRect] = []
  var text = ""
  var image: String?  // absolute png path for area hls
}

// MARK: - colors (cljs --ph-highlight-color-* = tailwind 300 steps)

private func hlNSColor(_ name: String?) -> NSColor {
  func rgb(_ v: UInt32) -> NSColor {
    NSColor(
      srgbRed: CGFloat((v >> 16) & 0xff) / 255,
      green: CGFloat((v >> 8) & 0xff) / 255,
      blue: CGFloat(v & 0xff) / 255, alpha: 1)
  }
  switch name {
  case "red": return rgb(0xfca5a5)
  case "green": return rgb(0x86efac)
  case "blue": return rgb(0x93c5fd)
  case "purple": return rgb(0xd8b4fe)
  default: return rgb(0xfde047)  // yellow
  }
}

private func hlSwiftColor(_ name: String?) -> Color {
  Color(nsColor: hlNSColor(name))
}

private let hlColorNames = ["yellow", "red", "green", "blue", "purple"]

// MARK: - annotation subclasses

/// Text/area highlight annotation. `hlID` links it back to the
/// annotation block uuid; `pageNo` is the 1-based page.
final class LogseqHLAnnotation: PDFAnnotation {
  var hlID = ""
  var hlColorName = "yellow"
  var areaImage: NSImage?
  var areaDashed = false

  /// text highlight
  convenience init(id: String, color: String, bounds: CGRect) {
    self.init(bounds: bounds, forType: .highlight, withProperties: nil)
    hlID = id
    hlColorName = color
    self.color = hlNSColor(color)
  }

  /// area highlight (image fragment)
  convenience init(
    id: String, color: String, bounds: CGRect, image: NSImage?, dashed: Bool
  ) {
    self.init(bounds: bounds, forType: .square, withProperties: nil)
    hlID = id
    hlColorName = color
    areaImage = image
    areaDashed = dashed
    self.color = hlNSColor(color)
    shouldDisplay = true
  }

  override func draw(with box: PDFDisplayBox, in context: CGContext) {
    if let img = areaImage {
      context.saveGState()
      img.draw(in: bounds)
      let c = hlNSColor(hlColorName)
      context.setStrokeColor(c.cgColor)
      context.setLineWidth(2)
      if areaDashed {
        context.setLineDash(phase: 0, lengths: [4, 4])
      }
      context.stroke(bounds.insetBy(dx: 1, dy: 1))
      context.restoreGState()
    } else {
      super.draw(with: box, in: context)
    }
  }
}

// MARK: - area capture overlay

/// Covers the PDFView while area mode is on; mouse drag captures a
/// region which is reported in page space.
final class AreaCaptureOverlay: NSView {
  var onCaptured: ((PDFPage, CGRect) -> Void)?
  private var start: NSPoint?
  private var current: NSPoint?
  private weak var pdfView: PDFView?

  init(pdfView: PDFView) {
    self.pdfView = pdfView
    super.init(frame: .zero)
    wantsLayer = true
    autoresizingMask = [.width, .height]
  }

  required init?(coder: NSCoder) { fatalError() }

  override var acceptsFirstResponder: Bool { true }

  override func draw(_ dirtyRect: NSRect) {
    guard let s = start, let c = current else { return }
    let r = NSRect(
      x: min(s.x, c.x), y: min(s.y, c.y),
      width: abs(s.x - c.x), height: abs(s.y - c.y))
    NSColor.systemBlue.withAlphaComponent(0.15).setFill()
    r.fill()
    NSColor.systemBlue.setStroke()
    let p = NSBezierPath(rect: r)
    p.lineWidth = 1
    p.stroke()
  }

  override func mouseDown(with event: NSEvent) {
    start = convert(event.locationInWindow, from: nil)
    current = start
  }

  override func mouseDragged(with event: NSEvent) {
    current = convert(event.locationInWindow, from: nil)
    needsDisplay = true
  }

  override func mouseUp(with event: NSEvent) {
    current = convert(event.locationInWindow, from: nil)
    defer {
      start = nil
      current = nil
      needsDisplay = true
    }
    guard let s = start, let c = current, let pdfView else { return }
    let viewRect = NSRect(
      x: min(s.x, c.x), y: min(s.y, c.y),
      width: abs(s.x - c.x), height: abs(s.y - c.y))
    guard viewRect.width > 10, viewRect.height > 10 else { return }
    // overlay space == pdfView space (it is a direct subview)
    guard let page = pdfView.page(for: viewRect.origin, nearest: true)
    else { return }
    let pageRect = pdfView.convert(viewRect, to: page)
    onCaptured?(page, pageRect)
  }
}

// MARK: - coordinator (AppKit glue)

@MainActor
final class PDFCoordinator: NSObject {
  weak var pdfView: PDFView?
  var emit: (String, [String: Any]) -> Void = { _, _ in }

  /// hl id -> annotations (one per rect line, or one per area)
  private var applied: [String: [LogseqHLAnnotation]] = [:]
  /// hl id -> decoded state
  private var hlsByID: [String: HLItem] = [:]
  var appliedSignature = ""
  var appliedTheme = ""
  var lastColor = "yellow"
  var highlightMode = false
  var areaMode = false
  var autoMenu = false
  var dashed = false
  var theme = ""
  private var handledRefHL = ""
  private var initialPage = 0
  private var initialScale = ""
  private var didInitialNav = false
  private var hlTimer: Timer?
  private var pageDebounce: Timer?
  private var scaleDebounce: Timer?
  private var monitors: [Any] = []
  private var overlay: AreaCaptureOverlay?
  var searchText = ""
  private var searchMatches: [PDFSelection] = []
  private var searchIndex = -1

  var onSearchCount: ((Int) -> Void)?
  var onPageChange: ((Int, Int) -> Void)?

  // ---------- lifecycle ----------

  func attach(_ view: PDFView) {
    pdfView = view
    let nc = NotificationCenter.default
    nc.addObserver(
      self, selector: #selector(pageChanged),
      name: .PDFViewPageChanged, object: view)
    nc.addObserver(
      self, selector: #selector(scaleChanged),
      name: .PDFViewScaleChanged, object: view)
    nc.addObserver(
      self, selector: #selector(selectionChanged),
      name: .PDFViewSelectionChanged, object: view)

    // NSEvent is not Sendable — extract the fields needed before
    // crossing into the main-actor handler.
    let down = NSEvent.addLocalMonitorForEvents(
      matching: [.leftMouseDown, .rightMouseDown]
    ) { [weak self] ev in
      let loc = ev.locationInWindow
      let winNum = ev.window?.windowNumber ?? -1
      let type = ev.type
      let consumed =
        MainActor.assumeIsolated {
          self?.mouseDown(loc: loc, winNum: winNum, type: type) ?? false
        }
      return consumed ? nil : ev
    }
    let up = NSEvent.addLocalMonitorForEvents(matching: .leftMouseUp) {
      [weak self] ev in
      let loc = ev.locationInWindow
      let winNum = ev.window?.windowNumber ?? -1
      let mods = ev.modifierFlags
      MainActor.assumeIsolated {
        self?.mouseUp(loc: loc, winNum: winNum, mods: mods)
      }
      return ev
    }
    monitors = [down, up].compactMap { $0 }
  }

  func detach() {
    monitors.forEach(NSEvent.removeMonitor)
    monitors = []
    NotificationCenter.default.removeObserver(self)
  }

  // ---------- attr application ----------

  private func decodeHls(_ attrs: [String: Any]) -> [HLItem] {
    guard let s = attrs["hls"] as? String, !s.isEmpty,
      let data = s.data(using: .utf8)
    else { return [] }
    return (try? JSONDecoder().decode([HLItem].self, from: data)) ?? []
  }

  func apply(attrs: [String: Any], in view: PDFView) {
    highlightMode = attrs["hl_mode"] as? String == "true"
    areaMode = attrs["area_mode"] as? String == "true"
    autoMenu = attrs["automenu"] as? String == "true"
    dashed = attrs["dashed"] as? String == "true"
    theme = attrs["theme"] as? String ?? ""
    applyTheme(view)
    applyAreaMode(view)

    let hls = decodeHls(attrs)
    hlsByID = Dictionary(hls.map { ($0.id, $0) }) { a, _ in a }
    let sig =
      hls.map { "\($0.id):\($0.color ?? ""):\($0.image ?? "")" }
      .joined(separator: "|") + "#\(dashed)"
    if sig != appliedSignature {
      appliedSignature = sig
      applyHls(hls, to: view)
    }

    // initial page / scale / armed ref-highlight
    let refHL = attrs["ref_hl"] as? String ?? ""
    if !didInitialNav, view.document != nil {
      didInitialNav = true
      initialPage = Int(attrs["page"] as? String ?? "1") ?? 1
      initialScale = attrs["scale"] as? String ?? "auto"
      if let s = Double(initialScale), s > 0.01, s < 10 {
        view.autoScales = false
        view.scaleFactor = CGFloat(s)
      } else {
        view.autoScales = true
      }
      if !refHL.isEmpty, refHL != handledRefHL {
        handledRefHL = refHL
        // wait for annotations to land before scrolling
        Task { @MainActor [weak self] in
          try? await Task.sleep(nanoseconds: 500_000_000)
          self?.scrollToHL(refHL)
        }
      } else if initialPage > 1,
        let p = view.document?.page(at: initialPage - 1)
      {
        view.go(to: p)
      }
    } else if !refHL.isEmpty, refHL != handledRefHL {
      handledRefHL = refHL
      scrollToHL(refHL)
    }
    onPageChange?(
      (view.currentPage.map { view.document?.index(for: $0) ?? 0 } ?? 0) + 1,
      view.document?.pageCount ?? 0)
  }

  private func applyTheme(_ view: PDFView) {
    // cljs ls-pdf-viewer-theme tints the page background
    let bg: NSColor
    switch theme {
    case "light": bg = .white
    case "warm": bg = NSColor(srgbRed: 0.96, green: 0.93, blue: 0.87, alpha: 1)
    case "dark": bg = NSColor(srgbRed: 0.12, green: 0.12, blue: 0.14, alpha: 1)
    default: bg = .controlBackgroundColor
    }
    view.backgroundColor = bg
    if theme != appliedTheme {
      appliedTheme = theme
    }
  }

  private func applyAreaMode(_ view: PDFView) {
    if areaMode {
      if overlay == nil {
        let ov = AreaCaptureOverlay(pdfView: view)
        ov.frame = view.bounds
        ov.onCaptured = { [weak self] page, rect in
          self?.areaCaptured(page: page, rect: rect)
        }
        view.addSubview(ov)
        overlay = ov
      }
    } else {
      overlay?.removeFromSuperview()
      overlay = nil
    }
  }

  private func applyHls(_ hls: [HLItem], to view: PDFView) {
    guard let doc = view.document else { return }
    // drop annotations for hls no longer present
    let live = Set(hls.map { $0.id })
    for (id, anns) in applied where !live.contains(id) {
      for ann in anns { ann.page?.removeAnnotation(ann) }
      applied.removeValue(forKey: id)
    }
    for hl in hls {
      // refresh color change by rebuilding if color differs
      if let existing = applied[hl.id],
        existing.first?.hlColorName == (hl.color ?? "yellow"),
        existing.first?.areaDashed == dashed
      {
        continue
      }
      if let existing = applied[hl.id] {
        for ann in existing { ann.page?.removeAnnotation(ann) }
      }
      guard let page = doc.page(at: max(0, hl.page - 1)) else { continue }
      let color = hl.color ?? "yellow"
      var anns: [LogseqHLAnnotation] = []
      if let imgPath = hl.image {
        // area highlight
        let bounds = pageRect(hl.bounding, in: page)
        let img = NSImage(contentsOfFile: imgPath)
        let ann = LogseqHLAnnotation(
          id: hl.id, color: color, bounds: bounds, image: img,
          dashed: dashed)
        page.addAnnotation(ann)
        anns = [ann]
      } else {
        for r in hl.rects.isEmpty ? [hl.bounding] : hl.rects {
          let ann = LogseqHLAnnotation(
            id: hl.id, color: color, bounds: pageRect(r, in: page))
          page.addAnnotation(ann)
          anns.append(ann)
        }
      }
      applied[hl.id] = anns
    }
  }

  /// pdf.js top-left-origin rect -> PDFKit bottom-left page space
  private func pageRect(_ r: HLRect, in page: PDFPage) -> CGRect {
    let h = page.bounds(for: .mediaBox).height
    return CGRect(x: r.x1, y: h - r.y1 - r.h, width: r.w, height: r.h)
  }

  /// PDFKit page rect -> pdf.js top-left-origin convention
  private func hlRect(_ r: CGRect, in page: PDFPage) -> [String: Any] {
    let h = page.bounds(for: .mediaBox).height
    return [
      "x1": Double(r.minX), "y1": Double(h - r.maxY),
      "x2": Double(r.maxX), "y2": Double(h - r.minY),
      "w": Double(r.width), "h": Double(r.height),
    ]
  }

  // ---------- scrolling ----------

  func scrollToHL(_ id: String) {
    guard let view = pdfView, let hl = hlsByID[id],
      let page = view.document?.page(at: max(0, hl.page - 1))
    else { return }
    let r = pageRect(hl.bounding, in: page)
    view.go(to: r.insetBy(dx: -20, dy: -20), on: page)
  }

  // ---------- context menus ----------

  private func colorMenuItems(
    _ action: @escaping @MainActor (String) -> Void
  ) -> [NSMenuItem] {
    hlColorNames.map { name in
      let item = NSMenuItem(title: name.capitalized, action: nil, keyEquivalent: "")
      item.representedObject = name
      let sw = NSImage(size: NSSize(width: 12, height: 12))
      sw.lockFocus()
      hlNSColor(name).setFill()
      NSBezierPath(ovalIn: NSRect(x: 1, y: 1, width: 10, height: 10)).fill()
      sw.unlockFocus()
      item.image = sw
      item.action = #selector(menuAction(_:))
      item.target = self
      menuActions[item] = { action(name) }
      return item
    }
  }

  private var menuActions: [NSMenuItem: @MainActor () -> Void] = [:]

  @objc private func menuAction(_ sender: NSMenuItem) {
    menuActions[sender]?()
  }

  private func menuItem(
    _ title: String, _ action: @escaping @MainActor () -> Void
  ) -> NSMenuItem {
    let item = NSMenuItem(title: title, action: #selector(menuAction(_:)), keyEquivalent: "")
    item.target = self
    menuActions[item] = action
    return item
  }

  /// ctx menu over an existing highlight (cljs pdf-highlights-ctx-menu
  /// for a dirty highlight): colors + ref/copy/link/del
  private func highlightMenu(_ ann: LogseqHLAnnotation) -> NSMenu {
    let menu = NSMenu()
    let id = ann.hlID
    for i in colorMenuItems({ [weak self] color in
      self?.emit("pdf-hl-color", ["id": id, "color": color])
    }) { menu.addItem(i) }
    menu.addItem(.separator())
    menu.addItem(menuItem("Copy block reference") { [weak self] in
      self?.emit("pdf-hl-ref", ["id": id])
    })
    if let text = hlsByID[id]?.text, !text.isEmpty {
      menu.addItem(menuItem("Copy text") {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
      })
    }
    menu.addItem(menuItem("Go to block") { [weak self] in
      self?.emit("pdf-hl-link", ["id": id])
    })
    menu.addItem(menuItem("Delete") { [weak self] in
      self?.emit("pdf-hl-del", ["id": id])
      if let anns = self?.applied[id] {
        for a in anns { a.page?.removeAnnotation(a) }
      }
      self?.applied.removeValue(forKey: id)
    })
    return menu
  }

  /// ctx menu over a fresh selection: colors only (creates the hl)
  private func selectionMenu(_ sel: PDFSelection) -> NSMenu {
    let menu = NSMenu()
    for i in colorMenuItems({ [weak self] color in
      self?.addSelectionHL(sel, color: color)
    }) { menu.addItem(i) }
    return menu
  }

  /// ctx menu over an area drag rect
  private func areaMenu(page: PDFPage, rect: CGRect) -> NSMenu {
    let menu = NSMenu()
    for i in colorMenuItems({ [weak self] color in
      self?.addAreaHL(page: page, rect: rect, color: color)
    }) { menu.addItem(i) }
    return menu
  }

  private func pop(_ menu: NSMenu, at loc: NSPoint) {
    guard let view = pdfView else { return }
    menu.popUp(positioning: nil, at: view.convert(loc, from: nil), in: view)
  }

  // ---------- mouse ----------

  /// returns true when the event is consumed (ctx menu shown)
  private func mouseDown(loc: NSPoint, winNum: Int, type: NSEvent.EventType)
    -> Bool
  {
    guard let view = pdfView, view.window?.windowNumber == winNum
    else { return false }
    // local monitors see every click in the window — the SwiftUI
    // chrome (sidebar/search) overlays the same region, so only act
    // when the topmost view at the point is inside the PDFView itself
    guard let hitView = view.window?.contentView?.hitTest(loc),
      hitView === view || hitView.isDescendant(of: view)
    else { return false }
    let pt = view.convert(loc, from: nil)
    guard let page = view.page(for: pt, nearest: false)
    else { return false }
    let pagePt = view.convert(pt, to: page)
    // page.annotation(at:) misses custom annotation types and
    // page(for:) may hand back a different page instance — hit-test
    // our applied registry instead. Line rects leave gaps between
    // lines: inflate to match web's whole-region click behavior.
    var hit: LogseqHLAnnotation?
    for anns in applied.values {
      for ann in anns.reversed() {
        if ann.page === page
          && ann.bounds.insetBy(dx: -4, dy: -4).contains(pagePt)
        {
          hit = ann
        }
      }
    }
    if type == .rightMouseDown {
      if let ann = hit {
        pop(highlightMenu(ann), at: loc)
      } else if let sel = view.currentSelection,
        let selStr = sel.string, !selStr.isEmpty
      {
        pop(selectionMenu(sel), at: loc)
      } else {
        return false
      }
      return true
    }
    // left click on a highlight opens its ctx menu (web behavior)
    if let ann = hit {
      pop(highlightMenu(ann), at: loc)
      return true
    }
    return false
  }

  private func appliedHL(_ id: String) -> HLItem? { hlsByID[id] }

  private func mouseUp(loc: NSPoint, winNum: Int, mods: NSEvent.ModifierFlags) {
    guard let view = pdfView, view.window?.windowNumber == winNum,
      let sel = view.currentSelection,
      let s = sel.string, !s.isEmpty
    else { return }
    guard let hitView = view.window?.contentView?.hitTest(loc),
      hitView === view || hitView.isDescendant(of: view)
    else { return }
    // cljs: fresh-selection menu needs the auto-open setting or Alt
    if autoMenu || mods.contains(.option) {
      pop(selectionMenu(sel), at: loc)
    }
  }

  // ---------- selection -> hl ----------

  private func selectionRects(_ sel: PDFSelection) -> (
    page: PDFPage, index: Int, bounding: [String: Any], rects: [[String: Any]]
  )? {
    guard let view = pdfView else { return nil }
    // group line bounds by page (web highlights are per-page)
    var byPage: [Int: (page: PDFPage, rects: [CGRect])] = [:]
    for line in sel.selectionsByLine() {
      for page in line.pages {
        let b = line.bounds(for: page)
        let idx = view.document?.index(for: page) ?? 0
        byPage[idx, default: (page, [])].rects.append(b)
      }
    }
    guard let first = byPage.sorted(by: { $0.key < $1.key }).first
    else { return nil }
    let (page, rects) = first.value
    let union = rects.reduce(rects.first ?? .zero) { $0.union($1) }
    return (
      page: page, index: first.key,
      bounding: hlRect(union, in: page),
      rects: rects.map { hlRect($0, in: page) }
    )
  }

  /// cljs add-hl! on a text selection -> persist + copy ((uuid)) ref
  private func addSelectionHL(_ sel: PDFSelection, color: String) {
    guard let parts = selectionRects(sel) else { return }
    let id = UUID().uuidString.lowercased()
    lastColor = color
    emit(
      "pdf-hl-add",
      [
        "id": id, "page": parts.index + 1, "color": color,
        "bounding": parts.bounding, "rects": parts.rects,
        "text": sel.string ?? "",
      ])
    pdfView?.clearSelection()
  }

  /// cljs highlight-mode: a new selection auto-applies the last color
  /// after 300ms
  @objc nonisolated private func selectionChanged(_ n: Notification) {
    MainActor.assumeIsolated { selectionChangedMain() }
  }

  private func selectionChangedMain() {
    guard highlightMode, let view = pdfView,
      let sel = view.currentSelection,
      let s = sel.string, !s.isEmpty
    else { return }
    hlTimer?.invalidate()
    let color = lastColor
    hlTimer = Timer.scheduledTimer(withTimeInterval: 0.3, repeats: false)
    { [weak self] _ in
      MainActor.assumeIsolated {
        guard let self, let view = self.pdfView,
          let cur = view.currentSelection, let cs = cur.string, !cs.isEmpty
        else { return }
        self.addSelectionHL(cur, color: color)
      }
    }
  }

  // ---------- area capture -> hl ----------

  private func areaCaptured(page: PDFPage, rect: CGRect) {
    // cljs: captured rect shows the color ctx menu
    guard let view = pdfView, let event = NSApp.currentEvent else {
      addAreaHL(page: page, rect: rect, color: lastColor)
      return
    }
    let menu = areaMenu(page: page, rect: rect)
    NSMenu.popUpContextMenu(menu, with: event, for: view)
  }

  private func addAreaHL(page: PDFPage, rect: CGRect, color: String) {
    guard let view = pdfView else { return }
    lastColor = color
    let id = UUID().uuidString.lowercased()
    let png = renderAreaPNG(page: page, rect: rect) ?? ""
    emit(
      "pdf-hl-area",
      [
        "id": id, "page": (view.document?.index(for: page) ?? 0) + 1,
        "color": color,
        "bounding": hlRect(rect, in: page),
        "rects": [hlRect(rect, in: page)],
        "png": png,
      ])
  }

  /// cljs persist-hl-area-image$ — crop the rendered page at 2x
  private func renderAreaPNG(page: PDFPage, rect: CGRect) -> String? {
    let scale: CGFloat = 2.0
    let pageBounds = page.bounds(for: .mediaBox)
    let w = Int(pageBounds.width * scale)
    let h = Int(pageBounds.height * scale)
    guard w > 0, h > 0,
      let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
        isPlanar: false, colorSpaceName: .deviceRGB,
        bytesPerRow: 0, bitsPerPixel: 0)
    else { return nil }
    rep.size = pageBounds.size
    NSGraphicsContext.saveGraphicsState()
    let ctx = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current = ctx
    page.draw(with: .mediaBox, to: ctx!.cgContext)
    NSGraphicsContext.restoreGraphicsState()
    guard let full = rep.cgImage else { return nil }
    // cgImage pixels are top-left origin; page space is bottom-left
    let px = rect.origin.x * scale
    let py = (pageBounds.height - rect.origin.y - rect.height) * scale
    let pw = rect.width * scale
    let ph = rect.height * scale
    guard let crop = full.cropping(to: CGRect(x: px, y: py, width: pw, height: ph))
    else { return nil }
    let out = NSBitmapImageRep(cgImage: crop)
    guard let png = out.representation(using: .png, properties: [:])
    else { return nil }
    return png.base64EncodedString()
  }

  // ---------- notifications ----------

  @objc nonisolated private func pageChanged(_ n: Notification) {
    MainActor.assumeIsolated { pageChangedMain() }
  }

  private func pageChangedMain() {
    guard let view = pdfView, let doc = view.document,
      let page = view.currentPage
    else { return }
    let idx = doc.index(for: page)
    onPageChange?(idx + 1, doc.pageCount)
    pageDebounce?.invalidate()
    pageDebounce = Timer.scheduledTimer(withTimeInterval: 0.3, repeats: false)
    { [weak self] _ in
      MainActor.assumeIsolated { self?.emit("pdf-page", ["page": idx + 1]) }
    }
  }

  @objc nonisolated private func scaleChanged(_ n: Notification) {
    MainActor.assumeIsolated { scaleChangedMain() }
  }

  private func scaleChangedMain() {
    guard let view = pdfView else { return }
    scaleDebounce?.invalidate()
    scaleDebounce = Timer.scheduledTimer(withTimeInterval: 0.3, repeats: false)
    { [weak self] _ in
      MainActor.assumeIsolated {
        self?.emit(
          "pdf-scale", ["scale": String(format: "%.2f", view.scaleFactor)])
      }
    }
  }

  // ---------- search ----------

  func search(_ text: String) {
    searchText = text
    guard let view = pdfView else { return }
    if text.isEmpty {
      searchMatches = []
      searchIndex = -1
      onSearchCount?(0)
      return
    }
    searchMatches = view.document?.findString(text, withOptions: .caseInsensitive) ?? []
    searchIndex = searchMatches.isEmpty ? -1 : 0
    onSearchCount?(searchMatches.count)
    showSearchMatch()
  }

  func searchNext() {
    guard !searchMatches.isEmpty else { return }
    searchIndex = (searchIndex + 1) % searchMatches.count
    showSearchMatch()
  }

  func searchPrev() {
    guard !searchMatches.isEmpty else { return }
    searchIndex =
      (searchIndex - 1 + searchMatches.count) % searchMatches.count
    showSearchMatch()
  }

  private func showSearchMatch() {
    guard searchIndex >= 0, searchIndex < searchMatches.count,
      let view = pdfView
    else { return }
    view.setCurrentSelection(searchMatches[searchIndex], animate: true)
  }

  // ---------- zoom / pager ----------

  func zoomIn() { pdfView?.zoomIn(nil) }
  func zoomOut() { pdfView?.zoomOut(nil) }
  func zoomFit() { pdfView?.autoScales = true }
  func nextPage() {
    if let p = pdfView?.currentPage,
      let n = pdfView?.document?.page(
        at: (pdfView?.document?.index(for: p) ?? 0) + 1)
    { pdfView?.go(to: n) }
  }
  func prevPage() {
    if let p = pdfView?.currentPage {
      let i = pdfView?.document?.index(for: p) ?? 0
      if i > 0, let n = pdfView?.document?.page(at: i - 1) {
        pdfView?.go(to: n)
      }
    }
  }
}

// MARK: - PDFView wrapper

private struct PDFKitView: NSViewRepresentable {
  let path: String
  let attrs: [String: Any]
  let coord: PDFCoordinator

  func makeCoordinator() -> PDFCoordinator { coord }

  func makeNSView(context: Context) -> PDFView {
    let view = PDFView()
    view.autoScales = true
    view.displayMode = .singlePageContinuous
    view.displaysPageBreaks = true
    if !path.isEmpty, let doc = PDFDocument(url: URL(fileURLWithPath: path)) {
      view.document = doc
    }
    context.coordinator.attach(view)
    return view
  }

  static func dismantleNSView(_ view: PDFView, coordinator: PDFCoordinator) {
    coordinator.detach()
  }

  func updateNSView(_ view: PDFView, context: Context) {
    if !path.isEmpty, view.document?.documentURL?.path != path {
      context.coordinator.didInitialNavReset()
      view.document = PDFDocument(url: URL(fileURLWithPath: path))
    }
    context.coordinator.apply(attrs: attrs, in: view)
  }
}

extension PDFCoordinator {
  func didInitialNavReset() {
    didInitialNav = false
    handledRefHL = ""
  }
}

// MARK: - outline model

private struct OutlineItem: Identifiable {
  let id = UUID()
  let label: String
  let destination: PDFDestination?
  let children: [OutlineItem]
}

private func outlineItems(_ o: PDFOutline?) -> [OutlineItem] {
  guard let o else { return [] }
  return (0..<o.numberOfChildren).compactMap { i in
    guard let c = o.child(at: i) else { return nil }
    return OutlineItem(
      label: c.label ?? "", destination: c.destination,
      children: outlineItems(c))
  }
}

// MARK: - the component

/// `logseq-pdf` — the whole PDF viewer as a native component. OCaml
/// supplies the semantic data (path/hls/page/scale/modes/flags) and
/// receives annotation + persist events; everything the user sees —
/// canvas, annotations, toolbar, sidebar, find bar, settings, context
/// menus — is rendered natively (PDFKit/SwiftUI).
struct LogseqPDFView: View {
  let context: LUIAppleExtensionViewContext
  let attrs: [String: Any]

  private var path: String { attrs["path"] as? String ?? "" }
  private var filename: String { attrs["filename"] as? String ?? "" }
  private var theme: String { attrs["theme"] as? String ?? "" }
  private var hlMode: Bool { attrs["hl_mode"] as? String == "true" }
  private var areaMode: Bool { attrs["area_mode"] as? String == "true" }
  private var autoMenu: Bool { attrs["automenu"] as? String == "true" }
  private var dashed: Bool { attrs["dashed"] as? String == "true" }
  private var colored: Bool { attrs["colored"] as? String == "true" }

  @State private var coord = PDFCoordinator()
  @State private var sidebarVisible = false
  @State private var sidebarTab = 1
  @State private var pageLabel = ""
  @State private var showSearch = false
  @State private var searchText = ""
  @State private var matchCount = 0
  @State private var activeHL = ""
  @State private var infoPopover = false

  private var hls: [HLItem] {
    guard let s = attrs["hls"] as? String, !s.isEmpty,
      let data = s.data(using: .utf8)
    else { return [] }
    return (try? JSONDecoder().decode([HLItem].self, from: data)) ?? []
  }

  private func emit(_ name: String, _ payload: [String: Any] = [:]) {
    var p = payload
    p["nodeId"] = context.nodeID
    p["target"] = LogseqDOMSnapshot.snapshot(for: context)
    guard let data = try? JSONSerialization.data(withJSONObject: p),
      let json = String(data: data, encoding: .utf8)
    else { return }
    try? context.emit(
      name: "dom-event",
      values: ["name": .string(name), "payload": .string(json)])
  }

  // MARK: toolbar

  @ViewBuilder private var toolbar: some View {
    HStack(spacing: 2) {
      Image(systemName: "doc.richtext").foregroundStyle(.secondary)
      Text(filename)
        .font(.system(size: 12))
        .foregroundStyle(.secondary)
        .lineLimit(1)
        .frame(maxWidth: 160, alignment: .leading)
      Spacer()
      iconBtn("magnifyingglass", "Search") {
        showSearch.toggle()
      }
      iconBtn("sidebar.right", "Outline & highlights") {
        sidebarVisible.toggle()
      }
      iconBtn(
        "list.bullet.rectangle", "Annotations page"
      ) { emit("pdf-annots") }
      iconBtn("arrow.up.forward.app", "Open externally") {
        NSWorkspace.shared.open(URL(fileURLWithPath: path))
      }
      divider()
      modeBtn(
        "rectangle.dashed", "Area highlight mode", on: areaMode
      ) { emit("pdf-mode", ["name": "area", "on": areaMode ? "false" : "true"]) }
      modeBtn(
        "text.highlighter", "Highlight mode", on: hlMode
      ) { emit("pdf-mode", ["name": "highlight", "on": hlMode ? "false" : "true"]) }
      divider()
      iconBtn("minus.magnifyingglass", "Zoom out") { coord.zoomOut() }
      iconBtn("plus.magnifyingglass", "Zoom in") { coord.zoomIn() }
      iconBtn("arrow.up.left.and.arrow.down.right", "Auto fit") {
        coord.zoomFit()
      }
      divider()
      Text(pageLabel)
        .font(.system(size: 11).monospacedDigit())
        .foregroundStyle(.secondary)
      iconBtn("chevron.up", "Previous page") { coord.prevPage() }
      iconBtn("chevron.down", "Next page") { coord.nextPage() }
      divider()
      settingsMenu
      Button("Close") { emit("pdf-close") }
        .buttonStyle(.plain)
        .font(.system(size: 12))
        .foregroundStyle(.secondary)
    }
    .padding(.horizontal, 10)
    .padding(.vertical, 6)
    .background(LogseqColors.secondaryBackground)
  }

  private func divider() -> some View {
    Divider().frame(height: 14).padding(.horizontal, 4)
  }

  private func iconBtn(
    _ icon: String, _ help: String, action: @escaping () -> Void
  ) -> some View {
    Button(action: action) {
      Image(systemName: icon)
        .font(.system(size: 11))
        .foregroundStyle(.secondary)
        .frame(width: 20, height: 18)
    }
    .buttonStyle(.plain)
    .help(help)
  }

  private func modeBtn(
    _ icon: String, _ help: String, on: Bool, action: @escaping () -> Void
  ) -> some View {
    Button(action: action) {
      Image(systemName: icon)
        .font(.system(size: 11))
        .foregroundStyle(on ? Color.accentColor : .secondary)
        .frame(width: 20, height: 18)
    }
    .buttonStyle(.plain)
    .help(help)
  }

  private var settingsMenu: some View {
    Menu {
      Menu("Theme") {
        ForEach(["light", "warm", "dark"], id: \.self) { t in
          Button {
            emit("pdf-flag", ["name": "theme", "value": t])
          } label: {
            HStack {
              Text(t.capitalized)
              if theme == t { Image(systemName: "checkmark") }
            }
          }
        }
      }
      Divider()
      Button {
        emit("pdf-flag", ["name": "dashed", "value": dashed ? "false" : "true"])
      } label: {
        Label("Toggle dashed border", systemImage: dashed ? "checkmark.square" : "square")
      }
      Button {
        emit("pdf-flag", ["name": "colored", "value": colored ? "false" : "true"])
      } label: {
        Label("Colored hl blocks", systemImage: colored ? "checkmark.square" : "square")
      }
      Button {
        emit("pdf-flag", ["name": "automenu", "value": autoMenu ? "false" : "true"])
      } label: {
        Label("Auto open context menu", systemImage: autoMenu ? "checkmark.square" : "square")
      }
      Divider()
      Button("Document metadata") { infoPopover = true }
    } label: {
      Image(systemName: "slider.horizontal.3")
        .font(.system(size: 11))
        .foregroundStyle(.secondary)
        .frame(width: 20, height: 18)
    }
    .menuStyle(.borderlessButton)
    .frame(width: 24)
    .popover(isPresented: $infoPopover) {
      docInfo
    }
  }

  private var docInfo: some View {
    let doc = coord.pdfView?.document
    let attrs = doc?.documentAttributes ?? [:]
    return VStack(alignment: .leading, spacing: 4) {
      ForEach(
        ["Title", "Author", "Subject", "Keywords", "Creator", "Producer",
         "CreationDate", "ModDate"], id: \.self
      ) { key in
        let k = PDFDocumentAttribute(rawValue: key + "Attribute")
        if let v = attrs[k] {
          Text("\(key): \(String(describing: v))")
            .font(.system(size: 11))
            .textSelection(.enabled)
        }
      }
      if let n = doc?.pageCount {
        Text("Pages: \(n)").font(.system(size: 11))
      }
    }
    .padding(10)
  }

  // MARK: search row

  @ViewBuilder private var searchRow: some View {
    if showSearch {
      HStack(spacing: 6) {
        Image(systemName: "magnifyingglass")
          .font(.system(size: 10))
          .foregroundStyle(.secondary)
        TextField("Find in document", text: $searchText)
          .textFieldStyle(.plain)
          .font(.system(size: 12))
          .onChange(of: searchText) { coord.search($1) }
          .onSubmit { coord.searchNext() }
        Text(matchCount == 0 ? "" : "\(matchCount)")
          .font(.system(size: 10).monospacedDigit())
          .foregroundStyle(.secondary)
        iconBtn("chevron.up", "Previous match") { coord.searchPrev() }
        iconBtn("chevron.down", "Next match") { coord.searchNext() }
        iconBtn("xmark", "Close") { showSearch = false }
      }
      .padding(.horizontal, 10)
      .padding(.vertical, 4)
      .background(LogseqColors.secondaryBackground)
    }
  }

  // MARK: sidebar

  @ViewBuilder private var sidebar: some View {
    VStack(spacing: 0) {
      Picker("", selection: $sidebarTab) {
        Image(systemName: "list.bullet.indent").tag(0)
        Image(systemName: "highlighter").tag(1)
      }
      .pickerStyle(.segmented)
      .padding(6)
      if sidebarTab == 0 {
        outlinePanel
      } else {
        highlightsPanel
      }
    }
    .frame(width: 220)
    .background(LogseqColors.primaryBackground)
    .overlay(alignment: .leading) { Divider() }
  }

  @ViewBuilder private var outlinePanel: some View {
    let items = outlineItems(coord.pdfView?.document?.outlineRoot)
    if items.isEmpty {
      Text("No outlines")
        .font(.system(size: 11))
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    } else {
      List {
        ForEach(items) { item in
          outlineRow(item)
        }
      }
      .listStyle(.sidebar)
    }
  }

  @ViewBuilder private func outlineRow(_ item: OutlineItem) -> some View {
    if item.children.isEmpty {
      Button {
        if let d = item.destination { coord.pdfView?.go(to: d) }
      } label: {
        Text(item.label)
          .font(.system(size: 11))
          .lineLimit(2)
          .frame(maxWidth: .infinity, alignment: .leading)
      }
      .buttonStyle(.plain)
    } else {
      DisclosureGroup {
        ForEach(item.children) { c in AnyView(outlineRow(c)) }
      } label: {
        Button {
          if let d = item.destination { coord.pdfView?.go(to: d) }
        } label: {
          Text(item.label).font(.system(size: 11)).lineLimit(2)
        }
        .buttonStyle(.plain)
      }
    }
  }

  @ViewBuilder private var highlightsPanel: some View {
    let items = hls.sorted { $0.page < $1.page }
    if items.isEmpty {
      Text("No highlights")
        .font(.system(size: 11))
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    } else {
      ScrollView {
        LazyVStack(spacing: 0) {
          ForEach(items, id: \.id) { hl in
            HStack(spacing: 6) {
              Circle()
                .fill(hlSwiftColor(hl.color))
                .frame(width: 8, height: 8)
              VStack(alignment: .leading, spacing: 1) {
                Text("Page \(hl.page)")
                  .font(.system(size: 10, weight: .medium))
                  .foregroundStyle(.secondary)
                if !hl.text.isEmpty {
                  Text(hl.text)
                    .font(.system(size: 11))
                    .lineLimit(2)
                    .foregroundStyle(.primary)
                } else if hl.image != nil {
                  if let p = hl.image,
                    let img = NSImage(contentsOfFile: p)
                  {
                    Image(nsImage: img)
                      .resizable()
                      .aspectRatio(contentMode: .fit)
                      .frame(maxHeight: 60)
                  }
                }
              }
              Spacer(minLength: 0)
              Button {
                emit("pdf-hl-link", ["id": hl.id])
              } label: {
                Image(systemName: "arrow.turn.down.right")
                  .font(.system(size: 9))
                  .foregroundStyle(.secondary)
              }
              .buttonStyle(.plain)
              .help("Linked reference")
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(
              activeHL == hl.id
                ? LogseqColors.tertiaryBackground : .clear)
            .contentShape(Rectangle())
            .onTapGesture {
              activeHL = hl.id
              coord.scrollToHL(hl.id)
            }
            .contextMenu {
              Button("Copy block reference") {
                emit("pdf-hl-ref", ["id": hl.id])
              }
              Button("Linked reference") {
                emit("pdf-hl-link", ["id": hl.id])
              }
              Button("Delete") {
                emit("pdf-hl-del", ["id": hl.id])
              }
            }
            Divider()
          }
        }
      }
    }
  }

  // MARK: body

  var body: some View {
    let _ = coord.emit = emit
    let _ = coord.onSearchCount = { matchCount = $0 }
    let _ = coord.onPageChange = { cur, total in
      pageLabel = "\(cur) of \(total)"
    }
    VStack(spacing: 0) {
      toolbar
      searchRow
      // The pdf element is a fixed-width pane at the window edge — a
      // side column would overflow and clip, so the sidebar floats
      // over the document area like the web sidebar.
      ZStack(alignment: .trailing) {
        PDFKitView(path: path, attrs: attrs, coord: coord)
        if sidebarVisible { sidebar }
      }
    }
    .background(LogseqColors.primaryBackground)
  }
}
