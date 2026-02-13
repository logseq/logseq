(ns frontend.worker.db-worker-node-lock
  "Lock file helpers for db-worker-node."
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [clojure.string :as string]
            [frontend.worker.graph-dir :as graph-dir]
            [frontend.worker-common.util :as worker-util]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [promesa.core :as p]))

(defn- expand-home
  [path]
  (if (string/starts-with? path "~")
    (node-path/join (.homedir os) (subs path 1))
    path))

(defn resolve-data-dir
  [data-dir]
  (expand-home (or data-dir "~/logseq/graphs")))

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
  [data-dir repo]
  (node-path/join data-dir (worker-util/encode-graph-dir-name (repo->graph-dir-key repo))))

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
  [{:keys [data-dir repo host port owner-source]}]
  (p/create
   (fn [resolve reject]
     (try
       (let [data-dir (resolve-data-dir data-dir)
             path (lock-path data-dir repo)
             existing (read-lock path)]
         (when (and existing (contains? #{:alive :no-permission} (pid-status (:pid existing))))
           (throw (ex-info "graph already locked" {:code :repo-locked :lock existing})))
         (when (and existing (= :not-found (pid-status (:pid existing))))
           (remove-lock! path))
         (fs/mkdirSync (node-path/dirname path) #js {:recursive true})
         (let [fd (fs/openSync path "wx")
               lock {:repo repo
                     :pid (.-pid js/process)
                     :lock-id (str (random-uuid))
                     :host host
                     :port port
                     :owner-source (normalize-owner-source owner-source)
                     :startedAt (.toISOString (js/Date.))}]
           (try
             (fs/writeFileSync fd (js/JSON.stringify (clj->js lock)))
             (finally
               (fs/closeSync fd)))
           (resolve lock)))
       (catch :default e
         (log/error :db-worker-node-lock-create-failed e)
         (reject e))))))

(defn update-lock!
  [path lock]
  (p/create
   (fn [resolve reject]
     (try
       (let [existing (read-lock path)
             lock' (if existing
                     (-> lock
                         (assoc :repo (:repo existing))
                         (assoc :pid (:pid existing))
                         (assoc :lock-id (or (:lock-id existing) (:lock-id lock)))
                         (assoc :owner-source (normalize-owner-source (:owner-source existing)))
                         (assoc :startedAt (:startedAt existing)))
                     (update lock :owner-source normalize-owner-source))]
         (fs/writeFileSync path (js/JSON.stringify (clj->js lock')))
         (resolve lock'))
       (catch :default e
         (log/error :db-worker-node-lock-update-failed e)
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

      (not= repo (:repo lock))
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
  [{:keys [data-dir repo host port owner-source]}]
  (let [data-dir (resolve-data-dir data-dir)
        path (lock-path data-dir repo)]
    (p/let [lock (create-lock! {:data-dir data-dir
                                :repo repo
                                :host host
                                :port port
                                :owner-source owner-source})]
      {:path path
       :lock lock})))
