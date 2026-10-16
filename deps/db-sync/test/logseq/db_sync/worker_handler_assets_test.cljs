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
  [size]
  #js {:url "http://localhost/assets/graph-1/asset-1.bin"
       :method "PUT"
       :headers #js {:get (constantly nil)}
       :arrayBuffer (fn [] (p/resolved #js {:byteLength size}))})

(deftest encrypted-assets-allow-upload-at-larger-limit-test
  (async done
         (let [request (put-request-with-size (* 200 1024 1024))
               put-calls (atom 0)
               env #js {:DB #js {}
                        :LOGSEQ_SYNC_ASSETS
                        #js {:put (fn [& _]
                                    (swap! put-calls inc)
                                    (p/resolved nil))}}]
           (-> (p/with-redefs [index/<graph-e2ee? (fn [_ _] (p/resolved true))]
                 (p/let [resp (assets/handle request env)]
                   (is (= 200 (.-status resp)))
                   (is (= 1 @put-calls))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest unencrypted-assets-keep-existing-upload-limit-test
  (async done
         (let [request (put-request-with-size (* 150 1024 1024))
               put-calls (atom 0)
               env #js {:DB #js {}
                        :LOGSEQ_SYNC_ASSETS
                        #js {:put (fn [& _]
                                    (swap! put-calls inc)
                                    (p/resolved nil))}}]
           (-> (p/with-redefs [index/<graph-e2ee? (fn [_ _] (p/resolved false))]
                 (p/let [resp (assets/handle request env)]
                   (is (= 413 (.-status resp)))
                   (is (zero? @put-calls))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest encrypted-assets-still-reject-uploads-above-larger-limit-test
  (async done
         (let [request (put-request-with-size (inc (* 200 1024 1024)))
               put-calls (atom 0)
               env #js {:DB #js {}
                        :LOGSEQ_SYNC_ASSETS
                        #js {:put (fn [& _]
                                    (swap! put-calls inc)
                                    (p/resolved nil))}}]
           (-> (p/with-redefs [index/<graph-e2ee? (fn [_ _] (p/resolved true))]
                 (p/let [resp (assets/handle request env)]
                   (is (= 413 (.-status resp)))
                   (is (zero? @put-calls))))
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

(deftest assets-get-serves-non-image-types-as-attachment-with-nosniff-test
  (async done
         (let [payload (js/Uint8Array. #js [1 2 3 4])
               request (js/Request. "http://localhost/assets/graph-1/page-id.html"
                                    #js {:method "GET"})
               env #js {:LOGSEQ_SYNC_ASSETS
                        #js {:get (fn [_key]
                                    (p/resolved
                                     #js {:body payload
                                          :size 4
                                          :httpMetadata #js {:contentType "text/html"}}))}}]
           (-> (p/let [resp (assets/handle request env)]
                 (is (= 200 (.-status resp)))
                 (is (= "text/html" (.get (.-headers resp) "content-type")))
                 (is (= "attachment; filename=\"page-id.html\""
                        (.get (.-headers resp) "content-disposition")))
                 (is (= "nosniff" (.get (.-headers resp) "x-content-type-options")))
                 (is (nil? (.get (.-headers resp) "content-security-policy"))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest assets-get-sandboxes-svg-test
  (async done
         (let [payload (js/Uint8Array. #js [1 2 3 4])
               request (js/Request. "http://localhost/assets/graph-1/icon-id.svg"
                                    #js {:method "GET"})
               env #js {:LOGSEQ_SYNC_ASSETS
                        #js {:get (fn [_key]
                                    (p/resolved
                                     #js {:body payload
                                          :size 4
                                          :httpMetadata #js {}}))}}]
           (-> (p/let [resp (assets/handle request env)]
                 (is (= 200 (.-status resp)))
                 (is (= "image/svg+xml" (.get (.-headers resp) "content-type")))
                 (is (= "inline; filename=\"icon-id.svg\""
                        (.get (.-headers resp) "content-disposition")))
                 (is (= "nosniff" (.get (.-headers resp) "x-content-type-options")))
                 (is (= "sandbox" (.get (.-headers resp) "content-security-policy"))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(def ^:private hello-sha-256 "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824")

(defn- put-request-with-checksum
  [checksum]
  (js/Request. "http://localhost/assets/graph-1/asset-1.bin"
               #js {:method "PUT"
                    :headers #js {"x-amz-meta-checksum" checksum}
                    :body "hello"}))

(deftest assets-put-verifies-the-declared-checksum-on-plain-graphs-test
  (async done
         (let [put-calls (atom 0)
               env #js {:DB #js {}
                        "LOGSEQ_SYNC_ASSETS"
                        #js {:put (fn [& _]
                                    (swap! put-calls inc)
                                    (p/resolved nil))}}]
           (-> (p/with-redefs [index/<graph-e2ee? (fn [_ _] (p/resolved false))]
                 (p/let [accepted (assets/handle (put-request-with-checksum hello-sha-256) env)
                         rejected (assets/handle (put-request-with-checksum (apply str (repeat 64 "a"))) env)
                         rejected-body (.json rejected)]
                   (is (= 200 (.-status accepted)))
                   (is (= 1 @put-calls))
                   (is (= 400 (.-status rejected)))
                   (is (= "asset checksum mismatch" (aget rejected-body "error")))
                   (is (= 1 @put-calls))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest assets-put-cannot-verify-the-plaintext-checksum-on-e2ee-graphs-test
  (async done
         (let [put-calls (atom 0)
               env #js {:DB #js {}
                        "LOGSEQ_SYNC_ASSETS"
                        #js {:put (fn [& _]
                                    (swap! put-calls inc)
                                    (p/resolved nil))}}]
           ;; On E2EE graphs the body is an encrypted package and the declared
           ;; checksum describes the plaintext: it is stored as declared.
           (-> (p/with-redefs [index/<graph-e2ee? (fn [_ _] (p/resolved true))]
                 (p/let [accepted (assets/handle (put-request-with-checksum (apply str (repeat 64 "a"))) env)]
                   (is (= 200 (.-status accepted)))
                   (is (= 1 @put-calls))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
