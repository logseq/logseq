import AppKit
import Foundation
import LUIAppleBackend
import SwiftUI

/// Minimal SVG renderer for the logseq-svg family (tabler icons + simple
/// glyphs). `logseq-svg` reads `viewBox`/`width`/`height` from attrs and paints
/// descendant logseq-path/circle/rect/line/polyline/polygon/ellipse nodes;
/// leaf tags map straight to SwiftUI Shapes from their attrs.
struct LogseqSVGView: View {
  let tag: String
  let attrs: [String: Any]
  let context: LUIAppleExtensionViewContext

  var body: some View {
    switch tag {
    case "svg": svgRoot
    case "g", "defs": group
    case "path": shape(LogseqSVGPath(pathData: attr("d")))
    case "circle": shape(circle)
    case "ellipse": shape(ellipse)
    case "rect": shape(rect)
    case "line": shape(line)
    case "polyline", "polygon": shape(polyline(closed: tag == "polygon"))
    case "use": EmptyView()
    case "tspan": Text(text)
    default: EmptyView()
    }
  }

  private var text: String {
    if case .string(let t) = context.property("text") { return t }
    return ""
  }

  private func attr(_ name: String) -> String {
    attrs[name] as? String ?? ""
  }

  private func num(_ name: String, _ fallback: Double = 0) -> CGFloat {
    if let v = attrs[name] as? String, let d = Double(v) { return CGFloat(d) }
    if let v = attrs[name] as? NSNumber { return CGFloat(v.doubleValue) }
    return CGFloat(fallback)
  }

  // MARK: svg root

  @ViewBuilder private var svgRoot: some View {
    let viewBox = parseViewBox(attr("viewBox"))
    let width = num("width", Double(viewBox?.width ?? 24))
    let height = num("height", Double(viewBox?.height ?? 24))
    ZStack {
      ForEach(context.childIDs, id: \.self) { child in
        context.content(for: child)
      }
    }
    .frame(
      width: width > 0 ? width : nil,
      height: height > 0 ? height : nil)
    .environment(\.logseqSVGViewBox, viewBox)
  }

  @ViewBuilder private var group: some View {
    ZStack {
      ForEach(context.childIDs, id: \.self) { child in
        context.content(for: child)
      }
    }
  }

  // MARK: shapes

  @ViewBuilder private func shape<S: Shape>(_ shape: S) -> some View {
    let strokeColor = parseColor(attr("stroke"), default: .primary)
    let fillColor = parseColor(attr("fill"), default: .clear)
    let strokeWidth = num("stroke-width", 1)
    shape
      .stroke(strokeColor, lineWidth: strokeWidth)
      .background(shape.fill(fillColor))
      .foregroundStyle(fillColor)
  }

  private var circle: some Shape {
    Circle().offset(x: num("cx"), y: num("cy")).scale(num("r") / 0.5)
  }

  private var ellipse: some Shape {
    Ellipse().scale(
      x: num("rx") / 0.5,
      y: num("ry") / 0.5)
      .offset(x: num("cx"), y: num("cy"))
  }

  private var rect: some Shape {
    RoundedRectangle(cornerRadius: num("rx"))
  }

  private var line: some Shape {
    var path = Path()
    path.move(to: CGPoint(x: num("x1"), y: num("y1")))
    path.addLine(to: CGPoint(x: num("x2"), y: num("y2")))
    return path
  }

  private func polyline(closed: Bool) -> some Shape {
    var path = Path()
    let points = attr("points")
      .split(whereSeparator: { $0 == " " || $0 == "," })
      .compactMap(Double.init)
    if points.count >= 2 {
      path.move(to: CGPoint(x: points[0], y: points[1]))
      var i = 2
      while i + 1 < points.count {
        path.addLine(to: CGPoint(x: points[i], y: points[i + 1]))
        i += 2
      }
      if closed { path.closeSubpath() }
    }
    return path
  }

  private func parseViewBox(_ s: String) -> CGRect? {
    let parts = s.split(separator: " ").compactMap { Double($0) }
    guard parts.count == 4 else { return nil }
    return CGRect(x: parts[0], y: parts[1], width: parts[2], height: parts[3])
  }

