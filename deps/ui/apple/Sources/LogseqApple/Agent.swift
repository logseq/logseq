import AppKit
import LUIAppleBackend

func hostTiming(_ name: String) -> () -> Void {
    guard ProcessInfo.processInfo.environment["LOGSEQ_APPLE_PERF"] == "1" else { return {} }
    let start = ProcessInfo.processInfo.systemUptime
    return {
        let elapsed = (ProcessInfo.processInfo.systemUptime - start) * 1000
        if elapsed >= 1 {
            NSLog("[apple-perf] %@ %.3fms t=%.6f", name, elapsed, Date.timeIntervalSinceReferenceDate + 978307200)
        }
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
        case "host-resync":
            try runtime.resync()
            try runtime.drain()
            return #"{"ok":true}"#
        case "host-commit":
            guard let window else { throw HostError("Host window unavailable") }
            window.layoutIfNeeded()
            window.displayIfNeeded()
            return #"{"ok":true}"#
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
