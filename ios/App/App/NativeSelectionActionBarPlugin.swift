import Capacitor
import UIKit

// MARK: - Model for a single selection action coming from JS

private struct NativeSelectionAction {
    let id: String
    let title: String
    let systemIcon: String?

    init?(jsObject: JSObject) {
        guard
            let id = jsObject["id"] as? String,
            let title = jsObject["title"] as? String
        else { return nil }

        self.id = id
        self.title = title
        self.systemIcon = jsObject["systemIcon"] as? String
    }
}

// MARK: - Native selection action bar UI

private class NativeSelectionActionBarView: UIView {
    /// Callback when an action is tapped. Sends the action id.
    var onActionTapped: ((String) -> Void)?

    /// Blurred background container.
    private let blurView: UIVisualEffectView = {
        let view = UIVisualEffectView(effect: UIBlurEffect(style: .systemMaterial))
        view.translatesAutoresizingMaskIntoConstraints = false
        view.layer.cornerRadius = 16
        view.clipsToBounds = true
        view.isUserInteractionEnabled = true
        return view
    }()

    /// Root horizontal stack that holds scrollable actions on the left and a fixed trailing action on the right.
    private let rootStack: UIStackView = {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 8
        stack.isLayoutMarginsRelativeArrangement = true
        stack.layoutMargins = UIEdgeInsets(top: 12, left: 12, bottom: 12, right: 12)
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.isUserInteractionEnabled = true
        return stack
    }()

    /// Scroll view allowing the main actions to overflow horizontally.
    private let actionsScrollView: UIScrollView = {
        let view = UIScrollView()
        view.showsHorizontalScrollIndicator = false
        view.showsVerticalScrollIndicator = false
        view.alwaysBounceHorizontal = true
        view.contentInsetAdjustmentBehavior = .never
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    /// Stack inside the scroll view for the leading actions.
    private let actionsStack: UIStackView = {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.alignment = .center
        stack.distribution = .fillEqually   // equal widths for main actions
        stack.spacing = 8
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.isLayoutMarginsRelativeArrangement = true
        stack.layoutMargins = UIEdgeInsets(top: 0, left: 2, bottom: 0, right: 2)
        return stack
    }()

    /// Container for the fixed trailing action.
    private let trailingContainer: UIStackView = {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 8
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.isUserInteractionEnabled = true
        return stack
    }()

    private let separator: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        view.backgroundColor = UIColor.label.withAlphaComponent(0.1)
        view.widthAnchor.constraint(equalToConstant: 1 / UIScreen.main.scale).isActive = true
        view.heightAnchor.constraint(greaterThanOrEqualToConstant: 20).isActive = true
        return view
    }()

    private var trailingButton: UIControl?
    private var actionsStackWidthConstraint: NSLayoutConstraint?

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    // MARK: - Public API

    /// Present the bar on top of a host view with given actions and colors.
    func present(
        on host: UIView,
        actions: [NativeSelectionAction],
        tintColor: UIColor?,
        backgroundColor: UIColor?
    ) {
        configure(actions: actions, tintColor: tintColor, backgroundColor: backgroundColor)
        attachIfNeeded(to: host)
        animateInIfNeeded()
    }

    /// Dismiss with a small fade/transform animation.
    func dismiss() {
        UIView.animate(
            withDuration: 0.15,
            delay: 0,
            options: [.curveEaseIn],
            animations: {
                self.alpha = 0
                self.transform = CGAffineTransform(translationX: 0, y: 8)
            },
            completion: { _ in
                self.removeFromSuperview()
                self.transform = .identity
                self.alpha = 1
            }
        )
    }

    // MARK: - Private helpers

    /// Base visual setup: background, shadow, subview hierarchy and constraints.
    private func setupView() {
        backgroundColor = .clear
        isUserInteractionEnabled = true

        layer.cornerRadius = 16
        layer.masksToBounds = false
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOpacity = 0.12
        layer.shadowOffset = CGSize(width: 0, height: 6)
        layer.shadowRadius = 14

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

        actionsStackWidthConstraint = actionsStack.widthAnchor.constraint(
            greaterThanOrEqualTo: actionsScrollView.frameLayoutGuide.widthAnchor
        )
        actionsStackWidthConstraint?.priority = .defaultHigh
        actionsStackWidthConstraint?.isActive = true

        trailingContainer.addArrangedSubview(separator)
        trailingContainer.isHidden = true
    }

    /// Rebuilds the stack buttons for the current set of actions.
    private func configure(
        actions: [NativeSelectionAction],
        tintColor: UIColor?,
        backgroundColor: UIColor?
    ) {
        let tint = tintColor ?? .label
        blurView.backgroundColor = backgroundColor ?? UIColor.logseqBackground.withAlphaComponent(0.94)
        blurView.contentView.backgroundColor = .clear

        let mainActions = Array(actions.dropLast())
        let trailingAction = actions.last

        // Clear existing main actions.
        actionsStack.arrangedSubviews.forEach { sub in
            actionsStack.removeArrangedSubview(sub)
            sub.removeFromSuperview()
        }
        actionsScrollView.isHidden = mainActions.isEmpty

        // Rebuild main actions.
        mainActions.forEach { action in
            let button = makeButton(for: action, tintColor: tint)
            actionsStack.addArrangedSubview(button)
        }

        configureTrailing(
            action: trailingAction,
            tintColor: tint,
            showSeparator: !mainActions.isEmpty
        )
    }

