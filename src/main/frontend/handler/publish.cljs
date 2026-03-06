(ns frontend.handler.publish
  "Prepare publish payloads for pages."
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.fs :as fs]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.user :as user-handler]
            [frontend.image :as image]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.path :as path]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- <sha256-hex
  [text]
  (p/let [encoder (js/TextEncoder.)
          data (.encode encoder text)
          digest (.digest (.-subtle js/crypto) "SHA-256" data)
          data (js/Uint8Array. digest)]
    (->> data
         (map (fn [b]
                (.padStart (.toString b 16) 2 "0")))
         (apply str))))

(defn- publish-endpoint
  []
  (str config/PUBLISH-API-BASE "/pages"))

(defn- publish-page-endpoint
  [graph-uuid page-uuid]
  (str config/PUBLISH-API-BASE "/pages/" graph-uuid "/" page-uuid))

(defn- asset-upload-endpoint
  []
  (str config/PUBLISH-API-BASE "/assets"))

(defn- asset-content-type
  [ext]
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

(def ^:private publish-image-variant-sizes
  [1024 1600])

(def ^:private publish-image-quality
  0.9)

(def ^:private publish-image-types
  #{"png" "jpg" "jpeg" "webp"})

(def ^:private custom-publish-assets
  [{:path (path/path-join "logseq" "publish.css")
    :type "css"
    :content-type "text/css; charset=utf-8"
    :meta-key :custom_publish_css_hash
    :asset-name "publish.css"}
   {:path (path/path-join "logseq" "publish.js")
    :type "js"
    :content-type "text/javascript; charset=utf-8"
    :meta-key :custom_publish_js_hash
    :asset-name "publish.js"}])

(defn- image-asset?
  [asset-type]
  (contains? publish-image-types (string/lower-case (or asset-type ""))))

(defn- asset-uuid-with-variant
  [asset-uuid variant]
  (if variant
    (str asset-uuid "@" variant)
    asset-uuid))

(defn- <sha256-hex-buffer
  [array-buffer]
  (p/let [digest (.digest (.-subtle js/crypto) "SHA-256" array-buffer)
          data (js/Uint8Array. digest)]
    (->> data
         (map (fn [b]
                (.padStart (.toString b 16) 2 "0")))
         (apply str))))

(defn- <blob-checksum
  [blob]
  (p/let [buffer (.arrayBuffer blob)]
    (<sha256-hex-buffer buffer)))

(defn- <canvas->blob
  [canvas content-type quality]
  (p/create
   (fn [resolve _reject]
     (.toBlob canvas
              (fn [blob]
                (resolve blob))
              content-type
              quality))))

(defn- <canvas-from-blob
  [blob max-dim]
  (if (exists? js/createImageBitmap)
    (p/let [bitmap (js/createImageBitmap blob #js {:imageOrientation "from-image"})
            width (.-width bitmap)
            height (.-height bitmap)
            scale (min 1 (/ max-dim (max width height)))
            target-width (js/Math.round (* width scale))
            target-height (js/Math.round (* height scale))
            canvas (js/document.createElement "canvas")
            ctx ^js (.getContext canvas "2d")]
      (set! (.-width canvas) target-width)
      (set! (.-height canvas) target-height)
      (set! (.-imageSmoothingEnabled ctx) true)
      (set! (.-imageSmoothingQuality ctx) "high")
      (.drawImage ctx bitmap 0 0 target-width target-height)
      (when (.-close bitmap)
        (.close bitmap))
      canvas)
    (p/create
     (fn [resolve reject]
       (let [img (js/Image.)
             url (js/URL.createObjectURL blob)]
         (set! (.-onload img)
               (fn []
                 (image/get-orientation img
                                        (fn [canvas]
                                          (js/URL.revokeObjectURL url)
                                          (resolve canvas))
                                        max-dim
                                        max-dim)))
         (set! (.-onerror img)
               (fn [error]
                 (js/URL.revokeObjectURL url)
                 (reject error)))
         (set! (.-src img) url))))))

(defn- <build-image-uploads
  [asset-uuid asset-type title blob content-type]
  (p/let [variant-promises (map (fn [size]
                                  (p/let [canvas (<canvas-from-blob blob size)
                                          blob' (<canvas->blob canvas content-type publish-image-quality)]
                                    (when blob'
                                      {:variant size
                                       :blob blob'})))
                                publish-image-variant-sizes)
          variants (p/then (p/all variant-promises)
                           (fn [entries]
                             (->> entries (remove nil?) vec)))]
    (when (seq variants)
      (let [sorted (sort-by :variant variants)
            largest (last sorted)
            uploads (vec (concat [(assoc largest :variant nil)] sorted))]
        (p/all
         (map (fn [{:keys [variant blob]}]
                (p/let [checksum (<blob-checksum blob)]
                  {:asset_uuid (asset-uuid-with-variant asset-uuid variant)
                   :asset_type asset-type
                   :content_type content-type
                   :checksum checksum
                   :size (.-size blob)
                   :title title
                   :blob blob}))
              uploads))))))

(defn- <upload-blob-asset!
  [graph-uuid asset-token {:keys [asset_uuid asset_type checksum size title content_type blob]}]
  (let [meta {:graph graph-uuid
              :asset_uuid asset_uuid
              :asset_type asset_type
              :checksum checksum
              :size size
              :title title
              :content_type content_type}
        headers (cond-> {"content-type" content_type
                         "x-asset-meta" (js/JSON.stringify (clj->js meta))}
                  asset-token (assoc "authorization" (str "Bearer " asset-token)))]
    (js/fetch (asset-upload-endpoint)
              (clj->js {:method "POST"
                        :headers headers
                        :body blob}))))

(defn- <upload-raw-asset!
  [asset-token asset-meta content-type content]
  (let [headers (cond-> {"content-type" content-type
                         "x-asset-meta" (js/JSON.stringify (clj->js asset-meta))}
                  asset-token (assoc "authorization" (str "Bearer " asset-token)))]
    (js/fetch (asset-upload-endpoint)
              (clj->js {:method "POST"
                        :headers headers
                        :body content}))))

(defn- merge-attr
  [entity attr value]
  (let [existing (get entity attr ::none)]
    (cond
      (= existing ::none) (assoc entity attr value)
      (vector? existing) (assoc entity attr (conj existing value))
      (set? existing) (assoc entity attr (conj existing value))
      :else (assoc entity attr [existing value]))))

(defn- datoms->entities
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

(defn- asset-entities-from-payload
  [payload]
  (let [entities (datoms->entities (:datoms payload))]
    (->> entities
         vals
         (filter (fn [entity]
                   (and (:logseq.property.asset/type entity)
                        (:block/uuid entity)))))))

(defn- <upload-asset!
  [repo graph-uuid asset]
  (let [asset-type (:logseq.property.asset/type asset)
        asset-uuid (some-> (:block/uuid asset) str)
        external-url (:logseq.property.asset/external-url asset)
        token (state/get-auth-id-token)]
    (if (or (not (string? asset-type)) (string/blank? asset-type) external-url (nil? asset-uuid))
      (p/resolved nil)
      (p/let [repo-dir (config/get-repo-dir repo)
              asset-path (path/path-join "assets" (str asset-uuid "." asset-type))
              content (fs/read-file-raw repo-dir asset-path {})
              content-type (asset-content-type asset-type)]
        (if (image-asset? asset-type)
          (p/let [blob (js/Blob. (array content) (clj->js {:type content-type}))
                  uploads (<build-image-uploads asset-uuid asset-type (:block/title asset) blob content-type)]
            (if (seq uploads)
              (p/let [responses (p/all (map (fn [upload]
                                              (<upload-blob-asset! graph-uuid token upload))
                                            uploads))]
                (doseq [resp responses]
                  (when-not (.-ok resp)
                    (js/console.warn "Asset publish failed" {:asset asset-uuid :status (.-status resp)})))
                (last responses))
              (p/let [meta {:graph graph-uuid
                            :asset_uuid asset-uuid
                            :asset_type asset-type
                            :checksum (:logseq.property.asset/checksum asset)
                            :size (:logseq.property.asset/size asset)
                            :title (:block/title asset)}
                      resp (<upload-raw-asset! token meta content-type content)]
                (when-not (.-ok resp)
                  (js/console.warn "Asset publish failed" {:asset asset-uuid :status (.-status resp)}))
                resp)))
          (p/let [meta {:graph graph-uuid
                        :asset_uuid asset-uuid
                        :asset_type asset-type
                        :checksum (:logseq.property.asset/checksum asset)
                        :size (:logseq.property.asset/size asset)
                        :title (:block/title asset)}
                  resp (<upload-raw-asset! token meta content-type content)]
            (when-not (.-ok resp)
              (js/console.warn "Asset publish failed" {:asset asset-uuid :status (.-status resp)}))
            resp))))))

(defn- <upload-assets!
  [repo graph-uuid payload]
  (let [assets (asset-entities-from-payload payload)]
    (when (seq assets)
      (p/all (map (fn [asset]
                    (p/catch (<upload-asset! repo graph-uuid asset)
                             (fn [error]
                               (js/console.warn "Asset publish error" error))))
                  assets)))))

(defn- <upload-custom-publish-assets!
  [repo graph-uuid]
  (let [token (state/get-auth-id-token)
        asset-uuid "publish"]
    (p/let [results (p/all
                     (map (fn [{:keys [path type content-type meta-key asset-name]}]
                            (p/let [content (db-model/get-file repo path)]
                              (when (and (string? content) (not (string/blank? content)))
                                (p/let [checksum (<sha256-hex content)
                                        meta {:graph graph-uuid
                                              :asset_uuid asset-uuid
                                              :asset_type type
                                              :content_type content-type
                                              :checksum checksum
                                              :title asset-name}
                                        resp (<upload-raw-asset! token meta content-type content)]
                                  (when-not (.-ok resp)
                                    (js/console.warn "Custom publish asset upload failed"
                                                     {:path path :status (.-status resp)}))
                                  {meta-key checksum}))))
                          custom-publish-assets))]
      (apply merge (remove nil? results)))))

(defn- <post-publish!
  [payload {:keys [password custom-assets]}]
  (let [token (state/get-auth-id-token)
        headers (cond-> {"content-type" "application/transit+json"}
                  token (assoc "authorization" (str "Bearer " token)))]
    (p/let [page-password (some-> password string/trim)
            page-password (when (and (string? page-password)
                                     (not (string/blank? page-password)))
                            page-password)
            payload (cond-> payload
                      page-password (assoc :page-password page-password))
            body (ldb/write-transit-str payload)
            content-hash (<sha256-hex body)
            graph-uuid (or (:graph-uuid payload)
                           (some-> (ldb/get-graph-rtc-uuid (db/get-db)) str))
            _ (when-not graph-uuid
                (throw (ex-info "Missing graph UUID" {:repo (state/get-current-repo)})))
            publish-meta {:graph graph-uuid
                          :page_uuid (str (:page-uuid payload))
                          :block_count (:block-count payload)
                          :schema_version (:schema-version payload)
                          :format :transit
                          :compression :none
                          :content_hash content-hash
                          :content_length (count body)
                          :owner_sub (user-handler/user-uuid)
                          :owner_username (user-handler/username)
                          :created_at (util/time-ms)}
            publish-meta (cond-> publish-meta
                           (get custom-assets :custom_publish_css_hash)
                           (assoc :custom_publish_css_hash (:custom_publish_css_hash custom-assets))
                           (get custom-assets :custom_publish_js_hash)
                           (assoc :custom_publish_js_hash (:custom_publish_js_hash custom-assets)))
            publish-body (assoc payload :meta publish-meta)
            headers (assoc headers "x-publish-meta" (js/JSON.stringify (clj->js publish-meta)))
            resp (js/fetch (publish-endpoint)
                           (clj->js {:method "POST"
                                     :headers headers
                                     :body (ldb/write-transit-str publish-body)}))]
      (if (.-ok resp)
        resp
        (p/let [body (.text resp)]
          (throw (ex-info "Publish failed"
                          {:status (.-status resp)
                           :body body})))))))

(defn publish-page!
  "Prepares and uploads the publish payload for a page."
  [page & [{:keys [password]}]]
  (let [repo (state/get-current-repo)]
    (when-let [db* (and repo (db/get-db repo))]
      (if (and page (:db/id page))
        (p/let [graph-id (some->
                          (or (ldb/get-graph-rtc-uuid db*)
                              (ldb/get-graph-local-uuid db*))
                          str)
                payload (state/<invoke-db-worker :thread-api/build-publish-page-payload
                                                 repo
                                                 (:db/id page))]
          (if payload
            (-> (p/let [_ (<upload-assets! repo graph-id payload)
                        custom-assets (<upload-custom-publish-assets! repo graph-id)]
                  (<post-publish! payload {:password password
                                           :custom-assets custom-assets}))
                (p/then (fn [resp]
                          (p/let [json (.json resp)
                                  data (bean/->clj json)]
                            (let [short-url (:short_url data)
                                  page-id (str (:block/uuid page))
                                  fallback-url (when (and graph-id page-id)
                                                 (str config/PUBLISH-API-BASE "/page/" graph-id "/" page-id))
                                  url (or (when short-url
                                            (str config/PUBLISH-API-BASE short-url))
                                          fallback-url)]
                              (when (and url (:db/id page))
                                (property-handler/set-block-property! (:db/id page)
                                                                      :logseq.property.publish/published-url
                                                                      url))
                              (when url
                                (notification/show!
                                 [:div.inline
                                  [:span "Published to: "]
                                  [:a {:target "_blank"
                                       :href url}
                                   url]]
                                 :success
                                 false))))))
                (p/catch (fn [error]
                           (js/console.error error)
                           (notification/show! "Publish failed." :error))))
            (notification/show! "Publish failed." :error)))
        (notification/show! "Publish failed: invalid page." :error)))))

(defn unpublish-page!
  [page]
  (let [token (state/get-auth-id-token)
        headers (cond-> {}
                  token (assoc "authorization" (str "Bearer " token)))
        db (db/get-db (state/get-current-repo))]
    (p/let [graph-uuid (some->
                        (or (ldb/get-graph-rtc-uuid db)
                            (ldb/get-graph-local-uuid db))
                        str)
            page-uuid (some-> (:block/uuid page) str)]
      (if (and graph-uuid page-uuid)
        (-> (p/let [resp (js/fetch (publish-page-endpoint graph-uuid page-uuid)
                                   (clj->js {:method "DELETE"
                                             :headers headers}))]
              (if (.-ok resp)
                (do
                  (property-handler/remove-block-property! (:db/id page)
                                                           :logseq.property.publish/published-url)
                  (notification/show! "Unpublished." :success false))
                (p/let [body (.text resp)]
                  (throw (ex-info "Unpublish failed"
                                  {:status (.-status resp)
                                   :body body})))))
            (p/catch (fn [error]
                       (js/console.error error)
                       (notification/show! "Unpublish failed." :error))))
        (notification/show! "Unpublish failed: missing page id." :error)))))
