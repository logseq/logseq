//
//  FileSync.swift
//  Logseq
//
//  Created by Mono Wang on 2/24/R4.
//

import Capacitor
import Foundation
import AWSMobileClient
import CryptoKit


// MARK: Global variable

// Defualts to dev
var URL_BASE = URL(string: "https://api.logseq.com/file-sync/")!
var BUCKET: String = "logseq-file-sync-bucket"
var REGION: String = "us-east-2"

var ENCRYPTION_SECRET_KEY: String? = nil
var ENCRYPTION_PUBLIC_KEY: String? = nil

// MARK: Metadata type

public struct SyncMetadata: CustomStringConvertible, Equatable {
    var md5: String
    var size: Int

    public init?(of fileURL: URL) {
        do {
            let fileAttributes = try fileURL.resourceValues(forKeys:[.isRegularFileKey, .fileSizeKey])
            guard fileAttributes.isRegularFile! else {
                return nil
            }
            size = fileAttributes.fileSize ?? 0

            // incremental MD5 checksum
            let bufferSize = 512 * 1024
            let file = try FileHandle(forReadingFrom: fileURL)
            defer {
                file.closeFile()
            }
            var ctx = Insecure.MD5.init()
            while autoreleasepool(invoking: {
                let data = file.readData(ofLength: bufferSize)
                if data.count > 0 {
                    ctx.update(data: data)
                    return true // continue
                } else {
                    return false // eof
                }
            }) {}

            let computed = ctx.finalize()
            md5 = computed.map { String(format: "%02hhx", $0) }.joined()
        } catch {
            return nil
        }
    }

    public var description: String {
        return "SyncMetadata(md5=\(md5), size=\(size))"
    }
}

// MARK: encryption helper

func maybeEncrypt(_ plaindata: Data) -> Data! {
    // avoid encryption twice
    if plaindata.starts(with: "-----BEGIN AGE ENCRYPTED FILE-----".data(using: .utf8)!) ||
        plaindata.starts(with: "age-encryption.org/v1\n".data(using: .utf8)!) {
        return plaindata
    }
    if let publicKey = ENCRYPTION_PUBLIC_KEY {
        // use armor = false, for smaller size
        if let cipherdata = AgeEncryption.encryptWithPassphrase(plaindata, publicKey, armor: false) {
            return cipherdata
        }
        return nil // encryption fail
    }
    return plaindata
}

func maybeDecrypt(_ cipherdata: Data) -> Data! {
    if let secretKey = ENCRYPTION_SECRET_KEY {
        if cipherdata.starts(with: "-----BEGIN AGE ENCRYPTED FILE-----".data(using: .utf8)!) ||
            cipherdata.starts(with: "age-encryption.org/v1\n".data(using: .utf8)!) {
            if let plaindata = AgeEncryption.decryptWithX25519(cipherdata, secretKey) {
                return plaindata
            }
            return nil
        }
        // not an encrypted file
        return cipherdata
    }
    return cipherdata
}

// MARK: FileSync Plugin

@objc(FileSync)
public class FileSync: CAPPlugin, SyncDebugDelegate {
    override public func load() {
        print("debug File sync iOS plugin loaded!")

        AWSMobileClient.default().initialize { (userState, error) in
            guard error == nil else {
                print("error initializing AWSMobileClient. Error: \(error!.localizedDescription)")
                return
            }
        }
    }

    // NOTE: for debug, or an activity indicator
    public func debugNotification(_ message: [String: Any]) {
        self.notifyListeners("debug", data: message)
    }

    @objc func keygen(_ call: CAPPluginCall) {
        let (secretKey, publicKey) = AgeEncryption.keygen()
        call.resolve(["secretKey": secretKey,
                      "publicKey": publicKey])
    }

    @objc func setKey(_ call: CAPPluginCall) {
        let secretKey = call.getString("secretKey")
        let publicKey = call.getString("publicKey")
        if secretKey == nil && publicKey == nil {
            ENCRYPTION_SECRET_KEY = nil
            ENCRYPTION_PUBLIC_KEY = nil
        }
        guard let secretKey = secretKey, let publicKey = publicKey else {
            call.reject("both secretKey and publicKey should be provided")
            return
        }
        ENCRYPTION_SECRET_KEY = secretKey
        ENCRYPTION_PUBLIC_KEY = publicKey
    }

