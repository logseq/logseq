(ns frontend.worker.rtc.gen-client-op
  "Generate client-ops from entities/datoms"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.rtc.const :as rtc-const]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]))

(defn group-datoms-by-entity
  "Groups transaction datoms by entity and returns a map of entity-id to datoms."
  [tx-data]
  (let [datom-vec-coll (map vec tx-data)
        id->same-entity-datoms (group-by first datom-vec-coll)
        id-order (distinct (map first datom-vec-coll))
        same-entity-datoms-coll (map id->same-entity-datoms id-order)]
    {:same-entity-datoms-coll same-entity-datoms-coll
     :id->same-entity-datoms  id->same-entity-datoms}))

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
    :block/tags :block/link :block/journal-day
    :logseq.property/classes :logseq.property/value
    :db/index :db/valueType :db/cardinality})

(def ^:private watched-attr-ns
  (conj db-property/logseq-property-namespaces "logseq.class"))

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

(defn- redundant-update-op-av-coll?
  [av-coll]
  (every? (fn [av] (keyword-identical? :block/updated-at (first av))) av-coll))

(defn- max-t
  [a->add?->v->t]
  (apply max (mapcat vals (mapcat vals (vals a->add?->v->t)))))

(defn- get-first-vt
  [add?->v->t k]
  (some-> add?->v->t (get k) first))

(defn- entity-datoms=>ops
  [db-before db-after e->a->add?->v->t ignore-attr-set entity-datoms]
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
        [add-block-title t3]     (some-> add?->block-title->t latest-add?->v->t (get-first-vt true))
        [add-block-parent t4]    (some-> add?->block-parent->t latest-add?->v->t (get-first-vt true))
        [add-block-order t5]     (some-> add?->block-order->t latest-add?->v->t (get-first-vt true))
        a->add?->v->t*           (into {}
                                       (filter
                                        (fn [[a _]]
                                          (and (watched-attr? a)
                                               (not (contains? ignore-attr-set a)))))
                                       a->add?->v->t)]
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
                        (when-not (redundant-update-op-av-coll? av-coll)
                          (let [t (max-t a->add?->v->t*)]
                            [:update t {:block-uuid block-uuid :av-coll av-coll}])))]
        (cond-> ops update-op (conj update-op))))))

(defn entity-datoms=>a->add?->v->t
  [entity-datoms]
  (reduce
   (fn [m datom]
     (let [[_e a v t add?] datom]
       (assoc-in m [a add? v] t)))
   {} entity-datoms))

(defn generate-rtc-ops
  [db-before db-after same-entity-datoms-coll e->a->add?->v->t]
  (mapcat
   (partial entity-datoms=>ops
            db-before db-after e->a->add?->v->t rtc-const/ignore-attrs-when-syncing)
   same-entity-datoms-coll))

(defn- generate-rtc-ops-from-entities
  [ents]
  (let [db (d/entity-db (first ents))
        id->same-entity-datoms
        (into {}
              (map (fn [ent]
                     (let [e (:db/id ent)
                           datoms (d/datoms db :eavt e)]
                       [e datoms])))
              ents)
        e->a->add?->v->t (update-vals id->same-entity-datoms entity-datoms=>a->add?->v->t)]
    (generate-rtc-ops db db (vals id->same-entity-datoms) e->a->add?->v->t)))

(defn generate-rtc-ops-from-property-entities
  [property-ents]
  (when (seq property-ents)
    (assert (every? ldb/property? property-ents))
    (generate-rtc-ops-from-entities property-ents)))

(defn generate-rtc-ops-from-class-entities
  [class-ents]
  (when (seq class-ents)
    (assert (every? ldb/class? class-ents))
    (generate-rtc-ops-from-entities class-ents)))

(defn generate-rtc-rename-db-ident-ops
  [rename-db-idents]
  (assert (every? (fn [{:keys [db-ident-or-block-uuid new-db-ident]}]
                    (and (or (keyword? db-ident-or-block-uuid) (uuid? db-ident-or-block-uuid))
                         (keyword? new-db-ident)))
                  rename-db-idents)
          rename-db-idents)
  (map
   (fn [{:keys [db-ident-or-block-uuid new-db-ident]}]
     [:rename-db-ident 0 {:db-ident-or-block-uuid db-ident-or-block-uuid :new-db-ident new-db-ident}])
   rename-db-idents))
