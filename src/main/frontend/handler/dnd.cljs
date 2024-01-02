(ns frontend.handler.dnd
  "Provides fns for drag and drop"
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.handler.property :as property-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [logseq.outliner.tree :as otree]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.handler.block :as block-handler]))

(defn move-blocks
  [^js event blocks target-block original-block move-to]
  (let [repo (state/get-current-repo)
        blocks' (map #(db/pull (:db/id %)) blocks)
        first-block (first blocks')
        top? (= move-to :top)
        nested? (= move-to :nested)
        alt-key? (and event (.-altKey event))
        current-format (:block/format first-block)
        target-format (:block/format target-block)
        target-block (if nested? target-block
                         (or original-block target-block))]
    (cond
      ;; alt pressed, make a block-ref
      (and alt-key? (= (count blocks) 1))
      (do
        (property-handler/file-persist-block-id! (state/get-current-repo) (:block/uuid first-block))
        (editor-handler/api-insert-new-block!
         (block-ref/->block-ref (:block/uuid first-block))
         {:block-uuid (:block/uuid target-block)
          :sibling? (not nested?)
          :before? top?}))

      ;; format mismatch
      (and current-format target-format (not= current-format target-format))
      (state/pub-event! [:notification/show
                         {:content [:div "Those two pages have different formats."]
                          :status :warning
                          :clear? true}])

      (every? map? (conj blocks' target-block))
      (let [target-node (outliner-core/block (db/get-db) target-block)
            conn (db/get-db false)
            blocks' (block-handler/get-top-level-blocks blocks')]
        (ui-outliner-tx/transact!
         {:outliner-op :move-blocks}
         (editor-handler/save-current-block!)
         (if top?
           (let [first-child?
                 (= (otree/-get-parent-id target-node conn)
                    (otree/-get-left-id target-node conn))]
             (if first-child?
               (when-let [parent (otree/-get-parent target-node conn)]
                 (outliner-core/move-blocks! repo conn blocks' (:data parent) false))
               (when-let [before-node (otree/-get-left target-node conn)]
                 (outliner-core/move-blocks! repo conn blocks' (:data before-node) true))))
           (outliner-core/move-blocks! repo conn blocks' target-block (not nested?)))))

      :else
      nil)))
