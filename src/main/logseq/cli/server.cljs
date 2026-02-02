(ns logseq.cli.server
  "db-worker-node lifecycle orchestration for logseq."
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["http" :as http]
            ["os" :as os]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.cli.command.core :as command-core]
            [logseq.cli.log :as cli-log]
            [frontend.worker-common.util :as worker-util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- expand-home
  [path]
  (if (string/starts-with? path "~")
    (node-path/join (.homedir os) (subs path 1))
    path))

(defn resolve-data-dir
  [config]
  (expand-home (or (:data-dir config) "~/logseq/cli-graphs")))

(defn- repo-dir
  [data-dir repo]
  (node-path/join data-dir (worker-util/encode-graph-dir-name repo)))

(defn- ensure-repo-dir!
  [data-dir repo]
  (let [path (repo-dir data-dir repo)]
    (try
      (when-not (fs/existsSync path)
        (fs/mkdirSync path #js {:recursive true}))
      (let [stat (fs/statSync path)]
        (when-not (.isDirectory stat)
          (throw (ex-info (str "graph-dir is not a directory: " path)
                          {:code :data-dir-permission
                           :path path
                           :cause "ENOTDIR"}))))
      (let [constants (.-constants fs)
            mode (bit-or (.-R_OK constants) (.-W_OK constants))]
        (fs/accessSync path mode))
      path
      (catch :default e
        (throw (ex-info (str "graph-dir is not readable/writable: " path)
                        {:code :data-dir-permission
                         :path path
                         :cause (.-code e)}))))))

(defn lock-path
  [data-dir repo]
  (node-path/join (repo-dir data-dir repo) "db-worker.lock"))

(defn- pid-status
  [pid]
  (when (number? pid)
    (try
      (.kill js/process pid 0)
      :alive
      (catch :default e
        (case (.-code e)
          "ESRCH" :not-found
          "EPERM" :no-permission
          :error)))))

(defn- read-lock
  [path]
  (when (and (seq path) (fs/existsSync path))
    (js->clj (js/JSON.parse (.toString (fs/readFileSync path) "utf8"))
             :keywordize-keys true)))

(defn- remove-lock!
  [path]
  (when (and (seq path) (fs/existsSync path))
    (fs/unlinkSync path)))

(defn- base-url
  [{:keys [host port]}]
  (str "http://" host ":" port))

(defn- http-request
  [{:keys [method host port path headers body timeout-ms]}]
  (p/create
   (fn [resolve reject]
     (let [timeout-ms (or timeout-ms 5000)
           start-ms (js/Date.now)
           req (.request
                http
                #js {:method method
                     :hostname host
                     :port port
                     :path path
                     :headers (clj->js (or headers {}))}
                (fn [^js res]
                  (let [chunks (array)]
                    (.on res "data" (fn [chunk] (.push chunks chunk)))
                    (.on res "end" (fn []
                                     (let [buf (js/Buffer.concat chunks)
                                           response {:status (.-statusCode res)
                                                     :body (.toString buf "utf8")}]
                                       (log/debug :event :cli.server/http-response
                                                  :method method
                                                  :path path
                                                  :status (:status response)
                                                  :elapsed-ms (- (js/Date.now) start-ms)
                                                  :body (cli-log/truncate-preview (:body response)))
                                       (resolve response))))
                    (.on res "error" reject))))
           timeout-id (js/setTimeout
                       (fn []
                         (.destroy req)
                         (reject (ex-info "request timeout" {:code :timeout})))
                       timeout-ms)]
       (log/debug :event :cli.server/http-request
                  :method method
                  :host host
                  :port port
                  :path path
                  :body (cli-log/truncate-preview body))
       (.on req "error" (fn [err]
                          (js/clearTimeout timeout-id)
                          (reject err)))
       (when body
         (.write req body))
       (.end req)
       (.on req "response" (fn [_]
                             (js/clearTimeout timeout-id)))))))

(defn- ready?
  [{:keys [host port]}]
  (-> (p/let [{:keys [status]} (http-request {:method "GET"
                                              :host host
                                              :port port
                                              :path "/readyz"
                                              :timeout-ms 1000})]
        (= 200 status))
      (p/catch (fn [_] false))))

(defn- healthy?
  [{:keys [host port]}]
  (-> (p/let [{:keys [status]} (http-request {:method "GET"
                                              :host host
                                              :port port
                                              :path "/healthz"
                                              :timeout-ms 1000})]
        (= 200 status))
      (p/catch (fn [_] false))))

(defn- valid-lock?
  [lock]
  (and (seq (:host lock))
       (pos-int? (:port lock))))

(defn- cleanup-stale-lock!
  [path lock]
  (cond
    (nil? lock)
    (p/resolved nil)

    (= :not-found (pid-status (:pid lock)))
    (do
      (remove-lock! path)
      (p/resolved nil))

    (not (valid-lock? lock))
    (do
      (remove-lock! path)
      (p/resolved nil))

    :else
    (p/let [healthy (healthy? lock)]
      (when-not healthy
        (remove-lock! path)))))

(defn- wait-for
  [pred-fn {:keys [timeout-ms interval-ms]
            :or {timeout-ms 8000
                 interval-ms 200}}]
  (p/create
   (fn [resolve reject]
     (let [start (js/Date.now)
           tick (fn tick []
                  (p/let [ok? (pred-fn)]
                    (if ok?
                      (resolve true)
                      (if (> (- (js/Date.now) start) timeout-ms)
                        (reject (ex-info "timeout" {:code :timeout}))
                        (js/setTimeout tick interval-ms)))))]
       (tick)))))

(defn- wait-for-lock
  [path]
  (wait-for (fn []
              (p/resolved (and (fs/existsSync path)
                               (let [lock (read-lock path)]
                                 (pos-int? (:port lock))))))
            {:timeout-ms 8000
             :interval-ms 200}))

(defn- wait-for-ready
  [lock]
  (wait-for (fn [] (ready? lock))
            {:timeout-ms 8000
             :interval-ms 250}))

(defn- spawn-server!
  [{:keys [repo data-dir]}]
  (let [script (node-path/join js/__dirname "../dist/db-worker-node.js")
        args #js ["--repo" repo "--data-dir" data-dir]
        child (.spawn child-process script args #js {:detached true
                                                     :stdio "ignore"})]
    (.unref child)
    child))

