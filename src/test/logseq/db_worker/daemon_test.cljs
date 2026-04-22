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
        unref-called? (atom false)
        original-spawn (.-spawn child-process)]
    (set! (.-spawn child-process)
          (fn [cmd args opts]
            (reset! captured {:cmd cmd
                              :args (vec (js->clj args))
                              :opts (js->clj opts :keywordize-keys true)})
            (js-obj "unref" (fn [] (reset! unref-called? true)))))
    (try
      (daemon/spawn-server! {:script "/tmp/db-worker-node.js"
                             :repo "logseq_db_spawn_helper_test"
                             :data-dir "/tmp/logseq-db-worker"})
      (is (= (.-execPath js/process) (:cmd @captured)))
      (is (= "/tmp/db-worker-node.js" (first (:args @captured))))
      (is (some #{"--repo"} (:args @captured)))
      (is (some #{"--data-dir"} (:args @captured)))
      (is (not-any? #{"--host" "--port"} (:args @captured)))
      (is (= true (get-in @captured [:opts :detached])))
      (is (= "1" (get-in @captured [:opts :env :ELECTRON_RUN_AS_NODE])))
      (is (= true @unref-called?))
      (finally
        (set! (.-spawn child-process) original-spawn)))))

(deftest spawn-server-keeps-electron-owned-process-attached
  (let [captured (atom nil)
        unref-called? (atom false)
        original-spawn (.-spawn child-process)]
    (set! (.-spawn child-process)
          (fn [cmd args opts]
            (reset! captured {:cmd cmd
                              :args (vec (js->clj args))
                              :opts (js->clj opts :keywordize-keys true)})
            (js-obj "unref" (fn [] (reset! unref-called? true)))))
    (try
      (daemon/spawn-server! {:script "/tmp/db-worker-node.js"
                             :repo "logseq_db_spawn_helper_test"
                             :data-dir "/tmp/logseq-db-worker"
                             :owner-source :electron})
      (is (= false (get-in @captured [:opts :detached])))
      (is (= "inherit" (get-in @captured [:opts :stdio])))
      (is (= false @unref-called?))
      (finally
        (set! (.-spawn child-process) original-spawn)))))

(deftest spawn-server-appends-create-empty-db-flag-when-enabled
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
                             :data-dir "/tmp/logseq-db-worker"
                             :create-empty-db? true})
      (is (some #{"--create-empty-db"} (:args @captured)))
      (finally
        (set! (.-spawn child-process) original-spawn)))))

(deftest spawn-server-omits-create-empty-db-flag-by-default
  (let [captured (atom [])
        original-spawn (.-spawn child-process)
        capture! (fn [_cmd args _opts]
                   (swap! captured conj (vec (js->clj args)))
                   (js-obj "unref" (fn [] nil)))]
    (set! (.-spawn child-process) capture!)
    (try
      (daemon/spawn-server! {:script "/tmp/db-worker-node.js"
                             :repo "logseq_db_spawn_helper_test"
                             :data-dir "/tmp/logseq-db-worker"})
      (daemon/spawn-server! {:script "/tmp/db-worker-node.js"
                             :repo "logseq_db_spawn_helper_test"
                             :data-dir "/tmp/logseq-db-worker"
                             :create-empty-db? false})
      (is (every? (fn [args]
                    (not-any? #{"--create-empty-db"} args))
                  @captured))
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
