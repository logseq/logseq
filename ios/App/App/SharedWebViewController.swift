//
//  SharedWebViewController.swift
//  Logseq
//
//  Manages a single CAPBridgeViewController (AppViewController) instance
//  that can be attached to multiple UINavigationController pages.
//

import Foundation
import Capacitor

@objc class SharedWebViewController: NSObject {
    static let instance = SharedWebViewController()

    // The single WebView host
    lazy var bridgeController: AppViewController = {
        let vc = AppViewController()
        return vc
    }()

    private weak var currentParent: UIViewController?

    func attach(to parent: UIViewController) {
        let vc = bridgeController
        guard currentParent !== parent else { return }

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
}
