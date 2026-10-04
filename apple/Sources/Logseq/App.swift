import LUIAppleBackend
import SwiftUI
import OSLog
import AppKit

/// Menu-driven app chrome state (Electron viewMenu/windowMenu parity).
@MainActor final class LogseqAppState: ObservableObject {
  static let shared = LogseqAppState()
  /// Electron zoomin/zoomout/resetzoom: scales the whole LUI surface.
  @Published var zoomLevel = 1.0
  /// Electron "Always on Top" checkbox: floats the key window.
  @Published var alwaysOnTop = false {
    didSet {
      NSApp.keyWindow?.level = alwaysOnTop ? .floating : .normal
    }
  }

  /// Incremented when the OCaml ui-state broadcast changes the app
  /// appearance override — the root view reads this so every
  /// LogseqColors.isDark-derived color recomputes on theme flips.
  @Published var appearanceVersion = 0

  static let zoomSteps: [Double] = [0.5, 0.67, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0]

  func zoomIn() {
    zoomLevel = Self.zoomSteps.first { $0 > zoomLevel + 0.001 } ?? zoomLevel
  }

  func zoomOut() {
    zoomLevel = Self.zoomSteps.last { $0 < zoomLevel - 0.001 } ?? zoomLevel
  }

  func zoomReset() { zoomLevel = 1.0 }
}

/// LOGSEQ_PERF=1: CADisplayLink frame sampler — logs rolling fps + the
/// worst frame delta every 2s to stderr so 60/120fps claims can be
/// verified on real hardware. Offline by default; zero cost when unset.
@MainActor final class LogseqPerfMonitor {
  static let shared = LogseqPerfMonitor()
  private var link: CADisplayLink?
  private var last: CFTimeInterval = 0
  private var deltas: [CFTimeInterval] = []

  func start() {
    // LOGSEQ_PERF_PROBES: msg-generating probes (displaylink/hb/timers)
    // — they flood the runloop waitset queue and skew delivery latency
    // measurements, so they're a separate gate from LOGSEQ_PERF.
    guard ProcessInfo.processInfo.environment["LOGSEQ_PERF_PROBES"] != nil,
      link == nil
    else { return }
    guard
      let l = NSScreen.main?.displayLink(
        target: self, selector: #selector(tick(_:)))
    else { return }
    l.add(to: .main, forMode: .common)
    link = l
  }

  @objc private func tick(_ link: CADisplayLink) {
    if last > 0 { deltas.append(link.timestamp - last) }
    last = link.timestamp
    let interval = max(link.targetTimestamp - link.timestamp, 0.001)
    guard deltas.count >= Int(2.0 / interval) else { return }
    let fps = 1.0 / (deltas.reduce(0, +) / Double(deltas.count))
    let worst = deltas.max() ?? 0
    FileHandle.standardError.write(
      String(
        format: "PERF fps=%.1f worst=%.1fms frames=%d\n",
        fps, worst * 1000, deltas.count
      ).data(using: .utf8)!)
    deltas.removeAll(keepingCapacity: true)
  }

  /// GCD heartbeat: self-rescheduling main.async — measures how long the
  /// main queue actually takes to service items vs the nominal 50ms, so a
  /// starved serial queue is distinguishable from a busy main thread.
  private var hbLast: CFAbsoluteTime = 0
  func heartbeat() {
    guard ProcessInfo.processInfo.environment["LOGSEQ_PERF"] != nil else {
      return
    }
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let now = CFAbsoluteTimeGetCurrent()
      if self.hbLast > 0, now - self.hbLast > 0.25 {
        FileHandle.standardError.write(
          String(format: "PERF hb t=%.3f gap=%dms\n", now, Int((now - self.hbLast) * 1000))
            .data(using: .utf8)!)
      }
      self.hbLast = now
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
        self?.heartbeat()
      }
    }
  }
}

@main struct LogseqApplication: App {
  @NSApplicationDelegateAdaptor(LogseqApplicationDelegate.self) private var delegate
  @StateObject private var appState = LogseqAppState.shared

