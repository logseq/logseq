(ns logseq.outliner.tree-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.outliner.tree :as otree]))

(deftest blocks->vec-tree-data-preserves-caller-field-policy
  (let [root {:db/id 1}
        child {:db/id 2
               :block/uuid (random-uuid)
               :block/order "a0"
               :block/parent {:db/id 1}
               :block/tx-id 9}
        default-result (otree/blocks->vec-tree-data [child] root {:include-root? false})
        renderer-result (otree/blocks->vec-tree-data [child] root {:include-root? false
                                                                   :keep-block-tx-id? true})]
    (is (= [1] (mapv :block/level default-result)))
    (is (nil? (:block/tx-id (first default-result))))
    (is (= 9 (:block/tx-id (first renderer-result))))))
