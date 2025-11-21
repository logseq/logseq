//
//  SharedWebViewController.swift
//  Logseq
//
//  Manages a single CAPBridgeViewController (AppViewController) instance
//  that can be attached to multiple UINavigationController pages.
//

import Foundation
import UIKit
import Capacitor

@objc class SharedWebViewController: NSObject {
    static let instance = SharedWebViewController()

    // The single WebView host
    lazy var bridgeController: AppViewController = {
        let vc = AppViewController()
        return vc
    }()

    private weak var currentParent: UIViewController?
    private weak var placeholderView: UIView?

    func attach(to parent: UIViewController, leavePlaceholderInPreviousParent: Bool = false) {
        let vc = bridgeController
        guard currentParent !== parent else { return }

        if leavePlaceholderInPreviousParent,
           let previous = currentParent,
           placeholderView == nil,
           let snapshot = vc.view.snapshotView(afterScreenUpdates: false) {
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

        currentParent = parent
        parent.addChild(vc)
        vc.view.frame = parent.view.bounds
        vc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        parent.view.addSubview(vc.view)
        vc.didMove(toParent: parent)
    }

    func clearPlaceholder() {
        placeholderView?.removeFromSuperview()
        placeholderView = nil
    }
}
