(ns logseq.db-sync.compare
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [goog.crypt.Sha256]
            [logseq.db.common.normalize :refer [eid->lookup]]))

(def ^:private compare-attrs
  #{:block/uuid
    :block/parent
    :block/page
    :block/title})

(defn filter-applied-tx-data
  [{:keys [db-after db-before tx-data]}]
  (->> tx-data
       (keep
        (fn [[e a v _t added]]
          (when (contains? compare-attrs a)
            (let [op (if added :db/add :db/retract)
                  e' (or (eid->lookup db-before e)
                         (eid->lookup db-after e))
                  v' (if (and (integer? v)
                              (pos? v)
                              (or (= :db.type/ref (:db/valueType (d/entity db-after a)))
                                  (= :db.type/ref (:db/valueType (d/entity db-before a)))))
                       (or (eid->lookup db-before v) (eid->lookup db-after v))
                       v)]
              [op e' a v']))))
       ;; e has been added and retracted in the batched tx data, so that we can ignore it
       (remove (fn [[_op e]] (nil? e)))
       set))

(defn filter-received-tx-data
  [{:keys [tempids db-before db-after]} tx-data]
  (->> tx-data
       (mapcat
        (fn [[op e a v]]
          (if (= op :db.fn/retractEntity)
            (let [entity (d/entity db-before e)]
              (keep
               (fn [a]
                 (let [v (get entity a)
                       v' (if (de/entity? v) [:block/uuid (:block/uuid v)] v)]
                   (when v'
                     [:db/retract [:block/uuid (:block/uuid entity)] a v'])))
               compare-attrs))
            (when (contains? compare-attrs a)
              (let [e' (if (neg-int? e)
                         (when-let [id (:block/uuid (d/entity db-after (get tempids e)))]
                           [:block/uuid id])
                         e)
                    v' (if (neg-int? v)
                         (when-let [id (:block/uuid (d/entity db-after (get tempids v)))]
                           [:block/uuid id])
                         v)]
                [[op e' a v']])))))
       (remove (fn [[_op e]] (nil? e)))
       set))
