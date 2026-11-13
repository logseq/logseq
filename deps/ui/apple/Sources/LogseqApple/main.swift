import AppKit
import CoreText
import Darwin
import LUIAppleBackend
import SwiftUI

@MainActor
final class LogseqHost: NSObject, NSApplicationDelegate, NSWindowDelegate {
    let services = PlatformServices()
    var backend: LUIAppleBackend?
    var runtime: NativeRuntime?
    var window: NSWindow?
    var hostedRoot: Int?
    var monitor: Any?
    var input: InputRouter?
    var appearanceObserver: NSObjectProtocol?
    var closing = false
    var closeReady = false
    var quitting = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        do {
            try prepareEnvironment()
            let library = ProcessInfo.processInfo.environment["LOGSEQ_APPLE_LIBRARY"] ?? Bundle.main.bundleURL.appendingPathComponent("Contents/Resources/liblogseq_ui.dylib").path
            let runtime = try NativeRuntime(path: library)
            self.runtime = runtime; services.runtime = runtime
            input = InputRouter(services: services)
            services.onEditCommand = { [weak self] command in
                self?.services.perform { try self?.input?.command(command) }
            }
            try makeBackend()
            runtime.onPatch = { [weak self] json, snapshot in try self?.apply(json, snapshot: snapshot) }
            runtime.onRequest = { [weak self] request in try self?.services.handle(request) }
            runtime.onFailure = { [weak self] error in self?.fail(error) }
            services.onError = { [weak self] error in self?.fail(error) }
            services.onCloseReady = { [weak self] ok in
                guard let self, self.closing else { return }
                self.closing = false
                if ok {
                    self.closeReady = true
                    DispatchQueue.main.async { if self.quitting { NSApp.reply(toApplicationShouldTerminate: true) } else { self.window?.performClose(nil) } }
                } else if self.quitting { NSApp.reply(toApplicationShouldTerminate: false); self.quitting = false }
            }
            makeWindow()
            try runtime.start()
            try publishWindow()
            try publishAppearance()
            installMonitor()
            appearanceObserver = DistributedNotificationCenter.default().addObserver(forName: NSNotification.Name("AppleInterfaceThemeChangedNotification"), object: nil, queue: .main) { [weak self] _ in
                MainActor.assumeIsolated { self?.services.perform { try self?.publishAppearance() } }
            }
            window?.makeKeyAndOrderFront(nil); NSApp.activate()
            NSLog("Logseq Apple ready: %@", backend?.debugModelCounts ?? "no retained root")
        } catch { fail(error) }
    }

    func makeWindow() {
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1440, height: 900), styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView], backing: .buffered, defer: false)
        window.title = "Logseq"
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.toolbarStyle = .unifiedCompact
        window.minSize = NSSize(width: 720, height: 480)
        window.center(); window.delegate = self
        self.window = window; services.window = window
    }
    func makeBackend() throws {
        let backend = try LUIAppleBackend(extensionRegistry: logseqExtensions(services))
        self.backend?.onEvent = nil
        self.backend = backend
        backend.frameReportingEnabled = true
        backend.onFramesReport = { [weak self] frames in self?.services.frames = frames }
        backend.onEvent = { [weak self] event in self?.services.perform { try self?.runtime?.dispatch(event) } }
    }
    func apply(_ json: String, snapshot: Bool) throws {
        if let path = ProcessInfo.processInfo.environment["LOGSEQ_APPLE_TRACE_PATCHES"] {
            try Data(json.utf8).write(to: URL(fileURLWithPath: path), options: .atomic)
        }
        guard let data = json.data(using: .utf8), let batches = try JSONSerialization.jsonObject(with: data) as? [[String: Any]] else { throw HostError("Runtime patch callback must be a batch array") }
        if snapshot {
            // The pinned Apple backend predates applySnapshot. A new retained
            // tree accepts the authoritative snapshot's repeated generation.
            try makeBackend()
            hostedRoot = nil
            services.resetPresentation()
        }
        let rawBatches = try rawPatchBatches(json)
        guard rawBatches.count == batches.count else { throw HostError("Patch batch boundary mismatch") }
        do {
            for (raw, batch) in zip(rawBatches, batches) {
                try backend?.apply(json: raw); services.applied(batch)
            }
        } catch {
            NSLog("Logseq Apple backend refused patch (snapshot=%@): %@", String(snapshot), String(describing: error))
            guard !snapshot else { throw error }
            try runtime?.resync()
            return
        }
        guard let backend, let root = backend.rootIDs.first else { return }
        if hostedRoot != root {
            hostedRoot = root
            window?.contentView = NSHostingView(rootView: HostRoot(backend: backend, root: root, services: services))
        }
        services.performanceText = backend.debugModelCounts
    }
    func publishWindow() throws {
        guard let window, let content = window.contentView else { return }
        try runtime?.send("window-size", ["width": content.bounds.width, "height": content.bounds.height])
        let buttons: [NSWindow.ButtonType] = [.closeButton, .miniaturizeButton, .zoomButton]
        let left = buttons.compactMap { window.standardWindowButton($0) }.map { $0.convert($0.bounds, to: content).maxX }.max() ?? 0
        try runtime?.send("window-titlebar", ["height": content.bounds.height - window.contentLayoutRect.height, "left": left + 12, "right": 0.0])
    }
    func publishAppearance() throws {
        let mode = NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua ? "dark" : "light"
        try runtime?.send("appearance", ["dark": mode == "dark"])
    }
    func windowDidResize(_ notification: Notification) { services.perform { try publishWindow() } }
    func windowDidResignKey(_ notification: Notification) { services.perform { try input?.blur() } }
    func windowShouldClose(_ sender: NSWindow) -> Bool {
        if closeReady { return true }
        requestClose(); return false
    }
    func requestClose() {
        guard !closing else { return }
        closing = true
        services.perform { try runtime?.send("window-close-request", [:] as [String: String]) }
    }
    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        guard runtime?.started == true, !closeReady else { return .terminateNow }
        quitting = true; requestClose(); return .terminateLater
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
    func applicationWillTerminate(_ notification: Notification) {
        if let monitor { NSEvent.removeMonitor(monitor) }
        if let appearanceObserver { DistributedNotificationCenter.default().removeObserver(appearanceObserver) }
        services.close()
        do { try runtime?.stop() } catch { NSLog("Logseq Apple stop error: %@", String(describing: error)) }
        NSLog("Logseq Apple stopped")
    }
    func fail(_ error: Error) {
        NSLog("Logseq Apple FATAL: %@", String(describing: error))
        services.close(); try? runtime?.stop()
        // Startup errors must also be visible when launched from Finder.
        let alert = NSAlert(); alert.alertStyle = .critical; alert.messageText = "Logseq"; alert.informativeText = String(describing: error); alert.runModal()
        exit(EXIT_FAILURE)
    }

    func installMonitor() {
        window?.acceptsMouseMovedEvents = true
        monitor = NSEvent.addLocalMonitorForEvents(matching: [.keyDown, .keyUp, .leftMouseDown, .leftMouseUp, .rightMouseDown, .rightMouseUp, .otherMouseDown, .otherMouseUp, .mouseMoved, .leftMouseDragged, .rightMouseDragged, .otherMouseDragged, .scrollWheel]) { [weak self] event in
            guard let self, event.window === self.window, self.runtime?.started == true else { return event }
            do {
                if try self.input?.capture(event) == true { return nil }
                return event
            } catch { self.fail(error); return nil }
        }
    }
}

