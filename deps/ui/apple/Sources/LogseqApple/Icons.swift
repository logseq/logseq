import Foundation
import LUIAppleBackend

@MainActor
extension PlatformServices {
    // Bundled Tabler artwork is the same registry the OCaml icon names use.
    // The app-icons platform envelope subsequently replaces custom glyphs.
    func installApplicationIcons() throws {
        guard let backend, let root = ProcessInfo.processInfo.environment["LOGSEQ_NATIVE_ASSET_DIR"] else { throw HostError("Application icon resources are unavailable") }
        let data = try Data(contentsOf: URL(fileURLWithPath: root).appendingPathComponent("tabler-children.json"))
        guard let icons = try JSONSerialization.jsonObject(with: data) as? [String: [[Any]]], !icons.isEmpty else { throw HostError("Invalid bundled icon registry") }
        func xml(_ source: String) -> String {
            source.replacingOccurrences(of: "&", with: "&amp;")
                .replacingOccurrences(of: "\"", with: "&quot;")
                .replacingOccurrences(of: "<", with: "&lt;")
                .replacingOccurrences(of: ">", with: "&gt;")
        }
        for (name, children) in icons {
            guard !children.isEmpty else { throw HostError("Bundled icon \(name) has no geometry") }
            let fill = name.hasSuffix("-filled") ? "fill=\"currentColor\" stroke=\"none\"" : "fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\""
            var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" \(fill)>"
            for child in children {
                guard child.count == 2, let tag = child[0] as? String,
                      ["path", "circle", "ellipse", "line", "polyline", "polygon", "rect"].contains(tag),
                      let attrs = child[1] as? [String: String], !attrs.isEmpty else { throw HostError("Invalid bundled icon \(name)") }
                svg += "<" + tag + " " + attrs.sorted(by: { $0.key < $1.key }).map { $0.key + "=\"" + xml($0.value) + "\"" }.joined(separator: " ") + "/>"
            }
            svg += "</svg>"
            try backend.registerIcon(name: "app:" + name, svg: Data(svg.utf8))
        }
    }
}
