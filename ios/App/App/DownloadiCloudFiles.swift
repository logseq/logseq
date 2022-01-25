//
//  DownloadiCloudFiles.swift
//  Logseq
//
//  Created by leizhe on 2021/12/29.
//

import Foundation
import Capacitor

@objc(DownloadiCloudFiles)
public class DownloadiCloudFiles: CAPPlugin,  UIDocumentPickerDelegate  {
    
    public var _call: CAPPluginCall? = nil

    let fileManager = FileManager.default
    
    var containerUrl: URL? {
        return fileManager.url(forUbiquityContainerIdentifier: nil)?.appendingPathComponent("Documents")
    }
    
    var isDirectory: ObjCBool = false
    var downloaded = false
    
    @objc func syncGraph(_ call: CAPPluginCall) {
        
        guard let graph = call.options["graph"] as? String else {
            call.reject("Missing graph name")
            return
        }
 
        let ignores = [".git", ".trash", "bak", ".recycle"]
        
        if let url = self.containerUrl?.appendingPathComponent(graph) {
            do {
                downloaded = try self.downloadAllFilesFromCloud(at: url, ignorePattern: ignores)
            } catch {
                print(error.localizedDescription)
            }
        }
        call.resolve(["success": downloaded])
    }
    
    @objc func iCloudSync(_ call: CAPPluginCall) {

        if let url = self.containerUrl, fileManager.fileExists(atPath: url.path) {
            do {
                downloaded = try self.downloadAllFilesFromCloud(at: url, ignorePattern: [".git", ".Trash", "bak", ".recycle"])
            } catch {
                print(error.localizedDescription)
            }
        }
        
        call.resolve(["success": downloaded])
    }
    
    func downloadAllFilesFromCloud(at url: URL, ignorePattern ignores: [String] = []) throws -> Bool {

        let files = try fileManager.contentsOfDirectory(at: url, includingPropertiesForKeys: nil, options: [])

        for file in files {
            if file.pathExtension.lowercased() == "icloud" {
                do {
                    try fileManager.startDownloadingUbiquitousItem(at: file)
                } catch {
                    print("Unexpected error: \(error).")
                }
            } else {
                if fileManager.fileExists(atPath: file.path, isDirectory:&isDirectory) {
                    if isDirectory.boolValue && !ignores.contains(file.lastPathComponent) {
                        if try downloadAllFilesFromCloud(at: file, ignorePattern: ignores) {
                            downloaded = true
                        }
                    }
                }
            }
        }
        return downloaded
    }
}
