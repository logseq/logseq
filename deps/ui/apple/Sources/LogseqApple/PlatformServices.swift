import AppKit
import CoreText
import Foundation
import LUIAppleBackend
import Observation
import Security
import SwiftUI
import UniformTypeIdentifiers

@MainActor
@Observable
final class PlatformServices {
    weak var window: NSWindow?
    var runtime: NativeRuntime?
    var views: [Int: WeakView] = [:]
    var frames: [Int: CGRect] = [:]
    var editors: [String: WeakView] = [:]
    var focusIntents: [String: Bool] = [:]
    var uiState: [String: Any] = [:]
    var snapshots: [String: [String: String]] = [:]
    var graphContext: [String: String] = [:]
    var onCloseReady: ((Bool) -> Void)?
    var onError: ((Error) -> Void)?
    var onEditCommand: ((String) -> Void)?
    private(set) var incarnations: [Int: UInt64] = [:]
    private var nextIncarnation: UInt64 = 0
    var performanceVisible = false
    var performanceText = ""
    private var gaps: Set<String> = []
    private var nodes: [Int: [String: Any]] = [:]
    private var parents: [Int: Int] = [:]
    private var menuActions: [MenuAction] = []
    private var panels: [NSSavePanel] = []
    private(set) var closed = false

    func object(_ text: String) throws -> [String: Any] {
        guard let data = text.data(using: .utf8), let value = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { throw HostError("Expected JSON object") }
        return value
    }
    func required<T>(_ request: [String: Any], _ key: String, _: T.Type = T.self) throws -> T {
        guard let value = request[key] as? T else { throw HostError("Missing or invalid \(key)") }
        return value
    }
    func reply(_ name: String, _ value: Any) throws { try runtime?.send(name, value) }
    func unsupported(_ op: String, _ detail: String) {
        guard gaps.insert(op + ":" + detail).inserted else { return }
        NSLog("Logseq Apple UNSUPPORTED %@: %@", op, detail)
        do { try reply("platform-error", ["operation": op, "message": detail]) } catch { onError?(error) }
    }
    func perform(_ body: () throws -> Void) { do { try body() } catch { onError?(error) } }
    func requestEditorFocus(_ block: String, _ focused: Bool) {
        focusIntents[block] = focused
        guard let editor = editors[block]?.value, let window = editor.window else { return }
        let accepted = focused ? window.makeFirstResponder(editor)
            : window.firstResponder === editor ? window.makeFirstResponder(nil) : true
        if accepted { focusIntents.removeValue(forKey: block) }
    }

