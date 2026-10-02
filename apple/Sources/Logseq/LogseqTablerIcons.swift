import Foundation
import SwiftUI

/// Renders `ti ti-<name>` / `tie tie-<name>` font-icon elements natively. The
/// web paints them through the tabler icon font; here each name resolves to its
/// SVG `path` children from `tabler-children.json` (generated from
/// resources/js/icon-data.js — the same table the OCaml twin reads) and draws
/// them in the standard 24x24 viewBox.
enum LogseqTablerIcons {
  private static let table: [String: [[String: String]]] = {
    guard
      let url = Bundle.module.url(forResource: "tabler-children", withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let raw = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return [:] }
    var out: [String: [[String: String]]] = [:]
    out.reserveCapacity(raw.count)
    for (name, children) in raw {
      guard let list = children as? [Any] else { continue }
      var paths: [[String: String]] = []
      paths.reserveCapacity(list.count)
      for entry in list {
        guard
          let pair = entry as? [Any], pair.count == 2,
          let attrs = pair[1] as? [String: Any]
        else { continue }
        paths.append(attrs.mapValues { "\($0)" })
      }
      out[name] = paths
    }
    return out
  }()

  static func paths(for name: String) -> [[String: String]]? {
    table[name]
  }
}

struct LogseqTablerIcon: View {
  let name: String
  var size: CGFloat = 16
  var color: Color = .primary

  var body: some View {
    if let children = LogseqTablerIcons.paths(for: name), !children.isEmpty {
      Canvas { ctx, canvasSize in
        let scale = min(canvasSize.width, canvasSize.height) / 24
        for child in children {
          guard let d = child["d"] else { continue }
          var path = LogseqSVGPath(pathData: d).path(
            in: CGRect(origin: .zero, size: CGSize(width: 24, height: 24)))
          path = path.applying(
            CGAffineTransform(scaleX: scale, y: scale))
          if child["fill"] == "currentColor" {
            ctx.fill(path, with: .color(color))
          } else if let opacity = child["opacity"], let o = Double(opacity) {
            ctx.stroke(
              path, with: .color(color.opacity(o)),
              lineWidth: 2 * scale)
          } else {
            ctx.stroke(path, with: .color(color), lineWidth: 2 * scale)
          }
        }
      }
      .frame(width: size, height: size)
    } else {
      // Unknown icon name — reserve the glyph box so layout doesn't shift.
      Color.clear.frame(width: size, height: size)
    }
  }
}
