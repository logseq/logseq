(ns frontend.persist-db-mutation-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [electron.ipc :as ipc]
            [frontend.db.transact :as db-transact]
            [frontend.persist-db :as persist-db]
            [frontend.persist-db.remote :as remote]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def ^:private repo-generations @#'persist-db/*repo-generations)

(defonce ^:private *saved (atom nil))

(defn- reset-runtime-state!
  []
  (rfx/unlisten! :sync-markdown-mirror-setting)
  (reset! persist-db/remote-db nil)
  (reset! persist-db/remote-repo nil)
  (reset! persist-db/remote-runtime-state nil)
  (reset! persist-db/*ensure-remote-chain nil)
  (reset! persist-db/*remote-ensure-epoch 0)
  (reset! persist-db/*pending-remote-session nil)
  (reset! repo-generations {})
  (reset! state/*db-worker nil)
  (reset! ldb/*transact-fn nil)
  (state/swap-state! assoc :git/current-repo nil))

(use-fixtures :each
  {:before (fn []
             (reset! *saved {:state (state/get-state)
                             :db-worker @state/*db-worker
                             :transact-fn @ldb/*transact-fn})
             (reset-runtime-state!))
   :after (fn []
            (reset-runtime-state!)
            (let [{:keys [state db-worker transact-fn]} @*saved]
              (state/replace-state! state)
              (reset! state/*db-worker db-worker)
              (reset! ldb/*transact-fn transact-fn)))})

(defn- finish!
  [promise restore! done]
  (-> promise
      (p/catch (fn [error] (is (nil? error))))
      (p/finally (fn [& _]
                   (restore!)
                   (done)))))

(defn- <capture
  [promise]
  (-> promise
      (p/then (fn [value] [:ok value]))
      (p/catch (fn [error] [:err (ex-data error)]))))

(def ^:private repo "logseq_db_graph_a")

(defn- install-fake-runtime!
  [repo' client]
  (reset! persist-db/remote-db client)
  (reset! persist-db/remote-repo repo'))

;; Fails if, in `<invalidate-remote-repo!`, `and` becomes `or` or `when` becomes `when-not`.
(deftest invalidate-remote-repo-stops-client-and-honors-generation
  (async done
    (let [client {:wrapped-worker :w}
          stopped (atom [])
          original-stop remote/stop!]
      (set! remote/stop! (fn [c] (swap! stopped conj c) (p/resolved nil)))
      (finish!
       (p/do!
        (reset! repo-generations {(graph-dir/repo-identity repo) 5})
        (install-fake-runtime! repo client)
        (persist-db/<invalidate-remote-repo! repo "closed" 4)
        (is (= repo @persist-db/remote-repo))
        (is (= [] @stopped))
        (persist-db/<invalidate-remote-repo! repo "closed")
        (is (nil? @persist-db/remote-repo))
        (is (= [client] @stopped))
        (install-fake-runtime! repo client)
        (persist-db/<invalidate-remote-repo! repo "closed" 5)
        (is (nil? @persist-db/remote-repo))
        (is (= [client client] @stopped)))
       #(set! remote/stop! original-stop)
       done))))

;; Fails if, in `<stop-remote-if-current!`, `and` becomes `or` or `true` becomes `false`.
(deftest stop-remote-if-current-returns-true-without-client-and-false-for-other-repo
  (async done
    (let [client {:wrapped-worker :w}
          stopped (atom [])
          original-stop remote/stop!]
      (set! remote/stop! (fn [c] (swap! stopped conj c) (p/resolved nil)))
      (finish!
       (p/let [_ (reset! persist-db/remote-repo repo)
               result (#'persist-db/<stop-remote-if-current! repo)
               _ (is (true? result))
               _ (is (nil? @persist-db/remote-repo))
               _ (install-fake-runtime! repo client)
               other (#'persist-db/<stop-remote-if-current! "logseq_db_graph_b")]
         (is (false? other))
         (is (= [] @stopped))
         (is (= repo @persist-db/remote-repo)))
       #(set! remote/stop! original-stop)
       done))))

;; Fails if, in `active-runtime-session?`, `and` becomes `or`.
(deftest active-runtime-session-and-client-require-all-parts
  (let [client {:id 1}
        state {:repo repo :session-id "s" :client client}]
    (is (true? (#'persist-db/active-runtime-session? state repo "s")))
    (is (false? (#'persist-db/active-runtime-session? state "logseq_db_graph_b" "s")))
    (is (false? (#'persist-db/active-runtime-session? state repo "x")))
    (is (true? (#'persist-db/active-runtime-client? state repo "s" client)))
    (is (false? (#'persist-db/active-runtime-client? state repo "s" {:id 1})))
    (is (false? (#'persist-db/active-runtime-client? state repo "x" client)))
    (is (false? (#'persist-db/active-runtime-client? state "logseq_db_graph_b" "s" client)))))

;; Fails if, in `reset-active-request-failures!`, `if` becomes `if-not`.
(deftest reset-active-request-failures-only-for-active-session
  (reset! persist-db/remote-runtime-state {:repo repo :session-id "s" :request-failures 3})
  (#'persist-db/reset-active-request-failures! repo "other")
  (is (= 3 (:request-failures @persist-db/remote-runtime-state)))
  (#'persist-db/reset-active-request-failures! repo "s")
  (is (= 0 (:request-failures @persist-db/remote-runtime-state))))

;; Fails if, in `record-active-request-failure!`, `and` becomes `or` or `or` becomes `and`.
(deftest record-active-request-failure-counts-only-untriggered-active-session
  (let [client {:id 1}
        error (ex-info "down" {:code :server-unavailable})]
    ;; already triggered: untouched
    (let [before {:repo repo :session-id "s" :client client
                  :request-failures 2 :recovery-triggered? true}]
      (reset! persist-db/remote-runtime-state before)
      (#'persist-db/record-active-request-failure! repo "s" error)
      (is (= before @persist-db/remote-runtime-state)))
    ;; other session: untouched
    (let [before {:repo repo :session-id "s" :client client
                  :request-failures 0 :recovery-triggered? false}]
      (reset! persist-db/remote-runtime-state before)
      (#'persist-db/record-active-request-failure! repo "other" error)
      (is (= before @persist-db/remote-runtime-state)))
    ;; active, untriggered: failures add to the previous count
    (reset! persist-db/remote-runtime-state {:repo repo :session-id "s" :client client
                                             :request-failures 3 :recovery-triggered? false})
    (#'persist-db/record-active-request-failure! repo "s" error)
    (is (= 4 (:request-failures @persist-db/remote-runtime-state)))
    (is (true? (:recovery-triggered? @persist-db/remote-runtime-state)))))

;; Fails if, in `electron-runtime?`, `and` becomes `or`.
(deftest electron-runtime-is-false-when-not-electron
  (let [original util/electron?]
    (set! util/electron? (constantly false))
    (try
      (is (false? (#'persist-db/electron-runtime?)))
      (finally
        (set! util/electron? original)))))

;; Fails if, in `sync-markdown-mirror-setting-watch!`, `and` becomes `or`.
(deftest sync-markdown-mirror-setting-watch-needs-repo-worker-and-change
  (let [listener (atom nil)
        calls (atom [])
        original-listen rfx/listen!
        original-invoke state/<invoke-db-worker]
    (set! rfx/listen! (fn [_id f] (reset! listener f) nil))
    (set! state/<invoke-db-worker (fn [& args] (swap! calls conj args) (p/resolved nil)))
    (try
      (#'persist-db/sync-markdown-mirror-setting-watch!)
      (let [f @listener
            old {:config {repo {:feature/markdown-mirror? false}}}
            new {:git/current-repo repo
                 :config {repo {:feature/markdown-mirror? true}}}]
        (reset! state/*db-worker nil)
        (f old new)
        (is (= [] @calls))
        (reset! state/*db-worker :worker)
        (f new new)
        (is (= [] @calls))
        (f new (dissoc new :git/current-repo))
        (is (= [] @calls))
        (f old new)
        (is (= [[:thread-api/markdown-mirror-set-enabled repo true]] @calls)))
      (finally
        (set! rfx/listen! original-listen)
        (set! state/<invoke-db-worker original-invoke)))))

;; Fails if, in `install-remote-runtime!`, `if` becomes `if-not`.
(deftest install-remote-runtime-transact-fn-falls-back-to-current-repo
  (async done
    (let [captured (atom [])
          original-listen rfx/listen!
          original-invoke state/<invoke-db-worker
          original-transact db-transact/transact]
      (set! rfx/listen! (fn [_id _f] nil))
      (set! state/<invoke-db-worker (fn [& _] (p/resolved nil)))
      (set! db-transact/transact (fn [_worker-transact repo' _tx-data _tx-meta]
                                   (swap! captured conj repo')
                                   (p/resolved nil)))
      (state/swap-state! assoc :git/current-repo "logseq_db_current")
      (finish!
       (p/do!
        (#'persist-db/install-remote-runtime! repo {:wrapped-worker :w} "s")
        (let [f @ldb/*transact-fn]
          (f "logseq_db_explicit" [] {})
          (f nil [] {}))
        (is (= ["logseq_db_explicit" "logseq_db_current"] @captured))
        (p/delay 20))
       (fn []
         (set! rfx/listen! original-listen)
         (set! state/<invoke-db-worker original-invoke)
         (set! db-transact/transact original-transact))
       done))))

;; Fails if, in `<ensure-remote-impl!`, `and` becomes `or`.
(deftest ensure-remote-impl-same-repo-checks-generation
  (async done
    (let [client {:wrapped-worker :w}]
      (reset! repo-generations {(graph-dir/repo-identity repo) 5})
      (install-fake-runtime! repo client)
      (finish!
       (p/let [no-generation (<capture (#'persist-db/<ensure-remote-impl! repo {:generation nil}))
               stale (<capture (#'persist-db/<ensure-remote-impl! repo {:generation 4}))
               current (<capture (#'persist-db/<ensure-remote-impl! repo {:generation 5}))]
         (is (= [:ok client] no-generation))
         (is (= [:err {:code :graph-not-exists :repo repo}] stale))
         (is (= [:ok client] current)))
       (fn [])
       done))))

;; Fails if, in `<ensure-remote-impl!`, `when` becomes `when-not`.
(deftest ensure-remote-impl-clears-pending-when-repo-changes-during-stop
  (async done
    (let [original-stop remote/stop!]
      (state/swap-state! assoc :git/current-repo repo)
      (install-fake-runtime! "logseq_db_graph_other" {:wrapped-worker :old})
      (set! remote/stop! (fn [_client]
                           (state/swap-state! assoc :git/current-repo "logseq_db_graph_other")
                           (p/resolved nil)))
      (finish!
       (p/let [result (#'persist-db/<ensure-remote-impl! repo {:only-if-current? true})]
         (is (nil? result))
         (is (nil? @persist-db/*pending-remote-session)))
       #(set! remote/stop! original-stop)
       done))))

;; Fails if, in `<ensure-remote-impl!`, `or` becomes `and` or `when` becomes `when-not`.
(deftest ensure-remote-impl-requests-generation-and-clears-pending-on-stale-start
  (async done
    (let [ipc-calls (atom [])
          stopped (atom [])
          original-ipc ipc/ipc
          original-start remote/start!
          original-stop remote/stop!
          client {:fake-client true}]
      (set! ipc/ipc (fn [& args]
                      (swap! ipc-calls conj (vec args))
                      (if (= "db-worker-runtime" (first args))
                        (p/resolved {:base-url "u" :generation 8})
                        (p/resolved nil))))
      (set! remote/start! (fn [_opts]
                            (swap! persist-db/*remote-ensure-epoch inc)
                            (p/resolved client)))
      (set! remote/stop! (fn [c] (swap! stopped conj c) (p/resolved nil)))
      (state/swap-state! assoc :git/current-repo repo)
      (reset! repo-generations {(graph-dir/repo-identity repo) 7})
      (finish!
       (p/let [r1 (#'persist-db/<ensure-remote-impl! repo {:only-if-current? true})
               pending1 @persist-db/*pending-remote-session
               r2 (#'persist-db/<ensure-remote-impl! repo {:generation 9 :only-if-current? true})
               r3 (#'persist-db/<ensure-remote-impl! repo {:generation 9})
               r4 (#'persist-db/<ensure-remote-impl! repo {})]
         (is (nil? pending1))
         (is (nil? @persist-db/*pending-remote-session))
         (is (every? nil? [r1 r2 r3 r4]))
         (is (= [{:generation 7} {:generation 9} {:generation 9} {:generation nil}]
                (mapv #(nth % 2) (filter #(= "db-worker-runtime" (first %)) @ipc-calls))))
         (is (= [client client client client] @stopped)))
       (fn []
         (set! ipc/ipc original-ipc)
         (set! remote/start! original-start)
         (set! remote/stop! original-stop))
       done))))
