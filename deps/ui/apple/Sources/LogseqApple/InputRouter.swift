import AppKit
import LUIAppleBackend

// Capture runs before AppKit target delivery. OCaml decides default prevention,
// shortcuts and block gestures; unhandled events continue to native controls.
@MainActor
final class InputRouter {
    let services: PlatformServices
    private var buttons = 0
    private var preventMouse = 0
    private var pressed: (node: Int, incarnation: UInt64)?
    private var pressPrevented = false
    private var captured: (node: Int, incarnation: UInt64)?
    private var lastPointer: (point: NSPoint, modifiers: Int, button: Int, targetClass: String)?
    private struct EditorDrag { let node: Int; let incarnation: UInt64; let block: String; let double: Bool }
    private var editorDrag: EditorDrag?
    private var editorPoint: (owner: EditorDrag, point: CGPoint, extend: Bool, double: Bool)?

    init(services: PlatformServices) { self.services = services }

    private func send(_ name: String, _ payload: [String: Any]) throws -> Bool {
        try services.runtime?.document(name, payload) ?? false
    }
    private func keyboardTarget() -> Int? {
        guard let view = services.window?.firstResponder as? NSView else { return nil }
        if let text = view as? NSTextView, let owner = text.delegate as? NSView,
           let node = services.node(for: owner) { return node }
        return services.node(for: view)
    }
    private func pointer(_ name: String, listener: Int?) throws {
        guard services.runtime?.started == true, !services.closed,
              let listener, services.supportsPointer(listener, event: name),
              services.incarnations[listener] != nil, let detail = lastPointer else { return }
        try services.runtime?.pointer(name, listener, detail.point.x, detail.point.y, detail.modifiers, detail.button, detail.targetClass)
        try services.runtime?.drain()
        services.runtime?.schedulePump()
    }
    private func capturedTarget() -> Int? {
        guard let captured, services.incarnations[captured.node] == captured.incarnation else { return nil }
        return captured.node
    }
    func backendEvent(_ event: LUIEvent) throws {
        guard services.runtime?.started == true, !services.closed else { return }
        // SwiftUI taps have no position. Supply the real event monitor's
        // detail, preserving keyboard/accessibility activation as reported.
        let mouseTypes: Set<NSEvent.EventType> = [.leftMouseDown, .leftMouseUp, .rightMouseDown, .rightMouseUp, .otherMouseDown, .otherMouseUp]
        if let current = NSApp.currentEvent, mouseTypes.contains(current.type), let detail = lastPointer {
            switch event {
            case .pressDetail(let node, _, _, _, _, _):
                try services.runtime?.dispatch(.pressDetail(node: node, x: detail.point.x, y: detail.point.y, modifiers: detail.modifiers, button: detail.button, targetClass: detail.targetClass))
                return
            case .contextMenuPress(let node, _, _, _, _, _):
                try services.runtime?.dispatch(.contextMenuPress(node: node, x: detail.point.x, y: detail.point.y, modifiers: detail.modifiers, button: detail.button, targetClass: detail.targetClass))
                return
            default: break
            }
        }
        try services.runtime?.dispatch(event)
    }

    // The one-point input sink is never a hit target. Its real retained
    // block-editor ancestor owns selection over the committed rich text.
    private func editorPointer(_ event: NSEvent, target: Int?, point: CGPoint) throws -> Bool {
        if event.type == .leftMouseDown {
            editorDrag = nil; editorPoint = nil
            var root = target
            while let id = root, !services.styleClass(id).split(separator: " ").contains("block-editor") { root = services.parents[id] }
            guard let root else { return false }
            for (id, properties) in services.nodes where properties["identifier"] as? String == "logseq-editor" {
                var ancestor = services.parents[id]
                while let parent = ancestor, parent != root { ancestor = services.parents[parent] }
                if ancestor == root, let block = properties["block-id"] as? String, let incarnation = services.incarnations[id] {
                    editorDrag = EditorDrag(node: id, incarnation: incarnation, block: block, double: event.clickCount == 2)
                    break
                }
            }
        }
        guard let owner = editorDrag else { return false }
        guard services.incarnations[owner.node] == owner.incarnation else { editorDrag = nil; editorPoint = nil; return false }
        let down = event.type == .leftMouseDown
        editorPoint = (owner, point, !down || event.modifierFlags.contains(.shift), owner.double && event.type != .leftMouseDragged)
        if event.type == .leftMouseUp { editorDrag = nil }
        try afterFrame()
        return true
    }

