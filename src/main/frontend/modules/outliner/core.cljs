(ns frontend.modules.outliner.core
  (:require [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.state :as state]
            [frontend.db.outliner :as db-outliner]
            [frontend.db.conn :as conn]
            [datascript.impl.entity :as e]
            [frontend.util :as util]
            [frontend.modules.outliner.utils :as outliner-u]))

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

(extend-type outliner-u/Block
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
      (outliner-u/get-block-by-id parent-id)))

  (-get-left [this]
    (let [left-id (tree/-get-left-id this)]
      (outliner-u/get-block-by-id left-id)))

  (-get-right [this]
    (let [left-id (tree/-get-id this)
          parent-id (tree/-get-parent-id this)]
      (state/get-block-by-parent-&-left parent-id left-id)))

  (-get-down [this]
    (let [parent-id (tree/-get-id this)]
      (state/get-block-by-parent-&-left parent-id parent-id)))

  (-save [this]
    (let [conn (conn/get-outliner-conn)
          data (:data this)]
      (state/save-block-ref-logic this)
      (db-outliner/save-block conn data)))

  (-del [this]
    (let [conn (conn/get-outliner-conn)
          block-id (tree/-get-id this)]
      (when-let [old-block (outliner-u/get-block-by-id block-id)]
        (if-let [data (-> (state/get-block-from-ref old-block)
                        (deref)
                        :block)]
          (let [atom-still-mine? (= block-id (:block/id data))]
            (when atom-still-mine?
              (state/del-block-ref old-block)))))
      (db-outliner/del-block conn [:block/id block-id])))

  (-get-children [this]
    (let [first-child (tree/-get-down this)]
      (loop [current first-child
             children [first-child]]
        (if-let [node (tree/-get-right current)]
          (recur node (conj children node))
          children)))))