@MainActor
struct HostRoot: View {
    let backend: LUIAppleBackend
    let root: Int
    let services: PlatformServices
    @Environment(\.colorScheme) private var systemScheme
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            LUISwiftUIRoot(backend: backend, rootID: root)
                .luiSemanticColors(services.themeColors(systemScheme))
            if services.performanceVisible {
                Text(services.performanceText).font(.system(size: 11, design: .monospaced)).padding(8).background(.regularMaterial).padding(8)
            }
        }
        .preferredColorScheme(services.preferredScheme)
        .ignoresSafeArea(.container, edges: .top)
        .environment(\.locale, Locale(identifier: services.uiState["lang"] as? String ?? "en"))
    }
}

func prepareEnvironment() throws {
    let env = ProcessInfo.processInfo.environment
    guard let home = env["HOME"], !home.isEmpty else { throw HostError("HOME is required") }
    let executable = URL(fileURLWithPath: CommandLine.arguments[0]).standardizedFileURL
    let resources = executable.deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("Resources").path
    let defaults = ["LOGSEQ_ROOT_DIR": home + "/logseq", "LOGSEQ_UI_STATE_DIR": home + "/Library/Application Support/logseq", "LOGSEQ_NATIVE_ASSET_DIR": resources, "LOGSEQ_DB_WORKER_BIN": resources + "/logseq-db-worker"]
    for (name, value) in defaults {
        let path = env[name] ?? value
        guard !path.isEmpty else { throw HostError("\(name) must not be empty") }
        let absolute = URL(fileURLWithPath: path).standardizedFileURL.path
        guard setenv(name, absolute, 1) == 0 else { throw HostError("Could not set \(name)") }
    }
    if let graphs = env["LOGSEQ_GRAPHS_DIR"], graphs.isEmpty { throw HostError("LOGSEQ_GRAPHS_DIR must not be empty") }
    let assets = String(cString: getenv("LOGSEQ_NATIVE_ASSET_DIR"))
    var directory: ObjCBool = false
    guard FileManager.default.fileExists(atPath: assets, isDirectory: &directory), directory.boolValue else { throw HostError("Native asset directory does not exist: \(assets)") }
    for face in ["Regular", "Italic", "Light", "Medium", "MediumItalic", "SemiBold", "SemiBoldItalic", "Bold", "BoldItalic"] {
        let url = URL(fileURLWithPath: assets).appendingPathComponent("fonts/Inter-\(face).ttf")
        var error: Unmanaged<CFError>?
        guard CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error) else { throw HostError("Font registration failed: \(url.lastPathComponent)") }
    }
}

let application = NSApplication.shared
let delegate = LogseqHost()
application.setActivationPolicy(.regular)
application.delegate = delegate
application.run()
