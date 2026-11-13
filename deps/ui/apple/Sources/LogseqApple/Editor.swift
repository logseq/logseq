import AppKit
import LUIAppleBackend
import SwiftUI

@MainActor
struct EditorSink: NSViewRepresentable {
    let context: LUIAppleExtensionViewContext
    let services: PlatformServices
    func makeNSView(context: Context) -> NativeEditorInput {
        let input = NativeEditorInput()
        input.drawsBackground = false; input.textColor = .clear
        input.insertionPointColor = .clear
        input.isRichText = false; input.isAutomaticQuoteSubstitutionEnabled = false
        input.isAutomaticDashSubstitutionEnabled = false
        input.isAutomaticSpellingCorrectionEnabled = false
        return input
    }
    func updateNSView(_ input: NativeEditorInput, context: Context) {
        input.extensionContext = self.context; input.services = services
        input.block = self.context.string("block-id") ?? ""
        services.editors[input.block] = WeakView(input)
        services.views[self.context.nodeID] = WeakView(input)
        input.setAccessibilityIdentifier(self.context.string("accessibility-identifier") ?? "logseq-editor-\(input.block)")
        input.synchronize()
        if let focused = services.focusIntents[input.block] {
            DispatchQueue.main.async { [weak input] in
                guard let input, input.window != nil else { return }
                if focused { input.window?.makeFirstResponder(input) }
                else if input.window?.firstResponder === input { input.window?.makeFirstResponder(nil) }
            }
        }
    }
}

// Only an input conduit. The source and selection are read from OCaml;
// every edit is an intent and NSTextView's local undo manager is disabled.
@MainActor
final class NativeEditorInput: NSTextView {
    var extensionContext: LUIAppleExtensionViewContext?
    weak var services: PlatformServices?
    var block = ""
    private var composing = false
    override var acceptsFirstResponder: Bool { true }
    override var undoManager: UndoManager? { nil }
    override func draw(_ dirtyRect: NSRect) {}

    func send(_ name: String, _ values: [String: LUIExtensionValue] = [:]) {
        guard let context = extensionContext else { return }
        services?.perform { try context.emit(name: name, values: values) }
    }
    func synchronize() {
        guard !composing, let runtime = services?.runtime else { return }
        services?.perform {
            guard let snapshot = try runtime.snapshot(block: block), let source = snapshot["source"] as? String, let anchor = snapshot["anchor"] as? Int, let caret = snapshot["caret"] as? Int else { return }
            if string != source { string = source }
            func utf16(_ offset: Int) -> Int {
                let bytes = Array(source.utf8.prefix(offset))
                return String(decoding: bytes, as: UTF8.self).utf16.count
            }
            let a = utf16(anchor), b = utf16(caret)
            setSelectedRange(NSRange(location: min(a, b), length: abs(a - b)))
        }
    }
    override func becomeFirstResponder() -> Bool {
        let accepted = super.becomeFirstResponder()
        if accepted { send("focus"); synchronize() }
        return accepted
    }
    override func resignFirstResponder() -> Bool {
        let accepted = super.resignFirstResponder()
        if accepted { send("blur") }
        return accepted
    }
    override func keyDown(with event: NSEvent) {
        if composing { interpretKeyEvents([event]); return }
        let flags = event.modifierFlags
        let key = nativeKey(event)
        if key.count > 1 || !flags.intersection([.command, .control]).isEmpty {
            send("key", ["key": .string(key), "code": .string(nativeCode(event)), "key-char": .string(event.characters ?? ""), "shift": .bool(flags.contains(.shift)), "alt": .bool(flags.contains(.option)), "meta": .bool(flags.contains(.command)), "ctrl": .bool(flags.contains(.control)), "repeat": .bool(event.isARepeat)])
        } else { interpretKeyEvents([event]) }
        synchronize()
    }
    override func insertText(_ insertString: Any, replacementRange: NSRange) {
        let text = (insertString as? NSAttributedString)?.string ?? insertString as? String ?? ""
        if composing { composing = false; send("composition", ["state": .string("end"), "text": .string(text)]) }
        else { send("insert", ["text": .string(text)]) }
        synchronize()
    }
    override func setMarkedText(_ string: Any, selectedRange: NSRange, replacementRange: NSRange) {
        let text = (string as? NSAttributedString)?.string ?? string as? String ?? ""
        if !composing { send("composition", ["state": .string("start")]); composing = true }
        super.setMarkedText(string, selectedRange: selectedRange, replacementRange: replacementRange)
        send("composition", ["state": .string("update"), "text": .string(text)])
    }
    override func unmarkText() {
        guard composing else { return }
        super.unmarkText()
        composing = false; send("composition", ["state": .string("end")]); synchronize()
    }
    override func hasMarkedText() -> Bool { composing }
    override func doCommand(by selector: Selector) {
        let names = ["deleteBackward:": "backward", "deleteForward:": "forward", "deleteWordBackward:": "word-backward", "deleteWordForward:": "word-forward", "deleteToBeginningOfLine:": "line-backward", "deleteToEndOfLine:": "line-forward"]
        if let kind = names[NSStringFromSelector(selector)] { send("delete", ["kind": .string(kind)]) }
        else { services?.unsupported("editor-command", NSStringFromSelector(selector)) }
    }
    override func paste(_ sender: Any?) { if let text = NSPasteboard.general.string(forType: .string) { send("insert", ["text": .string(text)]); synchronize() } }
    override func copy(_ sender: Any?) {
        let range = selectedRange()
        if range.length > 0 { NSPasteboard.general.clearContents(); NSPasteboard.general.setString((string as NSString).substring(with: range), forType: .string) }
    }
    override func cut(_ sender: Any?) { copy(sender); send("delete", ["kind": .string("selection")]); synchronize() }
    override func selectAll(_ sender: Any?) { send("key", ["key": .string("a"), "meta": .bool(true)]) }
}

