(ns frontend.worker.batch-tx
  "Macro for batch-tx fns")

(defmacro with-batch-tx-mode
  "1. start batch-tx mode
  2. run body
  3. exit batch-tx mode"
  [& body]
  `(do (frontend.worker.batch-tx/start-batch-tx-mode)
       ~@body
       (frontend.worker.batch-tx/exit-batch-tx-mode)))
