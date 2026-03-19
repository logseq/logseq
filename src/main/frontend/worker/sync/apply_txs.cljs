(ns frontend.worker.sync.apply-txs
  "Pending tx and remote tx application helpers for db sync."
  (:require [clojure.set :as set]
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
            [logseq.db-sync.cycle :as sync-cycle]
            [logseq.db-sync.order :as sync-order]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
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

(declare stable-entity-ref ref-attr?)

(defn reverse-tx-data [_db-before db-after tx-data]
  (->> tx-data
       (keep (fn [[e a v t added]]
               (when (and (some? a) (some? v) (some? t) (boolean? added))
                 [(if added :db/retract :db/add) e a v t])))
       (db-normalize/replace-attr-retract-with-retract-entity-v2 db-after)))

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

(def ^:private semantic-outliner-ops
  #{:save-block
    :insert-blocks
    :move-blocks
    :move-blocks-up-down
    :indent-outdent-blocks
    :delete-blocks
    :set-block-property
    :remove-block-property
    :batch-set-property
    :batch-remove-property
    :delete-property-value
    :batch-delete-property-value
    :create-property-text-block
    :upsert-closed-value
    :add-existing-values-to-closed-values
    :delete-closed-value})

(def ^:private transient-block-keys
  #{:db/id
    :block/tx-id
    :block/created-at
    :block/updated-at
    :block/meta
    :block/unordered
    :block/level
    :block.temp/ast-title
    :block.temp/ast-body
    :block.temp/load-status
    :block.temp/has-children?})

(def ^:private rebase-refs-key :db-sync.rebase/refs)

(defn- stable-entity-ref
  [db x]
  (cond
    (map? x) (let [eid (or (:db/id x)
                           (when-let [id (:block/uuid x)]
                             (:db/id (d/entity db [:block/uuid id]))))]
               (stable-entity-ref db eid))
    (and (integer? x) (not (neg? x)))
    (if-let [ent (d/entity db x)]
      (cond
        (:block/uuid ent) [:block/uuid (:block/uuid ent)]
        (:db/ident ent) (:db/ident ent)
        :else x)
      x)
    :else x))

