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

/// Every OCaml entry point runs on one pinned worker thread. The bridge
/// acquires the runtime lock inside each entry (leave_blocking_section)
/// and releases it on return (enter_blocking_section), so domain-0
/// systhreads (daemon HTTP, timers) interleave between entries on their
/// own threads. A DispatchQueue would hop OS threads and break OCaml's
/// per-thread domain binding — this is a real NSThread + runloop mailbox.
private final class OCamlWorker: NSObject {
  private let thread: Thread
  private let lock = NSLock()
  private var workItems: [() -> Void] = []

  override init() {
    thread = Thread {
      while true {
        _ = autoreleasepool {
          RunLoop.current.run(mode: .default, before: .distantFuture)
        }
      }
    }
    thread.name = "logseq-ocaml"
    thread.qualityOfService = .userInteractive
    thread.stackSize = 16 << 20
    super.init()
    thread.start()
  }

  @objc private func drain() {
    lock.lock()
    while !workItems.isEmpty {
      let item = workItems.removeFirst()
      lock.unlock()
      item()
      lock.lock()
    }
    lock.unlock()
  }

  func async(_ work: @escaping () -> Void) {
    lock.lock()
    workItems.append(work)
    lock.unlock()
    perform(#selector(drain), on: thread, with: nil, waitUntilDone: false)
  }

  func sync<T>(_ work: @escaping () -> T) -> T {
    var result: T?
    let semaphore = DispatchSemaphore(value: 0)
    async {
      result = work()
      semaphore.signal()
    }
    semaphore.wait()
    return result!
  }
}

extension LogseqRuntime {
  /// Cmd+Q / window-close terminate: NSApplication does not run SwiftUI
  /// onDisappear, so the delegate stops the runtime here — this also
  /// SIGTERMs the spawned db-worker daemon so it releases the repo lock.
  @MainActor static func terminateActive() { activeRuntime?.stop() }

  /// Menu-command entry point: posts a "<name>\n<json>" platform event to
  /// the live runtime, matching OCaml's "menu-*" listeners.
  @MainActor static func postPlatformEvent(name: String, json: String) {
    activeRuntime?.sendPlatformEvent(name: name, json: json)
  }
}

/// Patches arrive on the OCaml worker thread; queue them and drain once per
/// burst on the main actor (ordering preserved by the FIFO).
nonisolated(unsafe) private var pendingPatchJSONs: [String] = []
nonisolated(unsafe) private var patchDrainScheduled = false
private let patchQueueLock = NSLock()

private let receivePatch: PatchCallback = { source in
  guard let source else { return }
  let json = String(cString: source)
  patchQueueLock.lock()
  pendingPatchJSONs.append(json)
  let shouldSchedule = !patchDrainScheduled
  patchDrainScheduled = true
  patchQueueLock.unlock()
  guard shouldSchedule else { return }
  DispatchQueue.main.async {
    patchQueueLock.lock()
    let batch = pendingPatchJSONs
    pendingPatchJSONs.removeAll()
    patchDrainScheduled = false
    patchQueueLock.unlock()
    MainActor.assumeIsolated {
      for json in batch { activeRuntime?.apply(json: json) }
    }
  }
}

/// Fired on whichever OCaml thread enqueued cross-thread work — enqueue the
/// pump straight onto the OCaml worker; the main thread isn't needed.
private let wakeup: WakeupCallback = {
  activeRuntime?.enqueuePump()
}

/// OCaml calls this on its app thread with a "<op>\n<payload>" envelope.
private let platformRequest: PlatformRequestCallback = { data, length in
  guard let data, length > 0 else { return }
  let text = String(decoding: Data(bytes: data, count: Int(length)), as: UTF8.self)
  DispatchQueue.main.async {
    MainActor.assumeIsolated {
      activeRuntime?.deliverPlatformRequest(text)
    }
  }
}

/// Owns the lui backend and the OCaml runtime for one Logseq session.
/// All OCaml entry points run on `ocaml` — a pinned worker thread — so
/// event dispatch, flushes, doc scans and patch encoding never touch the
/// main thread; only decoded patch application and UI callbacks do.
@Observable @MainActor final class LogseqRuntime {
  let backend: LUIAppleBackend
  let platform: LogseqPlatform
  private(set) var rootID: Int?
  private(set) var appliedPatches = 0
  private var started = false
  /// nonisolated(unsafe): immutable after init — readable from any thread
  /// (the wakeup callback fires on OCaml systhreads).
  nonisolated(unsafe) private let ocaml = OCamlWorker()

