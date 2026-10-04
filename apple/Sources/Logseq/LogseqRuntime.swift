import AppKit
import Foundation
import QuartzCore
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

// Carbon PostEventToQueue was tried as the wake channel: it returns
// success but AppKit drops the unknown event class before it ever
// becomes an NSEvent, so it neither wakes the parked wait nor reaches
// local event monitors. The working carrier is a real flagsChanged
// CGEvent — see postWakeup().
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

/// Marshals work onto the main runloop via CFRunLoopPerformBlock +
/// CFRunLoopWakeUp — the documented cross-thread wakeup. CF registers its own
/// wakeup port in every mode's waitset, so the wake always reaches the parked
/// wait (unlike a custom CFMachPort source, whose messages were observed to
/// sit 0.6-2.9s in the port queue while the loop parked on a different set).
///
/// Main-thread callers run inline: CFRunLoopPerformBlock from the runloop's
/// own thread would only run on the next iteration.
nonisolated(unsafe) private var runOnMainPending: [() -> Void] = []
private let runOnMainLock = NSLock()

/// Events dispatched while work is pending drain it inline — a real
/// event always reaches the loop, unlike queued blocks which can sit
/// behind a long-running iteration.
/// Samples the main runloop's current mode from a background thread —
/// catches private-mode waits (dockmsg, connection-reply, tracking) that
/// common-mode observers never report.
private func installModeProbe() {
  Thread.detachNewThread {
    var lastMode = ""
    while true {
      Thread.sleep(forTimeInterval: 0.1)
      let mode = CFRunLoopCopyCurrentMode(CFRunLoopGetMain())
        .map { $0.rawValue as String } ?? "none"
      if mode != lastMode {
        FileHandle.standardError.write(
          "PERF rlmode t=\(CFAbsoluteTimeGetCurrent()) mode=\(mode)\n"
            .data(using: .utf8)!)
        lastMode = mode
      }
    }
  }
}

/// Adaptive drain timer — the parked _DPSNextEvent wait was measured to
/// service runloop timers every turn even while no real events exist
/// (rlphase marks cycle ~50ms), while every other wake channel stalls
/// (GCD, CFRunLoopWakeUp, mach-port source, postEvent:, posted CGEvents
/// ~650ms, activate() ~300-800ms, signals delivered but ignored, IOHID
/// injection filtered). Instead of waking the loop we ride the timer:
/// enqueue tightens the next fire to ~2ms and the handler drains the
/// pending queue on that same turn; idle cadence stays 100ms.
nonisolated(unsafe) private var drainTimer: CFRunLoopTimer?

private func installTickTimer() {
  drainTimer = CFRunLoopTimerCreateWithHandler(
    nil, CFAbsoluteTimeGetCurrent() + 0.1, 0.1, 0, 0
  ) { _ in
    drainRunOnMainPending(via: "timer")
    if LogseqRuntime.perfLogging {
      FileHandle.standardError.write(
        "PERF tick t=\(CFAbsoluteTimeGetCurrent())\n".data(using: .utf8)!)
    }
  }
  CFRunLoopAddTimer(CFRunLoopGetMain(), drainTimer, CFRunLoopMode.commonModes)
}

