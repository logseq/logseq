//
//  Utils.swift
//  Logseq
//
//  Created by leizhe on 2022/5/23.
//

import Foundation
import Capacitor
import UIKit

@objc(Utils)
public class Utils: CAPPlugin {
  private var currentInterfaceStyle: UIUserInterfaceStyle = .unspecified

  @objc func isZoomed(_ call: CAPPluginCall) {

    var isZoomed: Bool {
      UIScreen.main.scale < UIScreen.main.nativeScale
    }

    call.resolve(["isZoomed": isZoomed])
  }

  @objc func getDocumentRoot(_ call: CAPPluginCall) {
    let doc = FileManager.default.urls(
        for: .documentDirectory,
        in: .userDomainMask).first

    if doc != nil {
      call.resolve(["documentRoot": doc!.path])
    } else {
      call.resolve(["documentRoot": ""])
    }
  }

  @objc func setInterfaceStyle(_ call: CAPPluginCall) {
    let mode = call.getString("mode")?.lowercased() ?? "system"
    let followSystem = call.getBool("system") ?? (mode == "system")
    UserDefaults.standard.set(mode, forKey: "logseqTheme")
    UserDefaults.standard.synchronize()

    let style: UIUserInterfaceStyle
    if followSystem {
      style = .unspecified
    } else {
      style = (mode == "dark") ? .dark : .light
    }

    DispatchQueue.main.async {
      self.applyInterfaceStyle(style)
      call.resolve()
    }
  }

  private func applyInterfaceStyle(_ style: UIUserInterfaceStyle) {
    guard style != currentInterfaceStyle else { return }
    currentInterfaceStyle = style

    let app = UIApplication.shared

    let applyToWindow: (UIWindow) -> Void = { window in
      window.overrideUserInterfaceStyle = style
      window.rootViewController?.overrideUserInterfaceStyle = style
    }

    // Propagate to all active windows (handles multi-scene).
    let targetScenes = app.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .filter { $0.activationState == .foregroundActive || $0.activationState == .foregroundInactive }

    let windows = targetScenes.flatMap { $0.windows }
    if windows.isEmpty {
      app.windows.forEach(applyToWindow)
    } else {
      windows.forEach(applyToWindow)
    }

    // Bridge VC + WKWebView
    bridge?.viewController?.overrideUserInterfaceStyle = style
    bridge?.webView?.overrideUserInterfaceStyle = style

    // UINavigationController root (if available)
    if let nav = (app.delegate as? AppDelegate)?.navController {
      nav.overrideUserInterfaceStyle = style
      nav.viewControllers.forEach { $0.overrideUserInterfaceStyle = style }
    }
  }
}
