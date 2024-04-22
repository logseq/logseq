(ns logseq.db.sqlite.common-db
  "Common sqlite db fns for browser and node"
  (:require [datascript.core :as d]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]))

(defn get-pages-by-name
  [db page-name]
  (d/datoms db :avet :block/name (common-util/page-name-sanity-lc page-name)))

(defn get-first-page-by-name
  "Return the oldest page's db id"
  [db page-name]
  (when (and db (string? page-name))
    (first (sort (map :e (get-pages-by-name db page-name))))))

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
                 (d/pull db '[:db/id :block/uuid :block/name :block/original-name :block/alias :block/type] (:e e)))))))

(defn get-all-files
  [db]
  (->> (d/datoms db :avet :file/path)
       (map (fn [e]
              {:db/id (:e e)
               :file/path (:v e)
               :file/content (:file/content (d/entity db (:e e)))}))))

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
  (let [block (d/entity db (:db/id block))
        class-properties (when (contains? (:block/type block) "class")
                           (let [property-ids (map :db/id (:class/schema.properties block))]
                             (when (seq property-ids)
                               (d/pull-many db '[*] property-ids))))
        block-properties (when (seq (:block/raw-properties block))
                           (let [pairs (d/pull-many db '[*] (map :db/id (:block/raw-properties block)))]
                             (mapcat
                              (fn [pair]
                                (let [property (d/entity db (:db/id (:property/pair-property pair)))
                                      property-values (get pair (:db/ident property))
                                      values (if (coll? property-values) property-values #{property-values})
                                      value-ids (when (every? map? values)
                                                  (->> (map :db/id values)
                                                       (filter (fn [id] (or (int? id) (keyword? id))))))
                                      value-blocks (when (seq value-ids)
                                                     (mapcat
                                                      (fn [id]
                                                        (let [b (d/entity db id)]
                                                          (cons (d/pull db '[*] id)
                                                                (let [ids (map :db/id (:block/raw-properties b))]
                                                                  (when (seq ids)
                                                                    (d/pull-many db '[*] ids))))))
                                                      value-ids))
                                      page (when (seq values)
                                             (when-let [page-id (:db/id (:block/page (d/entity db (:db/id (first values)))))]
                                               (d/pull db '[*] page-id)))
                                      property' (d/pull db '[*] (:db/id property))]
                                  (remove nil? (concat [page]
                                                       [property']
                                                       value-blocks
                                                       [pair]))))
                              pairs)))]
    (concat class-properties block-properties)))

(defn get-block-and-children
  [db id children?]
  (let [block (d/entity db (if (uuid? id)
                             [:block/uuid id]
                             id))
        get-children (fn [children]
                       (let [long-page? (> (count children) 500)]
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
            (assoc :children (get-children (:block/_parent block)))))
        (cond->
         {:block (->> (d/pull db '[*] (:db/id block))
                      (with-tags db)
                      mark-block-fully-loaded)
          :properties (property-with-values db block)}
          children?
          (assoc :children
                 (if (contains? (:block/type block) "whiteboard")
                   (->> (d/pull-many db '[*] (map :db/id (:block/_page block)))
                        (map #(with-block-refs db %))
                        (map mark-block-fully-loaded))
                   (get-children (:block/_page block)))))))))

(defn get-latest-journals
  [db n]
  (let [today (date-time-util/date->int (js/Date.))]
    (->>
     (d/q '[:find [(pull ?page [*]) ...]
            :in $ ?today
            :where
            [?page :block/name ?page-name]
            [?page :block/journal? true]
            [?page :block/journal-day ?journal-day]
            [(<= ?journal-day ?today)]]
          db
          today)
     (sort-by :block/journal-day)
     (reverse)
     (take n))))

(defn get-structured-blocks
  [db]
  (let [classes (d/pull-many db '[*] [:logseq.class/task :logseq.class/card])
        property-ids (->> classes
                          (mapcat :class/schema.properties)
                          (map :db/id)
                          (into #{:block/tags :block/alias}))
        properties (d/pull-many db '[*] property-ids)
        closed-values (->> (d/datoms db :avet :block/type "closed value")
                           (map :e)
                           (d/pull-many db '[*])
                           (mapcat (fn [block] (cons block (property-with-values db block))))
                           (map (fn [block]
                                  (let [val (:logseq.property/created-from-property block)]
                                    (if (keyword? (:db/id val))
                                      (assoc block :logseq.property/created-from-property {:db/id (:db/id (d/entity db (:db/id val)))})
                                      block)))))]
    (concat closed-values properties classes)))

(defn get-favorites
  "Favorites page and its blocks"
  [db]
  (let [page-id (get-first-page-by-name db common-config/favorites-page-name)
        {:keys [block children]} (get-block-and-children db page-id true)]
    (when block
      (concat [block]
              (->> (keep :block/link children)
                   (map (fn [l]
                          (d/pull db '[*] (:db/id l)))))
              children))))

(defn get-full-page-and-blocks
  [db page-name]
  (let [page-id (get-first-page-by-name db page-name)
        data (get-block-and-children db page-id true)
        result (first (tree-seq map? :children data))]
    (cons (:block result)
          (map #(dissoc % :children) (:children result)))))

(defn get-home-page
  [db files]
  (let [config (->> (some (fn [m] (when (= (:file/path m) "logseq/config.edn")
                                    (:file/content m))) files)
                    (common-util/safe-read-string {}))
        home-page (get-in config [:default-home :page])]
    (when home-page
      (get-full-page-and-blocks db (common-util/page-name-sanity-lc home-page)))))

(defn get-initial-data
  "Returns current database schema and initial data"
  [db]
  (let [schema (->> (:schema db)
                    (remove (fn [[k _v]]
                              (integer? k)))
                    (into {}))
        db-type-ident (when (d/entity db :logseq.kv/db-type)
                        (d/pull db '[*] :logseq.kv/db-type))
        graph-id-ident (let [e (d/entity db :logseq.kv/graph-uuid)
                             id (:graph/uuid e)]
                         (when id
                           {:db/id (:db/id e)
                            :db/ident :logseq.kv/graph-uuid
                            :graph/uuid id}))
        idents (remove nil? [db-type-ident graph-id-ident])
        favorites (get-favorites db)
        latest-journals (get-latest-journals db 3)
        all-files (get-all-files db)
        home-page-data (get-home-page db all-files)
        structured-blocks (get-structured-blocks db)
        data (concat idents favorites latest-journals all-files home-page-data structured-blocks)]
    {:schema schema
     :initial-data data}))

(defn restore-initial-data
  "Given initial sqlite data and schema, returns a datascript connection"
  [data schema]
  (let [conn (d/create-conn schema)]
    (d/transact! conn data)
    conn))

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