(defn- ensure-server-started!
  [config repo]
  (let [data-dir (resolve-data-dir config)
        path (lock-path data-dir repo)]
    (ensure-repo-dir! data-dir repo)
    (p/let [existing (read-lock path)
            _ (cleanup-stale-lock! path existing)
            _ (when (not (fs/existsSync path))
                (spawn-server! {:repo repo :data-dir data-dir})
                (wait-for-lock path))
            lock (read-lock path)]
      (when-not lock
        (throw (ex-info "db-worker-node failed to start" {:code :server-start-failed})))
      (p/let [_ (wait-for-ready lock)]
        lock))))

(defn ensure-server!
  [config repo]
  (p/let [lock (ensure-server-started! config repo)]
    (assoc config :base-url (base-url lock))))

(defn- shutdown!
  [{:keys [host port]}]
  (p/let [{:keys [status]} (http-request {:method "POST"
                                          :host host
                                          :port port
                                          :path "/v1/shutdown"
                                          :headers {"Content-Type" "application/json"}
                                          :timeout-ms 1000})]
    (= 200 status)))

(defn stop-server!
  [config repo]
  (let [data-dir (resolve-data-dir config)
        path (lock-path data-dir repo)
        lock (read-lock path)]
    (if-not lock
      (p/resolved {:ok? false
                   :error {:code :server-not-found
                           :message "server is not running"}})
      (-> (p/let [_ (shutdown! lock)]
            (wait-for (fn []
                        (p/resolved (not (fs/existsSync path))))
                      {:timeout-ms 5000
                       :interval-ms 200})
            {:ok? true
             :data {:repo repo}})
          (p/catch (fn [_]
                     (when (and (= :alive (pid-status (:pid lock)))
                                (not= (:pid lock) (.-pid js/process)))
                       (try
                         (.kill js/process (:pid lock) "SIGTERM")
                         (catch :default e
                           (log/warn :cli-server-stop-sigterm-failed e))))
                     (when (= :not-found (pid-status (:pid lock)))
                       (remove-lock! path))
                     (if (fs/existsSync path)
                       {:ok? false
                        :error {:code :server-stop-timeout
                                :message "timed out stopping server"}}
                       {:ok? true
                        :data {:repo repo}})))))))

(defn start-server!
  [config repo]
  (p/let [_ (ensure-server-started! config repo)]
    {:ok? true
     :data {:repo repo}}))

(defn restart-server!
  [config repo]
  (-> (p/let [_ (stop-server! config repo)]
        (start-server! config repo))
      (p/catch (fn [_]
                 (start-server! config repo)))))

(defn server-status
  [config repo]
  (let [data-dir (resolve-data-dir config)
        path (lock-path data-dir repo)
        lock (read-lock path)]
    (if-not lock
      (p/resolved {:ok? true
                   :data {:repo repo
                          :status :stopped}})
      (p/let [ready (ready? lock)]
        {:ok? true
         :data {:repo repo
                :status (if ready :ready :starting)
                :host (:host lock)
                :port (:port lock)
                :pid (:pid lock)
                :started-at (:startedAt lock)}}))))

(defn list-servers
  [config]
  (let [data-dir (resolve-data-dir config)
        entries (when (fs/existsSync data-dir)
                  (fs/readdirSync data-dir #js {:withFileTypes true}))]
    (p/all
     (for [^js entry entries
           :when (.isDirectory entry)
           :let [name (.-name entry)
                 lock (read-lock (node-path/join data-dir name "db-worker.lock"))]
           :when lock]
       (p/let [ready (ready? lock)]
         {:repo (:repo lock)
          :host (:host lock)
          :port (:port lock)
          :pid (:pid lock)
          :status (if ready :ready :starting)})))))

(defn list-graphs
  [config]
  (let [data-dir (resolve-data-dir config)
        entries (when (fs/existsSync data-dir)
                  (fs/readdirSync data-dir #js {:withFileTypes true}))]
    (->> entries
         (filter #(.isDirectory ^js %))
         (map (fn [^js dirent]
                (worker-util/decode-graph-dir-name (.-name dirent))))
         (filter some?)
         (map command-core/repo->graph)
         (vec))))
