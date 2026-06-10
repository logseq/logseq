(ns frontend.worker.sync.apply-txs
  "Pending tx and remote tx application helpers for db sync."
  (:require
   [clojure.set :as set]
   [datascript.core :as d]
   [frontend.worker.platform :as platform]
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
   [frontend.worker.sync.util :as sync-util :refer [fail-fast]]
   [frontend.worker.undo-redo :as worker-undo-redo]
   [lambdaisland.glogi :as log]
   [logseq.common.util :as common-util]
   [logseq.db :as ldb]
   [logseq.db.frontend.validate :as db-validate]
   [logseq.db-sync.order :as sync-order]
   [logseq.db-sync.tx-sanitize :as tx-sanitize]
   [logseq.db.common.normalize :as db-normalize]
   [logseq.db.sqlite.util :as sqlite-util]
   [logseq.outliner.core :as outliner-core]
   [logseq.outliner.op :as outliner-op]
   [logseq.outliner.op.construct :as op-construct]
   [logseq.outliner.page :as outliner-page]
   [logseq.outliner.property :as outliner-property]
   [logseq.outliner.recycle :as outliner-recycle]
   [promesa.core :as p]
   [frontend.worker.sync.asset-db-listener :as asset-db-listener]))

(defonce *repo->latest-remote-tx (atom {}))
(defonce *repo->latest-remote-checksum (atom {}))
;; Debug-only gate to reproduce one-way sync:
;; still pull/rebase remote txs, but skip local tx batch uploads.
(defonce *repo->upload-stopped? (atom {}))

(defn set-upload-stopped!
  [repo stopped?]
  (swap! *repo->upload-stopped? assoc repo (boolean stopped?))
  (boolean stopped?))

(defn upload-stopped?
  [repo]
  (true? (get @*repo->upload-stopped? repo)))

(declare enqueue-asset-task!
         fix-tx!
         resolve-temp-id)

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
   rtc-const/ignore-entities-when-init-upload
   #{:block/pre-block?}))

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

(defn- tx-meta-outliner-op
  [tx-meta]
  (or (:outliner-op tx-meta)
      (when (:db-migrate? tx-meta)
        :db-migrate)))

(defn- apply-tx-meta
  [remote-tx]
  (let [outliner-op (:outliner-op remote-tx)]
    (cond-> {:transact-remote? true
             :t (:t remote-tx)}
      outliner-op
      (assoc :outliner-op outliner-op)
      (= outliner-op :db-migrate)
      (assoc :db-migrate? true
             :skip-validate-db? true))))

