(ns frontend.worker.batch-tx
  "Macro for batch-tx fns"
  (:require [datascript.core :as d]))

(defmacro with-batch-tx-mode
  "1. start batch-tx mode
  2. run body
  3. exit batch-tx mode"
  [conn & body]
  `(do (d/transact! ~conn [{:db/ident :logseq.kv/tx-batch-mode? :editor/tx-batch-mode? true}]
                    {:tx-batch? true
                     :gen-undo-op? false})
       ~@body
       (d/transact! ~conn [{:db/ident :logseq.kv/tx-batch-mode? :editor/tx-batch-mode? false}]
                    {:tx-batch? true
                     :gen-undo-op? false})
       (frontend.worker.batch-tx/clear-batch-txs!)))
