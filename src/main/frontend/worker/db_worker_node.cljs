(ns frontend.worker.db-worker-node
  "Node.js daemon entrypoint for db-worker."
  (:require ["http" :as http]
            [clojure.string :as string]
            [frontend.worker.db-core :as db-core]
            [frontend.worker.db-worker-node-lock :as db-lock]
            [frontend.worker.platform.node :as platform-node]
            [frontend.worker.state :as worker-state]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defonce ^:private *ready? (atom false))
(defonce ^:private *sse-clients (atom #{}))
(defonce ^:private *lock-info (atom nil))

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

(defn- authorized?
  [^js req auth-token]
  (if (string/blank? auth-token)
    true
    (let [auth (gobj/get (.-headers req) "authorization")]
      (= auth (str "Bearer " auth-token)))))

(defn- parse-args
  [argv]
  (loop [args (vec (drop 2 argv))
         opts {}]
    (if (empty? args)
      opts
      (let [[flag value & remaining] args]
        (case flag
          "--data-dir" (recur remaining (assoc opts :data-dir value))
          "--repo" (recur remaining (assoc opts :repo value))
          "--rtc-ws-url" (recur remaining (assoc opts :rtc-ws-url value))
          "--log-level" (recur remaining (assoc opts :log-level value))
          "--auth-token" (recur remaining (assoc opts :auth-token value))
          "--help" (recur remaining (assoc opts :help? true))
          (recur remaining opts))))))

(defn- encode-event-payload
  [payload]
  (if (string? payload)
    payload
    (ldb/write-transit-str payload)))

(defn- handle-event!
  [type payload]
  (let [event (js/JSON.stringify (clj->js {:type type}
                                          :payload (encode-event-payload payload)))
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
  [^js proxy method direct-pass? args]
  (let [args' (if direct-pass?
                (into-array (or args []))
                (if (string? args)
                  args
                  (ldb/write-transit-str args)))
        started-at (js/Date.now)
        timeout-id (js/setTimeout
                    (fn []
                      (log/warn :db-worker-node-invoke-timeout
                                {:method method
                                 :elapsed-ms (- (js/Date.now) started-at)}))
                    10000)]
    (-> (.remoteInvoke proxy method (boolean direct-pass?) args')
        (p/finally (fn []
                     (js/clearTimeout timeout-id))))))

(defn- <init-worker!
  [proxy rtc-ws-url]
  (<invoke! proxy "thread-api/init" true #js [rtc-ws-url]))

(def ^:private non-repo-methods
  #{"thread-api/init"
    "thread-api/list-db"
    "thread-api/get-version"
    "thread-api/set-infer-worker-proxy"})

(defn- repo-arg
  [args]
  (cond
    (js/Array.isArray args) (aget args 0)
    (sequential? args) (first args)
    :else nil))

(defn- repo-error
  [method args bound-repo]
  (when-not (contains? non-repo-methods method)
    (let [repo (repo-arg args)]
      (cond
        (not (seq repo))
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
        nil))))

(defn- set-main-thread-stub!
  []
  (reset! worker-state/*main-thread
          (fn [qkw _direct-pass? _args]
            (p/rejected (ex-info "main-thread is not available in db-worker-node"
                                 {:method qkw})))))

(defn- make-server
  [proxy {:keys [auth-token bound-repo stop-fn]}]
  (http/createServer
   (fn [^js req ^js res]
     (let [url (.-url req)
           method (.-method req)]
       (cond
         (= url "/healthz")
         (send-text! res 200 "ok")

         (= url "/readyz")
         (if @*ready?
           (send-text! res 200 "ok")
           (send-text! res 503 "not-ready"))

         (= url "/v1/events")
         (if (authorized? req auth-token)
           (sse-handler req res)
           (send-text! res 401 "unauthorized"))

         (= url "/v1/invoke")
         (if (authorized? req auth-token)
           (if (= method "POST")
             (-> (p/let [body (<read-body req)
                         payload (js/JSON.parse body)
                         {:keys [method directPass argsTransit args]} (js->clj payload :keywordize-keys true)
                         direct-pass? (boolean directPass)
                         args' (if direct-pass?
                                 args
                                 (or argsTransit args))
                         args-for-validation (if direct-pass?
                                               args'
                                               (if (string? args')
                                                 (ldb/read-transit-str args')
                                                 args'))]
                   (if-let [{:keys [status error]} (repo-error method args-for-validation bound-repo)]
                     (send-json! res status {:ok false :error error})
                     (p/let [result (<invoke! proxy method direct-pass? args')]
                       (send-json! res 200 (if direct-pass?
                                             {:ok true :result result}
                                             {:ok true :resultTransit result})))))
                 (p/catch (fn [e]
                            (log/error :db-worker-node-http-invoke-failed e)
                            (send-json! res 500 {:ok false
                                                 :error (if (instance? js/Error e)
                                                          {:message (.-message e)
                                                           :stack (.-stack e)}
                                                          e)}))))
             (send-text! res 405 "method-not-allowed"))
           (send-text! res 401 "unauthorized"))

         (= url "/v1/shutdown")
         (if (authorized? req auth-token)
           (if (= method "POST")
             (do
               (send-json! res 200 {:ok true})
               (js/setTimeout (fn []
                                (when stop-fn
                                  (stop-fn)))
                              10))
             (send-text! res 405 "method-not-allowed"))
           (send-text! res 401 "unauthorized"))

         :else
         (send-text! res 404 "not-found"))))))

(defn- show-help!
  []
  (println "db-worker-node options:")
  (println "  --data-dir <path>    (default ~/.logseq/db-worker)")
  (println "  --repo <name>        (required)")
  (println "  --rtc-ws-url <url>   (optional)")
  (println "  --log-level <level>  (default info)")
  (println "  --auth-token <token> (optional)"))

(defn start-daemon!
  [{:keys [data-dir repo rtc-ws-url auth-token]}]
  (let [host "127.0.0.1"
        port 0]
    (if-not (seq repo)
      (p/rejected (ex-info "repo is required" {:code :missing-repo}))
      (do
        (reset! *ready? false)
        (set-main-thread-stub!)
        (-> (p/let [platform (platform-node/node-platform {:data-dir data-dir
                                                           :event-fn handle-event!})
                    proxy (db-core/init-core! platform)
                    _ (<init-worker! proxy (or rtc-ws-url ""))
                    {:keys [path lock]} (db-lock/ensure-lock! {:data-dir data-dir
                                                               :repo repo
                                                               :host host
                                                               :port port})
                    _ (reset! *lock-info {:path path :lock lock})
                    _ (<invoke! proxy "thread-api/create-or-open-db" false [repo {}])]
              (let [stop!* (atom nil)
                    server (make-server proxy {:auth-token auth-token
                                               :bound-repo repo
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
                                    stop! (fn []
                                            (p/create
                                             (fn [resolve _]
                                               (reset! *ready? false)
                                               (doseq [^js res @*sse-clients]
                                                 (try
                                                   (.end res)
                                                   (catch :default _)))
                                               (reset! *sse-clients #{})
                                               (when-let [lock-path (:path @*lock-info)]
                                                 (db-lock/remove-lock! lock-path))
                                               (.close server (fn [] (resolve true))))))]
                                (reset! *ready? true)
                                (reset! stop!* stop!)
                                (p/let [lock' (assoc (:lock @*lock-info) :port actual-port)
                                        _ (db-lock/update-lock! (:path @*lock-info) lock')]
                                  (resolve {:host host
                                            :port actual-port
                                            :server server
                                            :stop! stop!})))))
                   (.on server "error" (fn [error]
                                         (when-let [lock-path (:path @*lock-info)]
                                           (db-lock/remove-lock! lock-path))
                                         (reject error)))))))
            (p/catch (fn [e]
                       (when-let [lock-path (:path @*lock-info)]
                         (db-lock/remove-lock! lock-path))
                       (throw e))))))))

(defn main
  []
  (let [{:keys [data-dir repo rtc-ws-url log-level auth-token help?]}
        (parse-args (.-argv js/process))
        log-level (keyword (or log-level "info"))]
    (when help?
      (show-help!)
      (.exit js/process 0))
    (when-not (seq repo)
      (show-help!)
      (.exit js/process 1))
    (glogi-console/install!)
    (log/set-levels {:glogi/root log-level})
    (p/let [{:keys [stop!] :as daemon}
            (start-daemon! {:data-dir data-dir
                            :repo repo
                            :rtc-ws-url rtc-ws-url
                            :auth-token auth-token})]
      (log/info :db-worker-node-ready {:host (:host daemon) :port (:port daemon)})
      (let [shutdown (fn []
                       (-> (stop!)
                           (p/finally (fn []
                                        (log/info :db-worker-node-stopped nil)
                                        (.exit js/process 0)))))]
        (.on js/process "SIGINT" shutdown)
        (.on js/process "SIGTERM" shutdown)))))
