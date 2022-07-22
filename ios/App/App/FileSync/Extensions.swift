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

extension Data {
    public init?(hexEncoded: String) {
        self.init(Array<UInt8>(hex: hexEncoded))
    }
    
    var hexDescription: String {
        return map { String(format: "%02hhx", $0) }.joined()
    }
    
    var MD5: String {
        let computed = Insecure.MD5.hash(data: self)
        return computed.map { String(format: "%02hhx", $0) }.joined()
    }
}

extension String {
    var MD5: String {
        let computed = Insecure.MD5.hash(data: self.data(using: .utf8)!)
        return computed.map { String(format: "%02hhx", $0) }.joined()
    }
    
    static func random(length: Int) -> String {
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<length).map{ _ in letters.randomElement()! })
    }
    
    func fnameEncrypt(rawKey: Data) -> String? {
        guard !self.isEmpty else {
            return nil
        }
        guard let raw = self.data(using: .utf8) else {
            return nil
        }
        
        let key = SymmetricKey(data: rawKey)
        let nonce = try! ChaChaPoly.Nonce(data: Data(repeating: 0, count: 12))
        guard let sealed = try? ChaChaPoly.seal(raw, using: key, nonce: nonce) else { return nil }
        
        // strip nonce here, since it's all zero
        return "e." + (sealed.ciphertext + sealed.tag).hexDescription

    }
    
    func fnameDecrypt(rawKey: Data) -> String? {
        // well-formated, non-empty encrypted string
        guard self.hasPrefix("e.") && self.count > 36 else {
            return nil
        }
        
        let encryptedHex = self.suffix(from: self.index(self.startIndex, offsetBy: 2))
        guard let encryptedRaw = Data(hexEncoded: String(encryptedHex)) else {
            // invalid hex
            return nil
        }
        
        let key = SymmetricKey(data: rawKey)
        let nonce = Data(repeating: 0, count: 12)

        guard let sealed = try? ChaChaPoly.SealedBox(combined: nonce + encryptedRaw) else {
            return nil
        }
        guard let outputRaw = try? ChaChaPoly.open(sealed, using: key) else {
            return nil
        }
        return String(data: outputRaw, encoding: .utf8)
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
    
    // Download a remote URL to a file
    func download(toFile file: URL, completion: @escaping (Error?) -> Void) {
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
                } else {
                    let baseURL = file.deletingLastPathComponent()
                    try FileManager.default.createDirectory(at: baseURL, withIntermediateDirectories: true, attributes: nil)
                }
                let rawData = try Data(contentsOf: tempURL)
                guard let decryptedRawData = maybeDecrypt(rawData) else {
                    throw NSError(domain: "", code: 0, userInfo: [NSLocalizedDescriptionKey: "can not decrypt remote file"])
                }
                try decryptedRawData.write(to: file, options: .atomic)

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

// MARK: Crypto helper

extension SymmetricKey {
    public init(passwordString keyString: String) throws {
        guard let keyData = keyString.data(using: .utf8) else {
            print("ERROR: Could not create raw Data from String")
            throw CryptoKitError.incorrectParameterSize
        }
        // SymmetricKeySize.bits256
        let keyDigest = SHA256.hash(data: keyData)
        
        self.init(data: keyDigest)
    }
}