    @objc func setEnv(_ call: CAPPluginCall) {
        guard let env = call.getString("env") else {
            call.reject("required parameter: env")
            return
        }
        self.setKey(call)

        switch env {
        case "production", "product", "prod":
            URL_BASE = URL(string: "https://api-prod.logseq.com/file-sync/")!
            BUCKET = "logseq-file-sync-bucket-prod"
            REGION = "us-east-1"
        case "development", "develop", "dev":
            URL_BASE = URL(string: "https://api.logseq.com/file-sync/")!
            BUCKET = "logseq-file-sync-bucket"
            REGION = "us-east-2"
        default:
            call.reject("invalid env: \(env)")
            return
        }

        self.debugNotification(["event": "setenv:\(env)"])
        call.resolve(["ok": true])
    }

    @objc func getLocalFilesMeta(_ call: CAPPluginCall) {
        guard let basePath = call.getString("basePath"),
              let filePaths = call.getArray("filePaths") as? [String] else {
                  call.reject("required paremeters: basePath, filePaths")
                  return
              }
        guard let baseURL = URL(string: basePath) else {
            call.reject("invalid basePath")
            return
        }

        var fileMetadataDict: [String: [String: Any]] = [:]
        for filePath in filePaths {
            let url = baseURL.appendingPathComponent(filePath)
            if let meta = SyncMetadata(of: url) {
                fileMetadataDict[filePath] = ["md5": meta.md5,
                                              "size": meta.size]
            }
        }

        call.resolve(["result": fileMetadataDict])
    }

    @objc func getLocalAllFilesMeta(_ call: CAPPluginCall) {
        guard let basePath = call.getString("basePath"),
              let baseURL = URL(string: basePath) else {
                  call.reject("invalid basePath")
                  return
              }

        var fileMetadataDict: [String: [String: Any]] = [:]
        if let enumerator = FileManager.default.enumerator(at: baseURL, includingPropertiesForKeys: [.isRegularFileKey], options: [.skipsPackageDescendants, .skipsHiddenFiles]) {

            for case let fileURL as URL in enumerator {
                if !fileURL.isSkipped() {
                    if let meta = SyncMetadata(of: fileURL) {
                        fileMetadataDict[fileURL.relativePath(from: baseURL)!] = ["md5": meta.md5,
                                                                                  "size": meta.size]
                    }
                } else if fileURL.isICloudPlaceholder() {
                    try? FileManager.default.startDownloadingUbiquitousItem(at: fileURL)
                }
            }
        }
        call.resolve(["result": fileMetadataDict])
    }


    @objc func renameLocalFile(_ call: CAPPluginCall) {
        guard let basePath = call.getString("basePath"),
              let baseURL = URL(string: basePath) else {
                  call.reject("invalid basePath")
                  return
              }
        guard let from = call.getString("from") else {
            call.reject("invalid from file")
            return
        }
        guard let to = call.getString("to") else {
            call.reject("invalid to file")
            return
        }

        let fromUrl = baseURL.appendingPathComponent(from)
        let toUrl = baseURL.appendingPathComponent(to)

        do {
            try FileManager.default.moveItem(at: fromUrl, to: toUrl)
        } catch {
            call.reject("can not rename file: \(error.localizedDescription)")
            return
        }
        call.resolve(["ok": true])

    }

    @objc func deleteLocalFiles(_ call: CAPPluginCall) {
        guard let baseURL = call.getString("basePath").flatMap({path in URL(string: path)}),
              let filePaths = call.getArray("filePaths") as? [String] else {
                  call.reject("required paremeters: basePath, filePaths")
                  return
              }

        for filePath in filePaths {
            let fileUrl = baseURL.appendingPathComponent(filePath)
            try? FileManager.default.removeItem(at: fileUrl) // ignore any delete errors
        }
        call.resolve(["ok": true])
    }

