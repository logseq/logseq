(ns frontend.modules.outliner.core
  (:require [frontend.modules.outliner.tree :as tree]
            [frontend.db :as db]
            [frontend.db-schema :as db-schema]
            [frontend.db.outliner :as db-outliner]
            [frontend.db.conn :as conn]
            [frontend.modules.outliner.utils :as outliner-u]
            [frontend.modules.outliner.state :as outliner-state]
            [frontend.state :as state]
            [frontend.debug :as debug]
            [clojure.set :as set]
            [clojure.zip :as zip]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.modules.outliner.datascript :as ds]
            [frontend.util :as util :refer-macros [profile]]
            [datascript.core :as d]))

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
                (dissoc :block/children :block/dummy? :block/level :block/meta)
                (util/remove-nils))
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

  (-del [this txs-state]
    (assert (ds/outliner-txs-state? txs-state)
      "db should be satisfied outliner-tx-state?")
    (let [block-id (tree/-get-id this)]
      (swap! txs-state conj [:db.fn/retractEntity [:block/uuid block-id]])
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

(defn insert-node
  ([new-node target-node sibling?]
   (insert-node new-node target-node sibling? nil))
  ([new-node target-node sibling? {:keys [blocks-atom skip-transact?]
                                   :or {skip-transact? false}}]
   (ds/auto-transact!
    [txs-state (ds/new-outliner-txs-state)] {:outliner-op :insert-node
                                             :skip-transact? skip-transact?}
    (let [result (if sibling?
                   (insert-node-as-sibling txs-state new-node target-node)
                   (insert-node-as-first-child txs-state new-node target-node))]
      (when blocks-atom
        (swap! blocks-atom concat result))
      (first result)))))


(defn- walk-&-insert-nodes
  [loc target-node sibling?]
  (let [update-node-fn
        (fn [node] (block
                    (db/pull (or (:block/repo node)
                                 (state/get-current-repo))
                             '[*]
                             [:block/uuid (tree/-get-id node)])))]
    (when-not (zip/end? loc)
      (if (vector? (zip/node loc))
        (recur (zip/next loc) target-node sibling?)
        (let [left1 (zip/left loc)
              left2 (zip/left (zip/left loc))]
          (if-let [left (or (and left1 (not (vector? (zip/node left1))) left1)
                            (and left2 (not (vector? (zip/node left2))) left2))]
            ;; found left sibling loc
            (do
              (insert-node (zip/node loc) (zip/node left) true)
              (recur (zip/next (zip/edit loc update-node-fn)) target-node sibling?))
            ;; else: need to find parent loc
            (if-let [parent (-> loc zip/up zip/left)]
              (do
                (insert-node (zip/node loc) (zip/node parent) false)
                (recur (zip/next (zip/edit loc update-node-fn)) target-node sibling?))
              ;; else: not found parent, it should be the root node
              (do
                (insert-node (zip/node loc) target-node sibling?)
                (recur (zip/next (zip/edit loc update-node-fn)) target-node sibling?)))))))))

(defn insert-nodes
  "Insert nodes as children(or siblings) of target-node.
  new-nodes-tree is an vector of blocks, e.g [1 [2 3] 4 [5 [6 7]]]"
  [new-nodes-tree target-node sibling?]
  (let [loc (zip/vector-zip new-nodes-tree)]
    ;; TODO: validate new-nodes-tree structure
    (walk-&-insert-nodes loc target-node sibling?)))

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
  [node]
  {:pre [(tree/satisfied-inode? node)]}
  (ds/auto-transact!
    [txs-state (ds/new-outliner-txs-state)] {:outliner-op :delete-node}
    (let [right-node (tree/-get-right node)]
      (tree/-del node txs-state)
      (when (tree/satisfied-inode? right-node)
        (let [left-node (tree/-get-left node)
              new-right-node (tree/-set-left-id right-node (tree/-get-id left-node))]
          (tree/-save new-right-node txs-state))))))

(defn get-left-nodes
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

(defn get-node-parents
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
  "Delete nodes from the tree, start-node and end-node must be siblings."
  [start-node end-node block-ids]
  {:pre [(tree/satisfied-inode? start-node)
         (tree/satisfied-inode? end-node)]}
  (do (ds/auto-transact!
        [txs-state (ds/new-outliner-txs-state)] {:outliner-op :delete-nodes}
        (if (= start-node end-node)
          (delete-node start-node)
          (let [right-node (tree/-get-right end-node)
                conn (conn/get-conn false)
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
              (ds/add-txs txs-state txs)))))))

(defn first-child?
  [node]
  (=
   (tree/-get-left-id node)
   (tree/-get-parent-id node)))

(defn first-level?
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
