(ns logseq.worker-sync.storage-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.worker-sync.storage :as storage]
            [logseq.worker-sync.test-sql :as test-sql]))

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
    (storage/append-tx! sql 1 "tx-1" 100)
    (storage/append-tx! sql 2 "tx-2" 200)
    (storage/append-tx! sql 3 "tx-3" 300)
    (let [result (storage/fetch-tx-since sql 1)]
      (is (= [{:t 2 :tx "tx-2"}
              {:t 3 :tx "tx-3"}]
             result)))))
