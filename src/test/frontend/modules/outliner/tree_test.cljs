(ns frontend.modules.outliner.tree-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures]]
            [frontend.modules.outliner.tree :as tree]
            [frontend.db.conn :as conn]
            [datascript.core :as d]))

(defn build-block-by-ident
  ([id]
   (build-block-by-ident id nil nil))
  ([id parent-id left-id & [m]]
   (let [m (->> (merge m {:block/id id
                          :block/parent-id parent-id
                          :block/left-id left-id})
                (remove #(nil? (val %)))
                (into {}))]
     (tree/->Block m))))

(defn block-id->ident
  [id]
  (when id [:block/id id]))

(defn build-by-block-id
  ([id]
   (build-block-by-ident id nil nil))
  ([id parent-id left-id & [m]]
   (build-block-by-ident
     id
     (block-id->ident parent-id)
     (block-id->ident left-id)
     m)))

(defrecord RenderNode [id children])
(defrecord TestNode [id parent left])

(defn build-root-test-node
  [id]
  (->TestNode id :root :root))

(defn build-render-tree
  [[id children :as tree]]
  (let [children (mapv build-render-tree children)]
    (->RenderNode id children)))

(defn build-sql-records
  "build RDS record from memory node struct."
  [tree-record]
  (letfn [(build [node queue]
            (let [{:keys [id left parent]} node
                  block (build-by-block-id id parent left)
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
    (let [root (assoc tree-record :left nil :parent nil)]
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

(def node-tree (build-render-tree tree))

(comment
  (binding [conn/*outline-db* (conn/create-outliner-db)]
    (build-sql-records node-tree)
    (dotimes [i 18]
      (when-not (= i 0)
        (prn (d/pull @conn/*outline-db* '[*] [:block/id i]))))))

(deftest test-insert-node-after-first
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
  (binding [conn/*outline-db* (conn/create-outliner-db)]
    (build-sql-records node-tree)
    (let [new-node (build-by-block-id 18 nil nil)
          left-node (build-by-block-id 6 2 3)]
      (tree/insert-node-after-first new-node left-node)
      (let [children-of-2 (->> (build-block-by-ident 2 1 1)
                               (tree/-get-children)
                               (mapv #(-> % :data :block/id)))]
        (is (= [3 6 18 9] children-of-2))))))

(deftest test-insert-node-as-first
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
  (binding [conn/*outline-db* (conn/create-outliner-db)]
    (build-sql-records node-tree)
    (let [new-node (build-by-block-id 18 nil nil)
          parent-node (build-by-block-id 2 1 1)]
      (tree/insert-node-as-first new-node parent-node)
      (let [children-of-2 (->> (build-by-block-id 2 1 1)
                               (tree/-get-children)
                               (mapv #(-> % :data :block/id)))]
        (is (= [18 3 6 9] children-of-2))))))

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
  (binding [conn/*outline-db* (conn/create-outliner-db)]
    (build-sql-records node-tree)
    (let [node (build-by-block-id 6 2 3)]
      (tree/delete-node node)
      (let [children-of-2 (->> (build-by-block-id 2 1 1)
                               (tree/-get-children)
                               (mapv #(-> % :data :block/id)))]
        (is (= [3 9] children-of-2))))))


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
  (binding [conn/*outline-db* (conn/create-outliner-db)]
    (build-sql-records node-tree)
   (let [node (build-by-block-id 3 2 2)
         new-parent (build-by-block-id 12 1 2)
         new-left (build-by-block-id 14 12 13)]
     (tree/move-subtree node new-parent new-left)
     (let [old-parent's-children (->> (build-by-block-id 2 1 1)
                                      (tree/-get-children)
                                      (mapv #(-> % :data :block/id)))
           new-parent's-children (->> (build-by-block-id 12 1 2)
                                      (tree/-get-children)
                                      (mapv #(-> % :data :block/id)))]
       (is (= [6 9] old-parent's-children))
       (is (= [13 14 3 15] new-parent's-children))))))

(defn- get-block-id
  [block]
  (get-in block [:data :block/id]))

(defn single-node
  [node]
  (get-block-id node))

(defn node-&-children
  [node children]
  [(get-block-id node) children])

(defn sibling-nodes
  [acc new-sibling]
  (if (empty? acc)
    [new-sibling]
    (conj acc new-sibling)))

(deftest test-render-react-tree
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
  (binding [conn/*outline-db* (conn/create-outliner-db)]
    (build-sql-records node-tree)
    (let [root (build-by-block-id 1 nil nil)
          number 10
          renders {:single-node-render single-node
                   :parent-&-children-render node-&-children
                   :sibling-nodes-render sibling-nodes}
          result (tree/render-react-tree root number renders)]
      (is (= [[1 [[2 [[3 [4
                          5]]
                      [6 [[7 [8]]]]
                      [9 [10]]]]]]]
             result)))))