    // This mirror contains host presentation metadata only; OCaml owns documents.
    func resetPresentation() {
        nodes.removeAll(); parents.removeAll(); views.removeAll(); frames.removeAll(); incarnations.removeAll()
        editors.removeAll(); focusIntents.removeAll()
    }
    func applied(_ batch: [String: Any]) {
        for op in batch["ops"] as? [[String: Any]] ?? [] {
            let id = op["id"] as? Int ?? 0
            switch op["op"] as? String {
            case "create-node", "create-extension":
                nodes[id] = op
                nextIncarnation += 1; incarnations[id] = nextIncarnation
            case "set-prop", "set-extension-prop": if let name = op["property"] as? String { nodes[id]?[name] = op["value"] }
            case "remove-prop", "remove-extension-prop": if let name = op["property"] as? String { nodes[id]?.removeValue(forKey: name) }
            case "drop-node", "detach-subtree":
                var pending = [id]
                while let dead = pending.popLast() {
                    pending.append(contentsOf: parents.compactMap { $0.value == dead ? $0.key : nil })
                    nodes.removeValue(forKey: dead); parents.removeValue(forKey: dead); incarnations.removeValue(forKey: dead)
                    views.removeValue(forKey: dead); frames.removeValue(forKey: dead)
                }
            case "insert-child", "move-child": if let child = op["child"] as? Int, let parent = op["parent"] as? Int { parents[child] = parent }
            case "remove-child": if let child = op["child"] as? Int { parents.removeValue(forKey: child) }
            default: break
            }
        }
    }
    func resolve(_ reference: Any?) -> Int? {
        guard let ref = reference as? [String: Any] else { return nil }
        if let id = ref["node-id"] as? Int { return nodes[id] == nil ? nil : id }
        if let root = ref["#ref"] as? Int, root <= 0 { return nodes.keys.filter { parents[$0] == nil }.sorted().first }
        let name = ref["ref-id"] as? String ?? ref["#ref"] as? String
        return nodes.keys.sorted().first { nodes[$0]?["accessibility-identifier"] as? String == name && name != nil }
    }
    func node(at point: NSPoint) -> Int? {
        frames.filter { $0.value.contains(point) }.min { $0.value.width * $0.value.height < $1.value.width * $1.value.height }?.key
    }
    func node(for view: NSView) -> Int? {
        var candidate: NSView? = view
        while let current = candidate {
            if let node = views.first(where: { $0.value.value === current })?.key { return node }
            candidate = current.superview
        }
        guard let content = window?.contentView else { return nil }
        let rect = view.convert(view.bounds, to: content)
        return node(at: NSPoint(x: rect.midX, y: content.isFlipped ? rect.midY : content.bounds.height - rect.midY))
    }
    func pointerTarget(_ id: Int?) -> Int? {
        var candidate = id
        var listener: Int?
        while let node = candidate, let metadata = nodes[node] {
            if metadata["enabled"] as? Bool == false || metadata["inert"] as? Bool == true { return nil }
            if listener == nil, metadata["pointer-enabled"] as? Bool == true { listener = node }
            candidate = parents[node]
        }
        return listener
    }
    func capturesPointer(_ id: Int) -> Bool { nodes[id]?["pointer-capture"] as? Bool == true }
    func styleClass(_ id: Int?) -> String { id.flatMap { nodes[$0]?["style-class"] as? String } ?? "" }
    func isTitlebarBackground(_ id: Int?) -> Bool {
        var candidate = id
        while let node = candidate, let metadata = nodes[node] {
            if metadata["kind"] as? String == "button" || metadata["press-enabled"] as? Bool == true
                || metadata["pointer-enabled"] as? Bool == true { return false }
            if let attrs = metadata["data-attrs"] as? String,
               let data = attrs.data(using: .utf8),
               let values = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               values["data-window-titlebar"] as? String == "true" { return true }
            candidate = parents[node]
        }
        return false
    }
    func rect(_ id: Int) -> CGRect? {
        if let view = views[id]?.value, let content = window?.contentView, view.window != nil {
            let r = view.convert(view.bounds, to: content)
            return CGRect(x: r.minX, y: content.bounds.height - r.maxY, width: r.width, height: r.height)
        }
        return frames[id]
    }
    func view(_ id: Int) -> NSView? {
        if let view = views[id]?.value { return view }
        guard let root = window?.contentView else { return nil }
        let identifier = nodes[id]?["accessibility-identifier"] as? String ?? "lui-node-\(id)"
        func find(_ v: NSView) -> NSView? {
            if v.accessibilityIdentifier() == identifier { return v }
            for child in v.subviews { if let found = find(child) { return found } }
            return nil
        }
        return find(root)
    }

