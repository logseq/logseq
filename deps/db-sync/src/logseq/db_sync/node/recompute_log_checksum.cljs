(ns logseq.db-sync.node.recompute-log-checksum
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db-sync.checksum :as sync-checksum]))

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

        (= "--log" x)
        (if-let [log-file (second xs)]
          (recur (assoc m :log-file log-file) (nnext xs))
          (fail! "Missing value for --log"))

        :else
        (fail! (str "Unknown argument: " x)))
      m)))

(defn- print-help!
  []
  (println "Recompute checksum from a :before-checksum-error server log line.")
  (println "")
  (println "Usage:")
  (println "  node worker/dist/recompute-log-checksum.js --log /tmp/server1.log")
  (println "")
  (println "Output:")
  (println "  - logged incremental and recomputed checksums")
  (println "  - replayed incremental and recomputed checksums")
  (println "  - equality checks"))

(defn- parse-log-payload
  [line]
  (let [prefix ":debug :before-checksum-error "]
    (when-not (string/starts-with? line prefix)
      (fail! (str "Log does not start with expected prefix: " prefix)))
    (reader/read-string (subs line (count prefix)))))

(defn- ensure-tx-data
  [tx-data]
  (cond
    (string? tx-data)
    (let [decoded (ldb/read-transit-str tx-data)]
      (if (sequential? decoded)
        decoded
        (fail! "Decoded transit tx-data is not sequential")))

    (sequential? tx-data)
    tx-data

    :else
    (fail! (str "Unsupported tx-data shape: " (type tx-data)))))

(defn main
  [& argv]
  (let [{:keys [help? log-file]} (parse-args argv)]
    (when help?
      (print-help!)
      (js/process.exit 0))
    (when-not log-file
      (fail! "Missing required --log <path> argument"))
    (let [log-path (node-path/resolve log-file)]
      (when-not (.existsSync fs log-path)
        (fail! (str "Log file not found: " log-path)))
      (let [line (string/trim (.readFileSync fs log-path "utf8"))
            payload (parse-log-payload line)
            db-before (ldb/read-transit-str (:db-before payload))
            tx-data (vec (ensure-tx-data (:tx-data payload)))
            tx-report (d/with db-before tx-data)
            replayed-prev-full (sync-checksum/recompute-checksum db-before)
            replayed-incremental-from-full-before
            (sync-checksum/update-checksum replayed-prev-full tx-report)
            replayed-incremental (sync-checksum/update-checksum (:prev-checksum payload) tx-report)
            replayed-recomputed (sync-checksum/recompute-checksum (:db-after tx-report))
            result {:log-file log-path
                    :prev-tx (:prev-tx payload)
                    :tx-meta (:tx-meta payload)
                    :tx-count (count tx-data)
                    :prev-checksum (:prev-checksum payload)
                    :logged-prev-full-checksum (:prev-full-checksum payload)
                    :replayed-prev-full-checksum replayed-prev-full
                    :prev-checksum-eq-replayed-prev-full?
                    (= (:prev-checksum payload) replayed-prev-full)
                    :logged-new-checksum (:new-checksum payload)
                    :replayed-incremental replayed-incremental
                    :replayed-incremental-from-full-before replayed-incremental-from-full-before
                    :logged-recomputed-after (:recomputed-after-checksum payload)
                    :replayed-recomputed-after replayed-recomputed
                    :match-logged-new? (= replayed-incremental (:new-checksum payload))
                    :match-logged-recomputed? (= replayed-recomputed (:recomputed-after-checksum payload))
                    :incremental-eq-full? (= replayed-incremental replayed-recomputed)}]
        (println (pr-str result))))))