(declare apply-history-action!)
(defn- persist-local-tx!
  [repo {:keys [db-before db-after tx-data tx-meta] :as tx-report} normalized-tx-data reversed-datoms]
  (when (client-ops-conn repo)
    (let [tx-id (or (:db-sync/tx-id tx-meta) (random-uuid))
          now (.now js/Date)
          outliner-op (tx-meta-outliner-op tx-meta)
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
            :outliner-op outliner-op
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

(defn- sync-fix-tx-meta
  []
  {:outliner-op :fix
   :db-sync/tx-id (random-uuid)})

(def ^:private upload-repair-created-at 0)

(defn- missing-datom-repair-tx?
  [tx-data]
  (let [required-block-attrs #{:block/uuid :block/title :block/page :block/parent :block/order
                               :block/created-at :block/updated-at}]
    (some (fn [item]
            (and (vector? item)
                 (contains? #{:db/retract :db/retractEntity :db.fn/retractEntity}
                            (first item))
                 (or (contains? #{:db/retractEntity :db.fn/retractEntity} (first item))
                     (contains? required-block-attrs (nth item 2 nil)))))
          tx-data)))

(defn- invalid-tx-errors
  [db tx-data tx-meta]
  (let [tx-report (d/with db tx-data tx-meta)
        [_valid? errors] (db-validate/validate-tx-report tx-report nil)]
    errors))

(defn- block-uuid-lookup-ref
  [db v]
  (when (and (vector? v)
             (= :block/uuid (first v))
             (uuid? (second v))
             (nil? (d/entity db v)))
    (second v)))

(defn- tx-item-block-uuid
  [db v]
  (cond
    (uuid? v)
    v

    (and (vector? v) (= :block/uuid (first v)) (uuid? (second v)))
    (second v)

    (number? v)
    (some-> (d/entity db v) :block/uuid)

    :else
    nil))

(defn- missing-block-uuids-in-tx-data
  [db tx-data]
  (->> tx-data
       (mapcat (fn [item]
                 (when (vector? item)
                   (keep (partial block-uuid-lookup-ref db)
                         [(second item) (nth item 3 nil)]))))
       distinct
       vec))

(defn- repair-block-uuids-in-tx-data
  [db tx-data]
  (->> tx-data
       (keep (fn [item]
               (when (vector? item)
                 (or (tx-item-block-uuid db (second item))
                     (tx-item-block-uuid db (nth item 3 nil))))))
       distinct
       vec))

(defn- ref-attr?
  [db attr]
  (= :db.type/ref (get-in (d/schema db) [attr :db/valueType])))

(defn- ref-value
  [db attr v]
  (if-let [entity (and (ref-attr? db attr)
                       (number? v)
                       (d/entity db v))]
    (if-let [block-uuid (:block/uuid entity)]
      [:block/uuid block-uuid]
      (or (:db/ident entity) v))
    v))

(defn- many-attr?
  [db attr]
  (= :db.cardinality/many (get-in (d/schema db) [attr :db/cardinality])))

(defn- assoc-repair-attr
  [db m attr value]
  (let [value' (ref-value db attr value)]
    (if (many-attr? db attr)
      (update m attr (fnil conj #{}) value')
      (assoc m attr value'))))

(defn- local-repair-block-map
  [db block-uuid]
  (when-let [eid (d/entid db [:block/uuid block-uuid])]
    (let [datoms (d/datoms db :eavt eid)]
      (reduce (fn [m datom]
                (assoc-repair-attr db m (:a datom) (:v datom)))
              {}
              datoms))))

(defn- local-repair-tx-data
  [db block-uuids]
  (->> block-uuids
       distinct
       (keep (partial local-repair-block-map db))
       vec))

(defn enqueue-upload-repair!
  [repo block-uuids]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [tx-data (local-repair-tx-data @conn block-uuids)]
      (when (seq tx-data)
        (let [tx-meta (sync-fix-tx-meta)
              {:keys [should-inc-pending?]}
              (client-op/upsert-local-tx-entry!
               repo
               {:tx-id (:db-sync/tx-id tx-meta)
                :created-at upload-repair-created-at
                :pending? true
                :failed? false
                :outliner-op (:outliner-op tx-meta)
                :normalized-tx-data tx-data
                :reversed-tx-data []})]
          (when should-inc-pending?
            (client-op/adjust-pending-local-tx-count! repo 1))
          true)))))

(defn- repair-blocks-url
  [graph-id block-uuids]
  (when-let [base (sync-auth/http-base-url @worker-state/*db-sync-config)]
    (let [params (js/URLSearchParams.)]
      (doseq [block-uuid block-uuids]
        (.append params "uuid" (str block-uuid)))
      (str base "/sync/" graph-id "/repair/blocks?" (.toString params)))))

(defn- <fetch-repair-blocks
  [repo client block-uuids]
  (if (seq block-uuids)
    (let [graph-id (:graph-id client)
          url (repair-blocks-url graph-id block-uuids)]
      (when-not (seq graph-id)
        (fail-fast :db-sync/missing-field {:repo repo :field :graph-id}))
      (when-not (seq url)
        (fail-fast :db-sync/missing-field {:repo repo :field :repair-blocks-url}))
      (p/let [resp (js/fetch url #js {:method "GET"
                                      :headers (clj->js (auth-headers))})
              body (.text resp)]
        (if (.-ok resp)
          (let [data (js->clj (js/JSON.parse body) :keywordize-keys true)]
            (sync-transport/parse-transit fail-fast (:tx data)
                                          {:repo repo
                                           :type "repair/blocks"}))
          (throw (ex-info "fetch repair blocks failed"
                          {:repo repo
                           :status (.-status resp)
                           :body body})))))
    nil))

(defn- <decrypt-repair-tx-map-entry
  [aes-key [attr value]]
  (if (contains? rtc-const/encrypt-attr-set attr)
    (p/let [value' (sync-crypt/<decrypt-text-value aes-key value)]
      [attr value'])
    (p/resolved [attr value])))

(defn- <decrypt-repair-tx-item
  [aes-key item]
  (if (map? item)
    (p/let [entries (p/all (mapv (partial <decrypt-repair-tx-map-entry aes-key) item))]
      (into {} entries))
    (p/let [[item'] (sync-crypt/<decrypt-tx-data aes-key [item])]
      item')))

(defn- <decrypt-repair-tx-data
  [aes-key tx-data]
  (p/all (mapv (partial <decrypt-repair-tx-item aes-key) tx-data)))

(defn- <server-repair-blocks-tx-data
  [repo client block-uuids]
  (if (seq block-uuids)
    (if-let [repair-tx-data-fn (:repair-blocks-tx-data-fn client)]
      (repair-tx-data-fn block-uuids)
      (p/let [graph-e2ee? (sync-crypt/graph-e2ee? repo)
              aes-key (when graph-e2ee?
                        (sync-crypt/<ensure-graph-aes-key repo (:graph-id client)))
              _ (when (and graph-e2ee? (nil? aes-key))
                  (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))
              tx-data (<fetch-repair-blocks repo client block-uuids)]
        (if (seq tx-data)
          (if aes-key
            (<decrypt-repair-tx-data aes-key tx-data)
            (p/resolved tx-data))
          (p/resolved nil))))
    nil))

(defn- repair-map-block-uuid
  [item]
  (when (map? item)
    (:block/uuid item)))

(defn- repair-temp-id
  [block-uuid]
  (str "repair-block-" block-uuid))

(defn- repair-ref->temp-id
  [uuid->temp-id v]
  (cond
    (and (vector? v)
         (= :block/uuid (first v))
         (contains? uuid->temp-id (second v)))
    (get uuid->temp-id (second v))

    (map? v)
    (update-vals v (partial repair-ref->temp-id uuid->temp-id))

    (vector? v)
    (mapv (partial repair-ref->temp-id uuid->temp-id) v)

    (set? v)
    (set (map (partial repair-ref->temp-id uuid->temp-id) v))

    (seq? v)
    (doall (map (partial repair-ref->temp-id uuid->temp-id) v))

    :else
    v))

(defn- with-repair-temp-ids
  [tx-data]
  (let [uuid->temp-id (->> tx-data
                           (keep repair-map-block-uuid)
                           distinct
                           (map (juxt identity repair-temp-id))
                           (into {}))]
    (mapv (fn [item]
            (let [item' (repair-ref->temp-id uuid->temp-id item)]
              (if-let [block-uuid (repair-map-block-uuid item)]
                (assoc item' :db/id (repair-temp-id block-uuid))
                item')))
          tx-data)))

(defn- maybe-apply-repair-tx-data!
  [conn tx-data]
  (when (seq tx-data)
    (ldb/transact! conn (with-repair-temp-ids tx-data) (sync-fix-tx-meta))))

(defn- <apply-server-repair-blocks!
  [repo client conn block-uuids]
  (if (seq block-uuids)
    (let [tx-data (<server-repair-blocks-tx-data repo client block-uuids)]
      (if (p/promise? tx-data)
        (p/let [tx-data* tx-data]
          (maybe-apply-repair-tx-data! conn tx-data*))
        (maybe-apply-repair-tx-data! conn tx-data)))
    nil))

(defn- remote-txs-missing-block-uuids
  [db remote-txs]
  (->> remote-txs
       (mapcat (comp (partial missing-block-uuids-in-tx-data db) :tx-data))
       distinct
       vec))

(defn- remote-txs-invalid-repair-block-uuids
  [db remote-txs]
  (->> remote-txs
       (mapcat
        (fn [remote-tx]
          (let [tx-data (some->> (:tx-data remote-tx)
                                 (map (partial resolve-temp-id db))
                                 (tx-sanitize/sanitize-tx db)
                                 seq)
                tx-meta (apply-tx-meta remote-tx)
                errors (when (and (seq tx-data)
                                  (missing-datom-repair-tx? tx-data))
                         (try
                           (invalid-tx-errors db tx-data tx-meta)
                           (catch :default _ nil)))]
            (when (seq errors)
              (repair-block-uuids-in-tx-data db tx-data)))))
       distinct
       vec))

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
            (when (seq ops)
              (op-construct/assert-no-numeric-entity-ids! @conn ops :history-action-ops))
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
    (when (and conn (= local-tx remote-tx) (empty? inflight)) ; rebase
      (when-let [ws (:ws client)]
        (when (and (ws-open? ws) (worker-state/online?) (not (upload-stopped? repo)))
          (let [batch (pending-txs repo {:limit 50})]
            (when (seq batch)
              (let [{:keys [tx-entries drop-tx-ids]} (prepare-upload-tx-entries conn batch)]
                (when (seq drop-tx-ids)
                  (log/info :db-sync/drop-tx-ids {:tx-ids drop-tx-ids})
                  (mark-pending-txs-false! repo drop-tx-ids))
                (-> (p/let [aes-key (when (and (seq tx-entries) (sync-crypt/graph-e2ee? repo))
                                      (sync-crypt/<ensure-graph-aes-key repo (:graph-id client)))
                            _ (when (and (seq tx-entries) (sync-crypt/graph-e2ee? repo) (nil? aes-key))
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
                      (when (seq tx-entries)
                        (reset! (:inflight client) tx-ids)
                        (send! ws {:type "tx/batch"
                                   :t-before local-tx
                                   :txs payload})))
                    (p/catch (fn [error]
                               (sync-util/set-last-sync-error! client error)
                               (log/error :db-sync/flush-pending-failed
                                          {:repo repo
                                           :error error}))))))))))))

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
    ;; Built-in sync repair :fix rows are idempotent and can be queued without
    ;; reverse data; normal user edits must still carry reverse tx-data.
    (when-not (= :fix (:outliner-op local-tx))
      (invalid-rebase-op! :reverse-history-action
                          {:reason :missing-reversed-tx-data
                           :tx-id (:tx-id local-tx)
                           :outliner-op (:outliner-op local-tx)}))))

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

(def sync-conflict-attrs
  #{:block/title})

(defn- tx-item-components
  [item]
  (when (and (vector? item) (>= (count item) 4))
    (let [[op e a v] item]
      (when (and (contains? #{:db/add :db/retract} op)
                 (contains? sync-conflict-attrs a))
        {:op op
         :e e
         :a a
         :v v}))))

(defn- tx-entity-uuid
  [db temp-id->uuid e]
  (cond
    (uuid? e) e

    (and (string? e) (common-util/uuid-string? e)) (uuid e)

    (and (vector? e)
         (= :block/uuid (first e))
         (uuid? (second e))) (second e)

    (and (number? e) (contains? temp-id->uuid e)) (get temp-id->uuid e)

    :else (some-> (d/entity db e) :block/uuid)))

(defn- tx-temp-id->uuid
  [tx-data]
  (->> tx-data
       (keep (fn [item]
               (when (and (vector? item)
                          (= :db/add (first item))
                          (= :block/uuid (nth item 2 nil))
                          (number? (second item))
                          (uuid? (nth item 3 nil)))
                 [(second item) (nth item 3)])))
       (into {})))

(defn- local-conflict-block-uuids
  [db local-txs]
  (->> local-txs
       (mapcat :tx)
       (keep tx-item-components)
       (keep (fn [{:keys [e]}]
               (tx-entity-uuid db {} e)))
       set))

(defn- remote-sync-conflicts
  [db local-txs remote-txs]
  (let [local-block-uuids (local-conflict-block-uuids db local-txs)]
    (when (seq local-block-uuids)
      (->> remote-txs
           (mapcat (fn [{:keys [tx-data t]}]
                     (let [temp-id->uuid (tx-temp-id->uuid tx-data)]
                       (keep (fn [item]
                               (when-let [{:keys [op e a v]} (tx-item-components item)]
                                 (when (and (= :db/add op) (string? v))
                                   (when-let [block-uuid (tx-entity-uuid db temp-id->uuid e)]
                                     (let [current-value (some-> (d/entity db [:block/uuid block-uuid]) a)]
                                       (when (and (contains? local-block-uuids block-uuid)
                                                  (not= current-value v))
                                         {:block-uuid block-uuid
                                          :attr a
                                          :value v
                                          :remote-t t}))))))
                             tx-data))))
           distinct
           vec))))

(defn- broadcast-sync-conflicts!
  [repo conflicts]
  (doseq [block-uuid (distinct (map :block-uuid conflicts))]
    (shared-service/broadcast-to-clients!
     :sync-conflicts-updated
     {:repo repo
      :block-uuid block-uuid
      :conflicts (client-op/get-sync-conflicts repo block-uuid)})))

(defn- transact-remote-txs!
  [conn remote-txs & {:keys [allow-invalid-repair?]
                      :or {allow-invalid-repair? true}}]
  (loop [remaining remote-txs
         index 0
         results []]
    (let [db @conn]
      (if-let [remote-tx (first remaining)]
        (let [tx-data (some->> (:tx-data remote-tx)
                               (map (partial resolve-temp-id db))
                               (tx-sanitize/sanitize-tx db)
                               seq)
              tx-meta (apply-tx-meta remote-tx)
              invalid-retry? (and allow-invalid-repair?
                                  (missing-datom-repair-tx? tx-data)
                                  (seq (invalid-tx-errors db tx-data tx-meta)))
              repair-block-uuids (when invalid-retry?
                                   (repair-block-uuids-in-tx-data db tx-data))
              report (ldb/transact! conn tx-data
                                     (cond-> tx-meta
                                       invalid-retry?
                                       (assoc :skip-validate-db? true)))
              results' (cond-> results
                         tx-data
                         (conj {:tx-data tx-data
                                :report report
                                :invalid-retry? invalid-retry?
                                :repair-block-uuids repair-block-uuids}))]
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
  (let [message (ex-message error)]
    (if (or (= "invalid rebase op" message)
            (= "Non-transact outliner ops contain numeric entity ids" message))
      :invalid-history-action-ops
      :error)))

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
    (let [[title opts] args
          page-uuid (:uuid opts)]
      (when-not (and (uuid? page-uuid)
                     (d/entity @conn [:block/uuid page-uuid]))
        (outliner-page/create! conn title opts)))

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

(defn- repair-applied-txs!
  [conn tx-report]
  (when (seq (:tx-data tx-report))
    (fix-tx! conn tx-report (sync-fix-tx-meta))))

(defn- apply-remote-tx-with-local-changes!
  [{:keys [repo conn local-txs remote-txs pre-repair-tx-data post-repair-tx-data
           prefetched-repair-block-uuids]}]
  (let [tx-meta {:rtc-tx? true
                 :with-local-changes? true}
        *rebase-tx-reports (atom [])
        *rebase-results (atom [])
        *remote-tx-results (atom [])
        rebase-db-before @conn
        conflicts (remote-sync-conflicts rebase-db-before local-txs remote-txs)]
    (try
      (when (seq conflicts)
        (client-op/add-sync-conflicts! repo conflicts)
        (broadcast-sync-conflicts! repo conflicts))
      (let [tx-report (ldb/batch-transact!
                       conn
                       tx-meta
                       (fn [conn]
                         (reverse-local-txs! conn local-txs)

                         (when (seq pre-repair-tx-data)
                           (maybe-apply-repair-tx-data! conn pre-repair-tx-data))

                         (reset! *remote-tx-results
                                 (transact-remote-txs! conn remote-txs))

                         (when (seq post-repair-tx-data)
                           (maybe-apply-repair-tx-data! conn post-repair-tx-data))

                         (reset! *rebase-results
                                 (rebase-local-txs! repo conn local-txs rebase-db-before)))

                       {:listen-db (fn [{:keys [tx-meta tx-data] :as tx-report}]
                                     (when (and (= :rebase (:outliner-op tx-meta)) (seq tx-data))
                                       (swap! *rebase-tx-reports conj tx-report)))})]
        (doseq [tx-report @*rebase-tx-reports]
          (handle-local-tx! repo tx-report))

        (repair-applied-txs! conn tx-report)
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
        {:repair-block-uuids (->> @*remote-tx-results
                                  (mapcat :repair-block-uuids)
                                  (remove (set prefetched-repair-block-uuids))
                                  distinct
                                  vec)})

      (catch :default e
        (js/console.error e)
        (throw e))
      (finally
        (reset! *rebase-tx-reports nil)
        (reset! *rebase-results nil)
        (worker-undo-redo/clear-history! repo)))))

(defn- apply-remote-tx-without-local-changes!
  [{:keys [conn remote-txs]}]
  (let [remote-tx-results (atom [])
        tx-report (ldb/batch-transact!
                   conn
                   {:rtc-tx? true
                    :without-local-changes? true}
                   (fn [conn]
                     (reset! remote-tx-results
                             (transact-remote-txs! conn remote-txs))))]
    (repair-applied-txs! conn tx-report)
    {:repair-block-uuids (->> @remote-tx-results
                              (mapcat :repair-block-uuids)
                              distinct
                              vec)}))

(defn- report-apply-remote-txs-error!
  [error {:keys [has-local-changes? remote-txs local-txs]}]
  (try
    (platform/post-message!
     (platform/current)
     :capture-error
     (cond-> {:error error
              :payload {:source "db-sync"
                        :operation "apply-remote-txs"
                        :has-local-changes? has-local-changes?
                        :remote-tx-count (count remote-txs)
                        :local-tx-count (count local-txs)}}
       (ex-data error)
       (assoc :extra {:error-data (ex-data error)})))
    (catch :default report-error
      (log/error :db-sync/report-apply-remote-txs-error-failed
                 {:error report-error}))))

(defn- finish-apply-remote-txs!
  [repo client remote-tx-data]
  (when-let [*inflight (:inflight client)]
    (reset! *inflight []))

  (when-let [result (rehydrate-large-titles! repo {:tx-data remote-tx-data
                                                   :graph-id (:graph-id client)})]
    (p/catch result
             (fn [error]
               (log/error :db-sync/large-title-rehydrate-failed
                          {:repo repo :error error})))))

(defn- after-repair-result
  [repair-result f]
  (if (p/promise? repair-result)
    (p/let [_ repair-result]
      (f))
    (f)))

(defn- apply-remote-txs-after-server-repair!
  [{:keys [repo client has-local-changes? remote-txs local-txs apply-context remote-tx-data]}]
  (let [apply-result (try
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
                         (report-apply-remote-txs-error!
                          error
                          {:has-local-changes? has-local-changes?
                           :remote-txs remote-txs
                           :local-txs local-txs})
                         (throw error)))
        repair-block-uuids (:repair-block-uuids apply-result)]
    (if (seq repair-block-uuids)
      (let [repair-result (<apply-server-repair-blocks!
                           repo client (:conn apply-context) repair-block-uuids)]
        (after-repair-result
         repair-result
         #(finish-apply-remote-txs! repo client remote-tx-data)))
      (finish-apply-remote-txs! repo client remote-tx-data))))

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
                         :temp-tx-meta temp-tx-meta}
          apply-args {:repo repo
                      :client client
                      :has-local-changes? has-local-changes?
                      :remote-txs remote-txs
                      :local-txs local-txs
                      :apply-context apply-context
                      :remote-tx-data remote-tx-data*}
          missing-block-uuids (remote-txs-missing-block-uuids @conn remote-txs)
          invalid-repair-block-uuids (when has-local-changes?
                                       (remote-txs-invalid-repair-block-uuids @conn remote-txs))]
      (if has-local-changes?
        (if (or (seq missing-block-uuids)
                (seq invalid-repair-block-uuids))
          (let [pre-repair-tx-data (<server-repair-blocks-tx-data repo client missing-block-uuids)
                post-repair-tx-data (<server-repair-blocks-tx-data repo client invalid-repair-block-uuids)
                apply-with-repair (fn [pre-repair-tx-data* post-repair-tx-data*]
                                    (apply-remote-txs-after-server-repair!
                                     (update apply-args :apply-context assoc
                                             :pre-repair-tx-data pre-repair-tx-data*
                                             :post-repair-tx-data post-repair-tx-data*
                                             :prefetched-repair-block-uuids
                                             (distinct (concat missing-block-uuids
                                                               invalid-repair-block-uuids)))))]
            (if (or (p/promise? pre-repair-tx-data)
                    (p/promise? post-repair-tx-data))
              (p/let [pre-repair-tx-data* pre-repair-tx-data
                      post-repair-tx-data* post-repair-tx-data]
                (apply-with-repair pre-repair-tx-data* post-repair-tx-data*))
              (apply-with-repair pre-repair-tx-data post-repair-tx-data)))
          (apply-remote-txs-after-server-repair! apply-args))
        (if (seq missing-block-uuids)
          (after-repair-result
           (<apply-server-repair-blocks! repo client conn missing-block-uuids)
           #(apply-remote-txs-after-server-repair! apply-args))
          (apply-remote-txs-after-server-repair! apply-args))))
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
    (asset-db-listener/generate-asset-ops repo tx-report)
    (when-let [client @worker-state/*db-sync-client]
      (when (and (= repo (:repo client))
                 (:kv/value (d/entity db-after :logseq.kv/graph-remote?)))
        (sync-assets/enqueue-asset-sync!
         repo client
         {:enqueue-asset-task-f enqueue-asset-task!
          :current-client-f current-client
          :broadcast-rtc-state!-f broadcast-rtc-state!
          :fail-fast-f fail-fast})))))
