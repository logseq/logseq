(ns frontend.worker.rtc.client-op
  "Store client-ops in a persisted datascript"
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.common.missionary :as c.m]
            [frontend.worker.rtc.malli-schema :as rtc-schema]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db.sqlite.util :as sqlite-util]
            [malli.core :as ma]
            [malli.transform :as mt]
            [missionary.core :as m]))

(def op-schema
  [:multi {:dispatch first}
   [:move
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]]]]]
   [:remove
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]]]]]
   [:update-page
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]]]]]
   [:remove-page
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]]]]]
   [:update
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]
              [:av-coll [:sequential rtc-schema/av-schema]]]]]]

   [:update-asset
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]]]]]
   [:remove-asset
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:block-uuid :uuid]]]]]])

(def ops-schema [:sequential op-schema])
(def ops-coercer (ma/coercer ops-schema mt/json-transformer nil
                             #(do (log/error ::bad-ops (:value %))
                                  (ma/-fail! ::ops-schema %))))

(def ^:private block-op-types #{:move :remove :update-page :remove-page :update})
(def ^:private asset-op-types #{:update-asset :remove-asset})

(def schema-in-db
  "TODO: rename this db-name from client-op to client-metadata+op.
  and move it to its own namespace."
  {:block/uuid {:db/unique :db.unique/identity}
   :local-tx {:db/index true}
   :graph-uuid {:db/index true}
   :aes-key-jwk {:db/index true}

   ;; device
   :device/uuid {:db/unique :db.unique/identity}
   :device/public-key-jwk {}
   :device/private-key-jwk {}})

(defn update-graph-uuid
  [repo graph-uuid]
  {:pre [(some? graph-uuid)]}
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (assert (nil? (first (d/datoms @conn :avet :graph-uuid))))
    (d/transact! conn [[:db/add "e" :graph-uuid graph-uuid]])))

(defn get-graph-uuid
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (:v (first (d/datoms @conn :avet :graph-uuid)))))

(defn update-local-tx
  [repo t]
  {:pre [(some? t)]}
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (let [tx-data
          (if-let [datom (first (d/datoms @conn :avet :local-tx))]
            [:db/add (:e datom) :local-tx t]
            [:db/add "e" :local-tx t])]
      (d/transact! conn [tx-data]))))

(defn remove-local-tx
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (when-let [datom (first (d/datoms @conn :avet :local-tx))]
      (d/transact! conn [[:db/retract (:e datom) :local-tx]]))))

(defn get-local-tx
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (:v (first (d/datoms @conn :avet :local-tx)))))

(defn- merge-update-ops
  [update-op1 update-op2]
  {:pre [(= :update (first update-op1))
         (= :update (first update-op2))
         (= (:block-uuid (last update-op1))
            (:block-uuid (last update-op2)))]}
  (let [t1 (second update-op1)
        t2 (second update-op2)]
    (if (> t1 t2)
      (merge-update-ops update-op2 update-op1)
      (let [{av-coll1 :av-coll block-uuid :block-uuid} (last update-op1)
            {av-coll2 :av-coll} (last update-op2)]
        [:update t2
         {:block-uuid block-uuid
          :av-coll (concat av-coll1 av-coll2)}]))))

