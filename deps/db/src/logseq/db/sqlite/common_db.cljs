(ns logseq.db.sqlite.common-db
  "Common sqlite db fns for browser and node"
  (:require [datascript.core :as d]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.entity-plus :as entity-plus]))

(defn- get-pages-by-name
  [db page-name]
  (d/datoms db :avet :block/name (common-util/page-name-sanity-lc page-name)))

(defn get-first-page-by-name
  "Return the oldest page's db id for :block/name"
  [db page-name]
  (when (and db (string? page-name))
    (first (sort (map :e (get-pages-by-name db page-name))))))

(defn get-first-page-by-original-name
  "Return the oldest page's db id for :block/original-name"
  [db page-name]
  {:pre [(string? page-name)]}
  (first (sort (map :e
                    (d/datoms db :avet :block/original-name page-name)))))

(comment
  (defn- get-built-in-files
    [db]
    (let [files ["logseq/config.edn"
                 "logseq/custom.css"
                 "logseq/custom.js"]]
      (map #(d/pull db '[*] [:file/path %]) files))))

(defn get-all-pages
  [db exclude-page-ids]
  (->> (d/datoms db :avet :block/name)
       (keep (fn [e]
               (when-not (contains? exclude-page-ids (:e e))
                 (d/pull db '[:db/id :db/ident :block/uuid :block/name :block/original-name :block/alias :block/type
                              :block/created-at :block/updated-at]
                         (:e e)))))))

(defn get-all-files
  [db]
  (->> (d/datoms db :avet :file/path)
       (mapcat (fn [e] (d/datoms db :eavt (:e e))))))

(defn- with-block-refs
  [db block]
  (update block :block/refs (fn [refs] (map (fn [ref] (d/pull db '[*] (:db/id ref))) refs))))

(defn with-parent-and-left
  [db block]
  (cond
    (:block/name block)
    block
    (:block/page block)
    (let [left (when-let [e (d/entity db (:db/id (:block/left block)))]
                 (select-keys e [:db/id :block/uuid]))
          parent (when-let [e (d/entity db (:db/id (:block/parent block)))]
                   (select-keys e [:db/id :block/uuid]))]
      (->>
       (assoc block
              :block/left left
              :block/parent parent)
       (common-util/remove-nils-non-nested)
       (with-block-refs db)))
    :else
    block))

(defn- with-tags
  [db block]
  (update block :block/tags (fn [tags] (d/pull-many db '[*] (map :db/id tags)))))

(defn- mark-block-fully-loaded
  [b]
  (assoc b :block.temp/fully-loaded? true))

(comment
  (defn- property-without-db-attrs
    [property]
    (dissoc property :db/index :db/valueType :db/cardinality)))

(defn- property-with-values
  [db block]
  (when (entity-plus/db-based-graph? db)
    (let [block (d/entity db (:db/id block))
          block-properties (when (seq (:block/raw-properties block))
                             (let [pairs (d/pull-many db '[*] (map :db/id (:block/raw-properties block)))]
                               (mapcat
                                (fn [pair]
                                  (let [property (d/entity db (:db/id (:property/pair-property pair)))
                                        property-values (get pair (:db/ident property))
                                        values (if (and (coll? property-values)
                                                        (map? (first property-values)))
                                                 property-values
                                                 #{property-values})
                                        value-ids (when (every? map? values)
                                                    (->> (map :db/id values)
                                                         (filter (fn [id] (or (int? id) (keyword? id))))))
                                        value-blocks (->>
                                                      (when (seq value-ids)
                                                        (mapcat
                                                         (fn [id]
                                                           (let [b (d/entity db id)]
                                                             (cons (d/pull db '[*] id)
                                                                   (let [ids (map :db/id (:block/raw-properties b))]
                                                                     (when (seq ids)
                                                                       (d/pull-many db '[*] ids))))))
                                                         value-ids))
                                                    ;; FIXME: why d/pull returns {:db/id db-ident} instead of {:db/id number-eid}?
                                                      (map (fn [block]
                                                             (let [from-property-id (get-in block [:logseq.property/created-from-property :db/id])]
                                                               (if (keyword? from-property-id)
                                                                 (assoc-in block [:logseq.property/created-from-property :db/id] (:db/id (d/entity db from-property-id)))
                                                                 block)))))
                                        page (when (seq values)
                                               (when-let [page-id (:db/id (:block/page (d/entity db (:db/id (first values)))))]
                                                 (d/pull db '[*] page-id)))]
                                    (remove nil? (concat [page]
                                                         value-blocks
                                                         [pair]))))
                                pairs)))]
      block-properties)))

(defn get-block-and-children
  [db id children?]
  (let [block (d/entity db (if (uuid? id)
                             [:block/uuid id]
                             id))
        get-children (fn [block children]
                       (let [long-page? (and (> (count children) 500) (not (contains? (:block/type block) "whiteboard")))]
                         (if long-page?
                           (map (fn [e]
                                  (select-keys e [:db/id :block/uuid :block/page :block/left :block/parent :block/collapsed?]))
                                children)
                           (->> (d/pull-many db '[*] (map :db/id children))
                                (map #(with-block-refs db %))
                                (map mark-block-fully-loaded)
                                (mapcat (fn [block]
                                          (let [e (d/entity db (:db/id block))]
                                            (conj
                                             (if (seq (:block/raw-properties e))
                                               (vec (property-with-values db e))
                                               [])
                                             block))))))))]
    (when block
      (if (:block/page block) ; not a page
        (let [block' (->> (d/pull db '[*] (:db/id block))
                          (with-parent-and-left db)
                          (with-block-refs db)
                          mark-block-fully-loaded)]
          (cond->
           {:block block'
            :properties (property-with-values db block)}
            children?
            (assoc :children (get-children block (:block/_parent block)))))
        (cond->
         {:block (->> (d/pull db '[*] (:db/id block))
                      (with-tags db)
                      mark-block-fully-loaded)
          :properties (property-with-values db block)}
          children?
          (assoc :children
                 (get-children block (:block/_page block))))))))

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

(defn get-structured-datoms
  [db]
  (mapcat (fn [type]
            (->> (d/datoms db :avet :block/type type)
                 (mapcat (fn [d]
                           (d/datoms db :eavt (:e d))))))
          ["property" "class" "closed value"]))

(defn get-favorites
  "Favorites page and its blocks"
  [db]
  (let [page-id (get-first-page-by-name db common-config/favorites-page-name)
        {:keys [block children]} (get-block-and-children db page-id true)]
    (when block
      (concat (d/datoms db :eavt (:db/id block))
              (->> (keep :block/link children)
                   (mapcat (fn [l]
                             (d/datoms db :eavt (:db/id l)))))
              (mapcat (fn [child]
                        (d/datoms db :eavt (:db/id child)))
                      children)))))

(defn get-initial-data
  "Returns current database schema and initial data"
  [db]
  (let [schema (:schema db)
        idents (mapcat (fn [id]
                         (when-let [e (d/entity db id)]
                           (d/datoms db :eavt (:db/id e))))
                       [:logseq.kv/db-type :logseq.kv/graph-uuid])
        favorites (get-favorites db)
        latest-journals (get-latest-journals db 3)
        all-files (get-all-files db)
        structured-datoms (when (entity-plus/db-based-graph? db)
                            (get-structured-datoms db))
        data (concat idents
                     structured-datoms
                     favorites
                     latest-journals
                     all-files)]
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