    func handle(_ envelope: String) throws {
        guard !closed, let newline = envelope.firstIndex(of: "\n") else { throw HostError("Invalid platform envelope") }
        let name = String(envelope[..<newline]), payload = String(envelope[envelope.index(after: newline)...])
        do {
            switch name {
            case "keychain": try keychain(try object(payload))
            case "resource-context":
                let request = try object(payload)
                let graph: String = try required(request, "graph")
                let graphDir: String = try required(request, "graph-dir"), assetDir: String = try required(request, "asset-dir")
                guard graph.isEmpty ? graphDir.isEmpty && assetDir.isEmpty : graphDir.hasPrefix("/") && assetDir.hasPrefix("/") else { throw HostError("Invalid resource roots") }
                graphContext = ["graph": graph, "graph-dir": graphDir, "asset-dir": assetDir]
            case "application-menu-labels": try installMenu(try object(payload))
            case "clipboard": try writeClipboard(payload)
            case "clipboard-read":
                guard payload.isEmpty else { throw HostError("clipboard-read payload must be empty") }
                try reply(name, ["text": NSPasteboard.general.string(forType: .string) ?? ""])
            case "clipboard-write":
                let request = try object(payload)
                let id: String = try required(request, "request-id"), text: String = try required(request, "text")
                guard let number = UInt64(id), number > 0, String(number) == id else { throw HostError("Invalid clipboard identity") }
                do { try writeClipboard(text); try reply("clipboard-write-result", ["request-id": id, "ok": true]) }
                catch { try reply("clipboard-write-result", ["request-id": id, "ok": false, "error": String(describing: error)]) }
            case "open-url":
                guard !payload.contains(where: { $0 == "\r" || $0 == "\n" || $0 == "\0" }), let url = URL(string: payload), url.scheme != nil, NSWorkspace.shared.open(url) else { throw HostError("Could not open external URL") }
            case "app-icons":
                let icons = try object(payload)
                guard icons.values.allSatisfy({ $0 is String }) else { throw HostError("Invalid application icons") }
                // The pinned backend has an immutable appIcons registry.
                unsupported(name, "Dynamic SVG icon registration requires an LUI Apple registry API")
            case "native-performance-toggle":
                guard try object(payload).isEmpty else { throw HostError("Performance toggle requires an empty object") }
                performanceVisible.toggle()
                try reply(name, [:] as [String: String])
            case "ui-state":
                let state = try object(payload)
                let lang: String = try required(state, "lang"), data: [String: String] = try required(state, "data")
                guard !lang.isEmpty else { throw HostError("UI language must not be empty") }
                if let mode = data["theme"] {
                    guard mode == "light" || mode == "dark" else { throw HostError("Invalid effective theme") }
                    window?.appearance = NSAppearance(named: mode == "dark" ? .darkAqua : .aqua)
                }
                uiState = state
            case "theme-snapshot":
                let request = try object(payload)
                let mode: String = try required(request, "mode"), vars: [String: String] = try required(request, "vars")
                guard ["light", "dark"].contains(mode), vars.keys.allSatisfy({ $0.hasPrefix("--") && !$0.contains(where: { $0.isWhitespace }) }) else { throw HostError("Invalid theme snapshot") }
                snapshots[mode] = vars
            case "dom-op":
                guard let split = payload.firstIndex(of: "\n") else { throw HostError("Invalid DOM envelope") }
                try dom(String(payload[..<split]), try object(String(payload[payload.index(after: split)...])))
            case "window-close-result":
                let result = try object(payload)
                let ok: Bool = try required(result, "ok")
                if !ok { NSLog("Logseq Apple close refused: %@", result["error"] as? String ?? "unknown") }
                onCloseReady?(ok)
            default: throw HostError("Required platform service is unavailable: \(name)")
            }
        } catch {
            NSLog("Logseq Apple PLATFORM ERROR %@: %@", name, String(describing: error))
            try reply("platform-error", ["operation": name, "message": String(describing: error)])
            // Structured errors are delivered; programmer errors are also surfaced.
        }
    }
    private func writeClipboard(_ text: String) throws {
        NSPasteboard.general.clearContents()
        guard NSPasteboard.general.setString(text, forType: .string) else { throw HostError("Native clipboard write failed") }
    }

