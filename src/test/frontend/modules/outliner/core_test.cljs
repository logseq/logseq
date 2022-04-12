(ns frontend.modules.outliner.core-test
  (:require [cljs.test :refer [deftest is use-fixtures testing] :as test]
            [frontend.test.fixtures :as fixtures]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.utils :as outliner-u]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.db :as db]))

(use-fixtures :each
  fixtures/load-test-env
  fixtures/react-components
  fixtures/reset-db)

(defn build-block
  ([id]
   (build-block id nil nil))
  ([id parent-id left-id & [m]]
   (let [m (->> (merge m {:block/uuid id
                          :block/parent
                          (outliner-u/->block-lookup-ref parent-id)
                          :block/left
                          (outliner-u/->block-lookup-ref left-id)
                          :block/content (str id)})
                (remove #(nil? (val %)))
                (into {}))]
     (outliner-core/block m))))

(defn get-block
  ([id]
   (get-block id false))
  ([id node?]
   (cond-> (frontend.db/pull [:block/uuid id])
     node?
     outliner-core/block)))

(defrecord TreeNode [id children])

(defn build-node-tree
  [[id children :as _tree]]
  (let [children (mapv build-node-tree children)]
    (->TreeNode id children)))

(defn build-db-records
  "build RDS record from memory node struct."
  [tree-record]
  (outliner-tx/transact!
    {}
    (letfn [(build [node queue]
              (let [{:keys [id left parent]} node
                    block (build-block id parent left)
                    left (atom (:id node))
                    children (map (fn [c]
                                    (let [node (assoc c :left @left :parent (:id node))]
                                      (swap! left (constantly (:id c)))
                                      node))
                               (:children node))
                    queue (concat queue children)]
                (outliner-core/save-block! (:data block))
                (when (seq queue)
                  (build (first queue) (rest queue)))))]
      (let [root (assoc tree-record :left "1" :parent "1")]
        (outliner-core/save-block! (:data (build-block "1")))
        (build root '())))))


(def tree [1 [[2 [[3 [[4]
                      [5]]]
                  [6 [[7 [[8]]]]]
                  [9 [[10]
                      [11]]]]]
              [12 [[13]
                   [14]
                   [15]]]
              [16 [[17]]]]])

(def node-tree (build-node-tree tree))

(deftest test-delete-block
  (testing "
  Insert a node between 6 and 9.
  [1 [[2 [[3 [[4]
              [5]]]
          [6 [[7 [[8]]]]]  ;; delete 6
          [9 [[10]
              [11]]]]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
   "
    (build-db-records node-tree)
    (let [block (get-block 6)]
      (outliner-tx/transact! {}
        (outliner-core/delete-blocks! [block] true))
      (let [children-of-2 (->> (get-block 2 true)
                               (tree/-get-children)
                               (mapv #(-> % :data :block/uuid)))]
        (is (= [3 9] children-of-2))))))

(deftest test-move-block-as-sibling
  (testing "
  Move 3 between 14 and 15.
  [1 [[2 [[6 [[7 [[8]]]]]
          [9 [[10]
              [11]]]]]
      [12 [[13]
           [14]
           [3 [[4]    ;; moved 3
               [5]]]
           [15]]]
      [16 [[17]]]]]
   "
    (build-db-records node-tree)
    (outliner-tx/transact!
      {}
      (outliner-core/move-blocks! [(get-block 3)] (get-block 14) true))
    (let [old-parent's-children (->> (get-block 2 true)
                                     (tree/-get-children)
                                     (mapv #(-> % :data :block/uuid)))
          new-parent's-children (->> (get-block 12 true)
                                     (tree/-get-children)
                                     (mapv #(-> % :data :block/uuid)))]
      (is (= [6 9] old-parent's-children))
      (is (= [13 14 3 15] new-parent's-children))))

  (deftest test-move-block-as-first-child
    (testing "
  Move 3 as first child of 12.

  [1 [[2 [[6 [[7 [[8]]]]]
          [9 [[10]
              [11]]]]]
      [12 [[3 [[4]    ;; moved 3
               [5]]]
           [13]
           [14]
           [15]]]
      [16 [[17]]]]]
   "
      (build-db-records node-tree)
      (outliner-tx/transact!
        {}
        (outliner-core/move-blocks! [(get-block 3)] (get-block 12) false))
      (let [old-parent's-children (->> (get-block 2 true)
                                       (tree/-get-children)
                                       (mapv #(-> % :data :block/uuid)))
            new-parent's-children (->> (get-block 12 true)
                                       (tree/-get-children)
                                       (mapv #(-> % :data :block/uuid)))]
        (is (= [6 9] old-parent's-children))
        (is (= [3 13 14 15] new-parent's-children))))))


(deftest test-indent-blocks
  (testing "
  [1 [[2 [[3
           [[4]
            [5]
            [6 [[7 [[8]]]]] ;; indent 6, 9
            [9 [[10]
                [11]]]]]]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
  "
    (build-db-records node-tree)
    (outliner-tx/transact!
      {}
      (outliner-core/indent-outdent-blocks! [(get-block 6) (get-block 9)] true))
    (let [children-of-3 (->> (build-block 3)
                             (tree/-get-children)
                             (mapv #(-> % :data :block/uuid)))]
      (is (= [4 5 6 9] children-of-3)))))

(deftest test-outdent-blocks
  (testing "
  [1 [[2 [[3]
          [4] ;; outdent 4, 5
          [5]
          [6 [[7 [[8]]]]]
          [9 [[10]
              [11]]]]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
  "
    (build-db-records node-tree)
    (outliner-tx/transact!
      {}
      (outliner-core/indent-outdent-blocks! [(get-block 4) (get-block 5)] false))
    (let [children-of-2 (->> (build-block 2)
                             (tree/-get-children)
                             (mapv #(-> % :data :block/uuid)))]
      (is (= [3 4 5 6 9] children-of-2)))))

(deftest test-delete-blocks
  (testing "
  [1 [[2 [[3 [[4]
              [5]]]
          ;[6 [[7 [[8]]]]] delete 6, 9
          ;[9 [[10]
          ;    [11]]]
          ]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
"
    (build-db-records node-tree)
    (outliner-tx/transact!
      {}
      (outliner-core/delete-blocks! [(get-block 6) (get-block 9)] {}))
    (let [children-of-2 (->> (build-block 2)
                             (tree/-get-children)
                             (mapv #(-> % :data :block/uuid)))]
      (is (= [3] children-of-2)))))

(deftest test-move-blocks-up-down
  (testing "
  [1 [[2 [[3 [[4]
              [5]]]
          [9 [[10] ;; swap 6 and 9
              [11]]]
          [6 [[7 [[8]]]]]]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
  "
    (build-db-records node-tree)
    (outliner-tx/transact!
      {}
      (outliner-core/move-blocks-up-down! [(get-block 9)] true))
    (let [children-of-2 (->> (build-block 2)
                             (tree/-get-children)
                             (mapv #(-> % :data :block/uuid)))]
      (is (= [3 9 6] children-of-2)))))

(deftest test-insert-blocks
  (testing "
  add [18 [19 20] 21] after 6

  [1 [[2 [[3 [[4]
              [5]]]
          [6 [[7 [[8]]]]]
          [9 [[10]
              [11]]]]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
 "
    (build-db-records node-tree)
    (let [new-blocks [(:data (build-block 18))
                      (:data (build-block 19 18 18))
                      (:data (build-block 20 18 19))
                      (assoc (:data (build-block 21))
                             :block/level :top)]
          target-block (get-block 6)]
      (outliner-tx/transact!
        {}
        (outliner-core/insert-blocks! new-blocks target-block {:sibling? true
                                                               :keep-uuid? true}))
      (let [children-of-2 (->> (build-block 2)
                               (tree/-get-children)
                               (mapv #(-> % :data :block/uuid)))]
        (is (= [3 6 18 21 9] children-of-2)))

      (let [children-of-18 (->> (build-block 18)
                                (tree/-get-children)
                                (mapv #(-> % :data :block/uuid)))]
        (is (= [19 20] children-of-18))))))

(comment
  (cljs.test/run-tests))
