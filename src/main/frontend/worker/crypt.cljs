(ns frontend.worker.crypt
  "Fns to en/decrypt some block attrs"
  (:require [datascript.core :as d]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.state :as worker-state]
            [promesa.core :as p]))

(defonce ^:private encoder (new js/TextEncoder "utf-8"))
(comment (defonce ^:private decoder (new js/TextDecoder "utf-8")))

(defn string=>arraybuffer
  [s]
  (.encode encoder s))

(defn <rsa-encrypt
  "Return an arraybuffer"
  [message public-key]
  (assert (string? message))
  (let [data (string=>arraybuffer message)]
    (js/crypto.subtle.encrypt
     #js{:name "RSA-OAEP"}
     public-key
     data)))

(comment
  (defn <decrypt
    [cipher-text private-key]
    (p/let [result (js/crypto.subtle.decrypt
                    #js{:name "RSA-OAEP"}
                    private-key
                    cipher-text)]
      (.decode decoder result))))

(comment
  (defn <aes-encrypt
    [message aes-key]
    (p/let [data (.encode encoder message)
            iv (js/crypto.getRandomValues (js/Uint8Array. 12))
            ciphertext (js/crypto.subtle.encrypt
                        #js{:name "AES-GCM" :iv iv}
                        aes-key
                        data)]
      {:ciphertext ciphertext
       :iv iv})))

(comment
  (defn <aes-decrypt
    [encrypted-data aes-key]
    (p/let [{:keys [ciphertext iv]} encrypted-data
            decrypted (js/crypto.subtle.decrypt
                       #js{:name "AES-GCM" :iv iv}
                       aes-key
                       ciphertext)]
      (.decode decoder decrypted))))

(defonce ^:private key-algorithm
  #js{:name "RSA-OAEP"
      :modulusLength 4096
      :publicExponent (new js/Uint8Array #js[1 0 1])
      :hash "SHA-256"})

(defn <gen-key-pair
  []
  (p/let [result (js/crypto.subtle.generateKey
                  key-algorithm
                  true
                  #js["encrypt" "decrypt"])]
    (js->clj result :keywordize-keys true)))

(defonce ^:private aes-key-algorithm
  #js{:name "AES-GCM"
      :length 256})

(defn <gen-aes-key
  []
  (p/let [result (js/crypto.subtle.generateKey
                  aes-key-algorithm
                  true
                  #js["encrypt" "decrypt"])]
    (js->clj result :keywordize-keys true)))

(defn <export-key
  [key']
  (assert (instance? js/CryptoKey key') key')
  (js/crypto.subtle.exportKey "jwk" key'))

(defn <import-public-key
  [jwk]
  (assert (instance? js/Object jwk) jwk)
  (js/crypto.subtle.importKey "jwk" jwk key-algorithm true #js["encrypt"]))

(defn <import-private-key
  [jwk]
  (assert (instance? js/Object jwk) jwk)
  (js/crypto.subtle.importKey "jwk" jwk key-algorithm true #js["decrypt"]))

(comment
  (p/let [{:keys [publicKey privateKey]} (<gen-key-pair)]
    (p/doseq [msg (map #(str "message" %) (range 1000))]
      (p/let [encrypted (<encrypt msg publicKey)
              plaintxt (<decrypt encrypted privateKey)]
        (prn :encrypted msg)
        (prn :plaintxt plaintxt))))

  (p/let [k (<gen-aes-key)
          kk (<export-key k)
          encrypted (<aes-encrypt (apply str (repeat 1000 "x")) k)
          plaintxt (<aes-decrypt encrypted k)]
    (prn :encrypted encrypted)
    (prn :plaintxt plaintxt)))

(defn store-graph-keys-jwk
  [repo aes-key-jwk]
  (let [conn (worker-state/get-client-ops-conn repo)]
    (assert (some? conn) repo)
    (let [aes-key-datom (first (d/datoms @conn :avet :aes-key-jwk))]
      (assert (nil? aes-key-datom) aes-key-datom)
      (d/transact! conn [[:db/add "e1" :aes-key-jwk aes-key-jwk]]))))

(defn get-graph-keys-jwk
  [repo]
  (let [conn (worker-state/get-client-ops-conn repo)]
    (assert (some? conn) repo)
    (let [aes-key-datom (first (d/datoms @conn :avet :aes-key-jwk))]
      {:aes-key-jwk (:v aes-key-datom)})))

(def-thread-api :thread-api/rtc-get-graph-keys
  [repo]
  (get-graph-keys-jwk repo))
