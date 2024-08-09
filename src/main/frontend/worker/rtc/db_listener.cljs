(ns frontend.worker.rtc.db-listener
  "listen datascript changes, infer operations from the db tx-report"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.schema-register :include-macros true :as sr]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.rtc.client-op :as client-op]
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
  #{:block/title :block/created-at :block/updated-at :block/alias
    :block/tags :block/type :block/schema :block/link :block/journal-day
    :class/parent :class/schema.properties :property/schema.classes :property.value/content
    :db/index :db/valueType :db/cardinality})

(def ^:private watched-attr-ns
  #{"logseq.property" "logseq.property.tldraw" "logseq.property.pdf" "logseq.task"
    "logseq.property.linked-references"
    "logseq.class" "logseq.kv"})

(defn- watched-attr?
  [attr]
  (or (contains? watched-attrs attr)
      (let [ns (namespace attr)]
        (or (contains? watched-attr-ns ns)
            (string/ends-with? ns ".property")
            (string/ends-with? ns ".class")))))

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
  (let [e                        (ffirst entity-datoms)
        entity                   (d/entity db-after e)
        {block-uuid :block/uuid} entity
        a->add?->v->t            (e->a->add?->v->t e)
        {add?->block-name->t   :block/name
         add?->block-title->t  :block/title
         add?->block-uuid->t   :block/uuid
         add?->block-parent->t :block/parent
         add?->block-order->t  :block/order}
        a->add?->v->t
        [retract-block-uuid t1]  (some-> add?->block-uuid->t (get false) first)
        [retract-block-name _]   (some-> add?->block-name->t (get false) first)
        [add-block-name t2]      (some-> add?->block-name->t latest-add?->v->t (get-first-vt true))
        [add-block-title t3]     (some-> add?->block-title->t
                                         latest-add?->v->t
                                         (get-first-vt true))
        [add-block-parent t4]    (some-> add?->block-parent->t latest-add?->v->t (get-first-vt true))
        [add-block-order t5]     (some-> add?->block-order->t latest-add?->v->t (get-first-vt true))
        a->add?->v->t*           (into {} (filter (fn [[a _]] (watched-attr? a)) a->add?->v->t))]
    (cond
      (and retract-block-uuid retract-block-name)
      [[:remove-page t1 {:block-uuid retract-block-uuid}]]

      retract-block-uuid
      [[:remove t1 {:block-uuid retract-block-uuid}]]

      :else
      (let [ops (cond-> []
                  (or add-block-parent add-block-order)
                  (conj [:move (or t4 t5) {:block-uuid block-uuid}])

                  (or add-block-name
                      (and (ldb/page? entity) add-block-title))
                  (conj [:update-page (or t2 t3) {:block-uuid block-uuid}]))
            update-op (when-let [av-coll (not-empty (update-op-av-coll db-before db-after a->add?->v->t*))]
                        (let [t (max-t a->add?->v->t*)]
                          [:update t {:block-uuid block-uuid :av-coll av-coll}]))]
        (cond-> ops update-op (conj update-op))))))

(defn- generate-rtc-ops
  [repo db-before db-after same-entity-datoms-coll e->a->v->add?->t]
  (let [ops (mapcat (partial entity-datoms=>ops db-before db-after e->a->v->add?->t)
                    same-entity-datoms-coll)]
    (when (seq ops)
      (client-op/add-ops repo ops))))

(sr/defkeyword :persist-op?
  "tx-meta option, generate rtc ops when not nil (default true)")

(defmethod db-listener/listen-db-changes :gen-rtc-ops
  [_ {:keys [_tx-data tx-meta db-before db-after
             repo _id->attr->datom e->a->add?->v->t same-entity-datoms-coll]}]
  (when (and (client-op/rtc-db-graph? repo)
             (:persist-op? tx-meta true))
    (generate-rtc-ops repo db-before db-after same-entity-datoms-coll e->a->add?->v->t)))
