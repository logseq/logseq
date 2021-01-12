(ns frontend.encrypt
  (:require [frontend.utf8 :as utf8]
            ["bip39" :as bip39]
            ["buffer" :as buffer]
            ["@kanru/rage-wasm" :as rage]))

(defonce secret-phrase "canal this pluck bar elite tape olive toilet cry surprise dish rival wrist tragic click honey solar kangaroo cook cabin replace harvest horse wrong")

(defn generate-mnemonic
  []
  (bip39/generateMnemonic 256))

(defn derive-key-from-mnemonic
  [mnemonic]
  (let [entropy (-> (bip39/mnemonicToEntropy mnemonic)
                    (buffer/Buffer.from "hex"))
        keys (rage/keygen_from_random_bytes entropy)]
    keys))

(let [keys (derive-key-from-mnemonic secret-phrase)]
  (defonce secret-key (first keys))
  (defonce public-key (second keys)))

(defn encrypt
  [content]
  (let [content (utf8/encode content)
        encrypted (rage/encrypt_with_x25519 public-key content true)]
    (utf8/decode encrypted)))

(defn decrypt
  [content]
  (let [content (utf8/encode content)
        decrypted (rage/decrypt_with_x25519 secret-key content)]
    (utf8/decode decrypted)))