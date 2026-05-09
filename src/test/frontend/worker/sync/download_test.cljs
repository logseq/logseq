(ns frontend.worker.sync.download-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.download :as sync-download]
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

(defn- stream-from-payload
  [^js payload]
  (js/ReadableStream.
   #js {:start (fn [controller]
                 (.enqueue controller payload)
                 (.close controller))}))

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
                                                            :sync/pull
                                                            (p/resolved {:t 42})

                                                            :sync/snapshot-download
                                                            (p/resolved {:url "https://sync.example.test/snapshot"})

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
