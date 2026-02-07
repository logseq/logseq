(ns logseq.cli.server-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.server :as cli-server]
            [promesa.core :as p]
            ["fs" :as fs]
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
