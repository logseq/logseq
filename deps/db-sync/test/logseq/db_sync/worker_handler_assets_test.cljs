(ns logseq.db-sync.worker-handler-assets-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.worker.handler.assets :as assets]
            [promesa.core :as p]))

(defn- bytes->stream
  [^js payload]
  (js/ReadableStream.
   #js {:start (fn [controller]
                 (.enqueue controller payload)
                 (.close controller))}))

(defn- put-request-with-size
  [size content-length]
  (let [remaining (volatile! size)
        chunk (js/Uint8Array. (* 1024 1024))
        body (js/ReadableStream.
              #js {:pull (fn [controller]
                           (if (zero? @remaining)
                             (.close controller)
                             (let [chunk-size (min @remaining (.-byteLength chunk))]
                               (vswap! remaining - chunk-size)
                               (.enqueue controller (.subarray chunk 0 chunk-size)))))})]
    (js/Request. "http://localhost/assets/graph-1/asset-1.bin"
                 #js {:method "PUT"
                      :headers (if content-length #js {"content-length" (str content-length)} #js {})
                      :body body
                      :duplex "half"})))

(defn- <check-upload
  [e2ee? size content-length expected-status expected-stored-size]
  (let [request (put-request-with-size size content-length)
        stored-size (atom nil)
        env #js {:DB #js {}
                 :LOGSEQ_SYNC_ASSETS
                 #js {:put (fn [_key body _opts]
                             (let [reader (.getReader body)]
                               (p/loop [total 0]
                                 (p/let [result (.read reader)]
                                   (if (.-done result)
                                     (reset! stored-size total)
                                     (p/recur (+ total (.-byteLength (.-value result)))))))))}}]
    (p/with-redefs [index/<graph-e2ee? (fn [_ _] (p/resolved e2ee?))]
      (p/let [resp (assets/handle request env)]
        (is (= expected-status (.-status resp)))
        (is (= expected-stored-size @stored-size))
        (when-not (.-bodyUsed request)
          (.cancel (.-body request)))))))

(deftest asset-uploads-enforce-200-mib-plaintext-limit
  (async done
         (let [limit (* 200 1024 1024)
               encrypted-limit (+ 27 (* 4 (js/Math.ceil (/ (+ limit 16) 3))))]
           (-> (p/do!
                (<check-upload false limit limit 200 limit)
                (<check-upload false (inc limit) (inc limit) 413 nil)
                (<check-upload true encrypted-limit encrypted-limit 200 encrypted-limit)
                (<check-upload true (inc encrypted-limit) (inc encrypted-limit) 413 nil)
                (<check-upload false (inc limit) nil 413 nil))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest assets-get-includes-content-length-header-test
  (async done
         (let [payload (js/Uint8Array. #js [1 2 3 4])
               request (js/Request. "http://localhost/assets/graph-1/snapshot-1.snapshot"
                                    #js {:method "GET"})
               env #js {:LOGSEQ_SYNC_ASSETS
                        #js {:get (fn [_key]
                                    (js/Promise.resolve
                                     #js {:body payload
                                          :size 4
                                          :httpMetadata #js {:contentType "application/octet-stream"}}))}}]
           (-> (p/let [resp (assets/handle request env)]
                 (is (= 200 (.-status resp)))
                 (is (= "4" (.get (.-headers resp) "content-length")))
                 (is (= "4" (.get (.-headers resp) "x-asset-size"))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest assets-get-includes-content-length-with-stream-body-without-fixed-length-stream-test
  (async done
         (let [payload (js/Uint8Array. #js [1 2 3 4])
               request (js/Request. "http://localhost/assets/graph-1/snapshot-1.snapshot"
                                    #js {:method "GET"})
               env #js {:LOGSEQ_SYNC_ASSETS
                        #js {:get (fn [_key]
                                    (js/Promise.resolve
                                     #js {:body (bytes->stream payload)
                                          :size 4
                                          :httpMetadata #js {:contentType "application/octet-stream"}}))}}
               original-fixed-length-stream (.-FixedLengthStream js/globalThis)
               restore! #(aset js/globalThis "FixedLengthStream" original-fixed-length-stream)]
           (aset js/globalThis "FixedLengthStream" js/undefined)
           (-> (p/let [resp (assets/handle request env)
                       buf (.arrayBuffer resp)]
                 (is (= 200 (.-status resp)))
                 (is (= "4" (.get (.-headers resp) "content-length")))
                 (is (= "4" (.get (.-headers resp) "x-asset-size")))
                 (is (= 4 (.-byteLength buf))))
               (p/then (fn []
                         (restore!)
                         (done)))
               (p/catch (fn [error]
                          (restore!)
                          (is false (str error))
                          (done)))))))

(deftest assets-get-serves-image-inline-with-extension-content-type-test
  (async done
         (let [payload (js/Uint8Array. #js [1 2 3 4])
               request (js/Request. "http://localhost/assets/graph-1/image-id.png"
                                    #js {:method "GET"})
               env #js {:LOGSEQ_SYNC_ASSETS
                        #js {:get (fn [_key]
                                    (p/resolved
                                     #js {:body payload
                                          :size 4
                                          ;; Existing Code Mode uploads stored the transfer MIME type.
                                          :httpMetadata #js {:contentType "application/json"}}))}}]
           (-> (p/let [resp (assets/handle request env)]
                 (is (= 200 (.-status resp)))
                 (is (= "image/png" (.get (.-headers resp) "content-type")))
                 (is (= "inline; filename=\"image-id.png\""
                        (.get (.-headers resp) "content-disposition"))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
