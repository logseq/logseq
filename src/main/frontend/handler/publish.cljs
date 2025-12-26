(ns frontend.handler.publish
  "Prepare publish payloads for pages."
  (:require [datascript.core :as d]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.db.common.entity-util :as entity-util]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]))

(defn- datom->vec
  [datom]
  [(:e datom) (:a datom) (:v datom) (:tx datom) (:added datom)])

(defn- collect-page-eids
  [db page-entity]
  (let [page-id (:db/id page-entity)
        blocks (ldb/get-page-blocks db page-id)
        block-eids (map :db/id blocks)
        ref-eids (->> blocks (mapcat :block/refs) (keep :db/id))
        tag-eids (->> blocks (mapcat :block/tags) (keep :db/id))
        page-eids (->> blocks (map :block/page) (keep :db/id))]
    {:blocks blocks
     :eids (->> (concat [page-id] block-eids ref-eids tag-eids page-eids)
                (remove nil?)
                distinct)}))

(defn build-page-publish-datoms
  "Builds a datom snapshot for a single page.

  References/backlinks are intentionally ignored at this stage.
  "
  [db page-entity]
  (let [{:keys [blocks eids]} (collect-page-eids db page-entity)
        datoms (mapcat (fn [eid]
                         (map datom->vec (d/datoms db :eavt eid)))
                       eids)]
    {:page (entity-util/entity->map page-entity)
     :page-uuid (:block/uuid page-entity)
     :block-count (count blocks)
     :schema-version (db-schema/schema-version->string db-schema/version)
     :datoms (vec datoms)}))

(defn- <sha256-hex
  [text]
  (p/let [encoder (js/TextEncoder.)
          data (.encode encoder text)
          digest (.digest (.-subtle js/crypto) "SHA-256" data)
          bytes (js/Uint8Array. digest)]
    (->> bytes
         (map (fn [b]
                (.padStart (.toString b 16) 2 "0")))
         (apply str))))

(defn- publish-endpoint
  []
  (str config/PUBLISH-API-BASE "/pages"))

(defn- <post-publish!
  [payload]
  (let [token (state/get-auth-id-token)
        headers (cond-> {"content-type" "application/transit+json"}
                  token (assoc "authorization" (str "Bearer " token)))]
    (p/let [body (ldb/write-transit-str payload)
            content-hash (<sha256-hex body)
            graph-uuid (some-> (ldb/get-graph-rtc-uuid (db/get-db)) str)
            _ (when-not graph-uuid
                (throw (ex-info "Missing graph UUID" {:repo (state/get-current-repo)})))
            publish-graph graph-uuid
            publish-meta {:page-uuid (:page-uuid payload)
                          :block-count (:block-count payload)
                          :schema-version (:schema-version payload)
                          :publish/format :transit
                          :publish/compression :none
                          :publish/content-hash content-hash
                          :publish/content-length (count body)
                          :publish/graph publish-graph
                          :publish/created-at (util/time-ms)}
            publish-body (assoc payload
                                :publish/meta publish-meta)
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
    (if-let [db* (and repo (db/get-db repo))]
      (if (and page (:db/id page))
        (let [payload (build-page-publish-datoms db* page)]
          (notification/show! "Publishing page..." :success)
          (-> (<post-publish! payload)
              (p/then (fn [_resp]
                        (notification/show! "Page published." :success)))
              (p/catch (fn [error]
                         (js/console.error error)
                         (notification/show! "Publish failed." :error)))))
        (notification/show! "Publish failed: invalid page." :error))
      (notification/show! "Publish failed: missing database." :error))))
