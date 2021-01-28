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
  (-get-id [this]
    (:id this))

  (-get-parent-id [this]
    (get-in this [:data :block/parent-id]))

  (-set-parent-id [this parent-id]
    (update this :data assoc :block/parent-id parent-id))

  (-get-left-id [this]
    (get-in this [:data :block/left-id]))

  (-set-left-id [this left-id]
    (update this :data assoc :block/left-id left-id))

  (-get-parent [this]
    (let [parent-id (tree/-get-parent-id this)]
      (get-block-from-db parent-id)))

  (-get-left [this]
    (let [left-id (tree/-get-left-id this)]
      (get-block-from-db left-id)))

  (-get-right [this]
    (let [left-id (tree/-get-id this)
          parent-id (tree/-get-parent-id this)]
      (get-block-from-db parent-id left-id)))

  (-get-down [this]
    (let [parent-id (tree/-get-id this)]
      (get-block-from-db parent-id parent-id)))

  (-save [this]
    (let [conn (conn/get-outliner-conn)]
     (db-outliner/save-block conn (:data this))))

  (-get-children [this]
    (let [first-child (tree/-get-down this)]
      (loop [current first-child
             children [first-child]]
        (if-let [node (tree/-get-right current)]
          (recur node (conj children node))
          children)))))