  private func parseColor(_ value: String, default fallback: Color) -> Color {
    switch value.lowercased() {
    case "none", "": return fallback
    case "currentcolor": return .primary
    case "white": return .white
    case "black": return .black
    default:
      if value.hasPrefix("#") {
        let hex = String(value.dropFirst())
        if let v = UInt32(hex, radix: 16) {
          return Color(
            .sRGB,
            red: Double((v >> 16) & 0xff) / 255,
            green: Double((v >> 8) & 0xff) / 255,
            blue: Double(v & 0xff) / 255)
        }
      }
      return fallback
    }
  }
}

private struct LogseqSVGViewBoxKey: EnvironmentKey {
  static let defaultValue: CGRect? = nil
}

extension EnvironmentValues {
  var logseqSVGViewBox: CGRect? {
    get { self[LogseqSVGViewBoxKey.self] }
    set { self[LogseqSVGViewBoxKey.self] = newValue }
  }
}

/// SVG `d` attribute parser (M L H V C S Q T A Z + lowercase relatives) onto
/// SwiftUI Path — covers the tabler icon grammar.
struct LogseqSVGPath: Shape {
  let pathData: String

  func path(in rect: CGRect) -> Path {
    var path = Path()
    var tokens = tokenize(pathData)
    var command = Character(" ")
    var current = CGPoint.zero
    var start = CGPoint.zero
    var i = 0

    func num() -> CGFloat? {
      guard i < tokens.count, case .number(let v) = tokens[i] else { return nil }
      i += 1
      return CGFloat(v)
    }
    func point() -> CGPoint? {
      guard let x = num(), let y = num() else { return nil }
      return CGPoint(x: x, y: y)
    }

    while i < tokens.count {
      if case .command(let c) = tokens[i] {
        command = c
        i += 1
      }
      let relative = command.isLowercase
      let upper = Character(command.uppercased())
      func abs(_ p: CGPoint) -> CGPoint {
        relative ? CGPoint(x: current.x + p.x, y: current.y + p.y) : p
      }
      switch upper {
      case "M":
        guard let p = point() else { return path }
        current = abs(p)
        start = current
        path.move(to: current)
        command = relative ? "l" : "L"
      case "L":
        guard let p = point() else { return path }
        current = abs(p)
        path.addLine(to: current)
      case "H":
        guard let x = num() else { return path }
        current = CGPoint(x: relative ? current.x + x : x, y: current.y)
        path.addLine(to: current)
      case "V":
        guard let y = num() else { return path }
        current = CGPoint(x: current.x, y: relative ? current.y + y : y)
        path.addLine(to: current)
      case "C":
        guard let c1 = point(), let c2 = point(), let p = point() else { return path }
        path.addCurve(to: abs(p), control1: abs(c1), control2: abs(c2))
        current = abs(p)
      case "S":
        guard let c2 = point(), let p = point() else { return path }
        path.addCurve(to: abs(p), control1: current, control2: abs(c2))
        current = abs(p)
      case "Q":
        guard let c = point(), let p = point() else { return path }
        path.addQuadCurve(to: abs(p), control: abs(c))
        current = abs(p)
      case "T":
        guard let p = point() else { return path }
        path.addQuadCurve(to: abs(p), control: current)
        current = abs(p)
      case "A":
        // arc: rx ry rot large sweep x y — approximate with a line
        guard let _ = num(), let _ = num(), let _ = num(),
          let _ = num(), let _ = num(), let p = point()
        else { return path }
        current = abs(p)
        path.addLine(to: current)
      case "Z":
        path.closeSubpath()
        current = start
      default:
        i += 1
      }
    }
    return path
  }

  private enum Token {
    case command(Character)
    case number(Double)
  }

  private func tokenize(_ s: String) -> [Token] {
    var result: [Token] = []
    var i = s.startIndex
    while i < s.endIndex {
      let c = s[i]
      if c.isASCII && c.isLetter {
        result.append(.command(c))
        i = s.index(after: i)
      } else if c.isNumber || c == "-" || c == "+" || c == "." {
        var j = i
        while j < s.endIndex {
          let d = s[j]
          if d.isNumber || d == "." || d == "-" || d == "+" || d == "e" || d == "E" {
            j = s.index(after: j)
          } else {
            break
          }
        }
        if let v = Double(s[i..<j]) {
          result.append(.number(v))
        }
        i = j
      } else {
        i = s.index(after: i)
      }
    }
    return result
  }
}
