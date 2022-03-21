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
    var filesNeededToDownload = Set<String>()
    let extensions = [
        "md",
        "org",
        "css",
        "edn",
        "excalidraw"
    ]
    
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
                handleDownloadFolderLoop()
            } catch {
                print(error.localizedDescription)
            }
        }
        call.resolve(["success": downloaded])
     }
    
    func appendUndownloadedFile(at url: URL){
        var lastPathComponent = url.lastPathComponent
        lastPathComponent.removeFirst()
        let dirPath = url.deletingLastPathComponent().path
        let filePath = dirPath + "/" + lastPathComponent.replacingOccurrences(of: ".icloud", with: "")
        let neededToHandle = !extensions.allSatisfy{ !filePath.hasSuffix($0) }
        
        if neededToHandle {
            filesNeededToDownload.insert(filePath)
        }
    }
    
    func downloadAllFilesFromCloud(at url: URL, ignorePattern ignores: [String] = []) throws -> Bool {

        let files = try fileManager.contentsOfDirectory(at: url, includingPropertiesForKeys: nil, options: [])

        for file in files {
            if file.pathExtension.lowercased() == "icloud" {
                do {
                    try fileManager.startDownloadingUbiquitousItem(at: file)
                    appendUndownloadedFile(at: file)
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
    

    func handleDownloadFolder() {
        for file in filesNeededToDownload {
            if fileManager.fileExists(atPath: file) {
                filesNeededToDownload.remove(file)
            }
        }
    }
    
    func handleDownloadFolderLoop () {
        while !filesNeededToDownload.isEmpty {
            let count = filesNeededToDownload.count
            let interval = min(Double(count) * 0.1, 2)
            Thread.sleep(forTimeInterval: interval)
            handleDownloadFolder()
        }
    }
}