(defn- generate-block-ops-tx-data
  [client-ops-db ops]
  (let [sorted-ops (sort-by second ops)
        block-uuids (map (fn [[_op-type _t value]] (:block-uuid value)) sorted-ops)
        ents (d/pull-many client-ops-db '[*] (map (fn [block-uuid] [:block/uuid block-uuid]) block-uuids))
        op-types [:move :update :remove :update-page :remove-page]
        init-block-uuid->op-type->op
        (into {}
              (map (fn [ent]
                     [(:block/uuid ent)
                      (into {}
                            (keep
                             (fn [op-type]
                               (when-let [op (get ent op-type)]
                                 [op-type op])))
                            op-types)]))
              ents)
        block-uuid->op-type->op
        (reduce
         (fn [r op]
           (let [[op-type _t value] op
                 block-uuid (:block-uuid value)]
             (case op-type
               :move
               (-> r
                   (update block-uuid assoc :remove :retract)
                   (assoc-in [block-uuid :move] op))
               :update
               (-> r
                   (update block-uuid assoc :remove :retract)
                   (update-in [block-uuid :update] (fn [old-op]
                                                     (if old-op
                                                       (merge-update-ops old-op op)
                                                       op))))
               :remove
               (-> r
                   (update block-uuid assoc :move :retract :update :retract)
                   (assoc-in [block-uuid :remove] op))
               :update-page
               (-> r
                   (update block-uuid assoc :remove-page :retract)
                   (assoc-in [block-uuid :update-page] op))
               :remove-page
               (-> r
                   (update block-uuid assoc :update-page :retract)
                   (assoc-in [block-uuid :remove-page] op)))))
         init-block-uuid->op-type->op sorted-ops)]
    (mapcat
     (fn [[block-uuid op-type->op]]
       (let [tmpid (str block-uuid)]
         (when-let [tx-data
                    (not-empty
                     (keep
                      (fn [[op-type op]]
                        (cond
                          (= :retract op)
                          [:db.fn/retractAttribute [:block/uuid block-uuid] op-type]
                          (some? op)
                          [:db/add tmpid op-type op]))
                      op-type->op))]
           (cons [:db/add tmpid :block/uuid block-uuid] tx-data))))
     block-uuid->op-type->op)))

(defn add-ops
  [repo ops]
  (let [conn (worker-state/get-client-ops-conn repo)
        ops (ops-coercer ops)]
    (assert (some? conn) repo)
    (when-let [tx-data (not-empty (generate-block-ops-tx-data @conn ops))]
      (d/transact! conn tx-data))))

(defn- get-all-block-ops*
  "Return e->op-map"
  [db]
  (->> (d/datoms db :eavt)
       (group-by :e)
       (keep (fn [[e datoms]]
               (let [op-map (into {}
                                  (keep (fn [datom]
                                          (let [a (:a datom)]
                                            (when (or (= :block/uuid a) (contains? block-op-types a))
                                              [a (:v datom)]))))
                                  datoms)]
                 (when (and (:block/uuid op-map)
                            ;; count>1 = contains some `block-op-types`
                            (> (count op-map) 1))
                   [e op-map]))))
       (into {})))

(defn get&remove-all-block-ops*
  [conn]
  (let [e->op-map (get-all-block-ops* @conn)
        retract-all-tx-data (mapcat (fn [e] (map (fn [a] [:db.fn/retractAttribute e a]) block-op-types))
                                    (keys e->op-map))]
    (d/transact! conn retract-all-tx-data)
    (vals e->op-map)))

(defn get-all-block-ops
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (mapcat
     (fn [m]
       (keep (fn [[k v]]
               (when (not= :block/uuid k) v))
             m))
     (vals (get-all-block-ops* @conn)))))

(defn get&remove-all-block-ops
  "Return coll of
  {:block/uuid ...
   :update ...
   :move ...
   ...}"
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (get&remove-all-block-ops* conn)))

(defn get-unpushed-block-ops-count
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (count (get-all-block-ops* @conn))))

(defn rtc-db-graph?
  "Is db-graph & RTC enabled"
  [repo]
  (and (sqlite-util/db-based-graph? repo)
       (or (exists? js/process)
           (some? (get-local-tx repo)))))

(defn create-pending-block-ops-count-flow
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (letfn [(datom-count [db]
              (count (get-all-block-ops* db)))]
      (let [db-updated-flow
            (m/observe
             (fn ctor [emit!]
               (d/listen! conn :create-pending-ops-count-flow #(emit! true))
               (emit! true)
               (fn dtor []
                 (d/unlisten! conn :create-pending-ops-count-flow))))]
        (m/ap
          (let [_ (m/?> (c.m/throttle 100 db-updated-flow))]
            ;; throttle db-updated-flow, because `datom-count` is a time-consuming fn
            (datom-count @conn)))))))

