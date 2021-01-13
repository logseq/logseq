(ns frontend.encrypt
  (:require [frontend.utf8 :as utf8]
            [frontend.db.utils :as db-utils]
            [frontend.db :as db]
            [frontend.state :as state]
            ["bip39" :as bip39]
            ["buffer" :as buffer]
            ["@kanru/rage-wasm" :as rage]))

(defonce secret-phrase "canal this pluck bar elite tape olive toilet cry surprise dish rival wrist tragic click honey solar kangaroo cook cabin replace harvest horse wrong")

(defn encrypted-db?
  []
  (db-utils/get-key-value :db/encrypted?))

(defn save-mnemonic
  [repo mnemonic]
  (db/set-key-value repo :db/secret-phrase mnemonic)
  (db/set-key-value repo :db/encrypted? true))

(defn generate-mnemonic
  []
  (bip39/generateMnemonic 256))

(defn generate-mnemonic-and-save
  []
  (let [repo (state/get-current-repo)
        mnemonic (generate-mnemonic)]
    (save-mnemonic repo mnemonic)))

(defn get-mnemonic
  []
  (db-utils/get-key-value :db/secret-phrase))

(defn derive-key-from-mnemonic
  [mnemonic]
  (let [entropy (-> (bip39/mnemonicToEntropy mnemonic)
                    (buffer/Buffer.from "hex"))
        keys (rage/keygen_from_random_bytes entropy)]
    keys))

(defn get-public-key
  []
  (second (derive-key-from-mnemonic (get-mnemonic))))

(defn get-secret-key
  []
  (first (derive-key-from-mnemonic (get-mnemonic))))

(defn encrypt
  [content]
  (cond
    (encrypted-db?)
    (let [content (utf8/encode content)
          public-key (get-public-key)
          encrypted (rage/encrypt_with_x25519 public-key content true)]
      (utf8/decode encrypted))
    :else
    content))

(defn decrypt
  [content]
  (cond
    (encrypted-db?)
    (let [content (utf8/encode content)
          secret-key (get-secret-key)
          decrypted (rage/decrypt_with_x25519 secret-key content)]
      (utf8/decode decrypted))
    :else
    content))