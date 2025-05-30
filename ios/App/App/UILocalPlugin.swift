//
//  UILocal.swift
//  App
//
//  Created by Charlie on 2025/5/29.
//

import Foundation
import Capacitor

@objc(UILocalPlugin)
public class UILocalPlugin: CAPPlugin, CAPBridgedPlugin {
  
  public let identifier = "UILocalPlugin"
  public let jsName = "UILocal"
  
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "showDatePicker", returnType: CAPPluginReturnPromise)
  ]
  
  @objc func showDatePicker(_ call: CAPPluginCall) {
    call.resolve(["msg": "TOOD show datepicker"])
  }
  
  
  override public func load () {
    print("🔅 UILocalPlugin loaded")
  }
}
