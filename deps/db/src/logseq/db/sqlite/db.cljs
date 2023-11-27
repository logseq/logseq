(ns logseq.db.sqlite.db
  "Main entry point for using sqlite with db graphs"
  (:require ["path" :as node-path]
            ["better-sqlite3" :as sqlite3]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [logseq.db.sqlite.util :as sqlite-util]))

;; use built-in blocks to represent db schema, config, custom css, custom js, etc.

;; Store databases for db graphs
(defonce databases (atom nil))
;; Reference same sqlite default class in cljs + nbb without needing .cljc
(def sqlite (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(defn close!
  []
  (when @databases
    (doseq [[_ database] @databases]
      (.close database))
    (reset! databases nil)))

(defn sanitize-db-name
  [db-name]
  (-> db-name
      (string/replace sqlite-util/db-version-prefix "")
      (string/replace "/" "_")
      (string/replace "\\" "_")
      (string/replace ":" "_"))) ;; windows

(defn get-db
  [repo]
  (get @databases (sanitize-db-name repo)))

(defn prepare
  [^object db sql db-name]
  (when db
    (try
      (.prepare db sql)
      (catch :default e
        (js/console.error (str "SQLite prepare failed: " e ": " db-name))
        (throw e)))))

(defn create-blocks-table!
  [db db-name]
  (let [stmt (prepare db "CREATE TABLE IF NOT EXISTS blocks (
                        uuid TEXT PRIMARY KEY NOT NULL,
                        type INTEGER NOT NULL,
                        page_uuid TEXT,
                        page_journal_day INTEGER,
                        name TEXT UNIQUE,
                        content TEXT,
                        datoms TEXT,
                        created_at INTEGER NOT NULL,
                        updated_at INTEGER NOT NULL
                        )"
                      db-name)]
    (.run ^object stmt)
    (let [create-index-stmt (prepare db "CREATE INDEX IF NOT EXISTS block_type ON blocks(type)" db-name)]
      (.run ^object create-index-stmt))))

(defn get-db-full-path
  [graphs-dir db-name]
  (let [db-name' (sanitize-db-name db-name)
        graph-dir (node-path/join graphs-dir db-name')]
    [db-name' (node-path/join graph-dir "db.sqlite")]))

(defn open-db!
  [graphs-dir db-name]
  (let [[db-sanitized-name db-full-path] (get-db-full-path graphs-dir db-name)
        db (new sqlite db-full-path nil)]
    (create-blocks-table! db db-name)
    (swap! databases assoc db-sanitized-name db)))

(defn- clj-list->sql
  "Turn clojure list into SQL list
   '(1 2 3 4)
   ->
   \"('1','2','3','4')\""
  [ids]
  (str "(" (->> (map (fn [id] (str "'" id "'")) ids)
                (string/join ", ")) ")"))

(defn upsert-blocks!
  "Creates or updates given js blocks"
  [repo blocks]
  (when-let [db (get-db repo)]
    (let [insert (prepare db "INSERT INTO blocks (uuid, type, page_uuid, page_journal_day, name, content,datoms, created_at, updated_at) VALUES (@uuid, @type, @page_uuid, @page_journal_day, @name, @content, @datoms, @created_at, @updated_at) ON CONFLICT (uuid) DO UPDATE SET (type, page_uuid, page_journal_day, name, content, datoms, created_at, updated_at) = (@type, @page_uuid, @page_journal_day, @name, @content, @datoms, @created_at, @updated_at)"
                          repo)
          insert-many (.transaction ^object db
                                    (fn [blocks]
                                      (doseq [block blocks]
                                        (.run ^object insert block))))]
      (insert-many blocks))))

(defn delete-blocks!
  [repo uuids]
  (when-let [db (get-db repo)]
    (let [sql (str "DELETE from blocks WHERE uuid IN " (clj-list->sql uuids))
          stmt (prepare db sql repo)]
      (.run ^object stmt))))


;; Initial data:
;; All pages and block ids
;; latest 3 journals
;; other data such as config.edn, custom css/js
;; current page, sidebar blocks

(defn query
  [repo db sql]
  (let [stmt (prepare db sql repo)]
    (.all ^object stmt)))

(defn get-initial-data
  [repo]
  (when-let [db (get-db repo)]
    (let [all-pages (query repo db "select * from blocks where type = 2") ; 2 = page block
          ;; 1 = normal block
          all-block-ids (query repo db "select uuid, page_uuid from blocks where type = 1")
          ;; Load enough data so that journals view is functional
          ;; 3 is arbitrary and assumes about 10 blocks per page
          recent-journals (->> (query repo db "select uuid from blocks where type = 2 order by page_journal_day desc limit 3")
                               bean/->clj
                               (map :uuid))
          latest-journal-blocks (when (seq recent-journals)
                                  (query repo db (str "select * from blocks where type = 1 and page_uuid IN " (clj-list->sql recent-journals))))
          init-data (query repo db "select * from blocks where type in (3, 4, 5, 6, 7)")]
      {:all-pages all-pages
       :all-blocks all-block-ids
       :journal-blocks latest-journal-blocks
       :init-data init-data})))

(defn get-other-data
  [repo journal-block-uuids]
  (when-let [db (get-db repo)]
    (query repo db (str "select * from blocks where type = 1 and uuid not in "
                        (clj-list->sql journal-block-uuids)))))
