(ns frontend.modules.outliner.core-test
  (:require [cljs.test :refer [deftest is use-fixtures testing] :as test]
            [frontend.test.fixtures :as fixtures]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.db :as db]
            [clojure.walk :as walk]
            [frontend.format.block :as block]))

(use-fixtures :each
  fixtures/load-test-env
  fixtures/react-components
  fixtures/reset-db)

(defn get-block
  ([id]
   (get-block id false))
  ([id node?]
   (cond-> (db/pull [:block/uuid id])
     node?
     outliner-core/block)))

(defn build-node-tree
  [col]
  (let [blocks (walk/postwalk
                (fn [f]
                  (cond
                    (and (vector? f)
                         (= 2 (count f))
                         (integer? (first f)))
                    {:block/uuid (first f)
                     :block/children (let [v (second f)]
                                       (if (sequential? v) v [v]))}

                    (and (vector? f)
                         (= 1 (count f))
                         (integer? (first f)))
                    {:block/uuid (first f)}

                    :else
                    f))
                col)]
    (outliner-core/tree-vec-flatten blocks :block/children)))

(defn- build-blocks
  [tree]
  (block/with-parent-and-left 1 (build-node-tree tree)))

(defn transact-tree!
  [tree]
  (db/transact! (build-blocks tree)))

(def tree
  [[1 [[2 [[3 [[4]
               [5]]]
           [6 [[7 [[8]]]]]
           [9 [[10]
               [11]]]]]
       [12 [[13]
            [14]
            [15]]]
       [16 [[17]]]]]])

(defn get-children
  [id]
  (->> (get-block id true)
       (tree/-get-children)
       (mapv #(-> % :data :block/uuid))))

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
    (transact-tree! tree)
    (let [block (get-block 6)]
      (outliner-tx/transact! {}
        (outliner-core/delete-blocks! [block] true))
      (is (= [3 9] (get-children 2))))))

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
    (transact-tree! tree)
    (outliner-tx/transact!
      {}
      (outliner-core/move-blocks! [(get-block 3)] (get-block 14) true))
    (is (= [6 9] (get-children 2)))
    (is (= [13 14 3 15] (get-children 12))))

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
      (transact-tree! tree)
      (outliner-tx/transact!
        {}
        (outliner-core/move-blocks! [(get-block 3)] (get-block 12) false))
      (is (= [6 9] (get-children 2)))
      (is (= [3 13 14 15] (get-children 12))))))

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
    (transact-tree! tree)
    (outliner-tx/transact!
      {}
      (outliner-core/indent-outdent-blocks! [(get-block 6) (get-block 9)] true))
    (is (= [4 5 6 9] (get-children 3)))))

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
    (transact-tree! tree)
    (outliner-tx/transact!
      {}
      (outliner-core/indent-outdent-blocks! [(get-block 4) (get-block 5)] false))
    (is (= [3 4 5 6 9] (get-children 2)))))

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
    (transact-tree! tree)
    (outliner-tx/transact!
      {}
      (outliner-core/delete-blocks! [(get-block 6) (get-block 9)] {}))
    (is (= [3] (get-children 2)))))

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
    (transact-tree! tree)
    (outliner-tx/transact!
      {}
      (outliner-core/move-blocks-up-down! [(get-block 9)] true))
    (is (= [3 9 6] (get-children 2)))))

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
    (transact-tree! tree)
    (let [new-blocks (build-blocks [[18 [[19] [20]]]
                                    [21]])
          target-block (get-block 6)]
      (outliner-tx/transact!
        {}
        (outliner-core/insert-blocks! new-blocks target-block {:sibling? true
                                                               :keep-uuid? true
                                                               :replace-empty-target? false}))
      (is (= [3 6 18 21 9] (get-children 2)))

      (is (= [19 20] (get-children 18))))))

(deftest test-batch-transact
  (testing "add 4, 5 after 2 and delete 3"
    (let [tree [[1 [[2] [3]]]]]
      (transact-tree! tree)
      (let [new-blocks (build-blocks [[4 [5]]])
            target-block (get-block 2)]
        (outliner-tx/transact!
          {}
          (outliner-core/insert-blocks! new-blocks target-block {:sibling? false
                                                                 :keep-uuid? true
                                                                 :replace-empty-target? false})
          (outliner-core/delete-blocks! [(get-block 3)] {}))

        (is (= [4] (get-children 2)))

        (is (= [5] (get-children 4)))

        (is (nil? (get-block 3)))))))

(deftest test-bocks-with-level
  (testing "blocks with level"
    (is (= (outliner-core/blocks-with-level
            [{:db/id 6,
              :block/left #:db{:id 3},
              :block/level 3,
              :block/parent #:db{:id 2},
              :block/uuid 6}
             {:db/id 9,
              :block/left #:db{:id 6},
              :block/level 3,
              :block/parent #:db{:id 2},
              :block/uuid 9}])
           [{:db/id 6,
             :block/left #:db{:id 3},
             :block/level 1,
             :block/parent #:db{:id 2},
             :block/uuid 6}
            {:db/id 9,
             :block/left #:db{:id 6},
             :block/level 1,
             :block/parent #:db{:id 2},
             :block/uuid 9}]))
    (is (= (outliner-core/blocks-with-level
            [{:db/id 6,
              :block/left #:db{:id 3},
              :block/level 3,
              :block/parent #:db{:id 2},
              :block/uuid 6}
             {:db/id 9,
              :block/left #:db{:id 6},
              :block/level 4,
              :block/parent #:db{:id 6},
              :block/uuid 9}])
           [{:db/id 6,
             :block/left #:db{:id 3},
             :block/level 1,
             :block/parent #:db{:id 2},
             :block/uuid 6}
            {:db/id 9,
             :block/left #:db{:id 6},
             :block/level 2,
             :block/parent #:db{:id 6},
             :block/uuid 9}]))))

(comment
  (cljs.test/run-tests))
