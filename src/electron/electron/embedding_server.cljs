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
(def ^:private pid-file-name "embedding-server.pid")
(def ^:private ready-timeout-ms 120000)
(def ^:private ready-poll-ms 100)
(def ^:private default-kill-timeout-ms 5000)

(defonce ^:private *server-process (atom nil))
(defonce ^:private *startup-promise (atom nil))
(defonce ^:private *queued-start (atom nil))
(defonce ^:private *endpoint-promise (atom nil))
(defonce ^:private *endpoint (atom nil))
(defonce ^:private *endpoint-ready? (atom false))
(defonce ^:private *endpoint-env-published? (atom false))
(defonce ^:private *stop-requested? (atom false))
(defonce ^:private *stop-promise (atom nil))
(defonce ^:private *abort-controller (atom nil))
(defonce ^:private *active-cfg (atom nil))
(defonce ^:private *setup-processes (atom #{}))

(declare find-port! run-command! spawn-server! <wait-ready! stop!)

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

(defn- abort-signal
  []
  (some-> @*abort-controller .-signal))

(defn- request-stop!
  []
  (reset! *stop-requested? true)
  (when-let [controller @*abort-controller]
    (reset! *abort-controller nil)
    (let [signal (.-signal controller)]
      (when-not (.-aborted signal)
        (.abort controller)))))

(defn- throw-if-stopped!
  []
  (when @*stop-requested?
    (throw (ex-info "Embedding server start aborted"
                    {:aborted true}))))

(defn- aborted-error?
  [error]
  (or (boolean (:aborted (ex-data error)))
      (= "AbortError" (some-> error .-name))
      (string/includes? (str error) "Embedding server start aborted")))

(defn- process-exited?
  [^js proc]
  (or (nil? proc)
      (some? (.-exitCode proc))
      (some? (.-signalCode proc))))

(defn- default-kill-pid-group!
  [pid signal]
  (when (and (not= "win32" (.-platform js/process))
             (number? pid)
             (pos? pid))
    (try
      (.kill js/process (- pid) signal)
      true
      (catch :default _
        false))))

(defn- send-signal!
  [^js proc signal]
  (let [kill-group! (or (:kill-pid-group! @*active-cfg) default-kill-pid-group!)]
    (when-not (or (process-exited? proc)
                  (when-let [pid (.-pid proc)]
                    (kill-group! pid signal)))
      (try
        (.kill proc signal)
        (catch :default _)))))

(defn- <wait-for-process!
  [^js proc event done? timeout-ms]
  (js/Promise.
   (fn [resolve]
     (if (done?)
       (resolve nil)
       (let [timer (atom nil)]
         (letfn [(finish [& _]
                   (js/clearTimeout @timer)
                   (when (fn? (.-removeListener proc))
                     (.removeListener proc event finish))
                   (resolve nil))]
           (reset! timer (js/setTimeout finish timeout-ms))
           (.once proc event finish)))))))

(defn- <kill-and-wait!
  [^js proc]
  (if (or (nil? proc) (process-exited? proc))
    (p/resolved nil)
    (let [timeout-ms (or (:kill-timeout-ms @*active-cfg) default-kill-timeout-ms)
          exited? #(process-exited? proc)
          <signal-and-wait! (fn [signal]
                              (let [exited (<wait-for-process! proc "exit" exited? timeout-ms)]
                                (send-signal! proc signal)
                                exited))]
      (p/let [_ (<signal-and-wait! "SIGTERM")
              _ (when-not (exited?) (<signal-and-wait! "SIGKILL"))]
        (when-not (exited?)
          (throw (ex-info "Embedding server did not exit"
                          {:code :sidecar-stop-timeout :pid (.-pid proc)})))))))

(defn- <stop-setup-process!
  [^js proc]
  (let [timeout-ms (or (:kill-timeout-ms @*active-cfg) default-kill-timeout-ms)
        closed? #(not (contains? @*setup-processes proc))
        closed (<wait-for-process! proc "close" closed? timeout-ms)]
    (send-signal! proc "SIGKILL")
    (p/then closed (fn [_]
                     (when-not (closed?)
                       (throw (ex-info "Embedding installer did not close"
                                       {:code :sidecar-stop-timeout :pid (.-pid proc)})))))))

(defn- parse-pid
  [value]
  (let [s (string/trim (str value))
        n (js/Number s)]
    (if (and (re-matches #"[1-9][0-9]*" s) (<= n 2147483647))
      n
      (throw (ex-info "Invalid embedding server PID record" {:code :invalid-sidecar-pid})))))

(defn- pid-alive?
  [pid]
  (try
    (.kill js/process pid 0)
    true
    (catch :default error
      (if (= "ESRCH" (.-code error)) false (throw error)))))

(defn- default-pid-owns-sidecar?
  [pid log-file]
  (when (pid-alive? pid)
    (try
      (let [command (.execFileSync child-process "ps" #js ["-p" (str pid) "-ww" "-o" "command="]
                                   #js {:encoding "utf8"})
            command (string/trim command)]
        (when (string/blank? command)
          (throw (js/Error. "Cannot inspect embedding server PID")))
        (string/ends-with? command (str " --log-file " log-file)))
      (catch :default error
        (when (pid-alive? pid) (throw error))))))

(defn- append-server-log!
  [{:keys [log-file append-file!]} message]
  (when (and log-file append-file!)
    (try
      (append-file! log-file (str (.toISOString (js/Date.)) " INFO " message "\n"))
      (catch :default _))))

(defn- write-pid-file!
  [{:keys [pid-file write-file!]} ^js proc]
  (when (and pid-file write-file! proc (.-pid proc))
    (write-file! pid-file (str (.-pid proc) "\n"))))

(defn- delete-pid-file!
  [{:keys [pid-file delete-file!]}]
  (when (and pid-file delete-file!)
    (try
      (delete-file! pid-file)
      (catch :default _))))

(defn- check-recorded-server!
  [{:keys [pid-file exists? read-file pid-owns-sidecar? log-file]}]
  (when (and pid-file exists? (exists? pid-file) read-file)
    ;; A persisted PID can be reused between inspection and signal delivery.
    (let [pid (parse-pid (read-file pid-file))]
      (when (pid-owns-sidecar? pid log-file)
        (throw (ex-info "Recorded embedding server is still running"
                        {:code :sidecar-still-running :pid pid}))))))

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
     :pid-file (node-path/join runtime-dir pid-file-name)
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
     :kill-timeout-ms (or (:kill-timeout-ms opts) default-kill-timeout-ms)
     :exists? (or (:exists? opts) #(fs/existsSync %))
     :ensure-dir! (or (:ensure-dir! opts) #(fs/ensureDirSync %))
     :remove-dir! (or (:remove-dir! opts) #(fs/removeSync %))
     :delete-env! (or (:delete-env! opts) #(js-delete js/process.env %))
     :write-file! (or (:write-file! opts) #(.writeFileSync fs %1 %2 "utf8"))
     :read-file (or (:read-file opts) #(.readFileSync fs % "utf8"))
     :append-file! (or (:append-file! opts) #(.appendFileSync fs %1 %2))
     :delete-file! (or (:delete-file! opts) #(fs/removeSync %))
     :logger (:logger opts)
     :find-port! (or (:find-port! opts) find-port!)
     :set-env! (or (:set-env! opts) #(aset js/process.env %1 %2))
     :run-command! (or (:run-command! opts) run-command!)
     :wait-ready! (or (:wait-ready! opts) <wait-ready!)
     :spawn-server! (or (:spawn-server! opts) spawn-server!)
     :kill-pid-group! (or (:kill-pid-group! opts) default-kill-pid-group!)
     :pid-owns-sidecar? (or (:pid-owns-sidecar? opts) default-pid-owns-sidecar?)}))

(defn- log-stream!
  [^js stream log-fn label]
  (when stream
    (.on stream "data"
         (fn [data]
           (log-fn label (.toString data))))))

(defn- spawn-opts
  [cwd]
  ;; The lifecycle owner signals spawned processes, including their descendants.
  #js {:cwd cwd
       :stdio "pipe"
       :detached (not= "win32" (.-platform js/process))
       :windowsHide true})

(defn- run-command!
  [cmd args {:keys [cwd logger]}]
  (js/Promise.
   (fn [resolve reject]
     (let [proc (.spawn child-process cmd (clj->js args) (spawn-opts cwd))]
       (swap! *setup-processes conj proc)
       (log-stream! (.-stdout proc) (:debug logger) :embedding-server/setup)
       (log-stream! (.-stderr proc) (:warn logger) :embedding-server/setup)
       (.on proc "error" reject)
       (.on proc "close"
            (fn [code]
              (swap! *setup-processes disj proc)
              (if (zero? code)
                (resolve nil)
                (reject (js/Error. (str "Embedding server setup command failed: "
                                        cmd " " (pr-str args)
                                        " exited with " code))))))))))

(defn python-command-available!
  ([cmd] (python-command-available! cmd {}))
  ([cmd opts]
   (let [run-command-fn (or (:run-command! opts) run-command!)
         logger (or (:logger opts)
                    {:debug (fn [& _args])
                     :warn (fn [& _args])})]
     (-> (run-command-fn cmd ["--version"] {:logger logger})
         (p/then (fn [_] true))
         (p/catch (fn [_error] false))))))

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

(defn- <wait-ready!
  [endpoint-url]
  (let [deadline (+ (js/Date.now) ready-timeout-ms)
        signal (abort-signal)]
    (letfn [(poll! []
              (.throwIfAborted signal)
              (-> (js/fetch endpoint-url #js {:signal signal})
                  (p/then (fn [resp]
                            (.throwIfAborted signal)
                            (when-not (.-ok resp)
                              (throw (js/Error. (str "Embedding server health check failed: " (.-status resp)))))))
                  (p/catch (fn [error]
                             (.throwIfAborted signal)
                             (if (< (js/Date.now) deadline)
                               (p/let [_ (p/delay ready-poll-ms)]
                                 (poll!))
                               (throw error))))))]
      (poll!))))

(defn- <abort-when-stopped
  [promise]
  (js/Promise.
   (fn [resolve reject]
     (let [signal (abort-signal)
           abort! (fn [_] (reject (.-reason signal)))
           finish (fn [settle! value]
                    (.removeEventListener signal "abort" abort!)
                    (settle! value))]
       (if (.-aborted signal)
         (abort! nil)
         (.addEventListener signal "abort" abort! #js {:once true}))
       (-> promise
           (p/then #(finish resolve %))
           (p/catch #(finish reject %)))))))

(defn- attach-exit-handler!
  [^js proc {:keys [logger delete-env!] :as cfg}]
  (when (and proc (fn? (.-on proc)))
    (.on proc "exit"
         (fn [code signal]
           (when (identical? proc @*server-process)
             (reset! *server-process nil)
             (clear-endpoint! delete-env!)
             (delete-pid-file! cfg))
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
                               "--watch-parent"
                               "--log-file" log-file])
                     (spawn-opts sidecar-root))]
    (log-stream! (.-stdout proc) (:info logger) :embedding-server)
    (log-stream! (.-stderr proc) (:warn logger) :embedding-server)
    (.on proc "error"
         (fn [error]
           ((:error logger) :embedding-server/start-failed error)))
    proc))

(defn- existing-venv-python-candidates
  [{:keys [exists? venv-python-candidates]}]
  (filterv #(exists? %) venv-python-candidates))

(defn- validate-venv-python!
  [{:keys [runtime-dir logger] :as cfg} venv-python]
  (throw-if-stopped!)
  (-> ((:run-command! cfg) venv-python ["-c" "import sys"] {:cwd runtime-dir
                                                            :logger logger})
      (p/then (fn [_] venv-python))
      (p/catch (fn [error]
                 (if (aborted-error? error)
                   (p/rejected error)
                   nil)))))

(defn- usable-venv-python!
  [cfg]
  (letfn [(try-candidates! [candidates]
            (if-let [candidate (first candidates)]
              (p/let [usable-python (validate-venv-python! cfg candidate)]
                (if usable-python
                  usable-python
                  (try-candidates! (rest candidates))))
              (p/resolved nil)))]
    (try-candidates! (existing-venv-python-candidates cfg))))

(defn- install-runtime!
  [{:keys [runtime-dir venv-dir deps-stamp python-command
           ensure-dir! remove-dir! exists? write-file! logger] :as cfg}]
  (throw-if-stopped!)
  (ensure-dir! runtime-dir)
  (let [run-command-fn (:run-command! cfg)]
    (p/let [venv-python (usable-venv-python! cfg)
            _ (throw-if-stopped!)
            needs-venv? (nil? venv-python)
            needs-deps? (or needs-venv?
                            (not (exists? deps-stamp)))
            _ (when needs-venv?
                (throw-if-stopped!)
                (remove-dir! venv-dir)
                (run-command-fn python-command ["-m" "venv" venv-name] {:cwd runtime-dir
                                                                         :logger logger}))
            _ (throw-if-stopped!)
            venv-python (if needs-venv?
                          (usable-venv-python! cfg)
                          venv-python)
            venv-python (or venv-python
                            (throw (ex-info "Embedding server virtualenv Python is missing"
                                            {:venv-dir venv-dir
                                             :candidates (:venv-python-candidates cfg)})))
            _ (when needs-deps?
                (throw-if-stopped!)
                (run-command-fn venv-python (into ["-m" "pip" "install"] dependencies) {:cwd runtime-dir
                                                                                        :logger logger}))]
      (throw-if-stopped!)
      (when needs-deps?
        (write-file! deps-stamp (str (string/join "\n" dependencies) "\n")))
      (assoc cfg :venv-python venv-python))))

(defn- <begin-start!
  [cfg endpoint-promise]
  (reset! *stop-requested? false)
  (reset! *abort-controller (js/AbortController.))
  (let [cfg (assoc cfg :logger (or (:logger cfg) (default-logger)))
        _ (reset! *active-cfg cfg)
        _ (reset! *endpoint-promise endpoint-promise)
        startup (-> (p/let [cfg (allocate-port! cfg)
                            _ (do
                                (throw-if-stopped!)
                                (check-recorded-server! cfg)
                                (p/resolve! endpoint-promise (reserve-endpoint! cfg)))
                            cfg (install-runtime! cfg)
                            _ (do
                                (throw-if-stopped!)
                                (let [proc ((:spawn-server! cfg) cfg)]
                                  (reset! *server-process proc)
                                  (attach-exit-handler! proc cfg)
                                  (write-pid-file! cfg proc)))
                            _ (do
                                (throw-if-stopped!)
                                (<abort-when-stopped
                                 ((:wait-ready! cfg) (embedding-health-endpoint (:host cfg) (:port cfg)))))]
                      (throw-if-stopped!)
                      (publish-endpoint! cfg)
                      :started)
                    (p/catch (fn [error]
                               (p/resolve! endpoint-promise nil)
                               (if (or @*stop-requested? (aborted-error? error))
                                 :aborted
                                 (do
                                   (-> (stop!)
                                       (p/catch (fn [stop-error]
                                                  ((:error (:logger cfg)) :embedding-server/stop-failed stop-error))))
                                   ((:error (:logger cfg)) :embedding-server/setup-failed error)
                                   (throw error)))))
                    (p/finally (fn []
                                 (reset! *startup-promise nil))))]
    (reset! *startup-promise startup)
    startup))

(defn- already-started-result
  [cfg]
  (if-let [endpoint-url @*endpoint]
    (do
      ((:set-env! cfg) embedding-url-env endpoint-url)
      :already-started)
    (throw (js/Error. "Embedding server endpoint is missing"))))

(defn- <await-previous-lifecycle!
  []
  (let [stop-p @*stop-promise
        prev-start (when @*stop-requested? @*startup-promise)]
    (when (or stop-p prev-start)
      (p/let [_ (or stop-p nil)
              _ (when prev-start
                  (-> prev-start
                      (p/catch (fn [error]
                                 (when-not (or (aborted-error? error)
                                               @*stop-requested?)
                                   (throw error))
                                 :aborted))))]
        nil))))

(defn- <queue-start!
  [cfg previous]
  (let [endpoint (p/deferred)
        queued? #(identical? endpoint (:endpoint @*queued-start))
        startup (-> previous
                    (p/then (fn [_]
                              (if (queued?)
                                (do
                                  (reset! *queued-start nil)
                                  (<begin-start! cfg endpoint))
                                :aborted)))
                    (p/finally (fn []
                                 (when (queued?)
                                   (reset! *queued-start nil))
                                 (p/resolve! endpoint nil))))]
    (reset! *queued-start {:endpoint endpoint :startup startup})
    startup))

(defn start!
  ([app'] (start! app' {}))
  ([app' opts]
   (let [cfg (config app' opts)]
     (cond
       (not (macos? (:platform cfg)))
       (p/resolved :skipped)

       @*queued-start
       (:startup @*queued-start)

       (and @*stop-requested? (nil? @*stop-promise)
            (or @*server-process (seq @*setup-processes)))
       (p/rejected (ex-info "Previous embedding process has not stopped"
                            {:code :sidecar-still-running}))

       (and @*startup-promise (not @*stop-requested?))
       @*startup-promise

       (and @*server-process (not @*stop-requested?))
       (try
         (p/resolved (already-started-result cfg))
         (catch :default error
           (p/rejected error)))

       :else
       (if-let [wait (<await-previous-lifecycle!)]
         (<queue-start! cfg wait)
         (<begin-start! cfg (p/deferred)))))))

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

       @*queued-start
       (:endpoint @*queued-start)

       :else
       (let [startup (start! app' opts)]
         (if-let [endpoint (or (:endpoint @*queued-start) @*endpoint-promise)]
           (do (p/catch startup (fn [_error] nil)) endpoint)
           startup))))))

(defn- <stop-now!
  []
  (request-stop!)
  (let [cfg (or @*active-cfg {})
        proc @*server-process
        delete-env! (or (:delete-env! cfg)
                        #(js-delete js/process.env %))]
    (append-server-log! cfg "Embedding server shutdown requested")
    (when-let [logger (:logger cfg)]
      ((:info logger) :embedding-server/stop))
    (clear-endpoint! delete-env!)
    (-> (p/all (conj (mapv <stop-setup-process! @*setup-processes)
                    (<kill-and-wait! proc)))
        (p/then (fn []
                  (when (and proc (identical? proc @*server-process))
                    (reset! *server-process nil)
                    (delete-pid-file! cfg))
                  nil)))))

(defn stop!
  []
  (when-let [{:keys [endpoint]} @*queued-start]
    (reset! *queued-start nil)
    (p/resolve! endpoint nil))
  (if-let [in-flight @*stop-promise]
    in-flight
    (let [stop-p (-> (<stop-now!)
                     (p/finally (fn []
                                  (reset! *stop-promise nil))))]
      (reset! *stop-promise stop-p)
      stop-p)))

(defn setup!
  [app']
  (let [logger (default-logger)]
    (-> (start! app')
      (p/catch (fn [error]
                 ((:error logger) :embedding-server/setup-failed error)))))
  stop!)