;;; asset ops
(defn add-asset-ops
  [repo asset-ops]
  (let [conn (worker-state/get-client-ops-conn repo)
        ops (ops-coercer asset-ops)]
    (assert (some? conn) repo)
    (letfn [(already-removed? [remove-op t]
              (some-> remove-op second (> t)))
            (update-after-remove? [update-op t]
              (some-> update-op second (> t)))]
      (doseq [op ops]
        (let [[op-type t value] op
              {:keys [block-uuid]} value
              exist-block-ops-entity (d/entity @conn [:block/uuid block-uuid])
              e (:db/id exist-block-ops-entity)]
          (when-let [tx-data
                     (not-empty
                      (case op-type
                        :update-asset
                        (let [remove-asset-op (get exist-block-ops-entity :remove-asset)]
                          (when-not (already-removed? remove-asset-op t)
                            (cond-> [{:block/uuid block-uuid
                                      :update-asset op}]
                              remove-asset-op (conj [:db.fn/retractAttribute e :remove-asset]))))
                        :remove-asset
                        (let [update-asset-op (get exist-block-ops-entity :update-asset)]
                          (when-not (update-after-remove? update-asset-op t)
                            (cond-> [{:block/uuid block-uuid
                                      :remove-asset op}]
                              update-asset-op (conj [:db.fn/retractAttribute e :update-asset]))))))]
            (d/transact! conn tx-data)))))))

(defn add-all-exists-asset-as-ops
  [repo]
  (let [conn (worker-state/get-datascript-conn repo)
        _ (assert (some? conn))
        asset-block-uuids (d/q '[:find [?block-uuid ...]
                                 :where
                                 [?b :block/uuid ?block-uuid]
                                 [?b :logseq.property.asset/type]]
                               @conn)
        ops (map
             (fn [block-uuid] [:update-asset 1 {:block-uuid block-uuid}])
             asset-block-uuids)]
    (add-asset-ops repo ops)))

(defn- get-all-asset-ops*
  [db]
  (->> (d/datoms db :eavt)
       (group-by :e)
       (keep (fn [[e datoms]]
               (let [op-map (into {}
                                  (keep (fn [datom]
                                          (let [a (:a datom)]
                                            (when (or (= :block/uuid a) (contains? asset-op-types a))
                                              [a (:v datom)]))))
                                  datoms)]
                 (when (and (:block/uuid op-map)
                            ;; count>1 = contains some `asset-op-types`
                            (> (count op-map) 1))
                   [e op-map]))))
       (into {})))

(defn get-unpushed-asset-ops-count
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (count (get-all-asset-ops* @conn))))

(defn get-all-asset-ops
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (vals (get-all-asset-ops* @conn))))

(defn remove-asset-op
  [repo asset-uuid]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (let [ent (d/entity @conn [:block/uuid asset-uuid])]
      (when-let [e (:db/id ent)]
        (d/transact! conn (map (fn [a] [:db.fn/retractAttribute e a]) asset-op-types))))))

(defn reset-client-op-conn
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (let [tx-data (->> (concat (d/datoms @conn :avet :graph-uuid)
                               (d/datoms @conn :avet :local-tx)
                               (d/datoms @conn :avet :aes-key-jwk)
                               (d/datoms @conn :avet :block/uuid))
                       (map (fn [datom] [:db/retractEntity (:e datom)])))]
      (d/transact! conn tx-data))))

(defn property-entity->ops
  [property-entity]
  (assert (and (de/entity? property-entity) (ldb/property? property-entity)))
  [[:update-schema
    (cond-> {:block-uuid (:block/uuid property-entity)
             :db/ident (:db/ident property-entity)
             :db/valueType (or (:db/valueType property-entity) :db.type/string)}
      (:db/cardinality property-entity) (assoc :db/cardinality (:db/cardinality property-entity))
      (:db/index property-entity) (assoc :db/index (:db/index property-entity)))]

   [:update
    ;; todo
    ]
   ])
