(ns frontend.modules.outliner.tree-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests] :as test]
            [frontend.modules.outliner.tree :as tree]
            [datascript.core :as d]
            [frontend.react :as r]
            [frontend.db.conn :as conn]
            [frontend.modules.outliner.utils :as outliner-u]
            [frontend.modules.outliner.core]
            [frontend.fixtures :as fixtures]
            [nano-id.core :as nano]
            [cljs-run-test]))

(use-fixtures :each
  fixtures/react-impl
  fixtures/react-components
  fixtures/outliner-position-state
  fixtures/outliner-db)

(defn build-block
  ([id]
   (build-block id nil nil))
  ([id parent-id left-id & [m]]
   (let [m (->> (merge m {:block/id id
                          :block/parent-id
                          (outliner-u/->block-lookup-ref parent-id)
                          :block/left-id
                          (outliner-u/->block-lookup-ref left-id)
                          :block/content (str id)})
             (remove #(nil? (val %)))
             (into {}))]
     (outliner-u/->Block m))))

(defrecord TreeNode [id children])

(defn build-node-tree
  [[id children :as _tree]]
  (let [children (mapv build-node-tree children)]
    (->TreeNode id children)))

(defn build-db-records
  "build RDS record from memory node struct."
  [tree-record]
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
              (tree/-save block)
              (when (seq queue)
                (build (first queue) (rest queue)))))]
    (let [root (assoc tree-record :left "1" :parent "1")]
      (tree/-save (build-block "1"))
      (build root '()))))


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

(comment
  (build-db-records node-tree)
  (dotimes [i 18]
    (when-not (= i 0)
      (prn (d/pull @conn/outliner-db '[*] [:block/id i])))))

(deftest test-insert-node-as-sibling
  "
  Inert a node between 6 and 9.
  [1 [[2 [[3 [[4]
              [5]]]
          [6 [[7 [[8]]]]]
          [18]         ;; add
          [9 [[10]
              [11]]]]]
      [12 [[13]
           [14]
           [15]]]
      [16 [[17]]]]]
   "
  (build-db-records node-tree)
  (let [new-node (build-block 18 nil nil)
        left-node (build-block 6 2 3)]
    (tree/insert-node-as-sibling new-node left-node)
    (let [children-of-2 (->> (build-block 2 1 1)
                          (tree/-get-children)
                          (mapv #(-> % :data :block/id)))]
      (is (= [3 6 18 9] children-of-2)))))

(deftest test-insert-node-as-first-child
  "
  Inert a node between 6 and 9.
  [1 [[2 [[18]         ;; add
          [3 [[4]
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
  (let [new-node (build-block 18 nil nil)
        parent-node (build-block 2 1 1)]
    (tree/insert-node-as-first-child new-node parent-node)
    (let [children-of-2 (->> (build-block 2 1 1)
                          (tree/-get-children)
                          (mapv #(-> % :data :block/id)))]
      (is (= [18 3 6 9] children-of-2)))))

(deftest test-delete-node
  "
  Inert a node between 6 and 9.
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
  (let [node (build-block 6 2 3)]
    (tree/delete-node node)
    (let [children-of-2 (->> (build-block 2 1 1)
                          (tree/-get-children)
                          (mapv #(-> % :data :block/id)))]
      (is (= [3 9] children-of-2)))))


(deftest test-move-subtree
  "
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
  (let [node (build-block 3 2 2)
        new-parent (build-block 12 1 2)
        new-left (build-block 14 12 13)]
    (tree/move-subtree node new-parent new-left)
    (let [old-parent's-children (->> (build-block 2 1 1)
                                  (tree/-get-children)
                                  (mapv #(-> % :data :block/id)))
          new-parent's-children (->> (build-block 12 1 2)
                                  (tree/-get-children)
                                  (mapv #(-> % :data :block/id)))]
      (is (= [6 9] old-parent's-children))
      (is (= [13 14 3 15] new-parent's-children)))))

(defn- get-block-id
  [block]
  (get-in block [:data :block/id]))

(defn sibling-nodes
  [acc new-sibling]
  (if (empty? acc)
    [new-sibling]
    (conj acc new-sibling)))

(declare render)

(r/defc down-component
  [number node]
  (let [down (tree/-get-down node)]
    (if (and
          (tree/satisfied-inode? down)
          (pos? @number))
      (do (swap! number dec)
          [(get-block-id node)
           (->> (render number down nil)
             (r/with-key (str (tree/-get-id down) "-children"))
             (deref))])
      [(get-block-id node)])))

(r/defc right-component
  [number node children node-tree]
  (let [right (tree/-get-right node)
        new-children (sibling-nodes children node-tree)]
    (if (and
          (tree/satisfied-inode? right)
          (pos? @number))
      (do (swap! number dec)
          (->> (render number right new-children)
            (r/with-key (str (tree/-get-id right) "-find-right"))
            (deref)))
      new-children)))

(r/defc render
  [number node children]
  (let [node-tree (->> (down-component number node)
                    (r/with-key (str (tree/-get-id node) "-render-find-down"))
                    (deref))]
    (->> (right-component number node children node-tree)
      (r/with-key (str (tree/-get-id node) "-render-find-right"))
      (deref))))

(r/defc render-react-tree
  [init-node node-number]
  (let [num-react (r/react node-number)
        number (atom (dec num-react))]
    (->> (render number init-node nil)
      (r/with-key (str "render-react-tree-" (tree/-get-id init-node)))
      (deref))))

(deftest test-react-for-update-paginate-number
  "
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
  (let [root (build-block 1 nil nil)
        number (atom 10)
        result (->> (render-react-tree root number)
                 (r/with-key (str "root-" (tree/-get-id root))))]
    (is (= [[1 [[2 [[3 [[4]
                        [5]]]
                    [6 [[7 [[8]]]]]
                    [9 [[10]]]]]]]]
          @result))
    (do (reset! number 12)
        (is (= [[1 [[2 [[3 [[4] [5]]]
                        [6 [[7 [[8]]]]]
                        [9 [[10] [11]]]]]
                    [12]]]]
              @result)))))

(deftest test-react-for-insert-node-as-sibling
  "
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
  (let [root (build-block 1 nil nil)
        number (atom 10)
        result (->> (render-react-tree root number)
                 (r/with-key (str "root-" (tree/-get-id root))))]
    (is (= [[1 [[2 [[3 [[4]
                        [5]]]
                    [6 [[7 [[8]]]]]
                    [9 [[10]]]]]]]]
          @result))
    (let [new-node (build-block 18 nil nil)
          left-node (build-block 3 2 2)]
      (tree/insert-node-as-sibling new-node left-node)
      (is (= [[1 [[2 [[3 [[4]
                          [5]]]
                      [18]
                      [6 [[7 [[8]]]]]
                      [9]]]]]]
            @result)))))


(deftest test-react-insert-node-as-first-child
  "
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
  (let [root (build-block 1 nil nil)
        number (atom 10)
        result (->> (render-react-tree root number)
                 (r/with-key (str "root-" (tree/-get-id root))))]
    (is (= [[1 [[2 [[3 [[4]
                        [5]]]
                    [6 [[7 [[8]]]]]
                    [9 [[10]]]]]]]]
          @result))
    (let [new-node (build-block 18 nil nil)
          parent-node (build-block 2 1 1)]
      (tree/insert-node-as-first-child new-node parent-node)
      (is (= [[1 [[2 [[18]
                      [3 [[4] [5]]]
                      [6 [[7 [[8]]]]]
                      [9]]]]]]
            @result)))))

(deftest test-react-for-delete-node
  "
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
  (let [root (build-block 1 nil nil)
        number (atom 10)
        result (->> (render-react-tree root number)
                 (r/with-key (str "root-" (tree/-get-id root))))]
    (is (= [[1 [[2 [[3 [[4]
                        [5]]]
                    [6 [[7 [[8]]]]]
                    [9 [[10]]]]]]]]
          @result))
    (let [node (build-block 6 2 3)]
      (tree/delete-node node)
      (is (= [[1 [[2 [[3 [[4] [5]]]
                      [9 [[10] [11]]]]]
                  [12 [[13]]]]]]
            @result)))))

(deftest test-react-for-move-subtree
  "
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
  (let [root (build-block 1 nil nil)
        number (atom 20)
        result (->> (render-react-tree root number)
                 (r/with-key (str "root-" (tree/-get-id root))))]
    (is (= [[1 [[2 [[3 [[4]
                        [5]]]
                    [6 [[7 [[8]]]]]
                    [9 [[10]
                        [11]]]]]
                [12 [[13]
                     [14]
                     [15]]]
                [16 [[17]]]]]]
          @result))
    (let [node (build-block 3 2 2)
          new-parent (build-block 12 1 2)
          new-left (build-block 14 12 13)]
      (tree/move-subtree node new-parent new-left)
      (is (= [[1 [[2 [[6 [[7 [[8]]]]]
                      [9 [[10] [11]]]]]
                  [12 [[13]
                       [14]
                       [3 [[4]
                           [5]]]
                       [15]]]
                  [16 [[17]]]]]]
            @result)))))


