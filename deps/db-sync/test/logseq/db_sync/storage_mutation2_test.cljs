(ns logseq.db-sync.storage-mutation2-test
  "Tests for survivors of the second mutation run on logseq.db-sync.storage."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.test-sql :as test-sql]))

;; Fails if, in `duplicate-column-error?`, the `string/lower-case` step is dropped or the `.-message` step is dropped.
(deftest duplicate-column-error-test
  (let [duplicate-column-error? #'storage/duplicate-column-error?]
    (testing "the message is compared lower-cased"
      (is (true? (duplicate-column-error? (js/Error. "Duplicate Column name: Outliner_Op") "outliner_op")))
      (is (true? (duplicate-column-error? (js/Error. "duplicate column name: outliner_op") "Outliner_Op"))))
    (testing "an object that is not an Error is read by its message"
      (is (true? (duplicate-column-error? #js {:message "Duplicate column name: outliner_op"} "outliner_op"))))
    (testing "another column or another failure is not one"
      (is (false? (duplicate-column-error? (js/Error. "duplicate column name: other") "outliner_op")))
      (is (false? (duplicate-column-error? (js/Error. "no such table: outliner_op") "outliner_op"))))))

;; Fails if, in `set-initial-checksum!`, the `:type` key is dropped, the `:existing-checksum` key is dropped, the `:snapshot-checksum` key is dropped, `:db-sync/stale-snapshot-checksum` becomes `:db-sync/skip-checksum-update?`, the `:t` key is dropped or `:db-sync/snapshot-checksum-after-tx-log` becomes `:db-sync/stale-snapshot-checksum`.
(deftest set-initial-checksum-errors-carry-context-test
  (let [ex-data-of (fn [f] (try (f) nil (catch :default e (ex-data e))))]
    (testing "an existing different checksum is not overwritten"
      (let [sql (test-sql/make-sql)]
        (storage/set-checksum! sql "existing")
        (is (= {:type :db-sync/stale-snapshot-checksum
                :existing-checksum "existing"
                :snapshot-checksum "snapshot"}
               (ex-data-of #(storage/set-initial-checksum! sql "snapshot"))))
        (is (= "existing" (storage/get-checksum sql)))))
    (testing "a checksum can not start after the tx log advanced"
      (let [sql (test-sql/make-sql)]
        (storage/set-t! sql 3)
        (is (= {:type :db-sync/snapshot-checksum-after-tx-log
                :t 3
                :snapshot-checksum "snapshot"}
               (ex-data-of #(storage/set-initial-checksum! sql "snapshot"))))
        (is (nil? (storage/get-checksum sql)))))
    (testing "otherwise it is set"
      (let [sql (test-sql/make-sql)]
        (storage/set-initial-checksum! sql "snapshot")
        (is (= "snapshot" (storage/get-checksum sql)))))))

(defn- named-block
  [name]
  {:block/uuid (random-uuid) :block/name name :block/title name})

;; Fails if, in `append-tx-for-tx-report`, `:db-sync/skip-tx-log?` becomes `:db-sync/snapshot-checksum-after-tx-log`, the `vec` step is dropped or `:db-sync/skip-checksum-update?` becomes `:db-sync/skip-tx-log?`.
(deftest tx-report-listener-honours-tx-meta-test
  (let [sql (test-sql/make-sql)
        conn (storage/open-conn sql)
        checksum-0 (sync-checksum/recompute-checksum @conn)
        _ (storage/set-checksum! sql checksum-0)]
    (testing ":db-sync/skip-tx-log? writes nothing"
      (d/transact! conn [(named-block "skipped")] {:db-sync/skip-tx-log? true})
      (is (= 0 (storage/get-t sql)))
      (is (empty? (storage/fetch-tx-since sql 0)))
      (is (= checksum-0 (storage/get-checksum sql))))
    (testing ":db-sync/skip-checksum-update? logs the tx but keeps the checksum"
      (d/transact! conn [(named-block "no-checksum")] {:db-sync/skip-checksum-update? true})
      (is (= 1 (storage/get-t sql)))
      (is (= checksum-0 (storage/get-checksum sql))))
    (testing "a plain tx logs and updates the checksum"
      (d/transact! conn [(named-block "plain")])
      (is (= 2 (storage/get-t sql)))
      (is (not= checksum-0 (storage/get-checksum sql))))
    (testing "the logged tx is a vector"
      (let [rows (storage/fetch-tx-since sql 0)]
        (is (= 2 (count rows)))
        (is (every? #(vector? (common/read-transit (:tx %))) rows))))))
