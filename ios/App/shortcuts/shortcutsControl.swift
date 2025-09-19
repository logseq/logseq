//
//  shortcutsControl.swift
//  shortcuts
//
//  Created by Tienson Qin on 2025/9/19.
//

import AppIntents
import SwiftUI
import WidgetKit

@available(iOS 18.0, *)
struct QuickAddButton: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(
          kind: "com.logseq.logseq.quickAddButton"
        ) {
            ControlWidgetButton(action: QuickAddIntent()) {
                Label("Quick Add", systemImage: "plus.circle")
            }
        }
          .displayName("Quick Add")
          .description("Quick note.")
    }
}

@available(iOS 18.0, *)
struct RecordAudioButton: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(
          kind: "com.logseq.logseq.recordAudioButton"
        ) {
            ControlWidgetButton(action: RecordAudioIntent()) {   // ✅ fixed
                Label("Record Audio", systemImage: "waveform")
            }
        }
          .displayName("Record Audio")
          .description("Record Audio.")
    }
}

@available(iOS 18.0, *)
struct QuickAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Quick Add"
    static var description = IntentDescription("Open Logseq Quick Add")

    // TODO: use https://logseq.com/mobile/go/quick-add
    func perform() async throws -> some IntentResult {
        .result()
    }
}

@available(iOS 18.0, *)
struct RecordAudioIntent: AppIntent {
    static var title: LocalizedStringResource = "Record Audio"
    static var description = IntentDescription("Open Logseq Record Audio")

    // TODO: https://logseq.com/mobile/go/record-audio
    func perform() async throws -> some IntentResult {
        .result()
    }
}
