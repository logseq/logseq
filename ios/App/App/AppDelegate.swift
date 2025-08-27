// AppDelegate.swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

  var window: UIWindow?
  let maxBackgroundTime: TimeInterval = 300 // 5 minutes

  func applicationDidEnterBackground(_ application: UIApplication) {
    UserDefaults.standard.set(Date(), forKey: "backgroundEnterDate")
  }

  func applicationWillEnterForeground(_ application: UIApplication) {
    if let backgroundDate = UserDefaults.standard.object(forKey: "backgroundEnterDate") as? Date {
      let elapsed = Date().timeIntervalSince(backgroundDate)
      if elapsed > maxBackgroundTime {
          requestJsReload()
      }
    }
    UserDefaults.standard.removeObject(forKey: "backgroundEnterDate")
  }

  private func requestJsReload() {
      // Find the Bridge VC to get the bridge
      guard let root = window?.rootViewController else { return }
      let bridgeVC =
        (root as? UINavigationController)?.viewControllers.first as? CAPBridgeViewController
        ?? (root as? CAPBridgeViewController)

      bridgeVC?.bridge?.triggerJSEvent(eventName: "AppRestartRequired", target: "window")
  }
}
