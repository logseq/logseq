(ns logseq.cli.server
  "db-worker-node lifecycle orchestration for logseq. Used by CLI and electron"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
            [frontend.worker.db-worker-node-lock :as db-lock]
            [lambdaisland.glogi :as log]
            [logseq.cli.profile :as profile]
            [logseq.cli.root-dir :as root-dir]
            [logseq.common.config :as common-config]
            [logseq.common.version :as version]
            [logseq.common.graph :as common-graph]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.db-worker.daemon :as daemon]
            [logseq.db-worker.server-list :as server-list]
            [promesa.core :as p]))

(defn resolve-root-dir
  [config]
  (common-graph/expand-home (or (:root-dir config) "~/logseq")))

(defn graphs-dir
  [config]
  (root-dir/graphs-dir (resolve-root-dir config)))

(defn- repo-dir
  [root-dir repo]
  (db-lock/repo-dir (root-dir/graphs-dir root-dir) repo))

(defn- ensure-repo-dir!
  [root-dir repo]
  (let [path (repo-dir root-dir repo)]
    (try
      (when-not (fs/existsSync path)
        (fs/mkdirSync path #js {:recursive true}))
      (let [stat (fs/statSync path)]
        (when-not (.isDirectory stat)
          (throw (ex-info (str "graph-dir is not a directory: " path)
                          {:code :root-dir-permission
                           :path path
                           :cause "ENOTDIR"}))))
      (let [constants (.-constants fs)
            mode (bit-or (.-R_OK constants) (.-W_OK constants))]
        (fs/accessSync path mode))
      path
      (catch :default e
        (throw (ex-info (str "graph-dir is not readable/writable: " path)
                        {:code :root-dir-permission
                         :path path
                         :cause (.-code e)}))))))

(defn lock-path
  [root-dir repo]
  (db-lock/lock-path root-dir repo))

(defn- server-list-path
  [config]
  (server-list/path (resolve-root-dir config)))

(defn db-worker-dev-script-path
  []
  (node-path/join js/__dirname "../static/db-worker-node.js"))

(defn- db-worker-release-script-path-from
  [dirname]
  (if (= "js" (node-path/basename dirname))
    (node-path/join dirname "db-worker-node.js")
    (node-path/join dirname "js" "db-worker-node.js")))

(defn- db-worker-release-script-path
  []
  (db-worker-release-script-path-from js/__dirname))

(defn db-worker-script-path
  []
  (if goog.DEBUG
    (db-worker-dev-script-path)
    (db-worker-release-script-path)))

(defn db-worker-runtime-script-path
  []
  (db-worker-script-path))

(defn- base-url
  [{:keys [host port]}]
  (str "http://" host ":" port))

(defn- normalize-owner-source
  [owner-source]
  (daemon/normalize-owner-source owner-source))

(defn- requester-owner-source
  [config]
  (normalize-owner-source (or (:owner-source config) :cli)))

(defn- expected-revision
  [config]
  (or (:expected-revision config)
      (version/revision)))

(defn- revision-match?
  [expected server-revision]
  (and (some? server-revision)
       (= expected server-revision)))

(defn- revision-mismatch?
  [expected server-revision]
  (not (revision-match? expected server-revision)))

(defn- server-revision-mismatch-error
  [code repo expected {:keys [revision owner-source]}]
  {:code code
   :message (case code
              :server-revision-mismatch-restart-failed
              "db-worker-node revision mismatch and restart failed"
              :server-revision-mismatch-after-restart
              (str "db-worker-node revision still does not match after restart"
                   "; db-worker-node path: "
                   (db-worker-script-path))
              "db-worker-node revision does not match requester revision")
   :repo repo
   :expected-revision expected
   :actual-revision revision
   :owner-source owner-source})

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

(defn- fetch-healthz
  [{:keys [host port]}]
  (p/let [{:keys [status body]} (http-request {:method "GET"
                                               :host host
                                               :port port
                                               :path "/healthz"
                                               :timeout-ms 1000})
          payload (js->clj (js/JSON.parse body) :keywordize-keys true)]
    (assoc payload :http-status status)))

(defn- spawn-server!
  [{:keys [repo root-dir owner-source create-empty-db?]}]
  (daemon/spawn-server! {:script (db-worker-script-path)
                         :repo repo
                         :root-dir root-dir
                         :owner-source owner-source
                         :create-empty-db? create-empty-db?}))

(defn- rewrite-lock-owner-source!
  [path lock owner-source]
  (let [lock' (assoc lock :owner-source (normalize-owner-source owner-source))]
    (fs/writeFileSync path (js/JSON.stringify (clj->js lock')))
    lock'))

(defn- canonical-path
  [path]
  (when (seq path)
    (let [path (common-graph/expand-home path)]
      (try
        (fs/realpathSync path)
        (catch :default _
          (node-path/resolve path))))))

(defn- current-root-dir
  [config]
  (canonical-path (resolve-root-dir config)))

(defn- same-root-dir?
  [config server]
  (let [server-root-dir (:root-dir server)]
    (or (not (seq server-root-dir))
        (= (current-root-dir config)
           (canonical-path server-root-dir)))))

(defn- servers-for-config
  [config servers]
  (->> (or servers [])
       (filter #(same-root-dir? config %))
       vec))

(defn- repo-server
  [config servers repo]
  (first (filter #(graph-dir/same-repo? repo (:repo %))
                 (servers-for-config config servers))))

(defn discover-servers
  [config]
  (let [path (server-list-path config)
        entries (server-list/read-entries path)]
    (p/let [results (p/all
                     (for [{:keys [pid port] :as entry} entries]
                       (p/let [pid-state (pid-status pid)]
                         (if-not (contains? #{:alive :no-permission} pid-state)
                           {:entry entry :retain? false}
                           (-> (fetch-healthz {:host "127.0.0.1" :port port})
                               (p/then (fn [payload]
                                         {:entry entry
                                          :retain? true
                                          :server (-> payload
                                                      (update :status keyword)
                                                      (update :owner-source normalize-owner-source))}))
                               (p/catch (fn [_]
                                          {:entry entry :retain? true})))))))
            retained-results (filterv :retain? results)
            stale-entries (->> results
                               (remove :retain?)
                               (mapv :entry))
            _ (when (seq stale-entries)
                (server-list/remove-entries! path stale-entries))]
      (->> retained-results
           (keep :server)
           vec))))

(defn- wait-for-discovered-server
  [config repo]
  (let [server* (atom nil)]
    (-> (wait-for (fn []
                    (p/let [servers (discover-servers config)
                            server (repo-server config servers repo)]
                      (reset! server* server)
                      (some? server)))
                  {:timeout-ms 8000
                   :interval-ms 50})
        (p/then (fn [_] @server*)))))

(defn- ensure-server-started-once!
  [config repo]
  (let [root-dir (resolve-root-dir config)
        path (lock-path root-dir repo)
        requester-owner (requester-owner-source config)
        profile-session (:profile-session config)]
    (profile/time! profile-session "server.ensure-started"
                   (fn []
                     (ensure-repo-dir! root-dir repo)
                     (p/let [existing (read-lock path)
                             _ (cleanup-stale-lock! path existing)
                             discovered (discover-servers config)
                             discovered-repo-server (repo-server config discovered repo)
                             _ (when (and (not discovered-repo-server) (not (fs/existsSync path)))
                                 (profile/time! profile-session
                                                "server.spawn-daemon"
                                                (fn []
                                                  (spawn-server! {:repo repo
                                                                  :root-dir root-dir
                                                                  :owner-source requester-owner
                                                                  :create-empty-db? (:create-empty-db? config)})))
                                 (-> (profile/time! profile-session
                                                    "server.wait-lock"
                                                    (fn []
                                                      (wait-for-lock path)))
                                     (p/catch (fn [e]
                                                (if (= :timeout (:code (ex-data e)))
                                                  (throw (ex-info "db-worker-node failed to create lock"
                                                                  {:code :server-start-timeout-orphan
                                                                   :repo repo}))
                                                  (throw e))))))
                             lock (read-lock path)
                             lock (if (and lock
                                           (= :cli requester-owner)
                                           (= :unknown (lock-owner-source lock)))
                                    (rewrite-lock-owner-source! path lock :cli)
                                    lock)
                             repo-server' (if discovered-repo-server
                                            discovered-repo-server
                                            (-> (profile/time! profile-session
                                                               "server.wait-publish"
                                                               (fn []
                                                                 (wait-for-discovered-server config repo)))
                                                (p/catch (fn [e]
                                                           (if (= :timeout (:code (ex-data e)))
                                                             (throw (ex-info "db-worker-node failed to publish health"
                                                                             {:code :server-start-failed
                                                                              :repo repo}))
                                                             (throw e))))))]
                       (when-not lock
                         (throw (ex-info "db-worker-node failed to start" {:code :server-start-failed})))
                       (p/let [_ (profile/time! profile-session
                                                "server.wait-ready"
                                                (fn []
                                                  (wait-for-ready repo-server')))]
                         (let [lock-owner (lock-owner-source lock)]
                           (assoc repo-server'
                                  :owner-source lock-owner
                                  :owned? (owner-manageable? requester-owner lock-owner)))))))))

(declare stop-version-mismatched-server!)

(defn- ensure-server-started!
  [config repo]
  (p/let [expected (expected-revision config)
          server (ensure-server-started-once! config repo)]
    (if-not (revision-mismatch? expected (:revision server))
      server
      (p/let [stop-result (profile/time! (:profile-session config)
                                          "server.restart-version-mismatch"
                                          (fn []
                                            (stop-version-mismatched-server! config repo server)))]
        (when-not (:ok? stop-result)
          (throw (ex-info "db-worker-node revision mismatch and restart failed"
                          (assoc (server-revision-mismatch-error
                                  :server-revision-mismatch-restart-failed
                                  repo
                                  expected
                                  server)
                                 :stop-error (:error stop-result)))))
        (p/let [server' (ensure-server-started-once! config repo)]
          (if-not (revision-mismatch? expected (:revision server'))
            server'
            (let [error-data (assoc (server-revision-mismatch-error
                                     :server-revision-mismatch-after-restart
                                     repo
                                     expected
                                     server')
                                    :after-restart? true)]
              (throw (ex-info (:message error-data) error-data)))))))))

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

(defn- stop-server-target!
  [config repo {:keys [allow-cross-owner? target-server]}]
  (let [requester-owner (requester-owner-source config)
        root-dir (resolve-root-dir config)
        path (lock-path root-dir repo)
        lock (read-lock path)]
    (if-not lock
      (p/resolved {:ok? false
                   :error {:code :server-not-found
                           :message "server is not running"}})
      (let [lock-owner (lock-owner-source lock)]
        (if-not (or allow-cross-owner?
                    (owner-manageable? requester-owner lock-owner))
          (p/resolved (owner-mismatch-error repo requester-owner lock-owner))
          (p/let [server (if target-server
                           target-server
                           (p/let [servers (discover-servers config)]
                             (repo-server config servers repo)))]
            (if-not server
              {:ok? false
               :error {:code :server-not-found
                       :message "server is not running"}}
              (-> (p/let [_ (shutdown! server)]
                    (wait-for (fn []
                                (p/resolved (not (fs/existsSync path))))
                              {:timeout-ms 5000
                               :interval-ms 200})
                    {:ok? true
                     :data {:repo repo}})
                  (p/catch
                   (fn [_]
                     (when (and (= :alive (pid-status (:pid server)))
                                (not= (:pid server) (.-pid js/process)))
                       (try
                         (.kill js/process (:pid server) "SIGTERM")
                         (catch :default e
                           (log/warn :cli-server-stop-sigterm-failed e))))
                     (when (= :not-found (pid-status (:pid server)))
                       (remove-lock! path))
                     (if (fs/existsSync path)
                       {:ok? false
                        :error {:code :server-stop-timeout
                                :message "timed out stopping server"}}
                       {:ok? true
                        :data {:repo repo}})))))))))))

(defn stop-server!
  [config repo]
  (stop-server-target! config repo {:allow-cross-owner? false}))

(defn- stop-version-mismatched-server!
  [config repo server]
  (stop-server-target! config repo {:allow-cross-owner? true
                                    :target-server server}))

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
                             (:repo data) (assoc :repo (:repo data))
                             (:expected-revision data) (assoc :expected-revision (:expected-revision data))
                             (contains? data :actual-revision) (assoc :actual-revision (:actual-revision data))
                             (:owner-source data) (assoc :owner-source (:owner-source data))
                             (:stop-error data) (assoc :stop-error (:stop-error data))
                             (:after-restart? data) (assoc :after-restart? (:after-restart? data)))})))))

(defn restart-server!
  [config repo]
  (p/let [stop-result (stop-server! config repo)]
    (if (:ok? stop-result)
      (start-server! config repo)
      (if (= :server-not-found (get-in stop-result [:error :code]))
        (start-server! config repo)
        stop-result))))

(defn list-servers
  [config]
  (p/let [servers (discover-servers config)]
    (servers-for-config config servers)))

(defn compute-revision-mismatches
  [cli-revision servers]
  (let [mismatch-servers (->> (or servers [])
                              (filter (fn [{:keys [revision]}]
                                        (not= cli-revision revision)))
                              (mapv (fn [{:keys [repo revision]}]
                                      {:repo repo
                                       :revision revision})))]
    (when (seq mismatch-servers)
      {:cli-revision cli-revision
       :servers mismatch-servers})))

(defn- cleanup-target
  [{:keys [repo pid owner-source revision]}]
  {:repo repo
   :pid pid
   :owner-source owner-source
   :revision revision})

(defn cleanup-revision-mismatched-servers!
  [config cli-revision]
  (p/let [servers (list-servers config)
          mismatched (->> (or servers [])
                          (filter (fn [{:keys [revision]}]
                                    (not= cli-revision revision)))
                          (vec))
          eligible (->> mismatched
                        (filter (fn [{:keys [owner-source]}]
                                  (= :cli owner-source)))
                        (vec))
          skipped-owner-targets (->> mismatched
                                     (remove (fn [{:keys [owner-source]}]
                                               (= :cli owner-source)))
                                     (mapv cleanup-target))
          stop-results (p/all
                        (for [server eligible]
                          (p/let [target (cleanup-target server)
                                  result (stop-server! (assoc config :owner-source :cli) (:repo server))]
                            (cond
                              (:ok? result)
                              {:status :killed
                               :target target}

                              (= :server-not-found (get-in result [:error :code]))
                              {:status :killed
                               :target target}

                              :else
                              {:status :failed
                               :target target
                               :error (:error result)}))))
          killed (->> stop-results
                      (filter (fn [{:keys [status]}] (= :killed status)))
                      (mapv :target))
          failed (->> stop-results
                      (filter (fn [{:keys [status]}] (= :failed status)))
                      (mapv (fn [{:keys [target error]}]
                              (assoc target :error error))))]
    {:ok? true
     :data {:cli-revision cli-revision
            :checked (count (or servers []))
            :mismatched (count mismatched)
            :eligible (count eligible)
            :skipped-owner (count skipped-owner-targets)
            :skipped-owner-targets skipped-owner-targets
            :killed killed
            :failed failed}}))

(def ^:private legacy-token-pattern #"(?:\+\+|\+3A\+|%)")

(def ^:private backup-root-dir-name "backup")

(defn- ignored-graph-dir?
  [graph-name]
  (or (= graph-name common-config/unlinked-graphs-dir)
      (= graph-name backup-root-dir-name)
      (string/starts-with? graph-name common-config/file-version-prefix)))

(defn- legacy-derivation-signal?
  [dir-name]
  (and (string? dir-name)
       (re-find legacy-token-pattern dir-name)))

(defn- decode-legacy-graph-name
  [legacy-dir]
  (some-> (graph-dir/decode-legacy-graph-dir-name legacy-dir)
          (#(when-not (ignored-graph-dir? %) %))))

(defn- canonical-dir-name?
  [dir-name graph-name]
  (= dir-name (graph-dir/graph-dir-key->encoded-dir-name graph-name)))

(defn- classify-graph-dir
  [graphs-root dir-name]
  (when-not (ignored-graph-dir? dir-name)
    (let [decoded-canonical (db-lock/decode-canonical-graph-dir-key dir-name)
          canonical? (and (seq decoded-canonical)
                          (not (ignored-graph-dir? decoded-canonical))
                          (canonical-dir-name? dir-name decoded-canonical))
          legacy-graph-name (or (when (and (seq decoded-canonical)
                                           (not canonical?))
                                  decoded-canonical)
                                (decode-legacy-graph-name dir-name))]
      (cond
        canonical?
        {:kind :canonical
         :graph-name decoded-canonical
         :graph-dir dir-name}

        (seq legacy-graph-name)
        (let [target-graph-dir (graph-dir/graph-dir-key->encoded-dir-name legacy-graph-name)
              conflict? (and (seq target-graph-dir)
                             (not= target-graph-dir dir-name)
                             (fs/existsSync (node-path/join graphs-root target-graph-dir)))]
          {:kind :legacy
           :legacy-dir dir-name
           :legacy-graph-name legacy-graph-name
           :target-graph-dir target-graph-dir
           :conflict? conflict?})

        (legacy-derivation-signal? dir-name)
        {:kind :legacy-undecodable
         :legacy-dir dir-name
         :reason :graph-name-not-derivable}

        :else
        nil))))

(defn list-graph-items
  [config]
  (let [graphs-root (graphs-dir config)
        entries (when (fs/existsSync graphs-root)
                  (fs/readdirSync graphs-root #js {:withFileTypes true}))]
    (->> entries
         (filter #(.isDirectory ^js %))
         (map (fn [^js dirent]
                (classify-graph-dir graphs-root (.-name dirent))))
         (filter some?)
         (vec))))

(defn list-graphs
  [config]
  (->> (list-graph-items config)
       (keep (fn [{:keys [kind graph-name]}]
               (when (= :canonical kind)
                 graph-name)))
       (vec)))
