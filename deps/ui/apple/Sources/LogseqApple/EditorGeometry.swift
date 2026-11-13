import AppKit
import LUIAppleBackend

// OCaml source positions are UTF-8 bytes. Native text queries use UTF-16.
// Only convert at scalar boundaries; neither side owns a second document.
func sourceSlice(_ source: String, _ first: Int, _ last: Int) throws -> String {
    try sourceSlice(Array(source.utf8), first, last)
}

private func sourceSlice(_ bytes: [UInt8], _ first: Int, _ last: Int) throws -> String {
    func boundary(_ n: Int) -> Bool { n >= 0 && n <= bytes.count && (n == bytes.count || bytes[n] & 0xc0 != 0x80) }
    guard first <= last, boundary(first), boundary(last) else { throw HostError("Invalid UTF-8 editor span") }
    return String(decoding: bytes[first..<last], as: UTF8.self)
}

func sourceByteOffset(_ text: String, utf16: Int) -> Int? {
    guard utf16 >= 0, utf16 <= text.utf16.count,
          let index = String.Index(text.utf16.index(text.utf16.startIndex, offsetBy: utf16), within: text) else { return nil }
    return text[..<index].utf8.count
}

@MainActor
struct EditorRunGeometry {
    let first: Int
    let last: Int
    let tag: String
    let hidden: Bool
    let text: String
    let fragments: [LUICommittedTextGeometry]

    func caret(_ offset: Int) throws -> CGRect? {
        guard !hidden, !fragments.isEmpty else { return nil }
        if tag == "a" {
            guard let g = offset >= last ? fragments.last : fragments.first,
                  let rect = g.caretRect(atUTF16Offset: offset >= last ? g.text.utf16.count : 0) else { return nil }
            return rect.offsetBy(dx: g.frame.minX, dy: g.frame.minY)
        }
        var position = tag == "z" ? 0 : try sourceSlice(text, 0, max(0, min(offset - first, text.utf8.count))).utf16.count
        for (index, g) in fragments.enumerated() {
            if position < g.text.utf16.count || index == fragments.count - 1 {
                return g.caretRect(atUTF16Offset: position).map { $0.offsetBy(dx: g.frame.minX, dy: g.frame.minY) }
            }
            position -= g.text.utf16.count
        }
        return nil
    }
}

@MainActor
struct EditorLayout {
    let source: String
    let origin: CGRect
    let runs: [EditorRunGeometry]

    func caret(_ offset: Int) throws -> CGRect? {
        _ = try sourceSlice(source, offset, offset)
        for r in runs.reversed() where offset >= r.first && offset <= r.last {
            if let rect = try r.caret(offset) { return rect }
        }
        for r in runs where r.first >= offset { if let rect = try r.caret(r.first) { return rect } }
        for r in runs.reversed() where r.last <= offset { if let rect = try r.caret(r.last) { return rect } }
        return nil
    }

    func selection(_ first: Int, _ last: Int) throws -> [CGRect] {
        let lo = min(first, last), hi = max(first, last)
        _ = try sourceSlice(source, lo, hi)
        var result: [CGRect] = []
        for r in runs where !r.hidden && r.tag != "z" && hi > r.first && lo < r.last {
            let start = r.tag == "a" ? 0 : try sourceSlice(r.text, 0, max(lo, r.first) - r.first).utf16.count
            let end = r.tag == "a" ? r.fragments.reduce(0) { $0 + $1.text.utf16.count } : try sourceSlice(r.text, 0, min(hi, r.last) - r.first).utf16.count
            var base = 0
            for g in r.fragments {
                let a = max(start - base, 0), b = min(end - base, g.text.utf16.count)
                if b > a { result += g.selectionRects(in: NSRange(location: a, length: b - a)).map { $0.offsetBy(dx: g.frame.minX, dy: g.frame.minY) } }
                base += g.text.utf16.count
            }
        }
        return result
    }

    func offset(at point: CGPoint) -> Int? {
        var bestY = Double.infinity, bestX = Double.infinity
        var offset: Int?
        for r in runs where !r.hidden {
            var base = 0
            for g in r.fragments {
                defer { base += g.text.utf8.count }
                for range in g.lineRanges {
                    let selections = g.selectionRects(in: range)
                    guard let first = selections.first ?? g.caretRect(atUTF16Offset: range.location) else { continue }
                    let rect = selections.dropFirst().reduce(first) { $0.union($1) }.offsetBy(dx: g.frame.minX, dy: g.frame.minY)
                    let dy = max(rect.minY - point.y, point.y - rect.maxY, 0)
                    let dx = max(rect.minX - point.x, point.x - rect.maxX, 0)
                    guard dy < bestY || (dy == bestY && dx < bestX) else { continue }
                    let local = CGPoint(x: max(0, min(point.x - g.frame.minX, g.frame.width - 0.001)), y: rect.midY - g.frame.minY)
                    if r.tag == "z" { offset = r.first; bestX = dx; bestY = dy }
                    else if let pos = g.offset(at: local), let byte = sourceByteOffset(g.text, utf16: pos) {
                        let step = (try? sourceSlice(source, r.first, r.last))?.unicodeScalars.first?.utf8.count ?? 0
                        offset = r.tag == "a" ? min(r.last, r.first + step) : r.first + base + byte
                        bestX = dx; bestY = dy
                    }
                }
            }
        }
        return offset
    }

