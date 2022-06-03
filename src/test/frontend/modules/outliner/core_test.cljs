(ns frontend.modules.outliner.core-test
  (:require [cljs.test :refer [deftest is use-fixtures testing] :as test]
            [clojure.test.check.generators :as gen]
            [frontend.test.fixtures :as fixtures]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [clojure.walk :as walk]
            [logseq.graph-parser.block :as gp-block]
            [datascript.core :as d]
            [frontend.test.helper :as helper]))

(def test-db helper/test-db)

(use-fixtures :each
  fixtures/load-test-env
  fixtures/react-components
  fixtures/reset-db)

(defn get-block
  ([id]
   (get-block id false))
  ([id node?]
   (cond-> (db/pull test-db '[*] [:block/uuid id])
     node?
     outliner-core/block)))

(defn build-node-tree
  [col]
  (let [blocks (->> col
                    (walk/postwalk
                     (fn [f]
                       (if (and (vector? f)
                                (= 2 (count f))
                                (integer? (first f))
                                (vector? (second f)))
                         {:block/uuid (first f)
                          :block/children (let [v (second f)]
                                            (cond
                                              (sequential? v)
                                              (mapv
                                               (fn [v]
                                                 (if (integer? v)
                                                   [v]
                                                   v))
                                               v)

                                              :else
                                              [[v]]))}
                         f)))

                    (walk/postwalk
                     (fn [f]
                       (if (and (vector? f)
                                (= 1 (count f))
                                (integer? (first f)))
                         {:block/uuid (first f)}
                         f))))
        blocks (outliner-core/tree-vec-flatten blocks :block/children)]
    (map (fn [block] (assoc block
                            :block/page 1
                            :block/content 1)) blocks)))

(defn- build-blocks
  [tree]
  (gp-block/with-parent-and-left 1 (build-node-tree tree)))

(defn transact-tree!
  [tree]
  (db/transact! test-db (concat [{:db/id 1
                                  :block/uuid 1
                                  :block/name "Test page"}]
                                (build-blocks tree))))

(def tree
  [[22 [[2 [[3 [[4]
                [5]]]
            [6 [[7 [[8]]]]]
            [9 [[10]
                [11]]]]]
        [12 [[13]
             [14]
             [15]]]
        [16 [[17]]]]]])

(defn get-blocks-count
  []
  (count (d/datoms (db/get-db test-db) :avet :block/uuid)))

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
      (outliner-tx/transact! {:graph test-db}
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
      {:graph test-db}
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
        {:graph test-db}
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
      {:graph test-db}
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
      {:graph test-db}
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
      {:graph test-db}
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
      {:graph test-db}
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
        {:graph test-db}
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
          {:graph test-db}
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

;;; Fuzzy tests

(def init-id (atom 100))

(def unique-id (gen/fmap (fn [_] (swap! init-id inc)) gen/nat))
(def compound (fn [inner-gen]
                (gen/tuple unique-id (gen/vector inner-gen 1 2))))

(def gen-node (gen/recursive-gen compound unique-id))

(def gen-tree (gen/vector gen-node))

(defn- gen-safe-tree
  []
  (->> (gen/generate gen-tree)
       (remove integer?)))

(defn gen-blocks
  []
  (let [tree (gen-safe-tree)]
    (if (seq tree)
      (let [result (build-blocks tree)]
        (if (seq result)
          result
          (gen-blocks)))
      (gen-blocks))))

(defn insert-blocks!
  [blocks target]
  (outliner-tx/transact! {:graph test-db}
    (outliner-core/insert-blocks! blocks
                                  target
                                  {:sibling? (gen/generate gen/boolean)
                                   :keep-uuid? true
                                   :replace-empty-target? false})))

(defn transact-random-tree!
  []
  (let [tree (gen-safe-tree)]
    (transact-tree! tree)))

(defn get-datoms
  []
  (d/datoms (db/get-db test-db) :avet :block/uuid))

(defn get-random-block
  []
  (let [datoms (->> (get-datoms)
                    (remove (fn [datom] (= 1 (:e datom)))))]
    (if (seq datoms)
      (let [id (:e (gen/generate (gen/elements datoms)))]
        (db/pull test-db '[*] id))
      (do
        (transact-random-tree!)
        (get-random-block)))))

(defn get-random-successive-blocks
  []
  (let [limit (inc (rand-int 20))]
    (when-let [block (get-random-block)]
      (loop [result [block]
             node block]
        (if-let [next (outliner-core/get-right-sibling (:db/id node))]
          (let [next (db/pull test-db '[*] (:db/id next))]
            (if (>= (count result) limit)
              result
              (recur (conj result next) next)))
          result)))))

#_(deftest ^:long random-inserts
  (testing "Random inserts"
    (transact-random-tree!)
    (let [c1 (get-blocks-count)
          *random-count (atom 0)]
      (dotimes [_i 100]
        (let [blocks (gen-blocks)]
          (swap! *random-count + (count blocks))
          (insert-blocks! blocks (get-random-block))))
      (let [total (get-blocks-count)]
        (is (= total (+ c1 @*random-count)))))))

#_(deftest ^:long random-deletes
  (testing "Random deletes"
    (transact-random-tree!)
    (dotimes [_i 100]
      (insert-blocks! (gen-blocks) (get-random-block))
      (let [blocks (get-random-successive-blocks)]
        (when (seq blocks)
          (outliner-tx/transact! {:graph test-db}
            (outliner-core/delete-blocks! blocks {})))))))

(deftest ^:long random-moves
  (testing "Random moves"
    (transact-random-tree!)
    (let [c1 (get-blocks-count)
          *random-count (atom 0)]
      (dotimes [_i 100]
        (let [blocks (gen-blocks)]
          (swap! *random-count + (count blocks))
          (insert-blocks! blocks (get-random-block)))
        (let [blocks (get-random-successive-blocks)]
          (when (seq blocks)
            (let [target (get-random-block)]
              (outliner-tx/transact! {:graph test-db}
                (outliner-core/move-blocks! blocks target (gen/generate gen/boolean)))
              (let [total (get-blocks-count)]
                (is (= total (+ c1 @*random-count)))))))))))

;; TODO: Enable when not failing as intermittently
#_(deftest ^:long random-move-up-down
  (testing "Random move up down"
    (transact-random-tree!)
    (let [c1 (get-blocks-count)
          *random-count (atom 0)]
      (dotimes [_i 100]
        (let [blocks (gen-blocks)]
          (swap! *random-count + (count blocks))
          (insert-blocks! blocks (get-random-block)))
        (let [blocks (get-random-successive-blocks)]
          (when (seq blocks)
            (outliner-tx/transact! {:graph test-db}
              (outliner-core/move-blocks-up-down! blocks (gen/generate gen/boolean)))
            (let [total (get-blocks-count)]
              (is (= total (+ c1 @*random-count))))))))))

;; TODO: Enable when not failing as intermittently
#_(deftest ^:long random-indent-outdent
  (testing "Random indent and outdent"
    (transact-random-tree!)
    (let [c1 (get-blocks-count)
          *random-count (atom 0)]
      (dotimes [_i 100]
        (let [blocks (gen-blocks)]
          (swap! *random-count + (count blocks))
          (insert-blocks! blocks (get-random-block)))
        (let [blocks (get-random-successive-blocks)]
          (when (seq blocks)
            (outliner-tx/transact! {:graph test-db}
              (outliner-core/indent-outdent-blocks! blocks (gen/generate gen/boolean)))
            (let [total (get-blocks-count)]
              (is (= total (+ c1 @*random-count))))))))))

(deftest ^:long random-mixed-ops
  (testing "Random mixed operations"
    (transact-random-tree!)
    (let [c1 (get-blocks-count)
          *random-count (atom 0)
          ops [
               ;; insert
               (fn []
                 (let [blocks (gen-blocks)]
                   (swap! *random-count + (count blocks))
                   (insert-blocks! blocks (get-random-block))))

               ;; delete
               (fn []
                 (let [blocks (get-random-successive-blocks)]
                   (when (seq blocks)
                     (swap! *random-count - (count blocks))
                     (outliner-tx/transact! {:graph test-db}
                       (outliner-core/delete-blocks! blocks {})))))

               ;; move
               (fn []
                 (let [blocks (get-random-successive-blocks)]
                   (when (seq blocks)
                     (outliner-tx/transact! {:graph test-db}
                       (outliner-core/move-blocks! blocks (get-random-block) (gen/generate gen/boolean))))))

               ;; move up down
               (fn []
                 (let [blocks (get-random-successive-blocks)]
                   (when (seq blocks)
                     (outliner-tx/transact! {:graph test-db}
                      (outliner-core/move-blocks-up-down! blocks (gen/generate gen/boolean))))))

               ;; indent outdent
               (fn []
                 (let [blocks (get-random-successive-blocks)]
                   (when (seq blocks)
                     (outliner-tx/transact! {:graph test-db}
                       (outliner-core/indent-outdent-blocks! blocks (gen/generate gen/boolean))))))]]
      (dotimes [_i 500]
        ((rand-nth ops)))
      (let [total (get-blocks-count)
            page-id 1]

        ;; Invariants:

        ;; 1. created blocks length >= existing blocks + deleted top-level blocks
        (is (<= total (+ c1 @*random-count)))

        ;; 2. verify page's length + page itself = total blocks
        (is (= (inc (db-model/get-page-blocks-count test-db page-id))
               total))

        ;; 3. verify the outliner parent/left structure
        (is (= (inc (count (db-model/get-paginated-blocks test-db page-id {:limit total
                                                                           :use-cache? false})))
               total))))))

(comment
  (dotimes [i 5]
    (cljs.test/run-tests))
  )
