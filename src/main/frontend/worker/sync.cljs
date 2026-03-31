(ns frontend.worker.sync
  "Sync client"
  (:require
   [frontend.worker.platform :as platform]
   [frontend.worker.shared-service :as shared-service]
   [frontend.worker.state :as worker-state]
   [frontend.worker.sync.apply-txs :as sync-apply]
   [frontend.worker.sync.assets :as sync-assets]
   [frontend.worker.sync.auth :as sync-auth]
   [frontend.worker.sync.client-op :as client-op]
   [frontend.worker.sync.handle-message :as sync-handle-message]
   [frontend.worker.sync.presence :as sync-presence]
   [frontend.worker.sync.transport :as sync-transport]
   [frontend.worker.sync.upload :as sync-upload]
   [frontend.worker.sync.util :as sync-util]
   [lambdaisland.glogi :as log]
   [logseq.common.util :as common-util]
   [logseq.db-sync.checksum :as sync-checksum]
   [promesa.core :as p]))

(def ^:private reconnect-base-delay-ms 1000)
(def ^:private reconnect-max-delay-ms 30000)
(def ^:private reconnect-jitter-ms 250)
(def ^:private ws-stale-kill-interval-ms 60000)
(def ^:private ws-stale-timeout-ms 600000)
(def fail-fast sync-util/fail-fast)

