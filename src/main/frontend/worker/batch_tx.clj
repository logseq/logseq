(ns frontend.worker.batch-tx
  "Macro for batch-tx fns")

(defmacro with-batch-tx-mode
  "1. start batch-tx mode
  2. run body
  3. exit batch-tx mode"
  [conn {:keys [additional-tx] :as opts} & body]
  `(if (some? (frontend.worker.batch-tx/get-batch-db-before))
     (do ~@body)
     (let [tx-meta# (assoc (dissoc ~opts :additional-tx :transact-opts)
                           :batch-tx/batch-tx-mode? true)]
       (frontend.worker.batch-tx/set-batch-opts tx-meta#)
       (frontend.worker.batch-tx/set-batch-db-before! @~conn)
       ~@body
       (when (seq ~additional-tx)
         (logseq.db/transact! ~conn ~additional-tx {}))
       (datascript.core/transact! ~conn [] {:batch-tx/exit? true})
       (frontend.worker.batch-tx/exit-batch-txs-mode!))))
