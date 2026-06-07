(ns electron.embedding-server
  (:require ["child_process" :as child-process]
            ["fs-extra" :as fs]
            ["path" :as node-path]
            [clojure.string :as string]
            [promesa.core :as p]))

(def ^:private default-host "127.0.0.1")
(def ^:private default-model-id "all-MiniLM-L6-v2")
(def ^:private embedding-url-env "LOGSEQ_EMBEDDINGS_URL")
(def ^:private runtime-dir-name "embedding-server")
(def ^:private venv-name ".venv")
(def ^:private dependencies ["sentence-transformers" "httpx[socks]"])
(def ^:private deps-stamp-name "deps-v2.ok")
(def ^:private log-file-name "embedding-server.log")
(def ^:private ready-timeout-ms 120000)
(def ^:private ready-poll-ms 100)

(defonce ^:private *server-process (atom nil))
(defonce ^:private *startup-promise (atom nil))
(defonce ^:private *endpoint-promise (atom nil))
(defonce ^:private *endpoint (atom nil))
(defonce ^:private *endpoint-ready? (atom false))
(defonce ^:private *endpoint-env-published? (atom false))

(declare find-port! run-command! spawn-server! wait-ready! stop!)

(defn- default-logger
  []
  (let [logger (js/require "electron-log")]
    {:debug (.-debug logger)
     :info (.-info logger)
     :warn (.-warn logger)
     :error (.-error logger)}))

(defn- macos?
  [platform]
  (= "darwin" platform))

(defn- sidecar-dir
  [{:keys [packaged? resources-path dirname]}]
  (if packaged?
    (node-path/join resources-path "sidecar")
    (node-path/join dirname ".." "sidecar")))

