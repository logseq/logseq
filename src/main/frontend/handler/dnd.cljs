(ns frontend.handler.dnd
  (:require [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as tree]
            [frontend.state :as state]
            [frontend.util :as util]))

(defn- moveable?
  [current-block target-block nested?]
  (let [current-block-uuid (:block/uuid current-block)]
    (or
     (not= (:block/page current-block) (:block/page target-block))
     (and
      (not= current-block-uuid (:block/uuid target-block))
      (not (and
            (= (:db/id (:block/left current-block))
               (:db/id target-block))
            (not nested?)))
      (loop [loc target-block]
        (if-let [parent (db/pull (:db/id (:block/parent loc)))]
          (if (= (:block/uuid parent) current-block-uuid)
            false
            (recur parent))
          true))))))

(defn move-block
  "There can be two possible situations:
  1. Move a block in the same file (either top-to-bottom or bottom-to-top).
  2. Move a block between two different files.

  Notes:
  Sometimes we might need to move a parent block to it's own child.
  "
  [^js event current-block target-block move-to]
  (let [top? (= move-to :top)
        nested? (= move-to :nested)
        alt-key? (and event (.-altKey event))
        current-format (:block/format current-block)
        target-format (:block/format target-block)]
    (cond
      (and current-format target-format (not= current-format target-format))
      (state/pub-event! [:notification/show
                         {:content [:div "Those two pages have different formats."]
                          :status :warning
                          :clear? true}])

      alt-key?
      (do
        (editor-handler/set-block-property! (:block/uuid current-block)
                                            :id
                                            (str (:block/uuid current-block)))
        (editor-handler/api-insert-new-block!
         (util/format "((%s))" (str (:block/uuid current-block)))
         {:block-uuid (:block/uuid target-block)
          :sibling? (not nested?)
          :before? top?}))

      (and (every? map? [current-block target-block])
           (moveable? current-block target-block nested?))
      (let [[current-node target-node]
            (mapv outliner-core/block [current-block target-block])]
        (cond
          top?
          (let [first-child?
                (= (tree/-get-parent-id target-node)
                   (tree/-get-left-id target-node))]
            (if first-child?
              (let [parent (tree/-get-parent target-node)]
                (outliner-core/move-subtree current-node parent false))
              (let [before-node (tree/-get-left target-node)]
                (outliner-core/move-subtree current-node before-node true))))
          nested?
          (outliner-core/move-subtree current-node target-node false)

          :else
          (outliner-core/move-subtree current-node target-node true)))

      :else
      nil)))
