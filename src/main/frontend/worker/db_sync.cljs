(ns frontend.worker.db-sync
  "Simple db-sync client based on promesa + WebSocket."
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.db :as ldb]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]
            [promesa.core :as p]))

(defn- enabled?
  []
  (true? (:enabled? @worker-state/*db-sync-config)))

(defn- ws-base-url
  []
  (:ws-url @worker-state/*db-sync-config))

(defn- http-base-url
  []
  (or (:http-base @worker-state/*db-sync-config)
      (when-let [ws-url (ws-base-url)]
        (let [base (cond
                     (string/starts-with? ws-url "wss://")
                     (str "https://" (subs ws-url (count "wss://")))

                     (string/starts-with? ws-url "ws://")
                     (str "http://" (subs ws-url (count "ws://")))

                     :else ws-url)]
          (string/replace base #"/sync/%s$" "")))))

(defn- auth-token []
  (worker-state/get-id-token))

(defn- auth-headers []
  (when-let [token (auth-token)]
    {"authorization" (str "Bearer " token)}))

(defn- with-auth-headers [opts]
  (if-let [auth (auth-headers)]
    (assoc opts :headers (merge (or (:headers opts) {}) auth))
    opts))

(def ^:private max-asset-size (* 100 1024 1024))
(def ^:private upload-kvs-batch-size 2000)
(def ^:private reconnect-base-delay-ms 1000)
(def ^:private reconnect-max-delay-ms 30000)
(def ^:private reconnect-jitter-ms 250)

(defn- format-ws-url [base graph-id]
  (cond
    (string/includes? base "%s")
    (string/replace base "%s" graph-id)

    (string/ends-with? base "/")
    (str base graph-id)

    :else
    (str base "/" graph-id)))

(defn- append-token [url token]
  (if (string? token)
    (let [separator (if (string/includes? url "?") "&" "?")]
      (str url separator "token=" (js/encodeURIComponent token)))
    url))

(defn- get-graph-id [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          graph-uuid (ldb/get-graph-rtc-uuid db)]
      (when graph-uuid
        (str graph-uuid)))))

(defn- ensure-client-graph-uuid! [repo graph-id]
  (when (seq graph-id)
    (client-op/update-graph-uuid repo graph-id)))

(defn- ready-state [ws]
  (.-readyState ws))

(defn- ws-open? [ws]
  (= 1 (ready-state ws)))

(def ^:private invalid-coerce ::invalid-coerce)

(defn- coerce
  [coercer value context]
  (try
    (coercer value)
    (catch :default e
      (log/error :db-sync/malli-coerce-failed (merge context {:error e :value value}))
      invalid-coerce)))

(defn- coerce-ws-client-message [message]
  (when message
    (let [coerced (coerce db-sync-schema/ws-client-message-coercer message {:schema :ws/client})]
      (when-not (= coerced invalid-coerce)
        coerced))))

(defn- coerce-ws-server-message [message]
  (when message
    (let [coerced (coerce db-sync-schema/ws-server-message-coercer message {:schema :ws/server})]
      (when-not (= coerced invalid-coerce)
        coerced))))

(defn- fail-fast [tag data]
  (log/error tag data)
  (throw (ex-info (name tag) data)))

(defn- require-number [value context]
  (when-not (number? value)
    (fail-fast :db-sync/invalid-field (assoc context :value value))))

(defn- require-seq [value context]
  (when-not (sequential? value)
    (fail-fast :db-sync/invalid-field (assoc context :value value))))

(defn- parse-transit [value context]
  (try
    (sqlite-util/read-transit-str value)
    (catch :default e
      (fail-fast :db-sync/response-parse-failed (assoc context :error e)))))

(defn- coerce-http-request [schema-key body]
  (if-let [coercer (get db-sync-schema/http-request-coercers schema-key)]
    (let [coerced (coerce coercer body {:schema schema-key :dir :request})]
      (when-not (= coerced invalid-coerce)
        coerced))
    body))

(defn- coerce-http-response [schema-key body]
  (if-let [coercer (get db-sync-schema/http-response-coercers schema-key)]
    (let [coerced (coerce coercer body {:schema schema-key :dir :response})]
      (when-not (= coerced invalid-coerce)
        coerced))
    body))

(defn- reconnect-delay-ms [attempt]
  (let [exp (js/Math.pow 2 attempt)
        delay (min reconnect-max-delay-ms (* reconnect-base-delay-ms exp))
        jitter (rand-int reconnect-jitter-ms)]
    (+ delay jitter)))

(defn- clear-reconnect-timer! [reconnect]
  (when-let [timer (:timer @reconnect)]
    (js/clearTimeout timer)
    (swap! reconnect assoc :timer nil)))

(defn- reset-reconnect! [client]
  (when-let [reconnect (:reconnect client)]
    (clear-reconnect-timer! reconnect)
    (swap! reconnect assoc :attempt 0)))

(defn- send! [ws message]
  (when (ws-open? ws)
    (if-let [coerced (coerce-ws-client-message message)]
      (.send ws (js/JSON.stringify (clj->js coerced)))
      (log/error :db-sync/ws-request-invalid {:message message}))))

(defn- normalize-tx-data [db-after db-before tx-data]
  (->> tx-data
       (remove (fn [[_e a _v _t _added]]
                 (contains? #{:block/tx-id :logseq.property/created-by-ref
                              :logseq.property.embedding/hnsw-label-updated-at} a)))
       (db-normalize/normalize-tx-data db-after db-before)))

(defn- parse-message [raw]
  (try
    (js->clj (js/JSON.parse raw) :keywordize-keys true)
    (catch :default _
      nil)))

(defn- fetch-json
  [url opts {:keys [response-schema error-schema] :or {error-schema :error}}]
  (p/let [resp (js/fetch url (clj->js (with-auth-headers opts)))
          text (.text resp)
          data (when (seq text) (js/JSON.parse text))]
    (if (.-ok resp)
      (let [body (js->clj data :keywordize-keys true)
            body (if response-schema
                   (coerce-http-response response-schema body)
                   body)]
        (if (or (nil? response-schema) body)
          body
          (throw (ex-info "db-sync invalid response"
                          {:status (.-status resp)
                           :url url
                           :body body}))))
      (let [body (when data (js->clj data :keywordize-keys true))
            body (if error-schema
                   (coerce-http-response error-schema body)
                   body)]
        (throw (ex-info "db-sync request failed"
                        {:status (.-status resp)
                         :url url
                         :body body}))))))

(def ^:private asset-update-attrs
  #{:logseq.property.asset/remote-metadata
    :logseq.property.asset/type
    :logseq.property.asset/checksum})

(defn- asset-uuids-from-tx [db tx-data]
  (->> tx-data
       (keep (fn [datom]
               (when (and (:added datom)
                          (contains? asset-update-attrs (:a datom)))
                 (when-let [ent (d/entity db (:e datom))]
                   (some-> (:block/uuid ent) str)))))
       (distinct)))

(declare enqueue-asset-downloads!)

(defn- ensure-recycle-page!
  [conn]
  (let [db @conn]
    (or (ldb/get-built-in-page db common-config/recycle-page-name)
        (let [page (-> (sqlite-util/build-new-page common-config/recycle-page-name)
                       sqlite-create-graph/mark-block-as-built-in)
              {:keys [db-after]} (ldb/transact! conn [page] {:db-sync/recycle-page? true})]
          (d/entity db-after [:block/uuid (:block/uuid page)])))))

(defn- missing-parents
  [{:keys [db-before db-after tx-data]}]
  (->> tx-data
       ;; parent gone
       (keep (fn [d]
               (when (and (= :block/parent (:a d)) (:added d)
                          (nil? (d/entity db-after (:v d))))
                 (d/entity db-before (:v d)))))))

(defn- move-missing-parents
  [conn tx-report]
  (when-let [parents (seq (missing-parents tx-report))]
    (let [recycle-page (ensure-recycle-page! conn)
          recycle-id (:db/id recycle-page)]
      (outliner-tx/transact!
       {:persist-op? true
        :gen-undo-ops? false
        :outliner-op :fix-missing-parent}
       (outliner-core/move-blocks! conn parents recycle-id {:sibling? false})))))

(defn- apply-remote-tx! [repo client tx-data]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (try
      (let [tx-report (ldb/transact! conn tx-data {:rtc-tx? true})
            db-after (:db-after tx-report)
            asset-uuids (asset-uuids-from-tx db-after (:tx-data tx-report))]
        (move-missing-parents conn tx-report)
        (when (seq asset-uuids)
          (enqueue-asset-downloads! repo client asset-uuids)))
      (catch :default e
        (log/error :db-sync/apply-remote-tx-failed {:error e})))
    (fail-fast :db-sync/missing-db {:repo repo :op :apply-remote-tx})))

(defn- reconcile-cycle! [repo attr server_values]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          tx-data (reduce
                   (fn [acc [eid value]]
                     (let [entity (d/entity db eid)
                           ;; FIXME: extends cardinality/many
                           current (:db/id (get entity attr))]
                       (cond
                         (nil? entity) acc
                         (nil? value)
                         (if current
                           (conj acc [:db/retract eid attr current])
                           acc)
                         :else
                         (conj acc [:db/add eid attr value]))))
                   []
                   server_values)]
      (log/info :db-sync/reconcile-cycle
                {:repo repo
                 :attr attr
                 :server-values (count server_values)
                 :tx-count (count tx-data)
                 :entity-titles (->> (keys server_values)
                                     (keep (fn [ref]
                                             (when-let [ent (d/entity db ref)]
                                               {:uuid (some-> (:block/uuid ent) str)
                                                :title (or (:block/title ent)
                                                           (:block/name ent))})))
                                     (take 10))})
      (when (seq tx-data)
        (ldb/transact! conn tx-data {:rtc-tx? true})))
    (fail-fast :db-sync/missing-db {:repo repo :op :reconcile-cycle})))

(defn- normalize-entity-ref
  [db entity]
  (cond
    (vector? entity) entity
    (number? entity) (when-let [ent (d/entity db entity)]
                       (cond
                         (:block/uuid ent) [:block/uuid (:block/uuid ent)]
                         (:db/ident ent) [:db/ident (:db/ident ent)]
                         :else nil))
    (uuid? entity) [:block/uuid entity]
    (keyword? entity) [:db/ident entity]
    :else nil))

(defn- strip-cycle-attrs
  [db tx-data {:keys [attr entity-refs]}]
  (let [entity-refs (set entity-refs)]
    (->> tx-data
         (mapcat
          (fn [tx]
            (cond
              (and (vector? tx) (= attr (nth tx 2 nil)))
              (let [entity (nth tx 1 nil)
                    entity-ref (normalize-entity-ref db entity)]
                (if (and entity-ref (contains? entity-refs entity-ref))
                  []
                  [tx]))

              (and (map? tx) (contains? tx attr))
              (let [entity (or (:db/id tx) (:block/uuid tx) (:db/ident tx))
                    entity-ref (normalize-entity-ref db entity)]
                (if (and entity-ref (contains? entity-refs entity-ref))
                  (let [tx' (dissoc tx attr)
                        meaningful (seq (dissoc tx' :db/id :block/uuid :db/ident))]
                    (if meaningful [tx'] []))
                  [tx]))

              :else
              [tx]))))))

(declare flush-pending!)
(declare remove-pending-txs!)
(declare persist-local-tx!)
(declare client-ops-conn)

(declare enqueue-asset-sync!)
(declare enqueue-asset-initial-download!)
(defn- pending-txs-by-ids
  [repo tx-ids]
  (if-let [conn (client-ops-conn repo)]
    (let [db @conn]
      (keep (fn [tx-id]
              (when-let [ent (d/entity db [:db-sync/tx-id tx-id])]
                (when-let [tx (:db-sync/tx ent)]
                  {:tx-id tx-id
                   :tx tx})))
            tx-ids))
    (fail-fast :db-sync/missing-db {:repo repo :op :pending-txs-by-ids})))

(defn- requeue-non-parent-txs!
  [repo attr server_values entries]
  (let [db (some-> (worker-state/get-datascript-conn repo) deref)
        entity-refs (when (seq server_values) (set (keys server_values)))
        scoped? (and db attr (seq entity-refs))
        requeued (volatile! 0)
        stripped (volatile! 0)]
    (if-not scoped?
      (fail-fast :db-sync/missing-field
                 {:repo repo
                  :has-db? (boolean db)
                  :attr attr
                  :server-values (count server_values)
                  :entries (count entries)})
      (do
        (doseq [{:keys [tx]} entries]
          (when (string? tx)
            (vswap! stripped inc)
            (let [tx-data (parse-transit tx {:repo repo :op :requeue-non-parent-txs})
                  filtered (strip-cycle-attrs db tx-data {:attr attr :entity-refs entity-refs})]
              (when (seq filtered)
                (vswap! requeued inc)
                (persist-local-tx! repo (sqlite-util/write-transit-str filtered))))))
        (log/info :db-sync/requeue-non-parent-txs
                  {:repo repo
                   :entries (count entries)
                   :stripped @stripped
                   :requeued @requeued})))))

(defn- cycle-entity-titles
  [repo server_values]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (->> (keys server_values)
           (keep (fn [ref]
                   (when-let [ent (d/entity db ref)]
                     {:uuid (some-> (:block/uuid ent) str)
                      :title (or (:block/title ent)
                                 (:block/name ent))})))
           (take 10)))
    (fail-fast :db-sync/missing-db {:repo repo :op :cycle-entity-titles})))

(defn- handle-message! [repo client raw]
  (let [message (-> raw parse-message coerce-ws-server-message)]
    (when-not (map? message)
      (fail-fast :db-sync/response-parse-failed {:repo repo :raw raw}))
    (let [local-tx (or (client-op/get-local-tx repo) 0)
          remote-tx (:t message)]
      (case (:type message)
        "hello" (do
                  (require-number remote-tx {:repo repo :type "hello"})
                  (when (> remote-tx local-tx)
                    (send! (:ws client) {:type "pull" :since local-tx}))
                  (enqueue-asset-sync! repo client)
                  (enqueue-asset-initial-download! repo client)
                  (flush-pending! repo client))
        ;; Upload response
        "tx/batch/ok" (do
                        (require-number remote-tx {:repo repo :type "tx/batch/ok"})
                        (client-op/update-local-tx repo remote-tx)
                        (remove-pending-txs! repo @(:inflight client))
                        (reset! (:inflight client) [])
                        (flush-pending! repo client))
        ;; Download response
        ;; Merge batch txs to one tx, does it really work? We'll see
        "pull/ok" (let [txs (:txs message)
                        _ (require-number remote-tx {:repo repo :type "pull/ok"})
                        _ (require-seq txs {:repo repo :type "pull/ok" :field :txs})
                        tx (mapcat (fn [data]
                                     (parse-transit (:tx data) {:repo repo :type "pull/ok"}))
                                   txs)]
                    (when tx
                      (apply-remote-tx! repo client tx)
                      (client-op/update-local-tx repo remote-tx)
                      (flush-pending! repo client)))
        "changed" (do
                    (require-number remote-tx {:repo repo :type "changed"})
                    (when (< local-tx remote-tx)
                      (send! (:ws client) {:type "pull" :since local-tx})))
        "tx/reject" (let [reason (:reason message)]
                      (when (nil? reason)
                        (fail-fast :db-sync/missing-field
                                   {:repo repo :type "tx/reject" :field :reason}))
                      (case reason
                        "stale"
                        (send! (:ws client) {:type "pull" :since local-tx})
                        "cycle"
                        (do
                          (when (nil? (:data message))
                            (fail-fast :db-sync/missing-field
                                       {:repo repo :type "tx/reject" :field :data}))
                          (let [{:keys [attr server_values]}
                                (parse-transit (:data message) {:repo repo :type "tx/reject"})]
                            (when (nil? attr)
                              (fail-fast :db-sync/missing-field
                                         {:repo repo :type "tx/reject" :field :attr}))
                            (when (nil? server_values)
                              (fail-fast :db-sync/missing-field
                                         {:repo repo :type "tx/reject" :field :server_values}))
                            ;; FIXME: fix cycle shouldn't re-trigger uploading
                            (let [inflight-ids @(:inflight client)
                                  inflight-entries (pending-txs-by-ids repo inflight-ids)]
                              (log/info :db-sync/tx-reject-cycle
                                        {:repo repo
                                         :attr attr
                                         :server-values (count server_values)
                                         :entity-titles (cycle-entity-titles repo server_values)
                                         :inflight-ids (count inflight-ids)
                                         :local-tx local-tx
                                         :remote-tx remote-tx})
                              (reconcile-cycle! repo attr server_values)
                              (remove-pending-txs! repo inflight-ids)
                              (reset! (:inflight client) [])
                              (requeue-non-parent-txs! repo attr server_values inflight-entries))
                            (flush-pending! repo client)))
                        (fail-fast :db-sync/invalid-field
                                   {:repo repo :type "tx/reject" :reason reason})))
        (fail-fast :db-sync/invalid-field
                   {:repo repo :type (:type message)})))))

(defn- ensure-client-state! [repo]
  (or (get @worker-state/*db-sync-clients repo)
      (let [client {:repo repo
                    :send-queue (atom (p/resolved nil))
                    :asset-queue (atom (p/resolved nil))
                    :inflight (atom [])
                    :reconnect (atom {:attempt 0 :timer nil})}]
        (swap! worker-state/*db-sync-clients assoc repo client)
        client)))

(defn- asset-url [base graph-id asset-uuid asset-type]
  (str base "/assets/" graph-id "/" asset-uuid "." asset-type))

(defn- enqueue-asset-task! [client task]
  (when-let [queue (:asset-queue client)]
    (swap! queue
           (fn [prev]
             (p/then prev (fn [_] (task)))))))

(defn- asset-type-from-files
  [repo asset-uuid]
  (p/let [paths (worker-state/<invoke-main-thread :thread-api/get-all-asset-file-paths repo)]
    (some (fn [path]
            (let [stem (path/file-stem path)
                  ext (path/file-ext path)]
              (when (and (seq stem) (seq ext) (= stem (str asset-uuid)))
                ext)))
          paths)))

(defn- delete-remote-asset!
  [repo graph-id asset-uuid asset-type]
  (let [base (http-base-url)]
    (if (and (seq base) (seq graph-id) (seq asset-type))
      (p/let [url (asset-url base graph-id (str asset-uuid) asset-type)
              opts (with-auth-headers {:method "DELETE"})
              resp (js/fetch url (clj->js opts))]
        (when-not (.-ok resp)
          (log/error :db-sync/asset-delete-failed {:repo repo
                                                   :asset-uuid asset-uuid
                                                   :status (.-status resp)})))
      (log/info :db-sync/asset-delete-skipped {:repo repo
                                               :asset-uuid asset-uuid
                                               :reason :missing-base-or-type}))))

(defn- upload-remote-asset!
  [repo graph-id asset-uuid asset-type checksum]
  (let [base (http-base-url)]
    (if (and (seq base) (seq graph-id) (seq asset-type) (seq checksum))
      (worker-state/<invoke-main-thread :thread-api/rtc-upload-asset
                                        repo nil (str asset-uuid) asset-type checksum
                                        (asset-url base graph-id (str asset-uuid) asset-type)
                                        {:extra-headers (auth-headers)})
      (p/rejected (ex-info "missing asset upload info"
                           {:repo repo
                            :asset-uuid asset-uuid
                            :asset-type asset-type
                            :checksum checksum
                            :base base
                            :graph-id graph-id})))))

(defn- download-remote-asset!
  [repo graph-id asset-uuid asset-type]
  (let [base (http-base-url)]
    (if (and (seq base) (seq graph-id) (seq asset-type))
      (worker-state/<invoke-main-thread :thread-api/rtc-download-asset
                                        repo nil (str asset-uuid) asset-type
                                        (asset-url base graph-id (str asset-uuid) asset-type)
                                        {:extra-headers (auth-headers)})
      (p/rejected (ex-info "missing asset download info"
                           {:repo repo
                            :asset-uuid asset-uuid
                            :asset-type asset-type
                            :base base
                            :graph-id graph-id})))))

(defn- process-asset-op!
  [repo graph-id asset-op]
  (let [asset-uuid (:block/uuid asset-op)]
    (cond
      (contains? asset-op :update-asset)
      (if-let [conn (worker-state/get-datascript-conn repo)]
        (let [ent (d/entity @conn [:block/uuid asset-uuid])
              asset-type (:logseq.property.asset/type ent)
              checksum (:logseq.property.asset/checksum ent)
              size (:logseq.property.asset/size ent 0)]
          (cond
            (or (nil? ent) (nil? asset-type) (nil? checksum))
            (do
              (client-op/remove-asset-op repo asset-uuid)
              (p/resolved nil))

            (> size max-asset-size)
            (do
              (log/info :db-sync/asset-too-large {:repo repo
                                                  :asset-uuid asset-uuid
                                                  :size size})
              (client-op/remove-asset-op repo asset-uuid)
              (p/resolved nil))

            :else
            (-> (upload-remote-asset! repo graph-id asset-uuid asset-type checksum)
                (p/then (fn [_]
                          (when (d/entity @conn [:block/uuid asset-uuid])
                            (ldb/transact!
                             conn
                             [{:block/uuid asset-uuid
                               :logseq.property.asset/remote-metadata {:checksum checksum :type asset-type}}]
                             {:persist-op? false}))
                          (client-op/remove-asset-op repo asset-uuid)))
                (p/catch (fn [e]
                           (case (:type (ex-data e))
                             :rtc.exception/read-asset-failed
                             (client-op/remove-asset-op repo asset-uuid)

                             :rtc.exception/upload-asset-failed
                             nil

                             (log/error :db-sync/asset-upload-failed
                                        {:repo repo
                                         :asset-uuid asset-uuid
                                         :error e})))))))
        (p/resolved nil))

      (contains? asset-op :remove-asset)
      (-> (p/let [conn (worker-state/get-datascript-conn repo)
                  ent (when conn (d/entity @conn [:block/uuid asset-uuid]))
                  asset-type (if (seq (:logseq.property.asset/type ent))
                               (:logseq.property.asset/type ent)
                               (asset-type-from-files repo asset-uuid))]
            (p/do!
             (when (seq asset-type)
               (delete-remote-asset! repo graph-id asset-uuid asset-type))
             (client-op/remove-asset-op repo asset-uuid)))
          (p/catch (fn [e]
                     (log/error :db-sync/asset-delete-failed
                                {:repo repo
                                 :asset-uuid asset-uuid
                                 :error e}))))

      :else
      (p/resolved nil))))

(defn- process-asset-ops!
  [repo client]
  (let [graph-id (:graph-id client)
        asset-ops (not-empty (client-op/get-all-asset-ops repo))]
    (if (and (seq graph-id) asset-ops)
      (p/loop [ops asset-ops]
        (if (empty? ops)
          nil
          (p/do!
           (process-asset-op! repo graph-id (first ops))
           (p/recur (rest ops)))))
      (p/resolved nil))))

(defn- enqueue-asset-sync! [repo client]
  (enqueue-asset-task! client #(process-asset-ops! repo client)))

(defn- enqueue-asset-downloads!
  [repo client asset-uuids]
  (when (seq asset-uuids)
    (enqueue-asset-task! client
                         (fn []
                           (let [graph-id (:graph-id client)]
                             (if (seq graph-id)
                               (p/loop [uuids (distinct asset-uuids)]
                                 (if (empty? uuids)
                                   nil
                                   (let [asset-uuid (first uuids)
                                         conn (worker-state/get-datascript-conn repo)
                                         ent (when conn (d/entity @conn [:block/uuid asset-uuid]))
                                         asset-type (:logseq.property.asset/type ent)]
                                     (p/do!
                                      (when (seq asset-type)
                                        (p/let [meta (worker-state/<invoke-main-thread
                                                      :thread-api/get-asset-file-metadata
                                                      repo (str asset-uuid) asset-type)]
                                          (when (nil? meta)
                                            (download-remote-asset! repo graph-id asset-uuid asset-type))))
                                      (p/recur (rest uuids))))))
                               (p/resolved nil)))))))

(defn- enqueue-asset-initial-download!
  [repo client]
  (enqueue-asset-task! client
                       (fn []
                         (if-let [conn (worker-state/get-datascript-conn repo)]
                           (let [db @conn
                                 graph-id (:graph-id client)
                                 remote-assets (d/q '[:find ?uuid ?type
                                                      :where
                                                      [?e :block/uuid ?uuid]
                                                      [?e :logseq.property.asset/type ?type]
                                                      [?e :logseq.property.asset/remote-metadata]]
                                                    db)]
                             (if (seq graph-id)
                               (-> (p/let [paths (worker-state/<invoke-main-thread
                                                  :thread-api/get-all-asset-file-paths
                                                  repo)]
                                     (let [local-uuids (into #{}
                                                             (keep (fn [path]
                                                                     (let [stem (path/file-stem path)]
                                                                       (when (seq stem)
                                                                         stem))))
                                                             paths)
                                           missing (remove (fn [[uuid _type]]
                                                             (contains? local-uuids (str uuid)))
                                                           remote-assets)]
                                       (p/loop [entries missing]
                                         (if (empty? entries)
                                           nil
                                           (let [[asset-uuid asset-type] (first entries)]
                                             (p/do!
                                              (download-remote-asset! repo graph-id asset-uuid asset-type)
                                              (p/recur (rest entries))))))))
                                   (p/catch (fn [e]
                                              (log/error :db-sync/asset-initial-download-failed
                                                         {:repo repo :error e}))))
                               (p/resolved nil)))
                           (p/resolved nil)))))

(defn- client-ops-conn [repo]
  (worker-state/get-client-ops-conn repo))

(defn- persist-local-tx! [repo tx-str]
  (when-let [conn (client-ops-conn repo)]
    (let [tx-id (random-uuid)
          now (.now js/Date)]
      (ldb/transact! conn [{:db-sync/tx-id tx-id
                            :db-sync/tx tx-str
                            :db-sync/created-at now}])
      tx-id)))

(defn- pending-txs
  [repo limit]
  (when-let [conn (client-ops-conn repo)]
    (let [db @conn
          datoms (d/datoms db :avet :db-sync/created-at)]
      (->> datoms
           (map (fn [datom]
                  (d/entity db (:e datom))))
           (keep (fn [ent]
                   (when-let [tx-id (:db-sync/tx-id ent)]
                     {:tx-id tx-id
                      :tx (:db-sync/tx ent)})))
           (take limit)
           (vec)))))

(defn- remove-pending-txs!
  [repo tx-ids]
  (when (seq tx-ids)
    (when-let [conn (client-ops-conn repo)]
      (ldb/transact! conn
                     (mapv (fn [tx-id]
                             [:db.fn/retractEntity [:db-sync/tx-id tx-id]])
                           tx-ids)))))

(defn- flush-pending!
  [repo client]
  (let [inflight @(:inflight client)]
    (when (empty? inflight)
      (when-let [ws (:ws client)]
        (when (ws-open? ws)
          (let [batch (pending-txs repo 50)]
            (when (seq batch)
              (let [tx-ids (mapv :tx-id batch)
                    txs (mapv :tx batch)]
                (when (seq txs)
                  (reset! (:inflight client) tx-ids)
                  (send! ws {:type "tx/batch"
                             :t_before (or (client-op/get-local-tx repo) 0)
                             :txs txs}))))))))))

(declare connect!)

(defn- schedule-reconnect! [repo client url reason]
  (when (enabled?)
    (when-let [reconnect (:reconnect client)]
      (let [{:keys [attempt timer]} @reconnect]
        (when (nil? timer)
          (let [delay (reconnect-delay-ms attempt)
                timeout-id (js/setTimeout
                            (fn []
                              (swap! reconnect assoc :timer nil)
                              (when (enabled?)
                                (when-let [current (get @worker-state/*db-sync-clients repo)]
                                  (when (= (:graph-id current) (:graph-id client))
                                    (let [updated (connect! repo current url)]
                                      (swap! worker-state/*db-sync-clients assoc repo updated))))))
                            delay)]
            (swap! reconnect assoc :timer timeout-id :attempt (inc attempt))
            (log/info :db-sync/ws-reconnect-scheduled
                      {:repo repo :delay delay :attempt attempt :reason reason})))))))

(defn- attach-ws-handlers! [repo client ws url]
  (set! (.-onmessage ws)
        (fn [event]
          (handle-message! repo client (.-data event))))
  (set! (.-onerror ws)
        (fn [event]
          (log/error :db-sync/ws-error {:repo repo :error event})))
  (set! (.-onclose ws)
        (fn [_]
          (log/info :db-sync/ws-closed {:repo repo})
          (schedule-reconnect! repo client url :close))))

(defn- start-pull-loop! [client _ws]
  client)

(defn- stop-client! [client]
  (when-let [reconnect (:reconnect client)]
    (clear-reconnect-timer! reconnect))
  (when-let [ws (:ws client)]
    (try
      (.close ws)
      (catch :default _
        nil))))

(defn- connect! [repo client url]
  (let [ws (js/WebSocket. (append-token url (auth-token)))
        updated (assoc client :ws ws)]
    (attach-ws-handlers! repo updated ws url)
    (set! (.-onopen ws)
          (fn [_]
            (reset-reconnect! updated)
            (send! ws {:type "hello" :client repo})
            (enqueue-asset-sync! repo updated)
            (enqueue-asset-initial-download! repo updated)))
    (start-pull-loop! updated ws)))

(defn stop!
  ([]
   (doseq [[repo client] @worker-state/*db-sync-clients]
     (stop-client! client)
     (swap! worker-state/*db-sync-clients dissoc repo))
   (p/resolved nil))
  ([repo]
   (when-let [client (get @worker-state/*db-sync-clients repo)]
     (stop-client! client)
     (swap! worker-state/*db-sync-clients dissoc repo))
   (p/resolved nil)))

(defn start!
  [repo]
  (if-not (enabled?)
    (p/resolved nil)
    (p/do!
     (stop!)
     (let [base (ws-base-url)
           graph-id (get-graph-id repo)]
       (if (and (string? base) (seq base) (seq graph-id))
         (let [client (ensure-client-state! repo)
               url (format-ws-url base graph-id)
               _ (ensure-client-graph-uuid! repo graph-id)
               connected (assoc client :graph-id graph-id)
               connected (connect! repo connected url)]
           (swap! worker-state/*db-sync-clients assoc repo connected)
           (p/resolved nil))
         (do
           (log/info :db-sync/start-skipped {:repo repo :graph-id graph-id :base base})
           (p/resolved nil)))))))

(defn enqueue-local-tx!
  [repo {:keys [tx-data db-after db-before]}]
  (let [conn (worker-state/get-datascript-conn repo)
        db (some-> conn deref)
        ;; FIXME: all ignored properties
        tx-data' (remove (fn [d] (contains? #{:logseq.property.embedding/hnsw-label-updated-at :block/tx-id} (:a d))) tx-data)]
    (when (and db (seq tx-data'))
      (let [normalized (normalize-tx-data db-after db-before tx-data')
            tx-str (sqlite-util/write-transit-str normalized)]
        (persist-local-tx! repo tx-str)
        (when-let [client (get @worker-state/*db-sync-clients repo)]
          (let [send-queue (:send-queue client)]
            (swap! send-queue
                   (fn [prev]
                     (p/then prev
                             (fn [_]
                               (when-let [ws (:ws (get @worker-state/*db-sync-clients repo))]
                                 (when (ws-open? ws)
                                   (flush-pending! repo client)))))))))))))

(defn handle-local-tx!
  [repo {:keys [tx-data tx-meta] :as tx-report}]
  (when (and (enabled?) (seq tx-data) (not (:rtc-tx? tx-meta)))
    (enqueue-local-tx! repo tx-report)
    (let [client (get @worker-state/*db-sync-clients repo)]
      (enqueue-asset-sync! repo client))))

(defn- fetch-kvs-rows
  [db last-addr limit]
  (.exec db #js {:sql "select addr, content, addresses from kvs where addr > ? order by addr asc limit ?"
                 :bind #js [last-addr limit]
                 :rowMode "array"}))

(defn- normalize-snapshot-rows [rows]
  (mapv (fn [row] (vec row)) (array-seq rows)))

(defn upload-graph!
  [repo]
  (let [base (http-base-url)
        graph-id (get-graph-id repo)]
    (if-not (and (seq base) (seq graph-id))
      (p/rejected (ex-info "db-sync missing upload info"
                           {:repo repo :base base :graph-id graph-id}))
      (if-let [db (worker-state/get-sqlite-conn repo :db)]
        (do
          (ensure-client-graph-uuid! repo graph-id)
          (p/loop [last-addr -1
                   first-batch? true]
            (let [rows (fetch-kvs-rows db last-addr upload-kvs-batch-size)]
              (if (empty? rows)
                (let [body (coerce-http-request :sync/snapshot-import {:reset false :rows []})]
                  (if (nil? body)
                    (p/rejected (ex-info "db-sync invalid snapshot body"
                                         {:repo repo :graph-id graph-id}))
                    (p/let [_ (fetch-json (str base "/sync/" graph-id "/snapshot/import")
                                          {:method "POST"
                                           :headers {"content-type" "application/json"}
                                           :body (js/JSON.stringify (clj->js body))}
                                          {:response-schema :sync/snapshot-import})]
                      (client-op/add-all-exists-asset-as-ops repo)
                      {:graph-id graph-id})))
                (let [max-addr (apply max (map first rows))
                      rows (normalize-snapshot-rows rows)
                      body (coerce-http-request :sync/snapshot-import {:reset first-batch?
                                                                       :rows rows})]
                  (if (nil? body)
                    (p/rejected (ex-info "db-sync invalid snapshot body"
                                         {:repo repo :graph-id graph-id}))
                    (p/let [_ (fetch-json (str base "/sync/" graph-id "/snapshot/import")
                                          {:method "POST"
                                           :headers {"content-type" "application/json"}
                                           :body (js/JSON.stringify (clj->js body))}
                                          {:response-schema :sync/snapshot-import})]
                      (p/recur max-addr false))))))))
        (p/rejected (ex-info "db-sync missing sqlite db"
                             {:repo repo :graph-id graph-id}))))))
