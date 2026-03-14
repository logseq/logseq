(ns logseq.cli.server-test
  {:clj-kondo/config '{:linters {:private-var-access {:level :off}}}}
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["http" :as http]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
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
                              :data-dir "/tmp/logseq-db-worker"})
              (p/resolved true)))
          (p/then (fn [_]
                    (is (= (.-execPath js/process)
                           (:cmd @captured)))
                    (is (= (node-path/join js/__dirname "../dist/db-worker-node.js")
                           (first (:args @captured))))
                    (is (some #{"--repo"} (:args @captured)))
                    (is (some #{"--data-dir"} (:args @captured)))
                    (is (not-any? #{"--host" "--port"} (:args @captured)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e)))))
      (finally
        (.chdir js/process original-cwd)))))

(deftest lock-path-uses-canonical-graph-dir
  (let [data-dir "/tmp/logseq-db-worker"
        repo "logseq_db_demo"
        expected (node-path/join data-dir "demo" "db-worker.lock")]
    (is (= expected (cli-server/lock-path data-dir repo)))))

(deftest lock-path-encodes-special-characters-in-graph-dir
  (let [data-dir "/tmp/logseq-db-worker"
        repo "logseq_db_foo/bar"
        expected (node-path/join data-dir "foo~2Fbar" "db-worker.lock")]
    (is (= expected (cli-server/lock-path data-dir repo)))))

(deftest db-worker-runtime-script-path-defaults-to-packaged-dist-target
  (is (= (node-path/join js/__dirname "../dist/db-worker-node.js")
         (cli-server/db-worker-runtime-script-path))))

(deftest ensure-server-repairs-stale-lock
  (async done
         (let [data-dir (node-helper/create-tmp-dir "cli-server")
               repo (str "logseq_db_stale_" (subs (str (random-uuid)) 0 8))
               path (cli-server/lock-path data-dir repo)
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
         (let [data-dir (node-helper/create-tmp-dir "cli-server-reuse")
               repo (str "logseq_db_reuse_" (subs (str (random-uuid)) 0 8))
               lock-file (cli-server/lock-path data-dir repo)
               host "127.0.0.1"
               spawn-calls (atom 0)
               server (http/createServer
                       (fn [^js req ^js res]
                         (case (.-url req)
                           "/healthz" (do (.writeHead res 200 #js {"Content-Type" "text/plain"})
                                          (.end res "ok"))
                           "/readyz" (do (.writeHead res 200 #js {"Content-Type" "text/plain"})
                                         (.end res "ok"))
                           (do (.writeHead res 404 #js {"Content-Type" "text/plain"})
                               (.end res "not-found")))))]
           (.listen server 0 host
                    (fn []
                      (let [address (.address server)
                            port (if (number? address) address (.-port address))
                            lock {:repo repo
                                  :pid (.-pid js/process)
                                  :host host
                                  :port port}]
                        (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
                        (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
                        (-> (p/with-redefs [daemon/spawn-server! (fn [_opts]
                                                                   (swap! spawn-calls inc)
                                                                   (throw (ex-info "should not spawn when lock is ready" {})))]
                              (cli-server/ensure-server! {:data-dir data-dir} repo))
                            (p/then (fn [config]
                                      (is (= (str "http://" host ":" port) (:base-url config)))
                                      (is (= 0 @spawn-calls))))
                            (p/catch (fn [e]
                                       (is false (str "unexpected error: " e))))
                            (p/finally (fn []
                                         (.close server (fn [] (done))))))))))))

(deftest start-server-reports-repo-locked-error-stably
  (async done
         (let [data-dir (node-helper/create-tmp-dir "cli-server-repo-locked")
               repo (str "logseq_db_locked_" (subs (str (random-uuid)) 0 8))
               lock-file (cli-server/lock-path data-dir repo)
               lock {:repo repo
                     :pid 999999
                     :host "127.0.0.1"
                     :port 55555}]
           (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
           (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
           (-> (p/with-redefs [daemon/cleanup-stale-lock! (fn [_path _lock] (p/resolved nil))
                               daemon/wait-for-ready (fn [_lock]
                                                       (p/rejected (ex-info "graph already locked"
                                                                            {:code :repo-locked
                                                                             :lock lock})))]
                 (cli-server/start-server! {:data-dir data-dir} repo))
               (p/then (fn [result]
                         (is (= false (:ok? result)))
                         (is (= :repo-locked (get-in result [:error :code])))
                         (is (= lock (get-in result [:error :lock])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest stop-server-denies-owner-mismatch
  (async done
         (let [data-dir (node-helper/create-tmp-dir "cli-server-owner-stop")
               repo (str "logseq_db_owner_stop_" (subs (str (random-uuid)) 0 8))
               lock-file (cli-server/lock-path data-dir repo)
               lock {:repo repo
                     :pid (.-pid js/process)
                     :host "127.0.0.1"
                     :port 9101
                     :owner-source :electron}]
           (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
           (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
           (-> (p/with-redefs [daemon/http-request (fn [_] (p/resolved {:status 200 :body ""}))
                               daemon/wait-for (fn [_ _] (p/resolved true))]
                 (cli-server/stop-server! {:data-dir data-dir
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
         (let [data-dir (node-helper/create-tmp-dir "cli-server-owner-restart")
               repo (str "logseq_db_owner_restart_" (subs (str (random-uuid)) 0 8))
               lock-file (cli-server/lock-path data-dir repo)
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
                     (cli-server/restart-server! {:data-dir data-dir
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
         (let [data-dir (node-helper/create-tmp-dir "cli-server-orphan-timeout")
               repo (str "logseq_db_orphan_timeout_" (subs (str (random-uuid)) 0 8))
               cleanup-calls (atom 0)
               spawn-calls (atom 0)]
           (-> (p/with-redefs [daemon/cleanup-stale-lock! (fn [_ _] (p/resolved nil))
                               daemon/cleanup-orphan-processes! (fn [_]
                                                                  (swap! cleanup-calls inc)
                                                                  {:killed-pids [111]})
                               daemon/spawn-server! (fn [_]
                                                      (swap! spawn-calls inc)
                                                      nil)
                               daemon/wait-for-lock (fn [_]
                                                      (p/rejected (ex-info "timeout"
                                                                           {:code :timeout})))
                               daemon/find-orphan-processes (fn [_]
                                                              [{:pid 111}
                                                               {:pid 222}])]
                 (cli-server/start-server! {:data-dir data-dir
                                            :owner-source :cli}
                                           repo))
               (p/then (fn [result]
                         (is (= false (:ok? result)))
                         (is (= :server-start-timeout-orphan (get-in result [:error :code])))
                         (is (= [111 222] (get-in result [:error :pids])))
                         (is (= 1 @cleanup-calls))
                         (is (= 1 @spawn-calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest ensure-server-forwards-create-empty-db-flag-when-spawning-daemon
  (async done
         (let [data-dir (node-helper/create-tmp-dir "cli-server-create-empty")
               repo (str "logseq_db_create_empty_" (subs (str (random-uuid)) 0 8))
               captured (atom nil)
               lock {:repo repo
                     :pid (.-pid js/process)
                     :host "127.0.0.1"
                     :port 9301}
               read-lock-calls (atom 0)]
           (-> (p/with-redefs [daemon/read-lock (fn [_]
                                                  (if (= 1 (swap! read-lock-calls inc))
                                                    nil
                                                    lock))
                               daemon/cleanup-stale-lock! (fn [_ _] (p/resolved nil))
                               daemon/cleanup-orphan-processes! (fn [_] {:orphans [] :killed-pids []})
                               daemon/spawn-server! (fn [opts]
                                                      (reset! captured opts)
                                                      nil)
                               daemon/wait-for-lock (fn [_] (p/resolved true))
                               daemon/wait-for-ready (fn [_] (p/resolved true))]
                 (cli-server/ensure-server! {:data-dir data-dir
                                             :create-empty-db? true}
                                            repo))
               (p/then (fn [_]
                         (is (= repo (:repo @captured)))
                         (is (= (cli-server/resolve-data-dir {:data-dir data-dir})
                                (:data-dir @captured)))
                         (is (= true (:create-empty-db? @captured)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest list-servers-includes-revision-from-lock
  (async done
         (let [data-dir (node-helper/create-tmp-dir "cli-server-list-revision")
               repo (str "logseq_db_list_revision_" (subs (str (random-uuid)) 0 8))
               lock-file (cli-server/lock-path data-dir repo)
               lock {:repo repo
                     :pid (.-pid js/process)
                     :host "127.0.0.1"
                     :port 9311
                     :owner-source :cli
                     :revision "server-revision"}]
           (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
           (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
           (-> (p/with-redefs [daemon/ready? (fn [_] (p/resolved true))]
                 (cli-server/list-servers {:data-dir data-dir}))
               (p/then (fn [servers]
                         (is (= 1 (count servers)))
                         (is (= repo (:repo (first servers))))
                         (is (= "server-revision" (:revision (first servers))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest list-graph-items-ignores-non-graph-directories
  (let [data-dir (node-helper/create-tmp-dir "cli-list-graphs-ignore")
        _ (doseq [dir ["alpha"
                       "foo~2G"
                       "Unlinked graphs"
                       "logseq_local_1"]]
            (fs/mkdirSync (node-path/join data-dir dir) #js {:recursive true}))
        items (cli-server/list-graph-items {:data-dir data-dir})]
    (is (= [{:kind :canonical
             :graph-name "alpha"
             :graph-dir "alpha"}]
           items))))

(deftest list-graph-items-marks-legacy-conflict
  (let [data-dir (node-helper/create-tmp-dir "cli-list-graphs-legacy")
        _ (doseq [dir ["legacy++name"
                       "legacy~2Fname"
                       "bad%ZZname"]]
            (fs/mkdirSync (node-path/join data-dir dir) #js {:recursive true}))
        items (cli-server/list-graph-items {:data-dir data-dir})
        by-kind (group-by :kind items)
        legacy-item (first (get by-kind :legacy))
        undecodable-item (first (get by-kind :legacy-undecodable))]
    (is (= "legacy/name" (:legacy-graph-name legacy-item)))
    (is (= "legacy~2Fname" (:target-graph-dir legacy-item)))
    (is (= true (:conflict? legacy-item)))
    (is (= "bad%ZZname" (:legacy-dir undecodable-item)))))

(deftest list-graph-items-treats-percent-encoded-dir-as-legacy-when-non-canonical
  (let [data-dir (node-helper/create-tmp-dir "cli-list-graphs-percent-legacy")
        _ (doseq [dir ["yy~20y"
                       "yy%20y"]]
            (fs/mkdirSync (node-path/join data-dir dir) #js {:recursive true}))
        items (cli-server/list-graph-items {:data-dir data-dir})
        by-kind (group-by :kind items)
        canonical-item (first (get by-kind :canonical))
        legacy-item (first (get by-kind :legacy))]
    (is (= "yy~20y" (:graph-dir canonical-item)))
    (is (= "yy y" (:graph-name canonical-item)))
    (is (= "yy%20y" (:legacy-dir legacy-item)))
    (is (= "yy y" (:legacy-graph-name legacy-item)))
    (is (= "yy~20y" (:target-graph-dir legacy-item)))
    (is (= true (:conflict? legacy-item)))))
