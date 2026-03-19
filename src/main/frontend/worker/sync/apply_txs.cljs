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
            [frontend.worker.sync.legacy-rebase :as legacy-rebase]
            [frontend.worker.sync.presence :as sync-presence]
            [frontend.worker.sync.transport :as sync-transport]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.db-sync.cycle :as sync-cycle]
            [logseq.db-sync.order :as sync-order]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.property :as outliner-property]
            [logseq.undo-redo-validate :as undo-validate]
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

(def rtc-ignored-attrs
  (set/union
   #{:logseq.property.embedding/hnsw-label-updated-at
     :block/tx-id}
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

(defn reverse-tx-data [tx-data]
  (->> tx-data
       (keep (fn [[e a v t added]]
               (when (and (some? a) (some? v) (some? t) (boolean? added))
                 [(if added :db/retract :db/add) e a v t])))))

(defn reverse-normalized-tx-data [tx-data]
  (->> tx-data
       (keep (fn [[op e a v t]]
               (when (and (some? a) (some? v) (some? t))
                 [(if (= :db/add op) :db/retract :db/add) e a v t])))))

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
    :class-add-property
    :class-remove-property
    :upsert-closed-value
    :add-existing-values-to-closed-values
    :delete-closed-value
    :create-page
    :delete-page
    :rename-page
    :upsert-property})

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
    (map? x) (stable-entity-ref db (:db/id x))
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
  (and (keyword? a)
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
    :create-page
    (let [[title opts] args
          page-uuid (some-> (ldb/get-page db title) :block/uuid)]
      [:create-page [title
                     (cond-> (or opts {})
                       page-uuid
                       (assoc :uuid page-uuid))]])

    :rename-page
    (let [[page-uuid new-title] args]
      [:save-block [{:block/uuid page-uuid
                     :block/title new-title}
                    {:source-op :rename-page}]])

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
      [:create-property-text-block [(stable-entity-ref db block-id) property-id value opts]])

    :class-add-property
    (let [[class-id property-id] args]
      [:class-add-property [(stable-entity-ref db class-id) property-id]])

    :class-remove-property
    (let [[class-id property-id] args]
      [:class-remove-property [(stable-entity-ref db class-id) property-id]])

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
          graph-db (some-> (worker-state/get-datascript-conn repo) deref)
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
                      :tx (legacy-rebase/replace-string-block-tempids-with-lookups
                           graph-db
                           (:db-sync/normalized-tx-data ent))
                      :reversed-tx (legacy-rebase/replace-string-block-tempids-with-lookups
                                    graph-db
                                    (:db-sync/reversed-tx-data ent))})))
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
                                               :tx-data (->> tx
                                                             (db-normalize/remove-retract-entity-ref @conn)
                                                             (legacy-rebase/drop-missing-created-block-datoms @conn)
                                                             (legacy-rebase/sanitize-tx-data @conn)
                                                             distinct
                                                             vec)}))
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

(defn- tx-data-item->set-item
  [item]
  (if (and (vector? item) (= 5 (count item)))
    (vec (butlast item))
    item))

