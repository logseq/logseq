(ns frontend.worker.rtc.db-listener
  "listen datascript changes, infer operations from the db tx-report"
  (:require [datascript.core :as d]
            [frontend.schema-register :include-macros true :as sr]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [logseq.db :as ldb]))

(defn- latest-add?->v->t
  [add?->v->t]
  (let [latest-add     (first (sort-by second > (seq (add?->v->t true))))
        latest-retract (first (sort-by second > (seq (add?->v->t false))))]
    (cond
      (nil? latest-add)                               {false (conj {} latest-retract)}
      (nil? latest-retract)                           {true (conj {} latest-add)}
      (= (second latest-add) (second latest-retract)) {true (conj {} latest-add)
                                                       false (conj {} latest-retract)}
      (> (second latest-add) (second latest-retract)) {true (conj {} latest-add)}
      :else                                           {false (conj {} latest-retract)})))

(def ^:private watched-attrs
  #{:block/content :block/created-at :block/updated-at :block/alias
    :block/tags :block/type :block/schema :block/link :block/journal-day})

(defn- watched-attr?
  [attr]
  (contains? watched-attrs attr))

(defn- ref-attr?
  [db attr]
  (= :db.type/ref (get-in (d/schema db) [attr :db/valueType])))

(defn- update-op-av-coll
  [db-before db-after a->add?->v->t]
  (mapcat
   (fn [[a add?->v->t]]
     (mapcat
      (fn [[add? v->t]]
        (keep
         (fn [[v t]]
           (let [ref? (ref-attr? db-after a)]
             (case [add? ref?]
               [true true]
               (when-let [v-uuid (:block/uuid (d/entity db-after v))]
                 [a v-uuid t add?])
               [false true]
               (when-let [v-uuid (:block/uuid
                                  (or (d/entity db-after v)
                                      (d/entity db-before v)))]
                 [a v-uuid t add?])
               ([true false] [false false]) [a (ldb/write-transit-str v) t add?])))
         v->t))
      add?->v->t))
   a->add?->v->t))

(defn- max-t
  [a->add?->v->t]
  (apply max (mapcat vals (mapcat vals (vals a->add?->v->t)))))

(defn- get-first-vt
  [add?->v->t k]
  (some-> add?->v->t (get k) first))

(defn- entity-datoms=>ops
  [db-before db-after e->a->add?->v->t entity-datoms]
  (let [e                            (ffirst entity-datoms)
        block-uuid                   (:block/uuid (d/entity db-after e))
        a->add?->v->t                (e->a->add?->v->t e)
        {add?->block-name->t          :block/name
         add?->block-original-name->t :block/original-name
         add?->block-uuid->t          :block/uuid
         add?->block-parent->t        :block/parent
         add?->block-order->t         :block/order}
        a->add?->v->t
        [retract-block-uuid t1]      (some-> add?->block-uuid->t (get false) first)
        [retract-block-name _]       (some-> add?->block-name->t (get false) first)
        [add-block-name t2]          (some-> add?->block-name->t latest-add?->v->t (get-first-vt true))
        [add-block-original-name t3] (some-> add?->block-original-name->t
                                             latest-add?->v->t
                                             (get-first-vt true))
        [add-block-parent t4]        (some-> add?->block-parent->t latest-add?->v->t (get-first-vt true))
        [add-block-order t5]         (some-> add?->block-order->t latest-add?->v->t (get-first-vt true))
        a->add?->v->t*               (into {} (filter (fn [[a _]] (watched-attr? a)) a->add?->v->t))]
    (cond
      (and retract-block-uuid retract-block-name)
      [[:remove-page t1 {:block-uuid retract-block-uuid}]]

      retract-block-uuid
      [[:remove t1 {:block-uuid retract-block-uuid}]]

      :else
      (let [ops (cond-> []
                  (or add-block-parent add-block-order)
                  (conj [:move (or t4 t5) {:block-uuid block-uuid}])

                  (or add-block-name add-block-original-name)
                  (conj [:update-page (or t2 t3) {:block-uuid block-uuid}]))
            update-op (when-let [av-coll (not-empty (update-op-av-coll db-before db-after a->add?->v->t*))]
                        (let [t (max-t a->add?->v->t*)]
                          [:update t {:block-uuid block-uuid :av-coll av-coll}]))]
        (cond-> ops update-op (conj update-op))))))

(defn- entity-datoms=>asset-op
  [db-after id->attr->datom entity-datoms]
  (when-let [e (ffirst entity-datoms)]
    (let [attr->datom (id->attr->datom e)]
      (when (seq attr->datom)
        (let [{[_e _a asset-uuid _t add1?] :asset/uuid
               [_e _a asset-meta _t add2?] :asset/meta}
              attr->datom
              op (cond
                   (or (and add1? asset-uuid)
                       (and add2? asset-meta))
                   [:update-asset]

                   (and (not add1?) asset-uuid)
                   [:remove-asset asset-uuid])]
          (when op
            (let [asset-uuid (some-> (d/entity db-after e) :asset/uuid str)]
              (case (first op)
                :update-asset (when asset-uuid ["update-asset" {:asset-uuid asset-uuid}])
                :remove-asset ["remove-asset" {:asset-uuid (str (second op))}]))))))))

(defn- generate-rtc-ops
  [repo db-before db-after same-entity-datoms-coll id->attr->datom e->a->v->add?->t]
  (let [asset-ops (keep (partial entity-datoms=>asset-op db-after id->attr->datom) same-entity-datoms-coll)
        ops (when (empty asset-ops)
              (mapcat (partial entity-datoms=>ops db-before db-after e->a->v->add?->t)
                      same-entity-datoms-coll))]
    (when (seq ops)
      (op-mem-layer/add-ops! repo ops))))

(sr/defkeyword :persist-op?
  "tx-meta option, generate rtc ops when not nil (default true)")

(defmethod db-listener/listen-db-changes :gen-rtc-ops
  [_ {:keys [_tx-data tx-meta db-before db-after
             repo id->attr->datom e->a->add?->v->t same-entity-datoms-coll]}]
  (when (and (op-mem-layer/rtc-db-graph? repo)
             (:persist-op? tx-meta true))
    (generate-rtc-ops repo db-before db-after same-entity-datoms-coll id->attr->datom e->a->add?->v->t)))
