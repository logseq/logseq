(ns frontend.handler.dnd
  (:require [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as tree]
            [frontend.modules.outliner.transaction :as outliner-tx]
            [frontend.state :as state]
            [frontend.util :as util]))

(defn- ancestor?
  "Whether current-block is an ancestor of the target-block."
  [current-block-uuid target-block]
  (loop [loc target-block]
    (if-let [parent (db/entity (:db/id (:block/parent loc)))]
      (if (= (:block/uuid parent) current-block-uuid)
        true
        (recur parent))
      false)))

(defn move-blocks
  "There can be two possible situations:
  1. Move blocks in the same file (either top-to-bottom or bottom-to-top).
  2. Move blocks between two different files.

  move-to: :sibling :nested :top nil

  Notes:
  Sometimes we might need to move a parent block to it's own child.
  "
  [^js event blocks target-block move-to]
  (let [blocks' (map #(dissoc % :block/level :block/children) blocks)
        first-block (first blocks')
        top? (= move-to :top)
        nested? (= move-to :nested)
        alt-key? (and event (.-altKey event))
        current-format (:block/format first-block)
        target-format (:block/format target-block)]
    (cond
      ;; alt pressed, make a block-ref
      (and alt-key? (= (count blocks) 1))
      (do
        (editor-handler/set-block-property! (:block/uuid first-block)
                                            :id
                                            (str (:block/uuid first-block)))
        (editor-handler/api-insert-new-block!
         (util/format "((%s))" (str (:block/uuid first-block)))
         {:block-uuid (:block/uuid target-block)
          :sibling? (not nested?)
          :before? top?}))

      ;; format mismatch
      (and current-format target-format (not= current-format target-format))
      (state/pub-event! [:notification/show
                         {:content [:div "Those two pages have different formats."]
                          :status :warning
                          :clear? true}])


      (every? map? (conj blocks target-block))
      (let [target-node (outliner-core/block target-block)]
        (outliner-tx/transact!
          {:outliner-op :move-blocks}
          (if top?
            (let [first-child?
                  (= (tree/-get-parent-id target-node)
                     (tree/-get-left-id target-node))]
              (if first-child?
                (let [parent (tree/-get-parent target-node)]
                  (outliner-core/move-blocks! blocks (:data parent) false))
                (let [before-node (tree/-get-left target-node)]
                  (outliner-core/move-blocks! blocks (:data before-node) true))))
            (outliner-core/move-blocks! blocks target-block (not nested?)))))

      :else
      nil)))
