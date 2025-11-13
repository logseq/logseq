(ns frontend.persist-db.browser
  "Browser db persist support, using sqlite-wasm.

   This interface uses clj data format as input."
  (:require ["comlink" :as Comlink]
            [electron.ipc :as ipc]
            [frontend.common.missionary :as c.m]
            [frontend.common.thread-api :as thread-api]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.transact :as db-transact]
            [frontend.handler.notification :as notification]
            [frontend.handler.worker :as worker-handler]
            [frontend.persist-db.protocol :as protocol]
            [frontend.state :as state]
            [frontend.undo-redo :as undo-redo]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [missionary.core :as m]
            [promesa.core :as p]))

(defn- ask-persist-permission!
  []
  (p/let [persistent? (.persist js/navigator.storage)]
    (if persistent?
      (log/info :storage-persistent "Storage will not be cleared unless from explicit user action")
      (log/warn :opfs-storage-may-be-cleared "OPFS storage may be cleared by the browser under storage pressure."))))

(defn- sync-app-state!
  []
  (let [state-flow
        (->> (m/watch state/state)
             (m/eduction
              (map #(select-keys % [:git/current-repo :config
                                    :auth/id-token :auth/access-token :auth/refresh-token]))
              (dedupe)))
        <init-sync-done? (p/deferred)
        task (m/reduce
              (constantly nil)
              (m/ap
                (let [m (m/?> (m/relieve state-flow))]
                  (when (and (contains? m :git/current-repo)
                             (nil? (:git/current-repo m)))
                    (log/error :sync-app-state
                               [m (select-keys @state/state
                                               [:git/current-repo
                                                :auth/id-token :auth/access-token :auth/refresh-token])]))
                  (c.m/<? (state/<invoke-db-worker :thread-api/sync-app-state m))
                  (p/resolve! <init-sync-done?))))]
    (c.m/run-task* task)
    <init-sync-done?))

(defn get-route-data
  [route-match]
  (when (seq route-match)
    {:to (get-in route-match [:data :name])
     :path-params (:path-params route-match)
     :query-params (:query-params route-match)}))

(defn- sync-ui-state!
  []
  (add-watch state/state
             :sync-ui-state
             (fn [_ _ prev current]
               (when-not @(:history/paused? @state/state)
                 (let [f (fn [state]
                           (-> (select-keys state [:ui/sidebar-open? :ui/sidebar-collapsed-blocks :sidebar/blocks])
                               (assoc :route-data (get-route-data (:route-match state)))))
                       old-state (f prev)
                       new-state (f current)]
                   (when (not= new-state old-state)
                     (undo-redo/record-ui-state! (state/get-current-repo) (ldb/write-transit-str {:old-state old-state :new-state new-state}))))))))

(defn transact!
  [repo tx-data tx-meta]
  (let [;; TODO: a better way to share those information with worker, maybe using the state watcher to notify the worker?
        context {:dev? config/dev?
                 :node-test? util/node-test?
                 :mobile? (util/mobile?)
                 :validate-db-options (:dev/validate-db-options (state/get-config))
                 :importing? (:graph/importing @state/state)
                 :date-formatter (state/get-date-formatter)
                 :journal-file-name-format (or (state/get-journal-file-name-format)
                                               date/default-journal-filename-formatter)
                 :export-bullet-indentation (state/get-export-bullet-indentation)
                 :preferred-format (state/get-preferred-format)
                 :journals-directory (config/get-journals-directory)
                 :whiteboards-directory (config/get-whiteboards-directory)
                 :pages-directory (config/get-pages-directory)}]
    (state/<invoke-db-worker :thread-api/transact repo tx-data tx-meta context)))

(defn- set-worker-fs
  [worker]
  (p/let [portal (js/MagicPortal. worker)
          fs (.get portal "fs")
          pfs (.get portal "pfs")
          worker-thread (.get portal "workerThread")]
    (set! (.-fs js/window) fs)
    (set! (.-pfs js/window) pfs)
    (set! (.-workerThread js/window) worker-thread)))

