//
//  Utils.swift
//  Logseq
//
//  Created by leizhe on 2022/5/23.
//

import Foundation
import Capacitor

@objc(Utils)
public class Utils: CAPPlugin {

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
}
