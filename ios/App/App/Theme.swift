import UIKit
import SwiftUI

extension UIColor {
    // Base colors: never dynamic, never consult trait collections.
    static let logseqLight = UIColor(red: 0xfc/255, green: 0xfc/255, blue: 0xfc/255, alpha: 1)
    static let logseqDark  = UIColor(red: 0x00/255, green: 0x2b/255, blue: 0x36/255, alpha: 1)

    static let logseqTintLight = UIColor(
        red: 23/255,
        green: 129/255,
        blue: 225/255,
        alpha: 1.0
    )

    static let logseqTintDark = UIColor(
        red: 245/255,
        green: 247/255,
        blue: 250/255,
        alpha: 1.0
    )

    // Dynamic variants: **static let**, so the closure is created once,
    // and it *only* reads trait.userInterfaceStyle.
    static let logseqBackground: UIColor = {
        UIColor { trait in
            trait.userInterfaceStyle == .dark ? logseqDark : logseqLight
        }
    }()

    static let logseqTint: UIColor = {
        UIColor { trait in
            trait.userInterfaceStyle == .dark ? logseqTintDark : logseqTintLight
        }
    }()
}

extension Color {
    // SwiftUI uses the dynamic versions
    static let logseqBackground = Color(uiColor: .logseqBackground)
    static let logseqTint       = Color(uiColor: .logseqTint)
}
