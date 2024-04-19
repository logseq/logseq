(ns frontend.worker.batch-tx
  "Macro for batch-tx fns")

(defmacro with-batch-tx-mode
  "1. start batch-tx mode
  2. run body
  3. exit batch-tx mode"
  [conn {:keys [additional-tx] :as opts} & body]
  `(let [tx-batch-counter# (get (d/entity @~conn :logseq.kv/tx-batch-counter) :batch-tx/counter 0)
         outside-batch?# (zero? tx-batch-counter#)
         tx-meta# (dissoc ~opts :additional-tx :transact-opts)]
     (logseq.db/transact! ~conn
                          [{:db/ident :logseq.kv/tx-batch-counter :batch-tx/counter (inc tx-batch-counter#)}]
                          {:batch-tx-begin? true})
     (when outside-batch?# (frontend.worker.batch-tx/set-batch-db-before! @~conn))
     ~@body
     (when (seq ~additional-tx)
       (logseq.db/transact! ~conn ~additional-tx {}))
     (logseq.db/transact! ~conn [{:db/ident :logseq.kv/tx-batch-counter :batch-tx/counter tx-batch-counter#}]
       (assoc tx-meta# :batch-tx-end? true))
     (when outside-batch?# (frontend.worker.batch-tx/exit-batch-txs-mode!))))
