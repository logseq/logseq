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
var URL_BASE = URL(string: "https://api-dev.logseq.com/file-sync/")!
var BUCKET: String = "logseq-file-sync-bucket"
var REGION: String = "us-east-2"

var ENCRYPTION_SECRET_KEY: String? = nil
var ENCRYPTION_PUBLIC_KEY: String? = nil
var FNAME_ENCRYPTION_KEY: Data? = nil


// MARK: Helpers


@inline(__always) func fnameEncryptionEnabled() -> Bool {
    guard let _ = FNAME_ENCRYPTION_KEY else {
        return false
    }
    return true
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
        if let cipherdata = AgeEncryption.encryptWithX25519(plaindata, publicKey, armor: true) {
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

// MARK: Metadata type

public struct SyncMetadata: CustomStringConvertible, Equatable {
    var md5: String
    var size: Int
    var ctime: Int64
    var mtime: Int64

    public init?(of fileURL: URL) {
        do {
            let fileAttributes = try fileURL.resourceValues(forKeys:[.isRegularFileKey, .fileSizeKey, .contentModificationDateKey,
                                                                     .creationDateKey])
            guard fileAttributes.isRegularFile! else {
                return nil
            }
            size = fileAttributes.fileSize ?? 0
            mtime = Int64((fileAttributes.contentModificationDate?.timeIntervalSince1970 ?? 0.0) * 1000)
            ctime = Int64((fileAttributes.creationDate?.timeIntervalSince1970 ?? 0.0) * 1000)

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
        return "SyncMetadata(md5=\(md5), size=\(size), mtime=\(mtime))"
    }
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
            FNAME_ENCRYPTION_KEY = nil
            return
        }
        guard let secretKey = secretKey, let publicKey = publicKey else {
            call.reject("both secretKey and publicKey should be provided")
            return
        }
        ENCRYPTION_SECRET_KEY = secretKey
        ENCRYPTION_PUBLIC_KEY = publicKey
        FNAME_ENCRYPTION_KEY = AgeEncryption.toRawX25519Key(secretKey)

    }

    @objc func setEnv(_ call: CAPPluginCall) {
        guard let env = call.getString("env") else {
            call.reject("required parameter: env")
            return
        }
        self.setKey(call)

        switch env {
        case "production", "product", "prod":
            URL_BASE = URL(string: "https://api.logseq.com/file-sync/")!
            BUCKET = "logseq-file-sync-bucket-prod"
            REGION = "us-east-1"
        case "development", "develop", "dev":
            URL_BASE = URL(string: "https://api-dev.logseq.com/file-sync/")!
            BUCKET = "logseq-file-sync-bucket"
            REGION = "us-east-2"
        default:
            call.reject("invalid env: \(env)")
            return
        }

        self.debugNotification(["event": "setenv:\(env)"])
        call.resolve(["ok": true])
    }

    @objc func encryptFnames(_ call: CAPPluginCall) {
        guard fnameEncryptionEnabled() else {
            call.reject("fname encryption key not set")
            return
        }
        guard var fnames = call.getArray("filePaths") as? [String] else {
            call.reject("required parameters: filePaths")
            return
        }

        let nFiles = fnames.count
        fnames = fnames.compactMap { $0.removingPercentEncoding!.fnameEncrypt(rawKey: FNAME_ENCRYPTION_KEY!) }
        if fnames.count != nFiles {
            call.reject("cannot encrypt \(nFiles - fnames.count) file names")
        }
        call.resolve(["value": fnames])
    }

    @objc func decryptFnames(_ call: CAPPluginCall) {
        guard fnameEncryptionEnabled() else {
            call.reject("fname encryption key not set")
            return
        }
        guard var fnames = call.getArray("filePaths") as? [String] else {
            call.reject("required parameters: filePaths")
            return
        }
        let nFiles = fnames.count
        fnames = fnames.compactMap { $0.fnameDecrypt(rawKey: FNAME_ENCRYPTION_KEY!)?.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) }
        if fnames.count != nFiles {
            call.reject("cannot decrypt \(nFiles - fnames.count) file names")
        }
        call.resolve(["value": fnames])
    }

    @objc func getLocalFilesMeta(_ call: CAPPluginCall) {
        // filePaths are url encoded
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
        for percentFilePath in filePaths {
            let filePath = percentFilePath.removingPercentEncoding!
            let url = baseURL.appendingPathComponent(filePath)
            if let meta = SyncMetadata(of: url) {
                var metaObj: [String: Any] = ["md5": meta.md5,
                                              "size": meta.size,
                                              "mtime": meta.mtime]
                if fnameEncryptionEnabled() {
                    metaObj["encryptedFname"] = filePath.fnameEncrypt(rawKey: FNAME_ENCRYPTION_KEY!)
                }

                fileMetadataDict[percentFilePath] = metaObj
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
                        let filePath = fileURL.relativePath(from: baseURL)!
                        var metaObj: [String: Any] = ["md5": meta.md5,
                                                      "size": meta.size,
                                                      "mtime": meta.mtime]
                        if fnameEncryptionEnabled() {
                            metaObj["encryptedFname"] = filePath.fnameEncrypt(rawKey: FNAME_ENCRYPTION_KEY!)
                        }
                        fileMetadataDict[filePath.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed)!] = metaObj
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

        let fromUrl = baseURL.appendingPathComponent(from.removingPercentEncoding!)
        let toUrl = baseURL.appendingPathComponent(to.removingPercentEncoding!)

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
            let fileUrl = baseURL.appendingPathComponent(filePath.removingPercentEncoding!)
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

        // [encrypted-fname: original-fname]
        var encryptedFilePathDict: [String: String] = [:]
        if fnameEncryptionEnabled() {
            for filePath in filePaths {
                if let encryptedPath = filePath.removingPercentEncoding!.fnameEncrypt(rawKey: FNAME_ENCRYPTION_KEY!) {
                    encryptedFilePathDict[encryptedPath] = filePath
                } else {
                    call.reject("cannot decrypt all file names")
                }
            }
        } else {
            encryptedFilePathDict = Dictionary(uniqueKeysWithValues: filePaths.map { ($0, $0) })
        }

        let encryptedFilePaths = Array(encryptedFilePathDict.keys)

        let client = SyncClient(token: token, graphUUID: graphUUID)
        client.delegate = self // receives notification

        client.getFiles(at: encryptedFilePaths) {  (fileURLs, error) in
            if let error = error {
                print("debug getFiles error \(error)")
                self.debugNotification(["event": "download:error", "data": ["message": "error while getting files \(filePaths)"]])
                call.reject(error.localizedDescription)
            } else {
                // handle multiple completionHandlers
                let group = DispatchGroup()

                var downloaded: [String] = []

                for (encryptedFilePath, remoteFileURL) in fileURLs {
                    group.enter()

                    let filePath = encryptedFilePathDict[encryptedFilePath]!
                    // NOTE: fileURLs from getFiles API is percent-encoded
                    let localFileURL = baseURL.appendingPathComponent(filePath.removingPercentEncoding!)
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

    @objc func updateLocalVersionFiles(_ call: CAPPluginCall) {
        guard let baseURL = call.getString("basePath").flatMap({path in URL(string: path)}),
              let filePaths = call.getArray("filePaths") as? [String],
              let graphUUID = call.getString("graphUUID") ,
              let token = call.getString("token") else {
                  call.reject("required paremeters: basePath, filePaths, graphUUID, token")
                  return
              }
        let client = SyncClient(token: token, graphUUID: graphUUID)
        client.delegate = self // receives notification

        client.getVersionFiles(at: filePaths) {  (fileURLDict, error) in
            if let error = error {
                print("debug getVersionFiles error \(error)")
                self.debugNotification(["event": "version-download:error", "data": ["message": "error while getting version files \(filePaths)"]])
                call.reject(error.localizedDescription)
            } else {
                // handle multiple completionHandlers
                let group = DispatchGroup()

                var downloaded: [String] = []

                for (filePath, remoteFileURL) in fileURLDict {
                    group.enter()

                    // NOTE: fileURLs from getFiles API is percent-encoded
                    let localFileURL = baseURL.appendingPathComponent("logseq/version-files/").appendingPathComponent(filePath.removingPercentEncoding!)
                    remoteFileURL.download(toFile: localFileURL) {error in
                        if let error = error {
                            self.debugNotification(["event": "version-download:error", "data": ["message": "error while downloading \(filePath): \(error)"]])
                            print("debug download \(error) in \(filePath)")
                        } else {
                            self.debugNotification(["event": "version-download:file", "data": ["file": filePath]])
                            downloaded.append(filePath)
                        }
                        group.leave()
                    }
                }
                group.notify(queue: .main) {
                    self.debugNotification(["event": "version-download:done"])
                    call.resolve(["ok": true, "data": downloaded])
                }

            }
        }
    }

    // filePaths: Encrypted file paths
    @objc func deleteRemoteFiles(_ call: CAPPluginCall) {
        guard var filePaths = call.getArray("filePaths") as? [String],
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

        let nFiles = filePaths.count
        if fnameEncryptionEnabled() {
            filePaths = filePaths.compactMap { $0.removingPercentEncoding!.fnameEncrypt(rawKey: FNAME_ENCRYPTION_KEY!) }
        }
        if filePaths.count != nFiles {
            call.reject("cannot encrypt all file names")
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
        let fnameEncryption = call.getBool("fnameEncryption") ?? false // default to false

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
                let fileURL = baseURL.appendingPathComponent(filePath.removingPercentEncoding!)
                files[filePath] = fileURL
            }

            // 2. upload_temp_file
            client.uploadTempFiles(files, credentials: credentials!) { (uploadedFileKeyDict, fileMd5Dict, error) in
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

                // encrypted-file-name: (file-key, md5)
                var uploadedFileKeyMd5Dict: [String: [String]] = [:]

                if fnameEncryptionEnabled() && fnameEncryption {
                    for (filePath, fileKey) in uploadedFileKeyDict {
                        guard let encryptedFilePath = filePath.removingPercentEncoding!.fnameEncrypt(rawKey: FNAME_ENCRYPTION_KEY!) else {
                            call.reject("cannot encrypt file name")
                            return
                        }
                        uploadedFileKeyMd5Dict[encryptedFilePath] = [fileKey, fileMd5Dict[filePath]!]
                    }
                } else {
                    for (filePath, fileKey) in uploadedFileKeyDict {
                        uploadedFileKeyMd5Dict[filePath] = [fileKey, fileMd5Dict[filePath]!]
                    }
                }
                client.updateFiles(uploadedFileKeyMd5Dict) { (txid, error) in
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
