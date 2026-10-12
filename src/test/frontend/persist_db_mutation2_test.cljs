(ns frontend.persist-db-mutation2-test
  "Second-run mutation survivors in frontend.persist-db."
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [electron.ipc :as ipc]
            [frontend.persist-db :as persist-db]
            [frontend.persist-db.remote :as remote]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(defonce ^:private *previous-runtime-state (atom nil))

(defn- save-runtime-state!
  []
  (reset! *previous-runtime-state
          {:remote-db @persist-db/remote-db
           :remote-repo @persist-db/remote-repo
           :remote-runtime-state @persist-db/remote-runtime-state
           :ensure-remote-chain @persist-db/*ensure-remote-chain
           :remote-ensure-epoch @persist-db/*remote-ensure-epoch
           :pending-remote-session @persist-db/*pending-remote-session
           :db-worker @state/*db-worker}))

(defn- reset-runtime-state!
  []
  (reset! persist-db/remote-db nil)
  (reset! persist-db/remote-repo nil)
  (reset! persist-db/remote-runtime-state nil)
  (reset! persist-db/*ensure-remote-chain nil)
  (reset! persist-db/*remote-ensure-epoch 0)
  (reset! persist-db/*pending-remote-session nil)
  (reset! state/*db-worker nil))

(defn- restore-runtime-state!
  []
  (let [{:keys [remote-db remote-repo remote-runtime-state ensure-remote-chain
                remote-ensure-epoch pending-remote-session db-worker]}
        @*previous-runtime-state]
    (reset! persist-db/remote-db remote-db)
    (reset! persist-db/remote-repo remote-repo)
    (reset! persist-db/remote-runtime-state remote-runtime-state)
    (reset! persist-db/*ensure-remote-chain ensure-remote-chain)
    (reset! persist-db/*remote-ensure-epoch remote-ensure-epoch)
    (reset! persist-db/*pending-remote-session pending-remote-session)
    (reset! state/*db-worker db-worker)
    (reset! *previous-runtime-state nil)))

(use-fixtures :each {:before save-runtime-state!
                     :after restore-runtime-state!})

;; Fails if, in `<invalidate-remote-repo!`, the `:url` key is dropped.
(deftest invalidating-a-deleted-graph-deletes-the-repo
  (async done
    (let [delete-calls (atom [])
          original-delete-repo! state/delete-repo!]
      (reset-runtime-state!)
      (set! state/delete-repo! (fn [repo-map] (swap! delete-calls conj repo-map)))
      (-> (p/let [_ (persist-db/<invalidate-remote-repo! "logseq_db_graph_a" "deleted")
                  _ (persist-db/<invalidate-remote-repo! "logseq_db_graph_a" "other")]
            (is (= [{:url "logseq_db_graph_a"}] @delete-calls)
                "Only phase \"deleted\" deletes the repo"))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! state/delete-repo! original-delete-repo!)
                       (done)))))))

;; Fails if, in `set-remote-runtime!`, the `:request-failures` key is dropped or the `:recovery-triggered?` key is dropped.
(deftest set-remote-runtime-starts-with-no-failures
  (let [client {:wrapped-worker (fn [& _] nil)}]
    (reset-runtime-state!)
    (#'persist-db/set-remote-runtime! "logseq_db_graph_a" client "session-1")
    (is (= {:repo "logseq_db_graph_a"
            :client client
            :session-id "session-1"
            :request-failures 0
            :recovery-triggered? false}
           @persist-db/remote-runtime-state))
    (is (= client @persist-db/remote-db))
    (is (= "logseq_db_graph_a" @persist-db/remote-repo))
    (is (= (:wrapped-worker client) @state/*db-worker))))

;; Fails if, in `<enqueue-ensure-remote!`, the `(p/catch (fn [_] nil))` step is dropped.
(deftest ensure-remote-queue-continues-after-a-failed-step
  (async done
    (reset-runtime-state!)
    (let [enqueue! #'persist-db/<enqueue-ensure-remote!
          first-promise (enqueue! #(p/rejected (ex-info "first failed" {})))
          second-promise (enqueue! #(p/resolved :second-ran))
          first-result (-> first-promise
                           (p/then (fn [v] {:resolved v}))
                           (p/catch (fn [e] {:rejected (ex-message e)})))]
      (-> (p/let [first-outcome first-result
                  second-outcome second-promise]
            (is (= {:rejected "first failed"} first-outcome))
            (is (= :second-ran second-outcome)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally (fn [] (done)))))))

;; Fails if, in `<stop-remote-client!`, the `(p/catch (fn [error]` step is dropped.
(deftest stop-remote-client-swallows-stop-failures
  (async done
    (let [original-stop! remote/stop!]
      (set! remote/stop! (fn [_client] (p/rejected (ex-info "stop failed" {}))))
      (-> (p/let [result (#'persist-db/<stop-remote-client! "logseq_db_graph_a" {:repo "logseq_db_graph_a"})]
            (is (nil? result)))
          (p/catch (fn [e] (is false (str "stop failure escaped: " e))))
          (p/finally (fn []
                       (set! remote/stop! original-stop!)
                       (done)))))))

;; Fails if, in `<discard-stale-started-client!`, the `(p/catch (fn [e]` step is dropped.
(deftest discard-stale-started-client-releases-runtime-even-when-stop-or-release-fail
  (async done
    (let [ipc-calls (atom [])
          original-stop! remote/stop!
          original-ipc ipc/ipc]
      (reset-runtime-state!)
      (set! remote/stop! (fn [_client] (p/rejected (ex-info "stop failed" {}))))
      (set! ipc/ipc (fn [channel repo]
                      (swap! ipc-calls conj [channel repo])
                      (p/rejected (ex-info "release failed" {}))))
      (-> (p/let [result (#'persist-db/<discard-stale-started-client! "logseq_db_graph_a" {:repo "logseq_db_graph_a"})]
            (is (nil? result) "A failing release does not reject")
            (is (= [["releaseDbWorkerRuntime" "logseq_db_graph_a"]] @ipc-calls)
                "A failing stop does not skip the release"))
          (p/catch (fn [e] (is false (str "failure escaped: " e))))
          (p/finally (fn []
                       (set! remote/stop! original-stop!)
                       (set! ipc/ipc original-ipc)
                       (done)))))))

;; Fails if, in `<ensure-remote-impl!`, the `:epoch` key is dropped.
(deftest ensure-remote-registers-the-pending-session-with-its-epoch
  (async done
    (let [pending-at-ipc (atom nil)
          original-ipc ipc/ipc]
      (reset-runtime-state!)
      (set! ipc/ipc (fn [_channel _repo _opts]
                      (reset! pending-at-ipc @persist-db/*pending-remote-session)
                      (p/rejected (ex-info "stop here" {}))))
      (-> (#'persist-db/<ensure-remote-impl! "logseq_db_graph_a" nil)
          (p/catch (fn [_] nil))
          (p/then (fn [_]
                    (is (= {:repo "logseq_db_graph_a"
                            :epoch 1}
                           (select-keys @pending-at-ipc [:repo :epoch])))
                    (is (string? (:session-id @pending-at-ipc)))))
          (p/finally (fn []
                       (set! ipc/ipc original-ipc)
                       (done)))))))

(defn- recover-with-replaced-runtime!
  "Runs <recover-remote-impl! for an active client whose worker the main
  process replaced (another endpoint). on-stop runs when the old client stops.
  Returns the db-worker-runtime ipc option maps; remote/start! is rejected."
  [repo on-stop]
  (let [ipc-calls (atom [])
        client {:client {:base-url "http://127.0.0.1:9101" :auth-token "old"}}
        original-ipc ipc/ipc
        original-stop! remote/stop!
        original-start! remote/start!
        original-current-repo state/get-current-repo
        current-repo (atom repo)]
    (reset-runtime-state!)
    (#'persist-db/set-remote-runtime! repo client "session-1")
    (set! state/get-current-repo (fn [] @current-repo))
    (set! ipc/ipc (fn [channel _repo opts]
                    (swap! ipc-calls conj [channel opts])
                    (p/resolved {:base-url "http://127.0.0.1:9102" :auth-token "new" :generation 7})))
    (set! remote/stop! (fn [_client] (on-stop current-repo) (p/resolved true)))
    (set! remote/start! (fn [_runtime] (p/rejected (ex-info "start stopped here" {}))))
    (-> (#'persist-db/<recover-remote-impl! repo client "session-1")
        (p/catch (fn [_] nil))
        (p/then (fn [_] @ipc-calls))
        (p/finally (fn []
                     (set! ipc/ipc original-ipc)
                     (set! remote/stop! original-stop!)
                     (set! remote/start! original-start!)
                     (set! state/get-current-repo original-current-repo))))))

;; Fails if, in `<recover-remote-impl!`, the `:only-if-current?` key is dropped.
(deftest recovery-does-not-restart-a-runtime-for-a-graph-switched-away-from
  (async done
    (-> (p/let [calls (recover-with-replaced-runtime! "logseq_db_graph_switch"
                                                      (fn [current-repo] (reset! current-repo "logseq_db_graph_other")))]
          (is (= ["db-worker-runtime"] (map first calls))
              "Only the recovery probe: no new runtime for a graph that is no longer current"))
        (p/catch (fn [e] (is false (str "unexpected error: " e))))
        (p/finally (fn [] (done))))))

;; Fails if, in `node-runtime?`, the body becomes `nil`.
(deftest electron-runtime-is-off-in-a-window-less-node-process
  (let [original-electron? util/electron?
        window (.-window js/globalThis)]
    (set! util/electron? (constantly true))
    (try
      (is (true? (#'persist-db/electron-runtime?)) "With a window, util/electron? decides")
      (js-delete js/globalThis "window")
      (is (false? (#'persist-db/electron-runtime?)))
      (finally
        (set! (.-window js/globalThis) window)
        (set! util/electron? original-electron?)))))

;; Fails if, in `<close-db`, the `(p/catch (fn [_] nil))` step is dropped.
(deftest close-db-stops-the-runtime-even-when-the-close-request-fails
  (async done
    (let [stop-calls (atom [])
          fake-client {:repo "logseq_db_graph_a"
                       :client {:base-url "http://127.0.0.1:9101"}}
          original-electron? util/electron?
          original-invoke! remote/invoke!
          original-stop! remote/stop!]
      (reset-runtime-state!)
      (reset! persist-db/remote-db fake-client)
      (reset! persist-db/remote-repo "logseq_db_graph_a")
      (set! util/electron? (constantly true))
      (set! remote/invoke! (fn [_client _method _args] (p/rejected (ex-info "close failed" {}))))
      (set! remote/stop! (fn [client]
                           (swap! stop-calls conj client)
                           (p/resolved true)))
      (-> (p/let [_ (persist-db/<close-db "logseq_db_graph_a")]
            (is (= [fake-client] @stop-calls))
            (is (nil? @persist-db/remote-db)))
          (p/catch (fn [e] (is false (str "close failure escaped: " e))))
          (p/finally (fn []
                       (set! util/electron? original-electron?)
                       (set! remote/invoke! original-invoke!)
                       (set! remote/stop! original-stop!)
                       (done)))))))

;; Fails if, in `<close-db`, `:thread-api/close-db` becomes `:thread-api/markdown-mirror-set-enabled`.
(deftest close-db-outside-electron-asks-the-db-worker
  (async done
    (let [invoke-calls (atom [])
          original-electron? util/electron?
          original-invoke! state/<invoke-db-worker]
      (set! util/electron? (constantly false))
      (set! state/<invoke-db-worker (fn [& args]
                                      (swap! invoke-calls conj (vec args))
                                      (p/resolved nil)))
      (-> (p/let [_ (persist-db/<close-db "logseq_db_graph_a")]
            (is (= [[:thread-api/close-db "logseq_db_graph_a"]] @invoke-calls)))
          (p/catch (fn [e] (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! util/electron? original-electron?)
                       (set! state/<invoke-db-worker original-invoke!)
                       (done)))))))
