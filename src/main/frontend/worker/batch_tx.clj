(ns frontend.worker.batch-tx
  "Macro for batch-tx fns")

(defmacro with-batch-tx-mode
  "1. start batch-tx mode
  2. run body
  3. exit batch-tx mode"
  [conn {:keys [additional-tx] :as opts} & body]
  `(if (some? (frontend.worker.batch-tx/get-batch-db-before))
     (do ~@body)
     (let [tx-meta# (dissoc ~opts :additional-tx :transact-opts)]
       (frontend.worker.batch-tx/set-batch-db-before! @~conn)
       ~@body
       (when (seq ~additional-tx)
         (logseq.db/transact! ~conn ~additional-tx {}))
       (frontend.worker.batch-tx/exit-batch-txs-mode!))))