    func afterFrame() throws {
        guard let pending = editorPoint else { return }
        guard services.incarnations[pending.owner.node] == pending.owner.incarnation,
              services.runtime?.started == true, !services.closed else { editorPoint = nil; return }
        guard let layout = try services.editorGeometry.layout(pending.owner.block), let offset = layout.offset(at: pending.point) else { return }
        editorPoint = nil
        var values: [String: Any] = ["offset": offset]
        if !pending.double { values["extend"] = pending.extend }
        try services.runtime?.extensionEvent(node: pending.owner.node, identifier: "logseq-editor", name: pending.double ? "dblclick" : "pointer", values: values)
        services.requestEditorFocus(pending.owner.block, true)
    }

    func capture(_ event: NSEvent) throws -> Bool {
        let flags = event.modifierFlags
        var payload: [String: Any] = [
            "shiftKey": flags.contains(.shift), "altKey": flags.contains(.option),
            "metaKey": flags.contains(.command), "ctrlKey": flags.contains(.control)
        ]
        if event.type == .keyDown || event.type == .keyUp {
            payload["nodeId"] = keyboardTarget()
            payload["key"] = nativeKey(event); payload["code"] = nativeCode(event)
            payload["repeat"] = event.isARepeat
            payload["isComposing"] = (services.window?.firstResponder as? NSTextView)?.hasMarkedText() ?? false
            return try send(event.type == .keyDown ? "keydown" : "keyup", payload)
        }
        guard let content = services.window?.contentView else { return false }
        let local = content.convert(event.locationInWindow, from: nil)
        let point = NSPoint(x: local.x, y: content.isFlipped ? local.y : content.bounds.height - local.y)
        let target = services.node(at: point)
        let modifiers = (flags.contains(.shift) ? 2 : 0) | (flags.contains(.option) ? 4 : 0)
            | (flags.contains(.command) ? 8 : 0) | (flags.contains(.control) ? 1 : 0)
        lastPointer = (point, modifiers, event.buttonNumber == 1 ? 2 : event.buttonNumber == 2 ? 1 : event.buttonNumber, services.styleClass(target))
        payload["nodeId"] = target
        payload["clientX"] = point.x; payload["clientY"] = point.y
        payload["button"] = event.buttonNumber == 1 ? 2 : event.buttonNumber == 2 ? 1 : event.buttonNumber
        payload["detail"] = event.type == .scrollWheel || event.type == .mouseMoved ? 0 : event.clickCount
        let bit = 1 << event.buttonNumber

        switch event.type {
        case .leftMouseDown, .rightMouseDown, .otherMouseDown:
            buttons |= bit; preventMouse &= ~bit
            payload["buttons"] = buttons
            pressed = target.flatMap { node in services.incarnations[node].map { (node, $0) } }
            pressPrevented = false
            let pointer = try send("pointerdown", payload)
            if pointer { preventMouse |= bit }
            var taken = pointer
            if !pointer { taken = try send("mousedown", payload) }
            if event.type == .rightMouseDown { taken = try send("contextmenu", payload) || taken }
            pressPrevented = taken
            if !taken, event.type == .leftMouseDown, try editorPointer(event, target: target, point: point) { return true }
            if !taken, let listener = services.pointerTarget(target) {
                if services.capturesPointer(listener), let incarnation = services.incarnations[listener] { captured = (listener, incarnation) }
                try self.pointer("pointer_down", listener: listener)
                if event.type == .rightMouseDown { try self.pointer("context_menu_press", listener: listener) }
            }
            if !taken, event.type == .leftMouseDown,
               services.isTitlebarBackground(target) {
                services.window?.performDrag(with: event)
                return true
            }
            return taken
        case .leftMouseUp, .rightMouseUp, .otherMouseUp:
            buttons &= ~bit
            payload["buttons"] = buttons
            var taken = try send("pointerup", payload)
            if preventMouse & bit == 0 { taken = try send("mouseup", payload) || taken }
            preventMouse &= ~bit
            if !taken, event.type == .leftMouseUp, try editorPointer(event, target: target, point: point) {
                pressed = nil; captured = nil; pressPrevented = false
                return true
            }
            if !taken, !pressPrevented { try self.pointer("pointer_up", listener: capturedTarget() ?? services.pointerTarget(target)) }
            else { try self.pointer("pointer_cancel", listener: capturedTarget()) }
            captured = nil
            if event.type == .leftMouseUp {
                // A recycled retained ID must not receive the old press.
                let current = pressed.map { services.incarnations[$0.node] == $0.incarnation } ?? true
                if current {
                    taken = try send("click", payload) || taken
                    if event.clickCount == 2 { taken = try send("dblclick", payload) || taken }
                } else { taken = true }
                pressed = nil
            }
            let result = taken || pressPrevented
            pressPrevented = false
            return result
        case .mouseMoved, .leftMouseDragged, .rightMouseDragged, .otherMouseDragged:
            payload["buttons"] = buttons
            var taken = try send("pointermove", payload)
            if preventMouse == 0 { taken = try send("mousemove", payload) || taken }
            if !taken, event.type == .leftMouseDragged, try editorPointer(event, target: target, point: point) { return true }
            if !taken { try self.pointer("pointer_move", listener: capturedTarget() ?? services.pointerTarget(target, event: "pointer_move")) }
            return taken
        case .scrollWheel:
            payload["buttons"] = buttons
            payload["deltaX"] = event.scrollingDeltaX; payload["deltaY"] = event.scrollingDeltaY
            payload["deltaMode"] = event.hasPreciseScrollingDeltas ? 0 : 1
            return try send("wheel", payload)
        default: return false
        }
    }

