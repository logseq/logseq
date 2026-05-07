(ns frontend.persist-db-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.handler.notification :as notification]
            [frontend.persist-db.browser :as browser]
            [frontend.persist-db :as persist-db]
            [frontend.persist-db.protocol :as protocol]
            [frontend.persist-db.remote :as remote]
            [frontend.storage :as storage]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defrecord FakeRemote [repo wrapped-worker]
  protocol/PersistentDB
  (<list-db [_]
    (p/resolved [{:name repo}]))

  (<new [_ _repo _opts]
    (p/resolved true))

  (<unsafe-delete [_ _repo]
    (p/resolved true))

  (<release-access-handles [_ _repo]
    (p/resolved true))

  (<fetch-initial-data [_ repo _opts]
    (p/resolved {:schema {:repo repo}
                 :initial-data []}))

  (<export-db [_ _repo _opts]
    (p/resolved nil))

  (<import-db [_ _repo _data]
    (p/resolved true)))

(defonce ^:private *previous-runtime-state (atom nil))

(defn- save-runtime-state!
  []
  (reset! *previous-runtime-state
          {:remote-db @persist-db/remote-db
           :remote-repo @persist-db/remote-repo
           :remote-runtime-state @persist-db/remote-runtime-state
           :db-worker @state/*db-worker
           :transact-fn @ldb/*transact-fn}))

(defn- restore-runtime-state!
  []
  (let [{:keys [remote-db remote-repo remote-runtime-state db-worker transact-fn]} @*previous-runtime-state]
    (reset! persist-db/remote-db remote-db)
    (reset! persist-db/remote-repo remote-repo)
    (reset! persist-db/remote-runtime-state remote-runtime-state)
    (reset! state/*db-worker db-worker)
    (reset! ldb/*transact-fn transact-fn)
    (reset! *previous-runtime-state nil)))

(use-fixtures :each {:before save-runtime-state!
                     :after restore-runtime-state!})

(defn- reset-runtime-state!
  []
  (reset! persist-db/remote-db nil)
  (reset! persist-db/remote-repo nil)
  (reset! persist-db/remote-runtime-state nil)
  (reset! state/*db-worker nil)
  (reset! ldb/*transact-fn nil))

(defn- success-body
  [result]
  (js/JSON.stringify
   #js {:ok true
        :resultTransit (ldb/write-transit-str result)}))

(defn- error-body
  [code message]
  (js/JSON.stringify
   #js {:ok false
        :error #js {:code code
                    :message message}}))

(defn- <capture-result
  [promise]
  (-> promise
      (p/then (fn [value]
                {:status :resolved
                 :value value}))
      (p/catch (fn [error]
                 {:status :rejected
                  :error error}))))

(defn- db-worker-runtime
  [results sse-state]
  {:base-url "http://127.0.0.1:9101"
   :auth-token nil
   :fetch-fn (fn [{:keys [body]}]
               (let [request (js->clj (js/JSON.parse body) :keywordize-keys true)
                     method (:method request)]
                 (case method
                   "thread-api/set-db-sync-config"
                   (p/resolved {:status 200
                                :body (success-body nil)})

                   "thread-api/list-db"
                   (let [result (first @results)]
                     (swap! results #(vec (rest %)))
                     (cond
                       (= :success result)
                       (p/resolved {:status 200
                                    :body (success-body [{:name "logseq_db_graph_a"}])})

                       (= :app-error result)
                       (p/resolved {:status 409
                                    :body (error-body "repo-locked" "graph already locked")})

                       (fn? result)
                       (result)

                       :else
                       (p/rejected (js/Error. "Failed to fetch")))))))
   :open-sse-fn (fn [{:keys [on-error]}]
                  (swap! (:open-count sse-state) inc)
                  (reset! (:on-error sse-state) on-error)
                  {:close! (fn []
                             (swap! (:close-count sse-state) inc))})
   :schedule-fn (fn [f _delay-ms]
                  (swap! (:scheduled sse-state) conj f)
                  :scheduled)})

(defn- sse-state
  []
  {:on-error (atom nil)
   :open-count (atom 0)
   :close-count (atom 0)
   :scheduled (atom [])})

(defn- install-electron-failover-test-env!
  [{:keys [current-repo repos results events current-repo-updates notifications sse]
    :or {sse (sse-state)}}]
  (let [originals {:original-state @state/state
                   :electron? util/electron?
                   :ipc ipc/ipc
                   :pub-event! state/pub-event!
                   :set-current-repo! state/set-current-repo!
                   :notification-show! notification/show!}]
    (reset-runtime-state!)
    (swap! state/state assoc :git/current-repo current-repo)
    (swap! state/state assoc-in [:me :repos] repos)
    (set! util/electron? (constantly true))
    (set! ipc/ipc (fn [channel repo]
                    (case channel
                      "db-worker-runtime"
                      (p/resolved (assoc (db-worker-runtime results sse) :repo repo))

                      (p/resolved nil))))
    (set! state/pub-event! (fn [event]
                             (swap! events conj event)
                             (p/resolved true)))
    (set! state/set-current-repo! (fn [repo]
                                    (swap! current-repo-updates conj repo)
                                    (swap! state/state assoc :git/current-repo repo)
                                    nil))
    (set! notification/show! (fn [content status]
                               (swap! notifications conj [content status])
                               nil))
    originals))

(defn- restore-electron-failover-test-env!
  [{:keys [original-state electron? ipc pub-event! set-current-repo! notification-show!]}]
  (reset! state/state original-state)
  (set! util/electron? electron?)
  (set! ipc/ipc ipc)
  (set! state/pub-event! pub-event!)
  (set! state/set-current-repo! set-current-repo!)
  (set! notification/show! notification-show!)
  (reset-runtime-state!))

(defn- graph-repos
  [& graphs]
  (mapv (fn [graph] {:url graph}) graphs))

(deftest electron-fetch-init-data-starts-remote-runtime
  (async done
    (let [ipc-calls (atom [])
          start-calls (atom [])
          wrapped-worker (fn [& _] nil)
          original-electron? util/electron?
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (set! util/electron? (constantly true))
      (set! ipc/ipc (fn [channel repo]
                      (swap! ipc-calls conj [channel repo])
                      (p/resolved {:base-url "http://127.0.0.1:9101"
                                   :auth-token nil
                                   :repo repo})))
      (set! remote/start! (fn [{:keys [repo]}]
                            (swap! start-calls conj repo)
                            (->FakeRemote repo wrapped-worker)))
      (set! remote/stop! (fn [_] (p/resolved true)))
      (-> (p/let [result (persist-db/<fetch-init-data "logseq_db_graph_a" {})]
            (is (= {:schema {:repo "logseq_db_graph_a"}
                    :initial-data []}
                   result))
            (is (= [["db-worker-runtime" "logseq_db_graph_a"]] @ipc-calls))
            (is (= ["logseq_db_graph_a"] @start-calls))
            (is (= wrapped-worker @state/*db-worker)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! util/electron? original-electron?)
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest electron-fetch-init-data-reuses-runtime-for-same-repo-and-restarts-for-new-repo
  (async done
    (let [ipc-calls (atom [])
          start-calls (atom [])
          stop-calls (atom [])
          ensure-remote! #'persist-db/<ensure-remote!
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (set! ipc/ipc (fn [channel repo]
                      (swap! ipc-calls conj [channel repo])
                      (p/resolved {:base-url "http://127.0.0.1:9101"
                                   :auth-token nil
                                   :repo repo})))
      (set! remote/start! (fn [{:keys [repo]}]
                            (swap! start-calls conj repo)
                            (->FakeRemote repo (fn [& _] nil))))
      (set! remote/stop! (fn [client]
                           (swap! stop-calls conj (:repo client))
                           (p/resolved true)))
      (-> (p/let [_ (ensure-remote! "logseq_db_graph_a")
                  _ (ensure-remote! "logseq_db_graph_a")
                  _ (ensure-remote! "logseq_db_graph_b")]
            (is (= [["db-worker-runtime" "logseq_db_graph_a"]
                    ["db-worker-runtime" "logseq_db_graph_b"]]
                   @ipc-calls))
            (is (= ["logseq_db_graph_a" "logseq_db_graph_b"] @start-calls))
            (is (= ["logseq_db_graph_a"] @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest electron-ensure-remote-reuses-prefix-equivalent-runtime
  (async done
    (let [ipc-calls (atom [])
          start-calls (atom [])
          stop-calls (atom [])
          ensure-remote! #'persist-db/<ensure-remote!
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (set! ipc/ipc (fn [channel repo]
                      (swap! ipc-calls conj [channel repo])
                      (p/resolved {:base-url "http://127.0.0.1:9101"
                                   :auth-token nil
                                   :repo repo})))
      (set! remote/start! (fn [{:keys [repo]}]
                            (swap! start-calls conj repo)
                            (->FakeRemote repo (fn [& _] nil))))
      (set! remote/stop! (fn [client]
                           (swap! stop-calls conj (:repo client))
                           (p/resolved true)))
      (-> (p/let [first-client (ensure-remote! "demo")
                  second-client (ensure-remote! "logseq_db_demo")]
            (is (= first-client second-client))
            (is (= [["db-worker-runtime" "demo"]] @ipc-calls))
            (is (= ["demo"] @start-calls))
            (is (empty? @stop-calls))
            (is (= "demo" @persist-db/remote-repo)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest electron-graph-switch-fetch-init-data-reuses-prefix-equivalent-runtime
  (async done
    (let [ipc-calls (atom [])
          start-calls (atom [])
          stop-calls (atom [])
          original-electron? util/electron?
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (set! util/electron? (constantly true))
      (set! ipc/ipc (fn [channel repo]
                      (swap! ipc-calls conj [channel repo])
                      (p/resolved {:base-url "http://127.0.0.1:9101"
                                   :auth-token nil
                                   :repo repo})))
      (set! remote/start! (fn [{:keys [repo]}]
                            (swap! start-calls conj repo)
                            (->FakeRemote repo (fn [& _] nil))))
      (set! remote/stop! (fn [client]
                           (swap! stop-calls conj (:repo client))
                           (p/resolved true)))
      (-> (p/let [first-result (persist-db/<fetch-init-data "demo" {})
                  second-result (persist-db/<fetch-init-data "logseq_db_demo" {})]
            (is (= {:schema {:repo "demo"}
                    :initial-data []}
                   first-result))
            (is (= {:schema {:repo "logseq_db_demo"}
                    :initial-data []}
                   second-result))
            (is (= [["db-worker-runtime" "demo"]] @ipc-calls))
            (is (= ["demo"] @start-calls))
            (is (empty? @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! util/electron? original-electron?)
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest electron-fetch-init-data-then-set-current-repo-does-not-rebind-runtime
  (async done
    (let [ipc-calls (atom [])
          start-calls (atom [])
          stop-calls (atom [])
          wrapped-worker (fn [& _] nil)
          original-state @state/state
          original-electron? util/electron?
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!
          original-storage-set storage/set
          original-storage-remove storage/remove]
      (reset-runtime-state!)
      (set! util/electron? (constantly true))
      (set! ipc/ipc (fn [channel repo]
                      (swap! ipc-calls conj [channel repo])
                      (p/resolved nil)))
      (set! remote/start! (fn [{:keys [repo]}]
                            (swap! start-calls conj repo)
                            (->FakeRemote repo wrapped-worker)))
      (set! remote/stop! (fn [client]
                           (swap! stop-calls conj (:repo client))
                           (p/resolved true)))
      (set! storage/set (fn [& _] nil))
      (set! storage/remove (fn [& _] nil))
      (-> (p/let [repo "logseq_db_graph_a"
                  _ (persist-db/<fetch-init-data repo {})
                  _ (state/set-current-repo! repo)]
            (is (= [["db-worker-runtime" "logseq_db_graph_a"]
                    ["setCurrentGraph" "logseq_db_graph_a"]]
                   @ipc-calls))
            (is (= ["logseq_db_graph_a"] @start-calls))
            (is (empty? @stop-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (reset! state/state original-state)
                       (set! util/electron? original-electron?)
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (set! storage/set original-storage-set)
                       (set! storage/remove original-storage-remove)
                       (done)))))))

(deftest electron-ensure-remote-pushes-db-sync-config-on-start-test
  (async done
         (let [worker-calls (atom [])
               ensure-remote! #'persist-db/<ensure-remote!
               original-ipc ipc/ipc
               original-start! remote/start!
               original-stop! remote/stop!
               original-ws config/db-sync-ws-url
               original-http config/db-sync-http-base]
           (reset-runtime-state!)
           (set! ipc/ipc (fn [channel repo]
                           (is (= "db-worker-runtime" channel))
                           (p/resolved {:base-url "http://127.0.0.1:9101"
                                        :auth-token nil
                                        :repo repo})))
           (set! config/db-sync-ws-url (fn [] "wss://sync.example.test/sync/%s"))
           (set! config/db-sync-http-base (fn [] "https://sync.example.test"))
           (set! remote/start! (fn [{:keys [repo]}]
                                 (->FakeRemote repo
                                               (fn [qkw & args]
                                                 (swap! worker-calls conj [qkw args])
                                                 (p/resolved nil)))))
           (set! remote/stop! (fn [_] (p/resolved true)))
           (-> (p/let [_ (ensure-remote! "logseq_db_graph_a")]
                 (let [set-config-call (first (filter #(= :thread-api/set-db-sync-config (first %))
                                                      @worker-calls))]
                   (is (= [:thread-api/set-db-sync-config
                           [{:enabled? true
                             :ws-url "wss://sync.example.test/sync/%s"
                             :http-base "https://sync.example.test"}]]
                          set-config-call))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (set! ipc/ipc original-ipc)
                            (set! remote/start! original-start!)
                            (set! remote/stop! original-stop!)
                            (set! config/db-sync-ws-url original-ws)
                            (set! config/db-sync-http-base original-http)
                            (done)))))))

(deftest electron-list-db-without-current-repo-does-not-bootstrap-runtime
  (async done
    (let [ipc-calls (atom [])
          start-calls (atom [])
          original-electron? util/electron?
          original-current-repo state/get-current-repo
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (set! util/electron? (constantly true))
      (set! state/get-current-repo (constantly nil))
      (set! ipc/ipc (fn [& args]
                      (swap! ipc-calls conj args)
                      (p/resolved {:base-url "http://127.0.0.1:9101"
                                   :auth-token nil
                                   :repo "logseq_db_unused"})))
      (set! remote/start! (fn [_]
                            (swap! start-calls conj :start)
                            (->FakeRemote "logseq_db_unused" (fn [& _] nil))))
      (set! remote/stop! (fn [_] (p/resolved true)))
      (-> (p/let [repos (persist-db/<list-db)]
            (is (= [] repos))
            (is (= [] @ipc-calls))
            (is (= [] @start-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! util/electron? original-electron?)
                       (set! state/get-current-repo original-current-repo)
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest electron-list-db-failover-switches-after-third-server-unavailable-failure
  (async done
         (let [results (atom [:transport-error :transport-error :transport-error])
               events (atom [])
               current-repo-updates (atom [])
               notifications (atom [])
               originals (install-electron-failover-test-env!
                          {:current-repo "logseq_db_graph_a"
                           :repos (graph-repos "logseq_db_graph_a" "logseq_db_graph_b")
                           :results results
                           :events events
                           :current-repo-updates current-repo-updates
                           :notifications notifications})]
           (-> (p/let [first-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status first-result)))
                       _ (is (= [] @events))
                       second-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status second-result)))
                       _ (is (= [] @events))
                       third-result (<capture-result (persist-db/<list-db))]
                 (is (= :rejected (:status third-result)))
                 (is (= [nil] @current-repo-updates))
                 (is (= [[:graph/switch "logseq_db_graph_b" {:persist? false}]] @events))
                 (is (= 1 (count @notifications)))
                 (is (= :warning (second (first @notifications)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (restore-electron-failover-test-env! originals)
                            (done)))))))

(deftest electron-sse-errors-trigger-failover-after-third-server-unavailable-failure
  (async done
    (let [results (atom [])
          events (atom [])
          current-repo-updates (atom [])
          notifications (atom [])
          sse (sse-state)
          ensure-remote! #'persist-db/<ensure-remote!
          originals (install-electron-failover-test-env!
                     {:current-repo "logseq_db_graph_a"
                      :repos (graph-repos "logseq_db_graph_a" "logseq_db_graph_b")
                      :results results
                      :events events
                      :current-repo-updates current-repo-updates
                      :notifications notifications
                      :sse sse})]
      (-> (p/let [_ (ensure-remote! "logseq_db_graph_a")
                  on-error @(:on-error sse)
                  _ (is (fn? on-error))
                  _ (on-error (js/Error. "connect ECONNREFUSED"))
                  _ (is (= [] @events))
                  _ (is (= 1 (count @(:scheduled sse))))
                  _ (on-error (js/Error. "connect ECONNREFUSED"))
                  _ (is (= [] @events))
                  _ (is (= 2 (count @(:scheduled sse))))
                  _ (on-error (js/Error. "connect ECONNREFUSED"))]
            (is (= [nil] @current-repo-updates))
            (is (= [[:graph/switch "logseq_db_graph_b" {:persist? false}]] @events))
            (is (= 1 (count @notifications)))
            (is (= :warning (second (first @notifications))))
            (is (= 1 @(:close-count sse)))
            (is (= 2 (count @(:scheduled sse)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (restore-electron-failover-test-env! originals)
                       (done)))))))

(deftest electron-list-db-success-resets-server-unavailable-failure-count
  (async done
         (let [results (atom [:transport-error :success :transport-error :transport-error :transport-error])
               events (atom [])
               current-repo-updates (atom [])
               notifications (atom [])
               originals (install-electron-failover-test-env!
                          {:current-repo "logseq_db_graph_a"
                           :repos (graph-repos "logseq_db_graph_a" "logseq_db_graph_b")
                           :results results
                           :events events
                           :current-repo-updates current-repo-updates
                           :notifications notifications})]
           (-> (p/let [first-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status first-result)))
                       success-result (<capture-result (persist-db/<list-db))
                       _ (is (= :resolved (:status success-result)))
                       _ (is (= [] @events))
                       second-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status second-result)))
                       third-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status third-result)))
                       _ (is (= [] @events))
                       fourth-result (<capture-result (persist-db/<list-db))]
                 (is (= :rejected (:status fourth-result)))
                 (is (= [[:graph/switch "logseq_db_graph_b" {:persist? false}]] @events)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (restore-electron-failover-test-env! originals)
                            (done)))))))

(deftest electron-list-db-app-level-errors-do-not-count-toward-failover
  (async done
         (let [results (atom [:app-error :app-error :app-error :transport-error :transport-error :transport-error])
               events (atom [])
               current-repo-updates (atom [])
               notifications (atom [])
               originals (install-electron-failover-test-env!
                          {:current-repo "logseq_db_graph_a"
                           :repos (graph-repos "logseq_db_graph_a" "logseq_db_graph_b")
                           :results results
                           :events events
                           :current-repo-updates current-repo-updates
                           :notifications notifications})]
           (-> (p/let [first-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status first-result)))
                       second-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status second-result)))
                       third-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status third-result)))
                       _ (is (= [] @events))
                       fourth-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status fourth-result)))
                       fifth-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status fifth-result)))
                       _ (is (= [] @events))
                       sixth-result (<capture-result (persist-db/<list-db))]
                 (is (= :rejected (:status sixth-result)))
                 (is (= [[:graph/switch "logseq_db_graph_b" {:persist? false}]] @events)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (restore-electron-failover-test-env! originals)
                            (done)))))))

(deftest electron-list-db-failover-without-fallback-clears-current-repo
  (async done
         (let [results (atom [:transport-error :transport-error :transport-error])
               events (atom [])
               current-repo-updates (atom [])
               notifications (atom [])
               originals (install-electron-failover-test-env!
                          {:current-repo "logseq_db_graph_a"
                           :repos (graph-repos "logseq_db_graph_a")
                           :results results
                           :events events
                           :current-repo-updates current-repo-updates
                           :notifications notifications})]
           (-> (p/let [first-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status first-result)))
                       second-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status second-result)))
                       third-result (<capture-result (persist-db/<list-db))]
                 (is (= :rejected (:status third-result)))
                 (is (= [nil] @current-repo-updates))
                 (is (= [] @events))
                 (is (= 1 (count @notifications)))
                 (is (= :warning (second (first @notifications)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (restore-electron-failover-test-env! originals)
                            (done)))))))

(deftest electron-list-db-late-stale-failure-does-not-increment-new-graph-count
  (async done
         (let [late-reject! (atom nil)
               late-promise (js/Promise. (fn [_resolve reject]
                                           (reset! late-reject! reject)))
               results (atom [(fn [] late-promise)
                              :transport-error :transport-error :transport-error
                              :transport-error :transport-error])
               events (atom [])
               current-repo-updates (atom [])
               notifications (atom [])
               originals (install-electron-failover-test-env!
                          {:current-repo "logseq_db_graph_a"
                           :repos (graph-repos "logseq_db_graph_a" "logseq_db_graph_b")
                           :results results
                           :events events
                           :current-repo-updates current-repo-updates
                           :notifications notifications})
               late-result (<capture-result (persist-db/<list-db))]
           (-> (p/let [first-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status first-result)))
                       second-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status second-result)))
                       third-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status third-result)))
                       _ (is (= [[:graph/switch "logseq_db_graph_b" {:persist? false}]] @events))
                       _ (swap! state/state assoc :git/current-repo "logseq_db_graph_b")
                       fourth-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status fourth-result)))
                       fifth-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status fifth-result)))
                       _ (when @late-reject!
                           (@late-reject! (js/Error. "Failed to fetch")))
                       stale-result late-result]
                 (is (= :rejected (:status stale-result)))
                 (is (= [[:graph/switch "logseq_db_graph_b" {:persist? false}]] @events)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (restore-electron-failover-test-env! originals)
                            (done)))))))

(deftest electron-close-db-disconnects-current-remote-runtime
  (async done
    (let [invoke-calls (atom [])
          stop-calls (atom [])
          fake-client {:repo "logseq_db_graph_a"
                       :client {:base-url "http://127.0.0.1:9101"}}
          original-electron? util/electron?
          original-invoke! remote/invoke!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (reset! persist-db/remote-db fake-client)
      (reset! persist-db/remote-repo "logseq_db_graph_a")
      (set! util/electron? (constantly true))
      (set! remote/invoke! (fn [client method args]
                             (swap! invoke-calls conj [client method args])
                             (p/resolved nil)))
      (set! remote/stop! (fn [client]
                           (swap! stop-calls conj client)
                           (p/resolved true)))
      (-> (p/let [_ (persist-db/<close-db "logseq_db_graph_a")]
            (is (= [[(:client fake-client) "thread-api/close-db" ["logseq_db_graph_a"]]]
                   @invoke-calls))
            (is (= [fake-client] @stop-calls))
            (is (nil? @persist-db/remote-db))
            (is (nil? @persist-db/remote-repo)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! util/electron? original-electron?)
                       (set! remote/invoke! original-invoke!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest electron-close-db-for-other-repo-does-not-bootstrap-runtime
  (async done
    (let [invoke-calls (atom [])
          stop-calls (atom [])
          fake-client {:repo "logseq_db_graph_a"
                       :client {:base-url "http://127.0.0.1:9101"}}
          original-electron? util/electron?
          original-invoke! remote/invoke!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (reset! persist-db/remote-db fake-client)
      (reset! persist-db/remote-repo "logseq_db_graph_a")
      (set! util/electron? (constantly true))
      (set! remote/invoke! (fn [client method args]
                             (swap! invoke-calls conj [client method args])
                             (p/resolved nil)))
      (set! remote/stop! (fn [client]
                           (swap! stop-calls conj client)
                           (p/resolved true)))
      (-> (p/let [_ (persist-db/<close-db "logseq_db_graph_b")]
            (is (empty? @invoke-calls))
            (is (empty? @stop-calls))
            (is (= fake-client @persist-db/remote-db))
            (is (= "logseq_db_graph_a" @persist-db/remote-repo)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! util/electron? original-electron?)
                       (set! remote/invoke! original-invoke!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest start-db-worker-skips-in-node-test-runtime
  (async done
    (let [invoke-calls (atom [])
          original-node-test? util/node-test?
          original-invoke state/<invoke-db-worker]
      (set! util/node-test? true)
      (set! state/<invoke-db-worker (fn [& args]
                                      (swap! invoke-calls conj args)
                                      (p/resolved :ok)))
      (-> (p/let [_ (browser/start-db-worker!)]
            (is (= [] @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally
           (fn []
             (set! util/node-test? original-node-test?)
             (set! state/<invoke-db-worker original-invoke)
             (done)))))))

(deftest browser-export-db-on-electron-triggers-worker-base64-export-then-local-backup
  (async done
    (let [ipc-calls (atom [])
          worker-export-calls (atom [])
          original-electron? util/electron?
          original-ipc ipc/ipc
          original-invoke state/<invoke-db-worker]
      (set! util/electron? (constantly true))
      (set! ipc/ipc (fn [& args]
                      (swap! ipc-calls conj args)
                      (p/resolved :ok)))
      (set! state/<invoke-db-worker
            (fn [qkw & _]
              (swap! worker-export-calls conj qkw)
              (case qkw
                :thread-api/export-db-base64 (p/resolved "c3FsaXRlLWJ5dGVz")
                (p/rejected (ex-info "unexpected worker call" {:qkw qkw})))))
      (-> (protocol/<export-db (browser/->InBrowser) "logseq_db_graph_a" {})
          (p/then (fn [_]
                    (is (= [[:db-export "logseq_db_graph_a" false]]
                           @ipc-calls))
                    (is (= [:thread-api/export-db-base64]
                           @worker-export-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally
           (fn []
             (set! util/electron? original-electron?)
             (set! ipc/ipc original-ipc)
             (set! state/<invoke-db-worker original-invoke)
             (done)))))))

(deftest browser-import-db-uses-base64-thread-api
  (async done
    (let [worker-import-calls (atom [])
          original-invoke state/<invoke-db-worker
          payload (.from js/Buffer "sqlite-bytes")]
      (set! state/<invoke-db-worker
            (fn [qkw & args]
              (swap! worker-import-calls conj [qkw args])
              (case qkw
                :thread-api/import-db-base64 (p/resolved nil)
                (p/rejected (ex-info "unexpected worker call" {:qkw qkw})))) )
      (-> (protocol/<import-db (browser/->InBrowser) "logseq_db_graph_a" payload)
          (p/then (fn [_]
                    (is (= [[:thread-api/import-db-base64 ["logseq_db_graph_a" "c3FsaXRlLWJ5dGVz"]]]
                           @worker-import-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally
           (fn []
             (set! state/<invoke-db-worker original-invoke)
             (done)))))))

(deftest browser-import-db-accepts-arraybuffer-payload
  (async done
    (let [worker-import-calls (atom [])
          original-invoke state/<invoke-db-worker
          payload (.-buffer (.encode (js/TextEncoder.) "sqlite-bytes"))]
      (set! state/<invoke-db-worker
            (fn [qkw & args]
              (swap! worker-import-calls conj [qkw args])
              (case qkw
                :thread-api/import-db-base64 (p/resolved nil)
                (p/rejected (ex-info "unexpected worker call" {:qkw qkw})))))
      (-> (protocol/<import-db (browser/->InBrowser) "logseq_db_graph_a" payload)
          (p/then (fn [_]
                    (is (= [[:thread-api/import-db-base64 ["logseq_db_graph_a" "c3FsaXRlLWJ5dGVz"]]]
                           @worker-import-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally
           (fn []
             (set! state/<invoke-db-worker original-invoke)
             (done)))))))
