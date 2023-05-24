(ns electron.db
  "SQLite db"
  (:require ["path" :as node-path]
            ["fs-extra" :as fs]
            ["better-sqlite3" :as sqlite3]
            [clojure.string :as string]
            ["electron" :refer [app]]
            [electron.logger :as logger]
            [medley.core :as medley]
            [electron.utils :as utils]
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
      (string/replace "/" "_")
      (string/replace "\\" "_")
      (string/replace ":" "_"))) ;; windows

(defn get-db
  [repo]
  (get @databases (sanitize-db-name repo)))

(declare delete-db!)

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
                        id INTEGER PRIMARY KEY,
                        page INTEGER,
                        name TEXT,
                        uuid TEXT NOT NULL,
                        content TEXT,
                        datoms TEXT,
                        journal_day INTEGER,
                        core_data INTEGER,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
                        )"
                      db-name)]
    (.run ^object stmt)))

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
  (let [db-name (sanitize-db-name db-name)
        dir (get-graphs-dir)]
    [db-name (node-path/join dir db-name)]))

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
    (let [insert (prepare db "INSERT INTO blocks (id, page, name, uuid, content, datoms, journal_day, core_data, created_at, updated_at) VALUES (@id, @page, @name, @uuid, @content, @datoms, @journal_day, @core_data, @created_at, @updated_at) ON CONFLICT (id) DO UPDATE SET (page, name, uuid, content, datoms, journal_day, core_data, created_at, updated_at) = (@page, @name, @uuid, @content, @datoms, @journal_day, @core_data, @created_at, @updated_at)" repo)
          insert-many (.transaction ^object db
                                    (fn [blocks]
                                      (doseq [block blocks]
                                        (.run ^object insert block))))]
      (insert-many blocks))
    (do
      (open-db! repo)
      (upsert-blocks! repo blocks))))

(defn delete-blocks!
  [repo ids]
  (when-let [db (get-db repo)]
    (let [sql (str "DELETE from blocks WHERE id IN " (clj-list->sql ids))
          stmt (prepare db sql repo)]
      (.run ^object stmt))))


;; Initial data:
;; All pages and block ids
;; latest 3 journals
;; core data such as config, custom css/js
;; current page, sidebar blocks

(defn- query
  [repo db sql]
  (let [stmt (prepare db sql repo)]
    (.all ^object stmt)))

(defn get-initial-data
  [repo]
  (when-let [db (get-db repo)]
    (let [all-pages (query repo db "select * from blocks where name is not null")
          all-block-ids (query repo db "select id, uuid, page from blocks where name is null and uuid is not null and page is not null")
          recent-journal (some-> (query repo db "select id from blocks order by journal_day desc limit 1")
                                 first
                                 bean/->clj
                                 :id)
          latest-journal-blocks (when recent-journal
                                  (query repo db (str "select * from blocks where page = " recent-journal)))]
      {:all-pages all-pages
       :all-blocks all-block-ids
       :journal-blocks latest-journal-blocks})))

(defn get-other-data
  [repo journal-block-ids]
  (when-let [db (get-db repo)]
    (if (seq journal-block-ids)
      (query repo db
        (str "select * from blocks where name is null and id not in "
             (clj-list->sql journal-block-ids)))
      (query repo db "select * from blocks where name is null"))))
