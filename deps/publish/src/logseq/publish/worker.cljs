(ns logseq.publish.worker
  (:require ["cloudflare:workers" :refer [DurableObject]]
            [clojure.string :as string]
            [cognitect.transit :as transit]
            [datascript.transit :as dt]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [shadow.cljs.modern :refer (defclass)]
            [shadow.resource :as resource])
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
       "access-control-allow-methods" "GET,POST,OPTIONS"
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

(def publish-css (resource/inline "logseq/publish/publish.css"))
(def publish-js (resource/inline "logseq/publish/publish.js"))

(defn unauthorized []
  (json-response {:error "unauthorized"} 401))

(defn bad-request [message]
  (json-response {:error message} 400))

(defn not-found []
  (json-response {:error "not found"} 404))

(defn asset-content-type [ext]
  (case (string/lower-case (or ext ""))
    ("png") "image/png"
    ("jpg" "jpeg") "image/jpeg"
    ("gif") "image/gif"
    ("webp") "image/webp"
    ("svg") "image/svg+xml"
    ("bmp") "image/bmp"
    ("avif") "image/avif"
    ("mp4") "video/mp4"
    ("webm") "video/webm"
    ("mov") "video/quicktime"
    ("mp3") "audio/mpeg"
    ("wav") "audio/wav"
    ("ogg") "audio/ogg"
    ("pdf") "application/pdf"
    "application/octet-stream"))

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
         (update acc e (fn [entity]
                         (merge-attr (or entity {:db/id e}) a v)))
         acc)))
   {}
   datoms))

(defn escape-html [content]
  (string/escape (or content "")
                 {"&" "&amp;"
                  "<" "&lt;"
                  ">" "&gt;"}))

(defn entity->title
  [entity]
  (or (:block/title entity)
      (:block/name entity)
      (str (:logseq.property/value entity))
      "Untitled"))

(defn page-entity?
  [entity]
  (and (nil? (:block/page entity))
       (or (:block/name entity)
           (:block/title entity))))

(defn property-title
  [prop-key property-title-by-ident]
  (cond
    (string? prop-key) prop-key
    (keyword? prop-key) (or (get property-title-by-ident prop-key)
                            (name prop-key))
    :else (str prop-key)))

(defn property-value-empty?
  [value]
  (cond
    (nil? value) true
    (string? value) (string/blank? value)
    (coll? value) (empty? value)
    :else false))

(defn format-datetime
  [value]
  (let [date (cond
               (instance? js/Date value) value
               (number? value) (js/Date. value)
               (string? value) (js/Date. value)
               :else nil)]
    (when date
      (-> (.toISOString date)
          (string/replace "T" " ")
          (string/replace "Z" "")))))

(defn nodes-join
  [nodes-list sep]
  (reduce (fn [acc nodes]
            (if (empty? nodes)
              acc
              (if (seq acc)
                (into (conj acc sep) nodes)
                (into [] nodes))))
          []
          nodes-list))

(defn property-type
  [prop-key property-type-by-ident]
  (or (get property-type-by-ident prop-key)
      (get-in db-property/built-in-properties [prop-key :schema :type])))

(defn entity->link-node
  [entity ctx]
  (let [title (entity->title entity)
        uuid (:block/uuid entity)
        graph-uuid (:graph-uuid ctx)]
    (if (and uuid graph-uuid (page-entity? entity))
      [[:a.page-ref {:href (str "/page/" graph-uuid "/" uuid)} title]]
      [title])))

