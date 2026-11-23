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

(defn- <check-chunked-put [size status]
  (let [request (put-request-with-size size nil)
        parts (atom [])
        stored (atom nil)
        aborted? (atom false)
        part-size (* 8 1024 1024)
        bucket #js {:put (fn [_key ^js payload _opts]
                           (reset! stored (.-byteLength payload))
                           (p/resolved nil))
                    :createMultipartUpload
                    (fn [key ^js opts]
                      (is (= "graph-1/asset-1.bin" key))
                      (is (= "application/x-legacy-asset" (.. opts -httpMetadata -contentType)))
                      (is (= "legacy-checksum" (.. opts -customMetadata -checksum)))
                      (is (= "bin" (.. opts -customMetadata -type)))
                      (p/resolved
                       #js {:uploadPart (fn [part-number ^js payload]
                                          (swap! parts conj (.-byteLength payload))
                                          (p/resolved #js {:partNumber part-number :etag "part-etag"}))
                            :complete (fn [completed-parts]
                                        (is (= (range 1 (inc (count @parts)))
                                               (map (fn [^js part] (.-partNumber part))
                                                    (array-seq completed-parts))))
                                        (reset! stored (reduce + @parts))
                                        (p/resolved nil))
                            :abort (fn []
                                     (reset! aborted? true)
                                     (p/resolved nil))}))}]
    (.set (.-headers request) "content-type" "application/x-legacy-asset")
    (.set (.-headers request) "x-amz-meta-checksum" "legacy-checksum")
    (p/with-redefs [index/<graph-e2ee? (fn [_ _] (p/resolved false))]
      (p/let [resp (assets/handle request #js {:DB #js {} :LOGSEQ_SYNC_ASSETS bucket})
              body (.json resp)]
        (is (= status (.-status resp)))
        (if (= status 200)
          (do (is (= size @stored))
              (is (true? (aget body "ok")))
              (is (false? @aborted?))
              (when (>= size part-size)
                (is (= [part-size (- size part-size)] @parts))))
          (do (is (nil? @stored))
              (is (seq @parts))
              (is @aborted?)))))))

(deftest legacy-chunked-put-completes-or-aborts-without-an-upload-plan
  (async done
         (-> (p/do!
              (<check-chunked-put 0 200)
              (<check-chunked-put 1024 200)
              (<check-chunked-put (+ (* 8 1024 1024) 17) 200)
              (<check-chunked-put (inc (* 200 1024 1024)) 413))
             (p/then (fn [] (done)))
             (p/catch (fn [error]
                        (is false (str error))
                        (done))))))

(deftest direct-upload-signs-the-wire-length-and-confirms-the-stored-object
  (async done
         (let [limit (* 200 1024 1024)
               checksum (apply str (repeat 64 "a"))
               stored (atom nil)
               signed (atom nil)
               env #js {:DB #js {}
                        :R2_ASSET_UPLOAD_BUCKET "assets"
                        :SIGN_R2_ASSET_UPLOAD (fn [key size _headers]
                                                (reset! signed [key size])
                                                (p/resolved "https://r2.example.test/signed"))
                        :LOGSEQ_SYNC_ASSETS #js {:head (fn [_key] (p/resolved @stored))}}
               control (fn [action size]
                         (assets/handle
                          (js/Request. "http://localhost/assets/graph-1/asset-1.bin"
                                       #js {:method "POST" :body (js/JSON.stringify #js {:action action :size size :checksum checksum})})
                          env))]
           (-> (p/with-redefs [index/<graph-e2ee? (fn [_ _] (p/resolved true))]
                 (p/let [small (control "prepare" 1024)
                         small-plan (.json small)
                         over (control "prepare" (inc limit))
                         missing (control "complete" limit)
                         prepared (control "prepare" limit)
                         plan (.json prepared)
                         headers (aget plan "headers")]
                   (is (= "proxy" (aget small-plan "mode")))
                   (is (= 413 (.-status over)))
                   (is (= 409 (.-status missing)))
                   (is (= "direct" (aget plan "mode")))
                   (is (= "https://r2.example.test/signed" (aget plan "url")))
                   (is (= ["graph-1/asset-1.bin" 279620315] @signed))
                   (is (= "*" (aget headers "if-none-match")))
                   (is (= "text/plain" (aget headers "content-type")))
                   (reset! stored #js {:size 279620315
                                       :customMetadata #js {:checksum checksum :size (str limit) :type "bin"}})
                   (p/let [confirmed (control "complete" limit)
                           wrong-size (control "complete" (dec limit))
                           retried (control "prepare" limit)
                           retry-plan (.json retried)]
                     (is (= 200 (.-status confirmed)))
                     (is (= 409 (.-status wrong-size)))
                     (is (= "present" (aget retry-plan "mode"))))))
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