    struct Line { var first: Int; var last: Int; var rect: CGRect }
    func lines() -> [Line]? {
        var all: [Line] = []
        for r in runs where !r.hidden {
            var base = 0
            for g in r.fragments {
                for range in g.lineRanges {
                    guard let lo = sourceByteOffset(g.text, utf16: range.location),
                          let hi = sourceByteOffset(g.text, utf16: range.location + range.length) else { return nil }
                    let rects = g.selectionRects(in: range)
                    guard let firstRect = rects.first ?? g.caretRect(atUTF16Offset: range.location) else { return nil }
                    let rect = rects.dropFirst().reduce(firstRect) { $0.union($1) }.offsetBy(dx: g.frame.minX, dy: g.frame.minY)
                    all.append(Line(first: r.tag == "a" || r.tag == "z" ? r.first : r.first + base + lo,
                                    last: r.tag == "a" || r.tag == "z" ? r.last : r.first + base + hi, rect: rect))
                }
                base += g.text.utf8.count
            }
        }
        all.sort { $0.rect.minY == $1.rect.minY ? $0.first < $1.first : $0.rect.minY < $1.rect.minY }
        var result: [Line] = []
        for line in all {
            if let last = result.last, line.rect.minY < last.rect.maxY, last.rect.minY < line.rect.maxY {
                result[result.count - 1] = Line(first: min(last.first, line.first), last: max(last.last, line.last), rect: last.rect.union(line.rect))
            } else { result.append(line) }
        }
        guard !result.isEmpty else { return nil }
        result[0].first = 0; result[result.count - 1].last = source.utf8.count
        for i in 1..<result.count {
            guard result[i].first >= result[i - 1].last else { return nil }
            guard let gap = try? sourceSlice(source, result[i - 1].last, result[i].first) else { return nil }
            if !gap.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { result[i - 1].last = result[i].first }
        }
        return result
    }
}

