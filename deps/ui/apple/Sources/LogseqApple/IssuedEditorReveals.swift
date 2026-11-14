import AppKit
import LUIAppleBackend

// Only editor handoffs cross this channel. Read-only navigation owns a short
// application lease and explicitly cancels it after its residency obligation.
struct IssuedEditorReveal: Decodable, Equatable {
    let scope: String
    let attempt: Int
    let source: Int
    let lease: Int
    let owner: Int
    let epoch: Int
    let ticket: Int
    let key: String
    let block: String
    let requireFocus: Bool
    let control: Int
}

@MainActor
final class IssuedEditorReveals {
    unowned let services: PlatformServices
    private var scheduled = false
    private var polling = false
    private var controls: [Int: WeakView] = [:]

    init(services: PlatformServices) { self.services = services }

    func track(_ input: NativeEditorInput) {
        guard let node = input.extensionContext?.nodeID else {
            preconditionFailure("Editor tracking requires its extension context")
        }
        if let previous = controls[node]?.value as? NativeEditorInput, previous !== input {
            previous.releaseVirtualRegistration()
        }
        controls[node] = WeakView(input)
        schedule()
    }

    func untrack(_ input: NativeEditorInput) {
        if let node = input.extensionContext?.nodeID, controls[node]?.value === input {
            controls.removeValue(forKey: node)
        }
    }

    func schedule() {
        guard !scheduled, !services.closed else { return }
        scheduled = true
        onMainRunLoop { [weak self] in
            guard let self else { return }
            self.scheduled = false
            self.services.perform { try self.poll() }
        }
    }

    // Match the semantic key against the committed source's paired row metadata,
    // then search only that occurrence. A global block->editor map is ambiguous.
    private func control(_ demand: IssuedEditorReveal) throws -> NativeEditorInput? {
        guard let source = services.nodes[demand.source],
              source["virtual-owner-node"] as? Int == demand.owner,
              source["virtual-owner-epoch"] as? Int == demand.epoch,
              services.nodes[demand.owner]?["virtual-viewport-epoch"] as? Int == demand.epoch,
              let encoded = source["virtual-row-keys"] as? String else { return nil }
        let keys = try JSONDecoder().decode([String].self, from: Data(encoded.utf8))
        let children = services.children[demand.source] ?? []
        guard keys.count == children.count, Set(keys).count == keys.count else {
            throw HostError("Committed flat source rows and semantic keys disagree")
        }
        guard let index = keys.firstIndex(of: demand.key) else { return nil }
        var queue = [children[index]], visited: Set<Int> = [], matches: [NativeEditorInput] = []
        while let node = queue.popLast() {
            guard visited.insert(node).inserted else { throw HostError("Cyclic retained editor subtree") }
            if node == demand.control,
               let input = controls[node]?.value as? NativeEditorInput,
               input.services === services,
               input.extensionContext?.nodeID == node,
               input.incarnation == services.incarnations[node],
               input.block == demand.block,
               input.extensionContext?.string("block-id") == demand.block {
                matches.append(input)
            }
            queue.append(contentsOf: services.children[node] ?? [])
        }
        guard matches.count <= 1 else { throw HostError("Ambiguous issued editor occurrence") }
        return matches.first
    }

    func poll() throws {
        guard !polling, !services.closed, !services.applyingPatches,
              let runtime = services.runtime, let backend = services.backend else { return }
        polling = true
        defer { polling = false }
        let epoch = runtime.presentationEpoch
        for demand in try runtime.issuedReveals() {
            guard runtime.presentationEpoch == epoch,
                  let input = try control(demand), let window = input.window,
                  input.bounds.width > 0, input.bounds.height > 0,
                  let node = input.extensionContext?.nodeID,
                  let incarnation = services.incarnations[node] else { continue }
            // Poll may drain native patches. Recheck intent, source lease,
            // presentation, occurrence and control incarnation before handing off.
            guard try runtime.issuedReveals().contains(demand),
                  runtime.presentationEpoch == epoch,
                  services.backend === backend,
                  try control(demand) === input,
                  services.incarnations[node] == incarnation,
                  input.window === window else { continue }
            let registration = try backend.registerVirtualNativeView(nodeID: node, view: input)
            input.retainVirtualRegistration(registration, backend: backend)
            var requirements: LUIVirtualHandoffRequirements = [.attached, .visible]
            if demand.requireFocus { requirements.insert(.focus) }
            // Never synthesize focus or a control. The SDK checks current row,
            // native incarnation, geometry, visibility, window and requested focus.
            if try backend.acknowledgeVirtualRetention(ownerNode: demand.owner,
                ticket: demand.ticket, view: input, requirements: requirements) {
                schedule() // Advance the real opaque receipt through OCaml release.
            }
        }
    }
}
