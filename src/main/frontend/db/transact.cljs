(ns frontend.db.transact
  "Provides async transact for use with ldb/transact!"
  (:require [frontend.state :as state]
            [frontend.util :as util]
            [logseq.outliner.op :as outliner-op]
            [promesa.core :as p]))

(defn worker-call
  [request-f]
  (p/let [result (request-f)]
    ;; yields to ensure ui db to be updated before resolved
    (p/delay 0)
    result))

(defn transact [worker-transact repo tx-data tx-meta]
  (let [tx-meta' (assoc tx-meta
                        ;; not from remote (rtc)
                        :local-tx? true)]
    (worker-call (fn async-request []
                   (worker-transact repo tx-data tx-meta')))))

(defn apply-outliner-ops
  [conn ops opts]
  (when (seq ops)
    (if util/node-test?
      (outliner-op/apply-ops! (state/get-current-repo)
                              conn
                              ops
                              (state/get-date-formatter)
                              opts)
      (let [opts' (assoc opts
                         :client-id (:client-id @state/state)
                         :local-tx? true)
            request #(frontend.state/<invoke-db-worker
                      :thread-api/apply-outliner-ops
                      (frontend.state/get-current-repo)
                      ops
                      opts')]
        (frontend.db.transact/worker-call request)))))
