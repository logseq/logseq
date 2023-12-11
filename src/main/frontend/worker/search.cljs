(ns frontend.worker.search
  "SQLite search"
  (:require [clojure.string :as string]
            [promesa.core :as p]
            [medley.core :as medley]
            [cljs-bean.core :as bean]))

;; TODO: remove id as :db/id can change
(defn- add-blocks-fts-triggers!
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
      (.exec db trigger))))

(defn- create-blocks-table!
  [db]
  (.exec db "CREATE TABLE IF NOT EXISTS blocks (
                        id INTEGER PRIMARY KEY,
                        uuid TEXT NOT NULL,
                        content TEXT NOT NULL,
                        page INTEGER)"))

(defn- create-blocks-fts-table!
  [db]
  (.exec db "CREATE VIRTUAL TABLE IF NOT EXISTS blocks_fts USING fts5(uuid, content, page)"))

(defn create-tables-and-triggers!
  "Open a SQLite db for search index"
  [db]
  (try
    (create-blocks-table! db)
    (create-blocks-fts-table! db)
    (add-blocks-fts-triggers! db)
    (catch :default e
      (prn "Failed to create tables and triggers")
      (js/console.error e)
      ;; FIXME:
      ;; (try
      ;;   ;; unlink db
      ;;   (catch :default e
      ;;     (js/console.error "cannot unlink search db:" e)))
      )))

(defn- clj-list->sql
  "Turn clojure list into SQL list
   '(1 2 3 4)
   ->
   \"('1','2','3','4')\""
  [ids]
  (str "(" (->> (map (fn [id] (str "'" id "'")) ids)
                (string/join ", ")) ")"))

(defn upsert-blocks!
  [^Object db blocks]
  (.transaction db (fn [tx]
                     (doseq [item blocks]
                       (.exec tx #js {:sql "INSERT INTO blocks (id, uuid, content, page) VALUES ($id, $uuid, $content, $page) ON CONFLICT (id) DO UPDATE SET (uuid, content, page) = ($uuid, $content, $page)"
                                      :bind #js {:$id (.-id item)
                                                 :$uuid (.-uuid item)
                                                 :$content (.-content item)
                                                 :$page (.-page item)}})))))

(defn delete-blocks!
  [db ids]
  (let [sql (str "DELETE from blocks WHERE id IN " (clj-list->sql ids))]
    (.exec db sql)))

(defn- search-blocks-aux
  [db sql input page limit]
  (try
    (p/let [result (if page
                     (.exec db #js {:sql sql
                                    :bind #js [input page limit]
                                    :rowMode "array"})
                     (.exec db #js {:sql sql
                                    :bind #js [input limit]
                                    :rowMode "array"}))]
      (bean/->clj result))
    (catch :default e
      (prn :debug "Search blocks failed: ")
      (js/console.error e))))

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
  (medley/distinct-by f (seq col)))

(defn search-blocks
  ":page - the page to specifically search on"
  [db q {:keys [limit page]}]
  (when-not (string/blank? q)
    (p/let [match-inputs (get-match-inputs q)
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
            results (p/all (map
                            (fn [match-input]
                              (search-blocks-aux db match-sql match-input page limit))
                            match-inputs))
            matched-result (apply concat results)
            non-match-result (search-blocks-aux db non-match-sql non-match-input page limit)
            all-result (->> (concat matched-result non-match-result)
                            (map (fn [[id uuid content page]]
                                   {:id id
                                    :uuid uuid
                                    :content content
                                    :page page})))]
      (->>
       all-result
       (distinct-by :uuid)
       (take limit)))))

(defn truncate-table!
  [db]
  (.exec db "delete from blocks")
  (.exec db "delete from blocks_fts"))
