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

(defn- now-ms []
  (if (and (exists? js/performance)
           (.-now js/performance))
    (.now js/performance)
    (js/Date.now)))

(defn- log-outliner-op-perf!
  [data]
  (when goog.DEBUG
    (log/info :db/outliner-op-perf data)))

(defn- on-next-frame!
  [f]
  (if (exists? js/requestAnimationFrame)
    (js/requestAnimationFrame f)
    (js/setTimeout f 0)))

(defn- outliner-ops-need-page-tree?
  [_ops]
  false)

(defn- outliner-ops-need-page-window-refresh?
  [ops]
  (boolean
   (some (comp #{:insert-blocks
                 :delete-blocks
                 :move-blocks
                 :move-blocks-up-down
                 :indent-outdent-blocks
                 :apply-template
                 :collapse-expand-blocks}
               first)
         ops)))

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

                   :apply-template
                   [(second args)]

                   (:set-block-property :set-block-properties :remove-block-property :delete-property-value)
                   [(first args)]

                   (:batch-set-property :batch-remove-property :batch-delete-property-value)
                   (first args)

                   :create-property-text-block
                   [(first args)]

                   (:class-add-property :class-remove-property)
                   [(first args)]

                   :delete-closed-value
                   [(second args)]

                   :delete-blocks
                   (first args)

                   :collapse-expand-blocks
                   (map :block/uuid (first args))

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
                        (cond-> {:updated-ids updated-ids
                                 :deleted-ids deleted-ids
                                 :page-window-refresh? (outliner-ops-need-page-window-refresh? ops)
                                 :editor/edit-block-fn-id (:editor/edit-block-fn-id tx-meta)
                                 :tx-id (:db-sync/tx-id tx-meta)}
                          (and page-tree (outliner-ops-need-page-tree? ops))
                          (assoc :page-tree page-tree))))))

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
      (let [started-at (now-ms)
            perf-id (random-uuid)
            page-tree-requested? (outliner-ops-need-page-tree? ops)
            opts' (-> opts
                      ensure-local-op-tx-id
                      (assoc
                       :client-id (:client-id @state/state)
                       :ui/perf-id perf-id
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
            (p/let [{:keys [result page-tree]} (request)
                    worker-returned-at (now-ms)]
              (refresh-worker-op-blocks! ops opts' page-tree)
              (let [state-updated-at (now-ms)]
                (on-next-frame!
                 (fn []
                   (log-outliner-op-perf!
                    {:stage :ui-updated
                     :perf-id perf-id
                     :op-names (mapv first ops)
                     :op-count (count ops)
                     :page-tree-requested? page-tree-requested?
                     :worker-roundtrip-ms (- worker-returned-at started-at)
                     :state-update-ms (- state-updated-at worker-returned-at)
                     :total-to-next-frame-ms (- (now-ms) started-at)}))))
              result))))))))
