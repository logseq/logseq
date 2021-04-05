(ns frontend.modules.outliner.core
  (:require [frontend.modules.outliner.tree :as tree]
            [frontend.db.outliner :as db-outliner]
            [frontend.db.conn :as conn]
            [frontend.modules.outliner.utils :as outliner-u]
            [frontend.modules.outliner.state :as outliner-state]
            [frontend.state :as state]
            [frontend.debug :as debug]
            [clojure.set :as set]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.util :as util]))

(defrecord Block [data])

(defn block
  [m]
  (assert (map? m) (util/format "block data must be map,got: %s %s" (type m) m))
  (->Block m))

(defn get-block-by-id
  [id]
  (let [c (conn/get-conn false)
        r (db-outliner/get-by-id c (outliner-u/->block-lookup-ref id))]
    (when r (->Block r))))

(def block-id-size 9)

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

  (-save [this]
    (let [conn (conn/get-conn false)
          data (:data this)
          new-data (db-outliner/save-block conn data)]
      (assoc this :data new-data)))

  (-del [this]
    (let [conn (conn/get-conn false)
          block-id (tree/-get-id this)]
      (db-outliner/del-block conn [:block/uuid block-id])))

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
  (let [saved-node (tree/-save node)]
    ;; Should it be async?
    (outliner-file/sync-to-file saved-node)))

(defn insert-node-as-first-child
  "Insert a node as first child."
  [new-node parent-node]
  {:pre [(every? tree/satisfied-inode? [new-node parent-node])]}
  (let [parent-id (tree/-get-id parent-node)
        node (-> (tree/-set-left-id new-node parent-id)
               (tree/-set-parent-id parent-id))
        right-node (tree/-get-down parent-node)]
    (do
      (if (tree/satisfied-inode? right-node)
        (let [new-right-node (tree/-set-left-id right-node (tree/-get-id new-node))
              saved-new-node (tree/-save node)]
          (tree/-save new-right-node)
          saved-new-node)
        (tree/-save node)))))

(defn insert-node-as-sibling
  "Insert a node as sibling."
  [new-node left-node]
  {:pre [(every? tree/satisfied-inode? [new-node left-node])]}
  (let [node (-> (tree/-set-left-id new-node (tree/-get-id left-node))
               (tree/-set-parent-id (tree/-get-parent-id left-node)))
        right-node (tree/-get-right left-node)]
    (do
      (if (tree/satisfied-inode? right-node)
        (let [new-right-node (tree/-set-left-id right-node (tree/-get-id new-node))
              saved-new-node (tree/-save node)]
          (tree/-save new-right-node)
          saved-new-node)
        (tree/-save node)))))

(defn insert-node
  [new-node target-node sibling?]
  (let [saved-node
        (if sibling?
          (insert-node-as-sibling new-node target-node)
          (insert-node-as-first-child new-node target-node))]
    (outliner-file/sync-to-file saved-node)))

(defn delete-node
  "Delete node from the tree."
  [node]
  {:pre [(tree/satisfied-inode? node)]}
  (let [right-node (tree/-get-right node)]
    (tree/-del node)
    (when (tree/satisfied-inode? right-node)
      (let [left-node (tree/-get-left node)
            new-right-node (tree/-set-left-id right-node (tree/-get-id left-node))]
        (tree/-save new-right-node)))
    (outliner-file/sync-to-file node)))

(defn move-subtree
  "Move subtree to a destination position in the relation tree.
  Args:
    root: root of subtree
    target-node: the destination
    sibling: as sibling of the target-node or child"
  [root target-node sibling]
  {:pre [(every? tree/satisfied-inode? [root target-node])
         (boolean? sibling)]}
  (let [left-node-id (tree/-get-left-id root)
        right-node (tree/-get-right root)]
    (when (tree/satisfied-inode? right-node)
      (let [new-right-node (tree/-set-left-id right-node left-node-id)]
        (tree/-save new-right-node)))
    (if sibling
      (insert-node-as-sibling root target-node)
      (insert-node-as-first-child root target-node))
    (do

      (outliner-file/sync-to-file root)
      ;; TODO Should sync to file where the target-node located when the
      ;; target-node is in another file.
      )))
