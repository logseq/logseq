(ns frontend.worker.sync.apply-txs
  "Pending tx and remote tx application helpers for db sync."
  (:require
   [clojure.set :as set]
   [datascript.core :as d]
   [frontend.worker.shared-service :as shared-service]
   [frontend.worker.state :as worker-state]
   [frontend.worker.sync.assets :as sync-assets]
   [frontend.worker.sync.auth :as sync-auth]
   [frontend.worker.sync.client-op :as client-op]
   [frontend.worker.sync.const :as rtc-const]
   [frontend.worker.sync.crypt :as sync-crypt]
   [frontend.worker.sync.large-title :as sync-large-title]
   [frontend.worker.sync.presence :as sync-presence]
   [frontend.worker.sync.transport :as sync-transport]
   [frontend.worker.undo-redo :as worker-undo-redo]
   [lambdaisland.glogi :as log]
   [logseq.db :as ldb]
   [logseq.db-sync.tx-sanitize :as tx-sanitize]
   [logseq.db-sync.order :as sync-order]
   [logseq.db.common.normalize :as db-normalize]
   [logseq.db.sqlite.util :as sqlite-util]
   [logseq.outliner.core :as outliner-core]
   [logseq.outliner.op :as outliner-op]
   [logseq.outliner.op.construct :as op-construct]
   [logseq.outliner.page :as outliner-page]
   [logseq.outliner.property :as outliner-property]
   [logseq.outliner.recycle :as outliner-recycle]
   [promesa.core :as p]
   [logseq.common.util :as common-util]))

(defonce *repo->latest-remote-tx (atom {}))
(defonce *repo->latest-remote-checksum (atom {}))
(defonce *upload-temp-opfs-pool (atom nil))
;; Debug-only gate to reproduce one-way sync:
;; still pull/rebase remote txs, but skip local tx batch uploads.
(defonce *repo->upload-stopped? (atom {}))

(defn fail-fast [tag data]
  (log/error tag data)
  (throw (ex-info (name tag) data)))

(defn set-upload-stopped!
  [repo stopped?]
  (swap! *repo->upload-stopped? assoc repo (boolean stopped?))
  (boolean stopped?))

(defn upload-stopped?
  [repo]
  (true? (get @*repo->upload-stopped? repo)))

(declare enqueue-asset-task!)