    func blur() throws {
        if buttons != 0 { _ = try send("pointercancel", ["buttons": 0]) }
        try pointer("pointer_cancel", listener: capturedTarget())
        buttons = 0; preventMouse = 0; pressed = nil; pressPrevented = false
        captured = nil; lastPointer = nil
        editorDrag = nil; editorPoint = nil
        _ = try send("blur", [:])
    }

    func command(_ name: String) throws {
        var payload: [String: Any] = ["nativeCommand": name]
        payload["nodeId"] = keyboardTarget()
        if name == "undo" || name == "redo" || name == "selectAll" {
            let key = name == "selectAll" ? "a" : "z"
            payload["key"] = key; payload["code"] = name == "selectAll" ? "KeyA" : "KeyZ"
            payload["metaKey"] = true; payload["shiftKey"] = name == "redo"
            if try send("keydown", payload) { return }
            if let editor = services.window?.firstResponder as? NativeEditorInput {
                editor.send("key", ["key": .string(key), "meta": .bool(true), "shift": .bool(name == "redo")])
                editor.synchronize()
                return
            }
            NSApp.sendAction(NSSelectorFromString(name + ":"), to: nil, from: nil)
            return
        }
        if name == "paste" {
            var clipboard: [String: String] = [:]
            if let text = NSPasteboard.general.string(forType: .string) { clipboard["text/plain"] = text }
            if let html = NSPasteboard.general.string(forType: .html) { clipboard["text/html"] = html }
            payload["clipboardData"] = clipboard
        }
        if try !send(name, payload) {
            NSApp.sendAction(NSSelectorFromString(name + ":"), to: nil, from: nil)
        }
    }
}
