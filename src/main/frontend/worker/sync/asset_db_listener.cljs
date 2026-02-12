(ns frontend.worker.sync.asset-db-listener
  "Listen asset-block changes in db, generate asset-sync operations"
  (:require [datascript.core :as d]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.sync.client-op :as client-op]
            [logseq.db :as ldb]))

(defn- asset-checksum?
  [a]
  (= :logseq.property.asset/checksum a))

(defn- datom=>op
  [db-after [e _a _v t _]]
  (let [ent-after (d/entity db-after e)]
    (when (ldb/asset? ent-after)
      [:update-asset t {:block-uuid (:block/uuid ent-after)}])))

(defn generate-asset-ops
  [repo _db-before db-after tx-data]
  (let [related-datoms (filter
                        (fn [datom]
                          (and (asset-checksum? (:a datom)) (:added datom)))
                        tx-data)]
    (when-let [ops (not-empty (map #(datom=>op db-after %) related-datoms))]
      (client-op/add-asset-ops repo ops))))

(defmethod db-listener/listen-db-changes :gen-asset-change-events
  [_
   {:keys [repo]}
   {:keys [tx-data tx-meta db-before db-after]}]
  (when (and (client-op/rtc-db-graph? repo)
             (:persist-op? tx-meta true)
             (not (:rtc-tx? tx-meta)))
    (generate-asset-ops repo db-before db-after tx-data)))
