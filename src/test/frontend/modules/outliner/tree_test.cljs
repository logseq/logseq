(ns frontend.modules.outliner.tree-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures]]
            [frontend.modules.outliner.tree :as tree]
            [frontend.db.conn :as conn]
            [datascript.core :as d]
            [frontend.db.outliner :as db-outliner]
            [datascript.impl.entity :as e]
            [frontend.util :as util]
            [frontend.react-impl :as r]))

(defrecord TestBlock [data])

(defn get-block-by-id
  [id]
  (let [c (conn/get-outliner-conn)
        r (try (db-outliner/get-by-id c [:block/id id])
               (catch js/Error e nil))]
    (when r (->TestBlock r))))

(def block-react-refs (atom {}))

(defn save-block-refs
  [parent-id left-id block-ref]
  (let [ref-key [parent-id left-id]]
    (if-let [ref-atom (get @block-react-refs ref-key)]
      (reset! ref-atom @block-ref)
      (swap! block-react-refs assoc ref-key block-ref))))

(defn del-block-refs
  [parent-id left-id]
  (let [ref-key [parent-id left-id]]
    (when-let [ref-atom (get @block-react-refs ref-key)]
      (reset! ref-atom nil))))

(defn get-block-from-react-refs
  [parent-id left-id]
  (let [ref-key [parent-id left-id]]
    (when-let [ref (get @block-react-refs ref-key)]
      (assert
        (instance? cljs.core/Atom (atom nil))
        "block-react-ref should be atom.")
      (deref ref))))

(defn get-block-by-parent-&-left
  [parent-id left-id]
  (let [c (conn/get-outliner-conn)
        r (db-outliner/get-by-parent-&-left
            c [:block/id parent-id] [:block/id left-id])
        block-ref (if r
                    (atom (->TestBlock r))
                    (atom r))]
    (save-block-refs parent-id left-id block-ref)
    (r/react block-ref)))

(defn ensure-block-id
  [id]
  (cond
    (or (e/entity? id) (map? id))
    (-> (db-outliner/get-by-id (conn/get-outliner-conn) (:db/id id))
      (:block/id))

    (vector? id)
    (second id)

    :else
    nil))

(extend-type TestBlock
  tree/INode
  (-get-id [this]
    (if-let [block-id (get-in this [:data :block/id])]
      block-id
      (throw (js/Error (util/format "Cant find id: %s" this)))))

  (-get-parent-id [this]
    (-> (get-in this [:data :block/parent-id])
      (ensure-block-id)))

  (-set-parent-id [this parent-id]
    (update this :data assoc :block/parent-id [:block/id parent-id]))

  (-get-left-id [this]
    (-> (get-in this [:data :block/left-id])
      (ensure-block-id)))

  (-set-left-id [this left-id]
    (update this :data assoc :block/left-id [:block/id left-id]))

  (-get-parent [this]
    (let [parent-id (tree/-get-parent-id this)]
      (get-block-by-id parent-id)))

  (-get-left [this]
    (let [left-id (tree/-get-left-id this)]
      (get-block-by-id left-id)))

  (-get-right [this]
    (let [left-id (tree/-get-id this)
          parent-id (tree/-get-parent-id this)]
      (get-block-by-parent-&-left parent-id left-id)))

  (-get-down [this]
    (let [parent-id (tree/-get-id this)]
      (get-block-by-parent-&-left parent-id parent-id)))

  (-save [this]
    (let [conn (conn/get-outliner-conn)
          data (:data this)
          block-id (tree/-get-id this)]
      (if-let [old-block (get-block-by-id block-id)]
        (let [parent-id (tree/-get-parent-id old-block)
              left-id (tree/-get-left-id old-block)]
          (when-let [block (get-block-from-react-refs parent-id left-id)]
            (let [atom-still-mine? (= block-id (tree/-get-id block))]
              (when atom-still-mine?
                (let [new-parent-id (tree/-get-parent-id this)
                      new-left-id (tree/-get-left-id this)]
                  (if (and
                        (= new-parent-id parent-id)
                        (= new-left-id left-id))
                    (save-block-refs parent-id left-id (atom block))
                    (del-block-refs parent-id left-id)))))))
        (let [parent-id (tree/-get-parent-id this)
              left-id (tree/-get-left-id this)]
          (save-block-refs parent-id left-id (atom this))))
      (db-outliner/save-block conn data)))

  (-del [this]
    (let [conn (conn/get-outliner-conn)
          block-id (tree/-get-id this)]
      (when-let [old-block (get-block-by-id block-id)]
        (let [parent-id (tree/-get-parent-id old-block)
              left-id (tree/-get-left-id old-block)]
          (if-let [data (get-block-from-react-refs parent-id left-id)]
            (let [atom-still-mine? (= block-id (:block/id data))]
              (when atom-still-mine?
                (del-block-refs parent-id left-id))))))
      (db-outliner/del-block conn [:block/id block-id])))

  (-get-children [this]
    (let [first-child (tree/-get-down this)]
      (loop [current first-child
             children [first-child]]
        (if-let [node (tree/-get-right current)]
          (recur node (conj children node))
          children)))))

(defn build-block-by-ident
  ([id]
   (build-block-by-ident id nil nil))
  ([id parent-id left-id & [m]]
   (let [m (->> (merge m {:block/id id
                          :block/parent-id parent-id
                          :block/left-id left-id})
             (remove #(nil? (val %)))
             (into {}))]
     (->TestBlock m))))

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

(defrecord TreeNode [id children])

(defn build-node-tree
  [[id children :as tree]]
  (let [children (mapv build-node-tree children)]
    (->TreeNode id children)))

(defn build-db-records
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

(def node-tree (build-node-tree tree))

(comment
  (binding [conn/*outline-db* (conn/create-outliner-db)]
    (build-db-records node-tree)
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
    (build-db-records node-tree)
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
    (build-db-records node-tree)
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
    (build-db-records node-tree)
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
    (build-db-records node-tree)
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
          (let [result-fn (render number down nil)]
            [(get-block-id node) (result-fn)]))
      (get-block-id node))))

(r/defc right-component
  [number node children node-tree]
  (let [right (tree/-get-right node)
        new-children (sibling-nodes children node-tree)]
    (if (and
          (tree/satisfied-inode? right)
          (pos? @number))
      (do (swap! number dec)
          (let [result-fn (render number right new-children)]
            (result-fn)))
      new-children)))

(r/defc render
  [number node children]
  (let [result-fn (down-component number node)
        node-tree (result-fn)]
    (let [result-fn (right-component number node children node-tree)]
      (result-fn))))

(r/defc render-react-tree
  [init-node node-number]
  (let [number (atom (dec node-number))
        result-fn (render number init-node nil)]
    (result-fn)))

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
    (build-db-records node-tree)
    (r/auto-clean-state
      (let [root (build-by-block-id 1 nil nil)
            number 10
            result-fn (render-react-tree root number)]
        (is (= [[1 [[2 [[3 [4
                            5]]
                        [6 [[7 [8]]]]
                        [9 [10]]]]]]]
              (result-fn)))
        #_[1 [[2 [[3 [[4]
                      [5]]]
                  [18] ;; add node
                  [6 [[7 [[8]]]]]
                  [9 [[10]
                      [11]]]]]
              [12 [[13]
                   [14]
                   [15]]]
              [16 [[17]]]]]
        (let [new-node (build-by-block-id 18 nil nil)
              left-node (build-by-block-id 3 2 2)]
          (tree/insert-node-after-first new-node left-node)
          (prn (result-fn)))))))
