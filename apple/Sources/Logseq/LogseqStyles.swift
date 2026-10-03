import AppKit
import Foundation
import SwiftUI

/// Radix-color tokens matching the --rx-* / --ls-* custom properties the web
/// app ships (resources/css). Light = Radix light gray scale; dark = Radix
/// dark gray scale; accent = blue scale Logseq uses for links.
@MainActor enum LogseqColors {
  private static func hex(_ value: UInt32) -> Color {
    Color(
      .sRGB,
      red: Double((value >> 16) & 0xff) / 255,
      green: Double((value >> 8) & 0xff) / 255,
      blue: Double(value & 0xff) / 255)
  }

  private static func hexNS(_ value: UInt32) -> NSColor {
    NSColor(
      srgbRed: CGFloat((value >> 16) & 0xff) / 255,
      green: CGFloat((value >> 8) & 0xff) / 255,
      blue: CGFloat(value & 0xff) / 255,
      alpha: 1)
  }

  @MainActor static var isDark: Bool {
    NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
  }

  // rx-gray scale (Radix "gray")
  private static let lightGray: [UInt32] = [
    0xfcfcfc, 0xf9f9f9, 0xf0f0f0, 0xe8e8e8, 0xe0e0e0, 0xd9d9d9,
    0xcecece, 0xbbbbbb, 0x8d8d8d, 0x838383, 0x646464, 0x202020,
  ]
  private static let darkGray: [UInt32] = [
    0x111111, 0x191919, 0x222222, 0x2a2a2a, 0x313131, 0x3a3a3a,
    0x484848, 0x606060, 0x6e6e6e, 0x7b7b7b, 0xb4b4b4, 0xeeeeee,
  ]

  // rx-blue scale (Radix "blue") for links/accents
  private static let lightBlue: [UInt32] = [
    0xfdfdfe, 0xf7f9ff, 0xedf2fe, 0xe1e9ff, 0xd2deff, 0xc1d0ff,
    0xabbdf9, 0x8da4ef, 0x3e63dd, 0x3358d4, 0x3a5bc7, 0x1f2d5c,
  ]
  private static let darkBlue: [UInt32] = [
    0x0d1520, 0x111927, 0x0d2847, 0x003362, 0x004074, 0x104d87,
    0x205d9e, 0x2870bd, 0x0090ff, 0x3b9eff, 0x70b8ff, 0xc2e6ff,
  ]

  static func gray(_ step: Int) -> Color {
    let palette = isDark ? darkGray : lightGray
    return hex(palette[min(max(step - 1, 0), 11)])
  }

  static func blue(_ step: Int) -> Color {
    let palette = isDark ? darkBlue : lightBlue
    return hex(palette[min(max(step - 1, 0), 11)])
  }

  /// Tailwind-style named hues used by `--color-<name>-<step>` vars
  /// (block background swatches, tag colors). 500-step hexes.
  static func namedHue(_ name: String) -> Color? {
    switch name {
    case "yellow": return hex(0xeab308)
    case "red": return hex(0xef4444)
    case "pink": return hex(0xec4899)
    case "green": return hex(0x22c55e)
    case "blue": return hex(0x3b82f6)
    case "purple": return hex(0xa855f7)
    case "orange": return hex(0xf97316)
    case "gray": return hex(0x6b7280)
    default: return nil
    }
  }

  static func grayNS(_ step: Int) -> NSColor {
    let palette = isDark ? darkGray : lightGray
    return hexNS(palette[min(max(step - 1, 0), 11)])
  }

  static func blueNS(_ step: Int) -> NSColor {
    let palette = isDark ? darkBlue : lightBlue
    return hexNS(palette[min(max(step - 1, 0), 11)])
  }

  static var primaryText: Color { gray(12) }
  static var secondaryText: Color { gray(11) }
  static var primaryBackground: Color { gray(1) }
  static var secondaryBackground: Color { gray(2) }
  static var tertiaryBackground: Color { gray(3) }
  static var quaternaryBackground: Color { gray(4) }
  static var border: Color { gray(5) }
  static var link: Color { blue(11) }
}

/// Right sidebar width — local-only view state like the web's resizer
/// (the OCaml side emits a fixed aria-valuenow; the drag lives natively).
@MainActor @Observable final class LogseqRightSidebarLayout {
  static let shared = LogseqRightSidebarLayout()
  var width: CGFloat = 420
}

/// Parses the space-separated `style-class` prop (tailwind-ish utility class
/// names Logseq emits) into a small set of native style hints. Unknown classes
/// are ignored; the web CSS class names are the contract, not the mechanism.
@MainActor struct LogseqStyle {
  var fontSize: CGFloat?
  var fontWeight: Font.Weight?
  var fontDesign: Font.Design?
  var foreground: Color?
  var background: Color?
  /// Fill applied while the pointer hovers (web `:hover` rules — e.g.
  /// sidebar `a.item:hover` gets lx-gray-04).
  var hoverBackground: Color?
  /// Render the native macOS sidebar vibrancy material instead of a flat
  /// color (adapts to dark mode + window focus automatically).
  var sidebarMaterial = false
  var padding: EdgeInsets?
  var margin: EdgeInsets?
  var cornerRadius: CGFloat?
  var isMono = false
  var isItalic = false
  var isUnderline = false
  var isBold = false
  var maxWidth: CGFloat?
  var maxHeight: CGFloat?
  var fixedWidth: CGFloat?
  var fixedHeight: CGFloat?
  var minWidth: CGFloat?
  var minHeight: CGFloat?
  var isHidden = false
  // CSS opacity != visibility: an opacity-0 element still hit-tests
  // (the .block-add-button click surface relies on that).
  var alpha: Double = 1
  var isRow = false
  var fullWidth = false
  var fullHeight = false
  var grow = false
  var isScrollable = false
  var stackSpacing: CGFloat?
  var centerContent = false
  var lineLimitOne = false
  var lineSpacing: CGFloat?
  var wantsOpen = false
  var hasIsOpen = false
  var centerHorizontally = false
  var outOfFlow = false
  /// position:absolute inset-y-0 — out-of-flow child stretched to the
  /// container's full height (the right-sidebar resize handle).
  var outOfFlowFillY = false
  /// position:fixed full-viewport layer — escapes the collapsed overlay
  /// containers and renders in the window-level overlay z-stack instead.
  var fillsOverlay = false
  var hasShadow = false
  /// Stacking order inside LogseqOverlayLayer — dismiss/scrim layers go
  /// below the dialog content (mount order alone is not reliable).
  var overlayZ = 0
  /// justify-content: space-between on a row container.
  var spaceBetween = false
  /// element carried the `item` class — gates `.active` fill to sidebar
  /// rows (the class means other things elsewhere in the tree).
  var inItem = false
  /// position:fixed anchor offsets (dropdown/context menus).
  var fixedX: CGFloat?
  var fixedY: CGFloat?
  var fixedRight: CGFloat?
  var fixedBottom: CGFloat?
  /// 1px `--ls-border-color` stroke (popover chrome).
  var hasBorder = false
  /// Clip children at the element's own frame (popover overflow).
  var clipContent = false
  /// `hide-scrollbar` — scrollable without visible indicators.
  var hideScrollIndicators = false

