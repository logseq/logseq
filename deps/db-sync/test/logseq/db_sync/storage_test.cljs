(ns logseq.db-sync.storage-test
  (:require ["better-sqlite3" :as sqlite3]
            [clojure.string :as string]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.storage :as storage]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db-sync.test-sql :as test-sql]))

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
        sql #js {:exec (fn [sql-str & args]
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

(defn- seeded-rng
  [seed0]
  (let [state (atom (bit-or (long seed0) 0))]
    (fn []
      (let [s (swap! state
                     (fn [x]
                       (let [x (bit-xor x (bit-shift-left x 13))
                             x (bit-xor x (bit-shift-right x 17))
                             x (bit-xor x (bit-shift-left x 5))]
                         (bit-or x 0))))]
        (/ (double (unsigned-bit-shift-right s 0)) 4294967296.0)))))

(defn- rand-int*
  [rng n]
  (js/Math.floor (* (rng) n)))

(defn- pick-rand
  [rng coll]
  (when (seq coll)
    (nth coll (rand-int* rng (count coll)))))

(defn- normal-block-uuids
  [db]
  (->> (d/datoms db :avet :block/uuid)
       (map :e)
       distinct
       (keep (fn [eid]
               (let [ent (d/entity db eid)]
                 (when (and (uuid? (:block/uuid ent))
                            (not (ldb/built-in? ent))
                            (nil? (:block/name ent))
                            (some? (:block/page ent)))
                   (:block/uuid ent)))))
       vec))

(deftest t-counter-test
  (let [sql (test-sql/make-sql)]
    (storage/init-schema! sql)
    (is (= 0 (storage/get-t sql)))
    (is (= 1 (storage/next-t! sql)))
    (is (= 1 (storage/get-t sql)))
    (is (= 2 (storage/next-t! sql)))))

(deftest tx-log-test
  (let [sql (test-sql/make-sql)]
    (storage/init-schema! sql)
    (storage/append-tx! sql 1 "tx-1" 100 :save-block)
    (storage/append-tx! sql 2 "tx-2" 200 :move-blocks)
    (storage/append-tx! sql 3 "tx-3" 300 nil)
    (let [result (storage/fetch-tx-since sql 1)]
      (is (= [{:t 2 :tx "tx-2" :outliner-op :move-blocks}
              {:t 3 :tx "tx-3" :outliner-op nil}]
             result)))))

(deftest stale-checksum-no-op-transact-does-not-throw-test
  (testing "a no-op tx should not throw and should keep incremental checksum state"
    (with-memory-sql
      (fn [sql]
        (let [stale-checksum "f4b78e83776d45fb"]
          (storage/init-schema! sql)
          (storage/set-checksum! sql stale-checksum)
          (let [conn (storage/open-conn sql)
                result (try
                         (d/transact! conn
                                      []
                                      {:outliner-op :rebase})
                         :ok
                         (catch :default e
                           e))]
            (is (= :ok result))
            (is (= stale-checksum
                   (storage/get-checksum sql)))))))))

(deftest stale-checksum-transact-keeps-kvs-and-tx-log-consistent-test
  (testing "stale checksum should not fail transact; kvs and tx_log/t should advance together"
    (with-memory-sql
      (fn [sql]
        (storage/init-schema! sql)
        (let [conn (storage/open-conn sql)
              stale-checksum "ffffffffffffffff"
              page-uuid (random-uuid)]
          ;; Use a stale checksum and ensure append path remains consistent.
          (storage/set-checksum! sql stale-checksum)
          (let [result (try
                         (d/transact! conn [{:block/uuid page-uuid
                                             :block/name "repro-kvs-ahead-page"}])
                         :ok
                         (catch :default e
                           e))]
            (is (= :ok result))
            (is (= 1 (storage/get-t sql)))
            (is (= 1 (count (storage/fetch-tx-since sql 0))))
            (is (not= stale-checksum (storage/get-checksum sql)))
            (let [restored-conn (storage/open-conn sql)]
              (is (= page-uuid
                     (:block/uuid (d/entity @restored-conn [:block/uuid page-uuid])))))))))))

(deftest normalize-drop-can-hide-kvs-mutation-from-tx-log-test
  (testing "if normalize drops tx payload, tx_log can miss persisted kvs state changes"
    (with-memory-sql
      (fn [sql]
        (storage/init-schema! sql)
        (let [conn (storage/open-conn sql)
              page-uuid (random-uuid)]
          (with-redefs [db-normalize/normalize-tx-data (fn [_db-after _db-before _tx-data]
                                                         [])]
            (d/transact! conn [{:block/uuid page-uuid
                                :block/name "normalize-drop-repro"}]))
          (is (= 1 (storage/get-t sql)))
          (let [entries (storage/fetch-tx-since sql 0)]
            (is (= 1 (count entries)))
            (is (= []
                   (common/read-transit (:tx (first entries)))))
            (let [restored-conn (storage/open-conn sql)]
              (is (= page-uuid
                     (:block/uuid (d/entity @restored-conn [:block/uuid page-uuid])))))))))))

(deftest randomized-normal-block-retract-recreate-does-not-throw-checksum-mismatch-test
  (testing "normal block retract/recreate patterns should not naturally trigger server checksum mismatch"
    (with-memory-sql
      (fn [sql]
        (storage/init-schema! sql)
        (let [conn (storage/open-conn sql)
              rng (seeded-rng 424242)
              page-uuid (random-uuid)
              _ (d/transact! conn [{:block/uuid page-uuid
                                    :block/name "repro-page"
                                    :block/title "repro-page"}])
              _ (d/transact! conn (mapv (fn [idx]
                                          {:block/uuid (random-uuid)
                                           :block/title (str "seed-" idx)
                                           :block/page [:block/uuid page-uuid]
                                           :block/parent [:block/uuid page-uuid]
                                           :block/order (str "a" idx)})
                                        (range 5)))
              *mismatch (atom nil)]
          (dotimes [step 500]
            (when-not @*mismatch
              (let [db @conn
                    blocks (normal-block-uuids db)
                    target (pick-rand rng blocks)
                    sibling (pick-rand rng (remove #(= % target) blocks))
                    add-fresh? (< (rng) 0.3)
                    tx-data (cond-> [[:db/retractEntity [:block/uuid target]]
                                     [:db/add -1 :block/uuid target]
                                     [:db/add -1 :block/title (str "rr-" step)]
                                     [:db/add -1 :block/page [:block/uuid page-uuid]]
                                     [:db/add -1 :block/parent [:block/uuid page-uuid]]
                                     [:db/add -1 :block/order (str "z" (mod step 7))]]
                              sibling
                              (conj [:db/add [:block/uuid sibling] :block/title (str "sib-" step)])
                              add-fresh?
                              (into [[:db/add -2 :block/uuid (random-uuid)]
                                     [:db/add -2 :block/title (str "fresh-" step)]
                                     [:db/add -2 :block/page [:block/uuid page-uuid]]
                                     [:db/add -2 :block/parent [:block/uuid page-uuid]]
                                     [:db/add -2 :block/order (str "x" (mod step 9))]]))]
                (try
                  (d/transact! conn tx-data)
                  (catch :default e
                    (let [message (or (ex-message e) (some-> e .-message) (str e))]
                      (if (string/includes? message "server checksum doesn't match")
                        (reset! *mismatch {:step step
                                           :tx-data tx-data
                                           :error message})
                        ;; tx can be invalid due random -2 fresh fields; ignore non-checksum failures
                        nil)))))))
          (is (nil? @*mismatch)
              (str "found checksum mismatch repro: " (pr-str @*mismatch))))))))
