import AppKit
import Foundation
import QuartzCore
import LUIAppleBackend
import Observation

/// C bridge entries exported by deps/ui/apple/logseq_lui_bridge.c. Every entry
/// that produces a patch emits it synchronously through the patch callback
/// installed at start. Interactive calls (events, platform envelopes) run
/// synchronously on the main thread — registered as a domain-0 systhread at
/// start completion — so their patches apply inside the triggering event's
/// runloop turn, with no cross-thread wake on the input path. The pinned
/// OCaml worker keeps only startup and wakeup-driven pumps.
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
@_silgen_name("lui_ocaml_register_current_thread")
private func luiOCamlRegisterCurrentThread() -> Int32

nonisolated(unsafe) private var activeRuntime: LogseqRuntime?

/// Async OCaml work (startup, wakeup pumps) runs on one pinned worker
/// thread. The bridge acquires the runtime lock inside each entry
/// (leave_blocking_section) and releases it on return
/// (enter_blocking_section), so domain-0 systhreads (daemon HTTP, timers,
/// and the registered main thread) interleave between entries on their
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

/// Cross-thread work for the main actor is queued here and drained on the
/// main runloop. The parked _DPSNextEvent wait was measured to service
/// runloop timers even while no real events exist (idle cadence ~50ms), so
/// enqueueing tightens the timer to ~2ms — a worker-produced patch lands
/// on the next turn without synthetic events. Interactive (input-driven)
/// OCaml calls don't come through here: they run synchronously on main
/// inside the triggering event.
nonisolated(unsafe) private var runOnMainPending: [() -> Void] = []
private let runOnMainLock = NSLock()

nonisolated(unsafe) private var drainTimer: CFRunLoopTimer?

private func installTickTimer() {
  drainTimer = CFRunLoopTimerCreateWithHandler(
    nil, CFAbsoluteTimeGetCurrent() + 0.1, 0.1, 0, 0
  ) { _ in
    drainRunOnMainPending(via: "timer")
  }
  CFRunLoopAddTimer(CFRunLoopGetMain(), drainTimer, CFRunLoopMode.commonModes)
}

private func installEventDrainMonitor() {
  NSEvent.addLocalMonitorForEvents(matching: .any) { event in
    runOnMainLock.lock()
    let empty = runOnMainPending.isEmpty
    runOnMainLock.unlock()
    // Drain before any logging: NSEvent.keyCode throws on non-key
    // events, so the debug write can never be allowed to skip the
    // drain for mouse events.
    if !empty { drainRunOnMainPending(via: "nsev") }
    if LogseqRuntime.perfLogging {
      let kc: Int
      switch event.type {
      case .keyDown, .keyUp, .flagsChanged: kc = Int(event.keyCode)
      default: kc = -1
      }
      FileHandle.standardError.write(
        "PERF nsev t=\(CFAbsoluteTimeGetCurrent()) type=\(event.type.rawValue) kc=\(kc) pending=\(!empty)\n"
          .data(using: .utf8)!)
    }
    return event
  }
}

private func drainRunOnMainPending(via: String = "?") {
  // Queued work contains MainActor.assumeIsolated — running it off the
  // main thread traps; re-route through the runloop instead.
  guard Thread.isMainThread else {
    CFRunLoopPerformBlock(CFRunLoopGetMain(), CFRunLoopMode.defaultMode.rawValue) {
      drainRunOnMainPending(via: "block")
    }
    CFRunLoopWakeUp(CFRunLoopGetMain())
    return
  }
  runOnMainLock.lock()
  let batch = runOnMainPending
  runOnMainPending.removeAll()
  runOnMainLock.unlock()
  if LogseqRuntime.perfLogging, !batch.isEmpty {
    let mode = CFRunLoopCopyCurrentMode(CFRunLoopGetMain())
      .map { $0.rawValue as String } ?? "none"
    FileHandle.standardError.write(
      "PERF drain t=\(CFAbsoluteTimeGetCurrent()) n=\(batch.count) via=\(via) mode=\(mode)\n"
        .data(using: .utf8)!)
  }
  for item in batch { item() }
}