  private static let spacingUnit: CGFloat = 4 // tailwind spacing scale unit

  static func parse(_ classes: String) -> LogseqStyle {
    var style = LogseqStyle()
    for cls in classes.split(separator: " ").map(String.init) {
      style.apply(cls)
    }
    if style.wantsOpen && !style.hasIsOpen { style.isHidden = true }
    return style
  }

  /// The `accessibility-identifier` prop carries the DOM `id` — several shell
  /// containers get their layout from `#id` rules in the theme stylesheet
  /// (no tailwind classes), so map those here.
  /// Parse the DOM `style` attr ("height:28px; margin-left:22px;") — the
  /// same CSS declarations the web stylesheet would apply, in the subset the
  /// native renderer can honor.
  mutating func applyInline(_ css: String) {
    for decl in css.split(separator: ";") {
      let parts = decl.split(separator: ":", maxSplits: 1)
      guard parts.count == 2 else { continue }
      let key = parts[0].trimmingCharacters(in: .whitespaces).lowercased()
      let value = parts[1].trimmingCharacters(in: .whitespaces).lowercased()
      let px = Double(value.replacingOccurrences(of: "px", with: ""))
      switch key {
      case "display":
        if value == "none" { isHidden = true }
      case "visibility":
        if value == "hidden" { isHidden = true }
      case "opacity":
        if let v = px { alpha = v }
      case "position":
        if value == "fixed" { outOfFlow = true; fillsOverlay = true }
        else if value == "absolute" { outOfFlow = true }
      case "left": fixedX = px.map { CGFloat($0) }
      case "top": fixedY = px.map { CGFloat($0) }
      case "right": fixedRight = px.map { CGFloat($0) }
      case "bottom": fixedBottom = px.map { CGFloat($0) }
      case "z-index": overlayZ = Int(px ?? 0)
      case "height": fixedHeight = px.map { CGFloat($0) }
      case "min-height": minHeight = px.map { CGFloat($0) }
      case "max-height": maxHeight = px.map { CGFloat($0) }
      case "width": fixedWidth = px.map { CGFloat($0) }
      case "min-width": minWidth = px.map { CGFloat($0) }
      case "max-width": maxWidth = px.map { CGFloat($0) }
      case "overflow", "overflow-y":
        if value == "auto" || value == "scroll" { isScrollable = true }
      case "white-space":
        if value == "nowrap" { lineLimitOne = true }
      case "margin", "margin-top", "margin-bottom", "margin-left", "margin-right":
        var m = margin ?? EdgeInsets()
        switch key {
        case "margin": m = EdgeInsets(top: px ?? 0, leading: px ?? 0, bottom: px ?? 0, trailing: px ?? 0)
        case "margin-top": m.top = px ?? 0
        case "margin-bottom": m.bottom = px ?? 0
        case "margin-left": m.leading = px ?? 0
        case "margin-right": m.trailing = px ?? 0
        default: break
        }
        margin = m
      case "padding", "padding-top", "padding-bottom", "padding-left", "padding-right":
        var p = padding ?? EdgeInsets()
        switch key {
        case "padding": p = EdgeInsets(top: px ?? 0, leading: px ?? 0, bottom: px ?? 0, trailing: px ?? 0)
        case "padding-top": p.top = px ?? 0
        case "padding-bottom": p.bottom = px ?? 0
        case "padding-left": p.leading = px ?? 0
        case "padding-right": p.trailing = px ?? 0
        default: break
        }
        padding = p
      case "font-size":
        fontSize = px.map { CGFloat($0) }
      case "font-weight":
        if value == "bold" || (px ?? 0) >= 600 { isBold = true }
      case "background-color":
        if let c = parseCSSColor(value) { background = c }
      case "border-radius":
        cornerRadius = px.map { CGFloat($0) }
      // base-ui popover max-height: "Npx" direct, or
      // "calc(100vh - Npx)" viewport-relative.
      case "--available-height":
        if let px {
          maxHeight = CGFloat(px)
        } else if let range = value.range(
          of: #"calc\(100vh - ([\d.]+)px\)"#, options: .regularExpression)
        {
          let inner = String(value[range]).dropFirst(13).dropLast(3)
          if let n = Double(inner),
            let vh = NSApp.mainWindow?.contentView?.bounds.height
          {
            maxHeight = max(0, vh - CGFloat(n))
          }
        }
      default:
        break
      }
    }
  }

  mutating func applyAccessibilityId(_ id: String) {
    switch id {
    // #skip-to-main is visually hidden in the theme stylesheet.
    case "skip-to-main":
      isHidden = true
    // The DOM root fills the window (html/body/#app are height:100%).
    case "app-container-wrapper":
      grow = true; fullWidth = true; fullHeight = true
    case "app-container":
      isRow = true; fullWidth = true; fullHeight = true
    // #app-single-container has no layout rules in the theme — an empty
    // flex sibling must not claim any of the window's width.
    case "app-single-container":
      break
    case "left-container":
      grow = true; fullHeight = true
    case "head":
      isRow = true; fullWidth = true
    case "main-container":
      grow = true; fullHeight = true
    case "main-content-container":
      grow = true; fullHeight = true; isScrollable = true
      padding = EdgeInsets(top: 32, leading: 32, bottom: 32, trailing: 16)
    case "left-sidebar":
      fixedWidth = 246; fullHeight = true
    // The autocomplete list scrolls when its env cap (from the enclosing
    // popover's --available-height) kicks in; hide-scrollbar in the web.
    case "ui__ac-inner":
      isScrollable = true; hideScrollIndicators = true
    default:
      break
    }
  }

  private mutating func apply(_ cls: String) {
    // Variant prefixes ("hover:", "md:", "group-hover:") drop — their states
    // are handled natively or don't apply. "dark:" rules apply when the app
    // is in dark appearance. Arbitrary values like "bg-[color:var(--x)]"
    // contain ":" inside brackets and are NOT variants.
    var cls = cls
    // tailwind "!" important marker — strip it, the weight is irrelevant
    // natively
    if cls.hasPrefix("!") { cls = String(cls.dropFirst()) }
    if cls.hasPrefix("opacity-"), let n = Double(cls.dropFirst(8)) {
      alpha = n / 100
      return
    }
    if let colon = cls.firstIndex(of: ":"),
       !cls[..<colon].contains("[") {
      let prefix = String(cls[..<colon])
      if prefix == "dark" {
        guard LogseqColors.isDark else { return }
        cls = String(cls[cls.index(after: colon)...])
      } else {
        return
      }
    }
    switch cls {
    case "font-bold", "font-semibold": isBold = true
    case "italic": isItalic = true
    case "underline": isUnderline = true
    case "font-mono", "monospace": isMono = true
    // ---- visibility ----
    case "hidden", "invisible", "sr-only", "!hidden",
         "display-none", "d-none", "collapse", "scale-0":
      isHidden = true
    case "opacity-0": alpha = 0
    // ---- layout ----
    case "flex", "flex-row", "inline-flex", "flex-nowrap": isRow = true
    case "flex-col", "flex-col-reverse": isRow = false
    case "w-full": fullWidth = true
    case "h-full": fullHeight = true
    case "grow", "flex-1", "flex-grow", "flex-auto":
      grow = true; fullWidth = true
    case "overflow-y-auto", "overflow-auto", "overflow-scroll",
         "overflow-y-scroll":
      isScrollable = true
    case "items-center", "justify-center": centerContent = true
    case "justify-between": spaceBetween = true
    case "truncate", "whitespace-nowrap": lineLimitOne = true
    // ---- Logseq theme classes (compiled-CSS selectors in resources/css)
    case "closed": isHidden = true
    // lui-core.css: .block-head-wrap { display:flex; flex:1; width:100%;
    // justify-content: space-between; align-items: center }
    case "block-head-wrap":
      isRow = true; grow = true; fullWidth = true
    case "is-open": hasIsOpen = true
    case "cp__sidebar-left-layout":
      wantsOpen = true; fixedWidth = 246; fullHeight = true
    // Overlay layer (cmdk, popups, dialogs, toasts) and other
    // `position:fixed` elements: children render but the element itself
    // must not consume layout space.
    case "cp__overlays":
      outOfFlow = true
    // Floating help button + its popup — CSS positions them
    // position:fixed bottom-right; port the same anchor.
    case "cp__sidebar-help-btn":
      outOfFlow = true; fillsOverlay = true
      fixedRight = 16; fixedBottom = 16
    case "cp__sidebar-help-menu-popup":
      outOfFlow = true; fillsOverlay = true
      fixedRight = 16; fixedBottom = 56
      fixedWidth = 220
      background = LogseqColors.gray(LogseqColors.isDark ? 3 : 1)
      cornerRadius = 8; hasShadow = true
      padding = EdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8)
    case "it":
      isRow = true; fullWidth = true; stackSpacing = 8
      padding = EdgeInsets(top: 6, leading: 8, bottom: 6, trailing: 8)
      cornerRadius = 4
    case "ls-hm-icon": foreground = LogseqColors.gray(10)
    case "ls-hm-hr":
      margin = EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0)
    case "ls-hm-meta":
      if fontSize == nil { fontSize = 11 }
      foreground = LogseqColors.gray(9)
    // ---- shui dialog / cmdk modal shell (ui__dialog markup) ----
    // These escape to the window-level overlay layer; the modal panel is
    // centered horizontally and dropped ~100pt like the web cmdk.
    case "cp__cmdk-dismiss":
      outOfFlow = true; fillsOverlay = true; overlayZ = -2
      // Full-window click catcher — clear fill keeps it invisible while
      // the leaf-empty branch renders it as a tappable Rectangle.
      background = Color.clear
    case "ui__dialog-overlay":
      outOfFlow = true; fillsOverlay = true; overlayZ = -1
      background = Color.black.opacity(0.35)
    case "ui__dialog-content":
      outOfFlow = true; fillsOverlay = true; centerHorizontally = true
    case "ui__dialog-main-content":
      margin = EdgeInsets(top: 100, leading: 0, bottom: 0, trailing: 0)
    case "cp__cmdk__modal":
      fixedWidth = 620
      background = LogseqColors.gray(LogseqColors.isDark ? 2 : 1)
      cornerRadius = 8
      hasShadow = true
      padding = EdgeInsets(top: 6, leading: 0, bottom: 6, trailing: 0)
    case "cp__cmdk-input-row":
      padding = EdgeInsets(top: 10, leading: 12, bottom: 10, trailing: 12)
    case "cp__cmdk-search-input":
      if fontSize == nil { fontSize = 15 }
    case "cp__cmdk-group-title", "cp__cmdk-group-header":
      if fontSize == nil { fontSize = 11 }
      foreground = LogseqColors.gray(10)
      padding = EdgeInsets(top: 8, leading: 10, bottom: 4, trailing: 10)
    case "cp__cmdk-tip", "cp__cmdk-hints", "cp__cmdk-hint",
         "cp__cmdk-item-info", "cp__cmdk-empty", "cp__cmdk-search-only",
         "cp__cmdk-group-count":
      if fontSize == nil { fontSize = 12 }
      foreground = LogseqColors.gray(10)
    case "cp__cmdk-hints", "cp__cmdk-tip":
      padding = EdgeInsets(top: 8, leading: 10, bottom: 8, trailing: 10)
    case "cmdk-item-main":
      isRow = true; fullWidth = true
      padding = EdgeInsets(top: 6, leading: 8, bottom: 6, trailing: 8)
      cornerRadius = 6
    case "search-results":
      isScrollable = true; maxHeight = 460
      padding = EdgeInsets(top: 0, leading: 4, bottom: 0, trailing: 4)
    // ---- right sidebar (#right-sidebar.cp__right-sidebar.open/closed;
    // the .closed class already collapses it via isHidden) ----
    case "cp__right-sidebar":
      fixedWidth = LogseqRightSidebarLayout.shared.width; fullHeight = true
      background = LogseqColors.gray(LogseqColors.isDark ? 2 : 1)
    case "cp__right-sidebar-scrollable":
      isScrollable = true; grow = true; fullHeight = true
    case "cp__right-sidebar-inner":
      grow = true; fullWidth = true; fullHeight = true
      background = LogseqColors.gray(LogseqColors.isDark ? 2 : 1)
    case "cp__right-sidebar-topbar":
      isRow = true; fullWidth = true; fixedHeight = 48
      background = LogseqColors.gray(LogseqColors.isDark ? 2 : 1)
      padding = EdgeInsets(top: 0, leading: 4, bottom: 0, trailing: 4)
    case "sidebar-drop-indicator": fixedHeight = 8; fullWidth = true
    case "sidebar-item-list": grow = true; fullWidth = true
    case "sidebar-item":
      grow = true; fullWidth = true
      minHeight = 100
      background = LogseqColors.gray(LogseqColors.isDark ? 3 : 1)
      cornerRadius = cornerRadius ?? 8
      margin = EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0)
    case "sidebar-item-header": isRow = true; fullWidth = true
    case "item-actions": isRow = true
    case "resizer":
      outOfFlow = true; outOfFlowFillY = true; fixedWidth = 3; fullHeight = true
      background = LogseqColors.border
    case "breadcrumb": isRow = true
      if fontSize == nil { fontSize = 12 }
      foreground = LogseqColors.gray(10)
    case "page-tabs": isRow = true; fullWidth = true
    // ---- dropdown / context menus (position:fixed anchored) ----
    case "ui__dropdown-menu-content":
      minWidth = 160
      background = LogseqColors.gray(LogseqColors.isDark ? 3 : 1)
      cornerRadius = cornerRadius ?? 6
      hasShadow = true
      padding = EdgeInsets(top: 4, leading: 4, bottom: 4, trailing: 4)
    case "ui__dropdown-menu-item":
      isRow = true; fullWidth = true
      if fontSize == nil { fontSize = 13 }
      padding = EdgeInsets(top: 6, leading: 8, bottom: 6, trailing: 8)
      cornerRadius = 4
    case "menu-separator", "ui__dropdown-menu-separator":
      margin = EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0)
    case "ui__dropdown-menu-sub-trigger":
      isRow = true; fullWidth = true
      if fontSize == nil { fontSize = 13 }
      padding = EdgeInsets(top: 6, leading: 8, bottom: 6, trailing: 8)
      cornerRadius = 4
    case "ui__dropdown-menu-sub-content":
      minWidth = 160
      background = LogseqColors.gray(LogseqColors.isDark ? 3 : 1)
      cornerRadius = 6
      hasShadow = true
      padding = EdgeInsets(top: 4, leading: 4, bottom: 4, trailing: 4)
    // ---- popovers (ui__popover-content: shared shui card — border,
    // radius .375rem, popover bg, shadow, min-width 8rem, overflow-y
    // auto; position:fixed offsets come from the inline style) ----
    case "ui__popover-content":
      minWidth = 128
      isScrollable = true
      background = LogseqColors.gray(LogseqColors.isDark ? 3 : 1)
      cornerRadius = 6
      hasShadow = true
      padding = EdgeInsets(top: 4, leading: 4, bottom: 4, trailing: 4)
    // ---- cp__select pickers (command-palette-style input + results) ----
    case "cp__select", "cp__select-main", "property-select":
      minWidth = 260; grow = true
    case "input-wrap":
      isRow = true; fullWidth = true
    case "cp__select-input":
      grow = true; fullWidth = true
      if fontSize == nil { fontSize = 15 }
      foreground = LogseqColors.secondaryText
      padding = EdgeInsets(top: 8, leading: 10, bottom: 8, trailing: 10)
    case "cp__select-results", "item-results-wrap", "choices-list",
         "ui__ac", "ui__ac-inner":
      isScrollable = true; maxHeight = 380; fullWidth = true
    case "select-item-row", "menu-link", "menu-link-wrap":
      isRow = true; fullWidth = true; spaceBetween = true
      padding = EdgeInsets(top: 4, leading: 8, bottom: 4, trailing: 8)
      cornerRadius = 4
    case "select-item-left", "menu-item-icon-row":
      isRow = true; stackSpacing = 4
    case "menu-item-label": grow = true
    case "ui__ac-group-name", "ls-menu-h3":
      if fontSize == nil { fontSize = 11 }
      foreground = LogseqColors.gray(9)
      padding = EdgeInsets(top: 6, leading: 8, bottom: 2, trailing: 8)
    // ---- property areas (page + block) ----
    // lui-core.css: .block-properties/.page-properties get a gray-03
    // background block under the page title / block content.
    case "ls-properties-area", "ls-bidirectional-properties",
         "ls-bidirectional-group", "positioned-properties",
         "properties-panel":
      fullWidth = true
    case "ls-properties-area":
      background = LogseqColors.tertiaryBackground
      cornerRadius = 4
      padding = EdgeInsets(top: 4, leading: 8, bottom: 4, trailing: 8)
      margin = EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0)
    // property panel row: [key column | value column] — the web uses a
    // grid; natively a fixed-width key cell + growing value cell.
    case "property-pair", "property-panel-row":
      isRow = true; fullWidth = true; stackSpacing = 4
      padding = EdgeInsets(top: 1, leading: 0, bottom: 1, trailing: 0)
    case "property-key-panel":
      isRow = true; fixedWidth = 160
    case "property-key", "property-key-inner":
      isRow = true; stackSpacing = 4
      if fontSize == nil { fontSize = 13 }
      foreground = LogseqColors.secondaryText
    case "property-k":
      isRow = true; grow = true
      if fontSize == nil { fontSize = 13 }
      foreground = LogseqColors.secondaryText
    case "property-value-container", "property-value-panel",
         "property-value", "property-value-inner",
         "property-value-panel-inner", "property-block-container":
      grow = true; fullWidth = true
    case "property-panel-edit-btn", "property-icon":
      foreground = LogseqColors.gray(9)
    case "property-panel-bullet", "bullet-container":
      isRow = true; centerContent = true; fixedWidth = 16
    // block-below pills: "key : value" chips in a wrapping row
    case "bottom-property-pill":
      isRow = true; stackSpacing = 4
      padding = EdgeInsets(top: 1, leading: 4, bottom: 1, trailing: 4)
    case "bottom-property-content": isRow = true; stackSpacing = 4
    case "ls-page-title-actions":
      isRow = true; stackSpacing = 4
      margin = EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0)
    case "bottom-property-action-icon": foreground = LogseqColors.gray(9)
    // ---- property dialog / add-property row ----
    case "ls-property-dialog": minWidth = 280; stackSpacing = 4
    case "ls-property-input", "ls-property-add", "ls-pa-row", "ls-pd-row",
         "ls-ep-row", "ls-property-key", "ls-property-date-picker",
         "ls-datetime", "ls-icon-color-wrap", "ls-block-right",
         "ls-prop-input-wrap":
      isRow = true; stackSpacing = 4; centerContent = false
    case "ls-property-input", "ls-property-add":
      grow = true
    case "ls-check-cell":
      fixedWidth = 16; fixedHeight = 16; centerContent = true
    case "ls-p1":
      padding = EdgeInsets(top: 4, leading: 4, bottom: 4, trailing: 4)
    case "ls-pt":
      padding = EdgeInsets(top: 4, leading: 0, bottom: 0, trailing: 0)
    case "ls-py":
      padding = EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0)
    case "ls-icon-dim": foreground = LogseqColors.gray(9)
    case "hidden-properties-toggle-key":
      isRow = true; stackSpacing = 4
      if fontSize == nil { fontSize = 13 }
      foreground = LogseqColors.gray(9)
    case "ls-new-property":
      padding = EdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0)
    case "ls-cm-headings-row", "ls-cm-colors-row":
      isRow = true; stackSpacing = 2
    case "ls-cm-heading-btn":
      fixedWidth = 28; fixedHeight = 28
    case "ls-cm-swatch":
      fixedWidth = 24; fixedHeight = 24
    case "heading-bg":
      fixedWidth = 20; fixedHeight = 20; cornerRadius = 10
      fontSize = fontSize ?? 11
    case "shui-shortcut-combo", "shui-shortcut-separate":
      isRow = true; stackSpacing = 2
      fontSize = fontSize ?? 10
      foreground = LogseqColors.secondaryText
    case "ls-cm-sc": isRow = true
    case "ls-menu-chevron": foreground = LogseqColors.secondaryText
    case "ls-context-menu-content": fixedWidth = 280
    case "ls-dots-menu": fixedWidth = 256
    // ---- autocomplete popup (#ui__ac inside .ui__popover-content) ----
    case "ui__popover-content":
      // lui-overlay.css .ui__popover-content — popover bg, border, shadow.
      minWidth = 128
      background = LogseqColors.gray(LogseqColors.isDark ? 2 : 1)
      cornerRadius = cornerRadius ?? 6
      hasBorder = true
      hasShadow = true
      clipContent = true
      if fontSize == nil { fontSize = 16 }
    case "menu-link":
      isRow = true; fullWidth = true; spaceBetween = true
      if fontSize == nil { fontSize = 14 }
      foreground = LogseqColors.primaryText.opacity(0.75)
      padding = EdgeInsets(top: 6, leading: 8, bottom: 6, trailing: 8)
      cornerRadius = cornerRadius ?? 4
    // #ui__ac-inner .menu-link.chosen + cp__select-main hover highlight
    case "chosen": background = LogseqColors.gray(4)
    case "menu-link-wrap": fullWidth = true
    case "ui__ac-group-name":
      if fontSize == nil { fontSize = 12 }
      fontWeight = .medium
      foreground = LogseqColors.primaryText.opacity(0.2)
      padding = EdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8)
    case "ls-ac-empty":
      if fontSize == nil { fontSize = 14 }
      foreground = LogseqColors.gray(10)
      padding = EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16)
    case "ls-ac-node-icon":
      fixedHeight = 20
      margin = EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 4)
      alpha = 0.5
    case "ls-ac-bc":
      if fontSize == nil { fontSize = 12 }
      alpha = 0.7
      margin = EdgeInsets(top: 0, leading: 3, bottom: 4, trailing: 0)
    case "ls-ac-ic": isRow = true; stackSpacing = 4
    case "ls-tag-search-hint":
      isRow = true; stackSpacing = 8
      if fontSize == nil { fontSize = 14 }
      alpha = 0.5
      padding = EdgeInsets(top: 0, leading: 4, bottom: 0, trailing: 4)
    case "hide-scrollbar": hideScrollIndicators = true
    case "cp__right-sidebar-settings":
      isRow = true; stackSpacing = 4
    // ---- views / query results (lui-overlay.css view-head + filters rules)
    // .ls-view-head: flex flex-1 items-center justify-between gap-1
    // (cljs view-head div carries the utilities; the stylesheet rule set
    //  covers only the helpers)
    case "ls-view-head":
      isRow = true; centerContent = true; spaceBetween = true
      grow = true; fullWidth = true
      stackSpacing = stackSpacing ?? 4
    case "ls-view-head-left":
      isRow = true; centerContent = true
      stackSpacing = stackSpacing ?? 8
    case "views":
      isRow = true; centerContent = true
      stackSpacing = stackSpacing ?? 4
    case "view-actions":
      isRow = true; centerContent = true
      stackSpacing = stackSpacing ?? 4
    case "view-action-search": isRow = true; centerContent = true
    case "ls-icon-color-wrap", "ls-drag-row":
      isRow = true; centerContent = true
    case "ls-icon-btn":
      isRow = true; centerContent = true
      foreground = LogseqColors.secondaryText
    case "ls-count":
      fontSize = fontSize ?? 12
      foreground = LogseqColors.secondaryText
    case "ls-add-view":
      padding = padding ?? EdgeInsets(top: 0, leading: 4, bottom: 0, trailing: 4)
      foreground = LogseqColors.secondaryText
    case "ls-view-tab":
      fontSize = fontSize ?? 14
      fixedHeight = 24
    case "ls-dim": alpha = 0.75
    case "ls-lit": alpha = 1
    case "ls-query-count":
      fontSize = fontSize ?? 14
      alpha = 0.5
    case "ls-view-order-setting":
      isRow = true; centerContent = true; spaceBetween = true
      stackSpacing = stackSpacing ?? 8
      padding = padding ?? EdgeInsets(top: 0, leading: 8, bottom: 0, trailing: 8)
    case "ls-xs", "ls-op-label":
      fontSize = fontSize ?? 12
    case "ls-vf-col":
      stackSpacing = stackSpacing ?? 4
      fontSize = fontSize ?? 14
    case "ls-op-btn":
      isRow = true
      fontSize = fontSize ?? 14
      padding = padding ?? EdgeInsets(top: 4, leading: 8, bottom: 4, trailing: 8)
    case "ls-search-input":
      fixedHeight = 28
      fontSize = fontSize ?? 14
    case "ls-vf-chip":
      isRow = true; centerContent = true
      cornerRadius = cornerRadius ?? 4
    case "ls-vf-chips":
      isRow = true; centerContent = true
      stackSpacing = stackSpacing ?? 8
    case "filters-row":
      isRow = true; centerContent = true; spaceBetween = true
      fullWidth = true
      stackSpacing = stackSpacing ?? 16
      padding = padding ?? EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0)
    case "ls-vf-logic":
      alpha = 0.75
      fixedHeight = 24
      fontSize = fontSize ?? 14
      padding = padding ?? EdgeInsets(top: 0, leading: 8, bottom: 0, trailing: 8)
    case "ls-table-header":
      isRow = true; fullWidth = true
    // ui.cljs foldable: the header wraps caret + title and fills the
    // .foldable-title row so a flex-1 title (view head) stretches
    case "ls-foldable-header":
      grow = true; fullWidth = true
    case "cp__sidebar-main-layout": isRow = true; grow = true
    case "cp__sidebar-main-content":
      grow = true; maxWidth = 960; centerHorizontally = true
    case "cp__header": isRow = true; fullWidth = true
    // lui-core.css: sidebar bg is --lx-gray-02 with a 1px trailing
    // separator; a.item rows are text-sm rounded-md and fill gray-04
    // when .active (also on hover, which we can't express).
    case "left-sidebar-inner":
      fullHeight = true
      sidebarMaterial = true
    // .sidebar-navigations rows are mt-1 items (journals/flashcards/…)
    case "sidebar-navigations": stackSpacing = 4
    // lui-core.css: a.item { display:flex; align-items:center; height:2rem }
    // with .ui__icon fixed at 16px, margin-right .5rem, opacity .7.
    case "item":
      isRow = true
      if fontSize == nil { fontSize = 13 }
      cornerRadius = cornerRadius ?? 6
      fixedHeight = 32
      padding = padding ?? EdgeInsets(top: 0, leading: 6, bottom: 0, trailing: 2)
      hoverBackground = LogseqColors.gray(4)
      inItem = true
    case "ui__icon":
      fixedWidth = 16
      alpha = 0.7
      margin = EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 8)
    case "page-icon": fixedWidth = 16
    case "page-title": grow = true
    // .hd — sticky section header rows (Navigations/Favorites/Recent):
    // flex justify-between h-8, wrap-th is 14px medium at 50% opacity
    case "hd":
      isRow = true; spaceBetween = true; fixedHeight = 32
      padding = padding ?? EdgeInsets(top: 0, leading: 8, bottom: 0, trailing: 4)
    case "wrap-th":
      if fontSize == nil { fontSize = 14 }
      alpha = 0.5
    // a.link-item flows icon+title inline with the page-actions button
    // position:absolute right-0 top-0 — class-position props map to the
    // overlay anchor like the inline `position` attr does.
    case "link-item":
      isRow = true
      if fontSize == nil { fontSize = 13 }
      cornerRadius = cornerRadius ?? 6
      hoverBackground = LogseqColors.gray(4)
      padding = padding ?? EdgeInsets(top: 4, leading: 6, bottom: 4, trailing: 6)
    case "absolute": outOfFlow = true
    case "right-0": fixedRight = 0
    case "top-0": fixedY = 0
    case "left-0": fixedX = 0
    case "bottom-0": fixedBottom = 0
    case "keyboard-shortcut", "kbd", "shui-shortcut-key":
      if fontSize == nil { fontSize = 10 }
      isMono = true
      foreground = LogseqColors.secondaryText
    case "active":
      if inItem {
        background = LogseqColors.gray(4)
        cornerRadius = cornerRadius ?? 6
      }
    case "block-row", "block-main-container", "block-control-wrap":
      isRow = true
    // lui-core.css: .block-children-container { margin-left:29px; padding-top:
    // .125rem; margin-bottom:-.125rem } — child-block indentation
    case "block-children-container":
      margin = EdgeInsets(top: 2, leading: 29,
                          bottom: margin?.bottom ?? 0,
                          trailing: margin?.trailing ?? 0)
    // the indent-guide strip is a 4px absolute element — collapse it
    case "block-children-left-border": isHidden = true
    case "block-main-content", "block-content", "block-content-inner",
         "block-content-or-editor-inner", "page-blocks-inner",
         "ls-page-blocks", "cp__page-inner-wrap", "page", "page-inner":
      grow = true
    case "ls-page-title", "title":
      if fontSize == nil { fontSize = 18 }; isBold = true
    // fenced code block — lui-core.css: wrap is width:100%, the
    // duplicated lang label is display:none (lang shows in the
    // actions bar instead)
    case "ls-code-editor-wrap": fullWidth = true
    case "extensions__code-lang": isHidden = true
    // lui-core.css: .block-head-wrap { display:flex; flex:1; width:100% }
    // — takes the row's leftover inside justify-between content-inner
    case "block-head-wrap": isRow = true; grow = true; fullWidth = true
    case let c where c.hasPrefix("w-"):
      let v = String(c.dropFirst(2))
      if v == "screen" || v == "full" { fullWidth = true }
      else if let d = dimensionValue(v) { fixedWidth = d }
    case let c where c.hasPrefix("h-"):
      let v = String(c.dropFirst(2))
      if v == "screen" || v == "full" { fullHeight = true }
      else if let d = dimensionValue(v) { fixedHeight = d }
    case let c where c.hasPrefix("min-w-"):
      if let v = dimensionValue(String(c.dropFirst(6))) { minWidth = v }
    case let c where c.hasPrefix("min-h-"):
      if let v = dimensionValue(String(c.dropFirst(6))) { minHeight = v }
    case let c where c.hasPrefix("max-w-"):
      if let v = dimensionValue(String(c.dropFirst(6))) { maxWidth = v }
    case let c where c.hasPrefix("max-h-"):
      if let v = dimensionValue(String(c.dropFirst(6))) { maxHeight = v }
    case let c where c.hasPrefix("gap-"):
      stackSpacing = spacingValue(c.dropFirst(4))
    case let c where c.hasPrefix("space-y-"):
      stackSpacing = spacingValue(c.dropFirst(8))
    case let c where c.hasPrefix("space-x-"):
      stackSpacing = spacingValue(c.dropFirst(8))
    case let c where c.hasPrefix("leading-"):
      lineSpacing = spacingValue(c.dropFirst(8))
    // ---- margins ----
    case let c where c.hasPrefix("m") && c.dropFirst().first?.isNumber == true:
      let v = spacingValue(c.dropFirst(1))
      margin = EdgeInsets(top: v, leading: v, bottom: v, trailing: v)
    case let c where c.hasPrefix("mx-"):
      let v = spacingValue(c.dropFirst(3))
      margin = EdgeInsets(top: margin?.top ?? 0, leading: v,
                          bottom: margin?.bottom ?? 0, trailing: v)
    case let c where c.hasPrefix("my-"):
      let v = spacingValue(c.dropFirst(3))
      margin = EdgeInsets(top: v, leading: margin?.leading ?? 0,
                          bottom: v, trailing: margin?.trailing ?? 0)
    case let c where c.hasPrefix("mt-"):
      let v = spacingValue(c.dropFirst(3))
      margin = EdgeInsets(top: v, leading: margin?.leading ?? 0,
                          bottom: margin?.bottom ?? 0, trailing: margin?.trailing ?? 0)
    case let c where c.hasPrefix("mb-"):
      let v = spacingValue(c.dropFirst(3))
      margin = EdgeInsets(top: margin?.top ?? 0, leading: margin?.leading ?? 0,
                          bottom: v, trailing: margin?.trailing ?? 0)
    case let c where c.hasPrefix("ml-"):
      let v = spacingValue(c.dropFirst(3))
      margin = EdgeInsets(top: margin?.top ?? 0, leading: v,
                          bottom: margin?.bottom ?? 0, trailing: margin?.trailing ?? 0)
    case let c where c.hasPrefix("mr-"):
      let v = spacingValue(c.dropFirst(3))
      margin = EdgeInsets(top: margin?.top ?? 0, leading: margin?.leading ?? 0,
                          bottom: margin?.bottom ?? 0, trailing: v)
    // ---- padding ----
    case let c where c.hasPrefix("text-"):
      applyTextScale(c)
    case let c where c.hasPrefix("font-"):
      applyFontWeight(c)
    case let c where c.hasPrefix("p") && c.dropFirst().first?.isNumber == true:
      let v = spacingValue(cls.dropFirst(1))
      padding = EdgeInsets(top: v, leading: v, bottom: v, trailing: v)
    case let c where c.hasPrefix("px-"):
      let v = spacingValue(cls.dropFirst(3))
      padding = EdgeInsets(top: padding?.top ?? 0, leading: v,
                           bottom: padding?.bottom ?? 0, trailing: v)
    case let c where c.hasPrefix("py-"):
      let v = spacingValue(cls.dropFirst(3))
      padding = EdgeInsets(top: v, leading: padding?.leading ?? 0,
                           bottom: v, trailing: padding?.trailing ?? 0)
    case let c where c.hasPrefix("pt-"):
      let v = spacingValue(cls.dropFirst(3))
      padding = EdgeInsets(top: v, leading: padding?.leading ?? 0,
                           bottom: padding?.bottom ?? 0, trailing: padding?.trailing ?? 0)
    case let c where c.hasPrefix("pb-"):
      let v = spacingValue(cls.dropFirst(3))
      padding = EdgeInsets(top: padding?.top ?? 0, leading: padding?.leading ?? 0,
                           bottom: v, trailing: padding?.trailing ?? 0)
    case let c where c.hasPrefix("pr-"):
      let v = spacingValue(cls.dropFirst(3))
      padding = EdgeInsets(top: padding?.top ?? 0, leading: padding?.leading ?? 0,
                           bottom: padding?.bottom ?? 0, trailing: v)
    case let c where c.hasPrefix("pl-"):
      let v = spacingValue(cls.dropFirst(3))
      padding = EdgeInsets(top: padding?.top ?? 0, leading: v,
                           bottom: padding?.bottom ?? 0, trailing: padding?.trailing ?? 0)
    case let c where c.hasPrefix("shadow"):
      hasShadow = true
    case let c where c.hasPrefix("rounded"):
      cornerRadius = cls == "rounded" ? 4
        : cls == "rounded-md" ? 6
        : cls == "rounded-lg" ? 8
        : cls == "rounded-full" ? 999 : spacingValue(cls.dropFirst(8))
    default:
      applyColor(cls)
    }
  }

  /// tailwind size scale -> points (spacing scale, plus the common named
  /// widths). Arbitrary values like `w-[240px]`/`w-64` both land here.
  private func dimensionValue(_ s: String) -> CGFloat? {
    switch s {
    case "full": return nil // handled via fullWidth/fullHeight flags
    case "screen": return 400 // viewport sentinel; app window clips anyway
    case "auto": return nil
    default:
      if let bracket = s.firstIndex(of: "["),
         let end = s.firstIndex(of: "]") {
        let inner = String(s[s.index(after: bracket)..<end])
        return numericSize(inner)
      }
      return numericSize(s)
    }
  }

  private func numericSize(_ s: String) -> CGFloat? {
    if s.hasSuffix("px"), let n = Double(s.dropLast(2)) { return CGFloat(n) }
    if s.hasSuffix("rem"), let n = Double(s.dropLast(3)) { return CGFloat(n) * 16 }
    if s.hasSuffix("em"), let n = Double(s.dropLast(2)) { return CGFloat(n) * 16 }
    if s.hasSuffix("%") { return nil }
    if let n = Double(s) { return CGFloat(n) * Self.spacingUnit }
    return nil
  }

  private mutating func applyTextScale(_ cls: String) {
    let sizes: [String: CGFloat] = [
      "text-xs": 11, "text-sm": 13, "text-base": 14, "text-lg": 16,
      "text-xl": 18, "text-2xl": 22, "text-3xl": 26, "text-4xl": 30,
    ]
    if let size = sizes[cls] { fontSize = size }
    // text-<color> classes fall through to applyColor
    if sizes[cls] == nil { applyColor(cls) }
  }

  private mutating func applyFontWeight(_ cls: String) {
    switch cls {
    case "font-normal": fontWeight = .regular
    case "font-medium": fontWeight = .medium
    case "font-semibold": fontWeight = .semibold
    case "font-bold": fontWeight = .bold
    default: break
    }
  }

  private mutating func applyColor(_ cls: String) {
    let lower = cls.lowercased()
    // var(--ls-*) / var(--lx-*) references inside arbitrary-value classes like
    // "bg-[color:var(--ls-border-color)]" or "text-[color:var(--ls-primary-text-color)]"
    if let varName = lower.range(of: "var(--").map({ r in
      String(lower[r.upperBound...]).replacingOccurrences(of: ")", with: "")
    }), !varName.isEmpty {
      let color = resolveVar(varName)
      if lower.hasPrefix("bg-") || lower.contains("background") {
        background = color
      } else if lower.hasPrefix("text-") || lower.hasPrefix("border-") {
        foreground = color
      }
      return
    }
    // plain color names
    if lower.hasPrefix("bg-") {
      background = namedColor(String(lower.dropFirst(3)))
    } else if lower.hasPrefix("text-") {
      foreground = namedColor(String(lower.dropFirst(5)))
    } else if lower.hasPrefix("border-") {
      foreground = namedColor(String(lower.dropFirst(7)))
    }
  }

  private func namedColor(_ name: String) -> Color? {
    switch name {
    case "white": return .white
    case "black": return .black
    case "red-500", "red-600", "red": return .red
    case "green-500", "green-600", "green": return .green
    case "blue-500", "blue-600", "blue": return LogseqColors.link
    case "orange-500", "orange": return .orange
    case "yellow-500", "yellow": return .yellow
    case "purple-500", "purple": return .purple
    case "pink-500", "pink": return .pink
    case "gray-100": return LogseqColors.gray(3)
    case "gray-200": return LogseqColors.gray(4)
    case "gray-300": return LogseqColors.gray(6)
    case "gray-400": return LogseqColors.gray(7)
    case "gray-500": return LogseqColors.gray(9)
    case "gray-600": return LogseqColors.gray(10)
    case "gray-700": return LogseqColors.gray(11)
    case "gray-800", "gray-900": return LogseqColors.gray(12)
    case "transparent": return .clear
    default: return nil
    }
  }

  /// CSS color string -> Color: `var(--x)` custom properties,
  /// `#rgb`/`#rrggbb`, and `rgb()/rgba()`.
  private func parseCSSColor(_ value: String) -> Color? {
    var v = value
    if v.hasPrefix("var(--"), let close = v.firstIndex(of: ")") {
      let name = String(v[v.index(v.startIndex, offsetBy: 5)..<close])
      // --color-<hue>-<step> tailwind-style palette vars
      let parts = name.split(separator: "-")
      if parts.first == "color", let hue = parts.dropFirst().first {
        return LogseqColors.namedHue(String(hue))
      }
      return resolveVar(name)
    }
    if v.hasPrefix("#") {
      v.removeFirst()
      guard let hex = UInt32(v, radix: 16) else { return nil }
      let r, g, b, a: Double
      switch v.count {
      case 3:
        r = Double((hex >> 8) & 0xF) / 15
        g = Double((hex >> 4) & 0xF) / 15
        b = Double(hex & 0xF) / 15
        a = 1
      default:
        r = Double((hex >> 16) & 0xFF) / 255
        g = Double((hex >> 8) & 0xFF) / 255
        b = Double(hex & 0xFF) / 255
        a = v.count == 8 ? Double((hex >> 24) & 0xFF) / 255 : 1
      }
      return Color(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
    if v.hasPrefix("rgb") {
      let nums =
        v.drop { $0 != "(" }.dropFirst().dropLast()
        .split(separator: ",").compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
      if nums.count >= 3 {
        return Color(
          .sRGB, red: nums[0] / 255, green: nums[1] / 255, blue: nums[2] / 255,
          opacity: nums.count > 3 ? nums[3] : 1)
      }
    }
    return nil
  }

  /// --ls-* / --lx-* custom property lookup -> the radix scale the web theme
  /// aliases them to (ui.css declares e.g. --ls-primary-text-color:
  /// var(--lx-gray-12)).
  private func resolveVar(_ name: String) -> Color? {
    switch name {
    case "ls-primary-text-color", "lx-gray-12": return LogseqColors.gray(12)
    case "ls-secondary-text-color", "lx-gray-11": return LogseqColors.gray(11)
    case "ls-primary-background-color", "lx-gray-01": return LogseqColors.gray(1)
    case "ls-secondary-background-color", "lx-gray-02": return LogseqColors.gray(2)
    case "ls-tertiary-background-color", "lx-gray-03": return LogseqColors.gray(3)
    case "ls-quaternary-background-color", "lx-gray-04": return LogseqColors.gray(4)
    case "ls-quinary-background-color", "lx-gray-05": return LogseqColors.gray(5)
    case "ls-senary-background-color", "lx-gray-06": return LogseqColors.gray(6)
    case "ls-border-color", "ls-guideline-color": return LogseqColors.gray(5)
    case "ls-link-text-color": return LogseqColors.blue(11)
    case "ls-link-text-hover-color": return LogseqColors.blue(12)
    case "ls-block-ref-link-text-color": return LogseqColors.blue(11)
    case "ls-page-inline-code-bg-color": return LogseqColors.gray(6)
    case "ls-page-inline-code-color": return LogseqColors.gray(11)
    case "ls-block-highlight-color": return LogseqColors.blue(2)
    case "ls-menu-hover-color", "ls-a-chosen-bg": return LogseqColors.gray(3)
    default:
      // --lx-<hue>-NN arbitrary radix refs
      if name.hasPrefix("lx-"), let last = name.split(separator: "-").last,
         let step = Int(last) {
        if name.contains("blue") || name.contains("accent") { return LogseqColors.blue(step) }
        return LogseqColors.gray(step)
      }
      return nil
    }
  }

  private func spacingValue(_ s: Substring) -> CGFloat {
    if s == "px" { return 1 }
    if let n = Double(s) { return CGFloat(n) * Self.spacingUnit }
    return 0
  }
}

extension View {
  /// Applies `transform` only when `condition` holds, keeping one code path
  /// readable inside long modifier chains.
  @ViewBuilder func `if`<Content: View>(
    _ condition: Bool,
    transform: (Self) -> Content
  ) -> some View {
    if condition { transform(self) } else { self }
  }
}