private func installEventDrainMonitor() {
  NSEvent.addLocalMonitorForEvents(matching: .any) { event in
    runOnMainLock.lock()
    let empty = runOnMainPending.isEmpty
    runOnMainLock.unlock()
    if LogseqRuntime.perfLogging {
      FileHandle.standardError.write(
        "PERF nsev t=\(CFAbsoluteTimeGetCurrent()) type=\(event.type.rawValue) kc=\(event.keyCode) pending=\(!empty)\n"
          .data(using: .utf8)!)
    }
    if !empty { drainRunOnMainPending(via: "nsev") }
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
  wakeInFlight = false
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

/// A version-1 (port-based) runloop source on the main loop. The parked
/// _DPSNextEvent event wait services only the source that woke it — it
/// never runs __CFRunLoopDoBlocks or GCD main-queue work on those wakes
/// (measured: 2.1-2.9s delivery stalls until a real event arrived).
/// Sending a real mach message to this source's port lands on the same
/// waitset a real event arrives on, so the handler drains the queue on
/// the very next turn. CFRunLoopWakeUp, DispatchQueue.main.async,
/// NSApp.postEvent, self-AppleEvents and commonMode timers were all
/// measured to sit behind the parked wait — only a real CGEvent posted
/// to our own pid reaches it (postWakeup).
nonisolated(unsafe) private var wakeupPort: mach_port_t = mach_port_t(MACH_PORT_NULL)
nonisolated(unsafe) private var wakeupSource: CFRunLoopSource?

private func installWakeupSource() {
  var ctx = CFMachPortContext()
  let port = CFMachPortCreate(
    nil,
    { _, _, _, _ in drainRunOnMainPending(via: "port") },
    &ctx,
    nil
  )!
  wakeupPort = CFMachPortGetPort(port)
  wakeupSource = CFMachPortCreateRunLoopSource(nil, port, 0)
  CFRunLoopAddSource(CFRunLoopGetMain(), wakeupSource, CFRunLoopMode.commonModes)
}

/// One synthetic event in flight at a time — the drain clears the flag, so
/// items queued before the wake lands don't spam extra CGEvents. The
/// timestamp lets a dropped event unlock posting again after 1s instead of
/// stalling the queue forever.
nonisolated(unsafe) private var wakeInFlight = false
nonisolated(unsafe) private var wakePostedAt: CFAbsoluteTime = 0
/// Alternates the synthetic flagsChanged's keyCode (61/62) so consecutive
/// wakes can't coalesce into one delivery.
nonisolated(unsafe) private var wakeJitter = 0

private func postWakeup() {
  guard wakeupPort != mach_port_t(MACH_PORT_NULL) else { return }
  var msg = mach_msg_header_t()
  msg.msgh_bits = mach_msg_bits_t(MACH_MSG_TYPE_MAKE_SEND)
  msg.msgh_size = mach_msg_size_t(MemoryLayout<mach_msg_header_t>.size)
  msg.msgh_remote_port = wakeupPort
  msg.msgh_local_port = mach_port_t(MACH_PORT_NULL)
  msg.msgh_id = 0
  msg.msgh_voucher_port = mach_port_t(MACH_PORT_NULL)
  var hdr = msg
  let rc = withUnsafeMutablePointer(to: &hdr) {
    mach_msg(
      $0,
      mach_msg_option_t(MACH_SEND_MSG),
      mach_msg_size_t(MemoryLayout<mach_msg_header_t>.size),
      0,
      mach_port_name_t(MACH_PORT_NULL),
      0,
      mach_port_name_t(MACH_PORT_NULL)
    )
  }
  if rc != 0, LogseqRuntime.perfLogging {
    FileHandle.standardError.write(
      "PERF wakefail rc=\(rc)\n".data(using: .utf8)!)
  }
  // The parked _DPSNextEvent wait services NOTHING but events arriving on
  // the window-server event connection — measured: commonMode timers,
  // GCD main.async, CFRunLoopWakeUp, CFMachPort source msgs and self-sent
  // AppleEvents (short-circuit locally, never reach the connection) all
  // sit for seconds while commonMode sources go unobserved. Post a real
  // CGEvent to our own pid: it lands on that same connection, the runloop
  // turns, the queued mach msg runs our order-0 source → drain.
  let now = CFAbsoluteTimeGetCurrent()
  runOnMainLock.lock()
  let stale = now - wakePostedAt > 0.5
  let inFlight = wakeInFlight && !stale
  if !inFlight {
    wakeInFlight = true
    wakePostedAt = now
  }
  runOnMainLock.unlock()
  if LogseqRuntime.perfLogging {
    FileHandle.standardError.write(
      "PERF wake t=\(now) skip=\(inFlight ? 1 : 0)\n"
        .data(using: .utf8)!)
  }
  guard !inFlight else { return }
  // Tighten the drain timer — the parked wait services timers, so the
  // next turn (~2ms out) drains this item without needing a real event.
  if let drainTimer {
    CFRunLoopTimerSetNextFireDate(
      drainTimer, CFAbsoluteTimeGetCurrent() + 0.002)
  }
  // The parked _DPSNextEvent wait wakes ONLY for events arriving on the
  // window-server event connection — and during tracking/parked windows
  // it services nothing else (measured: timers, mach msgs, GCD all stall
  // 0.5-1.8s; a custom-class Carbon event posts fine but AppKit drops it
  // before it ever becomes an NSEvent). The one channel that always gets
  // dispatched is real input, so post a real flagsChanged CGEvent that
  // preserves the current modifier state: AppKit dispatches it as a
  // harmless no-op and the .any local monitor drains the queue inline.
  wakeJitter = (wakeJitter + 1) & 1
  // Alternate right-option/right-control so two wakes in a row can't
  // coalesce into one delivery.
  let keyCode: CGKeyCode = wakeJitter == 0 ? 61 : 62
  guard
    let event = CGEvent(
      keyboardEventSource: nil, virtualKey: keyCode, keyDown: false)
  else { return }
  event.type = .flagsChanged
  // A fresh CGEvent's flags snapshot the live HID modifier state — copy
  // them so the synthesized flagsChanged is a real no-op.
  event.flags = CGEvent(source: nil)?.flags ?? []
  // Post straight to our pid's event queue — it always lands on the event
  // connection _DPSNextEvent waits on, regardless of which window the
  // cursor is over or whether we hold key focus (cghidEventTap routing
  // depends on both, and consecutive flagsChanged can coalesce).
  event.postToPid(getpid())
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
  if wakeupPort != mach_port_t(MACH_PORT_NULL) {
    postWakeup()
  } else {
    CFRunLoopPerformBlock(CFRunLoopGetMain(), CFRunLoopMode.commonModes.rawValue) {
      drainRunOnMainPending(via: "block")
    }
    CFRunLoopWakeUp(CFRunLoopGetMain())
  }
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
  runOnMain {
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

  init(extensionRegistry: LUIAppleExtensionRegistry) throws {
    installEventDrainMonitor()
    installWakeupSource()
    if LogseqRuntime.perfLogging { installModeProbe(); installTickTimer() }
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
    enqueueDispatch(event)
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
      let r = LogseqFrameStore.surfaceRect(rect)
      changed.append(
        "\"\(id)\":{\"left\":\(r.minX),\"top\":\(r.minY)"
          + ",\"right\":\(r.maxX),\"bottom\":\(r.maxY)}")
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
