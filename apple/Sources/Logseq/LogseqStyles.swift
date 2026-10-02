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

/// Parses the space-separated `style-class` prop (tailwind-ish utility class
/// names Logseq emits) into a small set of native style hints. Unknown classes
/// are ignored; the web CSS class names are the contract, not the mechanism.
@MainActor struct LogseqStyle {
  var fontSize: CGFloat?
  var fontWeight: Font.Weight?
  var fontDesign: Font.Design?
  var foreground: Color?
  var background: Color?
  var padding: EdgeInsets?
  var cornerRadius: CGFloat?
  var isMono = false
  var isItalic = false
  var isUnderline = false
  var isBold = false
  var maxWidth: CGFloat?

  private static let spacingUnit: CGFloat = 4 // tailwind spacing scale unit

  static func parse(_ classes: String) -> LogseqStyle {
    var style = LogseqStyle()
    for cls in classes.split(separator: " ").map(String.init) {
      style.apply(cls)
    }
    return style
  }

  private mutating func apply(_ cls: String) {
    // strip variant prefixes ("hover:", "dark:", "md:") — hover/dark states
    // are handled natively; keep the base rule only.
    if cls.contains(":") {
      return
    }
    switch cls {
    case "font-bold", "font-semibold": isBold = true
    case "italic": isItalic = true
    case "underline": isUnderline = true
    case "font-mono", "monospace": isMono = true
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
    case let c where c.hasPrefix("pl-"):
      let v = spacingValue(cls.dropFirst(3))
      padding = EdgeInsets(top: padding?.top ?? 0, leading: v,
                           bottom: padding?.bottom ?? 0, trailing: padding?.trailing ?? 0)
    case let c where c.hasPrefix("rounded"):
      cornerRadius = cls == "rounded" ? 4
        : cls == "rounded-md" ? 6
        : cls == "rounded-lg" ? 8
        : cls == "rounded-full" ? 999 : spacingValue(cls.dropFirst(8))
    default:
      applyColor(cls)
    }
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