(declare content->nodes)
(defn property-value->nodes
  [value prop-key ctx entities]
  (let [prop-type (property-type prop-key (:property-type-by-ident ctx))
        ref-type? (contains? db-property-type/all-ref-property-types prop-type)]
    (cond
      (nil? value)
      []

      (string? value)
      (if (= prop-type :datetime)
        (if-let [formatted (format-datetime value)]
          [formatted]
          (content->nodes value (:uuid->title ctx) (:graph-uuid ctx)))
        (content->nodes value (:uuid->title ctx) (:graph-uuid ctx)))

      (keyword? value)
      [(name value)]

      (map? value)
      (if-let [eid (:db/id value)]
        (property-value->nodes eid prop-key ctx entities)
        (if-let [content (db-property/property-value-content value)]
          (property-value->nodes content prop-key ctx entities)
          [(pr-str value)]))

      (or (set? value) (sequential? value))
      (nodes-join (map #(property-value->nodes % prop-key ctx entities) value) ", ")

      (number? value)
      (cond
        (= prop-type :datetime)
        (if-let [formatted (format-datetime value)]
          [formatted]
          [(str value)])

        (and ref-type? (get entities value))
        (entity->link-node (get entities value) ctx)

        :else
        [(str value)])

      :else
      [(str value)])))

(defn built-in-tag?
  [entity]
  (when-let [ident (:db/ident entity)]
    (= "logseq.class" (namespace ident))))

(defn filter-tags
  [values entities]
  (let [values (if (sequential? values) values [values])]
    (->> values
         (remove (fn [value]
                   (cond
                     (keyword? value) (= "logseq.class" (namespace value))
                     :else
                     (let [entity (cond
                                    (map? value) value
                                    (number? value) (get entities value)
                                    :else nil)]
                       (and entity (built-in-tag? entity))))))
         vec)))

(defn entity-properties
  [entity ctx entities]
  (let [props (db-property/properties entity)
        inline-props (:block/properties entity)
        props (if (map? inline-props)
                (merge props inline-props)
                props)
        props (->> props
                   (remove (fn [[k _]]
                             (true? (get (:property-hidden-by-ident ctx) k))))
                   (map (fn [[k v]]
                          (if (= k :block/tags)
                            [k (filter-tags v entities)]
                            [k v])))
                   (remove (fn [[_ v]] (property-value-empty? v)))
                   (remove (fn [[k v]]
                             (and (= k :block/tags) (property-value-empty? v)))))
        props (into {} props)]
    props))

(defn render-properties
  [props ctx entities]
  (when (seq props)
    [:dl.properties
     (for [[k v] (sort-by (fn [[prop-key _]]
                            (string/lower-case
                             (property-title prop-key (:property-title-by-ident ctx))))
                          props)]
       [:div.property
        [:dt.property-name (property-title k (:property-title-by-ident ctx))]
        [:dd.property-value
         (into [:span] (property-value->nodes v k ctx entities))]])]))

(def ref-regex
  (js/RegExp. "\\[\\[([0-9a-fA-F-]{36})\\]\\]|\\(\\(([0-9a-fA-F-]{36})\\)\\)" "g"))

(defonce inline-config
  (gp-mldoc/default-config :markdown))

(defn inline-ast [text]
  (gp-mldoc/inline->edn text inline-config))

(defn content->nodes [content uuid->title graph-uuid]
  (let [s (or content "")
        re ref-regex]
    (set! (.-lastIndex re) 0)
    (loop [idx 0 out []]
      (let [m (.exec re s)]
        (if (nil? m)
          (cond-> out
            (< idx (count s)) (conj (subs s idx)))
          (let [start (.-index m)
                end (.-lastIndex re)
                uuid (or (aget m 1) (aget m 2))
                title (get uuid->title uuid uuid)
                href (when graph-uuid
                       (str "/page/" graph-uuid "/" uuid))
                node (if href
                       [:a.page-ref {:href href} title]
                       title)
                out (cond-> out
                      (< idx start) (conj (subs s idx start))
                      true (conj node))]
            (recur end out)))))))

(defn page-ref->uuid [name name->uuid]
  (or (get name->uuid name)
      (get name->uuid (common-util/page-name-sanity-lc name))))

(declare inline->nodes-seq)
(defn inline->nodes [ctx item]
  (let [[type data] item
        {:keys [uuid->title name->uuid graph-uuid]} ctx]
    (cond
      (or (= "Plain" type) (= "Spaces" type))
      (content->nodes data uuid->title graph-uuid)

      (= "Break_Line" type)
      [[:br]]

      (= "Emphasis" type)
      (let [[[kind] items] data
            tag (case kind
                  "Bold" :strong
                  "Italic" :em
                  "Underline" :ins
                  "Strike_through" :del
                  "Highlight" :mark
                  :span)
            children (mapcat #(inline->nodes ctx %) items)]
        [(into [tag] children)])

      (or (= "Verbatim" type) (= "Code" type))
      [[:code data]]

      (= "Link" type)
      (let [url (:url data)
            label (:label data)
            [link-type link-value] url
            label-nodes (cond
                          (vector? label) (inline->nodes-seq ctx label)
                          (seq? label) (inline->nodes-seq ctx label)
                          (string? label) (content->nodes label uuid->title graph-uuid)
                          :else [])
            page-uuid (when (= "Page_ref" link-type)
                        (or (page-ref->uuid link-value name->uuid)
                            (when (common-util/uuid-string? link-value) link-value)))
            page-title (when page-uuid
                         (get uuid->title page-uuid))
            label-nodes (cond
                          (seq label-nodes) label-nodes
                          page-title [page-title]
                          (string? link-value) [link-value]
                          :else [""])
            href (cond
                   page-uuid (str "/page/" graph-uuid "/" page-uuid)
                   (string? link-value) link-value
                   :else nil)]
        (if href
          [(into [:a.page-ref {:href href}] label-nodes)]
          label-nodes))

      (= "Tag" type)
      (let [s (or (second data) "")
            page-uuid (page-ref->uuid s name->uuid)]
        (if page-uuid
          [[:a.page-ref {:href (str "/page/" graph-uuid "/" page-uuid)} (str "#" s)]]
          [(str "#" s)]))

      :else
      (content->nodes (str data) uuid->title graph-uuid))))

(defn inline->nodes-seq [ctx items]
  (mapcat #(inline->nodes ctx %) items))

(defn block-content-nodes [block ctx]
  (let [raw (or (:block/content block)
                (:block/title block)
                (:block/name block)
                "")
        format :markdown
        ctx (assoc ctx :format format)
        ast (inline-ast raw)
        content (if (seq ast)
                  (inline->nodes-seq ctx ast)
                  (content->nodes raw (:uuid->title ctx) (:graph-uuid ctx)))]
    (into [:span.block-text] content)))

(defn block-raw-content [block]
  (or (:block/content block)
      (:block/title block)
      (:block/name block)
      ""))

(defn- asset-url [block ctx]
  (let [asset-type (:logseq.property.asset/type block)
        asset-uuid (:block/uuid block)
        external-url (:logseq.property.asset/external-url block)
        graph-uuid (:graph-uuid ctx)]
    (cond
      (string? external-url) external-url
      (and asset-uuid asset-type graph-uuid)
      (str "/asset/" graph-uuid "/" asset-uuid "." asset-type)
      :else nil)))

(defn- asset-node [block ctx]
  (let [asset-type (:logseq.property.asset/type block)
        asset-url (asset-url block ctx)
        title (or (:block/title block) (str asset-type))
        ext (string/lower-case (or asset-type ""))]
    (when asset-url
      (cond
        (contains? #{"png" "jpg" "jpeg" "gif" "webp" "svg" "bmp" "avif"} ext)
        [:img.asset-image {:src asset-url :alt title}]

        (contains? #{"mp4" "webm" "mov"} ext)
        [:video.asset-video {:src asset-url :controls true}]

        (contains? #{"mp3" "wav" "ogg"} ext)
        [:audio.asset-audio {:src asset-url :controls true}]

        :else
        [:a.asset-link {:href asset-url :target "_blank"} title]))))

(defn block-display-node [block ctx]
  (let [display-type (:logseq.property.node/display-type block)
        asset-node (when (:logseq.property.asset/type block)
                     (asset-node block ctx))]
    (case display-type
      :asset asset-node
      :code
      (let [lang (:logseq.property.code/lang block)
            attrs (cond-> {:class "code-block"}
                    (string? lang) (assoc :data-lang lang))]
        [:div attrs [:code (block-raw-content block)]])

      :math
      [:div.math-block (block-raw-content block)]

      :quote
      [:blockquote.quote-block (block-content-nodes block ctx)]

      (or asset-node
          (block-content-nodes block ctx)))))

(defn block-content-from-ref [ref ctx]
  (let [raw (or (get ref "source_block_content") "")
        ast (inline-ast raw)
        content (if (seq ast)
                  (inline->nodes-seq ctx ast)
                  (content->nodes raw (:uuid->title ctx) (:graph-uuid ctx)))]
    (into [:span.block-text] content)))

(defn ref-eid [value]
  (cond
    (number? value) value
    (map? value) (:db/id value)
    :else nil))

(defn refs-contain? [refs target-eid]
  (when refs
    (some #(= target-eid (ref-eid %))
          (if (sequential? refs) refs [refs]))))

(defn page-refs-from-payload [payload page-eid page-uuid page-title graph-uuid]
  (let [entities (datoms->entities (:datoms payload))
        refs (->> entities
                  (mapcat (fn [[_e entity]]
                            (when (and (= (:block/page entity) page-eid)
                                       (not= (:block/uuid entity) page-uuid))
                              (let [block-uuid (some-> (:block/uuid entity) str)
                                    block-content (or (:block/content entity)
                                                      (:block/title entity)
                                                      (:block/name entity)
                                                      "")
                                    block-format (name (or (:block/format entity) :markdown))
                                    refs (:block/refs entity)
                                    refs (if (sequential? refs) refs (when refs [refs]))
                                    targets (->> refs
                                                 (map ref-eid)
                                                 (keep #(get entities %))
                                                 distinct)]
                                (when (seq targets)
                                  (map (fn [target-entity]
                                         (let [target-uuid (some-> (:block/uuid target-entity) str)
                                               target-title (entity->title target-entity)
                                               target-name (or (:block/name target-entity)
                                                               target-title)
                                               target-name (when target-name
                                                             (string/lower-case (str target-name)))]
                                           {:graph_uuid graph-uuid
                                            :target_page_uuid target-uuid
                                            :target_page_title target-title
                                            :target_page_name target-name
                                            :source_page_uuid (str page-uuid)
                                            :source_page_title page-title
                                            :source_block_uuid block-uuid
                                            :source_block_content block-content
                                            :source_block_format block-format
                                            :updated_at (.now js/Date)}))
                                       targets)))))))]
    (vec refs)))

(defn page-tagged-nodes-from-payload [payload page-eid page-uuid page-title graph-uuid]
  (let [entities (datoms->entities (:datoms payload))
        normalize-tags (fn [tags]
                         (let [tags (if (sequential? tags) tags (when tags [tags]))]
                           (->> tags
                                (map ref-eid)
                                (keep #(get entities %))
                                (keep (fn [entity]
                                        (when-let [uuid (:block/uuid entity)]
                                          {:tag_page_uuid (str uuid)
                                           :tag_title (entity->title entity)})))
                                distinct)))
        page-entity (get entities page-eid)
        page-tags (normalize-tags (:block/tags page-entity))
        page-entries (when (seq page-tags)
                       (map (fn [tag]
                              {:graph_uuid graph-uuid
                               :tag_page_uuid (:tag_page_uuid tag)
                               :tag_title (:tag_title tag)
                               :source_page_uuid (str page-uuid)
                               :source_page_title page-title
                               :source_block_uuid (str page-uuid)
                               :source_block_content nil
                               :source_block_format "page"
                               :updated_at (.now js/Date)})
                            page-tags))
        block-entries (mapcat (fn [[_e entity]]
                                (when (and (= (:block/page entity) page-eid)
                                           (not= (:block/uuid entity) page-uuid)
                                           (not (:logseq.property/created-from-property entity)))
                                  (let [block-uuid (some-> (:block/uuid entity) str)
                                        block-content (or (:block/content entity)
                                                          (:block/title entity)
                                                          (:block/name entity)
                                                          "")
                                        block-format (name (or (:block/format entity) :markdown))
                                        tags (normalize-tags (:block/tags entity))]
                                    (when (seq tags)
                                      (map (fn [tag]
                                             {:graph_uuid graph-uuid
                                              :tag_page_uuid (:tag_page_uuid tag)
                                              :tag_title (:tag_title tag)
                                              :source_page_uuid (str page-uuid)
                                              :source_page_title page-title
                                              :source_block_uuid block-uuid
                                              :source_block_content block-content
                                              :source_block_format block-format
                                              :updated_at (.now js/Date)})
                                           tags)))))
                              entities)]
    (vec (distinct (concat page-entries block-entries)))))

(def ^:private void-tags
  #{"area" "base" "br" "col" "embed" "hr" "img" "input" "link" "meta" "param" "source" "track" "wbr"})

(defn render-hiccup [node]
  (cond
    (nil? node) ""
    (string? node) (escape-html node)
    (number? node) (escape-html (str node))
    (vector? node)
    (let [raw-tag (name (first node))
          tag-parts (string/split raw-tag #"\.")
          tag (first tag-parts)
          tag-class (when (> (count tag-parts) 1)
                      (string/join " " (rest tag-parts)))
          [attrs children] (if (map? (second node))
                             [(second node) (nnext node)]
                             [nil (next node)])
          attrs (cond-> attrs
                  tag-class (assoc :class
                                   (if-let [existing (:class attrs)]
                                     (str existing " " tag-class)
                                     tag-class)))
          attrs-str (when attrs
                      (apply str
                             (map (fn [[k v]]
                                    (str " " (name k) "=\"" (escape-html (str v)) "\""))
                                  attrs)))]
      (if (contains? void-tags tag)
        (str "<" tag (or attrs-str "") ">")
        (str "<" tag (or attrs-str "") ">"
             (if (#{"style" "script"} tag)
               (apply str (map #(if (string? %) % (render-hiccup %)) children))
               (apply str (map render-hiccup children)))
             "</" tag ">")))
    (seq? node) (apply str (map render-hiccup node))
    :else (escape-html (str node))))

(defn sort-blocks [blocks]
  (sort-by (fn [block]
             (or (:block/order block) (:block/uuid block) ""))
           blocks))

(defn render-block-tree [children-by-parent parent-id ctx]
  (let [children (get children-by-parent parent-id)]
    (when (seq children)
      [:ul.blocks
       (map (fn [block]
              (let [child-id (:db/id block)
                    nested (render-block-tree children-by-parent child-id ctx)
                    has-children? (boolean nested)
                    properties (render-properties (entity-properties block ctx (:entities ctx))
                                                  ctx
                                                  (:entities ctx))]
                [:li.block
                 [:div.block-content
                  (block-display-node block ctx)
                  (when has-children?
                    [:button.block-toggle
                     {:type "button" :aria-expanded "true"}
                     "▾"])]
                 (when properties
                   [:div.block-properties properties])
                 (when nested
                   [:div.block-children nested])]))
            (sort-blocks children))])))

(defn linked-references
  [ctx graph-uuid linked-by-page]
  [:section.linked-refs
   [:h2 "Linked references"]
   (for [{:keys [page_uuid page_title blocks]} linked-by-page]
     (let [ref-page-uuid page_uuid
           ref-page-title page_title
           href (when (and graph-uuid ref-page-uuid)
                  (str "/page/" graph-uuid "/" ref-page-uuid))]
       [:div.ref-page
        (if href
          [:a.page-ref {:href href} ref-page-title]
          [:div.ref-title ref-page-title])
        (when (seq blocks)
          [:ul.ref-blocks
           (for [block blocks]
             [:li.ref-block [:div.block-content (block-content-from-ref block ctx)]])])]))])

(defn tag-item-val [item k]
  (cond
    (map? item) (or (get item k)
                    (get item (name k)))
    (object? item) (or (aget item (name k))
                       (aget item k))
    :else nil))

(defn format-timestamp
  [ts]
  (when (number? ts)
    (.toLocaleString (js/Date. ts))))

(defn render-tagged-item
  [graph-uuid item]
  (let [item-graph-uuid (tag-item-val item :graph_uuid)
        graph-uuid (or item-graph-uuid graph-uuid)
        source-page-uuid (tag-item-val item :source_page_uuid)
        source-page-title (tag-item-val item :source_page_title)
        source-block-uuid (tag-item-val item :source_block_uuid)
        source-block-content (tag-item-val item :source_block_content)
        updated-at (tag-item-val item :updated_at)
        page? (and source-page-uuid (= source-page-uuid source-block-uuid))
        href (when (and graph-uuid source-page-uuid)
               (str "/page/" graph-uuid "/" source-page-uuid))]
    [:li.tagged-item
     [:div.tagged-main
      (if href
        [:a.page-ref {:href href} (or source-page-title source-page-uuid)]
        [:span (or source-page-title source-page-uuid)])
      (when (and source-block-content (not page?))
        [:div.tagged-block source-block-content])
      [:div.tagged-sub
       (if page?
         (str "Page: " source-page-uuid)
         (str "Block: " source-block-uuid))]]
     [:span.tagged-meta (or (format-timestamp updated-at) "—")]]))

(defn render-page-html
  [transit page_uuid-str refs-data tagged-nodes]
  (let [payload (read-transit-safe transit)
        meta (get-publish-meta payload)
        graph-uuid (when meta
                     (or (:graph meta)
                         (:publish/graph meta)
                         (get meta "graph")
                         (get meta "publish/graph")))
        datoms (:datoms payload)
        entities (datoms->entities datoms)
        page_uuid (uuid page_uuid-str)
        page-entity (some (fn [[_e entity]]
                            (when (= (:block/uuid entity) page_uuid)
                              entity))
                          entities)
        page-title (entity->title page-entity)
        page-eid (some (fn [[e entity]]
                         (when (= (:block/uuid entity) page_uuid)
                           e))
                       entities)
        uuid->title (reduce (fn [acc [_e entity]]
                              (if-let [uuid-value (:block/uuid entity)]
                                (assoc acc (str uuid-value) (entity->title entity))
                                acc))
                            {}
                            entities)
        name->uuid (reduce (fn [acc [_e entity]]
                             (if-let [uuid-value (:block/uuid entity)]
                               (let [uuid-str (str uuid-value)
                                     title (:block/title entity)]
                                 (assoc acc title uuid-str))
                               acc))
                           {}
                           entities)
        property-title-by-ident (reduce (fn [acc [_e entity]]
                                          (if-let [ident (:db/ident entity)]
                                            (assoc acc ident (entity->title entity))
                                            acc))
                                        {}
                                        entities)
        property-type-by-ident (reduce (fn [acc [_e entity]]
                                         (if-let [ident (:db/ident entity)]
                                           (assoc acc ident (:logseq.property/type entity))
                                           acc))
                                       {}
                                       entities)
        property-hidden-by-ident (reduce (fn [acc [_e entity]]
                                           (if-let [ident (:db/ident entity)]
                                             (assoc acc ident (true? (:logseq.property/hide? entity)))
                                             acc))
                                         {}
                                         entities)
        children-by-parent (->> entities
                                (reduce (fn [acc [e entity]]
                                          (if (and (= (:block/page entity) page-eid)
                                                   (not= e page-eid)
                                                   (not (:logseq.property/created-from-property entity)))
                                            (let [parent (or (:block/parent entity) page-eid)]
                                              (update acc parent (fnil conj []) entity))
                                            acc))
                                        {})
                                (reduce-kv (fn [acc k v]
                                             (assoc acc k (sort-blocks v)))
                                           {}))
        ctx {:uuid->title uuid->title
             :name->uuid name->uuid
             :graph-uuid graph-uuid
             :property-title-by-ident property-title-by-ident
             :property-type-by-ident property-type-by-ident
             :property-hidden-by-ident property-hidden-by-ident
             :entities entities}
        page-properties (render-properties (entity-properties page-entity ctx entities)
                                           ctx
                                           entities)
        blocks (render-block-tree children-by-parent page-eid ctx)
        linked-by-page (when refs-data
                         (->> (get refs-data "refs")
                              (group-by #(get % "source_page_uuid"))
                              (map (fn [[_ items]]
                                     {:page_title (get (first items) "source_page_title")
                                      :page_uuid (get (first items) "source_page_uuid")
                                      :blocks items}))
                              (sort-by (fn [{:keys [page_title]}]
                                         (string/lower-case (or page_title ""))))))
        linked-refs (when (seq linked-by-page)
                      (linked-references ctx graph-uuid linked-by-page))
        tagged-section (when (seq tagged-nodes)
                         [:section.tagged-pages
                          [:h2 "Tagged nodes"]
                          [:ul.tagged-list
                           (for [item tagged-nodes]
                             (render-tagged-item graph-uuid item))]])
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title page-title]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:div.page-toolbar
                (when graph-uuid
                  [:a.toolbar-btn {:href (str "/graph/" graph-uuid)} "Home"])
                [:button.toolbar-btn
                 {:type "button"
                  :onclick "window.toggleTopBlocks(this)"}
                 "Collapse all"]]

               [:h1 page-title]

               (when page-properties
                 [:section.page-properties page-properties])

               (when blocks blocks)
               (when tagged-section tagged-section)
               (when linked-refs linked-refs)]
              [:script {:type "module" :src "/static/publish.js"}]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-graph-html
  [graph-uuid pages]
  (let [rows (->> pages
                  (map (fn [page]
                         (let [page-uuid (aget page "page_uuid")
                               page-title (aget page "page_title")
                               updated-at (aget page "updated_at")
                               href (str "/page/" graph-uuid "/" page-uuid)
                               short-id (aget page "short_id")]
                           {:page-uuid page-uuid
                            :page-title page-title
                            :href href
                            :short-id short-id
                            :updated-at updated-at})))
                  (sort-by (fn [row]
                             (or (:updated-at row) 0)))
                  reverse)
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title (str "Published pages - " graph-uuid)]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:h1 "Published pages"]
               (if (seq rows)
                 [:ul.page-list
                  (for [{:keys [page-uuid page-title href updated-at short-id]} rows]
                    [:li.page-item
                     [:div.page-links
                      [:a.page-link {:href href} (or page-title page-uuid)]
                      (when short-id
                        [:a.short-link {:href (str "/s/" short-id)}
                         (str "/s/" short-id)])]
                     [:span.page-meta (or (format-timestamp updated-at) "—")]])]
                 [:p "No pages have been published yet."])]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-tag-html
  [graph-uuid tag-uuid tag-title tag-items]
  (let [rows tag-items
        title (or tag-title tag-uuid)
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title (str "Tag - " title)]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:h1 title]
               [:p.tag-sub (str "Tag: " tag-uuid)]
               [:p.graph-meta (str "Graph: " graph-uuid)]
               (if (seq rows)
                 [:ul.page-list
                  (for [item rows]
                    (render-tagged-item graph-uuid item))]
                 [:p "No published nodes use this tag yet."])]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-tag-name-html
  [tag-name tag-title tag-items]
  (let [rows tag-items
        title (or tag-title tag-name)
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title (str "Tag - " title)]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:h1 title]
               [:p.tag-sub (str "Tag: " tag-name)]
               (if (seq rows)
                 [:ul.page-list
                  (for [row rows
                        :let [graph-id (tag-item-val row :graph_uuid)
                              page-uuid (tag-item-val row :source_page_uuid)
                              page-title (tag-item-val row :source_page_title)
                              short-id (tag-item-val row :short_id)
                              href (when (and graph-id page-uuid)
                                     (str "/page/" graph-id "/" page-uuid))]]
                    [:li.page-item
                     [:div.page-links
                      (if href
                        [:a.page-ref {:href href} (or page-title page-uuid)]
                        [:span (or page-title page-uuid)])
                      (when short-id
                        [:a.short-link {:href (str "/s/" short-id)}
                         (str "/s/" short-id)])]
                     [:span.page-meta (or (format-timestamp (tag-item-val row :updated_at)) "—")]])]
                 [:p "No published pages use this tag yet."])]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(defn render-ref-html
  [graph-uuid ref-name ref-title ref-items]
  (let [rows ref-items
        title (or ref-title ref-name)
        doc [:html
             [:head
              [:meta {:charset "utf-8"}]
              [:meta {:name "viewport" :content "width=device-width,initial-scale=1"}]
              [:title (str "Ref - " title)]
              [:link {:rel "stylesheet" :href "/static/publish.css"}]]
             [:body
              [:main.wrap
               [:h1 title]
               [:p.tag-sub (str "Reference: " ref-name)]
               (if (seq rows)
                 [:ul.page-list
                  (for [row rows
                        :let [graph-id (or (tag-item-val row :graph_uuid) graph-uuid)
                              page-uuid (tag-item-val row :source_page_uuid)
                              page-title (tag-item-val row :source_page_title)
                              short-id (tag-item-val row :short_id)
                              href (when (and graph-id page-uuid)
                                     (str "/page/" graph-id "/" page-uuid))]]
                    [:li.page-item
                     [:div.page-links
                      (if href
                        [:a.page-ref {:href href} (or page-title page-uuid)]
                        [:span (or page-title page-uuid)])
                      (when short-id
                        [:a.short-link {:href (str "/s/" short-id)}
                         (str "/s/" short-id)])]
                     [:span.page-meta (or (format-timestamp (tag-item-val row :updated_at)) "—")]])]
                 [:p "No published pages reference this yet."])]]]]
    (str "<!doctype html>" (render-hiccup doc))))

(declare short-id-for-page)
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
                          (let [{:keys [content_hash content_length graph page_uuid schema_version block_count created_at] :as meta}
                                (or (parse-meta-header request)
                                    (meta-from-body body))
                                payload (read-transit-safe (.decode text-decoder body))
                                payload-entities (datoms->entities (:datoms payload))
                                page-eid (some (fn [[e entity]]
                                                 (when (= (:block/uuid entity) (uuid page_uuid))
                                                   e))
                                               payload-entities)
                                page-title (or (:page-title payload)
                                               (get payload "page-title")
                                               (when page-eid
                                                 (entity->title (get payload-entities page-eid))))
                                refs (when (and page-eid page-title)
                                       (page-refs-from-payload payload page-eid page_uuid page-title graph))
                                tagged-nodes (when (and page-eid page-title)
                                               (page-tagged-nodes-from-payload payload page-eid page_uuid page-title graph))]
                            (cond
                              (not (valid-meta? meta))
                              (bad-request "missing publish metadata")

                              :else
                              (js-await [graph-uuid graph
                                         r2-key (str "publish/" graph-uuid "/"
                                                     content_hash ".transit")
                                         r2 (aget env "PUBLISH_R2")
                                         existing (.head r2 r2-key)
                                         _ (when-not existing
                                             (.put r2 r2-key body
                                                   #js {:httpMetadata #js {:contentType "application/transit+json"}}))
                                         ^js do-ns (aget env "PUBLISH_META_DO")
                                         do-id (.idFromName do-ns
                                                            (str graph-uuid
                                                                 ":"
                                                                 page_uuid))
                                         do-stub (.get do-ns do-id)
                                         page-tags (or (:page-tags payload)
                                                       (get payload "page-tags"))
                                         short-id (short-id-for-page graph-uuid page_uuid)
                                         payload (clj->js {:page_uuid page_uuid
                                                           :page_title page-title
                                                           :page_tags (when page-tags
                                                                        (js/JSON.stringify (clj->js page-tags)))
                                                           :graph graph-uuid
                                                           :schema_version schema_version
                                                           :block_count block_count
                                                           :content_hash content_hash
                                                           :content_length content_length
                                                           :r2_key r2-key
                                                           :owner_sub (aget claims "sub")
                                                           :created_at created_at
                                                           :updated_at (.now js/Date)
                                                           :short_id short-id
                                                           :refs refs
                                                           :tagged_nodes tagged-nodes})
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
                                                    (json-response {:page_uuid page_uuid
                                                                    :graph_uuid graph-uuid
                                                                    :r2_key r2-key
                                                                    :short_id short-id
                                                                    :short_url (str "/s/" short-id)
                                                                    :updated_at (.now js/Date)})))))))))))

(declare handle-tag-page-html)
(defn handle-get-page [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page_uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page_uuid))
      (bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns (str graph-uuid ":" page_uuid))
                 do-stub (.get do-ns do-id)
                 meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page_uuid))]
                (if-not (.-ok meta-resp)
                  (handle-tag-page-html graph-uuid page_uuid env)
                  (js-await [meta (.json meta-resp)
                             etag (aget meta "content_hash")
                             if-none-match (normalize-etag (.get (.-headers request) "if-none-match"))]
                            (if (and etag if-none-match (= etag if-none-match))
                              (js/Response. nil #js {:status 304
                                                     :headers (merge-headers
                                                               #js {:etag etag}
                                                               (cors-headers))})
                              (json-response (js->clj meta :keywordize-keys true) 200))))))))

(defn handle-get-page-transit [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page_uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page_uuid))
      (bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns (str graph-uuid ":" page_uuid))
                 do-stub (.get do-ns do-id)
                 meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page_uuid))]
                (if-not (.-ok meta-resp)
                  (not-found)
                  (js-await [meta (.json meta-resp)
                             r2-key (aget meta "r2_key")]
                            (if-not r2-key
                              (json-response {:error "missing transit"} 404)
                              (js-await [etag (aget meta "content_hash")
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

(defn handle-get-page-refs [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page_uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page_uuid))
      (bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns "index")
                 do-stub (.get do-ns do-id)
                 refs-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page_uuid "/refs"))]
                (if-not (.-ok refs-resp)
                  (not-found)
                  (js-await [refs (.json refs-resp)]
                            (json-response (js->clj refs :keywordize-keys true) 200)))))))

