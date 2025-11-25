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
  }

    public override func viewDidLoad() {
        super.viewDidLoad()

        // initial setup
        applyLogseqBackground()
    }

    private func applyLogseqBackground() {
        let bg = UIColor.logseqBackground
        view.backgroundColor = bg

        if let webView = self.webView {
            webView.isOpaque = true
            webView.backgroundColor = bg
            webView.scrollView.backgroundColor = bg

            // Sometimes WKWebView uses an internal subview for its background
            webView.scrollView.subviews.first?.backgroundColor = bg
        }
    }

    public override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)

        guard let previousTraitCollection,
              traitCollection.hasDifferentColorAppearance(comparedTo: previousTraitCollection) else {
            return
        }

        // Re-apply dynamic colors when light/dark changes
        applyLogseqBackground()
    }
}
