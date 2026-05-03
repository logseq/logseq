(ns logseq.outliner.tx-meta
  "Helpers for normalizing tx metadata with explicit outliner op entries.")

(defn ensure-outliner-ops
  [tx-meta entry]
  (cond-> tx-meta
    (and entry (nil? (:outliner-ops tx-meta)))
    (assoc :outliner-ops [entry])))
