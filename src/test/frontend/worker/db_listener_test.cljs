(ns frontend.worker.db-listener-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.worker.db-listener :as db-listener]))

(deftest transit-safe-tx-meta-keeps-outliner-ops-test
  (testing "worker tx-meta sanitization should preserve semantic outliner ops"
    (let [outliner-ops [[:save-block [{:block/uuid (random-uuid)
                                       :block/title "hello"} nil]]]
          tx-meta {:outliner-op :save-block
                   :outliner-ops outliner-ops
                   :db-sync/inverse-outliner-ops outliner-ops
                   :error-handler (fn [_] nil)}
          safe-tx-meta (#'db-listener/transit-safe-tx-meta tx-meta)]
      (is (= outliner-ops (:outliner-ops safe-tx-meta)))
      (is (= outliner-ops (:db-sync/inverse-outliner-ops safe-tx-meta)))
      (is (nil? (:error-handler safe-tx-meta))))))