(defn- reload-app-if-old-db-worker-exists
  []
  (when (util/capacitor?)
    (log/info ::reload-app {:client-id @state/*db-worker-client-id})
    (when-let [client-id @state/*db-worker-client-id]
      (js/navigator.locks.request client-id #js {:mode "exclusive"
                                                 :ifAvailable true}
                                  (fn [lock]
                                    (log/info ::reload-app-lock {:acquired? (some? lock)})
                                    (when-not lock
                                      (js/window.location.reload)))))))

(defn start-db-worker!
  []
  (when-not util/node-test?
    (p/do!
     (reload-app-if-old-db-worker-exists)
     (let [worker-url (if config/publishing? "static/js/db-worker.js" "js/db-worker.js")
           worker (js/Worker. (str worker-url "?electron=" (util/electron?) "&publishing=" config/publishing?))
           _ (set-worker-fs worker)
           wrapped-worker* (Comlink/wrap worker)
           wrapped-worker (fn [qkw direct-pass? & args]
                            (p/let [result (.remoteInvoke ^js wrapped-worker*
                                                          (str (namespace qkw) "/" (name qkw))
                                                          direct-pass?
                                                          (cond
                                                            (= qkw :thread-api/set-infer-worker-proxy)
                                                            (first args)
                                                            direct-pass?
                                                            (into-array args)
                                                            :else
                                                            (ldb/write-transit-str args)))]
                              (if direct-pass?
                                result
                                (ldb/read-transit-str result))))
           t1 (util/time-ms)]
       (Comlink/expose #js{"remoteInvoke" thread-api/remote-function} worker)
       (worker-handler/handle-message! worker wrapped-worker)
       (reset! state/*db-worker wrapped-worker)
       (-> (p/let [_ (state/<invoke-db-worker :thread-api/init config/RTC-WS-URL)
                   _ (sync-app-state!)
                   _ (log/info "init worker spent" (str (- (util/time-ms) t1) "ms"))
                   _ (sync-ui-state!)
                   _ (ask-persist-permission!)
                   _ (state/pub-event! [:graph/sync-context])]
             (ldb/register-transact-fn!
              (fn worker-transact!
                [repo tx-data tx-meta]
                (db-transact/transact transact!
                                      (if (string? repo) repo (state/get-current-repo))
                                      tx-data
                                      (assoc tx-meta :client-id (:client-id @state/state))))))
           (p/catch (fn [error]
                      (log/error :init-sqlite-wasm-error ["Can't init SQLite wasm" error]))))))))

(defn <check-webgpu-available?
  []
  (if (some? js/navigator.gpu)
    (p/chain (js/navigator.gpu.requestAdapter) some?)
    (p/promise false)))

(defn start-inference-worker!
  []
  (when-not util/node-test?
    (let [worker-url "js/inference-worker.js"
          ^js worker (js/SharedWorker. (str worker-url "?electron=" (util/electron?) "&publishing=" config/publishing?))
          ^js port (.-port worker)
          wrapped-worker (Comlink/wrap port)
          t1 (util/time-ms)]
      (worker-handler/handle-message! port wrapped-worker)
      (reset! state/*infer-worker wrapped-worker)
      (p/do!
       (let [embedding-model-name (ldb/get-key-value (db/get-db) :logseq.kv/graph-text-embedding-model-name)]
         (.init wrapped-worker embedding-model-name))
       (log/info "init infer-worker spent:" (str (- (util/time-ms) t1) "ms"))))))

(defn <connect-db-worker-and-infer-worker!
  []
  (assert (and @state/*infer-worker @state/*db-worker))
  (state/<invoke-db-worker-direct-pass :thread-api/set-infer-worker-proxy (Comlink/proxy @state/*infer-worker)))

(defn <export-db!
  [repo data]
  (when (util/electron?)
    (ipc/ipc :db-export repo data)))

(defn- sqlite-error-handler
  [error]
  (state/pub-event! [:capture-error
                     {:error error
                      :payload {:type :sqlite-error}}])
  (if (util/mobile?)
    (js/window.location.reload)
    (do
      (log/error :sqlite-error error)
      (notification/show! [:div (str "SQLiteDB error: " error)] :error))))

(defrecord InBrowser []
  protocol/PersistentDB
  (<new [_this repo opts]
    (state/<invoke-db-worker :thread-api/create-or-open-db repo opts))

  (<list-db [_this]
    (-> (state/<invoke-db-worker :thread-api/list-db)
        (p/catch sqlite-error-handler)))

  (<unsafe-delete [_this repo]
    (state/<invoke-db-worker :thread-api/unsafe-unlink-db repo))

  (<release-access-handles [_this repo]
    (state/<invoke-db-worker :thread-api/release-access-handles repo))

  (<fetch-initial-data [_this repo opts]
    (-> (p/let [db-exists? (state/<invoke-db-worker :thread-api/db-exists repo)
                disk-db-data (when-not db-exists? (ipc/ipc :db-get repo))
                _ (when disk-db-data
                    (state/<invoke-db-worker-direct-pass :thread-api/import-db repo disk-db-data))
                _ (state/<invoke-db-worker :thread-api/create-or-open-db repo opts)]
          (state/<invoke-db-worker :thread-api/get-initial-data repo opts))
        (p/catch sqlite-error-handler)))

  (<export-db [_this repo opts]
    (-> (p/let [data (state/<invoke-db-worker-direct-pass :thread-api/export-db repo)]
          (when data
            (if (:return-data? opts)
              data
              (<export-db! repo data))))
        (p/catch (fn [error]
                   (log/error :export-db-error repo error "SQLiteDB save error")
                   (notification/show! [:div (str "SQLiteDB save error: " error)] :error) {}))))

  (<import-db [_this repo data]
    (-> (state/<invoke-db-worker-direct-pass :thread-api/import-db repo data)
        (p/catch (fn [error]
                   (log/error :import-db-error repo error "SQLiteDB import error")
                   (notification/show! [:div (str "SQLiteDB import error: " error)] :error) {})))))
