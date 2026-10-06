import CoreText
import Foundation
import LUIAppleBackend
import SwiftUI

/// Renders `ti ti-<name>` / `tie tie-<name>` font-icon elements natively via
/// the real icon fonts bundled in resources/css/fonts (`tabler-icons.ttf`,
/// `tabler-icons-extension.ttf` converted from the shipped woff2). Name ->
/// codepoint tables come from the css the web uses (tabler-icons.min.css /
/// tabler-extension.css), so glyphs match web/electron exactly. SVG `path`
/// children from `tabler-children.json` remain as a fallback for names the
/// fonts don't cover.
enum LogseqTablerIcons {
  static let codepoints = loadCodepoints("tabler-codepoints")
  static let extCodepoints = loadCodepoints("tabler-ext-codepoints")

  /// Registers the bundled icon fonts once; the family names match the CSS
  /// @font-face declarations ("tabler-icons", "tabler-icons-extension").
  static let fontsRegistered: Bool = {
    for name in ["tabler-icons", "tabler-icons-extension"] {
      guard
        let url = Bundle.module.url(forResource: name, withExtension: "ttf")
      else { continue }
      CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
    }
    return true
  }()

  private static func loadCodepoints(_ resource: String)
    -> [String: UInt32]
  {
    guard
      let url = Bundle.module.url(forResource: resource, withExtension: "json"),
      let data = try? Data(contentsOf: url),
      let raw = try? JSONSerialization.jsonObject(with: data)
        as? [String: String]
    else { return [:] }
    var out: [String: UInt32] = [:]
    out.reserveCapacity(raw.count)
    for (name, hex) in raw {
      out[name] = UInt32(hex, radix: 16)
    }
    return out
  }

  private static let table: [String: [[String: String]]] = {
    guard
      let url = Bundle.module.url(
        forResource: "tabler-children", withExtension: "json"),
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

/// `app:` icon sources handed to `LUIAppleBackend` at startup: every tabler
/// codepoint as a bundled-font glyph (matching what the web renders through
/// the tabler fonts), plus SF symbols for the handful of `app:` names with
/// no tabler counterpart (OCaml `custom_icons`: inline SVGs).
enum LogseqAppIcons {
  static let sources: [String: LUIAppleIconSource] = {
    _ = LogseqTablerIcons.fontsRegistered
    var sources: [String: LUIAppleIconSource] = [
      "logseq-logo": .systemName("circle.grid.3x3.fill"),
      "rotating-arrow": .systemName("arrow.clockwise"),
      "youtube-timestamp-icon": .systemName("clock"),
      "tabler-letter-p": .systemName("textformat"),
      "tabler-plus": .systemName("plus"),
    ]
    for (name, scalar) in LogseqTablerIcons.codepoints {
      sources[name] = .fontGlyph(family: "tabler-icons", scalar: scalar)
    }
    for (name, scalar) in LogseqTablerIcons.extCodepoints {
      sources[name] = .fontGlyph(
        family: "tabler-icons-extension", scalar: scalar)
    }
    return sources
  }()
}

struct LogseqTablerIcon: View {
  let name: String
  /// True for `tie-*` (logseq's tabler extension font); false for `ti-*` /
  /// `ls-icon-*` names.
  var ext = false
  var size: CGFloat = 16
  var color: Color = .primary

  var body: some View {
    let _ = LogseqTablerIcons.fontsRegistered
    let table =
      ext ? LogseqTablerIcons.extCodepoints : LogseqTablerIcons.codepoints
    if let cp = table[name], let scalar = Unicode.Scalar(cp) {
      Text(String(Character(scalar)))
        .font(.custom(ext ? "tabler-icons-extension" : "tabler-icons",
          size: size))
        .foregroundStyle(color)
    } else if let children = LogseqTablerIcons.paths(for: name),
      !children.isEmpty
    {
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
