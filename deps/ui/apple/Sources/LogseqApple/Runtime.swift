import AppKit
import Darwin
import AppKit
import LUIAppleBackend

typealias PatchCallback = @convention(c) (UnsafePointer<CChar>?) -> Void
typealias BytesCallback = @convention(c) (UnsafePointer<CChar>?, Int32) -> Void
typealias WakeCallback = @convention(c) () -> Void
typealias StartCall = @convention(c) (PatchCallback?, WakeCallback?, BytesCallback?, Int32, Int32, UnsafePointer<CChar>?, Int32) -> Int32
typealias UnitCall = @convention(c) () -> Int32
typealias NodeCall = @convention(c) (Int64) -> Int32
typealias TextCall = @convention(c) (Int64, UnsafePointer<CChar>?, Int32) -> Int32
typealias BytesCall = @convention(c) (UnsafePointer<CChar>?, Int32) -> Int32
typealias ToggleCall = @convention(c) (Int64, Int32) -> Int32
typealias SliderCall = @convention(c) (Int64, Double) -> Int32
typealias RangeCall = @convention(c) (Int64, Int64, Int64) -> Int32
typealias ScrollCall = @convention(c) (Int64, Int64, UnsafePointer<CChar>?) -> Int32
typealias PointerCall = @convention(c) (Int64, Double, Double, Int32, Int32, UnsafePointer<CChar>?) -> Int32
typealias ExtensionCall = @convention(c) (Int64, UnsafePointer<CChar>?, Int32, UnsafePointer<CChar>?, Int32, UnsafePointer<CChar>?, Int32) -> Int32
typealias SnapshotCall = @convention(c) (UnsafePointer<CChar>?, Int32, BytesCallback?) -> Int32

nonisolated(unsafe) var activeRuntime: NativeRuntime?
nonisolated(unsafe) private var snapshotResult: String?
private let patches: PatchCallback = { data in
    guard let data else { return }
    let text = String(cString: data)
    MainActor.assumeIsolated {
        guard let runtime = activeRuntime else { return }
        runtime.messages.append(.patch(text, snapshot: runtime.receivingSnapshot, epoch: runtime.presentationEpoch))
    }
}
private let requests: BytesCallback = { data, count in
    guard let data, count >= 0 else { return }
    let bytes = UnsafeRawBufferPointer(start: data, count: Int(count))
    guard let text = String(bytes: bytes, encoding: .utf8) else { fatalError("Invalid platform UTF-8") }
    MainActor.assumeIsolated { activeRuntime?.messages.append(.request(text)) }
}
private func onMainRunLoop(_ action: @escaping @MainActor @Sendable () -> Void) {
    RunLoop.main.perform(inModes: [.common, .modalPanel, .eventTracking]) {
        MainActor.assumeIsolated { action() }
    }
    CFRunLoopWakeUp(CFRunLoopGetMain())
}
private let wake: WakeCallback = {
    onMainRunLoop { activeRuntime?.schedulePump() }
}
private let snapshotReceiver: BytesCallback = { data, count in
    guard let data else { return }
    snapshotResult = String(bytes: UnsafeRawBufferPointer(start: data, count: Int(count)), encoding: .utf8)
}

struct HostError: Error, CustomStringConvertible {
    let description: String
    init(_ message: String) { description = message }
}

func jsonString(_ value: Any) throws -> String {
    String(decoding: try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys, .fragmentsAllowed]), as: UTF8.self)
}

@MainActor
final class NativeRuntime {
    enum Message { case patch(String, snapshot: Bool, epoch: UInt64), request(String) }
    let library: UnsafeMutableRawPointer
    var messages: [Message] = []
    var onPatch: ((String, Bool) throws -> Void)?
    private(set) var receivingSnapshot = false
    private(set) var presentationEpoch: UInt64 = 0
    var onRequest: ((String) throws -> Void)?
    var onFailure: ((Error) -> Void)?
    private var scheduled = false
    private var draining = false
    private(set) var started = false
    private var symbols: [String: UnsafeMutableRawPointer] = [:]

