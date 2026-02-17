(ns logseq.cli.server-test
  {:clj-kondo/config '{:linters {:private-var-access {:level :off}}}}
  (:require [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.server :as cli-server]
            [logseq.db-worker.daemon :as daemon]
            [promesa.core :as p]
            ["fs" :as fs]
            ["http" :as http]
            ["path" :as node-path]
            ["child_process" :as child-process]))

(deftest spawn-server-omits-host-and-port-flags
  (let [spawn-server! #'cli-server/spawn-server!
        captured (atom nil)
        original-spawn (.-spawn child-process)
        original-cwd (.cwd js/process)]
    (set! (.-spawn child-process)
          (fn [cmd args opts]
            (reset! captured {:cmd cmd
                              :args (vec (js->clj args))
                              :opts (js->clj opts :keywordize-keys true)})
            (js-obj "unref" (fn [] nil))))
    (try
      (.chdir js/process "/")
      (spawn-server! {:repo "logseq_db_spawn_test"
                      :data-dir "/tmp/logseq-db-worker"})
      (is (= (node-path/join js/__dirname "../dist/db-worker-node.js")
             (:cmd @captured)))
      (is (some #{"--repo"} (:args @captured)))
      (is (some #{"--data-dir"} (:args @captured)))
      (is (not-any? #{"--host" "--port"} (:args @captured)))
      (finally
        (.chdir js/process original-cwd)
        (set! (.-spawn child-process) original-spawn)))))

(deftest lock-path-uses-canonical-graph-dir
  (let [data-dir "/tmp/logseq-db-worker"
        repo "logseq_db_demo"
        expected (node-path/join data-dir "demo" "db-worker.lock")]
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
                             :port port}
                       original-spawn! daemon/spawn-server!]
                   (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
                   (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
                   (set! daemon/spawn-server!
                         (fn [_opts]
                           (swap! spawn-calls inc)
                           (throw (ex-info "should not spawn when lock is ready" {}))))
                   (-> (cli-server/ensure-server! {:data-dir data-dir} repo)
                       (p/then (fn [config]
                                 (is (= (str "http://" host ":" port) (:base-url config)))
                                 (is (= 0 @spawn-calls))))
                       (p/catch (fn [e]
                                  (is false (str "unexpected error: " e))))
                       (p/finally (fn []
                                    (set! daemon/spawn-server! original-spawn!)
                                    (.close server (fn [] (done))))))))))))

(deftest start-server-reports-repo-locked-error-stably
  (async done
    (let [data-dir (node-helper/create-tmp-dir "cli-server-repo-locked")
          repo (str "logseq_db_locked_" (subs (str (random-uuid)) 0 8))
          lock-file (cli-server/lock-path data-dir repo)
          lock {:repo repo
                :pid 999999
                :host "127.0.0.1"
                :port 55555}
          original-cleanup daemon/cleanup-stale-lock!
          original-ready daemon/wait-for-ready]
      (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
      (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
      (set! daemon/cleanup-stale-lock! (fn [_path _lock] (p/resolved nil)))
      (set! daemon/wait-for-ready
            (fn [_lock]
              (p/rejected (ex-info "graph already locked"
                                   {:code :repo-locked
                                    :lock lock}))))
      (-> (cli-server/start-server! {:data-dir data-dir} repo)
          (p/then (fn [result]
                    (is (= false (:ok? result)))
                    (is (= :repo-locked (get-in result [:error :code])))
                    (is (= lock (get-in result [:error :lock])))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! daemon/cleanup-stale-lock! original-cleanup)
                       (set! daemon/wait-for-ready original-ready)
                       (done)))))))

(deftest stop-server-denies-owner-mismatch
  (async done
    (let [data-dir (node-helper/create-tmp-dir "cli-server-owner-stop")
          repo (str "logseq_db_owner_stop_" (subs (str (random-uuid)) 0 8))
          lock-file (cli-server/lock-path data-dir repo)
          lock {:repo repo
                :pid (.-pid js/process)
                :host "127.0.0.1"
                :port 9101
                :owner-source :electron}
          original-http daemon/http-request
          original-wait daemon/wait-for]
      (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
      (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
      (set! daemon/http-request (fn [_] (p/resolved {:status 200 :body ""})))
      (set! daemon/wait-for (fn [_ _] (p/resolved true)))
      (-> (cli-server/stop-server! {:data-dir data-dir
                                    :owner-source :cli}
                                   repo)
          (p/then (fn [result]
                    (is (= false (:ok? result)))
                    (is (= :server-owned-by-other (get-in result [:error :code])))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! daemon/http-request original-http)
                       (set! daemon/wait-for original-wait)
                       (done)))))))

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
          kill-calls (atom [])
          original-start cli-server/start-server!
          original-http daemon/http-request
          original-wait daemon/wait-for
          original-pid-status daemon/pid-status
          original-kill (.-kill js/process)]
      (fs/mkdirSync (node-path/dirname lock-file) #js {:recursive true})
      (fs/writeFileSync lock-file (js/JSON.stringify (clj->js lock)))
      (set! daemon/http-request (fn [_] (p/resolved {:status 200 :body ""})))
      (set! daemon/wait-for (fn [_ _] (p/rejected (ex-info "timeout" {:code :timeout}))))
      (set! daemon/pid-status (fn [_] :alive))
      (set! (.-kill js/process)
            (fn [pid signal]
              (swap! kill-calls conj [pid signal])
              true))
      (set! cli-server/start-server!
            (fn [_ _]
              (swap! start-calls inc)
              (p/resolved {:ok? true
                           :data {:repo repo}})))
      (-> (cli-server/restart-server! {:data-dir data-dir
                                       :owner-source :cli}
                                      repo)
          (p/then (fn [result]
                    (is (= false (:ok? result)))
                    (is (= :server-owned-by-other (get-in result [:error :code])))
                    (is (zero? @start-calls))
                    (is (empty? @kill-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! daemon/http-request original-http)
                       (set! daemon/wait-for original-wait)
                       (set! daemon/pid-status original-pid-status)
                       (set! (.-kill js/process) original-kill)
                       (set! cli-server/start-server! original-start)
                       (done)))))))

(deftest start-server-returns-timeout-orphan-error-with-pids
  (async done
    (let [data-dir (node-helper/create-tmp-dir "cli-server-orphan-timeout")
          repo (str "logseq_db_orphan_timeout_" (subs (str (random-uuid)) 0 8))
          cleanup-calls (atom 0)
          spawn-calls (atom 0)
          original-cleanup-stale daemon/cleanup-stale-lock!
          original-cleanup-orphans daemon/cleanup-orphan-processes!
          original-spawn daemon/spawn-server!
          original-wait-lock daemon/wait-for-lock
          original-find-orphans daemon/find-orphan-processes]
      (set! daemon/cleanup-stale-lock! (fn [_ _] (p/resolved nil)))
      (set! daemon/cleanup-orphan-processes! (fn [_]
                                               (swap! cleanup-calls inc)
                                               {:killed-pids [111]}))
      (set! daemon/spawn-server! (fn [_]
                                   (swap! spawn-calls inc)
                                   nil))
      (set! daemon/wait-for-lock (fn [_]
                                   (p/rejected (ex-info "timeout"
                                                        {:code :timeout}))))
      (set! daemon/find-orphan-processes (fn [_]
                                           [{:pid 111}
                                            {:pid 222}]))
      (-> (cli-server/start-server! {:data-dir data-dir
                                     :owner-source :cli}
                                    repo)
          (p/then (fn [result]
                    (is (= false (:ok? result)))
                    (is (= :server-start-timeout-orphan (get-in result [:error :code])))
                    (is (= [111 222] (get-in result [:error :pids])))
                    (is (= 1 @cleanup-calls))
                    (is (= 1 @spawn-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! daemon/cleanup-stale-lock! original-cleanup-stale)
                       (set! daemon/cleanup-orphan-processes! original-cleanup-orphans)
                       (set! daemon/spawn-server! original-spawn)
                       (set! daemon/wait-for-lock original-wait-lock)
                       (set! daemon/find-orphan-processes original-find-orphans)
                       (done)))))))
