(ns frontend.worker.rtc.encrypt
  "rtc e2ee related"
  (:require [promesa.core :as p]))

(defn- array-buffer->base64 [buffer]
  (let [binary (apply str (map js/String.fromCharCode (js/Uint8Array. buffer)))]
    (js/btoa binary)))

(defn- base64->array-buffer [base64]
  (let [binary-string (js/atob base64)
        len (.-length binary-string)
        bytes' (js/Uint8Array. len)]
    (dotimes [i len]
      (aset bytes' i (.charCodeAt binary-string i)))
    (.-buffer bytes')))

(def ^:private encoder (js/TextEncoder.))
(def ^:private decoder (js/TextDecoder.))

(defn- <salt+password->key
  [salt password]
  (assert (instance? js/Uint8Array salt))
  (p/let [key-material (js/crypto.subtle.importKey
                        "raw"
                        (.encode encoder password)
                        #js {:name "PBKDF2"}
                        false
                        #js ["deriveKey"])]
    (js/crypto.subtle.deriveKey
     #js {:name "PBKDF2"
          :salt salt
          :iterations 100000
          :hash "SHA-256"}
     key-material
     #js {:name "AES-GCM" :length 256}
     true
     #js ["encrypt" "decrypt"])))

(defn <gen-encrypt-text-fn
  [salt password]
  (p/let [key' (<salt+password->key salt password)]
    (fn <encrypt-text [plaintext]
      (p/let [iv (js/crypto.getRandomValues (js/Uint8Array. 12))
              data (.encode encoder plaintext)
              encrypted-data (js/crypto.subtle.encrypt
                              #js {:name "AES-GCM"
                                   :iv iv}
                              key'
                              data)]
        [iv (js/Uint8Array. encrypted-data)]))))

(defn <gen-decrypt-text-fn
  [salt password]
  (assert (instance? js/Uint8Array salt))
  (p/let [key' (<salt+password->key salt password)]
    (fn <decrypt-text [encrypted-package]
      (let [[iv ciphertext] encrypted-package]
        (assert (and (some? iv) (some? ciphertext)))
        (p/let [decrypted-data (js/crypto.subtle.decrypt
                                #js {:name "AES-GCM"
                                     :iv iv}
                                key'
                                ciphertext)]
          (.decode decoder decrypted-data))))))

(comment
  (->
   (p/let [salt (js/crypto.getRandomValues (js/Uint8Array. 16))
           range' (range 10 ;; 100000
                         )
           start (.getTime (js/Date.))
           <encrypt-text (<gen-encrypt-text-fn salt "password")
           _ (def <encrypt-text <encrypt-text)
           encrypted-package-coll (p/all (map #(<encrypt-text "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq") range'))
           end (.getTime (js/Date.))]
     ;; (prn :encrypted-package-coll encrypted-package-coll)
     (println :encrypt-bench (count range') "in" (- end start) "ms")
     (p/let [start2 (.getTime (js/Date.))
             <decrypt-text (<gen-decrypt-text-fn salt "password")
             xx (p/all (map <decrypt-text encrypted-package-coll))
             end2 (.getTime (js/Date.))]
       ;; (prn :xx xx)
       (println :decrypt-bench (count range') "in" (- end2 start2) "ms")))
   (p/catch (fn [e]
              (prn :e e)
              (def ee e)))))
