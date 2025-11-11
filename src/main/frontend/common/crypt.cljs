(ns frontend.common.crypt
  "crypto utils"
  (:require [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defonce subtle (.. js/crypto -subtle))

(defn <export-aes-key
  [aes-key]
  (assert (instance? js/CryptoKey aes-key))
  (p/let [exported (.exportKey subtle "raw" aes-key)]
    (js/Uint8Array. exported)))

(defn <import-aes-key
  [exported-aes-key]
  (assert (instance? js/Uint8Array exported-aes-key))
  (.importKey subtle
              "raw"
              exported-aes-key
              "AES-GCM"
              true
              #js ["encrypt" "decrypt"]))

(defn <export-public-key
  [public-key]
  (assert (instance? js/CryptoKey public-key))
  (p/let [exported (.exportKey subtle "spki" public-key)]
    (js/Uint8Array. exported)))

(defn <import-public-key
  [exported-public-key]
  (assert (instance? js/Uint8Array exported-public-key))
  (.importKey subtle "spki" exported-public-key
              #js {:name "RSA-OAEP" :hash "SHA-256"}
              true
              #js ["encrypt"]))

(defn <export-private-key
  [private-key]
  (assert (instance? js/CryptoKey private-key))
  (p/let [exported (.exportKey subtle "pkcs8" private-key)]
    (js/Uint8Array. exported)))

(defn <import-private-key
  [exported-private-key]
  (assert (instance? js/Uint8Array exported-private-key))
  (.importKey subtle "pkcs8" exported-private-key
              #js {:name "RSA-OAEP" :hash "SHA-256"}
              true
              #js ["decrypt"]))

(comment
  (->
   (p/let [kp (<generate-rsa-key-pair)
           public-key (:publicKey kp)
           exported-public-key (<export-public-key public-key)
           public-key* (<import-public-key exported-public-key)
           exported-public-key2 (<export-public-key public-key*)]
     (prn (= (vec exported-public-key) (vec exported-public-key2))))
   (p/catch (fn [e] (prn :e e)))))

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
    {:publicKey (.-publicKey r)
     :privateKey (.-privateKey r)}))

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
  (assert (and (string? password) (instance? js/CryptoKey private-key)))
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
    [salt iv (js/Uint8Array. encrypted-private-key)]))

(defn <decrypt-private-key
  "Decrypts a private key with a password."
  [password encrypted-key-data]
  (assert (and (vector? encrypted-key-data) (= 3 (count encrypted-key-data))))
  (->
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
     private-key)
   (p/catch (fn [e]
              (log/error "decrypt-private-key" e)
              (ex-info "decrypt-private-key" {} e)))))

(defn <encrypt-aes-key
  "Encrypts an AES key with a public key."
  [public-key aes-key]
  (assert (and (instance? js/CryptoKey public-key)
               (instance? js/CryptoKey aes-key)))
  (p/let [exported-aes-key (<export-aes-key aes-key)
          encrypted-aes-key (.encrypt subtle
                                      #js {:name "RSA-OAEP"}
                                      public-key
                                      exported-aes-key)]
    (js/Uint8Array. encrypted-aes-key)))

(defn <decrypt-aes-key
  "Decrypts an AES key with a private key."
  [private-key encrypted-aes-key-data]
  (assert (and (instance? js/CryptoKey private-key)
               (instance? js/Uint8Array encrypted-aes-key-data)))
  (->
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
                 #js ["encrypt" "decrypt"]))
   (p/catch (fn [e]
              (log/error "decrypt-aes-key" e)
              (ex-info "decrypt-aes-key" {} e)))))

(defn <encrypt-uint8array
  [aes-key arr]
  (assert (and (instance? js/CryptoKey aes-key) (instance? js/Uint8Array arr)))
  (p/let [iv (js/crypto.getRandomValues (js/Uint8Array. 12))
          encrypted-data (.encrypt subtle
                                   #js {:name "AES-GCM" :iv iv}
                                   aes-key
                                   arr)]
    [iv (js/Uint8Array. encrypted-data)]))

(defn <decrypt-uint8array
  [aes-key encrypted-data-vector]
  (->
   (p/let [[iv-data encrypted-data] encrypted-data-vector
           _ (assert (instance? js/Uint8Array encrypted-data))
           iv (js/Uint8Array. iv-data)
           decrypted-data (.decrypt subtle
                                    #js {:name "AES-GCM" :iv iv}
                                    aes-key
                                    encrypted-data)]
     (js/Uint8Array. decrypted-data))
   (p/catch
    (fn [e]
      (log/error "decrypt-uint8array" e)
      (ex-info "decrypt-uint8array" {} e)))))

(defn <encrypt-text
  "Encrypts text with an AES key."
  [aes-key text]
  (assert (and (string? text) (instance? js/CryptoKey aes-key)))
  (p/let [iv (js/crypto.getRandomValues (js/Uint8Array. 12))
          encoded-text (.encode (js/TextEncoder.) text)
          encrypted-data (.encrypt subtle
                                   #js {:name "AES-GCM" :iv iv}
                                   aes-key
                                   encoded-text)]
    [iv (js/Uint8Array. encrypted-data)]))

(defn <decrypt-text
  "Decrypts text with an AES key."
  [aes-key encrypted-text-data-vector]
  (-> (p/let [[iv-data encrypted-data] encrypted-text-data-vector
              iv (js/Uint8Array. iv-data)
              encrypted-data (js/Uint8Array. encrypted-data)
              decrypted-data (.decrypt subtle
                                       #js {:name "AES-GCM" :iv iv}
                                       aes-key
                                       encrypted-data)
              decoded-text (.decode (js/TextDecoder.) decrypted-data)]
        decoded-text)
      (p/catch
       (fn [e]
         (log/error "decrypt-text" e)
         (ex-info "decrypt-text" {} e)))))

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
           (->
            (p/let [v' (<decrypt-text-if-encrypted aes-key (ldb/read-transit-str v))]
              (if v'
                (assoc m encrypt-attr v')
                m))
            (p/catch (fn [e] (ex-info "decrypt map" {:m m :decrypt-attr encrypt-attr} e))))
           m)
         m)))
   (p/promise m) encrypt-attr-set))

