(ns frontend.modules.outliner.core
  (:require [frontend.modules.outliner.tree :as tree]
            [frontend.db :as db]
            [frontend.db-schema :as db-schema]
            [frontend.db.outliner :as db-outliner]
            [frontend.db.conn :as conn]
            [frontend.modules.outliner.utils :as outliner-u]
            [frontend.modules.outliner.state :as outliner-state]
            [frontend.state :as state]
            [clojure.set :as set]
            [clojure.zip :as zip]
            [frontend.modules.outliner.datascript :as ds]
            [frontend.util :as util]))

(defrecord Block [data])

(defn block
  [m]
  (assert (map? m) (util/format "block data must be map,got: %s %s" (type m) m))
  (->Block m))

(defn get-data
  [block]
  (:data block))

(defn get-block-by-id
  [id]
  (let [c (conn/get-conn false)
        r (db-outliner/get-by-id c (outliner-u/->block-lookup-ref id))]
    (when r (->Block r))))

(defn- get-by-parent-&-left
  [parent-id left-id]
  (some->
    (db-outliner/get-by-parent-&-left
      (conn/get-conn false)
      [:block/uuid parent-id]
      [:block/uuid left-id])
    (block)))

(defn- index-blocks-by-left-id
  [blocks]
  (reduce
    (fn [acc block]
      (assert (tree/satisfied-inode? block) "Block should match satisfied-inode?.")
      (let [left-id (tree/-get-left-id block)]
        (when (get acc left-id)
          (prn "acc: " acc)
          (prn "block: " (:data block))
          (throw (js/Error. "There are two blocks have the same left-id")))
        (assoc acc left-id block)))
    {}
    blocks))

(defn- get-children
  [id]
  (let [repo (state/get-current-repo)]
   (some->>
     (outliner-state/get-by-parent-id repo [:block/uuid id])
     (mapv block))))

;; TODO: we might need to store created-at and updated-at as datom attributes
;; instead of being attributes of properties.
;; which might improve the db performance, we can improve it later
(defn- with-timestamp
  [m]
  (let [updated-at (util/time-ms)
        properties (assoc (:block/properties m)
                          :id (:block/uuid m)
                          :updated-at updated-at)
        properties (if-let [created-at (get properties :created-at)]
                     properties
                     (assoc properties :created-at updated-at))
        m (assoc m :block/properties properties)
        page-id (or (get-in m [:block/page :db/id])
                    (:db/id (:block/page (db/entity (:db/id m)))))
        page (db/entity page-id)
        page-properties (:block/properties page)
        page-tx {:db/id page-id
                 :block/properties (assoc page-properties
                                          :updated-at updated-at
                                          :created-at (get page-properties :created-at updated-at))}]
    [m page-tx]))

;; -get-id, -get-parent-id, -get-left-id return block-id
;; the :block/parent, :block/left should be datascript lookup ref