(defn handle-get-page-tagged-nodes [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page_uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page_uuid))
      (bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns "index")
                 do-stub (.get do-ns do-id)
                 tags-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page_uuid "/tagged_nodes"))]
                (if-not (.-ok tags-resp)
                  (not-found)
                  (js-await [tags (.json tags-resp)]
                            (json-response (js->clj tags :keywordize-keys true) 200)))))))

(defn handle-list-pages [env]
  (js-await [^js do-ns (aget env "PUBLISH_META_DO")
             do-id (.idFromName do-ns "index")
             do-stub (.get do-ns do-id)
             meta-resp (.fetch do-stub "https://publish/pages" #js {:method "GET"})]
            (if-not (.-ok meta-resp)
              (not-found)
              (js-await [meta (.json meta-resp)]
                        (json-response (js->clj meta :keywordize-keys true) 200)))))

(defn handle-list-graph-pages-by-uuid [graph-uuid env]
  (if-not graph-uuid
    (bad-request "missing graph uuid")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid)
                                 #js {:method "GET"})]
              (if-not (.-ok meta-resp)
                (not-found)
                (js-await [meta (.json meta-resp)]
                          (json-response (js->clj meta :keywordize-keys true) 200))))))

(defn handle-graph-html [graph-uuid env]
  (if-not graph-uuid
    (bad-request "missing graph uuid")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid)
                                 #js {:method "GET"})]
              (if-not (.-ok meta-resp)
                (not-found)
                (js-await [meta (.json meta-resp)
                           pages (or (aget meta "pages") #js [])]
                          (js/Response.
                           (render-graph-html graph-uuid pages)
                           #js {:headers (merge-headers
                                          #js {"content-type" "text/html; charset=utf-8"}
                                          (cors-headers))}))))))

