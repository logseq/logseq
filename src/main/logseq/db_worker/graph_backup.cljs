(ns logseq.db-worker.graph-backup
  "Shared Node-only graph backup filesystem policy."
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [logseq.common.graph-dir :as graph-dir]
            [promesa.core :as p]))

(def ^:private backup-root-dir-name "backup")
(def ^:private backup-db-file-name "db.sqlite")
(def ^:private backup-metadata-file-name "metadata.edn")
(def ^:private metadata-schema-version 1)

(defn- required!
  [value label]
  (when-not (and (some? value)
                 (or (not (string? value))
                     (seq value)))
    (throw (js/Error. (str label " is required"))))
  value)

(defn- child-path!
  [parent child label]
  (let [path (node-path/join parent child)
        parent-path (node-path/resolve parent)
        child-path (node-path/resolve path)
        relative-path (node-path/relative parent-path child-path)]
    (when (or (string/blank? relative-path)
              (string/starts-with? relative-path "..")
              (node-path/isAbsolute relative-path))
      (throw (ex-info (str "invalid " label " path")
                      {:code :invalid-backup-path
                       :parent parent
                       :child child
                       :path path})))
    path))

(defn backup-root-path
  [graphs-dir repo]
  (required! graphs-dir "graphs-dir")
  (required! repo "repo")
  (node-path/join (child-path! graphs-dir
                               (required! (graph-dir/repo->encoded-graph-dir-name repo)
                                          "encoded graph directory")
                               "graph directory")
                  backup-root-dir-name))

(defn backup-dir-name
  [backup-name]
  (required! backup-name "backup-name")
  (required! (graph-dir/graph-dir-key->encoded-dir-name backup-name)
             "encoded backup directory"))

(defn backup-dir-path
  [graphs-dir repo backup-name]
  (child-path! (backup-root-path graphs-dir repo)
               (backup-dir-name backup-name)
               "backup directory"))

(defn backup-db-path
  [graphs-dir repo backup-name]
  (node-path/join (backup-dir-path graphs-dir repo backup-name)
                  backup-db-file-name))

(defn backup-metadata-path
  [graphs-dir repo backup-name]
  (node-path/join (backup-dir-path graphs-dir repo backup-name)
                  backup-metadata-file-name))

(defn- pad2
  [value]
  (if (< value 10)
    (str "0" value)
    (str value)))

(defn- utc-timestamp
  []
  (let [now (js/Date.)]
    (str (.getUTCFullYear now)
         (pad2 (inc (.getUTCMonth now)))
         (pad2 (.getUTCDate now))
         "T"
         (pad2 (.getUTCHours now))
         (pad2 (.getUTCMinutes now))
         (pad2 (.getUTCSeconds now))
         "Z")))

(defn- trimmed-option
  [value]
  (some-> value str string/trim not-empty))

(defn build-backup-name
  ([repo label]
   (build-backup-name repo label (utc-timestamp)))
  ([repo label timestamp]
   (let [graph-name (required! (graph-dir/repo->graph-dir-key repo) "graph name")
         label-part (trimmed-option label)]
     (if (seq label-part)
       (str graph-name "-" label-part "-" timestamp)
       (str graph-name "-" timestamp)))))

(defn next-backup-target
  [graphs-dir repo base-name]
  (required! base-name "backup-name")
  (loop [suffix 0]
    (let [backup-name (if (zero? suffix)
                        base-name
                        (str base-name "-" suffix))
          dir-path (backup-dir-path graphs-dir repo backup-name)
          db-path (node-path/join dir-path backup-db-file-name)]
      (if (fs/existsSync dir-path)
        (recur (inc suffix))
        {:backup-name backup-name
         :dir-path dir-path
         :db-path db-path}))))

(defn- stat-file
  [file-path]
  (try
    (let [stat (fs/statSync file-path)]
      (when (.isFile stat)
        stat))
    (catch :default e
      (when-not (= "ENOENT" (.-code e))
        (throw e)))))

(defn- read-metadata
  [metadata-path]
  (try
    (reader/read-string (.toString (fs/readFileSync metadata-path) "utf8"))
    (catch :default _
      nil)))

(defn- backup-entry
  [root-path ^js dirent]
  (let [dir-name (.-name dirent)
        backup-name (graph-dir/decode-graph-dir-name dir-name)
        dir-path (node-path/join root-path dir-name)
        db-path (node-path/join dir-path backup-db-file-name)]
    (when (seq backup-name)
      (when-let [stat (stat-file db-path)]
        {:name backup-name
         :dir-path dir-path
         :path db-path
         :created-at (.-mtimeMs stat)
         :size-bytes (.-size stat)
         :metadata (read-metadata (node-path/join dir-path backup-metadata-file-name))}))))

