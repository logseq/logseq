(ns frontend.worker.sync.util-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.worker.sync.util :as sync-util]
            [logseq.common.version :as build-version]))

(deftest coerce-http-request-adds-client-revision-to-tx-batch-test
  (is (= (build-version/revision)
         (:client-revision
          (sync-util/coerce-http-request :sync/tx-batch
                                         {:t-before 0
                                          :txs []})))))

(deftest coerce-http-request-does-not-add-client-revision-to-other-requests-test
  (is (= {:graph-name "Demo"}
         (sync-util/coerce-http-request :graphs/create
                                        {:graph-name "Demo"}))))

(deftest coerce-http-request-preserves-explicit-client-revision-test
  (is (= "explicit-revision"
         (:client-revision
          (sync-util/coerce-http-request :sync/tx-batch
                                         {:t-before 0
                                          :txs []
                                          :client-revision "explicit-revision"})))))
