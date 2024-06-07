(ns frontend.worker.batch-tx
  "Batch process multiple transactions.
  When batch-processing, don't refresh ui."
  (:require [frontend.worker.state :as worker-state]
            [frontend.schema-register :include-macros true :as sr]
            [logseq.common.util :as common-util]))


(sr/defkeyword :batch/txs
  "store all tx-data when batch-processing")

(sr/defkeyword :batch/db-before
  "store db before batch-tx.")

(sr/defkeyword :batch/opts
  "Opts for with-batch-tx-mode")

(defn get-batch-txs
  []
  (->> (:batch/txs @worker-state/*state)
       (sort-by :tx)
       ;; We need all the values for :many properties
       (common-util/distinct-by-last-wins (fn [[e a v _tx added]] [e a v added]))))

(defn set-batch-db-before!
  [db]
  (swap! worker-state/*state assoc :batch/db-before db))

(defn get-batch-db-before
  []
  (:batch/db-before @worker-state/*state))

(defn set-batch-opts
  [opts]
  (swap! worker-state/*state assoc :batch/opts opts))

(defn get-batch-opts
  []
  (:batch/opts @worker-state/*state))

(defn conj-batch-txs!
  [tx-data]
  (swap! worker-state/*state update :batch/txs (fn [data] ((fnil into []) data tx-data))))

(defn exit-batch-txs-mode!
  []
  (swap! worker-state/*state assoc :batch/txs [])
  (swap! worker-state/*state assoc :batch/db-before nil)
  (swap! worker-state/*state assoc :batch/opts nil))
