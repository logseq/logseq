(ns frontend.modules.undo-redo.core)

(def undo-seq (atom []))
(def redo-seq (atom []))

(defn process
  [tx-report]
  (prn "tx-report" (select-keys tx-report [:tx-data :tx-meta])))