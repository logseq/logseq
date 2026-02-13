(ns logseq.db-worker.daemon
  "Shared db-worker-node lifecycle helpers for CLI and Electron."
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["http" :as http]
            ["path" :as node-path]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(def ^:private valid-owner-sources
  #{:cli :electron :unknown})

(defn normalize-owner-source
  [owner-source]
  (let [owner-source (cond
                       (keyword? owner-source) owner-source
                       (string? owner-source) (keyword (string/trim owner-source))
                       :else :unknown)]
    (if (contains? valid-owner-sources owner-source)
      owner-source
      :unknown)))

(defn- platform-supports-process-scan?
  []
  (contains? #{"darwin" "linux"} (.-platform js/process)))

(defn- normalize-dir
  [path]
  (when (seq path)
    (node-path/resolve path)))

(defn- unquote-arg
  [value]
  (if (and (string? value)
           (>= (count value) 2)
           (or (and (string/starts-with? value "\"")
                    (string/ends-with? value "\""))
               (and (string/starts-with? value "'")
                    (string/ends-with? value "'"))))
    (subs value 1 (dec (count value)))
    value))

(defn- extract-arg
  [command flag]
  (some-> (re-find (re-pattern (str "(?:^|\\s)" flag "\\s+((?:\"[^\"]+\"|'[^']+'|\\S+))")) command)
          second
          unquote-arg))

(defn parse-process-args
  [command]
  (let [command (string/trim (or command ""))]
    (when (and (seq command)
               (re-find #"db-worker-node(?:\.js)?\b" command))
      (let [repo (extract-arg command "--repo")
            data-dir (extract-arg command "--data-dir")
            owner-source (normalize-owner-source (extract-arg command "--owner-source"))]
        (when (and (seq repo) (seq data-dir))
          {:repo repo
           :data-dir (normalize-dir data-dir)
           :owner-source owner-source})))))

(defn- parse-process-line
  [line]
  (let [line (string/trim (or line ""))]
    (when-let [[_ pid-str command] (and (seq line)
                                        (re-matches #"^(\d+)\s+(.*)$" line))]
      (let [pid (js/parseInt pid-str 10)]
        (when (and (number? pid) (pos-int? pid))
          (when-let [args (parse-process-args command)]
            (assoc args
                   :pid pid
                   :command command)))))))

(defn list-db-worker-processes
  []
  (if-not (platform-supports-process-scan?)
    []
    (try
      (let [output (.execFileSync child-process "ps"
                                  #js ["-ax" "-o" "pid=" "-o" "command="]
                                  #js {:encoding "utf8"})]
        (->> (string/split-lines (or output ""))
             (keep parse-process-line)
             (vec)))
      (catch :default e
        (log/warn :db-worker-daemon/process-scan-failed e)
        []))))

(defn find-orphan-processes
  [{:keys [repo data-dir]}]
  (let [data-dir (normalize-dir data-dir)]
    (->> (list-db-worker-processes)
         (filter (fn [process]
                   (and (= repo (:repo process))
                        (= data-dir (:data-dir process)))))
         (vec))))

(defn cleanup-orphan-processes!
  [{:keys [repo data-dir]}]
  (let [orphans (find-orphan-processes {:repo repo :data-dir data-dir})
        current-pid (.-pid js/process)
        killed-pids (reduce (fn [result {:keys [pid]}]
                              (if (= current-pid pid)
                                result
                                (try
                                  (.kill js/process pid "SIGTERM")
                                  (conj result pid)
                                  (catch :default e
                                    (when-not (= "ESRCH" (.-code e))
                                      (log/warn :db-worker-daemon/orphan-kill-failed
                                                {:pid pid :error e}))
                                    result))))
                            []
                            orphans)]
    {:orphans orphans
     :killed-pids killed-pids}))

(defn pid-status
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

(defn read-lock
  [path]
  (when (and (seq path) (fs/existsSync path))
    (let [lock (js->clj (js/JSON.parse (.toString (fs/readFileSync path) "utf8"))
                        :keywordize-keys true)]
      (assoc lock :owner-source (normalize-owner-source (:owner-source lock))))))

(defn remove-lock!
  [path]
  (when (and (seq path) (fs/existsSync path))
    (fs/unlinkSync path)))

(defn http-request
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
                                     (let [buf (js/Buffer.concat chunks)]
                                       (resolve {:status (.-statusCode res)
                                                 :body (.toString buf "utf8")
                                                 :elapsed-ms (- (js/Date.now) start-ms)}))))
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

(defn ready?
  [{:keys [host port]}]
  (-> (p/let [{:keys [status]} (http-request {:method "GET"
                                              :host host
                                              :port port
                                              :path "/readyz"
                                              :timeout-ms 1000})]
        (= 200 status))
      (p/catch (fn [_] false))))

(defn healthy?
  [{:keys [host port]}]
  (-> (p/let [{:keys [status]} (http-request {:method "GET"
                                              :host host
                                              :port port
                                              :path "/healthz"
                                              :timeout-ms 1000})]
        (= 200 status))
      (p/catch (fn [_] false))))

(defn valid-lock?
  [lock]
  (and (seq (:host lock))
       (pos-int? (:port lock))))

(defn cleanup-stale-lock!
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

(defn wait-for
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

(defn wait-for-lock
  [path]
  (wait-for (fn []
              (p/resolved (and (fs/existsSync path)
                               (let [lock (read-lock path)]
                                 (pos-int? (:port lock))))))
            {:timeout-ms 8000
             :interval-ms 200}))

(defn wait-for-ready
  [lock]
  (wait-for (fn [] (ready? lock))
            {:timeout-ms 8000
             :interval-ms 250}))

(defn spawn-server!
  [{:keys [script repo data-dir owner-source]}]
  (let [owner-source (normalize-owner-source owner-source)
        args #js ["--repo" repo "--data-dir" data-dir "--owner-source" (name owner-source)]
        child (.spawn child-process script args #js {:detached true
                                                     :stdio "ignore"})]
    (when-not script
      (log/warn :db-worker-daemon/missing-script {:repo repo :data-dir data-dir}))
    (.unref child)
    child))
