(ns frontend.worker.db-worker-node-lock
  "Lock file helpers for db-worker-node."
  (:require ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [clojure.string :as string]
            [frontend.worker-common.util :as worker-util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- expand-home
  [path]
  (if (string/starts-with? path "~")
    (node-path/join (.homedir os) (subs path 1))
    path))

(defn resolve-data-dir
  [data-dir]
  (expand-home (or data-dir "~/.logseq/db-worker")))

(defn repo-dir
  [data-dir repo]
  (let [pool-name (worker-util/get-pool-name repo)]
    (node-path/join data-dir (str "." pool-name))))

(defn lock-path
  [data-dir repo]
  (node-path/join (repo-dir data-dir repo) "db-worker.lock"))

(defn- pid-alive?
  [pid]
  (when (number? pid)
    (try
      (.kill js/process pid 0)
      true
      (catch :default _ false))))

(defn read-lock
  [path]
  (when (and (seq path) (fs/existsSync path))
    (js->clj (js/JSON.parse (.toString (fs/readFileSync path) "utf8"))
             :keywordize-keys true)))

(defn remove-lock!
  [path]
  (when (and (seq path) (fs/existsSync path))
    (fs/unlinkSync path)))

(defn create-lock!
  [{:keys [data-dir repo host port]}]
  (p/create
   (fn [resolve reject]
     (try
       (let [data-dir (resolve-data-dir data-dir)
             path (lock-path data-dir repo)
             existing (read-lock path)]
         (when (and existing (pid-alive? (:pid existing)))
           (throw (ex-info "graph already locked" {:code :repo-locked :lock existing})))
         (when existing
           (remove-lock! path))
         (fs/mkdirSync (node-path/dirname path) #js {:recursive true})
         (let [fd (fs/openSync path "wx")
               lock {:repo repo
                     :pid (.-pid js/process)
                     :host host
                     :port port
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
       (fs/writeFileSync path (js/JSON.stringify (clj->js lock)))
       (resolve lock)
       (catch :default e
         (log/error :db-worker-node-lock-update-failed e)
         (reject e))))))

(defn ensure-lock!
  [{:keys [data-dir repo host port]}]
  (let [data-dir (resolve-data-dir data-dir)
        path (lock-path data-dir repo)]
    (p/let [lock (create-lock! {:data-dir data-dir
                                :repo repo
                                :host host
                                :port port})]
      {:path path
       :lock lock})))
