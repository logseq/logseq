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

        let str = ""
        guard let filename = self.containerUrl?.appendingPathComponent(".logseq") else {
            return
        }

        if !FileManager.default.fileExists(atPath: filename.path) {
            do {
                try str.write(to: filename, atomically: true, encoding:  String.Encoding.utf8)
            }
            catch {
                // failed to write file – bad permissions, bad filename, missing permissions, or more likely it can't be converted to the encoding
            }
        }
        self._call?.resolve(["path": self.containerUrl?.path as Any])
    }
}
