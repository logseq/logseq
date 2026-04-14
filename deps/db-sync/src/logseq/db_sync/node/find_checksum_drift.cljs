(ns logseq.db-sync.node.find-checksum-drift
  (:require ["better-sqlite3" :as sqlite3]
            ["fs" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.storage :as storage]
            [logseq.db.frontend.schema :as db-schema]))

(def sqlite (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(defn- fail!
  [msg]
  (binding [*print-fn* *print-err-fn*]
    (println (str "Error: " msg)))
  (js/process.exit 1))

(defn- parse-args
  [argv]
  (loop [m {}
         xs (vec argv)]
    (if-let [x (first xs)]
      (cond
        (some #{x} ["-h" "--help"])
        (recur (assoc m :help? true) (next xs))

        (= "--db" x)
        (if-let [db (second xs)]
          (recur (assoc m :db db) (nnext xs))
          (fail! "Missing value for --db"))

        (= "--diff-out" x)
        (if-let [diff-out (second xs)]
          (recur (assoc m :diff-out diff-out) (nnext xs))
          (fail! "Missing value for --diff-out"))

        :else
        (fail! (str "Unknown argument: " x)))
      m)))

(defn- print-help!
  []
  (println "Find first tx_log checksum drift in a sqlite graph db.")
  (println "")
  (println "Usage:")
  (println "  node worker/dist/find-checksum-drift.js --db <path/to/db.sqlite>")
  (println "  node worker/dist/find-checksum-drift.js --db <path/to/db.sqlite> --diff-out <path/to/diff.edn>")
  (println "")
  (println "Output:")
  (println "  - stored/recomputed checksum for current db")
  (println "  - first tx_log t where incremental != recomputed during replay")
  (println "  - optional full current-vs-replayed block diff EDN file"))

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

(defn- short-preview
  [tx-data]
  (->> tx-data
       (take 8)
       vec))

(defn- tx-rows
  [^js db]
  (.all (.prepare db "select t, tx, outliner_op from tx_log order by t asc")))

(defn- replay-find-first-mismatch
  [rows]
  (let [conn (d/create-conn db-schema/schema)]
    (loop [idx 0
           checksum nil]
      (if (>= idx (count rows))
        {:ok? true
         :idx idx
         :checksum checksum
         :recomputed (sync-checksum/recompute-checksum @conn)
         :db @conn}
        (let [row (nth rows idx)
              t (aget row "t")
              outliner-op (aget row "outliner_op")
              tx-str (aget row "tx")
              tx-data (common/read-transit tx-str)
              tx-report (d/transact! conn tx-data)
              incremental (sync-checksum/update-checksum checksum tx-report)
              recomputed (sync-checksum/recompute-checksum (:db-after tx-report))]
          (if (= incremental recomputed)
            (recur (inc idx) incremental)
            {:ok? false
             :idx idx
             :t t
             :outliner-op outliner-op
             :prev-checksum checksum
             :incremental incremental
             :recomputed recomputed
             :tx-size (count tx-data)
             :tx-preview (short-preview tx-data)
             :db (:db-after tx-report)}))))))

(defn- block-map-by-uuid
  [blocks]
  (into {} (map (juxt :block/uuid identity) blocks)))

(defn- diff-blocks
  [blocks-a blocks-b]
  (let [a-by-id (block-map-by-uuid blocks-a)
        b-by-id (block-map-by-uuid blocks-b)
        all-ids (set (concat (keys a-by-id) (keys b-by-id)))]
    (->> all-ids
         (keep (fn [id]
                 (let [a (get a-by-id id)
                       b (get b-by-id id)]
                   (when (not= a b)
                     {:block/uuid id
                      :current a
                      :replayed b}))))
         vec)))

(defn- sorted-block-diffs
  [block-diffs]
  (sort-by (fn [m]
             (some-> (:block/uuid m) str))
           block-diffs))

(defn main
  [& argv]
  (let [{:keys [help? db diff-out]} (parse-args argv)]
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
                stored (storage/get-checksum sql)
                recomputed (sync-checksum/recompute-checksum db')
                rows (tx-rows sqlite-db)
                replay-result (replay-find-first-mismatch rows)
                current-diag (sync-checksum/recompute-checksum-diagnostics db')
                replay-diag (sync-checksum/recompute-checksum-diagnostics (:db replay-result))
                block-diffs (-> (diff-blocks (:blocks current-diag) (:blocks replay-diag))
                                sorted-block-diffs)]
            (println (str "db: " db-path))
            (println (str "stored-checksum: " stored))
            (println (str "recomputed-checksum: " recomputed))
            (println (str "tx-log-count: " (count rows)))
            (println (str "current-blocks: " (count (:blocks current-diag))
                          ", replayed-blocks: " (count (:blocks replay-diag))
                          ", different-blocks: " (count block-diffs)))
            (when (seq block-diffs)
              (println "different-blocks-sample:")
              (println (pr-str (take 5 block-diffs))))
            (when (seq diff-out)
              (let [diff-out-path (node-path/resolve diff-out)]
                (.writeFileSync fs diff-out-path
                                (str (pr-str block-diffs) "\n")
                                "utf8")
                (println (str "diff-out: " diff-out-path))))
            (if (:ok? replay-result)
              (println (pr-str (assoc replay-result
                                      :stored-checksum stored
                                      :final-recomputed recomputed)))
              (println (pr-str replay-result))))
          (finally
            (.close sql)))))))