    init(path: String) throws {
        guard let library = dlopen(path, RTLD_NOW | RTLD_LOCAL) else {
            throw HostError("dlopen: \(String(cString: dlerror()))")
        }
        self.library = library
        // Resolve the complete application ABI before initializing OCaml.
        let names = ["start", "pump", "resync", "stop", "root_node", "platform_event", "document_event_utf8", "editor_snapshot_utf8", "press", "press_ex", "long_press", "double_press", "appear", "load", "navigate_previous", "navigate_next", "text_changed_utf8", "picked_utf8", "submit", "dismiss", "toggle_changed", "radio_changed", "slider_changed", "scroll_edges", "scroll_completed", "visible_range", "extension_event_utf8", "press_detail", "pointer_down", "pointer_up", "pointer_move", "pointer_cancel", "pointer_enter", "pointer_leave", "context_menu_press"]
        for name in names {
            guard let address = dlsym(library, "lui_ocaml_" + name) else {
                throw HostError("Missing runtime symbol lui_ocaml_\(name)")
            }
            symbols[name] = address
        }
    }

    func function<T>(_ name: String, _: T.Type) -> T {
        guard let address = symbols[name] else { preconditionFailure("Unresolved ABI: \(name)") }
        return unsafeBitCast(address, to: T.self)
    }

    func start() throws {
        activeRuntime = self
        let payload = "{\"paintsCaret\":false}"
        let accepted = payload.withCString { function("start", StartCall.self)(patches, wake, requests, 1, 2, $0, Int32(payload.utf8.count)) }
        guard accepted == 1 else { throw HostError("OCaml initialization refused; see bridge diagnostics") }
        started = true
        try drain()
    }

    func check(_ accepted: Int32, _ operation: String) throws {
        guard accepted == 0 else { return }
        guard started, !receivingSnapshot else { throw HostError("OCaml refused \(operation); see bridge diagnostics") }
        NSLog("Logseq Apple runtime refused %@; requesting authoritative snapshot", operation)
        try resync()
    }

    func resync() throws {
        guard started, !receivingSnapshot else { throw HostError("Recursive runtime recovery") }
        receivingSnapshot = true
        defer { receivingSnapshot = false }
        presentationEpoch += 1
        // Do not retain partial incremental patches preceding a failed emit.
        messages.removeAll { if case .patch = $0 { return true }; return false }
        guard function("resync", UnitCall.self)() == 1 else { throw HostError("OCaml authoritative resync failed; see bridge diagnostics") }
    }

    func schedulePump() {
        guard started, !scheduled else { return }
        scheduled = true
        // AppKit's asynchronous Quit runs a nested loop; the OCaml worker and
        // save replies must keep pumping there and during native modal panels.
        onMainRunLoop { [weak self] in
            guard let self, self.started else { return }
            self.scheduled = false
            do {
                try self.check(self.function("pump", UnitCall.self)(), "pump")
                try self.drain()
            } catch { self.onFailure?(error) }
        }
    }

    func drain() throws {
        guard !draining else { return }
        draining = true
        defer { draining = false }
        while !messages.isEmpty {
            let batch = messages
            messages.removeAll(keepingCapacity: true)
            for message in batch {
                switch message {
                case .patch(let text, let snapshot, let epoch):
                    if epoch == presentationEpoch { try onPatch?(text, snapshot) }
                case .request(let text): try onRequest?(text)
                }
            }
        }
    }

    func send(_ name: String, _ value: Any) throws {
        guard started else { return }
        let envelope = name + "\n" + (try jsonString(value))
        try check(envelope.withCString { function("platform_event", BytesCall.self)($0, Int32(envelope.utf8.count)) }, name)
        schedulePump()
    }

    func document(_ name: String, _ payload: [String: Any]) throws -> Bool {
        // AppKit delivers final blur/responder callbacks during teardown.
        guard started else { return false }
        let envelope = name + "\n" + (try jsonString(payload))
        let result = envelope.withCString { function("document_event_utf8", BytesCall.self)($0, Int32(envelope.utf8.count)) }
        try check(result, "document \(name)")
        try drain()
        schedulePump()
        return result == 2
    }