func runOnMain(_ work: @escaping () -> Void) {
  if Thread.isMainThread {
    work()
    return
  }
  runOnMainLock.lock()
  runOnMainPending.append(work)
  runOnMainLock.unlock()
  if LogseqRuntime.perfLogging {
    FileHandle.standardError.write(
      "PERF enq t=\(CFAbsoluteTimeGetCurrent())\n"
        .data(using: .utf8)!)
  }
  scheduleRunOnMainDrain()
}

/// Always queues for a later runloop turn — unlike runOnMain it never
/// runs inline, so ordering-sensitive emits keep their deferral (the
/// monitor-sourced document click must land after an element's own
/// gesture emit, and local monitors run on the main thread).
func runOnMainDeferred(_ work: @escaping () -> Void) {
  runOnMainLock.lock()
  runOnMainPending.append(work)
  runOnMainLock.unlock()
  if LogseqRuntime.perfLogging {
    FileHandle.standardError.write(
      "PERF enq t=\(CFAbsoluteTimeGetCurrent())\n"
        .data(using: .utf8)!)
  }
  scheduleRunOnMainDrain()
}

private func scheduleRunOnMainDrain() {
  // The parked _DPSNextEvent wait services runloop timers: tightening
  // to ~2ms delivers the queue on the next turn. GCD + PerformBlock are
  // racing backups — the drain is idempotent, so whichever lands first
  // wins. Only background (worker-produced) work uses this channel; it
  // has no hard latency budget.
  if let drainTimer {
    CFRunLoopTimerSetNextFireDate(
      drainTimer, CFAbsoluteTimeGetCurrent() + 0.002)
  }
  DispatchQueue.main.async {
    drainRunOnMainPending(via: "gcd")
  }
  CFRunLoopPerformBlock(CFRunLoopGetMain(), CFRunLoopMode.commonModes.rawValue) {
    drainRunOnMainPending(via: "block")
  }
  CFRunLoopWakeUp(CFRunLoopGetMain())
}

/// Patches arrive on the OCaml worker thread; split + decode them there
/// (each batch used to be parsed ~3x on the main actor) and queue the
/// decoded batches for a once-per-burst main-actor drain.
nonisolated(unsafe) private var pendingPatchBatches: [LUIAppleBackend.DecodedPatchBatch] = []
nonisolated(unsafe) private var patchDrainScheduled = false
private let patchQueueLock = NSLock()

