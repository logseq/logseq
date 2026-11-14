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
    @ObservationIgnored weak var window: NSWindow?
    @ObservationIgnored weak var backend: LUIAppleBackend?
    @ObservationIgnored var runtime: NativeRuntime?
    @ObservationIgnored var applyingPatches = false
    // Native view registration and layout reports must not invalidate SwiftUI
    // while NSViewRepresentable is mounting or updating those same views.
    @ObservationIgnored var views: [Int: WeakView] = [:]
    @ObservationIgnored var frames: [Int: CGRect] = [:]
    @ObservationIgnored var editors: [String: WeakView] = [:]
    var focusIntents: [String: Bool] = [:]
    var uiState: [String: Any] = [:]
    var snapshots: [String: [String: String]] = [:]
    var graphContext: [String: String] = [:]
    @ObservationIgnored var onCloseReady: ((Bool) -> Void)?
    @ObservationIgnored var onError: ((Error) -> Void)?
    @ObservationIgnored var onEditCommand: ((String) -> Void)?
    private(set) var incarnations: [Int: UInt64] = [:]
    @ObservationIgnored private var nextIncarnation: UInt64 = 0
    var performanceVisible = false
    var performanceText = ""
    @ObservationIgnored private var gaps: Set<String> = []
    @ObservationIgnored private(set) var nodes: [Int: [String: Any]] = [:]
    @ObservationIgnored private(set) var parents: [Int: Int] = [:]
    @ObservationIgnored private(set) var children: [Int: [Int]] = [:]
    @ObservationIgnored lazy var editorGeometry = EditorGeometry(services: self)
    @ObservationIgnored lazy var scrolling = NativeScrolling(services: self)
    @ObservationIgnored var decodedImageSizes: [Int: CGSize] = [:]
    @ObservationIgnored var pendingImageSizes: [Int: UInt64] = [:]
    @ObservationIgnored private var lazyMountsSent: [Int: UInt64] = [:]
    @ObservationIgnored private var lazyMountCheckScheduled = false
    @ObservationIgnored private var flushingLazyMounts = false
    @ObservationIgnored private var lazyMountObservers: [NSObjectProtocol] = []
    @ObservationIgnored private var menuActions: [MenuAction] = []
    @ObservationIgnored private var panels: [NSSavePanel] = []
    private struct PendingTextInput {
        let id: Int
        let incarnation: UInt64
        var operations: [(String, [String: Any])] = []
    }
    @ObservationIgnored private var pendingTextInput: PendingTextInput?
    @ObservationIgnored private(set) var closed = false

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
        pendingTextInput = nil
        editorGeometry.clear()
        scrolling.clear()
        decodedImageSizes.removeAll(); pendingImageSizes.removeAll()
        lazyMountsSent.removeAll()
        stopLazyMountObservation()
        nodes.removeAll(); parents.removeAll(); children.removeAll(); views.removeAll(); frames.removeAll(); incarnations.removeAll()
        editors.removeAll(); focusIntents.removeAll()
    }
    func applied(_ batch: [String: Any]) throws {
        for op in batch["ops"] as? [[String: Any]] ?? [] {
            let id = op["id"] as? Int ?? 0
            switch op["op"] as? String {
            case "create-node", "create-extension":
                nodes[id] = op
                nextIncarnation += 1; incarnations[id] = nextIncarnation
            case "set-prop", "set-extension-prop": if let name = op["property"] as? String {
                nodes[id]?[name] = op["value"]
                if ["height", "attrs", "events"].contains(name) { lazyMountsSent.removeValue(forKey: id) }
            }
            case "remove-prop", "remove-extension-prop": if let name = op["property"] as? String {
                nodes[id]?.removeValue(forKey: name)
                if ["height", "attrs", "events"].contains(name) { lazyMountsSent.removeValue(forKey: id) }
            }
            case "drop-node", "detach-subtree":
                var pending = [id]
                while let dead = pending.popLast() {
                    pending.append(contentsOf: parents.compactMap { $0.value == dead ? $0.key : nil })
                    nodes.removeValue(forKey: dead); parents.removeValue(forKey: dead); incarnations.removeValue(forKey: dead)
                    children.removeValue(forKey: dead)
                    decodedImageSizes.removeValue(forKey: dead); pendingImageSizes.removeValue(forKey: dead)
                    lazyMountsSent.removeValue(forKey: dead)
                    views.removeValue(forKey: dead); frames.removeValue(forKey: dead)
                }
                for parent in children.keys { children[parent]?.removeAll { nodes[$0] == nil } }
            case "insert-child", "move-child":
                if let child = op["child"] as? Int, let parent = op["parent"] as? Int, let index = op["index"] as? Int {
                    if let old = parents[child] { children[old]?.removeAll { $0 == child } }
                    var ordered = children[parent] ?? []
                    guard index >= 0, index <= ordered.count else { throw HostError("Invalid retained child position") }
                    ordered.insert(child, at: index); children[parent] = ordered; parents[child] = parent
                }
            case "remove-child":
                if let child = op["child"] as? Int {
                    if let parent = parents.removeValue(forKey: child) { children[parent]?.removeAll { $0 == child } }
                }
            default: break
            }
        }
    }
    private func isColdLazyRow(_ id: Int) -> Bool {
        guard let node = nodes[id], node["identifier"] as? String == "logseq-div",
              node["height"] as? String != "auto",
              let events = node["events"] as? String else { return false }
        return events.split(separator: " ").contains("lazy-mount")
    }
    private func observeLazyMountGeometry() {
        guard lazyMountObservers.isEmpty else { return }
        for name in [NSView.boundsDidChangeNotification, NSView.frameDidChangeNotification, NSWindow.didResizeNotification] {
            lazyMountObservers.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { [weak self] notification in
                let clip = notification.object as? NSClipView
                let resized = notification.object as? NSWindow
                MainActor.assumeIsolated {
                    guard let self else { return }
                    let window: NSWindow?
                    if let clip { window = clip.window }
                    else { window = resized }
                    guard let window, self.ownsInputWindow(window) else { return }
                    self.scheduleLazyMountCheck()
                }
            })
        }
    }
    private func stopLazyMountObservation() {
        for observer in lazyMountObservers { NotificationCenter.default.removeObserver(observer) }
        lazyMountObservers.removeAll()
    }
    func scheduleLazyMountCheck(_ id: Int? = nil) {
        guard !closed, !lazyMountCheckScheduled else { return }
        if let id, !isColdLazyRow(id) { return }
        observeLazyMountGeometry()
        lazyMountCheckScheduled = true
        onMainRunLoop { [weak self] in
            guard let self else { return }
            self.lazyMountCheckScheduled = false
            self.perform { try self.mountVisibleLazyRows() }
        }
    }
    private func lazyRowIsVisible(_ id: Int) -> Bool {
        guard let view = views[id]?.value as? ViewAnchor.AnchorView, view.isCurrent(node: id, services: self),
              !view.isHiddenOrHasHiddenAncestor, let window = view.window, ownsInputWindow(window),
              let content = window.contentView else { return false }
        // All rectangles here use this NSWindow's AppKit content coordinates.
        let row = view.convert(view.bounds, to: content)
        guard [row.minX, row.minY, row.width, row.height].allSatisfy({ $0.isFinite }),
              row.width >= 0, row.height >= 0 else { return false }
        var viewport = content.bounds
        var ancestor = view.superview
        while let parent = ancestor {
            if let clip = parent as? NSClipView {
                clip.postsBoundsChangedNotifications = true
                clip.postsFrameChangedNotifications = true
                viewport = viewport.intersection(clip.convert(clip.bounds, to: content))
            }
            if parent === content { break }
            ancestor = parent.superview
        }
        // Empty VStacks can have zero width/height. A zero-height marker must
        // lie strictly inside the visible band; never invent a minimum height.
        return [viewport.minX, viewport.minY, viewport.width, viewport.height].allSatisfy({ $0.isFinite })
            && !viewport.isEmpty && row.maxY > viewport.minY && row.minY < viewport.maxY
            && row.maxX >= viewport.minX && row.minX <= viewport.maxX
    }
    func mountVisibleLazyRows() throws {
        guard !closed, !applyingPatches, !flushingLazyMounts,
              let runtime, runtime.started else { return }
        flushingLazyMounts = true
        defer { flushingLazyMounts = false }
        let candidates = views.keys.filter { isColdLazyRow($0) }
        guard !candidates.isEmpty else { return }
        observeLazyMountGeometry()
        let ready = try candidates.compactMap { id -> (Int, UInt64, String)? in
            guard let incarnation = incarnations[id],
                  lazyMountsSent[id] != incarnation, lazyRowIsVisible(id),
                  let attrs = nodes[id]?["attrs"] as? String,
                  let key = try object(attrs)["data-lazy-mount"] else { return nil }
            guard let key = key as? String, !key.isEmpty else { throw HostError("Invalid lazy mount key") }
            return (id, incarnation, attrs)
        }
        for (id, incarnation, attrs) in ready {
            guard incarnations[id] == incarnation, nodes[id]?["attrs"] as? String == attrs,
                  isColdLazyRow(id), lazyRowIsVisible(id) else { continue }
            try runtime.extensionEvent(node: id, identifier: "logseq-div", name: "dom-event",
                values: ["name": "lazy-mount", "payload": try jsonString(["nodeId": id])])
            if incarnations[id] == incarnation, nodes[id]?["attrs"] as? String == attrs, isColdLazyRow(id) {
                lazyMountsSent[id] = incarnation
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
        let hits = frames.filter { $0.value.contains(point) }
        // A containing descendant wins even when it overflows a shorter parent.
        var ancestors = Set<Int>()
        for node in hits.keys {
            var parent = parents[node]
            while let current = parent, ancestors.insert(current).inserted {
                parent = parents[current]
            }
        }
        return hits.lazy.filter { !ancestors.contains($0.key) }
            .min { $0.value.width * $0.value.height < $1.value.width * $1.value.height }?.key
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
    func supportsPointer(_ id: Int, event: String) -> Bool {
        guard let kind = nodes[id]?["kind"] as? String else { return false }
        switch event {
        case "pointer_move", "pointer_cancel": return ["row", "box"].contains(kind)
        case "context_menu_press": return ["button", "toggle-button", "toggle", "radio", "slider", "number-stepper", "text-field", "secure-field", "input", "search-field", "textarea", "checkbox", "switch-control", "select", "combobox", "menu-item", "list-item", "accordion", "text", "table-cell"].contains(kind)
        default: return ["button", "column", "row", "box", "radio", "select", "combobox", "menu-item", "list-item", "text", "table-cell", "timeline-item", "file-image", "bottom-tab", "swipe-action"].contains(kind)
        }
    }
    func pointerTarget(_ id: Int?, event: String = "pointer_down") -> Int? {
        var candidate = id
        var listener: Int?
        while let node = candidate, let metadata = nodes[node] {
            if metadata["enabled"] as? Bool == false || metadata["inert"] as? Bool == true { return nil }
            if listener == nil, metadata["pointer-enabled"] as? Bool == true,
               supportsPointer(node, event: event) { listener = node }
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
            return CGRect(x: r.minX, y: content.isFlipped ? r.minY : content.bounds.height - r.maxY, width: r.width, height: r.height)
        }
        return frames[id]
    }
    func view(_ id: Int) -> NSView? {
        if let view = views[id]?.value { return view }
        let identifier = nodes[id]?["accessibility-identifier"] as? String ?? "lui-node-\(id)"
        func find(_ v: NSView) -> NSView? {
            if v.accessibilityIdentifier() == identifier { return v }
            for child in v.subviews { if let found = find(child) { return found } }
            return nil
        }
        for candidate in NSApp.windows where ownsInputWindow(candidate) {
            if let root = candidate.contentView, let found = find(root) { return found }
        }
        return nil
    }
    func ownsInputWindow(_ candidate: NSWindow) -> Bool {
        var pending = [candidate]
        var visited: Set<ObjectIdentifier> = []
        var owned = false
        while let current = pending.popLast() {
            guard visited.insert(ObjectIdentifier(current)).inserted else { continue }
            // AppKit file panels and their children handle their own input.
            if current is NSSavePanel { return false }
            if current === window { owned = true }
            if let parent = current.parent { pending.append(parent) }
            if let parent = current.sheetParent { pending.append(parent) }
        }
        return owned
    }
    private func textControl(_ id: Int) -> NSView? {
        if let target = view(id), target is NSTextView || target is NSTextField { return target }
        guard backend?.focusedNodeID == id, let candidate = NSApp.keyWindow,
              ownsInputWindow(candidate) else { return nil }
        let responder = candidate.firstResponder as? NSView
        return responder is NSTextView || responder is NSTextField ? responder : nil
    }
    private func flushPendingTextInput() throws {
        guard let pending = pendingTextInput else { return }
        guard incarnations[pending.id] == pending.incarnation else { pendingTextInput = nil; return }
        let focused = withObservationTracking {
            backend?.focusedNodeID
        } onChange: { [weak self] in
            Task { @MainActor [weak self] in self?.perform { try self?.flushPendingTextInput() } }
        }
        guard focused == pending.id else { return }
        pendingTextInput = nil
        for (op, request) in pending.operations {
            try handle("dom-op\n" + op + "\n" + jsonString(request))
        }
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
                guard let icons = try object(payload) as? [String: String] else { throw HostError("Invalid application icons") }
                guard let backend else { throw HostError("Application icon backend is unavailable") }
                for (name, svg) in icons {
                    try backend.registerIcon(name: "app:" + name, svg: Data(svg.utf8))
                }
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
    func flushImageSizes() throws {
        for (id, incarnation) in pendingImageSizes {
            guard incarnations[id] == incarnation else { pendingImageSizes.removeValue(forKey: id); continue }
            guard let size = decodedImageSizes[id] ?? backend?.naturalImageSize(nodeID: id) else { continue }
            pendingImageSizes.removeValue(forKey: id)
            try reply("node-natural-size", ["nodeId": id, "width": size.width, "height": size.height])
        }
    }
    func close() {
        closed = true
        lazyMountsSent.removeAll(); stopLazyMountObservation()
        pendingTextInput = nil
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
        if op == "dump-frames" {
            let rows: [[String: Any]] = nodes.keys.sorted().map { id in
                var row: [String: Any] = ["id": id, "kind": nodes[id]?["kind"] ?? nodes[id]?["identifier"] ?? "unknown", "children": children[id] ?? []]
                for key in ["accessibility-identifier", "style-class", "grow", "min-width", "max-width", "min-height", "max-height", "width", "height", "main", "cross", "display", "position", "container-relative-frame", "inert", "overflow", "gap", "padding", "padding-horizontal", "padding-vertical", "margin-left", "font-size", "font-weight", "first-pane-width"] {
                    if let value = nodes[id]?[key] { row[key] = value }
                }
                if nodes[id]?["kind"] as? String == "split", let value = nodes[id]?["value"] { row["value"] = value }
                if let r = rect(id) { row["frame"] = ["x": r.minX, "y": r.minY, "width": r.width, "height": r.height] }
                if let metrics = backend?.scrollMetrics(nodeID: id) {
                    row["scroll"] = ["top": metrics.offset, "height": metrics.contentSize.height, "viewport-height": metrics.viewportSize.height, "viewport-width": metrics.viewportSize.width]
                }
                return row
            }
            NSLog("Logseq Apple frames %@", try jsonString(rows))
            return
        }
        if ["open-file-picker", "download-text", "download-binary"].contains(op) { try fileRequest(op, request); return }
        if op == "set-input-focus" {
            let block: String = try required(request, "block-id"), focused: Bool = try required(request, "focused")
            requestEditorFocus(block, focused)
            return
        }
        if ["caret-rect", "selection-rects", "offset-at", "line-ranges", "scroll-height"].contains(op) {
            try editorGeometry.request(op, request)
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
        let target = op == "focus" ? views[id]?.value : textControl(id) ?? view(id)
        if ["select", "set-selection-range", "set-value"].contains(op) {
            let editor = (target as? NSTextView) ?? (target as? NSTextField)?.currentEditor() as? NSTextView
            let ready = op == "set-value" ? target is NSTextField || target is NSTextView : editor != nil
            if pendingTextInput?.id == id, pendingTextInput?.incarnation == incarnations[id],
               !ready || pendingTextInput?.operations.isEmpty == false {
                pendingTextInput?.operations.append((op, request))
                return
            }
        }
        switch op {
        case "focus":
            if backend?.requestFocus(nodeID: id) == true, let incarnation = incarnations[id] {
                // SwiftUI focus is accepted before its native field editor mounts.
                pendingTextInput = PendingTextInput(id: id, incarnation: incarnation)
                try flushPendingTextInput()
            } else {
                guard let target, window?.makeFirstResponder(target) == true else { throw HostError("No native focus target for node \(id)") }
            }
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
            guard top.isFinite, nodes[id]?["kind"] as? String == "scroll" else { throw HostError("set-scroll-top requires a scroll node and finite offset") }
            scrolling.request(id, top: top)
        case "scroll-into-view", "scroll-to-node", "scroll-row-into-view":
            scrolling.request(id, scroller: resolve(request["scroller"]))
        case "natural-size":
            if let size = decodedImageSizes[id] ?? backend?.naturalImageSize(nodeID: id) ?? (target as? NSImageView)?.image?.size {
                try reply("node-natural-size", ["nodeId": id, "width": size.width, "height": size.height])
            } else if let incarnation = incarnations[id] { pendingImageSizes[id] = incarnation }
        case "click":
            if let button = target as? NSButton { button.performClick(nil) }
            else { _ = try runtime?.document("click", ["nodeId": id]) }
        case "set-text-content", "set-attr", "remove-attr", "set-class", "class-add", "class-remove", "style-set-property", "set-checked", "remove":
            unsupported(op, "Mutable presentation overrides require an LUI Apple host mutation API")
        default: throw HostError("Unknown DOM operation \(op)")
        }
    }

    private func fileRequest(_ op: String, _ request: [String: Any]) throws {
        guard var presentationWindow = window else { throw HostError("File dialog has no window") }
        // Present above retained dialogs instead of queueing behind them.
        while let sheet = presentationWindow.attachedSheet, ownsInputWindow(sheet) {
            presentationWindow = sheet
        }
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
            panel.beginSheetModal(for: presentationWindow) { [weak self] response in
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
            panel.beginSheetModal(for: presentationWindow) { [weak self] response in
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
