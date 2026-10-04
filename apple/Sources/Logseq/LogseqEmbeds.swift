import AppKit
import AVKit
import Foundation
import LUIAppleBackend
import SwiftUI
import UniformTypeIdentifiers
import WebKit

/// Resolves `src` attrs that arrive from the OCaml tree — remote URLs,
/// file paths, and `../assets/<uuid>.<ext>` graph-asset references.
/// Asset files live under <LOGSEQ_ROOT_DIR>/graphs/<graph>/assets; the
/// uuid-derived name is globally unique so a filename search finds it.
@MainActor enum LogseqAssetResolver {
  static var rootDir: String {
    ProcessInfo.processInfo.environment["LOGSEQ_ROOT_DIR"]
      ?? NSHomeDirectory() + "/logseq"
  }

  private static var assetPathCache: [String: String] = [:]

  static func assetFilePath(_ name: String) -> String? {
    if let hit = assetPathCache[name] { return hit }
    let assets = rootDir + "/graphs"
    guard let graphs = try? FileManager.default.contentsOfDirectory(
      atPath: assets)
    else { return nil }
    for graph in graphs {
      let candidate = "\(assets)/\(graph)/assets/\(name)"
      if FileManager.default.fileExists(atPath: candidate) {
        assetPathCache[name] = candidate
        return candidate
      }
    }
    return nil
  }

  /// DOM `src` -> loadable URL. `../assets/x` and `assets/x` resolve
  /// through the graph assets dir; bare paths and file/http(s) URLs pass
  /// through. Anything else (renderer macro args etc.) yields nil.
  static func url(forSrc src: String) -> URL? {
    if src.isEmpty { return nil }
    if let url = URL(string: src), let scheme = url.scheme {
      return scheme == "file" || scheme.hasPrefix("http") ? url : nil
    }
    if src.hasPrefix("/") { return URL(fileURLWithPath: src) }
    var rel = src
    while rel.hasPrefix("../") { rel = String(rel.dropFirst(3)) }
    if rel.hasPrefix("assets/") {
      let name = String(rel.dropFirst("assets/".count))
      if let path = assetFilePath(name) {
        return URL(fileURLWithPath: path)
      }
    }
    return nil
  }
}

/// One NSOpenPanel round-trip. The result is reported back to OCaml the
/// same way a browser input[type=file] reports a pick: a "file-picked"
/// platform event {id, files:[{name,path,size}]} stashed for qs/files_of,
/// then a "change" dom-event on the input's node carrying the same
/// files array in its payload.
@MainActor enum LogseqFilePicker {
  static func filePayloads(_ urls: [URL]) -> [[String: Any]] {
    urls.map { url in
      var f: [String: Any] = ["name": url.lastPathComponent, "path": url.path]
      if let size = (try? FileManager.default.attributesOfItem(
        atPath: url.path))?[.size] as? NSNumber
      {
        f["size"] = size
      }
      return f
    }
  }

  /// Recursive file listing for a webkitdirectory pick — config.edn
  /// first so importer's `config :: rest` split sees it.
  static func directoryFiles(_ dir: URL, acceptExts: Set<String>)
    -> [URL]
  {
    guard let e = FileManager.default.enumerator(
      at: dir, includingPropertiesForKeys: [.isRegularFileKey])
    else { return [] }
    var urls: [URL] = []
    for case let url as URL in e {
      let ext = url.pathExtension.lowercased()
      if acceptExts.isEmpty || acceptExts.contains(ext) {
        urls.append(url)
      }
    }
    urls.sort { a, b in
      let ac = a.lastPathComponent == "config.edn"
      let bc = b.lastPathComponent == "config.edn"
      if ac != bc { return ac }
      return a.path < b.path
    }
    return urls
  }

  /// accept attr ".sqlite,.db,image/*" -> UTTypes for the panel plus the
  /// raw extension set used by directory enumeration.
  static func acceptedTypes(_ accept: String) -> ([UTType], Set<String>) {
    var types: [UTType] = []
    var exts: Set<String> = []
    for part in accept.split(separator: ",") {
      let tok = part.trimmingCharacters(in: .whitespaces).lowercased()
      if tok.hasPrefix(".") {
        let ext = String(tok.dropFirst())
        exts.insert(ext)
        if let t = UTType(filenameExtension: ext) { types.append(t) }
      } else if tok.hasSuffix("/*") {
        switch tok.dropLast(2) {
        case "image": types.append(.image)
        case "audio": types.append(.audio)
        case "video": types.append(.movie)
        default: break
        }
      } else if let t = UTType(mimeType: tok) {
        types.append(t)
      }
    }
    return (types, exts)
  }

  /// Reports the pick as a "file-picked" platform event {id, files}.
  /// OCaml stashes files under "#id" and fires the pick_files
  /// on_picked subscriber — hidden inputs never mount an element, so
  /// there is no element-level "change" to emit.
  static func report(id: String, files: [[String: Any]]) {
    if let data = try? JSONSerialization.data(withJSONObject: [
      "id": id, "files": files,
    ] as [String: Any]), let json = String(data: data, encoding: .utf8) {
      LogseqRuntime.postPlatformEvent(name: "file-picked", json: json)
    }
  }

  static func pick(
    id: String, accept: String, multiple: Bool, directory: Bool
  ) {
    let (types, exts) = acceptedTypes(accept)
    let panel = NSOpenPanel()
    panel.allowsMultipleSelection = multiple
    panel.canChooseDirectories = directory
    panel.canChooseFiles = !directory
    panel.canCreateDirectories = false
    // No file filter: Logseq's accepts are extension lists and several
    // (.transit, .edn, .org, .sqlite) have no registered UTI — every
    // UTI-based filter (allowedContentTypes, allowedFileTypes,
    // shouldEnableURL) disables exactly those files. Web `accept` is
    // advisory too — leave the panel unfiltered.
    _ = exts
    if exts.isEmpty && !types.isEmpty {
      panel.allowedContentTypes = types
    }
    panel.begin { response in
      guard response == .OK else { return }
      let urls =
        directory
        ? directoryFiles(panel.url ?? URL(fileURLWithPath: "/"), acceptExts: exts)
        : panel.urls
      report(id: id, files: filePayloads(urls))
    }
  }
}

