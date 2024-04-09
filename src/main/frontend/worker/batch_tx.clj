(ns frontend.worker.batch-tx
  "Macro for batch-tx fns")

(defmacro with-batch-tx-mode
  "1. start batch-tx mode
  2. run body
  3. exit batch-tx mode
  4. refresh-ui"
  [conn & body]
  `(do (frontend.worker.batch-tx/start-batch-tx-mode)
       ~@body
       (let [txs# (frontend.worker.batch-tx/get-batch-txs)]
         (frontend.worker.batch-tx/exit-batch-tx-mode)
         (when (seq txs#)
           (when-let [affected-keys# (not-empty
                                      (frontend.worker.react/get-affected-queries-keys
                                       {:db-after @~conn :tx-data txs#}))]
             (frontend.worker.util/post-message :refresh-ui {:affected-keys affected-keys#}))))))
