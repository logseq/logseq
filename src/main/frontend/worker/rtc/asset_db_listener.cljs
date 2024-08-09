(ns frontend.worker.rtc.asset-db-listener
  "Listen asset-block changes in db, generate asset-sync operations"
  (:require [datascript.core :as d]
            [frontend.common.schema-register :as sr]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.rtc.asset :as r.asset]
            [frontend.worker.rtc.client-op :as client-op]))

(defn entity-datoms=>action+asset-uuid
  [db-after entity-datoms]
  (when-let [e (ffirst entity-datoms)]
    (let [ent (d/entity db-after e)
          block-uuid (:block/uuid ent)
          block-type (:block/type ent)]
      (when (and block-uuid (= block-type "asset"))
        (when-let [action (r.asset/asset-block->upload+download-action ent)]
          [action block-uuid])))))

(defn generate-asset-change-events
  [db-after same-entity-datoms-coll]
  (let [action->asset-uuids
        (->> same-entity-datoms-coll
             (keep (partial entity-datoms=>action+asset-uuid db-after))
             (reduce
              (fn [action->asset-uuids [action asset-uuid]]
                (update action->asset-uuids action (fnil conj #{}) asset-uuid))
              {}))]
    (reset! r.asset/*global-asset-change-event action->asset-uuids)))

(sr/defkeyword :generate-asset-change-events?
  "tx-meta option, generate events to notify asset-sync (default true)")

(defmethod db-listener/listen-db-changes :gen-asset-change-events
  [_ {:keys [_tx-data tx-meta _db-before db-after
             repo _id->attr->datom _e->a->add?->v->t same-entity-datoms-coll]}]
  (when (and (client-op/rtc-db-graph? repo)
             (:generate-asset-change-events? tx-meta true))
    (generate-asset-change-events db-after same-entity-datoms-coll)))
