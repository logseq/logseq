import UIKit
import SwiftUI

extension UIColor {
    static let logseqLight = UIColor(red: 0xfc/255, green: 0xfc/255, blue: 0xfc/255, alpha: 1)

    static let logseqDark = UIColor(red: 0x00/255, green: 0x2b/255, blue: 0x36/255, alpha: 1)

    static var logseqBackground: UIColor {
        UITraitCollection.current.userInterfaceStyle == .dark ? logseqDark : logseqLight
    }
}

extension Color {
    static var logseqBackground: Color { Color(uiColor: .logseqBackground) }
}
