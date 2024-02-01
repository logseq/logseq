(ns logseq.db.sqlite.common-db
  "Common sqlite db fns for browser and node"
  (:require [datascript.core :as d]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.db.sqlite.util :as sqlite-util]
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

(defn get-all-files
  [db]
  (->> (d/datoms db :avet :file/path)
       (map (fn [e]
              {:db/id (:e e)
               :file/path (:v e)
               :file/content (:file/content (d/entity db (:e e)))}))))

(defn- get-block-with-refs
  [db block]
  (update block :block/refs (fn [refs]
                               (map (fn [ref]
                                      (let [e (d/entity db (:db/id ref))]
                                        (if (and e (:block/name e))
                                          (assoc ref
                                                 :block/uuid (:block/uuid e)
                                                 :block/original-name (:block/name e)
                                                 :block/name (:block/name e))
                                          ref))) refs))))

(defn get-block-and-children
  [db name children?]
  (let [get-children (fn [col]
                       (map (fn [e]
                              (select-keys e [:db/id :block/uuid :block/page :block/left :block/parent :block/collapsed?]))
                            col))
        uuid? (common-util/uuid-string? name)
        block (when uuid?
                (let [id (uuid name)]
                  (d/entity db [:block/uuid id])))]
    (if (and block (not (:block/name block))) ; not a page
      (let [block' (d/pull db '[*] (:db/id block))
            block-with-refs (get-block-with-refs db block')]
        (cond->
         {:block block-with-refs}
          children?
          (assoc :children (get-children (:block/_parent block)))))
      (when-let [block (or block (d/entity db [:block/name name]))]
        (cond->
         {:block (d/pull db '[*] (:db/id block))}
          children?
          (assoc :children
                 (if (contains? (:block/type block) "whiteboard")
                   (d/pull-many db '[*] (map :db/id (:block/_page block)))
                   (get-children (:block/_page block)))))))))

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
  (let [all-pages (get-all-pages db)
        all-files (get-all-files db)]
    (concat all-pages all-files)))

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
