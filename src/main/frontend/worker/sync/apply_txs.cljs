(ns frontend.worker.sync.apply-txs
  "Pending tx and remote tx application helpers for db sync."
  (:require [cljs.pprint :as pprint]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.assets :as sync-assets]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.const :as rtc-const]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.download :as sync-download]
            [frontend.worker.sync.large-title :as sync-large-title]
            [frontend.worker.sync.presence :as sync-presence]
            [frontend.worker.sync.transport :as sync-transport]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db-sync.order :as sync-order]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op.construct :as op-construct]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.property :as outliner-property]
            [promesa.core :as p]))

(defonce *repo->latest-remote-tx (atom {}))
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
    :get-unpushed-asset-ops-count client-op/get-unpushed-asset-ops-count
    :get-local-tx client-op/get-local-tx
    :get-graph-uuid client-op/get-graph-uuid
    :latest-remote-tx @*repo->latest-remote-tx}
   repo))

(defn- broadcast-rtc-state! [client]
  (when client
    (shared-service/broadcast-to-clients!
     :rtc-sync-state
     (sync-presence/rtc-state-payload sync-counts client))))

(def reverse-data-ignored-attrs
  #{:logseq.property.embedding/hnsw-label-updated-at
    :block/tx-id})

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
  (sync-download/request-asset-download!
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

(defn- rewrite-block-title-with-retracted-refs
  [db block]
  (op-construct/rewrite-block-title-with-retracted-refs db block))

(defn- derive-history-outliner-ops
  [db-before db-after tx-data tx-meta]
  (op-construct/derive-history-outliner-ops db-before db-after tx-data tx-meta))

(defn build-history-action-metadata
  [data]
  (op-construct/build-history-action-metadata data))

(defn- inferred-outliner-ops?
  [tx-meta]
  (and (nil? (:outliner-ops tx-meta))
       (not (:undo? tx-meta))
       (not (:redo? tx-meta))
       (not= :batch-import-edn (:outliner-op tx-meta))))

(defn- persist-local-tx! [repo db-before db-after tx-data normalized-tx-data reversed-datoms tx-meta]
  (when-let [conn (client-ops-conn repo)]
    (let [tx-id (or (:db-sync/tx-id tx-meta) (random-uuid))
          now (.now js/Date)
          {:keys [forward-outliner-ops inverse-outliner-ops]}
          (derive-history-outliner-ops db-before db-after tx-data tx-meta)
          outliner-ops forward-outliner-ops
          inferred-outliner-ops?' (inferred-outliner-ops? tx-meta)]
      (ldb/transact! conn [{:db-sync/tx-id tx-id
                            :db-sync/normalized-tx-data normalized-tx-data
                            :db-sync/reversed-tx-data reversed-datoms
                            :db-sync/pending? true
                            :db-sync/outliner-op (:outliner-op tx-meta)
                            :db-sync/outliner-ops outliner-ops
                            :db-sync/forward-outliner-ops outliner-ops
                            :db-sync/inverse-outliner-ops inverse-outliner-ops
                            :db-sync/inferred-outliner-ops? inferred-outliner-ops?'
                            :db-sync/created-at now}])
      (when-let [client (current-client repo)]
        (broadcast-rtc-state! client))
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
                      :outliner-ops (:db-sync/outliner-ops ent)
                      :forward-outliner-ops (:db-sync/forward-outliner-ops ent)
                      :inverse-outliner-ops (:db-sync/inverse-outliner-ops ent)
                      :inferred-outliner-ops? (:db-sync/inferred-outliner-ops? ent)
                      :tx tx'
                      :reversed-tx reversed-tx'})))
           vec))))

(defn- pending-tx-by-id
  [repo tx-id]
  (when-let [conn (client-ops-conn repo)]
    (when-let [ent (d/entity @conn [:db-sync/tx-id tx-id])]
      {:tx-id (:db-sync/tx-id ent)
       :outliner-op (:db-sync/outliner-op ent)
       :outliner-ops (:db-sync/outliner-ops ent)
       :forward-outliner-ops (:db-sync/forward-outliner-ops ent)
       :inverse-outliner-ops (:db-sync/inverse-outliner-ops ent)
       :tx (:db-sync/normalized-tx-data ent)
       :reversed-tx (:db-sync/reversed-tx-data ent)})))

(defn remove-pending-txs!
  [repo tx-ids]
  (when (seq tx-ids)
    (when-let [conn (client-ops-conn repo)]
      (ldb/transact! conn
                     (mapv (fn [tx-id]
                             [:db/add [:db-sync/tx-id tx-id] :db-sync/pending? false])
                           tx-ids))
      (when-let [client (current-client repo)]
        (broadcast-rtc-state! client)))))

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

(defn- history-action-tx-data
  [{:keys [tx reversed-tx]} undo?]
  (some-> (if undo? reversed-tx tx) seq vec))

(defn- apply-history-action-tx!
  [conn tx-data tx-meta]
  (try
    (let [tx-meta' (-> tx-meta
                       (assoc :outliner-op :transact)
                       (dissoc :outliner-ops
                               :real-outliner-op
                               :db-sync/forward-outliner-ops
                               :db-sync/inverse-outliner-ops))]
      (d/with @conn tx-data {:outliner-op :transact
                             :persist-op? false})
      (ldb/transact! conn tx-data tx-meta')
      {:applied? true :source :raw-tx})
    (catch :default error
      (log/debug :db-sync/drop-history-action-raw-tx
                 {:reason :invalid-history-action-tx
                  :tx-meta tx-meta
                  :error error})
      {:applied? false
       :reason :invalid-history-action-tx
       :error error})))

(defn apply-history-action!
  [repo tx-id undo? tx-meta]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (if-let [action (pending-tx-by-id repo tx-id)]
      (let [semantic-forward? (semantic-op-stream? (:forward-outliner-ops action))
            ops (history-action-ops action undo?)
            tx-data (history-action-tx-data action undo?)
            tx-meta' (cond-> (merge {:local-tx? true
                                     :gen-undo-ops? false
                                     :persist-op? true}
                                    (dissoc tx-meta :db-sync/tx-id))
                       (seq ops)
                       (assoc :outliner-ops (vec ops))

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
        ;; (pprint/pprint (select-keys action [:tx-id :outliner-op :forward-outliner-ops :inverse-outliner-ops]))
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
            (ldb/batch-transact!
             conn
             tx-meta'
             (fn [row-conn _*batch-tx-data]
               (doseq [op ops]
                 (replay-canonical-outliner-op! row-conn op))))
            {:applied? true :source :semantic-ops}
            (catch :default error
              (if semantic-forward?
                (fail-fast :db-sync/invalid-history-action-semantic-ops
                           {:reason :invalid-history-action-ops
                            :repo repo
                            :tx-id tx-id
                            :undo? undo?
                            :ops ops
                            :error error})
                (do
                  (log/debug :db-sync/drop-history-action-semantic-ops
                             {:reason :invalid-history-action-ops
                              :repo repo
                              :tx-id tx-id
                              :undo? undo?
                              :ops ops
                              :error error})
                  {:applied? false
                   :reason :invalid-history-action-ops
                   :error error}))))

          (and semantic-forward?
               (seq tx-data))
          (fail-fast :db-sync/semantic-history-action-no-raw-fallback
                     {:repo repo
                      :tx-id tx-id
                      :undo? undo?
                      :tx-data tx-data})

          (seq tx-data)
          (apply-history-action-tx! conn tx-data tx-meta')

          :else
          {:applied? false :reason :unsupported-history-action}))
      {:applied? false :reason :missing-history-action})
    (fail-fast :db-sync/missing-db {:repo repo :op :apply-history-action})))

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

