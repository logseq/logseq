(ns frontend.db.transact-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.db.transact :as db-transact]))

(deftest op-block-uuids-includes-move-ops-test
  (let [block-a (random-uuid)
        block-b (random-uuid)
        target (random-uuid)]
    (is (= #{block-a block-b target}
           (#'db-transact/op-block-uuids
            [[:move-blocks [[block-a block-b] target {}]]])))
    (is (= #{block-a block-b}
           (#'db-transact/op-block-uuids
            [[:move-blocks-up-down [[block-a block-b] true]]
             [:indent-outdent-blocks [[block-a block-b] true {}]]])))))

(deftest op-block-uuids-includes-property-ops-test
  (let [block-a (random-uuid)
        block-b (random-uuid)]
    (is (= #{block-a block-b}
           (#'db-transact/op-block-uuids
            [[:set-block-property [block-a :block/tags 4]]
             [:batch-delete-property-value [[block-a block-b] :block/tags 4]]])))))
