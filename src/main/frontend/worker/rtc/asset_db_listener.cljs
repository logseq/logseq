(ns frontend.worker.rtc.asset-db-listener
  "Listen asset-block changes in db, generate asset-sync operations"
  (:require [datascript.core :as d]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.rtc.client-op :as client-op]
            [logseq.db :as ldb]))

(defn- max-t
  [entity-datoms]
  (apply max (map (fn [[_e _a _v t]] t) entity-datoms)))

(defn- asset-related-attrs-changed?
  [entity-datoms]
  (some (fn [[_e a]] (= :logseq.property.asset/checksum a)) entity-datoms))

(defn- entity-datoms=>ops
  [db-before db-after entity-datoms]
  (when-let [e (ffirst entity-datoms)]
    (let [ent-after (d/entity db-after e)
          ent-before (d/entity db-before e)]
      (cond
        (and (some-> ent-after ldb/asset?)
             (asset-related-attrs-changed? entity-datoms))
        [[:update-asset (max-t entity-datoms) {:block-uuid (:block/uuid ent-after)}]]

        (and (some-> ent-before ldb/asset?)
             (nil? ent-after))
        [[:remove-asset (max-t entity-datoms) {:block-uuid (:block/uuid ent-before)}]]))))

(defn generate-asset-ops
  [repo db-before db-after same-entity-datoms-coll]
  (when-let [ops (not-empty (mapcat (partial entity-datoms=>ops db-before db-after) same-entity-datoms-coll))]
    (client-op/add-asset-ops repo ops)))

(defmethod db-listener/listen-db-changes :gen-asset-change-events
  [_
   {:keys [repo same-entity-datoms-coll]}
   {:keys [_tx-data tx-meta db-before db-after]}]
  (when (and (client-op/rtc-db-graph? repo)
             (:persist-op? tx-meta true))
    (generate-asset-ops repo db-before db-after same-entity-datoms-coll)))
