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
            ControlWidgetButton(action: RecordAudioIntent()) {
                Label("Record Audio", systemImage: "waveform")
            }
        }
          .displayName("Record Audio")
          .description("Record Audio.")
    }
}