  var body: some Scene {
    Window("Logseq", id: "main") {
      LogseqHost()
        .frame(minWidth: 480, minHeight: 360)
    }
    // No titlebar text — the toolbar breadcrumb carries the page name;
    // "Logseq" stays only in the Window menu.
    .windowToolbarStyle(.unified(showsTitle: false))
    .defaultSize(width: 1200, height: 800)
    .commands {
      // macOS convention places Settings in the app menu; the web app
      // binds the same action to mod+,.
      CommandGroup(replacing: .appSettings) {
        Button("Settings…") {
          LogseqRuntime.postPlatformEvent(name: "menu-open-settings", json: "{}")
        }
        .keyboardShortcut(",", modifiers: .command)
      }
      // Electron File menu's close role (⌘W). Contributing to .newItem
      // is what makes the system render a File menu for a non-document
      // app; the system adds its own Close/Close All items alongside.
      CommandGroup(replacing: .newItem) {
        Button("Close Window") {
          NSApp.keyWindow?.performClose(nil)
        }
        .keyboardShortcut("w", modifiers: .command)
      }
      CommandGroup(after: .sidebar) {
        Button("Toggle Left Sidebar") {
          LogseqRuntime.postPlatformEvent(
            name: "menu-toggle-left-sidebar", json: "{}")
        }
        .keyboardShortcut("s", modifiers: [.control, .command])
        Button("Toggle Right Sidebar") {
          LogseqRuntime.postPlatformEvent(
            name: "menu-toggle-right-sidebar", json: "{}")
        }
        .keyboardShortcut("r", modifiers: [.command, .shift])
        Button("Toggle Wide Mode") {
          LogseqRuntime.postPlatformEvent(
            name: "menu-toggle-wide-mode", json: "{}")
        }
        Divider()
        Button("Zoom In") { appState.zoomIn() }
          .keyboardShortcut("=", modifiers: .command)
        Button("Zoom Out") { appState.zoomOut() }
          .keyboardShortcut("-", modifiers: .command)
        Button("Actual Size") { appState.zoomReset() }
          .keyboardShortcut("0", modifiers: .command)
      }
      CommandGroup(before: .windowList) {
        Toggle("Always on Top", isOn: $appState.alwaysOnTop)
      }
      CommandGroup(replacing: .help) {
        Button("Keyboard Shortcuts") {
          LogseqRuntime.postPlatformEvent(
            name: "menu-open-settings", json: "{\"tab\":\"keymap\"}")
        }
        Button("Logseq Documentation") {
          if let url = URL(string: "https://docs.logseq.com") {
            NSWorkspace.shared.open(url)
          }
        }
      }
    }
  }
}

private struct LogseqHost: View {
  @State private var setup: Result<LUIAppleExtensionRegistry, Error>?
  @State private var retry = 0

  var body: some View {
    Group {
      switch setup {
      case .none:
        ProgressView("Opening Logseq")
      case .failure(let error):
        ContentUnavailableView {
          Label("Unable to start", systemImage: "exclamationmark.triangle")
        } description: {
          Text(error.localizedDescription)
        } actions: {
          Button("Retry") { setup = nil; retry += 1 }
        }
      case .success(let extensions):
        LogseqRuntimeHost(extensions: extensions)
      }
    }
    .task(id: retry) {
      if setup == nil {
        setup = Result { try LogseqExtensions.registry() }
      }
    }
  }
}

/// Boots one LogseqRuntime and renders the LUI root.
private struct LogseqRuntimeHost: View {
  let extensions: LUIAppleExtensionRegistry
  @State private var runtime: LogseqRuntime?
  @ObservedObject private var appState = LogseqAppState.shared

  @ObservedObject private var sidebarStore = LogseqSidebarStore.shared
  @State private var columnVis: NavigationSplitViewVisibility = .all

