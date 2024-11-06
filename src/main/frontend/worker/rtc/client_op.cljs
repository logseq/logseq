(ns frontend.worker.rtc.client-op
  "Store client-ops in a persisted datascript"
  (:require [datascript.core :as d]
            [frontend.worker.rtc.const :as rtc-const]
            [frontend.worker.state :as worker-state]
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
              [:av-coll [:sequential rtc-const/av-schema]]]]]]

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
                             #(do (prn ::bad-ops (:value %))
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

(defn add-ops*
  [conn ops]
  (let [ops (ops-coercer ops)]
    (letfn [(already-removed? [remove-op t]
              (some-> remove-op second (> t)))
            (add-after-remove? [move-op t]
              (some-> move-op second (> t)))]
      (doseq [op ops]
        (let [[op-type t value] op
              {:keys [block-uuid]} value
              exist-block-ops-entity (d/entity @conn [:block/uuid block-uuid])
              e (:db/id exist-block-ops-entity)
              tx-data
              (case op-type
                :move
                (let [remove-op (get exist-block-ops-entity :remove)]
                  (when-not (already-removed? remove-op t)
                    (cond-> [{:block/uuid block-uuid
                              :move op}]
                      remove-op (conj [:db.fn/retractAttribute e :remove]))))
                :update
                (let [remove-op (get exist-block-ops-entity :remove)]
                  (when-not (already-removed? remove-op t)
                    (let [origin-update-op (get exist-block-ops-entity :update)
                          op* (if origin-update-op (merge-update-ops origin-update-op op) op)]
                      (cond-> [{:block/uuid block-uuid
                                :update op*}]
                        remove-op (conj [:db.fn/retractAttribute e :remove])))))
                :remove
                (let [move-op (get exist-block-ops-entity :move)]
                  (when-not (add-after-remove? move-op t)
                    (cond-> [{:block/uuid block-uuid
                              :remove op}]
                      move-op (conj [:db.fn/retractAttribute e :move]))))
                :update-page
                (let [remove-page-op (get exist-block-ops-entity :remove-page)]
                  (when-not (already-removed? remove-page-op t)
                    (cond-> [{:block/uuid block-uuid
                              :update-page op}]
                      remove-page-op (conj [:db.fn/retractAttribute e :remove-page]))))
                :remove-page
                (let [update-page-op (get exist-block-ops-entity :update-page)]
                  (when-not (add-after-remove? update-page-op t)
                    (cond-> [{:block/uuid block-uuid
                              :remove-page op}]
                      update-page-op (conj [:db.fn/retractAttribute e :update-page])))))]
          (when (seq tx-data)
            (d/transact! conn tx-data)))))))

(defn add-ops
  [repo ops]
  (let [conn (worker-state/get-client-ops-conn repo)]
    (assert (some? conn) repo)
    (add-ops* conn ops)))

(defn- get-all-block-ops*
  "Return e->op-map"
  [db]
  (->> (d/datoms db :eavt)
       (group-by :e)
       (keep (fn [[e datoms]]
               (let [op-map (into {} (map (juxt :a :v)) datoms)]
                 (when (and (:block/uuid op-map)
                            (some #(contains? block-op-types %) (keys op-map)))
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
  "Return coll of
  {:block/uuid ...
   :update ...
   :move ...
   ...}"
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

(defn get-unpushed-ops-count
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
      (m/relieve
       (m/observe
        (fn ctor [emit!]
          (d/listen! conn :create-pending-ops-count-flow
                     (fn [{:keys [db-after]}]
                       (emit! (datom-count db-after))))
          (emit! (datom-count @conn))
          (fn dtor []
            (d/unlisten! conn :create-pending-ops-count-flow))))))))

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
                  update-asset-op (conj [:db.fn/retractAttribute e :update-asset]))))))))))

(defn- get-all-asset-op-datoms
  [conn]
  (->> (d/datoms @conn :eavt)
       (filter (fn [datom] (contains? (conj asset-op-types :block/uuid) (:a datom))))
       (group-by :e)))

(defn- get-all-asset-ops*
  [conn]
  (let [e->datoms (get-all-asset-op-datoms conn)]
    (into {}
          (keep (fn [[e same-ent-datoms]]
                  (let [op-map (into {} (map (juxt :a :v)) same-ent-datoms)]
                    (when (:block/uuid op-map)
                      [e op-map]))))
          e->datoms)))

(defn get-all-asset-ops
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (mapcat
     (fn [m]
       (keep (fn [[k v]]
               (when (not= :block/uuid k) v))
             m))
     (vals (get-all-asset-ops* conn)))))
