(ns logseq.db-worker.daemon
  "Shared db-worker-node lifecycle helpers for CLI and Electron."
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["http" :as http]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(def ^:private valid-owner-sources
  #{:cli :electron :unknown})

(def ^:private stale-unhealthy-lock-grace-ms 30000)

(defn normalize-owner-source
  [owner-source]
  (let [owner-source (cond
                       (keyword? owner-source) owner-source
                       (string? owner-source) (keyword (string/trim owner-source))
                       :else :unknown)]
    (if (contains? valid-owner-sources owner-source)
      owner-source
      :unknown)))

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
                                              :path "/healthz"
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
        (contains? #{200 503} status))
      (p/catch (fn [_] false))))

(defn valid-lock?
  [lock]
  (and (seq (:repo lock))
       (number? (:pid lock))
       (seq (:lock-id lock))))

(defn- recent-lock?
  [{:keys [startedAt]}]
  (when (string? startedAt)
    (let [started-ms (js/Date.parse startedAt)]
      (and (number? started-ms)
           (not (js/isNaN started-ms))
           (< (- (js/Date.now) started-ms) stale-unhealthy-lock-grace-ms)))))

(declare wait-for)

(defn- process-stopped?
  [pid]
  (not (contains? #{:alive :no-permission} (pid-status pid))))

(defn- terminate-process!
  [pid force?]
  (if (= "win32" (.-platform js/process))
    (let [args (cond-> ["/PID" (str pid) "/T"]
                 force? (conj "/F"))]
      (try
        (let [result (.spawnSync child-process "taskkill" (clj->js args)
                                 #js {:windowsHide true
                                      :stdio "ignore"})]
          (if (or (= 0 (.-status result))
                  (process-stopped? pid))
            (p/resolved nil)
            (p/rejected (ex-info "taskkill failed"
                                 {:code :taskkill-failed
                                  :pid pid
                                  :force? force?}))))
        (catch :default e
          (p/rejected e))))
    (try
      (.kill js/process pid (if force? "SIGKILL" "SIGTERM"))
      (p/resolved nil)
      (catch :default e
        (p/rejected e)))))

(defn- wait-for-process-stop!
  [pid timeout-ms]
  (wait-for (fn [] (p/resolved (process-stopped? pid)))
            {:timeout-ms timeout-ms
             :interval-ms 100}))

(defn- stop-stale-process!
  [{:keys [pid]}]
  (cond
    (not (number? pid))
    (p/resolved nil)

    (= pid (.-pid js/process))
    (p/resolved nil)

    (process-stopped? pid)
    (p/resolved nil)

    :else
    (-> (p/do!
         (-> (terminate-process! pid false)
             (p/catch (fn [e]
                        (log/warn :db-worker-daemon/stale-process-stop-failed
                                  {:pid pid :force? false :error e})
                        (p/resolved nil))))
         (wait-for-process-stop! pid 5000))
        (p/catch (fn [_]
                   (-> (terminate-process! pid true)
                       (p/catch (fn [e]
                                  (log/warn :db-worker-daemon/stale-process-stop-failed
                                            {:pid pid :force? true :error e})
                                  (p/resolved nil))))
                   (-> (wait-for-process-stop! pid 1000)
                       (p/catch (fn [_] nil))))))))

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
    (-> (stop-stale-process! lock)
        (p/then (fn [_]
                  (remove-lock! path)
                  nil)))

    :else
    (p/resolved nil)))

(defn wait-for
  [pred-fn {:keys [timeout-ms interval-ms]
            :or {timeout-ms 8000
                 interval-ms 50}}]
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
              (p/resolved (fs/existsSync path)))
            {:timeout-ms 8000
             :interval-ms 50}))

(defn wait-for-ready
  [lock]
  (wait-for (fn [] (ready? lock))
            {:timeout-ms 8000
             :interval-ms 50}))

(defn spawn-server!
  [{:keys [script repo data-dir owner-source create-empty-db? server-list-file]}]
  (let [owner-source (normalize-owner-source owner-source)
        detached? (not= owner-source :electron)
        args (clj->js (cond-> [script "--repo" repo "--data-dir" data-dir "--owner-source" (name owner-source)]
                        server-list-file (conj "--server-list-file" server-list-file)
                        create-empty-db? (conj "--create-empty-db")))
        env (js/Object.assign #js {} (.-env js/process) #js {:ELECTRON_RUN_AS_NODE "1"})]
    (if-not script
      (do
        (log/warn :db-worker-daemon/missing-script {:repo repo :data-dir data-dir})
        nil)
      (let [child (.spawn child-process (.-execPath js/process) args #js {:detached detached?
                                                                          :stdio (if detached?
                                                                                   "ignore"
                                                                                   "inherit")
                                                                          :env env})]
        (when detached?
          (.unref child))
        child))))
