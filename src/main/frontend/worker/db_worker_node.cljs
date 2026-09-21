(ns frontend.worker.db-worker-node
  "Node.js daemon entrypoint for db-worker."
  (:require ["@logseq/graph-lifecycle" :as lifecycle]
            ["http" :as http]
            [clojure.string :as string]
            [frontend.worker.db-core :as db-core]
            [logseq.db-worker.daemon :as daemon]
            [frontend.worker.platform.node :as platform-node]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.common.version :as build-version]
            [logseq.cli.root-dir :as root-dir]
            [logseq.cli.style :as style]
            [logseq.db :as ldb]
            [logseq.db-worker.log :as db-worker-log]
            [logseq.db-worker.server-list :as server-list]
            [promesa.core :as p]))

(defonce ^:private *ready? (atom false))
(defonce ^:private *sse-clients (atom #{}))
(defonce ^:private *server-list-file (atom nil))
(defonce ^:private *admission (atom nil))
(defonce ^:private *platform (atom nil))
(defonce ^:private *stopping? (atom false))
(defonce ^:private *requests (atom #{}))
(def ^:private sse-keepalive-ms 15000)

(defn- server-list-file-path
  [root-dir]
  (server-list/path root-dir))

(def ^:private cors-headers
  #js {"Access-Control-Allow-Origin" "lsp://logseq.com"
       "Access-Control-Allow-Methods" "GET,POST,OPTIONS"
       "Access-Control-Allow-Headers" "Content-Type,Authorization"})

(defn- response-headers
  [headers]
  (js/Object.assign #js {} cors-headers headers))

(defn- send-no-content!
  [^js res]
  (.writeHead res 204 cors-headers)
  (.end res))

(defn- send-json!
  [^js res status payload]
  (.writeHead res status (response-headers #js {"Content-Type" "application/json"}))
  (.end res (js/JSON.stringify (clj->js payload))))

(defn- send-text!
  [^js res status text]
  (.writeHead res status (response-headers #js {"Content-Type" "text/plain"}))
  (.end res text))

(defn- <read-body-buffer
  [^js req]
  (p/create
   (fn [resolve reject]
     (let [chunks (array)]
       (.on req "data" (fn [chunk] (.push chunks chunk)))
       (.on req "end" (fn []
                        (resolve (js/Buffer.concat chunks))))
       (.on req "error" reject)))))

(defn- <read-body
  [^js req]
  (p/then (<read-body-buffer req)
          (fn [buf]
            (.toString buf "utf8"))))

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
          "--graphs-dir" (recur (subvec args 2) (assoc opts :graphs-dir (second args)))
          "--lifecycle-dir" (recur (subvec args 2) (assoc opts :lifecycle-dir (second args)))
          "--owner-source" (recur (subvec args 2) (assoc opts :owner-source (second args)))
          "--admission-ticket" (recur (subvec args 2) (assoc opts :admission-ticket (second args)))
          "--graph-generation" (recur (subvec args 2) (assoc opts :graph-generation (second args)))
          "--log-level" (recur (subvec args 2) (assoc opts :log-level (second args)))
          "--embedding-endpoint" (recur (subvec args 2) (assoc opts :embedding-endpoint (second args)))
          "--embedding-model-id" (recur (subvec args 2) (assoc opts :embedding-model-id (second args)))
          "--create-empty-db" (recur (subvec args 1) (assoc opts :create-empty-db? true))
          "--version" (recur (subvec args 1) (assoc opts :version? true))
          "--help" (recur (subvec args 1) (assoc opts :help? true))
          (recur (subvec args 1) opts))))))

(defn- normalize-owner-source
  [owner-source]
  (daemon/normalize-owner-source owner-source))

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
  (.writeHead res 200 (response-headers #js {"Content-Type" "text/event-stream"
                                              "Cache-Control" "no-cache"
                                              "Connection" "keep-alive"}))
  (.write res "\n")
  (swap! *sse-clients conj res)
  (let [keepalive-id (atom nil)]
    (reset! keepalive-id
            (js/setInterval
             (fn []
               (try
                 (.write res ": keepalive\n\n")
                 (catch :default _
                   (js/clearInterval @keepalive-id))))
             sse-keepalive-ms))
    (.on req "close" (fn []
                       (js/clearInterval @keepalive-id)
                       (swap! *sse-clients disj res)))))

(defn- <invoke!
  [^js proxy method-str method-kw args]
  (let [args-transit (if (string? args)
                       args
                       (ldb/write-transit-str args))
        started-at (js/Date.now)
        timeout-id (js/setTimeout
                    (fn []
                      (log/warn :db-worker-node-invoke-timeout
                                {:method (or method-kw method-str)
                                 :elapsed-ms (- (js/Date.now) started-at)}))
                    10000)]
    (-> (p/do! (.remoteInvoke proxy method-str args-transit))
        (p/finally (fn []
                     (js/clearTimeout timeout-id))))))

(defn- <invoke-binary!
  [^js proxy method-str method-kw repo payload]
  (let [started-at (js/Date.now)
        timeout-id (js/setTimeout
                    (fn []
                      (log/warn :db-worker-node-invoke-timeout
                                {:method (or method-kw method-str)
                                 :elapsed-ms (- (js/Date.now) started-at)}))
                    10000)]
    (-> (p/do! (.remoteInvokeBinary proxy method-str repo payload))
        (p/finally (fn []
                     (js/clearTimeout timeout-id))))))

(defn- <init-worker!
  [proxy]
  (let [method-kw :thread-api/init
        method-str (normalize-method-str method-kw)]
    (<invoke! proxy method-str method-kw [])))

(defn- <close-after!
  [task close!]
  (.then (js/Promise.resolve task)
         (fn [result]
           (.then (js/Promise.resolve (close!)) (fn [_] result)))
         (fn [error]
           (.then (js/Promise.resolve (close!)) (fn [_] (throw error))))))

(defn- <close-bound-repo!
  [proxy repo]
  (<close-after!
   (<close-after!
    (<invoke! proxy "thread-api/db-sync-stop" :thread-api/db-sync-stop [])
    (fn []
      (when-let [drain! (::platform-node/drain-writes! @*platform)] (drain!))))
   #(<invoke! proxy "thread-api/close-db" :thread-api/close-db [repo])))

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

          (not (graph-dir/same-repo? repo bound-repo))
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
          (fn [qkw & _args]
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
   :ownership-protocol "sqlite-v1"
   :ticket (some-> ^js @*admission .-ticket)
   :generation (some-> ^js @*admission .-generation)
   :root-dir root-dir
   :storage (select-keys (js->clj @*admission :keywordize-keys true) [:root :graphsDir :lifecycleDir])
   :revision (build-version/revision)})

(defn- log-invoke-error!
  [res error method-kw]
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
                :error error
                :message message
                :method method-kw})
    (send-json! res status payload)))