(defn- combine-tx-reports
  [tx-reports]
  (let [tx-reports (vec (keep identity tx-reports))]
    (when (seq tx-reports)
      {:db-before (:db-before (first tx-reports))
       :db-after (:db-after (last tx-reports))
       :tx-data (mapcat :tx-data tx-reports)
       :tx-meta (:tx-meta (last tx-reports))})))

(defn- remote-tx-debug-meta
  [temp-tx-meta remote-txs index {:keys [t outliner-op]}]
  (cond-> (assoc temp-tx-meta
                 :op :transact-remote-tx-data
                 :skip-validate-db? true
                 :remote-tx-index (inc index)
                 :remote-tx-count (count remote-txs))
    (number? t) (assoc :remote-t t)
    outliner-op (assoc :outliner-op outliner-op)))

(defn- local-tx-debug-meta
  [temp-tx-meta local-txs index local-tx op]
  (cond-> (assoc temp-tx-meta
                 :op op
                 :local-tx-index (inc index)
                 :local-tx-count (count local-txs))
    (:tx-id local-tx) (assoc :local-tx-id (:tx-id local-tx))
    (:outliner-op local-tx) (assoc :outliner-op (:outliner-op local-tx))))

(defn- reverse-history-action!
  [conn local-txs index local-tx temp-tx-meta]
  (if-let [tx-data (seq (:reversed-tx local-tx))]
    (ldb/transact! conn
                   tx-data
                   (local-tx-debug-meta temp-tx-meta local-txs index local-tx :reverse))
    (invalid-rebase-op! :reverse-history-action
                        {:reason :missing-reversed-tx-data
                         :tx-id (:tx-id local-tx)
                         :outliner-op (:outliner-op local-tx)})))

