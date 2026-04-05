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
   [logseq.db-sync.order :as sync-order]
   [logseq.db.common.normalize :as db-normalize]
   [logseq.db.frontend.property.type :as db-property-type]
   [logseq.db.sqlite.util :as sqlite-util]
   [logseq.outliner.core :as outliner-core]
   [logseq.outliner.op :as outliner-op]
   [logseq.outliner.op.construct :as op-construct]
   [logseq.outliner.page :as outliner-page]
   [logseq.outliner.property :as outliner-property]
   [logseq.outliner.recycle :as outliner-recycle]
   [promesa.core :as p]))

(defonce *repo->latest-remote-tx (atom {}))
(defonce *repo->latest-remote-checksum (atom {}))
(defonce *upload-temp-opfs-pool (atom nil))

(defn fail-fast [tag data]
  (log/error tag data)
  (throw (ex-info (name tag) data)))

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

(defn reverse-tx-data [_db-before db-after tx-data]
  (->> tx-data
       reverse
       (keep (fn [[e a v t added]]
               (when (and (some? a) (some? v) (some? t) (boolean? added))
                 [(if added :db/retract :db/add) e a v t])))
       (db-normalize/replace-attr-retract-with-retract-entity-v2 db-after)))

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

(defn- upload-large-title! [repo graph-id title aes-key]
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

(def ^:private canonical-transact-op op-construct/canonical-transact-op)

(defn- contains-transact-op?
  [ops]
  (op-construct/contains-transact-op? ops))

(defn- explicit-transact-forward-op?
  [tx-meta]
  (let [explicit-forward-ops (or (some-> (:db-sync/forward-outliner-ops tx-meta)
                                         seq
                                         vec)
                                 (some-> (:outliner-ops tx-meta)
                                         seq
                                         vec))]
    (and (seq explicit-forward-ops)
         (contains-transact-op? explicit-forward-ops))))

(defn- derive-history-outliner-ops
  [db-before db-after tx-data tx-meta]
  ;; Rebased txs can carry explicit forward ops like [[:transact nil]].
  ;; Keep them as raw-tx placeholders instead of forcing semantic canonicalization.
  (if (explicit-transact-forward-op? tx-meta)
    {:forward-outliner-ops canonical-transact-op
     :inverse-outliner-ops nil}
    (op-construct/derive-history-outliner-ops db-before db-after tx-data tx-meta)))

(defn- inferred-outliner-ops?
  [tx-meta]
  (and (nil? (:outliner-ops tx-meta))
       (not (:undo? tx-meta))
       (not (:redo? tx-meta))
       (not= :batch-import-edn (:outliner-op tx-meta))))

(declare apply-history-action!)
(defn- persist-local-tx! [repo {:keys [db-before db-after tx-data tx-meta] :as tx-report} normalized-tx-data reversed-datoms]
  (when-let [conn (client-ops-conn repo)]
    (let [tx-id (or (:db-sync/tx-id tx-meta) (random-uuid))
          existing-ent (d/entity @conn [:db-sync/tx-id tx-id])
          should-inc-pending? (not= true (:db-sync/pending? existing-ent))
          now (.now js/Date)
          {:keys [forward-outliner-ops inverse-outliner-ops]}
          (derive-history-outliner-ops db-before db-after tx-data tx-meta)
          inferred-outliner-ops?' (inferred-outliner-ops? tx-meta)]
      ;; (prn :debug :forward-outliner-ops)
      ;; (cljs.pprint/pprint forward-outliner-ops)
      ;; (prn :debug :inverse-outliner-ops)
      ;; (cljs.pprint/pprint inverse-outliner-ops)
      (ldb/transact! conn [{:db-sync/tx-id tx-id
                            :db-sync/normalized-tx-data normalized-tx-data
                            :db-sync/reversed-tx-data reversed-datoms
                            :db-sync/pending? true
                            :db-sync/outliner-op (:outliner-op tx-meta)
                            :db-sync/undo-redo? (cond
                                                  (:undo? tx-meta)
                                                  :undo
                                                  (:redo? tx-meta)
                                                  :redo
                                                  :else
                                                  :none)
                            :db-sync/forward-outliner-ops forward-outliner-ops
                            :db-sync/inverse-outliner-ops inverse-outliner-ops
                            :db-sync/inferred-outliner-ops? inferred-outliner-ops?'
                            :db-sync/created-at now}])
      (worker-undo-redo/gen-undo-ops! repo tx-report tx-id
                                      {:apply-history-action! apply-history-action!})
      (when should-inc-pending?
        (client-op/adjust-pending-local-tx-count! repo 1)
        (when-let [client (current-client repo)]
          (broadcast-rtc-state! client)))
      tx-id)))

(defn pending-txs
  [repo & {:keys [limit]}]
  (when-let [conn (client-ops-conn repo)]
    (let [db @conn
          datoms (d/datoms db :avet :db-sync/created-at)
          take-limit (fn [c]
                       (if limit (take limit c) c))]
      (->> datoms
           (map (fn [datom]
                  (d/entity db (:e datom))))
           (filter (fn [e] (:db-sync/pending? e)))
           take-limit
           (keep (fn [ent]
                   (let [tx-id (:db-sync/tx-id ent)
                         tx' (:db-sync/normalized-tx-data ent)
                         reversed-tx' (:db-sync/reversed-tx-data ent)]
                     {:tx-id tx-id
                      :outliner-op (:db-sync/outliner-op ent)
                      :forward-outliner-ops (:db-sync/forward-outliner-ops ent)
                      :inverse-outliner-ops (:db-sync/inverse-outliner-ops ent)
                      :inferred-outliner-ops? (:db-sync/inferred-outliner-ops? ent)
                      :db-sync/undo-redo (:db-sync/undo-redo? ent)
                      :tx tx'
                      :reversed-tx reversed-tx'})))
           vec))))

(defn- pending-tx-by-id
  [repo tx-id]
  (when-let [conn (client-ops-conn repo)]
    (when-let [ent (d/entity @conn [:db-sync/tx-id tx-id])]
      {:tx-id (:db-sync/tx-id ent)
       :outliner-op (:db-sync/outliner-op ent)
       :forward-outliner-ops (:db-sync/forward-outliner-ops ent)
       :inverse-outliner-ops (:db-sync/inverse-outliner-ops ent)
       :db-sync/undo-redo (:db-sync/undo-redo? ent)
       :tx (:db-sync/normalized-tx-data ent)
       :reversed-tx (:db-sync/reversed-tx-data ent)})))

(defn remove-pending-txs!
  [repo tx-ids]
  (when (seq tx-ids)
    (when-let [conn (client-ops-conn repo)]
      (let [pending-to-remove (->> tx-ids
                                   (keep (fn [tx-id]
                                           (when (true? (:db-sync/pending? (d/entity @conn [:db-sync/tx-id tx-id])))
                                             tx-id)))
                                   count)]
        (ldb/transact! conn
                       (mapv (fn [tx-id]
                               [:db/add [:db-sync/tx-id tx-id] :db-sync/pending? false])
                             tx-ids))
        (when (pos? pending-to-remove)
          (client-op/adjust-pending-local-tx-count! repo (- pending-to-remove)))
        (when-let [client (current-client repo)]
          (broadcast-rtc-state! client))))))

(defn clear-pending-txs!
  [repo]
  (remove-pending-txs! repo (mapv :tx-id (pending-txs repo))))

(defn- usable-history-ops
  [ops]
  (let [ops' (some-> ops seq vec)]
    (when (and (seq ops')
               (not= canonical-transact-op ops'))
      ops')))

(defn- semantic-op-stream?
  [ops]
  (boolean (seq (usable-history-ops ops))))

(defn- history-action-ops
  [{:keys [forward-outliner-ops inverse-outliner-ops]} undo?]
  (if undo?
    (usable-history-ops inverse-outliner-ops)
    (usable-history-ops forward-outliner-ops)))

(declare precreate-missing-save-blocks! replay-canonical-outliner-op!)

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
  (let [debug-data {:tx-id tx-id
                    :undo? undo?
                    :tx-meta tx-meta}]
    (if-let [conn (worker-state/get-datascript-conn repo)]
      (if-let [action (or (pending-tx-by-id repo tx-id)
                          (inline-history-action tx-meta))]
        (let [semantic-forward? (semantic-op-stream? (:forward-outliner-ops action))
              ops (history-action-ops action undo?)
              history-tx-id (let [provided-history-tx-id (:db-sync/tx-id tx-meta)]
                              (if (and (uuid? provided-history-tx-id)
                                       (not= provided-history-tx-id tx-id))
                                provided-history-tx-id
                                (random-uuid)))
              tx-meta' (cond-> {:local-tx? true
                                :gen-undo-ops? false
                                :persist-op? true
                                :undo? undo?
                                :redo? (:redo? tx-meta)
                                :db-sync/tx-id history-tx-id
                                :db-sync/source-tx-id (or (:db-sync/source-tx-id tx-meta)
                                                          tx-id)}

                         (:outliner-op action)
                         (assoc :outliner-op (:outliner-op action))

                         (seq (if undo? (:inverse-outliner-ops action)
                                  (:forward-outliner-ops action)))
                         (assoc :db-sync/forward-outliner-ops
                                (vec (if undo? (:inverse-outliner-ops action)
                                         (:forward-outliner-ops action))))

                         (seq (if undo? (:forward-outliner-ops action)
                                  (:inverse-outliner-ops action)))
                         (assoc :db-sync/inverse-outliner-ops
                                (vec (if undo? (:forward-outliner-ops action)
                                         (:inverse-outliner-ops action)))))]
          ;; (prn :debug :outliner-ops)
          ;; (pprint/pprint (select-keys action [:tx-id :outliner-op :forward-outliner-ops :inverse-outliner-ops]))
          ;; (prn :debug :tx-meta)
          ;; (pprint/pprint tx-meta)
          (cond
            (and semantic-forward?
                 (not (seq ops)))
            (fail-fast :db-sync/missing-history-action-semantic-ops
                       {:repo repo
                        :tx-id tx-id
                        :undo? undo?
                        :forward-outliner-ops (:forward-outliner-ops action)
                        :inverse-outliner-ops (:inverse-outliner-ops action)})

            (and semantic-forward?
                 (contains-transact-op? (if undo? (:inverse-outliner-ops action)
                                            (:forward-outliner-ops action))))
            (fail-fast :db-sync/invalid-history-action-semantic-ops
                       {:reason :contains-transact-op
                        :repo repo
                        :tx-id tx-id
                        :undo? undo?
                        :ops (if undo? (:inverse-outliner-ops action)
                                 (:forward-outliner-ops action))})

            (seq ops)
            (try
              (ldb/batch-transact-with-temp-conn!
               conn
               tx-meta'
               (fn [row-conn]
                 (precreate-missing-save-blocks! row-conn ops)
                 (doseq [op ops]
                   (replay-canonical-outliner-op! row-conn op))))
              {:applied? true
               :source :semantic-ops
               :history-tx-id history-tx-id}
              (catch :default error
                (if semantic-forward?
                  (if undo?
                    {:applied? false
                     :reason :invalid-history-action-ops
                     :error error}
                    (throw (ex-info (name :db-sync/invalid-history-action-semantic-ops)
                                    {:reason :invalid-history-action-ops
                                     :repo repo
                                     :tx-id tx-id
                                     :undo? undo?
                                     :ops ops
                                     :error error
                                     :action action})))
                  {:applied? false
                   :reason :invalid-history-action-ops
                   :error error})))

            :else
            {:applied? false :reason :unsupported-history-action
             :debug-data (assoc debug-data :action action)}))
        {:applied? false :reason :missing-history-action
         :debug-data debug-data})
      (fail-fast :db-sync/missing-db {:repo repo :op :apply-history-action
                                      :debug-data debug-data}))))

(defn flush-pending!
  [repo client]
  (let [inflight @(:inflight client)
        local-tx (or (client-op/get-local-tx repo) 0)
        remote-tx (get @*repo->latest-remote-tx repo)
        conn (worker-state/get-datascript-conn repo)]
    (when (and conn (= local-tx remote-tx))        ; rebase
      (when (empty? inflight)
        (when-let [ws (:ws client)]
          (when (and (ws-open? ws) (worker-state/online?))
            (let [batch (pending-txs repo {:limit 50})]
              (when (seq batch)
                (let [tx-entries (->> batch
                                      (mapv (fn [{:keys [tx-id tx outliner-op]}]
                                              {:tx-id tx-id
                                               :outliner-op outliner-op
                                               :tx-data (vec tx)}))
                                      (filterv (comp seq :tx-data)))
                      tx-ids (mapv :tx-id batch)]
                  (if (empty? tx-entries)
                    (remove-pending-txs! repo tx-ids)
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
                                payload (mapv (fn [{:keys [tx-data outliner-op]}]
                                                (cond-> {:tx (sqlite-util/write-transit-str tx-data)}
                                                  outliner-op
                                                  (assoc :outliner-op outliner-op)))
                                              tx-entries*)]
                          (reset! (:inflight client) tx-ids)
                          (send! ws {:type "tx/batch"
                                     :t-before local-tx
                                     :txs payload}))
                        (p/catch (fn [error]
                                   (js/console.error error))))))))))))))

(defn- reverse-history-action!
  [conn local-tx]
  (if-let [tx-data (seq (:reversed-tx local-tx))]
    (ldb/transact! conn tx-data {:reverse? true})
    (invalid-rebase-op! :reverse-history-action
                        {:reason :missing-reversed-tx-data
                         :tx-id (:tx-id local-tx)
                         :outliner-op (:outliner-op local-tx)})))

(defn- transact-remote-txs!
  [conn remote-txs]
  (loop [remaining remote-txs
         index 0
         results []]
    (if-let [remote-tx (first remaining)]
      (let [tx-data (->> (:tx-data remote-tx)
                         seq)
            report (try
                     (ldb/transact! conn tx-data {:transact-remote? true})
                     (catch :default e
                       (js/console.error e)
                       (log/error ::transact-remote-txs! {:remote-tx remote-tx
                                                          :index (inc index)
                                                          :total (count remote-txs)})
                       (throw e)))
            results' (cond-> results
                       tx-data
                       (conj {:tx-data tx-data
                              :report report}))]
        (recur (next remaining) (inc index) results'))
      results)))

(defn reverse-local-txs!
  [conn local-txs]
  ;; (prn :debug :local-txs local-txs)
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

(defn- stable-entity-ref-like?
  [v]
  (or (qualified-keyword? v)
      (and (vector? v)
           (or (= :block/uuid (first v))
               (= :db/ident (first v))))))

(defn- replay-property-value
  [db property-id v]
  (let [property-type (some-> (d/entity db property-id) :logseq.property/type)]
    (if (contains? db-property-type/all-ref-property-types property-type)
      (cond
        (stable-entity-ref-like? v)
        (replay-entity-id-value db v)

        (set? v)
        (->> v
             (map #(if (stable-entity-ref-like? %)
                     (replay-entity-id-value db %)
                     %))
             set)

        (sequential? v)
        (mapv #(if (stable-entity-ref-like? %)
                 (replay-entity-id-value db %)
                 %)
              v)

        :else
        v)
      v)))

(defn- replay-entity-id-coll
  [db ids]
  (mapv #(or (replay-entity-id-value db %) %) ids))

(defn- precreate-missing-save-blocks!
  [conn ops]
  (doseq [[op args] ops
          :when (= :save-block op)]
    (let [[block _opts] args
          db @conn
          block-uuid (:block/uuid block)
          missing-block? (and block-uuid
                              (nil? (d/entity db [:block/uuid block-uuid])))
          has-structure? (or (:block/page block)
                             (:block/parent block))]
      (when (and missing-block? has-structure?)
        (let [target-ref (or (:block/parent block)
                             (:block/page block))
              target-block (d/entity db target-ref)]
          (when-not target-block
            (invalid-rebase-op! op {:args args
                                    :reason :missing-target-block}))
          (let [now (.now js/Date)
                create-block (-> block
                                 (dissoc :db/id)
                                 (assoc :block/created-at now)
                                 (assoc :block/updated-at now))]
            (when-not (or (:block/parent block)
                          (:block/page block))
              (throw (ex-info "block doesn't have both parent and page"
                              block)))
            (ldb/transact! conn
                           [create-block]
                           {:outliner-op :save-block
                            :persist-op? false})))))))

(defn- ^:large-vars/cleanup-todo replay-canonical-outliner-op!
  [conn [op args]]
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
      (if (some? block-ent)
        (outliner-core/save-block! conn
                                   block'
                                   (assoc (or opts {}) :persist-op? false))
        (if (and (:block/uuid block')
                 (or (:block/page block')
                     (:block/parent block')))
          (let [target-ref (or (:block/parent block')
                               (:block/page block'))
                target-block (d/entity db target-ref)]
            (when-not target-block
              (invalid-rebase-op! op {:args args
                                      :reason :missing-target-block}))
            (let [now (.now js/Date)
                  create-block (-> block'
                                   (assoc :block/created-at now)
                                   (assoc :block/updated-at now))]
              (ldb/transact! conn
                             [create-block]
                             {:outliner-op :save-block
                              :persist-op? false})))
          (invalid-rebase-op! op {:args args
                                  :reason :missing-block}))))

    :insert-blocks
    (let [[blocks target-id opts] args
          target-block (d/entity @conn target-id)
          db @conn]
      (when-not (and target-block (seq blocks))
        (invalid-rebase-op! op {:args args}))
      (outliner-core/insert-blocks! conn
                                    (mapv #(op-construct/rewrite-block-title-with-retracted-refs db %) blocks)
                                    target-block
                                    (assoc (or opts {}) :persist-op? false)))

    :apply-template
    (let [[template-id target-id opts] args
          template-id' (replay-entity-id-value @conn template-id)
          target-id' (replay-entity-id-value @conn target-id)]
      (when-not (and (int? template-id') (int? target-id'))
        (invalid-rebase-op! op {:args args
                                :reason :missing-template-or-target-block}))
      (outliner-op/apply-ops!
       conn
       [[:apply-template [template-id'
                          target-id'
                          (assoc (or opts {}) :persist-op? false)]]]
       {:persist-op? false
        :gen-undo-ops? false}))

    :move-blocks
    (let [[ids target-id opts] args
          ids' (replay-entity-id-coll @conn ids)
          target-id' (or (replay-entity-id-value @conn target-id) target-id)
          blocks (keep #(d/entity @conn %) ids')]
      (when (empty? blocks)
        (invalid-rebase-op! op {:args args}))
      (when (seq blocks)
        (let [opts' (or opts {})
              sibling? (:sibling? opts')
              fallback-target (:fallback-target opts')
              fallback-target' (or (replay-entity-id-value @conn fallback-target)
                                   fallback-target)
              target-block (d/entity @conn target-id')
              use-fallback? (and sibling?
                                 (nil? target-block)
                                 (some? fallback-target))
              target-block' (if use-fallback?
                              (d/entity @conn fallback-target')
                              target-block)
              move-opts (cond-> (-> opts'
                                    (dissoc :fallback-target)
                                    (assoc :persist-op? false))
                          use-fallback?
                          (assoc :sibling? false))]
          (when-not target-block'
            (invalid-rebase-op! op {:args args}))
          (outliner-core/move-blocks! conn blocks target-block' move-opts))))

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
        (outliner-core/delete-blocks! conn blocks (assoc (or opts {}) :persist-op? false))))

    :create-page
    (let [[title opts] args]
      (outliner-page/create! conn title (assoc (or opts {}) :persist-op? false)))

    :delete-page
    (let [[page-uuid opts] args]
      (outliner-page/delete! conn page-uuid (assoc (or opts {}) :persist-op? false)))

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
                     {:outliner-op :restore-recycled
                      :persist-op? false}))

    :set-block-property
    (let [[block-eid property-id v] args
          block-eid' (or (replay-entity-id-value @conn block-eid)
                         block-eid)
          block (d/entity @conn block-eid')
          property (d/entity @conn property-id)
          _ (when-not (and block property)
              (invalid-rebase-op! op {:args args
                                      :reason :missing-block-or-property}))
          v' (replay-property-value @conn property-id v)]
      (when (and (stable-entity-ref-like? v) (nil? v'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/set-block-property! conn block-eid' property-id v'))

    :remove-block-property
    (apply outliner-property/remove-block-property! conn args)

    :batch-set-property
    (let [[block-ids property-id v opts] args
          block-ids' (replay-entity-id-coll @conn block-ids)
          property (d/entity @conn property-id)
          _ (when-not (and property
                           (seq block-ids')
                           (every? #(some? (d/entity @conn %)) block-ids'))
              (invalid-rebase-op! op {:args args
                                      :reason :missing-block-or-property}))
          v' (replay-property-value @conn property-id v)]
      (when (and (stable-entity-ref-like? v) (nil? v'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/batch-set-property! conn block-ids' property-id v' opts))

    :batch-remove-property
    (let [[block-ids property-id] args
          block-ids' (replay-entity-id-coll @conn block-ids)]
      (outliner-property/batch-remove-property! conn block-ids' property-id))

    :delete-property-value
    (let [[block-eid property-id property-value] args
          block (d/entity @conn block-eid)
          property (d/entity @conn property-id)
          _ (when-not (and block property)
              (invalid-rebase-op! op {:args args
                                      :reason :missing-block-or-property}))
          property-value' (replay-property-value @conn property-id property-value)]
      (when (and (stable-entity-ref-like? property-value) (nil? property-value'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/delete-property-value! conn block-eid property-id property-value'))

    :batch-delete-property-value
    (let [[block-eids property-id property-value] args
          block-eids' (replay-entity-id-coll @conn block-eids)
          property (d/entity @conn property-id)
          _ (when-not (and property
                           (seq block-eids')
                           (every? #(some? (d/entity @conn %)) block-eids'))
              (invalid-rebase-op! op {:args args
                                      :reason :missing-block-or-property}))
          property-value' (replay-property-value @conn property-id property-value)]
      (when (and (stable-entity-ref-like? property-value) (nil? property-value'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/batch-delete-property-value! conn block-eids' property-id property-value'))

    :create-property-text-block
    (apply outliner-property/create-property-text-block! conn args)

    :upsert-property
    (apply outliner-property/upsert-property! conn args)

    :class-add-property
    (apply outliner-property/class-add-property! conn args)

    :class-remove-property
    (apply outliner-property/class-remove-property! conn args)

    :upsert-closed-value
    (apply outliner-property/upsert-closed-value! conn args)

    :add-existing-values-to-closed-values
    (apply outliner-property/add-existing-values-to-closed-values! conn args)

    :delete-closed-value
    (apply outliner-property/delete-closed-value! conn args)

    (let [tx-data (:tx args)]
      (log/warn ::default-case {:op op
                                :args args
                                :tx-data tx-data})
      (when-let [tx-data (seq tx-data)]
        (ldb/transact! conn tx-data {:outliner-op :transact})))))

(declare handle-local-tx!)

(defn- rebase-local-op!
  [_repo conn local-tx]
  (let [outliner-ops (:forward-outliner-ops local-tx)]
    (try
      (ldb/batch-transact-with-temp-conn!
       conn
       {:outliner-op :rebase}
       (fn [conn]
         (if (= [[:transact nil]] outliner-ops)
           (when-let [tx-data (seq (:tx local-tx))]
             (prn :debug :transact :tx-data tx-data)
             (ldb/transact! conn tx-data {:outliner-op :transact}))
           (do
             (precreate-missing-save-blocks! conn outliner-ops)
             (doseq [op outliner-ops]
               (replay-canonical-outliner-op! conn op))))))
      (catch :default error
        (let [drop-log {:tx-id (:tx-id local-tx)
                        :outliner-ops outliner-ops
                        :error error}]
          (log/warn :db-sync/drop-op-driven-pending-tx drop-log))
        nil))))

(defn- rebase-local-txs!
  [repo conn local-txs]
  (doseq [local-tx local-txs]
    (rebase-local-op! repo conn local-tx)))

(defn- fix-tx!
  [conn rebase-tx-report tx-meta]
  (sync-order/fix-duplicate-orders! conn
                                    (:tx-data rebase-tx-report)
                                    tx-meta))

(defn- apply-remote-tx-with-local-changes!
  [{:keys [repo conn local-txs remote-txs]}]
  (let [tx-meta {:rtc-tx? true
                 :with-local-changes? true}
        *rebase-tx-reports (atom [])]
    ;; (prn :debug :apply-remote-tx (first remote-txs))
    (try
      (let [tx-report (ldb/batch-transact!
                       conn
                       tx-meta
                       (fn [conn]
                         (reverse-local-txs! conn local-txs)

                         (transact-remote-txs! conn remote-txs)

                         (rebase-local-txs! repo conn local-txs))

                       {:listen-db (fn [{:keys [tx-meta tx-data] :as tx-report}]
                                     (when (and (= :rebase (:outliner-op tx-meta))
                                                (seq tx-data))
                                       (swap! *rebase-tx-reports conj tx-report)))})]
        (fix-tx! conn tx-report {:outliner-op :fix}))

      (doseq [tx-report @*rebase-tx-reports]
        (handle-local-tx! repo tx-report))

      (remove-pending-txs! repo (map :tx-id local-txs))

      (catch :default e
        (js/console.error e)
        (throw e))
      (finally
        (reset! *rebase-tx-reports nil)
        (worker-undo-redo/clear-history! repo)))))

(defn- apply-remote-tx-without-local-changes!
  [{:keys [conn remote-txs]}]
  (ldb/batch-transact-with-temp-conn!
   conn
   {:rtc-tx? true
    :without-local-changes? true}
   (fn [conn]
     (transact-remote-txs! conn remote-txs))))

(defn apply-remote-txs!
  [repo client remote-txs]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (let [local-txs (pending-txs repo)
          has-local-changes? (seq local-txs)
          remote-tx-data* (mapcat :tx-data remote-txs)
          temp-tx-meta {:rtc-tx? true
                        :gen-undo-ops? false
                        :persist-op? false}
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
                      :remote-txs (mapv (fn [{:keys [t outliner-op tx-data]}]
                                          {:t t
                                           :outliner-op outliner-op
                                           :tx-data-count (count tx-data)
                                           :tx-data tx-data})
                                        remote-txs)
                      :local-txs (mapv (fn [{:keys [tx-id outliner-op tx reversed-tx]}]
                                         {:tx-id tx-id
                                          :outliner-op outliner-op
                                          :tx-count (count tx)
                                          :tx-preview (take 12 tx)
                                          :reversed-count (count reversed-tx)
                                          :reversed-preview (take 12 reversed-tx)})
                                       local-txs)
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
    ;; (prn :debug :enqueue-local-tx :tx-data)
    ;; (cljs.pprint/pprint tx-data)
    ;; (prn :debug :enqueue-local-tx :normalized)
    ;; (cljs.pprint/pprint normalized)
    (when (seq normalized)
      (persist-local-tx! repo tx-report normalized reversed-datoms)
      (when-let [client @worker-state/*db-sync-client]
        (when (= repo (:repo client))
          (let [send-queue (:send-queue client)]
            (swap! send-queue
                   (fn [prev]
                     (p/then prev
                             (fn [_]
                               (when-let [current @worker-state/*db-sync-client]
                                 (when (= repo (:repo current))
                                   (when-let [ws (:ws current)]
                                     (when (ws-open? ws)
                                       (flush-pending! repo current)))))))))))))))


;; (defonce *persist-promise (atom nil))
(defn enqueue-local-tx!
  [repo {:keys [tx-meta tx-data] :as tx-report}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (when-not (or (:rtc-tx? tx-meta)
                  (and (:batch-tx? @conn) (not= (:outliner-op tx-meta) :rebase)))
      (when (seq tx-data)
        (enqueue-local-tx-aux repo tx-report)
        ;; (p/do!
        ;;  (when-let [p @*persist-promise]
        ;;    p)
        ;;  (enqueue-local-tx-aux repo tx-report))
        ))))

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
