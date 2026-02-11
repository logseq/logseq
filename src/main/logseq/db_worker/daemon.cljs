(ns logseq.db-worker.daemon
  "Shared db-worker-node lifecycle helpers for CLI and Electron."
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["http" :as http]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

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
    (js->clj (js/JSON.parse (.toString (fs/readFileSync path) "utf8"))
             :keywordize-keys true)))

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
  [{:keys [script repo data-dir]}]
  (let [args #js ["--repo" repo "--data-dir" data-dir]
        child (.spawn child-process script args #js {:detached true
                                                     :stdio "ignore"})]
    (when-not script
      (log/warn :db-worker-daemon/missing-script {:repo repo :data-dir data-dir}))
    (.unref child)
    child))
