(ns logseq.db.sqlite.common-db
  "Common sqlite db fns for browser and node"
  (:require [datascript.core :as d]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]))

(comment
  (defn- get-built-in-files
    [db]
    (let [files ["logseq/config.edn"
                 "logseq/custom.css"
                 "logseq/custom.js"]]
      (map #(d/pull db '[*] [:file/path %]) files))))

(defn get-all-pages
  [db]
  (->> (d/datoms db :avet :block/name)
       (map (fn [e]
              (d/pull db '[*] (:e e))))))

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

(defn get-block-and-children
  [db name children?]
  (let [uuid? (common-util/uuid-string? name)
        block (when uuid?
                (let [id (uuid name)]
                  (d/entity db [:block/uuid id])))
        get-children (fn [children]
                       (let [long-page? (> (count children) 500)]
                         (if long-page?
                           (map (fn [e]
                                  (select-keys e [:db/id :block/uuid :block/page :block/left :block/parent :block/collapsed?]))
                                children)
                           (->> (d/pull-many db '[*] (map :db/id children))
                                (map #(with-block-refs db %))
                                (map mark-block-fully-loaded)))))]
    (if (and block (not (:block/name block))) ; not a page
      (let [block' (->> (d/pull db '[*] (:db/id block))
                        (with-parent-and-left db)
                        (with-block-refs db)
                        mark-block-fully-loaded)]
        (cond->
         {:block block'}
          children?
          (assoc :children (get-children (:block/_parent block)))))
      (when-let [block (or block (d/entity db [:block/name name]))]
        (cond->
         {:block (->> (d/pull db '[*] (:db/id block))
                      (with-tags db)
                      mark-block-fully-loaded)}
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
  (let [special-pages (map #(d/pull db '[*] %) #{:logseq.property/tags})
        structured-blocks (->> (d/datoms db :avet :block/type)
                               (keep (fn [e]
                                       (when (contains? #{"closed value" "property" "class"} (:v e))
                                         (d/pull db '[*] (:e e))))))]
    (concat special-pages structured-blocks)))

(defn get-favorites
  "Favorites page and its blocks"
  [db]
  (let [{:keys [block children]} (get-block-and-children db common-config/favorites-page-name true)]
    (when block
      (concat [block]
              (->> (keep :block/link children)
                   (map (fn [l]
                          (d/pull db '[*] (:db/id l)))))
              children))))

(defn get-full-page-and-blocks
  [db page-name]
  (let [data (get-block-and-children db (common-util/page-name-sanity-lc page-name) true)
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
  (let [schema (:schema db)
        idents (remove nil?
                       (let [e (d/entity db :logseq.kv/graph-uuid)
                             id (:graph/uuid e)]
                         (when id
                           [{:db/id (:db/id e)
                             :db/ident :logseq.kv/graph-uuid
                             :graph/uuid id}
                            {:db/ident :logseq.kv/tx-batch-counter
                             :editor/counter 0}])))
        favorites (get-favorites db)
        latest-journals (get-latest-journals db 3)
        all-files (get-all-files db)
        home-page-data (get-home-page db all-files)
        structured-blocks (get-structured-blocks db)]
    {:schema schema
     :initial-data (concat idents favorites latest-journals all-files home-page-data structured-blocks)}))

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
