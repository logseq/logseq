(ns frontend.modules.outliner.core
  (:require [frontend.modules.outliner.tree :as tree]
            [frontend.db.outliner :as db-outliner]
            [frontend.db.conn :as conn]))

(defrecord Block [id data])

(defn get-block-from-db
  ([id]
   (let [c (conn/get-outliner-conn)
         r (db-outliner/get-by-id c id)]
     (when r (->Block (:block/id r) r))))
  ([parent-id left-id]
   (let [c (conn/get-outliner-conn)
         r (db-outliner/get-by-parent-&-left c parent-id left-id)]
     (when r (->Block (:block/id r) r)))))

(extend-type Block
  tree/INode
  (tree/-get-id [this]
    (:id this))

  (tree/-get-parent-id [this]
    (get-in this [:data :block/parent-id]))

  (tree/-set-parent-id [this parent-id]
    (update this :data assoc :block/parent-id parent-id))

  (tree/-get-left-id [this]
    (get-in this [:data :block/left-id]))

  (tree/-set-left-id [this left-id]
    (update this :data assoc :block/left-id left-id))

  (tree/-get-parent [this]
    (let [parent-id (tree/-get-parent-id this)]
      (get-block-from-db parent-id)))

  (tree/-get-left [this]
    (let [left-id (tree/-get-left-id this)]
      (get-block-from-db left-id)))

  (tree/-get-right [this]
    (let [left-id (tree/-get-id this)
          parent-id (tree/-get-parent-id this)]
      (get-block-from-db parent-id left-id)))

  (tree/-get-down [this]
    (let [parent-id (tree/-get-id this)]
      (get-block-from-db parent-id parent-id)))

  (tree/-save [this]
    (let [conn (conn/get-outliner-conn)]
     (db-outliner/save-block conn (:data this))))

  (tree/-get-children [this]
    (let [first-child (tree/-get-down this)]
      (loop [current first-child
             children [first-child]]
        (if-let [node (tree/-get-right current)]
          (recur node (conj children node))
          children)))))