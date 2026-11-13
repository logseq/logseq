import AppKit
import LUIAppleBackend
import SwiftUI
import WebKit

@MainActor
private enum MathResources {
    private static var cached: (script: String, style: String)?
    static func load() throws -> (script: String, style: String) {
        if let cached { return cached }
        guard let directory = ProcessInfo.processInfo.environment["LOGSEQ_NATIVE_ASSET_DIR"] else { throw HostError("Math resources are unavailable") }
        let root = URL(fileURLWithPath: directory, isDirectory: true).appendingPathComponent("katex", isDirectory: true)
        let script = try String(contentsOf: root.appendingPathComponent("katex.min.js"), encoding: .utf8)
            + "\n" + String(contentsOf: root.appendingPathComponent("mhchem.min.js"), encoding: .utf8)
        let css = try String(contentsOf: root.appendingPathComponent("katex.min.css"), encoding: .utf8)
        // Match mobile's self-contained font CSS: WebKit never needs a remote
        // font, a file-origin exception, or access to the active graph.
        let pattern = try NSRegularExpression(pattern: #"src:url\(fonts/([^/)]+\.woff2)\)[^}]+"#)
        let output = NSMutableString(string: css)
        for match in pattern.matches(in: css, range: NSRange(location: 0, length: output.length)).reversed() {
            let name = (css as NSString).substring(with: match.range(at: 1))
            let font = try Data(contentsOf: root.appendingPathComponent("fonts/" + name))
            output.replaceCharacters(in: match.range, with: "src:url(data:font/woff2;base64," + font.base64EncodedString() + ") format(\"woff2\")")
        }
        let result = (script: script, style: output as String)
        cached = result
        return result
    }
}

@MainActor
struct NativeMath: View {
    let context: LUIAppleExtensionViewContext
    let services: PlatformServices
    @Environment(\.colorScheme) private var scheme
    @State private var size = CGSize(width: 1, height: 24)

    private var inline: Bool { if case .bool(let value) = context.property("inline") { return value }; return false }
    private var foreground: String {
        let color = services.themeColors(scheme)["foreground"] ?? .primary
        guard let rgb = NSColor(color).usingColorSpace(.deviceRGB) else { return "currentColor" }
        return String(format: "rgb(%.0f,%.0f,%.0f)", rgb.redComponent * 255, rgb.greenComponent * 255, rgb.blueComponent * 255)
    }
    var body: some View {
        MathWebContent(context: context, services: services, foreground: foreground, size: $size)
            .frame(width: inline ? size.width : nil, height: size.height)
            .frame(maxWidth: inline ? nil : .infinity)
            .background(ViewAnchor(node: context.nodeID, services: services))
    }
}

@MainActor
private struct MathWebContent: NSViewRepresentable {
    let context: LUIAppleExtensionViewContext
    let services: PlatformServices
    let foreground: String
    @Binding var size: CGSize

    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.userContentController.add(context.coordinator, name: "mathSize")
        let web = WKWebView(frame: .zero, configuration: configuration)
        web.underPageBackgroundColor = .clear
        web.navigationDelegate = context.coordinator
        return web
    }
    func updateNSView(_ web: WKWebView, context: Context) {
        context.coordinator.parent = self
        let tex = self.context.string("tex") ?? ""
        let display: Bool
        if case .bool(let value) = self.context.property("display") { display = value } else { display = false }
        let fingerprint = tex + "\u{0}" + String(display) + "\u{0}" + foreground
        guard context.coordinator.fingerprint != fingerprint else { return }
        context.coordinator.fingerprint = fingerprint
        context.coordinator.token = UUID().uuidString
        services.perform {
            let resources = try MathResources.load()
            let input = try jsonString(["tex": tex, "display": display, "token": context.coordinator.token]).replacingOccurrences(of: "</", with: "<\\/")
            let html = """
            <!doctype html><html><head><meta charset="utf-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none';script-src 'unsafe-inline';style-src 'unsafe-inline';font-src data:">
            <style>\(resources.style)
            html,body{margin:0;background:transparent;overflow:hidden;color:\(foreground);font:16px -apple-system}
            #formula{display:inline-block;width:max-content;max-width:none}.katex-display{margin:0}
            </style><script>\(resources.script)</script></head><body><span id="formula"></span><script>
            const input=\(input), formula=document.getElementById('formula');
            katex.render(input.tex,formula,{displayMode:input.display,throwOnError:false,trust:false,strict:false});
            const report=()=>{const r=formula.getBoundingClientRect();window.webkit.messageHandlers.mathSize.postMessage({token:input.token,width:Math.ceil(r.width),height:Math.ceil(r.height)})};
            new ResizeObserver(report).observe(formula);document.fonts.ready.then(report);report();
            </script></body></html>
            """
            web.loadHTMLString(html, baseURL: nil)
        }
    }
    static func dismantleNSView(_ web: WKWebView, coordinator: Coordinator) {
        coordinator.active = false
        web.configuration.userContentController.removeScriptMessageHandler(forName: "mathSize")
        web.navigationDelegate = nil
        web.stopLoading()
    }
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: MathWebContent
        var fingerprint: String?
        var token = ""
        var active = true
        let incarnation: UInt64?
        init(_ parent: MathWebContent) { self.parent = parent; incarnation = parent.services.incarnations[parent.context.nodeID] }
        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            guard active, !parent.services.closed, parent.services.incarnations[parent.context.nodeID] == incarnation,
                  let data = message.body as? [String: Any], data["token"] as? String == token,
                  let width = data["width"] as? Double, let height = data["height"] as? Double,
                  width.isFinite, height.isFinite, width >= 0, height >= 0 else { return }
            let size = CGSize(width: max(width, 1), height: max(height, 1))
            if parent.size != size { parent.size = size }
        }
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void) {
            // This widget renders math only. KaTeX trust:false disables TeX
            // links; a formula cannot navigate or open an external document.
            decisionHandler(action.navigationType == .other && action.request.url?.absoluteString == "about:blank" ? .allow : .cancel)
        }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            guard active, !parent.services.closed else { return }
            parent.services.unsupported("katex", error.localizedDescription)
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            self.webView(webView, didFail: navigation, withError: error)
        }
    }
}
