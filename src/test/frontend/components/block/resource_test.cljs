(ns frontend.components.block.resource-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.block :as block]))

(deftest grouped-block-rows-recognizes-worker-grouped-results-test
  (let [page {:db/id 1}
        block-row {:block/uuid (random-uuid)}]
    (is (#'block/grouped-block-rows? {page [block-row]}))
    (is (#'block/grouped-block-rows? [[page [block-row]]]))
    (is (not (#'block/grouped-block-rows? [(:block/uuid block-row)])))))
