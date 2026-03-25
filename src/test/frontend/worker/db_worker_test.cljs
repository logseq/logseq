(ns frontend.worker.db-worker-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.a-test-env]
            [frontend.worker.db-worker :as db-worker]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.log-and-state :as rtc-log-and-state]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.validate :as db-validate]
            [promesa.core :as p]))

(def ^:private test-repo "test-db-worker-repo")
(def ^:private close-db!-orig db-worker/close-db!)
(def ^:private decrypt-snapshot-datoms-batch-orig sync-crypt/<decrypt-snapshot-datoms-batch)
(def ^:private fetch-graph-aes-key-for-download-orig sync-crypt/<fetch-graph-aes-key-for-download)
(def ^:private rehydrate-large-titles-from-db-orig db-sync/rehydrate-large-titles-from-db!)
(def ^:private rtc-log-orig rtc-log-and-state/rtc-log)
(def ^:private update-local-tx-orig client-op/update-local-tx)
(def ^:private broadcast-to-clients-orig shared-service/broadcast-to-clients!)

(defn- restoring-worker-state
  [f]
  (let [sqlite-prev @worker-state/*sqlite-conns
        datascript-prev @worker-state/*datascript-conns
        client-ops-prev @worker-state/*client-ops-conns
        opfs-prev @worker-state/*opfs-pools
        fuzzy-prev @search/fuzzy-search-indices
        cleanup (fn []
                  (set! db-worker/close-db! close-db!-orig)
                  (set! sync-crypt/<decrypt-snapshot-datoms-batch decrypt-snapshot-datoms-batch-orig)
                  (set! sync-crypt/<fetch-graph-aes-key-for-download fetch-graph-aes-key-for-download-orig)
                  (set! db-sync/rehydrate-large-titles-from-db! rehydrate-large-titles-from-db-orig)
                  (set! rtc-log-and-state/rtc-log rtc-log-orig)
                  (set! client-op/update-local-tx update-local-tx-orig)
                  (set! shared-service/broadcast-to-clients! broadcast-to-clients-orig)
                  (reset! worker-state/*sqlite-conns sqlite-prev)
                  (reset! worker-state/*datascript-conns datascript-prev)
                  (reset! worker-state/*client-ops-conns client-ops-prev)
                  (reset! worker-state/*opfs-pools opfs-prev)
                  (reset! search/fuzzy-search-indices fuzzy-prev))]
    (set! db-worker/close-db! close-db!-orig)
    (set! sync-crypt/<decrypt-snapshot-datoms-batch decrypt-snapshot-datoms-batch-orig)
    (set! sync-crypt/<fetch-graph-aes-key-for-download fetch-graph-aes-key-for-download-orig)
    (set! db-sync/rehydrate-large-titles-from-db! rehydrate-large-titles-from-db-orig)
    (set! rtc-log-and-state/rtc-log rtc-log-orig)
    (set! client-op/update-local-tx update-local-tx-orig)
    (set! shared-service/broadcast-to-clients! broadcast-to-clients-orig)
    (let [result (f)]
      (if (p/promise? result)
        (p/finally result cleanup)
        (do
          (cleanup)
          result)))))

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

(deftest client-ops-cleanup-timer-starts-once-and-clears-on-close-test
  (restoring-worker-state
   (fn []
     (let [scheduled (atom [])
           cleared (atom [])
           original-set-interval js/setInterval
           original-clear-interval js/clearInterval
           fake-db #js {:close (fn [] nil)}
           timer-id #js {:id "timer-1"}]
       (set! js/setInterval
             (fn [f interval-ms]
               (swap! scheduled conj {:fn f :interval-ms interval-ms})
               timer-id))
       (set! js/clearInterval
             (fn [id]
               (swap! cleared conj id)))
       (try
         (reset! worker-state/*sqlite-conns
                 {test-repo {:db fake-db
                             :search fake-db
                             :client-ops fake-db}})
         (reset! worker-state/*datascript-conns {test-repo :datascript})
         (reset! worker-state/*client-ops-conns {test-repo :client-ops})
         (reset! (deref #'db-worker/*client-ops-cleanup-timers) {})

         (#'db-worker/ensure-client-ops-cleanup-timer! test-repo)
         (#'db-worker/ensure-client-ops-cleanup-timer! test-repo)

         (is (= 1 (count @scheduled)))
         (is (= (* 3 60 60 1000) (:interval-ms (first @scheduled))))
         (is (= timer-id (get @(deref #'db-worker/*client-ops-cleanup-timers) test-repo)))

         (db-worker/close-db! test-repo)

         (is (= [timer-id] @cleared))
         (is (nil? (get @(deref #'db-worker/*client-ops-cleanup-timers) test-repo)))
         (finally
           (set! js/setInterval original-set-interval)
           (set! js/clearInterval original-clear-interval)))))))

(deftest complete-datoms-import-invalidates-existing-search-db-test
  (async done
         (restoring-worker-state
          (fn []
            (let [thread-apis-prev @thread-api/*thread-apis]
              (vreset! thread-api/*thread-apis
                       (assoc thread-apis-prev
                              :thread-api/create-or-open-db (fn [_repo _opts] (p/resolved nil))))
              (-> (p/with-redefs [db-sync/rehydrate-large-titles-from-db! (fn [_repo _graph-id] (p/resolved nil))
                                  rtc-log-and-state/rtc-log (fn [& _] nil)
                                  worker-state/get-sqlite-conn (fn [_repo _type] nil)
                                  client-op/update-local-tx (fn [& _] nil)
                                  shared-service/broadcast-to-clients! (fn [& _] nil)]
                    (#'db-worker/complete-datoms-import! test-repo "graph-1" 42))
                  (p/then (fn [_]
                            (is true)
                            (vreset! thread-api/*thread-apis thread-apis-prev)
                            (done)))
                  (p/catch (fn [error]
                             (vreset! thread-api/*thread-apis thread-apis-prev)
                             (is false (str error))
                             (done)))))))))

(defn- capture-outcome
  [thunk]
  (try
    (-> (thunk)
        (p/then (fn [value] {:value value}))
        (p/catch (fn [error] {:error error})))
    (catch :default error
      (p/resolved {:error error}))))

(defn- with-fake-create-or-open-db
  [repo conn f]
  (let [thread-apis-prev @thread-api/*thread-apis]
    (vreset! thread-api/*thread-apis
             (assoc thread-apis-prev
                    :thread-api/create-or-open-db
                    (fn [_repo _opts]
                      (swap! worker-state/*datascript-conns assoc repo conn)
                      (p/resolved nil))))
    (-> (f)
        (p/finally (fn []
                     (vreset! thread-api/*thread-apis thread-apis-prev))))))

(def sample-datoms
  [{:e 1 :a :db/ident :v :logseq.class/Page :tx 1 :added true}
   {:e 2 :a :block/title :v "hello" :tx 1 :added true}])

(deftest db-sync-import-prepare-replaces-active-import-state-test
  (async done
         (restoring-worker-state
          (fn []
            (let [prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  conn-a (d/create-conn db-schema/schema)
                  conn-b (d/create-conn db-schema/schema)]
              (with-fake-create-or-open-db
                test-repo conn-a
                (fn []
                  (-> (p/with-redefs [db-worker/close-db! (fn [_] nil)
                                      db-worker/<invalidate-search-db! (fn [_] (p/resolved nil))]
                        (p/let [first-import (prepare test-repo true "graph-1" false)
                                _ (swap! worker-state/*datascript-conns assoc test-repo conn-b)
                                second-import (prepare test-repo true "graph-1" false)]
                          (is (map? first-import))
                          (is (map? second-import))
                          (is (not= (:import-id first-import) (:import-id second-import)))))
                      (p/then (fn [_] (done)))
                      (p/catch (fn [error]
                                 (is false (str error))
                                 (done)))))))))))

(deftest db-sync-import-datoms-chunk-rejects-stale-import-id-test
  (async done
         (restoring-worker-state
          (fn []
            (let [prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  datoms-chunk (@thread-api/*thread-apis :thread-api/db-sync-import-datoms-chunk)
                  conn (d/create-conn db-schema/schema)]
              (with-fake-create-or-open-db
                test-repo conn
                (fn []
                  (-> (p/with-redefs [db-worker/close-db! (fn [_] nil)
                                      db-worker/<invalidate-search-db! (fn [_] (p/resolved nil))
                                      rtc-log-and-state/rtc-log (fn [& _] nil)]
                        (p/let [first-import (prepare test-repo true "graph-1" false)
                                second-import (prepare test-repo true "graph-1" false)
                                stale-outcome (capture-outcome #(datoms-chunk sample-datoms "graph-1" (:import-id first-import)))]
                          (is (= :db-sync/stale-import (some-> stale-outcome :error ex-data :type)))
                          (is (nil? (d/entity @conn 2)))
                          (-> (datoms-chunk sample-datoms "graph-1" (:import-id second-import))
                              (p/then (fn [_]
                                        (is (= "hello" (:block/title (d/entity @conn 2))))
                                        (done))))))
                      (p/catch (fn [error]
                                 (is false (str error))
                                 (done)))))))))))

(deftest db-sync-import-datoms-chunk-imports-plain-datoms-to-active-db-test
  (async done
         (restoring-worker-state
          (fn []
            (let [prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  datoms-chunk (@thread-api/*thread-apis :thread-api/db-sync-import-datoms-chunk)
                  conn (d/create-conn db-schema/schema)]
              (with-fake-create-or-open-db
                test-repo conn
                (fn []
                  (-> (p/with-redefs [db-worker/close-db! (fn [_] nil)
                                      db-worker/<invalidate-search-db! (fn [_] (p/resolved nil))
                                      rtc-log-and-state/rtc-log (fn [& _] nil)]
                        (p/let [{:keys [import-id]} (prepare test-repo true "graph-1" false)
                                _ (datoms-chunk sample-datoms "graph-1" import-id)]
                          (is (= :logseq.class/Page (:db/ident (d/entity @conn 1))))
                          (is (= "hello" (:block/title (d/entity @conn 2))))
                          (done)))
                      (p/catch (fn [error]
                                 (is false (str error))
                                 (done)))))))))))

(deftest db-sync-import-datoms-chunk-imports-encrypted-datoms-to-active-db-test
  (async done
         (restoring-worker-state
          (fn []
            (let [prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  datoms-chunk (@thread-api/*thread-apis :thread-api/db-sync-import-datoms-chunk)
                  conn (d/create-conn db-schema/schema)
                  decrypt-calls (atom [])]
              (with-fake-create-or-open-db
                test-repo conn
                (fn []
                  (-> (p/with-redefs [db-worker/close-db! (fn [_] nil)
                                      db-worker/<invalidate-search-db! (fn [_] (p/resolved nil))
                                      rtc-log-and-state/rtc-log (fn [& _] nil)
                                      sync-crypt/<fetch-graph-aes-key-for-download (fn [_] (p/resolved :aes-key))
                                      sync-crypt/<decrypt-snapshot-datoms-batch (fn [aes-key datoms]
                                                                                  (swap! decrypt-calls conj {:aes-key aes-key
                                                                                                             :datoms datoms})
                                                                                  (p/resolved datoms))]
                        (p/let [{:keys [import-id]} (prepare test-repo true "graph-1" true)
                                _ (datoms-chunk sample-datoms "graph-1" import-id)]
                          (is (= 1 (count @decrypt-calls)))
                          (is (= sample-datoms (:datoms (first @decrypt-calls))))
                          (is (= "hello" (:block/title (d/entity @conn 2))))
                          (done)))
                      (p/catch (fn [error]
                                 (is false (str error))
                                 (done)))))))))))

(deftest db-sync-import-finalize-rejects-stale-import-id-test
  (async done
         (restoring-worker-state
          (fn []
            (let [prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  finalize (@thread-api/*thread-apis :thread-api/db-sync-import-finalize)
                  conn (d/create-conn db-schema/schema)]
              (with-fake-create-or-open-db
                test-repo conn
                (fn []
                  (-> (p/with-redefs [db-worker/close-db! (fn [_] nil)
                                      db-worker/<invalidate-search-db! (fn [_] (p/resolved nil))
                                      db-sync/rehydrate-large-titles-from-db! (fn [& _] (p/resolved nil))
                                      rtc-log-and-state/rtc-log (fn [& _] nil)
                                      client-op/update-local-tx (fn [& _] nil)
                                      shared-service/broadcast-to-clients! (fn [& _] nil)]
                        (p/let [first-import (prepare test-repo true "graph-1" false)
                                second-import (prepare test-repo true "graph-1" false)
                                stale-outcome (capture-outcome #(finalize test-repo "graph-1" 42 (:import-id first-import)))]
                          (is (= :db-sync/stale-import (some-> stale-outcome :error ex-data :type)))
                          (-> (finalize test-repo "graph-1" 42 (:import-id second-import))
                              (p/then (fn [_]
                                        (is true)
                                        (done))))))
                      (p/catch (fn [error]
                                 (is false (str error))
                                 (done)))))))))))

(deftest db-sync-import-finalize-completes-active-db-import-test
  (async done
         (restoring-worker-state
          (fn []
            (let [prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  datoms-chunk (@thread-api/*thread-apis :thread-api/db-sync-import-datoms-chunk)
                  finalize (@thread-api/*thread-apis :thread-api/db-sync-import-finalize)
                  conn (d/create-conn db-schema/schema)
                  search-db #js {:close (fn [] nil)
                                 :exec (fn [_sql] nil)}
                  main-db #js {:exec (fn [_sql] nil)}]
              (reset! worker-state/*sqlite-conns {test-repo {:db main-db :search search-db :client-ops nil}})
              (with-fake-create-or-open-db
                test-repo conn
                (fn []
                  (-> (p/with-redefs [db-worker/close-db! (fn [_] nil)
                                      db-worker/<invalidate-search-db! (fn [_] (p/resolved nil))
                                      db-sync/rehydrate-large-titles-from-db! (fn [& _] (p/resolved nil))
                                      rtc-log-and-state/rtc-log (fn [& _] nil)
                                      client-op/update-local-tx (fn [& _] nil)
                                      shared-service/broadcast-to-clients! (fn [& _] nil)]
                        (p/let [{:keys [import-id]} (prepare test-repo true "graph-1" false)
                                _ (datoms-chunk sample-datoms "graph-1" import-id)
                                _ (finalize test-repo "graph-1" 42 import-id)]
                          (is (= :logseq.class/Page (:db/ident (d/entity @conn 1))))
                          (is (= "hello" (:block/title (d/entity @conn 2))))
                          (done)))
                      (p/catch (fn [error]
                                 (is false (str error))
                                 (done)))))))))))

(deftest thread-api-validate-db-passes-sync-diagnostics-test
  (restoring-worker-state
   (fn []
     (let [validate (@thread-api/*thread-apis :thread-api/validate-db)
           conn (d/create-conn db-schema/schema)
           captured (atom nil)
           latest-prev @db-sync/*repo->latest-remote-tx]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (reset! db-sync/*repo->latest-remote-tx {test-repo 11})
       (try
         (with-redefs [client-op/get-local-tx (fn [_repo] 7)
                       client-op/get-local-checksum (fn [_repo] "local-checksum")
                       worker-db-validate/validate-db (fn [& args]
                                                        (reset! captured args)
                                                        {:ok true})]
           (validate test-repo)
           (is (= [test-repo
                   conn
                   {:local-tx 7
                    :remote-tx 11
                    :local-checksum "local-checksum"
                    :remote-checksum nil}]
                  @captured)))
         (finally
           (reset! db-sync/*repo->latest-remote-tx latest-prev)))))))

(deftest validate-db-notification-includes-sync-diagnostics-test
  (let [conn (d/create-conn db-schema/schema)
        notifications (atom [])
        sync-diagnostics {:local-tx 3
                          :remote-tx 5
                          :local-checksum "local-checksum"
                          :remote-checksum "remote-checksum"}]
    (with-redefs [db-validate/validate-db! (fn [_db] {:errors nil
                                                      :datom-count 0
                                                      :entities []})
                  db-validate/graph-counts (fn [_db _entities] {})
                  shared-service/broadcast-to-clients! (fn [topic payload]
                                                         (swap! notifications conj [topic payload]))]
      (worker-db-validate/validate-db test-repo conn sync-diagnostics)
      (let [[topic payload] (first (filter (fn [[topic* _]]
                                             (= :notification topic*))
                                           @notifications))
            [message status] payload]
        (is (= :notification topic))
        (is (= :success status))
        (is (string/includes? message ":local-checksum \"local-checksum\""))
        (is (string/includes? message ":remote-checksum \"remote-checksum\""))
        (is (string/includes? message ":local-tx 3"))
        (is (string/includes? message ":remote-tx 5"))))))
