(ns frontend.worker.db-worker-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.db-worker :as db-worker]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.log-and-state :as rtc-log-and-state]
            [frontend.worker.test-env]
            [promesa.core :as p]))

(def ^:private test-repo "test-db-worker-repo")

(defn- restoring-worker-state
  [f]
  (let [sqlite-prev @worker-state/*sqlite-conns
        datascript-prev @worker-state/*datascript-conns
        client-ops-prev @worker-state/*client-ops-conns
        opfs-prev @worker-state/*opfs-pools
        fuzzy-prev @search/fuzzy-search-indices]
    (try
      (f)
      (finally
        (reset! worker-state/*sqlite-conns sqlite-prev)
        (reset! worker-state/*datascript-conns datascript-prev)
        (reset! worker-state/*client-ops-conns client-ops-prev)
        (reset! worker-state/*opfs-pools opfs-prev)
        (reset! search/fuzzy-search-indices fuzzy-prev)))))

(deftest close-db-clears-fuzzy-search-cache-test
  (restoring-worker-state
   (fn []
     (let [closed (atom [])
           pause-calls (atom 0)
           mk-db (fn [label]
                   #js {:close (fn [] (swap! closed conj label))})]
       (reset! worker-state/*sqlite-conns
               {test-repo {:db (mk-db :db)
                           :search (mk-db :search)
                           :client-ops (mk-db :client-ops)}})
       (reset! worker-state/*datascript-conns {test-repo :datascript})
       (reset! worker-state/*client-ops-conns {test-repo :client-ops})
       (reset! worker-state/*opfs-pools
               {test-repo #js {:pauseVfs (fn [] (swap! pause-calls inc))}})
       (reset! search/fuzzy-search-indices {test-repo :stale-cache})

       (db-worker/close-db! test-repo)

       (is (= #{:db :search :client-ops} (set @closed)))
       (is (= 1 @pause-calls))
       (is (nil? (get @search/fuzzy-search-indices test-repo)))
       (is (nil? (get @worker-state/*sqlite-conns test-repo)))))))

(deftest import-datoms-to-db-invalidates-existing-search-db-test
  (async done
         (restoring-worker-state
          (fn []
            (let [search-resets (atom [])
                  search-db #js {:exec (fn [_] nil)
                                 :close (fn [] nil)}
                  thread-apis-prev @thread-api/*thread-apis]
              (vreset! thread-api/*thread-apis
                       (assoc thread-apis-prev
                              :thread-api/create-or-open-db (fn [_repo _opts] (p/resolved nil))))
              (-> (p/with-redefs [db-sync/rehydrate-large-titles-from-db! (fn [_repo _graph-id] (p/resolved nil))
                                  rtc-log-and-state/rtc-log (fn [& _] nil)
                                  worker-state/get-sqlite-conn (fn [_repo type]
                                                                 (when (= type :search)
                                                                   search-db))
                                  search/truncate-table! (fn [db]
                                                           (swap! search-resets conj db))
                                  client-op/update-local-tx (fn [& _] nil)
                                  shared-service/broadcast-to-clients! (fn [& _] nil)]
                    (#'db-worker/import-datoms-to-db! test-repo "graph-1" 42 nil))
                  (p/then (fn [_]
                            (is (= [search-db] @search-resets))
                            (vreset! thread-api/*thread-apis thread-apis-prev)
                            (done)))
                  (p/catch (fn [error]
                             (vreset! thread-api/*thread-apis thread-apis-prev)
                             (is false (str error))
                             (done)))))))))