    private func configureTrailing(
        action: NativeSelectionAction?,
        tintColor: UIColor,
        showSeparator: Bool
    ) {
        if let existingButton = trailingButton {
            trailingContainer.removeArrangedSubview(existingButton)
            existingButton.removeFromSuperview()
            trailingButton = nil
        }

        guard let action = action else {
            trailingContainer.isHidden = true
            separator.isHidden = true
            return
        }

        trailingContainer.isHidden = false
        separator.isHidden = !showSeparator

        let button = makeButton(for: action, tintColor: tintColor)
        button.setContentHuggingPriority(.required, for: .horizontal)
        trailingContainer.addArrangedSubview(button)
        trailingButton = button
    }

    /// Attaches the bar to the given host view, pinned to the bottom with safe area.
    private func attachIfNeeded(to host: UIView) {
        guard superview !== host else { return }
        removeFromSuperview()

        host.addSubview(self)
        host.bringSubviewToFront(self)
        translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            leadingAnchor.constraint(equalTo: host.leadingAnchor, constant: 12),
            trailingAnchor.constraint(equalTo: host.trailingAnchor, constant: -12),
            bottomAnchor.constraint(equalTo: host.safeAreaLayoutGuide.bottomAnchor, constant: -12)
        ])
    }

    /// Simple fade-in animation when the bar appears.
    private func animateInIfNeeded() {
        guard alpha == 1 else { return }

        alpha = 0
        transform = CGAffineTransform(translationX: 0, y: 8)
        UIView.animate(
            withDuration: 0.2,
            delay: 0,
            options: [.curveEaseOut, .allowUserInteraction],
            animations: {
                self.alpha = 1
                self.transform = .identity
            },
            completion: nil
        )
    }

    /// Creates a single button for an action (icon + label in a vertical stack).
    private func makeButton(for action: NativeSelectionAction, tintColor: UIColor) -> UIControl {
        let control = UIControl()
        control.accessibilityIdentifier = action.id
        control.translatesAutoresizingMaskIntoConstraints = false
        control.isUserInteractionEnabled = true

        let iconView = UIImageView()
        iconView.contentMode = .scaleAspectFit
        iconView.tintColor = tintColor
        iconView.image = UIImage(systemName: action.systemIcon ?? "circle")
        iconView.translatesAutoresizingMaskIntoConstraints = false
        iconView.heightAnchor.constraint(equalToConstant: 22).isActive = true
        iconView.widthAnchor.constraint(equalToConstant: 22).isActive = true

        let label = UILabel()
        label.text = action.title
        label.textAlignment = .center
        label.font = UIFont.systemFont(ofSize: 12, weight: .semibold)
        label.textColor = tintColor
        label.numberOfLines = 1

        let column = UIStackView(arrangedSubviews: [iconView, label])
        column.axis = .vertical
        column.alignment = .center
        column.spacing = 6
        column.translatesAutoresizingMaskIntoConstraints = false
        column.isUserInteractionEnabled = false

        control.addSubview(column)
        NSLayoutConstraint.activate([
            column.leadingAnchor.constraint(equalTo: control.leadingAnchor),
            column.trailingAnchor.constraint(equalTo: control.trailingAnchor),
            column.topAnchor.constraint(equalTo: control.topAnchor, constant: 4),
            column.bottomAnchor.constraint(equalTo: control.bottomAnchor, constant: -4)
        ])

        control.addTarget(self, action: #selector(handleTap(_:)), for: .touchUpInside)

        return control
    }

    // MARK: - Touch handling

    @objc private func handleTap(_ sender: UIControl) {
        guard let id = sender.accessibilityIdentifier else { return }
        onActionTapped?(id)
    }
}

// MARK: - Capacitor plugin

@objc(NativeSelectionActionBarPlugin)
public class NativeSelectionActionBarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeSelectionActionBarPlugin"
    public let jsName = "NativeSelectionActionBarPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "present", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "dismiss", returnType: CAPPluginReturnPromise)
    ]

    private var actionBar: NativeSelectionActionBarView?

    @objc func present(_ call: CAPPluginCall) {
        let rawActions = call.getArray("actions", JSObject.self) ?? []
        let actions = rawActions.compactMap(NativeSelectionAction.init(jsObject:))
        let tintColor = call.getString("tintColor")?.toUIColor(defaultColor: .label)
        let backgroundColor = call.getString("backgroundColor")?.toUIColor(
            defaultColor: UIColor.logseqBackground.withAlphaComponent(0.94)
        )

        DispatchQueue.main.async {
            guard let host = self.hostView() else {
                call.reject("Host view not found")
                return
            }

            guard !actions.isEmpty else {
                self.actionBar?.dismiss()
                self.actionBar = nil
                call.resolve()
                return
            }

            let bar = self.actionBar ?? NativeSelectionActionBarView()
            bar.onActionTapped = { [weak self] id in
                print("action id", id)
                self?.notifyListeners("action", data: ["id": id])
            }
            bar.present(
                on: host,
                actions: actions,
                tintColor: tintColor,
                backgroundColor: backgroundColor
            )
            self.actionBar = bar

            call.resolve()
        }
    }

    @objc func dismiss(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.actionBar?.dismiss()
            self.actionBar = nil
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

// MARK: - Helpers

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
        case 6:
            return UIColor(
                red:   CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0,
                green: CGFloat((rgbValue & 0x00FF00) >> 8)  / 255.0,
                blue:  CGFloat(rgbValue & 0x0000FF)         / 255.0,
                alpha: 1.0
            )
        case 8:
            return UIColor(
                red:   CGFloat((rgbValue & 0xFF000000) >> 24) / 255.0,
                green: CGFloat((rgbValue & 0x00FF0000) >> 16) / 255.0,
                blue:  CGFloat((rgbValue & 0x0000FF00) >> 8)  / 255.0,
                alpha: CGFloat(rgbValue & 0x000000FF)         / 255.0
            )
        default:
            return defaultColor
        }
    }
}
