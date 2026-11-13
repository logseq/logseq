import Foundation

// JSONSerialization may change the lexical representation of numeric values.
// Inspect decoded metadata separately and preserve every batch's original bytes.
func rawPatchBatches(_ json: String) throws -> [String] {
    let bytes = Array(json.utf8)
    var result: [String] = []
    var depth = 0
    var start: Int?
    var quoted = false
    var escaped = false
    for (index, byte) in bytes.enumerated() {
        if quoted {
            if escaped { escaped = false }
            else if byte == 92 { escaped = true }
            else if byte == 34 { quoted = false }
            continue
        }
        if byte == 34 { quoted = true; continue }
        switch byte {
        case 91, 123:
            if depth == 1 { start = index }
            depth += 1
        case 93, 125:
            depth -= 1
            if depth == 1, let begin = start {
                result.append(String(decoding: bytes[begin...index], as: UTF8.self))
                start = nil
            }
        default: break
        }
        guard depth >= 0 else { throw HostError("Unbalanced patch envelope") }
    }
    guard depth == 0, !quoted, start == nil else { throw HostError("Incomplete patch envelope") }
    return result
}
