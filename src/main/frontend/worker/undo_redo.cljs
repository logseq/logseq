(ns frontend.worker.undo-redo
  "undo/redo related fns and op-schema"
  (:require [datascript.core :as d]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.state :as worker-state]
            [logseq.common.config :as common-config]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]
            [malli.core :as m]
            [malli.util :as mu]))

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
         [:block/created-at {:optional true} :int]
         [:block/updated-at {:optional true} :int]
         [:block/format {:optional true} :any]
         [:block/tags {:optional true} [:sequential :uuid]]]]]]]
    [:update-block
     [:cat :keyword
      [:map
       [:block-uuid :uuid]
       [:block-origin-content {:optional true} :string]
       ;; TODO: add more attrs
       ]]]]))

(def undo-ops-validator (m/validator [:sequential undo-op-schema]))

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


(def ^:private apply-conj-vec (partial apply (fnil conj [])))

(defn- push-undo-ops
  [repo ops]
  (swap! (:undo/repo->undo-stack @worker-state/*state) update repo apply-conj-vec ops))

(defn- pop-undo-op
  [repo]
  (let [repo->undo-stack (:undo/repo->undo-stack @worker-state/*state)]
    (when-let [peek-op (peek (@repo->undo-stack repo))]
      (swap! repo->undo-stack update repo pop)
      peek-op)))

(defn- push-redo-ops
  [repo ops]
  (swap! (:undo/repo->redo-stack @worker-state/*state) update repo apply-conj-vec ops))

(defn- pop-redo-op
  [repo]
  (let [repo->redo-stack (:undo/repo->redo-stack @worker-state/*state)]
    (when-let [peek-op (peek (@repo->redo-stack repo))]
      (swap! repo->redo-stack update repo pop)
      peek-op)))


(defmulti reverse-apply-op (fn [op _conn _repo] (first op)))
(defmethod reverse-apply-op :remove-block
  [op conn repo]
  (let [[_ {:keys [block-uuid block-entity-map]}] op]
    (when-let [left-entity (d/entity @conn [:block/uuid (:block/left block-entity-map)])]
      (let [sibling? (not= (:block/left block-entity-map) (:block/parent block-entity-map))]
        (outliner-tx/transact!
         {:gen-undo-op? false
          :outliner-op :insert-blocks
          :transact-opts {:repo repo
                          :conn conn}}
         (outliner-core/insert-blocks! repo conn
                                       [(cond-> {:block/uuid block-uuid
                                                 :block/content (:block/content block-entity-map)
                                                 :block/format :markdown}
                                          (:block/created-at block-entity-map)
                                          (assoc :block/created-at (:block/created-at block-entity-map))

                                          (:block/updated-at block-entity-map)
                                          (assoc :block/updated-at (:block/updated-at block-entity-map))

                                          (seq (:block/tags block-entity-map))
                                          (assoc :block/tags (mapv (partial vector :block/uuid)
                                                                   (:block/tags block-entity-map))))]
                                       left-entity {:sibling? sibling? :keep-uuid? true}))
        :push-undo-redo
        ))))

(defmethod reverse-apply-op :insert-block
  [op conn repo]
  (let [[_ {:keys [block-uuid]}] op]
    (when-let [block-entity (d/entity @conn [:block/uuid block-uuid])]
      (when (empty? (seq (:block/_parent block-entity))) ;if have children, skip
        (outliner-tx/transact!
         {:gen-undo-op? false
          :outliner-op :delete-blocks
          :transact-opts {:repo repo
                          :conn conn}}
         (outliner-core/delete-blocks! repo conn
                                       (common-config/get-date-formatter (worker-state/get-config repo))
                                       [block-entity]
                                       {:children? false}))
        :push-undo-redo))))

(defmethod reverse-apply-op :move-block
  [op conn repo]
  (let [[_ {:keys [block-uuid block-origin-left block-origin-parent]}] op]
    (when-let [block-entity (d/entity @conn [:block/uuid block-uuid])]
      (when-let [left-entity (d/entity @conn [:block/uuid block-origin-left])]
        (let [sibling? (not= block-origin-left block-origin-parent)]
          (outliner-tx/transact!
           {:gen-undo-op? false
            :outliner-op :move-blocks
            :transact-opts {:repo repo
                            :conn conn}}
           (outliner-core/move-blocks! repo conn [block-entity] left-entity sibling?))
          :push-undo-redo)))))

(defmethod reverse-apply-op :update-block
  [op conn repo]
  (let [[_ {:keys [block-uuid block-origin-content]}] op]
    (when-let [block-entity (d/entity @conn [:block/uuid block-uuid])]
      (let [new-block (assoc block-entity :block/content block-origin-content)]
        (outliner-tx/transact!
         {:gen-undo-op? false
          :outliner-op :save-block
          :transact-opts {:repo repo
                          :conn conn}}
         (outliner-core/save-block! repo conn
                                    (common-config/get-date-formatter (worker-state/get-config repo))
                                    new-block))
        :push-undo-redo))))


(defn undo
  [repo]
  (when-let [op (pop-undo-op repo)]
    (let [conn (worker-state/get-datascript-conn repo)
          rev-op (reverse-op @conn op)]
      (when (= :push-undo-redo (reverse-apply-op op conn repo))
        (push-redo-ops repo [rev-op])))))

(defn redo
  [repo]
  (when-let [op (pop-redo-op repo)]
    (let [conn (worker-state/get-datascript-conn repo)
          rev-op (reverse-op @conn op)]
      (when (= :push-undo-redo (reverse-apply-op op conn repo))
        (push-undo-ops repo [rev-op])))))


;;; listen db changes and push undo-ops

(def ^:private entity-map-pull-pattern
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

(defn- normal-block?
  [entity]
  (and (:block/parent entity)
       (:block/left entity)))


(defn- entity-datoms=>ops
  [db-before db-after id->attr->datom entity-datoms]
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
            [[:remove-block
              {:block-uuid (:block/uuid entity-before)
               :block-entity-map (->block-entity-map db-before e)}]]

            (and add1? block-uuid
                 (normal-block? entity-after))
            [[:insert-block {:block-uuid (:block/uuid entity-after)}]]

            (and (or add3? add4?)
                 (normal-block? entity-after))
            (cond-> [[:move-block
                      {:block-uuid (:block/uuid entity-after)
                       :block-origin-left (:block/uuid (:block/left entity-before))
                       :block-origin-parent (:block/uuid (:block/parent entity-before))}]]
              (and add2? block-content)
              (conj [:update-block
                     {:block-uuid (:block/uuid entity-after)
                      :block-origin-content (:block/content entity-before)}]))

            (and add2? block-content
                 (normal-block? entity-after))
            [[:update-block
              {:block-uuid (:block/uuid entity-after)
               :block-origin-content (:block/content entity-before)}]]))))))

(defn- generate-undo-ops
  [repo db-before db-after same-entity-datoms-coll id->attr->datom]
  (let [ops (mapcat (partial entity-datoms=>ops db-before db-after id->attr->datom) same-entity-datoms-coll)]
    (assert (undo-ops-validator ops) ops)
    (when (seq ops)
      (push-undo-ops repo ops))))


(defmethod db-listener/listen-db-changes :gen-undo-ops
  [_ {:keys [_tx-data tx-meta db-before db-after
             repo id->attr->datom same-entity-datoms-coll]}]
  (when (:gen-undo-op? tx-meta true)
    (generate-undo-ops repo db-before db-after same-entity-datoms-coll id->attr->datom)))

;;; listen db changes and push undo-ops (ends)
