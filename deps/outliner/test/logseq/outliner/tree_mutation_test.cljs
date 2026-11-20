(ns logseq.outliner.tree-mutation-test
  "Cases of logseq.outliner.tree that no other test checks: a change to any of
   these lines left every test passing."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.tree :as otree]))

;; Fails if, in `blocks->vec-tree-data`, `not` becomes `identity`.
(deftest blocks->vec-tree-data-drops-root-tx-id-when-root-included
  (let [root {:db/id 1 :block/tx-id 5}
        child {:db/id 2
               :block/order "a0"
               :block/parent {:db/id 1}
               :block/tx-id 9}
        [root'] (otree/blocks->vec-tree-data [child] root {:include-root? true})]
    (is (= 1 (:db/id root')))
    (is (not (contains? root' :block/tx-id)))
    (is (= 5 (:block/tx-id (first (otree/blocks->vec-tree-data [child] root {:include-root? true
                                                                              :keep-block-tx-id? true})))))))

(defn- tree-shape
  "Each node as [title children-shapes]; a node without :block/children as [title]."
  [nodes]
  (mapv (fn [node]
          (if (contains? node :block/children)
            [(:block/title node) (tree-shape (:block/children node))]
            [(:block/title node)]))
        nodes))

(def ^:private page-uuid (random-uuid))
(def ^:private b1-uuid (random-uuid))

(def ^:private tree-db
  (delay
    @(db-test/create-conn-with-blocks
      [{:page {:block/title "tree page" :block/uuid page-uuid}
        :blocks [{:block/title "b1"
                  :block/uuid b1-uuid
                  :build/children [{:block/title "b2"}]}]}])))

(defn- page-block-entities
  [db]
  (let [b1 (d/entity db [:block/uuid b1-uuid])]
    [b1 (first (:block/_parent b1))]))

;; Fails if, in `get-root-and-page`, `if` becomes `if-not`, `true` becomes `false` or `false` becomes `true`.
;; Fails if, in `blocks->vec-tree`, `if` becomes `if-not`.
(deftest blocks->vec-tree-by-root-id-kind
  (let [db @tree-db
        page (d/entity db [:block/uuid page-uuid])
        b1 (d/entity db [:block/uuid b1-uuid])
        blocks (page-block-entities db)]
    (testing "a page's uuid as root: the page's children, page left out"
      (is (= [["b1" [["b2" []]]]] (tree-shape (otree/blocks->vec-tree db blocks page-uuid)))))
    (testing "a block's uuid as root: the block itself with its children"
      (is (= [["b1" [["b2" []]]]] (tree-shape (otree/blocks->vec-tree db blocks b1-uuid)))))
    (testing "a page's db id as root"
      (is (= [["b1" [["b2" []]]]] (tree-shape (otree/blocks->vec-tree db blocks (:db/id page))))))
    (testing "a block's db id as root"
      (is (= [["b1" [["b2" []]]]] (tree-shape (otree/blocks->vec-tree db blocks (:db/id b1))))))
    (testing "entities come back as plain maps with levels"
      (let [[b1'] (otree/blocks->vec-tree db blocks page-uuid)]
        (is (map? b1'))
        (is (= 1 (:block/level b1')))
        (is (= 2 (:block/level (first (:block/children b1')))))))))

;; Fails if, in `tree`, `or` becomes `and`.
;; Fails if, in `non-consecutive-blocks->vec-tree`, `or` becomes `and`.
(deftest non-consecutive-blocks->vec-tree-keeps-default-level
  (let [blocks [{:db/id 2 :block/title "top" :block/order "a0" :block/parent {:db/id 1}}
                {:db/id 3 :block/title "child" :block/order "a0" :block/parent {:db/id 2}}]]
    (is (= [2] (map :block/level (otree/non-consecutive-blocks->vec-tree blocks 2))))
    (is (= [1] (map :block/level (otree/non-consecutive-blocks->vec-tree blocks))))))
