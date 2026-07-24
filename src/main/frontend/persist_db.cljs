(ns frontend.persist-db
  "Backend of DB based graph"
  (:require [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db.transact :as db-transact]
            [frontend.handler.notification :as notification]
            [frontend.handler.worker :as worker-handler]
            [frontend.persist-db.browser :as browser]
            [frontend.persist-db.protocol :as protocol]
            [frontend.persist-db.remote :as remote]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [lambdaisland.glogi :as log]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def db-worker-recovery-failure-threshold 1)
(def ^:private db-worker-retry-min-delay-ms 100)
(def ^:private db-worker-retry-max-delay-ms 5000)

(defonce opfs-db (browser/->InBrowser))
(defonce remote-db (atom nil))
(defonce remote-repo (atom nil))
(defonce remote-runtime-state (atom nil))
(defonce remote-runtime-recovery (atom nil))

(declare <ensure-remote!)

(defn- clear-remote-runtime!
  []
  (reset! remote-runtime-state nil)
  (reset! remote-db nil)
  (reset! remote-repo nil)
  (reset! state/*db-worker nil))

(defn- same-remote-repo?
  [repo runtime-repo]
  (graph-dir/same-repo? repo runtime-repo))

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
        (= :db-worker-not-ready code)
        (= 0 status))))

(defn- db-worker-retry-delay-ms
  [retry-count]
  (min db-worker-retry-max-delay-ms
       (* db-worker-retry-min-delay-ms
          (js/Math.pow 2 (min retry-count 6)))))

(defn- event-stream-error-loggable?
  [failure-count]
  (and (pos-int? failure-count)
       (or (and (<= failure-count 64)
                (zero? (bit-and failure-count (dec failure-count))))
           (and (> failure-count 64)
                (zero? (mod failure-count 64))))))

(defn- <release-active-runtime!
  [repo remote-client session-id]
  (if (active-runtime-client? @remote-runtime-state repo session-id remote-client)
    (p/let [_ (do
                (clear-remote-runtime!)
                (ipc/ipc "releaseDbWorkerRuntime" repo))]
      true)
    (do
      (log/info :event :db-worker-runtime-recovery-skipped
                :repo repo
                :reason :runtime-changed)
      (p/resolved false))))

(defn- <trigger-db-worker-runtime-recovery!
  [repo remote-client session-id]
  (if-let [completion (when (and (same-remote-repo? repo (:repo @remote-runtime-recovery))
                                 (= session-id (:session-id @remote-runtime-recovery)))
                        (:completion @remote-runtime-recovery))]
    completion
    (let [ready (p/deferred)
          recovery-id (random-uuid)]
      ;; A recovery may have no active waiters, so keep its rejected readiness
      ;; promise handled while still allowing callers to observe the rejection.
      (p/catch ready (fn [_] nil))
      (reset! remote-runtime-recovery {:repo repo
                                       :session-id session-id
                                       :recovery-id recovery-id
                                       :ready ready})
      (log/warn :event :db-worker-runtime-recovering :repo repo)
      (let [completion
            (-> (p/do!
                 (when remote-client
                   (-> (remote/stop! remote-client)
                       (p/catch (fn [error]
                                  (log/warn :event :db-worker-runtime-stop-error
                                            :repo repo
                                            :error error))))))
                (p/then (fn [_]
                          (<release-active-runtime! repo remote-client session-id)))
                (p/then (fn [released?]
                          (if (and released?
                                   (same-remote-repo? repo (state/get-current-repo)))
                            (<ensure-remote! repo {:only-if-current? true})
                            (when-not released?
                              (log/info :event :db-worker-runtime-recovery-skipped
                                        :repo repo
                                        :reason :release-skipped)))))
                (p/then (fn [client]
                          (if client
                            (do
                              (log/info :event :db-worker-runtime-recovered :repo repo)
                              (p/resolve! ready true))
                            (p/reject! ready
                                       (ex-info "db-worker runtime recovery was cancelled"
                                                {:code :db-worker-recovery-cancelled
                                                 :repo repo})))))
                (p/catch (fn [error]
                           (p/reject! ready error)
                           (log/error :event :db-worker-runtime-recovery-failed
                                      :repo repo
                                      :error error)
                           (when-not (:graph/importing @state/state)
                             (notification/show!
                              (t :graph/db-worker-recovery-failed-error
                                 (text-util/get-graph-name-from-path repo))
                              :error))))
                (p/finally (fn []
                             (swap! remote-runtime-recovery
                                    (fn [recovery]
                                      (if (= recovery-id (:recovery-id recovery))
                                        nil
                                        recovery))))))]
        (swap! remote-runtime-recovery assoc :completion completion)
        completion))))

(defn- record-active-request-failure!
  [repo session-id error]
  (when (server-unavailable-error? error)
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

(defn <wait-for-db-worker-ready!
  [repo]
  (let [recovery @remote-runtime-recovery]
    (cond
      (and (same-remote-repo? repo (:repo recovery))
           (:ready recovery))
      (:ready recovery)

      (and @state/*db-worker
           (or (not (electron-runtime?))
               (same-remote-repo? repo @remote-repo)))
      (p/resolved true)

      :else
      (p/rejected
       (ex-info "db-worker is not ready"
                {:code :db-worker-not-ready
                 :repo repo})))))

(defn- <ensure-db-worker-ready!
  [repo]
  (let [recovery @remote-runtime-recovery]
    (cond
      (and (same-remote-repo? repo (:repo recovery))
           (:ready recovery))
      (:ready recovery)

      (and @state/*db-worker
           (or (not (electron-runtime?))
               (same-remote-repo? repo @remote-repo)))
      (p/resolved true)

      (and (electron-runtime?)
           (same-remote-repo? repo (state/get-current-repo)))
      (p/let [client (<ensure-remote! repo {:only-if-current? true})]
        (if client
          true
          (throw (ex-info "db-worker runtime recovery was cancelled"
                          {:code :db-worker-recovery-cancelled
                           :repo repo}))))

      :else
      (p/rejected
       (ex-info "db-worker is not ready"
                {:code :db-worker-not-ready
                 :repo repo})))))

(defn <retry-db-worker-transaction!
  [repo transact-fn]
  (let [tx-id (random-uuid)]
    (letfn [(<attempt! [confirm-previous-attempt? retry-count]
              (-> (p/let [_ (<ensure-db-worker-ready! repo)
                          applied? (when confirm-previous-attempt?
                                     (state/<invoke-db-worker
                                      :thread-api/local-tx-applied?
                                      repo
                                      tx-id))]
                    (if applied?
                      nil
                      (transact-fn tx-id)))
                  (p/catch
                   (fn [error]
                     (if (and (electron-runtime?)
                              (server-unavailable-error? error))
                       (p/let [_ (p/delay (db-worker-retry-delay-ms retry-count))]
                         (<attempt! true (inc retry-count)))
                       (throw error))))))]
      (<attempt! false 0))))

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
  (remove-watch state/state :sync-markdown-mirror-setting)
  (add-watch
   state/state
   :sync-markdown-mirror-setting
   (fn [_ _ old-state new-state]
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

(defn- <ensure-remote!
  ([repo] (<ensure-remote! repo nil))
  ([repo {:keys [only-if-current?]}]
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
       (p/resolved @remote-db)

       :else
       (let [session-id (str (random-uuid))
             event-stream-failures (atom 0)]
         (p/let [_ (when @remote-db
                     (remote/stop! @remote-db))]
           (if (and only-if-current? (not (current-for-repo?)))
             (do
               (log/warn :event :db-worker-ensure-remote-stale
                         :repo repo :phase :before-runtime)
               nil)
             (p/let [runtime (ipc/ipc "db-worker-runtime" repo)
                     client (remote/start! (assoc runtime
                                                  :repo repo
                                                  :event-handler worker-handler/handle
                                                  :on-invoke-success (fn [_method _args _result]
                                                                       (reset! event-stream-failures 0)
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
                                                                      (-> (remote/<healthy? runtime)
                                                                          (p/then
                                                                           (fn [healthy?]
                                                                             (if healthy?
                                                                               (do
                                                                                 (reset! event-stream-failures 0)
                                                                                 (reset-active-request-failures! repo session-id)
                                                                                 (log/info :event :db-worker-event-stream-runtime-healthy
                                                                                           :repo repo))
                                                                               (record-active-request-failure!
                                                                                repo
                                                                                session-id
                                                                                (ex-info "db-worker event stream unavailable"
                                                                                         {:code :db-worker-unavailable
                                                                                          :event-stream? true
                                                                                          :cause error}))))))))))]
               (if (and only-if-current? (not (current-for-repo?)))
                 (do
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
                 (do
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
                                            (assoc tx-meta :client-id (:client-id @state/state)))))
                   client))))))))))

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
    (protocol/<list-db (get-impl))))

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
      (p/let [client (<ensure-remote! repo)]
        (protocol/<import-db client repo data))
      (protocol/<import-db (get-impl) repo data))))

(defn <fetch-init-data
  ([repo]
   (<fetch-init-data repo {}))
  ([repo opts]
   (when repo
     (if (electron-runtime?)
       (p/let [client (<ensure-remote! repo)]
         (protocol/<fetch-initial-data client repo opts))
       (protocol/<fetch-initial-data (get-impl) repo opts)))))

;; FIXME: limit repo name's length and sanity
;; @shuyu Do we still need this?
(defn <new [repo opts]
  {:pre [(<= (count repo) 128)]}
  (p/let [impl (if (electron-runtime?)
                 (<ensure-remote! repo)
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
