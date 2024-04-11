(ns frontend.worker.batch-tx
  "Batch process multiple transactions.
  When batch-processing, don't refresh ui."
  (:require [frontend.worker.state :as worker-state]
            [frontend.schema-register :include-macros true :as sr]))


(sr/defkeyword :tx/batch-txs
  "store all tx-data when batch-processing")

(defn get-batch-txs
  []
  (:tx/batch-txs @worker-state/*state))

(defn conj-batch-txs!
  [tx-data]
  (swap! worker-state/*state update :tx/batch-txs (fn [data] (into data tx-data))))

(defn clear-batch-txs!
  []
  (swap! worker-state/*state assoc :tx/batch-txs nil))
