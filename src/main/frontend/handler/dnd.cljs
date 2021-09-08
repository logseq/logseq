(ns frontend.handler.dnd
  (:require [frontend.db :as db]
            [frontend.handler.editor :as editor-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as tree]
            [frontend.state :as state]
            [frontend.util :as util]))


(defn- moveable?
  [current-block target-block]
  (let [current-block-uuid (:block/uuid current-block)]
    (or
     (not= (:block/page current-block) (:block/page target-block))
     (and
      (not= current-block-uuid (:block/uuid target-block))
      (loop [loc target-block]
        (if-let [parent (db/pull (:db/id (:block/parent loc)))]
          (if (= (:block/uuid parent) current-block-uuid)
            false
            (recur parent))
          true))))))

(defn move-block
  "There can be at least 3 possible situations:
  1. Move a block in the same file (either top-to-bottom or bottom-to-top).
  2. Move a block between two different files.
  3. Move a block between two files in different repos.

  Notes:
  1. Those two blocks might have different formats, e.g. one is `org` and another is `markdown`,
     we don't handle this now. TODO: transform between different formats in mldoc.
  2. Sometimes we might need to move a parent block to it's own child.
  "
  [^js event current-block target-block move-to]
  (let [top? (= move-to :top)
        nested? (= move-to :nested)
        alt-key? (.-altKey event)
        repo (state/get-current-repo)]
    (cond
      alt-key?
      (do
        (editor-handler/set-block-property! (:block/uuid current-block)
                                            :id
                                            (str (:block/uuid current-block)))
        (editor-handler/api-insert-new-block!
         (util/format "((%s))" (str (:block/uuid current-block)))
         {:block-uuid (:block/uuid target-block)
          :sibling? (not nested?)
          :before? top?})
        (db/refresh! repo {:key :block/change
                           :data [current-block target-block]}))

      (and (every? map? [current-block target-block])
           (moveable? current-block target-block))
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
              (outliner-core/move-subtree current-node target-node true)))
          nested?
          (outliner-core/move-subtree current-node target-node false)

          :else
          (outliner-core/move-subtree current-node target-node true))
        (db/refresh! repo {:key :block/change
                           :data [(:data current-node) (:data target-node)]}))

      :else
      nil)))
