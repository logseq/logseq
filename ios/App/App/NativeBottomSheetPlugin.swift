import Capacitor
import UIKit

@objc(NativeBottomSheetPlugin)
public class NativeBottomSheetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeBottomSheetPlugin"
    public let jsName = "NativeBottomSheetPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "present", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "dismiss", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "contentReady", returnType: CAPPluginReturnPromise)
    ]

    private weak var backgroundSnapshotView: UIView?
    private weak var previousParent: UIViewController?
    private var sheetController: NativeBottomSheetViewController?
    private var awaitingContentReady = false
    private var dismissalFallbackWorkItem: DispatchWorkItem?

    /// Single source of truth: when true, the bottom sheet owns the shared webview.
    public static var isPresentingSheet: Bool = false

    // MARK: - Public API

    @objc func present(_ call: CAPPluginCall) {

        DispatchQueue.main.async {
            // If a sheet is already visible, just resolve.
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

            // Optional: snapshot for a nice frozen background (does not affect ownership)
            _ = self.showSnapshot(in: host)

            // MARK: sheet takes ownership of the shared webview
            NativeBottomSheetPlugin.isPresentingSheet = true

            SharedWebViewController.instance.attach(
                to: controller,
                // IMPORTANT: do not leave a live webview behind the sheet
                leavePlaceholderInPreviousParent: false
            )

            self.notifyListeners("state", data: ["presenting": true])

            host.present(controller, animated: true) {
                self.notifyListeners("state", data: ["presented": true])
                call.resolve()
            }

            self.sheetController = controller
        }
    }

    @objc func dismiss(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let controller = self.sheetController else {
                call.resolve()
                return
            }
            controller.dismiss(animated: true) {
                // handleSheetDismissed will run via viewDidDisappear / delegate
                call.resolve()
            }
        }
    }

    @objc func contentReady(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.awaitingContentReady else {
                call.resolve()
                return
            }

            self.finishDismissal()
            call.resolve()
        }
    }

    // MARK: - Internal helpers

    private func handleSheetDismissed() {
        guard sheetController != nil else { return }

        let shared = SharedWebViewController.instance
        let previous = self.previousParent

        DispatchQueue.main.async {
            guard let previous = previous else { return }

            // We keep the snapshot/placeholder visible.
            // Hide the real webview container so its sheet content never flashes.
            if let webView = shared.bridgeController.bridge?.webView {
                webView.alpha = 0

                // Attach immediately so JS updates run in the correct context
                shared.attach(to: previous)

                // Sheet is logically gone now
                NativeBottomSheetPlugin.isPresentingSheet = false
                self.sheetController = nil
                self.previousParent = nil

                self.awaitingContentReady = true

                // JS listens to this to clear the popup. The snapshot stays up
                // until JS confirms the non-popup UI has rendered.
                self.notifyListeners("state", data: ["dismissing": true])
                self.scheduleDismissalFallback()
            }
        }
    }

    private func finishDismissal() {
        dismissalFallbackWorkItem?.cancel()
        dismissalFallbackWorkItem = nil
        awaitingContentReady = false

        if let webView = SharedWebViewController.instance.bridgeController.bridge?.webView {
            webView.alpha = 1
        }

        clearSnapshot()
        SharedWebViewController.instance.clearPlaceholder()

        notifyListeners("state", data: [
            "presented": false,
            "dismissing": false
        ])
    }

    private func scheduleDismissalFallback() {
        dismissalFallbackWorkItem?.cancel()

        let workItem = DispatchWorkItem { [weak self] in
            guard let self, self.awaitingContentReady else { return }
            self.finishDismissal()
        }

        dismissalFallbackWorkItem = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + 2, execute: workItem)
    }

    private func showSnapshot(in host: UIViewController) -> Bool {
        clearSnapshot()

        // Make sure layout is up-to-date (important after tab switches)
        host.view.layoutIfNeeded()

        guard let snapshot = SharedWebViewController.instance.makeSnapshotView() else {
            return false
        }
        snapshot.frame = host.view.bounds
        snapshot.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        host.view.addSubview(snapshot)
        host.view.bringSubviewToFront(snapshot)
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
        view.backgroundColor = .logseqBackground
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
        let identifier = UISheetPresentationController.Detent.Identifier("logseq.custom")
        let custom = UISheetPresentationController.Detent.custom(identifier: identifier) { _ in
            height
        }
        sheet.detents = configuration.allowFullHeight ? [custom, .large()] : [custom]
        sheet.selectedDetentIdentifier = identifier
    }

    private func notifyDismissed() {
        guard !didNotifyDismiss else { return }
        didNotifyDismiss = true
        onDismiss?()
    }
}
