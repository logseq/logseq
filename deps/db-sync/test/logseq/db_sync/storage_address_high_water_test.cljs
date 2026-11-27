(ns logseq.db-sync.storage-address-high-water-test
  "logseq/db-test#1525: node rows a store wrote above the root's :max-addr (an
  interrupted flush) are not handed out again after a restart, and a store
  writes all of its rows or none."
  (:require ["better-sqlite3" :as sqlite3]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.storage :as ds-storage]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.storage :as storage]))

(def sqlite (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(defn- with-memory-sql
  [f]
  (let [db (new sqlite ":memory:" nil)
        sql #js {:transaction (fn [f] ((.transaction db f)))
                 :exec (fn [sql-str & args]
                         (let [stmt (.prepare db sql-str)]
                           (if (string/starts-with? (-> sql-str string/trim string/lower-case) "select")
                             (.apply (.-all stmt) stmt (to-array args))
                             (do (.apply (.-run stmt) stmt (to-array args)) nil))))
                 :close (fn [] (.close db))}]
    (try (f sql) (finally (.close sql)))))

(defn- row-content [sql addr]
  (some-> (first (common/get-sql-rows (common/sql-exec sql "select content from kvs where addr = ?" addr)))
          (aget "content")))

(defn- root-max-addr [sql]
  (:max-addr (common/read-transit (row-content sql 0))))

(def ^:private *max-addr @#'ds-storage/*max-addr)

(deftest rows-above-the-roots-max-addr-are-not-reused-after-a-restart
  (with-memory-sql
    (fn [sql]
      (let [conn (storage/open-conn sql)]
        (d/transact! conn [{:block/uuid (random-uuid) :block/title "first"}])
        (let [root-max (root-max-addr sql)
              orphan-addr (inc root-max)
              orphan "an interrupted store's node row"]
          (is (number? root-max))
          ;; a store that wrote a node row above the root's :max-addr and stopped
          (common/sql-exec sql "insert into kvs (addr, content, addresses) values (?, ?, null)" orphan-addr orphan)
          ;; a fresh process: the allocator counts from the root's :max-addr
          (vreset! *max-addr root-max)
          (let [conn' (storage/open-conn sql)]
            (testing "the allocator starts above every stored row"
              (is (>= @*max-addr orphan-addr)))
            (dotimes [i 20]
              (d/transact! conn' [{:block/uuid (random-uuid) :block/title (str "later " i)}]))
            (testing "later stores do not write over the row"
              (is (= orphan (row-content sql orphan-addr))))))))))

(deftest a-store-writes-all-of-its-rows-or-none
  (with-memory-sql
    (fn [sql]
      (storage/init-schema! sql)
      (let [writes (atom 0)
            failing-sql #js {:transaction (.-transaction sql)
                             :exec (fn [sql-str & args]
                                     (when (string/starts-with? (string/trim sql-str) "insert into kvs")
                                       (when (= 2 (swap! writes inc))
                                         (throw (js/Error. "disk full"))))
                                     (apply (.-exec sql) sql-str args))}
            store (storage/new-sqlite-storage failing-sql)]
        (is (thrown? js/Error (ds-storage/-store store [[5000001 {:keys []}] [5000002 {:keys []}]] nil)))
        (is (nil? (row-content sql 5000001)) "the first row was rolled back with the failed store")))))
