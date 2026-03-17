(ns frontend.worker.sync.handle-message
  "WebSocket message handlers for db sync."
  (:require [datascript.core :as d]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.sync.assets :as sync-assets]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.presence :as sync-presence]
            [frontend.worker.sync.transport :as sync-transport]
            [lambdaisland.glogi :as log]
            [logseq.db-sync.checksum :as sync-checksum]
            [promesa.core :as p]))

(defn- fail-fast
  [tag data]
  (log/error tag data)
  (throw (ex-info (name tag) data)))

(defn- client-ops-conn
  [repo]
  (sync-presence/client-ops-conn worker-state/get-client-ops-conn repo))

(defn- sync-counts
  [repo]
  (sync-presence/sync-counts
   {:get-datascript-conn worker-state/get-datascript-conn
    :get-client-ops-conn worker-state/get-client-ops-conn
    :get-unpushed-asset-ops-count client-op/get-unpushed-asset-ops-count
    :get-local-tx client-op/get-local-tx
    :get-graph-uuid client-op/get-graph-uuid
    :latest-remote-tx @sync-apply/*repo->latest-remote-tx}
   repo))

(defn- broadcast-rtc-state!
  [client]
  (when client
    (shared-service/broadcast-to-clients!
     :rtc-sync-state
     (sync-presence/rtc-state-payload sync-counts client))))

(defn- update-online-users!
  [client users]
  (sync-presence/update-online-users! broadcast-rtc-state! client users))

(defn- update-user-presence!
  [client user-id* editing-block-uuid]
  (sync-presence/update-user-presence! broadcast-rtc-state! client user-id* editing-block-uuid))

(defn- get-user-uuid
  []
  (sync-auth/get-user-uuid (worker-state/get-id-token)))

(defn- send!
  [ws message]
  (sync-transport/send! sync-transport/coerce-ws-client-message ws message))

(defn- ws-open?
  [ws]
  (sync-transport/ws-open? ws))

(defn- enqueue-asset-task!
  [client task]
  (when-let [queue (:asset-queue client)]
    (swap! queue
           (fn [prev]
             (p/then prev (fn [_] (task)))))))

(defn- current-client
  [repo]
  (sync-presence/current-client worker-state/*db-sync-client repo))

(defn- require-number
  [value context]
  (when-not (number? value)
    (fail-fast :db-sync/invalid-field (assoc context :value value))))

(defn- require-non-negative
  [value context]
  (require-number value context)
  (when (neg? value)
    (fail-fast :db-sync/invalid-field (assoc context :value value))))

(defn- require-seq
  [value context]
  (when-not (sequential? value)
    (fail-fast :db-sync/invalid-field (assoc context :value value))))

(defn- parse-transit
  [value context]
  (sync-transport/parse-transit fail-fast value context))

(defn- pending-local-tx?
  [repo]
  (when-let [conn (client-ops-conn repo)]
    (boolean (first (d/datoms @conn :avet :db-sync/created-at)))))

(defn- checksum-compare-ready?
  [repo client local-t remote-t]
  (and (= local-t remote-t)
       (not (pending-local-tx? repo))
       (empty? @(:inflight client))))

(defn- local-sync-checksum
  [repo]
  (if-let [checksum (client-op/get-local-checksum repo)]
    checksum
    (if-let [conn (worker-state/get-datascript-conn repo)]
      (let [checksum (sync-checksum/recompute-checksum @conn)]
        (client-op/update-local-checksum repo checksum)
        checksum)
      (fail-fast :db-sync/missing-db {:repo repo :op :checksum}))))

(defn- verify-sync-checksum!
  [repo client local-tx remote-tx remote-checksum context]
  (when (and (not (sync-crypt/graph-e2ee? repo))
             (string? remote-checksum)
             (checksum-compare-ready? repo client local-tx remote-tx))
    (let [local-checksum (local-sync-checksum repo)]
      (when-not (= local-checksum remote-checksum)
        (fail-fast :db-sync/checksum-mismatch
                   (merge context
                          {:type :db-sync/checksum-mismatch
                           :repo repo
                           :message-type (:type context)
                           :local-tx local-tx
                           :remote-tx remote-tx
                           :local-checksum local-checksum
                           :remote-checksum remote-checksum}))))))

(defn- handle-tx-reject!
  [repo client message local-tx]
  (let [reason (:reason message)
        remote-tx (:t message)]
    (when (nil? reason)
      (fail-fast :db-sync/missing-field
                 {:repo repo :type "tx/reject" :field :reason}))
    (when (contains? message :t)
      (require-non-negative remote-tx {:repo repo :type "tx/reject"}))
    (case reason
      "stale"
      (when (and (:ws client) (ws-open? (:ws client)))
        (send! (:ws client) {:type "pull" :since local-tx}))

      (let [data (when-let [raw-data (:data message)]
                   (parse-transit raw-data
                                  {:repo repo
                                   :type "tx/reject"
                                   :reason reason
                                   :field :data}))]
        (fail-fast :db-sync/tx-rejected
                   (cond-> {:type :db-sync/tx-rejected
                            :repo repo
                            :message-type "tx/reject"
                            :reason reason}
                     (contains? message :t) (assoc :t remote-tx)
                     (some? data) (assoc :data data)))))))

(defn- handle-hello!
  [repo client local-tx remote-tx remote-checksum]
  (require-non-negative remote-tx {:repo repo :type "hello"})
  (verify-sync-checksum! repo client local-tx remote-tx remote-checksum {:type "hello"})
  (broadcast-rtc-state! client)
  (when (> remote-tx local-tx)
    (send! (:ws client) {:type "pull" :since local-tx}))
  (sync-assets/enqueue-asset-sync!
   repo client
   {:enqueue-asset-task-f enqueue-asset-task!
    :current-client-f current-client
    :broadcast-rtc-state!-f broadcast-rtc-state!
    :fail-fast-f fail-fast})
  (sync-apply/flush-pending! repo client))

(defn- handle-online-users!
  [repo client message]
  (let [users (:online-users message)]
    (when (and (some? users) (not (sequential? users)))
      (fail-fast :db-sync/invalid-field
                 {:repo repo :type "online-users" :field :online-users}))
    (update-online-users! client (or users []))))

(defn- handle-presence!
  [client message]
  (let [{:keys [user-id editing-block-uuid]} message]
    (when-not (= (get-user-uuid) user-id)
      (update-user-presence! client user-id editing-block-uuid))))

(defn- handle-tx-batch-ok!
  [repo client remote-tx remote-checksum]
  (require-non-negative remote-tx {:repo repo :type "tx/batch/ok"})
  (client-op/update-local-tx repo remote-tx)
  (broadcast-rtc-state! client)
  (sync-apply/remove-pending-txs! repo @(:inflight client))
  (reset! (:inflight client) [])
  (verify-sync-checksum! repo client remote-tx remote-tx remote-checksum {:type "tx/batch/ok"})
  (sync-apply/flush-pending! repo client))

(defn- handle-pull-ok!
  [repo client local-tx remote-tx remote-checksum message]
  (when (> remote-tx local-tx)
    (let [txs (:txs message)]
      (require-non-negative remote-tx {:repo repo :type "pull/ok"})
      (require-seq txs {:repo repo :type "pull/ok" :field :txs})
      (let [remote-txs (mapv (fn [data]
                               {:t (:t data)
                                :outliner-op (:outliner-op data)
                                :tx-data (parse-transit (:tx data) {:repo repo :type "pull/ok"})})
                             txs)]
        (when (seq remote-txs)
          (p/let [graph-e2ee? (sync-crypt/graph-e2ee? repo)
                  aes-key (sync-crypt/<ensure-graph-aes-key repo (:graph-id client))
                  _ (when (and graph-e2ee? (nil? aes-key))
                      (fail-fast :db-sync/missing-field {:repo repo :field :aes-key}))
                  remote-txs* (if aes-key
                                (p/all (mapv (fn [{:keys [t tx-data]}]
                                               (p/let [tx-data* (sync-crypt/<decrypt-tx-data aes-key tx-data)]
                                                 {:t t
                                                  :tx-data tx-data*}))
                                             remote-txs))
                                (p/resolved remote-txs))]
            (try
              (sync-apply/apply-remote-txs! repo client remote-txs*)
              (catch :default e
                (log/error ::apply-remote-tx e)
                (throw e)))
            (client-op/update-local-tx repo remote-tx)
            (broadcast-rtc-state! client)
            (verify-sync-checksum! repo client remote-tx remote-tx remote-checksum {:type "pull/ok"})
            (sync-apply/flush-pending! repo client)))))))

(defn- handle-changed!
  [repo client local-tx remote-tx]
  (require-non-negative remote-tx {:repo repo :type "changed"})
  (broadcast-rtc-state! client)
  (when (< local-tx remote-tx)
    (send! (:ws client) {:type "pull" :since local-tx})))

(defn handle-message!
  [repo client raw]
  (let [message (-> raw
                    sync-transport/parse-message
                    sync-transport/coerce-ws-server-message)]
    (when-not (map? message)
      (fail-fast :db-sync/response-parse-failed {:repo repo :raw raw}))
    (let [local-tx (or (client-op/get-local-tx repo) 0)
          remote-tx (:t message)
          remote-checksum (:checksum message)]
      (when remote-tx
        (swap! sync-apply/*repo->latest-remote-tx assoc repo remote-tx))
      (case (:type message)
        "hello" (handle-hello! repo client local-tx remote-tx remote-checksum)
        "online-users" (handle-online-users! repo client message)
        "presence" (handle-presence! client message)
        "tx/batch/ok" (handle-tx-batch-ok! repo client remote-tx remote-checksum)
        "pull/ok" (handle-pull-ok! repo client local-tx remote-tx remote-checksum message)
        "changed" (handle-changed! repo client local-tx remote-tx)
        "tx/reject" (handle-tx-reject! repo client message local-tx)
        (fail-fast :db-sync/invalid-field
                   {:repo repo :type (:type message)})))))
