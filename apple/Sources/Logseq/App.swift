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

@main struct LogseqApplication: App {
  @NSApplicationDelegateAdaptor(LogseqApplicationDelegate.self) private var delegate
  @StateObject private var appState = LogseqAppState.shared

  var body: some Scene {
    Window("Logseq", id: "main") {
      LogseqHost()
        .frame(minWidth: 480, minHeight: 360)
    }
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
        .keyboardShortcut("l", modifiers: [.command, .shift])
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
          GeometryReader { geo in
            LUISwiftUIRoot(backend: runtime.backend, rootID: rootID)
              // Electron zoomin/zoomout semantics: the LUI surface lays out
              // on a smaller/larger logical area, then magnifies.
              .frame(
                width: geo.size.width / appState.zoomLevel,
                height: geo.size.height / appState.zoomLevel)
              .scaleEffect(appState.zoomLevel, anchor: .topLeading)
              .frame(width: geo.size.width, height: geo.size.height, alignment: .topLeading)
              .clipped()
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity)
          .overlay(alignment: .topLeading) {
            ZStack(alignment: .topLeading) {
              LogseqOverlayLayer()
              LogseqImperativeLayer()
            }
          }
          .coordinateSpace(name: "logseqWindow")
          .onPreferenceChange(LogseqFrameKey.self) {
            LogseqFrameStore.entries = $0
          }
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

@MainActor final class LogseqApplicationDelegate: NSObject, NSApplicationDelegate {
  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApplication.shared.activate()
    NSApplication.shared.windows.first?.makeKeyAndOrderFront(nil)
  }

  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

  func applicationWillTerminate(_ notification: Notification) {
    LogseqRuntime.terminateActive()
  }
  func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool { true }
}
