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

;; (defn add-triggers!
;;   [db]
;;   (let [triggers ["CREATE TRIGGER blocks_ai AFTER INSERT ON blocks
;;     BEGIN
;;         INSERT INTO blocks_fts (id, text)
;;         VALUES (new.id, new.text);
;;     END;
;; "
;;                   "CREATE TRIGGER blocks_ad AFTER DELETE ON blocks
;;     BEGIN
;;         INSERT INTO blocks_fts (blocks_fts, id, text)
;;         VALUES ('delete', old.id, old.text);
;;     END;"
;;                   "CREATE TRIGGER blocks_au AFTER UPDATE ON blocks
;;     BEGIN
;;         INSERT INTO blocks_fts (blocks_fts, id, text)
;;         VALUES ('delete', old.id, old.text);
;;         INSERT INTO blocks_fts (id, text)
;;         VALUES (new.id, new.text);
;;     END;"]]
;;     (doseq [trigger triggers]
;;      (let [stmt (prepare db trigger)]
;;        (.run ^object stmt)))))

(defn create-blocks-table!
  [db]
  (let [stmt (prepare db "CREATE TABLE IF NOT EXISTS blocks (
                        id INTEGER PRIMARY KEY,
                        uuid TEXT NOT NULL,
                        content TEXT NOT NULL)")]
    (.run ^object stmt)))

(defn create-blocks-fts-table!
  [db]
  (let [stmt (prepare db "CREATE VIRTUAL TABLE blocks_fts USING fts5(id, uuid, content)")]
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
        _ (create-blocks-table! db)]
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
    (let [insert (prepare db "INSERT INTO blocks (id, uuid, content) VALUES (@id, @uuid, @content) ON CONFLICT (id) DO UPDATE SET content = @content")
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
  [repo q limit]
  (when-let [database (get-db repo)]
    (when-not (string/blank? q)
      (let [limit (or limit 100)
            stmt (prepare database
                          "select id, uuid, content from blocks where content like ? limit ?")]
       (js->clj (.all ^object stmt (str "%" q "%") limit) :keywordize-keys true)))))

(defn truncate-blocks-table!
  [repo]
  (when-let [database (get-db repo)]
    (let [stmt (prepare database
                       "delete from blocks;")]
     (.run ^object stmt))))

(defn drop-blocks-table!
  [repo]
  (when-let [database (get-db repo)]
    (let [stmt (prepare database
                       "drop table blocks;")
         _ (.run ^object stmt)
         ;; stmt (prepare @database
         ;;               "drop table blocks_fts;")
         ]
     ;; (.run ^object stmt)
      )))

(defn delete-db!
  [repo]
  (when-let [database (get-db repo)]
    (.close database)
    (let [[_ db-full-path] (get-db-full-path repo)]
      (println "Delete search indice: " db-full-path)
      (fs/unlinkSync db-full-path))))


(comment
  (open-db!)

  (add-blocks! (clj->js [{:id "a"
                          :uuid ""
                          :content "hello world"}
                         {:id "b"
                          :uuid ""
                          :content "foo bar"}]))

  (time
    (let [blocks (for [i (range 10000)]
                   {:id (str i)
                    :uuid ""
                    :content (rand-nth ["hello" "world" "nice"])})]
      (add-blocks! (clj->js blocks))))

  (get-all-blocks)

  (search-blocks "hello")

  (def block {:id 16, :uuid "5f713e91-8a3c-4b04-a33a-c39482428e2d", :content "Hello, I'm a block!"})

  (add-blocks! (clj->js [block]))
  )
