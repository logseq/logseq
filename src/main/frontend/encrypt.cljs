(ns frontend.encrypt
  (:require [frontend.utf8 :as utf8]
            [frontend.db.utils :as db-utils]
            [frontend.db :as db]
            [frontend.state :as state]
            [clojure.string :as str]
            ["bip39" :as bip39]
            ["buffer" :as buffer]
            ["@kanru/rage-wasm" :as rage]
            [lambdaisland.glogi :as log]))

(defonce age-pem-header-line "-----BEGIN AGE ENCRYPTED FILE-----")
(defonce age-version-line "age-encryption.org/v1")

(defn content-encrypted?
  [content]
  (or (str/starts-with? content age-pem-header-line)
      (str/starts-with? content age-version-line)))

(defn encrypted-db?
  [repo-url]
  (db-utils/get-key-value repo-url :db/encrypted?))

(defn get-mnemonic
  [repo-url]
  (db-utils/get-key-value repo-url :db/secret-phrase))

(defn save-mnemonic!
  [repo-url mnemonic]
  (db/set-key-value repo-url :db/secret-phrase (str/trim mnemonic))
  (db/set-key-value repo-url :db/encrypted? true))

(defn- generate-mnemonic
  []
  (bip39/generateMnemonic 256))

(defn generate-mnemonic-and-save!
  [repo-url]
  (when-not (get-mnemonic repo-url)
    (let [mnemonic (generate-mnemonic)]
      (save-mnemonic! repo-url mnemonic)
      mnemonic)))

(defn- derive-key-from-mnemonic
  [mnemonic]
  (let [entropy (-> (bip39/mnemonicToEntropy mnemonic)
                    (buffer/Buffer.from "hex"))
        keys (rage/keygen_from_random_bytes entropy)]
    keys))

(defn get-public-key
  [repo-url]
  (second (derive-key-from-mnemonic (get-mnemonic repo-url))))

(defn get-secret-key
  [repo-url]
  (first (derive-key-from-mnemonic (get-mnemonic repo-url))))

(defn encrypt
  ([content]
   (encrypt (state/get-current-repo) content))
  ([repo-url content]
   (cond
     (encrypted-db? repo-url)
     (let [content (utf8/encode content)
           public-key (get-public-key repo-url)
           encrypted (rage/encrypt_with_x25519 public-key content true)]
       (utf8/decode encrypted))
     :else
     content)))

(defn decrypt
  ([content]
   (decrypt (state/get-current-repo) content))
  ([repo-url content]
   (cond
     (and (encrypted-db? repo-url)
          (content-encrypted? content))
     (let [content (utf8/encode content)]
       (if-let [secret-key (get-secret-key repo-url)]
         (let [decrypted (rage/decrypt_with_x25519 secret-key content)]
           (utf8/decode decrypted))
         (log/error :encrypt/empty-secret-key (str "Can't find the secret key for repo: " repo-url))))
     :else
     content)))

(defn encrypt-with-passphrase
  [passphrase content]
  (let [content (utf8/encode content)
        encrypted (rage/encrypt_with_user_passphrase passphrase content true)]
    (utf8/decode encrypted)))

;; TODO: What if decryption failed
(defn decrypt-with-passphrase
  [passphrase content]
  (let [content (utf8/encode content)
        decrypted (rage/decrypt_with_user_passphrase passphrase content)]
    (utf8/decode decrypted)))
