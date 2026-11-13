import AppKit
import AVKit
import LUIAppleBackend
import SwiftUI
import WebKit

@MainActor
private func mediaAttributes(_ context: LUIAppleExtensionViewContext, _ services: PlatformServices) throws -> [String: Any] {
    try services.object(context.string("attrs") ?? "{}")
}

@MainActor
struct NativeAssetImage: View {
    let context: LUIAppleExtensionViewContext
    let services: PlatformServices
    @State private var image: NSImage?
    @State private var failed = false

    var body: some View {
        Group {
            if let image { Image(nsImage: image).resizable().scaledToFit() }
            else if failed { Image(systemName: "photo.badge.exclamationmark").foregroundStyle(.secondary) }
            else { ProgressView() }
        }
        .task(id: (context.string("attrs") ?? "") + "\n" + (services.graphContext["asset-dir"] ?? "")) {
            let incarnation = services.incarnations[context.nodeID]
            do {
                image = nil; failed = false; services.decodedImageSizes.removeValue(forKey: context.nodeID)
                let attrs = try mediaAttributes(context, services)
                guard let source = attrs["src"] as? String, !source.isEmpty else { return }
                let data: Data
                if source.hasPrefix("data:") {
                    guard let comma = source.firstIndex(of: ","), source[..<comma].hasSuffix(";base64"), let bytes = Data(base64Encoded: String(source[source.index(after: comma)...])) else { throw HostError("Invalid image data URI") }
                    data = bytes
                } else {
                    let url = try services.assetURL(source)
                    if url.isFileURL { data = try await Task.detached { try Data(contentsOf: url) }.value }
                    else {
                        let (bytes, response) = try await URLSession.shared.data(from: url)
                        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { throw HostError("Image download failed") }
                        data = bytes
                    }
                }
                try Task.checkCancellation()
                guard !services.closed, services.incarnations[context.nodeID] == incarnation else { return }
                guard let decoded = NSImage(data: data) else { throw HostError("Image source could not be decoded") }
                image = decoded
                if let rep = decoded.representations.first, rep.pixelsWide > 0, rep.pixelsHigh > 0 {
                    services.decodedImageSizes[context.nodeID] = CGSize(width: rep.pixelsWide, height: rep.pixelsHigh)
                } else { services.decodedImageSizes[context.nodeID] = decoded.size }
                try services.flushImageSizes()
                services.emitDOM(context, "load")
            } catch {
                guard !Task.isCancelled, !services.closed, services.incarnations[context.nodeID] == incarnation else { return }
                failed = true; services.unsupported("image", error.localizedDescription)
            }
        }
    }
}

@MainActor
struct NativeAssetPlayer: NSViewRepresentable {
    let context: LUIAppleExtensionViewContext
    let services: PlatformServices
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeNSView(context: Context) -> AVPlayerView { let view = AVPlayerView(); view.controlsStyle = .inline; return view }
    func updateNSView(_ view: AVPlayerView, context: Context) {
        context.coordinator.parent = self
        services.perform {
            var attrs = try mediaAttributes(self.context, services)
            if attrs["src"] == nil {
                for id in self.context.childIDs {
                    guard let encoded = services.nodes[id]?["attrs"] as? String else { continue }
                    let child = try services.object(encoded)
                    if child["data-tag"] as? String == "source", child["src"] != nil { attrs["src"] = child["src"]; break }
                }
            }
            guard let source = attrs["src"] as? String, !source.isEmpty else {
                context.coordinator.url = nil; context.coordinator.observation?.invalidate()
                view.player?.pause(); view.player = nil; context.coordinator.player = nil
                return
            }
            let url = try services.assetURL(source)
            guard context.coordinator.url != url else { return }
            context.coordinator.url = url; context.coordinator.observation?.invalidate()
            view.player?.pause()
            let item = AVPlayerItem(url: url)
            view.player = AVPlayer(playerItem: item)
            context.coordinator.player = view.player
            context.coordinator.observation = item.observe(\.status, options: .new) { [weak coordinator = context.coordinator] _, _ in
                Task { @MainActor in
                    guard let coordinator, coordinator.active, !coordinator.parent.services.closed, coordinator.player?.currentItem?.status == .failed else { return }
                    coordinator.parent.services.unsupported("media", coordinator.player?.currentItem?.error?.localizedDescription ?? "Media playback failed")
                }
            }
        }
    }
    static func dismantleNSView(_ view: AVPlayerView, coordinator: Coordinator) {
        coordinator.active = false; coordinator.observation?.invalidate(); view.player?.pause(); view.player = nil
    }
    @MainActor final class Coordinator {
        var parent: NativeAssetPlayer
        var url: URL?
        var player: AVPlayer?
        var observation: NSKeyValueObservation?
        var active = true
        init(_ parent: NativeAssetPlayer) { self.parent = parent }
    }
}

