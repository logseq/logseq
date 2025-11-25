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

        // Set the background for the host view behind the WKWebView
        vc.view.backgroundColor = .logseqBackground
        vc.view.isOpaque = false   // Prevent black flashes during view transitions

        // Ensure the internal WKWebView is transparent
        if let webView = vc.webView {
            webView.isOpaque = false
            webView.backgroundColor = .clear
            webView.scrollView.backgroundColor = .clear
        }

        return vc
    }()

    private weak var currentParent: UIViewController?
    private weak var placeholderView: UIView?
    private var snapshots: [ObjectIdentifier: UIImage] = [:]

    /// Attach the shared WebView host (`bridgeController`) to a new parent view controller.
    /// Optionally leave a snapshot placeholder in the previous parent for smoother transitions.
    func attach(to parent: UIViewController, leavePlaceholderInPreviousParent: Bool = false) {
        let vc = bridgeController
        guard currentParent !== parent else { return }

        // If needed, create a snapshot placeholder in the old parent
        if leavePlaceholderInPreviousParent,
           let previous = currentParent,
           placeholderView == nil,
           let snapshot = vc.view.snapshotView(afterScreenUpdates: false) {

            snapshot.backgroundColor = .logseqBackground
            snapshot.frame = previous.view.bounds
            snapshot.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            previous.view.addSubview(snapshot)
            placeholderView = snapshot
        }

        // Detach from previous parent
        if let previous = currentParent {
            vc.willMove(toParent: nil)
            vc.view.removeFromSuperview()
            vc.removeFromParent()
            previous.didMove(toParent: nil)
        }

        // Attach to the new parent
        currentParent = parent
        parent.addChild(vc)

        vc.view.frame = parent.view.bounds
        vc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        // Ensure the new parent also uses the unified background color
        parent.view.backgroundColor = .logseqBackground
        parent.view.isOpaque = false

        parent.view.addSubview(vc.view)
        vc.didMove(toParent: parent)
    }

    /// Remove any placeholder snapshot left in the previous parent.
    func clearPlaceholder() {
        placeholderView?.removeFromSuperview()
        placeholderView = nil
    }

    /// Create a snapshot view of the current WebView for use during transitions.
    func makeSnapshotView() -> UIView? {
        let vc = bridgeController
        let bounds = vc.view.bounds
        guard bounds.width > 0, bounds.height > 0 else { return nil }

        // Try UIView snapshot first
        if let snapshotView = vc.view.snapshotView(afterScreenUpdates: true) {
            snapshotView.frame = bounds
            snapshotView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            snapshotView.backgroundColor = .logseqBackground
            return snapshotView
        }

        // Fallback: render manually as an image
        let format = UIGraphicsImageRendererFormat()
        format.scale = vc.view.window?.screen.scale ?? UIScreen.main.scale
        format.opaque = true // Avoid transparency to prevent blended dark edges

        let renderer = UIGraphicsImageRenderer(bounds: bounds, format: format)
        let image = renderer.image { ctx in
            // Fill background first to match the actual page appearance
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
        snapshots[ObjectIdentifier(parent)]
    }
}
