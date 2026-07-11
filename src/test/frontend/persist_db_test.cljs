(ns frontend.persist-db-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [electron.ipc :as ipc]
            [frontend.common.thread-api :as thread-api]
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

  (<open-and-fetch-schema [_ repo _opts]
    (p/resolved {:schema {:repo repo}}))

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
  (remove-watch state/state :sync-markdown-mirror-setting)
  (reset! persist-db/remote-db nil)
  (reset! persist-db/remote-repo nil)
  (reset! persist-db/remote-runtime-state nil)
  (reset! state/*db-worker nil)
  (reset! ldb/*transact-fn nil)
  (swap! state/state assoc :electron/user-cfgs {}))

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

                   "thread-api/markdown-mirror-set-enabled"
                   (p/resolved {:status 200
                                :body (success-body nil)})

                   "thread-api/update-thread-atom"
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
  [{:keys [current-repo repos results runtime-results events current-repo-updates notifications sse ipc-calls]
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
                    (when ipc-calls
                      (swap! ipc-calls conj [channel repo]))
                    (case channel
                      "db-worker-runtime"
                      (let [result (when runtime-results
                                     (first @runtime-results))]
                        (when runtime-results
                          (swap! runtime-results #(vec (rest %))))
                        (cond
                          (= :runtime-error result)
                          (p/rejected (ex-info "db-worker runtime failed"
                                               {:code :server-start-failed}))

                          (fn? result)
                          (result repo)

                          :else
                          (p/resolved (assoc (db-worker-runtime results sse) :repo repo))))

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

(deftest search-index-build-progress-ignores-vector-stage-in-ui-state
  (let [repo "logseq_db_graph_a"
        progress! (get @thread-api/*thread-apis :thread-api/search-index-build-progress)
        original-state @state/state]
    (try
      (reset! state/state (assoc original-state
                                  :git/current-repo repo
                                  :search/index-build {:visible? false
                                                       :running? false
                                                       :status :idle}))
      (progress! repo {:status :running
                       :stage :vector-index
                       :progress 42
                       :processed 420
                       :total 1000})
      (is (= {:visible? false
              :running? false
              :status :idle}
             (:search/index-build @state/state)))
      (finally
        (reset! state/state original-state)))))

(deftest search-index-build-progress-marks-current-graph-ready-after-fts-completed
  (let [repo "logseq_db_graph_a"
        progress! (get @thread-api/*thread-apis :thread-api/search-index-build-progress)
        original-state @state/state
        events (atom [])]
    (try
      (state/replace-state! (assoc original-state :git/current-repo repo))
      (with-redefs [state/pub-event! (fn [event]
                                       (swap! events conj event)
                                       (p/resolved nil))]
        (progress! repo {:build-id "build-1"
                         :status :completed
                         :stage :search-index
                         :progress 100
                         :processed 1
                         :total 1})
        (is (= [[:graph/ready repo]] @events)))
      (finally
        (state/replace-state! original-state)))))

(deftest search-index-build-progress-keeps-completed-build-visible-through-idle
  (let [repo "logseq_db_graph_a"
        build-id "build-1"
        progress! (get @thread-api/*thread-apis :thread-api/search-index-build-progress)
        original-state @state/state]
    (try
      (state/replace-state! (assoc original-state :git/current-repo repo))
      (progress! repo {:build-id build-id
                       :status :completed
                       :progress 100
                       :processed 1
                       :total 1})
      (progress! repo {:build-id build-id
                       :status :idle})
      (is (= {:visible? true
              :running? false
              :status :completed
              :repo repo
              :build-id build-id
              :stage :search-index
              :progress 100
              :processed 1
              :total 1}
             (state/get-state :search/index-build)))
      (finally
        (progress! repo {:build-id build-id
                         :status :running})
        (state/replace-state! original-state)))))

(deftest event-stream-error-loggable-throttles-after-powers-of-two
  (let [loggable? #'persist-db/event-stream-error-loggable?]
    (is (false? (loggable? 0)))
    (is (= #{1 2 4 8 16 32 64 128}
           (set (filter loggable? (range 1 130)))))))

(deftest electron-open-and-fetch-schema-starts-remote-runtime
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
      (-> (p/let [result (persist-db/<open-and-fetch-schema "logseq_db_graph_a" {})]
            (is (= {:schema {:repo "logseq_db_graph_a"}} result))
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

(deftest electron-open-and-fetch-schema-reuses-runtime-for-same-repo-and-restarts-for-new-repo
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

(deftest electron-ensure-remote-only-if-current-skips-stale-before-stopping-current-runtime
  (async done
    (let [ipc-calls (atom [])
          start-calls (atom [])
          stop-calls (atom [])
          ensure-remote! #'persist-db/<ensure-remote!
          wrapped-worker (fn [& _] nil)
          graph-b-client (->FakeRemote "logseq_db_graph_b" wrapped-worker)
          original-state @state/state
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (reset! state/state (assoc original-state :git/current-repo "logseq_db_graph_b"))
      (reset! persist-db/remote-db graph-b-client)
      (reset! persist-db/remote-repo "logseq_db_graph_b")
      (reset! state/*db-worker wrapped-worker)
      (set! ipc/ipc (fn [channel repo]
                      (swap! ipc-calls conj [channel repo])
                      (p/resolved {:repo repo})))
      (set! remote/start! (fn [{:keys [repo]}]
                            (swap! start-calls conj repo)
                            (->FakeRemote repo (fn [& _] nil))))
      (set! remote/stop! (fn [client]
                           (swap! stop-calls conj (:repo client))
                           (p/resolved true)))
      (-> (p/let [result (ensure-remote! "logseq_db_graph_a" {:only-if-current? true})]
            (is (nil? result))
            (is (= [] @ipc-calls))
            (is (= [] @start-calls))
            (is (= [] @stop-calls))
            (is (= graph-b-client @persist-db/remote-db))
            (is (= "logseq_db_graph_b" @persist-db/remote-repo))
            (is (= wrapped-worker @state/*db-worker)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (reset! state/state original-state)
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest electron-ensure-remote-only-if-current-stops-stale-started-client
  (async done
    (let [ipc-calls (atom [])
          start-calls (atom [])
          stop-calls (atom [])
          ensure-remote! #'persist-db/<ensure-remote!
          wrapped-worker-a (fn [& _] nil)
          wrapped-worker-b (fn [& _] nil)
          graph-b-client (->FakeRemote "logseq_db_graph_b" wrapped-worker-b)
          original-state @state/state
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (reset! state/state (assoc original-state :git/current-repo "logseq_db_graph_a"))
      (set! ipc/ipc (fn [channel repo]
                      (swap! ipc-calls conj [channel repo])
                      (p/resolved {:base-url "http://127.0.0.1:9101"
                                   :auth-token nil
                                   :repo repo})))
      (set! remote/start! (fn [{:keys [repo]}]
                            (swap! start-calls conj repo)
                            (swap! state/state assoc :git/current-repo "logseq_db_graph_b")
                            (reset! persist-db/remote-db graph-b-client)
                            (reset! persist-db/remote-repo "logseq_db_graph_b")
                            (reset! state/*db-worker wrapped-worker-b)
                            (->FakeRemote repo wrapped-worker-a)))
      (set! remote/stop! (fn [client]
                           (swap! stop-calls conj (:repo client))
                           (p/resolved true)))
      (-> (p/let [result (ensure-remote! "logseq_db_graph_a" {:only-if-current? true})]
            (is (nil? result))
            (is (= [["db-worker-runtime" "logseq_db_graph_a"]
                    ["releaseDbWorkerRuntime" "logseq_db_graph_a"]]
                   @ipc-calls))
            (is (= ["logseq_db_graph_a"] @start-calls))
            (is (= ["logseq_db_graph_a"] @stop-calls))
            (is (= graph-b-client @persist-db/remote-db))
            (is (= "logseq_db_graph_b" @persist-db/remote-repo))
            (is (= wrapped-worker-b @state/*db-worker)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (reset! state/state original-state)
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest electron-ensure-remote-only-if-current-skips-stale-after-stop-before-runtime-ipc
  (async done
    (let [ipc-calls (atom [])
          start-calls (atom [])
          stop-calls (atom [])
          ensure-remote! #'persist-db/<ensure-remote!
          wrapped-worker-a (fn [& _] nil)
          wrapped-worker-b (fn [& _] nil)
          graph-a-client (->FakeRemote "logseq_db_graph_a" wrapped-worker-a)
          graph-b-client (->FakeRemote "logseq_db_graph_b" wrapped-worker-b)
          original-state @state/state
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (reset! state/state (assoc original-state :git/current-repo "logseq_db_graph_a"))
      (reset! persist-db/remote-db graph-a-client)
      (reset! persist-db/remote-repo nil)
      (reset! state/*db-worker wrapped-worker-a)
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
                           (swap! state/state assoc :git/current-repo "logseq_db_graph_b")
                           (reset! persist-db/remote-db graph-b-client)
                           (reset! persist-db/remote-repo "logseq_db_graph_b")
                           (reset! state/*db-worker wrapped-worker-b)
                           (p/resolved true)))
      (-> (p/let [result (ensure-remote! "logseq_db_graph_a" {:only-if-current? true})]
            (is (nil? result))
            (is (= [] @ipc-calls))
            (is (= [] @start-calls))
            (is (= ["logseq_db_graph_a"] @stop-calls))
            (is (= graph-b-client @persist-db/remote-db))
            (is (= "logseq_db_graph_b" @persist-db/remote-repo))
            (is (= wrapped-worker-b @state/*db-worker)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (reset! state/state original-state)
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest electron-ensure-remote-only-if-current-does-not-release-fresh-same-repo-runtime
  (async done
    (let [ipc-calls (atom [])
          start-calls (atom [])
          stop-calls (atom [])
          ensure-remote! #'persist-db/<ensure-remote!
          stale-worker (fn [& _] nil)
          fresh-worker (fn [& _] nil)
          fresh-client (->FakeRemote "logseq_db_graph_a" fresh-worker)
          original-state @state/state
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (reset! state/state (assoc original-state :git/current-repo "logseq_db_graph_a"))
      (set! ipc/ipc (fn [channel repo]
                      (swap! ipc-calls conj [channel repo])
                      (p/resolved {:base-url "http://127.0.0.1:9101"
                                   :auth-token nil
                                   :repo repo})))
      (set! remote/start! (fn [{:keys [repo]}]
                            (swap! start-calls conj repo)
                            (swap! state/state assoc :git/current-repo "logseq_db_graph_b")
                            (->FakeRemote repo stale-worker)))
      (set! remote/stop! (fn [client]
                           (swap! stop-calls conj (:repo client))
                           (swap! state/state assoc :git/current-repo "logseq_db_graph_a")
                           (reset! persist-db/remote-db fresh-client)
                           (reset! persist-db/remote-repo "logseq_db_graph_a")
                           (reset! state/*db-worker fresh-worker)
                           (p/resolved true)))
      (-> (p/let [result (ensure-remote! "logseq_db_graph_a" {:only-if-current? true})]
            (is (nil? result))
            (is (= [["db-worker-runtime" "logseq_db_graph_a"]]
                   @ipc-calls))
            (is (= ["logseq_db_graph_a"] @start-calls))
            (is (= ["logseq_db_graph_a"] @stop-calls))
            (is (= fresh-client @persist-db/remote-db))
            (is (= "logseq_db_graph_a" @persist-db/remote-repo))
            (is (= fresh-worker @state/*db-worker)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (reset! state/state original-state)
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
      (-> (p/let [first-result (persist-db/<open-and-fetch-schema "demo" {})
                  second-result (persist-db/<open-and-fetch-schema "logseq_db_demo" {})]
            (is (= {:schema {:repo "demo"}} first-result))
            (is (= {:schema {:repo "logseq_db_demo"}} second-result))
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

(deftest electron-open-and-fetch-schema-then-set-current-repo-does-not-rebind-runtime
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
                  _ (persist-db/<open-and-fetch-schema repo {})
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

(deftest electron-ensure-remote-pushes-markdown-mirror-setting-on-start-test
  (async done
    (let [worker-calls (atom [])
          ensure-remote! #'persist-db/<ensure-remote!
          original-state @state/state
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (reset! state/state (assoc-in original-state
                                    [:config "logseq_db_graph_a" :feature/markdown-mirror?]
                                    true))
      (set! ipc/ipc (fn [channel repo]
                      (is (= "db-worker-runtime" channel))
                      (p/resolved {:base-url "http://127.0.0.1:9101"
                                   :auth-token nil
                                   :repo repo})))
      (set! remote/start! (fn [{:keys [repo]}]
                            (->FakeRemote repo
                                          (fn [qkw & args]
                                            (swap! worker-calls conj [qkw args])
                                            (p/resolved nil)))))
      (set! remote/stop! (fn [_] (p/resolved true)))
      (-> (p/let [_ (ensure-remote! "logseq_db_graph_a")]
            (is (= [:thread-api/markdown-mirror-set-enabled
                    ["logseq_db_graph_a" true]]
                   (first (filter #(= :thread-api/markdown-mirror-set-enabled (first %))
                                  @worker-calls)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (reset! state/state original-state)
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest electron-ensure-remote-pushes-graph-markdown-mirror-setting-on-start-test
  (async done
    (let [worker-calls (atom [])
          ensure-remote! #'persist-db/<ensure-remote!
          original-state @state/state
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (reset! state/state (-> original-state
                              (assoc :electron/user-cfgs {:feature/markdown-mirror? true})
                              (assoc-in [:config ::state/global-config] {:feature/markdown-mirror? true})
                              (assoc-in [:config "logseq_db_graph_a"] {})
                              (assoc-in [:config "logseq_db_graph_b"] {:feature/markdown-mirror? true})))
      (set! ipc/ipc (fn [channel repo]
                      (is (= "db-worker-runtime" channel))
                      (p/resolved {:base-url "http://127.0.0.1:9101"
                                   :auth-token nil
                                   :repo repo})))
      (set! remote/start! (fn [{:keys [repo]}]
                            (->FakeRemote repo
                                          (fn [qkw & args]
                                            (swap! worker-calls conj [qkw args])
                                            (p/resolved nil)))))
      (set! remote/stop! (fn [_] (p/resolved true)))
      (-> (p/let [_ (ensure-remote! "logseq_db_graph_a")
                  _ (ensure-remote! "logseq_db_graph_b")]
            (is (= [[:thread-api/markdown-mirror-set-enabled
                     ["logseq_db_graph_a" false]]
                    [:thread-api/markdown-mirror-set-enabled
                     ["logseq_db_graph_b" true]]]
                   (filterv #(= :thread-api/markdown-mirror-set-enabled (first %))
                            @worker-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (reset! state/state original-state)
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest electron-ensure-remote-uses-graph-markdown-mirror-setting-before-sync-test
  (async done
    (let [ipc-calls (atom [])
          worker-calls (atom [])
          ensure-remote! #'persist-db/<ensure-remote!
          original-state @state/state
          original-electron? util/electron?
          original-ipc ipc/ipc
          original-start! remote/start!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (swap! state/state
             (fn [state]
               (-> state
                   (assoc :electron/user-cfgs nil)
                   (assoc-in [:config "logseq_db_graph_a" :feature/markdown-mirror?] true))))
      (set! util/electron? (constantly true))
      (set! ipc/ipc (fn [channel & args]
                      (swap! ipc-calls conj (into [channel] args))
                      (case channel
                        "db-worker-runtime"
                        (p/resolved {:base-url "http://127.0.0.1:9101"
                                     :auth-token nil
                                     :repo (first args)})

                        (p/resolved nil))))
      (set! remote/start! (fn [{:keys [repo]}]
                            (->FakeRemote repo
                                          (fn [qkw & args]
                                            (swap! worker-calls conj [qkw args])
                                            (p/resolved nil)))))
      (set! remote/stop! (fn [_] (p/resolved true)))
      (-> (p/let [_ (ensure-remote! "logseq_db_graph_a")]
            (is (= [["db-worker-runtime" "logseq_db_graph_a"]]
                   @ipc-calls))
            (is (= [:thread-api/markdown-mirror-set-enabled
                    ["logseq_db_graph_a" true]]
                   (first (filter #(= :thread-api/markdown-mirror-set-enabled (first %))
                                  @worker-calls)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (reset! state/state original-state)
                       (set! util/electron? original-electron?)
                       (set! ipc/ipc original-ipc)
                       (set! remote/start! original-start!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

(deftest browser-open-and-fetch-schema-pushes-graph-markdown-mirror-setting-test
  (async done
    (let [worker-calls (atom [])
          original-state @state/state
          original-electron? util/electron?
          original-invoke state/<invoke-db-worker]
      (reset! state/state (-> original-state
                              (assoc :electron/user-cfgs {:feature/markdown-mirror? true})
                              (assoc-in [:config ::state/global-config] {:feature/markdown-mirror? true})
                              (assoc-in [:config "logseq_db_graph_a"] {})))
      (set! util/electron? (constantly true))
      (set! state/<invoke-db-worker
            (fn [qkw & args]
              (swap! worker-calls conj [qkw args])
              (case qkw
                :thread-api/create-or-open-db (p/resolved nil)
                :thread-api/markdown-mirror-set-enabled (p/resolved nil)
                :thread-api/get-db-schema (p/resolved {:schema {:repo (first args)}})
                (p/rejected (ex-info "unexpected worker call" {:qkw qkw})))))
      (-> (protocol/<open-and-fetch-schema (browser/->InBrowser) "logseq_db_graph_a" {})
          (p/then (fn [_]
                    (is (= [:thread-api/markdown-mirror-set-enabled
                            ["logseq_db_graph_a" false]]
                           (first (filter #(= :thread-api/markdown-mirror-set-enabled (first %))
                                          @worker-calls))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (reset! state/state original-state)
                       (set! util/electron? original-electron?)
                       (set! state/<invoke-db-worker original-invoke)
                       (done)))))))

(deftest graph-config-change-syncs-markdown-mirror-worker-setting-test
  (async done
    (let [worker-calls (atom [])
          sync-watch! #(when-let [f (resolve 'frontend.persist-db/sync-markdown-mirror-setting-watch!)]
                         (f))
          repo "logseq_db_graph_a"
          original-state @state/state
          original-invoke state/<invoke-db-worker]
      (reset-runtime-state!)
      (reset! state/state (assoc original-state
                                 :git/current-repo repo
                                 :config {repo {}}))
      (reset! state/*db-worker (fn [& _] nil))
      (set! state/<invoke-db-worker
            (fn [qkw & args]
              (swap! worker-calls conj [qkw args])
              (p/resolved nil)))
      (sync-watch!)
      (swap! state/state assoc-in [:config repo :feature/markdown-mirror?] true)
      (-> (p/delay 0)
          (p/then (fn [_]
                    (is (= [[:thread-api/markdown-mirror-set-enabled
                             [repo true]]]
                           @worker-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (remove-watch state/state :sync-markdown-mirror-setting)
                       (reset! state/state original-state)
                       (set! state/<invoke-db-worker original-invoke)
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

(deftest electron-list-db-server-unavailable-failures-do-not-switch-graph
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
                       third-result (<capture-result (persist-db/<list-db))
                       _ (p/delay 50)]
                 (is (= :rejected (:status third-result)))
                 (is (= [] @current-repo-updates))
                 (is (= [] @events))
                 (is (= [] @notifications)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (restore-electron-failover-test-env! originals)
                            (done)))))))

(deftest electron-sse-error-triggers-runtime-recovery
  (async done
    (let [results (atom [])
          events (atom [])
          current-repo-updates (atom [])
          notifications (atom [])
          ipc-calls (atom [])
          sse (sse-state)
          ensure-remote! #'persist-db/<ensure-remote!
          originals (install-electron-failover-test-env!
                     {:current-repo "logseq_db_graph_a"
                      :repos (graph-repos "logseq_db_graph_a" "logseq_db_graph_b")
                      :results results
                      :events events
                      :current-repo-updates current-repo-updates
                      :notifications notifications
                      :sse sse
                      :ipc-calls ipc-calls})]
      (-> (p/let [_ (ensure-remote! "logseq_db_graph_a")
                  on-error @(:on-error sse)
                  _ (is (fn? on-error))
                  _ (on-error (js/Error. "connect ECONNREFUSED"))
                  _ (is (= [] @events))
                  _ (p/delay 50)]
            (is (= [] @current-repo-updates))
            (is (= [] @events))
            (is (= [] @notifications))
            (is (= 1 @(:close-count sse)))
            (is (= [["db-worker-runtime" "logseq_db_graph_a"]
                    ["releaseDbWorkerRuntime" "logseq_db_graph_a"]
                    ["db-worker-runtime" "logseq_db_graph_a"]]
                   @ipc-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (restore-electron-failover-test-env! originals)
                       (done)))))))

(deftest electron-list-db-success-does-not-trigger-runtime-recovery
  (async done
         (let [results (atom [:success :transport-error])
               events (atom [])
               current-repo-updates (atom [])
               notifications (atom [])
               ipc-calls (atom [])
               originals (install-electron-failover-test-env!
                          {:current-repo "logseq_db_graph_a"
                           :repos (graph-repos "logseq_db_graph_a" "logseq_db_graph_b")
                           :results results
                           :events events
                           :current-repo-updates current-repo-updates
                           :notifications notifications
                           :ipc-calls ipc-calls})]
           (-> (p/let [success-result (<capture-result (persist-db/<list-db))
                       _ (is (= :resolved (:status success-result)))
                       _ (is (= [] @events))
                       failure-result (<capture-result (persist-db/<list-db))
                       _ (p/delay 50)]
                 (is (= :rejected (:status failure-result)))
                 (is (= [] @events))
                 (is (= [] @current-repo-updates))
                 (is (= [] @notifications))
                 (is (= [["db-worker-runtime" "logseq_db_graph_a"]
                         ["releaseDbWorkerRuntime" "logseq_db_graph_a"]
                         ["db-worker-runtime" "logseq_db_graph_a"]]
                        @ipc-calls)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (restore-electron-failover-test-env! originals)
                            (done)))))))

(deftest electron-list-db-app-level-errors-do-not-trigger-runtime-recovery
  (async done
         (let [results (atom [:app-error :app-error :app-error :transport-error])
               events (atom [])
               current-repo-updates (atom [])
               notifications (atom [])
               ipc-calls (atom [])
               originals (install-electron-failover-test-env!
                          {:current-repo "logseq_db_graph_a"
                           :repos (graph-repos "logseq_db_graph_a" "logseq_db_graph_b")
                           :results results
                           :events events
                           :current-repo-updates current-repo-updates
                           :notifications notifications
                           :ipc-calls ipc-calls})]
           (-> (p/let [first-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status first-result)))
                       second-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status second-result)))
                       third-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status third-result)))
                       _ (is (= [] @events))
                       fourth-result (<capture-result (persist-db/<list-db))
                       _ (p/delay 50)]
                 (is (= :rejected (:status fourth-result)))
                 (is (= [] @events))
                 (is (= [] @current-repo-updates))
                 (is (= [] @notifications))
                 (is (= [["db-worker-runtime" "logseq_db_graph_a"]
                         ["releaseDbWorkerRuntime" "logseq_db_graph_a"]
                         ["db-worker-runtime" "logseq_db_graph_a"]]
                        @ipc-calls)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (restore-electron-failover-test-env! originals)
                            (done)))))))

(deftest electron-list-db-server-unavailable-recovery-keeps-current-repo
  (async done
         (let [results (atom [:transport-error])
               events (atom [])
               current-repo-updates (atom [])
               notifications (atom [])
               ipc-calls (atom [])
               originals (install-electron-failover-test-env!
                          {:current-repo "logseq_db_graph_a"
                           :repos (graph-repos "logseq_db_graph_a")
                           :results results
                           :events events
                           :current-repo-updates current-repo-updates
                           :notifications notifications
                           :ipc-calls ipc-calls})]
           (-> (p/let [first-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status first-result)))
                       _ (p/delay 50)]
                 (is (= [] @current-repo-updates))
                 (is (= [] @events))
                 (is (= [] @notifications))
                 (is (= "logseq_db_graph_a" (state/get-current-repo)))
                 (is (= [["db-worker-runtime" "logseq_db_graph_a"]
                         ["releaseDbWorkerRuntime" "logseq_db_graph_a"]
                         ["db-worker-runtime" "logseq_db_graph_a"]]
                        @ipc-calls)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (restore-electron-failover-test-env! originals)
                            (done)))))))

(deftest electron-list-db-runtime-recovery-failure-notifies-without-switching
  (async done
         (let [recovery! #'persist-db/<trigger-db-worker-runtime-recovery!
               ipc-calls (atom [])
               stop-calls (atom [])
               events (atom [])
               current-repo-updates (atom [])
               notifications (atom [])
               session-id "session-a"
               remote-client (->FakeRemote "logseq_db_graph_a" (fn [& _] nil))
               original-state @state/state
               original-ipc ipc/ipc
               original-stop! remote/stop!
               original-pub-event! state/pub-event!
               original-set-current-repo! state/set-current-repo!
               original-notification-show! notification/show!]
           (reset-runtime-state!)
           (reset! state/state (assoc original-state :git/current-repo "logseq_db_graph_a"))
           (reset! persist-db/remote-db remote-client)
           (reset! persist-db/remote-repo "logseq_db_graph_a")
           (reset! persist-db/remote-runtime-state {:repo "logseq_db_graph_a"
                                                    :client remote-client
                                                    :session-id session-id
                                                    :request-failures 1
                                                    :recovery-triggered? true})
           (set! ipc/ipc (fn [channel repo]
                           (swap! ipc-calls conj [channel repo])
                           (case channel
                             "db-worker-runtime"
                             (p/rejected (ex-info "db-worker runtime failed"
                                                  {:code :server-start-failed}))

                             (p/resolved nil))))
           (set! remote/stop! (fn [client]
                                (swap! stop-calls conj (:repo client))
                                (p/resolved true)))
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
           (-> (p/let [_ (recovery! "logseq_db_graph_a" remote-client session-id)
                       _ (p/delay 0)]
                 (is (= [] @current-repo-updates))
                 (is (= [] @events))
                 (is (= "logseq_db_graph_a" (state/get-current-repo)))
                 (is (= [["releaseDbWorkerRuntime" "logseq_db_graph_a"]
                         ["db-worker-runtime" "logseq_db_graph_a"]]
                        @ipc-calls))
                 (is (= ["logseq_db_graph_a"] @stop-calls))
                 (is (= 1 (count @notifications)))
                 (is (= :error (second (first @notifications)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (reset! state/state original-state)
                            (set! ipc/ipc original-ipc)
                            (set! remote/stop! original-stop!)
                            (set! state/pub-event! original-pub-event!)
                            (set! state/set-current-repo! original-set-current-repo!)
                            (set! notification/show! original-notification-show!)
                            (reset-runtime-state!)
                            (done)))))))

(deftest electron-list-db-runtime-recovery-restarts-current-repo
  (async done
         (let [recovery! #'persist-db/<trigger-db-worker-runtime-recovery!
               ipc-calls (atom [])
               start-calls (atom [])
               stop-calls (atom [])
               events (atom [])
               current-repo-updates (atom [])
               notifications (atom [])
               session-id "session-a"
               wrapped-worker (fn [& _] nil)
               old-client (->FakeRemote "logseq_db_graph_a" (fn [& _] nil))
               new-client (->FakeRemote "logseq_db_graph_a" wrapped-worker)
               original-state @state/state
               original-ipc ipc/ipc
               original-start! remote/start!
               original-stop! remote/stop!
               original-pub-event! state/pub-event!
               original-set-current-repo! state/set-current-repo!
               original-notification-show! notification/show!]
           (reset-runtime-state!)
           (reset! state/state (assoc original-state :git/current-repo "logseq_db_graph_a"))
           (reset! persist-db/remote-db old-client)
           (reset! persist-db/remote-repo "logseq_db_graph_a")
           (reset! persist-db/remote-runtime-state {:repo "logseq_db_graph_a"
                                                    :client old-client
                                                    :session-id session-id
                                                    :request-failures 1
                                                    :recovery-triggered? true})
           (set! ipc/ipc (fn [channel repo]
                           (swap! ipc-calls conj [channel repo])
                           (case channel
                             "db-worker-runtime"
                             (p/resolved {:base-url "http://127.0.0.1:9101"
                                          :auth-token nil
                                          :repo repo})

                             (p/resolved nil))))
           (set! remote/start! (fn [{:keys [repo]}]
                                 (swap! start-calls conj repo)
                                 new-client))
           (set! remote/stop! (fn [client]
                                (swap! stop-calls conj (:repo client))
                                (p/resolved true)))
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
           (-> (p/let [_ (recovery! "logseq_db_graph_a" old-client session-id)
                       _ (p/delay 0)]
                 (is (= [["releaseDbWorkerRuntime" "logseq_db_graph_a"]
                         ["db-worker-runtime" "logseq_db_graph_a"]]
                        @ipc-calls))
                 (is (= ["logseq_db_graph_a"] @start-calls))
                 (is (= ["logseq_db_graph_a"] @stop-calls))
                 (is (= [] @current-repo-updates))
                 (is (= [] @events))
                 (is (= [] @notifications))
                 (is (= "logseq_db_graph_a" (state/get-current-repo)))
                 (is (= new-client @persist-db/remote-db))
                 (is (= "logseq_db_graph_a" @persist-db/remote-repo))
                 (is (= wrapped-worker @state/*db-worker)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (reset! state/state original-state)
                            (set! ipc/ipc original-ipc)
                            (set! remote/start! original-start!)
                            (set! remote/stop! original-stop!)
                            (set! state/pub-event! original-pub-event!)
                            (set! state/set-current-repo! original-set-current-repo!)
                            (set! notification/show! original-notification-show!)
                            (reset-runtime-state!)
                            (done)))))))

(deftest electron-list-db-runtime-recovery-does-not-release-fresh-same-repo-runtime
  (async done
         (let [recovery! #'persist-db/<trigger-db-worker-runtime-recovery!
               ipc-calls (atom [])
               stop-calls (atom [])
               events (atom [])
               current-repo-updates (atom [])
               notifications (atom [])
               old-session-id "session-a"
               fresh-session-id "session-b"
               fresh-worker (fn [& _] nil)
               old-client (->FakeRemote "logseq_db_graph_a" (fn [& _] nil))
               fresh-client (->FakeRemote "logseq_db_graph_a" fresh-worker)
               original-state @state/state
               original-ipc ipc/ipc
               original-stop! remote/stop!
               original-pub-event! state/pub-event!
               original-set-current-repo! state/set-current-repo!
               original-notification-show! notification/show!]
           (reset-runtime-state!)
           (reset! state/state (assoc original-state :git/current-repo "logseq_db_graph_a"))
           (reset! persist-db/remote-db old-client)
           (reset! persist-db/remote-repo "logseq_db_graph_a")
           (reset! persist-db/remote-runtime-state {:repo "logseq_db_graph_a"
                                                    :client old-client
                                                    :session-id old-session-id
                                                    :request-failures 1
                                                    :recovery-triggered? true})
           (set! ipc/ipc (fn [channel repo]
                           (swap! ipc-calls conj [channel repo])
                           (p/resolved nil)))
           (set! remote/stop! (fn [client]
                                (swap! stop-calls conj (:repo client))
                                (reset! persist-db/remote-db fresh-client)
                                (reset! persist-db/remote-repo "logseq_db_graph_a")
                                (reset! persist-db/remote-runtime-state {:repo "logseq_db_graph_a"
                                                                         :client fresh-client
                                                                         :session-id fresh-session-id
                                                                         :request-failures 0
                                                                         :recovery-triggered? false})
                                (reset! state/*db-worker fresh-worker)
                                (p/resolved true)))
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
           (-> (p/let [_ (recovery! "logseq_db_graph_a" old-client old-session-id)
                       _ (p/delay 0)]
                 (is (= [] @ipc-calls))
                 (is (= ["logseq_db_graph_a"] @stop-calls))
                 (is (= [] @current-repo-updates))
                 (is (= [] @events))
                 (is (= [] @notifications))
                 (is (= "logseq_db_graph_a" (state/get-current-repo)))
                 (is (= fresh-client @persist-db/remote-db))
                 (is (= "logseq_db_graph_a" @persist-db/remote-repo))
                 (is (= fresh-worker @state/*db-worker)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (reset! state/state original-state)
                            (set! ipc/ipc original-ipc)
                            (set! remote/stop! original-stop!)
                            (set! state/pub-event! original-pub-event!)
                            (set! state/set-current-repo! original-set-current-repo!)
                            (set! notification/show! original-notification-show!)
                            (reset-runtime-state!)
                            (done)))))))

(deftest electron-active-request-failure-ignores-app-errors
  (async done
         (let [record-failure! #'persist-db/record-active-request-failure!
               repo "logseq_db_graph_a"
               session-id "session-a"
               ipc-calls (atom [])
               start-calls (atom [])
               stop-calls (atom [])
               wrapped-worker (fn [& _] nil)
               old-client (->FakeRemote repo (fn [& _] nil))
               new-client (->FakeRemote repo wrapped-worker)
               app-error (ex-info "repo locked" {:status 409
                                                 :code :repo-locked})
               transport-error (js/Error. "Failed to fetch")
               original-state @state/state
               original-ipc ipc/ipc
               original-start! remote/start!
               original-stop! remote/stop!
               original-notification-show! notification/show!]
           (reset-runtime-state!)
           (reset! state/state (assoc original-state :git/current-repo repo))
           (reset! persist-db/remote-db old-client)
           (reset! persist-db/remote-repo repo)
           (reset! persist-db/remote-runtime-state {:repo repo
                                                    :client old-client
                                                    :session-id session-id
                                                    :request-failures 0
                                                    :recovery-triggered? false})
           (set! ipc/ipc (fn [channel runtime-repo]
                           (swap! ipc-calls conj [channel runtime-repo])
                           (case channel
                             "db-worker-runtime"
                             (p/resolved {:base-url "http://127.0.0.1:9101"
                                          :auth-token nil
                                          :repo runtime-repo})

                             (p/resolved nil))))
           (set! remote/start! (fn [{:keys [repo]}]
                                 (swap! start-calls conj repo)
                                 new-client))
           (set! remote/stop! (fn [client]
                                (swap! stop-calls conj (:repo client))
                                (p/resolved true)))
           (set! notification/show! (fn [_content _status] nil))
           (-> (p/let [_ (record-failure! repo session-id app-error)
                       _ (record-failure! repo session-id app-error)
                       _ (record-failure! repo session-id app-error)
                       _ (p/delay 0)
                       _ (is (= [] @ipc-calls))
                       _ (record-failure! repo session-id transport-error)
                       _ (p/delay 0)]
                 (is (= [["releaseDbWorkerRuntime" repo]
                         ["db-worker-runtime" repo]]
                        @ipc-calls))
                 (is (= [repo] @start-calls))
                 (is (= [repo] @stop-calls))
                 (is (= new-client @persist-db/remote-db))
                 (is (= repo @persist-db/remote-repo))
                 (is (= wrapped-worker @state/*db-worker)))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (reset! state/state original-state)
                            (set! ipc/ipc original-ipc)
                            (set! remote/start! original-start!)
                            (set! remote/stop! original-stop!)
                            (set! notification/show! original-notification-show!)
                            (reset-runtime-state!)
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
               ipc-calls (atom [])
               originals (install-electron-failover-test-env!
                          {:current-repo "logseq_db_graph_a"
                           :repos (graph-repos "logseq_db_graph_a" "logseq_db_graph_b")
                           :results results
                           :events events
                           :current-repo-updates current-repo-updates
                           :notifications notifications
                           :ipc-calls ipc-calls})
               late-result (<capture-result (persist-db/<list-db))]
           (-> (p/let [first-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status first-result)))
                       second-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status second-result)))
                       third-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status third-result)))
                       _ (p/delay 50)
                       _ (is (= [] @events))
                       fourth-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status fourth-result)))
                       fifth-result (<capture-result (persist-db/<list-db))
                       _ (is (= :rejected (:status fifth-result)))
                       _ (when @late-reject!
                           (@late-reject! (js/Error. "Failed to fetch")))
                       stale-result late-result
                       _ (p/delay 50)]
                 (is (= :rejected (:status stale-result)))
                 (is (= [] @events))
                 (is (= [] @current-repo-updates))
                 (is (= [] @notifications)))
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

(deftest browser-export-db-on-electron-triggers-local-backup-without-worker-export
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
              (p/rejected (ex-info "unexpected worker call" {:qkw qkw}))))
      (-> (protocol/<export-db (browser/->InBrowser) "logseq_db_graph_a" {})
          (p/then (fn [_]
                    (is (= [[:db-export "logseq_db_graph_a" false]]
                           @ipc-calls))
                    (is (empty? @worker-export-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally
           (fn []
             (set! util/electron? original-electron?)
             (set! ipc/ipc original-ipc)
             (set! state/<invoke-db-worker original-invoke)
             (done)))))))

(deftest browser-export-db-return-data-uses-binary-thread-api
  (async done
    (let [worker-calls (atom [])
          payload (js/Uint8Array. #js [1 2 3])
          original-electron? util/electron?
          original-invoke state/<invoke-db-worker]
      (set! util/electron? (constantly false))
      (set! state/<invoke-db-worker
            (fn [qkw & args]
              (swap! worker-calls conj (into [qkw] args))
              (case qkw
                :thread-api/export-db-binary (p/resolved payload)
                :thread-api/export-db-base64 (p/rejected (ex-info "base64 export should not run" {}))
                (p/rejected (ex-info "unexpected worker call" {:qkw qkw})))))
      (-> (protocol/<export-db (browser/->InBrowser) "logseq_db_graph_a" {:return-data? true})
          (p/then (fn [result]
                    (is (identical? payload result))
                    (is (= [[:thread-api/export-db-binary "logseq_db_graph_a"]]
                           @worker-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally
           (fn []
             (set! util/electron? original-electron?)
             (set! state/<invoke-db-worker original-invoke)
             (done)))))))

(deftest browser-import-db-uses-binary-thread-api
  (async done
    (let [worker-import-calls (atom [])
          original-invoke state/<invoke-db-worker
          payload (.from js/Buffer "sqlite-bytes")]
      (set! state/<invoke-db-worker
            (fn [qkw & args]
              (swap! worker-import-calls conj [qkw args])
              (case qkw
                :thread-api/import-db-binary (p/resolved nil)
                (p/rejected (ex-info "unexpected worker call" {:qkw qkw})))) )
      (-> (protocol/<import-db (browser/->InBrowser) "logseq_db_graph_a" payload)
          (p/then (fn [_]
                    (is (= [[:thread-api/import-db-binary ["logseq_db_graph_a" payload]]]
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
                :thread-api/import-db-binary (p/resolved nil)
                (p/rejected (ex-info "unexpected worker call" {:qkw qkw})))))
      (-> (protocol/<import-db (browser/->InBrowser) "logseq_db_graph_a" payload)
          (p/then (fn [_]
                    (is (= [[:thread-api/import-db-binary ["logseq_db_graph_a" payload]]]
                           @worker-import-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally
           (fn []
             (set! state/<invoke-db-worker original-invoke)
             (done)))))))
