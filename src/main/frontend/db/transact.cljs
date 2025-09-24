(ns frontend.db.transact
  "Provides async transact for use with ldb/transact!"
  (:require [clojure.core.async :as async]
            [clojure.core.async.interop :refer [p->c]]
            [frontend.common.async-util :include-macros true :refer [<?]]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.outliner.op :as outliner-op]
            [promesa.core :as p]))

(defn worker-call
  [request-f]
  (let [response (p/deferred)]
    (async/go
      (let [result (<? (p->c (request-f)))]
        (if (:ex-data result)
          (do
            (log/error :worker-request-failed result)
            (p/reject! response result))
          (p/resolve! response result))))
    response))

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
