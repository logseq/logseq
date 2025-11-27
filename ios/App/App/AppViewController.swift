//
//  AppViewController.swift
//  Logseq
//
//  Created by Charlie on 2025/5/30.
//

import Foundation
import Capacitor
import UIKit

@objc public class AppViewController: CAPBridgeViewController {
    override public func capacitorDidLoad() {
        bridge?.registerPluginInstance(UILocalPlugin())
        bridge?.registerPluginInstance(NativeTopBarPlugin())
        bridge?.registerPluginInstance(LiquidTabsPlugin())
        bridge?.registerPluginInstance(NativeBottomSheetPlugin())
        bridge?.registerPluginInstance(NativeEditorToolbarPlugin())
        bridge?.registerPluginInstance(NativeSelectionActionBarPlugin())
    }

    public override func viewDidLoad() {
        super.viewDidLoad()

        // initial setup
        applyLogseqTheme()
    }

    // MARK: - Theme application (background + tint)

    private func applyLogseqTheme() {
        let bg = UIColor.logseqBackground
        let tint = UIColor.logseqTint

        // Background
        view.backgroundColor = bg

        if let webView = self.webView {
            webView.isOpaque = true
            webView.backgroundColor = bg
            webView.scrollView.backgroundColor = bg

            // Sometimes WKWebView uses an internal subview for its background
            webView.scrollView.subviews.first?.backgroundColor = bg
        }

        // Tint
        view.tintColor = tint
        webView?.tintColor = tint
        webView?.scrollView.tintColor = tint

        // Propagate to container UI if possible
        navigationController?.view.tintColor = tint
        navigationController?.navigationBar.tintColor = tint
        navigationController?.tabBarController?.tabBar.tintColor = tint

        // Global window tint (affects many UIKit + SwiftUI bits)
        if let window = view.window {
            window.tintColor = tint
        }
    }

    public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)

        guard let previousTraitCollection,
              traitCollection.hasDifferentColorAppearance(comparedTo: previousTraitCollection) else {
            return
        }

        // Re-apply dynamic colors when light/dark changes
        applyLogseqTheme()
    }
}
