(ns frontend.worker.undo-redo
  "undo/redo related fns and op-schema"
  (:require [datascript.core :as d]))


(def undo-op-schema
  [:multi {:dispatch first}
   [:boundary
    [:cat :keyword]]
   [:insert-block
    [:cat :keyword
     [:map
      [:block-uuid :uuid]]]]
   [:move-block
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:block-origin-left :uuid]
      [:block-origin-parent :uuid]]]]
   [:remove-block
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:block-entity-map :map]]]]
   [:update-block
    [:cat :keyword
     [:map
      [:block-uuid :uuid]
      [:block-origin-content {:optional true} :string]
      ;; TODO: add more attrs
      ]]]])


(defn reverse-op
  [db op]
  (let [block-uuid (:block-uuid (second op))]
    (case (first op)
      :boundary op

      :insert-block
      [:remove-block
       {:block-uuid block-uuid
        :block-entity-map (d/pull db [:block/uuid
                                      {:block/left [:block/uuid]}
                                      {:block/parent [:block/uuid]}
                                      :block/created-at
                                      :block/updated-at
                                      :block/format
                                      :block/properties
                                      {:block/tags [:block/uuid]}
                                      :block/content
                                      {:block/page [:block/uuid]}]
                                  [:block/uuid block-uuid])}]

      :move-block
      (let [b (d/entity db [:block/uuid block-uuid])]
        [:move-block
         {:block-uuid block-uuid
          :block-origin-left (:block/uuid (:block/left b))
          :block-origin-parent (:block/uuid (:block/parent b))}])

      :remove-block
      [:insert-block {:block-uuid block-uuid}]

      :update-block
      (let [block-origin-content (when (:block-origin-content op)
                                   (:block/content (d/entity db [:block/uuid block-uuid])))]
        [:update-block
         (cond-> {:block-uuid block-uuid}
           block-origin-content (assoc :block-origin-content block-origin-content))]))))
