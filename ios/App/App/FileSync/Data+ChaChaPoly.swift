//
//  Data+ChaChaPoly.swift
//  Logseq
//
//  Created by Mono Wang on 5/20/R4.
//

import Foundation
import CryptoKit

extension Data {
    /**
     Encrypts current data using ChaChaPoly cipher.
     */
    public func sealChaChaPoly(passphrase: String) -> Data? {
        guard let symmetricKey = try? SymmetricKey(passwordString: passphrase) else {
            return nil
        }

        return try? ChaChaPoly.seal(self, using: symmetricKey).combined
    }

    /**
     Decrypts current combined ChaChaPoly Selead box data (nonce || ciphertext || tag) using ChaChaPoly cipher.
     */
    public func openChaChaPoly(passphrase: String) -> Data? {
        guard let symmetricKey = try? SymmetricKey(passwordString: passphrase) else {
            return nil
        }
        guard let chaChaPolySealedBox = try? ChaChaPoly.SealedBox(combined: self) else {
            return nil
        }

        return try? ChaChaPoly.open(chaChaPolySealedBox, using: symmetricKey)
    }
}
