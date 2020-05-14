(ns frontend.encrypt
  (:require [promesa.core :as p]
            [goog.object :as gobj]
            [cljs-bean.core :as bean]
            [frontend.utf8 :as utf8]
            [medley.core :as medley]))

;; Idea and code from https://blog.excalidraw.com/end-to-end-encryption.
(defn generate-key
  []
  (js/window.crypto.subtle.generateKey
   (bean/->js {:name "AES-GCM"
               :length 128})
   true
   (bean/->js ["encrypt" "decrypt"])))

(defn array-buffer->str
  [buf]
  (.apply (gobj/get js/String "fromCharCode")
          nil
          (js/Uint8Array. buf)))

(defn str->array-buffer
  "Convert a string to a js/ArrayBuffer"
  [s]
  (let [buf (js/ArrayBuffer. (count s))
        buf-view (js/Uint8Array. buf)]
    (dotimes [i (count s)]
      (aset buf-view i (.charCodeAt s i)))
    buf))

(defn encrypt
  [key content]
  (p/let [encrypted-array-buffer
          (js/window.crypto.subtle.encrypt
           (bean/->js {:name "AES-GCM"
                       :iv (js/Uint8Array. 12)})
           key
           (.encode (js/TextEncoder.)
                    (js/JSON.stringify content)))]
    (array-buffer->str encrypted-array-buffer)))

(defn base64-key
  [key]
  (p/let [key (js/window.crypto.subtle.exportKey
               "jwk"
               key)]
    (gobj/get key "k")))

(defn decrypt
  [object-key encrypted]
  ;; Build the key using object-key and decrypt the content
  (let [encrypted (str->array-buffer encrypted)]
    (p/let [key (js/window.crypto.subtle.importKey
                "jwk"
                (bean/->js
                 {:k object-key
                  :alg "A128GCM"
                  :ext true
                  :key_ops ["encrypt" "decrypt"]
                  :kty "oct"})
                (bean/->js {:name "AES-GCM"
                            :length 128})
                false
                (bean/->js ["decrypt"]))
           decrypted (js/window.crypto.subtle.decrypt
                      (bean/->js
                       {:name "AES-GCM"
                        :iv (js/Uint8Array. 12)})
                      key
                      encrypted)
           decoded (.decode (js/window.TextDecoder.)
                            (js/Uint8Array. decrypted))]
     (js/JSON.parse decoded))))