(defn- config
  [^js app' opts]
  (let [platform (or (:platform opts) (.-platform js/process))
        user-data-dir (or (:user-data-dir opts) (.getPath app' "userData"))
        packaged? (if (contains? opts :packaged?)
                    (:packaged? opts)
                    (boolean (.-isPackaged app')))
        runtime-dir (node-path/join user-data-dir runtime-dir-name)
        venv-dir (node-path/join runtime-dir venv-name)
        venv-python (node-path/join venv-dir "bin" "python")
        venv-python-candidates [venv-python
                                (node-path/join venv-dir "bin" "python3")]
        sidecar-root (sidecar-dir {:packaged? packaged?
                                   :resources-path (or (:resources-path opts)
                                                       (.-resourcesPath js/process))
                                   :dirname (or (:dirname opts) js/__dirname)})
        script-path (node-path/join sidecar-root "embedding_server.py")]
    {:platform platform
     :runtime-dir runtime-dir
     :venv-dir venv-dir
     :venv-python venv-python
     :venv-python-candidates venv-python-candidates
     :deps-stamp (node-path/join runtime-dir deps-stamp-name)
     :log-file (node-path/join runtime-dir log-file-name)
     :sidecar-dir sidecar-root
     :script-path script-path
     :python-command (or (:python-command opts)
                         (.-LOGSEQ_EMBEDDINGS_PYTHON js/process.env)
                         "python3")
     :host (or (:host opts) default-host)
     :port (:port opts)
     :model-id (or (:model-id opts)
                   (.-LOGSEQ_EMBEDDING_MODEL js/process.env)
                   default-model-id)
     :exists? (or (:exists? opts) #(fs/existsSync %))
     :ensure-dir! (or (:ensure-dir! opts) #(fs/ensureDirSync %))
     :remove-dir! (or (:remove-dir! opts) #(fs/removeSync %))
     :delete-env! (or (:delete-env! opts) #(js-delete js/process.env %))
     :write-file! (or (:write-file! opts) #(.writeFileSync fs %1 %2 "utf8"))
     :logger (:logger opts)
     :find-port! (or (:find-port! opts) find-port!)
     :set-env! (or (:set-env! opts) #(aset js/process.env %1 %2))
     :run-command! (or (:run-command! opts) run-command!)
     :wait-ready! (or (:wait-ready! opts) wait-ready!)
     :spawn-server! (or (:spawn-server! opts) spawn-server!)}))

(defn- log-stream!
  [^js stream log-fn label]
  (when stream
    (.on stream "data"
         (fn [data]
           (log-fn label (.toString data))))))

(defn- run-command!
  [cmd args {:keys [cwd logger]}]
  (js/Promise.
   (fn [resolve reject]
     (let [proc (.spawn child-process cmd (clj->js args) #js {:cwd cwd
                                                              :stdio "pipe"})]
       (log-stream! (.-stdout proc) (:debug logger) :embedding-server/setup)
       (log-stream! (.-stderr proc) (:warn logger) :embedding-server/setup)
       (.on proc "error" reject)
       (.on proc "close"
            (fn [code]
              (if (zero? code)
                (resolve nil)
                (reject (js/Error. (str "Embedding server setup command failed: "
                                        cmd " " (pr-str args)
                                        " exited with " code))))))))))

(defn- find-port!
  [host]
  (js/Promise.
   (fn [resolve reject]
     (let [node-net (js/require "node:net")
           server (.createServer node-net)]
       (.once server "error" reject)
       (.listen server 0 host
                (fn []
                  (let [port (.-port (.address server))]
                    (.close server
                            (fn [error]
                              (if error
                                (reject error)
                                (resolve port)))))))))))

(defn- embedding-endpoint
  [host port]
  (str "http://" host ":" port "/v1/embeddings"))

(defn- embedding-health-endpoint
  [host port]
  (str "http://" host ":" port "/healthz"))

(defn- publish-endpoint!
  [{:keys [host port set-env!]}]
  (let [endpoint-url (embedding-endpoint host port)]
    (reset! *endpoint endpoint-url)
    (reset! *endpoint-ready? true)
    (reset! *endpoint-env-published? true)
    (set-env! embedding-url-env endpoint-url)
    endpoint-url))

(defn- reserve-endpoint!
  [{:keys [host port]}]
  (let [endpoint-url (embedding-endpoint host port)]
    (reset! *endpoint endpoint-url)
    (reset! *endpoint-ready? false)
    endpoint-url))

(defn- clear-endpoint!
  [delete-env!]
  (when @*endpoint-env-published?
    (delete-env! embedding-url-env))
  (reset! *endpoint-promise nil)
  (reset! *endpoint nil)
  (reset! *endpoint-ready? false)
  (reset! *endpoint-env-published? false))

(defn- allocate-port!
  [{:keys [host port] :as cfg}]
  (let [find-port-fn (:find-port! cfg)]
    (p/let [port (or port (find-port-fn host))]
      (assoc cfg :port port))))

(defn- wait-ready!
  [endpoint-url]
  (let [deadline (+ (js/Date.now) ready-timeout-ms)]
    (letfn [(poll! []
              (-> (js/fetch endpoint-url)
                  (p/then (fn [resp]
                            (when-not (.-ok resp)
                              (throw (js/Error. (str "Embedding server health check failed: " (.-status resp)))))))
                  (p/catch (fn [error]
                             (if (< (js/Date.now) deadline)
                               (p/let [_ (p/delay ready-poll-ms)]
                                 (poll!))
                               (throw error))))))]
      (poll!))))

(defn- attach-exit-handler!
  [^js proc {:keys [logger delete-env!]}]
  (when (and proc (fn? (.-on proc)))
    (.on proc "exit"
         (fn [code signal]
           (when (identical? proc @*server-process)
             (reset! *server-process nil)
             (clear-endpoint! delete-env!))
           ((:info logger) :embedding-server/exited {:code code
                                                     :signal signal})))))

(defn- spawn-server!
  [{:keys [venv-python script-path host port model-id log-file logger]
    sidecar-root :sidecar-dir}]
  (let [proc (.spawn child-process
                     venv-python
                     (clj->js [script-path
                               "--host" host
                               "--port" (str port)
                               "--model" model-id
                               "--log-file" log-file])
                     #js {:cwd sidecar-root
                          :stdio "pipe"})]
    (log-stream! (.-stdout proc) (:info logger) :embedding-server)
    (log-stream! (.-stderr proc) (:warn logger) :embedding-server)
    (.on proc "error"
         (fn [error]
           ((:error logger) :embedding-server/start-failed error)))
    proc))

(defn- existing-venv-python
  [{:keys [exists? venv-python-candidates]}]
  (some #(when (exists? %) %) venv-python-candidates))

(defn- install-runtime!
  [{:keys [runtime-dir venv-dir deps-stamp python-command
           ensure-dir! remove-dir! exists? write-file! logger] :as cfg}]
  (ensure-dir! runtime-dir)
  (let [run-command-fn (:run-command! cfg)
        venv-python (existing-venv-python cfg)
        needs-venv? (nil? venv-python)
        needs-deps? (or needs-venv?
                        (not (exists? deps-stamp)))]
    (p/let [_ (when needs-venv?
                (remove-dir! venv-dir))
            _ (when needs-venv?
                (run-command-fn python-command ["-m" "venv" venv-name] {:cwd runtime-dir
                                                                         :logger logger}))
            venv-python (or (existing-venv-python cfg)
                            (throw (ex-info "Embedding server virtualenv Python is missing"
                                            {:venv-dir venv-dir
                                             :candidates (:venv-python-candidates cfg)})))
            _ (when needs-deps?
                (run-command-fn venv-python (into ["-m" "pip" "install"] dependencies) {:cwd runtime-dir
                                                                                        :logger logger}))]
      (when needs-deps?
        (write-file! deps-stamp (str (string/join "\n" dependencies) "\n")))
      (assoc cfg :venv-python venv-python))))

(defn start!
  ([app'] (start! app' {}))
  ([app' opts]
   (let [cfg (config app' opts)]
     (cond
       (not (macos? (:platform cfg)))
       (p/resolved :skipped)

       @*startup-promise
       @*startup-promise

       @*server-process
       (if-let [endpoint-url @*endpoint]
         (do
           ((:set-env! cfg) embedding-url-env endpoint-url)
           (p/resolved :already-started))
         (p/rejected (js/Error. "Embedding server endpoint is missing")))

       :else
       (let [cfg (assoc cfg :logger (or (:logger cfg) (default-logger)))
             endpoint-resolve (atom nil)
             endpoint-promise (js/Promise.
                               (fn [resolve _reject]
                                 (reset! endpoint-resolve resolve)))
             _ (reset! *endpoint-promise endpoint-promise)
             startup (-> (p/let [cfg (allocate-port! cfg)
                                 endpoint-url (reserve-endpoint! cfg)
                                 _ (@endpoint-resolve endpoint-url)
                                 cfg (install-runtime! cfg)
                                 proc ((:spawn-server! cfg) cfg)
                                 _ (do
                                     (reset! *server-process proc)
                                     (attach-exit-handler! proc cfg))
                                 _ ((:wait-ready! cfg) (embedding-health-endpoint (:host cfg) (:port cfg)))
                                 _ (publish-endpoint! cfg)]
                           :started)
                         (p/catch (fn [error]
                                    (when @endpoint-resolve
                                      (@endpoint-resolve nil))
                                    (stop!)
                                    ((:error (:logger cfg)) :embedding-server/setup-failed error)
                                    (throw error)))
                         (p/finally (fn []
                                      (reset! *startup-promise nil))))]
         (reset! *startup-promise startup)
         startup)))))

(defn ensure-endpoint!
  ([app'] (ensure-endpoint! app' {}))
  ([app' opts]
   (let [cfg (config app' opts)]
     (cond
       (not (macos? (:platform cfg)))
       (p/resolved nil)

       @*endpoint
       (do
         (when @*endpoint-ready?
           ((:set-env! cfg) embedding-url-env @*endpoint))
         (p/resolved @*endpoint))

       @*endpoint-promise
       @*endpoint-promise

       :else
       (do
         (p/catch (start! app' opts)
                  (fn [_error] nil))
         @*endpoint-promise)))))

(defn stop!
  []
  (reset! *startup-promise nil)
  (clear-endpoint! #(js-delete js/process.env %))
  (when-let [^js proc @*server-process]
    (reset! *server-process nil)
    (when (fn? (.-kill proc))
      (.kill proc))))

(defn setup!
  [app']
  (let [logger (default-logger)]
    (-> (start! app')
      (p/catch (fn [error]
                 ((:error logger) :embedding-server/setup-failed error)))))
  stop!)