(defn- sanitize-ref-value
  [db v]
  (cond
    (vector? v) (stable-entity-ref db v)
    (or (set? v) (sequential? v)) (set (map #(stable-entity-ref db %) v))
    :else (stable-entity-ref db v)))

(defn- sanitize-block-refs
  [refs]
  (->> refs
       (keep (fn [ref]
               (when (:block/uuid ref)
                 (select-keys ref [:block/uuid :block/title]))))
       vec))

(defn- ref-attr?
  [db a]
  (and (d/db? db)
       (keyword? a)
       (= :db.type/ref
          (:db/valueType (d/entity db a)))))

(defn- sanitize-block-payload
  [db block]
  (if (map? block)
    (let [refs (sanitize-block-refs (:block/refs block))
          m (reduce-kv
             (fn [m k v]
               (cond
                 (contains? transient-block-keys k) m
                 (= "block.temp" (namespace k)) m
                 (ref-attr? db k)
                 (assoc m k (sanitize-ref-value db v))
                 :else
                 (assoc m k v)))
             {}
             block)]
      (assoc m rebase-refs-key refs))
    block))

(defn- rewrite-block-title-with-retracted-refs
  [db block]
  (let [refs (get block rebase-refs-key)
        retracted-refs (remove (fn [ref] (d/entity db [:block/uuid (:block/uuid ref)])) refs)
        block' (if (seq retracted-refs)
                 (update block :block/title
                         (fn [title]
                           (db-content/content-id-ref->page title retracted-refs)))
                 block)]
    (dissoc block' rebase-refs-key)))

(defn- sanitize-insert-block-payload
  [db block]
  (let [block' (sanitize-block-payload db block)]
    (if (map? block')
      (dissoc block' :block/parent :block/page :block/order)
      block')))

(defn- stable-id-coll
  [db ids]
  (mapv #(stable-entity-ref db %) ids))

(defn- stable-property-value
  [db property-id v]
  (let [property-type (some-> (d/entity db property-id) :logseq.property/type)]
    (if (contains? db-property-type/all-ref-property-types property-type)
      (sanitize-ref-value db v)
      v)))

(defn- created-block-uuids-from-tx-data
  [tx-data]
  (->> tx-data
       (keep (fn [item]
               (cond
                 (and (map? item) (:block/uuid item))
                 (:block/uuid item)

                 (and (some? (:a item))
                      (= :block/uuid (:a item))
                      (true? (:added item)))
                 (:v item)

                 (and (vector? item)
                      (= :db/add (first item))
                      (>= (count item) 4)
                      (= :block/uuid (nth item 2)))
                 (nth item 3)

                 :else
                 nil)))
       distinct
       vec))

(defn- canonicalize-semantic-outliner-op
  [db tx-data [op args]]
  (case op
    :save-block
    (let [[block opts] args]
      [:save-block [(sanitize-block-payload db block) opts]])

    :insert-blocks
    (let [[blocks target-id opts] args
          created-uuids (created-block-uuids-from-tx-data tx-data)
          blocks' (mapv #(sanitize-insert-block-payload db %) blocks)
          blocks' (if (and (not (:keep-uuid? opts))
                           (= (count blocks') (count created-uuids)))
                    (mapv (fn [block uuid]
                            (assoc block :block/uuid uuid))
                          blocks'
                          created-uuids)
                    blocks')]
      [:insert-blocks [blocks'
                       (stable-entity-ref db target-id)
                       (assoc (dissoc (or opts {}) :outliner-op)
                              :keep-uuid? true)]])

    :move-blocks-up-down
    (let [[ids up?] args]
      [:move-blocks [(stable-id-coll db ids)
                     nil
                     {:source-op :move-blocks-up-down
                      :up? up?}]])

    :indent-outdent-blocks
    (let [[ids indent? opts] args]
      [:move-blocks [(stable-id-coll db ids)
                     nil
                     (assoc (dissoc (or opts {}) :outliner-op)
                            :source-op :indent-outdent-blocks
                            :indent? indent?)]])

    :move-blocks
    (let [[ids target-id opts] args]
      [:move-blocks [(stable-id-coll db ids)
                     (stable-entity-ref db target-id)
                     (dissoc (or opts {}) :outliner-op)]])

    :delete-blocks
    (let [[ids opts] args]
      [:delete-blocks [(stable-id-coll db ids) opts]])

    :set-block-property
    (let [[block-eid property-id v] args]
      [:set-block-property [(stable-entity-ref db block-eid)
                            property-id
                            (stable-property-value db property-id v)]])

    :remove-block-property
    (let [[block-eid property-id] args]
      [:remove-block-property [(stable-entity-ref db block-eid) property-id]])

    :batch-set-property
    (let [[block-ids property-id v opts] args]
      [:batch-set-property [(stable-id-coll db block-ids)
                            property-id
                            (stable-property-value db property-id v)
                            opts]])

    :batch-remove-property
    (let [[block-ids property-id] args]
      [:batch-remove-property [(stable-id-coll db block-ids) property-id]])

    :delete-property-value
    (let [[block-eid property-id property-value] args]
      [:delete-property-value [(stable-entity-ref db block-eid)
                               property-id
                               (stable-property-value db property-id property-value)]])

    :batch-delete-property-value
    (let [[block-eids property-id property-value] args]
      [:batch-delete-property-value [(stable-id-coll db block-eids)
                                     property-id
                                     (stable-property-value db property-id property-value)]])

    :create-property-text-block
    (let [[block-id property-id value opts] args]
      [:create-property-text-block [(stable-entity-ref db block-id) (stable-entity-ref db property-id) value opts]])

    :upsert-closed-value
    (let [[property-id opts] args]
      [:upsert-closed-value [property-id opts]])

    :add-existing-values-to-closed-values
    (let [[property-id values] args]
      [:add-existing-values-to-closed-values [property-id values]])

    :delete-closed-value
    (let [[property-id value-block-id] args]
      [:delete-closed-value [property-id (stable-entity-ref db value-block-id)]])

    [op args]))

(defn- canonicalize-outliner-ops
  [db tx-meta tx-data]
  (let [outliner-ops (:outliner-ops tx-meta)]
    (cond
      (or (:undo? tx-meta)
          (:redo? tx-meta)
          (= :batch-import-edn (:outliner-op tx-meta)))
      [[:transact nil]]

      (seq outliner-ops)
      (if (every? (fn [[op]]
                    (contains? semantic-outliner-ops op))
                  outliner-ops)
        (mapv #(canonicalize-semantic-outliner-op db tx-data %) outliner-ops)
        [[:transact nil]])

      (= :transact (:outliner-op tx-meta))
      [[:transact nil]]

      ;; Fallback for local txs that bypassed apply-outliner-ops and therefore
      ;; never attached semantic op data.
      :else
      [[:transact nil]])))

(defn- inferred-outliner-ops?
  [tx-meta]
  (and (nil? (:outliner-ops tx-meta))
       (not (:undo? tx-meta))
       (not (:redo? tx-meta))
       (not= :batch-import-edn (:outliner-op tx-meta))))

(defn- persist-local-tx! [repo tx-data normalized-tx-data reversed-datoms tx-meta]
  (when-let [conn (client-ops-conn repo)]
    (let [tx-id (random-uuid)
          now (.now js/Date)
          graph-db (some-> (worker-state/get-datascript-conn repo) deref)
          outliner-ops (canonicalize-outliner-ops graph-db tx-meta tx-data)
          inferred-outliner-ops?' (inferred-outliner-ops? tx-meta)]
      (ldb/transact! conn [{:db-sync/tx-id tx-id
                            :db-sync/normalized-tx-data normalized-tx-data
                            :db-sync/reversed-tx-data reversed-datoms
                            :db-sync/outliner-op (:outliner-op tx-meta)
                            :db-sync/outliner-ops outliner-ops
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
          datoms' (if limit (take limit datoms) datoms)]
      (->> datoms'
           (map (fn [datom]
                  (d/entity db (:e datom))))
           (keep (fn [ent]
                   (let [tx-id (:db-sync/tx-id ent)]
                     {:tx-id tx-id
                      :outliner-op (:db-sync/outliner-op ent)
                      :outliner-ops (:db-sync/outliner-ops ent)
                      :inferred-outliner-ops? (:db-sync/inferred-outliner-ops? ent)
                      :tx (:db-sync/normalized-tx-data ent)
                      :reversed-tx (:db-sync/reversed-tx-data ent)})))
           vec))))

(defn remove-pending-txs!
  [repo tx-ids]
  (when (seq tx-ids)
    (when-let [conn (client-ops-conn repo)]
      (ldb/transact! conn
                     (mapv (fn [tx-id]
                             [:db/retractEntity [:db-sync/tx-id tx-id]])
                           tx-ids))
      (when-let [client (current-client repo)]
        (broadcast-rtc-state! client)))))

(defn clear-pending-txs!
  [repo]
  (remove-pending-txs! repo (mapv :tx-id (pending-txs repo))))

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
          (when-let [tx-data (->> (:reversed-tx local-tx)
                                  seq)]
            (try
              (let [result (ldb/transact! conn
                                          tx-data
                                          (local-tx-debug-meta temp-tx-meta
                                                               local-txs
                                                               index
                                                               local-tx
                                                               :reverse))]
                result)
              (catch :default e
                (js/console.error e)
                (log/error ::reverse-local-tx-error
                           {:index index
                            :local-tx local-tx})
                (throw e))))))
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

(defn- replay-canonical-outliner-op!
  [conn [op args]]
  (case op
    :save-block
    (let [[block opts] args]
      (when-not block
        (invalid-rebase-op! op {:args args}))
      (outliner-core/save-block! conn (rewrite-block-title-with-retracted-refs @conn block) (or opts {}))
      true)

    :insert-blocks
    (let [[blocks target-id opts] args
          target-block (d/entity @conn target-id)
          db @conn]
      (when-not (and target-block (seq blocks))
        (invalid-rebase-op! op {:args args}))
      (outliner-core/insert-blocks! conn (mapv #(rewrite-block-title-with-retracted-refs db %) blocks) target-block opts)
      true)

    :move-blocks
    (let [[ids target-id opts] args
          source-op (:source-op opts)
          blocks (keep #(d/entity @conn %) ids)]
      (when-not (seq blocks)
        (invalid-rebase-op! op {:args args}))
      (case source-op
        :move-blocks-up-down
        (do
          (outliner-core/move-blocks-up-down! conn blocks (:up? opts))
          true)

        :indent-outdent-blocks
        (do
          (outliner-core/indent-outdent-blocks! conn blocks (:indent? opts) (dissoc opts :source-op :indent?))
          true)

        (let [target-block (d/entity @conn target-id)]
          (when-not target-block
            (invalid-rebase-op! op {:args args}))
          (outliner-core/move-blocks! conn blocks target-block (or opts {}))
          true)))

    :delete-blocks
    (let [[ids opts] args
          blocks (keep #(d/entity @conn %) ids)]
      (when-not (seq blocks)
        (invalid-rebase-op! op {:args args}))
      (outliner-core/delete-blocks! conn blocks (or opts {}))
      true)

    :set-block-property
    (let [[block-eid property-id v] args
          v' (replay-property-value @conn property-id v)]
      (when (and (stable-entity-ref-like? v) (nil? v'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/set-block-property! conn block-eid property-id v'))

    :remove-block-property
    (apply outliner-property/remove-block-property! conn args)

    :batch-set-property
    (let [[block-ids property-id v opts] args
          v' (replay-property-value @conn property-id v)]
      (when (and (stable-entity-ref-like? v) (nil? v'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/batch-set-property! conn block-ids property-id v' opts))

    :batch-remove-property
    (apply outliner-property/batch-remove-property! conn args)

    :delete-property-value
    (let [[block-eid property-id property-value] args
          property-value' (replay-property-value @conn property-id property-value)]
      (when (and (stable-entity-ref-like? property-value) (nil? property-value'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/delete-property-value! conn block-eid property-id property-value'))

    :batch-delete-property-value
    (let [[block-eids property-id property-value] args
          property-value' (replay-property-value @conn property-id property-value)]
      (when (and (stable-entity-ref-like? property-value) (nil? property-value'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/batch-delete-property-value! conn block-eids property-id property-value'))

    :create-property-text-block
    (apply outliner-property/create-property-text-block! conn args)

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
                           :outliner-ops outliner-ops)]
    (try
      (ldb/batch-transact!
       conn
       replay-meta
       (fn [row-conn _*batch-tx-data]
         (if (= [[:transact nil]] outliner-ops)
           (when-let [tx-data (seq (:tx local-tx))]
             (ldb/transact! row-conn tx-data {:outliner-op :transact}))
           (doseq [op outliner-ops]
             (replay-canonical-outliner-op! row-conn op)))))
      true
      (catch :default error
        (log/warn :db-sync/drop-op-driven-pending-tx
                  {:tx-id (:tx-id local-tx)
                   :outliner-ops outliner-ops
                   :error error})
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
  (let [cycle-tx-report (sync-cycle/fix-cycle! conn remote-tx-report rebase-tx-report
                                               {:tx-meta tx-meta})]
    (sync-order/fix-duplicate-orders! conn
                                      (mapcat :tx-data [remote-tx-report
                                                        rebase-tx-report
                                                        cycle-tx-report])
                                      tx-meta)))

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
          rebase-result (rebase-local-txs! conn local-txs tx-meta)
          rebase-tx-report (combine-tx-reports (map :report rebase-result))]
      (fix-tx! conn remote-tx-report rebase-tx-report {:outliner-op :rebase-fix})
      (remove-pending-txs! repo (map :tx-id local-txs)))))

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
          apply-context {:conn conn
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
  (when-not (or (:rtc-tx? tx-meta)
                (:mark-embedding? tx-meta))
    (let [conn (worker-state/get-datascript-conn repo)
          db (some-> conn deref)]
      (when (and db (seq tx-data))
        (let [normalized (normalize-tx-data db-after db-before tx-data)
              reversed-datoms (reverse-tx-data db-before db-after tx-data)]
          (when (seq normalized)
            (persist-local-tx! repo tx-data normalized reversed-datoms tx-meta)
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
