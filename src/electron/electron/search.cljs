(ns electron.search
  (:require ["path" :as path]
            ["better-sqlite3" :as sqlite3]
            [clojure.string :as string]
            [electron.utils :refer [logger] :as utils]))

(def error (partial (.-error logger) "[Search]"))

(defonce database (atom nil))

(defn prepare
  [^object db sql]
  (.prepare db sql))

(defn add-triggers!
  [db]
  (let [triggers ["CREATE TRIGGER blocks_ai AFTER INSERT ON blocks
    BEGIN
        INSERT INTO blocks_fts (id, text)
        VALUES (new.id, new.text);
    END;
"
                  "CREATE TRIGGER blocks_ad AFTER DELETE ON blocks
    BEGIN
        INSERT INTO blocks_fts (blocks_fts, id, text)
        VALUES ('delete', old.id, old.text);
    END;"
                  "CREATE TRIGGER blocks_au AFTER UPDATE ON blocks
    BEGIN
        INSERT INTO blocks_fts (blocks_fts, id, text)
        VALUES ('delete', old.id, old.text);
        INSERT INTO blocks_fts (id, text)
        VALUES (new.id, new.text);
    END;"]]
    (doseq [trigger triggers]
     (let [stmt (prepare db trigger)]
       (.run ^object stmt)))))

(defn create-blocks-table!
  [db]
  (let [stmt (prepare db "CREATE TABLE blocks (
                        id TEXT PRIMARY KEY,
                        text TEXT NOT NULL)")]
    (.run ^object stmt)))

(defn create-blocks-fts-table!
  [db]
  (let [stmt (prepare db "CREATE VIRTUAL TABLE blocks_fts USING fts5(id, text)")]
    (.run ^object stmt)))

(defn open-db!
  []
  (let [db-path (.join path "/tmp/logseq_search.db")
        db (sqlite3 db-path #js {:verbose js/console.log})
        _ (try (create-blocks-table! db)
               (catch js/Error e
                 (error e)))
        _ (try (create-blocks-fts-table! db)
               (catch js/Error e
                 (error e)))
        _ (try (add-triggers! db)
               (catch js/Error e
                 (error e)))
        ]
    (reset! database db)
    db))

(defn add-blocks!
  [blocks]
  (when-let [db @database]
    (let [insert (prepare db "INSERT INTO blocks (id, text) VALUES (@id, @text)")
          insert-many (.transaction ^object db
                                    (fn [blocks]
                                      (doseq [block blocks]
                                        (.run ^object insert block))))]
      (insert-many blocks))))

(defn delete-blocks!
  [ids]
  (when-let [db @database]
    (let [stmt (prepare db
                        (utils/format "DELETE from blocks WHERE ids IN (%s)"
                                      (string/join ", " ids)))]
      (.run ^object stmt))))

(defn get-all-blocks
  []
  (let [stmt (prepare @database
                       "select * from blocks")]
    (js->clj (.all ^object stmt) :keywordize-keys true)))

(defn search-blocks-fts
  [q]
  (when-not (string/blank? q)
    (let [stmt (prepare @database
                         "select id, text from blocks_fts where text match ? ORDER BY rank")]
      (js->clj (.all ^object stmt q) :keywordize-keys true))))

(defn search-blocks
  [q]
  (when-not (string/blank? q)
    (let [stmt (prepare @database
                         "select id, text from blocks_fts where text like ?")]
      (js->clj (.all ^object stmt (str "%" q "%")) :keywordize-keys true))))

(defn drop-blocks-table!
  []
  (let [stmt (prepare @database
                       "drop table blocks;")
        _ (.run ^object stmt)
        stmt (prepare @database
                       "drop table blocks_fts;")]
    (.run ^object stmt)))


(comment
  (open-db!)

  (add-blocks! (clj->js [{:id "a"
                          :text "hello world"}
                         {:id "b"
                          :text "foo bar"}]))

  (time
    (let [blocks (for [i (range 10000)]
                   {:id (str i)
                    :text (rand-nth ["hello" "world" "nice"])})]
      (add-blocks! (clj->js blocks))))

  (get-all-blocks)

  (search-blocks "hello")
  )
