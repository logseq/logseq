//
//  FileContainer.swift
//  App
//
//

import Capacitor
import Foundation
import MobileCoreServices

@objc(FileContainer)
public class FileContainer: CAPPlugin, UIDocumentPickerDelegate {

    public var _call: CAPPluginCall? = nil

    var containerUrl: URL? {
        return FileManager.default.url(forUbiquityContainerIdentifier: nil)?.appendingPathComponent("Documents")
    }

    @objc func ensureDocuments(_ call: CAPPluginCall) {
        self._call = call

        // check for container existence
        if let url = self.containerUrl, !FileManager.default.fileExists(atPath: url.path, isDirectory: nil) {
            do {
                print("the url = " + url.path)
                try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true, attributes: nil)
            }
            catch {
                print("container doesn't exist")
                print(error.localizedDescription)
            }
        }

        self._call?.resolve([
            "path": self.containerUrl?.path
                            ])
    }
}
