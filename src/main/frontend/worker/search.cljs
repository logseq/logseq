(ns frontend.worker.search
  "SQLite search"
  (:require [clojure.string :as string]
            [promesa.core :as p]
            [medley.core :as medley]
            [cljs-bean.core :as bean]))

(defn- add-blocks-fts-triggers!
  "Table bindings of blocks tables and the blocks FTS virtual tables"
  [db]
  (let [triggers [;; add
                  "CREATE TRIGGER IF NOT EXISTS blocks_ad AFTER DELETE ON blocks
                  BEGIN
                      DELETE from blocks_fts where id = old.id;
                  END;"
                  ;; insert
                  "CREATE TRIGGER IF NOT EXISTS blocks_ai AFTER INSERT ON blocks
                  BEGIN
                      INSERT INTO blocks_fts (id, content, page)
                      VALUES (new.id, new.content, new.page);
                  END;"
                  ;; update
                  "CREATE TRIGGER IF NOT EXISTS blocks_au AFTER UPDATE ON blocks
                  BEGIN
                      DELETE from blocks_fts where id = old.id;
                      INSERT INTO blocks_fts (id, content, page)
                      VALUES (new.id, new.content, new.page);
                  END;"]]
    (doseq [trigger triggers]
      (.exec db trigger))))

(defn- create-blocks-table!
  [db]
  ;; id -> block uuid, page -> page uuid
  (.exec db "CREATE TABLE IF NOT EXISTS blocks (
                        id TEXT NOT NULL PRIMARY KEY,
                        content TEXT NOT NULL,
                        page TEXT)"))

(defn- create-blocks-fts-table!
  [db]
  (.exec db "CREATE VIRTUAL TABLE IF NOT EXISTS blocks_fts USING fts5(id, content, page)"))

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
                       (.exec tx #js {:sql "INSERT INTO blocks (id, content, page) VALUES ($id, $content, $page) ON CONFLICT (id) DO UPDATE SET (content, page) = ($content, $page)"
                                      :bind #js {:$id (.-id item)
                                                 :$content (.-content item)
                                                 :$page (.-page item)}})))))

(defn delete-blocks!
  [db ids]
  (let [sql (str "DELETE from blocks WHERE id IN " (clj-list->sql ids))]
    (.exec db sql)))

(defonce max-snippet-length 250)

(defn- snippet-by
  [content length]
  (str (subs content 0 length) (when (> (count content) max-snippet-length) "...")))

(defn- get-snippet-result
  [snippet]
  (let [;; Cut snippet to limited size chars for non-matched results
        flag-highlight "$pfts_2lqh>$ "
        snippet (if (string/includes? snippet flag-highlight)
                  snippet
                  (snippet-by snippet max-snippet-length))]
    snippet))

(defn- search-blocks-aux
  [db sql input page limit]
  (try
    (p/let [result (if page
                     (.exec db #js {:sql sql
                                    :bind #js [input page limit]
                                    :rowMode "array"})
                     (.exec db #js {:sql sql
                                    :bind #js [input limit]
                                    :rowMode "array"}))
            blocks (bean/->clj result)]
      (map (fn [block]
             (update block 3 get-snippet-result)) blocks))
    (catch :default e
      (prn :debug "Search blocks failed: ")
      (js/console.error e))))

(defn- get-match-input
  [q]
  (let [match-input (-> q
                        (string/replace " and " " AND ")
                        (string/replace " & " " AND ")
                        (string/replace " or " " OR ")
                        (string/replace " | " " OR ")
                        (string/replace " not " " NOT "))]
    (if (not= q match-input)
      (string/replace match-input "," "")
      (str "\"" match-input "\""))))

(defn distinct-by
  [f col]
  (medley/distinct-by f (seq col)))

(defn search-blocks
  ":page - the page to specifically search on"
  [db q {:keys [limit page]}]
  (when-not (string/blank? q)
    (p/let [match-input (get-match-input q)
            non-match-input (str "%" (string/replace q #"\s+" "%") "%")
            limit  (or limit 20)
            ;; https://www.sqlite.org/fts5.html#the_highlight_function
            ;; the 2nd column in blocks_fts (content)
            ;; pfts_2lqh is a key for retrieval
            ;; highlight and snippet only works for some matching with high rank
            snippet-aux "snippet(blocks_fts, 1, ' $pfts_2lqh>$ ', ' $<pfts_2lqh$ ', '...', 32)"
            select (str "select id, page, content, " snippet-aux " from blocks_fts where ")
            pg-sql (if page "page = ? and" "")
            match-sql (str select
                           pg-sql
                           " content match ? order by rank limit ?")
            non-match-sql (str select
                               pg-sql
                               " content like ? limit ?")
            matched-result (search-blocks-aux db match-sql match-input page limit)
            non-match-result (search-blocks-aux db non-match-sql non-match-input page limit)
            all-result (->> (concat matched-result non-match-result)
                            (map (fn [[id _content page snippet]]
                                   {:uuid id
                                    :content snippet
                                    :page page})))]
      (->>
       all-result
       (distinct-by :uuid)
       (take limit)))))

(defn truncate-table!
  [db]
  (.exec db "delete from blocks")
  (.exec db "delete from blocks_fts"))