/// Clipboard file payloads — Finder-copied files and pasted image data
/// (screenshots) as the {name,path,size} shape the file-drop path and
/// `clipboardData.files` carry.
@MainActor enum LogseqPasteboard {
  static func files() -> [[String: Any]]? {
    let pb = NSPasteboard.general
    if let urls = pb.readObjects(forClasses: [NSURL.self], options: [
      .urlReadingFileURLsOnly: true,
    ]) as? [URL], !urls.isEmpty {
      return LogseqFilePicker.filePayloads(urls)
    }
    // pasted image data (screenshots, copied images) — stage to a temp
    // PNG so it has a real path like file-drop produces
    let png =
      pb.data(forType: .png)
      ?? pb.data(forType: .tiff).flatMap {
        NSBitmapImageRep(data: $0)?
          .representation(using: .png, properties: [:])
      }
    if let png {
      let path = NSTemporaryDirectory()
        + "logseq-paste-\(Int(Date().timeIntervalSince1970 * 1000)).png"
      if (try? png.write(to: URL(fileURLWithPath: path))) != nil {
        return [["name": "image.png", "path": path, "size": png.count]]
      }
    }
    return nil
  }
}

/// Element handle for input[type=file] — registers the node id +
/// DOM id so element-targeted dom-ops can resolve it.
@MainActor final class LogseqFileInputElement: LogseqElement {
  let nodeID: Int
  var emitNodeID: Int? { nodeID }
  init(nodeID: Int) {
    self.nodeID = nodeID
  }
}

/// `input[type=file]`. The importer/upload inputs render hidden and the
/// pick is driven OCaml-side (label click -> pick-files dom-op); a
/// visible file input gets a folder-button affordance that drives the
/// same NSOpenPanel path itself.
struct LogseqFileInput: View {
  let context: LUIAppleExtensionViewContext
  let attrs: [String: Any]
  let domID: String

  private var hidden: Bool { attrs["hidden"] != nil }

  var body: some View {
    Group {
      if hidden {
        Color.clear.frame(width: 0, height: 0)
      } else {
        Button {
          LogseqFilePicker.pick(
            id: domID,
            accept: attrs["accept"] as? String ?? "",
            multiple: attrs["multiple"] != nil,
            directory: attrs["webkitdirectory"] != nil)
        } label: {
          HStack(spacing: 6) {
            Image(systemName: "folder")
            if let label = attrs["placeholder"] as? String, !label.isEmpty {
              Text(label)
            }
          }
        }
        .buttonStyle(.bordered)
      }
    }
    .onAppear {
      let handle = LogseqFileInputElement(nodeID: context.nodeID)
      LogseqElementRegistry.shared.register(
        "node-\(context.nodeID)", handle)
      if !domID.isEmpty {
        LogseqElementRegistry.shared.register(domID, handle)
      }
    }
  }
}

/// `iframe` embeds ({{youtube}}, {{vimeo}}, .embed-block). Load-only —
/// no script bridge back into the app; window.open / target=_blank
/// links go to the default browser instead.
struct LogseqWebEmbed: NSViewRepresentable {
  let src: String

  final class Coordinator: NSObject, WKNavigationDelegate {
    func webView(
      _ webView: WKWebView,
      decidePolicyFor navigationAction: WKNavigationAction,
      decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void
    ) {
      let url = navigationAction.request.url
      if navigationAction.targetFrame == nil, let url {
        decisionHandler(.cancel)
        NSWorkspace.shared.open(url)
        return
      }
      if let scheme = url?.scheme, ["http", "https", "file"].contains(scheme) {
        decisionHandler(.allow)
      } else {
        decisionHandler(.cancel)
      }
    }
  }

  func makeCoordinator() -> Coordinator { Coordinator() }

  func makeNSView(context: NSViewRepresentableContext<Self>) -> WKWebView {
    let config = WKWebViewConfiguration()
    config.mediaTypesRequiringUserActionForPlayback = []
    let web = WKWebView(frame: .zero, configuration: config)
    web.navigationDelegate = context.coordinator
    if let url = LogseqAssetResolver.url(forSrc: src) {
      if url.isFileURL {
        web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
      } else {
        var req = URLRequest(url: url)
        req.setValue("https://logseq.com", forHTTPHeaderField: "Referer")
        web.load(req)
      }
    }
    return web
  }

  func updateNSView(_ webView: WKWebView, context: NSViewRepresentableContext<Self>) {}
}

/// `video`/`audio` elements — asset-file players via AVPlayerView.
/// Inline controls, media may autoplay-muted like the web player.
struct LogseqMediaEmbed: NSViewRepresentable {
  let src: String
  let isAudio: Bool

  func makeNSView(context: NSViewRepresentableContext<Self>) -> AVPlayerView {
    let view = AVPlayerView()
    view.controlsStyle = .inline
    if let url = LogseqAssetResolver.url(forSrc: src) {
      view.player = AVPlayer(url: url)
    }
    return view
  }

  func updateNSView(_ view: AVPlayerView, context: NSViewRepresentableContext<Self>) {
    if let url = LogseqAssetResolver.url(forSrc: src), view.player == nil {
      view.player = AVPlayer(url: url)
    }
  }
}
