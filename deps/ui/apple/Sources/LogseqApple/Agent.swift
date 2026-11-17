import AppKit
import LUIAppleBackend
import SwiftUI

@MainActor
func hostTiming(_ name: String) -> () -> Void {
    guard ProcessInfo.processInfo.environment["LOGSEQ_APPLE_PERF"] == "1" else { return {} }
    let start = ProcessInfo.processInfo.systemUptime
    return {
        let end = ProcessInfo.processInfo.systemUptime
        RenderTrace.shared.record(name, start: start, end: end)
        let elapsed = (end - start) * 1000
        if elapsed >= 1 {
            NSLog("[apple-perf] %@ %.3fms t=%.6f", name, elapsed, Date.timeIntervalSinceReferenceDate + 978307200)
        }
    }
}

// Opt-in, non-observable measurements; these callbacks never request layout.
@MainActor
final class RenderTrace {
    static let shared = RenderTrace()
    private var observers: [CFRunLoopObserver] = []
    private var origin = 0.0
    private var originUnix = 0.0
    private var deadline = 0.0
    private var awake: Double?
    private var events: [[String: Any]] = []

    private init() {
        guard ProcessInfo.processInfo.environment["LOGSEQ_APPLE_PERF"] == "1" else { return }
        for (activity, order) in [(CFRunLoopActivity.afterWaiting, Int.min), (.beforeWaiting, Int.max)] {
            let observer = CFRunLoopObserverCreateWithHandler(nil, activity.rawValue, true, order) { [weak self] _, phase in
                MainActor.assumeIsolated {
                    guard let self else { return }
                    let now = ProcessInfo.processInfo.systemUptime
                    if phase == .afterWaiting { self.awake = now }
                    else if let start = self.awake {
                        self.record("runloop.awake", start: start, end: now)
                        self.awake = nil
                    }
                }
            }!
            observers.append(observer)
            CFRunLoopAddObserver(CFRunLoopGetMain(), observer, .commonModes)
        }
    }

    func begin() {
        origin = ProcessInfo.processInfo.systemUptime
        originUnix = Date.timeIntervalSinceReferenceDate + 978307200
        deadline = origin + 1
        awake = origin
        events.removeAll(keepingCapacity: true)
    }

    func record(_ name: String, start: Double, end: Double) {
        guard start >= origin, start < deadline else { return }
        events.append(["name": name, "startMs": (start - origin) * 1000, "durationMs": (end - start) * 1000])
    }

    func finish() -> [String: Any] {
        let now = ProcessInfo.processInfo.systemUptime
        if let awake { record("runloop.awake", start: awake, end: now) }
        deadline = 0
        return ["originUnix": originUnix, "events": events]
    }
}

@MainActor
final class TracedHostingView<Content: View>: NSHostingView<Content> {
    override func updateConstraints() {
        let finish = hostTiming("host.constraints")
        defer { finish() }
        super.updateConstraints()
    }
    override func layout() {
        let finish = hostTiming("host.layout")
        defer { finish() }
        super.layout()
    }
    override func viewWillDraw() {
        let finish = hostTiming("host.willDraw")
        defer { finish() }
        super.viewWillDraw()
    }
    override func draw(_ dirtyRect: NSRect) {
        let finish = hostTiming("host.draw")
        defer { finish() }
        super.draw(dirtyRect)
    }
}

