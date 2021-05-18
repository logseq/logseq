(ns electron.search
  (:require ["path" :as path]
            ["fs-extra" :as fs]
            ["better-sqlite3" :as sqlite3]
            [clojure.string :as string]
            [electron.utils :refer [logger] :as utils]
            ["electron" :refer [app]]))

(def error (partial (.-error logger) "[Search]"))

(defonce databases (atom nil))

(defn close!
  []
  (when @databases
    (doseq [[_ database] @databases]
      (.close database))
    (reset! databases nil)))

(defn normalize-db-name
  [db-name]
  (-> db-name
      (string/replace "/" "_")
      (string/replace "\\" "_")))

(defn get-db
  [repo]
  (get @databases (normalize-db-name repo)))

(defn prepare
  [^object db sql]
  (when db
    (.prepare db sql)))

(defn add-triggers!
  [db]
  (let [triggers ["CREATE TRIGGER IF NOT EXISTS blocks_ad AFTER DELETE ON blocks
    BEGIN
        DELETE from blocks_fts where rowid = old.id;
    END;"
                  "CREATE TRIGGER IF NOT EXISTS blocks_ai AFTER INSERT ON blocks
    BEGIN
        INSERT INTO blocks_fts (rowid, uuid, content, page)
        VALUES (new.id, new.uuid, new.content, new.page);
    END;
"
                  "CREATE TRIGGER IF NOT EXISTS blocks_au AFTER UPDATE ON blocks
    BEGIN
        DELETE from blocks_fts where rowid = old.id;
        INSERT INTO blocks_fts (rowid, uuid, content, page)
        VALUES (new.id, new.uuid, new.content, new.page);
    END;"
                  ]]
    (doseq [trigger triggers]
     (let [stmt (prepare db trigger)]
       (.run ^object stmt)))))

(defn create-blocks-table!
  [db]
  (let [stmt (prepare db "CREATE TABLE IF NOT EXISTS blocks (
                        id INTEGER PRIMARY KEY,
                        uuid TEXT NOT NULL,
                        content TEXT NOT NULL,
                        page INTEGER)")]
    (.run ^object stmt)))

(defn create-blocks-fts-table!
  [db]
  (let [stmt (prepare db "CREATE VIRTUAL TABLE IF NOT EXISTS blocks_fts USING fts5(uuid, content, page)")]
    (.run ^object stmt)))

(defn get-search-dir
  []
  (let [path (.getPath ^object app "userData")]
    (path/join path "search")))

(defn ensure-search-dir!
  []
  (fs/ensureDirSync (get-search-dir)))

(defn get-db-full-path
  [db-name]
  (let [db-name (normalize-db-name db-name)
        search-dir (get-search-dir)]
    [db-name (path/join search-dir db-name)]))

(defn open-db!
  [db-name]
  (let [[db-name db-full-path] (get-db-full-path db-name)
        db (sqlite3 db-full-path nil)
        _ (create-blocks-table! db)
        _ (create-blocks-fts-table! db)
        _ (add-triggers! db)
        ]
    (swap! databases assoc db-name db)))

(defn open-dbs!
  []
  (let [search-dir (get-search-dir)
        dbs (fs/readdirSync search-dir)]
    (when (seq dbs)
      (doseq [db-name dbs]
        (open-db! db-name)))))

(defn upsert-blocks!
  [repo blocks]
  (if-let [db (get-db repo)]
    ;; TODO: what if a CONFLICT on uuid
    (let [insert (prepare db "INSERT INTO blocks (id, uuid, content, page) VALUES (@id, @uuid, @content, @page) ON CONFLICT (id) DO UPDATE SET content = @content")
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
    (let [ids (->> (map (fn [id] (str "'" id "'")) ids)
               (string/join ", "))
          sql (str "DELETE from blocks WHERE id IN (" ids ")")
          stmt (prepare db sql)]
      (.run ^object stmt))))

;; (defn search-blocks-fts
;;   [q]
;;   (when-not (string/blank? q)
;;     (let [stmt (prepare @database
;;                          "select id, uuid, content from blocks_fts where content match ? ORDER BY rank")]
;;       (js->clj (.all ^object stmt q) :keywordize-keys true))))

(defn search-blocks
  [repo q {:keys [limit page]}]
  (when-let [database (get-db repo)]
    (when-not (string/blank? q)
      (let [match? (or
                    (string/includes? q " and ")
                    (string/includes? q " & ")
                    (string/includes? q " or ")
                    (string/includes? q " | ")
                    ;; (string/includes? q " not ")
                    )
            input  (if match?
                         (-> q
                             (string/replace " and " " AND ")
                             (string/replace " & " " AND ")
                             (string/replace " or " " OR ")
                             (string/replace " | " " OR ")
                             (string/replace " not " " NOT "))
                         (str "%" (string/replace q #"\s+" "%") "%"))
            limit  (or limit 20)
            select "select rowid, uuid, content, page from blocks_fts where "
            pg-sql (if page "page = ? and" "")
            sql    (if match?
                     (str select
                          pg-sql
                          " content match ? order by rank limit ?")
                     (str select
                          pg-sql
                          " content like ? limit ?"))
            stmt   (prepare database sql)]
        (js->clj
         (if page
           (.all ^object stmt (int page) input limit)
           (.all ^object stmt  input limit))
          :keywordize-keys true)))))

(defn truncate-blocks-table!
  [repo]
  (when-let [database (get-db repo)]
    (let [stmt (prepare database
                        "delete from blocks;")
          _ (.run ^object stmt)
          stmt (prepare database
                        "delete from blocks_fts;")]
      (.run ^object stmt))))

(defn delete-db!
  [repo]
  (when-let [database (get-db repo)]
    (.close database)
    (let [[db-name db-full-path] (get-db-full-path repo)]
      (println "Delete search indice: " db-full-path)
      (fs/unlinkSync db-full-path)
      (swap! databases dissoc db-name))))

(defn query
  [repo sql]
  (when-let [database (get-db repo)]
    (let [stmt (prepare database sql)]
      (.all ^object stmt))))

(comment
  (def repo (first (keys @databases)))
  (query repo
    "select * from blocks_fts")

  (delete-db! repo)
  )
