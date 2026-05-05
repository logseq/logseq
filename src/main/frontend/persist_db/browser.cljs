(ns frontend.persist-db.browser
  "Browser db persist support, using sqlite-wasm.

   This interface uses clj data format as input."
  (:require ["comlink" :as Comlink]
            [electron.ipc :as ipc]
            [frontend.common.thread-api :as thread-api :refer [def-thread-api]]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db.transact :as db-transact]
            [frontend.handler.notification :as notification]
            [frontend.handler.worker :as worker-handler]
            [frontend.persist-db.protocol :as protocol]
            [frontend.state :as state]
            [frontend.undo-redo :as undo-redo]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def-thread-api :thread-api/input-idle?
  [repo diff]
  (state/input-idle? repo :diff diff))

(def-thread-api :thread-api/search-index-build-progress
  [repo {:keys [status progress processed total]}]
  (let [prev-state (get @state/state :search/index-build)
        current-repo (state/get-current-repo)
        visible-repo? (or (= repo current-repo)
                          (= repo (:repo prev-state)))]
    (when visible-repo?
      (case status
        :idle
        (state/set-state! :search/index-build
                          (assoc (or prev-state {})
                                 :running? false
                                 :repo repo))

        :running
        (state/set-state! :search/index-build
                          {:running? true
                           :repo repo
                           :progress (or progress 0)
                           :processed (or processed 0)
                           :total (or total 0)})

        :completed
        (state/set-state! :search/index-build
                          {:running? false
                           :repo repo
                           :progress (or progress 0)
                           :processed (or processed 0)
                           :total (or total 0)})
        nil))
    nil))

(defn- ask-persist-permission!
  []
  (p/let [persistent? (.persist js/navigator.storage)]
    (if persistent?
      (log/info :storage-persistent "Storage will not be cleared unless from explicit user action")
      (log/warn :opfs-storage-may-be-cleared "OPFS storage may be cleared by the browser under storage pressure."))))

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
                     (let [repo (state/get-current-repo)
                           ui-state-str (ldb/write-transit-str {:old-state old-state :new-state new-state})]
                       (undo-redo/record-ui-state! repo ui-state-str))))))))

(defn transact!
  [repo tx-data tx-meta]
  (let [;; TODO: a better way to share those information with worker, maybe using the state watcher to notify the worker?
        context {:dev? config/dev?
                 :node-test? util/node-test?
                 :mobile? (util/mobile?)
                 :validate-db-options (:dev/validate-db-options (state/get-config))
                 :importing? (:graph/importing @state/state)
                 :date-formatter (state/get-date-formatter)
                 :export-bullet-indentation (state/get-export-bullet-indentation)
                 :preferred-format (state/get-preferred-format)}]
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

(defn stop-db-worker!
  []
  (when @state/*db-worker
    (-> (state/<invoke-db-worker :thread-api/cancel-ui-requests {:reason :stop-db-worker})
        (p/catch (constantly nil))))
  (when-let [^js worker @state/*db-worker-thread]
    (set! (.-onmessage worker) nil)
    (.terminate worker))
  (set! (.-fs js/window) nil)
  (set! (.-pfs js/window) nil)
  (set! (.-workerThread js/window) nil)
  (reset! state/*db-worker-thread nil)
  (reset! state/*db-worker nil))

(defn start-db-worker!
  []
  (when-not util/node-test?
    (p/do!
     (reload-app-if-old-db-worker-exists)
     (stop-db-worker!)
     (let [worker-url (if config/publishing? "static/js/db-worker.js" "js/db-worker.js")
           worker (js/Worker.
                   (str worker-url
                        "?electron=" (util/electron?)
                        "&capacitor=" (util/capacitor?)
                        "&publishing=" config/publishing?))
           _ (set-worker-fs worker)
           wrapped-worker* (Comlink/wrap worker)
           wrapped-worker (fn [qkw & args]
                            (p/let [result (.remoteInvoke ^js wrapped-worker*
                                                          (str (namespace qkw) "/" (name qkw))
                                                          (ldb/write-transit-str args))]
                              (ldb/read-transit-str result)))
           t1 (util/time-ms)]
       (reset! state/*db-worker-thread worker)
       (Comlink/expose #js{"remoteInvoke" thread-api/remote-function} worker)
       (worker-handler/handle-message! worker wrapped-worker)
       (reset! state/*db-worker wrapped-worker)
       (-> (p/let [_ (state/<invoke-db-worker :thread-api/init)
                   _ (state/<invoke-db-worker :thread-api/set-db-sync-config
                                              {:enabled? true
                                               :ws-url (config/db-sync-ws-url)
                                               :http-base (config/db-sync-http-base)})
                   _ (state/pub-event! [:rtc/sync-app-state])
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

(defn <export-db!
  [repo]
  (when (util/electron?)
    (ipc/ipc :db-export repo false)))

(defn- sqlite-error-handler
  [error]
  (state/pub-event! [:capture-error
                     {:error error
                      :payload {:type :sqlite-error}}])
  (if (util/mobile?)
    (js/window.location.reload)
    (do
      (log/error :sqlite-error error)
      (notification/show! (t :storage/sqlitedb-error error) :error))))

(defn- <sync-markdown-mirror-setting!
  [repo]
  (if (and (util/electron?) repo)
    (state/<invoke-db-worker :thread-api/markdown-mirror-set-enabled
                             repo
                             (true? (get-in @state/state [:electron/user-cfgs :feature/markdown-mirror?])))
    (p/resolved nil)))

(defrecord InBrowser []
  protocol/PersistentDB
  (<new [_this repo opts]
    (p/let [result (state/<invoke-db-worker :thread-api/create-or-open-db repo opts)
            _ (<sync-markdown-mirror-setting! repo)]
      result))

  (<list-db [_this]
    (-> (state/<invoke-db-worker :thread-api/list-db)
        (p/catch sqlite-error-handler)))

  (<unsafe-delete [_this repo]
    (state/<invoke-db-worker :thread-api/unsafe-unlink-db repo))

  (<release-access-handles [_this repo]
    (state/<invoke-db-worker :thread-api/release-access-handles repo))

  (<fetch-initial-data [_this repo opts]
    (-> (p/let [_ (state/<invoke-db-worker :thread-api/create-or-open-db repo opts)
                _ (<sync-markdown-mirror-setting! repo)]
          (state/<invoke-db-worker :thread-api/get-initial-data repo opts))
        (p/catch sqlite-error-handler)))

  (<export-db [_this repo opts]
    (-> (p/let [base64 (state/<invoke-db-worker :thread-api/export-db-base64 repo)
                data (some-> base64 util/base64string-to-unit8array)]
          (when data
            (if (:return-data? opts)
              data
              (<export-db! repo))))
        (p/catch (fn [error]
                   (log/error :export-db-error repo error "SQLiteDB save error")
                   (notification/show! (t :storage/sqlitedb-save-error error) :error) {}))))

  (<import-db [_this repo data]
    (->
     (p/let [base64 (util/uint8array-to-base64string data)]
       (state/<invoke-db-worker :thread-api/import-db-base64 repo base64))
     (p/catch (fn [error]
                (log/error :import-db-error repo error "SQLiteDB import error")
                (notification/show! (t :storage/sqlitedb-import-error error) :error) {})))))
