(ns frontend.modules.outliner.op-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.modules.outliner.op :as outliner-op]))

(deftest block-id-supports-worker-block-maps-test
  (let [block-uuid (random-uuid)]
    (is (= block-uuid
           (#'outliner-op/->block-id {:uuid block-uuid})))
    (is (= block-uuid
           (#'outliner-op/->block-id {:block/uuid block-uuid})))))
