(ns logseq.common.authorization
  (:require [clojure.string :as string]
            [promesa.core :as p]))

(def text-decoder (js/TextDecoder.))
(def text-encoder (js/TextEncoder.))

(def ^:private jwks-ttl-ms (* 6 60 60 1000))
(def ^:private token-ttl-ms (* 60 60 1000))
(def ^:private token-capacity 200)

(defonce ^:private *jwks-cache (atom {:url nil :keys nil :fetched-at 0}))
(defonce ^:private *token-cache (atom {}))

(defn- get-now-ms []
  (.now js/Date))

(defn- cached-token
  [token now-s now-ms]
  (when-let [{:keys [payload exp cached-at]} (get @*token-cache token)]
    (when (and (number? exp)
               (> exp now-s)
               (< (- now-ms cached-at) token-ttl-ms))
      payload)))

(defn- cache-token!
  [token payload now-ms]
  (let [exp (aget payload "exp")]
    (when (number? exp)
      (swap! *token-cache assoc token {:payload payload :exp exp :cached-at now-ms}))
    (when (> (count @*token-cache) token-capacity)
      (swap! *token-cache
             (fn [cache]
               (into {}
                     (remove (fn [[_ {:keys [exp cached-at]}]]
                               (or (not (number? exp))
                                   (<= exp (js/Math.floor (/ now-ms 1000)))
                                   (>= (- now-ms cached-at) token-ttl-ms))))
                     cache))))))

(defn- get-jwks-keys
  [url & {:keys [force?]}]
  (let [now (get-now-ms)
        {:keys [url cached-url keys fetched-at]} {:cached-url (:url @*jwks-cache)
                                                  :url url
                                                  :keys (:keys @*jwks-cache)
                                                  :fetched-at (:fetched-at @*jwks-cache)}
        fresh? (and (not force?)
                    (= cached-url url)
                    keys
                    (< (- now fetched-at) jwks-ttl-ms))]
    (if fresh?
      (p/resolved keys)
      (p/let [jwks-resp (js/fetch url)
              _ (when-not (.-ok jwks-resp) (throw (ex-info "jwks" {})))
              jwks (.json jwks-resp)
              keys (or (aget jwks "keys") #js [])]
        (reset! *jwks-cache {:url url :keys keys :fetched-at now})
        keys))))

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
        signature-part (nth parts 2)
        now-ms (get-now-ms)
        now-s (js/Math.floor (/ now-ms 1000))]
    (if-let [cached (cached-token token now-s now-ms)]
      (p/resolved cached)
      (p/let [header (decode-jwt-part header-part)
              payload (decode-jwt-part payload-part)
              issuer (aget env "COGNITO_ISSUER")
              client-id (aget env "COGNITO_CLIENT_ID")
              _ (when (not= (aget payload "iss") issuer) (throw (ex-info "iss not found" {})))
              _ (when (not= (aget payload "aud") client-id) (throw (ex-info "aud not found" {})))
              _ (when (and (aget payload "exp") (< (aget payload "exp") now-s))
                  (throw (ex-info "exp" {})))
              jwks-url (aget env "COGNITO_JWKS_URL")
              keys (get-jwks-keys jwks-url)
              key (.find keys (fn [k] (= (aget k "kid") (aget header "kid"))))
              key (if key
                    key
                    (p/let [keys (get-jwks-keys jwks-url :force? true)
                            key (.find keys (fn [k] (= (aget k "kid") (aget header "kid"))))]
                      key))
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
          (cache-token! token payload now-ms)
          payload)))))
