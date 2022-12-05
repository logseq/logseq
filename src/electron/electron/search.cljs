(ns electron.search
  "Provides both page level and block level index"
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

(defn add-blocks-fts-triggers!
  "Table bindings of blocks tables and the blocks FTS virtual tables"
  [db]
  (let [triggers [;; add
                  "CREATE TRIGGER IF NOT EXISTS blocks_ad AFTER DELETE ON blocks
                  BEGIN
                      DELETE from blocks_fts where rowid = old.id;
                  END;"
                  ;; insert
                  "CREATE TRIGGER IF NOT EXISTS blocks_ai AFTER INSERT ON blocks
                  BEGIN
                      INSERT INTO blocks_fts (rowid, uuid, content, page)
                      VALUES (new.id, new.uuid, new.content, new.page);
                  END;"
                  ;; update
                  "CREATE TRIGGER IF NOT EXISTS blocks_au AFTER UPDATE ON blocks
                  BEGIN
                      DELETE from blocks_fts where rowid = old.id;
                      INSERT INTO blocks_fts (rowid, uuid, content, page)
                      VALUES (new.id, new.uuid, new.content, new.page);
                  END;"]]
    (doseq [trigger triggers]
      (let [stmt (prepare db trigger)]
        (.run ^object stmt)))))

(defn add-pages-fts-triggers!
  "Table bindings of pages tables and the pages FTS virtual tables"
  [db]
  (let [triggers [;; add
                  "CREATE TRIGGER IF NOT EXISTS pages_ad AFTER DELETE ON pages
                  BEGIN
                      DELETE from pages_fts where rowid = old.id;
                  END;"
                  ;; insert
                  "CREATE TRIGGER IF NOT EXISTS pages_ai AFTER INSERT ON pages
                  BEGIN
                      INSERT INTO pages_fts (rowid, uuid, content)
                      VALUES (new.id, new.uuid, new.content);
                  END;"
                  ;; update
                  "CREATE TRIGGER IF NOT EXISTS pages_au AFTER UPDATE ON pages
                  BEGIN
                      DELETE from pages_fts where rowid = old.id;
                      INSERT INTO pages_fts (rowid, uuid, content)
                      VALUES (new.id, new.uuid, new.content);
                  END;"]]
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

(defn create-pages-table!
  [db]
  (let [stmt (prepare db "CREATE TABLE IF NOT EXISTS pages (
                        id INTEGER PRIMARY KEY,
                        uuid TEXT NOT NULL,
                        content TEXT NOT NULL)")]
    (.run ^object stmt)))

(defn create-pages-fts-table!
  [db]
  (let [stmt (prepare db "CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(uuid, content)")]
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
             (create-pages-table! db)
             (create-pages-fts-table! db)
             (add-blocks-fts-triggers! db)
             (add-pages-fts-triggers! db)
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

(defn- clj-list->sql
  "Turn clojure list into SQL list
   '(1 2 3 4)
   ->
   \"('1','2','3','4')\""
  [ids]
  (str "(" (->> (map (fn [id] (str "'" id "'")) ids)
                (string/join ", ")) ")"))

(defn upsert-pages!
  [repo pages]
  (if-let [db (get-db repo)]
    ;; TODO: what if a CONFLICT on uuid
    (let [insert (prepare db "INSERT INTO pages (id, uuid, content) VALUES (@id, @uuid, @content) ON CONFLICT (id) DO UPDATE SET content = @content")
          insert-many (.transaction ^object db
                                    (fn [pages]
                                      (doseq [page pages]
                                        (.run ^object insert page))))]
      (insert-many pages))
    (do
      (open-db! repo)
      (upsert-pages! repo pages))))

(defn delete-pages!
  [repo ids]
  (when-let [db (get-db repo)]
    (let [sql (str "DELETE from pages WHERE id IN " (clj-list->sql ids))
          stmt (prepare db sql)]
      (.run ^object stmt))))

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
    (let [sql (str "DELETE from blocks WHERE id IN " (clj-list->sql ids))
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
  (try
    (let [stmt (prepare database sql)]
      (js->clj
       (if page
         (.all ^object stmt (int page) input limit)
         (.all ^object stmt  input limit))
       :keywordize-keys true))
    (catch :default e
      (logger/error "Search blocks failed: " (str e)))))

(defn- get-match-inputs
  [q]
  (let [match-input (-> q
                        (string/replace " and " " AND ")
                        (string/replace " & " " AND ")
                        (string/replace " or " " OR ")
                        (string/replace " | " " OR ")
                        (string/replace " not " " NOT "))]
    (if (not= q match-input)
      [(string/replace match-input "," "")]
      [q
       (str "\"" match-input "\"")])))

(defn distinct-by
  [f col]
  (reduce
   (fn [acc x]
     (if (some #(= (f x) (f %)) acc)
       acc
       (vec (conj acc x))))
   []
   col))

(defn search-blocks
  ":page - the page to specificly search on"
  [repo q {:keys [limit page]}]
  (when-let [database (get-db repo)]
    (when-not (string/blank? q)
      (let [match-inputs (get-match-inputs q)
            non-match-input (str "%" (string/replace q #"\s+" "%") "%")
            limit  (or limit 20)
            select "select rowid, uuid, content, page from blocks_fts where "
            pg-sql (if page "page = ? and" "")
            match-sql (str select
                           pg-sql
                           " content match ? order by rank limit ?")
            non-match-sql (str select
                               pg-sql
                               " content like ? limit ?")
            matched-result (->>
                            (map
                              (fn [match-input]
                                (search-blocks-aux database match-sql match-input page limit))
                              match-inputs)
                            (apply concat))]
        (->>
         (concat matched-result
                 (search-blocks-aux database non-match-sql non-match-input page limit))
         (distinct-by :rowid)
         (take limit)
         (vec))))))

(defn- snippet-by
  [content length]
  (str (subs content 0 length) (when (> (count content) 250) "...")))

(defn- search-pages-res-unpack
  [arr]
  (let [[rowid uuid content snippet] arr]
    {:id      rowid
     :uuid    uuid
     :content content
     ;; post processing
     :snippet (let [;; Remove title from snippet
                    flag-title " $<pfts_f6ld$ "
                    flag-title-pos (string/index-of snippet flag-title)
                    snippet (if flag-title-pos
                              (subs snippet (+ flag-title-pos (count flag-title)))
                              snippet)
                    ;; Cut snippet to 250 chars for non-matched results
                    flag-highlight "$pfts_2lqh>$ "
                    snippet (if (string/includes? snippet flag-highlight)
                              snippet
                              (snippet-by snippet 250))]
                snippet)}))

(defn- search-pages-aux
  [database sql input limit]
  (let [stmt (prepare database sql)]
    (try
      (doall
       (map search-pages-res-unpack (-> (.raw ^object stmt)
                                        (.all input limit)
                                        (js->clj))))
      (catch :default e
        (logger/error "Search page failed: " (str e))))))

(defn search-pages
  [repo q {:keys [limit]}]
  (when-let [database (get-db repo)]
    (when-not (string/blank? q)
      (let [match-inputs (get-match-inputs q)
            non-match-input (str "%" (string/replace q #"\s+" "%") "%")
            limit  (or limit 20)
            ;; https://www.sqlite.org/fts5.html#the_highlight_function
            ;; the 2nd column in pages_fts (content)
            ;; pfts_2lqh is a key for retrieval
            ;; highlight and snippet only works for some matching with high rank
            snippet-aux "snippet(pages_fts, 1, ' $pfts_2lqh>$ ', ' $<pfts_2lqh$ ', '...', 32)"
            select (str "select rowid, uuid, content, " snippet-aux " from pages_fts where ")
            match-sql (str select
                           " content match ? order by rank limit ?")
            non-match-sql (str select
                               " content like ? limit ?")
            matched-result (->>
                            (map
                              (fn [match-input]
                                (search-pages-aux database match-sql match-input limit))
                              match-inputs)
                            (apply concat))]
        (->>
         (concat matched-result
                 (search-pages-aux database non-match-sql non-match-input limit))
         (distinct-by :id)
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

(defn truncate-pages-table!
  [repo]
  (when-let [database (get-db repo)]
    (let [stmt (prepare database
                        "delete from pages;")
          _ (.run ^object stmt)
          stmt (prepare database
                        "delete from pages_fts;")]
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
