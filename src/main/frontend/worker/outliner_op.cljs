(ns frontend.worker.outliner-op
  "Transact outliner ops from UI"
  (:require [logseq.outliner.transaction :as outliner-tx]
            [logseq.outliner.core :as outliner-core]
            [frontend.worker.state :as worker-state]
            [datascript.core :as d]
            [promesa.core :as p]))

(defn apply-ops!
  [repo conn ops opts]
  (let [opts' (assoc opts
                     :transact-opts {:repo repo :conn conn}
                     :local-tx? true)
        date-formatter (worker-state/get-date-formatter repo)
        *insert-result (atom nil)]
    (p/do!
     (outliner-tx/transact!
      opts'
      (doseq [[op args] ops]
        (case op
          :save-block
          (apply outliner-core/save-block! repo conn date-formatter args)

          :insert-blocks
          (let [[blocks target-block-id opts] args]
            (when-let [target-block (d/entity @conn target-block-id)]
              (let [result (outliner-core/insert-blocks! repo conn blocks target-block opts)]
                (reset! *insert-result result))))

          :delete-blocks
          (let [[block-ids opts] args
                blocks (keep #(d/entity @conn %) block-ids)]
            (outliner-core/delete-blocks! repo conn date-formatter blocks opts))

          :move-blocks
          (let [[block-ids target-block-id sibling?] args
                blocks (keep #(d/entity @conn %) block-ids)
                target-block (d/entity @conn target-block-id)]
            (when (and target-block (seq blocks))
              (outliner-core/move-blocks! repo conn blocks target-block sibling?)))

          :move-blocks-up-down
          (let [[block-ids up?] args
                blocks (keep #(d/entity @conn %) block-ids)]
            (when (seq blocks)
              (outliner-core/move-blocks-up-down! repo conn blocks up?)))

          :indent-outdent-blocks
          (let [[block-ids indent? opts] args
                blocks (keep #(d/entity @conn %) block-ids)]
            (when (seq blocks)
              (outliner-core/indent-outdent-blocks! repo conn blocks indent? opts))))))
     (pr-str @*insert-result))))
