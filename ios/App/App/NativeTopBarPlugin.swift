import Capacitor
import UIKit

@objc(NativeTopBarPlugin)
public class NativeTopBarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeTopBarPlugin"
    public let jsName = "NativeTopBarPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise)
    ]

    private class NativeTopBarButton: UIButton {
        var buttonId: String = ""
        override var intrinsicContentSize: CGSize {
            // Keep a consistent tap target; icon size is controlled via SF Symbol configuration
            CGSize(width: 36, height: 32)
        }
    }

    private func navigationController() -> UINavigationController? {
        if let nav = bridge?.viewController?.parent?.navigationController {
            return nav
        }
        if let nav = bridge?.viewController?.navigationController {
            return nav
        }
        if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
            return appDelegate.navController
        }
        return nil
    }

    // MARK: - UITabBar lookup

    /// Recursively search for a UITabBar in the given view hierarchy.
    private func findTabBar(in view: UIView) -> UITabBar? {
        if let tabBar = view as? UITabBar {
            return tabBar
        }
        for subview in view.subviews {
            if let found = findTabBar(in: subview) {
                return found
            }
        }
        return nil
    }

    // MARK: - Public API

    @objc func configure(_ call: CAPPluginCall) {
        let title = call.getString("title")
        let leftButtons = call.getArray("leftButtons", JSObject.self) ?? []
        let rightButtons = call.getArray("rightButtons", JSObject.self) ?? []
        let backgroundColorHex = call.getString("backgroundColor")
        let tintColorHex = call.getString("tintColor")
        let hidden = call.getBool("hidden") ?? false
        let titleClickable = call.getBool("titleClickable") ?? false

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            guard let nav = self.navigationController() else {
                call.reject("Navigation controller not found")
                return
            }

            nav.setNavigationBarHidden(hidden, animated: true)
            guard !hidden else {
                call.resolve()
                return
            }

            // Resolve dynamic colors from JS
            let resolvedBackgroundColor =
              backgroundColorHex?.toUIColor(defaultColor: .logseqBackground) ?? .logseqBackground
            let resolvedTintColor =
              tintColorHex?.toUIColor(defaultColor: .label) ?? .label

            // --- NAVIGATION BAR (top) ---
            let appearance = UINavigationBarAppearance()
            appearance.configureWithTransparentBackground()
            appearance.shadowColor = .clear

            appearance.titleTextAttributes = [
              .foregroundColor: resolvedTintColor
            ]

            nav.navigationBar.standardAppearance = appearance
            nav.navigationBar.scrollEdgeAppearance = appearance
            nav.navigationBar.compactAppearance = appearance
            nav.navigationBar.tintColor = resolvedTintColor

            if let topVC = nav.topViewController {
                // Reset any previous custom title view
                topVC.navigationItem.titleView = nil

                if titleClickable, let title {
                    let button = NativeTopBarButton(type: .system)
                    button.buttonId = "title"
                    button.setTitle(title, for: .normal)
                    button.setTitleColor(nav.navigationBar.tintColor, for: .normal)
                    button.titleLabel?.font = UIFont.systemFont(ofSize: 17, weight: .semibold)
                    button.addTarget(self, action: #selector(self.titleTapped(_:)), for: .touchUpInside)
                    topVC.navigationItem.titleView = button
                } else {
                    topVC.navigationItem.title = title
                }

                topVC.navigationItem.leftBarButtonItems = self.buildButtons(from: leftButtons)
                topVC.navigationItem.rightBarButtonItems = self.buildButtons(from: rightButtons)
            }

            call.resolve()
        }
    }

    // MARK: - Button building

    private func buildButtons(from array: [JSObject]) -> [UIBarButtonItem] {
        return array.compactMap { obj in
            guard let id = obj["id"] as? String else { return nil }
            let systemIconName = (obj["systemIcon"] as? String) ?? "circle"

            let button = NativeTopBarButton(type: .system)
            button.buttonId = id

            // Size: small / medium / large -> SF Symbol pointSize
            let symbolConfig = symbolConfiguration(for: obj)
            if let image = UIImage(systemName: systemIconName, withConfiguration: symbolConfig) {
                button.setImage(image, for: .normal)
            }

            // Per-button color: prefers "tintColor", then "color"
            button.tintColor = tintColor(for: obj)
            button.imageView?.contentMode = .scaleAspectFit
            button.addTarget(self, action: #selector(buttonTapped(_:)), for: .touchUpInside)

            // Fixed tap target; icon itself is sized by SF Symbol config
            let container = UIView(frame: CGRect(x: 0, y: 0, width: 36, height: 32))
            button.frame = container.bounds
            button.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            container.addSubview(button)

            let item = UIBarButtonItem(customView: container)
            return item
        }
    }

    private func tintColor(for obj: JSObject) -> UIColor {
        if let hex = (obj["tintColor"] as? String) ?? (obj["color"] as? String) {
            return hex.toUIColor(defaultColor: .label)
        }
        return .label
    }

    private func symbolConfiguration(for obj: JSObject) -> UIImage.SymbolConfiguration {
        let sizeString = (obj["size"] as? String)?.lowercased()

        let pointSize: CGFloat
        switch sizeString {
        case "small":
            pointSize = 8
        case "large":
            pointSize = 19
        default: // "medium" or nil
            pointSize = 15
        }

        return UIImage.SymbolConfiguration(pointSize: pointSize, weight: .semibold)
    }

    // MARK: - Actions

    @objc private func buttonTapped(_ sender: NativeTopBarButton) {
        notifyListeners("buttonTapped", data: ["id": sender.buttonId])
    }

    @objc private func titleTapped(_ sender: NativeTopBarButton) {
        notifyListeners("buttonTapped", data: ["id": "title"])
    }
}

// MARK: - Color helpers

private extension String {
    func toUIColor(defaultColor: UIColor) -> UIColor {
        var hexString = self.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if hexString.hasPrefix("#") {
            hexString.removeFirst()
        }

        var rgbValue: UInt64 = 0
        guard Scanner(string: hexString).scanHexInt64(&rgbValue) else {
            return defaultColor
        }

        switch hexString.count {
        case 6: // RRGGBB
            return UIColor(
                red: CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0,
                green: CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0,
                blue: CGFloat(rgbValue & 0x0000FF) / 255.0,
                alpha: 1.0
            )
        case 8: // RRGGBBAA
            return UIColor(
                red: CGFloat((rgbValue & 0xFF000000) >> 24) / 255.0,
                green: CGFloat((rgbValue & 0x00FF0000) >> 16) / 255.0,
                blue: CGFloat((rgbValue & 0x0000FF00) >> 8) / 255.0,
                alpha: CGFloat(rgbValue & 0x000000FF) / 255.0
            )
        default:
            return defaultColor
        }
    }
}
