(ns frontend.worker.db-worker-node-lock
  "Lock file helpers for db-worker-node."
  (:require ["@logseq/graph-lifecycle" :as lifecycle]
            ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [clojure.string :as string]
            [frontend.worker-common.util :as worker-util]
            [lambdaisland.glogi :as log]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.common.config :as common-config]
            [promesa.core :as p]))

(defn- expand-home
  [path]
  (if (string/starts-with? path "~")
    (node-path/join (.homedir os) (subs path 1))
    path))

(defn resolve-root-dir
  [root-dir]
  (expand-home (or root-dir (node-path/join (.homedir os) "logseq"))))

(defn graphs-dir
  [root-dir]
  (node-path/join (resolve-root-dir root-dir) "graphs"))

(defn repo->graph-dir-key
  [repo]
  (graph-dir/repo->graph-dir-key repo))

(defn canonical-graph-dir-key?
  [graph-dir-key]
  (and (seq graph-dir-key)
       (not (string/starts-with? graph-dir-key common-config/db-version-prefix))))

(defn decode-canonical-graph-dir-key
  [encoded-graph-dir-key]
  (let [decoded (worker-util/decode-graph-dir-name encoded-graph-dir-key)]
    (when (canonical-graph-dir-key? decoded)
      decoded)))

(defn repo-dir
  [graphs-root repo]
  (node-path/join graphs-root (worker-util/encode-graph-dir-name (repo->graph-dir-key repo))))

(defn lock-path
  [root-dir repo]
  (node-path/join (repo-dir (graphs-dir root-dir) repo) "db-worker.lock"))

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

(def ^:private valid-owner-sources
  #{:cli :electron :unknown})

(defn normalize-owner-source
  [owner-source]
  (let [owner-source (cond
                       (keyword? owner-source) owner-source
                       (string? owner-source) (keyword owner-source)
                       :else :unknown)]
    (if (contains? valid-owner-sources owner-source)
      owner-source
      :unknown)))

(defn- normalize-lock
  [lock]
  (when lock
    (assoc lock :owner-source (normalize-owner-source (:owner-source lock)))))

(defn read-lock
  [path]
  (when (and (seq path) (fs/existsSync path))
    (normalize-lock
     (js->clj (js/JSON.parse (.toString (fs/readFileSync path) "utf8"))
              :keywordize-keys true))))

(defn remove-lock!
  [path]
  (when (and (seq path) (fs/existsSync path))
    (fs/unlinkSync path)))

(defn create-lock!
  [{:keys [root-dir storage repo owner-source ticket generation]}]
  (p/create
   (fn [resolve reject]
     (try
       (let [root-dir (resolve-root-dir root-dir)
             storage (or storage (lifecycle/resolveStorage root-dir (graphs-dir root-dir)))
             path (node-path/join (repo-dir (.-graphsDir ^js storage) repo) "db-worker.lock")
             existing (read-lock path)]
         (when (and existing (contains? #{:alive :no-permission} (pid-status (:pid existing))))
           (throw (ex-info "graph already locked" {:code :repo-locked :lock existing})))
         (when (and existing (= :not-found (pid-status (:pid existing))))
           (remove-lock! path))
         (fs/mkdirSync (node-path/dirname path) #js {:recursive true})
         (let [fd (fs/openSync path "wx")
               lock {:repo repo
                     :root-dir root-dir
                     :storage (js->clj storage :keywordize-keys true)
                     :ticket ticket
                     :generation generation
                     :pid (.-pid js/process)
                     :lock-id (str (random-uuid))
                     :owner-source (normalize-owner-source owner-source)}]
           (try
             (fs/writeFileSync fd (js/JSON.stringify (clj->js lock)))
             (finally
               (fs/closeSync fd)))
           (resolve lock)))
       (catch :default e
         (log/error :db-worker-node-lock-create-failed e)
         (reject e))))))

(defn assert-lock-owner!
  [path {:keys [repo pid lock-id] :as owner-lock}]
  (let [lock (read-lock path)]
    (cond
      (nil? owner-lock)
      (throw (ex-info "lock owner missing"
                      {:code :repo-locked
                       :path path}))

      (nil? lock)
      (throw (ex-info "graph lock missing"
                      {:code :repo-locked
                       :path path}))

      (not= :alive (pid-status (:pid lock)))
      (throw (ex-info "graph lock is stale"
                      {:code :repo-locked
                       :path path
                       :lock lock}))

      (not (graph-dir/same-repo? repo (:repo lock)))
      (throw (ex-info "graph lock repo mismatch"
                      {:code :repo-locked
                       :path path
                       :lock lock
                       :owner owner-lock}))

      (not= pid (:pid lock))
      (throw (ex-info "graph lock pid mismatch"
                      {:code :repo-locked
                       :path path
                       :lock lock
                       :owner owner-lock}))

      (not= lock-id (:lock-id lock))
      (throw (ex-info "graph lock-id mismatch"
                      {:code :repo-locked
                       :path path
                       :lock lock
                       :owner owner-lock}))

      :else
      lock)))

(defn ensure-lock!
  [{:keys [root-dir storage repo owner-source ticket generation]}]
  (let [root-dir (resolve-root-dir root-dir)
        storage (or storage (lifecycle/resolveStorage root-dir (graphs-dir root-dir)))
        path (node-path/join (repo-dir (.-graphsDir ^js storage) repo) "db-worker.lock")]
    (p/let [lock (create-lock! {:root-dir root-dir :storage storage
                              :repo repo
                              :ticket ticket
                              :generation generation
                              :owner-source owner-source})]
      {:path path
       :lock lock})))
