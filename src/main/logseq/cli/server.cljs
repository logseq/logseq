(ns logseq.cli.server
  "db-worker-node lifecycle orchestration for logseq."
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [clojure.string :as string]
            [frontend.worker.db-worker-node-lock :as db-lock]
            [logseq.common.config :as common-config]
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

(defn- normalize-owner-source
  [owner-source]
  (daemon/normalize-owner-source owner-source))

(defn- requester-owner-source
  [config]
  (normalize-owner-source (or (:owner-source config) :cli)))

(defn- lock-owner-source
  [lock]
  (normalize-owner-source (:owner-source lock)))

(defn- owner-manageable?
  [requester-owner lock-owner]
  (or (= requester-owner lock-owner)
      (and (= requester-owner :cli)
           (= lock-owner :unknown))))

(defn- owner-mismatch-error
  [repo requester-owner lock-owner]
  {:ok? false
   :error {:code :server-owned-by-other
           :message "server is owned by another process"
           :repo repo
           :owner-source lock-owner
           :requester-owner-source requester-owner}})

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
  [{:keys [repo data-dir owner-source]}]
  (daemon/spawn-server! {:script (db-worker-script-path)
                         :repo repo
                         :data-dir data-dir
                         :owner-source owner-source}))

(defn- rewrite-lock-owner-source!
  [path lock owner-source]
  (let [lock' (assoc lock :owner-source (normalize-owner-source owner-source))]
    (fs/writeFileSync path (js/JSON.stringify (clj->js lock')))
    lock'))

(defn- ensure-server-started!
  [config repo]
  (let [data-dir (resolve-data-dir config)
        path (lock-path data-dir repo)
        requester-owner (requester-owner-source config)]
    (ensure-repo-dir! data-dir repo)
    (p/let [existing (read-lock path)
            _ (cleanup-stale-lock! path existing)
            _ (when (not (fs/existsSync path))
                (daemon/cleanup-orphan-processes! {:repo repo
                                                   :data-dir data-dir})
                (spawn-server! {:repo repo
                                :data-dir data-dir
                                :owner-source requester-owner})
                (-> (wait-for-lock path)
                    (p/catch (fn [e]
                               (if (= :timeout (:code (ex-data e)))
                                 (let [orphans (daemon/find-orphan-processes {:repo repo
                                                                              :data-dir data-dir})
                                       pids (mapv :pid orphans)]
                                   (throw (ex-info "db-worker-node failed to create lock"
                                                   {:code :server-start-timeout-orphan
                                                    :repo repo
                                                    :pids pids})))
                                 (throw e))))))
            lock (read-lock path)
            lock (if (and lock
                          (= :cli requester-owner)
                          (= :unknown (lock-owner-source lock)))
                   (rewrite-lock-owner-source! path lock :cli)
                   lock)]
      (when-not lock
        (throw (ex-info "db-worker-node failed to start" {:code :server-start-failed})))
      (p/let [_ (wait-for-ready lock)]
        (let [lock-owner (lock-owner-source lock)]
          (assoc lock
                 :owner-source lock-owner
                 :owned? (owner-manageable? requester-owner lock-owner)))))))

(defn ensure-server!
  [config repo]
  (p/let [lock (ensure-server-started! config repo)]
    (assoc config
           :base-url (base-url lock)
           :owner-source (:owner-source lock)
           :owned? (:owned? lock))))

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
  (let [requester-owner (requester-owner-source config)
        data-dir (resolve-data-dir config)
        path (lock-path data-dir repo)
        lock (read-lock path)]
    (if-not lock
      (p/resolved {:ok? false
                   :error {:code :server-not-found
                           :message "server is not running"}})
      (let [lock-owner (lock-owner-source lock)]
        (if-not (owner-manageable? requester-owner lock-owner)
          (p/resolved (owner-mismatch-error repo requester-owner lock-owner))
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
                            :data {:repo repo}})))))))))

(defn start-server!
  [config repo]
  (-> (p/let [lock (ensure-server-started! config repo)]
        {:ok? true
         :data {:repo repo
                :owner-source (:owner-source lock)
                :owned? (:owned? lock)}})
      (p/catch (fn [e]
                 (let [data (ex-data e)
                       code (or (:code data) :server-start-failed)]
                   {:ok? false
                    :error (cond-> {:code code
                                    :message (or (.-message e) "failed to start server")}
                             (:lock data) (assoc :lock (:lock data))
                             (:pids data) (assoc :pids (:pids data))
                             (:repo data) (assoc :repo (:repo data)))})))))

(defn restart-server!
  [config repo]
  (p/let [stop-result (stop-server! config repo)]
    (if (:ok? stop-result)
      (start-server! config repo)
      (if (= :server-not-found (get-in stop-result [:error :code]))
        (start-server! config repo)
        stop-result))))

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
                :owner-source (lock-owner-source lock)
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
          :owner-source (lock-owner-source lock)
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
         (remove (fn [s]
                   (or (= s common-config/unlinked-graphs-dir)
                       (string/starts-with? s common-config/file-version-prefix))))
         (vec))))
