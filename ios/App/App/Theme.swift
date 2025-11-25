import UIKit
import SwiftUI

extension UIColor {
    static let logseqLight = UIColor(red: 0xfc/255, green: 0xfc/255, blue: 0xfc/255, alpha: 1)
    static let logseqDark  = UIColor(red: 0x00/255, green: 0x2b/255, blue: 0x36/255, alpha: 1)

    // New: Tint colors converted from HSL
    static let logseqTintLight = UIColor(
        red: 23/255,   // ~0.090
        green: 129/255, // ~0.506
        blue: 225/255,  // ~0.882
        alpha: 1.0
    )

    static let logseqTintDark = UIColor(
        red: 245/255,   // ~0.961
        green: 247/255, // ~0.969
        blue: 250/255,  // ~0.980
        alpha: 1.0
    )

    static var logseqBackground: UIColor {
        UITraitCollection.current.userInterfaceStyle == .dark ? logseqDark : logseqLight
    }

    static var logseqTint: UIColor {
        UITraitCollection.current.userInterfaceStyle == .dark ? logseqTintDark : logseqTintLight
    }
}

extension Color {
    static var logseqBackground: Color { Color(uiColor: .logseqBackground) }
    static var logseqTint: Color { Color(uiColor: .logseqTint) }
}
