(ns logseq.cli.common.mcp.tools
  "MCP tool related fns shared between CLI and frontend"
  (:require [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.outliner.tree :as otree]
            [promesa.core :as p]))

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

(defn- get-page-blocks
  [db page-id]
  (let [blocks (ldb/get-page-blocks db page-id)]
      ;; Use repo stub since this is a DB only tool
    (->> (otree/blocks->vec-tree "logseq_db_repo_stub" db blocks page-id)
         (map #(update % :block/uuid str)))))

(defn ^:api remove-hidden-properties
  "Given an entity map, remove properties that shouldn't be returned in api calls"
  [m]
  (->> (remove (fn [[k _v]]
                 (or (= "block.temp" (namespace k))
                     (contains? #{:logseq.property.embedding/hnsw-label-updated-at} k))) m)
       (into {})))

(defn get-page-data
  "Get page data for GetPage tool including the page's entity and its blocks"
  [db page-name-or-uuid]
  (when-let [page (ldb/get-page db page-name-or-uuid)]
    {:entity (-> (remove-hidden-properties page)
                 (dissoc :block/tags :block/refs)
                 (update :block/uuid str))
     :blocks (map #(-> %
                       remove-hidden-properties
                       ;; remove unused and untranslated attrs
                       (dissoc :block/children :block/page))
                  (get-page-blocks db (:db/id page)))}))

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

(defn- import-edn-data
  [conn export-map]
  (let [{:keys [init-tx block-props-tx misc-tx error] :as _txs}
        (sqlite-export/build-import export-map @conn {})]
    ;; (cljs.pprint/pprint _txs)
    (when error
      (throw (ex-info (str "Error while building import data: " error) {})))
    (let [tx-meta {::sqlite-export/imported-data? true
                   :import-db? true}]
      (p/do!
       (ldb/transact! conn init-tx tx-meta)
       (when (seq block-props-tx)
         (ldb/transact! conn block-props-tx tx-meta))
       (when (seq misc-tx)
         (ldb/transact! conn misc-tx tx-meta))))))

(defn upsert-nodes
  [conn operations]
  (prn :cli-ops operations)
  ;; TODO: Validate operations
  (let [blocks-by-page
        (group-by #(get-in % [:data :page-id])
                  (filter #(= "block" (:entityType %)) operations))
        new-pages (filter #(and (= "page" (:entityType %)) (= "add" (:operation %))) operations)
        pages-and-blocks
        (into (mapv (fn [op]
                      (cond-> {:page {:block/title (get-in op [:data :title])}}
                        (some-> (:id op) (get blocks-by-page))
                        (assoc :blocks
                               (mapv #(hash-map :block/title (get-in % [:data :title]))
                                     (get blocks-by-page (:id op))))))
                    new-pages)
              ;; existing pages
              (map (fn [[page-id ops]]
                     (if (some-> page-id common-util/uuid-string?)
                       {:page {:block/uuid (uuid page-id)}
                        :blocks (mapv (fn [op]
                                        (if (= "add" (:operation op))
                                          {:block/title (get-in op [:data :title])}
                                          (do
                                            (when-not (some-> (:id op) common-util/uuid-string?)
                                              (throw (ex-info (str "Existing block " (pr-str (:id op)) " has a non-uuid id") {})))
                                            {:block/uuid (uuid (:id op))
                                             :block/title (get-in op [:data :title])})))
                                      ops)}
                       (throw (ex-info (str "Existing page " (pr-str page-id) " has a non-uuid id") {}))))
                   (apply dissoc blocks-by-page (map :id new-pages))))
        import-edn
        (cond-> {}
          (seq pages-and-blocks)
          (assoc :pages-and-blocks pages-and-blocks))]
    (prn :import-edn import-edn)
    (import-edn-data conn import-edn)))