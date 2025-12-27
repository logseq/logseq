(ns logseq.publish.worker
  (:require ["cloudflare:workers" :refer [DurableObject]]
            [clojure.string :as string]
            [logseq.db :as ldb]
            [shadow.cljs.modern :refer (defclass)])
  (:require-macros [logseq.publish.async :refer [js-await]]))

(def text-decoder (js/TextDecoder.))
(def text-encoder (js/TextEncoder.))

(defn cors-headers
  []
  #js {"access-control-allow-origin" "*"
       "access-control-allow-methods" "GET,POST,OPTIONS"
       "access-control-allow-headers" "content-type,authorization,x-publish-meta,if-none-match"
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

(defn bad-request [message]
  (json-response {:error message} 400))

(defn not-found []
  (json-response {:error "not found"} 404))

(defn parse-meta-header [request]
  (let [meta-header (.get (.-headers request) "x-publish-meta")]
    (when meta-header
      (try
        (js/JSON.parse meta-header)
        (catch :default _
          nil)))))

(defn meta-from-body [buffer]
  (try
    (let [payload (ldb/read-transit-str (.decode text-decoder buffer))
          meta (:publish/meta payload)]
      (when meta
        (clj->js meta)))
    (catch :default _
      nil)))

(defn valid-meta? [meta]
  (and meta
       (aget meta "publish/content-hash")
       (aget meta "publish/graph")
       (aget meta "page-uuid")))

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

(defn base64url->uint8array [input]
  (let [pad (if (pos? (mod (count input) 4))
              (apply str (repeat (- 4 (mod (count input) 4)) "="))
              "")
        base64 (-> (str input pad)
                   (string/replace "-" "+")
                   (string/replace "_" "/"))
        raw (js/atob base64)
        bytes (js/Uint8Array. (.-length raw))]
    (dotimes [i (.-length raw)]
      (aset bytes i (.charCodeAt raw i)))
    bytes))

(defn decode-jwt-part [part]
  (let [bytes (base64url->uint8array part)]
    (js/JSON.parse (.decode text-decoder bytes))))

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
             _ (when (not= (aget payload "iss") issuer) (throw (ex-info "iss" {})))
             _ (when (not= (aget payload "aud") client-id) (throw (ex-info "aud" {})))
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

(defn merge-attr
  [entity attr value]
  (let [existing (get entity attr ::none)]
    (cond
      (= existing ::none) (assoc entity attr value)
      (vector? existing) (assoc entity attr (conj existing value))
      (set? existing) (assoc entity attr (conj existing value))
      :else (assoc entity attr [existing value]))))

(defn datoms->entities
  [datoms]
  (reduce
   (fn [acc datom]
     (let [[e a v _tx added?] datom]
       (if added?
         (update acc e merge-attr a v)
         acc)))
   {}
   datoms))

(defn entity->title
  [entity]
  (or (:block/title entity)
      (:block/name entity)
      "Untitled"))

(defn render-blocks
  [blocks]
  (let [sorted (sort-by (fn [block]
                          (or (:block/order block) (:block/uuid block) ""))
                        blocks)]
    (str "<ul class=\"blocks\">"
         (apply str
                (map (fn [block]
                       (let [content (or (:block/content block) "")]
                         (str "<li class=\"block\">"
                              "<div class=\"block-content\">"
                              (string/escape content {"&" "&amp;"
                                                      "<" "&lt;"
                                                      ">" "&gt;"})
                              "</div>"
                              "</li>")))
                     sorted))
         "</ul>")))

(defn render-page-html
  [transit page-uuid-str]
  (let [payload (ldb/read-transit-str transit)
        datoms (:datoms payload)
        entities (datoms->entities datoms)
        page-uuid (uuid page-uuid-str)
        page-entity (some (fn [[_e entity]]
                            (when (= (:block/uuid entity) page-uuid)
                              entity))
                          entities)
        page-title (entity->title page-entity)
        page-eid (some (fn [[e entity]]
                         (when (= (:block/uuid entity) page-uuid)
                           e))
                       entities)
        blocks (->> entities
                    (keep (fn [[_e entity]]
                            (when (= (:block/page entity) page-eid)
                              entity)))
                    (remove #(= (:block/uuid %) page-uuid)))]
    (str "<!doctype html>"
         "<html><head><meta charset=\"utf-8\"/>"
         "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>"
         "<title>" (string/escape page-title {"&" "&amp;" "<" "&lt;" ">" "&gt;"}) "</title>"
         "<style>"
         "body{margin:0;background:#fbf8f3;color:#1b1b1b;font-family:Georgia,serif;}"
         ".wrap{max-width:880px;margin:0 auto;padding:40px 24px;}"
         "h1{font-size:30px;margin:0 0 20px;font-weight:600;}"
         ".blocks{list-style:none;padding:0;margin:0;}"
         ".block{padding:8px 0;border-bottom:1px solid #eee6dc;}"
         ".block-content{white-space:pre-wrap;line-height:1.6;}"
         "</style>"
         "</head><body>"
         "<main class=\"wrap\">"
         "<h1>" (string/escape page-title {"&" "&amp;" "<" "&lt;" ">" "&gt;"}) "</h1>"
         (render-blocks blocks)
         "</main></body></html>")))

(defn handle-post-pages [request env]
  (js-await [auth-header (.get (.-headers request) "authorization")
             token (when (and auth-header (string/starts-with? auth-header "Bearer "))
                     (subs auth-header 7))
             dev-skip? (= "true" (aget env "DEV_SKIP_AUTH"))
             claims (cond
                      dev-skip? #js {:sub "dev"}
                      (nil? token) nil
                      :else (verify-jwt token env))]
            (let [claims (if dev-skip? #js {:sub "dev"} claims)]
              (if (and (not dev-skip?) (nil? claims))
                (unauthorized)
                (js-await [body (.arrayBuffer request)]
                          (let [meta (or (parse-meta-header request)
                                         (meta-from-body body))]
                            (cond
                              (not (valid-meta? meta))
                              (bad-request "missing publish metadata")

                              :else
                              (js-await [r2-key (str "publish/" (aget meta "publish/graph") "/"
                                                     (aget meta "publish/content-hash") ".transit")
                                         r2 (aget env "PUBLISH_R2")
                                         existing (.head r2 r2-key)
                                         _ (when-not existing
                                             (.put r2 r2-key body
                                                   #js {:httpMetadata #js {:contentType "application/transit+json"}}))
                                         ^js do-ns (aget env "PUBLISH_META_DO")
                                         do-id (.idFromName do-ns
                                                            (str (aget meta "publish/graph")
                                                                 ":"
                                                                 (aget meta "page-uuid")))
                                         do-stub (.get do-ns do-id)
                                         payload (clj->js {:page-uuid (aget meta "page-uuid")
                                                           :publish/graph (aget meta "publish/graph")
                                                           :schema-version (aget meta "schema-version")
                                                           :block-count (aget meta "block-count")
                                                           :publish/content-hash (aget meta "publish/content-hash")
                                                           :publish/content-length (aget meta "publish/content-length")
                                                           :r2_key r2-key
                                                           :owner_sub (aget claims "sub")
                                                           :publish/created-at (aget meta "publish/created-at")
                                                           :updated_at (.now js/Date)})
                                         meta-resp (.fetch do-stub "https://publish/pages"
                                                           #js {:method "POST"
                                                                :headers #js {"content-type" "application/json"}
                                                                :body (js/JSON.stringify payload)})]
                                        (if-not (.-ok meta-resp)
                                          (json-response {:error "metadata store failed"} 500)
                                          (js-await [index-id (.idFromName do-ns "index")
                                                     index-stub (.get do-ns index-id)
                                                     _ (.fetch index-stub "https://publish/pages"
                                                               #js {:method "POST"
                                                                    :headers #js {"content-type" "application/json"}
                                                                    :body (js/JSON.stringify payload)})]
                                                    (json-response {:page_uuid (aget meta "page-uuid")
                                                                    :graph_uuid (aget meta "publish/graph")
                                                                    :r2_key r2-key
                                                                    :updated_at (.now js/Date)})))))))))))

(defn handle-get-page [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page-uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page-uuid))
      (bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns (str graph-uuid ":" page-uuid))
                 do-stub (.get do-ns do-id)
                 meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page-uuid))]
                (if-not (.-ok meta-resp)
                  (not-found)
                  (js-await [meta (.json meta-resp)
                             etag (aget meta "publish/content-hash")
                             if-none-match (normalize-etag (.get (.-headers request) "if-none-match"))]
                            (if (and etag if-none-match (= etag if-none-match))
                              (js/Response. nil #js {:status 304
                                                     :headers (merge-headers
                                                               #js {:etag etag}
                                                               (cors-headers))})
                              (json-response (js->clj meta :keywordize-keys false) 200))))))))

