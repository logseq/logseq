(ns frontend.worker.db-sync
  "Simple db-sync client based on promesa + WebSocket."
  (:require [clojure.data :as data]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db-sync.cycle :as sync-cycle]
            [logseq.db-sync.malli-schema :as db-sync-schema]
            [logseq.db-sync.order :as sync-order]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.transaction :as outliner-tx]
            [promesa.core :as p]))

(defonce *repo->latest-remote-tx (atom {}))

(defn- current-client
  [repo]
  (let [client @worker-state/*db-sync-client]
    (when (= repo (:repo client))
      client)))

(defn- client-ops-conn [repo]
  (worker-state/get-client-ops-conn repo))

(defn- sync-counts
  [repo]
  (let [pending-local (when-let [conn (client-ops-conn repo)]
                        (count (d/datoms @conn :avet :db-sync/created-at)))
        pending-asset (client-op/get-unpushed-asset-ops-count repo)
        local-tx (client-op/get-local-tx repo)
        remote-tx (get @*repo->latest-remote-tx repo)
        pending-server (when (and (number? local-tx) (number? remote-tx))
                         (max 0 (- remote-tx local-tx)))
        graph-uuid (client-op/get-graph-uuid repo)]
    {:pending-local pending-local
     :pending-asset pending-asset
     :pending-server pending-server
     :local-tx local-tx
     :remote-tx remote-tx
     :graph-uuid graph-uuid}))

(defn- normalize-online-users
  [users]
  (->> users
       (keep (fn [{:keys [user-id email username name editing-block-uuid]}]
               (when (string? user-id)
                 (let [display-name (or username name user-id)]
                   (cond-> {:user/uuid user-id
                            :user/name display-name}
                     (string? email) (assoc :user/email email)
                     (and (string? editing-block-uuid)
                          (not (string/blank? editing-block-uuid)))
                     (assoc :user/editing-block-uuid editing-block-uuid))))))
       (vec)))

(defn- broadcast-rtc-state!
  [client]
  (when client
    (let [repo (:repo client)
          ws-state @(:ws-state client)
          online-users @(:online-users client)
          {:keys [pending-local pending-asset pending-server local-tx remote-tx graph-uuid]} (sync-counts repo)]
      (shared-service/broadcast-to-clients!
       :rtc-sync-state
       {:rtc-state {:ws-state ws-state}
        :rtc-lock (= :open ws-state)
        :online-users (or online-users [])
        :unpushed-block-update-count (or pending-local 0)
        :pending-asset-ops-count (or pending-asset 0)
        :pending-server-ops-count (or pending-server 0)
        :local-tx local-tx
        :remote-tx remote-tx
        :graph-uuid graph-uuid}))))

(defn- set-ws-state!
  [client ws-state]
  (when-let [*ws-state (:ws-state client)]
    (reset! *ws-state ws-state)
    (broadcast-rtc-state! client)))

(defn- update-online-users!
  [client users]
  (when-let [*online-users (:online-users client)]
    (reset! *online-users (normalize-online-users users))
    (broadcast-rtc-state! client)))

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

(defn- require-non-negative [value context]
  (require-number value context)
  (when (neg? value)
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

(defn update-presence!
  [editing-block-uuid]
  (when-let [client @worker-state/*db-sync-client]
    (when-let [ws (:ws client)]
      (send! ws {:type "presence"
                 :editing-block-uuid editing-block-uuid}))))

(defn- remove-ignored-attrs
  [tx-data]
  (remove (fn [d] (contains? #{:logseq.property.embedding/hnsw-label-updated-at
                               :block/tx-id
                               ;; FIXME: created-by-ref maybe not exist yet on server or client
                               :logseq.property/created-by-ref} (:a d)))
          tx-data))

(defn- normalize-tx-data
  [db-after db-before tx-data]
  (->> tx-data
       remove-ignored-attrs
       (db-normalize/normalize-tx-data db-after db-before)))

(defn- reverse-tx-data
  [tx-data]
  (->> tx-data
       (map (fn [[e a v t added]]
              [(if added :db/retract :db/add) e a v t]))))

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

(defn- require-asset-field
  [repo field value context]
  (when (or (nil? value) (and (string? value) (string/blank? value)))
    (fail-fast :db-sync/missing-field
               (merge {:repo repo :field field :value value} context))))

(defn- asset-uuids-from-tx [db tx-data]
  (->> tx-data
       (keep (fn [datom]
               (when (and (:added datom)
                          (= :logseq.property.asset/size (:a datom)))
                 (when-let [ent (d/entity db (:e datom))]
                   (:block/uuid ent)))))
       (distinct)))

(defn- persist-local-tx! [repo normalized-tx-data reversed-datoms _tx-meta]
  (when-let [conn (client-ops-conn repo)]
    (let [tx-id (random-uuid)
          now (.now js/Date)]
      (ldb/transact! conn [{:db-sync/tx-id tx-id
                            :db-sync/normalized-tx-data normalized-tx-data
                            :db-sync/reversed-tx-data reversed-datoms
                            :db-sync/created-at now}])
      (when-let [client (current-client repo)]
        (broadcast-rtc-state! client))
      tx-id)))

(defn- pending-txs
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
                      :tx (:db-sync/normalized-tx-data ent)
                      :reversed-tx (:db-sync/reversed-tx-data ent)})))
           vec))))

(defn- remove-pending-txs!
  [repo tx-ids]
  (when (seq tx-ids)
    (when-let [conn (client-ops-conn repo)]
      (ldb/transact! conn
                     (mapv (fn [tx-id]
                             [:db/retractEntity [:db-sync/tx-id tx-id]])
                           tx-ids))
      (when-let [client (current-client repo)]
        (broadcast-rtc-state! client)))))

(defn get-lookup-id
  [x]
  (when (and (vector? x)
             (= 2 (count x))
             (= :block/uuid (first x)))
    (second x)))

(defn- keep-last-update
  [tx-data]
  (->> tx-data
       (common-util/distinct-by-last-wins
        (fn [item]
          (if (and (vector? item) (= 5 (count item))
                   (contains? #{:block/updated-at :block/title :block/name :block/order} (nth item 2)))
            (take 3 item)
            item)))))

(defn- sanitize-tx-data
  [db tx-data local-deleted-ids]
  (let [sanitized-tx-data (->> tx-data
                               (db-normalize/replace-attr-retract-with-retract-entity-v2 db)
                               (remove (fn [item]
                                         (or (= :db/retractEntity (first item))
                                             (contains? local-deleted-ids (get-lookup-id (last item))))))
                               keep-last-update)]
    ;; (when (not= tx-data sanitized-tx-data)
    ;;   (prn :debug :tx-data tx-data)
    ;;   (prn :debug :sanitized-tx-data sanitized-tx-data))
    sanitized-tx-data))

(defn- flush-pending!
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
                (let [tx-ids (mapv :tx-id batch)
                      txs (mapcat :tx batch)
                      tx-data (->> txs
                                   (db-normalize/remove-retract-entity-ref @conn)
                                   keep-last-update
                                   distinct)]
                  ;; (prn :debug :before-keep-last-update txs)
                  ;; (prn :debug :upload :tx-data tx-data)
                  (when (seq txs)
                    (reset! (:inflight client) tx-ids)
                    (send! ws {:type "tx/batch"
                               :t-before local-tx
                               :txs (sqlite-util/write-transit-str tx-data)})))))))))))

(defn- ensure-client-state! [repo]
  (let [client {:repo repo
                :send-queue (atom (p/resolved nil))
                :asset-queue (atom (p/resolved nil))
                :inflight (atom [])
                :reconnect (atom {:attempt 0 :timer nil})
                :online-users (atom [])
                :ws-state (atom :closed)}]
    (reset! worker-state/*db-sync-client client)
    client))

(defn- asset-url [base graph-id asset-uuid asset-type]
  (str base "/assets/" graph-id "/" asset-uuid "." asset-type))

(defn- enqueue-asset-task! [client task]
  (when-let [queue (:asset-queue client)]
    (swap! queue
           (fn [prev]
             (p/then prev (fn [_] (task)))))))

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
  (let [asset-uuid (:block/uuid asset-op)
        op-type (cond
                  (contains? asset-op :update-asset) :update-asset
                  (contains? asset-op :remove-asset) :remove-asset
                  :else :unknown)]
    (require-asset-field repo :asset-uuid asset-uuid {:op op-type})
    (cond
      (contains? asset-op :update-asset)
      (if-let [conn (worker-state/get-datascript-conn repo)]
        (let [ent (d/entity @conn [:block/uuid asset-uuid])
              asset-type (:logseq.property.asset/type ent)
              checksum (:logseq.property.asset/checksum ent)
              size (:logseq.property.asset/size ent 0)]
          (require-asset-field repo :asset-type asset-type {:op :update-asset :asset-uuid asset-uuid})
          (require-asset-field repo :checksum checksum {:op :update-asset
                                                        :asset-uuid asset-uuid
                                                        :asset-type asset-type})
          (cond
            (> size max-asset-size)
            (do
              (log/info :db-sync/asset-too-large {:repo repo
                                                  :asset-uuid asset-uuid
                                                  :size size})
              (client-op/remove-asset-op repo asset-uuid)
              (when-let [client (current-client repo)]
                (broadcast-rtc-state! client))
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
                          (client-op/remove-asset-op repo asset-uuid)
                          (when-let [client (current-client repo)]
                            (broadcast-rtc-state! client))))
                (p/catch (fn [e]
                           (case (:type (ex-data e))
                             :rtc.exception/read-asset-failed
                             (do
                               (client-op/remove-asset-op repo asset-uuid)
                               (when-let [client (current-client repo)]
                                 (broadcast-rtc-state! client)))

                             :rtc.exception/upload-asset-failed
                             nil

                             (log/error :db-sync/asset-upload-failed
                                        {:repo repo
                                         :asset-uuid asset-uuid
                                         :error e})))))))
        (fail-fast :db-sync/missing-db {:repo repo :op :process-asset-op}))

      (contains? asset-op :remove-asset)
      (-> (client-op/remove-asset-op repo asset-uuid)
          (p/then (fn [_]
                    (when-let [client (current-client repo)]
                      (broadcast-rtc-state! client))))
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

(defn- get-local-deleted-blocks
  [reversed-tx-report reversed-tx-data]
  (when (seq reversed-tx-data)
    (->>
     (:tx-data reversed-tx-report)
     (keep
      (fn [[e a v _t added]]
        (when (and (= :block/uuid a) added
                   (nil? (d/entity (:db-before reversed-tx-report)
                                   [:block/uuid v])))
          (d/entity (:db-after reversed-tx-report) e))))
     distinct)))

(defn- delete-nodes!
  [temp-conn deleted-nodes tx-meta]
  (when (seq deleted-nodes)
    (let [pages (filter ldb/page? deleted-nodes)
          blocks (->> deleted-nodes
                      (keep (fn [block]
                              (d/entity @temp-conn [:block/uuid (:block/uuid block)])))
                      (remove ldb/page?))]
      (when (or (seq blocks) (seq pages))
        (outliner-tx/transact!
         (merge tx-meta
                {:outliner-op :delete-blocks
                 :transact-opts {:conn temp-conn}})
         (when (seq blocks)
           (outliner-core/delete-blocks! temp-conn blocks {}))
         (doseq [page pages]
           (worker-page/delete! temp-conn (:block/uuid page) {})))))))

(defn- fix-tx!
  [temp-conn remote-tx-report rebase-tx-report tx-meta]
  (let [cycle-tx-report (sync-cycle/fix-cycle! temp-conn remote-tx-report rebase-tx-report
                                               {:tx-meta tx-meta})]
    (sync-order/fix-duplicate-orders! temp-conn
                                      (mapcat :tx-data [remote-tx-report
                                                        rebase-tx-report
                                                        cycle-tx-report])
                                      tx-meta)))

(defn- get-reverse-tx-data
  [local-txs]
  (let [tx-data (->> local-txs
                     reverse
                     (mapcat :reversed-tx))
        retract-block-ids (->> (keep (fn [[op e a _v _t]]
                                       (when (and (= op :db/retract) (= :block/uuid a))
                                         e)) tx-data)
                               set)
        tx-data' (if (seq retract-block-ids)
                   (remove (fn [[_op e _a v]]
                             (or (contains? retract-block-ids e)
                                 (contains? retract-block-ids v)))
                           tx-data)
                   tx-data)]

    (->>
     tx-data'
     (concat (map (fn [id] [:db/retractEntity id]) retract-block-ids))
     keep-last-update)))

(defn- apply-remote-tx!
  [repo client tx-data* & {:keys [local-tx remote-tx]}]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (let [tx-data (->> tx-data*
                       (db-normalize/remove-retract-entity-ref @conn)
                       keep-last-update)
          local-txs (pending-txs repo)
          reversed-tx-data (get-reverse-tx-data local-txs)
          has-local-changes? (seq reversed-tx-data)
          *remote-tx-report (atom nil)
          *reversed-tx-report (atom nil)
          *remote-deleted-ids (atom #{})
          *rebase-tx-data (atom [])
          tx-report
          (if has-local-changes?
            (ldb/transact-with-temp-conn!
             conn
             {:rtc-tx? true}
             (fn [temp-conn _*batch-tx-data]
               (let [tx-meta {:rtc-tx? true
                              :temp-conn? true
                              :gen-undo-ops? false
                              :persist-op? false}
                     db @temp-conn
                     reversed-tx-report (ldb/transact! temp-conn reversed-tx-data (assoc tx-meta :op :reverse))
                     _ (reset! *reversed-tx-report reversed-tx-report)
                     ;; 2. transact remote tx-data
                     remote-deleted-blocks (->> tx-data
                                                (keep (fn [item]
                                                        (when (= :db/retractEntity (first item))
                                                          (d/entity db (second item))))))
                     remote-deleted-block-ids (set (map :block/uuid remote-deleted-blocks))
                     remote-tx-report (let [tx-meta (assoc tx-meta :op :transact-remote-tx-data)
                                            tx-data (->> tx-data
                                                         (remove (fn [item]
                                                                   (or (= :db/retractEntity (first item))
                                                                       (contains? remote-deleted-block-ids (get-lookup-id (last item))))))
                                                         seq)]
                                        (ldb/transact! temp-conn tx-data tx-meta))
                     _ (reset! *remote-tx-report remote-tx-report)]
                 (let [local-deleted-blocks (get-local-deleted-blocks reversed-tx-report reversed-tx-data)
                       _ (when (seq remote-deleted-blocks)
                           (reset! *remote-deleted-ids (set (map :block/uuid remote-deleted-blocks))))
                       ;; _ (prn :debug
                       ;;        :local-deleted-blocks (map (fn [b] (select-keys b [:db/id :block/title])) local-deleted-blocks)
                       ;;        :remote-deleted-blocks remote-deleted-blocks)
                       deleted-nodes (concat local-deleted-blocks remote-deleted-blocks)
                       deleted-ids (set (keep :block/uuid deleted-nodes))
                       ;; 3. rebase pending local txs
                       rebase-tx-report (when (seq local-txs)
                                          (let [pending-tx-data (mapcat :tx local-txs)
                                                rebased-tx-data (sanitize-tx-data
                                                                 (or (:db-after remote-tx-report)
                                                                     (:db-after reversed-tx-report))
                                                                 pending-tx-data
                                                                 (set (map :block/uuid local-deleted-blocks)))]
                                            ;; (prn :debug :pending-tx-data pending-tx-data)
                                            ;; (prn :debug :rebased-tx-data rebased-tx-data)
                                            (when (seq rebased-tx-data)
                                              (ldb/transact! temp-conn rebased-tx-data (assoc tx-meta :op :rebase)))))
                       ;; 4. fix tx data
                       db @temp-conn
                       deleted-nodes (keep (fn [id] (d/entity db [:block/uuid id])) deleted-ids)]
                   (delete-nodes! temp-conn deleted-nodes (assoc tx-meta :op :delete-blocks))
                   (fix-tx! temp-conn remote-tx-report rebase-tx-report (assoc tx-meta :op :fix)))))
             {:listen-db (fn [{:keys [tx-meta tx-data]}]
                           (when-not (contains? #{:reverse :transact-remote-tx-data} (:op tx-meta))
                             (swap! *rebase-tx-data into tx-data)))})
            (ldb/transact! conn tx-data {:rtc-tx? true}))
          remote-tx-report @*remote-tx-report]

      ;; persist rebase tx to client ops
      (when has-local-changes?
        (when-let [tx-data (seq @*rebase-tx-data)]
          (let [remote-tx-data-set (set tx-data*)
                normalized (->> tx-data
                                (normalize-tx-data (:db-after tx-report)
                                                   (or (:db-after remote-tx-report)
                                                       (:db-after @*reversed-tx-report)))
                                keep-last-update
                                (remove (fn [[op _e a]]
                                          (and (= op :db/retract)
                                               (contains? #{:block/updated-at :block/created-at :block/title} a)))))
                normalized-tx-data (remove remote-tx-data-set normalized)
                reversed-datoms (reverse-tx-data tx-data)]
            ;; (prn :debug :normalized-tx-data normalized-tx-data)
            ;; (prn :debug :remote-tx-data remote-tx-data-set)
            ;; (prn :debug :diff (data/diff remote-tx-data-set
            ;;                              (set normalized)))
            (when (seq normalized-tx-data)
              (persist-local-tx! repo normalized-tx-data reversed-datoms {:op :rtc-rebase}))))
        (remove-pending-txs! repo (map :tx-id local-txs)))

      (when tx-report
        (let [asset-uuids (asset-uuids-from-tx (:db-after remote-tx-report) (:tx-data remote-tx-report))]
          (when (seq asset-uuids)
            (enqueue-asset-downloads! repo client asset-uuids))))

      (when-let [*inflight (:inflight client)]
        (reset! *inflight []))

      (reset! *remote-tx-report nil))
    (fail-fast :db-sync/missing-db {:repo repo :op :apply-remote-tx})))

(defn- handle-message! [repo client raw]
  (let [message (-> raw parse-message coerce-ws-server-message)]
    (when-not (map? message)
      (fail-fast :db-sync/response-parse-failed {:repo repo :raw raw}))
    (let [local-tx (or (client-op/get-local-tx repo) 0)
          remote-tx (:t message)]
      (when remote-tx (swap! *repo->latest-remote-tx assoc repo remote-tx))

      (case (:type message)
        "hello" (do
                  (require-non-negative remote-tx {:repo repo :type "hello"})
                  (broadcast-rtc-state! client)
                  (when (> remote-tx local-tx)
                    (send! (:ws client) {:type "pull" :since local-tx}))
                  (enqueue-asset-sync! repo client)
                  (enqueue-asset-initial-download! repo client)
                  (flush-pending! repo client))
        "online-users" (let [users (:online-users message)]
                         (when (and (some? users) (not (sequential? users)))
                           (fail-fast :db-sync/invalid-field
                                      {:repo repo :type "online-users" :field :online-users}))
                         (update-online-users! client (or users [])))
        ;; Upload response
        "tx/batch/ok" (do
                        (require-non-negative remote-tx {:repo repo :type "tx/batch/ok"})
                        (client-op/update-local-tx repo remote-tx)
                        (broadcast-rtc-state! client)
                        (remove-pending-txs! repo @(:inflight client))
                        (reset! (:inflight client) [])
                        (flush-pending! repo client))
        ;; Download response
        ;; Merge batch txs to one tx, does it really work? We'll see
        "pull/ok" (when-not (= local-tx remote-tx)
                    (let [txs (:txs message)
                          _ (require-non-negative remote-tx {:repo repo :type "pull/ok"})
                          _ (require-seq txs {:repo repo :type "pull/ok" :field :txs})
                          txs-data (mapv (fn [data]
                                           (parse-transit (:tx data) {:repo repo :type "pull/ok"}))
                                         txs)
                          tx (distinct (mapcat identity txs-data))]
                      (when (seq tx)
                        (apply-remote-tx! repo client tx
                                          :local-tx local-tx
                                          :remote-tx remote-tx)
                        (client-op/update-local-tx repo remote-tx)
                        (broadcast-rtc-state! client)
                        (flush-pending! repo client))))
        "changed" (do
                    (require-non-negative remote-tx {:repo repo :type "changed"})
                    (broadcast-rtc-state! client)
                    (when (< local-tx remote-tx)
                      (send! (:ws client) {:type "pull" :since local-tx})))
        "tx/reject" (let [reason (:reason message)]
                      (when (nil? reason)
                        (fail-fast :db-sync/missing-field
                                   {:repo repo :type "tx/reject" :field :reason}))
                      (when (contains? message :t)
                        (require-non-negative remote-tx {:repo repo :type "tx/reject"}))
                      (case reason
                        "stale"
                        (send! (:ws client) {:type "pull" :since local-tx})

                        (fail-fast :db-sync/invalid-field
                                   {:repo repo :type "tx/reject" :reason reason})))
        (fail-fast :db-sync/invalid-field
                   {:repo repo :type (:type message)})))))

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
                                (when-let [current @worker-state/*db-sync-client]
                                  (when (and (= (:repo current) repo)
                                             (= (:graph-id current) (:graph-id client)))
                                    (let [updated (connect! repo current url)]
                                      (reset! worker-state/*db-sync-client updated))))))
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
          (update-online-users! client [])
          (set-ws-state! client :closed)
          (schedule-reconnect! repo client url :close))))

(defn- detach-ws-handlers! [ws]
  (set! (.-onopen ws) nil)
  (set! (.-onmessage ws) nil)
  (set! (.-onerror ws) nil)
  (set! (.-onclose ws) nil))

(defn- start-pull-loop! [client _ws]
  client)

(defn- stop-client! [client]
  (when-let [reconnect (:reconnect client)]
    (clear-reconnect-timer! reconnect))
  (when-let [ws (:ws client)]
    (detach-ws-handlers! ws)
    (update-online-users! client [])
    (set-ws-state! client :closed)
    (try
      (.close ws)
      (catch :default _
        nil))))

(defn- connect! [repo client url]
  (when (:ws client)
    (stop-client! client))
  (let [ws (js/WebSocket. (append-token url (auth-token)))
        updated (assoc client :ws ws)]
    (attach-ws-handlers! repo updated ws url)
    (set! (.-onopen ws)
          (fn [_]
            (reset-reconnect! updated)
            (set-ws-state! updated :open)
            (send! ws {:type "hello" :client repo})
            (enqueue-asset-sync! repo updated)
            (enqueue-asset-initial-download! repo updated)))
    (start-pull-loop! updated ws)))

(defn stop!
  []
  (when-let [client @worker-state/*db-sync-client]
    (stop-client! client)
    (reset! worker-state/*db-sync-client nil))
  (p/resolved nil))

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
           (reset! worker-state/*db-sync-client connected)
           (p/resolved nil))
         (do
           (log/info :db-sync/start-skipped {:repo repo :graph-id graph-id :base base})
           (p/resolved nil)))))))

(defn enqueue-local-tx!
  [repo {:keys [tx-meta tx-data db-after db-before]}]
  (when-not (:rtc-tx? tx-meta)
    (let [conn (worker-state/get-datascript-conn repo)
          db (some-> conn deref)
        ;; FIXME: all ignored properties
          tx-data' (remove (fn [d] (contains? #{:logseq.property.embedding/hnsw-label-updated-at :block/tx-id} (:a d))) tx-data)]
      (when (and db (seq tx-data'))
        (let [normalized (normalize-tx-data db-after db-before tx-data')
              reversed-datoms (reverse-tx-data tx-data)]
        ;; (prn :debug :tx-data tx-data'
        ;;      :normalized (normalize-tx-data db-after db-before tx-data'))
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
                                           (flush-pending! repo current)))))))))))))))))

(defn handle-local-tx!
  [repo {:keys [tx-data tx-meta] :as tx-report}]
  (when (and (enabled?) (seq tx-data)
             (not (:rtc-tx? tx-meta))
             (:persist-op? tx-meta true))
    (enqueue-local-tx! repo tx-report)
    (when-let [client @worker-state/*db-sync-client]
      (when (= repo (:repo client))
        (enqueue-asset-sync! repo client)))))

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
