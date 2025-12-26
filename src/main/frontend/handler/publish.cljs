(ns frontend.handler.publish
  "Prepare publish payloads for pages."
  (:require [datascript.core :as d]
            [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [logseq.db.common.entity-util :as entity-util]
            [logseq.db.frontend.schema :as db-schema]))

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
     :page-id (:db/id page-entity)
     :block-count (count blocks)
     :schema-version (db-schema/schema-version->string db-schema/version)
     :datoms (vec datoms)}))

(defn publish-page!
  "Prepares the publish payload for a page. The upload step is stubbed for now."
  [page]
  (let [repo (state/get-current-repo)]
    (if-let [db* (and repo (db/get-db repo))]
      (if (and page (:db/id page))
        (let [payload (build-page-publish-datoms db* page)]
          (notification/show! "Publish payload prepared." :success)
          (js/console.log "Publish payload" (clj->js payload))
          payload)
        (notification/show! "Publish failed: invalid page." :error))
      (notification/show! "Publish failed: missing database." :error))))
