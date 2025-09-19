import AppIntents

struct LogseqShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        [
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
            systemImageName: "mic"
          )
        ]
    }
}