@MainActor
final class EditorGeometry {
    unowned let services: PlatformServices
    private struct Query {
        let name: String; let values: [String: Any]; let block: String; let source: String
        let node: Int?; let incarnation: UInt64?
    }
    private var pending: [String: Query] = [:]
    private var scheduled = false
    init(services: PlatformServices) { self.services = services }
    func clear() { pending.removeAll() }
    func integer(_ values: [String: Any], _ key: String) throws -> Int {
        guard let n = values[key] as? NSNumber, CFGetTypeID(n) != CFBooleanGetTypeID(), n.doubleValue.isFinite,
              n.doubleValue.rounded() == n.doubleValue, let value = Int(exactly: n.doubleValue) else { throw HostError("Geometry requires integer \(key)") }
        return value
    }
    func editorNode(_ block: String) -> Int? {
        services.nodes.keys.first { services.nodes[$0]?["identifier"] as? String == "logseq-editor" && services.nodes[$0]?["block-id"] as? String == block }
    }
    func request(_ name: String, _ values: [String: Any]) throws {
        let block: String = try services.required(values, "block-id")
        let fields = name == "caret-rect" ? ["offset"] : name == "selection-rects" ? ["first", "last"] : name == "offset-at" ? ["x", "y"] : []
        for field in fields { _ = try integer(values, field) }
        guard let source = try services.runtime?.snapshot(block: block)?["source"] as? String else { return }
        let node = editorNode(block)
        pending[name + "|" + (try jsonString(values))] = Query(name: name, values: values, block: block, source: source, node: node, incarnation: node.flatMap { services.incarnations[$0] })
        if !scheduled {
            scheduled = true
            CFRunLoopPerformBlock(CFRunLoopGetMain(), CFRunLoopMode.commonModes.rawValue) { [weak self] in
                MainActor.assumeIsolated {
                    guard let self else { return }
                    self.scheduled = false
                    self.services.perform { try self.flush() }
                }
            }
            CFRunLoopWakeUp(CFRunLoopGetMain())
        }
    }
    func layout(_ block: String) throws -> EditorLayout? {
        guard let backend = services.backend, let node = editorNode(block),
              let source = try services.runtime?.snapshot(block: block)?["source"] as? String,
              let encoded = services.nodes[node]?["runs"] as? String else { return nil }
        var root = node
        while !services.styleClass(root).split(separator: " ").contains("block-editor") {
            guard let parent = services.parents[root] else { throw HostError("Editor has no block-editor ancestor") }
            root = parent
        }
        guard let origin = services.rect(root) else { return nil }
        var runNodes: [Int] = []
        func collectRuns(_ id: Int) {
            if services.styleClass(id).split(separator: " ").contains("ed-r") { runNodes.append(id); return }
            for child in services.children[id] ?? [] { collectRuns(child) }
        }
        collectRuns(root)
        let spans = encoded.split(separator: ";")
        guard spans.count == runNodes.count else { throw HostError("Editor run/layout count mismatch") }
        var runs: [EditorRunGeometry] = []
        let sourceBytes = Array(source.utf8)
        var previous = 0
        var ready = true
        for (span, id) in zip(spans, runNodes) {
            let fields = span.split(separator: ",")
            guard fields.count == 3, let lo = Int(fields[0]), let hi = Int(fields[1]), lo >= previous,
                  ["p", "d", "a", "r", "z"].contains(String(fields[2])) else { throw HostError("Malformed editor run span") }
            let text = try sourceSlice(sourceBytes, lo, hi), tag = String(fields[2]); previous = hi
            let hidden = services.nodes[id]?["display"] as? String == "none" || services.styleClass(id).split(separator: " ").contains("ed-hidden")
            var fragments: [LUICommittedTextGeometry] = []
            func collectText(_ child: Int) {
                guard services.nodes[child]?["display"] as? String != "none" else { return }
                if ["text", "heading", "paragraph", "label"].contains(services.nodes[child]?["kind"] as? String ?? "") {
                    if let g = backend.textGeometry(nodeID: child), backend.isCurrent(g) { fragments.append(g) }
                    else { ready = false }
                    return
                }
                for id in services.children[child] ?? [] { collectText(id) }
            }
            if !hidden { collectText(id); if fragments.isEmpty { ready = false } }
            if ready, !hidden, tag != "a", tag != "z", fragments.map(\.text).joined() != text { throw HostError("Editor displayed text/source mismatch at byte \(lo)") }
            runs.append(EditorRunGeometry(first: lo, last: hi, tag: tag, hidden: hidden, text: text, fragments: fragments))
        }
        return ready ? EditorLayout(source: source, origin: origin, runs: runs) : nil
    }
    func flush() throws {
        guard !services.closed, services.runtime?.started == true else { return }
        for (key, query) in pending {
            if let node = query.node, services.incarnations[node] != query.incarnation { pending.removeValue(forKey: key); continue }
            guard let current = try services.runtime?.snapshot(block: query.block)?["source"] as? String, current == query.source else { pending.removeValue(forKey: key); continue }
            guard let layout = try layout(query.block) else { continue }
            var reply: [String: Any] = ["block-id": query.block]
            switch query.name {
            case "caret-rect":
                let offset = try integer(query.values, "offset")
                guard let r = try layout.caret(offset) else { continue }
                reply.merge(["offset": offset, "x": r.minX - layout.origin.minX, "y": r.minY - layout.origin.minY, "h": r.height, "ox": layout.origin.minX, "oy": layout.origin.minY]) { _, v in v }
            case "selection-rects":
                let first = try integer(query.values, "first"), last = try integer(query.values, "last")
                reply["first"] = first; reply["last"] = last
                reply["rects"] = try layout.selection(first, last).map { ["x": $0.minX - layout.origin.minX, "y": $0.minY - layout.origin.minY, "w": $0.width, "h": $0.height] }
            case "offset-at":
                let x = try integer(query.values, "x"), y = try integer(query.values, "y")
                guard let offset = layout.offset(at: CGPoint(x: CGFloat(x) + layout.origin.minX, y: CGFloat(y) + layout.origin.minY)) else { continue }
                reply["x"] = x; reply["y"] = y; reply["offset"] = offset
            case "line-ranges", "scroll-height":
                guard let lines = layout.lines() else { continue }
                if query.name == "line-ranges" { reply["ranges"] = lines.map { "\($0.first),\($0.last)" }.joined(separator: ";") }
                else { reply["height"] = lines.map { $0.rect.maxY - layout.origin.minY }.max() }
            default: throw HostError("Unknown editor geometry request")
            }
            pending.removeValue(forKey: key)
            try services.reply(query.name, reply)
        }
    }
}