(defonce *repo->latest-remote-tx sync-apply/*repo->latest-remote-tx)
(defonce *repo->latest-remote-checksum sync-apply/*repo->latest-remote-checksum)
(defonce *start-inflight-target (atom nil))

(defn- current-client
  [repo]
  (sync-presence/current-client worker-state/*db-sync-client repo))

(defn status
  [repo]
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

(defn update-local-sync-checksum!
  [repo tx-report]
  (when (worker-state/get-client-ops-conn repo)
    (client-op/update-local-checksum
     repo
     (sync-checksum/update-checksum (client-op/get-local-checksum repo) tx-report))))

(defn- broadcast-rtc-state!
  [client]
  (when client
    (shared-service/broadcast-to-clients!
     :rtc-sync-state
     (sync-presence/rtc-state-payload status client))))

(defn- set-ws-state!
  [client ws-state]
  (sync-presence/set-ws-state! broadcast-rtc-state! client ws-state))

(defn- update-online-users!
  [client users]
  (sync-presence/update-online-users! broadcast-rtc-state! client users))

(defn- ws-base-url
  []
  (sync-auth/ws-base-url @worker-state/*db-sync-config))

(def auth-token sync-util/auth-token)

(def id-token-expired? sync-auth/id-token-expired?)

(def <resolve-ws-token sync-auth/<resolve-ws-token)

(defn- ensure-client-graph-uuid!
  [repo graph-id]
  (when (seq graph-id)
    (client-op/update-graph-uuid repo graph-id)))

(defn- reconnect-delay-ms
  [attempt]
  (sync-transport/reconnect-delay-ms
   attempt
   {:base-delay-ms reconnect-base-delay-ms
    :max-delay-ms reconnect-max-delay-ms
    :jitter-ms reconnect-jitter-ms}))

(defn- clear-reconnect-timer!
  [reconnect]
  (when-let [timer (:timer @reconnect)]
    (js/clearTimeout timer)
    (swap! reconnect assoc :timer nil)))

(defn- reset-reconnect!
  [client]
  (when-let [reconnect (:reconnect client)]
    (clear-reconnect-timer! reconnect)
    (swap! reconnect assoc :attempt 0)))

(defn- clear-stale-ws-loop-timer!
  [client]
  (when-let [*timer (:stale-kill-timer client)]
    (when-let [timer @*timer]
      (js/clearInterval timer)
      (reset! *timer nil))))

(defn- touch-last-ws-message!
  [client]
  (when-let [*ts (:last-ws-message-ts client)]
    (reset! *ts (common-util/time-ms))))

(defn- ready-state
  [ws]
  (sync-transport/ready-state ws))

(defn- ws-open?
  [ws]
  (sync-transport/ws-open? ws))

(defn- send!
  [ws message]
  (sync-transport/send! sync-transport/coerce-ws-client-message ws message))

(defn update-presence!
  [editing-block-uuid]
  (when-let [client @worker-state/*db-sync-client]
    (when-let [ws (:ws client)]
      (send! ws {:type "presence"
                 :editing-block-uuid editing-block-uuid}))))

(defn- enqueue-asset-task!
  [client task]
  (when-let [queue (:asset-queue client)]
    (swap! queue
           (fn [prev]
             (p/then prev (fn [_] (task)))))))

(defn- ensure-client-state!
  [repo]
  {:repo repo
   :send-queue (atom (p/resolved nil))
   :asset-queue (atom (p/resolved nil))
   :inflight (atom [])
   :last-sync-error (atom nil)
   :reconnect (atom {:attempt 0 :timer nil})
   :stale-kill-timer (atom nil)
   :last-ws-message-ts (atom (common-util/time-ms))
   :online-users (atom [])
   :ws-state (atom :closed)})

(declare connect!)

(defn- schedule-reconnect!
  [repo client url reason]
  (when-let [reconnect (:reconnect client)]
    (let [{:keys [attempt timer]} @reconnect]
      (when (nil? timer)
        (let [delay (reconnect-delay-ms attempt)
              timeout-id (js/setTimeout
                          (fn []
                            (swap! reconnect assoc :timer nil)
                            (when-let [current @worker-state/*db-sync-client]
                              (when (and (= (:repo current) repo)
                                         (= (:graph-id current) (:graph-id client)))
                                (-> (p/let [token (<resolve-ws-token)
                                            updated (connect! repo current url token)]
                                      (reset! worker-state/*db-sync-client updated))
                                    (p/catch (fn [error]
                                               (log/error :db-sync/ws-reconnect-failed {:repo repo :error error})
                                               (schedule-reconnect! repo current url :connect-failed)))))))
                          delay)]
          (swap! reconnect assoc :timer timeout-id :attempt (inc attempt))
          (log/info :db-sync/ws-reconnect-scheduled
                    {:repo repo :delay delay :attempt attempt :reason reason}))))))

(defn- attach-ws-handlers!
  [repo client ws url]
  (set! (.-onmessage ws)
        (fn [event]
          (touch-last-ws-message! client)
          (sync-handle-message/handle-message! repo client (.-data event))))
  (set! (.-onerror ws) (fn [error] (log/error :db-sync/ws-error error)))
  (set! (.-onclose ws)
        (fn [_]
          (log/info :db-sync/ws-closed {:repo repo})
          (clear-stale-ws-loop-timer! client)
          (update-online-users! client [])
          (set-ws-state! client :closed)
          (schedule-reconnect! repo client url :close))))

(defn- detach-ws-handlers!
  [ws]
  (set! (.-onopen ws) nil)
  (set! (.-onmessage ws) nil)
  (set! (.-onerror ws) nil)
  (set! (.-onclose ws) nil))

(defn- close-stale-ws-loop
  [client ws]
  (let [repo (:repo client)
        graph-id (:graph-id client)]
    (clear-stale-ws-loop-timer! client)
    (when-let [*timer (:stale-kill-timer client)]
      (let [timer (js/setInterval
                   (fn []
                     (when-let [current @worker-state/*db-sync-client]
                       (when (and (= repo (:repo current))
                                  (= graph-id (:graph-id current))
                                  (identical? ws (:ws current))
                                  (ws-open? ws))
                         (let [now (common-util/time-ms)
                               last-ts (or (some-> (:last-ws-message-ts current) deref) now)
                               stale-ms (- now last-ts)]
                           (when (>= stale-ms ws-stale-timeout-ms)
                             (log/warn :db-sync/ws-stale-timeout {:repo repo :stale-ms stale-ms})
                             (try (.close ws) (catch :default _ nil)))))))
                   ws-stale-kill-interval-ms)]
        (reset! *timer timer))))
  client)

(defn- stop-client!
  [client]
  (clear-stale-ws-loop-timer! client)
  (when-let [reconnect (:reconnect client)]
    (clear-reconnect-timer! reconnect))
  (when-let [ws (:ws client)]
    (detach-ws-handlers! ws)
    (update-online-users! client [])
    (set-ws-state! client :closed)
    (try (.close ws) (catch :default _ nil))))

(defn- active-client-for?
  [client repo graph-id]
  (when (and client (= repo (:repo client)) (= graph-id (:graph-id client)))
    (let [ws (:ws client)
          ws-state (some-> (:ws-state client) deref)
          ws-ready-state (when ws (ready-state ws))]
      (or (= :open ws-state)
          (contains? #{0 1} ws-ready-state)))))

(defn- connect!
  [repo client url token]
  (when (:ws client)
    (stop-client! client))
  (when-let [token' (or token (auth-token))]
    (let [ws (platform/websocket-connect (platform/current) (sync-transport/append-token url token'))
          updated (assoc client :ws ws)]
      (attach-ws-handlers! repo updated ws url)
      (set! (.-onopen ws)
            (fn [_]
              (reset-reconnect! updated)
              (touch-last-ws-message! updated)
              (set-ws-state! updated :open)
              (sync-util/clear-last-sync-error! updated)
              (send! ws {:type "hello" :client repo})
              (sync-assets/enqueue-asset-sync!
               repo updated
               {:enqueue-asset-task-f enqueue-asset-task!
                :current-client-f current-client
                :broadcast-rtc-state!-f broadcast-rtc-state!
                :fail-fast-f fail-fast})))
      (close-stale-ws-loop updated ws))))

(defn stop!
  []
  (when-let [client @worker-state/*db-sync-client]
    (stop-client! client)
    (reset! worker-state/*db-sync-client nil))
  (p/resolved nil))

(defn start!
  [repo]
  (let [base (ws-base-url)
        graph-id (sync-util/get-graph-id repo)
        start-target [repo graph-id]
        inflight-target @*start-inflight-target
        current @worker-state/*db-sync-client]
    (cond
      (not (and (string? base) (seq base) (seq graph-id)))
      (do
        (log/info :db-sync/start-skipped {:repo repo :graph-id graph-id :base base})
        (p/resolved nil))

      (= start-target inflight-target)
      (p/resolved nil)

      (active-client-for? current repo graph-id)
      (do
        (broadcast-rtc-state! current)
        (p/resolved nil))

      :else
      (do
        (reset! *start-inflight-target start-target)
        (->
         (p/do!
          (stop!)
          (p/let [client (ensure-client-state! repo)
                  url (sync-transport/format-ws-url base graph-id)
                  _ (ensure-client-graph-uuid! repo graph-id)
                  connected (assoc client :graph-id graph-id)
                  token (<resolve-ws-token)
                  connected (connect! repo connected url token)]
            (reset! worker-state/*db-sync-client connected)
            nil))
         (p/finally
           (fn []
             (when (= start-target @*start-inflight-target)
               (reset! *start-inflight-target nil)))))))))

(defn enqueue-local-tx!
  [repo tx-report]
  (sync-apply/enqueue-local-tx! repo tx-report))

(defn handle-local-tx!
  [repo tx-report]
  (sync-apply/handle-local-tx! repo tx-report))

(defn request-asset-download!
  [repo asset-uuid]
  (sync-apply/request-asset-download! repo asset-uuid))

(defn rehydrate-large-titles-from-db!
  [repo graph-id]
  (sync-apply/rehydrate-large-titles-from-db! repo graph-id))

(defn upload-graph!
  [repo]
  (sync-upload/upload-graph! repo))

(defn list-remote-graphs!
  []
  (let [base (sync-auth/http-base-url @worker-state/*db-sync-config)]
    (if-not (seq base)
      (p/resolved [])
      (do
        (sync-util/require-auth-token! {:op :list-remote-graphs})
        (p/let [resp (sync-transport/fetch-json (str base "/graphs")
                                                {:method "GET"}
                                                {:response-schema :graphs/list})]
          (vec (or (:graphs resp) [])))))))
