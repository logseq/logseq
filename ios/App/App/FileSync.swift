//
//  FileSync.swift
//  Logseq
//
//  Created by Mono Wang on 2/24/R4.
//

import Capacitor
import Foundation
import AWSMobileClient
import AWSS3
import CryptoKit

import var CommonCrypto.CC_MD5_DIGEST_LENGTH
import func CommonCrypto.CC_MD5
import typealias CommonCrypto.CC_LONG

// MARK: extensions

extension String {
    var MD5: String {
        if #available(iOS 13.0, *) {
            let computed = Insecure.MD5.hash(data: self.data(using: .utf8)!)
            return computed.map { String(format: "%02hhx", $0) }.joined()
        } else {
            // Fallback on earlier versions, no CryptoKit
            let length = Int(CC_MD5_DIGEST_LENGTH)
            let messageData = self.data(using:.utf8)!
            var digestData = Data(count: length)
            
            _ = digestData.withUnsafeMutableBytes { digestBytes -> UInt8 in
                messageData.withUnsafeBytes { messageBytes -> UInt8 in
                    if let messageBytesBaseAddress = messageBytes.baseAddress, let digestBytesBlindMemory = digestBytes.bindMemory(to: UInt8.self).baseAddress {
                        let messageLength = CC_LONG(messageData.count)
                        CC_MD5(messageBytesBaseAddress, messageLength, digestBytesBlindMemory)
                    }
                    return 0
                }
            }
            return digestData.map { String(format: "%02hhx", $0) }.joined()
        }
    }
    
    func encodeAsFname() -> String {
        var allowed = NSMutableCharacterSet.urlPathAllowed
        allowed.remove(charactersIn: "&$@=;:+ ,?%#")
        return self.addingPercentEncoding(withAllowedCharacters: allowed) ?? self
    }
    
    func decodeFromFname() -> String {
        return self.removingPercentEncoding ?? self
    }
    
    static func random(length: Int) -> String {
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<length).map{ _ in letters.randomElement()! })
    }
}

extension URL {
    func relativePath(from base: URL) -> String? {
        // Ensure that both URLs represent files:
        guard self.isFileURL && base.isFileURL else {
            return nil
        }
        
        // Remove/replace "." and "..", make paths absolute:
        let destComponents = self.standardized.pathComponents
        let baseComponents = base.standardized.pathComponents
        
        // Find number of common path components:
        var i = 0
        while i < destComponents.count && i < baseComponents.count
                && destComponents[i] == baseComponents[i] {
            i += 1
        }
        
        // Build relative path:
        var relComponents = Array(repeating: "..", count: baseComponents.count - i)
        relComponents.append(contentsOf: destComponents[i...])
        return relComponents.joined(separator: "/")
    }
    
    func download(toFile file: URL, completion: @escaping (Error?) -> Void) {
        // Download the remote URL to a file
        let task = URLSession.shared.downloadTask(with: self) {
            (tempURL, response, error) in
            // Early exit on error
            guard let tempURL = tempURL else {
                completion(error)
                return
            }
            
            if let response = response! as? HTTPURLResponse {
                if response.statusCode == 404 {
                    completion(NSError(domain: "",
                                       code: response.statusCode,
                                       userInfo: [NSLocalizedDescriptionKey: "remote file not found"]))
                    return
                }
                if response.statusCode != 200 {
                    completion(NSError(domain: "",
                                       code: response.statusCode,
                                       userInfo: [NSLocalizedDescriptionKey: "invalid http status code"]))
                    return
                }
            }
            
            
            do {
                // Remove any existing document at file
                if FileManager.default.fileExists(atPath: file.path) {
                    try FileManager.default.removeItem(at: file)
                }
                
                // Copy the tempURL to file
                try FileManager.default.copyItem(
                    at: tempURL,
                    to: file
                )
                
                completion(nil)
            }
            
            // Handle potential file system errors
            catch {
                completion(error)
            }
        }
        
        // Start the download
        task.resume()
    }
}


