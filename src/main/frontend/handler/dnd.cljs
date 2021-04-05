(ns frontend.handler.dnd
  (:require [frontend.state :as state]
            [frontend.db :as db]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as tree]
            [lambdaisland.glogi :as log]
            [frontend.debug :as debug]))

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
  [current-block target-block top? nested?]
  (if-not (every? map? [current-block target-block])
    (log/error :dnd/move-block-argument-error
      {:current-block current-block :target-block target-block})
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
     (let [repo (state/get-current-repo)]
       (db/refresh repo {:key :block/change
                         :data [(:data current-node) (:data target-node)]})))))