    private func keychain(_ request: [String: Any]) throws {
        let id: String = try required(request, "request-id"), operation: String = try required(request, "operation")
        let service: String = try required(request, "service"), account: String = try required(request, "account")
        guard !id.isEmpty, !service.isEmpty, !account.isEmpty else { throw HostError("Incomplete keychain request") }
        var query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: account]
        var result: CFTypeRef?
        let status: OSStatus
        switch operation {
        case "get":
            query[kSecReturnData as String] = true
            query[kSecMatchLimit as String] = kSecMatchLimitOne
            status = SecItemCopyMatching(query as CFDictionary, &result)
        case "set":
            let value: String = try required(request, "value")
            let data = Data(value.utf8)
            let update = [kSecValueData as String: data] as CFDictionary
            var code = SecItemUpdate(query as CFDictionary, update)
            if code == errSecItemNotFound {
                var add = query
                add[kSecValueData as String] = data; add[kSecAttrLabel as String] = service
                code = SecItemAdd(add as CFDictionary, nil)
                if code == errSecDuplicateItem { code = SecItemUpdate(query as CFDictionary, update) }
            }
            status = code
        case "delete": status = SecItemDelete(query as CFDictionary)
        default: throw HostError("Unknown keychain operation")
        }
        var response = ["request-id": id, "status": status == errSecSuccess ? "ok" : status == errSecItemNotFound ? "not-found" : "error"]
        if status == errSecSuccess && operation == "get" {
            if let data = result as? Data, let value = String(data: data, encoding: .utf8) { response["value"] = value }
            else { response["status"] = "invalid-data" }
        }
        if status != errSecSuccess && status != errSecItemNotFound { NSLog("Logseq Apple keychain OSStatus %d", status) }
        try reply("keychain-result", response)
    }

    func emitDOM(_ context: LUIAppleExtensionViewContext, _ name: String, _ payload: [String: Any] = [:]) {
        perform {
            var body = payload
            body["nodeId"] = context.nodeID
            try context.emit(name: "dom-event", values: ["name": .string(name), "payload": .string(try jsonString(body))])
        }
    }
    func image(_ context: LUIAppleExtensionViewContext) -> NSImage? {
        guard let attrs = context.string("attrs"), let request = try? object(attrs), let source = request["src"] as? String else { return nil }
        if source.hasPrefix("data:"), let comma = source.firstIndex(of: ","), let bytes = Data(base64Encoded: String(source[source.index(after: comma)...])) { return NSImage(data: bytes) }
        if let url = URL(string: source), url.isFileURL { return NSImage(contentsOf: url) }
        guard let root = graphContext["asset-dir"], !root.isEmpty else { return nil }
        var relative = source
        for prefix in ["../assets/", "./assets/", "assets/"] where relative.hasPrefix(prefix) { relative = String(relative.dropFirst(prefix.count)); break }
        let url = URL(fileURLWithPath: root).appendingPathComponent(relative).standardizedFileURL
        guard url.path.hasPrefix(root + "/") else { return nil }
        return NSImage(contentsOf: url)
    }
    func close() {
        closed = true
        for panel in panels { panel.cancel(nil) }
        panels.removeAll(); editors.removeAll(); views.removeAll()
    }

    private func installMenu(_ labels: [String: Any]) throws {
        let sidebar: String = try required(labels, "toggle-left-sidebar"), documentation: String = try required(labels, "documentation")
        guard !sidebar.trimmingCharacters(in: .whitespaces).isEmpty, !documentation.trimmingCharacters(in: .whitespaces).isEmpty else { throw HostError("Translated menu labels must not be empty") }
        let menu = NSMenu()
        menuActions.removeAll()
        func submenu(_ title: String) -> NSMenu {
            let item = NSMenuItem(title: title, action: nil, keyEquivalent: "")
            let child = NSMenu(title: title); item.submenu = child; menu.addItem(item); return child
        }
        func system(_ menu: NSMenu, _ title: String, _ action: Selector, _ key: String = "") {
            menu.addItem(NSMenuItem(title: title, action: action, keyEquivalent: key))
        }
        func command(_ menu: NSMenu, _ label: String, _ name: String, _ key: String = "") {
            let action = MenuAction { [weak self] in self?.perform { try self?.reply("application-menu-command", ["detail": ["command": name]]) } }
            menuActions.append(action)
            let item = NSMenuItem(title: label, action: #selector(MenuAction.run), keyEquivalent: key); item.target = action; menu.addItem(item)
        }
        let app = submenu("Logseq")
        system(app, "About Logseq", #selector(NSApplication.orderFrontStandardAboutPanel(_:)))
        app.addItem(.separator()); system(app, "Hide Logseq", #selector(NSApplication.hide(_:)), "h")
        app.addItem(.separator()); system(app, "Quit Logseq", #selector(NSApplication.terminate(_:)), "q")
        let file = submenu("File"); system(file, "Close", #selector(NSWindow.performClose(_:)), "w")
        let edit = submenu("Edit")
        for (title, selector, key) in [("Undo", "undo:", "z"), ("Redo", "redo:", "Z"), ("Cut", "cut:", "x"), ("Copy", "copy:", "c"), ("Paste", "paste:", "v"), ("Select All", "selectAll:", "a")] {
            let action = MenuAction { [weak self] in self?.onEditCommand?(String(selector.dropLast())) }
            menuActions.append(action)
            let item = NSMenuItem(title: title, action: #selector(MenuAction.run), keyEquivalent: key)
            item.target = action; edit.addItem(item)
        }
        let view = submenu("View"); command(view, "Reload", "reload", "r"); view.addItem(.separator()); command(view, sidebar, "toggle-left-sidebar")
        let windows = submenu("Window"); system(windows, "Minimize", #selector(NSWindow.performMiniaturize(_:)), "m"); system(windows, "Zoom", #selector(NSWindow.performZoom(_:)))
        let help = submenu("Help"); command(help, documentation, "documentation")
        NSApp.mainMenu = menu; NSApp.windowsMenu = windows; NSApp.helpMenu = help
    }

    private func dom(_ op: String, _ request: [String: Any]) throws {
        if ["open-file-picker", "download-text", "download-binary"].contains(op) { try fileRequest(op, request); return }
        if op == "set-input-focus" {
            let block: String = try required(request, "block-id"), focused: Bool = try required(request, "focused")
            requestEditorFocus(block, focused)
            return
        }
        if ["caret-rect", "selection-rects", "offset-at", "line-ranges", "scroll-height"].contains(op) {
            unsupported(op, "Committed rich-text glyph geometry is not exposed by the pinned LUI Apple backend")
            return
        }
        let id = resolve(request[op == "scroll-row-into-view" ? "row" : "ref"])
        if op == "measure-node" {
            var result: [String: Any] = ["ref": request["ref"] ?? NSNull(), "rect": NSNull()]
            if let id, let frame = rect(id) {
                result["nodeId"] = id
                result["rect"] = ["left": frame.minX, "top": frame.minY, "right": frame.maxX, "bottom": frame.maxY, "width": frame.width, "height": frame.height]
            }
            try reply("node-rect", result)
            return
        }
        guard let id else { return } // Stale references have no target.
        let target = view(id)
        switch op {
        case "focus":
            guard let target, window?.makeFirstResponder(target) == true else { throw HostError("No native focus target for node \(id)") }
        case "select", "set-selection-range":
            let editor = (target as? NSTextView) ?? (target as? NSTextField)?.currentEditor() as? NSTextView
            guard let editor else { throw HostError("Node is not a native text control") }
            if op == "select" { editor.selectAll(nil) }
            else {
                let first: Int = try required(request, "start"), last: Int = try required(request, "end")
                guard first >= 0, last >= first, last <= (editor.string as NSString).length else { throw HostError("Invalid UTF-16 selection range") }
                editor.setSelectedRange(NSRange(location: first, length: last - first))
            }
        case "set-value":
            let value: String = try required(request, "value")
            if let field = target as? NSTextField { field.stringValue = value }
            else if let editor = target as? NSTextView { editor.string = value }
            else { throw HostError("Node is not a native text control") }
        case "set-scroll-top":
            let top: Double = try required(request, "top")
            guard let scroll = target as? NSScrollView ?? target?.enclosingScrollView else { throw HostError("Native scroll container is unavailable") }
            scroll.contentView.scroll(to: NSPoint(x: scroll.contentView.bounds.minX, y: top)); scroll.reflectScrolledClipView(scroll.contentView)
        case "scroll-into-view", "scroll-to-node", "scroll-row-into-view":
            guard let target else { throw HostError("Native scroll target is unavailable") }
            target.scrollToVisible(target.bounds)
        case "natural-size":
            guard let image = (target as? NSImageView)?.image else { throw HostError("Decoded image dimensions are unavailable") }
            try reply("node-natural-size", ["nodeId": id, "width": image.size.width, "height": image.size.height])
        case "click":
            if let button = target as? NSButton { button.performClick(nil) }
            else { _ = try runtime?.document("click", ["nodeId": id]) }
        case "set-text-content", "set-attr", "remove-attr", "set-class", "class-add", "class-remove", "style-set-property", "set-checked", "remove":
            unsupported(op, "Mutable presentation overrides require an LUI Apple host mutation API")
        default: throw HostError("Unknown DOM operation \(op)")
        }
    }

    private func fileRequest(_ op: String, _ request: [String: Any]) throws {
        guard let window else { throw HostError("File dialog has no window") }
        if op == "open-file-picker" {
            let id: Int = try required(request, "request"), multiple: Bool = try required(request, "multiple"), directory: Bool = try required(request, "directory")
            let panel = NSOpenPanel()
            panel.canChooseDirectories = directory; panel.canChooseFiles = !directory
            panel.allowsMultipleSelection = multiple; panel.resolvesAliases = false
            if let accept = request["accept"] as? String {
                let types = accept.split(separator: ",").compactMap { token -> UTType? in
                    let s = token.trimmingCharacters(in: .whitespaces)
                    return s.hasPrefix(".") ? UTType(filenameExtension: String(s.dropFirst())) : UTType(mimeType: s)
                }
                if !types.isEmpty { panel.allowedContentTypes = types }
            }
            panels.append(panel)
            panel.beginSheetModal(for: window) { [weak self] response in
                guard let self, !self.closed else { return }
                self.panels.removeAll { $0 === panel }
                self.perform {
                    var result: [String: Any] = ["request": id, "files": NSNull()]
                    do { if response == .OK { result["files"] = try self.pickedFiles(panel.urls, directory: directory) } }
                    catch { result["error"] = String(describing: error); NSLog("Logseq Apple picker failed: %@", String(describing: error)) }
                    try self.reply("files-picked", result)
                }
            }
        } else {
            let name: String = try required(request, "name"), _: String = try required(request, "mime")
            guard !name.isEmpty else { throw HostError("Download requires a filename") }
            let data: Data
            if op == "download-binary" {
                let text: String = try required(request, "data-b64")
                guard let bytes = Data(base64Encoded: text) else { throw HostError("Invalid download base64") }; data = bytes
            } else { let text: String = try required(request, "text"); data = Data(text.utf8) }
            let panel = NSSavePanel(); panel.nameFieldStringValue = URL(fileURLWithPath: name).lastPathComponent; panel.canCreateDirectories = true
            panels.append(panel)
            panel.beginSheetModal(for: window) { [weak self] response in
                guard let self, !self.closed else { return }
                self.panels.removeAll { $0 === panel }
                self.perform { if response == .OK, let url = panel.url { try data.write(to: url, options: .atomic) } }
            }
        }
    }
    private func pickedFiles(_ urls: [URL], directory: Bool) throws -> [[String: Any]] {
        var files: [[String: Any]] = []
        func record(_ url: URL, relative: String?) throws {
            let values = try url.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey, .contentModificationDateKey])
            guard values.isSymbolicLink != true, values.isRegularFile == true else { throw HostError("Selected graph contains a non-regular file") }
            var file: [String: Any] = ["name": relative ?? url.lastPathComponent, "size": values.fileSize ?? 0, "last-modified": (values.contentModificationDate?.timeIntervalSince1970 ?? 0) * 1000]
            if let relative {
                let data = try Data(contentsOf: url)
                guard data.count == values.fileSize else { throw HostError("Selected file changed size") }
                file["relative-path"] = relative; file["data-b64"] = data.base64EncodedString()
            } else { file["path"] = url.path }
            files.append(file)
        }
        if !directory { for url in urls { try record(url, relative: nil) }; return files }
        guard urls.count == 1, let root = urls.first else { throw HostError("Select exactly one graph directory") }
        var enumerationError: Error?
        guard let enumerator = FileManager.default.enumerator(at: root, includingPropertiesForKeys: [.isDirectoryKey, .isSymbolicLinkKey], errorHandler: { _, error in enumerationError = error; return false }) else { throw HostError("Cannot enumerate selected graph") }
        for case let url as URL in enumerator {
            let relative = String(url.path.dropFirst(root.path.count + 1))
            let values = try url.resourceValues(forKeys: [.isDirectoryKey, .isSymbolicLinkKey])
            let asset = relative == "assets" || relative.hasPrefix("assets/")
            if !asset && (relative.split(separator: "/").contains { $0.hasPrefix(".") || $0 == "node_modules" } || ["logseq/bak", "logseq/version-files", "logseq/graphs-txid.edn"].contains { relative == $0 || relative.hasPrefix($0 + "/") || relative.contains("/" + $0 + "/") }) { enumerator.skipDescendants(); continue }
            guard values.isSymbolicLink != true else { throw HostError("Selected graph contains a symbolic link") }
            if values.isDirectory == true { continue }
            if !asset && !url.pathExtension.isEmpty && !["md", "markdown", "org", "js", "edn", "css"].contains(url.pathExtension.lowercased()) { continue }
            try record(url, relative: relative)
        }
        if let enumerationError { throw enumerationError }
        guard !files.isEmpty else { throw HostError("Selected graph contains no importable files") }
        return files
    }
}

@MainActor
private final class MenuAction: NSObject {
    let action: () -> Void
    init(_ action: @escaping () -> Void) { self.action = action }
    @objc func run() { action() }
}
