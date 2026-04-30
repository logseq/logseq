(ns frontend.worker.db-worker-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.a-test-env]
            [frontend.worker.db-core :as db-worker]
            [frontend.worker.platform :as platform]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.download :as sync-download]
            [frontend.worker.sync.log-and-state :as rtc-log-and-state]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]))

(def ^:private test-repo "test-db-worker-repo")
(def ^:private close-db!-orig db-worker/close-db!)
(def ^:private decrypt-snapshot-datoms-batch-orig sync-crypt/<decrypt-snapshot-datoms-batch)
(def ^:private fetch-graph-aes-key-for-download-orig sync-crypt/<fetch-graph-aes-key-for-download)
(def ^:private rehydrate-large-titles-from-db-orig db-sync/rehydrate-large-titles-from-db!)
(def ^:private rtc-log-orig rtc-log-and-state/rtc-log)
(def ^:private update-local-tx-orig client-op/update-local-tx)
(def ^:private broadcast-to-clients-orig shared-service/broadcast-to-clients!)

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
        cleanup (fn []
                  (set! db-worker/close-db! close-db!-orig)
                  (set! sync-crypt/<decrypt-snapshot-datoms-batch decrypt-snapshot-datoms-batch-orig)
                  (set! sync-crypt/<fetch-graph-aes-key-for-download fetch-graph-aes-key-for-download-orig)
                  (set! db-sync/rehydrate-large-titles-from-db! rehydrate-large-titles-from-db-orig)
                  (set! rtc-log-and-state/rtc-log rtc-log-orig)
                  (set! client-op/update-local-tx update-local-tx-orig)
                  (set! shared-service/broadcast-to-clients! broadcast-to-clients-orig)
                  (reset! worker-state/*sqlite-conns sqlite-conns-prev)
                  (reset! worker-state/*datascript-conns datascript-prev)
                  (reset! worker-state/*client-ops-conns client-ops-prev)
                  (reset! worker-state/*opfs-pools opfs-prev)
                  (reset! search/fuzzy-search-indices fuzzy-prev)
                  (reset! worker-state/*sqlite sqlite-prev)
                  (reset! @#'platform/*platform platform-prev))]
    (set! db-worker/close-db! close-db!-orig)
    (set! sync-crypt/<decrypt-snapshot-datoms-batch decrypt-snapshot-datoms-batch-orig)
    (set! sync-crypt/<fetch-graph-aes-key-for-download fetch-graph-aes-key-for-download-orig)
    (set! db-sync/rehydrate-large-titles-from-db! rehydrate-large-titles-from-db-orig)
    (set! rtc-log-and-state/rtc-log rtc-log-orig)
    (set! client-op/update-local-tx update-local-tx-orig)
    (set! shared-service/broadcast-to-clients! broadcast-to-clients-orig)
    (platform/set-platform! (build-test-platform))
    (reset! worker-state/*sqlite #js {})
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
       (reset! client-op/*repo->pending-local-tx-count {test-repo 9})

       (db-worker/close-db! test-repo)

       (is (= #{:db :search :client-ops} (set @closed)))
       (is (= 1 @pause-calls))
       (is (nil? (get @search/fuzzy-search-indices test-repo)))
       (is (nil? (get @client-op/*repo->pending-local-tx-count test-repo)))
       (is (nil? (get @worker-state/*sqlite-conns test-repo)))))))

(deftest close-db-checkpoints-wal-before-closing-test
  (restoring-worker-state
   (fn []
     (let [sql-calls (atom [])
           closed (atom [])
           mk-db (fn [label]
                   #js {:exec (fn [sql]
                                (swap! sql-calls conj [label sql]))
                        :close (fn []
                                 (swap! closed conj label))})]
       (reset! worker-state/*sqlite-conns
               {test-repo {:db (mk-db :db)
                           :search (mk-db :search)
                           :client-ops (mk-db :client-ops)}})

       (db-worker/close-db! test-repo)

       (is (= [[:db "PRAGMA wal_checkpoint(TRUNCATE)"]
               [:search "PRAGMA wal_checkpoint(TRUNCATE)"]
               [:client-ops "PRAGMA wal_checkpoint(TRUNCATE)"]]
              @sql-calls))
       (is (= [:db :search :client-ops] @closed))))))

(deftest client-ops-cleanup-timer-starts-once-and-clears-on-close-test
  (restoring-worker-state
   (fn []
     (let [scheduled (atom [])
           cleared (atom [])
           original-set-interval js/setInterval
           original-clear-interval js/clearInterval
           fake-db' #js {:close (fn [] nil)}
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
                 {test-repo {:db fake-db'
                             :search fake-db'
                             :client-ops fake-db'}})
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
                              :thread-api/create-or-open-db (fn [_repo _opts] (p/resolved nil))
                              :thread-api/export-db (fn [_repo] (p/resolved nil))
                              :thread-api/db-sync-rehydrate-large-titles (fn [_repo _graph-id] (p/resolved nil))))
              (-> (p/with-redefs [rtc-log-and-state/rtc-log (fn [& _] nil)
                                  client-op/update-graph-uuid (fn [& _] nil)
                                  client-op/update-local-tx (fn [& _] nil)
                                  shared-service/broadcast-to-clients! (fn [& _] nil)]
                    (sync-download/complete-datoms-import! test-repo "graph-1" 42))
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
  ([repo conn f]
   (with-fake-create-or-open-db repo conn {} f))
  ([repo conn
    {:keys [create-or-open-db-f close-db-f invalidate-search-db-f unlink-db-f recreate-lock-f]}
    f]
   (let [thread-apis-prev @thread-api/*thread-apis
         create-or-open-db-f (or create-or-open-db-f
                                 (fn [_repo _opts]
                                   (swap! worker-state/*datascript-conns assoc repo conn)
                                   (p/resolved nil)))
         close-db-f (or close-db-f (fn [_repo] nil))
         invalidate-search-db-f (or invalidate-search-db-f (fn [_repo] (p/resolved nil)))
         unlink-db-f (or unlink-db-f (fn [_repo] nil))
         recreate-lock-f (or recreate-lock-f (fn [_repo] (p/resolved nil)))]
     (vreset! thread-api/*thread-apis
              (assoc thread-apis-prev
                     :thread-api/create-or-open-db create-or-open-db-f
                     :thread-api/db-sync-close-db close-db-f
                     :thread-api/db-sync-invalidate-search-db invalidate-search-db-f
                     :thread-api/unsafe-unlink-db unlink-db-f
                     :thread-api/db-sync-recreate-lock recreate-lock-f))
     (-> (f)
         (p/finally (fn []
                      (vreset! thread-api/*thread-apis thread-apis-prev)))))))

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
                  (-> (p/with-redefs [db-worker/close-db! (fn [_] nil)]
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

(deftest db-sync-import-prepare-reset-unlinks-db-before-reopen-test
  (async done
    (restoring-worker-state
     (fn []
       (let [prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
             conn (d/create-conn db-schema/schema)
             calls (atom [])]
         (with-fake-create-or-open-db
           test-repo conn
           {:close-db-f (fn [repo]
                          (swap! calls conj [:close repo])
                          nil)
            :unlink-db-f (fn [repo]
                           (swap! calls conj [:unlink repo])
                           nil)
            :recreate-lock-f (fn [repo]
                               (swap! calls conj [:recreate-lock repo])
                               (p/resolved nil))
            :invalidate-search-db-f (fn [repo]
                                      (swap! calls conj [:invalidate-search repo])
                                      (p/resolved nil))
            :create-or-open-db-f (fn [repo opts]
                                   (swap! calls conj [:create-or-open repo opts])
                                   (swap! worker-state/*datascript-conns assoc repo conn)
                                   (p/resolved nil))}
           (fn []
             (-> (prepare test-repo true "graph-1" false)
                 (p/then (fn [_]
                           (let [ops (mapv first @calls)
                                 idx (fn [op]
                                       (first (keep-indexed (fn [i v]
                                                              (when (= op v) i))
                                                            ops)))]
                             (is (some? (idx :close)))
                             (is (some? (idx :unlink)))
                             (is (some? (idx :recreate-lock)))
                             (is (some? (idx :invalidate-search)))
                             (is (some? (idx :create-or-open)))
                             (is (< (idx :close) (idx :unlink)))
                             (is (< (idx :unlink) (idx :recreate-lock)))
                             (is (< (idx :recreate-lock) (idx :invalidate-search)))
                             (is (< (idx :invalidate-search) (idx :create-or-open))))
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
                  (-> (p/with-redefs [rtc-log-and-state/rtc-log (fn [& _] nil)
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

(deftest db-sync-import-finalize-cleans-temp-pool-on-success-test
  (async done
         (restoring-worker-state
          (fn []
            (let [import-id "import-success-1"
                  graph-id "graph-success-1"
                  remote-tx 42
                  rows-db-closed* (atom 0)
                  removed-pools* (atom [])
                  rows-pool #js {:name "temp-download-pool"}
                  rows-db #js {:close (fn []
                                        (swap! rows-db-closed* inc))}]
              (reset! @#'sync-download/*import-state
                      {:import-id import-id
                       :repo test-repo
                       :graph-id graph-id
                       :rows-db rows-db
                       :rows-pool rows-pool
                       :rows-path "/download-import.sqlite"
                       :rows-imported? false})
              (-> (p/with-redefs [sync-download/complete-datoms-import! (fn [_repo _graph-id _remote-tx]
                                                                          (p/resolved :ok))
                                  platform/remove-storage-pool! (fn [_platform pool]
                                                                  (swap! removed-pools* conj pool)
                                                                  (p/resolved true))]
                    (sync-download/finalize-import! test-repo graph-id remote-tx import-id))
                  (p/then (fn [result]
                            (is (= :ok result))
                            (is (= 1 @rows-db-closed*))
                            (is (= [rows-pool] @removed-pools*))
                            (is (nil? @@#'sync-download/*import-state))
                            (done)))
                  (p/catch (fn [error]
                             (is false (str error))
                             (done)))))))))

(deftest db-sync-download-graph-by-id-cleans-temp-pool-on-failure-test
  (async done
         (restoring-worker-state
          (fn []
            (let [original-fetch js/fetch
                  import-id "import-failure-1"
                  graph-id "graph-failure-1"
                  rows-db-closed* (atom 0)
                  removed-pools* (atom [])
                  finalize-calls* (atom 0)
                  rows-pool #js {:name "temp-download-pool"}
                  rows-db #js {:close (fn []
                                        (swap! rows-db-closed* inc))}]
              (reset! worker-state/*db-sync-config {:http-base "https://sync.example.test"})
              (set! js/fetch (fn [_url _opts]
                               (p/resolved #js {:ok true})))
              (-> (p/with-redefs [rtc-log-and-state/rtc-log (fn [& _] nil)
                                  sync-download/fetch-json (fn [_url _opts schema]
                                                             (case schema
                                                               :sync/pull (p/resolved {:t 77})
                                                               :sync/snapshot-download (p/resolved {:url "https://snapshot.example.test"})
                                                               (p/rejected (ex-info "unexpected schema" {:schema schema}))))
                                  sync-download/prepare-import! (fn [repo _reset? gid _graph-e2ee? & _]
                                                                  (reset! @#'sync-download/*import-state
                                                                          {:import-id import-id
                                                                           :repo repo
                                                                           :graph-id gid
                                                                           :rows-db rows-db
                                                                           :rows-pool rows-pool
                                                                           :rows-path "/download-import.sqlite"
                                                                           :rows-imported? false})
                                                                  (p/resolved {:import-id import-id}))
                                  sync-download/import-rows-chunk! (fn [_rows _graph-id _import-id]
                                                                     (p/resolved true))
                                  sync-download/finalize-import! (fn [& _]
                                                                   (swap! finalize-calls* inc)
                                                                   (p/resolved nil))
                                  sync-download/<stream-snapshot-row-batches! (fn [_resp _batch-size on-batch]
                                                                                (p/let [_ (on-batch [[1 "content" nil]])]
                                                                                  (p/rejected (ex-info "stream failed" {:code :stream-failed}))))
                                  platform/remove-storage-pool! (fn [_platform pool]
                                                                  (swap! removed-pools* conj pool)
                                                                  (p/resolved true))]
                    (sync-download/download-graph-by-id! test-repo graph-id false))
                  (p/then (fn [_]
                            (is false "expected download failure")
                            (done)))
                  (p/catch (fn [error]
                             (is (string/includes? (or (ex-message error) "") "db-sync download failed"))
                             (is (= 1 @rows-db-closed*))
                             (is (= [rows-pool] @removed-pools*))
                             (is (= 0 @finalize-calls*))
                             (is (nil? @@#'sync-download/*import-state))
                             (done)))
                  (p/finally (fn []
                               (set! js/fetch original-fetch)))))))))

(deftest db-sync-import-rows-chunk-calls-import-rows-batch-test
  (async done
         (restoring-worker-state
          (fn []
            (let [prepare (@thread-api/*thread-apis :thread-api/db-sync-import-prepare)
                  rows-chunk (@thread-api/*thread-apis :thread-api/db-sync-import-rows-chunk)
                  conn (d/create-conn db-schema/schema)
                  rows [[1 "row-1" nil]
                        [2 "row-2" nil]]
                  captured-rows (atom nil)]
              (with-fake-create-or-open-db
                test-repo conn
                (fn []
                  (-> (p/with-redefs [db-worker/close-db! (fn [_] nil)
                                      rtc-log-and-state/rtc-log (fn [& _] nil)
                                      sync-download/<ensure-import-rows-db! (fn [state]
                                                                              (p/resolved state))
                                      sync-download/import-rows-batch! (fn [_state rows*]
                                                                         (reset! captured-rows rows*)
                                                                         (p/resolved 2))]
                        (p/let [{:keys [import-id]} (prepare test-repo true "graph-1" false)
                                _ (rows-chunk rows "graph-1" import-id)]
                          (is (= rows @captured-rows))
                          (done)))
                      (p/catch (fn [error]
                                 (is false (str error))
                                 (done)))))))))))

(deftest snapshot-datoms-in-import-order-puts-schema-before-data-test
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 0}}
                       {:db/ident :user.test/attr
                        :db/valueType :db.type/string
                        :db/cardinality :db.cardinality/one}
                       {:db/id 100
                        :user.test/attr "hello"}])
    (let [ordered (vec (#'sync-download/snapshot-datoms-in-import-order conn))
          data-idx (first (keep-indexed (fn [idx datom]
                                          (when (and (= 100 (:e datom))
                                                     (= :user.test/attr (:a datom)))
                                            idx))
                                        ordered))
          attr-eid (:db/id (d/entity @conn :user.test/attr))
          ident-idx (first (keep-indexed (fn [idx datom]
                                           (when (and (= attr-eid (:e datom))
                                                      (= :db/ident (:a datom)))
                                             idx))
                                         ordered))
          cardinality-idx (first (keep-indexed (fn [idx datom]
                                                 (when (and (= attr-eid (:e datom))
                                                            (= :db/cardinality (:a datom)))
                                                   idx))
                                               ordered))
          schema-version-eid (:db/id (d/entity @conn :logseq.kv/schema-version))
          schema-version-idx (first (keep-indexed (fn [idx datom]
                                                    (when (and (= schema-version-eid (:e datom))
                                                               (= :db/ident (:a datom)))
                                                      idx))
                                                  ordered))]
      (is (number? data-idx))
      (is (number? ident-idx))
      (is (number? cardinality-idx))
      (is (number? schema-version-idx))
      (is (< schema-version-idx data-idx))
      (is (< ident-idx data-idx))
      (is (< cardinality-idx data-idx)))))

(deftest import-datoms-batch-transacts-all-db-schema-before-data-test
  (async done
         (let [conn (d/create-conn db-schema/schema)
               attr-eid 8001
               datoms [{:e attr-eid :a :db/ident :v :user.test/indexed}
                       {:e 100 :a :user.test/indexed :v "hello"}
                       {:e attr-eid :a :db/valueType :v :db.type/string}
                       {:e attr-eid :a :db/cardinality :v :db.cardinality/one}
                       {:e attr-eid :a :db/index :v true}]]
           (-> (#'sync-download/import-datoms-batch! conn nil false datoms)
               (p/then (fn [_]
                         (is (= 1 (count (d/datoms @conn :avet :user.test/indexed "hello"))))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

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
           (is (= [conn nil]
                  @captured)))
         (finally
           (reset! db-sync/*repo->latest-remote-tx latest-prev)))))))
(deftest thread-api-recompute-checksum-diagnostics-passes-sync-diagnostics-test
  (restoring-worker-state
   (fn []
     (let [recompute (@thread-api/*thread-apis :thread-api/recompute-checksum-diagnostics)
           conn (d/create-conn db-schema/schema)
           captured (atom nil)
           latest-tx-prev @db-sync/*repo->latest-remote-tx
           latest-checksum-prev @db-sync/*repo->latest-remote-checksum
           result {:recomputed-checksum "recomputed"
                   :checksum-attrs [:block/uuid]
                   :blocks []}]
       (reset! worker-state/*datascript-conns {test-repo conn})
       (reset! db-sync/*repo->latest-remote-tx {test-repo 22})
       (reset! db-sync/*repo->latest-remote-checksum {test-repo "remote-checksum"})
       (try
         (with-redefs [client-op/get-local-tx (fn [_repo] 10)
                       client-op/get-local-checksum (fn [_repo] "local-checksum")
                       worker-db-validate/recompute-checksum-diagnostics (fn [& args]
                                                                           (reset! captured args)
                                                                           result)]
           (is (= (assoc result :local-checksum "recomputed")
                  (recompute test-repo)))
           (is (= [test-repo
                   conn
                   {:local-checksum "local-checksum"
                    :remote-checksum "remote-checksum"}]
                  @captured)))
         (finally
           (reset! db-sync/*repo->latest-remote-tx latest-tx-prev)
           (reset! db-sync/*repo->latest-remote-checksum latest-checksum-prev)))))))

(deftest thread-api-export-client-ops-db-checkpoints-and-exports-client-ops-file-test
  (async done
    (restoring-worker-state
     (fn []
       (let [export-client-ops-db (@thread-api/*thread-apis :thread-api/export-client-ops-db)
             sql-calls (atom [])
             export-calls (atom [])
             expected-data (js/Uint8Array. #js [1 2 3])
             expected-buffer (.-buffer expected-data)
             fake-pool #js {}
             platform' (assoc-in (build-test-platform)
                                 [:storage :export-file]
                                 (fn [_pool path]
                                   (swap! export-calls conj path)
                                   (p/resolved expected-buffer)))]
         (platform/set-platform! platform')
         (reset! worker-state/*opfs-pools {test-repo fake-pool})
         (with-redefs [worker-state/get-sqlite-conn (fn [_repo which-db]
                                                      (when (= :client-ops which-db)
                                                        #js {:exec (fn [sql]
                                                                     (swap! sql-calls conj sql))}))]
           (-> (export-client-ops-db test-repo)
               (p/then (fn [result]
                         (is (= ["PRAGMA wal_checkpoint(TRUNCATE)"] @sql-calls))
                         (is (= 1 (count @export-calls)))
                         (is (contains? #{"client-ops/db.sqlite"
                                          "client-ops-/db.sqlite"}
                                        (first @export-calls)))
                         (is (instance? js/Uint8Array result))
                         (is (= [1 2 3] (vec result)))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done))))))))))
