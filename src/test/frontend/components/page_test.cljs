(ns frontend.components.page-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.components.page-window :as page-window]))

(deftest merge-page-window-layout-accepts-first-worker-window
  (let [incoming {:root {:block/uuid (random-uuid)}
                  :rows [{:block/uuid (random-uuid)
                          :block/title "b4"}]
                  :offset 0
                  :total-count 1}]
    (is (= incoming (page-window/merge-layout nil incoming)))))

(deftest merge-page-window-layout-preserves-unchanged-row-identity
  (let [block-id (random-uuid)
        current-row {:db/id 1
                     :block/uuid block-id
                     :block/title "unchanged"
                     :block/order "a0"
                     :block/level 1}
        current {:root {:db/id 10 :block/uuid (random-uuid)}
                 :rows [current-row]
                 :offset 0
                 :total-count 1}
        incoming {:root (:root current)
                  :rows [{:db/id 1
                          :block/uuid block-id
                          :block/order "a0"
                          :block/level 1}]
                  :offset 0
                  :total-count 1}
        merged (page-window/merge-layout current incoming)]
    (is (identical? current-row (first (:rows merged)))
        "Unchanged layout rows should not force block components to rerender.")))

(deftest merge-page-window-layout-replaces-rendered-row-data
  (let [block-id (random-uuid)
        current {:root {:db/id 10 :block/uuid (random-uuid)}
                 :rows [{:db/id 1
                         :block/uuid block-id
                         :block/title ""
                         :block/level 1
                         :logseq.property/order-list-type "number"}]
                 :offset 0
                 :total-count 1}
        incoming {:root (:root current)
                  :rows [{:db/id 1
                          :block/uuid block-id
                          :block/title ""
                          :block/level 1}]
                  :offset 0
                  :total-count 1}
        merged (page-window/merge-layout current incoming)]
    (is (not (contains? (first (:rows merged))
                        :logseq.property/order-list-type))
        "A rendered worker row is canonical, including removed attributes.")))
