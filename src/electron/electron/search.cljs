(ns electron.search
  (:require ["path" :as path]
            ["fs-extra" :as fs]
            ["better-sqlite3" :as sqlite3]
            [clojure.string :as string]
            ["electron" :refer [app]]
            [electron.logger :as logger]))

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
  (let [db-name (sanitize-db-name db-name)
        search-dir (get-search-dir)]
    [db-name (path/join search-dir db-name)]))

(defn get-db-path
  "Search cache paths"
  [db-name]
  (let [db-name (sanitize-db-name db-name)
        search-dir (get-search-dir)]
    [db-name (path/join search-dir db-name)]))

(defn open-db!
  [db-name]
    (let [[db-sanitized-name db-full-path] (get-db-full-path db-name)]
      (try (let [db (sqlite3 db-full-path nil)]
             (create-blocks-table! db)
             (create-blocks-fts-table! db)
             (add-triggers! db)
             (swap! databases assoc db-sanitized-name db))
           (catch :default e
             (logger/error (str e ": " db-name))
             (fs/unlinkSync db-full-path)))))

(defn open-dbs!
  []
  (let [search-dir (get-search-dir)
        dbs (fs/readdirSync search-dir)
        dbs (remove (fn [file-name] (.startsWith file-name ".")) dbs)]
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

(defn- search-blocks-aux
  [database sql input page limit]
  (let [stmt (prepare database sql)]
    (js->clj
     (if page
       (.all ^object stmt (int page) input limit)
       (.all ^object stmt  input limit))
     :keywordize-keys true)))

(defn search-blocks
  [repo q {:keys [limit page]}]
  (when-let [database (get-db repo)]
    (when-not (string/blank? q)
      (let [match-input (-> q
                            (string/replace " and " " AND ")
                            (string/replace " & " " AND ")
                            (string/replace " or " " OR ")
                            (string/replace " | " " OR ")
                            (string/replace " not " " NOT "))
            match-input (if (not= q match-input)
                          (string/replace match-input "," "")
                          (str "\"" match-input "\""))
            non-match-input (str "%" (string/replace q #"\s+" "%") "%")
            limit  (or limit 20)
            select "select rowid, uuid, content, page from blocks_fts where "
            pg-sql (if page "page = ? and" "")
            match-sql (str select
                           pg-sql
                           " content match ? order by rank limit ?")
            non-match-sql (str select
                               pg-sql
                               " content like ? limit ?")]
        (->>
         (concat
          (search-blocks-aux database match-sql match-input page limit)
          (search-blocks-aux database non-match-sql non-match-input page limit))
         (distinct)
         (take limit)
         (vec))))))

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
    (let [[db-name db-full-path] (get-db-path repo)]
      (logger/info "Delete search indice: " db-full-path)
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
  (delete-db! repo))
