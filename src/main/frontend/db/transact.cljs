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

(defn- ensure-local-op-tx-id
  [tx-meta]
  (cond-> (or tx-meta {})
    (nil? (:db-sync/tx-id tx-meta))
    (assoc :db-sync/tx-id (random-uuid))))

(defn- op-block-uuids
  [ops]
  (->> ops
       (mapcat (fn [[op args]]
                 (case op
                   :save-block
                   [(some-> args first :block/uuid)]

                   :insert-blocks
                   (let [[blocks target-id] args]
                     (cons (when (uuid? target-id) target-id)
                           (map :block/uuid blocks)))

                   :delete-blocks
                   (first args)

                   [])))
       (remove nil?)
       set))

(defn- refresh-worker-op-blocks!
  [ops tx-meta]
  (let [updated-ids (op-block-uuids ops)]
    (when (seq updated-ids)
      (state/set-state! :db/latest-transacted-entity-uuids
                        {:updated-ids updated-ids
                         :deleted-ids #{}
                         :tx-id (:db-sync/tx-id tx-meta)}))))

(defn transact [worker-transact repo tx-data tx-meta]
  (let [tx-meta' (-> tx-meta
                     ensure-local-op-tx-id
                     (assoc
                        ;; not from remote (rtc)
                      :local-tx? true))]
    (worker-call (fn async-request []
                   (p/do!
                    (state/<invoke-db-worker :thread-api/undo-redo-set-pending-editor-info
                                             repo
                                             (state/get-editor-info))
                    (worker-transact repo tx-data tx-meta'))))))

(defn apply-outliner-ops
  [conn ops opts]
  (when (seq ops)
    (if (and util/node-test? conn)
      (outliner-op/apply-ops! conn ops opts)
      (let [opts' (-> opts
                      ensure-local-op-tx-id
                      (assoc
                       :client-id (:client-id @state/state)
                       :local-tx? true))
            request #(state/<invoke-db-worker
                      :thread-api/apply-outliner-ops
                      (state/get-current-repo)
                      ops
                      opts')]
        (frontend.db.transact/worker-call
         (fn []
           (p/do!
            (state/<invoke-db-worker :thread-api/undo-redo-set-pending-editor-info
                                     (state/get-current-repo)
                                     (state/get-editor-info))
            (p/let [result (request)]
              (refresh-worker-op-blocks! ops opts')
              result))))))))
