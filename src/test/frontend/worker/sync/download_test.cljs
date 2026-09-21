(ns frontend.worker.sync.download-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.download :as sync-download]
            [frontend.worker.sync.log-and-state :as rtc-log-and-state]
            [logseq.db-sync.checksum :as checksum]
            [logseq.db-sync.snapshot :as snapshot]
            [logseq.db.test.helper :as db-test]
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

(deftest download-checksum-matches-imported-snapshot-not-earlier-pull-test
  (async done
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Downloaded page"}
                  :blocks [{:block/title "before remote edit"}]}])
          block-id (:db/id (db-test/find-block-by-content @conn "before remote edit"))
          pull-checksum (checksum/recompute-checksum @conn)
          saved-checksum (atom nil)
          config-prev @worker-state/*db-sync-config
          fetch-prev js/fetch
          graph-id (str (random-uuid))]
      (reset! worker-state/*db-sync-config {:http-base "https://sync.example.test"})
      (set! js/fetch (fn [_url _opts] (p/resolved #js {:ok true})))
      (-> (p/with-redefs [sync-download/fetch-json
                          (fn [_url _opts schema]
                            (p/resolved
                             (case schema
                               :sync/pull {:t 42 :checksum pull-checksum}
                               :sync/snapshot-download {:url "https://sync.example.test/snapshot"})))
                          sync-download/<stream-snapshot-row-batches!
                          (fn [_resp _batch-size on-batch] (on-batch [[1 "snapshot" nil]]))
                          sync-download/prepare-import!
                          (fn [& _] (p/resolved {:import-id "test-import"}))
                          sync-download/import-rows-chunk!
                          (fn [& _] (p/resolved true))
                          sync-download/finalize-import!
                          (fn [& _]
                            ;; The downloaded snapshot includes an edit made after /pull.
                            (d/transact! conn [[:db/add block-id :block/title "after remote edit"]])
                            (p/resolved true))
                          worker-state/get-datascript-conn (fn [_] conn)
                          client-op/update-local-checksum
                          (fn [_ value] (reset! saved-checksum value))]
            (sync-download/download-graph-by-id! "download-checksum-test" graph-id false))
          (p/then (fn [_]
                    (let [expected (checksum/recompute-checksum @conn)]
                      (is (not= pull-checksum expected))
                      (is (= expected @saved-checksum)))))
          (p/catch (fn [error] (is false (str error))))
          (p/finally (fn []
                       (set! js/fetch fetch-prev)
                       (reset! worker-state/*db-sync-config config-prev)
                       (done)))))))

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

(deftest encrypted-download-failure-emits-completed-log-test
  (async done
         (let [config-prev @worker-state/*db-sync-config
               log-events (atom [])]
           (reset! worker-state/*db-sync-config {:http-base "https://sync.example.test"})
           (-> (p/with-redefs [sync-download/fetch-json (fn [_url _opts schema]
                                                          (case schema
                                                            :sync/pull
                                                            (p/resolved {:t 42})

                                                            :sync/snapshot-download
                                                            (p/resolved {:url "https://sync.example.test/snapshot"})

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