    /// remote -> local
    @objc func updateLocalFiles(_ call: CAPPluginCall) {
        guard let baseURL = call.getString("basePath").flatMap({path in URL(string: path)}),
              let filePaths = call.getArray("filePaths") as? [String],
              let graphUUID = call.getString("graphUUID") ,
              let token = call.getString("token") else {
                  call.reject("required paremeters: basePath, filePaths, graphUUID, token")
                  return
              }

        let client = SyncClient(token: token, graphUUID: graphUUID)
        client.delegate = self // receives notification

        client.getFiles(at: filePaths) {  (fileURLs, error) in
            if let error = error {
                print("debug getFiles error \(error)")
                self.debugNotification(["event": "download:error", "data": ["message": "error while getting files \(filePaths)"]])
                call.reject(error.localizedDescription)
            } else {
                // handle multiple completionHandlers
                let group = DispatchGroup()

                var downloaded: [String] = []

                for (filePath, remoteFileURL) in fileURLs {
                    group.enter()

                    // NOTE: fileURLs from getFiles API is percent-encoded
                    let localFileURL = baseURL.appendingPathComponent(filePath.decodeFromFname())
                    remoteFileURL.download(toFile: localFileURL) {error in
                        if let error = error {
                            self.debugNotification(["event": "download:error", "data": ["message": "error while downloading \(filePath): \(error)"]])
                            print("debug download \(error) in \(filePath)")
                        } else {
                            self.debugNotification(["event": "download:file", "data": ["file": filePath]])
                            downloaded.append(filePath)
                        }
                        group.leave()
                    }
                }
                group.notify(queue: .main) {
                    self.debugNotification(["event": "download:done"])
                    call.resolve(["ok": true, "data": downloaded])
                }

            }
        }
    }

    @objc func deleteRemoteFiles(_ call: CAPPluginCall) {
        guard let filePaths = call.getArray("filePaths") as? [String],
              let graphUUID = call.getString("graphUUID"),
              let token = call.getString("token"),
              let txid = call.getInt("txid") else {
                  call.reject("required paremeters: filePaths, graphUUID, token, txid")
                  return
              }
        guard !filePaths.isEmpty else {
            call.reject("empty filePaths")
            return
        }

        let client = SyncClient(token: token, graphUUID: graphUUID, txid: txid)
        client.deleteFiles(filePaths) { txid, error in
            guard error == nil else {
                call.reject("delete \(error!)")
                return
            }
            guard let txid = txid else {
                call.reject("missing txid")
                return
            }
            call.resolve(["ok": true, "txid": txid])
        }
    }

    /// local -> remote
    @objc func updateRemoteFiles(_ call: CAPPluginCall) {
        guard let baseURL = call.getString("basePath").flatMap({path in URL(string: path)}),
              let filePaths = call.getArray("filePaths") as? [String],
              let graphUUID = call.getString("graphUUID"),
              let token = call.getString("token"),
              let txid = call.getInt("txid") else {
                  call.reject("required paremeters: basePath, filePaths, graphUUID, token, txid")
                  return
              }
        guard !filePaths.isEmpty else {
            return call.reject("empty filePaths")
        }

        let client = SyncClient(token: token, graphUUID: graphUUID, txid: txid)
        client.delegate = self

        // 1. refresh_temp_credential
        client.getTempCredential() { (credentials, error) in
            guard error == nil else {
                self.debugNotification(["event": "upload:error", "data": ["message": "error while refreshing credential: \(error!)"]])
                call.reject("error(getTempCredential): \(error!)")
                return
            }

            var files: [String: URL] = [:]
            for filePath in filePaths {
                // NOTE: filePath from js may contain spaces
                let fileURL = baseURL.appendingPathComponent(filePath)
                files[filePath.encodeAsFname()] = fileURL
            }

            // 2. upload_temp_file
            client.uploadTempFiles(files, credentials: credentials!) { (uploadedFileKeyDict, error) in
                guard error == nil else {
                    self.debugNotification(["event": "upload:error", "data": ["message": "error while uploading temp files: \(error!)"]])
                    call.reject("error(uploadTempFiles): \(error!)")
                    return
                }
                // 3. update_files
                guard !uploadedFileKeyDict.isEmpty else {
                    self.debugNotification(["event": "upload:error", "data": ["message": "no file to update"]])
                    call.reject("no file to update")
                    return
                }
                client.updateFiles(uploadedFileKeyDict) { (txid, error) in
                    guard error == nil else {
                        self.debugNotification(["event": "upload:error", "data": ["message": "error while updating files: \(error!)"]])
                        call.reject("error updateFiles: \(error!)")
                        return
                    }
                    guard let txid = txid else {
                        call.reject("error: missing txid")
                        return
                    }
                    self.debugNotification(["event": "upload:done", "data": ["files": filePaths, "txid": txid]])
                    call.resolve(["ok": true, "files": uploadedFileKeyDict, "txid": txid])
                }
            }
        }
    }
}
