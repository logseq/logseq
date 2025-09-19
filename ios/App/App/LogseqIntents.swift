import AppIntents
import UIKit

struct QuickAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Quick Add"
    static var description = IntentDescription("Open Logseq Quick Add")

    func perform() async throws -> some IntentResult {
        if let url = URL(string: "logseq://go/quick-add") {
            await UIApplication.shared.open(url)
        }
        return .result()
    }
}

struct RecordAudioIntent: AppIntent {
    static var title: LocalizedStringResource = "Record Audio"
    static var description = IntentDescription("Open Logseq Record Audio")

    func perform() async throws -> some IntentResult {
        if let url = URL(string: "logseq://go/audio") {
            await UIApplication.shared.open(url)
        }
        return .result()
    }
}
