//
//  AppViewController.swift
//  Logseq
//
//  Created by Charlie on 2025/5/30.
//

import Foundation
import Capacitor

@objc public class AppViewController: CAPBridgeViewController {
  override public func capacitorDidLoad() {
    bridge?.registerPluginInstance(UILocalPlugin())
    bridge?.registerPluginInstance(NativeTopBarPlugin())
    bridge?.registerPluginInstance(LiquidTabsPlugin())
    bridge?.registerPluginInstance(NativeBottomSheetPlugin())
  }
}
