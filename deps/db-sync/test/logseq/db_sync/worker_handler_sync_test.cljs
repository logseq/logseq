(ns logseq.db-sync.worker-handler-sync-test
  (:require [cljs.test :refer [async deftest is testing]]
            [datascript.core :as d]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.snapshot :as snapshot]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.test-sql :as test-sql]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.ws :as ws]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]))

(defn- empty-sql []
  #js {:exec (fn [& _] #js [])})

(defn- request-url
  ([]
   (request-url "/sync/graph-1/snapshot/download?graph-id=graph-1"))
  ([path]
   (let [request (js/Request. (str "http://localhost" path)
                              #js {:method "GET"})]
     {:request request
      :url (js/URL. (.-url request))})))

(defn- passthrough-compression-stream-constructor []
  (js* "function(_format){ return new TransformStream(); }"))

(deftest snapshot-download-uses-gzip-encoding-when-compression-supported-test
  (async done
         (let [put-call (atom nil)
               bucket #js {:put (fn [key body opts]
                                  (reset! put-call {:key key :body body :opts opts})
                                  (js/Promise.resolve #js {:ok true}))}
               conn (d/create-conn db-schema/schema)
               self #js {:env #js {:LOGSEQ_SYNC_ASSETS bucket}
                         :conn conn
                         :schema-ready true
                         :sql (empty-sql)}
               {:keys [request url]} (request-url)
               original-compression-stream (.-CompressionStream js/globalThis)
               restore! #(aset js/globalThis "CompressionStream" original-compression-stream)]
           (d/transact! conn [{:db/ident :logseq.class/Page
                               :block/title "Page"}
                              {:db/ident :logseq.kv/schema-version
                               :kv/value {:major 65 :minor 23}}
                              {:db/id 2 :block/title "hello"}])
           (aset js/globalThis
                 "CompressionStream"
                 (passthrough-compression-stream-constructor))
           (-> (p/let [resp (sync-handler/handle {:self self
                                                  :request request
                                                  :url url
                                                  :route {:handler :sync/snapshot-download}})
                       text (.text resp)
                       body (js->clj (js/JSON.parse text) :keywordize-keys true)
                       http-metadata (aget (:opts @put-call) "httpMetadata")
                       payload (js/Uint8Array. (:body @put-call))
                       {:keys [datoms]} (snapshot/parse-datoms-jsonl-chunk nil payload)]
                 (is (= 200 (.-status resp)))
                 (is (= "gzip" (:content-encoding body)))
                 (is (= "gzip" (aget http-metadata "contentEncoding")))
                 (is (= "application/x-ndjson" (aget http-metadata "contentType")))
                 (is (= 5 (count datoms)))
                 (is (= [:logseq.kv/schema-version
                         :logseq.kv/schema-version
                         :logseq.kv/schema-version
                         :logseq.class/Page
                         :logseq.class/Page]
                        (mapv (fn [{:keys [e]}]
                                (:db/ident (d/entity @conn e)))
                              datoms))))
               (p/then (fn []
                         (restore!)
                         (done)))
               (p/catch (fn [error]
                          (restore!)
                          (is false (str error))
                          (done)))))))

(deftest snapshot-download-stream-route-returns-jsonl-datoms-test
  (async done
         (let [conn (d/create-conn db-schema/schema)
               self #js {:env #js {}
                         :conn conn
                         :schema-ready true
                         :sql (empty-sql)}
               {:keys [request]} (request-url "/sync/graph-1/snapshot/stream?graph-id=graph-1")
               original-compression-stream (.-CompressionStream js/globalThis)
               restore! #(aset js/globalThis "CompressionStream" original-compression-stream)]
           (d/transact! conn [{:db/ident :logseq.class/Page
                               :block/title "Page"}
                              {:db/ident :logseq.kv/schema-version
                               :kv/value {:major 65 :minor 23}}
                              {:db/id 2 :block/title "hello"}])
           (aset js/globalThis
                 "CompressionStream"
                 (passthrough-compression-stream-constructor))
           (-> (p/let [resp (sync-handler/handle-http self request)
                       encoding (.get (.-headers resp) "content-encoding")
                       content-type (.get (.-headers resp) "content-type")
                       buf (.arrayBuffer resp)
                       payload (js/Uint8Array. buf)
                       datoms (snapshot/finalize-datoms-jsonl-buffer payload)]
                 (is (= 200 (.-status resp)))
                 (is (= "gzip" encoding))
                 (is (= "application/x-ndjson" content-type))
                 (is (= 5 (count datoms)))
                 (is (= :logseq.kv/schema-version
                        (:db/ident (d/entity @conn (:e (first datoms)))))))
               (p/then (fn []
                         (restore!)
                         (done)))
               (p/catch (fn [error]
                          (restore!)
                          (is false (str error))
                          (done)))))))

(deftest ensure-schema-fallback-probes-existing-tables-test
  (async done
         (let [self #js {:sql (empty-sql)}
               schema-probes (atom [])
               {:keys [request url]} (request-url "/sync/graph-1/pull?graph-id=graph-1&since=0")]
           (-> (p/with-redefs [storage/init-schema! (fn [_]
                                                      (throw (js/Error. "ddl rejected")))
                               common/sql-exec (fn [_ sql-str & _args]
                                                 (swap! schema-probes conj sql-str)
                                                 #js [])
                               storage/fetch-tx-since (fn [_ _] [])
                               storage/get-t (fn [_] 7)
                               sync-handler/current-checksum (fn [_] "checksum-ok")]
                 (p/let [resp (sync-handler/handle {:self self
                                                    :request request
                                                    :url url
                                                    :route {:handler :sync/pull}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)
                         probe-set (set @schema-probes)]
                   (is (= 200 (.-status resp)))
                   (is (= 7 (:t body)))
                   (is (= "checksum-ok" (:checksum body)))
                   (is (contains? probe-set "select 1 from kvs limit 1"))
                   (is (contains? probe-set "select 1 from tx_log limit 1"))
                   (is (contains? probe-set "select 1 from sync_meta limit 1"))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest tx-batch-drops-stale-lookup-entity-updates-test
  (testing "stale lookup-ref entity updates should not reject the whole tx batch"
    (let [sql (test-sql/make-sql)
          conn (storage/open-conn sql)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          missing-uuid (random-uuid)
          created-uuid (random-uuid)
          tx-data [[:db/add [:block/uuid missing-uuid] :block/title "stale" 1]
                   [:db/add [:block/uuid missing-uuid] :block/updated-at 1773188050934 1]
                   [:db/add "temp-1" :block/uuid created-uuid 2]
                   [:db/add "temp-1" :block/title "ok" 2]]
          tx-entry {:tx (protocol/tx->transit tx-data)
                    :outliner-op :save-block}
          response (with-redefs [ws/broadcast! (fn [& _] nil)]
                     (sync-handler/handle-tx-batch! self nil [tx-entry] 0))]
      (is (= "tx/batch/ok" (:type response)))
      (is (string? (:checksum response)))
      (is (= "ok" (:block/title (d/entity @conn [:block/uuid created-uuid]))))
      (is (nil? (d/entity @conn [:block/uuid missing-uuid])))
      (let [pull-response (sync-handler/pull-response self 0)
            tx-log-entry (first (:txs pull-response))]
        (is (= "pull/ok" (:type pull-response)))
        (is (string? (:checksum pull-response)))
        (is (= :save-block (:outliner-op tx-log-entry)))))))

(deftest tx-batch-rejects-while-snapshot-upload-is-in-progress-test
  (let [sql (test-sql/make-sql)
        conn (d/create-conn db-schema/schema)
        self #js {:sql sql
                  :conn conn
                  :schema-ready true}
        tx-data [[:db/add -1 :block/title "blocked"]]
        tx-entry {:tx (protocol/tx->transit tx-data)
                  :outliner-op :save-block}
        response (with-redefs [storage/get-meta (fn [_ k]
                                                  (when (= :snapshot-uploading? k)
                                                    "true"))]
                   (sync-handler/handle-tx-batch! self nil [tx-entry] 0))]
    (is (= "tx/reject" (:type response)))
    (is (= "snapshot upload in progress" (:reason response)))))

(deftest finished-snapshot-upload-persists-provided-checksum-test
  (async done
         (let [sql (test-sql/make-sql)
               checksum "1be70518babe8784"
               conn (d/create-conn db-schema/schema)
               self #js {:sql sql
                         :conn conn
                         :schema-ready true
                         :env #js {"DB" nil}}
               request (js/Request. (str "http://localhost/sync/graph-1/snapshot/upload?graph-id=graph-1&finished=true&checksum=" checksum)
                                    #js {:method "POST"
                                         :body (js/Uint8Array. 0)})]
           (d/transact! conn [{:block/uuid (random-uuid)
                               :block/title "uploaded"}])
           (is (nil? (storage/get-checksum sql)))
           (-> (p/with-redefs [sync-handler/import-snapshot-stream! (fn [_self _stream _reset?]
                                                                      (p/resolved 0))
                               sync-handler/<set-graph-ready-for-use! (fn [_self _graph-id _graph-ready-for-use?]
                                                                        (p/resolved true))]
                 (p/let [resp (sync-handler/handle {:self self
                                                    :request request
                                                    :url (js/URL. (.-url request))
                                                    :route {:handler :sync/snapshot-upload}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 200 (.-status resp)))
                   (is (= {:ok true :count 0} body))
                   (is (= checksum (storage/get-checksum sql)))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest tx-batch-rejects-with-the-exact-failed-tx-entry-test
  (testing "db transact failure replies with the specific rejected tx entry"
    (let [sql (test-sql/make-sql)
          conn (d/create-conn db-schema/schema)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          tx-entry-1 {:tx (protocol/tx->transit [[:db/add -1 :block/title "ok"]])
                      :outliner-op :save-block}
          tx-entry-2 {:tx (protocol/tx->transit [[:db/add -2 :block/title "bad"]])
                      :outliner-op :save-block}
          apply-calls (atom 0)
          response (with-redefs [ws/broadcast! (fn [& _] nil)
                                 sync-handler/apply-tx-entry! (fn [_conn tx-entry]
                                                                (swap! apply-calls inc)
                                                                (when (= 2 @apply-calls)
                                                                  (throw (ex-info "DB write failed with invalid data"
                                                                                  {:tx-entry tx-entry}))))]
                     (sync-handler/handle-tx-batch! self nil [tx-entry-1 tx-entry-2] 0))]
      (is (= "tx/reject" (:type response)))
      (is (= "db transact failed" (:reason response)))
      (is (= 0 (:t response)))
      (is (= tx-entry-2 (common/read-transit (:data response)))))))

(deftest sync-pull-is-blocked-when-graph-is-not-ready-for-use-test
  (async done
         (let [self #js {:env #js {"DB" :db}
                         :sql (empty-sql)}
               {:keys [request url]} (request-url "/sync/graph-1/pull?graph-id=graph-1&since=0")]
           (-> (p/with-redefs [index/<graph-ready-for-use? (fn [_db _graph-id]
                                                             (p/resolved false))]
                 (p/let [resp (sync-handler/handle {:self self
                                                    :request request
                                                    :url url
                                                    :route {:handler :sync/pull}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 409 (.-status resp)))
                   (is (= "graph not ready" (:error body)))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest snapshot-download-is-blocked-when-graph-is-not-ready-for-use-test
  (async done
         (let [bucket #js {:put (fn [& _]
                                  (throw (js/Error. "should-not-upload-snapshot")))}
               self #js {:env #js {"DB" :db
                                   "LOGSEQ_SYNC_ASSETS" bucket}
                         :sql (empty-sql)}
               {:keys [request url]} (request-url)]
           (-> (p/with-redefs [index/<graph-ready-for-use? (fn [_db _graph-id]
                                                             (p/resolved false))]
                 (p/let [resp (sync-handler/handle {:self self
                                                    :request request
                                                    :url url
                                                    :route {:handler :sync/snapshot-download}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 409 (.-status resp)))
                   (is (= "graph not ready" (:error body)))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
