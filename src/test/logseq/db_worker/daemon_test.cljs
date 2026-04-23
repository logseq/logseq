(ns logseq.db-worker.daemon-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.test-helper :as test-helper]
            [logseq.db-worker.daemon :as daemon]
            [promesa.core :as p]
            ["fs" :as fs]
            ["path" :as node-path]
            ["child_process" :as child-process]))

(defn- call-private
  [sym & args]
  (when-let [v (get (ns-interns 'logseq.db-worker.daemon) sym)]
    (apply @v args)))

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

(deftest cleanup-stale-lock-stops-unhealthy-alive-process-before-removing-lock
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker-daemon-unhealthy")
          repo (str "logseq_db_helper_unhealthy_" (subs (str (random-uuid)) 0 8))
          path (node-path/join data-dir "db-worker.lock")
          lock {:repo repo
                :pid 424242
                :host "127.0.0.1"
                :port 9100
                :owner-source :cli
                :startedAt "2000-01-01T00:00:00.000Z"}
          pid-state (atom :alive)
          kill-calls (atom [])]
      (fs/mkdirSync data-dir #js {:recursive true})
      (fs/writeFileSync path (js/JSON.stringify (clj->js lock)))
      (-> ((if (= "win32" (.-platform js/process))
             (fn [f]
               (test-helper/with-js-property-override
                child-process
                "spawnSync"
                (fn [command args _opts]
                  (swap! kill-calls conj [command (vec (js->clj args))])
                  (reset! pid-state :not-found)
                  #js {:status 0})
                f))
             (fn [f]
               (test-helper/with-js-property-override
                js/process
                "kill"
                (fn [pid signal]
                  (swap! kill-calls conj [pid signal])
                  (reset! pid-state :not-found)
                  true)
                f)))
           (fn []
             (p/with-redefs [daemon/pid-status (fn [_] @pid-state)
                             daemon/healthy? (fn [_] (p/resolved false))
                             daemon/wait-for (fn [pred _opts]
                                               (p/let [result (pred)]
                                                 (is (= true result))
                                                 true))]
               (daemon/cleanup-stale-lock! path lock))))
          (p/then (fn [_]
                    (if (= "win32" (.-platform js/process))
                      (is (= [["taskkill" ["/PID" "424242" "/T"]]] @kill-calls))
                      (is (= [[424242 "SIGTERM"]] @kill-calls)))
                    (is (not (fs/existsSync path)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest cleanup-stale-lock-keeps-recent-unhealthy-alive-process
  (async done
    (let [data-dir (node-helper/create-tmp-dir "db-worker-daemon-recent")
          repo (str "logseq_db_helper_recent_" (subs (str (random-uuid)) 0 8))
          path (node-path/join data-dir "db-worker.lock")
          lock {:repo repo
                :pid 424242
                :host "127.0.0.1"
                :port 9100
                :owner-source :cli
                :startedAt (.toISOString (js/Date.))}
          kill-calls (atom [])]
      (fs/mkdirSync data-dir #js {:recursive true})
      (fs/writeFileSync path (js/JSON.stringify (clj->js lock)))
      (-> (test-helper/with-js-property-override
           js/process
           "kill"
           (fn [pid signal]
             (swap! kill-calls conj [pid signal])
             true)
           (fn []
             (p/with-redefs [daemon/pid-status (fn [_] :alive)
                             daemon/healthy? (fn [_] (p/resolved false))]
               (daemon/cleanup-stale-lock! path lock))))
          (p/then (fn [_]
                    (is (= [] @kill-calls))
                    (is (fs/existsSync path))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest terminate-process-uses-platform-appropriate-stop-command
  (async done
    (let [terminate-process! (fn [pid force?]
                               (call-private 'terminate-process! pid force?))
          spawn-calls (atom [])
          kill-calls (atom [])]
      (-> ((if (= "win32" (.-platform js/process))
             (fn [f]
               (test-helper/with-js-property-override
                child-process
                "spawnSync"
                (fn [command args opts]
                  (swap! spawn-calls conj {:command command
                                           :args (vec (js->clj args))
                                           :opts (js->clj opts :keywordize-keys true)})
                  #js {:status 0})
                f))
             (fn [f]
               (test-helper/with-js-property-override
                js/process
                "kill"
                (fn [pid signal]
                  (swap! kill-calls conj [pid signal])
                  true)
                f)))
           (fn []
             (p/let [_ (terminate-process! 424242 false)
                     _ (terminate-process! 424242 true)]
               (if (= "win32" (.-platform js/process))
                 (is (= [{:command "taskkill"
                          :args ["/PID" "424242" "/T"]
                          :opts {:windowsHide true
                                 :stdio "ignore"}}
                         {:command "taskkill"
                          :args ["/PID" "424242" "/T" "/F"]
                          :opts {:windowsHide true
                                 :stdio "ignore"}}]
                        @spawn-calls))
                 (is (= [[424242 "SIGTERM"]
                         [424242 "SIGKILL"]]
                        @kill-calls))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))
