(ns electron.embedding-server-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [electron.embedding-server :as embedding-server]
            [promesa.core :as p]))

(defn- fake-app
  [user-data-dir packaged?]
  #js {:isPackaged packaged?
       :getPath (fn [path-name]
                  (case path-name
                    "userData" user-data-dir))})

(defn- fake-runtime
  [{:keys [existing-paths allocated-port run-command! wait-ready!]}]
  (let [existing-paths* (atom existing-paths)
        ensured-dirs (atom [])
        commands (atom [])
        writes (atom [])
        spawns (atom [])
        events (atom [])
        removed-dirs (atom [])
        env (atom {})
        killed? (atom false)
        proc #js {:kill (fn []
                          (reset! killed? true)
                          true)}]
    {:runtime {:platform "darwin"
               :arch "x64"
               :dirname "/repo/static"
               :resources-path "/app/Contents/Resources"
               :python-command "python3"
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
                               (or (when run-command!
                                     (run-command! cmd args opts))
                                   (do
                                     (when (= ["-m" "venv" ".venv"] args)
                                       (swap! existing-paths* conj
                                              (node-path/join (:cwd opts)
                                                              ".venv"
                                                              "bin"
                                                              "python")))
                                     (p/resolved nil))))
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
     :ensured-dirs ensured-dirs
     :commands commands
     :writes writes
     :spawns spawns
     :events events
     :removed-dirs removed-dirs
     :env env
     :killed? killed?}))

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

(deftest electron-builder-bundles-only-sidecar-python-file
  (let [repo-root (.cwd js/process)
        sidecar-dir (node-path/join repo-root "sidecar")
        builder-config (.toString (fs/readFileSync (node-path/join repo-root
                                                                  "resources"
                                                                  "electron-builder.yml"))
                                  "utf8")
        sidecar-files (when (fs/existsSync sidecar-dir)
                        (js->clj (fs/readdirSync sidecar-dir)))]
    (is (string/includes? builder-config "from: ../sidecar"))
    (is (string/includes? builder-config "to: sidecar"))
    (is (= ["embedding_server.py"] sidecar-files))))
