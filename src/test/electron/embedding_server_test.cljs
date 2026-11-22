(ns electron.embedding-server-test
  (:require ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [electron.embedding-server :as embedding-server]
            [electron.lifecycle :as lifecycle]
            [promesa.core :as p]))

(defn- fake-app
  [user-data-dir packaged?]
  #js {:isPackaged packaged?
       :getPath (fn [path-name]
                  (case path-name
                    "userData" user-data-dir))})

(defn- fake-child-process
  [{:keys [killed? killed-signals exit-delay-ms ignore-sigterm? pid]}]
  (let [killed? (or killed? (atom false))
        killed-signals (or killed-signals (atom []))
        exit-listeners (atom [])
        exited? (atom false)
        ^js proc (clj->js {:pid pid})
        emit-exit! (fn [code signal]
                     (when (compare-and-set! exited? false true)
                       (aset proc "exitCode" (if (nil? code) 0 code))
                       (aset proc "signalCode" signal)
                       (doseq [listener @exit-listeners]
                         (listener code signal))))
        kill! (fn [& args]
                (let [signal (or (first args) "SIGTERM")]
                  (reset! killed? true)
                  (swap! killed-signals conj signal)
                  (cond
                    (and ignore-sigterm? (= "SIGTERM" signal))
                    true
                    exit-delay-ms
                    (do (js/setTimeout #(emit-exit! nil signal) exit-delay-ms)
                        true)
                    :else
                    (do (emit-exit! nil signal)
                        true))))]
    (aset proc "kill" kill!)
    (aset proc "on" (fn [event handler]
                      (when (= "exit" event)
                        (swap! exit-listeners conj handler)
                        (when @exited?
                          (handler (.-exitCode proc) (.-signalCode proc))))
                      proc))
    (aset proc "once" (fn [event handler]
                        (.on proc event handler)
                        proc))
    {:proc proc
     :killed? killed?
     :killed-signals killed-signals
     :exited? exited?}))

(defn- fake-runtime
  [{:keys [existing-paths allocated-port run-command! wait-ready! proc
           killed? killed-signals exit-delay-ms ignore-sigterm? pid]
    :as opts}]
  (let [existing-paths* (atom existing-paths)
        ensured-dirs (atom [])
        commands (atom [])
        writes (atom [])
        spawns (atom [])
        events (atom [])
        removed-dirs (atom [])
        env (atom {})
        killed? (or killed? (atom false))
        killed-signals (or killed-signals (atom []))
        child (or (when proc
                    {:proc proc
                     :killed? killed?
                     :killed-signals killed-signals
                     :exited? (atom false)})
                  (fake-child-process {:killed? killed?
                                       :killed-signals killed-signals
                                       :exit-delay-ms exit-delay-ms
                                       :ignore-sigterm? ignore-sigterm?
                                       :pid pid}))
        proc (:proc child)
        extra (dissoc opts
                      :existing-paths :allocated-port :run-command! :wait-ready!
                      :proc :killed? :killed-signals :exit-delay-ms
                      :ignore-sigterm? :pid)]
    {:runtime (merge {:platform "darwin"
                      :arch "x64"
                      :dirname "/repo/static"
                      :resources-path "/app/Contents/Resources"
                      :python-command "python3"
                      :kill-pid-group! (fn [_pid _signal] true)
                      :exists? #(contains? @existing-paths* %)
                      :ensure-dir! #(swap! ensured-dirs conj %)
                      :find-port! (fn [_host]
                                    (p/resolved (or allocated-port 54321)))
                      :logger {:debug (fn [& _args])
                               :info (fn [& _args])
                               :warn (fn [& _args])
                               :error (fn [& _args])}
                      :remove-dir! (fn [dir]
                                     (swap! removed-dirs conj dir)
                                     (swap! existing-paths*
                                            (fn [paths]
                                              (set (remove #(string/starts-with? % dir) paths)))))
                      :set-env! (fn [k v]
                                  (swap! events conj [:set-env k v])
                                  (swap! env assoc k v))
                      :run-command! (fn [cmd args opts]
                                      (swap! commands conj {:cmd cmd
                                                            :args args
                                                            :cwd (:cwd opts)})
                                      (when (= ["-m" "venv" ".venv"] args)
                                        (swap! existing-paths* conj
                                               (node-path/join (:cwd opts)
                                                               ".venv"
                                                               "bin"
                                                               "python")))
                                      (or (when run-command!
                                            (run-command! cmd args opts))
                                          (p/resolved nil)))
                      :wait-ready! (or wait-ready!
                                       (fn [endpoint]
                                         (swap! events conj [:wait-ready endpoint])
                                         (p/resolved nil)))
                      :write-file! (fn [file content]
                                     (swap! writes conj {:file file
                                                         :content content}))
                      :spawn-server! (fn [cfg]
                                       (swap! events conj [:spawn-server (:port cfg)])
                                       (swap! spawns conj (select-keys cfg [:runtime-dir
                                                                            :venv-dir
                                                                            :venv-python
                                                                            :sidecar-dir
                                                                            :script-path
                                                                            :host
                                                                            :port
                                                                            :model-id]))
                                       proc)}
                     extra)
     :ensured-dirs ensured-dirs
     :commands commands
     :writes writes
     :spawns spawns
     :events events
     :removed-dirs removed-dirs
     :env env
     :killed? (:killed? child)
     :killed-signals (:killed-signals child)
     :exited? (:exited? child)
     :existing-paths* existing-paths*}))

(deftest start-skips-unsupported-platforms
  (async done
    (let [{:keys [runtime commands spawns]} (fake-runtime {:existing-paths #{}})
          app (fake-app "/users/me/logseq" false)]
      (-> (p/let [result (embedding-server/start! app (assoc runtime
                                                              :platform "linux"
                                                              :arch "x64"))]
            (is (= :skipped result))
            (is (empty? @commands))
            (is (empty? @spawns)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest python-command-available-detects-missing-python
  (async done
    (let [commands (atom [])
          run-command! (fn [cmd args _opts]
                         (swap! commands conj {:cmd cmd
                                               :args args})
                         (p/rejected (js/Error. "spawn python3 ENOENT")))]
      (-> (p/let [available? (embedding-server/python-command-available!
                              "python3"
                              {:run-command! run-command!})]
            (is (false? available?))
            (is (= [{:cmd "python3"
                     :args ["--version"]}]
                   @commands)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest start-allocates-port-creates-local-venv-installs-deps-and-spawns-server
  (async done
    (embedding-server/stop!)
    (let [{:keys [runtime ensured-dirs commands writes spawns env killed?]} (fake-runtime {:existing-paths #{}
                                                                                           :allocated-port 56789})
          app (fake-app "/users/me/logseq" false)
          runtime-dir "/users/me/logseq/embedding-server"
          venv-dir "/users/me/logseq/embedding-server/.venv"
          venv-python "/users/me/logseq/embedding-server/.venv/bin/python"
          deps-stamp "/users/me/logseq/embedding-server/deps-v2.ok"
          script "/repo/sidecar/embedding_server.py"]
      (-> (p/let [result (embedding-server/start! app runtime)]
            (is (= :started result))
            (is (= [runtime-dir] @ensured-dirs))
            (is (= [{:cmd "python3"
                     :args ["-m" "venv" ".venv"]
                     :cwd runtime-dir}
                    {:cmd venv-python
                     :args ["-c" "import sys"]
                     :cwd runtime-dir}
                    {:cmd venv-python
                     :args ["-m" "pip" "install" "sentence-transformers" "httpx[socks]"]
                     :cwd runtime-dir}]
                   @commands))
            (is (= [{:file deps-stamp
                     :content "sentence-transformers\nhttpx[socks]\n"}]
                   @writes))
            (is (= [{:runtime-dir runtime-dir
                     :venv-dir venv-dir
                     :venv-python venv-python
                     :sidecar-dir "/repo/sidecar"
                     :script-path script
                     :host "127.0.0.1"
                     :port 56789
                     :model-id "all-MiniLM-L6-v2"}]
                   @spawns))
            (is (= {"LOGSEQ_EMBEDDINGS_URL" "http://127.0.0.1:56789/v1/embeddings"}
                   @env))
            (embedding-server/stop!)
            (is @killed?))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest start-sets-embedding-env-after-server-is-ready
  (async done
    (embedding-server/stop!)
    (let [{:keys [runtime events env]} (fake-runtime {:existing-paths #{"/users/me/logseq/embedding-server/.venv/bin/python"
                                                                        "/users/me/logseq/embedding-server/deps-v2.ok"}
                                                       :allocated-port 56789})
          app (fake-app "/users/me/logseq" false)]
      (-> (p/let [result (embedding-server/start! app runtime)]
            (is (= :started result))
            (is (= [[:spawn-server 56789]
                    [:wait-ready "http://127.0.0.1:56789/healthz"]
                    [:set-env "LOGSEQ_EMBEDDINGS_URL" "http://127.0.0.1:56789/v1/embeddings"]]
                   @events))
            (is (= {"LOGSEQ_EMBEDDINGS_URL" "http://127.0.0.1:56789/v1/embeddings"}
                   @env))
            (embedding-server/stop!))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest start-does-not-publish-embedding-env-before-setup-completes
  (async done
    (embedding-server/stop!)
    (let [{:keys [runtime env spawns]} (fake-runtime {:existing-paths #{}
                                                      :allocated-port 56789
                                                      :run-command! (fn [_cmd _args _opts]
                                                                      (p/rejected (js/Error. "venv failed")))})
          app (fake-app "/users/me/logseq" false)]
      (-> (embedding-server/start! app runtime)
          (p/then (fn [_]
                    (is false "start should fail")))
          (p/catch (fn [_]
                     (is (= {} @env))
                     (is (empty? @spawns))))
          (p/finally done)))))

(deftest start-upgrades-existing-venv-when-dependency-stamp-is-stale
  (async done
    (embedding-server/stop!)
    (let [runtime-dir "/users/me/logseq/embedding-server"
          venv-python "/users/me/logseq/embedding-server/.venv/bin/python"
          old-deps-stamp "/users/me/logseq/embedding-server/deps-v1.ok"
          deps-stamp "/users/me/logseq/embedding-server/deps-v2.ok"
          {:keys [runtime commands writes]} (fake-runtime {:existing-paths #{venv-python old-deps-stamp}
                                                           :allocated-port 56789})
          app (fake-app "/users/me/logseq" false)]
      (-> (p/let [result (embedding-server/start! app runtime)]
            (is (= :started result))
            (is (= [{:cmd venv-python
                     :args ["-c" "import sys"]
                     :cwd runtime-dir}
                    {:cmd venv-python
                     :args ["-m" "pip" "install" "sentence-transformers" "httpx[socks]"]
                     :cwd runtime-dir}]
                   @commands))
            (is (= [{:file deps-stamp
                     :content "sentence-transformers\nhttpx[socks]\n"}]
                   @writes))
            (embedding-server/stop!))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest start-reuses-existing-venv-and-installed-deps-with-allocated-port
  (async done
    (embedding-server/stop!)
    (let [runtime-dir "/users/me/logseq/embedding-server"
          venv-python "/users/me/logseq/embedding-server/.venv/bin/python"
          deps-stamp "/users/me/logseq/embedding-server/deps-v2.ok"
          {:keys [runtime commands spawns env]} (fake-runtime {:existing-paths #{venv-python deps-stamp}
                                                               :allocated-port 45678})
          app (fake-app "/users/me/logseq" true)]
      (-> (p/let [result (embedding-server/start! app runtime)]
            (is (= :started result))
            (is (= [{:cmd venv-python
                     :args ["-c" "import sys"]
                     :cwd runtime-dir}]
                   @commands))
            (is (= [{:runtime-dir runtime-dir
                     :venv-dir "/users/me/logseq/embedding-server/.venv"
                     :venv-python venv-python
                     :sidecar-dir "/app/Contents/Resources/sidecar"
                     :script-path "/app/Contents/Resources/sidecar/embedding_server.py"
                     :host "127.0.0.1"
                     :port 45678
                     :model-id "all-MiniLM-L6-v2"}]
                   @spawns))
            (is (= {"LOGSEQ_EMBEDDINGS_URL" "http://127.0.0.1:45678/v1/embeddings"}
                   @env))
            (embedding-server/stop!))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest start-recreates-existing-venv-when-python-is-not-usable
  (async done
    (embedding-server/stop!)
    (let [runtime-dir "/users/me/logseq/embedding-server"
          venv-dir "/users/me/logseq/embedding-server/.venv"
          venv-python "/users/me/logseq/embedding-server/.venv/bin/python"
          deps-stamp "/users/me/logseq/embedding-server/deps-v2.ok"
          validation-attempts (atom 0)
          {:keys [runtime commands removed-dirs writes spawns]} (fake-runtime
                                                                 {:existing-paths #{venv-python deps-stamp}
                                                                  :allocated-port 45678
                                                                  :run-command! (fn [cmd args _opts]
                                                                                  (when (and (= cmd venv-python)
                                                                                             (= args ["-c" "import sys"])
                                                                                             (= 1 (swap! validation-attempts inc)))
                                                                                    (p/rejected (js/Error. "stale venv python"))))})
          app (fake-app "/users/me/logseq" true)]
      (-> (p/let [result (embedding-server/start! app runtime)]
            (is (= :started result))
            (is (= [venv-dir] @removed-dirs))
            (is (= [{:cmd venv-python
                     :args ["-c" "import sys"]
                     :cwd runtime-dir}
                    {:cmd "python3"
                     :args ["-m" "venv" ".venv"]
                     :cwd runtime-dir}
                    {:cmd venv-python
                     :args ["-c" "import sys"]
                     :cwd runtime-dir}
                    {:cmd venv-python
                     :args ["-m" "pip" "install" "sentence-transformers" "httpx[socks]"]
                     :cwd runtime-dir}]
                   @commands))
            (is (= [{:file deps-stamp
                     :content "sentence-transformers\nhttpx[socks]\n"}]
                   @writes))
            (is (= [{:runtime-dir runtime-dir
                     :venv-dir venv-dir
                     :venv-python venv-python
                     :sidecar-dir "/app/Contents/Resources/sidecar"
                     :script-path "/app/Contents/Resources/sidecar/embedding_server.py"
                     :host "127.0.0.1"
                     :port 45678
                     :model-id "all-MiniLM-L6-v2"}]
                   @spawns))
            (embedding-server/stop!))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest start-default-port-allocator-uses-node-net
  (async done
    (embedding-server/stop!)
    (let [_runtime-dir "/users/me/logseq/embedding-server"
          venv-python "/users/me/logseq/embedding-server/.venv/bin/python"
          deps-stamp "/users/me/logseq/embedding-server/deps-v2.ok"
          {:keys [runtime spawns env]} (fake-runtime {:existing-paths #{venv-python deps-stamp}})
          app (fake-app "/users/me/logseq" true)
          runtime (dissoc runtime :find-port!)]
      (-> (p/let [result (embedding-server/start! app runtime)
                  port (:port (first @spawns))]
            (is (= :started result))
            (is (integer? port))
            (is (<= 1 port 65535))
            (is (= {"LOGSEQ_EMBEDDINGS_URL" (str "http://127.0.0.1:" port "/v1/embeddings")}
                   @env))
            (embedding-server/stop!))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest stop-during-in-flight-start-does-not-spawn-server
  (async done
    (embedding-server/stop!)
    (let [install-gate (p/deferred)
          {:keys [runtime spawns]} (fake-runtime
                                    {:existing-paths #{}
                                     :allocated-port 56789
                                     :run-command! (fn [_cmd _args _opts]
                                                     install-gate)})
          app (fake-app "/users/me/logseq" false)
          start-p (embedding-server/start! app runtime)]
      (-> (p/let [_ (p/delay 10)
                  _ (embedding-server/stop!)
                  _ (p/resolve! install-gate nil)
                  _ (p/catch start-p (fn [_] nil))
                  _ (p/delay 10)]
            (is (empty? @spawns)
                "stop during runtime install must not leave a spawned sidecar"))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest stop-kills-running-server-and-waits-for-exit
  (async done
    (embedding-server/stop!)
    (let [{:keys [runtime killed? killed-signals exited?]}
          (fake-runtime {:existing-paths #{"/users/me/logseq/embedding-server/.venv/bin/python"
                                           "/users/me/logseq/embedding-server/deps-v2.ok"}
                         :allocated-port 56789
                         :exit-delay-ms 40})
          app (fake-app "/users/me/logseq" false)]
      (-> (p/let [result (embedding-server/start! app runtime)
                  _ (embedding-server/stop!)]
            (is (= :started result))
            (is @killed?)
            (is (some #{"SIGTERM"} @killed-signals))
            (is @exited? "stop! must wait until the sidecar process has exited"))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest start-after-stop-starts-a-new-server
  (async done
    (embedding-server/stop!)
    (let [{:keys [runtime spawns killed?]}
          (fake-runtime {:existing-paths #{"/users/me/logseq/embedding-server/.venv/bin/python"
                                           "/users/me/logseq/embedding-server/deps-v2.ok"}
                         :allocated-port 56789})
          app (fake-app "/users/me/logseq" false)]
      (-> (p/let [first-result (embedding-server/start! app runtime)
                  _ (embedding-server/stop!)
                  second-result (embedding-server/start! app runtime)]
            (is (= :started first-result))
            (is (= :started second-result))
            (is (= 2 (count @spawns)))
            (is @killed?)
            (embedding-server/stop!))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest start-after-aborted-start-spawns-once
  (async done
    (embedding-server/stop!)
    (let [install-gate (p/deferred)
          {:keys [runtime spawns]} (fake-runtime
                                    {:existing-paths #{}
                                     :allocated-port 56789
                                     :run-command! (fn [_cmd _args _opts]
                                                     install-gate)})
          app (fake-app "/users/me/logseq" false)
          start-p (embedding-server/start! app runtime)]
      (-> (p/let [_ (p/delay 10)
                  _ (embedding-server/stop!)
                  _ (p/resolve! install-gate nil)
                  _ (p/catch start-p (fn [_] nil))
                  _ (p/delay 10)
                  result (embedding-server/start! app runtime)]
            (is (= :started result))
            (is (= 1 (count @spawns))
                "aborted in-flight start must not spawn; only the later start should")
            (embedding-server/stop!))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest before-quit-waits-for-embedding-server-stop
  (async done
    (embedding-server/stop!)
    (let [events (atom [])
          already-started? (atom false)
          {:keys [runtime exited?]} (fake-runtime
                                     {:existing-paths #{"/users/me/logseq/embedding-server/.venv/bin/python"
                                                        "/users/me/logseq/embedding-server/deps-v2.ok"}
                                      :allocated-port 56789
                                      :exit-delay-ms 40})
          app (fake-app "/users/me/logseq" false)]
      (-> (p/let [_ (embedding-server/start! app runtime)
                  _ (lifecycle/handle-before-quit!
                     {:event #js {}
                      :already-started? already-started?
                      :prevent-default! (fn [_]
                                          (swap! events conj :prevent-default))
                      :teardown! (fn []
                                   (swap! events conj :teardown)
                                   (embedding-server/stop!))
                      :exit! (fn []
                               (swap! events conj :exit))})]
            (is (= [:prevent-default :teardown :exit] @events))
            (is @exited? "quit must wait until the embedding sidecar has exited"))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest stop-sends-sigkill-if-process-ignores-sigterm
  (async done
    (embedding-server/stop!)
    (let [{:keys [runtime killed-signals exited?]}
          (fake-runtime {:existing-paths #{"/users/me/logseq/embedding-server/.venv/bin/python"
                                           "/users/me/logseq/embedding-server/deps-v2.ok"}
                         :allocated-port 56789
                         :ignore-sigterm? true
                         :kill-timeout-ms 30})
          app (fake-app "/users/me/logseq" false)]
      (-> (p/let [result (embedding-server/start! app runtime)
                  _ (embedding-server/stop!)]
            (is (= :started result))
            (is (= ["SIGTERM" "SIGKILL"] @killed-signals))
            (is @exited?))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest start-reaps-owned-stale-pid-before-spawn
  (async done
    (embedding-server/stop!)
    (let [pid-file "/users/me/logseq/embedding-server/embedding-server.pid"
          venv-python "/users/me/logseq/embedding-server/.venv/bin/python"
          deps-stamp "/users/me/logseq/embedding-server/deps-v2.ok"
          reaped (atom [])
          {:keys [runtime spawns]}
          (fake-runtime {:existing-paths #{venv-python deps-stamp pid-file}
                         :allocated-port 56789
                         :read-file (fn [file]
                                      (when (= file pid-file)
                                        "9999\n"))
                         :pid-owns-sidecar? (fn [pid]
                                              (= 9999 pid))
                         :kill-pid-group! (fn [pid signal]
                                            (swap! reaped conj [pid signal])
                                            true)})
          app (fake-app "/users/me/logseq" false)]
      (-> (p/let [result (embedding-server/start! app runtime)]
            (is (= :started result))
            (is (= [[9999 "SIGTERM"] [9999 "SIGKILL"]] @reaped))
            (is (= 1 (count @spawns)))
            (embedding-server/stop!))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest ensure-endpoint-is-available-on-cold-start
  (async done
    (embedding-server/stop!)
    (let [ready-gate (p/deferred)
          {:keys [runtime]} (fake-runtime
                             {:existing-paths #{"/users/me/logseq/embedding-server/.venv/bin/python"
                                                "/users/me/logseq/embedding-server/deps-v2.ok"}
                              :allocated-port 56789
                              :wait-ready! (fn [_endpoint] ready-gate)})
          app (fake-app "/users/me/logseq" false)]
      (-> (p/let [url (embedding-server/ensure-endpoint! app runtime)]
            (is (= "http://127.0.0.1:56789/v1/embeddings" url))
            (embedding-server/stop!)
            (p/resolve! ready-gate nil))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (p/resolve! ready-gate nil)
                       (done)))))))

(deftest stop-during-wait-ready-allows-restart
  (async done
    (embedding-server/stop!)
    (let [ready-calls (atom 0)
          ready-gate (p/deferred)
          {:keys [runtime spawns]}
          (fake-runtime {:existing-paths #{"/users/me/logseq/embedding-server/.venv/bin/python"
                                           "/users/me/logseq/embedding-server/deps-v2.ok"}
                         :allocated-port 56789
                         :wait-ready! (fn [_endpoint]
                                        (if (= 1 (swap! ready-calls inc))
                                          ready-gate
                                          (p/resolved nil)))})
          app (fake-app "/users/me/logseq" false)
          start-p (embedding-server/start! app runtime)]
      (-> (p/let [_ (p/delay 10)
                  _ (is (= 1 (count @spawns)))
                  _ (embedding-server/stop!)
                  result (embedding-server/start! app runtime)]
            (is (= :started result))
            (is (= 2 (count @spawns)))
            (p/resolve! ready-gate nil)
            (p/catch start-p (fn [_] nil))
            (embedding-server/stop!))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (p/resolve! ready-gate nil)
                       (done)))))))

(deftest stop-during-python-validation-does-not-delete-venv
  (async done
    (embedding-server/stop!)
    (let [gate (p/deferred)
          aborted? (atom false)
          venv-dir "/users/me/logseq/embedding-server/.venv"
          venv-python "/users/me/logseq/embedding-server/.venv/bin/python"
          deps-stamp "/users/me/logseq/embedding-server/deps-v2.ok"
          {:keys [runtime removed-dirs]}
          (fake-runtime {:existing-paths #{venv-python deps-stamp}
                         :allocated-port 56789
                         :run-command! (fn [_cmd args _opts]
                                         (if (= args ["-c" "import sys"])
                                           (p/then gate
                                                   (fn [_]
                                                     (when @aborted?
                                                       (let [error (js/Error. "aborted")]
                                                         (set! (.-name error) "AbortError")
                                                         (throw error)))))
                                           (p/resolved nil)))})
          app (fake-app "/users/me/logseq" false)
          start-p (embedding-server/start! app runtime)]
      (-> (p/let [_ (p/delay 10)
                  _ (reset! aborted? true)
                  _ (embedding-server/stop!)
                  _ (p/resolve! gate nil)
                  _ (p/catch start-p (fn [_] nil))]
            (is (not (some #{venv-dir} @removed-dirs))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))
