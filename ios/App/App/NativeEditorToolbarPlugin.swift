import Capacitor
import UIKit

private struct NativeEditorAction {
    let id: String
    let title: String
    let systemIcon: String?

    init?(jsObject: JSObject) {
        guard let id = jsObject["id"] as? String else { return nil }
        self.id = id
        self.title = (jsObject["title"] as? String) ?? id
        self.systemIcon = jsObject["systemIcon"] as? String
    }
}

private class NativeEditorToolbarView: UIView {
    /// Callback when any action is tapped.
    var onActionTapped: ((String) -> Void)?

    /// Used to prevent an old dismiss animation from removing a newly-presented bar.
    private var dismissGeneration: Int = 0

    private let blurView: UIVisualEffectView = {
        let effect = UIBlurEffect(style: .systemChromeMaterial)
        let view = UIVisualEffectView(effect: effect)
        view.translatesAutoresizingMaskIntoConstraints = false
        view.layer.cornerRadius = 18
        view.clipsToBounds = true
        view.isUserInteractionEnabled = true
        return view
    }()

    private let rootStack: UIStackView = {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 6
        stack.isLayoutMarginsRelativeArrangement = true
        stack.layoutMargins = UIEdgeInsets(top: 7, left: 10, bottom: 7, right: 10)
        stack.translatesAutoresizingMaskIntoConstraints = false
        return stack
    }()

    private let actionsScrollView: UIScrollView = {
        let view = UIScrollView()
        view.showsHorizontalScrollIndicator = false
        view.showsVerticalScrollIndicator = false
        view.alwaysBounceHorizontal = true
        view.contentInsetAdjustmentBehavior = .never
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    private let actionsStack: UIStackView = {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 4
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.isLayoutMarginsRelativeArrangement = true
        stack.layoutMargins = UIEdgeInsets(top: 0, left: 2, bottom: 0, right: 2)
        return stack
    }()

    private let trailingContainer: UIStackView = {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 6
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.isUserInteractionEnabled = true
        return stack
    }()

    private let separator: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = UIColor.label.withAlphaComponent(0.08)
        view.widthAnchor.constraint(equalToConstant: 1 / UIScreen.main.scale).isActive = true
        view.heightAnchor.constraint(greaterThanOrEqualToConstant: 20).isActive = true
        return view
    }()

    private let trailingButton: UIButton = {
        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        button.widthAnchor.constraint(greaterThanOrEqualToConstant: 30).isActive = true
        button.heightAnchor.constraint(greaterThanOrEqualToConstant: 30).isActive = true
        return button
    }()

    private var trailingActionId: String?

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    // MARK: - Public

    func present(on host: UIView,
                 actions: [NativeEditorAction],
                 trailingAction: NativeEditorAction?,
                 tintColor: UIColor?,
                 backgroundColor: UIColor?) {
        // Bump generation to invalidate any previous dismiss completion
        dismissGeneration += 1
        layer.removeAllAnimations()

        // We ignore tintColor/backgroundColor – they’re now driven by theme.
        configure(actions: actions,
                  trailingAction: trailingAction)
        attachIfNeeded(to: host)
        animateIn()
    }

    func dismiss(animated: Bool = true) {
        dismissGeneration += 1
        let currentGen = dismissGeneration

        layer.removeAllAnimations()

        guard animated else {
            removeFromSuperview()
            transform = .identity
            alpha = 1
            return
        }

        UIView.animate(withDuration: 0.16,
                       delay: 0,
                       options: [.curveEaseIn, .allowUserInteraction],
                       animations: {
            self.alpha = 0
            self.transform = CGAffineTransform(translationX: 0, y: 8)
        }, completion: { _ in
            // Only remove if no newer present/dismiss has happened.
            if currentGen == self.dismissGeneration {
                self.removeFromSuperview()
                self.transform = .identity
                self.alpha = 1
            }
        })
    }

    // MARK: - Private helpers

