(ns logseq.cli.common.mcp.tools
  "MCP tool related fns shared between CLI and frontend"
  (:require [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.tree :as otree]))

(defn list-properties
  "Main fn for ListProperties tool"
  [db]
  (->> (d/datoms db :avet :block/tags :logseq.class/Property)
       (map #(d/entity db (:e %)))
       #_((fn [x] (prn :prop-keys (distinct (mapcat keys x))) x))
       (map (fn [e]
              (cond-> (into {} e)
                true
                (dissoc e :block/tags :block/order :block/refs :block/name :db/index
                        :logseq.property.embedding/hnsw-label-updated-at :logseq.property/default-value)
                true
                (update :block/uuid str)
                (:logseq.property/classes e)
                (update :logseq.property/classes #(mapv :db/ident %))
                (:logseq.property/description e)
                (update :logseq.property/description db-property/property-value-content))))))

(defn list-tags
  "Main fn for ListTags tool"
  [db]
  (->> (d/datoms db :avet :block/tags :logseq.class/Tag)
       (map #(d/entity db (:e %)))
       (map (fn [e]
              (cond-> (into {} e)
                true
                (dissoc e :block/tags :block/order :block/refs :block/name
                        :logseq.property.embedding/hnsw-label-updated-at)
                true
                (update :block/uuid str)
                (:logseq.property.class/extends e)
                (update :logseq.property.class/extends #(mapv :db/ident %))
                (:logseq.property.class/properties e)
                (update :logseq.property.class/properties #(mapv :db/ident %))
                (:logseq.property.view/type e)
                (assoc :logseq.property.view/type (:db/ident (:logseq.property.view/type e)))
                (:logseq.property/description e)
                (update :logseq.property/description db-property/property-value-content))))))

(defn get-page-blocks
  "Get page blocks for GetPage tool"
  [db page-name-or-uuid]
  (when-let [page-id (:db/id (ldb/get-page db page-name-or-uuid))]
    (let [blocks (ldb/get-page-blocks db page-id)]
      ;; Use repo stub since this is a DB only tool
      (->> (otree/blocks->vec-tree "logseq_db_repo_stub" db blocks page-id)
           (map #(update % :block/uuid str))))))

(defn list-pages
  "Main fn for ListPages tool"
  [db]
  (->> (d/datoms db :avet :block/name)
       (map #(d/entity db (:e %)))
       (remove entity-util/hidden?)
       (map #(-> %
                 ;; Until there are options to limit pages, return minimal info to avoid
                 ;; exceeding max payload size
                 (select-keys [:block/uuid :block/title :block/created-at :block/updated-at])
                 (update :block/uuid str)))))