private let receivePatch: PatchCallback = { source in
  guard let source else { return }
  let json = String(cString: source)
  if let path = LogseqRuntime.patchDumpPath {
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
  // queued during a single pump — decode each on this worker thread.
  var raws: [String] = [json]
  if json.hasPrefix("["),
    let data = json.data(using: .utf8),
    let array = try? JSONSerialization.jsonObject(with: data) as? [Any]
  {
    raws = array.compactMap { element in
      guard let serialized = try? JSONSerialization.data(withJSONObject: element)
      else { return nil }
      return String(data: serialized, encoding: .utf8)
    }
  }
  var decoded: [LUIAppleBackend.DecodedPatchBatch] = []
  decoded.reserveCapacity(raws.count)
  for raw in raws {
    do {
      decoded.append(try LUIAppleBackend.decode(raw))
    } catch {
      NSLog("LUI patch decode failed: \(error)")
    }
  }
  guard !decoded.isEmpty else { return }
  let recvAt = CFAbsoluteTimeGetCurrent()
  patchQueueLock.lock()
  pendingPatchBatches.append(contentsOf: decoded)
  let shouldSchedule = !patchDrainScheduled
  patchDrainScheduled = true
  patchQueueLock.unlock()
  guard shouldSchedule else { return }
  runOnMain {
    patchQueueLock.lock()
    let batch = pendingPatchBatches
    pendingPatchBatches.removeAll()
    patchDrainScheduled = false
    patchQueueLock.unlock()
    if LogseqRuntime.perfLogging {
      let holdMs = Int((CFAbsoluteTimeGetCurrent() - recvAt) * 1000)
      FileHandle.standardError.write(
        "PERF patch-deliver t=\(CFAbsoluteTimeGetCurrent()) gens=\(batch.map { $0.generation }) hold=\(holdMs)ms\n"
          .data(using: .utf8)!)
    }
    MainActor.assumeIsolated {
      activeRuntime?.apply(decoded: batch)
      // A patch can create platform views (e.g. an editor textarea) whose
      // insertion into the window waits for a lazy view-update pass — when
      // nothing else wakes the runloop that pass can lag by seconds, and a
      // focus dom-op applied in the meantime fails silently. Flush now.
      for window in NSApp.windows { window.contentView?.layoutSubtreeIfNeeded() }
    }
  }
}

/// Fired on whichever OCaml thread enqueued cross-thread work — enqueue the
/// pump straight onto the OCaml worker; the main thread isn't needed.
private let wakeup: WakeupCallback = {
  activeRuntime?.enqueuePump()
}

/// Most recent event enqueued toward OCaml, for event->apply latency
/// marks under LOGSEQ_PERF.
nonisolated(unsafe) private var perfLastEvent: (label: String, at: CFAbsoluteTime)?

nonisolated(unsafe) private var pendingPlatformRequests: [String] = []
nonisolated(unsafe) private var platformRequestDrainScheduled = false
nonisolated(unsafe) private var platformRequestFirstQueuedAt: CFAbsoluteTime?
private let platformRequestLock = NSLock()

/// OCaml calls this on its app thread with a "<op>\n<payload>" envelope.
/// Ops arrive in bursts (e.g. ~50 focus retries inside one flush) and
/// each used to get its own main.async — a burst became 50 separate main
/// turns, each invalidating SwiftUI and each paying a full layout pass.
/// Coalescing into one drain per turn collapses the burst into a single
/// invalidation cycle.
private let platformRequest: PlatformRequestCallback = { data, length in
  guard let data, length > 0 else { return }
  let text = String(decoding: Data(bytes: data, count: Int(length)), as: UTF8.self)
  let queuedAt = CFAbsoluteTimeGetCurrent()
  if LogseqRuntime.perfLogging {
    FileHandle.standardError.write(
      "PERF prenq t=\(queuedAt) op=\(text.prefix(120).replacingOccurrences(of: "\n", with: "|"))\n".data(using: .utf8)!)
  }
  platformRequestLock.lock()
  pendingPlatformRequests.append(text)
  let firstQueuedAt = pendingPlatformRequests.count == 1 ? queuedAt : platformRequestFirstQueuedAt
  platformRequestFirstQueuedAt = firstQueuedAt
  let shouldSchedule = !platformRequestDrainScheduled
  platformRequestDrainScheduled = true
  platformRequestLock.unlock()
  guard shouldSchedule else { return }
  // Always deferred: platformRequest can fire while the main thread is
  // inside an OCaml entry call (holding the non-recursive domain lock),
  // and platform.handle may emit dom events back into OCaml — running it
  // inline there would deadlock.
  runOnMainDeferred {
    let drainAt = CFAbsoluteTimeGetCurrent()
    platformRequestLock.lock()
    let batch = pendingPlatformRequests
    let firstAt = platformRequestFirstQueuedAt
    platformRequestFirstQueuedAt = nil
    pendingPlatformRequests.removeAll()
    platformRequestDrainScheduled = false
    platformRequestLock.unlock()
    if LogseqRuntime.perfLogging, let firstAt {
      let waitMs = Int((drainAt - firstAt) * 1000)
      if waitMs > 20 {
        let mode = CFRunLoopCopyCurrentMode(CFRunLoopGetMain())
          .map { $0.rawValue as String } ?? "none"
        let stack = Thread.callStackSymbols
          .prefix(16).joined(separator: "\nPERF stk| ")
        FileHandle.standardError.write(
          "PERF prdrain t=\(drainAt) n=\(batch.count) queued_wait=\(waitMs)ms mode=\(mode) first=\(batch.first?.prefix(24) ?? "-")\n"
            .data(using: .utf8)!)
        FileHandle.standardError.write(
          "PERF prdrain-stack \(stack)\n".data(using: .utf8)!)
      }
    }
    MainActor.assumeIsolated {
      for text in batch { activeRuntime?.deliverPlatformRequest(text) }
      // Model mutations queue a SwiftUI view-tree update, but the hosting
      // pass that actually inserts platform views into the window is lazy —
      // without a nudge an unattached textarea can sit window-less for
      // seconds (focus then fails silently). Flush pending layout now.
      for window in NSApp.windows { window.contentView?.layoutSubtreeIfNeeded() }
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

  /// Once the main thread is registered as a domain-0 systhread, input
  /// events invoke OCaml entries inline; `ocamlCallDepth` guards against
  /// reentry — a nested event raised while main already holds the domain
  /// lock is routed to the worker instead (the lock is non-recursive).
  private var ocamlMainReady = false
  private var ocamlCallDepth = 0

  init(extensionRegistry: LUIAppleExtensionRegistry) throws {
    installEventDrainMonitor()
    installTickTimer()
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
      LogseqFrameStore.baseEntries = frames.mapValues {
        LogseqFrameEntry(rect: $0, tag: "", z: 0)
      }
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
      runOnMain {
        MainActor.assumeIsolated {
          guard let self, self === activeRuntime else { return }
          guard accepted == 1 else {
            activeRuntime = nil
            return
          }
          self.ocamlMainReady = luiOCamlRegisterCurrentThread() == 1
          if !self.ocamlMainReady {
            NSLog(
              "LogseqRuntime: caml_c_thread_register failed; events stay on the worker")
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
    if ocamlMainReady, ocamlCallDepth == 0 {
      _ = luiOCamlStop()
    } else {
      _ = syncStop()
    }
    started = false
    activeRuntime = nil
  }

  nonisolated private func syncStop() -> Int32 {
    ocaml.sync { luiOCamlStop() }
  }

  nonisolated fileprivate static let patchDumpPath: String? = {
    ProcessInfo.processInfo.environment["LOGSEQ_DUMP_PATCHES"]
  }()

  /// Applies batches already decoded on the OCaml worker; only the tree
  /// mutation + SwiftUI invalidation happen here on the main actor.
  func apply(decoded batches: [LUIAppleBackend.DecodedPatchBatch]) {
    for decoded in batches {
      do {
        let t0 = CFAbsoluteTimeGetCurrent()
        try backend.apply(decoded: decoded)
        rootID = backend.rootIDs.first
        appliedPatches += 1
        if Self.perfLogging {
          let ms = (CFAbsoluteTimeGetCurrent() - t0) * 1000
          let e2e = perfLastEvent.map {
            Int((CFAbsoluteTimeGetCurrent() - $0.at) * 1000) } ?? -1
          FileHandle.standardError.write(
            "PERF apply gen=\(decoded.generation) t=\(String(format: "%.3f", Date().timeIntervalSince1970)) \(backend.debugModelCounts) root=\(rootID ?? -1) dur=\(Int(ms))ms e2e=\(e2e)ms last=\(perfLastEvent?.label ?? "")\n"
              .data(using: .utf8)!)
        }
      } catch {
        NSLog("LUI patch apply failed: \(error)")
      }
    }
  }

  nonisolated static let perfLogging =
    ProcessInfo.processInfo.environment["LOGSEQ_PERF"] != nil

  /// Reentrancy no longer exists: every Swift->OCaml call is a queued
  /// work item on the single OCaml thread, and OCaml->Swift callbacks are
  /// marshaled the other way — neither side ever blocks on the other.

  /// Enqueues a pump on the OCaml worker. Called from `wakeup` on any
  /// OCaml thread; safe to call before `started` flips — the item just
  /// runs after init.
  nonisolated func enqueuePump() {
    let worker = ocaml
    worker.async {
      let t0 = CFAbsoluteTimeGetCurrent()
      _ = luiOCamlPump()
      let ms = (CFAbsoluteTimeGetCurrent() - t0) * 1000
      if Self.perfLogging, ms > 4 {
        FileHandle.standardError.write(
          "PERF pump dur=\(Int(ms))ms\n".data(using: .utf8)!)
      }
    }
  }

  func pump() {
    guard started else { return }
    guard ocamlMainReady, ocamlCallDepth == 0 else {
      enqueuePump()
      return
    }
    ocamlCallDepth += 1
    _ = luiOCamlPump()
    ocamlCallDepth -= 1
  }

  /// "<op>\n<payload>" envelopes from OCaml's Host.host_op.
  func deliverPlatformRequest(_ text: String) {
    guard started else { return }
    let split = text.split(separator: "\n", maxSplits: 1, omittingEmptySubsequences: false)
    let op = String(split.first ?? "")
    let payload = split.count > 1 ? String(split[1]) : ""
    platform.handle(op: op, payload: payload)
  }

  /// Pushes one host-originated "<name>\n<json>" envelope to OCaml —
  /// synchronously in this runloop turn when main is registered.
  func sendPlatformEvent(name: String, json: String) {
    guard started else { return }
    let envelope = name + "\n" + json
    guard ocamlMainReady, ocamlCallDepth == 0 else {
      enqueuePlatformEvent(envelope)
      return
    }
    ocamlCallDepth += 1
    let t0 = CFAbsoluteTimeGetCurrent()
    perfLastEvent = (String(envelope.prefix(48)), t0)
    envelope.withCString { pointer in
      _ = luiOCamlPlatformEvent(pointer, Int32(envelope.utf8.count))
    }
    ocamlCallDepth -= 1
    let ms = (CFAbsoluteTimeGetCurrent() - t0) * 1000
    if Self.perfLogging, ms > 4 {
      FileHandle.standardError.write(
        "PERF pevent \(envelope.prefix(32)) dur=\(Int(ms))ms\n".data(using: .utf8)!)
    }
  }

  nonisolated private func enqueuePlatformEvent(_ envelope: String) {
    perfLastEvent = (String(envelope.prefix(48)), CFAbsoluteTimeGetCurrent())
    ocaml.async {
      let t0 = CFAbsoluteTimeGetCurrent()
      envelope.withCString { pointer in
        _ = luiOCamlPlatformEvent(pointer, Int32(envelope.utf8.count))
      }
      let ms = (CFAbsoluteTimeGetCurrent() - t0) * 1000
      if Self.perfLogging, ms > 4 {
        FileHandle.standardError.write(
          "PERF pevent \(envelope.prefix(32)) dur=\(Int(ms))ms\n".data(using: .utf8)!)
      }
    }
  }

  private func handle(_ event: LUIEvent) {
    guard started else { return }
    guard ocamlMainReady, ocamlCallDepth == 0 else {
      enqueueDispatch(event)
      return
    }
    ocamlCallDepth += 1
    let t0 = CFAbsoluteTimeGetCurrent()
    perfLastEvent = (Self.describeEvent(event), t0)
    _ = LogseqLUIEvents.dispatch(event)
    ocamlCallDepth -= 1
    let ms = (CFAbsoluteTimeGetCurrent() - t0) * 1000
    if Self.perfLogging, ms > 4 {
      FileHandle.standardError.write(
        "PERF dispatch \(Self.describeEvent(event)) dur=\(Int(ms))ms\n"
          .data(using: .utf8)!)
    }
  }

  nonisolated private func enqueueDispatch(_ event: LUIEvent) {
    let queuedAt = CFAbsoluteTimeGetCurrent()
    perfLastEvent = (String(describing: event).prefix(48).description, queuedAt)
    ocaml.async {
      let t0 = CFAbsoluteTimeGetCurrent()
      _ = LogseqLUIEvents.dispatch(event)
      let ms = (CFAbsoluteTimeGetCurrent() - t0) * 1000
      if Self.perfLogging {
        let waitMs = Int((t0 - queuedAt) * 1000)
        if ms > 4 || waitMs > 40 {
          FileHandle.standardError.write(
            "PERF dispatch \(Self.describeEvent(event)) wait=\(waitMs)ms dur=\(Int(ms))ms\n"
              .data(using: .utf8)!)
        }
      }
    }
  }

  /// Short, perf-mark-friendly event description — the enum's own
  /// `describing:` truncates before the extension event name appears.
  nonisolated private static func describeEvent(_ event: LUIEvent) -> String {
    switch event {
    case .extension(let node, _, let name, _):
      return "ext(node:\(node) \(name))"
    case .textChanged(let node, let text):
      return "textChanged(node:\(node) len=\(text.count))"
    case .press(let node): return "press(node:\(node))"
    case .appear(let node): return "appear(node:\(node))"
    default:
      return String(describing: event).prefix(48).description
    }
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
    if Self.perfLogging {
      let interesting = frames.filter { $0.key >= 139 && $0.key <= 270 }
        .sorted { $0.key < $1.key }
        .map { "\($0.key):\(Int($0.value.width))x\(Int($0.value.height))@\(Int($0.value.minY))" }
        .joined(separator: " ")
      FileHandle.standardError.write(
        "PERF rects n=\(changed.count) drop=\(removed.count) [\(interesting)]\n"
          .data(using: .utf8)!)
    }
    sendPlatformEvent(
      name: "imperative-rects",
      json: "{\"rects\":{" + changed.joined(separator: ",") + "}" + drop + "}")
  }
}
