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
    
    @objc func downloadFilesFromiCloud(_ call: CAPPluginCall) {
        
        if let url = self.containerUrl, fileManager.fileExists(atPath: url.path) {
            do {
                let downloaded = try self.downloadAllFilesFromCloud(at: url)
                print("All files has been downloaded!")
                self._call?.resolve(["success": downloaded])
            } catch {
                print("Can't download logseq's files from iCloud to local device.")
                print(error.localizedDescription)
            }
        }
    }
    
    func downloadAllFilesFromCloud(at url: URL) throws -> Bool {
            
        guard url.hasDirectoryPath else { return false }
        let files = try fileManager.contentsOfDirectory(at: url, includingPropertiesForKeys: nil, options: [])
        
        var completed = false
        
        for file in files {
            if file.pathExtension.lowercased().contains("icloud") {
                try fileManager.startDownloadingUbiquitousItem(at: url)
                completed = true
            } else {
                if try downloadAllFilesFromCloud(at: file) {
                    completed = true
                }
            }
        }
        return completed
    }
}
