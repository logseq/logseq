(ns logseq.db-worker.daemon-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.db-worker.daemon :as daemon]
            [promesa.core :as p]
            ["fs" :as fs]
            ["path" :as node-path]
            ["child_process" :as child-process]))

(deftest spawn-server-uses-detached-process-and-no-host-port-args
  (let [captured (atom nil)
        original-spawn (.-spawn child-process)]
    (set! (.-spawn child-process)
          (fn [cmd args opts]
            (reset! captured {:cmd cmd
                              :args (vec (js->clj args))
                              :opts (js->clj opts :keywordize-keys true)})
            (js-obj "unref" (fn [] nil))))
    (try
      (daemon/spawn-server! {:script "/tmp/db-worker-node.js"
                             :repo "logseq_db_spawn_helper_test"
                             :data-dir "/tmp/logseq-db-worker"})
      (is (= "/tmp/db-worker-node.js" (:cmd @captured)))
      (is (some #{"--repo"} (:args @captured)))
      (is (some #{"--data-dir"} (:args @captured)))
      (is (not-any? #{"--host" "--port"} (:args @captured)))
      (is (= true (get-in @captured [:opts :detached])))
      (finally
        (set! (.-spawn child-process) original-spawn)))))

(deftest cleanup-stale-lock-removes-invalid-lock
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker-daemon-helper")
          repo (str "logseq_db_helper_stale_" (subs (str (random-uuid)) 0 8))
          path (node-path/join data-dir "db-worker.lock")
          invalid-lock {:repo repo
                        :pid (.-pid js/process)
                        :host "127.0.0.1"
                        :port 0}]
      (fs/mkdirSync data-dir #js {:recursive true})
      (fs/writeFileSync path (js/JSON.stringify (clj->js invalid-lock)))
      (-> (p/let [_ (daemon/cleanup-stale-lock! path invalid-lock)]
            (is (not (fs/existsSync path)))
            (done))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))
                     (done)))))))

(deftest parse-process-args-reads-db-worker-flags
  (let [command "node /tmp/db-worker-node.js --repo logseq_db_demo --data-dir /tmp/logseq/graphs --owner-source electron"
        parsed (daemon/parse-process-args command)]
    (is (= "logseq_db_demo" (:repo parsed)))
    (is (= (node-path/resolve "/tmp/logseq/graphs") (:data-dir parsed)))
    (is (= :electron (:owner-source parsed)))))

(deftest find-orphan-processes-matches-repo-and-data-dir
  (let [original-list daemon/list-db-worker-processes
        target-dir (node-path/resolve "/tmp/logseq/graphs")
        processes [{:pid 101 :repo "logseq_db_demo" :data-dir target-dir :owner-source :cli}
                   {:pid 102 :repo "logseq_db_demo" :data-dir (node-path/resolve "/tmp/other") :owner-source :cli}
                   {:pid 103 :repo "logseq_db_other" :data-dir target-dir :owner-source :electron}]]
    (set! daemon/list-db-worker-processes (fn [] processes))
    (try
      (let [orphans (daemon/find-orphan-processes {:repo "logseq_db_demo"
                                                   :data-dir "/tmp/logseq/graphs"})]
        (is (= [101] (mapv :pid orphans))))
      (finally
        (set! daemon/list-db-worker-processes original-list)))))

(deftest cleanup-orphan-processes-kills-matched-pids
  (let [original-find daemon/find-orphan-processes
        original-kill (.-kill js/process)
        kill-calls (atom [])]
    (set! daemon/find-orphan-processes
          (fn [_]
            [{:pid 90001} {:pid 90002}]))
    (set! (.-kill js/process)
          (fn [pid signal]
            (swap! kill-calls conj [pid signal])
            true))
    (try
      (let [{:keys [killed-pids]} (daemon/cleanup-orphan-processes! {:repo "logseq_db_demo"
                                                                      :data-dir "/tmp/logseq/graphs"})]
        (is (= [90001 90002] killed-pids))
        (is (= [[90001 "SIGTERM"]
                [90002 "SIGTERM"]]
               @kill-calls)))
      (finally
        (set! daemon/find-orphan-processes original-find)
        (set! (.-kill js/process) original-kill)))))
