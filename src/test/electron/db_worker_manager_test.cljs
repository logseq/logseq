(ns electron.db-worker-manager-test
  (:require ["fs-extra" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [electron.db-worker :as db-worker]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.server :as cli-server]
            [logseq.common.config :as common-config]
            [logseq.common.graph :as common-graph]
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
                   {:start-daemon! (fn [repo]
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
                   {:start-daemon! (fn [repo]
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
                   {:start-daemon! (fn [repo]
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
                   {:start-daemon! (fn [repo]
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
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
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
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
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
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
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
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
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
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
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
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
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
                   {:start-daemon! (fn [repo]
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
                   {:start-daemon! (fn [repo]
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
                   {:start-daemon! (fn [repo]
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
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
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
                   {:start-daemon! (fn [repo]
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
      (-> (p/with-redefs [cli-server/ensure-server! (fn [config repo]
                                                      (reset! captured {:config config
                                                                        :repo repo})
                                                      (p/resolved {:base-url "http://127.0.0.1:9300"
                                                                   :owned? true}))]
            ((get db-worker/manager :start-daemon!) "graph-a"))
          (p/then (fn [runtime-info]
                    (is (= "graph-a" (:repo @captured)))
                    (is (= :electron (get-in @captured [:config :owner-source])))
                    (is (nil? (get-in @captured [:config :server-list-file])))
                    (is (= "http://127.0.0.1:9300" (:base-url runtime-info)))
                    (is (= true (:owned? runtime-info)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest delete-repo-stops-unowned-runtime-then-unlinks
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "delete-repo-unowned")
          repo "logseq_db_demo"
          graph-path (node-path/join graphs-dir "demo")
          unlinked-path (node-path/join graphs-dir common-config/unlinked-graphs-dir "demo")
          daemon-stop-calls (atom [])
          server-stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo]
                                     (p/resolved (assoc (runtime repo) :owned? false)))
                    :stop-daemon! (fn [rt]
                                    (swap! daemon-stop-calls conj (:repo rt))
                                    (p/resolved true))})]
      (fs/mkdirSync graph-path #js {:recursive true})
      (fs/writeFileSync (node-path/join graph-path "db.sqlite") "data")
      (fs/writeFileSync (node-path/join graph-path "db-worker.lock") "{\"pid\":4242}")
      (-> (p/with-redefs [common-graph/get-default-graphs-dir (fn [] graphs-dir)
                          cli-server/stop-server! (fn [config repo opts]
                                                    (swap! server-stop-calls conj {:config config
                                                                                   :repo repo
                                                                                   :opts opts})
                                                    (p/resolved {:ok? true}))]
            (p/let [_ (db-worker/ensure-started! manager repo :window-1)
                    unlinked (db-worker/delete-repo! manager repo)
                    state @(:state manager)]
              (is (empty? @daemon-stop-calls)
                  "Window-scoped skip of CLI-owned runtimes should still apply")
              (is (= 1 (count @server-stop-calls)))
              (is (= repo (:repo (first @server-stop-calls))))
              (is (= :electron (get-in (first @server-stop-calls) [:config :owner-source])))
              (is (true? (get-in (first @server-stop-calls) [:opts :allow-cross-owner?])))
              (is (= unlinked-path unlinked))
              (is (not (fs/existsSync graph-path)))
              (is (fs/existsSync (node-path/join unlinked-path "db.sqlite")))
              (is (nil? (get-in state [:repos repo])))
              (is (nil? (get-in state [:window->repo :window-1])))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest delete-repo-stops-published-server-even-when-desktop-never-attached
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "delete-repo-unattached")
          repo "logseq_db_demo"
          graph-path (node-path/join graphs-dir "demo")
          server-stop-calls (atom [])
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [_] (p/resolved true))})]
      (fs/mkdirSync graph-path #js {:recursive true})
      (fs/writeFileSync (node-path/join graph-path "db.sqlite") "data")
      (-> (p/with-redefs [common-graph/get-default-graphs-dir (fn [] graphs-dir)
                          cli-server/stop-server! (fn [_config repo opts]
                                                    (swap! server-stop-calls conj {:repo repo
                                                                                   :opts opts})
                                                    (p/resolved {:ok? true}))]
            (p/let [_ (db-worker/delete-repo! manager repo)]
              (is (= [{:repo repo :opts {:allow-cross-owner? true}}]
                     @server-stop-calls))
              (is (not (fs/existsSync graph-path)))
              (is (fs/existsSync (node-path/join graphs-dir
                                                 common-config/unlinked-graphs-dir
                                                 "demo"
                                                 "db.sqlite")))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

(deftest delete-repo-does-not-unlink-when-force-stop-fails
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "delete-repo-stop-failed")
          repo "logseq_db_demo"
          graph-path (node-path/join graphs-dir "demo")
          manager (db-worker/create-manager
                   {:start-daemon! (fn [repo] (p/resolved (runtime repo)))
                    :stop-daemon! (fn [_] (p/resolved true))})]
      (fs/mkdirSync graph-path #js {:recursive true})
      (fs/writeFileSync (node-path/join graph-path "db.sqlite") "data")
      (-> (p/with-redefs [common-graph/get-default-graphs-dir (fn [] graphs-dir)
                          cli-server/stop-server! (fn [_config _repo _opts]
                                                    (p/resolved {:ok? false
                                                                 :error {:code :server-stop-timeout
                                                                         :message "timed out stopping server"}}))]
            (db-worker/delete-repo! manager repo))
          (p/then (fn [_]
                    (is false "delete-repo! should fail closed when stop fails")))
          (p/catch (fn [e]
                     (is (= :server-stop-timeout (:code (ex-data e))))
                     (is (fs/existsSync graph-path)
                         "Live graph dir must not be moved if the worker could not be stopped")))
          (p/finally (fn [] (done))))))))