@MainActor
extension LogseqHost {
    func answerAgent(_ request: String) throws -> String {
        guard let runtime, runtime.started, let backend else { throw HostError("Agent runtime stopped") }
        let fields = try services.object(request)
        let finish = hostTiming("agent \(fields["op"] as? String ?? "?") \(fields["name"] as? String ?? "")")
        defer { finish() }
        switch fields["op"] as? String {
        case "host-native-click", "host-native-drag":
            let x: Double = try services.required(fields, "x")
            let y: Double = try services.required(fields, "y")
            guard let mainWindow = window else { throw HostError("Host window unavailable") }
            let target: NSWindow
            if fields["window"] != nil {
                let number: Int = try services.required(fields, "window")
                guard let selected = NSApp.windows.first(where: { $0.windowNumber == number && services.ownsInputWindow($0) }) else {
                    throw HostError("Input window is not owned by this host")
                }
                target = selected
            } else { target = mainWindow }
            guard let content = target.contentView else { throw HostError("Input window has no content") }
            let dragging = fields["op"] as? String == "host-native-drag"
            let endX: Double = dragging ? try services.required(fields, "toX") : x
            let endY: Double = dragging ? try services.required(fields, "toY") : y
            guard [x, y, endX, endY].allSatisfy({ $0.isFinite }),
                  content.bounds.contains(CGPoint(x: x, y: y)),
                  content.bounds.contains(CGPoint(x: endX, y: endY)) else {
                throw HostError("Input requires finite points inside the selected window")
            }
            var path: [(NSEvent.EventType, Double, Double)] = [(.leftMouseDown, x, y)]
            if dragging {
                for index in 1...4 {
                    let fraction = Double(index) / 4
                    path.append((.leftMouseDragged, x + (endX - x) * fraction, y + (endY - y) * fraction))
                }
            }
            path.append((.leftMouseUp, endX, endY))
            for (type, pointX, pointY) in path {
                let local = NSPoint(x: pointX, y: content.isFlipped ? pointY : content.bounds.height - pointY)
                let point = content.convert(local, to: nil)
                guard let event = NSEvent.mouseEvent(with: type, location: point, modifierFlags: [],
                    timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: target.windowNumber,
                    context: nil, eventNumber: 1, clickCount: 1, pressure: type == .leftMouseUp ? 0 : 1) else {
                    throw HostError("AppKit could not create the pointer event")
                }
                NSApp.postEvent(event, atStart: false)
            }
            return #"{"ok":true,"dispatched":true}"#
        case "host-native-state":
            guard let window, let content = window.contentView else { throw HostError("Host window unavailable") }
            func rect(_ value: CGRect) -> [String: CGFloat] {
                ["x": value.minX, "y": value.minY, "width": value.width, "height": value.height]
            }
            func describe(_ view: NSView) -> [String: Any] {
                let frame = view.convert(view.bounds, to: content)
                let topLeft = content.isFlipped ? frame : CGRect(x: frame.minX,
                    y: content.bounds.height - frame.maxY, width: frame.width, height: frame.height)
                return ["class": String(describing: type(of: view)), "frame": rect(topLeft),
                        "identifier": view.accessibilityIdentifier(), "hidden": view.isHiddenOrHasHiddenAncestor]
            }
            var scrolls: [[String: Any]] = []
            func walk(_ view: NSView) {
                if let scroll = view as? NSScrollView {
                    var entry = describe(scroll)
                    entry["clip"] = rect(scroll.contentView.bounds)
                    entry["document"] = scroll.documentView.map { rect($0.frame) } ?? [:]
                    entry["verticalScroller"] = scroll.verticalScroller.map { scroller -> [String: Any] in
                        var value = describe(scroller)
                        let knob = scroller.convert(scroller.rect(for: .knob), to: content)
                        value["knob"] = rect(content.isFlipped ? knob : CGRect(x: knob.minX,
                            y: content.bounds.height - knob.maxY, width: knob.width, height: knob.height))
                        value["value"] = scroller.doubleValue
                        value["knobProportion"] = scroller.knobProportion
                        value["enabled"] = scroller.isEnabled
                        return value
                    } ?? [:]
                    scrolls.append(entry)
                }
                for child in view.subviews { walk(child) }
            }
            walk(content)
            var hit: [[String: Any]] = []
            if let x = fields["x"] as? Double, let y = fields["y"] as? Double {
                let point = NSPoint(x: x, y: content.isFlipped ? y : content.bounds.height - y)
                let parentPoint = content.convert(point, to: content.superview)
                var current = content.hitTest(parentPoint)
                while let view = current {
                    hit.append(describe(view)); current = view.superview
                }
            }
            return try jsonString(["ok": true, "scrolls": scrolls, "hit": hit,
                "windows": NSApp.windows.filter { services.ownsInputWindow($0) }.map {
                    ["number": $0.windowNumber, "class": String(describing: type(of: $0)), "visible": $0.isVisible, "frame": rect($0.frame)]
                }])
        case "host-trace-begin":
            RenderTrace.shared.begin()
            return #"{"ok":true}"#
        case "host-trace-end":
            return try jsonString(["ok": true, "trace": RenderTrace.shared.finish()])
        case "host-resync":
            try runtime.resync()
            try runtime.drain()
            return #"{"ok":true}"#
        case "host-commit":
            guard let window else { throw HostError("Host window unavailable") }
            window.layoutIfNeeded()
            window.displayIfNeeded()
            return #"{"ok":true}"#
        case "host-scroll":
            let node: Int = try services.required(fields, "node")
            let top: Double = try services.required(fields, "top")
            guard top.isFinite else { throw HostError("Scroll offset must be finite") }
            let moved = backend.setScrollTop(nodeID: node, top: top)
            return try jsonString(["ok": true, "moved": moved])
        case "host-resize":
            let width: Double = try services.required(fields, "width")
            let height: Double = try services.required(fields, "height")
            guard width.isFinite, height.isFinite, width > 0, height > 0,
                  let window, let content = window.contentView else {
                throw HostError("Resize requires positive finite dimensions and mounted content")
            }
            window.setContentSize(CGSize(width: width, height: height))
            window.layoutIfNeeded()
            return try jsonString(["ok": true, "width": content.bounds.width, "height": content.bounds.height])
        case "host-document":
            let name: String = try services.required(fields, "name")
            let payload: [String: Any] = try services.required(fields, "payload")
            let prevented = try runtime.document(name, payload)
            return try jsonString(["ok": true, "prevented": prevented])
        case "host-quit":
            onMainRunLoop { NSApp.terminate(nil) }
            return #"{"ok":true}"#
        case "host-state":
            return try jsonString([
                "ok": true, "pid": ProcessInfo.processInfo.processIdentifier,
                "generation": backend.generation,
                "frames": services.frames.count,
                "focusIntents": services.focusIntents,
                "focusTimes": services.editorFocusTimes,
                "requestTimes": services.editorRequestTimes,
                "mountTimes": services.editorMountTimes,
                "attachTimes": services.editorAttachTimes,
                "editors": services.editors.compactMap { block, entry -> [String: Any]? in
                    guard let view = entry.value else { return nil }
                    return ["block": block, "attached": view.window != nil,
                            "focused": view.window?.firstResponder === view,
                            "width": view.bounds.width, "height": view.bounds.height]
                },
            ])
        case "host-geometry":
            let node: Int = try services.required(fields, "node")
            func rect(_ value: CGRect?) -> Any {
                guard let value else { return NSNull() }
                return ["x": value.minX, "y": value.minY, "width": value.width, "height": value.height]
            }
            return try jsonString(["ok": true, "frame": rect(services.frames[node]),
                                   "textFrame": rect(backend.textGeometry(nodeID: node)?.frame)])
        case "host-screenshot":
            let path: String = try services.required(fields, "path")
            guard path.hasPrefix("/"), let view = window?.contentView else {
                throw HostError("Screenshot requires an absolute path and mounted content")
            }
            view.layoutSubtreeIfNeeded()
            guard let bitmap = view.bitmapImageRepForCachingDisplay(in: view.bounds) else {
                throw HostError("App content bitmap is unavailable")
            }
            view.cacheDisplay(in: view.bounds, to: bitmap)
            guard let data = bitmap.representation(using: .png, properties: [:]) else {
                throw HostError("App content PNG encoding failed")
            }
            try data.write(to: URL(fileURLWithPath: path))
            return try jsonString(["ok": true, "path": path, "width": bitmap.pixelsWide, "height": bitmap.pixelsHigh])
        default:
            let start = Date.timeIntervalSinceReferenceDate + 978307200
            let result = try runtime.agent(request)
            guard ProcessInfo.processInfo.environment["LOGSEQ_APPLE_PERF"] == "1" else { return result }
            var reply = try services.object(result)
            reply["hostStart"] = start
            reply["hostFinish"] = Date.timeIntervalSinceReferenceDate + 978307200
            return try jsonString(reply)
        }
    }
}
