(ns frontend.worker.rtc.encrypt
  "rtc e2ee related"
  (:require ["/frontend/idbkv" :as idb-keyval]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def ^:private encoder (js/TextEncoder.))
(def ^:private decoder (js/TextDecoder.))

;;; TODO: move frontend.idb to deps/, then we can use it in both frontend and db-worker
;;; now, I just direct use "/frontend/idbkv" here
(defonce ^:private store (delay (idb-keyval/newStore "localforage" "keyvaluepairs" 2)))

(defn- <get-item
  [k]
  (when (and k @store)
    (idb-keyval/get k @store)))

(defn- <set-item!
  [k value]
  (when (and k @store)
    (idb-keyval/set k value @store)))

(defn- <remove-item!
  [k]
  (idb-keyval/del k @store))

(defn- graph-encrypt-key-idb-key
  [graph-uuid]
  (assert (some? graph-uuid))
  (str "rtc-encrypt-key###" graph-uuid))

(defn <get-encrypt-key
  [graph-uuid]
  (<get-item (graph-encrypt-key-idb-key graph-uuid)))

(defn <set-encrypt-key!
  [graph-uuid k]
  (assert (instance? js/CryptoKey k))
  (<set-item! (graph-encrypt-key-idb-key graph-uuid) k))

(defn <remove-encrypt-key!
  [graph-uuid]
  (<remove-item! (graph-encrypt-key-idb-key graph-uuid)))

(defn- array-buffer->base64 [buffer]
  (let [binary (apply str (map js/String.fromCharCode (js/Uint8Array. buffer)))]
    (js/btoa binary)))

(defn base64->array-buffer [base64]
  (let [binary-string (js/atob base64)
        len (.-length binary-string)
        bytes' (js/Uint8Array. len)]
    (dotimes [i len]
      (aset bytes' i (.charCodeAt binary-string i)))
    (.-buffer bytes')))

(defn gen-salt
  []
  (array-buffer->base64 (js/crypto.getRandomValues (js/Uint8Array. 16))))

(defn <salt+password->key
  [salt password]
  (p/let [salt' (cond
                  (string? salt) (base64->array-buffer salt)
                  (instance? js/Uint8Array salt) salt
                  :else (throw (ex-info "invalid salt value" {:value salt})))
          key-material (js/crypto.subtle.importKey
                        "raw"
                        (.encode encoder password)
                        #js {:name "PBKDF2"}
                        false
                        #js ["deriveKey"])]
    (js/crypto.subtle.deriveKey
     #js {:name "PBKDF2"
          :salt salt'
          :iterations 100000
          :hash "SHA-256"}
     key-material
     #js {:name "AES-GCM" :length 256}
     false
     #js ["encrypt" "decrypt"])))

(defn <encrypt-text
  [key' plaintext]
  (p/let [iv (js/crypto.getRandomValues (js/Uint8Array. 12))
          data (.encode encoder plaintext)
          encrypted-data (js/crypto.subtle.encrypt
                          #js {:name "AES-GCM"
                               :iv iv}
                          key'
                          data)]
    [iv (js/Uint8Array. encrypted-data)]))

(defn <decrypt-text
  [key' encrypted-package]
  (let [[iv ciphertext] encrypted-package]
    (assert (and (some? iv) (some? ciphertext)))
    (p/let [decrypted-data (js/crypto.subtle.decrypt
                            #js {:name "AES-GCM"
                                 :iv iv}
                            key'
                            ciphertext)]
      (.decode decoder decrypted-data))))

(defn <decrypt-text-if-encrypted
  [key' s]
  (let [maybe-encrypted-package (ldb/read-transit-str s)]
    (if (string? maybe-encrypted-package)
      maybe-encrypted-package
      (<decrypt-text key' maybe-encrypted-package))))

(comment
  (->
   (p/let [salt (js/crypto.getRandomValues (js/Uint8Array. 16))
           range' (range 10 ;; 100000
                         )
           start (.getTime (js/Date.))
           key' (<salt+password->key salt "password")
           encrypted-package-coll (p/all (map #(<encrypt-text key' "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq") range'))
           end (.getTime (js/Date.))]
     ;; (prn :encrypted-package-coll encrypted-package-coll)
     (println :encrypt-bench (count range') "in" (- end start) "ms")
     (p/let [start2 (.getTime (js/Date.))
             xx (p/all (map #(<decrypt-text key' %) encrypted-package-coll))
             end2 (.getTime (js/Date.))]
       ;; (prn :xx xx)
       (println :decrypt-bench (count range') "in" (- end2 start2) "ms")))
   (p/catch (fn [e]
              (prn :e e)
              (def ee e)))))
