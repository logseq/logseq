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
              (p/resolved (and (fs/existsSync path)
                               (let [lock (read-lock path)]
                                 (pos-int? (:port lock))))))
            {:timeout-ms 8000
             :interval-ms 50}))

(defn wait-for-ready
  [lock]
  (wait-for (fn [] (ready? lock))
            {:timeout-ms 8000
             :interval-ms 50}))

(defn spawn-server!
  [{:keys [script repo data-dir owner-source create-empty-db?]}]
  (let [owner-source (normalize-owner-source owner-source)
        detached? (not= owner-source :electron)
        args (clj->js (cond-> [script "--repo" repo "--data-dir" data-dir "--owner-source" (name owner-source)]
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
