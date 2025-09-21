(ns logseq.outliner.batch-tx
  "Batch process multiple transactions.
  When batch-processing, don't refresh ui."
  #?(:cljs (:require-macros [logseq.outliner.batch-tx])))

(defmacro with-batch-tx-mode
  "1. start batch-tx mode
  2. run body
  3. exit batch-tx mode"
  [conn {:keys [additional-tx] :as opts} & body]
  `(if (some? (logseq.outliner.batch-tx/get-batch-db-before))
     (do ~@body)
     (try
       (let [tx-meta# (assoc (dissoc ~opts :additional-tx :transact-opts)
                             :batch-tx/batch-tx-mode? true)]
         (logseq.outliner.batch-tx/set-batch-opts tx-meta#)
         (logseq.outliner.batch-tx/set-batch-db-before! @~conn)
         ~@body
         (when (seq ~additional-tx)
           (logseq.db/transact! ~conn ~additional-tx {}))
         (datascript.core/transact! ~conn [] {:batch-tx/exit? true})
         (logseq.outliner.batch-tx/exit-batch-txs-mode!))
       (catch :default e#
         (logseq.outliner.batch-tx/exit-batch-txs-mode!)
         (throw e#)))))

#?(:cljs
   (do
     (defonce ^:private state
       (atom {;; store db before batch-tx
              :batch/db-before nil
              ;; Opts for with-batch-tx-mode
              :batch/opts nil}))
     (defn ^:api set-batch-db-before!
       [db]
       (swap! state assoc :batch/db-before db))

     (defn ^:api get-batch-db-before
       []
       (:batch/db-before @state))

     (defn ^:api set-batch-opts
       [opts]
       (swap! state assoc :batch/opts opts))

     (defn get-batch-opts
       []
       (:batch/opts @state))

     (defn ^:api exit-batch-txs-mode!
       []
       (swap! state assoc :batch/db-before nil)
       (swap! state assoc :batch/opts nil))))
