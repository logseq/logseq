(ns electron.db-worker-manager-test
  (:require ["@logseq/graph-lifecycle" :as lifecycle]
            ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [electron.db-worker :as db-worker]
            [logseq.cli.server :as cli-server]
            [logseq.db-worker.daemon :as daemon]
            [logseq.cli.test-helper :as test-helper]
            [promesa.core :as p]))

(defn- runtime
  [repo]
  {:repo repo
   :base-url (str "http://127.0.0.1/" repo)
   :auth-token (str "token-" repo)})

(deftest ensure-started-is-idempotent-for-same-window
  (async done
    (let [start-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts]
                                     (swap! start-calls conj repo)
                                     (p/resolved (runtime repo)))
                    :stop-daemon! (fn [_] (p/resolved true))})]
      (-> (p/let [a (db-worker/ensure-started! manager "graph-a" :window-1)
                  b (db-worker/ensure-started! manager "graph-a" :window-1)]
            (is (= 1 (count @start-calls)))
            (is (= a b)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-started-reuses-daemon-across-windows
  (async done
    (let [start-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts]
                                     (swap! start-calls conj repo)
                                     (p/resolved (runtime repo)))
                    :stop-daemon! (fn [_] (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-a" :window-2)]
            (is (= ["graph-a"] @start-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-started-reuses-prefix-equivalent-runtime
  (async done
    (let [start-calls (atom [])
          stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts]
                                     (swap! start-calls conj repo)
                                     (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [first-runtime (db-worker/ensure-started! manager "demo" :window-1)
                  second-runtime (db-worker/ensure-started! manager "logseq_db_demo" :window-1)
                  manager-state @(:state manager)]
            (is (= first-runtime second-runtime))
            (is (= ["demo"] @start-calls))
            (is (empty? @stop-calls))
            (is (= "demo" (get-in manager-state [:window->repo :window-1])))
            (is (= #{:window-1} (get-in manager-state [:repos "demo" :windows]))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-started-switches-window-repo-and-stops-previous-daemon
  (async done
    (let [start-calls (atom [])
          stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts]
                                     (swap! start-calls conj repo)
                                     (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-b" :window-1)]
            (is (= ["graph-a" "graph-b"] @start-calls))
            (is (= ["graph-a"] @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-stopped-stops-only-on-last-window
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-a" :window-2)
                  _ (db-worker/ensure-stopped! manager "graph-a" :window-1)
                  _ (is (empty? @stop-calls))
                  _ (db-worker/ensure-stopped! manager "graph-a" :window-2)]
            (is (= ["graph-a"] @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest release-runtime-detaches-only-requested-window-repo-association
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-a" :window-2)
                  _ (db-worker/release-runtime! manager "graph-a" :window-1)
                  state @(:state manager)]
            (is (empty? @stop-calls))
            (is (nil? (get-in state [:window->repo :window-1])))
            (is (= "graph-a" (get-in state [:window->repo :window-2])))
            (is (= #{:window-2} (get-in state [:repos "graph-a" :windows]))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-stopped-stale-repo-does-not-clear-new-window-mapping
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-a" :window-2)
                  _ (db-worker/ensure-started! manager "graph-b" :window-1)
                  ;; simulate late/stale release for previous repo after window-1 already moved to graph-b
                  _ (db-worker/ensure-stopped! manager "graph-a" :window-1)
                  manager-state @(:state manager)]
            (is (= "graph-b" (get-in manager-state [:window->repo :window-1])))
            (is (= #{:window-2} (get-in manager-state [:repos "graph-a" :windows])))
            (is (= #{:window-1} (get-in manager-state [:repos "graph-b" :windows])))
            (is (empty? @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-stopped-stale-intermediate-repo-after-switch-back-keeps-current-repo
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-b" :window-1)
                  _ (db-worker/ensure-started! manager "graph-a" :window-1)
                  ;; stale cleanup for graph-b arrives after the window is already back on graph-a
                  _ (db-worker/ensure-stopped! manager "graph-b" :window-1)
                  manager-state @(:state manager)]
            (is (= "graph-a" (get-in manager-state [:window->repo :window-1])))
            (is (= #{:window-1} (get-in manager-state [:repos "graph-a" :windows])))
            (is (nil? (get-in manager-state [:repos "graph-b"])))
            (is (= ["graph-a" "graph-b"] @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-window-stopped-releases-active-runtime-by-window
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-a" :window-2)
                  _ (db-worker/ensure-window-stopped! manager :window-1)
                  _ (is (empty? @stop-calls))
                  _ (db-worker/ensure-window-stopped! manager :window-2)]
            (is (= ["graph-a"] @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest stop-all-stops-every-active-graph
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-b" :window-2)
                  _ (db-worker/stop-all! manager)]
            (is (= #{"graph-a" "graph-b"} (set @stop-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest stop-all-skips-external-runtimes
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts]
                                     (p/resolved (assoc (runtime repo)
                                                        :owned? (not= repo "graph-b"))))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-b" :window-2)
                  _ (db-worker/stop-all! manager)]
            (is (= ["graph-a"] @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-started-restarts-unhealthy-cached-runtime
  (async done
    (let [start-count (atom 0)
          stop-calls (atom [])
          created-runtimes (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts]
                                     (let [idx (swap! start-count inc)
                                           rt {:repo repo
                                               :base-url (str "http://127.0.0.1:910" idx)
                                               :auth-token (str "token-" idx)}]
                                       (swap! created-runtimes conj rt)
                                       (p/resolved rt)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:base-url rt))
                                    (p/resolved true))
                    :runtime-ready? (fn [rt]
                                      ;; first runtime reported unhealthy, restarted runtime healthy
                                      (p/resolved (not= (:base-url rt) "http://127.0.0.1:9101")))})]
      (-> (p/let [rt1 (db-worker/ensure-started! manager "graph-a" :window-1)
                  rt2 (db-worker/ensure-started! manager "graph-a" :window-1)]
            (is (= "http://127.0.0.1:9101" (:base-url rt1)))
            (is (= "http://127.0.0.1:9102" (:base-url rt2)))
            (is (= 2 @start-count))
            (is (= ["http://127.0.0.1:9101"] @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-window-stopped-does-not-stop-external-runtime
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts]
                                     (p/resolved (assoc (runtime repo) :owned? false)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-window-stopped! manager :window-1)]
            (is (empty? @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-repo-stopped-detaches-all-windows-and-stops-runtime-once
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-started! manager "graph-a" :window-2)
                  _ (db-worker/ensure-repo-stopped! manager "graph-a")
                  state @(:state manager)]
            (is (= ["graph-a"] @stop-calls))
            (is (nil? (get-in state [:repos "graph-a"])))
            (is (nil? (get-in state [:window->repo :window-1])))
            (is (nil? (get-in state [:window->repo :window-2]))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest ensure-repo-stopped-skips-stop-for-external-runtime
  (async done
    (let [stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts]
                                     (p/resolved (assoc (runtime repo) :owned? false)))
                    :stop-daemon! (fn [rt]
                                    (swap! stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "graph-a" :window-1)
                  _ (db-worker/ensure-repo-stopped! manager "graph-a")
                  state @(:state manager)]
            (is (empty? @stop-calls))
            (is (nil? (get-in state [:repos "graph-a"])))
            (is (nil? (get-in state [:window->repo :window-1]))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest managed-daemon-start-uses-cli-shared-server-path-with-electron-owner
  (async done
    (let [captured (atom nil)]
      (-> (test-helper/with-js-property-override
           lifecycle "observe" (fn [& _] (fn [] nil))
           #(p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                      (reset! captured {:config config
                                                                        :repo repo})
                                                      (p/resolved {:base-url "http://127.0.0.1:9300"
                                                                   :owned? true}))]
            ((get db-worker/manager :start-daemon!) "graph-a" {:generation "request-generation"})))
          (p/then (fn [runtime-info]
                    (is (= "graph-a" (:repo @captured)))
                    (is (= :electron (get-in @captured [:config :owner-source])))
                    (is (= "request-generation" (get-in @captured [:config :generation])))
                    (is (nil? (get-in @captured [:config :server-list-file])))
                    (is (= "http://127.0.0.1:9300" (:base-url runtime-info)))
                    (is (= true (:owned? runtime-info)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest failed-repo-stop-retains-manager-record
  (async done
    (let [manager (db-worker/create-manager
                   {:start-daemon! (fn [repo _opts] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [_] (p/resolved false))})]
      (-> (p/let [_ (db-worker/ensure-started! manager "demo" :window-1)]
            (-> (db-worker/ensure-repo-stopped! manager "demo")
                (p/then (fn [_] (is false "A false stop result must reject")))
                (p/catch (fn [_]
                           (is (some? (get-in @(:state manager) [:repos "demo"])))))))
          (p/finally done)))))

(deftest deletion-invalidates-pending-window-start
  (async done
    (let [pending (p/deferred)
          manager (db-worker/create-manager
                   {:start-daemon! (fn [_repo _opts] pending)
                    :stop-daemon! (fn [_] (p/resolved true))})
          started (db-worker/ensure-started! manager "demo" :window-1)]
      (db-worker/invalidate-repo! manager "demo")
      (p/resolve! pending (runtime "demo"))
      (-> started
          (p/then (fn [_] (is false "A deleted session must not attach")))
          (p/catch (fn [_]
                     (is (empty? (:repos @(:state manager))))
                     (is (empty? (:window->repo @(:state manager))))))
          (p/finally done)))))

(deftest cached-runtime-rejects-a-removed-generation
  (async done
    (let [ready? #'db-worker/runtime-ready-default?]
      (-> (p/with-redefs [lifecycle/snapshot (fn [_ _] #js {:generation "new" :phase "available"})
                           daemon/ready? (fn [_] (p/resolved true))]
            (p/let [result (ready? {:root-dir "/unused" :repo "demo" :generation "old"
                                    :base-url "http://127.0.0.1:1"})]
              (is (false? result))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest cached-runtime-rejects-requested-old-generation
  (async done
    (let [mgr (db-worker/create-manager
               {:start-daemon! (fn [repo _opts] (p/resolved (assoc (runtime repo) :generation "new")))
                :stop-daemon! (fn [_] (p/resolved true))})]
      (-> (p/with-redefs [db-worker/manager mgr]
            (p/let [_ (db-worker/ensure-runtime! "demo" :window-1)]
              (-> (db-worker/ensure-runtime! "demo" :window-2 {:generation "old"})
                  (p/then (fn [_] (is false "Old generation must be rejected")))
                  (p/catch (fn [error]
                             (is (= :graph-not-exists (:code (ex-data error))))
                             (is (nil? (get-in @(:state mgr) [:window->repo :window-2]))))))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest concurrent-window-release-stops-last-worker-once
  (async done
    (let [stops (atom 0)
          mgr (db-worker/create-manager
               {:start-daemon! (fn [repo _opts] (p/resolved (runtime repo)))
                :stop-daemon! (fn [_] (swap! stops inc) (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! mgr "demo" :window-1)
                  _ (db-worker/ensure-started! mgr "demo" :window-2)
                  _ (p/all [(db-worker/ensure-window-stopped! mgr :window-1)
                            (db-worker/ensure-window-stopped! mgr :window-2)])]
            (is (= 1 @stops))
            (is (empty? (:repos @(:state mgr)))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest opening-during-last-window-stop-waits-for-a-new-runtime
  (async done
    (let [stopping (p/deferred)
          started-stop (p/deferred)
          starts (atom 0)
          mgr (db-worker/create-manager
               {:start-daemon! (fn [repo _opts] (p/resolved (assoc (runtime repo) :generation (swap! starts inc))))
                :stop-daemon! (fn [_] (p/resolve! started-stop true) stopping)})]
      (-> (p/let [_ (db-worker/ensure-started! mgr "demo" :window-1)
                  result (let [closing (db-worker/ensure-window-stopped! mgr :window-1)]
                           (p/let [_ started-stop
                                   result (let [opening (db-worker/ensure-started! mgr "demo" :window-2)]
                                            (p/resolve! stopping true)
                                            (p/let [_ closing] opening))]
                             result))]
            (is (= 2 (:generation result)))
            (is (= #{:window-2} (get-in @(:state mgr) [:repos "demo" :windows]))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest duplicate-window-release-shares-the-last-stop
  (async done
    (let [stopping (p/deferred)
          stops (atom 0)
          mgr (db-worker/create-manager
               {:start-daemon! (fn [repo _opts] (p/resolved (runtime repo)))
                :stop-daemon! (fn [_] (swap! stops inc) stopping)})]
      (-> (p/let [_ (db-worker/ensure-started! mgr "demo" :window-1)
                  _ (let [first-close (db-worker/ensure-stopped! mgr "demo" :window-1)
                          second-close (db-worker/ensure-stopped! mgr "demo" :window-1)]
                      (p/resolve! stopping true)
                      (p/all [first-close second-close]))]
            (is (= 1 @stops)))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest failed-last-window-stop-retains-runtime-for-retry
  (async done
    (let [stops (atom 0)
          mgr (db-worker/create-manager
               {:start-daemon! (fn [repo _opts] (p/resolved (runtime repo)))
                :stop-daemon! (fn [_] (p/resolved (> (swap! stops inc) 1)))})]
      (-> (p/let [_ (db-worker/ensure-started! mgr "demo" :window-1)
                  _ (-> (db-worker/ensure-window-stopped! mgr :window-1)
                        (p/then (fn [_] (is false "False stop must fail")))
                        (p/catch (fn [_] (is (some? (get-in @(:state mgr) [:repos "demo" :runtime]))))))
                  _ (db-worker/ensure-repo-stopped! mgr "demo")]
            (is (= 2 @stops))
            (is (empty? (:repos @(:state mgr)))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest ^:long concurrent-window-release-stops-real-worker-and-reopens
  (async done
    (let [root (fs/mkdtempSync (node-path/join (os/tmpdir) "logseq-desktop-close-test-"))
          repo "demo"
          mgr (db-worker/create-manager
               {:start-daemon! (fn [_repo _opts]
                                 (p/let [^js result (lifecycle/startGraph
                                                    #js {:storage (lifecycle/resolveStorage root (node-path/join root "graphs")) :repo repo :owner "electron"
                                                         :script (node-path/resolve "static/db-worker-node.js")})]
                                   {:repo repo :root-dir root :generation (.-generation result)
                                    :pid (.-pid result) :owned? true
                                    :base-url (str "http://127.0.0.1:" (.-port result))}))
                :stop-daemon! (fn [_] (p/let [_ (lifecycle/stopGraph (lifecycle/resolveStorage root (node-path/join root "graphs")) repo "electron")] true))})]
      (-> (p/with-redefs [db-worker/manager mgr]
            (p/let [_ (lifecycle/createGraph (lifecycle/resolveStorage root (node-path/join root "graphs")) repo)
                    first-runtime (db-worker/ensure-runtime! repo :window-1)
                    _ (db-worker/ensure-runtime! repo :window-2)
                    _ (-> (db-worker/ensure-runtime! repo :stale-window {:generation "old"})
                          (p/then (fn [_] (is false "Stale request must not attach")))
                          (p/catch (fn [error] (is (= :graph-not-exists (:code (ex-data error)))))))
                    _ (p/all [(db-worker/ensure-window-stopped! mgr :window-1)
                              (db-worker/ensure-window-stopped! mgr :window-2)])]
              (is (false? (lifecycle/pidExists (:pid first-runtime))))
              (is (empty? (:repos @(:state mgr))))
              (is (fs/existsSync (lifecycle/ownershipPath (lifecycle/context (lifecycle/resolveStorage root (node-path/join root "graphs")) repo))))
              (p/let [reopened (db-worker/ensure-runtime! repo :window-3)]
                (is (not= (:pid first-runtime) (:pid reopened)))
                (is (true? (lifecycle/pidExists (:pid reopened)))))))
          (p/catch (fn [error] (is false (str error))))
          (p/then (fn [_] (lifecycle/deleteGraph (lifecycle/resolveStorage root (node-path/join root "graphs")) repo)))
          (p/then (fn [_] (fs/rmSync root #js {:recursive true :force true})))
          (p/catch (fn [error] (is false (str "Cleanup failed: " error))))
          (p/finally done)))))

(deftest concurrent-starts-retain-options-while-switching-graphs
  (async done
    (let [stopping (p/deferred)
          entered (p/deferred)
          starts (atom [])
          mgr (db-worker/create-manager
               {:start-daemon! (fn [repo opts]
                                 (swap! starts conj [repo opts])
                                 (p/resolved (assoc (runtime repo) :generation (:generation opts))))
                :stop-daemon! (fn [_] (p/resolve! entered true) stopping)})]
      (-> (p/with-redefs [db-worker/manager mgr]
            (p/let [_ (db-worker/ensure-runtime! "old" 1 {:generation "old"})
                    results (let [a (db-worker/ensure-runtime! "a" 1 {:generation "a" :root-dir "/a"})]
                              (p/let [_ entered
                                      b (db-worker/ensure-runtime! "b" 2 {:generation "b" :root-dir "/b"})]
                                (p/resolve! stopping true)
                                (p/let [a a] [a b])))]
              (is (= ["a" "b"] (mapv :generation results)))
              (is (= #{["a" {:generation "a" :root-dir "/a"}]
                       ["b" {:generation "b" :root-dir "/b"}]}
                     (set (rest @starts))))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest recovery-and-stop-all-retire-owned-and-external-observers
  (async done
    (let [active (atom #{})
          serial (atom 0)
          mgr (db-worker/create-manager
               {:start-daemon! (fn [repo _opts]
                                 (let [id (swap! serial inc)]
                                   (swap! active conj id)
                                   (p/resolved (assoc (runtime repo) :owned? (= repo "owned")
                                                      :close-observer! #(swap! active disj id)))))
                :runtime-ready? (fn [_] (p/resolved false))
                :stop-daemon! (fn [_] (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! mgr "owned" 1)
                  _ (db-worker/ensure-started! mgr "owned" 1)
                  _ (db-worker/ensure-started! mgr "owned" 1)
                  _ (is (= #{3} @active))
                  _ (db-worker/ensure-started! mgr "external" 2)
                  _ (db-worker/ensure-started! mgr "external" 2)
                  _ (is (= #{3 5} @active))
                  _ (db-worker/stop-all! mgr)]
            (is (empty? @active)))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest failed-recovery-retires-the-old-observer
  (async done
    (let [closed? (atom false)
          starts (atom 0)
          mgr (db-worker/create-manager
               {:start-daemon! (fn [repo _opts]
                                 (if (= 1 (swap! starts inc))
                                   (p/resolved (assoc (runtime repo) :close-observer! #(reset! closed? true)))
                                   (p/rejected (ex-info "Startup failed" {}))))
                :runtime-ready? (fn [_] (p/resolved false))
                :stop-daemon! (fn [_] (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! mgr "demo" 1)]
            (-> (db-worker/ensure-started! mgr "demo" 1)
                (p/then (fn [_] (is false "Recovery should fail")))
                (p/catch (fn [error]
                           (is (= "Startup failed" (ex-message error)))
                           (is @closed?)))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest invalidated-recovery-closes-only-its-uninstalled-observer
  (async done
    (let [active (atom #{})
          pending (p/deferred)
          entered (p/deferred)
          starts (atom 0)
          make-runtime (fn [repo id]
                         (swap! active conj id)
                         (assoc (runtime repo) :id id :close-observer! #(swap! active disj id)))
          mgr (db-worker/create-manager
               {:start-daemon! (fn [repo _opts]
                                 (case (swap! starts inc)
                                   1 (p/resolved (make-runtime repo 1))
                                   2 (do (p/resolve! entered true) pending)
                                   3 (p/resolved (make-runtime repo 3))))
                :runtime-ready? (fn [_] (p/resolved false))
                :stop-daemon! (fn [_] (p/resolved true))})]
      (-> (p/let [_ (db-worker/ensure-started! mgr "demo" 1)
                  _ (let [recovering (-> (db-worker/ensure-started! mgr "demo" 1)
                                        (p/then (fn [_] (is false "Invalidated recovery must fail")))
                                        (p/catch (fn [error]
                                                   (is (= :graph-not-exists (:code (ex-data error)))))))]
                      (p/let [_ entered
                              _ (db-worker/invalidate-repo! mgr "demo")
                              _ (db-worker/ensure-started! mgr "demo" 2)]
                        (p/resolve! pending (make-runtime "demo" 2))
                        recovering))]
            (is (= #{3} @active))
            (is (= 3 (get-in @(:state mgr) [:repos "demo" :runtime :id]))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest invalidated-initial-start-retires-its-observer
  (async done
    (let [closed? (atom false)
          pending (p/deferred)
          entered (p/deferred)
          mgr (db-worker/create-manager
               {:start-daemon! (fn [_repo _opts] (p/resolve! entered true) pending)
                :stop-daemon! (fn [_] (p/resolved true))})
          starting (-> (db-worker/ensure-started! mgr "demo" 1)
                       (p/then (fn [_] (is false "Invalidated start must fail")))
                       (p/catch (fn [error] (is (= :graph-not-exists (:code (ex-data error)))))))]
      (-> (p/let [_ entered
                  _ (db-worker/invalidate-repo! mgr "demo")
                  _ (p/resolve! pending (assoc (runtime "demo") :close-observer! #(reset! closed? true)))
                  _ starting]
            (is @closed?)
            (is (empty? (:repos @(:state mgr)))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))

(deftest stop-all-preserves-failed-runtime-and-closes-successful-observers
  (async done
    (let [active (atom #{})
          mgr (db-worker/create-manager
               {:start-daemon! (fn [repo _opts]
                                 (swap! active conj repo)
                                 (p/resolved (assoc (runtime repo) :close-observer! #(swap! active disj repo))))
                :stop-daemon! (fn [rt] (p/resolved (= "ok" (:repo rt))))})]
      (-> (p/let [_ (db-worker/ensure-started! mgr "ok" 1)
                  _ (db-worker/ensure-started! mgr "failed" 2)]
            (-> (db-worker/stop-all! mgr)
                (p/then (fn [_] (is false "Incomplete stop must fail")))
                (p/catch (fn [error]
                           (is (= :server-stop-failed (:code (ex-data error))))
                           (is (= #{"failed"} @active))
                           (is (= #{"failed"} (set (keys (:repos @(:state mgr))))))))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally done)))))
