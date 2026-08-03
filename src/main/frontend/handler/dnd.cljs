(ns frontend.handler.dnd
  "Provides fns for drag and drop"
  (:require [frontend.components.block.comments-model :as comments-model]
            [frontend.handler.block :as block-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.util.ref :as ref]))

(defn- top-move-target
  [target-block]
  (when-let [parent (:block/parent target-block)]
    [parent {:top? true}]))

(defn- move-target
  [target-block top? nested?]
  (if top?
    (top-move-target target-block)
    [target-block {:sibling? (not nested?)}]))

(defn set-drag-image!
  ([e image]
   (set-drag-image! e image 0 0))
  ([e image offset-x offset-y]
   (let [dt (.-dataTransfer e)]
     (.setDragImage dt image offset-x offset-y)
     e)))

(defn move-blocks
  [^js event blocks target-block original-block move-to]
  (let [blocks' blocks
        first-block (first blocks')
        top? (= move-to :top)
        nested? (= move-to :nested)
        alt-key? (and event (.-altKey event))
        target-block (if nested? target-block
                         (or original-block target-block))]
    (cond
      ;; alt pressed, make a block-ref
      (and alt-key? (= (count blocks) 1))
      (editor-handler/api-insert-new-block!
       (ref/->block-ref (:block/uuid first-block))
       {:block-uuid (:block/uuid target-block)
        :sibling? (not nested?)
        :before? top?})

      (every? map? (conj blocks' target-block))
      (let [blocks' (block-handler/get-top-level-blocks blocks')]
        (when-let [[target-block opts] (move-target target-block top? nested?)]
          (when (comments-model/move-allowed? blocks' target-block opts)
            (ui-outliner-tx/transact!
             {:outliner-op :move-blocks}
             (editor-handler/save-current-block!)
             (outliner-op/move-blocks! blocks' target-block opts)))))

      :else
      nil)))
