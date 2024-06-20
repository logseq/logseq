(ns frontend.persist-db.browser
  "Browser db persist support, using @logseq/sqlite-wasm.

   This interface uses clj data format as input."
  (:require ["comlink" :as Comlink]
            [frontend.persist-db.protocol :as protocol]
            [frontend.config :as config]
            [promesa.core :as p]
            [frontend.util :as util]
            [frontend.handler.notification :as notification]
            [cljs-bean.core :as bean]
            [frontend.state :as state]
            [electron.ipc :as ipc]
            [frontend.handler.worker :as worker-handler]
            [logseq.db :as ldb]
            [frontend.db.transact :as db-transact]
            [frontend.date :as date]))

(defonce *worker state/*db-worker)

(defn- ask-persist-permission!
  []
  (p/let [persistent? (.persist js/navigator.storage)]
    (if persistent?
      (js/console.log "Storage will not be cleared unless from explicit user action")
      (js/console.warn "OPFS storage may be cleared by the browser under storage pressure."))))

(defn- sync-app-state!
  [^js worker]
  (add-watch state/state
             :sync-worker-state
             (fn [_ _ prev current]
               (let [new-state (cond-> {}
                                 (not= (:git/current-repo prev)
                                       (:git/current-repo current))
                                 (assoc :git/current-repo (:git/current-repo current))
                                 (not= (:config prev) (:config current))
                                 (assoc :config (:config current)))]
                 (when (seq new-state)
                   (.sync-app-state worker (ldb/write-transit-str new-state)))))))

(defn get-route-data
    [route-match]
    (when (seq route-match)
      {:to (get-in route-match [:data :name])
       :path-params (:path-params route-match)
       :query-params (:query-params route-match)}))

(defn- sync-ui-state!
  [^js worker]
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
                     (.sync-ui-state worker (state/get-current-repo)
                                     (ldb/write-transit-str {:old-state old-state
                                                             :new-state new-state}))))))))

(defn transact!
  [^js worker repo tx-data tx-meta]
  (let [tx-meta' (ldb/write-transit-str tx-meta)
        tx-data' (ldb/write-transit-str tx-data)
        ;; TODO: a better way to share those information with worker, maybe using the state watcher to notify the worker?
        context {:dev? config/dev?
                 :node-test? util/node-test?
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
    (if worker
      (.transact worker repo tx-data' tx-meta'
                 (ldb/write-transit-str context))
      (notification/show! "Latest change was not saved! Please restart the application." :error))))

(defn start-db-worker!
  []
  (when-not util/node-test?
    (let [worker-url (if (util/electron?)
                       "js/db-worker.js"
                       "static/js/db-worker.js")
          worker (js/Worker. (str worker-url "?electron=" (util/electron?) "&publishing=" config/publishing?))
          wrapped-worker (Comlink/wrap worker)
          t1 (util/time-ms)]
      (worker-handler/handle-message! worker wrapped-worker)
      (reset! *worker wrapped-worker)
      (-> (p/let [_ (.init wrapped-worker config/RTC-WS-URL)
                  _ (js/console.debug (str "debug: init worker spent: " (- (util/time-ms) t1) "ms"))
                  _ (.sync-app-state wrapped-worker
                                     (ldb/write-transit-str
                                      {:git/current-repo (state/get-current-repo)
                                       :config (:config @state/state)}))
                  _ (sync-app-state! wrapped-worker)
                  _ (sync-ui-state! wrapped-worker)
                  _ (ask-persist-permission!)
                  _ (state/pub-event! [:graph/sync-context])]
            (ldb/register-transact-fn!
             (fn worker-transact!
               [repo tx-data tx-meta]
               (db-transact/transact (partial transact! wrapped-worker)
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
    (state/pub-event! [:show/multiple-tabs-error-dialog])
    (notification/show! [:div (str "SQLiteDB error: " error)] :error)))

(defrecord InBrowser []
  protocol/PersistentDB
  (<new [_this repo opts]
    (when-let [^js sqlite @*worker]
      (.createOrOpenDB sqlite repo (ldb/write-transit-str opts))))

  (<list-db [_this]
    (when-let [^js sqlite @*worker]
      (-> (.listDB sqlite)
          (p/then (fn [result]
                    (bean/->clj result)))
          (p/catch sqlite-error-handler))))

  (<unsafe-delete [_this repo]
    (when-let [^js sqlite @*worker]
      (.unsafeUnlinkDB sqlite repo)))

  (<release-access-handles [_this repo]
    (when-let [^js sqlite @*worker]
      (.releaseAccessHandles sqlite repo)))

  (<fetch-initial-data [_this repo _opts]
    (when-let [^js sqlite @*worker]
      (-> (p/let [db-exists? (.dbExists sqlite repo)
                  disk-db-data (when-not db-exists? (ipc/ipc :db-get repo))
                  _ (when disk-db-data
                      (.importDb sqlite repo disk-db-data))
                  _ (.createOrOpenDB sqlite repo (ldb/write-transit-str {}))]
            (.getInitialData sqlite repo))
          (p/catch sqlite-error-handler))))

  (<export-db [_this repo opts]
    (when-let [^js sqlite @*worker]
      (-> (p/let [data (.exportDB sqlite repo)]
            (when data
              (if (:return-data? opts)
                data
                (<export-db! repo data))))
          (p/catch (fn [error]
                     (prn :debug :save-db-error repo)
                     (js/console.error error)
                     (notification/show! [:div (str "SQLiteDB save error: " error)] :error) {})))))

  (<import-db [_this repo data]
    (when-let [^js sqlite @*worker]
      (-> (.importDb sqlite repo data)
          (p/catch (fn [error]
                     (prn :debug :import-db-error repo)
                     (js/console.error error)
                     (notification/show! [:div (str "SQLiteDB import error: " error)] :error) {}))))))

(comment
  (defn clean-all-dbs!
    []
    (when-let [sqlite @*sqlite]
      (.dangerousRemoveAllDbs sqlite)
      (state/set-current-repo! nil))))
