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

                   :move-blocks
                   (let [[block-ids target-id] args]
                     (cons (when (uuid? target-id) target-id)
                           block-ids))

                   :move-blocks-up-down
                   (first args)

                   :indent-outdent-blocks
                   (first args)

                   (:set-block-property :remove-block-property :delete-property-value)
                   [(first args)]

                   (:batch-set-property :batch-remove-property :batch-delete-property-value)
                   (first args)

                   :create-property-text-block
                   [(first args)]

                   :delete-blocks
                   (first args)

                   [])))
       (remove nil?)
       set))

(defn- refresh-worker-op-blocks!
  [ops tx-meta page-tree]
  (let [affected-ids (op-block-uuids ops)
        deleted-ids (->> ops
                         (filter #(= :delete-blocks (first %)))
                         (mapcat (comp first second))
                         set)
        updated-ids (apply disj affected-ids deleted-ids)]
    (when (seq affected-ids)
      (state/set-state! :db/latest-transacted-entity-uuids
                        {:updated-ids updated-ids
                         :deleted-ids deleted-ids
                         :page-tree page-tree
                         :editor/edit-block-fn-id (:editor/edit-block-fn-id tx-meta)
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
                       :ui/page-id (state/get-current-page)
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
            (p/let [{:keys [result page-tree]} (request)]
              (refresh-worker-op-blocks! ops opts' page-tree)
              result))))))))