@MainActor
struct CodeEditor: NSViewRepresentable {
    let context: LUIAppleExtensionViewContext
    let services: PlatformServices
    func makeCoordinator() -> Coordinator { Coordinator(self) }
    func makeNSView(context: Context) -> NSScrollView {
        let editor = NSTextView()
        editor.isRichText = false; editor.font = .monospacedSystemFont(ofSize: 13, weight: .regular)
        editor.delegate = context.coordinator
        let scroll = NSScrollView(); scroll.hasVerticalScroller = true; scroll.documentView = editor
        return scroll
    }
    func updateNSView(_ scroll: NSScrollView, context: Context) {
        guard let editor = scroll.documentView as? NSTextView else { return }
        context.coordinator.parent = self
        let value = self.context.string("value") ?? ""
        if editor.string != value { editor.string = value }
        if case .bool(let readOnly) = self.context.property("read-only") { editor.isEditable = !readOnly }
        editor.setAccessibilityIdentifier(self.context.string("accessibility-identifier"))
        services.views[self.context.nodeID] = WeakView(editor)
    }
    @MainActor final class Coordinator: NSObject, NSTextViewDelegate {
        var parent: CodeEditor
        init(_ parent: CodeEditor) { self.parent = parent }
        func textDidChange(_ notification: Notification) {
            guard let editor = notification.object as? NSTextView else { return }
            parent.services.perform { try parent.context.emit(name: "cm-event", values: ["name": .string("change"), "value": .string(editor.string)]) }
        }
    }
}

func nativeKey(_ event: NSEvent) -> String {
    switch event.keyCode {
    case 36, 76: "Enter"; case 48: "Tab"; case 51: "Backspace"; case 53: "Escape"; case 117: "Delete"
    case 123: "ArrowLeft"; case 124: "ArrowRight"; case 125: "ArrowDown"; case 126: "ArrowUp"
    case 115: "Home"; case 119: "End"; case 116: "PageUp"; case 121: "PageDown"
    case 122: "F1"; case 120: "F2"; case 99: "F3"; case 118: "F4"; case 96: "F5"; case 97: "F6"
    case 98: "F7"; case 100: "F8"; case 101: "F9"; case 109: "F10"; case 103: "F11"; case 111: "F12"
    case 105: "F13"; case 107: "F14"; case 113: "F15"; case 106: "F16"; case 64: "F17"; case 79: "F18"; case 80: "F19"; case 90: "F20"
    default: event.charactersIgnoringModifiers ?? ""
    }
}
func nativeCode(_ event: NSEvent) -> String {
    physicalKeyCodes[event.keyCode] ?? nativeKey(event)
}

// DOM code describes the physical key, independent of the keyboard layout.
private let physicalKeyCodes: [UInt16: String] = [
    0: "KeyA", 1: "KeyS", 2: "KeyD", 3: "KeyF", 4: "KeyH", 5: "KeyG", 6: "KeyZ", 7: "KeyX", 8: "KeyC", 9: "KeyV",
    10: "IntlBackslash", 11: "KeyB", 12: "KeyQ", 13: "KeyW", 14: "KeyE", 15: "KeyR", 16: "KeyY", 17: "KeyT",
    18: "Digit1", 19: "Digit2", 20: "Digit3", 21: "Digit4", 22: "Digit6", 23: "Digit5", 24: "Equal", 25: "Digit9",
    26: "Digit7", 27: "Minus", 28: "Digit8", 29: "Digit0", 30: "BracketRight", 31: "KeyO", 32: "KeyU", 33: "BracketLeft",
    34: "KeyI", 35: "KeyP", 37: "KeyL", 38: "KeyJ", 39: "Quote", 40: "KeyK", 41: "Semicolon", 42: "Backslash",
    43: "Comma", 44: "Slash", 45: "KeyN", 46: "KeyM", 47: "Period", 49: "Space", 50: "Backquote",
    65: "NumpadDecimal", 67: "NumpadMultiply", 69: "NumpadAdd", 71: "NumLock", 75: "NumpadDivide", 76: "NumpadEnter",
    78: "NumpadSubtract", 81: "NumpadEqual", 82: "Numpad0", 83: "Numpad1", 84: "Numpad2", 85: "Numpad3", 86: "Numpad4",
    87: "Numpad5", 88: "Numpad6", 89: "Numpad7", 91: "Numpad8", 92: "Numpad9"
]
