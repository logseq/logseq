(ns logseq.cli.server
  "db-worker-node lifecycle orchestration for logseq-cli."
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["http" :as http]
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
  [config]
  (expand-home (or (:data-dir config) "~/.logseq/db-worker")))

(defn- repo-dir
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
                                     (let [buf (js/Buffer.concat chunks)]
                                       (resolve {:status (.-statusCode res)
                                                 :body (.toString buf "utf8")}))))
                    (.on res "error" reject))))
           timeout-id (js/setTimeout
                       (fn []
                         (.destroy req)
                         (reject (ex-info "request timeout" {:code :timeout})))
                       timeout-ms)]
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

    (not (pid-alive? (:pid lock)))
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
  (let [script (node-path/join js/__dirname "db-worker-node.js")
        args #js [script "--repo" repo "--data-dir" data-dir]
        child (.spawn child-process "node" args #js {:detached true
                                                     :stdio "ignore"})]
    (.unref child)
    child))

(defn- ensure-server-started!
  [config repo]
  (let [data-dir (resolve-data-dir config)
        path (lock-path data-dir repo)]
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
                     (when (and (pid-alive? (:pid lock))
                                (not= (:pid lock) (.-pid js/process)))
                       (try
                         (.kill js/process (:pid lock) "SIGTERM")
                         (catch :default e
                           (log/warn :cli-server-stop-sigterm-failed e))))
                     (when-not (pid-alive? (:pid lock))
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
        db-dir-prefix ".logseq-pool-"
        entries (when (fs/existsSync data-dir)
                  (fs/readdirSync data-dir #js {:withFileTypes true}))]
    (->> entries
         (filter #(.isDirectory ^js %))
         (map (fn [^js dirent]
                (.-name dirent)))
         (filter #(string/starts-with? % db-dir-prefix))
         (map (fn [dir-name]
                (-> dir-name
                    (string/replace-first db-dir-prefix "")
                    (string/replace "+3A+" ":")
                    (string/replace "++" "/"))))
         (vec))))
