//
//  Extensions.swift
//  Logseq
//
//  Created by Mono Wang on 4/8/R4.
//

import Foundation
import CryptoKit

// via https://github.com/krzyzanowskim/CryptoSwift
extension Array where Element == UInt8 {
  public init(hex: String) {
      self = Array.init()
      self.reserveCapacity(hex.unicodeScalars.lazy.underestimatedCount)
      var buffer: UInt8?
      var skip = hex.hasPrefix("0x") ? 2 : 0
      for char in hex.unicodeScalars.lazy {
          guard skip == 0 else {
              skip -= 1
              continue
          }
          guard char.value >= 48 && char.value <= 102 else {
              removeAll()
              return
          }
          let v: UInt8
          let c: UInt8 = UInt8(char.value)
          switch c {
          case let c where c <= 57:
              v = c - 48
          case let c where c >= 65 && c <= 70:
              v = c - 55
          case let c where c >= 97:
              v = c - 87
          default:
              removeAll()
              return
          }
          if let b = buffer {
              append(b << 4 | v)
              buffer = nil
          } else {
              buffer = v
          }
      }
      if let b = buffer {
          append(b)
      }
  }
}

@available(iOS 13.0, *)
extension SymmetricKey {
    public init(passwordString keyString: String) throws {
        let size = SymmetricKeySize.bits256
        guard var keyData = keyString.data(using: .utf8) else {
            print("Could not create raw Data from String.")
            throw CryptoKitError.incorrectParameterSize
        }
            
        let keySizeBytes = size.bitCount / 8
        keyData = keyData.subdata(in: 0..<keySizeBytes)
        guard keyData.count >= keySizeBytes else { throw CryptoKitError.incorrectKeySize }
        
        print("debug key \(keyData) \(keyData.hexDescription)")
        
        self.init(data: keyData)
    }
}

extension Data {
    public init?(hexEncoded: String) {
        self.init(Array<UInt8>(hex: hexEncoded))
    }
    
    var hexDescription: String {
        return map { String(format: "%02hhx", $0) }.joined()
    }
    
    @available(iOS 13.0, *)
    func aesEncrypt(keyString: String) throws -> Data {
        let key = try? SymmetricKey(passwordString: keyString)
        
        let nonce = Data(hexEncoded: "131348c0987c7eece60fc0bc") // = initialization vector
        let tag = Data(hexEncoded: "5baa85ff3e7eda3204744ec74b71d523")
        
        print("debug tag \(tag?.hexDescription) nonce \(nonce?.hexDescription)")
        let sealedData = try! AES.GCM.seal(self, using: key!, nonce: AES.GCM.Nonce(data: nonce!), authenticating: tag!)
            
        print("debug encrypted \(sealedData)")
        guard let encryptedContent = sealedData.combined else {
            throw CryptoKitError.underlyingCoreCryptoError(error: 2)
        }
        print("debug encrypted \(encryptedContent)")
        print("debug encrypted \(encryptedContent.hexDescription)")
        print("debug tag \(sealedData.tag.hexDescription)")
        return encryptedContent
    }
    
    @available(iOS 13.0, *)
    func aesDecrypt(keyString: String) throws -> Data {
        let key = try! SymmetricKey(passwordString: keyString)
        let tag = Data(hexEncoded: "5baa85ff3e7eda3204744ec74b71d523")
        
        guard let sealedBox = try? AES.GCM.SealedBox(combined: self) else {
            throw CryptoKitError.authenticationFailure
        }
        guard let decryptedData = try? AES.GCM.open(sealedBox, using: key, authenticating: tag!) else {
            throw CryptoKitError.authenticationFailure
        }
        return decryptedData
    }
}

extension String {
    var MD5: String {
        let computed = Insecure.MD5.hash(data: self.data(using: .utf8)!)
        return computed.map { String(format: "%02hhx", $0) }.joined()
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
