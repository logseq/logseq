(ns logseq.db-sync.worker-large-op-memory-test
  (:require ["better-sqlite3" :as sqlite3]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.ws :as ws]
            [logseq.db.frontend.validate :as db-validate]))

(def sqlite (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(defn- select-sql?
  [sql]
  (string/starts-with? (-> sql string/trim string/lower-case) "select"))

(defn- run-sql
  [^js stmt args]
  (.apply (.-run stmt) stmt (to-array args)))

(defn- all-sql
  [^js stmt args]
  (.apply (.-all stmt) stmt (to-array args)))

(defn- with-memory-sql
  [f]
  (let [db (new sqlite ":memory:" nil)
        sql #js {:_db db
                 :exec (fn [sql-str & args]
                         (let [stmt (.prepare db sql-str)]
                           (if (select-sql? sql-str)
                             (all-sql stmt args)
                             (do
                               (run-sql stmt args)
                               nil))))
                 :close (fn []
                          (.close db))}]
    (try
      (f sql)
      (finally
        (.close sql)))))

(defn- large-block-insert-tx
  [page-uuid block-count]
  (let [block-uuids (mapv (fn [_idx] (random-uuid)) (range block-count))]
    {:block-uuids block-uuids
     :tx-data
     (vec
      (mapcat (fn [idx]
                (let [block-uuid (nth block-uuids idx)
                      eid (str block-uuid)]
                  [[:db/add eid :block/uuid block-uuid idx]
                   [:db/add eid :block/title (str "large-memory-block-" idx) idx]
                   [:db/add eid :block/page [:block/uuid page-uuid] idx]
                   [:db/add eid :block/parent [:block/uuid page-uuid] idx]
                   [:db/add eid :block/order "a0" idx]
                   [:db/add eid :block/created-at idx idx]
                   [:db/add eid :block/updated-at idx idx]]))
              (range block-count)))}))

(defn- sample-blocks-present?
  [db block-uuids]
  (every? (fn [idx]
            (some? (d/entity db [:block/uuid (nth block-uuids idx)])))
          [0 (quot (count block-uuids) 2) (dec (count block-uuids))]))

(defn- assert!
  [condition message]
  (when-not condition
    (throw (js/Error. message))))

(defn- run-large-op-memory-test!
  [{:keys [skip-final-store? skip-validation?]}]
  (with-memory-sql
    (fn [sql]
      (storage/init-schema! sql)
      (let [conn (storage/open-conn sql)
            page-uuid (random-uuid)
            _ (d/transact! conn [{:block/uuid page-uuid
                                  :block/name "large-memory-page"
                                  :block/title "large-memory-page"}])
            t-before (storage/get-t sql)
            {:keys [tx-data block-uuids]} (large-block-insert-tx page-uuid 2000)
            tx-entry {:tx (protocol/tx->transit tx-data)
                      :tx-id (random-uuid)
                      :outliner-op :insert-blocks}
            self #js {:sql sql
                      :conn conn
                      :schema-ready true}
            tx-report-count (atom 0)
            response (try
                       (d/listen! conn ::large-op-memory-chunks
                                  (fn [_tx-report]
                                    (swap! tx-report-count inc)))
                       (with-redefs [d/store (if skip-final-store?
                                               (fn [_db] nil)
                                               d/store)
                                     db-validate/validate-tx-report
                                     (if skip-validation?
                                       (fn [_tx-report _options] [true nil])
                                       db-validate/validate-tx-report)
                                     ws/broadcast! (fn [& _] nil)]
                         (sync-handler/handle-tx-batch! self nil [tx-entry] t-before))
                       (finally
                         (d/unlisten! conn ::large-op-memory-chunks)))]
        (assert! (= "tx/batch/ok" (:type response))
                 (str "expected tx/batch/ok, got " (pr-str response)))
        (assert! (> @tx-report-count 1)
                 (str "expected more than one chunk, got " @tx-report-count))
        (assert! (= (inc t-before) (:t response))
                 (str "expected response t to advance once, got " (:t response)))
        (assert! (= 1 (count (storage/fetch-tx-since sql t-before)))
                 "expected large tx to be persisted as one tx log entry")
        (assert! (sample-blocks-present? @conn block-uuids)
                 "expected sampled large tx blocks to be persisted")))))

(defn- run-open-sql-memory-test!
  []
  (with-memory-sql
    (fn [sql]
      (storage/init-schema! sql)
      (let [conn (storage/open-conn sql)
            page-uuid (random-uuid)]
        (d/transact! conn [{:block/uuid page-uuid
                            :block/name "large-memory-page"
                            :block/title "large-memory-page"}])
        (assert! (some? (d/entity @conn [:block/uuid page-uuid]))
                 "expected setup page to be persisted")))))

(defn- run-prepare-memory-test!
  []
  (let [page-uuid (random-uuid)
        {:keys [tx-data]} (large-block-insert-tx page-uuid 2000)
        tx-entry {:tx (protocol/tx->transit tx-data)
                  :tx-id (random-uuid)
                  :outliner-op :insert-blocks}]
    (assert! (= 14000 (count tx-data))
             "expected generated tx data")
    (assert! (string? (:tx tx-entry))
             "expected transit tx payload")))

(defn- run-mode!
  [mode]
  (case mode
    "baseline" nil
    "open-sql" (run-open-sql-memory-test!)
    "prepare" (run-prepare-memory-test!)
    "apply" (run-large-op-memory-test! nil)
    "apply-no-store" (run-large-op-memory-test! {:skip-final-store? true})
    "apply-no-validation" (run-large-op-memory-test! {:skip-validation? true})
    "apply-no-store-validation" (run-large-op-memory-test! {:skip-final-store? true
                                                            :skip-validation? true})
    (run-large-op-memory-test! nil)))

(defn main [& args]
  (try
    (let [mode (or (first args) "apply")]
      (run-mode! mode)
      (js/console.log (str "large op memory test passed: " mode)))
    (js/process.exit 0)
    (catch :default error
      (js/console.error error)
      (js/process.exit 1))))
