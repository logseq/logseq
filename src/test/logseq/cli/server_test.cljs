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
