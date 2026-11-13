import AppKit

// Capture runs before AppKit target delivery. OCaml decides default prevention,
// shortcuts and block gestures; unhandled events continue to native controls.
@MainActor
final class InputRouter {
    let services: PlatformServices
    private var buttons = 0
    private var preventMouse = 0
    private var pressed: (node: Int, incarnation: UInt64)?
    private var pressPrevented = false

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
        buttons = 0; preventMouse = 0; pressed = nil; pressPrevented = false
        _ = try send("blur", [:])
    }

    func command(_ name: String) throws {
        var payload: [String: Any] = ["nativeCommand": name]
        payload["nodeId"] = keyboardTarget()
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
