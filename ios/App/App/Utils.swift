//
//  Utils.swift
//  Logseq
//
//  Created by leizhe on 2022/5/23.
//

import Foundation
import Capacitor

@objc(Utils)
public class Utils: CAPPlugin  {
    
    @objc func isZoomed(_ call: CAPPluginCall) {
        
        var isZoomed: Bool {
            return UIScreen.main.scale < UIScreen.main.nativeScale
        }

        call.resolve(["isZoomed": isZoomed])
    }
 }