(defn handle-get-page-transit [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page-uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page-uuid))
      (bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns (str graph-uuid ":" page-uuid))
                 do-stub (.get do-ns do-id)
                 meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page-uuid))]
                (if-not (.-ok meta-resp)
                  (not-found)
                  (js-await [meta (.json meta-resp)
                             r2-key (aget meta "r2_key")]
                            (if-not r2-key
                              (json-response {:error "missing transit"} 404)
                              (js-await [etag (aget meta "publish/content-hash")
                                         if-none-match (normalize-etag (.get (.-headers request) "if-none-match"))
                                         signed-url (when-not (and etag if-none-match (= etag if-none-match))
                                                      (presign-r2-url r2-key env))]
                                        (if (and etag if-none-match (= etag if-none-match))
                                          (js/Response. nil #js {:status 304
                                                                 :headers (merge-headers
                                                                           #js {:etag etag}
                                                                           (cors-headers))})
                                          (json-response {:url signed-url
                                                          :expires_in 300
                                                          :etag etag}
                                                         200))))))))))

(defn handle-list-pages [env]
  (js-await [^js do-ns (aget env "PUBLISH_META_DO")
             do-id (.idFromName do-ns "index")
             do-stub (.get do-ns do-id)
             meta-resp (.fetch do-stub "https://publish/pages" #js {:method "GET"})]
            (if-not (.-ok meta-resp)
              (not-found)
              (js-await [meta (.json meta-resp)]
                        (json-response (js->clj meta :keywordize-keys false) 200)))))

(defn handle-page-html [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page-uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page-uuid))
      (bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns (str graph-uuid ":" page-uuid))
                 do-stub (.get do-ns do-id)
                 meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page-uuid))]
                (if-not (.-ok meta-resp)
                  (not-found)
                  (js-await [meta (.json meta-resp)
                             r2 (aget env "PUBLISH_R2")
                             object (.get r2 (aget meta "r2_key"))]
                            (if-not object
                              (json-response {:error "missing transit blob"} 404)
                              (js-await [buffer (.arrayBuffer object)
                                         transit (.decode text-decoder buffer)
                                         html (render-page-html transit page-uuid)]
                                        (js/Response.
                                         html
                                         #js {:headers (merge-headers
                                                        #js {"content-type" "text/html; charset=utf-8"}
                                                        (cors-headers))})))))))))

