(ns logseq.db-sync.node.show-checksum
  (:require ["better-sqlite3" :as sqlite3]
            ["fs" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db-sync.storage :as storage]))

(def sqlite (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(defn- fail!
  [msg]
  (binding [*print-fn* *print-err-fn*]
    (println (str "Error: " msg)))
  (js/process.exit 1))

(defn- parse-args
  [argv]
  (let [args (vec argv)]
    (cond
      (some #{"-h" "--help"} args)
      {:help? true}

      :else
      (loop [m {}
             xs args]
        (if-let [x (first xs)]
          (cond
            (= "--db" x)
            (if-let [db (second xs)]
              (recur (assoc m :db db) (nnext xs))
              (fail! "Missing value for --db"))

            :else
            (fail! (str "Unknown argument: " x)))
          m)))))

(defn- print-help!
  []
  (println "Show checksums for a sqlite db.")
  (println "")
  (println "Usage:")
  (println "  node worker/dist/show-sqlite-checksum.js --db <path/to/db.sqlite>")
  (println "")
  (println "Output:")
  (println "  - stored checksum (sync_meta.checksum, if present)")
  (println "  - recomputed checksum (from datascript graph)"))

(defn- normalize-sql
  [sql]
  (-> sql string/trim string/lower-case))

(defn- select-sql?
  [sql]
  (string/starts-with? (normalize-sql sql) "select"))

(defn- exec-with-args [^js stmt args]
  (.apply (.-run stmt) stmt (to-array args)))

(defn- all-with-args [^js stmt args]
  (.apply (.-all stmt) stmt (to-array args)))

(defn- wrap-db [^js db]
  #js {:exec (fn [sql & args]
               (if (seq args)
                 (let [stmt (.prepare db sql)]
                   (if (select-sql? sql)
                     (all-with-args stmt args)
                     (do
                       (exec-with-args stmt args)
                       nil)))
                 (if (select-sql? sql)
                   (.all (.prepare db sql))
                   (.exec db sql))))
       :close (fn [] (.close db))
       :_db db})

(defn- datom-count
  [db]
  (count (d/datoms db :eavt)))

(defn main
  [& argv]
  (let [{:keys [help? db]} (parse-args argv)]
    (when help?
      (print-help!)
      (js/process.exit 0))
    (when-not db
      (fail! "Missing required --db <path> argument"))
    (let [db-path (node-path/resolve db)]
      (when-not (.existsSync fs db-path)
        (fail! (str "SQLite file not found: " db-path)))
      (let [sqlite-db (new sqlite db-path nil)
            sql (wrap-db sqlite-db)]
        (try
          (storage/init-schema! sql)
          (let [conn (storage/open-conn sql)
                db' @conn
                recomputed-checksum (sync-checksum/recompute-checksum db')]
            (println (str "db: " db-path))
            (println (str "datoms: " (datom-count db')))
            (println (str "recomputed-checksum: " recomputed-checksum)))
          (finally
            (.close sql)))))))