    private func setupView() {
        backgroundColor = .clear
        isOpaque = false

        layer.cornerRadius = 18
        layer.masksToBounds = false
        layer.shadowColor = UIColor.black.withAlphaComponent(0.25).cgColor
        layer.shadowOpacity = 0.25
        layer.shadowOffset = CGSize(width: 0, height: 8)
        layer.shadowRadius = 22

        layer.borderColor = UIColor.label.withAlphaComponent(0.04).cgColor
        layer.borderWidth = 0.5

        addSubview(blurView)
        NSLayoutConstraint.activate([
            blurView.leadingAnchor.constraint(equalTo: leadingAnchor),
            blurView.trailingAnchor.constraint(equalTo: trailingAnchor),
            blurView.topAnchor.constraint(equalTo: topAnchor),
            blurView.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])

        blurView.contentView.addSubview(rootStack)
        NSLayoutConstraint.activate([
            rootStack.leadingAnchor.constraint(equalTo: blurView.contentView.leadingAnchor),
            rootStack.trailingAnchor.constraint(equalTo: blurView.contentView.trailingAnchor),
            rootStack.topAnchor.constraint(equalTo: blurView.contentView.topAnchor),
            rootStack.bottomAnchor.constraint(equalTo: blurView.contentView.bottomAnchor)
        ])

        actionsScrollView.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        actionsScrollView.setContentHuggingPriority(.defaultLow, for: .horizontal)
        rootStack.addArrangedSubview(actionsScrollView)

        trailingContainer.setContentHuggingPriority(.required, for: .horizontal)
        trailingContainer.setContentCompressionResistancePriority(.required, for: .horizontal)
        rootStack.addArrangedSubview(trailingContainer)

        actionsScrollView.addSubview(actionsStack)
        NSLayoutConstraint.activate([
            actionsStack.leadingAnchor.constraint(equalTo: actionsScrollView.contentLayoutGuide.leadingAnchor),
            actionsStack.trailingAnchor.constraint(equalTo: actionsScrollView.contentLayoutGuide.trailingAnchor),
            actionsStack.topAnchor.constraint(equalTo: actionsScrollView.contentLayoutGuide.topAnchor),
            actionsStack.bottomAnchor.constraint(equalTo: actionsScrollView.contentLayoutGuide.bottomAnchor),
            actionsStack.heightAnchor.constraint(equalTo: actionsScrollView.frameLayoutGuide.heightAnchor)
        ])

        trailingContainer.isHidden = true
        trailingContainer.addArrangedSubview(separator)
        trailingContainer.addArrangedSubview(trailingButton)

        trailingButton.addTarget(self, action: #selector(handleTrailingTap(_:)), for: .touchUpInside)
    }

    /// Returns the theme-appropriate tint (light: black, dark: white).
    private func currentTintColor() -> UIColor {
        if #available(iOS 12.0, *) {
            return traitCollection.userInterfaceStyle == .dark ? .white : .black
        } else {
            return .black
        }
    }

    private func configure(actions: [NativeEditorAction],
                           trailingAction: NativeEditorAction?) {
        let tint = currentTintColor()
        // Always use Logseq background (theme-aware)
        let bgBase = UIColor.logseqBackground

        blurView.backgroundColor = bgBase.withAlphaComponent(0.9)
        blurView.contentView.backgroundColor = .clear

        // Main actions
        actionsStack.arrangedSubviews.forEach { $0.removeFromSuperview() }
        actions.forEach { action in
            let button = makeButton(for: action, tintColor: tint)
            actionsStack.addArrangedSubview(button)
        }

        // Trailing action (keyboard hide or audio)
        if let trailingAction {
            trailingContainer.isHidden = false
            trailingActionId = trailingAction.id
            separator.isHidden = false

            var config = UIButton.Configuration.plain()
            config.baseForegroundColor = tint
            config.contentInsets = NSDirectionalEdgeInsets(top: 4, leading: 4, bottom: 4, trailing: 4)
            config.preferredSymbolConfigurationForImage =
                UIImage.SymbolConfiguration(pointSize: 17, weight: .regular)
            config.background = .clear()

            let trailingSymbol = trailingAction.systemIcon ?? "keyboard.chevron.compact.down"
            config.image = UIImage(systemName: trailingSymbol) ?? UIImage(systemName: "keyboard.chevron.compact.down")

            trailingButton.configuration = config
            trailingButton.tintColor = tint
            trailingButton.accessibilityIdentifier = trailingAction.id

            trailingButton.configurationUpdateHandler = { button in
                var cfg = button.configuration
                if button.isHighlighted {
                    cfg?.background.backgroundColor = tint.withAlphaComponent(0.18)
                } else {
                    cfg?.background.backgroundColor = UIColor.clear
                }
                button.configuration = cfg
            }
        } else {
            trailingContainer.isHidden = true
            trailingActionId = nil
            separator.isHidden = true
            trailingButton.configuration = nil
            trailingButton.configurationUpdateHandler = nil
        }
    }