(defn- rewrite-recreated-lookup-refs
  [tx-data]
  (let [uuid->tempid (->> tx-data
                          (keep (fn [item]
                                  (when (and (vector? item)
                                             (= :db/add (first item))
                                             (>= (count item) 4)
                                             (= :block/uuid (nth item 2)))
                                    [(nth item 3) (second item)])))
                          (into {}))
        recreated-uuids (->> tx-data
                             (keep (fn [item]
                                     (when (and (vector? item)
                                                (= :db/retractEntity (first item))
                                                (vector? (second item))
                                                (= :block/uuid (first (second item))))
                                       (second (second item)))))
                             (filter #(contains? uuid->tempid %))
                             set)
        rewrite-lookup (fn [x]
                         (if (and (vector? x)
                                  (= :block/uuid (first x))
                                  (contains? recreated-uuids (second x)))
                           (get uuid->tempid (second x) x)
                           x))]
    (mapv (fn [item]
            (if (and (vector? item)
                     (>= (count item) 2)
                     (contains? #{:db/add :db/retract} (first item)))
              (let [entity' (rewrite-lookup (second item))
                    has-value? (>= (count item) 4)
                    attr (nth item 2 nil)
                    value' (if (and has-value?
                                    (contains? db-schema/ref-type-attributes attr))
                             (rewrite-lookup (nth item 3))
                             (when has-value? (nth item 3)))]
                (cond-> item
                  (not= (second item) entity')
                  (assoc 1 entity')
                  (and has-value? (not= (nth item 3) value'))
                  (assoc 3 value')))
              item))
          tx-data)))

(defn- transact-remote-txs!
  [temp-conn remote-txs temp-tx-meta]
  (loop [remaining remote-txs
         index 0
         results []]
    (if-let [remote-tx (first remaining)]
      (let [tx-data (->> (:tx-data remote-tx)
                         rewrite-recreated-lookup-refs
                         (legacy-rebase/sanitize-tx-data @temp-conn)
                         seq)
            results' (cond-> results
                       tx-data
                       (conj {:tx-data tx-data
                              :report (ldb/transact! temp-conn
                                                     tx-data
                                                     (remote-tx-debug-meta temp-tx-meta remote-txs index remote-tx))}))]
        (recur (next remaining) (inc index) results'))
      results)))

(defn- reverse-replace-retract-uuid-with-retract-entity
  [tx-data]
  (let [retract-block-ids (->> (keep (fn [[op e a _v _t]]
                                       (when (and (= op :db/retract)
                                                  (= :block/uuid a))
                                         e))
                                     tx-data)
                               set)
        tx-data' (if (seq retract-block-ids)
                   (remove (fn [[_op e _a v]]
                             (or (contains? retract-block-ids e)
                                 (contains? retract-block-ids v)))
                           tx-data)
                   tx-data)]
    (concat tx-data'
            (map (fn [id] [:db/retractEntity id]) retract-block-ids))))

(defn- tx-has-missing-lookup-entity?
  [db tx-data]
  (when (d/db? db)
    (some (fn [item]
            (when (vector? item)
              (let [entity (second item)]
                (and (vector? entity)
                     (= :block/uuid (first entity))
                     (nil? (d/entity db entity))))))
          tx-data)))

(defn- valid-reverse-tx?
  [temp-conn tx-data]
  (or (and (not (d/db? @temp-conn))
           (every? (fn [item]
                     (and (vector? item)
                          (= :db/retractEntity (first item))))
                   tx-data))
      (undo-validate/valid-undo-redo-tx? temp-conn tx-data)))

(defn reverse-local-txs!
  [temp-conn local-txs temp-tx-meta]
  (->> local-txs
       reverse
       (map-indexed
        (fn [index local-tx]
          (when-let [tx-data (->> (:reversed-tx local-tx)
                                  remove-ignored-attrs
                                  (legacy-rebase/replace-string-block-tempids-with-lookups @temp-conn)
                                  (reverse-replace-retract-uuid-with-retract-entity)
                                  seq)]
            (when (and (not (tx-has-missing-lookup-entity? @temp-conn tx-data))
                       (valid-reverse-tx? temp-conn tx-data))
              (ldb/transact! temp-conn
                             tx-data
                             (local-tx-debug-meta temp-tx-meta
                                                  local-txs
                                                  index
                                                  local-tx
                                                  :reverse))))))
       (keep identity)
       vec))

(defn- invalid-rebase-op!
  [op data]
  (throw (ex-info "invalid rebase op" (assoc data :op op))))

(defn- replay-canonical-outliner-op!
  [conn [op args]]
  (case op
    :transact
    (let [tx-data (:tx args)]
      (when-let [tx-data (seq tx-data)]
        (ldb/transact! conn tx-data {:outliner-op :transact})
        true))

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
    (apply outliner-property/set-block-property! conn args)

    :remove-block-property
    (apply outliner-property/remove-block-property! conn args)

    :batch-set-property
    (apply outliner-property/batch-set-property! conn args)

    :batch-remove-property
    (apply outliner-property/batch-remove-property! conn args)

    :delete-property-value
    (apply outliner-property/delete-property-value! conn args)

    :batch-delete-property-value
    (apply outliner-property/batch-delete-property-value! conn args)

    :create-property-text-block
    (apply outliner-property/create-property-text-block! conn args)

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

    :create-page
    (let [[title opts] args]
      (outliner-page/create! conn title (or opts {}))
      true)

    :delete-page
    (let [[page-uuid opts] args]
      (when-not (outliner-page/delete! conn page-uuid (or opts {}))
        (invalid-rebase-op! op {:args args}))
      true)

    :upsert-property
    (let [[property-id schema opts] args]
      (outliner-property/upsert-property! conn property-id schema (or opts {}))
      true)

    (invalid-rebase-op! op {:args args})))

(defn- rebase-op-driven-local-tx!
  [temp-conn local-txs index local-tx temp-tx-meta]
  (let [outliner-ops (:outliner-ops local-tx)
        replay-meta (assoc (local-tx-debug-meta temp-tx-meta local-txs index local-tx :rebase)
                           :outliner-ops outliner-ops)]
    (try
      (ldb/transact-with-temp-conn!
       temp-conn
       replay-meta
       (fn [row-conn _*batch-tx-data]
         (if (= [[:transact nil]] outliner-ops)
           (when-let [tx-data (seq (:tx local-tx))]
             (prn :debug :replay :transact tx-data)
             (ldb/transact! row-conn tx-data {:outliner-op :transact}))
           (doseq [op outliner-ops]
             (prn :debug :replay :op op)
             (replay-canonical-outliner-op! row-conn op)))))
      true
      (catch :default error
        (log/warn :db-sync/drop-op-driven-pending-tx
                  {:tx-id (:tx-id local-tx)
                   :outliner-ops outliner-ops
                   :error error})
        nil))))

(defn- rebase-local-txs!
  [temp-conn local-txs remote-db remote-updated-keys remote-tx-data-set temp-tx-meta retracted-properties]
  (let [retracted-property-idents (set (map :db/ident retracted-properties))]
    (->> local-txs
         (map-indexed
          (fn [index local-tx]
            (if (and (seq (:outliner-ops local-tx))
                     (not (:inferred-outliner-ops? local-tx)))
              (rebase-op-driven-local-tx! temp-conn local-txs index local-tx temp-tx-meta)
              (let [pending-tx-data (->> (:tx local-tx)
                                         (remove (fn [item]
                                                   (and (vector? item)
                                                        (contains? #{:db/add :db/retract} (first item))
                                                        (contains? retracted-property-idents (nth item 2 nil)))))
                                         (legacy-rebase/drop-remote-conflicted-local-tx remote-db remote-updated-keys))
                    rebased-tx-data (->> (legacy-rebase/sanitize-tx-data @temp-conn
                                                                         pending-tx-data)
                                         (remove remote-tx-data-set))]
                (when (seq rebased-tx-data)
                  (ldb/transact! temp-conn
                                 rebased-tx-data
                                 (local-tx-debug-meta temp-tx-meta
                                                      local-txs
                                                      index
                                                      local-tx
                                                      :rebase)))))))
         (keep identity)
         vec)))

(defn- build-remote-state
  [{:keys [temp-conn remote-txs tx-meta *remote-tx-report]}]
  (let [remote-results (transact-remote-txs! temp-conn remote-txs tx-meta)
        remote-tx-data (mapcat :tx-data remote-results)
        remote-tx-report (combine-tx-reports (map :report remote-results))
        _ (reset! *remote-tx-report remote-tx-report)
        retracted-properties (legacy-rebase/get-remote-deleted-properties remote-tx-report)
        remote-db @temp-conn]
    {:remote-db remote-db
     :remote-results remote-results
     :remote-tx-data remote-tx-data
     :remote-tx-data-set (set (map tx-data-item->set-item remote-tx-data))
     :remote-tx-report remote-tx-report
     :retracted-properties retracted-properties
     :remote-updated-keys (legacy-rebase/remote-updated-attr-keys remote-db remote-tx-data)}))

(defn- rebase-remote-state!
  [{:keys [temp-conn local-txs tx-meta remote-db remote-tx-data-set remote-updated-keys retracted-properties]}]
  (let [rebase-tx-reports (rebase-local-txs! temp-conn
                                             local-txs
                                             remote-db
                                             remote-updated-keys
                                             remote-tx-data-set
                                             tx-meta
                                             retracted-properties)]
    {:rebase-tx-report (combine-tx-reports rebase-tx-reports)
     :rebase-tx-reports rebase-tx-reports}))

(declare fix-tx!)

(defn- finalize-remote-state!
  [{:keys [temp-conn tx-meta remote-tx-report rebase-tx-report *temp-after-db]}]
  (reset! *temp-after-db @temp-conn)
  (fix-tx! temp-conn remote-tx-report rebase-tx-report (assoc tx-meta :op :fix)))

(defn- normalize-rebased-pending-tx
  [{:keys [db-before db-after tx-data remote-tx-data-set]}]
  (let [normalized (->> tx-data
                        (normalize-tx-data db-after db-before)
                        (legacy-rebase/replace-string-block-tempids-with-lookups db-before))
        normalized-tx-data (->> normalized
                                (db-normalize/replace-attr-retract-with-retract-entity-v2 db-after)
                                (remove remote-tx-data-set)
                                (legacy-rebase/sanitize-block-ref-datoms db-after))]
    {:normalized-tx-data normalized-tx-data
     :reversed-datoms (reverse-normalized-tx-data normalized-tx-data)}))

(defn- fix-tx!
  [temp-conn remote-tx-report rebase-tx-report tx-meta]
  (let [cycle-tx-report (sync-cycle/fix-cycle! temp-conn remote-tx-report rebase-tx-report
                                               {:tx-meta tx-meta})]
    (letfn [(page-consistency-candidate-eids [db tx-data]
              (let [root-eids (->> tx-data
                                   (keep (fn [[e a _v _tx added]]
                                           (when (and added
                                                      (contains? #{:block/parent :block/page} a)
                                                      (:block/uuid (d/entity db e)))
                                             e)))
                                   set)]
                (into root-eids
                      (mapcat #(ldb/get-block-full-children-ids db %))
                      root-eids)))
            (recycle-location-broken-blocks! [conn tx-data tx-meta]
              (let [db @conn
                    location-broken? (fn [block]
                                       (and block
                                            (not (ldb/page? block))
                                            (not (ldb/class? block))
                                            (not (ldb/property? block))
                                            (or (nil? (:block/parent block))
                                                (nil? (:block/page block)))))
                    top-level-broken-blocks
                    (fn [blocks]
                      (let [broken-ids (set (map :db/id blocks))
                            broken-parent? (fn [block]
                                             (loop [parent (:block/parent block)
                                                    seen #{}]
                                               (when (and parent
                                                          (:db/id parent)
                                                          (not (contains? seen (:db/id parent))))
                                                 (if (contains? broken-ids (:db/id parent))
                                                   true
                                                   (recur (:block/parent parent)
                                                          (conj seen (:db/id parent)))))))]
                        (remove broken-parent? blocks)))
                    recycle-blocks (->> (page-consistency-candidate-eids db tx-data)
                                        (keep #(d/entity db %))
                                        (filter location-broken?)
                                        distinct
                                        top-level-broken-blocks
                                        vec)]
                (when (seq recycle-blocks)
                  (ldb/transact! conn
                                 (vec (legacy-rebase/orphaned-blocks->recycle-tx-data db recycle-blocks))
                                 (merge tx-meta {:op :fix-missing-block-location})))))
            (fix-block-page-consistency! [conn tx-data tx-meta]
              (let [db @conn
                    expected-page-for-block
                    (fn expected-page-for-block [block]
                      (loop [current (:block/parent block)
                             seen #{}]
                        (when (and current
                                   (not (contains? seen (:db/id current))))
                          (if (ldb/page? current)
                            current
                            (recur (:block/parent current)
                                   (conj seen (:db/id current)))))))
                    fixes (->> (page-consistency-candidate-eids db tx-data)
                               (keep (fn [eid]
                                       (let [block (d/entity db eid)
                                             parent (:block/parent block)
                                             current-page (:block/page block)
                                             expected-page (when parent
                                                             (expected-page-for-block block))]
                                         (when (and block
                                                    (not (ldb/page? block))
                                                    expected-page
                                                    (not= (:db/id current-page)
                                                          (:db/id expected-page)))
                                           [:db/add eid :block/page (:db/id expected-page)]))))
                               distinct
                               vec)]
                (when (seq fixes)
                  (d/transact! conn fixes (merge tx-meta {:op :fix-block-page})))))]
      (recycle-location-broken-blocks! temp-conn
                                       (mapcat :tx-data [remote-tx-report
                                                         rebase-tx-report
                                                         cycle-tx-report])
                                       tx-meta)
      (fix-block-page-consistency! temp-conn
                                   (mapcat :tx-data [remote-tx-report
                                                     rebase-tx-report
                                                     cycle-tx-report])
                                   tx-meta))
    (sync-order/fix-duplicate-orders! temp-conn
                                      (mapcat :tx-data [remote-tx-report
                                                        rebase-tx-report
                                                        cycle-tx-report])
                                      tx-meta)))

(defn- apply-remote-tx-with-local-changes!
  [{:keys [conn local-txs remote-txs temp-tx-meta *remote-tx-report *reversed-tx-report *rebased-pending-txs *temp-after-db]}]
  (let [batch-tx-meta {:rtc-tx? true
                       :with-local-changes? true}]
    (ldb/transact-with-temp-conn!
     conn
     batch-tx-meta
     (fn [temp-conn _*batch-tx-data]
       (let [tx-meta temp-tx-meta
             reversed-tx-reports (reverse-local-txs! temp-conn local-txs tx-meta)
             reversed-tx-report (combine-tx-reports reversed-tx-reports)
             _ (reset! *reversed-tx-report reversed-tx-report)
             remote-state (build-remote-state {:temp-conn temp-conn
                                               :remote-txs remote-txs
                                               :tx-meta tx-meta
                                               :*remote-tx-report *remote-tx-report})
             rebase-state (rebase-remote-state! (merge remote-state
                                                       {:temp-conn temp-conn
                                                        :local-txs local-txs
                                                        :tx-meta tx-meta}))]
         (finalize-remote-state! (merge remote-state
                                        rebase-state
                                        {:temp-conn temp-conn
                                         :tx-meta tx-meta
                                         :*temp-after-db *temp-after-db}))))
     {:listen-db (fn [{:keys [tx-meta tx-data db-before db-after]}]
                   (when-not (contains? #{:reverse :transact-remote-tx-data} (:op tx-meta))
                     (swap! *rebased-pending-txs conj {:tx-data tx-data
                                                       :tx-meta tx-meta
                                                       :db-before db-before
                                                       :db-after db-after})))})))

(defn- apply-remote-tx-without-local-changes!
  [{:keys [conn remote-txs temp-tx-meta]}]
  (ldb/transact-with-temp-conn!
   conn
   {:rtc-tx? true
    :without-local-changes? true}
   (fn [temp-conn]
     (let [remote-results (transact-remote-txs! temp-conn remote-txs temp-tx-meta)]
       (combine-tx-reports (map :report remote-results))))))

(defn apply-remote-txs!
  [repo client remote-txs]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (let [local-txs (pending-txs repo)
          has-local-changes? (seq local-txs)
          *remote-tx-report (atom nil)
          *reversed-tx-report (atom nil)
          *rebased-pending-txs (atom [])
          *temp-after-db (atom nil)
          remote-tx-data* (mapcat :tx-data remote-txs)
          temp-tx-meta {:rtc-tx? true
                        :gen-undo-ops? false
                        :persist-op? false}
          apply-context {:conn conn
                         :local-txs local-txs
                         :remote-txs remote-txs
                         :temp-tx-meta temp-tx-meta
                         :*remote-tx-report *remote-tx-report
                         :*reversed-tx-report *reversed-tx-report
                         :*rebased-pending-txs *rebased-pending-txs
                         :*temp-after-db *temp-after-db}
          tx-report (try
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
          remote-tx-report @*remote-tx-report]
      (when has-local-changes?
        (when-let [rebased-pending-txs (seq @*rebased-pending-txs)]
          (let [remote-tx-data-set (set remote-tx-data*)
                final-db-after (or @*temp-after-db
                                   (:db-after tx-report))]
            (doseq [{:keys [tx-data tx-meta db-before db-after]} rebased-pending-txs]
              (let [db-before' (or db-before
                                   (:db-after remote-tx-report)
                                   (:db-after @*reversed-tx-report))
                    db-after' (or db-after
                                  final-db-after)
                    {:keys [normalized-tx-data reversed-datoms]}
                    (normalize-rebased-pending-tx
                     {:db-before db-before'
                      :db-after db-after'
                      :tx-data tx-data
                      :remote-tx-data-set remote-tx-data-set})]
                (when (seq normalized-tx-data)
                  (persist-local-tx! repo normalized-tx-data
                                     normalized-tx-data
                                     reversed-datoms
                                     {:outliner-op (or (:outliner-op tx-meta)
                                                       :rtc-rebase)}))))))
        ;; Once remote txs have been applied and all local txs have been rebased,
        ;; the old pending rows are stale regardless of whether any rebased tx remains.
        (remove-pending-txs! repo (map :tx-id local-txs)))

      (when-let [*inflight (:inflight client)]
        (reset! *inflight []))

      (-> (rehydrate-large-titles! repo {:tx-data remote-tx-data*
                                         :graph-id (:graph-id client)})
          (p/catch (fn [error]
                     (log/error :db-sync/large-title-rehydrate-failed
                                {:repo repo :error error}))))

      (reset! *remote-tx-report nil))
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
              reversed-datoms (reverse-tx-data tx-data)]
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
