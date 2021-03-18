(ns frontend.modules.outliner.core
  (:require [frontend.modules.outliner.tree :as tree]
            [frontend.db.outliner :as db-outliner]
            [frontend.db.conn :as conn]
            [frontend.modules.outliner.utils :as outliner-u]
            [nano-id.core :as nano]))

(def block-id-size 9)

(defn gen-block-id
  []
  (nano/nano-id block-id-size))

(defn block
  [m]
  (outliner-u/->Block m))

(defn- get-by-parent-&-left
  [parent-id left-id]
  (some->
    (db-outliner/get-by-parent-&-left
      conn/outliner-db
      [:block/id parent-id]
      [:block/id left-id])
    (block)))

(defn- index-blocks-by-left-id
  [blocks]
  (reduce
    (fn [acc block]
      (assert (tree/satisfied-inode? block) "Block should match satisfied-inode?.")
      (let [left-id (tree/-get-left-id block)]
        (assert (nil? (get acc left-id))
          "There are two block have the same left-id")
        (assoc acc left-id block)))
    {}
    blocks))

(defn- get-children
  [id]
  (some->>
    (db-outliner/get-by-parent-id conn/outliner-db
      [:block/id id])
    (mapv block)))

;; -get-id, -get-parent-id, -get-left-id return block-id
;; the :block/parent-id, :block/left-id should be datascript lookup ref

(extend-type outliner-u/Block
  tree/INode
  (-get-id [this]
    (when-let [block-id (get-in this [:data :block/id])]
      block-id))

  (-get-parent-id [this]
    (-> (get-in this [:data :block/parent-id])
      (outliner-u/->block-id)))

  (-set-parent-id [this parent-id]
    (outliner-u/check-block-id parent-id)
    (update this :data assoc :block/parent-id [:block/id parent-id]))

  (-get-left-id [this]
    (-> (get-in this [:data :block/left-id])
      (outliner-u/->block-id)))

  (-set-left-id [this left-id]
    (outliner-u/check-block-id left-id)
    (update this :data assoc :block/left-id [:block/id left-id]))

  (-get-parent [this]
    (let [parent-id (tree/-get-parent-id this)]
      (outliner-u/get-block-by-id parent-id)))

  (-get-left [this]
    (let [left-id (tree/-get-left-id this)]
      (outliner-u/get-block-by-id left-id)))

  (-get-right [this]
    (let [left-id (tree/-get-id this)
          parent-id (tree/-get-parent-id this)]
      (get-by-parent-&-left parent-id left-id)))

  (-get-down [this]
    (let [parent-id (tree/-get-id this)]
      (get-by-parent-&-left parent-id parent-id)))

  (-save [this]
    (let [conn (conn/get-outliner-conn)
          data (:data this)]
      (db-outliner/save-block conn data)
      this))

  (-del [this]
    (let [conn (conn/get-outliner-conn)
          block-id (tree/-get-id this)]
      (db-outliner/del-block conn [:block/id block-id])))

  (-get-children [this]
    (let [children (get-children (tree/-get-id this))
          left-id->block (index-blocks-by-left-id children)]
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
                (assert should-equal
                  "Number of children and sorted-children are not equal."))
              sorted-children)))))))
