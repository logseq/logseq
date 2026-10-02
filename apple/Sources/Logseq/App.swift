import LUIAppleBackend
import SwiftUI
import OSLog
import AppKit

@main struct LogseqApplication: App {
  @NSApplicationDelegateAdaptor(LogseqApplicationDelegate.self) private var delegate

  var body: some Scene {
    Window("Logseq", id: "main") {
      LogseqHost()
        .frame(minWidth: 480, minHeight: 360)
    }
    .defaultSize(width: 1200, height: 800)
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

  var body: some View {
    Group {
      if let runtime, let rootID = runtime.rootID {
        LUISwiftUIRoot(backend: runtime.backend, rootID: rootID)
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
  func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool { true }
}