    func snapshot(block: String) throws -> [String: Any]? {
        snapshotResult = nil
        try check(block.withCString { function("editor_snapshot_utf8", SnapshotCall.self)($0, Int32(block.utf8.count), snapshotReceiver) }, "editor snapshot")
        guard let text = snapshotResult, let data = text.data(using: .utf8) else { throw HostError("Missing editor snapshot") }
        return try JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed]) as? [String: Any]
    }

    func node(_ name: String, _ id: Int) throws { try check(function(name, NodeCall.self)(Int64(id)), name) }
    func text(_ name: String, _ id: Int, _ value: String) throws {
        try check(value.withCString { function(name, TextCall.self)(Int64(id), $0, Int32(value.utf8.count)) }, name)
    }
    func extensionEvent(node: Int, identifier: String, name: String, values: [String: Any]) throws {
        let payload = try jsonString(values)
        let result = identifier.withCString { id in name.withCString { event in payload.withCString { body in
            function("extension_event_utf8", ExtensionCall.self)(Int64(node), id, Int32(identifier.utf8.count), event, Int32(name.utf8.count), body, Int32(payload.utf8.count))
        } } }
        try check(result, "extension \(identifier)/\(name)")
        try drain()
        schedulePump()
    }

    func dispatch(_ event: LUIEvent) throws {
        defer { schedulePump() }
        switch event {
        case let .press(id): try node("press", id)
        case let .longPress(id): try node("long_press", id)
        case let .doublePress(id): try node("double_press", id)
        case let .appear(id): try node("appear", id)
        case let .submit(id): try node("submit", id)
        case let .dismiss(id): try node("dismiss", id)
        case let .change(id): try node("radio_changed", id)
        case let .pointerEnter(id): try node("pointer_enter", id)
        case let .pointerLeave(id): try node("pointer_leave", id)
        case let .textChanged(id, text): try self.text("text_changed_utf8", id, text)
        case let .picked(id, payload): try text("picked_utf8", id, payload)
        case let .toggleChanged(id, checked): try check(function("toggle_changed", ToggleCall.self)(Int64(id), checked ? 1 : 0), "toggle")
        case let .valueChanged(id, value): try check(function("slider_changed", SliderCall.self)(Int64(id), value), "slider")
        case let .visibleRange(id, first, last): try check(function("visible_range", RangeCall.self)(Int64(id), Int64(first), Int64(last)), "visible range")
        case let .scrollCompleted(id, token, outcome): try check(outcome.withCString { function("scroll_completed", ScrollCall.self)(Int64(id), Int64(token), $0) }, "scroll completed")
        case .virtualWindow: throw HostError("Runtime does not export virtual_window; sparse virtual lists are unavailable")
        case let .pressDetail(id, x, y, mods, button, target): try pointer("press_detail", id, x, y, mods, button, target)
        case let .pointerDown(id, x, y, mods, button, target): try pointer("pointer_down", id, x, y, mods, button, target)
        case let .pointerUp(id, x, y, mods, button, target): try pointer("pointer_up", id, x, y, mods, button, target)
        case let .contextMenuPress(id, x, y, mods, button, target): try pointer("context_menu_press", id, x, y, mods, button, target)
        case let .extension(id, identifier, name, values):
            try extensionEvent(node: id, identifier: identifier, name: name, values: values.mapValues { value -> Any in
                switch value { case .string(let x): return x; case .bool(let x): return x; case .int(let x): return x; case .double(let x): return x }
            })
        }
        try drain()
    }
    func pointer(_ name: String, _ node: Int, _ x: Double, _ y: Double, _ mods: Int, _ button: Int, _ target: String) throws {
        try check(target.withCString { function(name, PointerCall.self)(Int64(node), x, y, Int32(mods), Int32(button), $0) }, name)
    }
    func stop() throws {
        guard started else { return }
        started = false
        try check(function("stop", UnitCall.self)(), "stop")
        messages.removeAll()
        activeRuntime = nil
        // OCaml owns live worker domains: unloading its code is unsafe.
    }
}
