import Foundation
import LUIAppleBackend
import Observation

/// C bridge entries exported by deps/ui/apple/logseq_lui_bridge.c. Every entry
/// that produces a patch emits it synchronously through the patch callback
/// installed at start; all entries are invoked on the main actor, which owns
/// the OCaml runtime started by `lui_ocaml_start` on this thread.
private typealias PatchCallback = @convention(c) (UnsafePointer<CChar>?) -> Void
private typealias WakeupCallback = @convention(c) () -> Void
private typealias PlatformRequestCallback =
  @convention(c) (UnsafePointer<CChar>?, Int32) -> Void

@_silgen_name("lui_ocaml_start")
private func luiOCamlStart(
  _ callback: PatchCallback?,
  _ wakeupCallback: WakeupCallback?,
  _ platformRequestCallback: PlatformRequestCallback?,
  _ platform: Int32,
  _ host: Int32,
  _ payload: UnsafePointer<CChar>?,
  _ payloadLength: Int32
) -> Int32
@_silgen_name("lui_ocaml_stop")
private func luiOCamlStop() -> Int32
@_silgen_name("lui_ocaml_pump")
private func luiOCamlPump() -> Int32
@_silgen_name("lui_ocaml_platform_event")
private func luiOCamlPlatformEvent(
  _ data: UnsafePointer<CChar>?, _ length: Int32
) -> Int32
@_silgen_name("lui_ocaml_root_node")
private func luiOCamlRootNode() -> Int64

nonisolated(unsafe) private var activeRuntime: LogseqRuntime?

extension LogseqRuntime {
  /// Cmd+Q / window-close terminate: NSApplication does not run SwiftUI
  /// onDisappear, so the delegate stops the runtime here — this also
  /// SIGTERMs the spawned db-worker daemon so it releases the repo lock.
  @MainActor static func terminateActive() { activeRuntime?.stop() }
}

/// OCaml only invokes the patch callback from entries the host runs on the main
/// actor, so `assumeIsolated` holds by construction.
private let receivePatch: PatchCallback = { source in
  guard let source else { return }
  let json = String(cString: source)
  MainActor.assumeIsolated {
    activeRuntime?.apply(json: json)
  }
}

/// Fired on whichever OCaml worker thread enqueued cross-thread work; hop to
/// the main actor before draining the pump queue.
private let wakeup: WakeupCallback = {
  Task { @MainActor in
    activeRuntime?.pump()
  }
}

/// OCaml calls this on its app thread with a "<op>\n<payload>" envelope.
private let platformRequest: PlatformRequestCallback = { data, length in
  guard let data, length > 0 else { return }
  let text = String(decoding: Data(bytes: data, count: Int(length)), as: UTF8.self)
  MainActor.assumeIsolated {
    activeRuntime?.deliverPlatformRequest(text)
  }
}

/// Owns the lui backend and the OCaml runtime for one Logseq session.
@Observable @MainActor final class LogseqRuntime {
  let backend: LUIAppleBackend
  let platform: LogseqPlatform
  private(set) var rootID: Int?
  private(set) var appliedPatches = 0
  private var started = false

  init(extensionRegistry: LUIAppleExtensionRegistry) throws {
    platform = LogseqPlatform()
    backend = try LUIAppleBackend(
      appIcons: [:],
      extensionRegistry: extensionRegistry
    )
    backend.onEvent = { [weak self] event in self?.handle(event) }
    platform.runtime = self
  }

  func start() {
    guard !started else { return }
    activeRuntime = self
    var payload = Data()
    let accepted = payload.withUnsafeBytes { bytes in
      luiOCamlStart(
        receivePatch,
        wakeup,
        platformRequest,
        1, // MacOS
        2, // SwiftUIHost
        bytes.baseAddress?.assumingMemoryBound(to: CChar.self),
        Int32(bytes.count))
    }
    guard accepted == 1 else {
      activeRuntime = nil
      return
    }
    started = true
    platform.attach()
  }

  func stop() {
    guard started else { return }
    platform.detach()
    _ = luiOCamlStop()
    started = false
    activeRuntime = nil
  }

  private static let patchDumpPath: String? = {
    ProcessInfo.processInfo.environment["LOGSEQ_DUMP_PATCHES"]
  }()

  func apply(json: String) {
    if let path = Self.patchDumpPath {
      if let fh = FileHandle(forWritingAtPath: path)
        ?? (FileManager.default.createFile(atPath: path, contents: nil)
          ? FileHandle(forWritingAtPath: path) : nil)
      {
        fh.seekToEndOfFile()
        fh.write((json + "\n").data(using: .utf8)!)
        try? fh.close()
      }
    }
    // OCaml returns either one batch object or a JSON array of batches
    // queued during a single pump — apply each in order.
    var batches: [String] = [json]
    if json.hasPrefix("["),
      let data = json.data(using: .utf8),
      let array = try? JSONSerialization.jsonObject(with: data) as? [Any]
    {
      batches = array.compactMap { element in
        guard let serialized = try? JSONSerialization.data(withJSONObject: element)
        else { return nil }
        return String(data: serialized, encoding: .utf8)
      }
    }
    for batch in batches {
      do {
        try backend.apply(json: batch)
        rootID = backend.rootIDs.first
        appliedPatches += 1
      } catch {
        NSLog("LUI patch apply failed: \(error)")
      }
    }
  }

  func pump() {
    guard started else { return }
    _ = luiOCamlPump()
  }

  /// "<op>\n<payload>" envelopes from OCaml's Host.host_op.
  func deliverPlatformRequest(_ text: String) {
    guard started else { return }
    let split = text.split(separator: "\n", maxSplits: 1, omittingEmptySubsequences: false)
    let op = String(split.first ?? "")
    let payload = split.count > 1 ? String(split[1]) : ""
    platform.handle(op: op, payload: payload)
  }

  /// Pushes one host-originated "<name>\n<json>" envelope to OCaml.
  func sendPlatformEvent(name: String, json: String) {
    guard started else { return }
    let envelope = name + "\n" + json
    envelope.withCString { pointer in
      _ = luiOCamlPlatformEvent(pointer, Int32(envelope.utf8.count))
    }
  }

  private func handle(_ event: LUIEvent) {
    guard started else { return }
    _ = LogseqLUIEvents.dispatch(event)
  }
}
