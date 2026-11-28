(ns frontend.worker.sync.download-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.download :as sync-download]
            [frontend.worker.sync.log-and-state :as rtc-log-and-state]
            [logseq.db-sync.snapshot :as snapshot]
            [promesa.core :as p]))

(defn- frame-bytes
  [^js data]
  (let [len (.-byteLength data)
        out (js/Uint8Array. (+ 4 len))
        view (js/DataView. (.-buffer out))]
    (.setUint32 view 0 len false)
    (.set out data 4)
    out))

(defn- stream-from-chunks
  [chunks]
  (js/ReadableStream.
   #js {:start (fn [controller]
                 (doseq [part chunks]
                   (.enqueue controller part))
                 (.close controller))}))

(defn- stream-from-payload
  [^js payload]
  (stream-from-chunks [payload]))

(deftest stream-snapshot-row-batches-ignores-stale-gzip-header-test
  (async done
         (let [rows [[1 "row-1" nil]
                     [2 "row-2" nil]]
               payload (frame-bytes (snapshot/encode-rows rows))
               resp (js/Response.
                     (stream-from-payload payload)
                     #js {:status 200
                          :headers #js {"content-encoding" "gzip"}})
               batches* (atom [])]
           (-> (#'sync-download/<stream-snapshot-row-batches!
                resp
                1000
                (fn [batch]
                  (swap! batches* conj batch)
                  (p/resolved true)))
               (p/then (fn [_]
                         (is (= [rows] @batches*))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(defn- <gzip-bytes
  [^js payload]
  (-> (js/Response. (.pipeThrough (stream-from-payload payload)
                                  (js/CompressionStream. "gzip")))
      (.arrayBuffer)
      (p/then (fn [buf] (js/Uint8Array. buf)))))

(deftest stream-snapshot-row-batches-decompresses-gzip-without-header-test
  (async done
         (let [rows [[1 "row-1" nil]
                     [2 "row-2" nil]]
               payload (frame-bytes (snapshot/encode-rows rows))
               batches* (atom [])]
           ;; When gzip is missing from the request's `Accept-Encoding` (a proxy
           ;; rewrote it), the sync server returns the snapshot still gzipped
           ;; and without a `content-encoding` header.
           (-> (p/let [gzipped (<gzip-bytes payload)
                       resp (js/Response.
                             (stream-from-payload gzipped)
                             #js {:status 200})]
                 (#'sync-download/<stream-snapshot-row-batches!
                  resp
                  1000
                  (fn [batch]
                    (swap! batches* conj batch)
                    (p/resolved true))))
               (p/then (fn [_]
                         (is (= [rows] @batches*))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest stream-snapshot-row-batches-decompresses-split-gzip-prefix-without-header-test
  (async done
         (let [rows [[1 "row-1" nil]
                     [2 "row-2" nil]]
               payload (frame-bytes (snapshot/encode-rows rows))
               batches* (atom [])]
           (-> (p/let [gzipped (<gzip-bytes payload)
                       resp (js/Response.
                             (stream-from-chunks [(.subarray gzipped 0 1)
                                                  (js/Uint8Array. 0)
                                                  (.subarray gzipped 1)])
                             #js {:status 200})]
                 (#'sync-download/<stream-snapshot-row-batches!
                  resp
                  1000
                  (fn [batch]
                    (swap! batches* conj batch)
                    (p/resolved true))))
               (p/then (fn [_]
                         (is (= [rows] @batches*))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest stream-snapshot-row-batches-cancels-probe-branch-on-uncompressed-body-test
  (async done
         (let [rows [[1 "row-1" nil]
                     [2 "row-2" nil]]
               payload (frame-bytes (snapshot/encode-rows rows))
               resp (js/Response.
                     (stream-from-chunks [(.subarray payload 0 8)
                                          (.subarray payload 8)])
                     #js {:status 200})
               body (.-body resp)
               orig-tee (.bind (.-tee body) body)
               probe-cancelled* (atom 0)
               probe-stream* (atom nil)
               batches* (atom [])]
           (set! (.-tee body)
                 (fn []
                   (let [branches (orig-tee)
                         probe (aget branches 0)
                         orig-cancel (.bind (.-cancel probe) probe)]
                     (reset! probe-stream* probe)
                     (set! (.-cancel probe)
                           (fn
                             ([]
                              (swap! probe-cancelled* inc)
                              (orig-cancel))
                             ([reason]
                              (swap! probe-cancelled* inc)
                              (orig-cancel reason))))
                     branches)))
           (-> (#'sync-download/<stream-snapshot-row-batches!
                resp
                1000
                (fn [batch]
                  (swap! batches* conj batch)
                  (p/resolved true)))
               (p/then (fn [_]
                         (p/let [probe-read (.read (.getReader @probe-stream*))]
                           (is (= [rows] @batches*))
                           (is (= 1 @probe-cancelled*))
                           (is (true? (.-done probe-read)))
                           (done))))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest encrypted-download-preflights-e2ee-before-fetching-snapshot-stream-test
  (async done
         (let [config-prev @worker-state/*db-sync-config
               fetch-prev js/fetch
               calls (atom [])]
           (reset! worker-state/*db-sync-config {:http-base "https://sync.example.test"})
           (set! js/fetch
                 (fn [_url _opts]
                   (swap! calls conj :snapshot-stream)
                   (js/Promise.resolve #js {:ok true})))
           (-> (p/with-redefs [sync-download/fetch-json (fn [_url _opts schema]
                                                          (case schema
                                                            :sync/snapshot-download
                                                            (p/resolved {:t 42 :url "https://sync.example.test/snapshot"})

                                                            (p/rejected (ex-info "unexpected schema" {:schema schema}))))
                               sync-crypt/<fetch-graph-aes-key-for-download (fn [_graph-id]
                                                                              (swap! calls conj :e2ee-preflight)
                                                                              (p/resolved :aes-key))
                               sync-download/<stream-snapshot-row-batches! (fn [_resp _batch-size _on-batch]
                                                                             (p/resolved {:chunk-count 0}))]
                 (sync-download/download-graph-by-id! "repo" "graph-1" true))
               (p/then (fn [_]
                         (is (= [:e2ee-preflight :snapshot-stream] @calls))))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally (fn []
                            (set! js/fetch fetch-prev)
                            (reset! worker-state/*db-sync-config config-prev)
                            (done)))))))

(deftest encrypted-download-failure-emits-completed-log-test
  (async done
         (let [config-prev @worker-state/*db-sync-config
               log-events (atom [])]
           (reset! worker-state/*db-sync-config {:http-base "https://sync.example.test"})
           (-> (p/with-redefs [sync-download/fetch-json (fn [_url _opts schema]
                                                          (case schema
                                                            :sync/snapshot-download
                                                            (p/resolved {:t 42 :url "https://sync.example.test/snapshot"})

                                                            (p/rejected (ex-info "unexpected schema" {:schema schema}))))
                               sync-crypt/<fetch-graph-aes-key-for-download (fn [_graph-id]
                                                                              (p/rejected (ex-info "decrypt-private-key" {})))
                               rtc-log-and-state/rtc-log (fn [type payload]
                                                           (swap! log-events conj (assoc payload :type type))
                                                           nil)]
                 (sync-download/download-graph-by-id! "repo" "graph-1" true))
               (p/then (fn [_]
                         (is false "expected download failure")))
               (p/catch (fn [error]
                          (is (= "db-sync download failed" (ex-message error)))
                          (is (= [:download-progress :download-completed]
                                 (mapv :sub-type @log-events)))))
               (p/finally (fn []
                            (reset! worker-state/*db-sync-config config-prev)
                            (done)))))))

(deftest download-uses-snapshot-position-without-pulling-test
  (async done
         (let [config-prev @worker-state/*db-sync-config
               state-prev @worker-state/*state
               fetch-prev js/fetch
               calls (atom [])
               imported (atom [])
               finalized (atom [])
               rows [[1 "snapshot-row" nil]]
               snapshot-t (atom 0)]
           (reset! worker-state/*db-sync-config {:http-base "https://sync.example.test"})
           (swap! worker-state/*state assoc :auth/id-token "snapshot-test-token")
           (set! js/fetch
                 (fn [url _opts]
                   (swap! calls conj url)
                   (js/Promise.resolve
                    (case url
                      "https://sync.example.test/sync/graph-1/snapshot/download"
                      (js/Response. (js/JSON.stringify (clj->js {:ok true :key "stream/graph-1.snapshot"
                                                               :url "https://sync.example.test/snapshot" :t @snapshot-t})))
                      "https://sync.example.test/snapshot"
                      (js/Response. (stream-from-payload (frame-bytes (snapshot/encode-rows rows))))
                      (throw (ex-info "Unexpected download request" {:url url}))))))
           (-> (p/with-redefs [sync-download/prepare-import! (fn [& _] (p/resolved {:import-id "snapshot-import"}))
                               sync-download/import-rows-chunk! (fn [batch _graph-id _import-id]
                                                                  (swap! imported conj batch)
                                                                  (p/resolved true))
                               sync-download/finalize-import! (fn [_repo _graph-id t _import-id]
                                                                (swap! finalized conj t)
                                                                (p/resolved true))]
                 (p/loop [positions [0 42]]
                   (when-let [t (first positions)]
                     (reset! snapshot-t t)
                     (p/let [result (sync-download/download-graph-by-id! "repo" "graph-1" false)]
                       (is (= t (:remote-tx result)))
                       (p/recur (next positions))))))
               (p/then (fn []
                         (is (= [0 42] @finalized))
                         (is (= [rows rows] @imported))
                         (is (= (vec (repeat 2 ["https://sync.example.test/sync/graph-1/snapshot/download" "https://sync.example.test/snapshot"]))
                                (mapv vec (partition 2 @calls))))))
               (p/catch (fn [error] (is false (str error))))
               (p/finally (fn []
                            (set! js/fetch fetch-prev)
                            (reset! worker-state/*db-sync-config config-prev)
                            (reset! worker-state/*state state-prev)
                            (done)))))))

(deftest snapshot-stream-request-url-test
  (doseq [[server-url expected]
          [["http://127.0.0.1:8787/sync/graph-1/snapshot/stream?graph-id=graph-1"
            "https://sync.example.test/sync/graph-1/snapshot/stream?graph-id=graph-1"]
           ["https://assets.example.test/graph-1.snapshot?X-Amz-Signature=abc"
            "https://assets.example.test/graph-1.snapshot?X-Amz-Signature=abc"]]]
    (is (= expected
           (#'sync-download/snapshot-stream-request-url
            "https://sync.example.test" "graph-1" server-url)))))

(deftest download-rejects-snapshot-without-a-journal-position-test
  (async done
         (let [config-prev @worker-state/*db-sync-config
               state-prev @worker-state/*state
               fetch-prev js/fetch
               calls (atom [])]
           (reset! worker-state/*db-sync-config {:http-base "https://sync.example.test"})
           (swap! worker-state/*state assoc :auth/id-token "snapshot-test-token")
           (set! js/fetch
                 (fn [url _opts]
                   (swap! calls conj url)
                   (js/Promise.resolve
                    (js/Response. (js/JSON.stringify (clj->js {:ok true :key "stream/graph-1.snapshot"
                                                             :url "https://sync.example.test/snapshot"}))))))
           (-> (sync-download/download-graph-by-id! "repo" "graph-1" false)
               (p/then (fn [_] (is false "Missing snapshot t must reject before downloading data")))
               (p/catch (fn [error]
                          (is (= "db-sync download failed" (ex-message error)))
                          (is (= ["https://sync.example.test/sync/graph-1/snapshot/download"] @calls))))
               (p/finally (fn []
                            (set! js/fetch fetch-prev)
                            (reset! worker-state/*db-sync-config config-prev)
                            (reset! worker-state/*state state-prev)
                            (done)))))))
