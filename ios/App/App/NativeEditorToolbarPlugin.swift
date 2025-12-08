import Capacitor
import UIKit

// MARK: - Model

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

// MARK: - Toolbar View

private class NativeEditorToolbarView: UIView {
    /// Callback when any action is tapped.
    var onActionTapped: ((String) -> Void)?

    /// Used to prevent an old dismiss animation from removing a newly-presented bar.
    private var dismissGeneration: Int = 0

    /// Store actions so we can reconfigure when theme (light/dark) changes.
    private var storedActions: [NativeEditorAction] = []
    private var storedTrailingAction: NativeEditorAction?

    /// Bottom constraint we adjust when the keyboard moves.
    private var bottomConstraint: NSLayoutConstraint?

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

    // MARK: - Init

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
                 backgroundColor: UIColor?,
                 initialKeyboardOverlap: CGFloat) {
        // Bump generation to invalidate any previous dismiss completion
        dismissGeneration += 1
        layer.removeAllAnimations()

        // reset visual state in case a previous animation left us mid-way
        alpha = 1
        transform = .identity

        // Store actions so we can re-apply them when theme changes
        storedActions = actions
        storedTrailingAction = trailingAction

        // We ignore tintColor/backgroundColor – they’re driven by theme.
        configure(actions: actions,
                  trailingAction: trailingAction)
        attachIfNeeded(to: host)

        // Apply current keyboard overlap immediately, so we are in the right spot
        updateBottomInset(extra: initialKeyboardOverlap)

        animateIn()
    }

    func dismiss(animated: Bool = true) {
        dismissGeneration += 1
        let currentGen = dismissGeneration

        layer.removeAllAnimations()

        guard animated else {
            guard currentGen == self.dismissGeneration else { return }
            removeFromSuperview()
            transform = .identity
            alpha = 1
            return
        }

        UIView.animate(withDuration: 0.16,
                       delay: 0,
                       options: [.curveEaseIn, .allowUserInteraction],
                       animations: { [weak self] in
            guard let self = self, currentGen == self.dismissGeneration else { return }
            self.alpha = 0
            self.transform = CGAffineTransform(translationX: 0, y: 8)
        }, completion: { [weak self] _ in
            guard let self = self, currentGen == self.dismissGeneration else { return }
            self.removeFromSuperview()
            self.transform = .identity
            self.alpha = 1
        })
    }

    /// Called by the plugin when the keyboard frame changes.
    func updateBottomInset(extra: CGFloat) {
        let bottomGap: CGFloat = 8  // same as above
        bottomConstraint?.constant = -bottomGap - extra
        superview?.layoutIfNeeded()
    }

    // MARK: - Theme / trait changes

    /// Returns the theme-appropriate tint (light: black, dark: white).
    private func currentTintColor() -> UIColor {
        return traitCollection.userInterfaceStyle == .dark ? .white : .black
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)

        guard previousTraitCollection?.userInterfaceStyle != traitCollection.userInterfaceStyle else {
            return
        }

        // Reconfigure with new tint when light/dark changes
        configure(actions: storedActions, trailingAction: storedTrailingAction)
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

    private func configure(actions: [NativeEditorAction],
                           trailingAction: NativeEditorAction?) {
        let tint = currentTintColor()
        // Always use Logseq background (theme-aware)
        let bgBase = UIColor.logseqBackground

        // For debugging, you can temporarily color this aggressively:
        // blurView.backgroundColor = UIColor.systemPink.withAlphaComponent(0.9)
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
            let bottomGap: CGFloat = 8  // tweak to taste

            let bottom = bottomAnchor.constraint(
              equalTo: host.bottomAnchor,
              constant: -bottomGap
            )
            bottomConstraint = bottom
            NSLayoutConstraint.activate([leading, trailing, bottom])

            #if DEBUG
            print("[NativeEditorToolbar] attachIfNeeded host=\(type(of: host)) frame=\(host.bounds)")
            #endif
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

        // Try custom SF Symbol as systemName first, then fall back to asset by name.
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

// MARK: - Plugin

@objc(NativeEditorToolbarPlugin)
public class NativeEditorToolbarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeEditorToolbarPlugin"
    public let jsName = "NativeEditorToolbarPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "present", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "dismiss", returnType: CAPPluginReturnPromise)
    ]

    private var toolbar: NativeEditorToolbarView?
    private var keyboardObservers: [NSObjectProtocol] = []
    private var lastKeyboardOverlap: CGFloat = 0

    // MARK: - Lifecycle

    public override func load() {
        super.load()

        let center = NotificationCenter.default

        let willChange = center.addObserver(
            forName: UIResponder.keyboardWillChangeFrameNotification,
            object: nil,
            queue: .main
        ) { [weak self] note in
            self?.handleKeyboard(notification: note)
        }

        let willHide = center.addObserver(
            forName: UIResponder.keyboardWillHideNotification,
            object: nil,
            queue: .main
        ) { [weak self] note in
            self?.handleKeyboard(notification: note)
        }

        keyboardObservers = [willChange, willHide]
    }

    deinit {
        let center = NotificationCenter.default
        keyboardObservers.forEach { center.removeObserver($0) }
    }

    // MARK: - Public API

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
                self.toolbar?.dismiss(animated: false)
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
                        backgroundColor: nil,
                        initialKeyboardOverlap: self.lastKeyboardOverlap)

            self.toolbar = bar
            call.resolve()
        }
    }

    @objc func dismiss(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // JS-driven dismisses can be non-animated to avoid timing glitches
            self.toolbar?.dismiss(animated: false)
            self.toolbar = nil
            call.resolve()
        }
    }

    // MARK: - Keyboard handling

    private func handleKeyboard(notification: Notification) {
        guard let host = hostView() else { return }

        guard
            let userInfo = notification.userInfo,
            let frameValue = userInfo[UIResponder.keyboardFrameEndUserInfoKey] as? NSValue
        else { return }

        let keyboardFrameInScreen = frameValue.cgRectValue
        let keyboardFrameInHost = host.convert(keyboardFrameInScreen, from: nil)

        let overlap = max(0, host.bounds.maxY - keyboardFrameInHost.minY)
        lastKeyboardOverlap = overlap

        guard let toolbar = self.toolbar else { return }

        let duration = (userInfo[UIResponder.keyboardAnimationDurationUserInfoKey] as? NSNumber)?.doubleValue ?? 0.25
        let curveRaw = (userInfo[UIResponder.keyboardAnimationCurveUserInfoKey] as? NSNumber)?.intValue ?? UIView.AnimationCurve.easeInOut.rawValue
        let curve = UIView.AnimationCurve(rawValue: curveRaw) ?? .easeInOut
        let options = UIView.AnimationOptions(rawValue: UInt(curve.rawValue << 16))

        UIView.animate(withDuration: duration,
                       delay: 0,
                       options: [options, .allowUserInteraction],
                       animations: {
            toolbar.updateBottomInset(extra: overlap)
        }, completion: nil)
    }

    // MARK: - Host view resolution

    private func hostView() -> UIView? {
        // Root view that owns the webview for both Home & Capture
        if let vcView = bridge?.viewController?.view {
            return vcView
        }
        if let parentView = bridge?.viewController?.parent?.view {
            return parentView
        }
        return nil
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
