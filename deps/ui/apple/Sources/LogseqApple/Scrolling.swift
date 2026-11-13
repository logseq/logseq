import AppKit
import Foundation

/// Native queries may install their viewport probe on the first call. Keep
/// the latest intent per viewport until onFramesReport confirms it mounted.
@MainActor
final class NativeScrolling {
    unowned let services: PlatformServices
    private struct Request {
        let sequence: UInt64
        let node: Int
        let incarnation: UInt64
        let viewport: Int
        let viewportIncarnation: UInt64
        let top: Double?
    }
    private var sequence: UInt64 = 0
    private var pending: [Int: [Request]] = [:]
    private var flushing = false
    init(services: PlatformServices) { self.services = services }
    func clear() { pending.removeAll() }

    func request(_ node: Int, top: Double? = nil, scroller: Int? = nil) {
        guard let incarnation = services.incarnations[node] else { return }
        var viewport = scroller
        var ancestor: Int? = top == nil ? services.parents[node] : node
        while viewport == nil, let id = ancestor {
            if services.nodes[id]?["kind"] as? String == "scroll" { viewport = id }
            ancestor = services.parents[id]
        }
        let key = viewport ?? node
        guard let viewportIncarnation = services.incarnations[key] else { return }
        sequence &+= 1
        let request = Request(sequence: sequence, node: node, incarnation: incarnation,
                              viewport: key, viewportIncarnation: viewportIncarnation, top: top)
        if top != nil { pending[key] = [request] }
        else {
            if pending[key]?.last?.top == nil { _ = pending[key]?.popLast() }
            pending[key, default: []].append(request)
        }
        flush()
    }

    func flush() {
        guard !flushing, !services.closed, services.runtime?.started == true, let backend = services.backend else { return }
        flushing = true
        defer { flushing = false }
        for key in Array(pending.keys) {
          while let request = pending[key]?.first {
            guard services.incarnations[request.node] == request.incarnation,
                  services.incarnations[request.viewport] == request.viewportIncarnation else {
                pending[key]?.removeFirst(); continue
            }
            let applied: Bool
            if let top = request.top {
                applied = backend.setScrollTop(nodeID: request.node, top: top)
            } else if services.nodes[request.node]?["identifier"] != nil {
                // Raw widgets belong to this host rather than the backend's
                // standard-node registry, so use their own mounted anchor.
                if let view = services.views[request.node]?.value, view.window != nil, !view.isHiddenOrHasHiddenAncestor {
                    _ = view.scrollToVisible(view.bounds); applied = true
                } else { applied = false }
            } else if request.viewport == request.node {
                applied = services.frames[request.node] != nil
            } else { applied = backend.scrollIntoView(nodeID: request.node) }
            guard applied else { break }
            if pending[key]?.first?.sequence == request.sequence { pending[key]?.removeFirst() }
          }
          if pending[key]?.isEmpty == true { pending.removeValue(forKey: key) }
        }
    }
}
