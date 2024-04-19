(ns frontend.worker.batch-tx
  "Batch process multiple transactions.
  When batch-processing, don't refresh ui."
  (:require [frontend.worker.state :as worker-state]
            [frontend.schema-register :include-macros true :as sr]))


(sr/defkeyword :batch/txs
  "store all tx-data when batch-processing")

(sr/defkeyword :batch/db-before
  "store db before batch-tx.
It can be used to judge if it is batch-processing.")

(defn get-batch-txs
  []
  (->> (:batch/txs @worker-state/*state)
       (sort-by :tx)))

(defn set-batch-db-before!
  [db]
  (swap! worker-state/*state assoc :batch/db-before db))

(defn get-batch-db-before
  []
  (:batch/db-before @worker-state/*state))

(defn conj-batch-txs!
  [tx-data]
  (swap! worker-state/*state update :batch/txs (fn [data] (into data tx-data))))

(defn exit-batch-txs-mode!
  []
  (swap! worker-state/*state assoc :batch/txs nil)
  (swap! worker-state/*state assoc :batch/db-before nil))
