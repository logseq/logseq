(ns frontend.worker.db-worker-node
  "Node.js daemon entrypoint for db-worker."
  (:require ["fs" :as fs]
            ["http" :as http]
            ["path" :as node-path]
            [clojure.string :as string]
            [frontend.worker.db-core :as db-core]
            [frontend.worker.db-worker-node-lock :as db-lock]
            [frontend.worker.platform.node :as platform-node]
            [frontend.worker.state :as worker-state]
            [frontend.worker.version :as worker-version]
            [lambdaisland.glogi :as log]
            [logseq.cli.root-dir :as root-dir]
            [logseq.cli.style :as style]
            [logseq.db :as ldb]
            [logseq.db-worker.server-list :as server-list]
            [promesa.core :as p]))

(defonce ^:private *ready? (atom false))
(defonce ^:private *sse-clients (atom #{}))
(defonce ^:private *lock-info (atom nil))
(defonce ^:private *file-handler (atom nil))
(defonce ^:private *server-list-file (atom nil))

(defn- send-json!
  [^js res status payload]
  (.writeHead res status #js {"Content-Type" "application/json"})
  (.end res (js/JSON.stringify (clj->js payload))))

(defn- send-text!
  [^js res status text]
  (.writeHead res status #js {"Content-Type" "text/plain"})
  (.end res text))

(defn- <read-body
  [^js req]
  (p/create
   (fn [resolve reject]
     (let [chunks (array)]
       (.on req "data" (fn [chunk] (.push chunks chunk)))
       (.on req "end" (fn []
                        (let [buf (js/Buffer.concat chunks)]
                          (resolve (.toString buf "utf8")))))
       (.on req "error" reject)))))

(defn- parse-args
  [argv]
  (loop [args (vec (drop 2 argv))
         opts {}]
    (if (empty? args)
      opts
      (let [flag (first args)]
        (case flag
          "--root-dir" (recur (subvec args 2) (assoc opts :root-dir (second args)))
          "--repo" (recur (subvec args 2) (assoc opts :repo (second args)))
          "--owner-source" (recur (subvec args 2) (assoc opts :owner-source (second args)))
          "--server-list-file" (recur (subvec args 2) (assoc opts :server-list-file (second args)))
          "--log-level" (recur (subvec args 2) (assoc opts :log-level (second args)))
          "--create-empty-db" (recur (subvec args 1) (assoc opts :create-empty-db? true))
          "--version" (recur (subvec args 1) (assoc opts :version? true))
          "--help" (recur (subvec args 1) (assoc opts :help? true))
          (recur (subvec args 1) opts))))))

(defn- normalize-owner-source
  [owner-source]
  (db-lock/normalize-owner-source owner-source))

(defn- encode-event-type
  [type]
  (cond
    (keyword? type) (subs (str type) 1)
    (string? type) type
    (nil? type) nil
    :else (str type)))

(defn- encode-event-payload
  [payload]
  (if (string? payload)
    payload
    (ldb/write-transit-str payload)))

(defn- normalize-method-kw
  [method]
  (cond
    (keyword? method) method
    (string? method) (keyword method)
    (nil? method) nil
    :else (keyword (str method))))

(defn- normalize-method-str
  [method]
  (cond
    (keyword? method) (subs (str method) 1)
    (string? method) method
    (nil? method) nil
    :else (str method)))

(defn- handle-event!
  [type payload]
  (let [event (js/JSON.stringify (clj->js {:type (encode-event-type type)
                                           :payload (encode-event-payload payload)}))
        message (str "data: " event "\n\n")]
    (doseq [^js res @*sse-clients]
      (try
        (.write res message)
        (catch :default e
          (log/error :sse-write-failed e))))))

(defn- sse-handler
  [^js req ^js res]
  (.writeHead res 200 #js {"Content-Type" "text/event-stream"
                           "Cache-Control" "no-cache"
                           "Connection" "keep-alive"})
  (.write res "\n")
  (swap! *sse-clients conj res)
  (.on req "close" (fn []
                     (swap! *sse-clients disj res))))

(defn- <invoke!
  [^js proxy method-str method-kw direct-pass? args]
  (let [args' (if direct-pass?
                (into-array (or args []))
                (if (string? args)
                  args
                  (ldb/write-transit-str args)))
        started-at (js/Date.now)
        timeout-id (js/setTimeout
                    (fn []
                      (log/warn :db-worker-node-invoke-timeout
                                {:method (or method-kw method-str)
                                 :elapsed-ms (- (js/Date.now) started-at)}))
                    10000)]
    (-> (p/do! (.remoteInvoke proxy method-str (boolean direct-pass?) args'))
        (p/finally (fn []
                     (js/clearTimeout timeout-id))))))

(defn- <init-worker!
  [proxy]
  (let [method-kw :thread-api/init
        method-str (normalize-method-str method-kw)]
    (<invoke! proxy method-str method-kw true #js [])))

(defn- <close-bound-repo!
  [proxy repo]
  (if (string/blank? repo)
    (p/resolved nil)
    (let [method-kw :thread-api/close-db
          method-str (normalize-method-str method-kw)]
      (-> (<invoke! proxy method-str method-kw false [repo])
          (p/catch (fn [error]
                     (log/warn :db-worker-node-close-db-before-stop-failed
                               {:repo repo
                                :error error})
                     nil))))))

(def ^:private non-repo-methods
  #{:thread-api/init
    :thread-api/set-db-sync-config
    :thread-api/get-db-sync-config
    :thread-api/db-sync-stop
    :thread-api/db-sync-list-remote-graphs
    :thread-api/db-sync-update-presence
    :thread-api/db-sync-ensure-user-rsa-keys
    :thread-api/list-db
    :thread-api/get-version
    :thread-api/set-context
    :thread-api/sync-app-state
    :thread-api/update-thread-atom
    :thread-api/mobile-logs
    :thread-api/rtc-start
    :thread-api/rtc-stop
    :thread-api/rtc-toggle-auto-push
    :thread-api/rtc-toggle-remote-profile
    :thread-api/rtc-grant-graph-access
    :thread-api/rtc-get-graphs
    :thread-api/rtc-delete-graph
    :thread-api/rtc-get-users-info
    :thread-api/rtc-get-block-content-versions
    :thread-api/rtc-get-debug-state
    :thread-api/rtc-request-download-graph
    :thread-api/rtc-wait-download-graph-info-ready
    :thread-api/rtc-download-graph-from-s3
    :thread-api/get-user-rsa-key-pair
    :thread-api/init-user-rsa-key-pair
    :thread-api/reset-user-rsa-key-pair
    :thread-api/change-e2ee-password
    :thread-api/get-e2ee-password
    :thread-api/save-e2ee-password
    :thread-api/verify-and-save-e2ee-password
    :thread-api/resolve-ui-request
    :thread-api/reject-ui-request
    :thread-api/cancel-ui-requests})

(def ^:private write-methods
  #{:thread-api/transact
    :thread-api/import-db
    :thread-api/import-db-base64
    :thread-api/backup-db-sqlite
    :thread-api/import-edn
    :thread-api/unsafe-unlink-db
    :thread-api/search-upsert-blocks
    :thread-api/search-delete-blocks
    :thread-api/search-truncate-tables})

(defn- repo-arg
  [args]
  (cond
    (js/Array.isArray args) (aget args 0)
    (sequential? args) (first args)
    :else nil))

(defn- repo-error
  [method args bound-repo]
  (let [method-kw (normalize-method-kw method)]
    (when-not (contains? non-repo-methods method-kw)
      (let [repo (repo-arg args)]
        (cond
          (or (not (string? repo))
              (string/blank? repo))
          {:status 400
           :error {:code :missing-repo
                   :message "repo is required"}}

          (not= repo bound-repo)
          {:status 409
           :error {:code :repo-mismatch
                   :message "repo does not match bound repo"
                   :repo repo
                   :bound-repo bound-repo}}

          :else
          nil)))))

(defn- set-main-thread-stub!
  []
  (reset! worker-state/*main-thread
          (fn [qkw _direct-pass? & _args]
            (p/rejected (ex-info "main-thread is not available in db-worker-node"
                                 {:method qkw})))))

(defn- query-validation-error?
  [data]
  (= :parser/query (:error data)))

(defn- notification-validation-error?
  [data]
  (= :notification (:type data)))

(defn- invoke-error-status
  [data]
  (cond
    (query-validation-error? data) 400
    (notification-validation-error? data) 400
    (#{:missing-repo :repo-mismatch :repo-locked} (:code data)) 409
    (number? (:status data)) (:status data)
    :else 500))

(defn- invoke-error-code
  [data]
  (cond
    (query-validation-error? data) :invalid-query
    (:code data) (:code data)
    (notification-validation-error? data) :validation-error
    :else :exception))

(defn- invoke-error-message
  [error data]
  (or (get-in data [:payload :message])
      (.-message error)
      (str error)))

(defn- health-payload
  [{:keys [bound-repo host port owner-source root-dir]}]
  {:repo bound-repo
   :status (if @*ready? "ready" "starting")
   :host host
   :port (if (satisfies? IDeref port) @port port)
   :pid (.-pid js/process)
   :owner-source (name (normalize-owner-source owner-source))
   :root-dir root-dir
   :revision (worker-version/revision)})

(defn- make-server
  [proxy {:keys [bound-repo stop-fn host port owner-source root-dir]}]
  (http/createServer
   (fn [^js req ^js res]
     (let [url (.-url req)
           method (.-method req)]
       (cond
         (= url "/healthz")
         (send-json! res (if @*ready? 200 503)
                     (health-payload {:bound-repo bound-repo
                                      :host host
                                      :port port
                                      :owner-source owner-source
                                      :root-dir root-dir}))

         (= url "/v1/events")
         (sse-handler req res)

         (= url "/v1/invoke")
         (if (= method "POST")
           (-> (p/let [body (<read-body req)
                       payload (js/JSON.parse body)
                       {:keys [method directPass argsTransit args]} (js->clj payload :keywordize-keys true)
                       method-kw (normalize-method-kw method)
                       method-str (normalize-method-str method)
                       direct-pass? (boolean directPass)
                       args' (if direct-pass?
                               args
                               (or argsTransit args))
                       args-for-validation (if direct-pass?
                                             args'
                                             (if (string? args')
                                               (ldb/read-transit-str args')
                                               args'))]
                 (if-let [{:keys [status error]} (repo-error method-kw args-for-validation bound-repo)]
                   (send-json! res status {:ok false :error error})
                   (p/let [_ (when (contains? write-methods method-kw)
                               (let [{:keys [path lock]} @*lock-info]
                                 (db-lock/assert-lock-owner! path lock)))
                           result (<invoke! proxy method-str method-kw direct-pass? args')]
                     (send-json! res 200 (if direct-pass?
                                           {:ok true :result result}
                                           {:ok true :resultTransit result})))))
               (p/catch (fn [error]
                          (let [data (ex-data error)
                                status (invoke-error-status data)
                                code (invoke-error-code data)
                                message (invoke-error-message error data)
                                payload {:ok false
                                         :error {:code code
                                                 :message message}}]
                            (log/error :db-worker-node-invoke-failed
                                       {:status status
                                        :code code
                                        :message message})
                            (send-json! res status payload)))))
           (send-text! res 405 "method-not-allowed"))

         (= url "/v1/shutdown")
         (if (= method "POST")
           (do
             (send-json! res 200 {:ok true})
             (js/setTimeout (fn []
                              (when stop-fn
                                (stop-fn)))
                            10))
           (send-text! res 405 "method-not-allowed"))

         :else
         (send-text! res 404 "not-found"))))))

(defn- show-help!
  []
  (println (str (style/bold "db-worker-node") " " (style/bold "options") ":"))
  (println (str "  " (style/bold "--root-dir") " <path>    (default ~/logseq)"))
  (println (str "  " (style/bold "--repo") " <name>        (required)"))
  (println (str "  " (style/bold "--create-empty-db") "  (start with empty initial datoms)"))
  (println (str "  " (style/bold "--log-level") " <level>  (default info)"))
  (println (str "  " (style/bold "--version") "            (print build metadata and exit)"))
  (println "  logs: <root-dir>/graphs/<graph-dir>/db-worker-node-YYYYMMDD.log (retains 7)"))

(defn- startup-db-opts
  [{:keys [create-empty-db?]}]
  (if create-empty-db?
    {:datoms []
     :sync-download-graph? true}
    {}))

(defn- pad2
  [value]
  (if (< value 10)
    (str "0" value)
    (str value)))

(defn- yyyymmdd
  [^js date]
  (str (.getFullYear date)
       (pad2 (inc (.getMonth date)))
       (pad2 (.getDate date))))

(defn- log-path
  [root-dir repo]
  (let [root-dir (db-lock/resolve-root-dir root-dir)
        repo-dir (db-lock/repo-dir (db-lock/graphs-dir root-dir) repo)
        date-str (yyyymmdd (js/Date.))]
    (node-path/join repo-dir (str "db-worker-node-" date-str ".log"))))

(defn- log-files
  [repo-dir]
  (->> (when (fs/existsSync repo-dir)
         (fs/readdirSync repo-dir))
       (filter (fn [^js name]
                 (re-matches #"db-worker-node-\d{8}\.log" name)))
       (sort)))

(defn- enforce-log-retention!
  [repo-dir]
  (let [files (log-files repo-dir)
        excess (max 0 (- (count files) 7))]
    (doseq [name (take excess files)]
      (fs/unlinkSync (node-path/join repo-dir name)))))

(defn- format-log-line
  [{:keys [time level message logger-name exception]}]
  (let [ts (.toISOString (js/Date. time))
        base (str ts
                  " ["
                  (name level)
                  "] ["
                  logger-name
                  "] "
                  (pr-str message))]
    (str base (when exception (str " " (pr-str exception))) "\n")))

(defn- install-file-logger!
  [{:keys [root-dir repo log-level]}]
  (let [root-dir (db-lock/resolve-root-dir root-dir)
        repo-dir (db-lock/repo-dir (db-lock/graphs-dir root-dir) repo)
        file-path (log-path root-dir repo)]
    (fs/mkdirSync repo-dir #js {:recursive true})
    (fs/writeFileSync file-path "" #js {:flag "a"})
    (enforce-log-retention! repo-dir)
    (when-let [handler @*file-handler]
      (log/remove-handler handler))
    (let [handler (fn [record]
                    (fs/appendFileSync file-path (format-log-line record)))]
      (reset! *file-handler handler)
      (log/add-handler handler))
    (log/set-levels {:glogi/root log-level})
    file-path))

(defn- assert-lock-owner!
  []
  (let [{:keys [path lock]} @*lock-info]
    (db-lock/assert-lock-owner! path lock)))

(defn- recreate-lock!
  [target-repo]
  (p/let [{:keys [path lock]} @*lock-info
          _ (when-not (and (seq path) lock)
              (throw (ex-info "lock owner missing"
                              {:code :repo-locked
                               :repo target-repo})))
          _ (when (and (seq target-repo)
                       (not= target-repo (:repo lock)))
              (throw (ex-info "graph lock repo mismatch"
                              {:code :repo-locked
                               :repo target-repo
                               :bound-repo (:repo lock)})))
          updated-lock (db-lock/update-lock! path lock)]
    (swap! *lock-info assoc :lock updated-lock)
    nil))

(defn start-daemon!
  [{:keys [root-dir repo log-level owner-source on-stopped! server-list-file] :as opts}]
  (let [host "127.0.0.1"
        port 0
        owner-source (normalize-owner-source owner-source)]
    (if-not (seq repo)
      (p/rejected (ex-info "repo is required" {:code :missing-repo}))
      (try
        (let [root-dir (root-dir/ensure-root-dir! root-dir)]
          (install-file-logger! {:root-dir root-dir
                                 :repo repo
                                 :log-level (keyword (or log-level "info"))})
          (reset! *ready? false)
          (reset! *lock-info nil)
          (reset! *server-list-file server-list-file)
          (set-main-thread-stub!)
          (-> (p/let [platform (platform-node/node-platform {:root-dir root-dir
                                                             :event-fn handle-event!
                                                             :write-guard-fn assert-lock-owner!
                                                             :owner-source owner-source
                                                             :recreate-lock-fn recreate-lock!})
                      proxy (db-core/init-core! platform)
                      _ (<init-worker! proxy)
                      {:keys [path lock]} (db-lock/ensure-lock! {:root-dir root-dir
                                                                 :repo repo
                                                                 :owner-source owner-source})
                      _ (reset! *lock-info {:path path :lock lock})
                      _ (let [method-kw :thread-api/create-or-open-db
                              method-str (normalize-method-str method-kw)]
                          (<invoke! proxy method-str method-kw false [repo (startup-db-opts opts)]))]
                (let [stop!* (atom nil)
                      stopped? (atom false)
                      port* (atom nil)
                      server (make-server proxy {:bound-repo repo
                                                 :host host
                                                 :port port*
                                                 :owner-source owner-source
                                                 :root-dir root-dir
                                                 :stop-fn (fn []
                                                            (when-let [stop! @stop!*]
                                                              (stop!)))})]
                  (p/create
                   (fn [resolve reject]
                     (.listen server port host
                              (fn []
                                (let [address (.address server)
                                      actual-port (if (number? address)
                                                    address
                                                    (.-port address))
                                      _ (reset! port* actual-port)
                                      stop! (fn []
                                              (if @stopped?
                                                (p/resolved true)
                                                (do
                                                  (reset! stopped? true)
                                                  (-> (p/let [_ (<close-bound-repo! proxy repo)]
                                                        (reset! *ready? false)
                                                        (when-let [path @*server-list-file]
                                                          (server-list/remove-entry! path {:pid (.-pid js/process)
                                                                                           :port actual-port}))
                                                        (doseq [^js res @*sse-clients]
                                                          (try
                                                            (.end res)
                                                            (catch :default _)))
                                                        (reset! *sse-clients #{})
                                                        (when-let [lock-path (:path @*lock-info)]
                                                          (db-lock/remove-lock! lock-path))
                                                        (p/create
                                                         (fn [resolve _]
                                                           (try
                                                             (.close server (fn [] (resolve true)))
                                                             (catch :default _
                                                               (resolve true)))))
                                                        true)
                                                      (p/finally
                                                        (fn []
                                                          (when (fn? on-stopped!)
                                                            (on-stopped!))))))))]
                                  (reset! *ready? true)
                                  (when-let [path @*server-list-file]
                                    (server-list/append-entry! path {:pid (.-pid js/process)
                                                                     :port actual-port}))
                                  (reset! stop!* stop!)
                                  (resolve {:host host
                                            :port actual-port
                                            :server server
                                            :stop! stop!}))))
                     (.on server "error" (fn [error]
                                           (when-let [lock-path (:path @*lock-info)]
                                             (db-lock/remove-lock! lock-path))
                                           (reject error)))))))
              (p/catch (fn [e]
                         (when-let [lock-path (:path @*lock-info)]
                           (db-lock/remove-lock! lock-path))
                         (throw e)))))
        (catch :default e
          (p/rejected e))))))

(defn main
  []
  (let [{:keys [root-dir repo help? version? owner-source server-list-file] :as opts}
        (parse-args (.-argv js/process))]
    (when help?
      (show-help!)
      (.exit js/process 0))
    (when version?
      (println (worker-version/format-version))
      (.exit js/process 0))
    (when-not (seq repo)
      (show-help!)
      (.exit js/process 1))
    (-> (p/let [{:keys [stop!] :as daemon}
                (start-daemon! {:root-dir root-dir
                                :repo repo
                                :create-empty-db? (:create-empty-db? opts)
                                :owner-source owner-source
                                :server-list-file server-list-file
                                :on-stopped! (fn []
                                               (log/info :db-worker-node-stopped nil)
                                               (.exit js/process 0))
                                :log-level (:log-level opts)})]
          (log/info :db-worker-node-ready {:host (:host daemon) :port (:port daemon)})
          (let [shutdown (fn [] (stop!))]
            (.on js/process "SIGINT" shutdown)
            (.on js/process "SIGTERM" shutdown)))
        (p/catch (fn [error]
                   (let [data (ex-data error)
                         code (:code data)
                         message (or (.-message error) (str error))]
                     (cond
                       (= :root-dir-permission code)
                       (.error js/console message)

                       (or (string/includes? message ".node")
                           (string/includes? message "Cannot find module")
                           (string/includes? message "MODULE_NOT_FOUND")
                           (string/includes? message "bindings file"))
                       (.error js/console
                               (str "db-worker-node failed to start: bundled runtime files are missing or incomplete. "
                                    "Rebuild with `pnpm db-worker-node:release:bundle` and ensure "
                                    "`dist/db-worker-node.js` exists and assets listed in "
                                    "`dist/db-worker-node-assets.json` are next to it. "
                                    "Root error: "
                                    message))

                       :else
                       (.error js/console (str "db-worker-node failed to start: " message)))
                     (when-let [stack (.-stack error)]
                       (.error js/console stack))
                     (.exit js/process 1)))))))
