(ns logseq.cli.server
  "db-worker-node lifecycle orchestration for logseq. Used by CLI and electron"
  (:require ["@logseq/graph-lifecycle" :as lifecycle]
            ["fs" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
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
  (common-graph/expand-home (or (:root-dir config)
                              (node-path/dirname (common-graph/get-db-graphs-dir)))))

(defn graphs-dir
  [config]
  (or (some-> ^js (:storage config) .-graphsDir)
      (:graphs-dir config)
      (if (:root-dir config)
        (root-dir/graphs-dir (resolve-root-dir config))
        (common-graph/get-db-graphs-dir))))

(defn resolve-storage
  "Resolves the canonical storage context for `config`."
  [config]
  (or (:storage config)
      (lifecycle/resolveStorage (resolve-root-dir config) (graphs-dir config))))

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

(defn- owner-manageable?
  [requester-owner lock-owner]
  (or (= requester-owner lock-owner)
      (and (= requester-owner :cli)
           (= lock-owner :unknown))))

(defn- pid-status
  [pid]
  (daemon/pid-status pid))

(defn- http-request
  [opts]
  (daemon/http-request opts))

(defn- fetch-healthz
  [{:keys [host port]}]
  (p/let [{:keys [status body]} (http-request {:method "GET"
                                               :host host
                                               :port port
                                               :path "/healthz"
                                               :timeout-ms 1000})
          payload (js->clj (js/JSON.parse body) :keywordize-keys true)]
    (assoc payload :http-status status)))

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
    (and (seq server-root-dir)
         (= (current-root-dir config)
            (canonical-path server-root-dir)))))

(defn- servers-for-config
  [config servers]
  (->> (or servers [])
       (filter #(same-root-dir? config %))
       vec))


(defn discover-servers
  [config]
  (let [path (server-list-path config)
        entries (server-list/read-entries path)]
    (p/let [results (p/all
                     (for [{:keys [pid port] :as entry} entries]
                       (p/let [pid-state (pid-status pid)]
                         (if (= :not-found pid-state)
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

(defn- ensure-server-started-once!
  [config repo]
  (p/let [server (lifecycle/startGraph
                 (clj->js {:storage (resolve-storage config)
                           :repo repo
                           :script (db-worker-script-path)
                           :owner (name (requester-owner-source config))
                           :generation (:generation config)
                           :createEmpty (boolean (:create-empty-db? config))
                           :extraArgs (cond-> []
                                        (:embedding-endpoint config)
                                        (into ["--embedding-endpoint" (:embedding-endpoint config)])
                                        (:embedding-model-id config)
                                        (into ["--embedding-model-id" (:embedding-model-id config)]))}))
          server (js->clj server :keywordize-keys true)
          owner (normalize-owner-source (:owner-source server))]
    (assoc server :owner-source owner
                  :owned? (owner-manageable? (requester-owner-source config) owner))))

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
                                            (log/info :cli-server-restart-version-mismatch
                                                      {:repo repo
                                                       :expected-revision expected
                                                       :current-revision (:revision server)
                                                       :owner-source (:owner-source server)
                                                       :pid (:pid server)
                                                       :host (:host server)
                                                       :port (:port server)
                                                       :root-dir (:root-dir server)
                                                       :status (:status server)})
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
           :generation (:generation lock)
           :owner-source (:owner-source lock)
           :owned? (:owned? lock))))

(defn- stop-server-target!
  [config repo {:keys [allow-cross-owner? target-server]}]
  (-> (p/let [_ (lifecycle/stopGraph (resolve-storage config) repo
                                    (name (if allow-cross-owner?
                                            (:owner-source target-server)
                                            (requester-owner-source config))))]
        {:ok? true :data {:repo repo}})
      (p/catch (fn [error]
                 {:ok? false :error {:code (keyword (.-code error))
                                     :message (.-message error)}}))))

(defn stop-server!
  [config repo]
  (stop-server-target! config repo {:allow-cross-owner? false}))

(defn- stop-version-mismatched-server!
  [config repo server]
  (stop-server-target! config repo {:allow-cross-owner? true
                                    :target-server server}))

(defn list-servers
  [config]
  (p/let [servers (discover-servers config)]
    (servers-for-config config servers)))

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
    (let [decoded-canonical (graph-dir/decode-canonical-graph-dir-key dir-name)
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
