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

  var iCloudContainerUrl: URL? {
    return FileManager.default.url(forUbiquityContainerIdentifier: nil)?.appendingPathComponent("Documents")
  }

  var localContainerUrl: URL? {
    return FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
  }

  @objc func ensureDocuments(_ call: CAPPluginCall) {
    var data: [String: String] = [:]

    if self.iCloudContainerUrl != nil {
      validateDocuments(at: self.iCloudContainerUrl!)
      data["iCloudContainerUrl"] = self.iCloudContainerUrl?.absoluteString
    }

    if self.localContainerUrl != nil {
      validateDocuments(at: self.localContainerUrl!)
      data["localContainerUrl"] = self.localContainerUrl?.absoluteString
    }

    call.resolve(data)
  }

  func validateDocuments(at url: URL) {

    if !FileManager.default.fileExists(atPath: url.path, isDirectory: nil) {
      do {
        print("the url = " + url.path)
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true, attributes: nil)
      } catch {
        print("container doesn't exist")
        print(error.localizedDescription)
      }
    }

    let str = ""
    let filename = url.appendingPathComponent(".logseq", isDirectory: false)

    if !FileManager.default.fileExists(atPath: filename.path) {
      do {
        try str.write(to: filename, atomically: true, encoding: String.Encoding.utf8)
      } catch {
        print("write .logseq failed")
        print(error.localizedDescription)
      }
    }
  }
}
