(ns logseq.publish.common
  "Provides common util fns"
  (:require [clojure.string :as string]
            [cognitect.transit :as transit]
            [datascript.transit :as dt]
            [logseq.db :as ldb])
  (:require-macros [logseq.publish.async :refer [js-await]]))

(def text-decoder (js/TextDecoder.))
(def text-encoder (js/TextEncoder.))

(def ^:private fallback-transit-reader
  (let [handlers (assoc dt/read-handlers
                        "datascript/Entity" identity
                        "error" (fn [m] (ex-info (:message m) (:data m)))
                        "js/Error" (fn [m] (js/Error. (:message m))))
        reader (transit/reader :json {:handlers handlers})]
    (fn [s]
      (transit/read reader s))))

(defn read-transit-safe [s]
  (try
    (ldb/read-transit-str s)
    (catch :default _
      (fallback-transit-reader s))))

(defn cors-headers
  []
  #js {"access-control-allow-origin" "*"
       "access-control-allow-methods" "GET,POST,DELETE,OPTIONS"
       "access-control-allow-headers" "content-type,authorization,x-publish-meta,x-asset-meta,if-none-match"
       "access-control-expose-headers" "etag"})

(defn merge-headers [base extra]
  (let [headers (js/Headers. base)]
    (doseq [[k v] (js/Object.entries extra)]
      (.set headers k v))
    headers))

(defn json-response
  ([data] (json-response data 200))
  ([data status]
   (js/Response.
    (js/JSON.stringify (clj->js data))
    #js {:status status
         :headers (merge-headers
                   #js {"content-type" "application/json"}
                   (cors-headers))})))

(defn unauthorized []
  (json-response {:error "unauthorized"} 401))

(defn forbidden []
  (json-response {:error "forbidden"} 403))

(defn bad-request [message]
  (json-response {:error message} 400))

(defn not-found []
  (json-response {:error "not found"} 404))

(defn normalize-meta [meta]
  (when meta
    (if (map? meta)
      meta
      (js->clj meta :keywordize-keys true))))

(defn parse-meta-header [request]
  (let [meta-header (.get (.-headers request) "x-publish-meta")]
    (when meta-header
      (try
        (normalize-meta (js/JSON.parse meta-header))
        (catch :default _
          nil)))))

(defn get-publish-meta [payload]
  (when payload
    (:meta payload)))

(defn meta-from-body [buffer]
  (try
    (let [payload (read-transit-safe (.decode text-decoder buffer))
          meta (get-publish-meta payload)]
      (normalize-meta meta))
    (catch :default e
      (js/console.warn "publish: failed to parse meta from body" e)
      nil)))

(defn valid-meta? [{:keys [content_hash graph page_uuid]}]
  (and content_hash graph page_uuid))

(defn get-sql-rows [^js result]
  (let [iter-fn (when result (aget result js/Symbol.iterator))]
    (cond
      (nil? result) []
      (fn? (.-toArray result)) (.toArray result)
      (fn? iter-fn) (vec (js/Array.from result))
      (array? (.-results result)) (.-results result)
      (array? (.-rows result)) (.-rows result)
      (array? result) (if (empty? result)
                        []
                        (let [first-row (first result)]
                          (cond
                            (array? (.-results first-row)) (.-results first-row)
                            (array? (.-rows first-row)) (.-rows first-row)
                            :else result)))
      :else [])))

(defn sql-exec
  [sql sql-str & args]
  (.apply (.-exec sql) sql (to-array (cons sql-str args))))

(defn to-hex [buffer]
  (->> (js/Uint8Array. buffer)
       (array-seq)
       (map (fn [b] (.padStart (.toString b 16) 2 "0")))
       (apply str)))

(defn sha256-hex [message]
  (js-await [data (.encode text-encoder message)
             digest (.digest js/crypto.subtle "SHA-256" data)]
            (to-hex digest)))

(def password-kdf-max-iterations 90000)
(def password-kdf-iterations 90000)