(defn- backup-entries
  [graphs-dir repo]
  (let [root-path (backup-root-path graphs-dir repo)]
    (if (fs/existsSync root-path)
      (->> (fs/readdirSync root-path #js {:withFileTypes true})
           (filter #(.isDirectory ^js %))
           (keep #(backup-entry root-path %))
           (sort-by (juxt :name :created-at))
           vec)
      [])))

(defn list-backups
  [graphs-dir repo]
  (->> (backup-entries graphs-dir repo)
       (mapv (fn [{:keys [metadata] :as entry}]
               (cond-> (select-keys entry [:name :created-at :size-bytes])
                 (some? (:source metadata))
                 (assoc :source (:source metadata)))))))

(defn latest-backup-info
  [graphs-dir repo source]
  (->> (backup-entries graphs-dir repo)
       (filter #(= source (get-in % [:metadata :source])))
       (sort-by #(get-in % [:metadata :created-at-ms]) >)
       first))

(defn prune-backups!
  [{:keys [graphs-dir repo source keep-versions]}]
  (required! graphs-dir "graphs-dir")
  (required! repo "repo")
  (required! source "source")
  (when-not (nat-int? keep-versions)
    (throw (js/Error. "keep-versions must be a non-negative integer")))
  (let [to-remove (->> (backup-entries graphs-dir repo)
                       (filter #(= source (get-in % [:metadata :source])))
                       (sort-by #(get-in % [:metadata :created-at-ms]) >)
                       (drop keep-versions)
                       vec)]
    (doseq [{:keys [dir-path]} to-remove]
      (fs/rmSync dir-path #js {:recursive true :force true}))
    (mapv #(select-keys % [:name :dir-path :path]) to-remove)))

(defn remove-backup!
  [graphs-dir repo backup-name]
  (let [dir-path (backup-dir-path graphs-dir repo backup-name)]
    (if (fs/existsSync dir-path)
      (do
        (fs/rmSync dir-path #js {:recursive true :force true})
        true)
      false)))

(defn- reserve-next-backup-target!
  [graphs-dir repo base-name]
  (fs/mkdirSync (backup-root-path graphs-dir repo) #js {:recursive true})
  (loop [suffix 0]
    (let [backup-name (if (zero? suffix)
                        base-name
                        (str base-name "-" suffix))
          dir-path (backup-dir-path graphs-dir repo backup-name)
          result (try
                   (fs/mkdirSync dir-path)
                   {:backup-name backup-name
                    :dir-path dir-path
                    :db-path (node-path/join dir-path backup-db-file-name)}
                   (catch :default e
                     (if (= "EEXIST" (.-code e))
                       ::retry
                       (throw e))))]
      (if (= ::retry result)
        (recur (inc suffix))
        result))))

(defn- cleanup-reserved-target!
  [dir-path tmp-db-path db-path]
  (when (and (seq tmp-db-path)
             (fs/existsSync tmp-db-path))
    (fs/rmSync tmp-db-path #js {:force true}))
  (when-not (fs/existsSync db-path)
    (fs/rmSync dir-path #js {:recursive true :force true})))

(defn- write-metadata!
  [{:keys [graphs-dir repo backup-name source created-at-ms db-path]}]
  (fs/writeFileSync
   (backup-metadata-path graphs-dir repo backup-name)
   (pr-str {:schema-version metadata-schema-version
            :name backup-name
            :repo repo
            :source source
            :created-at-ms created-at-ms
            :db-path db-path})
   "utf8"))

(defn- throttled?
  [{:keys [graphs-dir repo source throttle-ms now-ms]}]
  (when (and (pos-int? throttle-ms)
             (some? source))
    (when-let [latest (latest-backup-info graphs-dir repo source)]
      (let [created-at-ms (get-in latest [:metadata :created-at-ms])]
        (and (number? created-at-ms)
             (< (- now-ms created-at-ms) throttle-ms))))))

(defn <create-backup!
  [{:keys [graphs-dir repo backup-name source snapshot! now-ms keep-versions]
    :as opts}]
  (try
    (required! graphs-dir "graphs-dir")
    (required! repo "repo")
    (required! backup-name "backup-name")
    (required! source "source")
    (when-not (fn? snapshot!)
      (throw (js/Error. "snapshot! is required")))
    (let [created-at-ms (or now-ms (js/Date.now))]
      (if (throttled? (assoc opts :now-ms created-at-ms))
        (p/resolved {:backup-name nil
                     :path nil
                     :created? false
                     :reason :too-soon})
        (let [{:keys [backup-name dir-path db-path]} (reserve-next-backup-target!
                                                      graphs-dir repo backup-name)
              tmp-db-path (node-path/join dir-path
                                          (str "db."
                                               (.-pid js/process)
                                               "."
                                               (random-uuid)
                                               ".tmp.sqlite"))]
          (-> (p/let [_ (snapshot! tmp-db-path)
                      _ (when-not (stat-file tmp-db-path)
                          (throw (ex-info "snapshot did not create sqlite backup"
                                          {:code :missing-snapshot
                                           :path tmp-db-path})))
                      _ (fs/renameSync tmp-db-path db-path)
                      _ (write-metadata! {:graphs-dir graphs-dir
                                          :repo repo
                                          :backup-name backup-name
                                          :source source
                                          :created-at-ms created-at-ms
                                          :db-path db-path})
                      _ (when (some? keep-versions)
                          (prune-backups! {:graphs-dir graphs-dir
                                           :repo repo
                                           :source source
                                           :keep-versions keep-versions}))]
                {:backup-name backup-name
                 :path db-path
                 :created? true})
              (p/catch (fn [e]
                         (cleanup-reserved-target! dir-path tmp-db-path db-path)
                         (throw e)))))))
    (catch :default e
      (p/rejected e))))
