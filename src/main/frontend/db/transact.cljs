(ns frontend.db.transact
  "Provides async transact for use with ldb/transact!"
  (:require ["react-dom" :as react-dom]
            [frontend.modules.outliner.pipeline :as outliner-pipeline]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.outliner.op :as outliner-op]
            [promesa.core :as p]))

(defn worker-call
  [request-f]
  (js/Promise.
   (fn [resolve reject]
     (-> (request-f)
         (.then (fn [result]
                  (if (:ex-data result)
                    (do
                      (log/error :worker-request-failed result)
                      (reject (ex-info "Worker request failed" result)))
                    (resolve result))))
         (.catch reject)))))

(defonce ^:private *repo->outliner-mutation-tail (atom {}))

(defn- enqueue-outliner-mutation!
  [repo request-f]
  (let [previous (get @*repo->outliner-mutation-tail repo (p/resolved nil))
        result (p/then previous (fn [_] (request-f)))
        tail (p/catch result (constantly nil))]
    (swap! *repo->outliner-mutation-tail assoc repo tail)
    (p/finally tail
               (fn []
                 (swap! *repo->outliner-mutation-tail
                        (fn [repo->tail]
                          (if (identical? tail (get repo->tail repo))
                            (dissoc repo->tail repo)
                            repo->tail)))))
    result))

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
  (let [run (fn []
              (try
                (f)
                (catch :default error
                  (log/error :db/editor-frame-callback-failed {:error error}))))]
    (if (exists? js/requestAnimationFrame)
      (js/requestAnimationFrame run)
      (js/setTimeout run 0)))
  nil)

(defn- run-edit-block-fn!
  [tx-meta current-window]
  (when-let [edit-block-f (:editor/edit-block-fn tx-meta)]
    (try
      (edit-block-f (:rows current-window))
      (catch :default error
        (log/error :db/editor-callback-failed {:error error})))))

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
  [_ops tx-meta updated-blocks entity-updated-block-uuids deleted-block-uuids
   affected-page-uuids structural-parent-uuids]
  (let [started-at (now-ms)
        affected-page-uuids (set affected-page-uuids)
        page-id (or (:ui/page-id tx-meta) (state/get-current-page))
        deleted-ids (set deleted-block-uuids)
        updated-ids (set entity-updated-block-uuids)
        entity-ids (into updated-ids deleted-ids)
        structural-parent-uuids (set structural-parent-uuids)]
    (if (or (seq entity-ids)
            (seq structural-parent-uuids)
            (seq affected-page-uuids))
      (let [tx-id (:db-sync/tx-id tx-meta)
            value (cond-> {:updated-ids updated-ids
                           :deleted-ids deleted-ids
                           :entity-tx-ids (zipmap entity-ids (repeat tx-id))
                           :children-tx-ids (zipmap structural-parent-uuids
                                                    (repeat tx-id))
                           :tree-tx-ids (zipmap affected-page-uuids
                                                (repeat tx-id))
                           :tx-id tx-id}
                    page-id
                    (assoc :page-id page-id)

                    (seq updated-blocks)
                    (assoc :updated-blocks updated-blocks)

                    (seq affected-page-uuids)
                    (assoc :affected-page-uuids affected-page-uuids))
            changed-paths (outliner-pipeline/refresh-state-paths entity-ids
                                                                 structural-parent-uuids
                                                                 affected-page-uuids)
            prepared-at (now-ms)]
        (outliner-tree/reconcile-resident-block-trees! updated-blocks deleted-ids)
        (state/set-state! :db/latest-transacted-entity-uuids
                          value
                          :changed-paths changed-paths)
        {:prepare-ms (- prepared-at started-at)
         :publish-ms (- (now-ms) prepared-at)})
      {:prepare-ms (- (now-ms) started-at)
       :publish-ms 0})))

(defn- publish-worker-response!
  [ops tx-meta updated-blocks entity-updated-block-uuids deleted-block-uuids
   affected-page-uuids structural-parent-uuids]
  (let [ui-refresh-perf (volatile! nil)]
    (react-dom/flushSync
     (fn []
       (vreset! ui-refresh-perf
                (refresh-worker-op-blocks! ops tx-meta updated-blocks entity-updated-block-uuids
                                           deleted-block-uuids affected-page-uuids
                                           structural-parent-uuids))
       (run-edit-block-fn! tx-meta {:rows updated-blocks})))
    @ui-refresh-perf))

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
            request-repo (state/get-current-repo)
            request-route (state/get-route-match)
            request-editor-info (state/get-editor-info)
            opts' (-> opts
                      ensure-local-op-tx-id
                      (assoc
                       :client-id (:client-id @state/state)
                       :ui/perf-id perf-id
                       :ui/handled-by-response? true
                       :local-tx? true))
            affected-block-uuids (op-block-uuids ops)
            worker-opts (cond-> (dissoc opts' :ui/page-id :editor/edit-block-fn)
                          (seq affected-block-uuids)
                          (assoc :affected-block-uuids affected-block-uuids))
            request #(p/do!
                      (state/<invoke-db-worker :thread-api/undo-redo-set-pending-editor-info
                                               request-repo
                                               request-editor-info)
                      (state/<invoke-db-worker
                       :thread-api/apply-outliner-ops
                       request-repo
                       ops
                       worker-opts))]
        (p/let [response (enqueue-outliner-mutation! request-repo request)
                {:keys [result affected-page-uuids updated-blocks entity-updated-block-uuids
                        deleted-block-uuids structural-parent-uuids perf]} response
                mutation-returned-at (now-ms)
                worker-returned-at (now-ms)]
          (when (and (= request-repo (state/get-current-repo))
                     (= request-route (state/get-route-match)))
            (let [ui-refresh-perf (publish-worker-response!
                                   ops opts' updated-blocks entity-updated-block-uuids
                                   deleted-block-uuids affected-page-uuids
                                   structural-parent-uuids)
                  state-updated-at (now-ms)]
              (on-next-frame!
               (fn []
                 (log-outliner-op-perf!
                  {:stage :ui-updated
                   :perf-id perf-id
                   :op-names (mapv first ops)
                   :op-count (count ops)
                   :worker-apply-ms (:apply-ms perf)
                   :worker-perf (dissoc perf :listener)
                   :worker-listener (:listener perf)
                   :worker-roundtrip-ms (- mutation-returned-at started-at)
                   :worker-to-ui-ms (- worker-returned-at mutation-returned-at)
                   :ui-refresh ui-refresh-perf
                   :state-update-ms (- state-updated-at worker-returned-at)
                   :total-to-next-frame-ms (- (now-ms) started-at)})))))
          result)))))
