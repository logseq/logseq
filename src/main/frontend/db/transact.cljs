(ns frontend.db.transact
  "Provides async transact for use with ldb/transact!"
  (:require [frontend.state :as state]
            [frontend.modules.outliner.pipeline :as outliner-pipeline]
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
  (p/create
   (fn [resolve reject]
     (let [run (fn []
                 (try
                   (resolve (f))
                   (catch :default e
                     (reject e))))]
       (if (exists? js/requestAnimationFrame)
         (js/requestAnimationFrame run)
         (js/setTimeout run 0))))))

(defn- run-edit-block-fn!
  [tx-meta page-window]
  (when-let [edit-block-f (state/take-edit-block-fn! (:editor/edit-block-fn-id tx-meta))]
    (if-let [rows (seq (:rows page-window))]
      (edit-block-f rows)
      (edit-block-f))))

(defn- outliner-ops-need-page-tree?
  [_ops]
  false)

(defn- outliner-ops-need-page-window-refresh?
  [ops]
  (boolean (some (comp outliner-pipeline/structural-outliner-op? first) ops)))

(def ^:private row-data-op-names
  #{:save-block
    :set-block-property
    :set-block-properties
    :remove-block-property
    :delete-property-value
    :batch-set-property
    :batch-remove-property
    :batch-delete-property-value
    :class-add-property
    :class-remove-property})

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

(defn- row-data-block-ids
  [ops]
  (when (and (not (outliner-ops-need-page-window-refresh? ops))
             (some (comp row-data-op-names first) ops))
    (op-block-uuids ops)))

(defn- refresh-worker-op-blocks!
  [ops tx-meta page-tree page-window affected-page-uuids]
  (let [started-at (now-ms)
        current-page-uuid (get-in page-window [:root :block/uuid])
        affected-page-uuids (disj (set affected-page-uuids) current-page-uuid)
        affected-ids (cond-> (op-block-uuids ops)
                       (:ui/page-id tx-meta) (conj (:ui/page-id tx-meta)))
        changed-ids (into affected-ids affected-page-uuids)
        deleted-ids (->> ops
                         (filter #(= :delete-blocks (first %)))
                         (mapcat (comp first second))
                         set)
        updated-ids (apply disj affected-ids deleted-ids)]
    (if (seq affected-ids)
      (let [tx-id (:db-sync/tx-id tx-meta)
            value (cond-> {:updated-ids updated-ids
                           :deleted-ids deleted-ids
                           :entity-tx-ids (zipmap changed-ids (repeat tx-id))
                           :page-window-refresh? (boolean
                                                  (or page-window
                                                      (outliner-ops-need-page-window-refresh? ops)))
                           :tx-id tx-id}
                    (seq affected-page-uuids)
                    (assoc :affected-page-uuids affected-page-uuids)

                    page-window
                    (assoc :page-window page-window)

                    (:ui/updated-blocks tx-meta)
                    (assoc :updated-blocks (:ui/updated-blocks tx-meta))

                    (and page-tree (outliner-ops-need-page-tree? ops))
                    (assoc :page-tree page-tree))
            changed-paths (outliner-pipeline/refresh-state-paths changed-ids)
            prepared-at (now-ms)]
        (state/set-state! :db/latest-transacted-entity-uuids
                          value
                          :changed-paths changed-paths)
        {:prepare-ms (- prepared-at started-at)
         :publish-ms (- (now-ms) prepared-at)})
      {:prepare-ms (- (now-ms) started-at)
       :publish-ms 0})))

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
                       :ui/handled-by-response? true
                       :ui/editor-info (state/get-editor-info)
                       :local-tx? true))
            render-block-uuids (op-block-uuids ops)
            requested-row-data-block-ids (row-data-block-ids ops)
            opts' (cond-> opts'
                    (seq render-block-uuids)
                    (assoc :ui/render-block-uuids render-block-uuids)

                    (seq requested-row-data-block-ids)
                    (assoc :ui/row-data-block-ids requested-row-data-block-ids))
            request #(state/<invoke-db-worker
                      :thread-api/apply-outliner-ops
                      (state/get-current-repo)
                      ops
                      opts')]
        (p/let [response (request)
                {:keys [result page-tree page-window updated-blocks affected-page-uuids perf]} response
                worker-returned-at (now-ms)]
          (let [ui-refresh-perf (refresh-worker-op-blocks!
                                 ops
                                 (cond-> opts'
                                   updated-blocks (assoc :ui/updated-blocks updated-blocks))
                                 page-tree page-window affected-page-uuids)
                state-updated-at (now-ms)]
            (p/let [_ (on-next-frame!
                       (fn []
                         (run-edit-block-fn! opts' page-window)
                         (log-outliner-op-perf!
                          {:stage :ui-updated
                           :perf-id perf-id
                           :op-names (mapv first ops)
                           :op-count (count ops)
                           :page-tree-requested? page-tree-requested?
                           :page-window-returned? (boolean page-window)
                           :page-window-offset (:offset page-window)
                           :page-window-total-count (:total-count page-window)
                           :page-window-row-count (count (:rows page-window))
                           :worker-apply-ms (:apply-ms perf)
                           :worker-page-window-ms (:page-window-ms perf)
                           :worker-listener (:listener perf)
                           :worker-roundtrip-ms (- worker-returned-at started-at)
                           :ui-refresh ui-refresh-perf
                           :state-update-ms (- state-updated-at worker-returned-at)
                           :total-to-next-frame-ms (- (now-ms) started-at)})))]
              result)))))))
