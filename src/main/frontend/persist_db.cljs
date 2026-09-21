(ns frontend.persist-db
  "Backend of DB based graph"
  (:require [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db.transact :as db-transact]
            [frontend.db.subs :as db-subs]
            [frontend.handler.notification :as notification]
            [frontend.handler.worker :as worker-handler]
            [frontend.persist-db.browser :as browser]
            [frontend.persist-db.protocol :as protocol]
            [frontend.persist-db.remote :as remote]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [lambdaisland.glogi :as log]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def db-worker-recovery-failure-threshold 1)

(defonce opfs-db (browser/->InBrowser))
(defonce remote-db (atom nil))
(defonce remote-repo (atom nil))
(defonce remote-runtime-state (atom nil))
(defonce *ensure-remote-chain (atom nil))
(defonce *remote-ensure-epoch (atom 0))
(defonce *pending-remote-session (atom nil))
(defonce ^:private *repo-generations (atom {}))

(declare <ensure-remote-impl!)

(defn- clear-remote-runtime!
  []
  (reset! remote-runtime-state nil)
  (reset! remote-db nil)
  (reset! remote-repo nil)
  (reset! *pending-remote-session nil)
  (reset! state/*db-worker nil))

(defn- same-remote-repo?
  [repo runtime-repo]
  (graph-dir/same-repo? repo runtime-repo))

(defn <invalidate-remote-repo!
  "Cancels clients and pending recovery for the removed graph instance."
  ([repo phase] (<invalidate-remote-repo! repo phase nil))
  ([repo phase generation]
   (if (and generation
            (when-let [current (get @*repo-generations (graph-dir/repo-identity repo))]
              (not= generation current)))
     (p/resolved nil)
     (let [client (when (same-remote-repo? repo @remote-repo) @remote-db)]
    (when (or (same-remote-repo? repo @remote-repo)
              (same-remote-repo? repo (:repo @*pending-remote-session)))
      (swap! *remote-ensure-epoch inc)
      (clear-remote-runtime!))
    (when (same-remote-repo? repo (state/get-current-repo))
      (state/set-current-repo! nil)
      (db-subs/reset-graph! nil))
    (when (= phase "deleted")
      (state/delete-repo! {:url repo}))
    (if client (remote/stop! client) (p/resolved nil))))))

(defn- <stop-remote-if-current!
  [repo]
  (if (and repo (same-remote-repo? repo @remote-repo))
    (if-let [remote-client @remote-db]
      (-> (remote/stop! remote-client)
          (p/finally
            (fn []
              (when (same-remote-repo? repo @remote-repo)
                (clear-remote-runtime!)))))
      (do
        (clear-remote-runtime!)
        (p/resolved true)))
    (p/resolved false)))

(defn- set-remote-runtime!
  [repo client session-id]
  (reset! remote-runtime-state {:repo repo
                                :client client
                                :session-id session-id
                                :request-failures 0
                                :recovery-triggered? false})
  (reset! remote-db client)
  (reset! remote-repo repo)
  (reset! state/*db-worker (:wrapped-worker client)))

(defn- active-runtime-session?
  [state repo session-id]
  (and (same-remote-repo? repo (:repo state))
       (= session-id (:session-id state))))

(defn- active-runtime-client?
  [state repo session-id client]
  (and (active-runtime-session? state repo session-id)
       (identical? client (:client state))))

(defn- pending-remote-session?
  [repo session-id]
  (let [pending @*pending-remote-session]
    (and (some? pending)
         (same-remote-repo? repo (:repo pending))
         (= session-id (:session-id pending)))))

(defn- remote-session-live?
  [repo session-id]
  (or (active-runtime-session? @remote-runtime-state repo session-id)
      (pending-remote-session? repo session-id)))

(defn- <enqueue-ensure-remote!
  [f]
  (let [out (atom nil)]
    (swap! *ensure-remote-chain
           (fn [prev]
             (let [p (-> (or prev (p/resolved nil))
                         (p/catch (fn [_] nil))
                         (p/then (fn [_] (f))))]
               (reset! out p)
               p)))
    @out))

(defn- reset-active-request-failures!
  [repo session-id]
  (swap! remote-runtime-state
         (fn [state]
           (if (active-runtime-session? state repo session-id)
             (assoc state :request-failures 0)
             state))))

(defn- server-unavailable-error?
  [error]
  (let [{:keys [status code]} (ex-data error)]
    (or (nil? (ex-data error))
        (= :server-unavailable code)
        (= :db-worker-unavailable code)
        (= :connection-refused code)
        (= :fetch-failed code)
        (= :network-error code)
        (= 0 status))))

(defn- event-stream-error-loggable?
  [failure-count]
  (and (pos-int? failure-count)
       (or (and (<= failure-count 64)
                (zero? (bit-and failure-count (dec failure-count))))
           (and (> failure-count 64)
                (zero? (mod failure-count 64))))))

(defn- <request-remote-runtime!
  "Asks the main process for the graph's worker runtime. The main process probes
  the worker over Node HTTP and restarts it only when it is not healthy."
  [repo generation]
  (p/let [runtime (ipc/ipc "db-worker-runtime" repo {:generation generation})]
    (swap! *repo-generations assoc (graph-dir/repo-identity repo) (:generation runtime))
    runtime))

(defn- same-runtime-endpoint?
  [remote-client runtime]
  (let [client (:client remote-client)]
    (and (= (:base-url client) (:base-url runtime))
         (= (:auth-token client) (:auth-token runtime)))))

(defn- <stop-remote-client!
  [repo remote-client]
  (-> (remote/stop! remote-client)
      (p/catch (fn [error]
                 (log/warn :event :db-worker-runtime-stop-error
                           :repo repo
                           :error error)))))

(defn- <recover-remote-impl!
  "Renderer transport failures (fetch/SSE) also happen while the worker is healthy,
  e.g. Chromium suspends its network stack around system sleep. The main process
  decides whether the worker must be replaced; a healthy worker keeps the current
  client so its SSE reconnect path and in-flight invokes continue."
  [repo remote-client session-id]
  (let [active? #(active-runtime-client? @remote-runtime-state repo session-id remote-client)
        skip! (fn [reason]
                (log/info :event :db-worker-runtime-recovery-skipped
                          :repo repo
                          :reason reason)
                nil)]
    (cond
      (not (active?))
      (skip! :runtime-changed)

      (not (same-remote-repo? repo (state/get-current-repo)))
      (skip! :repo-changed)

      :else
      (p/let [runtime (<request-remote-runtime!
                       repo
                       (get @*repo-generations (graph-dir/repo-identity repo)))]
        (cond
          (not (active?))
          (skip! :runtime-changed)

          (same-runtime-endpoint? remote-client runtime)
          (do
            (swap! remote-runtime-state
                   (fn [state]
                     (if (active-runtime-client? state repo session-id remote-client)
                       (assoc state :request-failures 0 :recovery-triggered? false)
                       state)))
            (log/info :event :db-worker-runtime-recovered :repo repo :worker :reused)
            remote-client)

          :else
          (p/let [_ (<stop-remote-client! repo remote-client)]
            (if (active?)
              (do
                (clear-remote-runtime!)
                (p/let [client (<ensure-remote-impl! repo {:only-if-current? true})]
                  (when client
                    (log/info :event :db-worker-runtime-recovered :repo repo :worker :replaced))
                  client))
              (skip! :runtime-changed))))))))

(defn- <trigger-db-worker-runtime-recovery!
  [repo remote-client session-id]
  (log/warn :event :db-worker-runtime-recovering :repo repo)
  (-> (<enqueue-ensure-remote! #(<recover-remote-impl! repo remote-client session-id))
      (p/catch (fn [error]
                 (log/error :event :db-worker-runtime-recovery-failed
                            :repo repo
                            :error error)
                 (p/let [_ (when (active-runtime-client? @remote-runtime-state repo session-id remote-client)
                             (clear-remote-runtime!)
                             (<stop-remote-client! repo remote-client))]
                   (notification/show!
                    (t :graph/db-worker-recovery-failed-error
                       (text-util/get-graph-name-from-path repo))
                    :error))))))

(defn- record-active-request-failure!
  [repo session-id error]
  (when (and (server-unavailable-error? error)
             (not (state/get-state :graph/importing)))
    (let [triggered? (atom false)
          remote-client (atom nil)]
      (swap! remote-runtime-state
             (fn [state]
               (if (and (active-runtime-session? state repo session-id)
                        (not (:recovery-triggered? state)))
                 (let [failures (inc (or (:request-failures state) 0))]
                   (if (>= failures db-worker-recovery-failure-threshold)
                     (do
                       (reset! triggered? true)
                       (reset! remote-client (:client state))
                       (assoc state
                              :request-failures failures
                              :recovery-triggered? true))
                     (assoc state :request-failures failures)))
                 state)))
      (when @triggered?
        (<trigger-db-worker-runtime-recovery! repo @remote-client session-id))
      nil)))

(defn- node-runtime?
  []
  (and (exists? js/process)
       (not (exists? js/window))))

(defn- electron-runtime?
  []
  (and (not (node-runtime?))
       (util/electron?)))

(defn- current-db-sync-config
  []
  {:enabled? true
   :ws-url (config/db-sync-ws-url)
   :http-base (config/db-sync-http-base)})

(defn- <sync-markdown-mirror-setting!
  [repo]
  (state/<invoke-db-worker :thread-api/markdown-mirror-set-enabled
                           repo
                           (true? (:feature/markdown-mirror? (state/get-graph-config repo)))))

(defn- graph-markdown-mirror-enabled?
  [state repo]
  (true? (get-in state [:config repo :feature/markdown-mirror?])))

(defn- sync-markdown-mirror-setting-watch!
  []
  (rfx/unlisten! :sync-markdown-mirror-setting)
  (rfx/listen!
   :sync-markdown-mirror-setting
   (fn [old-state new-state]
     (let [repo (:git/current-repo new-state)
           old-enabled? (graph-markdown-mirror-enabled? old-state repo)
           new-enabled? (graph-markdown-mirror-enabled? new-state repo)]
       (when (and repo
                  @state/*db-worker
                  (not= old-enabled? new-enabled?))
         (-> (state/<invoke-db-worker :thread-api/markdown-mirror-set-enabled
                                      repo
                                      new-enabled?)
             (p/catch (fn [error]
                        (log/error :markdown-mirror/settings-watch-sync-failed
                                   {:repo repo
                                    :enabled? new-enabled?
                                    :error error}))))))))
  nil)

(defn- <discard-stale-started-client!
  [repo client]
  (log/warn :event :db-worker-ensure-remote-stale
            :repo repo :phase :after-start)
  (-> (remote/stop! client)
      (p/catch (fn [e]
                 (log/warn :event :db-worker-stale-client-stop-error
                           :repo repo :error e)))
      (p/then (fn [_]
                (p/let [_ (if (same-remote-repo? repo @remote-repo)
                            (log/info :event :db-worker-stale-release-skipped
                                      :repo repo
                                      :reason :runtime-changed)
                            (ipc/ipc "releaseDbWorkerRuntime" repo))]
                  nil)))
      (p/catch (fn [e]
                 (log/warn :event :db-worker-stale-release-error
                           :repo repo :error e)))))

(defn- install-remote-runtime!
  [repo client session-id]
  (set-remote-runtime! repo client session-id)
  (p/let [_ (state/<invoke-db-worker :thread-api/set-db-sync-config
                                     (current-db-sync-config))
          _ (<sync-markdown-mirror-setting! repo)]
    (sync-markdown-mirror-setting-watch!)
    nil)
  (ldb/register-transact-fn!
   (fn remote-transact!
     [repo tx-data tx-meta]
     (db-transact/transact browser/transact!
                           (if (string? repo) repo (state/get-current-repo))
                           tx-data
                           (assoc tx-meta :client-id (:client-id (state/get-state))))))
  client)

(defn- <ensure-remote-impl!
  [repo {:keys [only-if-current? generation]}]
  (let [current-for-repo? #(same-remote-repo? repo (state/get-current-repo))]
    (cond
      (nil? repo)
      (p/resolved @remote-db)

      (and only-if-current? (not (current-for-repo?)))
      (do
        (log/warn :event :db-worker-ensure-remote-stale
                  :repo repo :phase :before-stop)
        (p/resolved nil))

      (same-remote-repo? repo @remote-repo)
      (if (and generation
               (not= generation (get @*repo-generations (graph-dir/repo-identity repo))))
        (p/rejected (ex-info "Graph generation changed" {:code :graph-not-exists :repo repo}))
        (p/resolved @remote-db))

      :else
      (let [epoch (swap! *remote-ensure-epoch inc)
            session-id (str (random-uuid))
            event-stream-failures (atom 0)]
        (reset! *pending-remote-session {:repo repo
                                         :session-id session-id
                                         :epoch epoch})
        (p/let [_ (when @remote-db
                    (remote/stop! @remote-db))]
          (if (and only-if-current? (not (current-for-repo?)))
            (do
              (log/warn :event :db-worker-ensure-remote-stale
                        :repo repo :phase :before-runtime)
              (when (pending-remote-session? repo session-id)
                (reset! *pending-remote-session nil))
              nil)
            (p/let [runtime (<request-remote-runtime!
                             repo
                             (or generation
                                 (when only-if-current?
                                   (get @*repo-generations (graph-dir/repo-identity repo)))))
                    client (remote/start! (assoc runtime
                                                 :repo repo
                                                 :event-handler worker-handler/handle
                                                 :still-active? #(remote-session-live? repo session-id)
                                                 :on-invoke-success (fn [_method _args _result]
                                                                      (reset-active-request-failures! repo session-id))
                                                 :on-invoke-failure (fn [_method _args error]
                                                                      (record-active-request-failure! repo session-id error))
                                                 :on-event-error (fn [error]
                                                                   (let [failure-count (swap! event-stream-failures inc)]
                                                                     (when (event-stream-error-loggable? failure-count)
                                                                       (log/warn :event :db-worker-event-stream-error
                                                                                 :repo repo
                                                                                 :failures failure-count
                                                                                 :error error))
                                                                     (record-active-request-failure!
                                                                      repo
                                                                      session-id
                                                                      (ex-info "db-worker event stream unavailable"
                                                                               {:code :db-worker-unavailable
                                                                                :event-stream? true
                                                                                :cause error}))))))]
              (if (or (not= epoch @*remote-ensure-epoch)
                      (and only-if-current? (not (current-for-repo?))))
                (do
                  (when (pending-remote-session? repo session-id)
                    (reset! *pending-remote-session nil))
                  (<discard-stale-started-client! repo client))
                (install-remote-runtime! repo client session-id)))))))))

(defn- <ensure-remote!
  ([repo] (<ensure-remote! repo nil))
  ([repo opts]
   (<enqueue-ensure-remote! #(<ensure-remote-impl! repo opts))))

(defn <start-runtime!
  []
  (cond
    (electron-runtime?)
    (if-let [repo (state/get-current-repo)]
      (<ensure-remote! repo)
      (p/resolved nil))

    :else
    (browser/start-db-worker!)))

(defn- get-impl
  "Get the actual implementation of PersistentDB"
  []
  opfs-db)

(defn <list-db []
  (if (electron-runtime?)
    (if-let [repo (or @remote-repo (state/get-current-repo))]
      (p/let [client (<ensure-remote! repo)]
        (protocol/<list-db client))
      (p/resolved []))
    (if @state/db-worker-ready?
      (protocol/<list-db (get-impl))
      (p/resolved []))))

(defn <unsafe-delete [repo]
  (when repo
    (if (electron-runtime?)
      (p/let [client (<ensure-remote! repo)]
        (protocol/<unsafe-delete client repo))
      (protocol/<unsafe-delete (get-impl) repo))))

(defn <close-db [repo]
  (when repo
    (if (electron-runtime?)
      (if (same-remote-repo? repo @remote-repo)
        (if-let [remote-client @remote-db]
          (p/let [_ (-> (remote/invoke! (:client remote-client) "thread-api/close-db" [repo])
                        (p/catch (fn [_] nil)))
                  _ (<stop-remote-if-current! repo)]
            nil)
          (p/resolved nil))
        (p/resolved nil))
      (state/<invoke-db-worker :thread-api/close-db repo))))

(defn <export-db
  [repo opts]
  (when repo
    (protocol/<export-db (get-impl) repo opts)))

(defn <import-db
  [repo data]
  (when repo
    (if (electron-runtime?)
      (p/let [generation (ipc/ipc "createGraph" repo)
              client (<ensure-remote! repo {:generation generation})]
        (protocol/<import-db client repo data))
      (protocol/<import-db (get-impl) repo data))))

(defn <open-and-fetch-schema
  ([repo]
   (<open-and-fetch-schema repo {}))
  ([repo opts]
   (when repo
     (if (electron-runtime?)
       (p/let [generation (when (:sync-download-graph? opts)
                            (ipc/ipc "createGraph" repo))
               client (<ensure-remote! repo (when generation {:generation generation}))]
         (protocol/<open-and-fetch-schema client repo opts))
       (p/let [_ (when-not @state/db-worker-ready?
                   (browser/start-db-worker!))]
         (protocol/<open-and-fetch-schema (get-impl) repo opts))))))

;; FIXME: limit repo name's length and sanity
;; @shuyu Do we still need this?
(defn <new [repo opts]
  {:pre [(<= (count repo) 128)]}
  (p/let [generation (when (electron-runtime?) (ipc/ipc "createGraph" repo))
          impl (if (electron-runtime?)
                 (<ensure-remote! repo {:generation generation})
                 (p/resolved (get-impl)))
          _ (protocol/<new impl repo opts)]
    (<export-db repo {})))

(defn export-current-graph!
  [& {:keys [succ-notification?]}]
  (when (util/electron?)
    (when-let [repo (state/get-current-repo)]
      (log/debug :event :backup-db :graph repo)
      (->
       (p/do!
        (ipc/ipc :db-export repo true)
        (when succ-notification?
          (state/pub-event!
           [:notification/show {:content "DB backup successfully."
                                :status :success}])))
       (p/catch (fn [^js error]
                  (log/error :event :db-backup-failed :graph repo :error error)
                  (state/pub-event!
                   [:notification/show {:content (str (.getMessage error))
                                        :status :error
                                        :clear? false}])))))))