(defn bytes->base64url [bytes]
  (let [binary (apply str (map #(js/String.fromCharCode %) (array-seq bytes)))
        b64 (js/btoa binary)]
    (-> b64
        (string/replace #"\+" "-")
        (string/replace #"/" "_")
        (string/replace #"=+$" ""))))

(defn short-id-for-page [graph-uuid page-uuid]
  (js-await [payload (.encode text-encoder (str graph-uuid ":" page-uuid))
             digest (.digest js/crypto.subtle "SHA-256" payload)]
            (let [bytes (js/Uint8Array. digest)
                  encoded (bytes->base64url bytes)]
              (subs encoded 0 10))))

(defn handle-tag-name-json [tag-name env]
  (if-not tag-name
    (bad-request "missing tag name")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               resp (.fetch do-stub (str "https://publish/tag/" (js/encodeURIComponent tag-name))
                            #js {:method "GET"})]
              (if-not (.-ok resp)
                (not-found)
                (js-await [data (.json resp)]
                          (json-response (js->clj data :keywordize-keys true) 200))))))

(defn handle-tag-name-html [tag-name env]
  (if-not tag-name
    (bad-request "missing tag name")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               resp (.fetch do-stub (str "https://publish/tag/" (js/encodeURIComponent tag-name))
                            #js {:method "GET"})]
              (if-not (.-ok resp)
                (not-found)
                (js-await [data (.json resp)
                           rows (or (aget data "pages") #js [])
                           title (or tag-name "Tag")]
                          (js/Response.
                           (render-tag-name-html tag-name title rows)
                           #js {:headers (merge-headers
                                          #js {"content-type" "text/html; charset=utf-8"}
                                          (cors-headers))}))))))

(defn handle-ref-name-json [ref-name env]
  (if-not ref-name
    (bad-request "missing ref name")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               resp (.fetch do-stub (str "https://publish/ref/" (js/encodeURIComponent ref-name))
                            #js {:method "GET"})]
              (if-not (.-ok resp)
                (not-found)
                (js-await [data (.json resp)]
                          (json-response (js->clj data :keywordize-keys true) 200))))))

(defn handle-ref-name-html [ref-name env]
  (if-not ref-name
    (bad-request "missing ref name")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               resp (.fetch do-stub (str "https://publish/ref/" (js/encodeURIComponent ref-name))
                            #js {:method "GET"})]
              (if-not (.-ok resp)
                (not-found)
                (js-await [data (.json resp)
                           rows (or (aget data "pages") #js [])
                           title (or ref-name "Reference")]
                          (js/Response.
                           (render-ref-html "all" ref-name title rows)
                           #js {:headers (merge-headers
                                          #js {"content-type" "text/html; charset=utf-8"}
                                          (cors-headers))}))))))

(defn parse-asset-meta-header [request]
  (let [meta-header (.get (.-headers request) "x-asset-meta")]
    (when meta-header
      (try
        (normalize-meta (js/JSON.parse meta-header))
        (catch :default _
          nil)))))

(defn handle-post-asset [request env]
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
                (let [meta (parse-asset-meta-header request)
                      graph-uuid (get meta :graph)
                      asset-uuid (get meta :asset_uuid)
                      asset-type (get meta :asset_type)
                      checksum (get meta :checksum)]
                  (if (or (nil? meta) (string/blank? graph-uuid) (string/blank? asset-uuid) (string/blank? asset-type))
                    (bad-request "missing asset metadata")
                    (js-await [body (.arrayBuffer request)
                               r2 (aget env "PUBLISH_R2")
                               r2-key (str "publish/assets/" graph-uuid "/" asset-uuid "." asset-type)
                               ^js existing (.head r2 r2-key)
                               existing-checksum (when existing
                                                   (when-let [meta (.-customMetadata existing)]
                                                     (aget meta "checksum")))
                               content-type (or (get meta :content_type)
                                                (asset-content-type asset-type))
                               put? (not (and existing-checksum checksum (= existing-checksum checksum)))
                               _ (when put?
                                   (.put r2 r2-key body
                                         #js {:httpMetadata #js {:contentType content-type}
                                              :customMetadata #js {:checksum (or checksum "")
                                                                   :owner_sub (aget claims "sub")}}))]
                              (json-response {:asset_uuid asset-uuid
                                              :graph_uuid graph-uuid
                                              :asset_type asset-type
                                              :asset_url (str "/asset/" graph-uuid "/" asset-uuid "." asset-type)}))))))))

(defn handle-tag-page-html [graph-uuid tag-uuid env]
  (if (or (nil? graph-uuid) (nil? tag-uuid))
    (bad-request "missing graph uuid or tag uuid")
    (js-await [^js do-ns (aget env "PUBLISH_META_DO")
               do-id (.idFromName do-ns "index")
               do-stub (.get do-ns do-id)
               tags-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" tag-uuid "/tagged_nodes")
                                 #js {:method "GET"})]
              (if-not (.-ok tags-resp)
                (not-found)
                (js-await [raw (.json tags-resp)
                           tag-items (js->clj (or (aget raw "tagged_nodes") #js [])
                                              :keywordize-keys true)
                           tag-title (or (some (fn [item]
                                                 (let [title (tag-item-val item :tag_title)]
                                                   (when (and title (not (string/blank? title)))
                                                     title)))
                                               tag-items)
                                         tag-uuid)]
                          (js/Response.
                           (render-tag-html graph-uuid tag-uuid tag-title tag-items)
                           #js {:headers (merge-headers
                                          #js {"content-type" "text/html; charset=utf-8"}
                                          (cors-headers))}))))))

(defn handle-list-graph-pages [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)]
    (handle-list-graph-pages-by-uuid graph-uuid env)))

