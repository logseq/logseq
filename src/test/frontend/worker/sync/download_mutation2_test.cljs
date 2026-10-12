(ns frontend.worker.sync.download-mutation2-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.platform :as platform]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.download :as sync-download]
            [frontend.worker.sync.log-and-state :as rtc-log-and-state]
            [frontend.worker.sync.util :as sync-util]
            [lambdaisland.glogi :as log]
            [logseq.db-sync.snapshot :as snapshot]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]))

(defn- finish
  [done <p]
  (-> <p
      (p/catch (fn [error] (is false (str error))))
      (p/finally (fn [] (done)))))

(defn- <rejection
  "`{:error e}` for the error `<p` rejects with, or `{:resolved v}`. (A bare Error would be
  treated as a rejection by promesa.)"
  [<p]
  (-> <p
      (p/then (fn [v] {:resolved v}))
      (p/catch (fn [e] {:error e}))))

(defn- frame-bytes
  [^js data]
  (let [len (.-byteLength data)
        out (js/Uint8Array. (+ 4 len))
        view (js/DataView. (.-buffer out))]
    (.setUint32 view 0 len false)
    (.set out data 4)
    out))

(deftest bytes->stream-emits-payload-then-closes-test
  (async done
         (let [payload (js/Uint8Array. #js [1 2 3])]
           (finish done
                   (p/let [reader (.getReader (#'sync-download/bytes->stream payload))
                           first-read (p/timeout (.read reader) 100)
                           second-read (p/timeout (.read reader) 100)]
                     (is (false? (.-done first-read)))
                     (is (identical? payload (.-value first-read)))
                     (is (true? (.-done second-read))))))))

(deftest stream-starts-with-gzip-false-when-read-fails-test
  (async done
         (let [stream (js/ReadableStream.
                       #js {:pull (fn [controller]
                                    (.error controller (js/Error. "boom")))})]
           (finish done
                   (p/let [result (#'sync-download/<stream-starts-with-gzip? stream)]
                     (is (false? result)))))))

(deftest stream-starts-with-gzip-releases-reader-lock-test
  (async done
         (let [released? (atom false)
               stream #js {:getReader (fn []
                                        #js {:read (fn [] (js/Promise.resolve #js {:done true}))
                                             :releaseLock (fn [] (reset! released? true))})}]
           (finish done
                   (p/let [result (#'sync-download/<stream-starts-with-gzip? stream)]
                     (is (false? result))
                     (is (true? @released?)))))))

(deftest response-body-stream-keeps-payload-when-gzip-pipe-fails-test
  (async done
         (let [probe (js/ReadableStream.
                      #js {:start (fn [controller]
                                    (.enqueue controller (js/Uint8Array. #js [31 139 8]))
                                    (.close controller))})
               payload #js {:pipeThrough (fn [_] (throw (js/Error. "pipe failed")))}
               body #js {:tee (fn [] #js [probe payload])}
               resp #js {:body body
                         :headers (js/Headers. #js {"content-encoding" "gzip"})}]
           (finish done
                   (p/let [result (#'sync-download/<response-body-stream resp)]
                     (is (identical? payload result)))))))

(deftest stream-snapshot-row-batches-reports-chunk-count-test
  (async done
         (let [rows [[1 "row-1" nil]]
               resp (js/Response. (frame-bytes (snapshot/encode-rows rows)))
               empty-resp (js/Response. (js/ReadableStream. #js {:start (fn [controller] (.close controller))}))]
           (finish done
                   (p/let [full (#'sync-download/<stream-snapshot-row-batches!
                                 resp 1000 (fn [_] (p/resolved true)))
                           none (#'sync-download/<stream-snapshot-row-batches!
                                 empty-resp 1000 (fn [_] (p/resolved true)))]
                     (is (= {:chunk-count 1} full))
                     (is (= {:chunk-count 0} none)))))))

(deftest stream-snapshot-row-batches-buffered-path-reports-chunk-count-test
  (async done
         (let [rows [[1 "row-1" nil]]
               buffered (fn [^js payload]
                          #js {:body nil
                               :arrayBuffer (fn [] (js/Promise.resolve payload))})]
           (finish done
                   (p/let [full (#'sync-download/<stream-snapshot-row-batches!
                                 (buffered (frame-bytes (snapshot/encode-rows rows)))
                                 1000 (fn [_] (p/resolved true)))
                           none (#'sync-download/<stream-snapshot-row-batches!
                                 (buffered (js/Uint8Array. 0))
                                 1000 (fn [_] (p/resolved true)))]
                     (is (= {:chunk-count 1} full))
                     (is (= {:chunk-count 0} none)))))))

(deftest with-auth-headers-adds-bearer-token-test
  (with-redefs [worker-state/get-id-token (fn [] "tok")]
    (is (= {:method "GET" :headers {"authorization" "Bearer tok"}}
           (#'sync-download/with-auth-headers {:method "GET"})))))

(deftest fetch-json-passes-response-schema-test
  (let [calls (atom [])]
    (with-redefs [sync-util/fetch-json (fn [url opts config]
                                         (swap! calls conj [url opts config])
                                         :result)]
      (is (= :result (#'sync-download/fetch-json "https://x/pull" {:method "GET"} :sync/pull)))
      (is (= [["https://x/pull" {:method "GET"} {:response-schema :sync/pull}]] @calls)))))

(deftest complete-datoms-import-runs-steps-in-order-test
  (async done
         (let [events (atom [])
               apis-prev @thread-api/*thread-apis]
           (vreset! thread-api/*thread-apis
                    {:thread-api/db-sync-rehydrate-large-titles
                     (fn [repo graph-id]
                       (swap! events conj [:rehydrate repo graph-id])
                       (p/resolved nil))})
           (-> (p/with-redefs [worker-state/get-sqlite-conn
                               (fn [_repo k]
                                 (case k
                                   :search #js {:id :search}
                                   :db #js {:exec (fn [sql] (swap! events conj [:exec sql]))}))
                               search/truncate-table! (fn [db] (swap! events conj [:truncate (.-id db)]))
                               rtc-log-and-state/rtc-log (fn [type payload] (swap! events conj [:log type payload]))
                               client-op/update-local-tx (fn [repo tx] (swap! events conj [:update-local-tx repo tx]))
                               shared-service/broadcast-to-clients! (fn [k payload] (swap! events conj [:broadcast k payload]))]
                 (sync-download/complete-datoms-import! "repo" "graph-1" 7))
               (p/then (fn [_]
                         (is (= [[:truncate :search]
                                 [:log :rtc.log/download {:sub-type :download-progress
                                                          :graph-uuid "graph-1"
                                                          :message "Saving data to DB"}]
                                 [:rehydrate "repo" "graph-1"]
                                 [:log :rtc.log/download {:sub-type :download-completed
                                                          :graph-uuid "graph-1"
                                                          :message "Graph is ready!"}]
                                 [:exec "PRAGMA wal_checkpoint(TRUNCATE)"]
                                 [:update-local-tx "repo" 7]
                                 [:broadcast :add-repo {:repo "repo"}]]
                                @events))))
               (p/finally (fn [] (vreset! thread-api/*thread-apis apis-prev)))
               (->> (finish done))))))

(deftest complete-datoms-import-continues-when-rehydrate-fails-test
  (async done
         (let [events (atom [])
               apis-prev @thread-api/*thread-apis]
           (vreset! thread-api/*thread-apis
                    {:thread-api/db-sync-rehydrate-large-titles
                     (fn [_repo _graph-id] (p/rejected (ex-info "rehydrate failed" {})))})
           (-> (p/with-redefs [worker-state/get-sqlite-conn (fn [_repo _k] nil)
                               rtc-log-and-state/rtc-log (fn [_type payload] (swap! events conj (:sub-type payload)))
                               client-op/update-local-tx (fn [_repo _tx] (swap! events conj :update-local-tx))
                               shared-service/broadcast-to-clients! (fn [_k _payload] (swap! events conj :broadcast))]
                 (sync-download/complete-datoms-import! "repo" "graph-1" 7))
               (p/then (fn [_]
                         (is (= [:download-progress :download-completed :update-local-tx :broadcast]
                                @events))))
               (p/finally (fn [] (vreset! thread-api/*thread-apis apis-prev)))
               (->> (finish done))))))

(deftest complete-datoms-import-logs-missing-rehydrate-api-test
  (async done
         (let [records (atom [])
               handler (fn [record]
                         (let [message (:message record)]
                           (swap! records conj (if (map? message) (dissoc message :line) message))))
               apis-prev @thread-api/*thread-apis]
           (vreset! thread-api/*thread-apis {})
           (log/add-handler handler)
           (-> (p/with-redefs [worker-state/get-sqlite-conn (fn [_repo _k] nil)
                               rtc-log-and-state/rtc-log (fn [_type _payload] nil)
                               client-op/update-local-tx (fn [_repo _tx] nil)
                               shared-service/broadcast-to-clients! (fn [_k _payload] nil)]
                 (sync-download/complete-datoms-import! "repo" "graph-1" 7))
               (p/then (fn [_]
                         (is (some #(= {:db-sync/missing-field
                                        {:field :thread-api/db-sync-rehydrate-large-titles}}
                                       %)
                                   @records)
                             (pr-str @records))))
               (p/finally (fn []
                            (log/remove-handler handler)
                            (vreset! thread-api/*thread-apis apis-prev)))
               (->> (finish done))))))

(deftest complete-datoms-import-swallows-later-step-failure-test
  (async done
         (let [apis-prev @thread-api/*thread-apis
               error-prev (.-error js/console)
               logged (atom [])
               failure (ex-info "update failed" {})]
           (vreset! thread-api/*thread-apis
                    {:thread-api/db-sync-rehydrate-large-titles (fn [_repo _graph-id] (p/resolved nil))})
           (set! (.-error js/console) (fn [e] (swap! logged conj e)))
           (-> (p/with-redefs [worker-state/get-sqlite-conn (fn [_repo _k] nil)
                               rtc-log-and-state/rtc-log (fn [_type _payload] nil)
                               client-op/update-local-tx (fn [_repo _tx] (p/rejected failure))
                               shared-service/broadcast-to-clients! (fn [_k _payload] nil)]
                 (sync-download/complete-datoms-import! "repo" "graph-1" 7))
               (p/then (fn [_]
                         (is (= [failure] @logged))))
               (p/finally (fn []
                            (set! (.-error js/console) error-prev)
                            (vreset! thread-api/*thread-apis apis-prev)))
               (->> (finish done))))))

(deftest require-thread-api-f-fails-fast-on-missing-api-test
  (let [apis-prev @thread-api/*thread-apis]
    (vreset! thread-api/*thread-apis {:thread-api/known identity})
    (try
      (is (identical? identity (#'sync-download/require-thread-api-f! :thread-api/known)))
      (let [error (try (#'sync-download/require-thread-api-f! :thread-api/absent)
                       nil
                       (catch :default e e))]
        (is (= "missing-field" (ex-message error)))
        (is (= {:field :thread-api/absent} (ex-data error))))
      (finally
        (vreset! thread-api/*thread-apis apis-prev)))))

(deftest stale-import-ex-info-carries-identifiers-test
  (let [error (#'sync-download/stale-import-ex-info "repo" "graph-1" "import-1")]
    (is (= "stale db sync import" (ex-message error)))
    (is (= {:type :db-sync/stale-import
            :repo "repo"
            :graph-id "graph-1"
            :import-id "import-1"}
           (ex-data error)))))

(deftest import-temp-pool-name-derives-from-repo-test
  (is (= (worker-util/get-pool-name "download-import-my-repo")
         (#'sync-download/import-temp-pool-name "my-repo"))))

(deftest close-import-state-ignores-pool-removal-failure-test
  (async done
         (let [removed (atom [])]
           (finish done
                   (p/with-redefs [platform/current
                                   (fn []
                                     {:storage {:remove-vfs! (fn [pool]
                                                               (swap! removed conj pool)
                                                               (p/rejected (ex-info "remove failed" {})))}})]
                     (p/let [result (#'sync-download/close-import-state! {:rows-pool :pool})]
                       (is (nil? result))
                       (is (= [:pool] @removed))))))))

(deftest upsert-addr-content-executes-one-insert-per-item-test
  (let [executed (atom [])
        tx #js {:exec (fn [opts] (swap! executed conj opts))}
        db #js {:transaction (fn [f] (f tx))}
        item-1 #js {:$addr 1 :$content "a" :$addresses nil}
        item-2 #js {:$addr 2 :$content "b" :$addresses nil}]
    (#'sync-download/upsert-addr-content! db [item-1 item-2])
    (is (= 2 (count @executed)))
    (is (every? (fn [^js opts] (re-find #"^INSERT INTO kvs .* on conflict\(addr\) do update" (.-sql opts))) @executed))
    (is (identical? item-1 (.-bind (first @executed))))
    (is (identical? item-2 (.-bind (second @executed))))))

(deftest import-datoms-batch-transacts-with-sync-download-meta-test
  (async done
         (let [conn (d/create-conn {})
               metas (atom [])
               block-uuid (random-uuid)]
           (d/listen! conn ::capture (fn [report] (swap! metas conj (:tx-meta report))))
           (finish done
                   (p/let [_ (#'sync-download/import-datoms-batch!
                              conn nil false
                              [{:e 1 :a :block/uuid :v block-uuid}
                               {:e 1 :a :block/title :v "t"}])]
                     (is (= [{:sync-download-graph? true}] @metas))
                     (is (= "t" (:block/title (d/entity @conn 1)))))))))

(deftest snapshot-datoms-in-import-order-puts-schema-datoms-first-test
  (let [conn (d/create-conn {:db/ident {:db/unique :db.unique/identity}})]
    (d/transact! conn [{:db/id 1 :db/ident :logseq.kv/schema-version :kv/value 3}
                       {:db/id 2 :db/ident :some/class :block/title "cls"}
                       {:db/id 3 :block/title "plain"}])
    (is (= [{:e 1 :a :db/ident :v :logseq.kv/schema-version}
            {:e 1 :a :kv/value :v 3}
            {:e 2 :a :db/ident :v :some/class}
            {:e 2 :a :block/title :v "cls"}
            {:e 3 :a :block/title :v "plain"}]
           (vec (sync-download/snapshot-datoms-in-import-order conn))))))

(deftest take-import-datoms-batch-splits-at-batch-size-test
  (is (= [[0 1] [2 3 4]]
         (let [[batch remaining] (#'sync-download/take-import-datoms-batch (range 5) 2)]
           [batch (vec remaining)])))
  (let [[batch remaining] (#'sync-download/take-import-datoms-batch [1 2] 5)]
    (is (= [1 2] batch))
    (is (nil? remaining))))

(defn- fake-prepare-apis
  [calls]
  {:thread-api/db-sync-close-db (fn [repo] (swap! calls conj [:close repo]) (p/resolved nil))
   :thread-api/unsafe-unlink-db (fn [repo] (swap! calls conj [:unlink repo]) (p/resolved nil))
   :thread-api/db-sync-invalidate-search-db (fn [repo] (swap! calls conj [:invalidate repo]) (p/resolved nil))
   :thread-api/create-or-open-db (fn [repo opts] (swap! calls conj [:open repo opts]) (p/resolved nil))})

(defn- with-import-state-reset
  [f]
  (let [apis-prev @thread-api/*thread-apis
        state-prev @@#'sync-download/*import-state]
    (-> (f)
        (p/finally (fn []
                     (vreset! thread-api/*thread-apis apis-prev)
                     (reset! @#'sync-download/*import-state state-prev))))))

(deftest prepare-import-opens-db-and-records-import-state-test
  (async done
         (let [calls (atom [])]
           (finish done
                   (with-import-state-reset
                     (fn []
                       (vreset! thread-api/*thread-apis (fake-prepare-apis calls))
                       (p/with-redefs [sync-crypt/<fetch-graph-aes-key-for-download (fn [_graph-id] (p/resolved :aes))
                                       worker-state/get-datascript-conn (fn [_repo] :conn)]
                         (p/let [{:keys [import-id]} (sync-download/prepare-import! "repo" false "graph-1" true 99)]
                           (is (string? import-id))
                           (is (= [[:open "repo" {:close-other-db? true :sync-download-graph? true}]] @calls))
                           (is (= {:aes-key :aes
                                   :conn :conn
                                   :graph-e2ee? true
                                   :graph-id "graph-1"
                                   :import-id import-id
                                   :imported-datoms 0
                                   :rows-db nil
                                   :rows-imported? false
                                   :rows-path nil
                                   :rows-pool nil
                                   :repo "repo"
                                   :total-datoms 99}
                                  @@#'sync-download/*import-state))))))))))

(deftest prepare-import-fails-fast-without-aes-key-test
  (async done
         (finish done
                 (with-import-state-reset
                   (fn []
                     (vreset! thread-api/*thread-apis (fake-prepare-apis (atom [])))
                     (p/with-redefs [sync-crypt/<fetch-graph-aes-key-for-download (fn [_graph-id] (p/resolved nil))]
                       (p/let [{:keys [error]} (<rejection (sync-download/prepare-import! "repo" false "graph-1" true))]
                         (is (= "missing-field" (ex-message error)))
                         (is (= {:repo "repo" :field :aes-key} (ex-data error))))))))))

(deftest prepare-import-fails-fast-without-datascript-conn-test
  (async done
         (finish done
                 (with-import-state-reset
                   (fn []
                     (vreset! thread-api/*thread-apis (fake-prepare-apis (atom [])))
                     (p/with-redefs [worker-state/get-datascript-conn (fn [_repo] nil)]
                       (p/let [{:keys [error]} (<rejection (sync-download/prepare-import! "repo" false "graph-1" false))]
                         (is (= "missing-field" (ex-message error)))
                         (is (= {:repo "repo" :field :datascript-conn} (ex-data error))))))))))

(deftest prepare-import-failure-clears-import-state-test
  (async done
         (finish done
                 (with-import-state-reset
                   (fn []
                     (vreset! thread-api/*thread-apis
                              (assoc (fake-prepare-apis (atom []))
                                     :thread-api/db-sync-close-db (fn [_repo] (p/rejected (ex-info "close failed" {})))))
                     (reset! @#'sync-download/*import-state {:import-id "old" :repo "old-repo"})
                     (p/let [{:keys [error]} (<rejection (sync-download/prepare-import! "repo" false "graph-1" false))]
                       (is (= "close failed" (ex-message error)))
                       (is (nil? @@#'sync-download/*import-state))))))))

(deftest set-graph-sync-metadata-writes-kv-without-persist-op-test
  (let [conn (d/create-conn db-schema/schema)
        metas (atom [])
        graph-id (random-uuid)]
    (d/listen! conn ::capture (fn [report] (swap! metas conj (:tx-meta report))))
    (#'sync-download/set-graph-sync-metadata! conn graph-id true)
    (let [kv (fn [k] (:kv/value (d/entity @conn k)))]
      (is (= graph-id (kv :logseq.kv/graph-uuid)))
      (is (true? (kv :logseq.kv/graph-remote?)))
      (is (true? (kv :logseq.kv/graph-rtc-e2ee?))))
    (is (= [false] (mapv :persist-op? @metas)))))

(deftest set-graph-sync-metadata-rejects-non-uuid-graph-id-test
  (let [conn (d/create-conn db-schema/schema)]
    (is (thrown? js/Error (#'sync-download/set-graph-sync-metadata! conn "not-a-uuid" true)))))
