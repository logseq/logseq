(ns frontend.persist-db-test
  (:require [cljs.test :refer [async deftest is]]
            [electron.ipc :as ipc]
            [frontend.persist-db.browser :as browser]
            [frontend.persist-db :as persist-db]
            [frontend.persist-db.protocol :as protocol]
            [frontend.persist-db.remote :as remote]
            [frontend.state :as state]
            [frontend.util :as util]
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

(defn- reset-runtime-state!
  []
  (reset! persist-db/remote-db nil)
  (reset! persist-db/remote-repo nil)
  (reset! state/*db-worker nil))

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

(deftest connect-db-worker-and-infer-worker-skips-in-electron-runtime
  (async done
    (let [invoke-calls (atom [])
          original-electron? util/electron?
          original-invoke state/<invoke-db-worker-direct-pass
          original-db-worker @state/*db-worker
          original-infer-worker @state/*infer-worker]
      (set! util/electron? (constantly true))
      (set! state/<invoke-db-worker-direct-pass (fn [& args]
                                                  (swap! invoke-calls conj args)
                                                  (p/resolved :ok)))
      (reset! state/*db-worker (fn [& _] nil))
      (reset! state/*infer-worker (fn [& _] nil))
      (-> (p/let [_ (browser/<connect-db-worker-and-infer-worker!)]
            (is (= [] @invoke-calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally
           (fn []
             (set! util/electron? original-electron?)
             (set! state/<invoke-db-worker-direct-pass original-invoke)
             (reset! state/*db-worker original-db-worker)
             (reset! state/*infer-worker original-infer-worker)
             (done)))))))
