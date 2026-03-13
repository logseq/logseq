(ns frontend.worker.db-worker-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.a-test-env]
            [frontend.worker.db-core :as db-worker]
            [frontend.worker.platform :as platform]
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

(defn- fake-db
  [label closed]
  (let [tx #js {:exec (fn [_] nil)}]
    #js {:exec (fn [_] #js [])
         :transaction (fn [f] (f tx))
         :close (fn []
                  (when (and label closed)
                    (swap! closed conj label)))}))

(defn- build-test-platform
  []
  {:env {:publishing? false
         :runtime :browser}
   :storage {:install-opfs-pool (fn [_sqlite _pool-name]
                                  (p/resolved #js {:pauseVfs (fn [] nil)
                                                   :unpauseVfs (fn [] nil)}))
             :list-graphs (fn [] (p/resolved []))
             :db-exists? (fn [_] (p/resolved false))
             :resolve-db-path (fn [_repo _pool path] path)
             :export-file (fn [_ _] (p/resolved (js/Uint8Array. 0)))
             :import-db (fn [_ _ _] (p/resolved nil))
             :remove-vfs! (fn [_] nil)
             :read-text! (fn [_] (p/resolved ""))
             :write-text! (fn [_ _] (p/resolved nil))
             :transfer (fn [data _transferables] data)}
   :kv {:get (fn [_] nil)
        :set! (fn [_ _] nil)}
   :broadcast {:post-message! (fn [& _] nil)}
   :websocket {:connect (fn [_] #js {})}
   :sqlite {:init! (fn [] nil)
            :open-db (fn [_opts] (fake-db nil nil))
            :close-db (fn [db] (.close db))
            :exec (fn [db sql-or-opts] (.exec db sql-or-opts))
            :transaction (fn [db f] (.transaction db f))}
   :crypto {}
   :timers {:set-interval! (fn [_ _] nil)}})

(defn- restoring-worker-state
  [f]
  (let [sqlite-conns-prev @worker-state/*sqlite-conns
        datascript-prev @worker-state/*datascript-conns
        client-ops-prev @worker-state/*client-ops-conns
        opfs-prev @worker-state/*opfs-pools
        fuzzy-prev @search/fuzzy-search-indices
        sqlite-prev @worker-state/*sqlite
        platform-prev @@#'platform/*platform
        import-state-prev @@#'db-worker/*import-state]
    (try
      (platform/set-platform! (build-test-platform))
      (reset! worker-state/*sqlite #js {})
      (reset! @#'db-worker/*import-state nil)
      (f)
      (finally
        (reset! worker-state/*sqlite-conns sqlite-conns-prev)
        (reset! worker-state/*datascript-conns datascript-prev)
        (reset! worker-state/*client-ops-conns client-ops-prev)
        (reset! worker-state/*opfs-pools opfs-prev)
        (reset! search/fuzzy-search-indices fuzzy-prev)
        (reset! worker-state/*sqlite sqlite-prev)
        (reset! @#'platform/*platform platform-prev)
        (reset! @#'db-worker/*import-state import-state-prev)))))

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

(defn- import-db-factory
  [labels closed]
  (let [remaining (atom labels)]
    (fn [_repo _reset?]
      (let [label (first @remaining)]
        (swap! remaining rest)
        (p/resolved (fake-db label closed))))))

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
       (is (nil? (get @worker-state/*sqlite-conns test-repo)))))))

(deftest import-datoms-to-db-happy-path-test
  (async done
         (restoring-worker-state
          (fn []
            (let [thread-apis-prev @thread-api/*thread-apis]
              (vreset! thread-api/*thread-apis
                       (assoc thread-apis-prev
                              :thread-api/create-or-open-db (fn [_repo _opts] (p/resolved nil))
                              :thread-api/export-db (fn [_repo] (p/resolved nil))))
              (-> (p/with-redefs [db-sync/rehydrate-large-titles-from-db! (fn [_repo _graph-id] (p/resolved nil))
                                  rtc-log-and-state/rtc-log (fn [& _] nil)
                                  client-op/update-graph-uuid (fn [& _] nil)
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

(deftest db-sync-import-prepare-replaces-active-import-state-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)]
              (-> (p/with-redefs [db-worker/ensure-db-sync-import-db! (import-db-factory [:first :second] closed)
                                  rtc-log-and-state/rtc-log (fn [& _] nil)]
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
                  log-calls (atom 0)
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)]
              (-> (p/with-redefs [db-worker/ensure-db-sync-import-db! (import-db-factory [:failed :retry] closed)
                                  rtc-log-and-state/rtc-log (fn [& _]
                                                              (when (zero? @log-calls)
                                                                (swap! log-calls inc)
                                                                (throw (ex-info "setup failed" {}))))]
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

(deftest db-sync-import-rows-chunk-stale-id-and-plain-import-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  upserts (atom [])
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  rows-chunk (@thread-api/*thread-apis :thread-api/db-sync-import-rows-chunk)]
              (-> (p/with-redefs [db-worker/ensure-db-sync-import-db! (import-db-factory [:first :second] closed)
                                  db-worker/upsert-addr-content! (fn [db binds]
                                                                   (swap! upserts conj {:db db :binds binds}))
                                  rtc-log-and-state/rtc-log (fn [& _] nil)]
                    (p/let [first-import (prepare test-repo false "graph-1" false)
                            second-import (prepare test-repo false "graph-1" false)
                            stale-outcome (capture-outcome #(rows-chunk [[1 "content-1" "addresses-1"]]
                                                                         "graph-1"
                                                                         (:import-id first-import)))
                            _ (rows-chunk [[2 "content-2" "addresses-2"]]
                                          "graph-1"
                                          (:import-id second-import))]
                      (is (= :db-sync/stale-import (some-> stale-outcome :error ex-data :type)))
                      (is (= 1 (count @upserts)))
                      (done)))
                  (p/catch (fn [error]
                             (is false (str error))
                             (done)))))))))

(deftest db-sync-import-rows-chunk-imports-encrypted-rows-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  upserts (atom [])
                  decrypt-calls (atom [])
                  rows (make-snapshot-rows 250)
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  rows-chunk (@thread-api/*thread-apis :thread-api/db-sync-import-rows-chunk)]
              (-> (p/with-redefs [db-worker/ensure-db-sync-import-db! (import-db-factory [:encrypted] closed)
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

(deftest db-sync-import-finalize-stale-id-and-success-test
  (async done
         (restoring-worker-state
          (fn []
            (let [closed (atom [])
                  prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  finalize (@thread-api/*thread-apis :thread-api/db-sync-import-finalize)
                  finalized (atom [])
                  storage-conn (d/create-conn db-schema/schema)]
              (d/transact! storage-conn [[:db/add 171 :block/name "$$$views"]])
              (-> (p/with-redefs [db-worker/ensure-db-sync-import-db! (import-db-factory [:first :second] closed)
                                  common-sqlite/get-storage-conn (fn [_ _] storage-conn)
                                  db-worker/import-datoms-to-db! (fn [& args]
                                                                   (swap! finalized conj args)
                                                                   (p/resolved nil))
                                  rtc-log-and-state/rtc-log (fn [& _] nil)]
                    (p/let [first-import (prepare test-repo false "graph-1" false)
                            second-import (prepare test-repo false "graph-1" false)
                            stale-outcome (capture-outcome #(finalize test-repo "graph-1" 42 (:import-id first-import)))
                            _ (finalize test-repo "graph-1" 42 (:import-id second-import))]
                      (is (= :db-sync/stale-import (some-> stale-outcome :error ex-data :type)))
                      (is (= 1 (count @finalized)))
                      (let [[repo graph-id remote-tx imported-datoms] (first @finalized)]
                        (is (= test-repo repo))
                        (is (= "graph-1" graph-id))
                        (is (= 42 remote-tx))
                        (is (= [[171 :block/name "$$$views"]]
                               (mapv (fn [datom] [(:e datom) (:a datom) (:v datom)]) imported-datoms))))
                      (done)))
                  (p/catch (fn [error]
                             (is false (str error))
                             (done)))))))))