@MainActor
struct NativeEmbeddedWeb: NSViewRepresentable {
    let context: LUIAppleExtensionViewContext
    let services: PlatformServices
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration(); configuration.websiteDataStore = .nonPersistent()
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.underPageBackgroundColor = .clear; view.navigationDelegate = context.coordinator
        return view
    }
    func updateNSView(_ web: WKWebView, context: Context) {
        context.coordinator.parent = self
        services.perform {
            let attrs = try mediaAttributes(self.context, services)
            if let html = attrs["srcdoc"] as? String {
                guard context.coordinator.html != html else { return }
                context.coordinator.html = html; context.coordinator.request = nil
                web.configuration.defaultWebpagePreferences.allowsContentJavaScript = false
                web.loadHTMLString("<meta charset='utf-8'><style>:root{color-scheme:light dark}body{background:transparent;font:16px -apple-system;margin:0}img{max-width:100%}</style>" + html, baseURL: nil)
                return
            }
            guard let source = attrs["src"] as? String, !source.isEmpty else {
                if context.coordinator.request != nil || context.coordinator.html != "" {
                    context.coordinator.request = nil; context.coordinator.html = ""
                    web.stopLoading(); web.loadHTMLString("", baseURL: nil)
                }
                return
            }
            let url = try services.assetURL(source)
            var request = URLRequest(url: url)
            if let referer = attrs["referer"] as? String {
                guard !referer.contains("\r"), !referer.contains("\n") else { throw HostError("Invalid embed referer") }
                request.setValue(referer, forHTTPHeaderField: "Referer")
            }
            guard context.coordinator.request != request else { return }
            context.coordinator.request = request; context.coordinator.html = nil
            web.configuration.defaultWebpagePreferences.allowsContentJavaScript = !url.isFileURL
            if url.isFileURL { web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent()) }
            else { web.load(request) }
        }
    }
    static func dismantleNSView(_ web: WKWebView, coordinator: Coordinator) { coordinator.active = false; web.stopLoading(); web.navigationDelegate = nil }
    final class Coordinator: NSObject, WKNavigationDelegate {
        var parent: NativeEmbeddedWeb
        var request: URLRequest?
        var html: String?
        var active = true
        init(_ parent: NativeEmbeddedWeb) { self.parent = parent }
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void) {
            guard active, !parent.services.closed, let url = action.request.url else { decisionHandler(.cancel); return }
            if action.navigationType == .linkActivated {
                if ["https", "http"].contains(url.scheme?.lowercased() ?? "") { NSWorkspace.shared.open(url) }
                decisionHandler(.cancel); return
            }
            decisionHandler(["https", "http", "about"].contains(url.scheme?.lowercased() ?? "") || url == request?.url ? .allow : .cancel)
        }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            guard active, !parent.services.closed, (error as NSError).code != NSURLErrorCancelled else { return }
            parent.services.unsupported("iframe", error.localizedDescription)
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { self.webView(webView, didFail: navigation, withError: error) }
    }
}
