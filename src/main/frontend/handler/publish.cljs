(ns frontend.handler.publish
  "Prepare publish payloads for pages."
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.handler.notification :as notification]
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
              meta {:graph graph-uuid
                    :asset_uuid asset-uuid
                    :asset_type asset-type
                    :checksum (:logseq.property.asset/checksum asset)
                    :size (:logseq.property.asset/size asset)
                    :title (:block/title asset)}
              headers (cond-> {"content-type" (asset-content-type asset-type)
                               "x-asset-meta" (js/JSON.stringify (clj->js meta))}
                        token (assoc "authorization" (str "Bearer " token)))
              resp (js/fetch (asset-upload-endpoint)
                             (clj->js {:method "POST"
                                       :headers headers
                                       :body content}))]
        (when-not (.-ok resp)
          (js/console.warn "Asset publish failed" {:asset asset-uuid :status (.-status resp)}))
        resp))))

(defn- <upload-assets!
  [repo graph-uuid payload]
  (let [assets (asset-entities-from-payload payload)]
    (when (seq assets)
      (p/all (map (fn [asset]
                    (p/catch (<upload-asset! repo graph-uuid asset)
                             (fn [error]
                               (js/console.warn "Asset publish error" error))))
                  assets)))))

(defn- <post-publish!
  [payload]
  (let [token (state/get-auth-id-token)
        headers (cond-> {"content-type" "application/transit+json"}
                  token (assoc "authorization" (str "Bearer " token)))]
    (p/let [body (ldb/write-transit-str payload)
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
                          :created_at (util/time-ms)}
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
  [page]
  (let [repo (state/get-current-repo)]
    (when-let [db* (and repo (db/get-db repo))]
      (if (and page (:db/id page))
        (p/let [graph-uuid (some-> (ldb/get-graph-rtc-uuid db*) str)
                payload (state/<invoke-db-worker :thread-api/build-publish-page-payload
                                                 repo
                                                 (:db/id page)
                                                 graph-uuid)]
          (if payload
            (-> (p/let [_ (<upload-assets! repo graph-uuid payload)]
                  (<post-publish! payload))
                (p/then (fn [resp]
                          (p/let [json (.json resp)
                                  data (bean/->clj json)]
                            (let [short-url (:short_url data)
                                  graph-uuid (or (:graph-uuid payload)
                                                 (some-> (ldb/get-graph-rtc-uuid db*) str))
                                  page-uuid (str (:block/uuid page))
                                  fallback-url (when (and graph-uuid page-uuid)
                                                 (str config/PUBLISH-API-BASE "/page/" graph-uuid "/" page-uuid))
                                  url (or (when short-url
                                            (str config/PUBLISH-API-BASE short-url))
                                          fallback-url)]
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
