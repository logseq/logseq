(ns frontend.encrypt
  (:require [frontend.utf8 :as utf8]
            [frontend.db.utils :as db-utils]
            [frontend.db :as db]
            [promesa.core :as p]
            [frontend.state :as state]
            [clojure.string :as str]
            [cljs.reader :as reader]
            [shadow.loader :as loader]
            [lambdaisland.glogi :as log]))

(defonce age-pem-header-line "-----BEGIN AGE ENCRYPTED FILE-----")
(defonce age-version-line "age-encryption.org/v1")

(defn content-encrypted?
  [content]
  (when content
    (or (str/starts-with? content age-pem-header-line)
        (str/starts-with? content age-version-line))))

(defn encrypted-db?
  [repo-url]
  (db-utils/get-key-value repo-url :db/encrypted?))

(defn get-key-pair
  [repo-url]
  (db-utils/get-key-value repo-url :db/encryption-keys))

(defn save-key-pair!
  [repo-url keys]
  (let [keys (if (string? keys) (reader/read-string keys) keys)]
    (db/set-key-value repo-url :db/encryption-keys keys)
    (db/set-key-value repo-url :db/encrypted? true)))

(defn generate-key-pair
  []
  (p/let [_ (loader/load :age-encryption)
          lazy-keygen (resolve 'frontend.extensions.age-encryption/keygen)
          js-keys (lazy-keygen)]
    (array-seq js-keys)))

(defn generate-key-pair-and-save!
  [repo-url]
  (when-not (get-key-pair repo-url)
    (p/let [keys (generate-key-pair)]
      (save-key-pair! repo-url keys)
      (pr-str keys))))

(defn get-public-key
  [repo-url]
  (second (get-key-pair repo-url)))

(defn get-secret-key
  [repo-url]
  (first (get-key-pair repo-url)))

(defn encrypt
  ([content]
   (encrypt (state/get-current-repo) content))
  ([repo-url content]
   (cond
     (encrypted-db? repo-url)
     (p/let [_ (loader/load :age-encryption)
             lazy-encrypt-with-x25519 (resolve 'frontend.extensions.age-encryption/encrypt-with-x25519)
             content (utf8/encode content)
             public-key (get-public-key repo-url)
             encrypted (lazy-encrypt-with-x25519 public-key content true)]
       (utf8/decode encrypted))
     :else
     (p/resolved content))))

(defn decrypt
  ([content]
   (decrypt (state/get-current-repo) content))
  ([repo-url content]
   (cond
     (and (encrypted-db? repo-url)
          (content-encrypted? content))
     (let [content (utf8/encode content)]
       (if-let [secret-key (get-secret-key repo-url)]
         (p/let [_ (loader/load :age-encryption)
                 lazy-decrypt-with-x25519 (resolve 'frontend.extensions.age-encryption/decrypt-with-x25519)
                 decrypted (lazy-decrypt-with-x25519 secret-key content)]
           (utf8/decode decrypted))
         (log/error :encrypt/empty-secret-key (str "Can't find the secret key for repo: " repo-url))))
     :else
     (p/resolved content))))

(defn encrypt-with-passphrase
  [passphrase content]
  (p/let [_ (loader/load :age-encryption)
          lazy-encrypt-with-user-passphrase (resolve 'frontend.extensions.age-encryption/encrypt-with-user-passphrase)
          content (utf8/encode content)
          encrypted (@lazy-encrypt-with-user-passphrase passphrase content true)]
    (utf8/decode encrypted)))

;; ;; TODO: What if decryption failed
(defn decrypt-with-passphrase
  [passphrase content]
  (p/let [_ (loader/load :age-encryption)
          lazy-decrypt-with-user-passphrase (resolve 'frontend.extensions.age-encryption/decrypt-with-user-passphrase)
          content (utf8/encode content)
          decrypted (lazy-decrypt-with-user-passphrase passphrase content)]
    (utf8/decode decrypted)))