// MARK: FileSync Plugin

@objc(FileSync)
public class FileSync: CAPPlugin {
    override public func load() {
        print("debug File sync iOS plugin loaded!")
        AWSMobileClient.default().initialize { (userState, error) in
            guard error == nil else {
                print("error initializing AWSMobileClient. Error: \(error!.localizedDescription)")
                return
            }
            print("debug AWSMobileClient initialized.")
        }
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
        
        var fileMd5Digests: [String: String] = [:]
        for filePath in filePaths {
            let url = baseURL.appendingPathComponent(filePath)
            if let content = try? String(contentsOf: url, encoding: .utf8) {
                fileMd5Digests[filePath] = content.MD5
            }
        }
        
        call.resolve(["result": fileMd5Digests])
    }
    
    @objc func getLocalAllFilesMeta(_ call: CAPPluginCall) {
        guard let basePath = call.getString("basePath"),
              let baseURL = URL(string: basePath) else {
                  call.reject("invalid basePath")
                  return
              }
        
        var fileMd5Digests: [String: String] = [:]
        if let enumerator = FileManager.default.enumerator(at: baseURL, includingPropertiesForKeys: [.isRegularFileKey], options: [.skipsPackageDescendants, .skipsHiddenFiles]) {
            
            for case let fileURL as URL in enumerator {
                if !fileURL.isSkipped() {
                    if let content = try? String(contentsOf: fileURL, encoding: .utf8) {
                        fileMd5Digests[fileURL.relativePath(from: baseURL)!] = content.MD5
                    }
                } else if fileURL.isICloudPlaceholder() {
                    try? FileManager.default.startDownloadingUbiquitousItem(at: fileURL)
                }
            }
        }
        call.resolve(["result": fileMd5Digests])
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
    
    @objc func updateLocalFiles(_ call: CAPPluginCall) {
        guard let baseURL = call.getString("basePath").flatMap({path in URL(string: path)}),
              let filePaths = call.getArray("filePaths") as? [String],
              let graphUUID = call.getString("graphUUID") ,
              let token = call.getString("token") else {
                  call.reject("required paremeters: basePath, filePaths, graphUUID, token")
                  return
              }
        
        let client = SyncClient(token: token, graphUUID: graphUUID)
        client.getFiles(at: filePaths) {  (fileURLs, error) in
            if let error = error {
                print("debug getFiles err \(error)")
                // TODO handle error
                call.reject(error.localizedDescription)
            } else {
                // handle multiple completionHandlers
                let group = DispatchGroup()
                
                var downloaded: [String] = []
                for (filePath, remoteFileURL) in fileURLs {
                    group.enter()
                    let localFileURL = baseURL.appendingPathComponent(filePath)
                    remoteFileURL.download(toFile: localFileURL) {error in
                        if let error = error {
                            ///
                            print("debug download \(error) in \(filePath)")
                        } else {
                            downloaded.append(filePath)
                        }
                        group.leave()
                    }
                }
                group.notify(queue: .main) {
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
        client.deleteFiles(filePaths) { error in
            if let error = error {
                call.reject("delete \(error.localizedDescription)")
            } else {
                call.resolve(["ok": true])
            }
        }
    }
    
    // local -> remote
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
        
        // 1. refresh_temp_credential
        client.getTempCredential() { (credentials, error) in
            guard error == nil else {
                call.reject("error(getTempCredential): \(error!.localizedDescription)")
                return
            }
            
            var files: [String: URL] = [:]
            for filePath in filePaths {
                let fileURL = baseURL.appendingPathComponent(filePath)
                files[filePath] = fileURL
            }
            
            // 2. upload_temp_file
            client.uploadTempFiles(files, credentials: credentials!) { (uploadedFileKeyDict, error) in
                guard error == nil else {
                    call.reject("error(uploadTempFiles): \(error!.localizedDescription)")
                    return
                }
                // 3. update_files
                //if uploadedFileKeyDict.count != filePaths.count {
                //    return call.reject("error(uploadTempFiles): not all files uploaded \(uploadedFileKeyDict) \(filePaths)")
                //}
                guard !uploadedFileKeyDict.isEmpty else {
                    call.reject("no file to update")
                    return
                }
                client.updateFiles(uploadedFileKeyDict) { (error) in
                    guard error == nil else {
                        call.reject("error(updateFiles): \(error!.localizedDescription)")
                        return
                    }
                    call.resolve(["ok": true, "files": uploadedFileKeyDict])
                }
            }
        }
    }
}


// MARK: Consts

let URL_BASE = URL(string: "https://api.logseq.com/file-sync/")
let BUCKET: String = "logseq-file-sync-bucket"
let REGION: String = "us-east-2"

// MARK: Response payload types

struct GetFilesResponse: Decodable {
    let PresignedFileUrls: [String: String]
}

struct DeleteFilesResponse: Decodable {
    let TXId: Int
    let DeleteSuccFiles: [String]
    let DeleteFailedFiles: [String: String]
}

public struct S3Credential: Decodable {
    let AccessKeyId: String
    let Expiration: String
    let SecretKey: String
    let SessionToken: String
}

struct GetTempCredentialResponse: Decodable {
    let Credentials: S3Credential
    let S3Prefix: String
}

struct UpdateFilesResponse: Decodable {
    let TXId: Int
    let UpdateSuccFiles: [String]
    let UpdateFailedFiles: [String: String]
}

// MARK: Sync Client

public class SyncClient {
    private var token: String
    private var graphUUID: String?
    private var txid: Int = 0
    private var s3prefix: String?
    
    public init(token: String) {
        self.token = token
    }
    
    public init(token: String, graphUUID: String) {
        self.token = token
        self.graphUUID = graphUUID
    }
    
    public init(token: String, graphUUID: String, txid: Int) {
        self.token = token
        self.graphUUID = graphUUID
        self.txid = txid
    }

    // get_files
    // => file_path, file_url
    public func getFiles(at filePaths: [String], completionHandler: @escaping ([String: URL], Error?) -> Void) {
        let url = URL_BASE!.appendingPathComponent("get_files")
        
        var request = URLRequest(url: url)
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue("Logseq-sync/0.1", forHTTPHeaderField: "User-Agent")
        request.setValue("Bearer \(self.token)", forHTTPHeaderField: "Authorization")
        
        let payload = [
            "GraphUUID": self.graphUUID ?? "",
            "Files": filePaths.map { filePath in filePath.encodeAsFname()}
        ] as [String : Any]
        let bodyData = try? JSONSerialization.data(
            withJSONObject: payload,
            options: []
        )
        request.httpMethod = "POST"
        request.httpBody = bodyData
        
        let task = URLSession.shared.dataTask(with: request) { (data, response, error) in
            guard error == nil else {
                completionHandler([:], error)
                return
            }
            
            if (response as? HTTPURLResponse)?.statusCode != 200 {
                let body = String(data: data!, encoding: .utf8) ?? "";
                completionHandler([:], NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "http error \(body)"]))
                return
            }
            
            if let data = data {
                let resp = try? JSONDecoder().decode([String:[String:String]].self, from: data)
                let files = resp?["PresignedFileUrls"] ?? [:]
                completionHandler(files.mapValues({ url in URL(string: url)!}), nil)
            } else {
                // Handle unexpected error
                completionHandler([:], NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "unexpected error"]))
            }
        }
        task.resume()
    }
    
    
    public func deleteFiles(_ filePaths: [String], completionHandler: @escaping  (Error?) -> Void) {
        let url = URL_BASE!.appendingPathComponent("delete_files")
        
        var request = URLRequest(url: url)
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue("Logseq-sync/0.1", forHTTPHeaderField: "User-Agent")
        request.setValue("Bearer \(self.token)", forHTTPHeaderField: "Authorization")
        
        let payload = [
            "GraphUUID": self.graphUUID ?? "",
            "Files": filePaths.map { filePath in filePath.encodeAsFname()},
            "TXId": self.txid,
        ] as [String : Any]
        let bodyData = try? JSONSerialization.data(
            withJSONObject: payload,
            options: []
        )
        request.httpMethod = "POST"
        request.httpBody = bodyData
        
        let task = URLSession.shared.dataTask(with: request) { (data, response, error) in
            guard error == nil else {
                completionHandler(error)
                return
            }
            
            if let response = response as? HTTPURLResponse {
                let body = String(data: data!, encoding: .utf8) ?? ""
                
                if response.statusCode == 409 {
                    if body.contains("txid_to_validate") {
                        completionHandler(NSError(domain: "",
                                                  code: 409,
                                                  userInfo: [NSLocalizedDescriptionKey: "invalid txid: \(body)"]))
                        return
                    }
                    // fallthrough
                }
                if response.statusCode != 200 {
                    completionHandler(NSError(domain: "",
                                              code: response.statusCode,
                                              userInfo: [NSLocalizedDescriptionKey: "invalid http status \(response.statusCode): \(body)"]))
                    return
                }
            }
            
            if let data = data {
                do {
                    _ = try JSONDecoder().decode(DeleteFilesResponse.self, from: data)
                    // TODO: handle api resp?
                    completionHandler(nil)
                } catch {
                    completionHandler(error)
                }
            } else {
                // Handle unexpected error
                completionHandler(NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "unexpected error"]))
            }
        }
        task.resume()
    }
    
    public func updateFiles(_ fileKeyDict: [String: String], completionHandler: @escaping  (Error?) -> Void) {
        let url = URL_BASE!.appendingPathComponent("update_files")
        
        var request = URLRequest(url: url)
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue("Logseq-sync/0.1", forHTTPHeaderField: "User-Agent")
        request.setValue("Bearer \(self.token)", forHTTPHeaderField: "Authorization")
        
        let payload = [
            "GraphUUID": self.graphUUID ?? "",
            "Files": Dictionary(uniqueKeysWithValues: fileKeyDict.map { ($0.encodeAsFname(), $1) }) as [String: String] as Any,
            "TXId": self.txid,
        ] as [String : Any]
        let bodyData = try? JSONSerialization.data(
            withJSONObject: payload,
            options: []
        )
        request.httpMethod = "POST"
        request.httpBody = bodyData
        
        let task = URLSession.shared.dataTask(with: request) { (data, response, error) in
            guard error == nil else {
                completionHandler(error)
                return
            }
            
            if let response = response as? HTTPURLResponse {
                let body = String(data: data!, encoding: .utf8) ?? ""
                
                if response.statusCode == 409 {
                    if body.contains("txid_to_validate") {
                        completionHandler(NSError(domain: "",
                                                  code: 409,
                                                  userInfo: [NSLocalizedDescriptionKey: "invalid txid: \(body)"]))
                        return
                    }
                    // fallthrough
                }
                if response.statusCode != 200 {
                    completionHandler(NSError(domain: "",
                                              code: response.statusCode,
                                              userInfo: [NSLocalizedDescriptionKey: "invalid http status \(response.statusCode): \(body)"]))
                    return
                }
            }
            
            if let data = data {
                let resp = try? JSONDecoder().decode(UpdateFilesResponse.self, from: data)
                if resp?.UpdateFailedFiles.isEmpty ?? true {
                    completionHandler(nil)
                } else {
                    completionHandler(NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "update fail for some files: \(resp?.UpdateFailedFiles.debugDescription)"]))
                }
            } else {
                // Handle unexpected error
                completionHandler(NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "unexpected error"]))
            }
        }
        task.resume()
    }
    
    public func getTempCredential(completionHandler: @escaping (S3Credential?, Error?) -> Void) {
        let url = URL_BASE!.appendingPathComponent("get_temp_credential")
        
        var request = URLRequest(url: url)
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue("Logseq-sync/0.1", forHTTPHeaderField: "User-Agent")
        request.setValue("Bearer \(self.token)", forHTTPHeaderField: "Authorization")
        request.httpMethod = "POST"
        request.httpBody = Data()
        
        let task = URLSession.shared.dataTask(with: request) { (data, response, error) in
            guard error == nil else {
                completionHandler(nil, error)
                return
            }
            if let response = response as? HTTPURLResponse {
                let body = String(data: data!, encoding: .utf8) ?? ""
                if response.statusCode == 401 {
                    completionHandler(nil, NSError(domain: "", code: 401, userInfo: [NSLocalizedDescriptionKey: "unauthorized"]))
                    return
                }
                if response.statusCode != 200 {
                    completionHandler(nil, NSError(domain: "",
                                                   code: response.statusCode,
                                                   userInfo: [NSLocalizedDescriptionKey: "invalid http status \(response.statusCode): \(body)"]))
                    return
                }
            }
            if let data = data {
                let resp = try? JSONDecoder().decode(GetTempCredentialResponse.self, from: data)
                // NOTE: remove BUCKET prefix here.
                self.s3prefix = resp?.S3Prefix.replacingOccurrences(of: "\(BUCKET)/", with: "")
                completionHandler(resp?.Credentials, nil)
            } else {
                // Handle unexpected error
                completionHandler(nil, NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "unexpected error"]))
            }
        }
        task.resume()
    }
    
    // [filePath, Key]
    public func uploadTempFiles(_ files: [String: URL], credentials: S3Credential, completionHandler: @escaping ([String: String], Error?) -> Void) {
        let credentialsProvider = AWSBasicSessionCredentialsProvider(
            accessKey: credentials.AccessKeyId, secretKey: credentials.SecretKey, sessionToken: credentials.SessionToken)
        let configuration = AWSServiceConfiguration(region: .USEast2, credentialsProvider: credentialsProvider)
        
        let tuConf = AWSS3TransferUtilityConfiguration()
        tuConf.bucket = BUCKET
        //x tuConf.isAccelerateModeEnabled = true
        
        AWSS3TransferUtility.register(
            with: configuration!,
            transferUtilityConfiguration: tuConf,
            forKey: "batch-transfer"
        ) { (error) in
            if let error = error {
                print("error while register tu \(error)")
            }
        }
        
        let transferUtility = AWSS3TransferUtility.s3TransferUtility(forKey: "batch-transfer")
        let uploadExpression = AWSS3TransferUtilityUploadExpression()
        
        let group = DispatchGroup()
        var keyFileDict: [String: String] = [:]
        
        let uploadCompletionHandler = { (task: AWSS3TransferUtilityUploadTask, error: Error?) -> Void in
            // ignore any errors in first level of handler
            if let error = error {
                print("debug error uploading \(error)")
            }
            if let HTTPResponse = task.response {
                if HTTPResponse.statusCode != 200 || task.status != .completed {
                    print("debug uploading error")
                }
            }
            keyFileDict.removeValue(forKey: task.key)
            group.leave()
        }
        
        for (filePath, fileLocalURL) in files {
            guard let rawData = try? Data(contentsOf: fileLocalURL) else { continue }
            group.enter()
            
            let randFileName = String.random(length: 15).appending(".").appending(fileLocalURL.pathExtension)
            let key = "\(self.s3prefix!)/ios\(randFileName)"

            keyFileDict[key] = filePath
            transferUtility?.uploadData(rawData, key: key, contentType: "application/octet-stream", expression: uploadExpression, completionHandler: uploadCompletionHandler)
                .continueWith(block: { (task) in
                    if let error = task.error {
                        completionHandler([:], error)
                    }
                    return nil
                })
        }
        
        group.notify(queue: .main) {
            print("debug all file uploaded!")
            completionHandler(Dictionary(uniqueKeysWithValues: keyFileDict.map({ ($1, $0) })), nil)
        }
    }
}