(defn- assert-lock-owner!
  []
  (try
    (lifecycle/assertOwnership @*admission)
    (catch :default error
      (throw (ex-info (.-message error) {:code :repo-locked} error)))))

(defn- handle-import-db-binary!
  [proxy bound-repo ^js parsed-url ^js req ^js res]
  (let [repo (.get (.-searchParams parsed-url) "repo")
        method-kw :thread-api/import-db-binary
        method-str (normalize-method-str method-kw)]
    (-> (p/let [binary (<read-body-buffer req)
                args-for-validation [repo binary]]
          (if-let [{:keys [status error]} (repo-error method-kw args-for-validation bound-repo)]
            (send-json! res status {:ok false :error error})
            (p/let [_ (assert-lock-owner!)
                    result (<invoke-binary! proxy method-str method-kw repo binary)]
              (send-json! res 200 {:ok true :resultTransit (ldb/write-transit-str result)}))))
        (p/catch (fn [error]
                   (log-invoke-error! res error method-kw))))))

(defn- handle-invoke!
  [proxy bound-repo ^js req ^js res]
  (->
   (p/let [body (<read-body req)
           payload (js/JSON.parse body)
           {:keys [method argsTransit args]} (js->clj payload :keywordize-keys true)
           method-kw (normalize-method-kw method)
           method-str (normalize-method-str method)]
     (-> (p/let [args' (or argsTransit args)
                 args-for-validation (if (string? args')
                                       (ldb/read-transit-str args')
                                       args')]
           (if-let [{:keys [status error]} (repo-error method-kw args-for-validation bound-repo)]
             (send-json! res status {:ok false :error error})
             (p/let [_ (when-not (contains? non-repo-methods method-kw)
                         (assert-lock-owner!))
                     result (<invoke! proxy method-str method-kw args')]
               (when-not (string? result)
                 (throw (ex-info "db-worker invoke result must be a transit string"
                                 {:method method-kw})))
               (send-json! res 200 {:ok true :resultTransit result}))))
         (p/catch (fn [error]
                    (log-invoke-error! res error method-kw)))))
   (p/catch (fn [error]
              (log-invoke-error! res error nil)))))

(defn- handle-shutdown!
  [stop-fn ^js res]
  (reset! *stopping? true)
  (send-json! res 200 {:ok true})
  (js/setTimeout (fn []
                   (when stop-fn
                     (stop-fn)))
                 10))

(defn- handle-request!
  [proxy {:keys [bound-repo stop-fn host port owner-source root-dir]} ^js req ^js res]
  (let [url (.-url req)
        parsed-url (js/URL. url "http://127.0.0.1")
        request-path (.-pathname parsed-url)
        method (.-method req)]
    (cond
      (= method "OPTIONS")
      (send-no-content! res)

      (= request-path "/healthz")
      (send-json! res (if @*ready? 200 503)
                  (health-payload {:bound-repo bound-repo
                                   :host host
                                   :port port
                                   :owner-source owner-source
                                   :root-dir root-dir}))

      (and (not= request-path "/v1/shutdown")
           (or @*stopping?
               (try
                 (lifecycle/checkAdmission @*admission)
                 false
                 (catch :default _ true))))
      (send-json! res 410 {:ok false :error {:code :graph-not-exists
                                            :message "Graph runtime is closed"}})

      (= request-path "/v1/events")
      (sse-handler req res)

      (= request-path "/v1/import-db-binary")
      (if (= method "POST")
        (handle-import-db-binary! proxy bound-repo parsed-url req res)
        (send-text! res 405 "method-not-allowed"))

      (= request-path "/v1/invoke")
      (if (= method "POST")
        (handle-invoke! proxy bound-repo req res)
        (send-text! res 405 "method-not-allowed"))

      (= url "/v1/shutdown")
      (if (= method "POST")
        (handle-shutdown! stop-fn res)
        (send-text! res 405 "method-not-allowed"))

      :else
      (send-text! res 404 "not-found"))))

(defn- make-server
  [proxy opts]
  (let [server (http/createServer
                (fn [^js req ^js res]
                  (let [result (handle-request! proxy opts req res)]
                    (when (p/promise? result)
                      (swap! *requests conj result)
                      (p/finally result #(swap! *requests disj result))))))]
    (set! (.-requestTimeout server) 0)
    (set! (.-headersTimeout server) 0)
    (set! (.-timeout server) 0)
    server))

(defn- show-help!
  []
  (println (str (style/bold "db-worker-node") " " (style/bold "options") ":"))
  (println (str "  " (style/bold "--root-dir") " <path>    (required)"))
  (println (str "  " (style/bold "--repo") " <name>        (required)"))
  (println (str "  " (style/bold "--create-empty-db") "  (start with empty initial datoms)"))
  (println (str "  " (style/bold "--embedding-endpoint") " <url>"))
  (println (str "  " (style/bold "--embedding-model-id") " <id>"))
  (println (str "  " (style/bold "--log-level") " <level>  (default info)"))
  (println (str "  " (style/bold "--version") "            (print build metadata and exit)"))
  (println "  logs: <root-dir>/graphs/<graph-dir>/db-worker-node-YYYYMMDD.log (retains 7)"))

(defn- startup-db-opts
  [{:keys [create-empty-db?]}]
  (if create-empty-db?
    {:datoms []
     :sync-download-graph? true}
    {}))

(defn- close-server!
  [^js server]
  (p/create
   (fn [resolve reject]
     (try
       (.close server (fn [error] (if error (reject error) (resolve true))))
       (.closeIdleConnections server)
       (catch :default error
         (reject error))))))

(defn- quiesce-runtime!
  []
  (reset! *ready? false)
  (reset! *stopping? true)
  (doseq [^js res @*sse-clients]
    (try
      (.end res)
      (catch :default _)))
  (reset! *sse-clients #{}))

(defn- make-stop!
  [{:keys [proxy repo server stopped? on-stopped!]}]
  (fn []
    (if @stopped?
      @stopped?
      (let [_ (quiesce-runtime!)
            result (-> (p/let [_ (p/all (map #(p/catch % identity) @*requests))
                               _ (<close-after! (<close-bound-repo! proxy repo)
                                                #(close-server! server))]
                         (db-worker-log/uninstall!)
                         (lifecycle/releaseOwnership @*admission)
                         (lifecycle/recordStop @*admission nil)
                         (when (fn? on-stopped!) (on-stopped! nil))
                         true)
                       (p/catch (fn [error]
                                  (lifecycle/recordStop @*admission error)
                                  (log/error :db-worker-node-close-failed error)
                                  (when (fn? on-stopped!) (on-stopped! error))
                                  (throw error)))
                       (p/finally #(db-worker-log/uninstall!)))]
        (reset! stopped? result)
        result))))

(defn- <resolve-listening-daemon!
  [{:keys [server proxy repo host port* stop!* stopped? on-stopped!]} resolve]
  (let [address (.address server)
        actual-port (if (number? address) address (.-port address))
        _ (reset! port* actual-port)
        stop! (make-stop! {:proxy proxy
                           :repo repo
                           :actual-port actual-port
                           :server server
                           :stopped? stopped?
                           :on-stopped! on-stopped!})]
    (p/let [_ (lifecycle/publish
               @*admission actual-port
               (fn []
                 (when-let [file-path @*server-list-file]
                   (server-list/append-entry! file-path {:pid (.-pid js/process)
                                                         :port actual-port}))
                 (reset! stop!* stop!)
                 (reset! *ready? true)))]
      (resolve {:host host
                :port actual-port
                :server server
                :stop! stop!}))))

(defn- start-http-server!
  [{:keys [proxy repo host port owner-source root-dir on-stopped!]}]
  (let [stop!* (atom nil)
        stopped? (atom nil)
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
                  (-> (<resolve-listening-daemon! {:server server
                                                   :proxy proxy
                                                   :repo repo
                                                   :host host
                                                   :port* port*
                                                   :stop!* stop!*
                                                   :stopped? stopped?
                                                   :owner-source owner-source
                                                   :root-dir root-dir
                                                   :on-stopped! on-stopped!}
                                                  resolve)
                      (p/catch (fn [error]
                                 (.close server)
                                 (reject error))))))
       (.on server "error" (fn [error]
                              (reject error)))))))

(defn start-daemon!
  [{:keys [root-dir repo log-level owner-source on-stopped!] :as opts}]
  (let [host "127.0.0.1"
        port 0
        owner-source (normalize-owner-source owner-source)]
    (cond
      (not (seq root-dir))
      (p/rejected (ex-info "root-dir is required" {:code :missing-root-dir}))

      (not (seq repo))
      (p/rejected (ex-info "repo is required" {:code :missing-repo}))

      :else
      (-> (p/let [root-dir (root-dir/ensure-root-dir! root-dir)
                  ^js storage (lifecycle/resolveStorage root-dir (or (:graphs-dir opts) (root-dir/graphs-dir root-dir)))
                  _ (when (and (:lifecycle-dir opts) (not= (:lifecycle-dir opts) (.-lifecycleDir storage)))
                      (throw (ex-info "Lifecycle directory identity mismatch" {})))
                  ^js admission (lifecycle/admit #js {:storage storage :repo repo :owner (name owner-source)
                                                  :ticket (:admission-ticket opts)
                                                  :generation (:graph-generation opts)})
                  _ (reset! *admission admission)
                  root-dir (.-root admission)
                  server-list-file (server-list-file-path root-dir)
                  proxy* (atom nil)]
          (-> (p/let [_ (do
                         (db-worker-log/install! {:root-dir root-dir :storage storage
                                                  :repo repo :log-level (keyword (or log-level "info"))})
                         (log/info :db-worker-node-version {:build-time (build-version/build-time)
                                                           :revision (build-version/revision)})
                         (reset! *ready? false)
                         (reset! *stopping? false)
                         (reset! *requests #{})
                         (reset! *platform nil)
                         (reset! *server-list-file server-list-file)
                         (set-main-thread-stub!))
                      platform (platform-node/node-platform {:root-dir root-dir :storage storage
                                                             :event-fn handle-event!
                                                             :write-guard-fn assert-lock-owner!
                                                             :owner-source owner-source
                                                             :embedding-endpoint (:embedding-endpoint opts)
                                                             :embedding-model-id (:embedding-model-id opts)})
                      _ (reset! *platform platform)
                      proxy (db-core/init-core! platform)
                      _ (reset! proxy* proxy)
                      _ (<init-worker! proxy)
                      _ (let [method-kw :thread-api/create-or-open-db
                              method-str (normalize-method-str method-kw)]
                          (<invoke! proxy method-str method-kw [repo (startup-db-opts opts)]))]
                (start-http-server! {:proxy proxy
                                     :repo repo
                                     :host host
                                     :port port
                                     :owner-source owner-source
                                     :root-dir root-dir
                                     :on-stopped! on-stopped!}))
              (p/catch (fn [error]
                         (-> (p/let [_ (when-let [proxy @proxy*]
                                         (<close-bound-repo! proxy repo))]
                               (db-worker-log/uninstall!)
                               (lifecycle/releaseOwnership admission)
                               (lifecycle/abortAdmission admission error))
                             (p/catch (fn [close-error]
                                        (lifecycle/abortAdmission admission close-error)
                                        (log/error :db-worker-node-startup-close-failed close-error)
                                        (.exit js/process 1)))
                             (p/then (fn [_] (throw error))))))))
          (p/catch (fn [e] (throw e)))))))

(defn main
  []
  (let [{:keys [root-dir repo help? version? owner-source] :as opts}
        (parse-args (.-argv js/process))]
    (when help?
      (show-help!)
      (.exit js/process 0))
    (when version?
      (println (build-version/format-version))
      (.exit js/process 0))
    (when-not (seq root-dir)
      (.error js/console "root-dir is required")
      (.exit js/process 1))
    (when-not (seq repo)
      (.error js/console "repo is required")
      (.exit js/process 1))
    (-> (p/let [{:keys [stop!] :as daemon}
                (start-daemon! {:root-dir root-dir
                                :graphs-dir (:graphs-dir opts)
                                :lifecycle-dir (:lifecycle-dir opts)
                                :repo repo
                                :admission-ticket (:admission-ticket opts)
                                :graph-generation (:graph-generation opts)
                                :create-empty-db? (:create-empty-db? opts)
                                :owner-source owner-source
                                :embedding-endpoint (:embedding-endpoint opts)
                                :embedding-model-id (:embedding-model-id opts)
                                :on-stopped! (fn [error]
                                               (log/info :db-worker-node-stopped nil)
                                               (.exit js/process (if error 1 0)))
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
                       (#{:missing-root-dir :root-dir-permission} code)
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
