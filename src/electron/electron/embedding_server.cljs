(ns electron.embedding-server
  (:require ["child_process" :as child-process]
            ["fs-extra" :as fs]
            ["path" :as node-path]
            [electron.logger :as logger]
            [promesa.core :as p]))

(def ^:private default-host "127.0.0.1")
(def ^:private default-model-id "all-MiniLM-L6-v2")
(def ^:private embedding-url-env "LOGSEQ_EMBEDDINGS_URL")
(def ^:private runtime-dir-name "embedding-server")
(def ^:private venv-name ".venv")
(def ^:private dependency "sentence-transformers")
(def ^:private deps-stamp-name "deps-v1.ok")
(def ^:private ready-timeout-ms 15000)
(def ^:private ready-poll-ms 100)

(defonce ^:private *server-process (atom nil))
(defonce ^:private *startup-promise (atom nil))

(declare find-port! run-command! spawn-server! wait-ready! stop!)

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
        sidecar-root (sidecar-dir {:packaged? packaged?
                                   :resources-path (or (:resources-path opts)
                                                       (.-resourcesPath js/process))
                                   :dirname (or (:dirname opts) js/__dirname)})
        script-path (node-path/join sidecar-root "embedding_server.py")]
    {:platform platform
     :runtime-dir runtime-dir
     :venv-dir venv-dir
     :venv-python venv-python
     :deps-stamp (node-path/join runtime-dir deps-stamp-name)
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
     :write-file! (or (:write-file! opts) #(.writeFileSync fs %1 %2 "utf8"))
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
  [cmd args {:keys [cwd]}]
  (js/Promise.
   (fn [resolve reject]
     (let [proc (.spawn child-process cmd (clj->js args) #js {:cwd cwd
                                                              :stdio "pipe"})]
       (log-stream! (.-stdout proc) logger/debug :embedding-server/setup)
       (log-stream! (.-stderr proc) logger/warn :embedding-server/setup)
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

(defn- allocate-port!
  [{:keys [host port] :as cfg}]
  (let [find-port-fn (:find-port! cfg)]
    (p/let [port (or port (find-port-fn host))]
      (assoc cfg :port port))))

(defn- wait-ready!
  [endpoint]
  (let [deadline (+ (js/Date.now) ready-timeout-ms)]
    (letfn [(poll! []
              (-> (js/fetch endpoint)
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
  [^js proc]
  (when (and proc (fn? (.-on proc)))
    (.on proc "exit"
         (fn [code signal]
           (when (identical? proc @*server-process)
             (reset! *server-process nil))
           (logger/info :embedding-server/exited {:code code
                                                  :signal signal})))))

(defn- spawn-server!
  [{:keys [venv-python script-path host port model-id]
    sidecar-root :sidecar-dir}]
  (let [proc (.spawn child-process
                     venv-python
                     (clj->js [script-path
                               "--host" host
                               "--port" (str port)
                               "--model" model-id])
                     #js {:cwd sidecar-root
                          :stdio "pipe"})]
    (log-stream! (.-stdout proc) logger/info :embedding-server)
    (log-stream! (.-stderr proc) logger/warn :embedding-server)
    (.on proc "error"
         (fn [error]
           (logger/error :embedding-server/start-failed error)))
    proc))

(defn- install-runtime!
  [{:keys [runtime-dir venv-python deps-stamp python-command
           ensure-dir! exists? write-file!] :as cfg}]
  (ensure-dir! runtime-dir)
  (let [run-command-fn (:run-command! cfg)
        needs-venv? (not (exists? venv-python))
        needs-deps? (or needs-venv?
                        (not (exists? deps-stamp)))]
    (p/let [_ (when needs-venv?
                (run-command-fn python-command ["-m" "venv" venv-name] {:cwd runtime-dir}))
            _ (when needs-deps?
                (run-command-fn venv-python ["-m" "pip" "install" dependency] {:cwd runtime-dir}))]
      (when needs-deps?
        (write-file! deps-stamp (str dependency "\n")))
      cfg)))

(defn start!
  ([app'] (start! app' {}))
  ([app' opts]
   (let [cfg (config app' opts)]
     (cond
       (not (macos? (:platform cfg)))
       (p/resolved :skipped)

       @*server-process
       (p/resolved :already-started)

       @*startup-promise
       @*startup-promise

       :else
       (let [startup (-> (p/let [cfg (allocate-port! cfg)
                                 cfg (install-runtime! cfg)
                                 proc ((:spawn-server! cfg) cfg)
                                 _ (do
                                     (reset! *server-process proc)
                                     (attach-exit-handler! proc))
                                 _ ((:wait-ready! cfg) (embedding-health-endpoint (:host cfg) (:port cfg)))]
                           ((:set-env! cfg) embedding-url-env (embedding-endpoint (:host cfg) (:port cfg)))
                           :started)
                         (p/catch (fn [error]
                                    (stop!)
                                    (logger/error :embedding-server/setup-failed error)
                                    (throw error)))
                         (p/finally (fn []
                                      (reset! *startup-promise nil))))]
         (reset! *startup-promise startup)
         startup)))))

(defn stop!
  []
  (reset! *startup-promise nil)
  (when-let [^js proc @*server-process]
    (reset! *server-process nil)
    (when (fn? (.-kill proc))
      (.kill proc))))

(defn setup!
  [app']
  (-> (start! app')
      (p/catch (fn [error]
                 (logger/error :embedding-server/setup-failed error))))
  stop!)
