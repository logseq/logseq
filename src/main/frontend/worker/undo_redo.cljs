(ns frontend.worker.undo-redo
  "undo/redo related fns and op-schema"
  (:require [frontend.worker.db-listener :as db-listener]
            [datascript.core :as d]
            [malli.util :as mu]
            [malli.core :as m]))


(def undo-op-schema
  (mu/closed-schema
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
       [:block-entity-map
        [:map
         [:block/uuid :uuid]
         [:block/left :uuid]
         [:block/parent :uuid]
         [:block/content :string]
         [:block/created-at :int]
         [:block/updated-at :int]
         [:block/format :any]
         [:block/tags {:optional true} [:sequential :uuid]]]]]]]
    [:update-block
     [:cat :keyword
      [:map
       [:block-uuid :uuid]
       [:block-origin-content {:optional true} :string]
      ;; TODO: add more attrs
       ]]]]))

(def undo-op-validator (m/validator undo-op-schema))

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

(def entity-map-pull-pattern
  [:block/uuid
   {:block/left [:block/uuid]}
   {:block/parent [:block/uuid]}
   :block/content
   :block/created-at
   :block/updated-at
   :block/format
   {:block/tags [:block/uuid]}])

(defn- ->block-entity-map
  [db eid]
  (let [m (-> (d/pull db entity-map-pull-pattern eid)
              (update :block/left :block/uuid)
              (update :block/parent :block/uuid))]
    (if (seq (:block/tags m))
      (update m :block/tags (partial mapv :block/uuid))
      m)))

(defn normal-block?
  [entity]
  (and (:block/parent entity)
       (:block/left entity)))


(defn entity-datoms=>op
  [db-before db-after id->attr->datom entity-datoms]
  {:post [(or (nil? %)
              (undo-op-validator %))]}
  (when-let [e (ffirst entity-datoms)]
    (let [attr->datom (id->attr->datom e)]
      (when (seq attr->datom)
        (let [{[_ _ block-uuid _ add1?]    :block/uuid
               [_ _ block-content _ add2?] :block/content
               [_ _ _ _ add3?]             :block/left
               [_ _ _ _ add4?]             :block/parent} attr->datom
              entity-before (d/entity db-before e)
              entity-after (d/entity db-after e)]
          (cond
            (and (not add1?) block-uuid
                 (normal-block? entity-before))
            [:remove-block
             {:block-uuid (:block/uuid entity-before)
              :block-entity-map (->block-entity-map db-before e)}]

            (and add1? block-uuid
                 (normal-block? entity-after))
            [:insert-block {:block-uuid (:block/uuid entity-after)}]

            (and (or add3? add4?)
                 (normal-block? entity-after))
            [:move-block
             {:block-uuid (:block/uuid entity-after)
              :block-origin-left (:block/uuid (:block/left entity-before))
              :block-origin-parent (:block/uuid (:block/parent entity-before))}]

            (and add2? block-content
                 (normal-block? entity-after))
            [:update-block
             {:block-uuid (:block/uuid entity-after)
              :block-origin-content (:block/content entity-before)}]))))))

(defn generate-undo-ops
  [_repo db-before db-after same-entity-datoms-coll id->attr->datom]
  (let [ops (keep (partial entity-datoms=>op db-before db-after id->attr->datom) same-entity-datoms-coll)]
    (prn ::debug-undo-ops ops)))


(defmethod db-listener/listen-db-changes :gen-undo-ops
  [_ {:keys [_tx-data tx-meta db-before db-after
             repo id->attr->datom same-entity-datoms-coll]}]
  (when (:gen-undo-op? tx-meta true)
    (generate-undo-ops repo db-before db-after same-entity-datoms-coll id->attr->datom)))
