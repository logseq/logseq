(ns frontend.worker.sync.client-op
  "Store client-ops in a persisted datascript"
  (:require [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [malli.core :as ma]
            [malli.transform :as mt]))

(def op-schema
  [:multi {:dispatch first}
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

(def ^:private asset-op-types #{:update-asset :remove-asset})

(def schema-in-db
  "TODO: rename this db-name from client-op to client-metadata+op.
  and move it to its own namespace."
  {:block/uuid {:db/unique :db.unique/identity}
   :db-ident {:db/unique :db.unique/identity}
   :db-ident-or-block-uuid {:db/unique :db.unique/identity}
   ;; local-tx is the latest remote-tx that local db persists
   :local-tx {:db/index true}
   :graph-uuid {:db/index true}
   :db-sync/checksum {:db/index true}
   :db-sync/tx-id {:db/unique :db.unique/identity}
   :db-sync/created-at {:db/index true}
   :db-sync/tx-data {}
   :db-sync/normalized-tx-data {}
   :db-sync/reversed-tx-data {}})

(defn update-graph-uuid
  [repo graph-uuid]
  {:pre [(some? graph-uuid)]}
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (ldb/transact! conn [[:db/add "e" :graph-uuid graph-uuid]])))

(defn get-graph-uuid
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (:v (first (d/datoms @conn :avet :graph-uuid)))))

(defn update-local-tx
  [repo t]
  {:pre [(some? t)]}
  (let [conn (worker-state/get-client-ops-conn repo)]
    (assert (some? conn) repo)
    (let [tx-data
          (if-let [datom (first (d/datoms @conn :avet :local-tx))]
            [:db/add (:e datom) :local-tx t]
            (if-let [datom (first (d/datoms @conn :avet :db-sync/checksum))]
              [:db/add (:e datom) :local-tx t]
              [:db/add "e" :local-tx t]))]
      (ldb/transact! conn [tx-data]))))

(comment
  (defn update-local-checksum
    [repo checksum]
    {:pre [(some? checksum)]}
    (let [conn (worker-state/get-client-ops-conn repo)]
      (assert (some? conn) repo)
      (let [tx-data
            (if-let [datom (first (d/datoms @conn :avet :db-sync/checksum))]
              [:db/add (:e datom) :db-sync/checksum checksum]
              (if-let [datom (first (d/datoms @conn :avet :local-tx))]
                [:db/add (:e datom) :db-sync/checksum checksum]
                [:db/add "e" :db-sync/checksum checksum]))]
        (ldb/transact! conn [tx-data])))))

(defn remove-local-tx
  [repo]
  (when-let [conn (worker-state/get-client-ops-conn repo)]
    (when-let [datom (first (d/datoms @conn :avet :local-tx))]
      (ldb/transact! conn [[:db/retract (:e datom) :local-tx]
                           [:db/retract (:e datom) :db-sync/checksum]]))))

(defn get-local-tx
  [repo]
  (let [conn (worker-state/get-client-ops-conn repo)]
    (assert (some? conn) repo)
    (let [r (:v (first (d/datoms @conn :avet :local-tx)))]
      ;; (assert (some? r))
      r)))

(comment
  (defn get-local-checksum
    [repo]
    (let [conn (worker-state/get-client-ops-conn repo)]
      (assert (some? conn) repo)
      (:v (first (d/datoms @conn :avet :db-sync/checksum))))))

(defn rtc-db-graph?
  "Is RTC enabled"
  [repo]
  (or (exists? js/process)
      (some? (get-graph-uuid repo))))

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
            (ldb/transact! conn tx-data)))))))

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
        (ldb/transact! conn (map (fn [a] [:db.fn/retractAttribute e a]) asset-op-types))))))
