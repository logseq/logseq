(ns electron.db
  "SQLite db"
  (:require ["path" :as node-path]
            ["fs-extra" :as fs]
            ["better-sqlite3" :as sqlite3]
            [clojure.string :as string]
            ["electron" :refer [app]]
            [electron.logger :as logger]
            [cljs-bean.core :as bean]))

;; use built-in blocks to represent db schema, config, custom css, custom js, etc.

(defonce databases (atom nil))

(defn close!
  []
  (when @databases
    (doseq [[_ database] @databases]
      (.close database))
    (reset! databases nil)))

(defn sanitize-db-name
  [db-name]
  (-> db-name
      (string/replace "logseq_db_" "")
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
        (logger/error (str "SQLite prepare failed: " e ": " db-name))
        (throw e)))))

(defn create-blocks-table!
  [db db-name]
  (let [stmt (prepare db "CREATE TABLE IF NOT EXISTS blocks (
                        uuid TEXT PRIMARY KEY,
                        type INTEGER,
                        page_uuid TEXT,
                        page_journal_day INTEGER,
                        name TEXT,
                        content TEXT,
                        datoms TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
                        )"
                      db-name)]
    (.run ^object stmt)
    (let [create-index-stmt (prepare db "CREATE INDEX IF NOT EXISTS block_type ON blocks(type)" db-name)]
      (.run ^object create-index-stmt))))

;; ~/logseq
(defn get-graphs-dir
  []
  (let [path (.getPath ^object app "home")]
    (node-path/join path "logseq" "graphs")))

(defn ensure-graphs-dir!
  []
  (fs/ensureDirSync (get-graphs-dir)))

(defn get-db-full-path
  [db-name]
  (let [db-name' (sanitize-db-name db-name)
        dir (get-graphs-dir)
        graph-dir (node-path/join dir db-name')]
    (fs/ensureDirSync graph-dir)
    [db-name' (node-path/join graph-dir "db.sqlite")]))

(defn open-db!
  [db-name]
  (let [[db-sanitized-name db-full-path] (get-db-full-path db-name)]
    (try (let [db (sqlite3 db-full-path nil)]
           (create-blocks-table! db db-name)
           (swap! databases assoc db-sanitized-name db))
         (catch :default e
           (logger/error (str e ": " db-name))
           ;; (fs/unlinkSync db-full-path)
           ))))

(defn- clj-list->sql
  "Turn clojure list into SQL list
   '(1 2 3 4)
   ->
   \"('1','2','3','4')\""
  [ids]
  (str "(" (->> (map (fn [id] (str "'" id "'")) ids)
                (string/join ", ")) ")"))

(defn upsert-blocks!
  [repo blocks]
  (if-let [db (get-db repo)]
    (let [insert (prepare db "INSERT INTO blocks (uuid, type, page_uuid, page_journal_day, name, content,datoms, created_at, updated_at) VALUES (@uuid, @type, @page_uuid, @page_journal_day, @name, @content, @datoms, @created_at, @updated_at) ON CONFLICT (uuid) DO UPDATE SET (type, page_uuid, page_journal_day, name, content, datoms, created_at, updated_at) = (@type, @page_uuid, @page_journal_day, @name, @content, @datoms, @created_at, @updated_at)"
                          repo)
          insert-many (.transaction ^object db
                                    (fn [blocks]
                                      (doseq [block blocks]
                                        (.run ^object insert block))))]
      (insert-many blocks))
    (do
      (open-db! repo)
      (upsert-blocks! repo blocks))))

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

(defn- query
  [repo db sql]
  (let [stmt (prepare db sql repo)]
    (.all ^object stmt)))

(defn get-initial-data
  [repo]
  (when-let [db (get-db repo)]
    (let [all-pages (query repo db "select * from blocks where type = 2") ; 2 = page block
          ;; 1 = normal block
          all-block-ids (query repo db "select uuid, page_uuid from blocks where type = 1")
          recent-journal (some-> (query repo db "select uuid from blocks where type = 2 order by page_journal_day desc limit 1")
                                 first
                                 bean/->clj
                                 :uuid)
          latest-journal-blocks (when recent-journal
                                  (query repo db (str "select * from blocks where type = 1 and page_uuid = '" recent-journal "'")))
          init-data (query repo db "select * from blocks where type in (3, 4, 5, 6)")]
      {:all-pages all-pages
       :all-blocks all-block-ids
       :journal-blocks latest-journal-blocks
       :init-data init-data})))

(defn get-other-data
  [repo journal-block-uuids]
  (when-let [db (get-db repo)]
    (query repo db (str "select * from blocks where type = 1 and uuid not in "
                        (clj-list->sql journal-block-uuids)))))

(defn unlink-graph!
  [repo]
  (let [db-name (sanitize-db-name repo)
        path (node-path/join (get-graphs-dir) db-name)
        unlinked (node-path/join (get-graphs-dir) "Unlinked graphs")
        new-path (node-path/join unlinked db-name)]
    (when (fs/existsSync path)
      (fs/ensureDirSync unlinked)
      (fs/moveSync path new-path))))
