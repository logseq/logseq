(ns frontend.common.crypt
  (:require [logseq.db :as ldb]
            [promesa.core :as p]))

(defonce subtle (.. js/crypto -subtle))

(defn <generate-rsa-key-pair
  "Generates a new RSA public/private key pair.
  Return
  {:publicKey #object [CryptoKey [object CryptoKey]],
   :privateKey #object [CryptoKey [object CryptoKey]]}"
  []
  (p/let [r (.generateKey subtle
                          #js {:name "RSA-OAEP"
                               :modulusLength 4096
                               :publicExponent (js/Uint8Array. [1 0 1])
                               :hash "SHA-256"}
                          true
                          #js ["encrypt" "decrypt"])]
    (js->clj r :keywordize-keys true)))

(defn <generate-aes-key
  "Generates a new AES-GCM-256 key."
  []
  (.generateKey subtle
                #js {:name "AES-GCM"
                     :length 256}
                true
                #js ["encrypt" "decrypt"]))

(defn <encrypt-private-key
  "Encrypts a private key with a password."
  [password private-key]
  (p/let [salt (js/crypto.getRandomValues (js/Uint8Array. 16))
          iv (js/crypto.getRandomValues (js/Uint8Array. 12))
          password-key (.importKey subtle "raw"
                                   (.encode (js/TextEncoder.) password)
                                   "PBKDF2"
                                   false
                                   #js ["deriveKey"])
          derived-key (.deriveKey subtle
                                  #js {:name "PBKDF2"
                                       :salt salt
                                       :iterations 100000
                                       :hash "SHA-256"}
                                  password-key
                                  #js {:name "AES-GCM" :length 256}
                                  true
                                  #js ["encrypt" "decrypt"])
          exported-private-key (.exportKey subtle "pkcs8" private-key)
          encrypted-private-key (.encrypt subtle
                                          #js {:name "AES-GCM" :iv iv}
                                          derived-key
                                          exported-private-key)]
    [salt iv encrypted-private-key]))

(defn <decrypt-private-key
  "Decrypts a private key with a password."
  [password encrypted-key-data]
  (p/let [[salt-data iv-data encrypted-private-key-data] encrypted-key-data
          salt (js/Uint8Array. salt-data)
          iv (js/Uint8Array. iv-data)
          encrypted-private-key (js/Uint8Array. encrypted-private-key-data)
          password-key (.importKey subtle "raw"
                                   (.encode (js/TextEncoder.) password)
                                   "PBKDF2"
                                   false
                                   #js ["deriveKey"])
          derived-key (.deriveKey subtle
                                  #js {:name "PBKDF2"
                                       :salt salt
                                       :iterations 100000
                                       :hash "SHA-256"}
                                  password-key
                                  #js {:name "AES-GCM" :length 256}
                                  true
                                  #js ["encrypt" "decrypt"])
          decrypted-private-key-data (.decrypt subtle
                                               #js {:name "AES-GCM" :iv iv}
                                               derived-key
                                               encrypted-private-key)
          private-key (.importKey subtle "pkcs8"
                                  decrypted-private-key-data
                                  #js {:name "RSA-OAEP" :hash "SHA-256"}
                                  true
                                  #js ["decrypt"])]
    private-key))

(defn <encrypt-aes-key
  "Encrypts an AES key with a public key."
  [public-key aes-key]
  (p/let [exported-aes-key (.exportKey subtle "raw" aes-key)]
    (.encrypt subtle
              #js {:name "RSA-OAEP"}
              public-key
              exported-aes-key)))

(defn <decrypt-aes-key
  "Decrypts an AES key with a private key."
  [private-key encrypted-aes-key-data]
  (p/let [encrypted-aes-key (js/Uint8Array. encrypted-aes-key-data)
          decrypted-key-data (.decrypt subtle
                                       #js {:name "RSA-OAEP"}
                                       private-key
                                       encrypted-aes-key)]
    (.importKey subtle
                "raw"
                decrypted-key-data
                "AES-GCM"
                true
                #js ["encrypt" "decrypt"])))

(defn <encrypt-text
  "Encrypts text with an AES key."
  [aes-key text]
  (p/let [iv (js/crypto.getRandomValues (js/Uint8Array. 12))
          encoded-text (.encode (js/TextEncoder.) text)
          encrypted-data (.encrypt subtle
                                   #js {:name "AES-GCM" :iv iv}
                                   aes-key
                                   encoded-text)]
    [iv (js/Uint8Array. encrypted-data)]))

(defn <decrypt-text
  "Decrypts text with an AES key."
  [aes-key encrypted-text-data]
  (p/let [[iv-data encrypted-data-from-db] encrypted-text-data
          iv (js/Uint8Array. iv-data)
          encrypted-data (js/Uint8Array. encrypted-data-from-db)
          decrypted-data (.decrypt subtle
                                   #js {:name "AES-GCM" :iv iv}
                                   aes-key
                                   encrypted-data)
          decoded-text (.decode (js/TextDecoder.) decrypted-data)]
    decoded-text))

(defn <decrypt-text-if-encrypted
  "return nil if not a encrypted-package"
  [aes-key maybe-encrypted-package]
  (when (and (vector? maybe-encrypted-package)
             (<= 2 (count maybe-encrypted-package)))
    (<decrypt-text aes-key maybe-encrypted-package)))

(defn <encrypt-map
  [aes-key encrypt-attr-set m]
  (assert (map? m))
  (reduce
   (fn [map-p encrypt-attr]
     (p/let [m map-p]
       (if-let [v (get m encrypt-attr)]
         (p/let [v' (p/chain (<encrypt-text aes-key v) ldb/write-transit-str)]
           (assoc m encrypt-attr v'))
         m)))
   (p/promise m) encrypt-attr-set))

(defn <encrypt-av-coll
  "see also `rtc-schema/av-schema`"
  [aes-key encrypt-attr-set av-coll]
  (p/all
   (mapv
    (fn [[a v & others]]
      (p/let [v' (if (and (contains? encrypt-attr-set a)
                          (string? v))
                   (p/chain (<encrypt-text aes-key v) ldb/write-transit-str)
                   v)]
        (apply conj [a v'] others)))
    av-coll)))

(defn <decrypt-map
  [aes-key encrypt-attr-set m]
  (assert (map? m))
  (reduce
   (fn [map-p encrypt-attr]
     (p/let [m map-p]
       (if-let [v (get m encrypt-attr)]
         (if (string? v)
           (p/let [v' (<decrypt-text-if-encrypted aes-key (ldb/read-transit-str v))]
             (if v'
               (assoc m encrypt-attr v')
               m))
           m)
         m)))
   (p/promise m) encrypt-attr-set))

(comment
  (let [array-buffers-equal?
        (fn [^js/ArrayBuffer buf1 ^js/ArrayBuffer buf2]
          (if (not= (.-byteLength buf1) (.-byteLength buf2))
            false
            (let [arr1 (js/Uint8Array. buf1)
                  arr2 (js/Uint8Array. buf2)]
              (= (vec arr1) (vec arr2)))))]
    (p/let [rsa-key-pair (<generate-rsa-key-pair)
            aes-key (<generate-aes-key)
            public-key (:publicKey rsa-key-pair)
            private-key (:privateKey rsa-key-pair)
            encrypted-aes-key (<encrypt-aes-key public-key aes-key)
            decrypted-aes-key (<decrypt-aes-key private-key encrypted-aes-key)
            password "my-secret-password"
            encrypted-private-key (<encrypt-private-key password private-key)
            decrypted-private-key (<decrypt-private-key password encrypted-private-key)
            ;; Export keys to compare their raw values
            exported-original-aes (.exportKey subtle "raw" aes-key)
            exported-decrypted-aes (.exportKey subtle "raw" decrypted-aes-key)
            exported-original-private (.exportKey subtle "pkcs8" private-key)
            exported-decrypted-private (.exportKey subtle "pkcs8" decrypted-private-key)
            ;; Test text encryption
            original-text "This is a secret message."
            encrypted-text-data (<encrypt-text aes-key original-text)
            decrypted-text (<decrypt-text aes-key encrypted-text-data)]
      (js/console.log "Original AES key:" aes-key)
      (js/console.log "Decrypted AES key:" decrypted-aes-key)
      (js/console.log "Original private key:" private-key)
      (js/console.log "Decrypted private key:" decrypted-private-key)
      (let [aes-match? (array-buffers-equal? exported-original-aes exported-decrypted-aes)
            private-key-match? (array-buffers-equal? exported-original-private exported-decrypted-private)]
        (js/console.log "AES keys match:" aes-match?)
        (js/console.log "Private keys match:" private-key-match?))
      (js/console.log "Original text:" original-text)
      (js/console.log "Decrypted text:" decrypted-text)
      (js/console.log "Texts match:" (= original-text decrypted-text)))))
