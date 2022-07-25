//
//  SyncClient.swift
//  Logseq
//
//  Created by Mono Wang on 4/8/R4.
//

import Foundation
import AWSMobileClient
import AWSS3

public protocol SyncDebugDelegate {
    func debugNotification(_ message: [String: Any])
}


public class SyncClient {
    private var token: String
    private var graphUUID: String?
    private var txid: Int = 0
    private var s3prefix: String?
    
    public var delegate: SyncDebugDelegate? = nil
    
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
        let url = URL_BASE.appendingPathComponent("get_files")
        
        var request = URLRequest(url: url)
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue("Logseq-sync/0.1", forHTTPHeaderField: "User-Agent")
        request.setValue("Bearer \(self.token)", forHTTPHeaderField: "Authorization")
        
        let payload = [
            "GraphUUID": self.graphUUID ?? "",
            "Files": filePaths
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
                self.delegate?.debugNotification(["event": "download:prepare"])
                completionHandler(files.mapValues({ url in URL(string: url)!}), nil)
            } else {
                // Handle unexpected error
                completionHandler([:], NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "unexpected error"]))
            }
        }
        task.resume()
    }
    
    public func getVersionFiles(at filePaths: [String], completionHandler: @escaping ([String: URL], Error?) -> Void) {
        let url = URL_BASE.appendingPathComponent("get_version_files")
        
        var request = URLRequest(url: url)
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue("Logseq-sync/0.1", forHTTPHeaderField: "User-Agent")
        request.setValue("Bearer \(self.token)", forHTTPHeaderField: "Authorization")
        
        let payload = [
            "GraphUUID": self.graphUUID ?? "",
            "Files": filePaths
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
                self.delegate?.debugNotification(["event": "version-download:prepare"])
                completionHandler(files.mapValues({ url in URL(string: url)!}), nil)
            } else {
                // Handle unexpected error
                completionHandler([:], NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "unexpected error"]))
            }
        }
        task.resume()
    }
    
    
    public func deleteFiles(_ filePaths: [String], completionHandler: @escaping  (Int?, Error?) -> Void) {
        let url = URL_BASE.appendingPathComponent("delete_files")
        
        var request = URLRequest(url: url)
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue("Logseq-sync/0.1", forHTTPHeaderField: "User-Agent")
        request.setValue("Bearer \(self.token)", forHTTPHeaderField: "Authorization")
        
        let payload = [
            "GraphUUID": self.graphUUID ?? "",
            "Files": filePaths,
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
                completionHandler(nil, error)
                return
            }
            
            if let response = response as? HTTPURLResponse {
                let body = String(data: data!, encoding: .utf8) ?? ""
                
                if response.statusCode == 409 {
                    if body.contains("txid_to_validate") {
                        completionHandler(nil, NSError(domain: "",
                                                       code: 409,
                                                       userInfo: [NSLocalizedDescriptionKey: "invalid txid: \(body)"]))
                        return
                    }
                    // fallthrough
                }
                if response.statusCode != 200 {
                    completionHandler(nil, NSError(domain: "",
                                                   code: response.statusCode,
                                                   userInfo: [NSLocalizedDescriptionKey: "invalid http status \(response.statusCode): \(body)"]))
                    return
                }
            }
            
            if let data = data {
                do {
                    let resp = try JSONDecoder().decode(DeleteFilesResponse.self, from: data)
                    // TODO: handle api resp?
                    self.delegate?.debugNotification(["event": "delete"])
                    completionHandler(resp.TXId, nil)
                } catch {
                    completionHandler(nil, error)
                }
            } else {
                // Handle unexpected error
                completionHandler(nil, NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "unexpected error"]))
            }
        }
        task.resume()
    }
    
    // (txid, error)
    // filePath => [S3Key, md5]
    public func updateFiles(_ fileKeyDict: [String: [String]], completionHandler: @escaping  (Int?, Error?) -> Void) {
        let url = URL_BASE.appendingPathComponent("update_files")
        
        var request = URLRequest(url: url)
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue("Logseq-sync/0.1", forHTTPHeaderField: "User-Agent")
        request.setValue("Bearer \(self.token)", forHTTPHeaderField: "Authorization")
        
        let payload = [
            "GraphUUID": self.graphUUID ?? "",
            "Files": Dictionary(uniqueKeysWithValues: fileKeyDict.map { ($0, $1) }) as [String: [String]] as Any,
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
                completionHandler(nil, error)
                return
            }
            
            if let response = response as? HTTPURLResponse {
                let body = String(data: data!, encoding: .utf8) ?? ""
                
                if response.statusCode == 409 {
                    if body.contains("txid_to_validate") {
                        completionHandler(nil, NSError(domain: "",
                                                       code: 409,
                                                       userInfo: [NSLocalizedDescriptionKey: "invalid txid: \(body)"]))
                        return
                    }
                    // fallthrough
                }
                if response.statusCode != 200 {
                    completionHandler(nil, NSError(domain: "",
                                                   code: response.statusCode,
                                                   userInfo: [NSLocalizedDescriptionKey: "invalid http status \(response.statusCode): \(body)"]))
                    return
                }
            }
            
            if let data = data {
                let resp = try? JSONDecoder().decode(UpdateFilesResponse.self, from: data)
                if resp?.UpdateFailedFiles.isEmpty ?? true {
                    completionHandler(resp?.TXId, nil)
                } else {
                    completionHandler(nil, NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "update fail for some files: \(resp?.UpdateFailedFiles.debugDescription)"]))
                }
            } else {
                // Handle unexpected error
                completionHandler(nil, NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "unexpected error"]))
            }
        }
        task.resume()
    }
    
    public func getTempCredential(completionHandler: @escaping (S3Credential?, Error?) -> Void) {
        let url = URL_BASE.appendingPathComponent("get_temp_credential")
        
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
                self.delegate?.debugNotification(["event": "upload:prepare"])
                completionHandler(resp?.Credentials, nil)
            } else {
                // Handle unexpected error
                completionHandler(nil, NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "unexpected error"]))
            }
        }
        task.resume()
    }
    
    // [filePath, Key]
    public func uploadTempFiles(_ files: [String: URL], credentials: S3Credential, completionHandler: @escaping ([String: String], [String: String], Error?) -> Void) {
        let credentialsProvider = AWSBasicSessionCredentialsProvider(
            accessKey: credentials.AccessKeyId, secretKey: credentials.SecretKey, sessionToken: credentials.SessionToken)
        var region = AWSRegionType.USEast2
        if REGION == "us-east-2" {
            region = .USEast2
        } else if REGION == "us-east-1" {
            region = .USEast1
        } // TODO: string to REGION conversion
        
        let configuration = AWSServiceConfiguration(region: region, credentialsProvider: credentialsProvider)
        configuration?.timeoutIntervalForRequest = 5.0
        configuration?.timeoutIntervalForResource = 5.0
        
        let tuConf = AWSS3TransferUtilityConfiguration()
        tuConf.bucket = BUCKET
        //x tuConf.isAccelerateModeEnabled = true
        
        let transferKey = String.random(length: 10)
        AWSS3TransferUtility.register(
            with: configuration!,
            transferUtilityConfiguration: tuConf,
            forKey: transferKey
        ) { (error) in
            if let error = error {
                print("error while register tu \(error)")
            }
        }
        
        let transferUtility = AWSS3TransferUtility.s3TransferUtility(forKey: transferKey)
        let uploadExpression = AWSS3TransferUtilityUploadExpression()
        
        let group = DispatchGroup()
        var keyFileDict: [String: String] = [:]
        var fileKeyDict: [String: String] = [:]
        var fileMd5Dict: [String: String] = [:]
        
        let uploadCompletionHandler = { (task: AWSS3TransferUtilityUploadTask, error: Error?) -> Void in
            // ignore any errors in first level of handler
            if let error = error {
                self.delegate?.debugNotification(["event": "upload:error", "data": ["key": task.key, "error": error.localizedDescription]])
            }
            if let HTTPResponse = task.response {
                if HTTPResponse.statusCode != 200 || task.status != .completed {
                    print("debug uploading error \(HTTPResponse)")
                }
            }
            
            // only save successful keys
            let filePath = keyFileDict[task.key]!
            fileKeyDict[filePath] = task.key
            keyFileDict.removeValue(forKey: task.key)
            self.delegate?.debugNotification(["event": "upload:file", "data": ["file": filePath, "key": task.key]])
            group.leave() // notify finish upload
        }
        
        for (filePath, fileLocalURL) in files {
            print("debug, upload temp \(fileLocalURL) \(filePath)")
            guard let rawData = try? Data(contentsOf: fileLocalURL) else { continue }
            guard let encryptedRawDat = maybeEncrypt(rawData) else { continue }
            group.enter()
            
            let randFileName = String.random(length: 15).appending(".").appending(fileLocalURL.pathExtension)
            let key = "\(self.s3prefix!)/ios\(randFileName)"

            keyFileDict[key] = filePath
            fileMd5Dict[filePath] = rawData.MD5
            transferUtility?.uploadData(encryptedRawDat, key: key, contentType: "application/octet-stream", expression: uploadExpression, completionHandler: uploadCompletionHandler)
                .continueWith(block: { (task) in
                    if let error = task.error {
                        completionHandler([:], [:], error)
                    }
                    return nil
                })
        }
        
        group.notify(queue: .main) {
            AWSS3TransferUtility.remove(forKey: transferKey)
            completionHandler(fileKeyDict, fileMd5Dict, nil)
        }
    }
}
