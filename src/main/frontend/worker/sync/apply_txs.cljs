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
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.recycle :as outliner-recycle]
            [logseq.outliner.undo-redo-validate :as undo-validate]
            [promesa.core :as p]))

(defonce *repo->latest-remote-tx (atom {}))
(defonce *upload-temp-opfs-pool (atom nil))

(defn fail-fast [tag data]
  (log/error tag data)
  (throw (ex-info (name tag) data)))

(declare enqueue-asset-task!
         replace-string-block-tempids-with-lookups)

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

(defn- persist-local-tx! [repo normalized-tx-data reversed-datoms tx-meta]
  (when-let [conn (client-ops-conn repo)]
    (let [tx-id (random-uuid)
          now (.now js/Date)]
      (ldb/transact! conn [{:db-sync/tx-id tx-id
                            :db-sync/normalized-tx-data normalized-tx-data
                            :db-sync/reversed-tx-data reversed-datoms
                            :db-sync/outliner-op (:outliner-op tx-meta)
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
                      :tx (replace-string-block-tempids-with-lookups
                           graph-db
                           (:db-sync/normalized-tx-data ent))
                      :reversed-tx (replace-string-block-tempids-with-lookups
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

(comment
  (defn- clear-pending-txs!
    [repo]
    (when-let [conn (client-ops-conn repo)]
      (let [tx-data (->> (d/datoms @conn :avet :db-sync/created-at)
                         (map (fn [d]
                                [:db/retractEntity (:e d)])))]
        (d/transact! conn tx-data)))))

(defn get-lookup-id
  [x]
  (when (and (vector? x)
             (= 2 (count x))
             (= :block/uuid (first x)))
    (second x)))

(defn- created-block-uuid-entry
  [item]
  (when (and (vector? item)
             (= :db/add (first item))
             (>= (count item) 4)
             (= :block/uuid (nth item 2)))
    [(second item) (nth item 3)]))

(defn- created-block-uuid-by-entity-id
  [tx-data]
  (->> tx-data
       (keep created-block-uuid-entry)
       (into {})))

(defn- created-block-context
  [tx-data]
  (let [uuid-by-entity-id (created-block-uuid-by-entity-id tx-data)]
    {:uuid-by-entity-id uuid-by-entity-id
     :uuids (set (vals uuid-by-entity-id))}))

(defn- tx-created-block-uuid
  [{:keys [uuid-by-entity-id uuids]} entity-id]
  (or (get uuid-by-entity-id entity-id)
      (let [lookup-id (get-lookup-id entity-id)]
        (when (contains? uuids lookup-id)
          lookup-id))))

(defn- add-datom-ref-block-uuids
  [item]
  (when (and (vector? item)
             (= :db/add (first item)))
    (cond-> []
      (get-lookup-id (second item))
      (conj (get-lookup-id (second item)))

      (and (>= (count item) 4)
           (get-lookup-id (nth item 3)))
      (conj (get-lookup-id (nth item 3))))))

(defn drop-missing-created-block-datoms
  [db tx-data]
  (if db
    (let [{:keys [uuid-by-entity-id]} (created-block-context tx-data)
          missing-created-uuids (->> (vals uuid-by-entity-id)
                                     (remove #(d/entity db [:block/uuid %]))
                                     set)]
      (if (seq missing-created-uuids)
        (remove (fn [item]
                  (when (vector? item)
                    (let [entity-lookup-id (get-lookup-id (second item))
                          value-lookup-id (when (>= (count item) 4)
                                            (get-lookup-id (nth item 3)))
                          created-uuid (or (get uuid-by-entity-id (second item))
                                           entity-lookup-id)]
                      (or (contains? missing-created-uuids created-uuid)
                          (contains? missing-created-uuids entity-lookup-id)
                          (contains? missing-created-uuids value-lookup-id)))))
                tx-data)
        tx-data))
    tx-data))

(defn- missing-block-ref?
  [db x]
  (and db
       (or (and (vector? x)
                (some? (get-lookup-id x))
                (nil? (d/entity db x)))
           (and (number? x)
                (not (neg? x))
                (nil? (d/entity db x))))))

(defn- invalid-block-ref?
  [db x]
  (missing-block-ref? db x))

(defn- ref-attr?
  [db a]
  (and db
       (keyword? a)
       (= :db.type/ref
          (:db/valueType (d/entity db a)))))

(defn- tx-entity-key
  [entity]
  (or (get-lookup-id entity)
      entity))

(defn- strip-tx-id
  [item]
  (if (= (count item) 5)
    (vec (butlast item))
    item))

(defn drop-orphaning-parent-retracts
  [tx-data]
  (let [entities-with-parent-add (->> tx-data
                                      (keep (fn [item]
                                              (when (and (vector? item)
                                                         (= :db/add (first item))
                                                         (= :block/parent (nth item 2 nil)))
                                                (tx-entity-key (second item)))))
                                      set)]
    (remove (fn [item]
              (and (vector? item)
                   (= :db/retract (first item))
                   (= :block/parent (nth item 2 nil))
                   (not (contains? entities-with-parent-add
                                   (tx-entity-key (second item))))))
            tx-data)))

(defn- created-block-ref?
  [created-context x]
  (when-let [block-uuid (or (tx-created-block-uuid created-context x)
                            (get-lookup-id x))]
    (contains? (:uuids created-context) block-uuid)))

(defn- invalid-block-uuid?
  [db created-context broken-block-uuids block-uuid]
  (and block-uuid
       (or (contains? broken-block-uuids block-uuid)
           (and (not (contains? (:uuids created-context) block-uuid))
                (nil? (d/entity db [:block/uuid block-uuid]))))))

(defn- add-datom-invalid-block-ref?
  [db created-context broken-block-uuids item]
  (some (partial invalid-block-uuid? db created-context broken-block-uuids)
        (add-datom-ref-block-uuids item)))

(defn- broken-created-block-uuids
  [db created-context tx-data]
  (loop [broken-block-uuids #{}]
    (let [next-broken-block-uuids (->> tx-data
                                       (keep (fn [item]
                                               (when (and (vector? item)
                                                          (= :db/add (first item))
                                                          (add-datom-invalid-block-ref? db created-context broken-block-uuids item))
                                                 (tx-created-block-uuid created-context (second item)))))
                                       (into broken-block-uuids))]
      (if (= broken-block-uuids next-broken-block-uuids)
        broken-block-uuids
        (recur next-broken-block-uuids)))))

(defn- invalid-block-ref-datom?
  [db created-context broken-block-uuids item]
  (when (vector? item)
    (let [op (first item)
          e (second item)
          a (nth item 2 nil)
          has-value? (>= (count item) 4)
          v (when has-value? (nth item 3))
          block-uuid (tx-created-block-uuid created-context e)
          value-ref? (and has-value?
                          (contains? #{:db/add :db/retract} op)
                          (ref-attr? db a))]
      (or (and (= :db/add op)
               (add-datom-invalid-block-ref? db created-context broken-block-uuids item))
          (contains? broken-block-uuids block-uuid)
          (and (contains? #{:db/add :db/retract} op)
               (not (created-block-ref? created-context e))
               (invalid-block-ref? db e))
          (and (= :db/retractEntity op)
               (number? e)
               (not (created-block-ref? created-context e))
               (invalid-block-ref? db e))
          (and value-ref?
               (not (created-block-ref? created-context v))
               (invalid-block-ref? db v))))))

(defn- sanitize-block-ref-datoms
  [db tx-data]
  (if db
    (let [created-context (created-block-context tx-data)
          broken-block-uuids (broken-created-block-uuids db created-context tx-data)]
      (remove (partial invalid-block-ref-datom? db created-context broken-block-uuids)
              tx-data))
    tx-data))

(defn- canonical-entity-id
  [db e]
  (cond
    (vector? e) (or (get-lookup-id e) e)
    (and (number? e) (not (neg? e))) (or (:block/uuid (d/entity db e)) e)
    :else e))

(defn- remote-updated-attr-keys
  [db tx-data]
  (->> tx-data
       (keep (fn [item]
               (when (and (vector? item)
                          (>= (count item) 4)
                          (contains? #{:db/add :db/retract} (first item)))
                 [(canonical-entity-id db (second item))
                  (nth item 2)])))
       set))

(defn- resolve-string-block-tempid
  [db x]
  (when (and db (string? x))
    (when-let [block-uuid (parse-uuid x)]
      (when (d/entity db [:block/uuid block-uuid])
        [:block/uuid block-uuid]))))

(defn- string-block-uuid->lookup
  [x]
  (when (string? x)
    (when-let [block-uuid (parse-uuid x)]
      [:block/uuid block-uuid])))

(defn replace-string-block-tempids-with-lookups
  [db tx-data]
  (if db
    (let [created-string-entity-ids (->> tx-data
                                         (keep (fn [item]
                                                 (when (and (vector? item)
                                                            (= :db/add (first item))
                                                            (>= (count item) 4)
                                                            (string? (second item))
                                                            (= :block/uuid (nth item 2)))
                                                   (second item))))
                                         set)
          replace-entity (fn [entity]
                           (if (contains? created-string-entity-ids entity)
                             entity
                             (or (string-block-uuid->lookup entity)
                                 (resolve-string-block-tempid db entity)
                                 entity)))]
      (mapv (fn [item]
              (if (and (vector? item) (>= (count item) 2))
                (let [op (first item)
                      entity' (replace-entity (second item))
                      has-value? (>= (count item) 4)
                      attr (nth item 2 nil)
                      value (when has-value? (nth item 3))
                      value' (if (and has-value?
                                      (contains? db-schema/ref-type-attributes attr))
                               (replace-entity value)
                               value)]
                  (cond-> item
                    (and (contains? #{:db/add :db/retract :db/retractEntity} op)
                         (not= (second item) entity'))
                    (assoc 1 entity')
                    (and has-value? (not= value value'))
                    (assoc 3 value')))
                item))
            tx-data))
    tx-data))

(defn drop-remote-conflicted-local-tx
  [db remote-updated-keys tx-data]
  (if (seq remote-updated-keys)
    (let [structural-attrs #{:block/parent :block/page :block/order}
          conflicted-structural-entities
          (->> tx-data
               (keep (fn [item]
                       (when (and (vector? item)
                                  (>= (count item) 4)
                                  (contains? #{:db/add :db/retract} (first item)))
                         (let [entity-key (canonical-entity-id db (second item))
                               attr (nth item 2)]
                           (when (and (contains? structural-attrs attr)
                                      (contains? remote-updated-keys [entity-key attr]))
                             entity-key)))))
               set)]
      (remove (fn [item]
                (and (vector? item)
                     (let [entity-key (canonical-entity-id db (second item))]
                       (or
                        (and (contains? conflicted-structural-entities entity-key)
                             (contains? #{:db/add :db/retract :db/retractEntity} (first item)))
                        (and (>= (count item) 4)
                             (contains? #{:db/add :db/retract} (first item))
                             (contains? remote-updated-keys
                                        [entity-key (nth item 2)]))))))
              tx-data))
    tx-data))

(defn- missing-block-lookup-update?
  [db item]
  (when (and db
             (vector? item)
             (>= (count item) 4)
             (contains? #{:db/add :db/retract} (first item)))
    (let [entity (second item)
          attr (nth item 2)
          create-attrs #{:block/uuid :block/name :db/ident :block/page :block/parent :block/order}]
      (and (vector? entity)
           (= :block/uuid (first entity))
           (nil? (d/entity db entity))
           (not (contains? create-attrs attr))))))

(defn- drop-missing-block-lookup-updates
  [db tx-data]
  (if db
    (let [stale-lookups (->> tx-data
                             (keep (fn [item]
                                     (when (missing-block-lookup-update? db item)
                                       (second item))))
                             set)]
      (if (seq stale-lookups)
        (remove (fn [item]
                  (and (vector? item)
                       (contains? stale-lookups (second item))))
                tx-data)
        tx-data))
    tx-data))

(defn- retract-entity-eid
  [db item]
  (when (and db
             (vector? item)
             (= :db/retractEntity (first item)))
    (let [entity (second item)]
      (cond
        (number? entity) entity
        (vector? entity) (some-> (d/entity db entity) :db/id)
        :else nil))))

(defn- content-block?
  [block]
  (and block
       (not (ldb/page? block))
       (not (ldb/class? block))
       (not (ldb/property? block))))

(def ^:private sync-recycle-meta-attrs
  [:logseq.property.recycle/original-parent
   :logseq.property.recycle/original-page
   :logseq.property.recycle/original-order])

(defn- orphaned-blocks->recycle-tx-data
  [db blocks]
  (->> (outliner-recycle/recycle-blocks-tx-data db blocks {})
       (map (fn [item]
              (if (map? item)
                (apply dissoc item sync-recycle-meta-attrs)
                item)))))

(defn- move-missing-location-blocks-to-recycle
  [db tx-data]
  (if db
    (let [retracted-eids (->> tx-data
                              (keep #(retract-entity-eid db %))
                              set)
          direct-orphans (->> retracted-eids
                              (mapcat #(ldb/get-children db %))
                              (filter content-block?))
          ;; Only recycle top-level page roots whose parent is the page being retracted.
          page-orphans (->> retracted-eids
                            (mapcat (fn [eid]
                                      (->> (ldb/get-page-blocks db eid)
                                           (filter (fn [block]
                                                     (= eid (:db/id (:block/parent block))))))))
                            (filter content-block?))
          recycle-roots (->> (concat direct-orphans page-orphans)
                             (remove (fn [block]
                                       (contains? retracted-eids (:db/id block))))
                             distinct
                             vec)]
      (if (seq recycle-roots)
        (concat tx-data
                (orphaned-blocks->recycle-tx-data db recycle-roots))
        tx-data))
    tx-data))

(defn sanitize-tx-data
  [db tx-data]
  (let [sanitized-tx-data (->> tx-data
                               (db-normalize/replace-attr-retract-with-retract-entity-v2 db)
                               ;; Notice: rebase should generate larger tx-id than reverse tx
                               (map strip-tx-id)
                               (drop-missing-block-lookup-updates db)
                               (sanitize-block-ref-datoms db)
                               (move-missing-location-blocks-to-recycle db)
                               drop-orphaning-parent-retracts)]
    ;; (when (not= tx-data sanitized-tx-data)
    ;;   (prn :debug :tx-data tx-data)
    ;;   (prn :debug :sanitized-tx-data sanitized-tx-data))
    sanitized-tx-data))

(defn- get-remote-deleted-properties
  [{:keys [db-before db-after tx-data]}]
  (when (and db-before db-after)
    (->> tx-data
         (keep (fn [d]
                 (when-let [e (and (= :db/ident (:a d))
                                   (false? (:added d))
                                   (d/entity db-before (:e d)))]
                   (when (and (ldb/property? e) (nil? (d/entity db-after (:db/ident e))))
                     e))))

         distinct)))

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
                                                             (drop-missing-created-block-datoms @conn)
                                                             (sanitize-tx-data @conn)
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

(defn- transact-remote-txs!
  [temp-conn remote-txs temp-tx-meta]
  (loop [remaining remote-txs
         index 0
         results []]
    (if-let [remote-tx (first remaining)]
      (let [tx-data (->> (:tx-data remote-tx)
                         (sanitize-tx-data @temp-conn)
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
                                  (replace-string-block-tempids-with-lookups @temp-conn)
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

(defn- rebase-local-txs!
  [temp-conn local-txs remote-db remote-updated-keys remote-tx-data-set temp-tx-meta retracted-properties]
  (let [retracted-property-idents (set (map :db/ident retracted-properties))]
    (->> local-txs
         (map-indexed
          (fn [index local-tx]
            (let [pending-tx-data (->> (:tx local-tx)
                                       (remove (fn [item]
                                                 (and (vector? item)
                                                      (contains? #{:db/add :db/retract} (first item))
                                                      (contains? retracted-property-idents (nth item 2 nil)))))
                                       (drop-remote-conflicted-local-tx remote-db remote-updated-keys))
                  rebased-tx-data (->> (sanitize-tx-data @temp-conn
                                                         pending-tx-data)
                                       (remove remote-tx-data-set))]
              (when (seq rebased-tx-data)
                (ldb/transact! temp-conn
                               rebased-tx-data
                               (local-tx-debug-meta temp-tx-meta
                                                    local-txs
                                                    index
                                                    local-tx
                                                    :rebase))))))
         (keep identity)
         vec)))

(defn- build-remote-state
  [{:keys [temp-conn remote-txs tx-meta *remote-tx-report]}]
  (let [remote-results (transact-remote-txs! temp-conn remote-txs tx-meta)
        remote-tx-data (mapcat :tx-data remote-results)
        remote-tx-report (combine-tx-reports (map :report remote-results))
        _ (reset! *remote-tx-report remote-tx-report)
        retracted-properties (get-remote-deleted-properties remote-tx-report)
        remote-db @temp-conn]
    {:remote-db remote-db
     :remote-results remote-results
     :remote-tx-data remote-tx-data
     :remote-tx-data-set (set (map tx-data-item->set-item remote-tx-data))
     :remote-tx-report remote-tx-report
     :retracted-properties retracted-properties
     :remote-updated-keys (remote-updated-attr-keys remote-db remote-tx-data)}))

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
                        (replace-string-block-tempids-with-lookups db-before))
        normalized-tx-data (->> normalized
                                (db-normalize/replace-attr-retract-with-retract-entity-v2 db-after)
                                (remove remote-tx-data-set)
                                (sanitize-block-ref-datoms db-after))]
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
                                 (vec (orphaned-blocks->recycle-tx-data db recycle-blocks))
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
            (persist-local-tx! repo normalized reversed-datoms tx-meta)
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
