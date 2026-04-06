(ns logseq.db-sync.storage-test
  (:require ["better-sqlite3" :as sqlite3]
            [clojure.string :as string]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db-sync.storage :as storage]
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
