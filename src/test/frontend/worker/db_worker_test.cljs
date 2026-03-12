(ns frontend.worker.db-worker-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.a-test-env]
            [frontend.worker.db-worker :as db-worker]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.log-and-state :as rtc-log-and-state]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.frontend.schema :as db-schema]
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
            (let [thread-apis-prev @thread-api/*thread-apis]
              (vreset! thread-api/*thread-apis
                       (assoc thread-apis-prev
                              :thread-api/create-or-open-db (fn [_repo _opts] (p/resolved nil))))
              (-> (p/with-redefs [db-sync/rehydrate-large-titles-from-db! (fn [_repo _graph-id] (p/resolved nil))
                                  rtc-log-and-state/rtc-log (fn [& _] nil)
                                  worker-state/get-sqlite-conn (fn [_repo _type] nil)
                                  client-op/update-local-tx (fn [& _] nil)
                                  shared-service/broadcast-to-clients! (fn [& _] nil)]
                    (#'db-worker/import-datoms-to-db! test-repo "graph-1" 42 nil))
                  (p/then (fn [_]
                            (is true)
                            (vreset! thread-api/*thread-apis thread-apis-prev)
                            (done)))
                  (p/catch (fn [error]
                             (vreset! thread-api/*thread-apis thread-apis-prev)
                             (is false (str error))
                             (done)))))))))

(defn- fake-import-pool
  [labels closed]
  #js {:OpfsSAHPoolDb
       (let [remaining (atom labels)]
         (fn [_path]
           (let [label (first @remaining)
                 _ (swap! remaining rest)]
             #js {:exec (fn [_] nil)
                  :close (fn [] (swap! closed conj label))})))})

(defn- capture-outcome
  [thunk]
  (try
    (-> (thunk)
        (p/then (fn [value] {:value value}))
        (p/catch (fn [error] {:error error})))
    (catch :default error
      (p/resolved {:error error}))))

(defn- make-snapshot-rows
  [n]
  (mapv (fn [i]
          [i (str "content-" i) (str "addresses-" i)])
        (range n)))

(deftest db-sync-import-prepare-replaces-active-import-state-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)]
              (-> (p/with-redefs [db-worker/<get-opfs-pool (fn [_] (p/resolved (fake-import-pool [:first :second] closed)))
                                  common-sqlite/create-kvs-table! (fn [_] nil)
                                  db-worker/enable-sqlite-wal-mode! (fn [_] nil)]
                    (p/let [first-import (prepare test-repo false "graph-1" false)
                            second-import (prepare test-repo false "graph-1" false)]
                      (is (map? first-import))
                      (is (map? second-import))
                      (is (not= (:import-id first-import) (:import-id second-import)))
                      (is (= [:first] @closed))))
                  (p/then (fn [_] (done)))
                  (p/catch (fn [error]
                             (is false (str error))
                             (done)))))))))

(deftest db-sync-import-prepare-cleans-up-failed-setup-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  setup-calls (atom 0)
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)]
              (-> (p/with-redefs [db-worker/<get-opfs-pool (fn [_] (p/resolved (fake-import-pool [:failed :retry] closed)))
                                  common-sqlite/create-kvs-table! (fn [_]
                                                                    (if (zero? @setup-calls)
                                                                      (do
                                                                        (swap! setup-calls inc)
                                                                        (throw (ex-info "setup failed" {})))
                                                                      nil))
                                  db-worker/enable-sqlite-wal-mode! (fn [_] nil)]
                    (p/let [failed-outcome (capture-outcome #(prepare test-repo false "graph-1" false))
                            retry-import (prepare test-repo false "graph-1" false)]
                      (is (= "setup failed" (some-> failed-outcome :error ex-message)))
                      (is (= [:failed] @closed))
                      (is (map? retry-import))
                      (is (:import-id retry-import))
                      (done)))
                  (p/catch (fn [error]
                             (is false (str error))
                             (done)))))))))

(deftest db-sync-import-rows-chunk-rejects-stale-import-id-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  upserts (atom [])
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  rows-chunk (@thread-api/*thread-apis :thread-api/db-sync-import-rows-chunk)
                  finalize (@thread-api/*thread-apis :thread-api/db-sync-import-finalize)]
              (-> (p/with-redefs [db-worker/<get-opfs-pool (fn [_] (p/resolved (fake-import-pool [:first :second] closed)))
                                  common-sqlite/create-kvs-table! (fn [_] nil)
                                  db-worker/enable-sqlite-wal-mode! (fn [_] nil)
                                  db-worker/upsert-addr-content! (fn [db binds]
                                                                   (swap! upserts conj {:db db :binds binds}))
                                  rtc-log-and-state/rtc-log (fn [& _] nil)
                                  db-worker/import-datoms-to-db! (fn [& _] (p/resolved nil))]
                    (p/let [first-import (prepare test-repo false "graph-1" false)
                            second-import (prepare test-repo false "graph-1" false)
                            stale-outcome (capture-outcome #(rows-chunk [[1 "content-1" "addresses-1"]] "graph-1" (:import-id first-import)))]
                      (is (= :db-sync/stale-import (some-> stale-outcome :error ex-data :type)))
                      (is (empty? @upserts))
                      (-> (rows-chunk [[2 "content-2" "addresses-2"]] "graph-1" (:import-id second-import))
                          (p/then (fn [_]
                                    (is (= 1 (count @upserts)))
                                    (finalize test-repo "graph-1" 42 (:import-id second-import))))
                          (p/then (fn [_] (done))))))
                  (p/catch (fn [error]
                             (is false (str error))
                             (done)))))))))

(deftest db-sync-import-rows-chunk-imports-plain-rows-in-a-single-write-batch-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  upserts (atom [])
                  rows (make-snapshot-rows 250)
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  rows-chunk (@thread-api/*thread-apis :thread-api/db-sync-import-rows-chunk)]
              (-> (p/with-redefs [db-worker/<get-opfs-pool (fn [_] (p/resolved (fake-import-pool [:plain] closed)))
                                  common-sqlite/create-kvs-table! (fn [_] nil)
                                  db-worker/enable-sqlite-wal-mode! (fn [_] nil)
                                  db-worker/upsert-addr-content! (fn [db binds]
                                                                   (swap! upserts conj {:db db :binds binds}))
                                  rtc-log-and-state/rtc-log (fn [& _] nil)]
                    (p/let [{:keys [import-id]} (prepare test-repo false "graph-1" false)
                            _ (rows-chunk rows "graph-1" import-id)]
                      (is (= 1 (count @upserts)))
                      (is (= (count rows) (count (:binds (first @upserts)))))
                      (done)))
                  (p/catch (fn [error]
                             (is false (str error))
                             (done)))))))))

(deftest db-sync-import-rows-chunk-imports-encrypted-rows-in-a-single-write-batch-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  upserts (atom [])
                  decrypt-calls (atom [])
                  rows (make-snapshot-rows 250)
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  rows-chunk (@thread-api/*thread-apis :thread-api/db-sync-import-rows-chunk)]
              (-> (p/with-redefs [db-worker/<get-opfs-pool (fn [_] (p/resolved (fake-import-pool [:encrypted] closed)))
                                  common-sqlite/create-kvs-table! (fn [_] nil)
                                  db-worker/enable-sqlite-wal-mode! (fn [_] nil)
                                  sync-crypt/<fetch-graph-aes-key-for-download (fn [_] (p/resolved :aes-key))
                                  sync-crypt/<decrypt-snapshot-rows-batch (fn [aes-key rows-batch]
                                                                            (swap! decrypt-calls conj {:aes-key aes-key
                                                                                                       :rows rows-batch})
                                                                            (p/resolved rows-batch))
                                  db-worker/upsert-addr-content! (fn [db binds]
                                                                   (swap! upserts conj {:db db :binds binds}))
                                  rtc-log-and-state/rtc-log (fn [& _] nil)]
                    (p/let [{:keys [import-id]} (prepare test-repo false "graph-1" true)
                            _ (rows-chunk rows "graph-1" import-id)]
                      (is (= 1 (count @decrypt-calls)))
                      (is (= rows (:rows (first @decrypt-calls))))
                      (is (= 1 (count @upserts)))
                      (is (= (count rows) (count (:binds (first @upserts)))))
                      (done)))
                  (p/catch (fn [error]
                             (is false (str error))
                             (done)))))))))

(deftest db-sync-import-finalize-rejects-stale-import-id-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  finalize (@thread-api/*thread-apis :thread-api/db-sync-import-finalize)
                  finalized (atom [])]
              (-> (p/with-redefs [db-worker/<get-opfs-pool (fn [_] (p/resolved (fake-import-pool [:first :second] closed)))
                                  common-sqlite/create-kvs-table! (fn [_] nil)
                                  db-worker/enable-sqlite-wal-mode! (fn [_] nil)
                                  db-worker/import-datoms-to-db! (fn [& args]
                                                                   (swap! finalized conj args)
                                                                   (p/resolved nil))]
                    (p/let [first-import (prepare test-repo false "graph-1" false)
                            second-import (prepare test-repo false "graph-1" false)
                            stale-outcome (capture-outcome #(finalize test-repo "graph-1" 42 (:import-id first-import)))]
                      (is (= :db-sync/stale-import (some-> stale-outcome :error ex-data :type)))
                      (is (empty? @finalized))
                      (-> (finalize test-repo "graph-1" 42 (:import-id second-import))
                          (p/then (fn [_]
                                    (is (= 1 (count @finalized)))
                                    (done))))))
                  (p/catch (fn [error]
                             (is false (str error))
                             (done)))))))))

(deftest db-sync-import-finalize-rebuilds-into-fresh-db-for-e2ee-import-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  removed (atom [])
                  captured (atom nil)
                  pool #js {:removeVfs (fn [] (swap! removed conj :removed))}
                  datoms [{:e 171 :a :block/name :v "$$$views" :tx 1 :added true}]
                  storage-conn (d/create-conn db-schema/schema)
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  finalize (@thread-api/*thread-apis :thread-api/db-sync-import-finalize)]
              (d/transact! storage-conn
                           (mapv (fn [{:keys [e a v]}]
                                   [:db/add e a v])
                                 datoms))
              (-> (p/with-redefs [db-worker/<get-opfs-pool (fn [_] (p/resolved (fake-import-pool [:encrypted] closed)))
                                  common-sqlite/create-kvs-table! (fn [_] nil)
                                  db-worker/enable-sqlite-wal-mode! (fn [_] nil)
                                  worker-state/get-opfs-pool (fn [_] pool)
                                  sync-crypt/<fetch-graph-aes-key-for-download (fn [_] (p/resolved :aes-key))
                                  common-sqlite/get-storage-conn (fn [_ _] storage-conn)
                                  db-worker/import-datoms-to-db! (fn [& args]
                                                                   (reset! captured args)
                                                                   (p/resolved nil))]
                    (p/let [{:keys [import-id]} (prepare test-repo false "graph-1" true)
                            _ (finalize test-repo "graph-1" 42 import-id)]
                      (let [[repo graph-id remote-tx imported-datoms] @captured]
                        (is (= test-repo repo))
                        (is (= "graph-1" graph-id))
                        (is (= 42 remote-tx))
                        (is (= [[171 :block/name "$$$views"]]
                               (mapv (fn [d] [(:e d) (:a d) (:v d)]) imported-datoms))))
                      (is (= [:removed] @removed))
                      (is (nil? (get @worker-state/*opfs-pools test-repo)))
                      (done)))
                  (p/catch (fn [error]
                             (is false (str error))
                             (done)))))))))

(deftest db-sync-import-finalize-keeps-direct-open-for-non-e2ee-import-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  removed (atom [])
                  captured (atom nil)
                  pool #js {:removeVfs (fn [] (swap! removed conj :removed))}
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  finalize (@thread-api/*thread-apis :thread-api/db-sync-import-finalize)]
              (reset! worker-state/*opfs-pools {test-repo pool})
              (-> (p/with-redefs [db-worker/<get-opfs-pool (fn [_] (p/resolved (fake-import-pool [:plain] closed)))
                                  common-sqlite/create-kvs-table! (fn [_] nil)
                                  db-worker/enable-sqlite-wal-mode! (fn [_] nil)
                                  db-worker/import-datoms-to-db! (fn [& args]
                                                                   (reset! captured args)
                                                                   (p/resolved nil))]
                    (p/let [{:keys [import-id]} (prepare test-repo false "graph-1" false)
                            _ (finalize test-repo "graph-1" 42 import-id)]
                      (is (= [test-repo "graph-1" 42 nil] @captured))
                      (is (empty? @removed))
                      (done)))
                  (p/catch (fn [error]
                             (is false (str error))
                             (done)))))))))
