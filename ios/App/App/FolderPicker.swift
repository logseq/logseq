//
//  FolderPicker.swift
//  App
//
//  Created by weihua on 9/29/21.
//

import Capacitor
import Foundation
import MobileCoreServices

@objc(FolderPicker)
public class FolderPicker: CAPPlugin, UIDocumentPickerDelegate {

  public var _call: CAPPluginCall?

  @objc func pickFolder(_ call: CAPPluginCall) {
    self._call = call

    DispatchQueue.main.async { [weak self] in

      let documentPicker = UIDocumentPickerViewController(
        documentTypes: [String(kUTTypeFolder)],
        in: UIDocumentPickerMode.open
      )

      // Set the initial directory.

      if let path = call.getString("path") {
        guard let url = URL(string: path) else {
             call.reject("can not parse url")
             return
        }

        print("picked folder url = " + url.path)

        documentPicker.directoryURL = url
      }

      documentPicker.allowsMultipleSelection = false
      documentPicker.delegate = self

      documentPicker.modalPresentationStyle = UIModalPresentationStyle.fullScreen

      self?.bridge?.viewController?.present(
        documentPicker,
        animated: true,
        completion: nil
      )
    }
  }

  public func documentPicker(
    _ controller: UIDocumentPickerViewController,
    didPickDocumentsAt urls: [URL]
  ) {
    var items: [String] = []
    let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)

    for url in urls {
      items.append(url.absoluteString)
    }

    self._call?.resolve([
      "path": items.first as Any,
      "localDocumentsPath": documentsPath[0] as Any
    ])
  }
}
