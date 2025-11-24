import Capacitor
import UIKit

@objc(NativeBottomSheetPlugin)
public class NativeBottomSheetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeBottomSheetPlugin"
    public let jsName = "NativeBottomSheetPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "present", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "dismiss", returnType: CAPPluginReturnPromise)
    ]

    private weak var backgroundSnapshotView: UIView?
    private weak var previousParent: UIViewController?
    private var sheetController: NativeBottomSheetViewController?

    @objc func present(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else {
            call.reject("Native sheet requires iOS 15 or newer")
            return
        }

        DispatchQueue.main.async {
            if self.sheetController != nil {
                call.resolve()
                return
            }

            guard let host = self.bridge?.viewController?.parent else {
                call.reject("Unable to locate host view controller")
                return
            }

            let config = NativeBottomSheetConfiguration(
                defaultHeight: self.height(from: call, key: "defaultHeight"),
                allowFullHeight: call.getBool("allowFullHeight") ?? true
            )

            let controller = NativeBottomSheetViewController(configuration: config)
            controller.onDismiss = { [weak self] in
                self?.handleSheetDismissed()
            }

            self.previousParent = host
            let hasSnapshot = self.showSnapshot(in: host)
            SharedWebViewController.instance.attach(
                to: controller,
                leavePlaceholderInPreviousParent: !hasSnapshot
            )

            host.present(controller, animated: true) {
                self.notifyListeners("state", data: ["presented": true])
            }
            self.sheetController = controller
            call.resolve()
        }
    }

    @objc func dismiss(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let controller = self.sheetController else {
                call.resolve()
                return
            }
            controller.dismiss(animated: true) {
                call.resolve()
            }
        }
    }

    private func handleSheetDismissed() {
        guard sheetController != nil else { return }

        DispatchQueue.main.async {
            if let previous = self.previousParent {
                SharedWebViewController.instance.attach(to: previous)
            }
            self.clearSnapshot()
            SharedWebViewController.instance.clearPlaceholder()
            self.sheetController = nil
            self.previousParent = nil
            self.notifyListeners("state", data: ["presented": false])
        }
    }

    private func showSnapshot(in host: UIViewController) -> Bool {
        clearSnapshot()
        guard let snapshot = SharedWebViewController.instance.makeSnapshotView() else {
            return false
        }
        snapshot.frame = host.view.bounds
        snapshot.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        host.view.addSubview(snapshot)
        backgroundSnapshotView = snapshot
        return true
    }

    private func clearSnapshot() {
        backgroundSnapshotView?.removeFromSuperview()
        backgroundSnapshotView = nil
    }

    private func height(from call: CAPPluginCall, key: String) -> CGFloat? {
        guard let value = call.getValue(key) else { return nil }
        if let number = value as? NSNumber {
            return CGFloat(truncating: number)
        }
        return nil
    }
}

// MARK: - View controller + configuration

private struct NativeBottomSheetConfiguration {
    let defaultHeight: CGFloat?
    let allowFullHeight: Bool
}

@available(iOS 15.0, *)
private class NativeBottomSheetViewController: UIViewController, UISheetPresentationControllerDelegate {
    let configuration: NativeBottomSheetConfiguration
    var onDismiss: (() -> Void)?
    private var didNotifyDismiss = false

    init(configuration: NativeBottomSheetConfiguration) {
        self.configuration = configuration
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .pageSheet
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        configureSheet()
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        if isBeingDismissed || presentingViewController == nil {
            notifyDismissed()
        }
    }

    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        notifyDismissed()
    }

    private func configureSheet() {
        guard let sheet = sheetPresentationController else { return }
        sheet.delegate = self
        sheet.prefersGrabberVisible = true
        sheet.preferredCornerRadius = 18
        sheet.prefersScrollingExpandsWhenScrolledToEdge = true
        sheet.largestUndimmedDetentIdentifier = configuration.allowFullHeight ? .large : nil

        if let height = configuration.defaultHeight {
            configureCustomDetent(sheet: sheet, height: height)
        } else {
            sheet.detents = [.medium(), .large()]
            sheet.selectedDetentIdentifier = .medium
        }
    }

    private func configureCustomDetent(sheet: UISheetPresentationController, height: CGFloat) {
        if #available(iOS 16.0, *) {
            let identifier = UISheetPresentationController.Detent.Identifier("logseq.custom")
            let custom = UISheetPresentationController.Detent.custom(identifier: identifier) { _ in
                height
            }
            sheet.detents = configuration.allowFullHeight ? [custom, .large()] : [custom]
            sheet.selectedDetentIdentifier = identifier
        } else {
            sheet.detents = [.medium(), .large()]
            let threshold = UIScreen.main.bounds.height * 0.65
            sheet.selectedDetentIdentifier = height >= threshold ? .large : .medium
        }
    }

    private func notifyDismissed() {
        guard !didNotifyDismiss else { return }
        didNotifyDismiss = true
        onDismiss?()
    }
}