(defn- current-client [repo]
  (sync-presence/current-client worker-state/*db-sync-client repo))

(defn- client-ops-conn [repo]
  (sync-presence/client-ops-conn worker-state/get-client-ops-conn repo))

(defn- sync-counts [repo]
  (sync-presence/sync-counts
   {:get-datascript-conn worker-state/get-datascript-conn
    :get-client-ops-conn worker-state/get-client-ops-conn
    :get-pending-local-tx-count client-op/get-pending-local-tx-count
    :get-unpushed-asset-ops-count client-op/get-unpushed-asset-ops-count
    :get-local-tx client-op/get-local-tx
    :get-local-checksum client-op/get-local-checksum
    :get-graph-uuid client-op/get-graph-uuid
    :latest-remote-tx @*repo->latest-remote-tx
    :latest-remote-checksum @*repo->latest-remote-checksum}
   repo))

(defn- broadcast-rtc-state! [client]
  (when client
    (shared-service/broadcast-to-clients!
     :rtc-sync-state
     (sync-presence/rtc-state-payload sync-counts client))))

(def reverse-data-ignored-attrs
  #{:block/tx-id})

(def rtc-ignored-attrs
  (set/union
   reverse-data-ignored-attrs
   rtc-const/ignore-attrs-when-syncing
   rtc-const/ignore-entities-when-init-upload))

(defn- remove-ignored-attrs [tx-data]
  (remove (fn [d] (contains? rtc-ignored-attrs (:a d))) tx-data))

(defn- normalize-tx-data [db-after db-before tx-data]
  (->> tx-data
       remove-ignored-attrs
       (db-normalize/normalize-tx-data db-after db-before)
       (remove (fn [[_op e]]
                 (contains? rtc-const/ignore-entities-when-init-upload e)))))

(declare replay-canonical-outliner-op!
         invalid-rebase-op!)

(defn reverse-tx-data [db-before db-after tx-data]
  (->> tx-data
       reverse
       (keep (fn [[e a v t added]]
               (let [reversed-datom (d/datom e a v t (not added))]
                 ;; trick: reverse the order of `db-before` and `db-after`
                (db-normalize/normalize-datom db-before db-after reversed-datom))))
       (db-normalize/replace-attr-retract-with-retract-entity-v2 db-after)
       db-normalize/reorder-retract-entity))

(defn normalize-rebased-pending-tx
  [{:keys [db-before db-after tx-data]}]
  {:normalized-tx-data (normalize-tx-data db-after db-before tx-data)
   :reversed-datoms (reverse-tx-data db-before db-after tx-data)})

(defn- get-graph-id [repo]
  (sync-large-title/get-graph-id worker-state/get-datascript-conn repo))

(defn- auth-headers []
  (sync-auth/auth-headers (worker-state/get-id-token)))

(defn- send! [ws message]
  (sync-transport/send! sync-transport/coerce-ws-client-message ws message))

(defn- ws-open? [ws]
  (sync-transport/ws-open? ws))

(defn upload-large-title! [repo graph-id title aes-key]
  (sync-large-title/upload-large-title!
   {:repo repo
    :graph-id graph-id
    :title title
    :aes-key aes-key
    :http-base (sync-auth/http-base-url @worker-state/*db-sync-config)
    :auth-headers (auth-headers)
    :fail-fast-f fail-fast
    :encrypt-text-value-f sync-crypt/<encrypt-text-value}))

(defn offload-large-titles [tx-data {:keys [upload-fn] :as opts}]
  (sync-large-title/offload-large-titles tx-data (assoc opts :upload-fn (or upload-fn upload-large-title!))))

(defn rehydrate-large-titles! [repo {:keys [download-fn] :as opts}]
  (sync-large-title/rehydrate-large-titles!
   repo
   (assoc opts
          :download-fn (or download-fn
                           (fn [repo* graph-id obj aes-key]
                             (sync-large-title/download-large-title!
                              {:repo repo*
                               :graph-id graph-id
                               :obj obj
                               :aes-key aes-key
                               :http-base (sync-auth/http-base-url @worker-state/*db-sync-config)
                               :auth-headers (auth-headers)
                               :fail-fast-f fail-fast
                               :decrypt-text-value-f sync-crypt/<decrypt-text-value})))
          :get-conn-f worker-state/get-datascript-conn
          :get-graph-id-f get-graph-id
          :graph-e2ee?-f sync-crypt/graph-e2ee?
          :ensure-graph-aes-key-f sync-crypt/<ensure-graph-aes-key
          :fail-fast-f fail-fast)))

(defn rehydrate-large-titles-from-db! [repo graph-id]
  (sync-large-title/rehydrate-large-titles-from-db!
   repo graph-id {:get-conn-f worker-state/get-datascript-conn
                  :rehydrate-large-titles!-f rehydrate-large-titles!}))

(defn request-asset-download! [repo asset-uuid]
  (sync-assets/request-asset-download!
   repo asset-uuid
   {:current-client-f current-client
    :enqueue-asset-task-f enqueue-asset-task!
    :broadcast-rtc-state!-f broadcast-rtc-state!}))

(defn- enqueue-asset-task! [client task]
  (when-let [queue (:asset-queue client)]
    (swap! queue (fn [prev] (p/then prev (fn [_] (task)))))))

(defn- derive-history-outliner-ops
  [db-before db-after tx-data tx-meta]
  (op-construct/derive-history-outliner-ops db-before db-after tx-data tx-meta))

(defn- rebase-history-ops
  [local-tx]
  {:forward-ops (seq (:forward-outliner-ops local-tx))
   :inverse-ops (seq (:inverse-outliner-ops local-tx))})

(defn- normalize-tx-data-for-rebase
  [tx-data]
  (some->> tx-data
           (mapv (fn [item]
                   (if (and (vector? item) (= 5 (count item)))
                     (let [[op e a v _t] item]
                       [op e a v])
                     item)))
           db-normalize/reorder-retract-entity))

(defn- inferred-outliner-ops?
  [tx-meta]
  (and (nil? (:outliner-ops tx-meta))
       (not (:undo? tx-meta))
       (not (:redo? tx-meta))
       (not= :batch-import-edn (:outliner-op tx-meta))))

(declare apply-history-action!)
(defn- persist-local-tx!
  [repo {:keys [db-before db-after tx-data tx-meta] :as tx-report} normalized-tx-data reversed-datoms]
  (when (client-ops-conn repo)
    (let [tx-id (or (:db-sync/tx-id tx-meta) (random-uuid))
          now (.now js/Date)
          {:keys [forward-outliner-ops inverse-outliner-ops]}
          (derive-history-outliner-ops db-before db-after tx-data tx-meta)
          inferred-outliner-ops?' (inferred-outliner-ops? tx-meta)
          {:keys [should-inc-pending?]}
          (client-op/upsert-local-tx-entry!
           repo
           {:tx-id tx-id
            :created-at now
            :pending? true
            :failed? false
            :outliner-op (:outliner-op tx-meta)
            :undo-redo (cond
                         (:undo? tx-meta) :undo
                         (:redo? tx-meta) :redo
                         :else :none)
            :forward-outliner-ops forward-outliner-ops
            :inverse-outliner-ops inverse-outliner-ops
            :inferred-outliner-ops? inferred-outliner-ops?'
            :normalized-tx-data normalized-tx-data
            :reversed-tx-data reversed-datoms})]
      ;; (prn :debug :forward-outliner-ops)
      ;; (cljs.pprint/pprint forward-outliner-ops)
      ;; (prn :debug :inverse-outliner-ops)
      ;; (cljs.pprint/pprint inverse-outliner-ops)
      (worker-undo-redo/gen-undo-ops! repo tx-report tx-id
                                      {:apply-history-action! apply-history-action!})
      (when should-inc-pending?
        (client-op/adjust-pending-local-tx-count! repo 1)
        (when-let [client (current-client repo)]
          (broadcast-rtc-state! client)))
      tx-id)))

(defn prepare-upload-tx-entries
  [_conn pending]
  (let [entries (mapv (fn [{:keys [tx-id tx outliner-op]}]
                        {:tx-id tx-id
                         :outliner-op outliner-op
                         :tx-data (vec tx)})
                      pending)
        empty-tx-ids (->> entries
                          (filter (comp empty? :tx-data))
                          (mapv :tx-id))
        tx-entries (filterv (comp seq :tx-data) entries)]
    {:tx-entries tx-entries
     :drop-tx-ids empty-tx-ids}))

(defn pending-txs
  [repo & {:keys [limit]}]
  (client-op/get-pending-local-txs repo :limit limit))

(defn- pending-tx-by-id
  [repo tx-id]
  (client-op/get-local-tx-entry repo tx-id))

(defn mark-pending-txs-false!
  [repo tx-ids]
  (when (seq tx-ids)
    (when-let [pending-to-remove (client-op/mark-pending-txs-false! repo tx-ids)]
      (when (pos? pending-to-remove)
        (client-op/adjust-pending-local-tx-count! repo (- pending-to-remove)))
      (when-let [client (current-client repo)]
        (broadcast-rtc-state! client)))))

(defn mark-failed-txs!
  [repo tx-ids]
  (when (seq tx-ids)
    (when-let [pending-to-remove (client-op/mark-failed-txs! repo tx-ids)]
      (when (pos? pending-to-remove)
        (client-op/adjust-pending-local-tx-count! repo (- pending-to-remove)))
      (when-let [client (current-client repo)]
        (broadcast-rtc-state! client)))))

(defn clear-pending-txs!
  [repo]
  (mark-pending-txs-false! repo (mapv :tx-id (pending-txs repo))))

(declare history-action-error-reason)

(defn- inline-history-action
  [tx-meta]
  (let [forward-outliner-ops (or (:db-sync/forward-outliner-ops tx-meta)
                                 (:forward-outliner-ops tx-meta))
        inverse-outliner-ops (or (:db-sync/inverse-outliner-ops tx-meta)
                                 (:inverse-outliner-ops tx-meta))]
    (when (and (seq forward-outliner-ops) (seq inverse-outliner-ops))
      {:outliner-op (:outliner-op tx-meta)
       :forward-outliner-ops forward-outliner-ops
       :inverse-outliner-ops inverse-outliner-ops})))

(defn ^:large-vars/cleanup-todo apply-history-action!
  [repo tx-id undo? tx-meta]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (if-let [action (or (pending-tx-by-id repo tx-id)
                        (inline-history-action tx-meta))]
      (let [{:keys [tx reversed-tx forward-outliner-ops inverse-outliner-ops]} action
            ops (->> (if undo? inverse-outliner-ops forward-outliner-ops)
                     (filter (fn [op-entry]
                               (and (sequential? op-entry)
                                    (contains? op-construct/semantic-outliner-ops
                                               (first op-entry)))))
                     seq)
            tx-data (-> (if undo? reversed-tx tx)
                        normalize-tx-data-for-rebase)
            ops' (if (seq ops)
                   ops
                   [[:transact [tx-data nil]]])
            history-tx-id (let [provided-history-tx-id (:db-sync/tx-id tx-meta)]
                            (if (and (uuid? provided-history-tx-id)
                                     (not= provided-history-tx-id tx-id))
                              provided-history-tx-id
                              (random-uuid)))
            tx-meta' (cond-> {:outliner-op (:outliner-op action)
                              :local-tx? true
                              :gen-undo-ops? false
                              :persist-op? true
                              :undo? undo?
                              :redo? (:redo? tx-meta)
                              :db-sync/tx-id history-tx-id
                              :db-sync/source-tx-id (or (:db-sync/source-tx-id tx-meta)
                                                        tx-id)
                              :db-sync/forward-outliner-ops (if undo?
                                                              (:inverse-outliner-ops action)
                                                              (:forward-outliner-ops action))
                              :db-sync/inverse-outliner-ops (if undo?
                                                              (:forward-outliner-ops action)
                                                              (:inverse-outliner-ops action))})]
          ;; (prn :debug :undo? undo? :ops)
          ;; (cljs.pprint/pprint ops')
          ;; (cljs.pprint/pprint (select-keys action [:tx-id :outliner-op :forward-outliner-ops :inverse-outliner-ops]))
          ;; (prn :debug :tx-meta)
          ;; (cljs.pprint/pprint tx-meta)
        (if (seq ops')
          (try
            (ldb/batch-transact-with-temp-conn!
             conn
             tx-meta'
             (fn [conn]
               (doseq [op ops']
                 (replay-canonical-outliner-op! conn op nil))))
            {:applied? true
             :history-tx-id history-tx-id}
            (catch :default e
              (log/error ::undo-redo-failed e)
              {:applied? false
               :reason (history-action-error-reason e)
               :action action}))
          {:applied? false :reason :unsupported-history-action
           :action action}))
      {:applied? false
       :reason :missing-history-action
       :tx-id tx-id})
    (fail-fast :db-sync/missing-db {:repo repo
                                    :op :apply-history-action})))

(defn flush-pending!
  [repo client]
  (let [inflight @(:inflight client)
        local-tx (client-op/get-local-tx repo)
        remote-tx (get @*repo->latest-remote-tx repo)
        conn (worker-state/get-datascript-conn repo)]
    (when (and conn (= local-tx remote-tx)) ; rebase
      (when (empty? inflight)
        (when-let [ws (:ws client)]
          (when (and (ws-open? ws) (worker-state/online?))
            (let [batch (pending-txs repo {:limit 50})]
              (when (seq batch)
                (when-not (upload-stopped? repo)
                  (let [{:keys [tx-entries drop-tx-ids]} (prepare-upload-tx-entries conn batch)]
                    (when (seq drop-tx-ids)
                      (mark-pending-txs-false! repo drop-tx-ids))
                    (when (seq tx-entries)
                      (-> (p/let [aes-key (when (sync-crypt/graph-e2ee? repo)
                                            (sync-crypt/<ensure-graph-aes-key repo (:graph-id client)))
                                  _ (when (and (sync-crypt/graph-e2ee? repo) (nil? aes-key))
                                      (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))
                                  tx-entries* (p/all
                                               (mapv (fn [{:keys [tx-data] :as tx-entry}]
                                                       (p/let [tx-data* (offload-large-titles
                                                                         tx-data
                                                                         {:repo repo
                                                                          :graph-id (:graph-id client)
                                                                          :aes-key aes-key})
                                                               tx-data** (if aes-key
                                                                           (sync-crypt/<encrypt-tx-data aes-key tx-data*)
                                                                           tx-data*)]
                                                         (assoc tx-entry :tx-data tx-data**)))
                                                     tx-entries))
                                  payload (mapv (fn [{:keys [tx-id tx-data outliner-op]}]
                                                  (cond-> {:tx (sqlite-util/write-transit-str tx-data)}
                                                    tx-id
                                                    (assoc :tx-id (str tx-id))
                                                    outliner-op
                                                    (assoc :outliner-op outliner-op)))
                                                tx-entries*)
                                  tx-ids (mapv :tx-id tx-entries)]
                            (reset! (:inflight client) tx-ids)
                            (send! ws {:type "tx/batch"
                                       :t-before local-tx
                                       :txs payload}))
                          (p/catch (fn [error]
                                     (js/console.error error)))))))))))))))

(defn enqueue-flush-pending!
  [repo client]
  (if-let [send-queue (:send-queue client)]
    (swap! send-queue
           (fn [prev]
             (-> (or prev (p/resolved nil))
                 (p/catch (fn [_] nil))
                 (p/then (fn [_]
                           (flush-pending! repo client)))
                 (p/catch (fn [error]
                            (log/error :db-sync/flush-pending-queue-failed
                                       {:repo repo
                                        :error error}))))))
    (flush-pending! repo client)))

(defn- reverse-history-action!
  [conn local-tx]
  (if-let [tx-data (seq (:reversed-tx local-tx))]
    (ldb/transact! conn
                   (normalize-tx-data-for-rebase tx-data)
                   {:outliner-op (:outliner-op local-tx)
                    :reverse? true})
    (invalid-rebase-op! :reverse-history-action
                        {:reason :missing-reversed-tx-data
                         :tx-id (:tx-id local-tx)
                         :outliner-op (:outliner-op local-tx)})))

(defn- replace-uuid-str-with-eid
  [db v]
  (if (and (string? v) (common-util/uuid-string? v))
    (if-let [entity (d/entity db [:block/uuid (uuid v)])]
      (:db/id entity)
      v)
    v))

(defn- resolve-temp-id
  [db datom-v]
  (if (and (= (count datom-v) 5)
           (= (first datom-v) :db/add))
    (let [[op e a v t] datom-v
          e' (replace-uuid-str-with-eid db e)
          v' (replace-uuid-str-with-eid db v)]
      [op e' a v' t])
    datom-v))

(defn- transact-remote-txs!
  [conn remote-txs]
  (loop [remaining remote-txs
         index 0
         results []]
    (let [db @conn]
      (if-let [remote-tx (first remaining)]
        (let [tx-data (some->> (:tx-data remote-tx)
                               (map (partial resolve-temp-id db))
                               (tx-sanitize/sanitize-tx db)
                               seq)
              report (ldb/transact! conn tx-data {:transact-remote? true
                                                  :t (:t remote-tx)})
              results' (cond-> results
                         tx-data
                         (conj {:tx-data tx-data
                                :report report}))]
          (recur (next remaining) (inc index) results'))
        results))))

(defn reverse-local-txs!
  [conn local-txs]
  (doall
   (->> local-txs
        reverse
        (map-indexed
         (fn [index local-tx]
           (try
             (reverse-history-action! conn local-tx)
             (catch :default e
               (log/error ::reverse-local-tx-error
                          {:index index
                           :local-tx local-tx
                           :local-txs local-txs})
               (throw e)))))
        (keep identity)
        vec)))

(defn- invalid-rebase-op!
  [op data]
  (throw (ex-info "invalid rebase op" (assoc data :op op))))

(defn- history-action-error-reason
  [error]
  (if (= "invalid rebase op" (ex-message error))
    :invalid-history-action-ops
    :error))

(defn- replay-entity-id-value
  [db v]
  (cond
    (number? v)
    v

    (uuid? v)
    (some-> (d/entity db [:block/uuid v]) :db/id)

    (or (vector? v) (qualified-keyword? v))
    (some-> (d/entity db v) :db/id)

    :else
    v))

(defn- replay-entity-id-coll
  [db ids]
  (mapv #(or (replay-entity-id-value db %) %) ids))

(defn- rebase-find-existing-left-sibling
  [current-db target]
  (loop [sibling (ldb/get-left-sibling target)]
    (if (nil? sibling)
      nil
      (if-let [current-sibling (and sibling (d/entity current-db [:block/uuid (:block/uuid sibling)]))]
        current-sibling
        (recur (ldb/get-left-sibling sibling))))))

(defn- rebase-target-ref
  [target-id]
  (cond
    (and (vector? target-id)
         (= :block/uuid (first target-id))
         (uuid? (second target-id)))
    target-id

    (uuid? target-id)
    [:block/uuid target-id]

    (and (map? target-id) (uuid? (:block/uuid target-id)))
    [:block/uuid (:block/uuid target-id)]

    :else
    target-id))

(defn- rebase-resolve-target-and-sibling
  [current-db rebase-db-before target-id sibling?]
  (let [target-ref (rebase-target-ref target-id)
        target (d/entity current-db target-ref)
        target-before (when rebase-db-before
                        (d/entity rebase-db-before target-ref))
        parent-before (when rebase-db-before
                        (:block/parent (d/entity rebase-db-before target-ref)))]
    (cond
      target
      [target sibling?]

      (and target-before parent-before sibling?)
      (if-let [left-sibling (rebase-find-existing-left-sibling current-db target-before)]
        [left-sibling true]
        (when-let [parent (d/entity current-db [:block/uuid (:block/uuid parent-before)])]
          [parent false]))

      :else
      nil)))

(defn- template-parent-ref
  [parent]
  (cond
    (and (vector? parent) (= :block/uuid (first parent)))
    parent

    (uuid? parent)
    [:block/uuid parent]

    (and (map? parent) (uuid? (:block/uuid parent)))
    [:block/uuid (:block/uuid parent)]

    :else
    parent))

(defn- sanitize-template-block
  [current-db rebase-db-before block]
  (let [m (into {} block)
        block-id (:db/id m)
        block-uuid (or (:block/uuid m)
                       (when (number? block-id)
                         (or (some-> rebase-db-before (d/entity block-id) :block/uuid)
                             (some-> (d/entity current-db block-id) :block/uuid)))
                       (when (and (vector? block-id)
                                  (= :block/uuid (first block-id))
                                  (uuid? (second block-id)))
                         (second block-id)))]
    (cond-> (-> m
                (dissoc :db/id :block/order :block/page :block/tx-id)
                (update :block/parent template-parent-ref))
      (uuid? block-uuid)
      (assoc :block/uuid block-uuid))))

(defn- ^:large-vars/cleanup-todo replay-canonical-outliner-op!
  [conn [op args] rebase-db-before]
  (case op
    :save-block
    (let [[block opts] args
          db @conn
          block-uuid (:block/uuid block)
          block-ent (when block-uuid
                      (d/entity db [:block/uuid block-uuid]))
          block-base (dissoc block :db/id :block/order)
          block' (merge block-base
                        (op-construct/rewrite-block-title-with-retracted-refs db block-base))]
      (when (nil? block-ent)
        (invalid-rebase-op! op {:args args
                                :reason :missing-block}))
      (outliner-core/save-block! conn block' opts))

    :insert-blocks
    (let [[blocks target-id opts] args
          db @conn
          [target sibling?] (rebase-resolve-target-and-sibling db rebase-db-before target-id (:sibling? opts))]
      (when-not (and target (seq blocks))
        (invalid-rebase-op! op {:args args}))
      (outliner-core/insert-blocks! conn
                                    (mapv #(op-construct/rewrite-block-title-with-retracted-refs db %) blocks)
                                    target
                                    (assoc opts :sibling? sibling?)))

    :apply-template
    (let [[template-id target-id opts] args
          template-id' (replay-entity-id-value @conn template-id)
          target-id' (replay-entity-id-value @conn target-id)
          [target sibling?] (rebase-resolve-target-and-sibling @conn rebase-db-before target-id' (:sibling? opts))]
      (when-not (and template-id' (d/entity @conn template-id') target)
        (invalid-rebase-op! op {:args args
                                :reason :missing-template-or-target-block}))
      (let [template-uuid (:block/uuid (d/entity @conn template-id'))
            target-uuid (:block/uuid target)]
        (when-not (and (uuid? template-uuid) (uuid? target-uuid))
          (invalid-rebase-op! op {:args args
                                  :reason :missing-template-or-target-uuid}))
      (let [replace-empty-target? (:replace-empty-target? opts)
            template-blocks' (some->> (:template-blocks opts)
                                      (map-indexed
                                       (fn [idx block]
                                         (let [block' (sanitize-template-block @conn rebase-db-before block)
                                               block'' (if (and replace-empty-target?
                                                                (zero? idx)
                                                                (nil? (:block/uuid block')))
                                                         ;; Keep replace-empty-target replay consistent with
                                                         ;; initial apply-template payload where the first
                                                         ;; block uuid is the target uuid.
                                                         (assoc block' :block/uuid target-uuid)
                                                         block')]
                                           (when (:block/uuid block'')
                                             block''))))
                                      (remove nil?)
                                      seq
                                      vec)
            opts' (cond-> (-> opts
                              (assoc :sibling? sibling?)
                              (dissoc :template-blocks))
                    template-blocks'
                    (assoc :template-blocks template-blocks'))]
        (outliner-op/apply-ops!
         conn
         [[:apply-template [template-uuid
                            target-uuid
                            opts']]]
         {:gen-undo-ops? false}))))

    :move-blocks
    (let [[ids target-id opts] args
          ids' (replay-entity-id-coll @conn ids)
          target-id' (replay-entity-id-value @conn target-id)
          blocks (keep #(d/entity @conn %) ids')
          [target sibling?] (rebase-resolve-target-and-sibling @conn rebase-db-before target-id' (:sibling? opts))]
      (when (or (empty? blocks) (nil? target))
        (invalid-rebase-op! op {:args args}))
      (when (seq blocks)
        (outliner-core/move-blocks! conn blocks target (assoc opts :sibling? sibling?))))

    :move-blocks-up-down
    (let [[ids up?] args
          ids' (replay-entity-id-coll @conn ids)
          blocks (keep #(d/entity @conn %) ids')]
      (when (seq blocks)
        (outliner-core/move-blocks-up-down! conn blocks up?)))

    :indent-outdent-blocks
    (let [[ids indent? opts] args
          ids' (replay-entity-id-coll @conn ids)
          blocks (keep #(d/entity @conn %) ids')]
      (when (empty? blocks)
        (invalid-rebase-op! op {:args args}))
      (when (seq blocks)
        (outliner-core/indent-outdent-blocks! conn blocks indent? opts)))

    :delete-blocks
    (let [[ids opts] args
          ids' (replay-entity-id-coll @conn ids)
          blocks (keep #(d/entity @conn %) ids')]
      ;; Keep delete replay idempotent under concurrent edits where blocks may already
      ;; be gone, but still leave a debug breadcrumb for malformed/missing targets.
      (when (empty? blocks)
        (log/debug :db-sync/drop-delete-blocks-replay
                   {:args args}))
      (when (seq blocks)
        (outliner-core/delete-blocks! conn blocks opts)))

    :create-page
    (let [[title opts] args]
      (outliner-page/create! conn title opts))

    :delete-page
    (let [[page-uuid opts] args]
      (outliner-page/delete! conn page-uuid opts))

    :upsert-property
    (apply outliner-property/upsert-property! conn args)

    :restore-recycled
    (let [[root-id] args
          root-ref (cond
                     (and (vector? root-id)
                          (= :block/uuid (first root-id)))
                     root-id

                     (uuid? root-id)
                     [:block/uuid root-id]

                     :else
                     root-id)
          root (d/entity @conn root-ref)
          tx-data (when root
                    (seq (outliner-recycle/restore-tx-data @conn root)))]
      (when-not tx-data
        (invalid-rebase-op! op {:args args
                                :reason :invalid-restore-target}))
      (ldb/transact! conn tx-data
                     {:outliner-op :restore-recycled}))

    :recycle-delete-permanently
    (let [[root-id] args
          root-ref (cond
                     (and (vector? root-id)
                          (= :block/uuid (first root-id)))
                     root-id

                     (uuid? root-id)
                     [:block/uuid root-id]

                     :else
                     root-id)
          root (d/entity @conn root-ref)
          tx-data (when root
                    (seq (outliner-recycle/permanently-delete-tx-data @conn root)))]
      ;; Keep replay idempotent under concurrent edits where the recycled root may
      ;; already be permanently removed by a preceding remote tx.
      (when (seq tx-data)
        (ldb/transact! conn tx-data
                       {:outliner-op :recycle-delete-permanently})))

    (let [[tx-data tx-meta] args]
      (when-let [tx-data (seq tx-data)]
        (ldb/transact! conn tx-data tx-meta)))))

(declare handle-local-tx!)

(defn- rebase-local-op!
  [_repo conn local-tx rebase-db-before]
  (let [{:keys [forward-ops inverse-ops]} (rebase-history-ops local-tx)
        tx-meta {:outliner-op :rebase
                 :original-outliner-op (:outliner-op local-tx)
                 ;; Keep stable tx-id across rebases so one logical pending op
                 ;; doesn't fan out into duplicated pending rows.
                 :db-sync/tx-id (:tx-id local-tx)
                 :db-sync/forward-outliner-ops forward-ops
                 :db-sync/inverse-outliner-ops inverse-ops}
        forward-ops' (if (seq forward-ops)
                       forward-ops
                       (let [tx-data (-> (:tx local-tx) normalize-tx-data-for-rebase)]
                         [[:transact [tx-data nil]]]))]
    (try
      (let [rebase-tx-report
            (ldb/batch-transact-with-temp-conn!
             conn
             tx-meta
             (fn [conn]
               (doseq [op forward-ops']
                 (replay-canonical-outliner-op! conn op rebase-db-before))))
            status (if rebase-tx-report :rebased :no-op)]
        {:tx-id (:tx-id local-tx)
         :status status})
      (catch :default error
        (let [drop-log {:tx-id (:tx-id local-tx)
                        :outliner-op (:outliner-op local-tx)
                        :undo? (:undo? local-tx)
                        :redo? (:redo? local-tx)
                        :error error}]
          (log/warn :db-sync/drop-op-driven-pending-tx drop-log)
          {:tx-id (:tx-id local-tx)
           :status :failed})))))

(defn- rebase-local-txs!
  [repo conn local-txs rebase-db-before]
  (mapv (fn [local-tx]
          (rebase-local-op! repo conn local-tx rebase-db-before))
        local-txs))

(defn- fix-tx!
  [conn rebase-tx-report tx-meta]
  (sync-order/fix-duplicate-orders! conn
                                    (:tx-data rebase-tx-report)
                                    tx-meta))

(defn- apply-remote-tx-with-local-changes!
  [{:keys [repo conn local-txs remote-txs]}]
  (let [tx-meta {:rtc-tx? true
                 :with-local-changes? true}
        *rebase-tx-reports (atom [])
        *rebase-results (atom [])
        rebase-db-before @conn]
    (try
      (let [tx-report (ldb/batch-transact!
                       conn
                       tx-meta
                       (fn [conn]
                         (reverse-local-txs! conn local-txs)

                         (transact-remote-txs! conn remote-txs)

                         (reset! *rebase-results
                                 (rebase-local-txs! repo conn local-txs rebase-db-before)))

                       {:listen-db (fn [{:keys [tx-meta tx-data] :as tx-report}]
                                     (when (and (= :rebase (:outliner-op tx-meta)) (seq tx-data))
                                       (swap! *rebase-tx-reports conj tx-report)))})]
        (doseq [tx-report @*rebase-tx-reports]
          (handle-local-tx! repo tx-report))

        (fix-tx! conn tx-report {:outliner-op :fix}))

      ;; Mark only explicitly stale rebases as non-pending.
      ;; Do not infer stale via tx-id set-diff, which can hide still-valid
      ;; pending txs that should wait for server ack/reject.
      (let [stale-tx-ids (->> @*rebase-results
                              (filter (fn [{:keys [status]}]
                                        (contains? #{:failed :no-op} status)))
                              (keep :tx-id)
                              distinct
                              vec)]
        (mark-pending-txs-false! repo stale-tx-ids))

      (catch :default e
        (js/console.error e)
        (throw e))
      (finally
        (reset! *rebase-tx-reports nil)
        (reset! *rebase-results nil)
        (worker-undo-redo/clear-history! repo)))))

(defn- apply-remote-tx-without-local-changes!
  [{:keys [conn remote-txs]}]
  (ldb/batch-transact!
   conn
   {:rtc-tx? true
    :without-local-changes? true}
   (fn [conn]
     (transact-remote-txs! conn remote-txs))))

(defn apply-remote-txs!
  [repo client remote-txs]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (let [local-txs (pending-txs repo)
          has-local-changes? (boolean (seq local-txs))
          remote-tx-data* (mapcat :tx-data remote-txs)
          temp-tx-meta {:rtc-tx? true
                        :gen-undo-ops? false}
          apply-context {:repo repo
                         :conn conn
                         :local-txs local-txs
                         :remote-txs remote-txs
                         :temp-tx-meta temp-tx-meta}]
      (try
        (if has-local-changes?
          (apply-remote-tx-with-local-changes! apply-context)
          (apply-remote-tx-without-local-changes! apply-context))
        (catch :default error
          (log/error :db-sync/apply-remote-txs-failed
                     {:repo repo
                      :has-local-changes? has-local-changes?
                      :remote-tx-count (count remote-txs)
                      :local-tx-count (count local-txs)
                      :remote-txs remote-txs
                      :local-txs local-txs
                      :error error})
          (throw error)))

      (when-let [*inflight (:inflight client)]
        (reset! *inflight []))

      (-> (rehydrate-large-titles! repo {:tx-data remote-tx-data*
                                         :graph-id (:graph-id client)})
          (p/catch (fn [error]
                     (log/error :db-sync/large-title-rehydrate-failed
                                {:repo repo :error error})))))
    (fail-fast :db-sync/missing-db {:repo repo :op :apply-remote-txs})))

(defn apply-remote-tx!
  [repo client tx-data]
  (apply-remote-txs! repo client [{:tx-data tx-data}]))

(defn- enqueue-local-tx-aux
  [repo {:keys [tx-data db-after db-before] :as tx-report}]
  (let [normalized (normalize-tx-data db-after db-before tx-data)
        reversed-datoms (reverse-tx-data db-before db-after tx-data)]
    ;; (prn :debug :reversed-datoms reversed-datoms)
    ;; (prn :debug :enqueue-local-tx :tx-data)
    ;; (cljs.pprint/pprint tx-data)
    ;; (prn :debug :enqueue-local-tx :normalized)
    ;; (cljs.pprint/pprint normalized)

    (when (seq normalized)
      (persist-local-tx! repo tx-report normalized reversed-datoms)
      (when-let [client @worker-state/*db-sync-client]
        (when (= repo (:repo client))
          (enqueue-flush-pending! repo client))))))

(defn enqueue-local-tx!
  [repo {:keys [tx-meta tx-data] :as tx-report}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (when-not (or (:rtc-tx? tx-meta)
                  (and (:batch-tx? @conn) (not= :rebase (:outliner-op tx-meta)))
                  (:reverse? tx-meta))
      (when (seq tx-data)
        (enqueue-local-tx-aux repo tx-report)))))

(defn handle-local-tx!
  [repo {:keys [tx-data tx-meta db-after] :as tx-report}]
  (when (and (seq tx-data)
             (not (:rtc-tx? tx-meta))
             (not (:sync-download-graph? tx-meta))
             (:persist-op? tx-meta true))
    (enqueue-local-tx! repo tx-report)
    (when-let [client @worker-state/*db-sync-client]
      (when (and (= repo (:repo client))
                 (:kv/value (d/entity db-after :logseq.kv/graph-remote?)))
        (sync-assets/enqueue-asset-sync!
         repo client
         {:enqueue-asset-task-f enqueue-asset-task!
          :current-client-f current-client
          :broadcast-rtc-state!-f broadcast-rtc-state!
          :fail-fast-f fail-fast})))))
