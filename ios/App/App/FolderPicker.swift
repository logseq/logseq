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

    public var _call: CAPPluginCall? = nil

    @objc func pickFolder(_ call: CAPPluginCall) {
        self._call = call

        DispatchQueue.main.async { [weak self] in
            let documentPicker = UIDocumentPickerViewController(
              documentTypes: [String(kUTTypeFolder)],
              in: UIDocumentPickerMode.open
            )

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
    ){
        var items: [String] = []

        for url in urls {
            items.append(url.absoluteString)
        }

        self._call?.resolve([
                              "path": items.first as Any
                            ])
    }
}
