//
//  AgeEncryption.swift
//  Logseq
//
//  Created by Mono Wang on 5/30/R4.
//

import Foundation
import AgeEncryption

public enum AgeEncryption {
    public static func keygen() -> (String, String) {
        let cSecretKey = UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>.allocate(capacity: 1)
        let cPublicKey = UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>.allocate(capacity: 1)
        
        rust_age_encryption_keygen(cSecretKey, cPublicKey);
        let secretKey = String(cString: cSecretKey.pointee!)
        let publicKey = String(cString: cPublicKey.pointee!)
        
        rust_age_encryption_free_str(cSecretKey.pointee!)
        rust_age_encryption_free_str(cPublicKey.pointee!)
        cSecretKey.deallocate()
        cPublicKey.deallocate()

        return (secretKey, publicKey)
    }
    
    public static func toRawX25519Key(_ secretKey: String) -> Data? {
        let cOutput = UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>.allocate(capacity: 1)

        let ret = rust_age_encryption_to_raw_x25519_key(secretKey.cString(using: .utf8), cOutput)
        if ret >= 0 {
            let cOutputBuf = UnsafeBufferPointer.init(start: cOutput.pointee, count: 32)
            let rawKey = Data.init(buffer: cOutputBuf)
            rust_age_encryption_free_vec(cOutput.pointee, ret)
            cOutput.deallocate()
            return rawKey
        } else {
            return nil
        }
    }
    
    public static func encryptWithPassphrase(_ plaintext: Data, _ passphrase: String, armor: Bool) -> Data? {
        plaintext.withUnsafeBytes { (cPlaintext) in
            let cOutput = UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>.allocate(capacity: 1)

            let ret = rust_age_encrypt_with_user_passphrase(passphrase.cString(using: .utf8), cPlaintext.bindMemory(to: CChar.self).baseAddress, Int32(plaintext.count), armor ? 1 : 0, cOutput)
            if ret > 0 {
                let cOutputBuf = UnsafeBufferPointer.init(start: cOutput.pointee, count: Int(ret))
                let ciphertext = Data.init(buffer: cOutputBuf)
                rust_age_encryption_free_vec(cOutput.pointee, ret)
                cOutput.deallocate()
                return ciphertext
            } else {
                return nil
            }
        }
    }

    public static func decryptWithPassphrase(_ ciphertext: Data, _ passphrase: String) -> Data? {
        ciphertext.withUnsafeBytes { (cCiphertext) in
            let cOutput = UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>.allocate(capacity: 1)

            let ret = rust_age_decrypt_with_user_passphrase(passphrase.cString(using: .utf8), cCiphertext.bindMemory(to: CChar.self).baseAddress, Int32(ciphertext.count), cOutput)
            if ret > 0 {
                let cOutputBuf = UnsafeBufferPointer.init(start: cOutput.pointee, count: Int(ret))
                let plaintext = Data.init(buffer: cOutputBuf)
                rust_age_encryption_free_vec(cOutput.pointee, ret)
                cOutput.deallocate()
                return plaintext
            } else {
                return nil
            }
        }
    }
    
    public static func encryptWithX25519(_ plaintext: Data, _ publicKey: String, armor: Bool) -> Data? {
        plaintext.withUnsafeBytes { (cPlaintext) in
            let cOutput = UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>.allocate(capacity: 1)
            
            let ret = rust_age_encrypt_with_x25519(publicKey.cString(using: .utf8), cPlaintext.bindMemory(to: CChar.self).baseAddress, Int32(plaintext.count), armor ? 1 : 0, cOutput)
            if ret > 0 {
                let cOutputBuf = UnsafeBufferPointer.init(start: cOutput.pointee, count: Int(ret))
                let ciphertext = Data.init(buffer: cOutputBuf)
                rust_age_encryption_free_vec(cOutput.pointee, ret)
                cOutput.deallocate()
                return ciphertext
            } else {
                return nil
            }
        }
    }
    
    public static func decryptWithX25519(_ ciphertext: Data, _ secretKey: String) -> Data? {
        ciphertext.withUnsafeBytes { (cCiphertext) in
            let cOutput = UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>.allocate(capacity: 1)

            let ret = rust_age_decrypt_with_x25519(secretKey.cString(using: .utf8), cCiphertext.bindMemory(to: CChar.self).baseAddress, Int32(ciphertext.count), cOutput)
            if ret >= 0 {
                let cOutputBuf = UnsafeBufferPointer.init(start: cOutput.pointee, count: Int(ret))
                let plaintext = Data.init(buffer: cOutputBuf)
                rust_age_encryption_free_vec(cOutput.pointee, ret)
                cOutput.deallocate()
                return plaintext
            } else {
                return nil
            }
        }
    }
}
