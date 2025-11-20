import AppIntents
import UIKit

@available(iOS 18.0, *)
struct QuickAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Quick Add"
    static var description = IntentDescription("Open Logseq Quick Add")

    func perform() async throws -> some IntentResult & OpensIntent {
        let url = URL(string: "https://logseq.com/mobile/go/quick-add")!
        return .result(opensIntent: OpenURLIntent(url))
    }
}

@available(iOS 18.0, *)
struct RecordAudioIntent: AppIntent {
    static var title: LocalizedStringResource = "Record Audio"
    static var description = IntentDescription("Open Logseq Record Audio")

    func perform() async throws -> some IntentResult & OpensIntent {
        let url = URL(string: "https://logseq.com/mobile/go/audio")!
        return .result(opensIntent: OpenURLIntent(url))
    }
}

@available(iOS 18.0, *)
struct LogseqShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        return [
          AppShortcut(
            intent: QuickAddIntent(),
            phrases: [
              "Quick add in \(.applicationName)",
              "Add note in \(.applicationName)"
            ],
            shortTitle: "Quick Add",
            systemImageName: "plus.circle"
          ),

          AppShortcut(
            intent: RecordAudioIntent(),
            phrases: [
              "Record audio in \(.applicationName)",
              "Start recording in \(.applicationName)"
            ],
            shortTitle: "Record Audio",
            systemImageName: "waveform"
          )
        ]
    }
}