(defn bytes->base64url [data]
  (let [binary (apply str (map #(js/String.fromCharCode %) (array-seq data)))
        b64 (js/btoa binary)]
    (-> b64
        (string/replace #"\+" "-")
        (string/replace #"/" "_")
        (string/replace #"=+$" ""))))

(defn hash-password [password]
  (js-await [salt (doto (js/Uint8Array. 16)
                    (js/crypto.getRandomValues))
             crypto-key (.importKey js/crypto.subtle
                                    "raw"
                                    (.encode text-encoder password)
                                    #js {:name "PBKDF2"}
                                    false
                                    #js ["deriveBits"])
             iterations (min password-kdf-iterations password-kdf-max-iterations)
             derived (.deriveBits js/crypto.subtle
                                  #js {:name "PBKDF2"
                                       :hash "SHA-256"
                                       :salt salt
                                       :iterations iterations}
                                  crypto-key
                                  256)
             derived-bytes (js/Uint8Array. derived)
             salt-encoded (bytes->base64url salt)
             hash-encoded (bytes->base64url derived-bytes)]
            (str "pbkdf2$sha256$"
                 iterations
                 "$"
                 salt-encoded
                 "$"
                 hash-encoded)))

(defn base64url->uint8array [input]
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

(defn verify-password [password stored-hash]
  (let [parts (when (string? stored-hash)
                (string/split stored-hash #"\$"))]
    (if-not (and (= 5 (count parts))
                 (= "pbkdf2" (nth parts 0))
                 (= "sha256" (nth parts 1)))
      false
      (js-await [iterations (js/parseInt (nth parts 2))]
                (if (> iterations password-kdf-max-iterations)
                  false
                  (js-await [salt (base64url->uint8array (nth parts 3))
                             expected (base64url->uint8array (nth parts 4))
                             crypto-key (.importKey js/crypto.subtle
                                                    "raw"
                                                    (.encode text-encoder password)
                                                    #js {:name "PBKDF2"}
                                                    false
                                                    #js ["deriveBits"])
                             derived (.deriveBits js/crypto.subtle
                                                  #js {:name "PBKDF2"
                                                       :hash "SHA-256"
                                                       :salt salt
                                                       :iterations iterations}
                                                  crypto-key
                                                  (* 8 (.-length expected)))
                             derived-bytes (js/Uint8Array. derived)]
                            (if (not= (.-length derived-bytes) (.-length expected))
                              false
                              (let [mismatch (reduce (fn [acc idx]
                                                       (bit-or acc
                                                               (bit-xor (aget derived-bytes idx)
                                                                        (aget expected idx))))
                                                     0
                                                     (range (.-length expected)))]
                                (zero? mismatch)))))))))

(defn hmac-sha256 [key message]
  (js-await [crypto-key (.importKey js/crypto.subtle
                                    "raw"
                                    key
                                    #js {:name "HMAC" :hash "SHA-256"}
                                    false
                                    #js ["sign"])]
            (.sign js/crypto.subtle "HMAC" crypto-key message)))

(defn encode-rfc3986 [value]
  (-> (js/encodeURIComponent value)
      (.replace #"[!'()*]" (fn [c]
                             (str "%"
                                  (.toUpperCase (.toString (.charCodeAt c 0) 16)))))))

(defn encode-path [path]
  (->> (string/split path #"/")
       (map encode-rfc3986)
       (string/join "/")))

(defn get-signature-key [secret date-stamp region service]
  (js-await [k-date (hmac-sha256
                     (.encode text-encoder (str "AWS4" secret))
                     (.encode text-encoder date-stamp))
             k-region (hmac-sha256 k-date (.encode text-encoder region))
             k-service (hmac-sha256 k-region (.encode text-encoder service))]
            (hmac-sha256 k-service (.encode text-encoder "aws4_request"))))

(defn presign-r2-url [r2-key env]
  (js-await [region "auto"
             service "s3"
             host (str (aget env "R2_ACCOUNT_ID") ".r2.cloudflarestorage.com")
             bucket (aget env "R2_BUCKET")
             method "GET"
             now (js/Date.)
             amz-date (.replace (.toISOString now) #"[ :-]|\.\d{3}" "")
             date-stamp (.slice amz-date 0 8)
             credential-scope (str date-stamp "/" region "/" service "/aws4_request")
             params (->> [["X-Amz-Algorithm" "AWS4-HMAC-SHA256"]
                          ["X-Amz-Credential" (str (aget env "R2_ACCESS_KEY_ID") "/" credential-scope)]
                          ["X-Amz-Date" amz-date]
                          ["X-Amz-Expires" "300"]
                          ["X-Amz-SignedHeaders" "host"]]
                         (sort-by first))
             canonical-query (->> params
                                  (map (fn [[k v]]
                                         (str (encode-rfc3986 k) "=" (encode-rfc3986 v))))
                                  (string/join "&"))
             canonical-uri (str "/" bucket "/" (encode-path r2-key))
             canonical-headers (str "host:" host "\n")
             signed-headers "host"
             payload-hash "UNSIGNED-PAYLOAD"
             canonical-request (string/join "\n"
                                            [method
                                             canonical-uri
                                             canonical-query
                                             canonical-headers
                                             signed-headers
                                             payload-hash])
             canonical-hash (sha256-hex canonical-request)
             string-to-sign (string/join "\n"
                                         ["AWS4-HMAC-SHA256"
                                          amz-date
                                          credential-scope
                                          canonical-hash])
             signing-key (get-signature-key (aget env "R2_SECRET_ACCESS_KEY")
                                            date-stamp
                                            region
                                            service)
             raw-signature (hmac-sha256 signing-key (.encode text-encoder string-to-sign))
             signature (to-hex raw-signature)
             signed-query (str canonical-query "&X-Amz-Signature=" signature)]
            (str "https://" host canonical-uri "?" signed-query)))

(defn decode-jwt-part [part]
  (let [data (base64url->uint8array part)]
    (js/JSON.parse (.decode text-decoder data))))

(defn import-rsa-key [jwk]
  (.importKey js/crypto.subtle
              "jwk"
              jwk
              #js {:name "RSASSA-PKCS1-v1_5" :hash "SHA-256"}
              false
              #js ["verify"]))

(defn verify-jwt [token env]
  (js-await [parts (string/split token #"\.")
             _ (when (not= 3 (count parts)) (throw (ex-info "invalid" {})))
             header-part (nth parts 0)
             payload-part (nth parts 1)
             signature-part (nth parts 2)
             header (decode-jwt-part header-part)
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
            (when ok payload)))

(defn normalize-etag [etag]
  (when etag
    (string/replace etag #"\"" "")))

(defn short-id-for-page [graph-uuid page-uuid]
  (js-await [payload (.encode text-encoder (str graph-uuid ":" page-uuid))
             digest (.digest js/crypto.subtle "SHA-256" payload)]
            (let [data (js/Uint8Array. digest)
                  encoded (bytes->base64url data)]
              (subs encoded 0 10))))
