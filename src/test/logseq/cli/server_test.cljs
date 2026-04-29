(ns logseq.cli.server-test
  {:clj-kondo/config '{:linters {:private-var-access {:level :off}}}}
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["http" :as http]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.config :as cli-config]
            [logseq.cli.profile :as profile]
            [logseq.cli.server :as cli-server]
            [logseq.cli.test-helper :as test-helper]
            [logseq.db-worker.daemon :as daemon]
            [promesa.core :as p]))

(deftest spawn-server-omits-host-and-port-flags
  (let [spawn-server! #'cli-server/spawn-server!
        captured (atom nil)
        original-cwd (.cwd js/process)]
    (try
      (.chdir js/process "/")
      (-> (test-helper/with-js-property-override
            child-process
            "spawn"
            (fn [cmd args opts]
              (reset! captured {:cmd cmd
                                :args (vec (js->clj args))
                                :opts (js->clj opts :keywordize-keys true)})
              (js-obj "unref" (fn [] nil)))
            (fn []
              (spawn-server! {:repo "logseq_db_spawn_test"
                              :root-dir "/tmp/logseq-root"})
              (p/resolved true)))
          (p/then (fn [_]
                    (is (= (.-execPath js/process)
                           (:cmd @captured)))
                    (is (= (cli-server/db-worker-script-path)
                           (first (:args @captured))))
                    (is (some #{"--repo"} (:args @captured)))
                    (is (some #{"--root-dir"} (:args @captured)))
                    (is (not-any? #{"--host" "--port"} (:args @captured)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e)))))
      (finally
        (.chdir js/process original-cwd)))))

(deftest lock-path-uses-canonical-graph-dir
  (let [root-dir "/tmp/logseq-root"
        repo "logseq_db_demo"
        expected (node-path/join root-dir "graphs" "demo" "db-worker.lock")]
    (is (= expected (cli-server/lock-path root-dir repo)))))

(deftest lock-path-encodes-special-characters-in-graph-dir
  (let [root-dir "/tmp/logseq-root"
        repo "logseq_db_foo/bar"
        expected (node-path/join root-dir "graphs" "foo~2Fbar" "db-worker.lock")]
    (is (= expected (cli-server/lock-path root-dir repo)))))

(deftest db-worker-runtime-script-path-matches-runtime-selection
  (is (= (cli-server/db-worker-script-path)
         (cli-server/db-worker-runtime-script-path))))

(deftest cli-server-spawn-server-does-not-forward-server-list-file
  (async done
         (let [spawn-server! #'cli-server/spawn-server!
               captured (atom nil)]
           (-> (p/with-redefs [daemon/spawn-server! (fn [opts]
                                                      (reset! captured opts)
                                                      nil)]
                 (p/resolved
                  (spawn-server! {:repo "logseq_db_spawn_test"
                                  :root-dir "/tmp/logseq-root"
                                  :owner-source :cli
                                  :server-list-file "/tmp/server-list"
                                  :create-empty-db? true})))
               (p/then (fn [_]
                         (is (= "logseq_db_spawn_test" (:repo @captured)))
                         (is (= "/tmp/logseq-root" (:root-dir @captured)))
                         (is (= true (:create-empty-db? @captured)))
                         (is (nil? (:server-list-file @captured)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest ensure-server-repairs-stale-lock
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server")
               repo (str "logseq_db_stale_" (subs (str (random-uuid)) 0 8))
               path (cli-server/lock-path root-dir repo)
               cleanup-stale-lock! #'cli-server/cleanup-stale-lock!
               lock {:repo repo
                     :pid (.-pid js/process)
                     :host "127.0.0.1"
                     :port 0
                     :startedAt (.toISOString (js/Date.))}]
           (fs/mkdirSync (node-path/dirname path) #js {:recursive true})
           (fs/writeFileSync path (js/JSON.stringify (clj->js lock)))
           (-> (p/let [_ (cleanup-stale-lock! path lock)]
                 (is (not (fs/existsSync path)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ensure-server-reuses-existing-running-daemon-lock
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-reuse")
               repo (str "logseq_db_reuse_" (subs (str (random-uuid)) 0 8))
               lock-file (cli-server/lock-path root-dir repo)
               config-path (node-path/join root-dir "cli.edn")
               server-list-file (cli-config/server-list-path root-dir)
               host "127.0.0.1"
               port* (atom nil)
               spawn-calls (atom 0)
               server (http/createServer
                       (fn [^js req ^js res]
                         (case (.-url req)
                           "/healthz" (do (.writeHead res 200 #js {"Content-Type" "application/json"})
                                          (.end res (js/JSON.stringify #js {:repo repo
                                                                            :status "ready"
                                                                            :host host
                                                                            :port @port*
                                                                            :pid (.-pid js/process)
                                                                            :owner-source "cli"
                                                                            :revision "server-revision"})))
                           (do (.writeHead res 404 #js {"Content-Type" "text/plain"})
                               (.end res "not-found")))))]
           (.listen server 0 host
                    (fn []
                      (let [address (.address server)
                            port (if (number? address) address (.-port address))
                            _ (reset! port* port)
                            lock {:repo repo
                                  :pid (.-pid js/process)
                                  :lock-id "reuse-lock"
                                  :owner-source :cli}]
                        (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
                        (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
                        (fs/writeFileSync server-list-file (str (.-pid js/process) " " port "\n"))
                        (-> (p/with-redefs [daemon/spawn-server! (fn [_opts]
                                                                   (swap! spawn-calls inc)
                                                                   (throw (ex-info "should not spawn when server-list entry is ready" {})))]
                              (cli-server/ensure-server! {:root-dir root-dir
                                                          :config-path config-path}
                                                         repo))
                            (p/then (fn [config]
                                      (is (= (str "http://" host ":" port) (:base-url config)))
                                      (is (= 0 @spawn-calls))))
                            (p/catch (fn [e]
                                       (is false (str "unexpected error: " e))))
                            (p/finally (fn []
                                         (.close server (fn [] (done))))))))))))

(deftest start-server-reports-repo-locked-error-stably
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-repo-locked")
               repo (str "logseq_db_locked_" (subs (str (random-uuid)) 0 8))
               lock-file (cli-server/lock-path root-dir repo)
               lock {:repo repo
                     :pid 999999
                     :host "127.0.0.1"
                     :port 55555}]
           (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
           (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
           (-> (p/with-redefs [daemon/cleanup-stale-lock! (fn [_path _lock] (p/resolved nil))
                               cli-server/discover-servers (fn [_] (p/resolved [{:repo repo
                                                                                  :host "127.0.0.1"
                                                                                  :port 55555
                                                                                  :pid 999999
                                                                                  :owner-source :cli
                                                                                  :revision nil
                                                                                  :status :starting}]))
                               daemon/wait-for-ready (fn [_lock]
                                                       (p/rejected (ex-info "graph already locked"
                                                                            {:code :repo-locked
                                                                             :lock lock})))]
                 (cli-server/start-server! {:root-dir root-dir} repo))
               (p/then (fn [result]
                         (is (= false (:ok? result)))
                         (is (= :repo-locked (get-in result [:error :code])))
                         (is (= lock (get-in result [:error :lock])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest stop-server-denies-owner-mismatch
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-owner-stop")
               repo (str "logseq_db_owner_stop_" (subs (str (random-uuid)) 0 8))
               lock-file (cli-server/lock-path root-dir repo)
               lock {:repo repo
                     :pid (.-pid js/process)
                     :host "127.0.0.1"
                     :port 9101
                     :owner-source :electron}]
           (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
           (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
           (-> (p/with-redefs [daemon/http-request (fn [_] (p/resolved {:status 200 :body ""}))
                               daemon/wait-for (fn [_ _] (p/resolved true))]
                 (cli-server/stop-server! {:root-dir root-dir
                                           :owner-source :cli}
                                          repo))
               (p/then (fn [result]
                         (is (= false (:ok? result)))
                         (is (= :server-owned-by-other (get-in result [:error :code])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest restart-server-does-not-sigterm-external-owner-daemon
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-owner-restart")
               repo (str "logseq_db_owner_restart_" (subs (str (random-uuid)) 0 8))
               lock-file (cli-server/lock-path root-dir repo)
               lock {:repo repo
                     :pid 424242
                     :host "127.0.0.1"
                     :port 9102
                     :owner-source :electron}
               start-calls (atom 0)
               kill-calls (atom [])]
           (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
           (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
           (-> (test-helper/with-js-property-override
                 js/process
                 "kill"
                 (fn [pid signal]
                   (swap! kill-calls conj [pid signal])
                   true)
                 (fn []
                   (p/with-redefs [daemon/http-request (fn [_] (p/resolved {:status 200 :body ""}))
                                   daemon/wait-for (fn [_ _] (p/rejected (ex-info "timeout" {:code :timeout})))
                                   daemon/pid-status (fn [_] :alive)
                                   cli-server/start-server! (fn [_ _]
                                                              (swap! start-calls inc)
                                                              (p/resolved {:ok? true
                                                                           :data {:repo repo}}))]
                     (cli-server/restart-server! {:root-dir root-dir
                                                  :owner-source :cli}
                                                 repo))))
               (p/then (fn [result]
                         (is (= false (:ok? result)))
                         (is (= :server-owned-by-other (get-in result [:error :code])))
                         (is (zero? @start-calls))
                         (is (empty? @kill-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest start-server-returns-timeout-orphan-error-with-pids
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-orphan-timeout")
               repo (str "logseq_db_orphan_timeout_" (subs (str (random-uuid)) 0 8))
               spawn-calls (atom 0)]
           (-> (p/with-redefs [daemon/cleanup-stale-lock! (fn [_ _] (p/resolved nil))
                               daemon/spawn-server! (fn [_]
                                                      (swap! spawn-calls inc)
                                                      nil)
                               daemon/wait-for-lock (fn [_]
                                                      (p/rejected (ex-info "timeout"
                                                                           {:code :timeout})))]
                 (cli-server/start-server! {:root-dir root-dir
                                            :owner-source :cli}
                                           repo))
               (p/then (fn [result]
                         (is (= false (:ok? result)))
                         (is (= :server-start-timeout-orphan (get-in result [:error :code])))
                         (is (= 1 @spawn-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest ensure-server-forwards-create-empty-db-flag-when-spawning-daemon
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-create-empty")
               config-path (node-path/join root-dir "custom" "cli.edn")
               repo (str "logseq_db_create_empty_" (subs (str (random-uuid)) 0 8))
               captured (atom nil)
               lock {:repo repo
                     :pid (.-pid js/process)
                     :host "127.0.0.1"
                     :port 9301
                     :owner-source :cli}
               read-lock-calls (atom 0)
               discover-calls (atom 0)]
           (-> (p/with-redefs [daemon/read-lock (fn [_]
                                                  (if (= 1 (swap! read-lock-calls inc))
                                                    nil
                                                    lock))
                               daemon/cleanup-stale-lock! (fn [_ _] (p/resolved nil))
                               daemon/spawn-server! (fn [opts]
                                                      (reset! captured opts)
                                                      nil)
                               daemon/wait-for-lock (fn [_] (p/resolved true))
                               cli-server/discover-servers (fn [_]
                                                            (p/resolved (if (= 1 (swap! discover-calls inc))
                                                                          []
                                                                          [{:repo repo
                                                                            :host "127.0.0.1"
                                                                            :port 9301
                                                                            :pid (.-pid js/process)
                                                                            :owner-source :cli
                                                                            :revision nil
                                                                            :status :ready}])))
                               daemon/wait-for-ready (fn [_] (p/resolved true))]
                 (cli-server/ensure-server! {:root-dir root-dir
                                             :config-path config-path
                                             :create-empty-db? true}
                                            repo))
               (p/then (fn [_]
                         (is (= repo (:repo @captured)))
                         (is (= (cli-server/resolve-root-dir {:root-dir root-dir})
                                (:root-dir @captured)))
                         (is (= true (:create-empty-db? @captured)))
                         (is (nil? (:server-list-file @captured)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest ensure-server-records-profile-stages-on-spawn-path
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-profile")
               repo (str "logseq_db_profile_" (subs (str (random-uuid)) 0 8))
               session (profile/create-session true)
               read-lock-calls (atom 0)
               discover-calls (atom 0)
               lock {:repo repo
                     :pid (.-pid js/process)
                     :host "127.0.0.1"
                     :port 9310
                     :owner-source :cli}]
           (-> (p/with-redefs [daemon/read-lock (fn [_]
                                                  (if (= 1 (swap! read-lock-calls inc))
                                                    nil
                                                    lock))
                               daemon/cleanup-stale-lock! (fn [_ _] (p/resolved nil))
                               daemon/spawn-server! (fn [_] nil)
                               daemon/wait-for-lock (fn [_] (p/resolved true))
                               cli-server/discover-servers (fn [_]
                                                            (p/resolved (if (= 1 (swap! discover-calls inc))
                                                                          []
                                                                          [{:repo repo
                                                                            :host "127.0.0.1"
                                                                            :port 9310
                                                                            :pid (.-pid js/process)
                                                                            :owner-source :cli
                                                                            :revision nil
                                                                            :status :ready}])))
                               daemon/wait-for-ready (fn [_] (p/resolved true))]
                 (cli-server/ensure-server! {:root-dir root-dir
                                             :profile-session session}
                                            repo))
               (p/then (fn [_]
                         (let [report (profile/report session {:command "server-start"
                                                               :status :ok})
                               by-stage (into {} (map (juxt :stage identity) (:stages report)))]
                           (is (= 1 (get-in by-stage ["server.ensure-started" :count])))
                           (is (= 1 (get-in by-stage ["server.spawn-daemon" :count])))
                           (is (= 1 (get-in by-stage ["server.wait-lock" :count])))
                           (is (= 1 (get-in by-stage ["server.wait-ready" :count]))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest ensure-server-waits-for-server-list-publication-after-lock
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-wait-publish")
               repo (str "logseq_db_wait_publish_" (subs (str (random-uuid)) 0 8))
               read-lock-calls (atom 0)
               discover-calls (atom 0)
               lock {:repo repo
                     :pid (.-pid js/process)
                     :lock-id "wait-publish-lock"
                     :owner-source :cli}
               server {:repo repo
                       :host "127.0.0.1"
                       :port 9311
                       :pid (.-pid js/process)
                       :owner-source :cli
                       :revision nil
                       :status :ready}]
           (-> (p/with-redefs [daemon/read-lock (fn [_]
                                                  (if (= 1 (swap! read-lock-calls inc))
                                                    nil
                                                    lock))
                               daemon/cleanup-stale-lock! (fn [_ _] (p/resolved nil))
                               daemon/spawn-server! (fn [_] nil)
                               daemon/wait-for-lock (fn [_] (p/resolved true))
                               cli-server/discover-servers (fn [_]
                                                            (let [call (swap! discover-calls inc)]
                                                              (p/resolved (if (< call 3)
                                                                            []
                                                                            [server]))))
                               daemon/wait-for-ready (fn [_] (p/resolved true))]
                 (cli-server/ensure-server! {:root-dir root-dir} repo))
               (p/then (fn [config]
                         (is (= "http://127.0.0.1:9311" (:base-url config)))
                         (is (true? (:owned? config)))
                         (is (<= 3 @discover-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest ensure-server-preserves-live-server-list-entry-after-transient-healthz-failure
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-transient-healthz")
               config-path (node-path/join root-dir "cli.edn")
               server-list-file (cli-config/server-list-path root-dir)
               repo (str "logseq_db_transient_healthz_" (subs (str (random-uuid)) 0 8))
               pid 424242
               port 9312
               read-lock-calls (atom 0)
               healthz-calls (atom 0)
               lock {:repo repo
                     :pid pid
                     :lock-id "transient-healthz-lock"
                     :owner-source :cli}]
           (-> (p/with-redefs [daemon/read-lock (fn [_]
                                                  (if (= 1 (swap! read-lock-calls inc))
                                                    nil
                                                    lock))
                               daemon/cleanup-stale-lock! (fn [_ _] (p/resolved nil))
                               daemon/spawn-server! (fn [_]
                                                      (fs/writeFileSync server-list-file
                                                                        (str pid " " port "\n"))
                                                      nil)
                               daemon/wait-for-lock (fn [_] (p/resolved true))
                               daemon/pid-status (fn [_] :alive)
                               daemon/http-request (fn [{:keys [path]}]
                                                     (if (= "/healthz" path)
                                                       (let [call (swap! healthz-calls inc)]
                                                         (if (= 1 call)
                                                           (p/rejected (ex-info "connection refused" {:code :econnrefused}))
                                                           (p/resolved {:status 200
                                                                        :body (js/JSON.stringify
                                                                               (clj->js {:repo repo
                                                                                         :status "ready"
                                                                                         :host "127.0.0.1"
                                                                                         :port port
                                                                                         :pid pid
                                                                                         :owner-source "cli"
                                                                                         :root-dir root-dir
                                                                                         :revision "server-revision"}))})))
                                                       (p/resolved {:status 200 :body ""})))
                               daemon/wait-for-ready (fn [_] (p/resolved true))]
                 (cli-server/ensure-server! {:root-dir root-dir
                                             :config-path config-path}
                                            repo))
               (p/then (fn [config]
                         (is (= "http://127.0.0.1:9312" (:base-url config)))
                         (is (true? (:owned? config)))
                         (is (>= @healthz-calls 2))
                         (is (= (str pid " " port "\n")
                                (.toString (fs/readFileSync server-list-file) "utf8")))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest ensure-server-ignores-discovered-server-from-other-root-dir
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-other-root-dir")
               root-dir-a (node-path/join root-dir "graphs-a")
               root-dir-b (node-path/join root-dir "graphs-b")
               config-path (node-path/join root-dir "cli.edn")
               repo (str "logseq_db_shared_repo_" (subs (str (random-uuid)) 0 8))
               spawned? (atom false)
               captured (atom nil)
               lock {:repo repo
                     :pid (.-pid js/process)
                     :lock-id "local-lock"
                     :owner-source :cli}
               remote-server {:repo repo
                              :host "127.0.0.1"
                              :port 9320
                              :pid 1001
                              :owner-source :cli
                              :revision nil
                              :status :ready
                              :root-dir root-dir-a}
               local-server {:repo repo
                             :host "127.0.0.1"
                             :port 9321
                             :pid (.-pid js/process)
                             :owner-source :cli
                             :revision nil
                             :status :ready
                             :root-dir root-dir-b}]
           (-> (p/with-redefs [daemon/read-lock (fn [_]
                                                  (when @spawned?
                                                    lock))
                               daemon/cleanup-stale-lock! (fn [_ _] (p/resolved nil))
                               daemon/spawn-server! (fn [opts]
                                                      (reset! captured opts)
                                                      (reset! spawned? true)
                                                      nil)
                               daemon/wait-for-lock (fn [_] (p/resolved true))
                               cli-server/discover-servers (fn [_]
                                                            (p/resolved (if @spawned?
                                                                          [remote-server local-server]
                                                                          [remote-server])))
                               daemon/wait-for-ready (fn [_] (p/resolved true))]
                 (cli-server/ensure-server! {:root-dir root-dir-b
                                             :config-path config-path}
                                            repo))
               (p/then (fn [config]
                         (is (= root-dir-b (:root-dir @captured)))
                         (is (= "http://127.0.0.1:9321" (:base-url config)))
                         (is (true? (:owned? config)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest ensure-server-reuses-discovered-server-across-symlinked-root-dir-spellings
  (async done
         (let [repo (str "logseq_db_symlink_dir_" (subs (str (random-uuid)) 0 8))
               lock {:repo repo
                     :pid (.-pid js/process)
                     :lock-id "symlink-lock"
                     :owner-source :cli}
               spawned? (atom false)]
           (-> (test-helper/with-js-property-override
                 fs
                 "realpathSync"
                 (fn [path]
                   (case path
                     "/var/tmp/shared-graphs" "/private/var/tmp/shared-graphs"
                     "/private/var/tmp/shared-graphs" "/private/var/tmp/shared-graphs"
                     path))
                 (fn []
                   (p/with-redefs [daemon/read-lock (fn [_] lock)
                                   daemon/cleanup-stale-lock! (fn [_ _] (p/resolved nil))
                                   daemon/spawn-server! (fn [_]
                                                          (reset! spawned? true)
                                                          nil)
                                   cli-server/discover-servers (fn [_]
                                                                (p/resolved [{:repo repo
                                                                              :host "127.0.0.1"
                                                                              :port 9322
                                                                              :pid (.-pid js/process)
                                                                              :owner-source :cli
                                                                              :revision nil
                                                                              :status :ready
                                                                              :root-dir "/var/tmp/shared-graphs"}]))
                                   daemon/wait-for-ready (fn [_] (p/resolved true))]
                     (cli-server/ensure-server! {:root-dir "/private/var/tmp/shared-graphs"}
                                                repo))))
               (p/then (fn [config]
                         (is (false? @spawned?))
                         (is (= "http://127.0.0.1:9322" (:base-url config)))
                         (is (true? (:owned? config)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest stop-server-targets-discovered-server-for-current-root-dir
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-stop-target")
               root-dir-a (node-path/join root-dir "graphs-a")
               root-dir-b (node-path/join root-dir "graphs-b")
               config-path (node-path/join root-dir "cli.edn")
               repo (str "logseq_db_stop_target_" (subs (str (random-uuid)) 0 8))
               lock-file (cli-server/lock-path root-dir-b repo)
               request* (atom nil)
               lock {:repo repo
                     :pid (.-pid js/process)
                     :lock-id "stop-lock"
                     :owner-source :cli}]
           (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
           (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
           (-> (p/with-redefs [cli-server/discover-servers (fn [_]
                                                            (p/resolved [{:repo repo
                                                                          :host "127.0.0.1"
                                                                          :port 9401
                                                                          :pid 4001
                                                                          :owner-source :cli
                                                                          :revision nil
                                                                          :status :ready
                                                                          :root-dir root-dir-a}
                                                                         {:repo repo
                                                                          :host "127.0.0.1"
                                                                          :port 9402
                                                                          :pid 4002
                                                                          :owner-source :cli
                                                                          :revision nil
                                                                          :status :ready
                                                                          :root-dir root-dir-b}]))
                               daemon/http-request (fn [opts]
                                                     (reset! request* opts)
                                                     (p/resolved {:status 200 :body ""}))
                               daemon/wait-for (fn [_ _] (p/resolved true))]
                 (cli-server/stop-server! {:root-dir root-dir-b
                                           :config-path config-path
                                           :owner-source :cli}
                                          repo))
               (p/then (fn [result]
                         (is (= true (:ok? result)))
                         (is (= 9402 (:port @request*)))
                         (is (= "127.0.0.1" (:host @request*)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest list-servers-reads-server-list-and-healthz-details
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-list-revision")
               config-path (node-path/join root-dir "cli.edn")
               server-list-file (cli-config/server-list-path root-dir)
               repo (str "logseq_db_list_revision_" (subs (str (random-uuid)) 0 8))
               host "127.0.0.1"
               port* (atom nil)
               server (http/createServer
                       (fn [^js req ^js res]
                         (case (.-url req)
                           "/healthz" (do (.writeHead res 200 #js {"Content-Type" "application/json"})
                                          (.end res (js/JSON.stringify #js {:repo repo
                                                                            :status "ready"
                                                                            :host host
                                                                            :port @port*
                                                                            :pid (.-pid js/process)
                                                                            :owner-source "cli"
                                                                            :root-dir root-dir
                                                                            :revision "server-revision"})))
                           (do (.writeHead res 404 #js {"Content-Type" "text/plain"})
                               (.end res "not-found")))))]
           (.listen server 0 host
                    (fn []
                      (let [address (.address server)
                            port (if (number? address) address (.-port address))
                            _ (reset! port* port)]
                        (fs/writeFileSync server-list-file (str (.-pid js/process) " " port "\n"))
                        (-> (cli-server/list-servers {:root-dir root-dir
                                                      :config-path config-path})
                            (p/then (fn [servers]
                                      (is (= 1 (count servers)))
                                      (is (= repo (:repo (first servers))))
                                      (is (= :ready (:status (first servers))))
                                      (is (= root-dir (:root-dir (first servers))))
                                      (is (= "server-revision" (:revision (first servers))))))
                            (p/catch (fn [e]
                                       (is false (str "unexpected error: " e))))
                            (p/finally (fn []
                                         (.close server (fn [] (done))))))))))))

(deftest list-servers-lazily-cleans-stale-server-list-entries
  (async done
         (let [root-dir (node-helper/create-tmp-dir "cli-server-list-cleanup")
               config-path (node-path/join root-dir "cli.edn")
               server-list-file (cli-config/server-list-path root-dir)]
           (fs/writeFileSync server-list-file "999999 65535\n")
           (-> (cli-server/list-servers {:root-dir root-dir
                                         :config-path config-path})
               (p/then (fn [servers]
                         (is (empty? servers))
                         (let [contents (when (fs/existsSync server-list-file)
                                          (.toString (fs/readFileSync server-list-file) "utf8"))]
                           (is (or (nil? contents)
                                   (= "" contents))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest cleanup-revision-mismatched-servers-kills-only-cli-owned-targets
  (async done
         (let [stop-calls (atom [])]
           (-> (p/with-redefs [cli-server/list-servers (fn [_]
                                                         (p/resolved [{:repo "logseq_db_a"
                                                                       :pid 11
                                                                       :owner-source :cli
                                                                       :revision "worker-rev-a"}
                                                                      {:repo "logseq_db_b"
                                                                       :pid 22
                                                                       :owner-source :electron
                                                                       :revision "worker-rev-b"}
                                                                      {:repo "logseq_db_c"
                                                                       :pid 33
                                                                       :owner-source :cli
                                                                       :revision "cli-rev"}
                                                                      {:repo "logseq_db_nil"
                                                                       :pid 44
                                                                       :owner-source :cli
                                                                       :revision nil}]))
                               cli-server/stop-server! (fn [config repo]
                                                         (swap! stop-calls conj {:config config
                                                                                 :repo repo})
                                                         (p/resolved {:ok? true
                                                                      :data {:repo repo}}))]
                 (cli-server/cleanup-revision-mismatched-servers! {:root-dir "/tmp/graphs"} "cli-rev"))
               (p/then (fn [result]
                         (is (= true (:ok? result)))
                         (is (= 4 (get-in result [:data :checked])))
                         (is (= 3 (get-in result [:data :mismatched])))
                         (is (= 2 (get-in result [:data :eligible])))
                         (is (= 1 (get-in result [:data :skipped-owner])))
                         (is (= ["logseq_db_a" "logseq_db_nil"]
                                (mapv :repo (get-in result [:data :killed]))))
                         (is (empty? (get-in result [:data :failed])))
                         (is (= #{"logseq_db_a" "logseq_db_nil"}
                                (set (map :repo @stop-calls))))
                         (is (every? #(= :cli (get-in % [:config :owner-source]))
                                     @stop-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest cleanup-revision-mismatched-servers-reports-failures
  (async done
         (-> (p/with-redefs [cli-server/list-servers (fn [_]
                                                       (p/resolved [{:repo "logseq_db_a"
                                                                     :pid 11
                                                                     :owner-source :cli
                                                                     :revision "worker-rev-a"}
                                                                    {:repo "logseq_db_b"
                                                                     :pid 22
                                                                     :owner-source :cli
                                                                     :revision "worker-rev-b"}]))
                             cli-server/stop-server! (fn [_ repo]
                                                       (p/resolved (if (= "logseq_db_a" repo)
                                                                     {:ok? true
                                                                      :data {:repo repo}}
                                                                     {:ok? false
                                                                      :error {:code :server-stop-timeout
                                                                              :message "timed out stopping server"}})))]
               (cli-server/cleanup-revision-mismatched-servers! {:root-dir "/tmp/graphs"} "cli-rev"))
             (p/then (fn [result]
                       (is (= true (:ok? result)))
                       (is (= ["logseq_db_a"]
                              (mapv :repo (get-in result [:data :killed]))))
                       (is (= ["logseq_db_b"]
                              (mapv :repo (get-in result [:data :failed]))))
                       (is (= :server-stop-timeout
                              (get-in result [:data :failed 0 :error :code])))))
             (p/catch (fn [e]
                        (is false (str "unexpected error: " e))))
             (p/finally done))))

(deftest list-graph-items-ignores-non-graph-directories
  (let [root-dir (node-helper/create-tmp-dir "cli-list-graphs-ignore")
        graphs-dir (node-path/join root-dir "graphs")
        _ (doseq [dir ["alpha"
                       "backup"
                       "foo~2G"
                       "Unlinked graphs"
                       "logseq_local_1"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))
        items (cli-server/list-graph-items {:root-dir root-dir})]
    (is (= [{:kind :canonical
             :graph-name "alpha"
             :graph-dir "alpha"}]
           items))))

(deftest list-graph-items-marks-legacy-conflict
  (let [root-dir (node-helper/create-tmp-dir "cli-list-graphs-legacy")
        graphs-dir (node-path/join root-dir "graphs")
        _ (doseq [dir ["legacy++name"
                       "legacy~2Fname"
                       "bad%ZZname"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))
        items (cli-server/list-graph-items {:root-dir root-dir})
        by-kind (group-by :kind items)
        legacy-item (first (get by-kind :legacy))
        undecodable-item (first (get by-kind :legacy-undecodable))]
    (is (= "legacy/name" (:legacy-graph-name legacy-item)))
    (is (= "legacy~2Fname" (:target-graph-dir legacy-item)))
    (is (= true (:conflict? legacy-item)))
    (is (= "bad%ZZname" (:legacy-dir undecodable-item)))))

(deftest list-graph-items-treats-percent-encoded-dir-as-legacy-when-non-canonical
  (let [root-dir (node-helper/create-tmp-dir "cli-list-graphs-percent-legacy")
        graphs-dir (node-path/join root-dir "graphs")
        _ (doseq [dir ["yy y"
                       "yy~20y"
                       "yy%20y"]]
            (fs/mkdirSync (node-path/join graphs-dir dir) #js {:recursive true}))
        items (cli-server/list-graph-items {:root-dir root-dir})
        by-kind (group-by :kind items)
        canonical-item (first (get by-kind :canonical))
        legacy-items (get by-kind :legacy)
        legacy-by-dir (into {} (map (juxt :legacy-dir identity) legacy-items))]
    (is (= "yy y" (:graph-dir canonical-item)))
    (is (= "yy y" (:graph-name canonical-item)))
    (is (= #{"yy~20y" "yy%20y"}
           (set (map :legacy-dir legacy-items))))
    (doseq [legacy-dir ["yy~20y" "yy%20y"]]
      (let [legacy-item (get legacy-by-dir legacy-dir)]
        (is (= "yy y" (:legacy-graph-name legacy-item)))
        (is (= "yy y" (:target-graph-dir legacy-item)))
        (is (= true (:conflict? legacy-item)))))))