(defn- transact-remote-txs!
  [conn remote-txs temp-tx-meta]
  (loop [remaining remote-txs
         index 0
         results []]
    (if-let [remote-tx (first remaining)]
      (let [tx-data (->> (:tx-data remote-tx)
                         seq)
            report (try
                     (ldb/transact! conn
                                    tx-data
                                    (remote-tx-debug-meta temp-tx-meta remote-txs index remote-tx))
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
  [conn local-txs temp-tx-meta]
  ;; (prn :debug :local-txs local-txs)
  (->> local-txs
       reverse
       (map-indexed
        (fn [index local-tx]
          (try
            (reverse-history-action! conn local-txs index local-tx temp-tx-meta)
            (catch :default e
              (js/console.error e)
              (log/error ::reverse-local-tx-error
                         {:index index
                          :local-tx local-tx})
              (throw e)))))
       (keep identity)
       vec))

(defn- invalid-rebase-op!
  [op data]
  (throw (ex-info "invalid rebase op" (assoc data :op op))))

(defn- replay-entity-id-value
  [db v]
  (cond
    (number? v)
    v

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

(defn- ^:large-vars/cleanup-todo replay-canonical-outliner-op!
  [conn [op args]]
  (case op
    :save-block
    (let [[block opts] args]
      (when-not block
        (invalid-rebase-op! op {:args args}))
      (outliner-core/save-block! conn
                                 (rewrite-block-title-with-retracted-refs @conn block)
                                 (assoc (or opts {}) :persist-op? false))
      true)

    :insert-blocks
    (let [[blocks target-id opts] args
          target-block (d/entity @conn target-id)
          db @conn]
      (when-not (and target-block (seq blocks))
        (invalid-rebase-op! op {:args args}))
      (outliner-core/insert-blocks! conn
                                    (mapv #(rewrite-block-title-with-retracted-refs db %) blocks)
                                    target-block
                                    (assoc (or opts {}) :persist-op? false))
      true)

    :move-blocks
    (let [[ids target-id opts] args
          blocks (keep #(d/entity @conn %) ids)]
      (when (seq blocks)
        (let [target-block (d/entity @conn target-id)]
          (when-not target-block
            (invalid-rebase-op! op {:args args}))
          (outliner-core/move-blocks! conn blocks target-block (assoc (or opts {}) :persist-op? false)))
        true))

    :move-blocks-up-down
    (let [[ids up?] args
          blocks (keep #(d/entity @conn %) ids)]
      (when (seq blocks)
        (outliner-core/move-blocks-up-down! conn blocks up?)))

    :indent-outdent-blocks
    (let [[ids indent? opts] args
          blocks (keep #(d/entity @conn %) ids)]
      (when (seq blocks)
        (outliner-core/indent-outdent-blocks! conn blocks indent? opts))
      true)

    :delete-blocks
    (let [[ids opts] args
          blocks (keep #(d/entity @conn %) ids)]
      (when-not (seq blocks)
        true)
      (when (seq blocks)
        (outliner-core/delete-blocks! conn blocks (assoc (or opts {}) :persist-op? false)))
      true)

    :create-page
    (do
      (let [[title opts] args]
        (outliner-page/create! conn title (assoc (or opts {}) :persist-op? false)))
      true)

    :delete-page
    (do
      (let [[page-uuid opts] args]
        (outliner-page/delete! conn page-uuid (assoc (or opts {}) :persist-op? false)))
      true)

    :set-block-property
    (let [[block-eid property-id v] args
          block (d/entity @conn block-eid)
          property (d/entity @conn property-id)
          _ (when-not (and block property)
              (invalid-rebase-op! op {:args args
                                      :reason :missing-block-or-property}))
          v' (replay-property-value @conn property-id v)]
      (when (and (stable-entity-ref-like? v) (nil? v'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/set-block-property! conn block-eid property-id v'))

    :remove-block-property
    (apply outliner-property/remove-block-property! conn args)

    :batch-set-property
    (let [[block-ids property-id v opts] args
          property (d/entity @conn property-id)
          _ (when-not (and property
                           (seq block-ids)
                           (every? #(some? (d/entity @conn %)) block-ids))
              (invalid-rebase-op! op {:args args
                                      :reason :missing-block-or-property}))
          v' (replay-property-value @conn property-id v)]
      (when (and (stable-entity-ref-like? v) (nil? v'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/batch-set-property! conn block-ids property-id v' opts))

    :batch-remove-property
    (apply outliner-property/batch-remove-property! conn args)

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
          property (d/entity @conn property-id)
          _ (when-not (and property
                           (seq block-eids)
                           (every? #(some? (d/entity @conn %)) block-eids))
              (invalid-rebase-op! op {:args args
                                      :reason :missing-block-or-property}))
          property-value' (replay-property-value @conn property-id property-value)]
      (when (and (stable-entity-ref-like? property-value) (nil? property-value'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/batch-delete-property-value! conn block-eids property-id property-value'))

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
        (ldb/transact! conn tx-data {:outliner-op :transact})
        true))))

(defn- rebase-op-driven-local-tx!
  [conn local-txs index local-tx temp-tx-meta]
  (let [outliner-ops (:outliner-ops local-tx)
        replay-meta (assoc (local-tx-debug-meta temp-tx-meta local-txs index local-tx :rebase)
                           :db-sync/tx-id (:tx-id local-tx)
                           :db-sync/forward-outliner-ops (:forward-outliner-ops local-tx)
                           :db-sync/inverse-outliner-ops (:inverse-outliner-ops local-tx)
                           :outliner-ops outliner-ops)]
    (try
      (ldb/batch-transact!
       conn
       replay-meta
       (fn [row-conn _*batch-tx-data]
         (if (= [[:transact nil]] outliner-ops)
           (when-let [tx-data (seq (:tx local-tx))]
             ;; Preflight first to avoid noisy transact stack traces for known stale refs.
             (try
               (d/with @row-conn tx-data {:outliner-op :transact
                                          :persist-op? false})
               (catch :default error
                 (invalid-rebase-op! :transact
                                     {:reason :invalid-transact
                                      :error-message (ex-message error)})))
             (ldb/transact! row-conn tx-data {:outliner-op :transact
                                              :persist-op? false}))
           (doseq [op outliner-ops]
             (replay-canonical-outliner-op! row-conn op)))))
      (catch :default error
        (let [drop-log {:tx-id (:tx-id local-tx)
                        :outliner-ops outliner-ops
                        :error error}
              expected-drop? (or (= "invalid rebase op" (ex-message error))
                                 (string/includes? (or (ex-message error) "")
                                                   "doesn't exist yet")
                                 (string/includes? (or (ex-message error) "")
                                                   "Nothing found for entity id"))]
          (if expected-drop?
            (log/debug :db-sync/drop-op-driven-pending-tx drop-log)
            (log/warn :db-sync/drop-op-driven-pending-tx drop-log)))
        nil))))

(defn- rebase-local-txs!
  [conn local-txs temp-tx-meta]
  (->> local-txs
       (map-indexed
        (fn [index local-tx]
          (rebase-op-driven-local-tx! conn local-txs index local-tx temp-tx-meta)))
       (keep identity)
       vec))

(defn- fix-tx!
  [conn remote-tx-report rebase-tx-report tx-meta]
  (sync-order/fix-duplicate-orders! conn
                                    (mapcat :tx-data [remote-tx-report
                                                      rebase-tx-report])
                                    tx-meta))

(defn- apply-remote-tx-with-local-changes!
  [{:keys [repo conn local-txs remote-txs]}]
  (let [batch-tx-meta {:rtc-tx? true
                       :with-local-changes? true}]
    (ldb/batch-transact!
     conn
     batch-tx-meta
     (fn [conn] (reverse-local-txs! conn local-txs {:rtc-tx? true})))

    (let [remote-tx-report (ldb/batch-transact!
                            conn
                            batch-tx-meta
                            (fn [conn]
                              (transact-remote-txs! conn remote-txs batch-tx-meta)))
          tx-meta {:local-tx? true
                   :gen-undo-ops? false
                   :persist-op? true}
          _ (remove-pending-txs! repo (map :tx-id local-txs))
          rebase-result (rebase-local-txs! conn local-txs tx-meta)
          rebase-tx-report (combine-tx-reports rebase-result)]
      (fix-tx! conn remote-tx-report rebase-tx-report {:outliner-op :rebase-fix}))))

(defn- apply-remote-tx-without-local-changes!
  [{:keys [conn remote-txs temp-tx-meta]}]
  (ldb/batch-transact!
   conn
   {:rtc-tx? true
    :without-local-changes? true}
   (fn [conn]
     (let [remote-results (transact-remote-txs! conn remote-txs temp-tx-meta)]
       (combine-tx-reports (map :report remote-results))))))

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
                                           :tx-data-preview (take 12 tx-data)})
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

(defn enqueue-local-tx!
  [repo {:keys [tx-meta tx-data db-after db-before]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (when-not (or (:rtc-tx? tx-meta)
                  (:batch-tx? @conn)
                  (:mark-embedding? tx-meta))
      (when (seq tx-data)
        (let [normalized (normalize-tx-data db-after db-before tx-data)
              reversed-datoms (reverse-tx-data db-before db-after tx-data)]
          (when (seq normalized)
            (persist-local-tx! repo db-before db-after tx-data normalized reversed-datoms tx-meta)
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
                                             (flush-pending! repo current))))))))))))))))))

(defn handle-local-tx!
  [repo {:keys [tx-data tx-meta db-after] :as tx-report}]
  (when (and (seq tx-data)
             (not (:rtc-tx? tx-meta))
             (not (:sync-download-graph? tx-meta))
             (:persist-op? tx-meta true)
             (:kv/value (d/entity db-after :logseq.kv/graph-remote?)))
    (enqueue-local-tx! repo tx-report)
    (when-let [client @worker-state/*db-sync-client]
      (when (= repo (:repo client))
        (sync-assets/enqueue-asset-sync!
         repo client
         {:enqueue-asset-task-f enqueue-asset-task!
          :current-client-f current-client
          :broadcast-rtc-state!-f broadcast-rtc-state!
          :fail-fast-f fail-fast})))))
