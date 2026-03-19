(ns logseq.outliner.tx-meta)

(def ^:dynamic *outliner-op-entry* nil)

(defn ensure-outliner-ops
  [tx-meta fallback-op-entry]
  (let [entry (or *outliner-op-entry* fallback-op-entry)]
    (cond-> (or tx-meta {})
      (and entry (nil? (:outliner-ops tx-meta)))
      (assoc :outliner-ops [entry]))))
