(ns frontend.worker.undo-redo
  "undo/redo related fns and op-schema"
  (:require [datascript.core :as d]
            [frontend.schema-register :include-macros true :as sr]
            [frontend.worker.batch-tx :include-macros true :as batch-tx]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.state :as worker-state]
            [logseq.common.config :as common-config]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]
            [malli.core :as m]
            [malli.util :as mu]))

(sr/defkeyword :gen-undo-op?
  "tx-meta option, generate undo ops from tx-data when true (default true)")

(sr/defkeyword :gen-undo-boundary-op?
  "tx-meta option, generate `::boundary` undo-op when true (default true).
usually every transaction's tx-data will generate ops like: [<boundary> <op1> <op2> ...],
push to undo-stack, result in [...<boundary> <op0> <boundary> <op1> <op2> ...].

when this option is false, only generate [<op1> <op2> ...]. undo-stack: [...<boundary> <op0> <op1> <op2> ...]
so when undo, it will undo [<op0> <op1> <op2>] instead of [<op1> <op2>]")

(sr/defkeyword ::boundary
  "boundary of one or more undo-ops.
when one undo/redo will operate on all ops between two ::boundary")

(sr/defkeyword ::insert-block
  "when a block is inserted, generate a ::insert-block undo-op.
when undo this op, the related block will be removed.")

(sr/defkeyword ::move-block
  "when a block is moved, generate a ::move-block undo-op.")

(sr/defkeyword ::remove-block
  "when a block is removed, generate a ::remove-block undo-op.
when undo this op, this original entity-map will be transacted back into db")

(sr/defkeyword ::update-block
  "when a block is updated, generate a ::update-block undo-op.")

(sr/defkeyword ::empty-undo-stack
  "return by undo, when no more undo ops")

(sr/defkeyword ::empty-redo-stack
  "return by redo, when no more redo ops")

(def ^:private boundary [::boundary])

(def ^:private undo-op-schema
  (mu/closed-schema
   [:multi {:dispatch first}
    [::boundary
     [:cat :keyword]]
    [::insert-block
     [:cat :keyword
      [:map
       [:block-uuid :uuid]]]]
    [::move-block
     [:cat :keyword
      [:map
       [:block-uuid :uuid]
       [:block-origin-left :uuid]
       [:block-origin-parent :uuid]]]]
    [::remove-block
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
    [::update-block
     [:cat :keyword
      [:map
       [:block-uuid :uuid]
       [:block-origin-content {:optional true} :string]
       ;; TODO: add more attrs
       ]]]]))

(def ^:private undo-ops-validator (m/validator [:sequential undo-op-schema]))

(def ^:dynamic *undo-redo-info-for-test*
  "record undo-op info when running-test"
  nil)

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
  (let [m (d/pull db entity-map-pull-pattern eid)]
    (cond-> m
      true                  (update :block/left :block/uuid)
      true                  (update :block/parent :block/uuid)
      (seq (:block/tags m)) (update :block/tags (partial mapv :block/uuid)))))

(defn- reverse-op
  [db op]
  (let [block-uuid (:block-uuid (second op))]
    (case (first op)
      ::boundary op

      ::insert-block
      [::remove-block
       {:block-uuid block-uuid
        :block-entity-map (->block-entity-map db [:block/uuid block-uuid])}]

      ::move-block
      (let [b (d/entity db [:block/uuid block-uuid])]
        [::move-block
         {:block-uuid block-uuid
          :block-origin-left (:block/uuid (:block/left b))
          :block-origin-parent (:block/uuid (:block/parent b))}])

      ::remove-block
      [::insert-block {:block-uuid block-uuid}]

      ::update-block
      (let [block-origin-content (when (:block-origin-content (second op))
                                   (:block/content (d/entity db [:block/uuid block-uuid])))]
        [::update-block
         (cond-> {:block-uuid block-uuid}
           block-origin-content (assoc :block-origin-content block-origin-content))]))))

(def ^:private apply-conj-vec (partial apply (fnil conj [])))

(comment
  (def ^:private op-count-hard-limit 3000)
  (def ^:private op-count-limit 2000))

(defn- push-undo-ops
  [repo page-block-uuid ops]
  (assert (and (undo-ops-validator ops)
               (uuid? page-block-uuid))
          {:ops ops :page-block-uuid page-block-uuid})
  (swap! (:undo/repo->pege-block-uuid->undo-ops @worker-state/*state)
         update-in [repo page-block-uuid]
         apply-conj-vec ops))

(defn- pop-ops-helper
  [stack]
  (let [[ops i]
        (loop [i (dec (count stack)) r []]
          (let [peek-op (nth stack i nil)]
            (cond
              (neg? i)
              [r 0]

              (nil? peek-op)
              [r i]

              (= boundary peek-op)
              [r i]

              :else
              (recur (dec i) (conj r peek-op)))))]
    [ops (subvec (vec stack) 0 i)]))

(defn- pop-undo-ops
  [repo page-block-uuid]
  (assert (uuid? page-block-uuid) page-block-uuid)
  (let [repo->pege-block-uuid->undo-ops (:undo/repo->pege-block-uuid->undo-ops @worker-state/*state)
        undo-stack (get-in @repo->pege-block-uuid->undo-ops [repo page-block-uuid])
        [ops undo-stack*] (pop-ops-helper undo-stack)]
    (swap! repo->pege-block-uuid->undo-ops assoc-in [repo page-block-uuid] undo-stack*)
    ops))

(defn- empty-undo-stack?
  [repo page-block-uuid]
  (empty? (get-in @(:undo/repo->pege-block-uuid->undo-ops @worker-state/*state) [repo page-block-uuid])))

(defn- empty-redo-stack?
  [repo page-block-uuid]
  (empty? (get-in @(:undo/repo->pege-block-uuid->redo-ops @worker-state/*state) [repo page-block-uuid])))

(defn- push-redo-ops
  [repo page-block-uuid ops]
  (assert (and (undo-ops-validator ops)
               (uuid? page-block-uuid))
          {:ops ops :page-block-uuid page-block-uuid})
  (swap! (:undo/repo->pege-block-uuid->redo-ops @worker-state/*state)
         update-in [repo page-block-uuid]
         apply-conj-vec ops))

(defn- pop-redo-ops
  [repo page-block-uuid]
  (assert (uuid? page-block-uuid) page-block-uuid)
  (let [repo->pege-block-uuid->redo-ops (:undo/repo->pege-block-uuid->redo-ops @worker-state/*state)
        undo-stack (get-in @repo->pege-block-uuid->redo-ops [repo page-block-uuid])
        [ops undo-stack*] (pop-ops-helper undo-stack)]
    (swap! repo->pege-block-uuid->redo-ops assoc-in [repo page-block-uuid] undo-stack*)
    ops))

(defn- normal-block?
  [entity]
  (and (:block/parent entity)
       (:block/left entity)))

(defmulti ^:private reverse-apply-op (fn [op _conn _repo] (first op)))
(defmethod reverse-apply-op ::remove-block
  [op conn repo]
  (let [[_ {:keys [block-uuid block-entity-map]}] op
        block-entity (d/entity @conn [:block/uuid block-uuid])]
    (when-not block-entity ;; this block shouldn't exist now
      (when-let [left-entity (d/entity @conn [:block/uuid (:block/left block-entity-map)])]
        (let [sibling? (not= (:block/left block-entity-map) (:block/parent block-entity-map))]
          (some->>
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
           (conj [:push-undo-redo])))))))

(defmethod reverse-apply-op ::insert-block
  [op conn repo]
  (let [[_ {:keys [block-uuid]}] op]
    (when-let [block-entity (d/entity @conn [:block/uuid block-uuid])]
      (when (empty? (:block/_parent block-entity)) ;if have children, skip
        (some->>
         (outliner-tx/transact!
          {:gen-undo-op? false
           :outliner-op :delete-blocks
           :transact-opts {:repo repo
                           :conn conn}}
          (outliner-core/delete-blocks! repo conn
                                        (common-config/get-date-formatter (worker-state/get-config repo))
                                        [block-entity]
                                        {:children? false}))
         (conj [:push-undo-redo]))))))

(defmethod reverse-apply-op ::move-block
  [op conn repo]
  (let [[_ {:keys [block-uuid block-origin-left block-origin-parent]}] op]
    (when-let [block-entity (d/entity @conn [:block/uuid block-uuid])]
      (when-let [left-entity (d/entity @conn [:block/uuid block-origin-left])]
        (let [sibling? (not= block-origin-left block-origin-parent)]
          (some->>
           (outliner-tx/transact!
            {:gen-undo-op? false
             :outliner-op :move-blocks
             :transact-opts {:repo repo
                             :conn conn}}
            (outliner-core/move-blocks! repo conn [block-entity] left-entity sibling?))
           (conj [:push-undo-redo])))))))

(defmethod reverse-apply-op ::update-block
  [op conn repo]
  (let [[_ {:keys [block-uuid block-origin-content]}] op]
    (when-let [block-entity (d/entity @conn [:block/uuid block-uuid])]
      (when (normal-block? block-entity)
        (let [new-block (assoc block-entity :block/content block-origin-content)]
          (some->>
           (outliner-tx/transact!
            {:gen-undo-op? false
             :outliner-op :save-block
             :transact-opts {:repo repo
                             :conn conn}}
            (outliner-core/save-block! repo conn
                                       (common-config/get-date-formatter (worker-state/get-config repo))
                                       new-block))
           (conj [:push-undo-redo])))))))

(defn undo
  [repo page-block-uuid conn]
  (if-let [ops (not-empty (pop-undo-ops repo page-block-uuid))]
    (let [redo-ops-to-push (transient [])]
      (batch-tx/with-batch-tx-mode conn
        (doseq [op ops]
          (let [rev-op (reverse-op @conn op)
                r (reverse-apply-op op conn repo)]
            (when (= :push-undo-redo (first r))
              (some-> *undo-redo-info-for-test* (reset! {:op op :tx (second r)}))
              (conj! redo-ops-to-push rev-op)))))
      (when-let [rev-ops (not-empty (persistent! redo-ops-to-push))]
        (push-redo-ops repo page-block-uuid (cons boundary rev-ops)))
      nil)

    (when (empty-undo-stack? repo page-block-uuid)
      (prn "No further undo information")
      ::empty-undo-stack)))

(defn redo
  [repo page-block-uuid conn]
  (if-let [ops (not-empty (pop-redo-ops repo page-block-uuid))]
    (let [undo-ops-to-push (transient [])]
      (batch-tx/with-batch-tx-mode conn
        (doseq [op ops]
          (let [rev-op (reverse-op @conn op)
                r (reverse-apply-op op conn repo)]
            (when (= :push-undo-redo (first r))
              (some-> *undo-redo-info-for-test* (reset! {:op op :tx (second r)}))
              (conj! undo-ops-to-push rev-op)))))
      (when-let [rev-ops (not-empty (persistent! undo-ops-to-push))]
        (push-undo-ops repo page-block-uuid (cons boundary rev-ops)))
      nil)

    (when (empty-redo-stack? repo page-block-uuid)
      (prn "No further redo information")
      ::empty-redo-stack)))

;;; listen db changes and push undo-ops

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
            [[::remove-block
              {:block-uuid (:block/uuid entity-before)
               :block-entity-map (->block-entity-map db-before e)}]]

            (and add1? block-uuid
                 (normal-block? entity-after))
            [[::insert-block {:block-uuid (:block/uuid entity-after)}]]

            (and (or add3? add4?)
                 (normal-block? entity-after))
            (let [origin-left (:block/left entity-before)
                  origin-parent (:block/parent entity-before)
                  origin-left-in-db-after (d/entity db-after [:block/uuid (:block/uuid origin-left)])
                  origin-parent-in-db-after (d/entity db-after [:block/uuid (:block/uuid origin-parent)])
                  origin-left-and-parent-available-in-db-after?
                  (and origin-left-in-db-after origin-parent-in-db-after
                       (if (not= (:block/uuid origin-left) (:block/uuid origin-parent))
                         (= (:block/uuid (:block/parent origin-left))
                            (:block/uuid (:block/parent origin-left-in-db-after)))
                         true))]
              (cond-> []
                origin-left-and-parent-available-in-db-after?
                (conj [::move-block
                       {:block-uuid (:block/uuid entity-after)
                        :block-origin-left (:block/uuid (:block/left entity-before))
                        :block-origin-parent (:block/uuid (:block/parent entity-before))}])

                (and add2? block-content)
                (conj [::update-block
                       {:block-uuid (:block/uuid entity-after)
                        :block-origin-content (:block/content entity-before)}])))

            (and add2? block-content
                 (normal-block? entity-after))
            [[::update-block
              {:block-uuid (:block/uuid entity-after)
               :block-origin-content (:block/content entity-before)}]]))))))

(defn- find-page-block-uuid
  [db-before db-after same-entity-datoms-coll]
  (some
   (fn [entity-datoms]
     (when-let [e (ffirst entity-datoms)]
       (or (some-> (d/entity db-before e) :block/page :block/uuid)
           (some-> (d/entity db-after e) :block/page :block/uuid))))
   same-entity-datoms-coll))

(defn- generate-undo-ops
  [repo db-before db-after same-entity-datoms-coll id->attr->datom gen-boundary-op?]
  (when-let [page-block-uuid (find-page-block-uuid db-before db-after same-entity-datoms-coll)]
    (let [ops (mapcat (partial entity-datoms=>ops db-before db-after id->attr->datom) same-entity-datoms-coll)]
      (when (seq ops)
        (push-undo-ops repo page-block-uuid (if gen-boundary-op? (cons boundary ops) ops))))))

(defmethod db-listener/listen-db-changes :gen-undo-ops
  [_ {:keys [_tx-data tx-meta db-before db-after
             repo id->attr->datom same-entity-datoms-coll]}]
  (when (:gen-undo-op? tx-meta true)
    (generate-undo-ops repo db-before db-after same-entity-datoms-coll id->attr->datom
                       (:gen-undo-boundary-op? tx-meta true))))

;;; listen db changes and push undo-ops (ends)

(defn clear-undo-redo-stack
  []
  (reset! (:undo/repo->pege-block-uuid->redo-ops @worker-state/*state) {})
  (reset! (:undo/repo->pege-block-uuid->undo-ops @worker-state/*state) {}))

(comment

  (clear-undo-redo-stack)
  (add-watch (:undo/repo->undo-stack @worker-state/*state)
             :xxx
             (fn [_ _ o n]
               (cljs.pprint/pprint {:k :undo
                                    :o o
                                    :n n})))

  (add-watch (:undo/repo->redo-stack @worker-state/*state)
             :xxx
             (fn [_ _ o n]
               (cljs.pprint/pprint {:k :redo
                                    :o o
                                    :n n})))

  (remove-watch (:undo/repo->undo-stack @worker-state/*state) :xxx)
  (remove-watch (:undo/repo->redo-stack @worker-state/*state) :xxx))
