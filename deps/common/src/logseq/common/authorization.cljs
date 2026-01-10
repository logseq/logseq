(ns logseq.common.authorization
  (:require [clojure.string :as string]
            [promesa.core :as p]))

(def text-decoder (js/TextDecoder.))
(def text-encoder (js/TextEncoder.))

(defn- base64url->uint8array [input]
  (let [pad (if (pos? (mod (count input) 4))
              (apply str (repeat (- 4 (mod (count input) 4)) "="))
              "")
        base64 (-> (str input pad)
                   (string/replace "-" "+")
                   (string/replace "_" "/"))
        raw (js/atob base64)
        data (js/Uint8Array. (.-length raw))]
    (dotimes [i (.-length raw)]
      (aset data i (.charCodeAt raw i)))
    data))

(defn- decode-jwt-part [part]
  (let [data (base64url->uint8array part)]
    (js/JSON.parse (.decode text-decoder data))))

(defn- import-rsa-key [jwk]
  (.importKey js/crypto.subtle
              "jwk"
              jwk
              #js {:name "RSASSA-PKCS1-v1_5" :hash "SHA-256"}
              false
              #js ["verify"]))

(defn verify-jwt [token env]
  (let [parts (string/split token #"\.")
        _ (when (not= 3 (count parts)) (throw (ex-info "invalid" {})))
        header-part (nth parts 0)
        payload-part (nth parts 1)
        signature-part (nth parts 2)]
    (p/let [header (decode-jwt-part header-part)
            payload (decode-jwt-part payload-part)
            issuer (aget env "COGNITO_ISSUER")
            client-id (aget env "COGNITO_CLIENT_ID")
            _ (when (not= (aget payload "iss") issuer) (throw (ex-info "iss not found" {})))
            _ (when (not= (aget payload "aud") client-id) (throw (ex-info "aud not found" {})))
            now (js/Math.floor (/ (.now js/Date) 1000))
            _ (when (and (aget payload "exp") (< (aget payload "exp") now))
                (throw (ex-info "exp" {})))
            jwks-resp (js/fetch (aget env "COGNITO_JWKS_URL"))
            _ (when-not (.-ok jwks-resp) (throw (ex-info "jwks" {})))
            jwks (.json jwks-resp)
            keys (or (aget jwks "keys") #js [])
            key (.find keys (fn [k] (= (aget k "kid") (aget header "kid"))))
            _ (when-not key (throw (ex-info "kid" {})))
            crypto-key (import-rsa-key key)
            data (.encode text-encoder (str header-part "." payload-part))
            signature (base64url->uint8array signature-part)
            ok (.verify js/crypto.subtle
                        "RSASSA-PKCS1-v1_5"
                        crypto-key
                        signature
                        data)]
      (when ok
        payload))))
