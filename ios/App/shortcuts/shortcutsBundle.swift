//
//  shortcutsBundle.swift
//  shortcuts
//
//  Created by Tienson Qin on 2025/9/19.
//

import WidgetKit
import SwiftUI

@main
@available(iOSApplicationExtension 18.0, *)
struct shortcutsBundle: WidgetBundle {
    var body: some Widget {
        Shortcuts()
        QuickAddButton()
        RecordAudioButton()
    }
}
