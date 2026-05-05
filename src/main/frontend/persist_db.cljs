(ns frontend.persist-db
  "Backend of DB based graph"
  (:require [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.db.transact :as db-transact]
            [frontend.handler.graph-failover :as graph-failover]
            [frontend.persist-db.browser :as browser]
            [frontend.persist-db.protocol :as protocol]
            [frontend.persist-db.remote :as remote]
            [frontend.handler.worker :as worker-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def max-db-worker-request-failures 3)

(defonce opfs-db (browser/->InBrowser))
(defonce remote-db (atom nil))
(defonce remote-repo (atom nil))
(defonce remote-runtime-state (atom nil))

(defn- clear-remote-runtime!
  []
  (reset! remote-runtime-state nil)
  (reset! remote-db nil)
  (reset! remote-repo nil)
  (reset! state/*db-worker nil))

(defn- <stop-remote-if-current!
  [repo]
  (if (and repo (= repo @remote-repo))
    (if-let [remote-client @remote-db]
      (-> (remote/stop! remote-client)
          (p/finally
           (fn []
             (when (= repo @remote-repo)
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
                                :failover-triggered? false})
  (reset! remote-db client)
  (reset! remote-repo repo)
  (reset! state/*db-worker (:wrapped-worker client)))

(defn- active-runtime-session?
  [state repo session-id]
  (and (= repo (:repo state))
       (= session-id (:session-id state))))

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

(defn- trigger-db-worker-failover!
  [repo remote-client]
  (when remote-client
    (-> (remote/stop! remote-client)
        (p/catch (fn [error]
                   (log/warn :db-worker-failover-stop-error {:repo repo
                                                             :error error})))))
  (when (= repo @remote-repo)
    (clear-remote-runtime!))
  (-> (ipc/ipc "releaseDbWorkerRuntime" repo)
      (p/catch (fn [error]
                 (log/warn :db-worker-failover-release-runtime-error {:repo repo
                                                                       :error error}))))
  (graph-failover/switch-away-from-current-repo! repo {:reason :db-worker-request-failed}))

(defn- record-active-request-failure!
  [repo session-id error]
  (when (server-unavailable-error? error)
    (let [triggered? (atom false)
          remote-client (atom nil)]
      (swap! remote-runtime-state
             (fn [state]
               (if (and (active-runtime-session? state repo session-id)
                        (not (:failover-triggered? state)))
                 (let [failures (inc (or (:request-failures state) 0))]
                   (if (>= failures max-db-worker-request-failures)
                     (do
                       (reset! triggered? true)
                       (reset! remote-client (:client state))
                       (assoc state
                              :request-failures failures
                              :failover-triggered? true))
                     (assoc state :request-failures failures)))
                 state)))
      (when @triggered?
        (trigger-db-worker-failover! repo @remote-client)))))

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

(defn- <ensure-remote!
  [repo]
  (if (or (nil? repo) (= repo @remote-repo))
    (p/resolved @remote-db)
    (let [session-id (str (random-uuid))]
      (p/let [_ (when @remote-db
                  (remote/stop! @remote-db))
              runtime (ipc/ipc "db-worker-runtime" repo)
              client (remote/start! (assoc runtime
                                           :repo repo
                                           :event-handler worker-handler/handle
                                           :on-invoke-success (fn [_method _args _result]
                                                                (reset-active-request-failures! repo session-id))
                                           :on-invoke-failure (fn [_method _args error]
                                                                (record-active-request-failure! repo session-id error))
                                           :on-event-error (fn [error]
                                                             (record-active-request-failure! repo session-id error))))]
        (set-remote-runtime! repo client session-id)
        (p/let [_ (state/<invoke-db-worker :thread-api/set-db-sync-config
                                           (current-db-sync-config))]
          nil)
        (ldb/register-transact-fn!
         (fn remote-transact!
           [repo tx-data tx-meta]
           (db-transact/transact browser/transact!
                                 (if (string? repo) repo (state/get-current-repo))
                                 tx-data
                                 (assoc tx-meta :client-id (:client-id @state/state)))))
        client))))

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
      (if (= repo @remote-repo)
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
