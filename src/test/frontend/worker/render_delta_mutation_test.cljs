(ns frontend.worker.render-delta-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.worker.render-delta :as render-delta]))

(defn- build-with-tx-report
  [tx-report]
  (render-delta/build {:graph-id "graph"
                       :rev 1
                       :op-id "op"
                       :blocks {}
                       :deleted-block-uuids #{}
                       :affected-keys #{}
                       :tx-report tx-report}))

;; Fails if, in `validate-input!`, `and` becomes `or`.
(deftest tx-report-map-without-dbs-fails-fast-test
  (is (thrown-with-msg? js/Error #"Invalid transaction report"
                        (build-with-tx-report {:tx-data []}))))
