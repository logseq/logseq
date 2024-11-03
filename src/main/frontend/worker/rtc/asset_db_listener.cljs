(ns frontend.worker.rtc.asset-db-listener
  "Listen asset-block changes in db, generate asset-sync operations"
  (:require [datascript.core :as d]
            [frontend.common.schema-register :as sr]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.rtc.client-op :as client-op]
            [logseq.db :as ldb]))

(defn- max-t
  [entity-datoms]
  (apply max (map (fn [[_e _a _v t]] t) entity-datoms)))

(defn- entity-datoms=>ops
  [db-after entity-datoms]
  (when-let [e (ffirst entity-datoms)]
    (let [ent (d/entity db-after e)]
      (when (ldb/asset? ent)
        [[:update-asset (max-t entity-datoms) {:block-uuid (:block/uuid ent)}]]))))

(defn generate-asset-ops
  [repo db-after same-entity-datoms-coll]
  (when-let [ops (not-empty (mapcat (partial entity-datoms=>ops db-after) same-entity-datoms-coll))]
    (client-op/add-asset-ops repo ops)))

(sr/defkeyword :generate-asset-change-events?
  "tx-meta option, generate events to notify asset-sync (default true)")

(defmethod db-listener/listen-db-changes :gen-asset-change-events
  [_ {:keys [_tx-data tx-meta _db-before db-after
             repo _id->attr->datom _e->a->add?->v->t same-entity-datoms-coll]}]
  (def xx-db-after db-after)
  (def xx same-entity-datoms-coll)
  (when (and (client-op/rtc-db-graph? repo)
             (:generate-asset-change-events? tx-meta true))
    (generate-asset-ops repo db-after same-entity-datoms-coll)))
