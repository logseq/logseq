(ns frontend.worker.rtc.client-op
  "Store client-ops in a persisted datascript"
  (:require [datascript.core :as d]
            [frontend.common.missionary :as c.m]
            [frontend.worker.rtc.malli-schema :as rtc-schema]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.db.sqlite.util :as sqlite-util]
            [malli.core :as ma]
            [malli.transform :as mt]
            [missionary.core :as m]))

(def op-schema
  [:multi {:dispatch first}
   [:update-kv-value
    ;; update :logseq.kv/xxx entities
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:db-ident :keyword]
              [:value :any]]]]]
   [:rename-db-ident
    [:catn
     [:op :keyword]
     [:t :int]
     [:value [:map
              [:db-ident-or-block-uuid [:or :keyword :uuid]]
              [:new-db-ident :keyword]]]]]
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
                                  (ma/-fail! ::ops-schema (select-keys % [:value])))))

(def ^:private block-op-types #{:move :remove :update-page :remove-page :update})
(def ^:private asset-op-types #{:update-asset :remove-asset})
(def ^:private update-kv-value-op-types #{:update-kv-value})
(def ^:private db-ident-rename-op-types #{:rename-db-ident})

(def schema-in-db
  "TODO: rename this db-name from client-op to client-metadata+op.
  and move it to its own namespace."
  {:block/uuid {:db/unique :db.unique/identity}
   :db-ident {:db/unique :db.unique/identity}
   :db-ident-or-block-uuid {:db/unique :db.unique/identity}
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
                                                     (if (and old-op
                                                              (not (keyword-identical? :retract old-op)))
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

(defn- generate-ident-kv-ops-tx-data
  [client-ops-db ops]
  (let [sorted-ops (sort-by second ops)
        db-idents (map (fn [[_op-type _t value]] (:db-ident value)) sorted-ops)
        ents (d/pull-many client-ops-db '[*] (map (fn [db-ident] [:db-ident db-ident]) db-idents))
        op-types [:update-kv-value]
        init-db-ident->op-type->op
        (into {}
              (map (fn [ent]
                     [(:db-ident ent)
                      (into {}
                            (keep
                             (fn [op-type]
                               (when-let [op (get ent op-type)]
                                 [op-type op])))
                            op-types)]))
              ents)
        db-ident->op-type->op
        (reduce
         (fn [r op]
           (let [[op-type _t value] op
                 db-ident (:db-ident value)]
             (case op-type
               :update-kv-value
               (assoc-in r [db-ident :update-kv-value] op))))
         init-db-ident->op-type->op sorted-ops)]
    (mapcat
     (fn [[db-ident op-type->op]]
       (let [tmpid (str db-ident)]
         (when-let [tx-data (not-empty
                             (keep
                              (fn [[op-type op]]
                                (when op [:db/add tmpid op-type op]))
                              op-type->op))]
           (cons [:db/add tmpid :db-ident db-ident] tx-data))))
     db-ident->op-type->op)))

(defn generate-rename-db-ident-ops-tx-data
  [ops]
  (let [op-type :rename-db-ident
        db-ident-or-block-uuid->op
        (reduce
         (fn [r op]
           (let [[_op-type _t value] op
                 db-ident-or-block-uuid (:db-ident-or-block-uuid value)]
             (assoc r db-ident-or-block-uuid op)))
         {} ops)]
    (mapcat
     (fn [[db-ident-or-block-uuid op]]
       (let [tmpid (str db-ident-or-block-uuid "-rename-db-ident")]
         [[:db/add tmpid :db-ident-or-block-uuid db-ident-or-block-uuid]
          [:db/add tmpid op-type op]]))
     db-ident-or-block-uuid->op)))

(defn- partition-ops
  "Return [:update-kv-value-ops :rename-db-ident-ops block-ops]"
  [ops]
  ((juxt :update-kv-value :rename-db-ident :block-uuid)
   (group-by
    (fn [[op-type _t value :as op]]
      (cond
        (:block-uuid value) :block-uuid
        (= :update-kv-value op-type) :update-kv-value
        (= :rename-db-ident op-type) :rename-db-ident
        :else (throw (ex-info "invalid op" {:op op}))))
    ops)))

(defn add-ops!
  [repo ops]
  (when (seq ops)
    (let [conn (worker-state/get-client-ops-conn repo)
          ops (ops-coercer ops)
          _ (assert (some? conn) repo)
          [update-kv-value-ops rename-db-ident-ops block-ops] (partition-ops ops)
          tx-data1 (when (seq block-ops) (generate-block-ops-tx-data @conn block-ops))
          tx-data2 (when (seq update-kv-value-ops) (generate-ident-kv-ops-tx-data @conn update-kv-value-ops))
          tx-data3 (when (seq rename-db-ident-ops) (generate-rename-db-ident-ops-tx-data rename-db-ident-ops))]
      (when-let [tx-data (not-empty (concat tx-data1 tx-data2 tx-data3))]
        (d/transact! conn tx-data)))))

(defn- get-all-block-ops*
  "Return e->op-map"
  [db]
  (->> (d/datoms db :eavt)
       (group-by :e)
       (keep (fn [[e datoms]]
               (let [op-map (into {}
                                  (keep (fn [datom]
                                          (let [a (:a datom)]
                                            (when (or (keyword-identical? :block/uuid a)
                                                      (contains? block-op-types a))
                                              [a (:v datom)]))))
                                  datoms)]
                 (when (and (:block/uuid op-map)
                            ;; count>1 = contains some `block-op-types`
                            (> (count op-map) 1))
                   [e op-map]))))
       (into {})))

(defn- get-all-update-kv-value-ops*
  "Return e->op-map"
  [db]
  (let [db-ident-datoms (d/datoms db :avet :db-ident)
        es (map :e db-ident-datoms)]
    (->> (map (fn [e] [e (d/datoms db :eavt e)]) es)
         (keep (fn [[e datoms]]
                 (let [op-map (into {}
                                    (keep (fn [datom]
                                            (let [a (:a datom)]
                                              (when (or (keyword-identical? :db-ident a)
                                                        (contains? update-kv-value-op-types a))
                                                [a (:v datom)]))))
                                    datoms)]
                   (when (and (:db-ident op-map) (> (count op-map) 1))
                     [e op-map]))))
         (into {}))))

(defn- get-all-rename-db-ident-ops*
  [db]
  (let [db-ident-or-block-uuid-datoms (d/datoms db :avet :db-ident-or-block-uuid)
        es (map :e db-ident-or-block-uuid-datoms)]
    (->> (map (fn [e] [e (d/datoms db :eavt e)]) es)
         (keep (fn [[e datoms]]
                 (let [op-map (into {}
                                    (keep (fn [datom]
                                            (let [a (:a datom)]
                                              (when (or (keyword-identical? :db-ident-or-block-uuid a)
                                                        (contains? db-ident-rename-op-types a))
                                                [a (:v datom)]))))
                                    datoms)]
                   (when (and (:db-ident-or-block-uuid op-map) (> (count op-map) 1))
                     [e op-map]))))
         (into {}))))

(defn- get&remove-all-block-ops*
  [conn]
  (let [e->op-map (get-all-block-ops* @conn)
        retract-all-tx-data (mapcat (fn [e] (map (fn [a] [:db.fn/retractAttribute e a]) block-op-types))
                                    (keys e->op-map))]
    (d/transact! conn retract-all-tx-data)
    (vals e->op-map)))

(defn- get&remove-all-update-kv-value-ops*
  [conn]
  (let [e->op-map (get-all-update-kv-value-ops* @conn)
        retract-all-tx-data (mapcat (fn [e] (map (fn [a] [:db.fn/retractAttribute e a]) update-kv-value-op-types))
                                    (keys e->op-map))]
    (d/transact! conn retract-all-tx-data)
    (vals e->op-map)))

(defn- get&remove-all-rename-db-ident-ops*
  [conn]
  (let [e->op-map (get-all-rename-db-ident-ops* @conn)
        retract-all-tx-data (mapcat (fn [e] (map (fn [a] [:db.fn/retractAttribute e a]) db-ident-rename-op-types))
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

(comment
  (defn get-all-db-ident-kv-ops
    [repo]
    (when-let [conn (worker-state/get-client-ops-conn repo)]
      (get-all-db-ident-kv-ops* @conn))))

(defn get&remove-all-block-ops
  "Return coll of
  {:block/uuid ...
   :update ...
   :move ...
   ...}"
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (get&remove-all-block-ops* conn)))

(defn get&remove-all-update-kv-value-ops
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (get&remove-all-update-kv-value-ops* conn)))

(defn get&remove-all-rename-db-ident-ops
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (get&remove-all-rename-db-ident-ops* conn)))

(defn get-unpushed-ops-count
  "except asset-ops"
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (+
     (count (get-all-block-ops* @conn))
     (count (get-all-rename-db-ident-ops* @conn))
     (count (get-all-update-kv-value-ops* @conn)))))

(defn rtc-db-graph?
  "Is db-graph & RTC enabled"
  [repo]
  (and (sqlite-util/db-based-graph? repo)
       (or (exists? js/process)
           (some? (get-graph-uuid repo)))))

(defn create-pending-block-ops-count-flow
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (let [db-updated-flow
          (m/observe
           (fn ctor [emit!]
             (d/listen! conn :create-pending-ops-count-flow #(emit! true))
             (emit! true)
             (fn dtor []
               (d/unlisten! conn :create-pending-ops-count-flow))))]
      (m/ap
        (let [_ (m/?> (c.m/throttle 200 db-updated-flow))]
            ;; throttle db-updated-flow, because `datom-count` is a time-consuming fn
          (get-unpushed-ops-count repo))))))

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
                                            (when (or (keyword-identical? :block/uuid a) (contains? asset-op-types a))
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

(defn create-pending-asset-ops-count-flow
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (let [datom-count-fn (fn [db] (count (get-all-asset-ops* db)))
          db-updated-flow
          (m/observe
           (fn ctor [emit!]
             (d/listen! conn :create-pending-asset-ops-count-flow #(emit! true))
             (emit! true)
             (fn dtor []
               (d/unlisten! conn :create-pending-asset-ops-count-flow))))]
      (m/ap
        (let [_ (m/?> (c.m/throttle 100 db-updated-flow))]
          (datom-count-fn @conn))))))