(defn handle-delete-page [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page_uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page_uuid))
      (bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 page-id (.idFromName do-ns (str graph-uuid ":" page_uuid))
                 page-stub (.get do-ns page-id)
                 index-id (.idFromName do-ns "index")
                 index-stub (.get do-ns index-id)
                 page-resp (.fetch page-stub (str "https://publish/pages/" graph-uuid "/" page_uuid)
                                   #js {:method "DELETE"})
                 index-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid "/" page_uuid)
                                    #js {:method "DELETE"})]
                (if (or (not (.-ok page-resp)) (not (.-ok index-resp)))
                  (not-found)
                  (json-response {:ok true} 200))))))

(defn handle-delete-graph [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)]
    (if-not graph-uuid
      (bad-request "missing graph uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 index-id (.idFromName do-ns "index")
                 index-stub (.get do-ns index-id)
                 list-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid)
                                   #js {:method "GET"})]
                (if-not (.-ok list-resp)
                  (not-found)
                  (js-await [data (.json list-resp)
                             pages (or (aget data "pages") #js [])
                             _ (js/Promise.all
                                (map (fn [page]
                                       (let [page-uuid (aget page "page_uuid")
                                             page-id (.idFromName do-ns (str graph-uuid ":" page-uuid))
                                             page-stub (.get do-ns page-id)]
                                         (.fetch page-stub (str "https://publish/pages/" graph-uuid "/" page-uuid)
                                                 #js {:method "DELETE"})))
                                     pages))
                             del-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid)
                                              #js {:method "DELETE"})]
                            (if-not (.-ok del-resp)
                              (not-found)
                              (json-response {:ok true} 200))))))))

(defn handle-page-html [request env]
  (let [url (js/URL. (.-url request))
        parts (string/split (.-pathname url) #"/")
        graph-uuid (nth parts 2 nil)
        page_uuid (nth parts 3 nil)]
    (if (or (nil? graph-uuid) (nil? page_uuid))
      (bad-request "missing graph uuid or page uuid")
      (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                 do-id (.idFromName do-ns (str graph-uuid ":" page_uuid))
                 do-stub (.get do-ns do-id)
                 meta-resp (.fetch do-stub (str "https://publish/pages/" graph-uuid "/" page_uuid))]
                (if-not (.-ok meta-resp)
                  (js-await [index-id (.idFromName do-ns "index")
                             index-stub (.get do-ns index-id)
                             tags-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid "/" page_uuid "/tagged_nodes")
                                               #js {:method "GET"})]
                            (if (and tags-resp (.-ok tags-resp))
                              (js-await [raw (.json tags-resp)
                                         tag-items (js->clj (or (aget raw "tagged_nodes") #js [])
                                                            :keywordize-keys true)
                                         tag-title (or (some (fn [item]
                                                               (let [title (tag-item-val item :tag_title)]
                                                                 (when (and title (not (string/blank? title)))
                                                                   title)))
                                                             tag-items)
                                                       page_uuid)]
                                        (if (seq tag-items)
                                          (js/Response.
                                           (render-tag-html graph-uuid page_uuid tag-title tag-items)
                                           #js {:headers (merge-headers
                                                          #js {"content-type" "text/html; charset=utf-8"}
                                                          (cors-headers))})
                                          (not-found)))
                              (not-found)))
                  (js-await [meta (.json meta-resp)
                             index-id (.idFromName do-ns "index")
                             index-stub (.get do-ns index-id)
                             refs-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid "/" page_uuid "/refs"))
                             refs-json (when (and refs-resp (.-ok refs-resp))
                                         (js-await [raw (.json refs-resp)]
                                                   (js->clj raw :keywordize-keys false)))
                             tags-resp (.fetch index-stub (str "https://publish/pages/" graph-uuid "/" page_uuid "/tagged_nodes")
                                               #js {:method "GET"})
                             tagged-nodes (when (and tags-resp (.-ok tags-resp))
                                            (js-await [raw (.json tags-resp)]
                                                      (js->clj (or (aget raw "tagged_nodes") #js [])
                                                               :keywordize-keys true)))
                             r2 (aget env "PUBLISH_R2")
                             object (.get r2 (aget meta "r2_key"))]
                            (if-not object
                              (json-response {:error "missing transit blob"} 404)
                              (js-await [buffer (.arrayBuffer object)
                                         transit (.decode text-decoder buffer)]
                                        (js/Response.
                                         (render-page-html transit page_uuid refs-json tagged-nodes)
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

      (and (= path "/static/publish.css") (= method "GET"))
      (js/Response.
       publish-css
       #js {:headers (merge-headers
                      #js {"content-type" "text/css; charset=utf-8"
                           "cache-control" "public, max-age=31536000, immutable"}
                      (cors-headers))})

      (and (= path "/static/publish.js") (= method "GET"))
      (js/Response.
       publish-js
       #js {:headers (merge-headers
                      #js {"content-type" "text/javascript; charset=utf-8"
                           "cache-control" "public, max-age=31536000, immutable"}
                      (cors-headers))})

      (and (string/starts-with? path "/page/") (= method "GET"))
      (handle-page-html request env)

      (and (= path "/assets") (= method "POST"))
      (handle-post-asset request env)

      (and (= path "/pages") (= method "POST"))
      (handle-post-pages request env)

      (and (= path "/pages") (= method "GET"))
      (handle-list-pages env)

      (and (string/starts-with? path "/graph/") (= method "GET"))
      (let [parts (string/split path #"/")
            graph-uuid (nth parts 2 nil)]
        (if (= (nth parts 3 nil) "json")
          (handle-list-graph-pages-by-uuid graph-uuid env)
          (handle-graph-html graph-uuid env)))

      (and (string/starts-with? path "/tag/") (= method "GET"))
      (let [parts (string/split path #"/")
            raw-name (nth parts 2 nil)
            tag-name (when raw-name
                       (js/decodeURIComponent raw-name))]
        (if (= (nth parts 3 nil) "json")
          (handle-tag-name-json tag-name env)
          (handle-tag-name-html tag-name env)))

      (and (string/starts-with? path "/ref/") (= method "GET"))
      (let [parts (string/split path #"/")
            raw-name (nth parts 2 nil)
            ref-name (when raw-name
                       (js/decodeURIComponent raw-name))]
        (if (= (nth parts 3 nil) "json")
          (handle-ref-name-json ref-name env)
          (handle-ref-name-html ref-name env)))

      (and (string/starts-with? path "/asset/") (= method "GET"))
      (let [parts (string/split path #"/")
            graph-uuid (nth parts 2 nil)
            file-name (nth parts 3 nil)]
        (if (or (string/blank? graph-uuid) (string/blank? file-name))
          (bad-request "missing asset id")
          (let [ext-idx (string/last-index-of file-name ".")
                asset-uuid (when (and ext-idx (pos? ext-idx))
                             (subs file-name 0 ext-idx))
                asset-type (when (and ext-idx (pos? ext-idx))
                             (subs file-name (inc ext-idx)))]
            (if (or (string/blank? asset-uuid) (string/blank? asset-type))
              (bad-request "invalid asset id")
              (js-await [r2 (aget env "PUBLISH_R2")
                         r2-key (str "publish/assets/" graph-uuid "/" asset-uuid "." asset-type)
                         ^js object (.get r2 r2-key)]
                        (if-not object
                          (not-found)
                          (let [headers (merge-headers
                                         #js {"content-type" (or (some-> object .-httpMetadata .-contentType)
                                                                 (asset-content-type asset-type))
                                              "cache-control" "public, max-age=31536000, immutable"}
                                         (cors-headers))]
                            (js/Response. (.-body object)
                                          #js {:headers headers}))))))))

      (and (string/starts-with? path "/s/") (= method "GET"))
      (let [parts (string/split path #"/")
            short-id (nth parts 2 nil)]
        (if (string/blank? short-id)
          (bad-request "missing short id")
          (js-await [^js do-ns (aget env "PUBLISH_META_DO")
                     do-id (.idFromName do-ns "index")
                     do-stub (.get do-ns do-id)
                     resp (.fetch do-stub (str "https://publish/short/" short-id)
                                  #js {:method "GET"})]
                    (if-not (.-ok resp)
                      (not-found)
                      (js-await [data (.json resp)
                                 row (aget data "page")]
                                (if-not row
                                  (not-found)
                                  (let [graph-uuid (aget row "graph_uuid")
                                        page-uuid (aget row "page_uuid")
                                        location (str "/page/" graph-uuid "/" page-uuid)]
                                    (js/Response. nil #js {:status 302
                                                           :headers (merge-headers
                                                                     #js {"location" location}
                                                                     (cors-headers))}))))))))

      (and (string/starts-with? path "/pages/") (= method "GET"))
      (let [parts (string/split path #"/")]
        (cond
          (= (count parts) 3) (handle-list-graph-pages request env)
          (= (nth parts 4 nil) "transit") (handle-get-page-transit request env)
          (= (nth parts 4 nil) "refs") (handle-get-page-refs request env)
          (= (nth parts 4 nil) "tagged_nodes") (handle-get-page-tagged-nodes request env)
          :else (handle-get-page request env)))

      (and (string/starts-with? path "/pages/") (= method "DELETE"))
      (let [parts (string/split path #"/")]
        (if (= (count parts) 3)
          (handle-delete-graph request env)
          (handle-delete-page request env)))

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
                   "page_title TEXT,"
                   "page_tags TEXT,"
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
                   ");"))
    (let [cols (get-sql-rows (sql-exec sql "PRAGMA table_info(pages);"))
          col-names (set (map #(aget % "name") cols))]
      (when-not (contains? col-names "page_title")
        (sql-exec sql "ALTER TABLE pages ADD COLUMN page_title TEXT;"))
      (when-not (contains? col-names "page_tags")
        (sql-exec sql "ALTER TABLE pages ADD COLUMN page_tags TEXT;"))
      (when-not (contains? col-names "short_id")
        (sql-exec sql "ALTER TABLE pages ADD COLUMN short_id TEXT;")))
    (let [cols (get-sql-rows (sql-exec sql "PRAGMA table_info(page_refs);"))
          col-names (set (map #(aget % "name") cols))]
      (when (seq col-names)
        (when-not (contains? col-names "target_page_title")
          (sql-exec sql "ALTER TABLE page_refs ADD COLUMN target_page_title TEXT;"))
        (when-not (contains? col-names "target_page_name")
          (sql-exec sql "ALTER TABLE page_refs ADD COLUMN target_page_name TEXT;"))))
    (sql-exec sql
              (str "CREATE TABLE IF NOT EXISTS page_refs ("
                   "graph_uuid TEXT NOT NULL,"
                   "target_page_uuid TEXT NOT NULL,"
                   "target_page_title TEXT,"
                   "target_page_name TEXT,"
                   "source_page_uuid TEXT NOT NULL,"
                   "source_page_title TEXT,"
                   "source_block_uuid TEXT,"
                   "source_block_content TEXT,"
                   "source_block_format TEXT,"
                   "updated_at INTEGER,"
                   "PRIMARY KEY (graph_uuid, target_page_uuid, source_block_uuid)"
                   ");"))
    (sql-exec sql
              (str "CREATE TABLE IF NOT EXISTS page_tags ("
                   "graph_uuid TEXT NOT NULL,"
                   "tag_page_uuid TEXT NOT NULL,"
                   "tag_title TEXT,"
                   "source_page_uuid TEXT NOT NULL,"
                   "source_page_title TEXT,"
                   "source_block_uuid TEXT NOT NULL,"
                   "source_block_content TEXT,"
                   "source_block_format TEXT,"
                   "updated_at INTEGER,"
                   "PRIMARY KEY (graph_uuid, tag_page_uuid, source_block_uuid)"
                   ");"))))

(defn parse-page-tags [value]
  (cond
    (nil? value) #js []
    (array? value) value
    (string? value) (try
                      (js/JSON.parse value)
                      (catch :default _
                        #js []))
    :else #js []))

(defn row->meta [row]
  (let [data (js->clj row :keywordize-keys false)
        page-tags (parse-page-tags (get data "page_tags"))
        short-id (get data "short_id")]
    (assoc data
           "graph" (get data "graph_uuid")
           "page_tags" page-tags
           "short_id" short-id
           "short_url" (when short-id (str "/s/" short-id))
           "content_hash" (get data "content_hash")
           "content_length" (get data "content_length"))))

(defn do-fetch [^js self request]
  (let [sql (.-sql self)]
    (init-schema! sql)
    (cond
      (= "POST" (.-method request))
      (js-await [body (.json request)]
                (sql-exec sql
                          (str "INSERT INTO pages ("
                               "page_uuid,"
                               "page_title,"
                               "page_tags,"
                               "graph_uuid,"
                               "schema_version,"
                               "block_count,"
                               "content_hash,"
                               "content_length,"
                               "r2_key,"
                               "owner_sub,"
                               "created_at,"
                               "updated_at,"
                               "short_id"
                               ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                               " ON CONFLICT(graph_uuid, page_uuid) DO UPDATE SET"
                               " page_uuid=excluded.page_uuid,"
                               " page_title=excluded.page_title,"
                               " page_tags=excluded.page_tags,"
                               " schema_version=excluded.schema_version,"
                               " block_count=excluded.block_count,"
                               " content_hash=excluded.content_hash,"
                               " content_length=excluded.content_length,"
                               " r2_key=excluded.r2_key,"
                               " owner_sub=excluded.owner_sub,"
                               " updated_at=excluded.updated_at,"
                               " short_id=excluded.short_id;")
                          (aget body "page_uuid")
                          (aget body "page_title")
                          (aget body "page_tags")
                          (aget body "graph")
                          (aget body "schema_version")
                          (aget body "block_count")
                          (aget body "content_hash")
                          (aget body "content_length")
                          (aget body "r2_key")
                          (aget body "owner_sub")
                          (aget body "created_at")
                          (aget body "updated_at")
                          (aget body "short_id"))
                (let [refs (aget body "refs")
                      tagged-nodes (aget body "tagged_nodes")
                      graph-uuid (aget body "graph")
                      page-uuid (aget body "page_uuid")]
                  (when (and graph-uuid page-uuid)
                    (sql-exec sql
                              "DELETE FROM page_refs WHERE graph_uuid = ? AND source_page_uuid = ?;"
                              graph-uuid
                              page-uuid)
                    (sql-exec sql
                              "DELETE FROM page_tags WHERE graph_uuid = ? AND source_page_uuid = ?;"
                              graph-uuid
                              page-uuid)
                    (when (seq refs)
                      (doseq [ref refs]
                        (sql-exec sql
                                  (str "INSERT OR REPLACE INTO page_refs ("
                                       "graph_uuid, target_page_uuid, target_page_title, target_page_name, source_page_uuid, "
                                       "source_page_title, source_block_uuid, source_block_content, "
                                       "source_block_format, updated_at"
                                       ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);")
                                  (aget ref "graph_uuid")
                                  (aget ref "target_page_uuid")
                                  (aget ref "target_page_title")
                                  (aget ref "target_page_name")
                                  (aget ref "source_page_uuid")
                                  (aget ref "source_page_title")
                                  (aget ref "source_block_uuid")
                                  (aget ref "source_block_content")
                                  (aget ref "source_block_format")
                                  (aget ref "updated_at"))))
                    (when (seq tagged-nodes)
                      (doseq [tag tagged-nodes]
                        (sql-exec sql
                                  (str "INSERT OR REPLACE INTO page_tags ("
                                       "graph_uuid, tag_page_uuid, tag_title, source_page_uuid, "
                                       "source_page_title, source_block_uuid, source_block_content, "
                                       "source_block_format, updated_at"
                                       ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);")
                                  (aget tag "graph_uuid")
                                  (aget tag "tag_page_uuid")
                                  (aget tag "tag_title")
                                  (aget tag "source_page_uuid")
                                  (aget tag "source_page_title")
                                  (aget tag "source_block_uuid")
                                  (aget tag "source_block_content")
                                  (aget tag "source_block_format")
                                  (aget tag "updated_at")))))
                  (json-response {:ok true})))

      (= "GET" (.-method request))
      (let [url (js/URL. (.-url request))
            parts (string/split (.-pathname url) #"/")
            graph-uuid (nth parts 2 nil)
            page_uuid (nth parts 3 nil)]
        (cond
          (= (nth parts 1 nil) "tag")
          (let [tag-name (when-let [raw (nth parts 2 nil)]
                           (js/decodeURIComponent raw))
                rows (get-sql-rows
                      (sql-exec sql
                                (str "SELECT page_tags.graph_uuid, page_tags.source_page_uuid, page_tags.source_page_title, "
                                     "pages.short_id, "
                                     "MAX(page_tags.updated_at) AS updated_at "
                                     "FROM page_tags "
                                     "LEFT JOIN pages "
                                     "ON pages.graph_uuid = page_tags.graph_uuid "
                                     "AND pages.page_uuid = page_tags.source_page_uuid "
                                     "WHERE page_tags.tag_title = ? "
                                     "GROUP BY page_tags.graph_uuid, page_tags.source_page_uuid, page_tags.source_page_title, pages.short_id "
                                     "ORDER BY updated_at DESC;")
                                tag-name))]
            (json-response {:pages (map (fn [row]
                                          (js->clj row :keywordize-keys false))
                                        rows)}))

          (= (nth parts 1 nil) "ref")
          (let [ref-name (when-let [raw (nth parts 2 nil)]
                           (js/decodeURIComponent raw))
                rows (get-sql-rows
                      (sql-exec sql
                                (str "SELECT page_refs.graph_uuid, page_refs.source_page_uuid, page_refs.source_page_title, "
                                     "pages.short_id, "
                                     "MAX(page_refs.updated_at) AS updated_at "
                                     "FROM page_refs "
                                     "LEFT JOIN pages "
                                     "ON pages.graph_uuid = page_refs.graph_uuid "
                                     "AND pages.page_uuid = page_refs.source_page_uuid "
                                     "WHERE (lower(page_refs.target_page_title) = lower(?)) "
                                     "OR (page_refs.target_page_name = lower(?)) "
                                     "GROUP BY page_refs.graph_uuid, page_refs.source_page_uuid, page_refs.source_page_title, pages.short_id "
                                     "ORDER BY updated_at DESC;")
                                ref-name
                                ref-name))]
            (json-response {:pages (map (fn [row]
                                          (js->clj row :keywordize-keys false))
                                        rows)}))

          (= (nth parts 1 nil) "short")
          (let [short-id (nth parts 2 nil)
                rows (get-sql-rows
                      (sql-exec sql
                                (str "SELECT page_uuid, graph_uuid, page_title, short_id "
                                     "FROM pages WHERE short_id = ? LIMIT 1;")
                                short-id))
                row (first rows)]
            (json-response {:page (when row (js->clj row :keywordize-keys false))}))

          (= (nth parts 4 nil) "refs")
          (let [rows (get-sql-rows
                      (sql-exec sql
                                (str "SELECT graph_uuid, target_page_uuid, source_page_uuid, "
                                     "target_page_title, target_page_name, source_page_title, source_block_uuid, source_block_content, "
                                     "source_block_format, updated_at "
                                     "FROM page_refs WHERE graph_uuid = ? AND target_page_uuid = ? "
                                     "ORDER BY updated_at DESC;")
                                graph-uuid
                                page_uuid))]
            (json-response {:refs (map (fn [row]
                                         (js->clj row :keywordize-keys false))
                                       rows)}))

          (= (nth parts 4 nil) "tagged_nodes")
          (let [rows (get-sql-rows
                      (sql-exec sql
                                (str "SELECT graph_uuid, tag_page_uuid, tag_title, source_page_uuid, "
                                     "source_page_title, source_block_uuid, source_block_content, "
                                     "source_block_format, updated_at "
                                     "FROM page_tags WHERE graph_uuid = ? AND tag_page_uuid = ? "
                                     "ORDER BY updated_at DESC;")
                                graph-uuid
                                page_uuid))]
            (json-response {:tagged_nodes (map (fn [row]
                                                 (js->clj row :keywordize-keys false))
                                               rows)}))

          (and graph-uuid page_uuid)
          (let [rows (get-sql-rows
                      (sql-exec sql
                                (str "SELECT page_uuid, page_title, page_tags, short_id, graph_uuid, schema_version, block_count, "
                                     "content_hash, content_length, r2_key, owner_sub, created_at, updated_at "
                                     "FROM pages WHERE graph_uuid = ? AND page_uuid = ? LIMIT 1;")
                                graph-uuid
                                page_uuid))
                row (first rows)]
            (if-not row
              (not-found)
              (json-response (row->meta row))))

          graph-uuid
          (let [rows (get-sql-rows
                      (sql-exec sql
                                (str "SELECT page_uuid, page_title, page_tags, short_id, graph_uuid, schema_version, block_count, "
                                     "content_hash, content_length, r2_key, owner_sub, created_at, updated_at "
                                     "FROM pages WHERE graph_uuid = ? ORDER BY updated_at DESC;")
                                graph-uuid))]
            (json-response {:pages (map row->meta rows)}))

          :else
          (let [rows (get-sql-rows
                      (sql-exec sql
                                (str "SELECT page_uuid, page_title, page_tags, short_id, graph_uuid, schema_version, block_count, "
                                     "content_hash, content_length, r2_key, owner_sub, created_at, updated_at "
                                     "FROM pages ORDER BY updated_at DESC;")))]
            (json-response {:pages (map row->meta rows)}))))

      (= "DELETE" (.-method request))
      (let [url (js/URL. (.-url request))
            parts (string/split (.-pathname url) #"/")
            graph-uuid (nth parts 2 nil)
            page_uuid (nth parts 3 nil)]
        (cond
          (and graph-uuid page_uuid)
          (do
            (sql-exec sql
                      "DELETE FROM pages WHERE graph_uuid = ? AND page_uuid = ?;"
                      graph-uuid
                      page_uuid)
            (sql-exec sql
                      "DELETE FROM page_refs WHERE graph_uuid = ? AND source_page_uuid = ?;"
                      graph-uuid
                      page_uuid)
            (sql-exec sql
                      "DELETE FROM page_tags WHERE graph_uuid = ? AND source_page_uuid = ?;"
                      graph-uuid
                      page_uuid)
            (json-response {:ok true}))

          graph-uuid
          (do
            (sql-exec sql "DELETE FROM pages WHERE graph_uuid = ?;" graph-uuid)
            (sql-exec sql "DELETE FROM page_refs WHERE graph_uuid = ?;" graph-uuid)
            (sql-exec sql "DELETE FROM page_tags WHERE graph_uuid = ?;" graph-uuid)
            (json-response {:ok true}))

          :else
          (bad-request "missing graph uuid or page uuid")))

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
