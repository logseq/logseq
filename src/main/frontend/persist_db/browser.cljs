(ns frontend.persist-db.browser
  "Browser db persist support, using @logseq/sqlite-wasm.

   This interface uses clj data format as input."
  (:require ["comlink" :as Comlink]
            [electron.ipc :as ipc]
            [frontend.common.thread-api :as thread-api]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.transact :as db-transact]
            [frontend.handler.notification :as notification]
            [frontend.handler.worker :as worker-handler]
            [frontend.persist-db.protocol :as protocol]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- ask-persist-permission!
  []
  (p/let [persistent? (.persist js/navigator.storage)]
    (if persistent?
      (js/console.log "Storage will not be cleared unless from explicit user action")
      (js/console.warn "OPFS storage may be cleared by the browser under storage pressure."))))

(defn- get-worker-state-context
  [state]
  (let [config (:config state)]
    {:state (select-keys state [:git/current-repo config])
     :context {:dev? config/dev?
               :node-test? util/node-test?
               :validate-db-options (:dev/validate-db-options config)
               :importing? (:graph/importing state)
               :date-formatter (or
                                (:journal/page-title-format config)
                                (state/get-date-formatter))
               :journal-file-name-format (or (:journal/file-name-format config)
                                             (state/get-journal-file-name-format)
                                             date/default-journal-filename-formatter)
               :export-bullet-indentation (or
                                           (:export/bullet-indentation config)
                                           (state/get-export-bullet-indentation))
               :preferred-format (state/get-preferred-format)
               :journals-directory (config/get-journals-directory)
               :whiteboards-directory (config/get-whiteboards-directory)
               :pages-directory (config/get-pages-directory)}}))

(defn- sync-app-state!
  []
  (add-watch state/state
             :sync-worker-state
             (fn [_ _ prev current]
               (let [state1 (get-worker-state-context prev)
                     state2 (get-worker-state-context current)]
                 (when (not= state1 state2)
                   (state/<invoke-db-worker :thread-api/sync-app-state state2))))))

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
                     (state/<invoke-db-worker :thread-api/sync-ui-state
                                              (state/get-current-repo)
                                              {:old-state old-state :new-state new-state})))))))

(defn start-db-worker!
  []
  (when-not util/node-test?
    (let [worker-url (if (util/electron?)
                       "js/db-worker.js"
                       "static/js/db-worker.js")
          worker (js/Worker. (str worker-url "?electron=" (util/electron?) "&publishing=" config/publishing?))
          wrapped-worker* (Comlink/wrap worker)
          wrapped-worker (fn [qkw direct-pass-args? & args]
                           (-> (.remoteInvoke ^js wrapped-worker*
                                              (str (namespace qkw) "/" (name qkw))
                                              direct-pass-args?
                                              (if direct-pass-args?
                                                (into-array args)
                                                (ldb/write-transit-str args)))
                               (p/chain ldb/read-transit-str)))
          t1 (util/time-ms)]
      (Comlink/expose #js{"remoteInvoke" thread-api/remote-function} worker)
      (worker-handler/handle-message! worker wrapped-worker)
      (reset! state/*db-worker wrapped-worker)
      (-> (p/let [_ (state/<invoke-db-worker :thread-api/init config/RTC-WS-URL)
                  _ (js/console.debug (str "debug: init worker spent: " (- (util/time-ms) t1) "ms"))
                  _ (state/<invoke-db-worker :thread-api/sync-app-state (get-worker-state-context @state/state))
                  _ (sync-app-state!)
                  _ (sync-ui-state!)
                  _ (ask-persist-permission!)]
            (ldb/register-transact-fn!
             (fn worker-transact!
               [repo tx-data tx-meta]
               (db-transact/transact db/transact!
                                     (if (string? repo) repo (state/get-current-repo))
                                     tx-data
                                     tx-meta)))
            (db-transact/listen-for-requests))
          (p/catch (fn [error]
                     (prn :debug "Can't init SQLite wasm")
                     (js/console.error error)
                     (notification/show! "It seems that OPFS is not supported on this browser, please upgrade this browser to the latest version or use another browser." :error)))))))

(defn <export-db!
  [repo data]
  (cond
    (util/electron?)
    (ipc/ipc :db-export repo data)

    ;; TODO: browser nfs-supported? auto backup

    ;;
    :else
    nil))

(defn- sqlite-error-handler
  [error]
  (if (= "NoModificationAllowedError"  (.-name error))
    (do
      (js/console.error error)
      (state/pub-event! [:show/multiple-tabs-error-dialog]))
    (notification/show! [:div (str "SQLiteDB error: " error)] :error)))

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
                    (state/<invoke-db-worker-direct-pass-args :thread-api/import-db repo disk-db-data))
                _ (state/<invoke-db-worker :thread-api/create-or-open-db repo opts)]
          (state/<invoke-db-worker :thread-api/get-initial-data repo))
        (p/catch sqlite-error-handler)))

  (<export-db [_this repo opts]
    (-> (p/let [data (state/<invoke-db-worker :thread-api/export-db repo)]
          (when data
            (if (:return-data? opts)
              data
              (<export-db! repo data))))
        (p/catch (fn [error]
                   (prn :debug :save-db-error repo)
                   (js/console.error error)
                   (notification/show! [:div (str "SQLiteDB save error: " error)] :error) {}))))

  (<import-db [_this repo data]
    (-> (state/<invoke-db-worker-direct-pass-args :thread-api/import-db repo data)
        (p/catch (fn [error]
                   (prn :debug :import-db-error repo)
                   (js/console.error error)
                   (notification/show! [:div (str "SQLiteDB import error: " error)] :error) {})))))