(defn handle-fetch [request env]
  (let [url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (cond
      (= method "OPTIONS")
      (js/Response. nil #js {:status 204 :headers (cors-headers)})

      (and (string/starts-with? path "/p/") (= method "GET"))
      (handle-page-html request env)

      (and (= path "/pages") (= method "POST"))
      (handle-post-pages request env)

      (and (= path "/pages") (= method "GET"))
      (handle-list-pages env)

      (and (string/starts-with? path "/pages/") (= method "GET"))
      (let [parts (string/split path #"/")]
        (if (= (nth parts 4 nil) "transit")
          (handle-get-page-transit request env)
          (handle-get-page request env)))

      :else
      (not-found))))

(def worker
  #js {:fetch (fn [request env _ctx]
                (handle-fetch request env))})

(defn init-schema! [sql]
  (let [cols (get-sql-rows (sql-exec sql "PRAGMA table_info(pages);"))
        drop? (some #(contains? #{"page_id" "graph"} (aget % "name")) cols)]
    (when drop?
      (sql-exec sql "DROP TABLE IF EXISTS pages;"))
    (sql-exec sql
              (str "CREATE TABLE IF NOT EXISTS pages ("
                   "page_uuid TEXT NOT NULL,"
                   "graph_uuid TEXT NOT NULL,"
                   "schema_version TEXT,"
                   "block_count INTEGER,"
                   "content_hash TEXT NOT NULL,"
                   "content_length INTEGER,"
                   "r2_key TEXT NOT NULL,"
                   "owner_sub TEXT,"
                   "created_at INTEGER,"
                   "updated_at INTEGER,"
                   "PRIMARY KEY (graph_uuid, page_uuid)"
                   ");"))))

(defn row->meta [row]
  (let [data (js->clj row :keywordize-keys false)]
    (assoc data
           "publish/graph" (get data "graph_uuid")
           "publish/content-hash" (get data "content_hash")
           "publish/content-length" (get data "content_length"))))

(defn do-fetch [^js self request]
  (let [sql (.-sql self)]
    (init-schema! sql)
    (cond
      (= "POST" (.-method request))
      (js-await [body (.json request)]
                (sql-exec sql
                          (str "INSERT INTO pages ("
                               "page_uuid,"
                               "graph_uuid,"
                               "schema_version,"
                               "block_count,"
                               "content_hash,"
                               "content_length,"
                               "r2_key,"
                               "owner_sub,"
                               "created_at,"
                               "updated_at"
                               ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                               " ON CONFLICT(graph_uuid, page_uuid) DO UPDATE SET"
                               " page_uuid=excluded.page_uuid,"
                               " schema_version=excluded.schema_version,"
                               " block_count=excluded.block_count,"
                               " content_hash=excluded.content_hash,"
                               " content_length=excluded.content_length,"
                               " r2_key=excluded.r2_key,"
                               " owner_sub=excluded.owner_sub,"
                               " updated_at=excluded.updated_at;")
                          (aget body "page-uuid")
                          (aget body "publish/graph")
                          (aget body "schema-version")
                          (aget body "block-count")
                          (aget body "publish/content-hash")
                          (aget body "publish/content-length")
                          (aget body "r2_key")
                          (aget body "owner_sub")
                          (aget body "publish/created-at")
                          (aget body "updated_at"))
                (json-response {:ok true}))

      (= "GET" (.-method request))
      (let [url (js/URL. (.-url request))
            parts (string/split (.-pathname url) #"/")
            graph-uuid (nth parts 2 nil)
            page-uuid (nth parts 3 nil)]
        (if (and graph-uuid page-uuid)
          (let [rows (get-sql-rows
                      (sql-exec sql
                                (str "SELECT page_uuid, graph_uuid, schema_version, block_count, "
                                     "content_hash, content_length, r2_key, owner_sub, created_at, updated_at "
                                     "FROM pages WHERE graph_uuid = ? AND page_uuid = ? LIMIT 1;")
                                graph-uuid
                                page-uuid))
                row (first rows)]
            (if-not row
              (not-found)
              (json-response (row->meta row))))
          (let [rows (get-sql-rows
                      (sql-exec sql
                                (str "SELECT page_uuid, graph_uuid, schema_version, block_count, "
                                     "content_hash, content_length, r2_key, owner_sub, created_at, updated_at "
                                     "FROM pages ORDER BY updated_at DESC;")))]
            (json-response {:pages (map row->meta rows)}))))

      :else
      (json-response {:error "method not allowed"} 405))))

(defclass PublishMetaDO
  (extends DurableObject)

  (constructor [this ^js state env]
               (super state env)
               (set! (.-state this) state)
               (set! (.-env this) env)
               (set! (.-sql this) (.-sql ^js (.-storage state))))

  Object
  (fetch [this request]
         (do-fetch this request)))
