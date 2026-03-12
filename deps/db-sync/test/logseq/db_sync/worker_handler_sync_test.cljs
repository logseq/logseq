(ns logseq.db-sync.worker-handler-sync-test
  (:require [cljs.test :refer [async deftest is testing]]
            [datascript.core :as d]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.protocol :as protocol]
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
               self #js {:env #js {:LOGSEQ_SYNC_ASSETS bucket}
                         :sql (empty-sql)}
               {:keys [request url]} (request-url)
               original-compression-stream (.-CompressionStream js/globalThis)
               restore! #(aset js/globalThis "CompressionStream" original-compression-stream)]
           (aset js/globalThis
                 "CompressionStream"
                 (passthrough-compression-stream-constructor))
           (-> (p/let [resp (sync-handler/handle {:self self
                                                  :request request
                                                  :url url
                                                  :route {:handler :sync/snapshot-download}})
                       text (.text resp)
                       body (js->clj (js/JSON.parse text) :keywordize-keys true)
                       http-metadata (aget (:opts @put-call) "httpMetadata")]
                 (is (= 200 (.-status resp)))
                 (is (= "gzip" (:content-encoding body)))
                 (is (= "gzip" (aget http-metadata "contentEncoding"))))
               (p/then (fn []
                         (restore!)
                         (done)))
               (p/catch (fn [error]
                          (restore!)
                          (is false (str error))
                          (done)))))))

(deftest snapshot-download-falls-back-to-uncompressed-when-compression-unsupported-test
  (async done
         (let [put-call (atom nil)
               bucket #js {:put (fn [key body opts]
                                  (reset! put-call {:key key :body body :opts opts})
                                  (js/Promise.resolve #js {:ok true}))}
               self #js {:env #js {:LOGSEQ_SYNC_ASSETS bucket}
                         :sql (empty-sql)}
               {:keys [request url]} (request-url)
               original-compression-stream (.-CompressionStream js/globalThis)
               restore! #(aset js/globalThis "CompressionStream" original-compression-stream)]
           (aset js/globalThis "CompressionStream" js/undefined)
           (-> (p/let [resp (sync-handler/handle {:self self
                                                  :request request
                                                  :url url
                                                  :route {:handler :sync/snapshot-download}})
                       text (.text resp)
                       body (js->clj (js/JSON.parse text) :keywordize-keys true)
                       http-metadata (aget (:opts @put-call) "httpMetadata")]
                 (is (= 200 (.-status resp)))
                 (is (nil? (:content-encoding body)))
                 (is (nil? (aget http-metadata "contentEncoding"))))
               (p/then (fn []
                         (restore!)
                         (done)))
               (p/catch (fn [error]
                          (restore!)
                          (is false (str error))
                          (done)))))))

(deftest snapshot-stream-route-works-via-handle-http-test
  (async done
         (let [self #js {:env #js {}
                         :sql (empty-sql)}
               {:keys [request]} (request-url "/sync/graph-1/snapshot/stream?graph-id=graph-1")]
           (-> (p/let [resp (sync-handler/handle-http self request)
                       encoding (.get (.-headers resp) "content-encoding")]
                 (is (= 200 (.-status resp)))
                 (is (= "application/transit+json" (.get (.-headers resp) "content-type")))
                 (is (contains? #{"gzip" "identity"} encoding)))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
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
                               storage/get-t (fn [_] 7)]
                 (p/let [resp (sync-handler/handle {:self self
                                                    :request request
                                                    :url url
                                                    :route {:handler :sync/pull}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)
                         probe-set (set @schema-probes)]
                   (is (= 200 (.-status resp)))
                   (is (= 7 (:t body)))
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
          conn (d/create-conn db-schema/schema)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          missing-uuid (random-uuid)
          created-uuid (random-uuid)
          tx-data [[:db/add [:block/uuid missing-uuid] :block/title "stale" 1]
                   [:db/add [:block/uuid missing-uuid] :block/updated-at 1773188050934 1]
                   [:db/add "temp-1" :block/uuid created-uuid 2]
                   [:db/add "temp-1" :block/title "ok" 2]]
          response (with-redefs [ws/broadcast! (fn [& _] nil)]
                     (sync-handler/handle-tx-batch! self nil (protocol/tx->transit tx-data) 0))]
      (is (= "tx/batch/ok" (:type response)))
      (is (= "ok" (:block/title (d/entity @conn [:block/uuid created-uuid]))))
      (is (nil? (d/entity @conn [:block/uuid missing-uuid]))))))

(deftest tx-batch-rejects-while-snapshot-upload-is-in-progress-test
  (let [sql (test-sql/make-sql)
        conn (d/create-conn db-schema/schema)
        self #js {:sql sql
                  :conn conn
                  :schema-ready true}
        tx-data [[:db/add -1 :block/title "blocked"]]
        response (with-redefs [storage/get-meta (fn [_ k]
                                                  (when (= :snapshot-uploading? k)
                                                    "true"))]
                   (sync-handler/handle-tx-batch! self nil (protocol/tx->transit tx-data) 0))]
    (is (= "tx/reject" (:type response)))
    (is (= "snapshot upload in progress" (:reason response)))))
