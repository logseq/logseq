(ns logseq.db-sync.worker-handler-sync-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [promesa.core :as p]))

(defn- empty-sql []
  #js {:exec (fn [& _] #js [])})

(defn- request-url []
  (let [request (js/Request. "http://localhost/sync/graph-1/snapshot/download?graph-id=graph-1"
                             #js {:method "GET"})]
    {:request request
     :url (js/URL. (.-url request))}))

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
