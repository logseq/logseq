(ns frontend.worker.sync.download-mutation-test
  (:require [cljs.test :refer [async deftest is testing]]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.download :as sync-download]
            [logseq.db-sync.snapshot :as snapshot]
            [logseq.db.frontend.schema :as db-schema]
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

(defn- stream-bytes
  [stream]
  (p/let [buf (.arrayBuffer (js/Response. stream))]
    (vec (js/Uint8Array. buf))))

(defn- async-test
  [promise]
  (async done
    (-> (p/promise promise)
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))

(deftest gzip-bytes-needs-two-magic-bytes-test
  (let [f #'sync-download/gzip-bytes?]
    (is (true? (f (js/Uint8Array. #js [31 139]))))
    (is (true? (f (js/Uint8Array. #js [31 139 8]))))
    (is (false? (f (js/Uint8Array. #js [31]))))
    (is (false? (f (js/Uint8Array. #js [30 139]))))
    (is (false? (f (js/Uint8Array. #js [31 138]))))
    (is (false? (f nil)))))

(deftest flush-row-batches-flushes-exact-batch-test
  (async-test
   (let [batches* (atom [])]
     (p/let [remaining (#'sync-download/<flush-row-batches!
                        [1 2] 2 (fn [batch] (swap! batches* conj batch) (p/resolved true)))]
       (is (= [[1 2]] @batches*))
       (is (= [] remaining))))))

(deftest stream-starts-with-gzip-probes-first-chunk-test
  (async-test
   (p/let [gzip? (#'sync-download/<stream-starts-with-gzip?
                  (stream-from-payload (js/Uint8Array. #js [31 139 8 0])))
           plain? (#'sync-download/<stream-starts-with-gzip?
                   (stream-from-payload (js/Uint8Array. #js [1 2 3])))
           empty? (#'sync-download/<stream-starts-with-gzip?
                   (js/ReadableStream. #js {:start (fn [c] (.close c))}))]
     (is (true? gzip?))
     (is (false? plain?))
     (is (false? empty?)))))

(deftest response-body-stream-picks-the-right-stream-test
  (async-test
   (let [plain (js/Uint8Array. #js [1 2 3 4 5])
         gz-stream #(.pipeThrough (stream-from-payload plain) (js/CompressionStream. "gzip"))
         f #'sync-download/<response-body-stream
         plain-resp (js/Response. (stream-from-payload plain) #js {:status 200})]
     (p/let [no-body (f (js/Response. nil #js {:status 200}))
             same (f plain-resp)
             gzipped (f (js/Response. (gz-stream)
                                      #js {:status 200
                                           :headers #js {"content-encoding" "gzip"}}))
             stale-header (f (js/Response. (stream-from-payload plain)
                                           #js {:status 200
                                                :headers #js {"content-encoding" "gzip"}}))
             gzipped-bytes (when gzipped (stream-bytes gzipped))
             stale-bytes (when stale-header (stream-bytes stale-header))]
       (testing "no body gives nil"
         (is (nil? no-body)))
       (testing "an unencoded body is returned as is"
         (is (identical? (.-body plain-resp) same)))
       (testing "a real gzip body is decompressed"
         (is (= [1 2 3 4 5] gzipped-bytes)))
       (testing "a gzip header over plain bytes is left alone"
         (is (= [1 2 3 4 5] stale-bytes)))))))

(deftest truncated-snapshot-stream-is-rejected-test
  (async-test
   (let [framed (frame-bytes (snapshot/encode-rows [[1 "row-1" nil]]))
         truncated (.slice framed 0 (- (.-byteLength framed) 3))
         resp (js/Response. (stream-from-payload truncated) #js {:status 200})]
     (-> (#'sync-download/<stream-snapshot-row-batches!
          resp 1000 (fn [_] (p/resolved true)))
         (p/then (fn [_] (is false "expected an incomplete frame error")))
         (p/catch (fn [error]
                    (is (= "incomplete framed buffer" (ex-message error)))))))))

(deftest require-import-state-matches-repo-and-ids-test
  (let [state* @#'sync-download/*import-state
        prev @state*
        f #'sync-download/require-import-state!]
    (try
      (reset! state* {:repo "r" :graph-id "g" :import-id "i"})
      (is (= "r" (:repo (f nil "g" "i"))))
      (is (= "r" (:repo (f "r" "g" "i"))))
      (is (thrown? js/Error (f "other" "g" "i")))
      (is (thrown? js/Error (f "r" "g" "other-import")))
      (is (thrown? js/Error (f "r" "other-graph" "i")))
      (finally
        (reset! state* prev)))))

(deftest finalize-import-clears-state-only-on-non-stale-errors-test
  (async-test
   (let [state* @#'sync-download/*import-state
         prev @state*
         closed* (atom 0)
         rows-db #js {:close (fn [] (swap! closed* inc))}
         state {:repo "r" :graph-id "g" :import-id "i" :rows-db rows-db}]
     (-> (p/with-redefs [sync-download/complete-datoms-import!
                         (fn [_repo _graph-id _remote-tx]
                           (p/rejected (js/Error. "disk full")))]
           (p/let [_ (reset! state* state)
                   stale (-> (sync-download/finalize-import! "r" "other-graph" 1 "i")
                             (p/then (fn [_] :no-error))
                             (p/catch (fn [error] (:type (ex-data error)))))
                   after-stale @state*
                   failed (-> (sync-download/finalize-import! "r" "g" 1 "i")
                              (p/then (fn [_] :no-error))
                              (p/catch ex-message))]
             [stale after-stale failed]))
         (p/then (fn [[stale after-stale failed]]
                   (testing "a stale import error keeps the current import"
                     (is (= :db-sync/stale-import stale))
                     (is (= state after-stale)))
                   (testing "any other error drops the import and closes its rows db"
                     (is (= "disk full" failed))
                     (is (nil? @state*))
                     (is (= 1 @closed*)))))
         (p/finally (fn [] (reset! state* prev)))))))

(deftest import-datoms-batch-decrypts-only-e2ee-and-stamps-blocks-test
  (async-test
   (let [conn (d/create-conn db-schema/schema)
         block-uuid (random-uuid)
         raw [{:e 1 :a :block/uuid :v block-uuid}
              {:e 1 :a :block/title :v "raw"}
              {:e 2 :a :block/title :v "no uuid"}]]
     (p/with-redefs [sync-crypt/<decrypt-snapshot-datoms-batch
                     (fn [_key _datoms]
                       (p/resolved [{:e 7 :a :block/title :v "decrypted"}]))]
       (p/let [_ (#'sync-download/import-datoms-batch! conn :key false raw)
               tx-id (inc (:max-tx @conn))
               _ (is (= "raw" (:block/title (d/entity @conn 1))))
               _ (is (nil? (d/entity @conn 7)))
               _ (testing "only entities with a uuid datom are stamped"
                   (is (some? (:block/tx-id (d/entity @conn 1))))
                   (is (nil? (:block/tx-id (d/entity @conn 2)))))
               _ (#'sync-download/import-datoms-batch! conn :key true raw)]
         (is (= "decrypted" (:block/title (d/entity @conn 7))))
         (is (pos? tx-id)))))))

(deftest schema-datom-covers-version-and-ident-entities-test
  (let [f #'sync-download/schema-datom?
        ident-eids #{10}
        version-eid 5]
    (is (true? (boolean (f ident-eids version-eid {:e 5 :a :block/title :v "x"}))))
    (is (false? (boolean (f ident-eids version-eid {:e 6 :a :block/title :v "x"}))))
    (testing "ident entities contribute :db/ident and db-namespace datoms only"
      (is (true? (boolean (f ident-eids version-eid {:e 10 :a :db/ident :v :x}))))
      (is (true? (boolean (f ident-eids version-eid {:e 10 :a :db/valueType :v :x}))))
      (is (false? (boolean (f ident-eids version-eid {:e 10 :a :block/title :v "x"}))))
      (is (false? (boolean (f ident-eids version-eid {:e 11 :a :db/ident :v :x}))))
      (is (false? (boolean (f ident-eids version-eid {:e 11 :a :db/valueType :v :x})))))))

(deftest prepare-import-closes-db-only-on-reset-and-needs-aes-key-test
  (async-test
   (let [calls* (atom [])
         thread-apis-prev @thread-api/*thread-apis
         sqlite-prev @worker-state/*sqlite
         state* @#'sync-download/*import-state
         state-prev @state*
         apis {:thread-api/db-sync-close-db (fn [repo] (swap! calls* conj [:close repo]) (p/resolved nil))
               :thread-api/unsafe-unlink-db (fn [repo] (swap! calls* conj [:unlink repo]) (p/resolved nil))
               :thread-api/db-sync-invalidate-search-db (fn [repo] (swap! calls* conj [:invalidate repo]) (p/resolved nil))
               :thread-api/create-or-open-db (fn [repo _opts] (swap! calls* conj [:open repo]) (p/resolved nil))}
         key* (atom :aes)]
     (vreset! thread-api/*thread-apis (merge thread-apis-prev apis))
     (-> (p/with-redefs [worker-state/get-datascript-conn (fn [_repo] :conn)
                         sync-crypt/<fetch-graph-aes-key-for-download (fn [_g] (p/resolved @key*))]
           (p/let [_ (reset! state* nil)
                   r1 (sync-download/prepare-import! "repo" false "g" false)
                   calls-no-reset @calls*
                   _ (reset! calls* [])
                   _ (reset! state* nil)
                   r2 (sync-download/prepare-import! "repo" true "g" false)
                   calls-reset @calls*
                   _ (reset! state* nil)
                   r3 (sync-download/prepare-import! "repo" false "g" true)
                   _ (reset! key* nil)
                   _ (reset! state* nil)
                   missing-key (-> (sync-download/prepare-import! "repo" false "g" true)
                                   (p/then (fn [_] :no-error))
                                   (p/catch (fn [error] (ex-data error))))]
             (is (string? (:import-id r1)))
             (is (not-any? #{:close :unlink :invalidate} (map first calls-no-reset)))
             (is (= [[:close "repo"] [:unlink "repo"] [:invalidate "repo"] [:open "repo"]]
                    calls-reset))
             (is (string? (:import-id r2)))
             (is (string? (:import-id r3)))
             (is (= :aes-key (:field missing-key)))))
         (p/finally (fn []
                      (vreset! thread-api/*thread-apis thread-apis-prev)
                      (reset! worker-state/*sqlite sqlite-prev)
                      (reset! state* state-prev)))))))