(defn <encrypt-text-by-text-password
  [text-password text]
  (assert (and (string? text-password) (string? text)))
  (p/let [salt (js/crypto.getRandomValues (js/Uint8Array. 16))
          iv (js/crypto.getRandomValues (js/Uint8Array. 12))
          password-key (.importKey subtle "raw"
                                   (.encode (js/TextEncoder.) text-password)
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
          encoded-text (.encode (js/TextEncoder.) text)
          encrypted-text (.encrypt subtle
                                   #js {:name "AES-GCM" :iv iv}
                                   derived-key
                                   encoded-text)]
    [salt iv (js/Uint8Array. encrypted-text)]))

(defn <decrypt-text-by-text-password
  [text-password encrypted-data-vector]
  (assert (and (string? text-password) (vector? encrypted-data-vector)))
  (->
   (p/let [[salt-data iv-data encrypted-data] encrypted-data-vector
           salt (js/Uint8Array. salt-data)
           iv (js/Uint8Array. iv-data)
           encrypted-data (js/Uint8Array. encrypted-data)
           password-key (.importKey subtle "raw"
                                    (.encode (js/TextEncoder.) text-password)
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
           decrypted-data (.decrypt subtle
                                    #js {:name "AES-GCM" :iv iv}
                                    derived-key
                                    encrypted-data)]
     (.decode (js/TextDecoder.) decrypted-data))
   (p/catch
    (fn [e]
      (log/error "decrypt-text-by-text-password" e)
      (ex-info "decrypt-text-by-text-password" {} e)))))
