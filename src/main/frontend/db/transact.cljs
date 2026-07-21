(ns frontend.db.transact
  "Provides async transact for use with ldb/transact!"
  (:require ["react-dom" :as react-dom]
            [frontend.db.subs :as db-subs]
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
  [tx-meta rows]
  (when-let [edit-block-f (:editor/edit-block-fn tx-meta)]
    (try
      (edit-block-f rows)
      (catch :default error
        (log/error :db/editor-callback-failed {:error error})))))

(defn- operation-row-uuids
  [ops]
  (->> ops
       (mapcat (fn [[op args]]
                 (case op
                   :save-block
                   [(some-> args first :block/uuid)]

                   :insert-blocks
                   (map :block/uuid (first args))

                   :move-blocks
                   (first args)

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
                   []

                   :collapse-expand-blocks
                   (map :block/uuid (first args))

                   [])))
       (remove nil?)
       distinct
       vec))

(defn- canonical-editor-rows!
  [delta row-uuids]
  (let [blocks (:blocks delta)]
    (mapv (fn [block-uuid]
            (when-not (contains? blocks block-uuid)
              (throw (ex-info "Missing canonical editor row in worker response"
                              {:block-uuid block-uuid
                               :row-uuids row-uuids})))
            (get blocks block-uuid))
          row-uuids)))

(defn- run-response-editor-callback!
  [tx-meta delta row-uuids]
  (let [started-at (now-ms)
        rows (canonical-editor-rows! delta (vec (or row-uuids [])))
        rows-ready-at (now-ms)]
    (react-dom/flushSync
     #(run-edit-block-fn! tx-meta rows))
    {:canonical-rows-ms (- rows-ready-at started-at)
     :edit-block-flush-ms (- (now-ms) rows-ready-at)}))

(defn- publish-worker-response!
  [tx-meta delta row-uuids run-editor-callback?]
  (let [started-at (now-ms)]
    (when delta
      (react-dom/flushSync #(db-subs/apply-delta! delta)))
    (let [delta-flushed-at (now-ms)]
      (p/let [editor-callback-perf (when run-editor-callback?
                                     (run-response-editor-callback!
                                      tx-meta delta row-uuids))]
        (let [completed-at (now-ms)]
          {:delta-flush-ms (- delta-flushed-at started-at)
           :editor-callback-ms (- completed-at delta-flushed-at)
           :editor-callback editor-callback-perf
           :total-ms (- completed-at started-at)})))))

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
                       :local-tx? true))
            worker-opts (cond-> (dissoc opts' :ui/page-id :editor/edit-block-fn)
                          (:editor/edit-block-fn opts')
                          (assoc :editor-row-uuids (operation-row-uuids ops)))
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
                {:keys [result delta editor-row-uuids perf]} response
                mutation-returned-at (now-ms)
                worker-returned-at (now-ms)
                current-context? (and (= request-repo (state/get-current-repo))
                                      (= request-route (state/get-route-match)))
                publish? (or delta
                             (and current-context?
                                  (:editor/edit-block-fn opts')))
                ui-refresh-perf (when publish?
                                  (publish-worker-response!
                                   opts' delta editor-row-uuids current-context?))
                ui-updated-at (now-ms)]
          (when publish?
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
                 :state-update-ms (- ui-updated-at worker-returned-at)
                 :total-to-next-frame-ms (- (now-ms) started-at)}))))
          result)))))
