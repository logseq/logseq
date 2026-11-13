import AppKit
import SwiftUI

@MainActor
extension PlatformServices {
    var preferredScheme: ColorScheme? {
        switch (uiState["data"] as? [String: String])?["theme"] {
        case "dark": .dark
        case "light": .light
        default: nil
        }
    }

    func themeVariables(_ systemScheme: ColorScheme) -> [String: String] {
        snapshots[(preferredScheme ?? systemScheme) == .dark ? "dark" : "light"] ?? [:]
    }

    func themeColors(_ systemScheme: ColorScheme) -> [String: Color] {
        let mode = (preferredScheme ?? systemScheme) == .dark ? "dark" : "light"
        guard let vars = snapshots[mode] else { return [:] }
        var colors: [String: Color] = [:]
        for (key, value) in vars {
            if let color = cssColor(value, vars: vars) {
                colors[key] = color
                colors["var(\(key))"] = color
            }
        }
        for name in "background foreground card card-foreground primary primary-foreground secondary secondary-foreground accent accent-foreground muted muted-foreground destructive destructive-foreground input ring border success success-foreground warning warning-foreground error error-foreground".split(separator: " ").map(String.init) {
            if let value = vars["--lui-" + name], let color = cssColor(value, vars: vars) { colors[name] = color }
            else if let value = vars["--" + name], let color = cssColor("hsl(\(value))", vars: vars) { colors[name] = color }
        }
        return colors
    }
}

// Theme snapshots contain computed custom-property values. Resolve references
// with cycle detection rather than feeding CSS expressions to SwiftUI colors.
func cssColor(_ source: String, vars: [String: String], visited: Set<String> = []) -> Color? {
    let value = source.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if value.hasPrefix("var("), value.hasSuffix(")") {
        let key = String(value.dropFirst(4).dropLast())
        guard !visited.contains(key), let next = vars[key] else { return nil }
        return cssColor(next, vars: vars, visited: visited.union([key]))
    }
    if value == "transparent" { return .clear }
    let named: [String: NSColor] = ["black": .black, "white": .white, "red": .red, "green": .green, "blue": .blue, "gray": .gray]
    if let color = named[value] { return Color(nsColor: color) }
    if value.hasPrefix("#") {
        var hex = String(value.dropFirst())
        if hex.count == 3 || hex.count == 4 { hex = hex.map { "\($0)\($0)" }.joined() }
        guard hex.count == 6 || hex.count == 8, let bits = UInt64(hex, radix: 16) else { return nil }
        let rgba = hex.count == 6 ? bits << 8 | 255 : bits
        return Color(.sRGB, red: Double((rgba >> 24) & 255) / 255, green: Double((rgba >> 16) & 255) / 255, blue: Double((rgba >> 8) & 255) / 255, opacity: Double(rgba & 255) / 255)
    }
    guard let open = value.firstIndex(of: "("), value.hasSuffix(")") else { return nil }
    let function = String(value[..<open])
    let parts = value[value.index(after: open)..<value.index(before: value.endIndex)].split(whereSeparator: { $0 == "," || $0 == "/" || $0.isWhitespace }).map(String.init)
    guard parts.count == 3 || parts.count == 4 else { return nil }
    func number(_ token: String, scale: Double) -> Double? {
        if token.hasSuffix("%") { return Double(token.dropLast()).map { $0 / 100 } }
        return Double(token).map { $0 / scale }
    }
    guard let a = number(parts[0], scale: function.hasPrefix("hsl") ? 360 : 255), let b = number(parts[1], scale: function.hasPrefix("hsl") ? 1 : 255), let c = number(parts[2], scale: function.hasPrefix("hsl") ? 1 : 255), let alpha = parts.count == 4 ? number(parts[3], scale: 1) : 1 else { return nil }
    if function == "rgb" || function == "rgba" { return Color(.sRGB, red: a, green: b, blue: c, opacity: alpha) }
    if function == "hsl" || function == "hsla" {
        let brightness = c + b * min(c, 1 - c)
        let hsvSaturation = brightness == 0 ? 0 : 2 * (1 - c / brightness)
        return Color(hue: a.truncatingRemainder(dividingBy: 1), saturation: hsvSaturation, brightness: brightness, opacity: alpha)
    }
    return nil
}
