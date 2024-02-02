(ns frontend.worker.outliner-op
  "Transact outliner ops from UI"
  (:require [logseq.outliner.transaction :as outliner-tx]
            [logseq.outliner.core :as outliner-core]
            [frontend.worker.state :as worker-state]
            [datascript.core :as d]
            [promesa.core :as p]
            [malli.core :as m]))

(def op-schema
  [:multi {:dispatch first}
   [:save-block
    [:catn
     [:op :keyword]
     [:args [:tuple ::block]]]]
   [:insert-blocks
    [:catn
     [:op :keyword]
     [:args [:tuple ::blocks ::id ::option]]]]
   [:delete-blocks
    [:catn
     [:op :keyword]
     [:args [:tuple ::ids ::option]]]]
   [:move-blocks
    [:catn
     [:op :keyword]
     [:args [:tuple ::ids ::id :boolean]]]]
   [:move-blocks-up-down
    [:catn
     [:op :keyword]
     [:args [:tuple ::ids :boolean]]]]
   [:indent-outdent-blocks
    [:catn
     [:op :keyword]
     [:args [:tuple ::ids :boolean ::option]]]]])

(def ops-schema [:schema {:registry {::id int?
                                     ::block map?
                                     ::option [:maybe map?]
                                     ::blocks [:sequential ::block]
                                     ::ids [:sequential ::id]}}
                 [:sequential op-schema]])

(def ops-validator (m/validator ops-schema))

(defn apply-ops!
  [repo conn ops opts]
  (assert (ops-validator ops) ops)
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