    private func attachIfNeeded(to host: UIView) {
        if superview !== host {
            removeFromSuperview()
            host.addSubview(self)
            host.bringSubviewToFront(self)
            translatesAutoresizingMaskIntoConstraints = false

            let leading = leadingAnchor.constraint(equalTo: host.leadingAnchor, constant: 16)
            let trailing = trailingAnchor.constraint(equalTo: host.trailingAnchor, constant: -16)
            let bottom: NSLayoutConstraint
            if #available(iOS 15.0, *) {
                bottom = bottomAnchor.constraint(equalTo: host.keyboardLayoutGuide.topAnchor, constant: -10)
            } else {
                bottom = bottomAnchor.constraint(equalTo: host.safeAreaLayoutGuide.bottomAnchor, constant: -16)
            }

            NSLayoutConstraint.activate([leading, trailing, bottom])
        }
    }

    private func animateIn() {
        alpha = 0
        transform = CGAffineTransform(translationX: 0, y: 10)
        UIView.animate(withDuration: 0.24,
                       delay: 0,
                       usingSpringWithDamping: 0.86,
                       initialSpringVelocity: 0.4,
                       options: [.curveEaseOut, .allowUserInteraction],
                       animations: {
            self.alpha = 1
            self.transform = .identity
        }, completion: nil)
    }

    private func makeButton(for action: NativeEditorAction, tintColor: UIColor) -> UIButton {
        var config = UIButton.Configuration.plain()
        config.baseForegroundColor = tintColor
        config.title = nil
        config.contentInsets = NSDirectionalEdgeInsets(top: 4, leading: 6, bottom: 4, trailing: 6)
        config.preferredSymbolConfigurationForImage =
          UIImage.SymbolConfiguration(pointSize: 17, weight: .regular)
        config.background = .clear()

        let button = UIButton(configuration: config, primaryAction: nil)
        button.tintColor = tintColor

        let symbolName = action.systemIcon ?? "circle"

        // 🔑 Try custom SF Symbol as systemName first, then fall back to asset by name.
        let image =
          UIImage(systemName: symbolName) ??
          UIImage(named: symbolName) ??
          UIImage(systemName: "circle")

        button.setImage(image, for: .normal)

        button.accessibilityIdentifier = action.id
        button.widthAnchor.constraint(greaterThanOrEqualToConstant: 30).isActive = true
        button.heightAnchor.constraint(greaterThanOrEqualToConstant: 30).isActive = true

        button.configurationUpdateHandler = { btn in
            var cfg = btn.configuration
            if btn.isHighlighted {
                cfg?.background.backgroundColor = tintColor.withAlphaComponent(0.18)
            } else {
                cfg?.background.backgroundColor = .clear
            }
            btn.configuration = cfg
        }

        button.addTarget(self, action: #selector(handleActionTap(_:)), for: .touchUpInside)
        return button
    }

    @objc private func handleActionTap(_ sender: UIButton) {
        guard let id = sender.accessibilityIdentifier else { return }
        onActionTapped?(id)
    }

    @objc private func handleTrailingTap(_ sender: UIButton) {
        guard let id = trailingActionId ?? sender.accessibilityIdentifier else { return }
        onActionTapped?(id)
    }
}

@objc(NativeEditorToolbarPlugin)
public class NativeEditorToolbarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeEditorToolbarPlugin"
    public let jsName = "NativeEditorToolbarPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "present", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "dismiss", returnType: CAPPluginReturnPromise)
    ]

    private var toolbar: NativeEditorToolbarView?

    @objc func present(_ call: CAPPluginCall) {
        let rawActions = call.getArray("actions", JSObject.self) ?? []
        let actions = rawActions.compactMap(NativeEditorAction.init(jsObject:))
        let trailingAction = call.getObject("trailingAction").flatMap(NativeEditorAction.init(jsObject:))

        // We still read tintColor/backgroundColor for future flexibility,
        // but the toolbar currently ignores them and uses theme colors.
        _ = call.getString("tintColor")
        _ = call.getString("backgroundColor")

        DispatchQueue.main.async {
            guard let host = self.hostView() else {
                call.reject("Host view not found")
                return
            }

            // If there are no actions and no trailing action, dismiss and clear toolbar
            guard !actions.isEmpty || trailingAction != nil else {
                self.toolbar?.dismiss(animated: true)
                self.toolbar = nil
                call.resolve()
                return
            }

            let bar = self.toolbar ?? NativeEditorToolbarView()
            bar.onActionTapped = { [weak self] id in
                guard let self = self else { return }
                self.notifyListeners("action", data: ["id": id])
            }

            bar.present(on: host,
                        actions: actions,
                        trailingAction: trailingAction,
                        tintColor: nil,
                        backgroundColor: nil)

            self.toolbar = bar
            call.resolve()
        }
    }

    @objc func dismiss(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.toolbar?.dismiss(animated: true)
            self.toolbar = nil
            call.resolve()
        }
    }

    private func hostView() -> UIView? {
        if let parent = bridge?.viewController?.parent?.view {
            return parent
        }
        return bridge?.viewController?.view
    }
}

// MARK: - Color helper

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