  init(extensionRegistry: LUIAppleExtensionRegistry) throws {
    platform = LogseqPlatform()
    backend = try LUIAppleBackend(
      // `app:` icon names referenced from OCaml semantic elements (the
      // built-in icon table has no house glyph for the Home button).
      appIcons: ["home": .systemName("house")],
      extensionRegistry: extensionRegistry
    )
    backend.onEvent = { [weak self] event in self?.handle(event) }
    // Node frames feed OCaml's imperative-rects channel — imperative_dom
    // reads them for popup anchoring and element measurements where the
    // web would use getBoundingClientRect.
    backend.onFramesReport = { [weak self] frames in
      self?.reportImperativeRects(frames)
    }
    backend.frameReportingEnabled = true
    platform.runtime = self
  }

  func start() {
    guard !started else { return }
    activeRuntime = self
    enqueueStart()
  }

  /// nonisolated so the worker-item closure isn't MainActor-bound: a
  /// closure formed inside an @MainActor method keeps that isolation and
  /// traps (checkIsolatedSwift) when it runs on the OCaml thread.
  nonisolated private func enqueueStart() {
    ocaml.async { [weak self] in
      let payload = Data()
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
      DispatchQueue.main.async {
        MainActor.assumeIsolated {
          guard let self, self === activeRuntime else { return }
          guard accepted == 1 else {
            activeRuntime = nil
            return
          }
          self.started = true
          self.platform.attach()
        }
      }
    }
  }

  func stop() {
    guard started else { return }
    platform.detach()
    _ = syncStop()
    started = false
    activeRuntime = nil
  }

  nonisolated private func syncStop() -> Int32 {
    ocaml.sync { luiOCamlStop() }
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

  /// Reentrancy no longer exists: every Swift->OCaml call is a queued
  /// work item on the single OCaml thread, and OCaml->Swift callbacks are
  /// marshaled the other way — neither side ever blocks on the other.

  /// Enqueues a pump on the OCaml worker. Called from `wakeup` on any
  /// OCaml thread; safe to call before `started` flips — the item just
  /// runs after init.
  nonisolated func enqueuePump() {
    let worker = ocaml
    worker.async { _ = luiOCamlPump() }
  }

  func pump() {
    guard started else { return }
    enqueuePump()
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
    enqueuePlatformEvent(name + "\n" + json)
  }

  nonisolated private func enqueuePlatformEvent(_ envelope: String) {
    ocaml.async {
      envelope.withCString { pointer in
        _ = luiOCamlPlatformEvent(pointer, Int32(envelope.utf8.count))
      }
    }
  }

  private func handle(_ event: LUIEvent) {
    guard started else { return }
    enqueueDispatch(event)
  }

  nonisolated private func enqueueDispatch(_ event: LUIEvent) {
    ocaml.async { _ = LogseqLUIEvents.dispatch(event) }
  }

  /// The backend's coalesced node-id → frame table, forwarded as the
  /// {rects:{nodeId:{left,top,right,bottom}}} payload imperative_dom's
  /// "imperative-rects" listener stores for rect lookups.
  ///
  /// Throttled + diffed: a layout animation (sidebar toggle, resize)
  /// reports every moved node per frame — tens of multi-KB platform
  /// events per second, each enqueuing a full pump on the OCaml side.
  /// Only rects that actually changed ship, at most once per 120ms.
  private var lastReportedRects: [Int: CGRect] = [:]
  private var pendingRects: [Int: CGRect]?
  private var rectsFlushScheduled = false

  private func reportImperativeRects(_ frames: [Int: CGRect]) {
    guard started else { return }
    pendingRects = frames
    guard !rectsFlushScheduled else { return }
    rectsFlushScheduled = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { [weak self] in
      guard let self else { return }
      self.rectsFlushScheduled = false
      self.flushRectsDiff()
    }
  }

  private func flushRectsDiff() {
    guard let frames = pendingRects else { return }
    pendingRects = nil
    var changed: [String] = []
    changed.reserveCapacity(64)
    for (id, rect) in frames where lastReportedRects[id] != rect {
      changed.append(
        "\"\(id)\":{\"left\":\(rect.minX),\"top\":\(rect.minY)"
          + ",\"right\":\(rect.maxX),\"bottom\":\(rect.maxY)}")
    }
    var drop = ""
    let removed = lastReportedRects.keys.filter { frames[$0] == nil }
    if !removed.isEmpty {
      drop = ",\"drop\":[" + removed.map { String($0) }.joined(separator: ",") + "]"
    }
    lastReportedRects = frames
    guard !changed.isEmpty || !drop.isEmpty else { return }
    sendPlatformEvent(
      name: "imperative-rects",
      json: "{\"rects\":{" + changed.joined(separator: ",") + "}" + drop + "}")
  }
}
