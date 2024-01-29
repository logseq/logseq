(ns logseq.db.sqlite.common-db
  "Common sqlite db fns for browser and node"
  (:require [datascript.core :as d]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db :as ldb]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util :as common-util]))

(defn- get-built-in-files
  [db]
  (let [files ["logseq/config.edn"
               "logseq/custom.css"
               "logseq/custom.js"]]
    (map #(d/pull db '[*] [:file/path %]) files)))

(defn get-all-pages
  [db]
  (->> (d/datoms db :avet :block/name)
       (map (fn [e]
              (d/pull db '[*] (:e e))))))

(defn get-block-and-children
  [db name children?]
  (let [get-children (fn [col]
                       (map (fn [e]
                              (select-keys e [:db/id :block/uuid :block/page :block/left :block/parent]))
                            col))]
    (if (common-util/uuid-string? name)   ; block
      (let [id (uuid name)
            block (d/entity db [:block/uuid id])]
        (when block
          (let [result {:block (d/pull db '[*] (:db/id block))}]
            (if children?
              (let [children (->> (ldb/get-block-children-ids db id)
                                  (map #(d/entity db [:block/uuid %])))]
                (assoc result :children (get-children children)))
              result))
          (cond->
           {:block (d/pull db '[*] (:db/id block))}
            children?
            (assoc :children (get-children (:block/_parent block))))))
      (when-let [block (d/entity db [:block/name name])]
        (cond->
         {:block (d/pull db '[*] (:db/id block))}
          children?
          (assoc :children (get-children (:block/_page block))))))))

(defn get-latest-journals
  [db n]
  (let [date (js/Date.)
        _ (.setDate date (- (.getDate date) (dec n)))
        today (date-time-util/date->int (js/Date.))]
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

;; built-in files + latest journals + favorites
(defn get-initial-data
  "Returns initial data"
  [db]
  (let [files (get-built-in-files db)
        journals (get-latest-journals db 3)]
    (concat files journals)))

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