  var body: some View {
    Group {
      if let runtime, let rootID = runtime.rootID {
        // Out parity: the sidebar is a real NavigationSplitView column —
        // macOS then supplies the system toggle button, translucent
        // sidebar material, native resize/collapse, and the leading
        // toolbar section the .navigation items need.
        NavigationSplitView(columnVisibility: $columnVis) {
          Group {
            if let ctx = sidebarStore.context {
              LogseqNativeSidebar(context: ctx)
                .id(ctx.nodeID)
            }
          }
          .navigationSplitViewColumnWidth(min: 200, ideal: 246, max: 400)
        } detail: {
          Group {
            if appState.zoomLevel == 1.0 {
              // Plain path: GeometryReader could latch a 0×0 proposal
              // while NavigationSplitView settles its columns, leaving the
              // whole surface blank until a manual resize re-proposed.
              LUISwiftUIRoot(backend: runtime.backend, rootID: rootID)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            } else {
              GeometryReader { geo in
                LUISwiftUIRoot(backend: runtime.backend, rootID: rootID)
                  // Electron zoomin/zoomout semantics: the LUI surface lays
                  // out on a smaller/larger logical area, then magnifies.
                  .frame(
                    width: geo.size.width / appState.zoomLevel,
                    height: geo.size.height / appState.zoomLevel)
                  .scaleEffect(appState.zoomLevel, anchor: .topLeading)
                  .frame(width: geo.size.width, height: geo.size.height, alignment: .topLeading)
                  .clipped()
              }
            }
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
          .overlay(alignment: .topLeading) {
            ZStack(alignment: .topLeading) {
              LogseqOverlayLayer()
              LogseqImperativeLayer()
            }
          }
          .coordinateSpace(name: "logseqWindow")
          // File drop → asset upload: OCaml's window "file-drop"
          // listener mirrors the web file-picker path
          // (db-based-save-assets! writes assets/<uuid>.<ext> +
          // insert-blocks).
          .onDrop(of: [.fileURL], isTargeted: nil) { providers in
            let group = DispatchGroup()
            let lock = NSLock()
            var paths: [String] = []
            for provider in providers {
              group.enter()
              _ = provider.loadObject(ofClass: URL.self) { url, _ in
                if let url {
                  lock.lock()
                  paths.append(url.path)
                  lock.unlock()
                }
                group.leave()
              }
            }
            group.notify(queue: .main) {
              guard !paths.isEmpty,
                let data = try? JSONSerialization.data(
                  withJSONObject: ["paths": paths]),
                let json = String(data: data, encoding: .utf8)
              else { return }
              runtime.sendPlatformEvent(name: "file-drop", json: json)
            }
            return true
          }
        }
        .onAppear {
          columnVis = sidebarStore.open ? .all : .detailOnly
        }
        .onChange(of: sidebarStore.open) { _, open in
          columnVis = open ? .all : .detailOnly
        }
        .onChange(of: columnVis) { _, vis in
          // User toggled via the system button / drag — mirror the DOM
          // model through the same platform event the menu item sends.
          if (vis != .detailOnly) != sidebarStore.open {
            runtime.sendPlatformEvent(
              name: "menu-toggle-left-sidebar", json: "{}")
          }
        }
      } else {
        ProgressView("Opening Logseq")
      }
    }
    .task {
      if runtime == nil {
        do {
          let next = try LogseqRuntime(extensionRegistry: extensions)
          next.start()
          runtime = next
        } catch {
          Logger(subsystem: "com.logseq.native", category: "runtime")
            .error("Unable to start runtime: \(error)")
        }
      }
    }
    .onDisappear { runtime?.stop() }
  }
}

private final class ModeBox: @unchecked Sendable {
  var value = ""
  nonisolated(unsafe) static var lastTick: CFAbsoluteTime = 0
  static func timerTick(tag: String = "def") {
    let now = CFAbsoluteTimeGetCurrent()
    if lastTick > 0, now - lastTick > 0.25 {
      FileHandle.standardError.write(
        "PERF rltick t=\(now) gap=\(Int((now - lastTick) * 1000))ms timer=\(tag) mode=\(CFRunLoopCopyCurrentMode(CFRunLoopGetMain())?.rawValue as String? ?? "?")\n"
          .data(using: .utf8)!)
    }
    lastTick = now
  }
}

@MainActor final class LogseqApplicationDelegate: NSObject, NSApplicationDelegate {
  func applicationDidFinishLaunching(_ notification: Notification) {
    // stderr is unreachable under a launchd `open`; LOGSEQ_PERF_FILE dup2s
    // fd 2 onto a path so perf/DBG output (Swift + OCaml eprintf alike)
    // lands in a file without giving up proper event delivery.
    if let logPath = ProcessInfo.processInfo.environment["LOGSEQ_PERF_FILE"] {
      let fd = open(logPath, O_WRONLY | O_CREAT | O_APPEND, 0o644)
      if fd >= 0 {
        dup2(fd, STDERR_FILENO)
        close(fd)
      }
    }
    NSApplication.shared.activate()
    NSApplication.shared.windows.first?.makeKeyAndOrderFront(nil)
    LogseqPerfMonitor.shared.start()
    if ProcessInfo.processInfo.environment["LOGSEQ_PERF_PROBES"] != nil {
      LogseqPerfMonitor.shared.heartbeat()
    }
    if ProcessInfo.processInfo.environment["LOGSEQ_PERF"] != nil {
      // Phase observer: every runloop activity transition — shows whether
      // a stall is a parked wait or a busy loop, and where time goes.
      let obs = CFRunLoopObserverCreateWithHandler(
        nil, CFRunLoopActivity.allActivities.rawValue, true, 0
      ) { _, activity in
        let name: String
        switch activity {
        case .entry: name = "entry"
        case .beforeTimers: name = "beforeTimers"
        case .beforeSources: name = "beforeSources"
        case .beforeWaiting: name = "beforeWaiting"
        case .afterWaiting: name = "afterWaiting"
        case .exit: name = "exit"
        default: name = "?"
        }
        FileHandle.standardError.write(
          "PERF rlphase t=\(CFAbsoluteTimeGetCurrent()) a=\(name) mode=\(CFRunLoopCopyCurrentMode(CFRunLoopGetMain())?.rawValue as String? ?? "?")\n"
            .data(using: .utf8)!)
      }
      CFRunLoopAddObserver(CFRunLoopGetMain(), obs, .commonModes)
    }
    if ProcessInfo.processInfo.environment["LOGSEQ_PERF_PROBES"] != nil {
      let lastMode = ModeBox()
      let obs = CFRunLoopObserverCreateWithHandler(
        nil, CFRunLoopActivity.entry.rawValue, true, 0
      ) { _, activity in
        let mode = CFRunLoopCopyCurrentMode(CFRunLoopGetMain())?.rawValue as String? ?? "?"
        guard mode != lastMode.value else { return }
        lastMode.value = mode
        FileHandle.standardError.write(
          "PERF rl-mode t=\(CFAbsoluteTimeGetCurrent()) mode=\(mode)\n"
            .data(using: .utf8)!)
      }
      CFRunLoopAddObserver(CFRunLoopGetMain(), obs, .commonModes)
      Timer.scheduledTimer(withTimeInterval: 0.05, repeats: true) { _ in
        ModeBox.timerTick()
      }
      for mode in [RunLoop.Mode.eventTracking, .modalPanel,
                   RunLoop.Mode(rawValue: "NSUnmodalRunLoopMode"),
                   RunLoop.Mode(rawValue: "NSConnectionReplyMode"),
                   RunLoop.Mode(rawValue: "NSConnectionReplyRemoteMode"),
                   RunLoop.Mode(rawValue: "kCFRunLoopDefaultMode")] {
        let name = mode.rawValue
        CFRunLoopAddTimer(CFRunLoopGetMain(),
          CFRunLoopTimerCreateWithHandler(nil, 0.05, 0.05, 0, 0) { _ in
            ModeBox.timerTick(tag: name)
          }, CFRunLoopMode(rawValue: mode.rawValue as CFString))
      }
    }
    if ProcessInfo.processInfo.environment["LOGSEQ_DEBUG_VIEWS"] != nil {
      for delay in [2.0, 8.0] {
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
          guard let w = NSApplication.shared.windows.first else { return }
          FileHandle.standardError.write(
            "PERF views t=\(delay)s window=\(w.frame)\n".data(using: .utf8)!)
          Self.dumpView(w.contentView, depth: 0)
        }
      }
    }
  }

  private static func dumpView(_ v: NSView?, depth: Int) {
    guard let v, depth < 14 else { return }
    let cls = String(describing: type(of: v))
      .replacingOccurrences(of: #"<.+?>"#, with: "<T>", options: .regularExpression)
    FileHandle.standardError.write(
      "PERF view-tree \(String(repeating: " ", count: depth))\(cls) \(v.frame) hidden=\(v.isHidden)\n"
        .data(using: .utf8)!)
    for sub in v.subviews { dumpView(sub, depth: depth + 1) }
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

  func applicationWillTerminate(_ notification: Notification) {
    LogseqRuntime.terminateActive()
  }
  func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool { true }
}
