(ns frontend.worker.rtc.op-mem-layer-test
  (:require [cljs.test :as t :refer [deftest is testing]]
            [frontend.worker.rtc.op-mem-layer :as op-layer]
            [frontend.worker.rtc.fixture :as fixture]
            [frontend.test.helper :as test-helper]))

(t/use-fixtures :each fixture/clear-op-mem-stores-fixture)

(def ^:private repo test-helper/test-db-name-db-version)

(deftest add-ops!-test
  (let [block-uuid #uuid "663dd373-41b0-4c59-aa6f-f349eea82609"]
    (testing "move+update on same block"
      (let [ops [[:move
                  1
                  {:block-uuid block-uuid}]
                 [:update
                  1
                  {:block-uuid block-uuid,
                   :av-coll
                   [[:block/updated-at "[\"~#'\",1715327859860]" 1 true]
                    [:block/created-at "[\"~#'\",1715327859860]" 1 true]
                    [:block/content "[\"~#'\",\"\"]" 1 true]]}]]]
        (op-layer/add-ops! repo ops)
        (is (= {:move
                [:move
                 1
                 {:block-uuid block-uuid}],
                :update
                [:update
                 1
                 {:block-uuid block-uuid,
                  :av-coll
                  [[:block/updated-at "[\"~#'\",1715327859860]" 1 true]
                   [:block/created-at "[\"~#'\",1715327859860]" 1 true]
                   [:block/content "[\"~#'\",\"\"]" 1 true]]}]}
               (op-layer/get-block-ops repo block-uuid)))))

    (testing "more updates on this block"
      (let [ops [[:update
                  2
                  {:block-uuid block-uuid,
                   :av-coll
                   [[:block/updated-at "[\"~#'\",1715327859860]" 2 false]
                    [:block/updated-at "[\"~#'\",1715329245395]" 2 true]
                    [:block/content "[\"~#'\",\"\"]" 2 false]
                    [:block/content "[\"~#'\",\"iii\"]" 2 true]]}]
                 [:update
                  3
                  {:block-uuid block-uuid,
                   :av-coll
                   [[:block/tags #uuid "663dd8e0-8840-4411-ab6f-2632ac36bf11" 3 true]]}]]]
        (op-layer/add-ops! repo ops)
        (is (=
             {:move
              [:move
               1
               {:block-uuid block-uuid}],
              :update
              [:update
               3
               {:block-uuid block-uuid,
                :av-coll
                [[:block/updated-at "[\"~#'\",1715327859860]" 1 true]
                 [:block/created-at "[\"~#'\",1715327859860]" 1 true]
                 [:block/content "[\"~#'\",\"\"]" 1 true]
                 [:block/updated-at "[\"~#'\",1715327859860]" 2 false]
                 [:block/updated-at "[\"~#'\",1715329245395]" 2 true]
                 [:block/content "[\"~#'\",\"\"]" 2 false]
                 [:block/content "[\"~#'\",\"iii\"]" 2 true]
                 [:block/tags #uuid "663dd8e0-8840-4411-ab6f-2632ac36bf11" 3 true]]}]}
             (op-layer/get-block-ops repo block-uuid)))
        (is (= [1 block-uuid]
               (first (:t+block-uuid-sorted-set (:current-branch (get @op-layer/*ops-store repo))))))))

    (testing "insert some other blocks"
      (let [block-uuids (repeatedly 3 random-uuid)
            ops (map-indexed (fn [idx block-uuid]
                               [:move (+ idx 4) {:block-uuid block-uuid}]) block-uuids)]
        (op-layer/add-ops! repo ops)
        (is (= block-uuid (:block-uuid (op-layer/get-min-t-block-ops repo))))))

    (testing "remove this block"
      (let [ops [[:remove 999 {:block-uuid block-uuid}]]]
        (op-layer/add-ops! repo ops)
        (is (=
             {:remove [:remove 999 {:block-uuid block-uuid}]}
             (op-layer/get-block-ops repo block-uuid)))))))
