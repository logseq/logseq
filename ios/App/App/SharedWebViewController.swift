//
//  SharedWebViewController.swift
//  Logseq
//
//  Maintains a single shared AppViewController (Capacitor Bridge Host) and
//  re-attaches it to multiple UINavigationController-based pages.
//  This avoids reloading the WebView and enables native transitions.
//

import Foundation
import UIKit
import Capacitor

@objc class SharedWebViewController: NSObject {
    static let instance = SharedWebViewController()

    // The single shared CAPBridgeViewController (AppViewController)
    lazy var bridgeController: AppViewController = {
        let vc = AppViewController()

        // Ensure the view is loaded so that vc.webView is created
        vc.loadViewIfNeeded()

        return vc
    }()

    private weak var currentParent: UIViewController?
    private weak var placeholderView: UIView?
    private var snapshots: [ObjectIdentifier: UIImage] = [:]

    // MARK: - Attach / Detach

    /// Attach the shared WebView host (`bridgeController`) to a new parent view controller.
    /// Optionally leave a snapshot placeholder in the previous parent for smoother transitions.
    func attach(to parent: UIViewController, leavePlaceholderInPreviousParent: Bool = false) {
        let vc = bridgeController
        guard currentParent !== parent else { return }

        // 1) Snapshot current parent if requested
        if leavePlaceholderInPreviousParent,
           let previous = currentParent,
           placeholderView == nil,
           let snapshot = previous.view.snapshotView(afterScreenUpdates: true) {

            snapshot.frame = previous.view.bounds
            snapshot.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            previous.view.addSubview(snapshot)
            placeholderView = snapshot
        }

        // 2) Detach from previous parent
        if let previous = currentParent {
            vc.willMove(toParent: nil)
            vc.view.removeFromSuperview()
            vc.removeFromParent()
        }

        // 3) Attach to new parent
        currentParent = parent

        parent.addChild(vc)

        vc.view.frame = parent.view.bounds
        vc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        parent.view.addSubview(vc.view)
        vc.didMove(toParent: parent)
    }

    /// Remove any placeholder snapshot left in the previous parent.
    func clearPlaceholder() {
        placeholderView?.removeFromSuperview()
        placeholderView = nil
    }

    // MARK: - Live Snapshot View (for transitions)

    /// Create a snapshot view of the current WebView for use during transitions.
    func makeSnapshotView() -> UIView? {
        let vc = bridgeController
        let bounds = vc.view.bounds
        guard bounds.width > 0, bounds.height > 0 else { return nil }

        // Try UIView snapshot first
        if let snapshotView = vc.view.snapshotView(afterScreenUpdates: true) {
            snapshotView.frame = bounds
            snapshotView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            return snapshotView
        }

        // Fallback: render manually as an image
        let format = UIGraphicsImageRendererFormat()
        format.scale = vc.view.window?.screen.scale ?? UIScreen.main.scale
        format.opaque = true // fully opaque with logseq background

        let renderer = UIGraphicsImageRenderer(bounds: bounds, format: format)
        let image = renderer.image { ctx in
            UIColor.logseqBackground.setFill()
            ctx.fill(bounds)
            vc.view.drawHierarchy(in: bounds, afterScreenUpdates: true)
        }

        let imageView = UIImageView(image: image)
        imageView.frame = bounds
        imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        imageView.contentMode = .scaleToFill
        imageView.backgroundColor = .logseqBackground

        return imageView
    }

    // MARK: - Cached Snapshots (per parent)

    /// Store a static snapshot image for a given parent view controller.
    /// Used for caching between transitions.
    func storeSnapshot(for parent: UIViewController) {
        let vc = bridgeController
        guard currentParent === parent else { return }

        let bounds = vc.view.bounds
        guard bounds.width > 0, bounds.height > 0 else { return }

        let format = UIGraphicsImageRendererFormat()
        format.scale = vc.view.window?.screen.scale ?? UIScreen.main.scale
        format.opaque = true

        let renderer = UIGraphicsImageRenderer(bounds: bounds, format: format)
        let image = renderer.image { ctx in
            UIColor.logseqBackground.setFill()
            ctx.fill(bounds)
            vc.view.drawHierarchy(in: bounds, afterScreenUpdates: true)
        }

        snapshots[ObjectIdentifier(parent)] = image
    }

    /// Retrieve a previously stored snapshot for a given parent.
    func snapshot(for parent: UIViewController) -> UIImage? {
        return snapshots[ObjectIdentifier(parent)]
    }
}
