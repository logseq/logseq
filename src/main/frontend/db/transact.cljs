(ns frontend.db.transact
  "Provides async transact for use with ldb/transact!"
  (:require [frontend.common.page-window :as page-window]
            [frontend.modules.outliner.pipeline :as outliner-pipeline]
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
  (when-let [edit-block-f (state/take-edit-block-fn! (:editor/edit-block-fn-id tx-meta))]
    (if-let [rows (seq (:rows current-window))]
      (edit-block-f rows)
      (edit-block-f))))

(defn- outliner-ops-need-page-window-refresh?
  [ops]
  (boolean (some (comp outliner-pipeline/structural-outliner-op? first) ops)))

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
  [ops tx-meta current-window affected-page-uuids]
  (let [started-at (now-ms)
        affected-page-uuids (set affected-page-uuids)
        affected-ids (op-block-uuids ops)
        changed-ids (into affected-ids affected-page-uuids)
        page-id (or (:ui/page-id tx-meta) (state/get-current-page))
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
                           :page-window-refresh? (outliner-ops-need-page-window-refresh? ops)
                           :tx-id tx-id}
                    page-id
                    (assoc :page-id page-id)

                    current-window
                    (assoc :page-window current-window)

                    (seq affected-page-uuids)
                    (assoc :affected-page-uuids affected-page-uuids))
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
            request-repo (state/get-current-repo)
            request-route (state/get-route-match)
            request-page-id (or (:ui/page-id opts) (state/get-current-page))
            structural? (outliner-ops-need-page-window-refresh? ops)
            page-window-opts (or (:ui/page-window-opts opts) {:offset 0})
            opts' (-> opts
                      ensure-local-op-tx-id
                      (assoc
                       :client-id (:client-id @state/state)
                       :ui/perf-id perf-id
                       :ui/handled-by-response? true
                       :local-tx? true))
            affected-block-uuids (op-block-uuids ops)
            worker-opts (cond-> (dissoc opts' :ui/page-id :ui/page-window-opts
                                       :editor/edit-block-fn-id)
                          (seq affected-block-uuids)
                          (assoc :affected-block-uuids affected-block-uuids))
            request #(-> (p/do!
                          (state/<invoke-db-worker :thread-api/undo-redo-set-pending-editor-info
                                                   request-repo
                                                   (state/get-editor-info))
                          (state/<invoke-db-worker
                           :thread-api/apply-outliner-ops
                           request-repo
                           ops
                           worker-opts))
                         (p/catch
                          (fn [error]
                            (state/remove-edit-block-fn! (:editor/edit-block-fn-id opts'))
                            (throw error))))]
        (p/let [response (request)
                {:keys [result affected-page-uuids perf]} response
                mutation-returned-at (now-ms)
                current-window (when (and structural? request-page-id)
                                 (state/<invoke-db-worker
                                  :thread-api/get-page-blocks-window
                                  request-repo
                                  request-page-id
                                  (assoc page-window-opts :limit page-window/limit)))
                worker-returned-at (now-ms)]
          (if-not (and (= request-repo (state/get-current-repo))
                       (= request-route (state/get-route-match)))
            (state/remove-edit-block-fn! (:editor/edit-block-fn-id opts'))
            (let [ui-refresh-perf (refresh-worker-op-blocks!
                                   ops
                                   opts'
                                   current-window
                                   affected-page-uuids)
                  state-updated-at (now-ms)]
              (on-next-frame!
               (fn []
                 (run-edit-block-fn! opts' current-window)
                 (log-outliner-op-perf!
                  {:stage :ui-updated
                   :perf-id perf-id
                   :op-names (mapv first ops)
                   :op-count (count ops)
                   :worker-apply-ms (:apply-ms perf)
                   :worker-listener (:listener perf)
                   :worker-roundtrip-ms (- mutation-returned-at started-at)
                   :page-window-ms (- worker-returned-at mutation-returned-at)
                   :ui-refresh ui-refresh-perf
                   :state-update-ms (- state-updated-at worker-returned-at)
                   :total-to-next-frame-ms (- (now-ms) started-at)})))))
          result)))))
