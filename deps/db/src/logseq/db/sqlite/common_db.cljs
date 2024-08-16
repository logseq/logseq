(ns logseq.db.sqlite.common-db
  "Common sqlite db fns for browser and node"
  (:require [datascript.core :as d]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.entity-util :as entity-util]
            [clojure.set :as set]
            [logseq.db.frontend.order :as db-order]))

(defn- get-pages-by-name
  [db page-name]
  (d/datoms db :avet :block/name (common-util/page-name-sanity-lc page-name)))

(defn get-first-page-by-name
  "Return the oldest page's db id for :block/name"
  [db page-name]
  (when (and db (string? page-name))
    (first (sort (map :e (get-pages-by-name db page-name))))))

(defn get-first-page-by-title
  "Return the oldest page's db id for :block/title"
  [db page-name]
  {:pre [(string? page-name)]}
  (->> (d/datoms db :avet :block/title page-name)
       (filter (fn [d]
                 (let [e (d/entity db (:e d))]
                   (or (sqlite-util/page? e) (:block/tags e)))))
       (map :e)
       sort
       first))

(comment
  (defn- get-built-in-files
    [db]
    (let [files ["logseq/config.edn"
                 "logseq/custom.css"
                 "logseq/custom.js"]]
      (map #(d/pull db '[*] [:file/path %]) files))))

(defn get-all-files
  [db]
  (->> (d/datoms db :avet :file/path)
       (mapcat (fn [e] (d/datoms db :eavt (:e e))))))

(defn- with-block-refs
  [db block]
  (update block :block/refs (fn [refs] (map (fn [ref] (d/pull db '[*] (:db/id ref))) refs))))

(defn- with-block-link
  [db block]
  (if (:block/link block)
    (update block :block/link (fn [link] (d/pull db '[*] (:db/id link))))
    block))

(defn with-parent
  [db block]
  (cond
    (:block/page block)
    (let [parent (when-let [e (d/entity db (:db/id (:block/parent block)))]
                   (select-keys e [:db/id :block/uuid]))]
      (->>
       (assoc block :block/parent parent)
       (common-util/remove-nils-non-nested)
       (with-block-refs db)))

    :else
    block))

(defn- mark-block-fully-loaded
  [b]
  (assoc b :block.temp/fully-loaded? true))

(comment
  (defn- property-without-db-attrs
    [property]
    (dissoc property :db/index :db/valueType :db/cardinality)))

(defn- property-with-values
  [db block]
  (when (entity-util/db-based-graph? db)
    (let [block (d/entity db (:db/id block))]
      (->> (:block/properties block)
           vals
           (mapcat
            (fn [property-values]
              (let [values (->>
                            (if (and (coll? property-values)
                                     (map? (first property-values)))
                              property-values
                              #{property-values})
                            (remove sqlite-util/page?))
                    value-ids (when (every? map? values)
                                (->> (map :db/id values)
                                     (filter (fn [id] (or (int? id) (keyword? id))))))
                    value-blocks (->>
                                  (when (seq value-ids)
                                    (map
                                     (fn [id] (d/pull db '[*] id))
                                     value-ids))
                             ;; FIXME: why d/pull returns {:db/id db-ident} instead of {:db/id number-eid}?
                                  (keep (fn [block]
                                          (let [from-property-id (get-in block [:logseq.property/created-from-property :db/id])]
                                            (if (keyword? from-property-id)
                                              (assoc-in block [:logseq.property/created-from-property :db/id] (:db/id (d/entity db from-property-id)))
                                              block)))))]
                value-blocks)))))))

(defn get-block-children-ids
  "Returns children UUIDs"
  [db block-uuid]
  (when-let [eid (:db/id (d/entity db [:block/uuid block-uuid]))]
    (let [seen   (volatile! [])]
      (loop [steps          100      ;check result every 100 steps
             eids-to-expand [eid]]
        (when (seq eids-to-expand)
          (let [eids-to-expand*
                (mapcat (fn [eid] (map first (d/datoms db :avet :block/parent eid))) eids-to-expand)
                uuids-to-add (remove nil? (map #(:block/uuid (d/entity db %)) eids-to-expand*))]
            (when (and (zero? steps)
                       (seq (set/intersection (set @seen) (set uuids-to-add))))
              (throw (ex-info "bad outliner data, need to re-index to fix"
                              {:seen @seen :eids-to-expand eids-to-expand})))
            (vswap! seen (partial apply conj) uuids-to-add)
            (recur (if (zero? steps) 100 (dec steps)) eids-to-expand*))))
      @seen)))

(defn get-block-children
  "Including nested children."
  [db block-uuid]
  (let [ids (get-block-children-ids db block-uuid)]
    (when (seq ids)
      (let [ids' (map (fn [id] [:block/uuid id]) ids)]
        (d/pull-many db '[*] ids')))))

(defn get-block-and-children
  [db id {:keys [children? nested-children?]}]
  (let [block (d/entity db (if (uuid? id)
                             [:block/uuid id]
                             id))
        page? (sqlite-util/page? block)
        get-children (fn [block children]
                       (let [long-page? (and (> (count children) 500) (not (sqlite-util/whiteboard? block)))]
                         (if long-page?
                           (->> (map (fn [e]
                                       (select-keys e [:db/id :block/uuid :block/page :block/order :block/parent :block/collapsed? :block/link]))
                                     children)
                                (map #(with-block-link db %)))
                           (->> (d/pull-many db '[*] (map :db/id children))
                                (map #(with-block-refs db %))
                                (map #(with-block-link db %))
                                (mapcat (fn [block]
                                          (let [e (d/entity db (:db/id block))]
                                            (conj
                                             (if (seq (:block/properties e))
                                               (vec (property-with-values db e))
                                               [])
                                             block))))))))]
    (when block
      (let [block' (->> (d/pull db '[*] (:db/id block))
                        (with-parent db)
                        (with-block-refs db)
                        (with-block-link db))
            block' (if (and page? (not (or children? nested-children?)))
                     block'
                     (mark-block-fully-loaded block'))]
        (cond->
         {:block block'
          :properties (property-with-values db block)}
          children?
          (assoc :children (get-children block
                                         (if (and nested-children? (not page?))
                                           (get-block-children db (:block/uuid block))
                                           (if page?
                                             (:block/_page block)
                                             (:block/_parent block))))))))))

(defn get-latest-journals
  [db n]
  (let [today (date-time-util/date->int (js/Date.))]
    (->>
     (d/q '[:find [(pull ?page [:db/id :block/journal-day]) ...]
            :in $ ?today
            :where
            [?page :block/name ?page-name]
            ;; [?page :block/type "journal"]
            [?page :block/journal-day ?journal-day]
            [(<= ?journal-day ?today)]]
          db
          today)
     (sort-by :block/journal-day)
     (reverse)
     (take n)
     (mapcat (fn [p]
               (d/datoms db :eavt (:db/id p)))))))

(defn get-all-pages
  [db]
  (let [datoms (d/datoms db :avet :block/name)]
    (mapcat (fn [d] (d/datoms db :eavt (:e d))) datoms)))

(defn get-page->refs-count
  [db]
  (let [datoms (d/datoms db :avet :block/name)]
    (->>
     (map (fn [d]
            [(:e d)
             (count (:block/_refs (d/entity db (:e d))))]) datoms)
     (into {}))))

(defn get-structured-datoms
  [db]
  (mapcat (fn [type]
            (->> (d/datoms db :avet :block/type type)
                 (mapcat (fn [d]
                           (d/datoms db :eavt (:e d))))))
          [
           ;; property and class pages are pulled from `get-all-pages` already
           ;; "property" "class"
           "closed value"]))

(defn get-favorites
  "Favorites page and its blocks"
  [db]
  (let [page-id (get-first-page-by-name db common-config/favorites-page-name)
        {:keys [block children]} (get-block-and-children db page-id {:children? true})]
    (when block
      (concat (d/datoms db :eavt (:db/id block))
              (->> (keep :block/link children)
                   (mapcat (fn [l]
                             (d/datoms db :eavt (:db/id l)))))
              (mapcat (fn [child]
                        (d/datoms db :eavt (:db/id child)))
                      children)))))

(defn get-views-data
  [db]
  (let [page-id (get-first-page-by-name db common-config/views-page-name)
        children (when page-id (:block/_parent (d/entity db page-id)))]
    (when (seq children)
      (mapcat (fn [b] (d/datoms db :eavt (:db/id b)))
              children))))

(defn get-initial-data
  "Returns current database schema and initial data.
   NOTE: This fn is called by DB and file graphs"
  [db]
  (let [db-graph? (entity-util/db-based-graph? db)
        _ (when db-graph?
            (reset! db-order/*max-key (db-order/get-max-order db)))
        schema (:schema db)
        idents (mapcat (fn [id]
                         (when-let [e (d/entity db id)]
                           (d/datoms db :eavt (:db/id e))))
                       [:logseq.kv/db-type :logseq.kv/graph-uuid :logseq.property/empty-placeholder])
        favorites (when db-graph? (get-favorites db))
        views (when db-graph? (get-views-data db))
        latest-journals (get-latest-journals db 1)
        all-files (get-all-files db)
        all-pages (get-all-pages db)
        structured-datoms (when db-graph?
                            (get-structured-datoms db))
        data (distinct
              (concat idents
                      all-pages
                      structured-datoms
                      favorites
                      views
                      latest-journals
                      all-files))]
    {:schema schema
     :initial-data data}))

(defn restore-initial-data
  "Given initial Datascript datoms and schema, returns a datascript connection"
  [data schema]
  (d/conn-from-datoms data schema))

(defn create-kvs-table!
  "Creates a sqlite table for use with datascript.storage if one doesn't exist"
  [sqlite-db]
  (.exec sqlite-db "create table if not exists kvs (addr INTEGER primary key, content TEXT)"))

(defn get-storage-conn
  "Given a datascript storage, returns a datascript connection for it"
  [storage schema]
  (or (d/restore-conn storage)
      (d/create-conn schema {:storage storage})))

(defn sanitize-db-name
  [db-name]
  (if (string/starts-with? db-name sqlite-util/file-version-prefix)
    (-> db-name
        (string/replace ":" "+3A+")
        (string/replace "/" "++"))
    (-> db-name
       (string/replace sqlite-util/db-version-prefix "")
       (string/replace "/" "_")
       (string/replace "\\" "_")
       (string/replace ":" "_"))));; windows

(defn get-db-full-path
  [graphs-dir db-name]
  (let [db-name' (sanitize-db-name db-name)
        graph-dir (node-path/join graphs-dir db-name')]
    [db-name' (node-path/join graph-dir "db.sqlite")]))