(extend-type Block
  tree/INode
  (-get-id [this]
    (when-let [block-id (get-in this [:data :block/uuid])]
      block-id))

  (-get-parent-id [this]
    (-> (get-in this [:data :block/parent])
      (outliner-u/->block-id)))

  (-set-parent-id [this parent-id]
    (outliner-u/check-block-id parent-id)
    (update this :data assoc :block/parent [:block/uuid parent-id]))

  (-get-left-id [this]
    (-> (get-in this [:data :block/left])
      (outliner-u/->block-id)))

  (-set-left-id [this left-id]
    (outliner-u/check-block-id left-id)
    (update this :data assoc :block/left [:block/uuid left-id]))

  (-get-parent [this]
    (when-let [parent-id (tree/-get-parent-id this)]
      (get-block-by-id parent-id)))

  (-get-left [this]
    (let [left-id (tree/-get-left-id this)]
      (get-block-by-id left-id)))

  (-get-right [this]
    (let [left-id (tree/-get-id this)
          parent-id (tree/-get-parent-id this)]
      (get-by-parent-&-left parent-id left-id)))

  (-get-down [this]
    (let [parent-id (tree/-get-id this)]
      (get-by-parent-&-left parent-id parent-id)))

  (-save [this txs-state]
    (assert (ds/outliner-txs-state? txs-state)
            "db should be satisfied outliner-tx-state?")
    (let [m (-> (:data this)
                (dissoc :block/children :block/dummy? :block/meta)
                (util/remove-nils))
          m (update m :block/refs db-outliner/remove-non-existed-refs!)
          other-tx (:db/other-tx m)]
      (when (seq other-tx)
        (swap! txs-state (fn [txs]
                           (vec (concat txs other-tx)))))

      (when-let [id (:db/id (:data this))]
        (swap! txs-state (fn [txs]
                           (vec
                            (concat txs
                                    (map (fn [attribute]
                                           [:db/retract id attribute])
                                      db-schema/retract-attributes))))))
      (swap! txs-state conj (dissoc m :db/other-tx))
      this
      ;; TODO: enable for the database-only version
      ;; (let [[m page-tx] (with-timestamp (:data this))]
      ;;  (swap! txs-state conj m page-tx)
      ;;  m)
      )
    )

  (-del [this txs-state children?]
    (assert (ds/outliner-txs-state? txs-state)
      "db should be satisfied outliner-tx-state?")
    (let [block-id (tree/-get-id this)
          ids (set (if children?
                     (let [children (db/get-block-children (state/get-current-repo) block-id)
                           children-ids (map :block/uuid children)]
                       (conj children-ids block-id))
                     [block-id]))
          txs (map (fn [id] [:db.fn/retractEntity [:block/uuid id]]) ids)
          txs (or (let [immediate-children (db/get-block-immediate-children (state/get-current-repo) block-id)]
                    (when (seq immediate-children)
                      (let [left-id (tree/-get-id (tree/-get-left this))]
                        (concat txs
                                (map-indexed (fn [idx child]
                                               (let [parent [:block/uuid left-id]]
                                                 (cond->
                                                  {:db/id (:db/id child)
                                                   :block/parent parent}
                                                  (zero? idx)
                                                   (assoc :block/left parent))))
                                             immediate-children)))))
                  txs)]
      (swap! txs-state concat txs)
      block-id))

  (-get-children [this]
    (let [children (get-children (tree/-get-id this))]
      (when (seq children)
        (let [left-id->block (index-blocks-by-left-id children)]
          (loop [sorted-children []
                 current-node this]
            (let [id (tree/-get-id current-node)]
              (if-let [right (get left-id->block id)]
                (recur (conj sorted-children right) right)
                (do
                  (let [should-equal
                        (=
                          (count children)
                          (count sorted-children))]
                    (when-not should-equal
                      (prn "children: " (mapv #(get-in % [:data :block/uuid]) children))
                      (prn "sorted-children: " (mapv #(get-in % [:data :block/uuid]) sorted-children))
                      (throw (js/Error. "Number of children and sorted-children are not equal."))))
                  sorted-children)))))))))

(defn save-node
  [node]
  {:pre [(tree/satisfied-inode? node)]}
  (ds/auto-transact!
    [db (ds/new-outliner-txs-state)] {:outliner-op :save-node}
    (tree/-save node db)))

(defn insert-node-as-first-child
  "Insert a node as first child."
  [txs-state new-node parent-node]
  {:pre [(every? tree/satisfied-inode? [new-node parent-node])]}
  (let [parent-id (tree/-get-id parent-node)
        node (-> (tree/-set-left-id new-node parent-id)
               (tree/-set-parent-id parent-id))
        right-node (tree/-get-down parent-node)]
    (if (tree/satisfied-inode? right-node)
      (let [new-right-node (tree/-set-left-id right-node (tree/-get-id new-node))
            saved-new-node (tree/-save node txs-state)]
        (tree/-save new-right-node txs-state)
        [saved-new-node new-right-node])
      (do
        (tree/-save node txs-state)
        [node]))))

(defn insert-node-as-sibling
  "Insert a node as sibling."
  [txs-state new-node left-node]
  {:pre [(every? tree/satisfied-inode? [new-node left-node])]}
  (let [node (-> (tree/-set-left-id new-node (tree/-get-id left-node))
               (tree/-set-parent-id (tree/-get-parent-id left-node)))
        right-node (tree/-get-right left-node)]
    (if (tree/satisfied-inode? right-node)
      (let [new-right-node (tree/-set-left-id right-node (tree/-get-id new-node))
            saved-new-node (tree/-save node txs-state)]
        (tree/-save new-right-node txs-state)
        [saved-new-node new-right-node])
      (do
        (tree/-save node txs-state)
        [node]))))

(defn- insert-node-aux
  ([new-node target-node sibling? txs-state]
   (insert-node-aux new-node target-node sibling? txs-state nil))
  ([new-node target-node sibling? txs-state blocks-atom]
   (let [result (if sibling?
                  (insert-node-as-sibling txs-state new-node target-node)
                  (insert-node-as-first-child txs-state new-node target-node))]
     (when blocks-atom
       (swap! blocks-atom concat result))
     (first result))))

(defn insert-node
  ([new-node target-node sibling?]
   (insert-node new-node target-node sibling? nil))
  ([new-node target-node sibling? {:keys [blocks-atom skip-transact?]
                                   :or {skip-transact? false}}]
   (ds/auto-transact!
    [txs-state (ds/new-outliner-txs-state)]
    {:outliner-op :insert-node
     :skip-transact? skip-transact?}
    (insert-node-aux new-node target-node sibling? txs-state blocks-atom))))

(defn- walk-&-insert-nodes
  [loc target-node sibling? transact]
  (let [update-node-fn
        (fn [node new-node] new-node)]
    (if (zip/end? loc)
      loc
      (if (vector? (zip/node loc))
        (recur (zip/next loc) target-node sibling? transact)
        (let [left1 (zip/left loc)
              left2 (zip/left (zip/left loc))]
          (if-let [left (or (and left1 (not (vector? (zip/node left1))) left1)
                            (and left2 (not (vector? (zip/node left2))) left2))]
            ;; found left sibling loc
            (let [new-node
                  (insert-node-aux (zip/node loc) (zip/node left) true transact)]
              (recur (zip/next (zip/edit loc update-node-fn new-node)) target-node sibling? transact))
            ;; else: need to find parent loc
            (if-let [parent (-> loc zip/up zip/left)]
              (let [new-node
                    (insert-node-aux (zip/node loc) (zip/node parent) false transact)]
                (recur (zip/next (zip/edit loc update-node-fn new-node)) target-node sibling? transact))
              ;; else: not found parent, it should be the root node
              (let [new-node
                    (insert-node-aux (zip/node loc) target-node sibling? transact)]
                (recur (zip/next (zip/edit loc update-node-fn new-node)) target-node sibling? transact)))))))))


(defn- get-node-tree-topmost-last-loc
  [loc]
  (let [result-loc-or-vec (zip/rightmost (zip/down loc))]
    (if (vector? (zip/node result-loc-or-vec))
      (zip/left result-loc-or-vec)
      result-loc-or-vec)))

(defn- get-node-tree-sub-topmost-last-loc
  [loc]
  (let [topmost-last-loc (get-node-tree-topmost-last-loc loc)
        result-vec-or-nil (zip/right topmost-last-loc)]
    (when (and (some? result-vec-or-nil)
               (vector? (zip/node result-vec-or-nil)))
      (get-node-tree-topmost-last-loc result-vec-or-nil))))

(defn insert-nodes
  "Insert nodes as children(or siblings) of target-node.
  new-nodes-tree is an vector of blocks, e.g [1 [2 3] 4 [5 [6 7]]]"
  [new-nodes-tree target-node sibling?]
  (ds/auto-transact!
   [txs-state (ds/new-outliner-txs-state)] {:outliner-op :insert-nodes}
   (let [loc (zip/vector-zip new-nodes-tree)]
     ;; TODO: validate new-nodes-tree structure
     (let [updated-nodes (walk-&-insert-nodes loc target-node sibling? txs-state)
           loc (zip/vector-zip (zip/root updated-nodes))
           ;; topmost-last-loc=4, new-nodes-tree=[1 [2 3] 4 [5 [6 7]]]
           topmost-last-loc (get-node-tree-topmost-last-loc loc)
           ;; sub-topmost-last-loc=5, new-nodes-tree=[1 [2 3] 4 [5 [6 7]]]
           sub-topmost-last-loc (get-node-tree-sub-topmost-last-loc loc)
           right-node (tree/-get-right target-node)
           down-node (tree/-get-down target-node)]
       ;; update node's left&parent after inserted nodes
       (cond
         (and (not sibling?) (some? right-node))
         nil            ;ignore
         (and sibling? (some? right-node) topmost-last-loc) ;; right-node.left=N
         (let [topmost-last-node (zip/node topmost-last-loc)
               updated-node (tree/-set-left-id right-node (tree/-get-id topmost-last-node))]
           (tree/-save updated-node txs-state))
         (and (not sibling?) (some? down-node) topmost-last-loc) ;; down-node.left=N
         (let [topmost-last-node (zip/node topmost-last-loc)
               updated-node (tree/-set-left-id down-node (tree/-get-id topmost-last-node))]
           (tree/-save updated-node txs-state))
         (and sibling? (some? down-node) topmost-last-loc) ;; down-node.parent=N, down-node.left=N
         (let [topmost-last-node-id (tree/-get-id (zip/node topmost-last-loc))
               updated-node (tree/-set-parent-id (tree/-set-left-id down-node topmost-last-node-id) topmost-last-node-id)]
           (tree/-save updated-node txs-state))
         (and sibling? (some? down-node) sub-topmost-last-loc) ;; down-node.left=N, down-node.parent=N.parent
         (let [sub-topmost-last-node (zip/node sub-topmost-last-loc)
               updated-node (tree/-set-parent-id
                             (tree/-set-left-id down-node (tree/-get-id sub-topmost-last-node))
                             (tree/-get-parent-id sub-topmost-last-node))]
           (tree/-save updated-node txs-state)))))))

(defn move-node
  [node up?]
  {:pre [(tree/satisfied-inode? node)]}
  (ds/auto-transact!
    [txs-state (ds/new-outliner-txs-state)] {:outliner-op :move-node}
    (let [[up-node down-node] (if up?
                                (let [left (tree/-get-left node)
                                      parent? (= left (tree/-get-parent node))]
                                  [(when-not parent? left) node])
                                [node (tree/-get-right node)])]
      (when (and up-node down-node)
        (let [down-node-right (tree/-get-right down-node)
              up-node-left (tree/-get-left-id up-node)
              ;; swap up-node and down-node
              down-node (tree/-set-left-id down-node up-node-left)
              up-node (tree/-set-left-id up-node (tree/-get-id down-node))]
          (tree/-save down-node txs-state)
          (tree/-save up-node txs-state)
          (when down-node-right
            (let [down-node-right (tree/-set-left-id down-node-right (tree/-get-id up-node))]
              (tree/-save down-node-right txs-state))))))))

(defn delete-node
  "Delete node from the tree."
  [node children?]
  {:pre [(tree/satisfied-inode? node)]}
  (ds/auto-transact!
    [txs-state (ds/new-outliner-txs-state)] {:outliner-op :delete-node}
    (let [right-node (tree/-get-right node)]
      (tree/-del node txs-state children?)
      (when (tree/satisfied-inode? right-node)
        (let [left-node (tree/-get-left node)
              new-right-node (tree/-set-left-id right-node (tree/-get-id left-node))]
          (tree/-save new-right-node txs-state))))))

(defn- get-left-nodes
  [node limit]
  (let [parent (tree/-get-parent node)]
    (loop [node node
           limit limit
           result []]
     (if (zero? limit)
       result
       (if-let [left (tree/-get-left node)]
         (if-not (= left parent)
           (recur left (dec limit) (conj result (tree/-get-id left)))
           result)
         result)))))

(defn- get-node-parents
  [node limit]
  (loop [node node
         limit limit
         result []]
    (if (zero? limit)
      result
      (if-let [parent (tree/-get-parent node)]
        (recur parent (dec limit) (conj result (tree/-get-id parent)))
        result))))

(defn delete-nodes
  "Delete nodes from the tree, start-node and end-node must be siblings.
  Args:
    start-node: the node at the top of the outliner document.
    end-node: the node at the bottom of the outliner document
    block-ids: block ids between the start node and end node, including all the
  children.
  "
  [start-node end-node block-ids]
  {:pre [(tree/satisfied-inode? start-node)
         (tree/satisfied-inode? end-node)]}
  (let [sibling? (= (tree/-get-parent-id start-node)
                   (tree/-get-parent-id end-node))]
    (when sibling?
      (ds/auto-transact!
        [txs-state (ds/new-outliner-txs-state)]
        {:outliner-op :delete-nodes}
        (if (= start-node end-node)
          (delete-node start-node true)
          (let [right-node (tree/-get-right end-node)
                end-node-left-nodes (get-left-nodes end-node (count block-ids))
                start-node-parents-with-self (conj (get-node-parents start-node 1000) (tree/-get-id start-node))]
            (when (tree/satisfied-inode? right-node)
              (let [cross-node-id (first (set/intersection (set end-node-left-nodes) (set start-node-parents-with-self)))
                    cross-node (get-block-by-id cross-node-id)
                    new-left-id (if (= cross-node start-node)
                                  (tree/-get-left-id cross-node)
                                  cross-node-id)
                    new-right-node (tree/-set-left-id right-node new-left-id)]
                (tree/-save new-right-node txs-state)))
            (let [txs (db-outliner/del-blocks block-ids)]
              (ds/add-txs txs-state txs))))))))

(defn first-child?
  [node]
  (=
   (tree/-get-left-id node)
   (tree/-get-parent-id node)))

(defn- first-level?
  "Can't be outdented."
  [node]
  (nil? (tree/-get-parent (tree/-get-parent node))))

(defn indent-outdent-nodes
  [nodes indent?]
  (ds/auto-transact!
    [txs-state (ds/new-outliner-txs-state)] {:outliner-op :indent-outdent-nodes}
   (let [first-node (first nodes)
         last-node (last nodes)]
     (if indent?
       (when-not (first-child? first-node)
         (let [first-node-left-id (tree/-get-left-id first-node)
               last-node-right (tree/-get-right last-node)
               parent-or-last-child-id (or (-> (db/get-block-immediate-children (state/get-current-repo)
                                                 first-node-left-id)
                                             last
                                             :block/uuid)
                                         first-node-left-id)
               first-node (tree/-set-left-id first-node parent-or-last-child-id)]
           (doseq [node (cons first-node (rest nodes))]
             (-> (tree/-set-parent-id node first-node-left-id)
               (tree/-save txs-state)))
           (some-> last-node-right
             (tree/-set-left-id first-node-left-id)
             (tree/-save txs-state))))
       (when-not (first-level? first-node)
         (let [parent (tree/-get-parent first-node)
               parent-parent-id (tree/-get-parent-id parent)
               parent-right (tree/-get-right parent)
               last-node-right (tree/-get-right last-node)]
           (some-> last-node-right
             (tree/-set-left-id (tree/-get-left-id first-node))
             (tree/-save txs-state))
           (let [first-node (tree/-set-left-id first-node (tree/-get-id parent))]
             (doseq [node (cons first-node (rest nodes))]
               (-> (tree/-set-parent-id node parent-parent-id)
                 (tree/-save txs-state))))
           (some-> parent-right
             (tree/-set-left-id (tree/-get-id last-node))
             (tree/-save txs-state))))))))

(defn move-subtree
  "Move subtree to a destination position in the relation tree.
  Args:
    root: root of subtree
    target-node: the destination
    sibling?: as sibling of the target-node or child"
  [root target-node sibling?]
  {:pre [(every? tree/satisfied-inode? [root target-node])
         (boolean? sibling?)]}
  (ds/auto-transact!
    [txs-state (ds/new-outliner-txs-state)] {:outliner-op :move-subtree}
    (let [left-node-id (tree/-get-left-id root)
         right-node (tree/-get-right root)]
      (when (tree/satisfied-inode? right-node)
        (let [new-right-node (tree/-set-left-id right-node left-node-id)]
          (tree/-save new-right-node txs-state)))
      (if sibling?
        (insert-node-as-sibling txs-state root target-node)
        (insert-node-as-first-child txs-state root target-node)))))

(defn get-right-node
  [node]
  {:pre [(tree/satisfied-inode? node)]}
  (tree/-get-right node))
