(ns frontend.modules.outliner.tree-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures]]
            [frontend.modules.outliner.tree :as tree]
            [frontend.db.conn :as conn]
            [frontend.db.outliner :as db-outliner]
            [datascript.core :as d]
            [frontend.util :as util]))

(defn build-block
  ([id]
   (build-block id nil nil))
  ([id parent-id left-id & [m]]
   (let [m (-> (merge m {:block/id id})
               (util/assoc-when :block/parent-id parent-id
                                :block/left-id left-id))
         m (->> (remove #(nil? (val %)) m)
                (into {}))]
     (tree/->Block id m))))

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
                  block (build-block id  parent left)
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

(def records (-> (build-render-tree tree)
                 (build-sql-records)))

(def db (atom records))

(defn find-node
  ([id]
   (when-let [m (some #(when (= id (:id %)) %)
                      @db)]
     (map->TestNode m)))
  ([parent left]
   (when-let [m (some #(when (and (= parent (:parent %))
                                  (= left (:left %)))
                         %)
                      @db)]
     (map->TestNode m))))

(extend-type TestNode
  tree/INode
  (-get-id [this]
    (:id this))

  (-get-parent-id [this]
    (:parent this))

  (-set-parent-id [this parent-id]
    (assoc this :parent parent-id))

  (-get-left-id [this]
    (:left this))

  (-set-left-id [this left-id]
    (assoc this :left left-id))

  (-get-parent [this]
    (find-node (:parent this)))

  (-get-left [this]
    (find-node (:left this)))

  (-get-right [this]
    (find-node (:parent this)
               (:id this)))

  (-get-down [this]
    (find-node (:id this) (:id this)))

  (-save [this]
    (let [id (:id this)]
      (swap! db (fn [db]
                  (-> (remove #(= (:id %) id) db)
                      (conj this))))))

  (-get-children [this]
    (let [first-child (tree/-get-down this)]
      (loop [current first-child
             children [first-child]]
        (if-let [node (tree/-get-right current)]
          (recur node (conj children node))
          children)))))

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
  (reset! db records)
  (let [new-node (->TestNode 18 nil nil)
        left-node (->TestNode 6 2 3)]
    (tree/insert-node-after-first new-node left-node)
    (let [children-of-2 (->> (->TestNode 2 1 1)
                             (tree/-get-children)
                             (mapv :id))]
      (is (= [3 6 18 9] children-of-2)))))

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
  (reset! db records)
  (let [new-node (->TestNode 18 nil nil)
        parent-node (->TestNode 2 1 1)]
    (tree/insert-node-as-first new-node parent-node)
    (let [children-of-2 (->> (->TestNode 2 1 1)
                             (tree/-get-children)
                             (mapv :id))]
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
  (reset! db records)
  (let [node (->TestNode 6 2 3)]
    (tree/delete-node node)
    (let [children-of-2 (->> (->TestNode 2 1 1)
                             (tree/-get-children)
                             (mapv :id))]
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
  (reset! db records)
  (let [node (->TestNode 3 2 2)
        new-parent (->TestNode 12 1 2)
        new-left (->TestNode 14 12 13)]
    (tree/move-subtree node new-parent new-left)
    (let [old-parent's-children (->> (->TestNode 2 1 1)
                                     (tree/-get-children)
                                     (mapv :id))
          new-parent's-children (->> (->TestNode 12 1 2)
                                     (tree/-get-children)
                                     (mapv :id))]
      (is (= [6 9] old-parent's-children))
      (is (= [13 14 3 15] new-parent's-children)))))

(deftest test-get-node-list-with-cursor
  (reset! db records)
  (let [cursor (-> (build-root-test-node 1)
                   (tree/init-cursor))
        number 7
        {:keys [acc cursor]}
        (tree/get-node-list-with-cursor number cursor)]
    (is (= [1 2 3 4 5 6 7] (mapv :id acc)))

    (let [{:keys [acc cursor]}
          (tree/get-node-list-with-cursor number cursor)]

      (is (= [8 9 10 11 12 13 14] (mapv :id acc)))

      (let [{:keys [acc]}
            (tree/get-node-list-with-cursor number cursor)]
        (is (= [15 16 17] (mapv :id acc)))))))


(comment
  (defn build-node-from-sql-record
    "build node from RDS records"
    [node-id sql-records]
    (letfn [(get-right
              [node-id children]
              (some #(when (= (:left %) node-id)
                       %)
                    children))

            (sort-children
              [parent-node-id children]
              (loop [node-id parent-node-id
                     result []]
                (if-let [node (get-right node-id children)]
                  (let [result (conj result node)]
                    (recur (:id node) result))
                  (do
                    (when (not= (count children) (count result))
                      (throw (js/Error "children data error, ")))
                    result))))

            (get-children
              [node-id]
              (filter #(= (:parent %) node-id) sql-records))

            (build [node-id depth]
              (when (= depth 20)
                (throw (js/Error "Recur depth is too large.")))
              (let [children (some->> (get-children node-id)
                                      (sort-children node-id))
                    children (mapv #(build (:id %) (inc depth)) children)]
                (->RenderNode node-id children)))]
      (build node-id 0)))

  (deftest test-serialize-&-deserialize-tree
    (let [tree-record (build-render-tree tree)
          sql-record (build-sql-records tree-record)
          tree (build-node-from-sql-record 1 sql-record)]
      (is (= tree tree-record)))))