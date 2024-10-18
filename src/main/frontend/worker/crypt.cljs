(ns frontend.worker.crypt
  "Fns to en/decrypt some block attrs"
  (:require [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [promesa.core :as p]))

(defonce ^:private encoder (new js/TextEncoder "utf-8"))
(comment (defonce ^:private decoder (new js/TextDecoder "utf-8")))

(defn <encrypt
  [message public-key]
  (let [data (.encode encoder message)]
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
        (prn :plaintxt plaintxt)))))

(defn store-graph-keys-jwk
  [repo public-key-jwk private-key-jwk]
  (let [conn (worker-state/get-client-ops-conn repo)]
    (assert (some? conn) repo)
    (let [public-key-datom (first (d/datoms @conn :avet :public-key-jwk))
          private-key-datom (first (d/datoms @conn :avet :private-key-jwk))]
      (assert (and (nil? public-key-datom) (nil? private-key-datom)) public-key-datom)
      (d/transact! conn [[:db/add "e1" :public-key-jwk public-key-jwk]
                         [:db/add "e2" :private-key-jwk private-key-jwk]]))))

(defn get-graph-keys-jwk
  [repo]
  (let [conn (worker-state/get-client-ops-conn repo)]
    (assert (some? conn) repo)
    (let [public-key-datom (first (d/datoms @conn :avet :public-key-jwk))
          private-key-datom (first (d/datoms @conn :avet :private-key-jwk))]
      {:public-key-jwk (:v public-key-datom)
       :private-key-jwk (:v private-key-datom)})))
