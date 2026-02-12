(ns logseq.cli.server
  "db-worker-node lifecycle orchestration for logseq."
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [clojure.string :as string]
            [frontend.worker.db-worker-node-lock :as db-lock]
            [logseq.db-worker.daemon :as daemon]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- expand-home
  [path]
  (if (string/starts-with? path "~")
    (node-path/join (.homedir os) (subs path 1))
    path))

(defn resolve-data-dir
  [config]
  (expand-home (or (:data-dir config) "~/logseq/graphs")))

(defn- repo-dir
  [data-dir repo]
  (db-lock/repo-dir data-dir repo))

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

(defn db-worker-script-path
  []
  (node-path/join js/__dirname "../dist/db-worker-node.js"))

(defn db-worker-runtime-script-path
  []
  (node-path/join js/__dirname "../static/db-worker-node.js"))

(defn- base-url
  [{:keys [host port]}]
  (str "http://" host ":" port))

(defn- pid-status
  [pid]
  (daemon/pid-status pid))

(defn- read-lock
  [path]
  (daemon/read-lock path))

(defn- remove-lock!
  [path]
  (daemon/remove-lock! path))

(defn- http-request
  [opts]
  (daemon/http-request opts))

(defn- cleanup-stale-lock!
  [path lock]
  (daemon/cleanup-stale-lock! path lock))

(defn- wait-for
  [pred-fn opts]
  (daemon/wait-for pred-fn opts))

(defn- wait-for-lock
  [path]
  (daemon/wait-for-lock path))

(defn- wait-for-ready
  [lock]
  (daemon/wait-for-ready lock))

(defn- ready?
  [lock]
  (daemon/ready? lock))

(defn- spawn-server!
  [{:keys [repo data-dir]}]
  (daemon/spawn-server! {:script (db-worker-script-path)
                         :repo repo
                         :data-dir data-dir}))

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
  (-> (p/let [_ (ensure-server-started! config repo)]
        {:ok? true
         :data {:repo repo}})
      (p/catch (fn [e]
                 (let [data (ex-data e)
                       code (or (:code data) :server-start-failed)]
                   {:ok? false
                    :error (cond-> {:code code
                                    :message (or (.-message e) "failed to start server")}
                             (:lock data) (assoc :lock (:lock data)))})))))

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
                 graph-key (db-lock/decode-canonical-graph-dir-key name)
                 lock (when graph-key
                        (read-lock (node-path/join data-dir name "db-worker.lock")))]
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
                (db-lock/decode-canonical-graph-dir-key (.-name dirent))))
         (filter some?)
         (vec))))
