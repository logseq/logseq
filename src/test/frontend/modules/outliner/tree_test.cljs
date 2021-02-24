(ns frontend.modules.outliner.tree-test
  (:require [cljs.test :refer [deftest is are testing use-fixtures run-tests]]
            [frontend.modules.outliner.tree :as tree]
            [frontend.db.conn :as conn]
            [datascript.core :as d]
            [frontend.db.outliner :as db-outliner]
            [datascript.impl.entity :as e]
            [frontend.util :as util]
            [frontend.react-impl :as r]))

(def block-react-refs (atom {}))

;(defn block-react-refs-fixtures
;  [f]
;  (reset! block-react-refs {})
;  (f)
;  (reset! block-react-refs {}))
;
;(use-fixtures :each block-react-refs-fixtures)

(defrecord TestBlock [data])

(defn get-block-by-id
  [id]
  (let [c (conn/get-outliner-conn)
        r (try (db-outliner/get-by-id c [:block/id id])
               (catch js/Error e nil))]
    (when r (->TestBlock r))))

(defn- save-block-ref
  ([block]
   {:pre [(tree/satisfied-inode? block)]}
   (let [parent-id (tree/-get-parent-id block)
         left-id (tree/-get-left-id block)]
     (save-block-ref parent-id left-id block)))
  ([parent-id left-id block-value]
   (let [ref-key [parent-id left-id]]
     (if-let [ref-atom (get @block-react-refs ref-key)]
       (do (reset! ref-atom {:block block-value
                             :parent-id parent-id
                             :left-id left-id})
           ref-atom)
       (let [block-ref (atom {:block block-value
                              :parent-id parent-id
                              :left-id left-id})]
         (swap! block-react-refs assoc ref-key block-ref)
         block-ref)))))

(defn- del-block-ref
  ([block]
   {:pre [(tree/satisfied-inode? block)]}
   (let [parent-id (tree/-get-parent-id block)
         left-id (tree/-get-left-id block)]
     (del-block-ref parent-id left-id)))
  ([parent-id left-id]
   (let [ref-key [parent-id left-id]]
     (when-let [ref-atom (get @block-react-refs ref-key)]
       (reset! ref-atom {:block nil
                         :parent-id parent-id
                         :left-id left-id})))))

(defn- get-block-from-ref
  ([block]
   {:pre [(tree/satisfied-inode? block)]}
   (let [parent-id (tree/-get-parent-id block)
         left-id (tree/-get-left-id block)]
     (get-block-from-ref parent-id left-id)))
  ([parent-id left-id]
   (let [ref-key [parent-id left-id]]
     (when-let [ref (get @block-react-refs ref-key)]
       (assert
         (instance? cljs.core/Atom (atom nil))
         "block-react-ref should be atom.")
       ref))))

(defn- position-changed?
  [old-block new-block]
  (let [old-parent-id (tree/-get-parent-id old-block)
        old-left-id (tree/-get-left-id old-block)
        new-parent-id (tree/-get-parent-id new-block)
        new-left-id (tree/-get-left-id new-block)
        the-same-position
        (and
          (= old-parent-id new-parent-id)
          (= old-left-id new-left-id))]
    (not the-same-position)))

(defn- position-taken?
  [block block-in-cache]
  (not= (tree/-get-id block)
    (tree/-get-id block-in-cache)))

(defn save-block-ref-logic
  "Main logic to handler cache."
  [block]
  (let [block-id (tree/-get-id block)
        block-in-datascript (get-block-by-id block-id)]
    (cond
      ;; no legacy cache need to process, save directly.
      (not block-in-datascript)
      (save-block-ref block)

      :else
      (if (position-changed? block-in-datascript block)
        (do
          (save-block-ref block)
          (let [block-in-cache
                (some-> (get-block-from-ref block-in-datascript) deref :block)]
            (when (and block-in-cache
                    (not (position-taken? block block-in-cache)))
              (del-block-ref block-in-datascript))))
        (let [block-in-cache
              (some-> (get-block-from-ref block-in-datascript) deref :block)]
          (if (and block-in-cache
                (position-taken? block block-in-cache))
            (throw (js/Error. "Other node should not take my seat."))
            (save-block-ref block)))))))

(defn get-block-by-parent-&-left
  [parent-id left-id]
  (let [block-ref
        (if-let [block-ref (get-block-from-ref parent-id left-id)]
          block-ref
          (let [c (conn/get-outliner-conn)
                r (db-outliner/get-by-parent-&-left
                    c [:block/id parent-id] [:block/id left-id])
                block (when r (->TestBlock r))
                block-ref (save-block-ref parent-id left-id block)]
            block-ref))]
    (-> (r/react block-ref)
      :block)))

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
          data (:data this)]
      (save-block-ref-logic this)
      (db-outliner/save-block conn data)))

  (-del [this]
    (let [conn (conn/get-outliner-conn)
          block-id (tree/-get-id this)]
      (when-let [old-block (get-block-by-id block-id)]
        (if-let [data (-> (get-block-from-ref old-block)
                        (deref)
                        :block)]
          (let [atom-still-mine? (= block-id (:block/id data))]
            (when atom-still-mine?
              (del-block-ref old-block)))))
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
  [[id children :as _tree]]
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
          (pos? @number)
          )
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
          (pos? @number)
          )
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
  (let [number (atom (dec node-number))]
    (->> (render number init-node nil)
      (r/with-key (str "render-react-tree-" (tree/-get-id init-node)))
      (deref))))

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
            result (->> (render-react-tree root number)
                     (r/with-key (str "root-" (tree/-get-id root))))]
        (is (= [[1 [[2 [[3 [[4]
                            [5]]]
                        [6 [[7 [[8]]]]]
                        [9 [[10]]]]]]]]
              @result))
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
          (is (= [[1 [[2 [[3 [[4] [5]]]
                          [18]
                          [6 [[7 [[8]]]]]
                          [9]]]]]]
                @result)))))))
