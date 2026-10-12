(ns logseq.db-sync.worker.handler.sync-mutation-test
  "Tests for logseq.db-sync.worker.handler.sync written from its surviving
  mutants: schema init, readiness, snapshot upload/download, tx chunking."
  (:require ["zlib" :as zlib]
            [cljs.test :refer [async deftest is testing]]
            [datascript.core :as d]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.snapshot :as snapshot]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.test-sql :as test-sql]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.ws :as ws]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]))

(defn- request-url
  ([path]
   (request-url path #js {:method "GET"}))
  ([path init]
   (let [request (js/Request. (str "http://localhost" path) init)]
     {:request request
      :url (js/URL. (.-url request))})))

(defn- handle!
  [self {:keys [request url]} handler]
  (sync-handler/handle {:self self
                        :request request
                        :url url
                        :route {:handler handler}}))

(defn- json-body
  [resp]
  (p/let [text (.text resp)]
    (js->clj (js/JSON.parse text) :keywordize-keys true)))

(defn- finish-async!
  "Runs the promise-returning f, reports a rejection as a failure, then done."
  [done f]
  (-> (p/do (f))
      (p/then (fn [_] (done)))
      (p/catch (fn [error]
                 (is false (str error))
                 (done)))))

(defn- framed-rows
  [rows]
  (#'sync-handler/frame-bytes (snapshot/encode-rows rows)))

(defn- server-self
  []
  (let [sql (test-sql/make-sql)
        conn (storage/open-conn sql)]
    {:sql sql
     :conn conn
     :self #js {:sql sql
                :conn conn
                :schema-ready true
                :env #js {}}}))

(defn- tx-batch!
  [^js self tx-data outliner-op]
  (with-redefs [ws/broadcast! (fn [& _] nil)]
    (sync-handler/handle-tx-batch! self nil
                                   [{:tx (protocol/tx->transit tx-data)
                                     :tx-id (random-uuid)
                                     :outliner-op outliner-op}]
                                   (storage/get-t (.-sql self)))))

(defn- tx-batch-reports!
  "Applies tx-data as one entry; returns the response and the tx reports'
  tx-meta, one per transaction."
  [{:keys [self conn]} tx-data outliner-op]
  (let [tx-metas (atom [])]
    (d/listen! conn ::count-tx-reports
               (fn [{:keys [tx-meta]}]
                 (swap! tx-metas conj tx-meta)))
    (try
      {:response (tx-batch! self tx-data outliner-op)
       :tx-metas @tx-metas}
      (finally
        (d/unlisten! conn ::count-tx-reports)))))

(defn- new-block-tx
  "7 items creating one block under page-uuid, all on the string tempid eid."
  [eid page-uuid title]
  [[:db/add eid :block/uuid (random-uuid)]
   [:db/add eid :block/title title]
   [:db/add eid :block/page [:block/uuid page-uuid]]
   [:db/add eid :block/parent [:block/uuid page-uuid]]
   [:db/add eid :block/order "a0"]
   [:db/add eid :block/created-at 1]
   [:db/add eid :block/updated-at 1]])

(defn- filler-tx
  "n new blocks: 7 items each."
  [page-uuid n]
  (vec (mapcat #(new-block-tx (str "filler-" %) page-uuid (str "filler-" %)) (range n))))

(defn- seed-page-and-block!
  [conn]
  (let [page-uuid (random-uuid)
        block-uuid (random-uuid)]
    (d/transact! conn [{:block/uuid page-uuid
                        :block/name "mutation-page"
                        :block/title "mutation-page"}
                       {:block/uuid block-uuid
                        :block/title "mutation-block"
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid page-uuid]
                        :block/order "a0"
                        :block/created-at 1
                        :block/updated-at 1}])
    {:page-uuid page-uuid
     :block-uuid block-uuid
     :block-eid (:db/id (d/entity @conn [:block/uuid block-uuid]))}))

;; ensure-schema!

;; Fails if, in `ensure-schema!`, `true` becomes `false`.
(deftest ensure-schema-initializes-schema-once-test
  (let [calls (atom 0)
        self #js {:sql (test-sql/make-sql)}]
    (with-redefs [storage/init-schema! (fn [_] (swap! calls inc))]
      (sync-handler/t-now self)
      (sync-handler/t-now self))
    (is (= 1 @calls))
    (is (true? (.-schema-ready self)))))

;; health

;; Fails if, in `handle`, `true` becomes `false`.
(deftest health-route-reports-ok-test
  (async done
    (finish-async!
     done
     #(p/let [resp (handle! #js {} (request-url "/sync/graph-1/health") :sync/health)
              body (json-body resp)]
        (is (= 200 (.-status resp)))
        (is (= {:ok true} body))))))

;; pull

;; Fails if, in `<ready-for-sync?`, `false` becomes `true`.
(deftest sync-pull-is-blocked-while-snapshot-upload-is-in-progress-test
  (async done
    (let [sql (test-sql/make-sql)
          self #js {:sql sql
                    :conn (d/create-conn db-schema/schema)
                    :schema-ready true
                    :env #js {}}]
      (storage/set-meta! sql :snapshot-uploading? true)
      (finish-async!
       done
       #(p/let [resp (handle! self (request-url "/sync/graph-1/pull?graph-id=graph-1&since=0") :sync/pull)
                body (json-body resp)]
          (is (= 409 (.-status resp)))
          (is (= "graph not ready" (:error body))))))))

;; Fails if, in `handle-sync-pull`, `if` becomes `if-not`, `some?` becomes `nil?` or `or` becomes `and`.
(deftest sync-pull-returns-txs-after-since-and-rejects-invalid-since-test
  (async done
    (let [{:keys [conn self]} (server-self)
          pull! (fn [query]
                  (p/let [resp (handle! self (request-url (str "/sync/graph-1/pull?graph-id=graph-1" query)) :sync/pull)
                          body (json-body resp)]
                    {:status (.-status resp)
                     :ts (mapv :t (:txs body))
                     :error (:error body)}))]
      (d/transact! conn [{:block/uuid (random-uuid) :block/title "first"}])
      (d/transact! conn [{:block/uuid (random-uuid) :block/title "second"}])
      (finish-async!
       done
       #(p/let [all (pull! "")
                after-1 (pull! "&since=1")
                not-a-number (pull! "&since=abc")
                negative (pull! "&since=-1")]
          (is (= {:status 200 :ts [1 2] :error nil} all))
          (is (= {:status 200 :ts [2] :error nil} after-1))
          (is (= {:status 400 :ts [] :error "invalid since"} not-a-number))
          (is (= {:status 400 :ts [] :error "invalid since"} negative)))))))

;; tx batch

;; Fails if, in `handle-tx-batch!`, `or` becomes `and`.
(deftest tx-batch-rejects-invalid-t-before-test
  (let [{:keys [self]} (server-self)
        entry {:tx (protocol/tx->transit [[:db/add -1 :block/title "x"]])
               :outliner-op :save-block}]
    (doseq [t-before [nil -1]]
      (testing (pr-str t-before)
        (is (= {:type "tx/reject" :reason "invalid t-before"}
               (sync-handler/handle-tx-batch! self nil [entry] t-before)))))))

;; Fails if, in `block-uuid-lookup-ref`, `and` becomes `or`.
(deftest tx-batch-reports-only-block-uuid-lookups-as-missing-blocks-test
  (let [{:keys [self]} (server-self)
        response (tx-batch! self [[:db/add [:db/ident :user.property/missing] :block/title "x"]] :save-block)]
    (is (= "tx/reject" (:type response)))
    (is (= "db transact failed" (:reason response)))
    (is (not (contains? response :missing-block-uuids)))))

;; Fails if, in `sanitize-tx-entry`, `=` becomes `not=`.
(deftest tx-batch-fix-retracting-only-a-missing-block-is-not-broadcast-test
  (testing "a :fix entry whose only op retracts a block that does not exist changes nothing, so other clients are not told to pull"
    (let [{:keys [self]} (server-self)
          broadcasts (atom [])
          t-before (storage/get-t (.-sql self))
          response (with-redefs [ws/broadcast! (fn [_self _sender msg] (swap! broadcasts conj msg))]
                     (sync-handler/handle-tx-batch! self nil
                                                    [{:tx (protocol/tx->transit [[:db/retractEntity [:block/uuid (random-uuid)]]])
                                                      :tx-id (random-uuid)
                                                      :outliner-op :fix}]
                                                    t-before))]
      (is (= {:type "tx/batch/ok" :t t-before} (select-keys response [:type :t])))
      (is (= [] @broadcasts)))))

;; large tx chunking

;; Fails if, in `replaced-value-attrs`, `when` becomes `when-not`.
;; Fails if, in `tx-item-group-keys`, `and` becomes `or`.
;; Fails if, in `reduce-ordered-tx-chunks`, `>` becomes `>=`.
(deftest large-tx-of-1000-independent-maps-is-applied-in-two-chunks-of-500-test
  (let [server (server-self)
        tx-data (mapv (fn [_] {:block/uuid (random-uuid) :block/title "same title"}) (range 1000))
        {:keys [response tx-metas]} (tx-batch-reports! server tx-data :save-block)]
    (is (= "tx/batch/ok" (:type response)))
    (is (= 2 (count tx-metas)))
    (is (= 2 (:t response)))))

;; Fails if, in `tempid?`, `and` becomes `or`.
;; Fails if, in `replaced-value-attrs`, `when` becomes `when-not`, `and` becomes `or` or `=` becomes `not=`.
;; Fails if, in `tx-item-group-keys`, `and` becomes `or`.
(deftest large-tx-chunks-updates-of-an-existing-block-independently-test
  (testing "two adds of a cardinality-one attr on an existing block (raw eid) far apart are not grouped"
    (let [{:keys [conn] :as server} (server-self)
          {:keys [page-uuid block-uuid block-eid]} (seed-page-and-block! conn)
          tx-data (vec (concat [[:db/add block-eid :block/updated-at 2]]
                               (filler-tx page-uuid 72)
                               [[:db/add block-eid :block/updated-at 3]]))
          {:keys [response tx-metas]} (tx-batch-reports! server tx-data :save-block)]
      (is (= "tx/batch/ok" (:type response)))
      (is (= 2 (count tx-metas)))
      (is (= 3 (:block/updated-at (d/entity @conn [:block/uuid block-uuid])))))))

;; Fails if, in `cardinality-many-attr?`, `or` becomes `and`.
;; Fails if, in `replaced-value-attrs`, `and` becomes `or`.
;; Fails if, in `tx-item-group-keys`, `and` becomes `or`.
(deftest large-tx-chunks-cardinality-many-retract-and-add-independently-test
  (testing "a retract and an add of a cardinality-many attr on an existing block far apart are not grouped"
    (let [{:keys [conn] :as server} (server-self)
          {:keys [page-uuid block-uuid]} (seed-page-and-block! conn)
          block-ref [:block/uuid block-uuid]
          page-ref [:block/uuid page-uuid]
          _ (d/transact! conn [[:db/add block-ref :block/refs page-ref]])
          tx-data (vec (concat [[:db/retract block-ref :block/refs page-ref]]
                               (filler-tx page-uuid 72)
                               [[:db/add block-ref :block/refs page-ref]]))
          {:keys [response tx-metas]} (tx-batch-reports! server tx-data :save-block)]
      (is (= "tx/batch/ok" (:type response)))
      (is (= 2 (count tx-metas))))))

;; Fails if, in `tempid?`, `and` becomes `or`.
;; Fails if, in `tx-item-group-keys`, `and` becomes `or`.
(deftest large-tx-chunks-retract-entity-of-an-existing-block-independently-test
  (testing "two retractEntity items of one existing block (raw eid) far apart are not grouped"
    (let [{:keys [conn] :as server} (server-self)
          {:keys [page-uuid block-uuid block-eid]} (seed-page-and-block! conn)
          tx-data (vec (concat [[:db/retractEntity block-eid]]
                               (filler-tx page-uuid 72)
                               [[:db/retractEntity block-eid]]))
          {:keys [response tx-metas]} (tx-batch-reports! server tx-data :save-block)]
      (is (= "tx/batch/ok" (:type response)))
      (is (= 2 (count tx-metas)))
      (is (nil? (d/entity @conn [:block/uuid block-uuid]))))))

;; Fails if, in `merge-ranges`, `<=` becomes `<`.
(deftest large-tx-keeps-groups-sharing-an-item-in-one-chunk-test
  (testing "tempid A's last item refers to tempid B: A's and B's items stay in one chunk"
    (let [{:keys [conn] :as server} (server-self)
          {:keys [page-uuid]} (seed-page-and-block! conn)
          _ (d/transact! conn [{:db/ident :user.property/link
                                :db/valueType :db.type/ref
                                :db/cardinality :db.cardinality/one}])
          b-uuid (random-uuid)
          tx-data (vec (concat (filler-tx page-uuid 70)
                               [[:db/add "A" :block/uuid (random-uuid)]
                                [:db/add "A" :block/title "a"]
                                [:db/add "A" :block/page [:block/uuid page-uuid]]
                                [:db/add "A" :block/parent [:block/uuid page-uuid]]
                                [:db/add "A" :block/order "a1"]
                                [:db/add "A" :user.property/link "B"]
                                [:db/add "B" :block/uuid b-uuid]
                                [:db/add "B" :block/page [:block/uuid page-uuid]]
                                [:db/add "B" :block/parent [:block/uuid page-uuid]]
                                [:db/add "B" :block/order "a2"]
                                [:db/add "B" :block/created-at 1]
                                [:db/add "B" :block/updated-at 1]
                                [:db/add "B" :block/title "b"]]))
          {:keys [response tx-metas]} (tx-batch-reports! server tx-data :save-block)]
      (is (= "tx/batch/ok" (:type response)))
      (is (= 2 (count tx-metas)))
      (is (= "b" (:block/title (d/entity @conn [:block/uuid b-uuid])))))))

;; Fails if, in `reduce-ordered-tx-chunks`, `>` becomes `>=`.
;; Fails if, in `large-tx?`, `>=` becomes `>`.
(deftest tx-entry-of-500-items-is-applied-as-large-tx-test
  (let [{:keys [conn] :as server} (server-self)
        {:keys [page-uuid]} (seed-page-and-block! conn)
        tx-data (vec (concat (filler-tx page-uuid 71)
                             [[:db/add "x" :block/uuid (random-uuid)]
                              [:db/add "x" :block/title "x"]
                              [:db/add "x" :block/created-at 1]]))
        {:keys [response tx-metas]} (tx-batch-reports! server tx-data :save-block)]
    (is (= 500 (count tx-data)))
    (is (= "tx/batch/ok" (:type response)))
    (is (= [true] (mapv :db-sync/skip-checksum-update? tx-metas)))))

;; Fails if, in `apply-tx-entry!`, `and` becomes `or`.
(deftest small-tx-entry-is-applied-as-one-plain-transaction-test
  (let [server (server-self)
        {:keys [response tx-metas]} (tx-batch-reports! server [[:db/add -1 :block/title "small"]] :save-block)]
    (is (= "tx/batch/ok" (:type response)))
    (is (= [nil] (mapv :db-sync/skip-checksum-update? tx-metas)))))

;; Fails if, in `apply-tx-entry!`, `and` becomes `or`.
(deftest large-db-migrate-entry-is-applied-in-one-transaction-test
  (let [{:keys [conn] :as server} (server-self)
        {:keys [page-uuid]} (seed-page-and-block! conn)
        tx-data (filler-tx page-uuid 100)
        {:keys [response tx-metas]} (tx-batch-reports! server tx-data :db-migrate)]
    (is (= "tx/batch/ok" (:type response)))
    (is (= 1 (count tx-metas)))))

;; Fails if, in `apply-large-tx-entry!`, `when` becomes `when-not`.
(deftest large-tx-removes-its-checksum-listener-test
  (let [{:keys [conn] :as server} (server-self)
        {:keys [page-uuid]} (seed-page-and-block! conn)
        {:keys [response]} (tx-batch-reports! server (filler-tx page-uuid 100) :save-block)]
    (is (= "tx/batch/ok" (:type response)))
    (is (not (contains? (:listeners @(:atom conn))
                        :logseq.db-sync.worker.handler.sync/large-logical-tx-checksum)))))

;; snapshot download

;; Fails if, in `snapshot-stream-gzip-enabled?`, `false` becomes `true`.
(deftest snapshot-download-omits-gzip-when-env-flag-is-boolean-false-test
  (async done
    (let [self #js {:env #js {"DB_SYNC_SNAPSHOT_STREAM_GZIP" false}
                    :conn (d/create-conn db-schema/schema)
                    :schema-ready true
                    :sql #js {:exec (fn [& _] #js [])}}]
      (finish-async!
       done
       #(p/let [resp (handle! self (request-url "/sync/graph-1/snapshot/download?graph-id=graph-1") :sync/snapshot-download)
                body (json-body resp)]
          (is (= 200 (.-status resp)))
          (is (true? (:ok body)))
          (is (not (contains? body :content-encoding))))))))

;; Fails if, in `snapshot-export-stream`, `first` becomes `last`.
(deftest snapshot-stream-pages-by-the-last-row-addr-test
  (async done
    (let [rows [[1 "row-1" nil]
                [2 "row-2" nil]]
          last-addrs (atom [])
          self #js {:env #js {"DB_SYNC_SNAPSHOT_STREAM_GZIP" "false"}
                    :conn (d/create-conn db-schema/schema)
                    :schema-ready true
                    :sql #js {:exec (fn [& _] #js [])}}
          {:keys [request]} (request-url "/sync/graph-1/snapshot/stream?graph-id=graph-1")]
      (finish-async!
       done
       #(p/with-redefs [sync-handler/fetch-snapshot-kvs-rows
                        (fn [_sql last-addr _limit]
                          (swap! last-addrs conj last-addr)
                          ;; one row per page
                          (if (number? last-addr)
                            (vec (take 1 (filter (fn [[addr]] (> addr last-addr)) rows)))
                            []))
                        sync-handler/snapshot-row-count (fn [_sql] (count rows))]
          (p/let [resp (sync-handler/handle-http self request)
                  buf (.arrayBuffer resp)
                  streamed (snapshot/finalize-framed-buffer (js/Uint8Array. buf))]
            (is (= rows streamed))
            (is (= [-1 1 2] @last-addrs))))))))

;; snapshot import stream

(defn- stream-of-chunks
  [chunks]
  (js/ReadableStream.
   #js {:start (fn [controller]
                 (doseq [chunk chunks]
                   (.enqueue controller chunk))
                 (.close controller))}))

(defn- import-calls!
  [chunks reset?]
  (let [calls (atom [])
        self #js {:sql (test-sql/make-sql)
                  :conn (d/create-conn db-schema/schema)
                  :schema-ready true}]
    (p/with-redefs [sync-handler/import-snapshot! (fn [_self rows reset?]
                                                    (swap! calls conj [rows reset?]))]
      (p/let [n (#'sync-handler/import-snapshot-stream! self (stream-of-chunks chunks) reset?)]
        {:count n
         :calls @calls}))))

;; Fails if, in `import-snapshot-stream!`, `true` becomes `false` or `or` becomes `and`.
(deftest import-snapshot-stream-resets-for-an-empty-snapshot-test
  (async done
    (finish-async!
     done
     #(p/let [result (import-calls! [] true)]
        (is (= {:count 0 :calls [[[] true]]} result))))))

;; Fails if, in `import-snapshot-stream!`, `and` becomes `or`.
(deftest import-snapshot-stream-resets-only-with-the-first-chunk-test
  (async done
    (let [rows-1 [[1 "row-1" nil]]
          rows-2 [[2 "row-2" nil]]]
      (finish-async!
       done
       #(p/let [with-reset (import-calls! [(framed-rows rows-1) (framed-rows rows-2)] true)
                without-reset (import-calls! [(framed-rows rows-1)] false)]
          (is (= {:count 2 :calls [[rows-1 true] [rows-2 false]]} with-reset))
          (is (= {:count 1 :calls [[rows-1 false]]} without-reset)))))))

;; snapshot upload

(defn- upload!
  "POSTs body to the snapshot upload route with the real stream import (rows
  captured instead of written). Returns status, body, imported rows, reset
  flags, graph-ready updates and the uploading flag seen during and after."
  [{:keys [query body headers]}]
  (let [sql (test-sql/make-sql)
        self #js {:sql sql
                  :conn (d/create-conn db-schema/schema)
                  :schema-ready true
                  :env #js {}}
        imported (atom [])
        ready-updates (atom [])
        uploading-during (atom [])
        {:keys [request url]} (request-url (str "/sync/graph-1/snapshot/upload?graph-id=graph-1" query)
                                           (clj->js {:method "POST"
                                                     :headers (or headers {})
                                                     :body body}))]
    (p/with-redefs [sync-handler/import-snapshot! (fn [_self rows reset?]
                                                    (swap! uploading-during conj (storage/get-meta sql :snapshot-uploading?))
                                                    (swap! imported conj [rows reset?]))
                    sync-handler/<set-graph-ready-for-use! (fn [_self _graph-id ready?]
                                                             (swap! ready-updates conj ready?)
                                                             (p/resolved true))]
      (p/let [resp (sync-handler/handle {:self self :request request :url url
                                         :route {:handler :sync/snapshot-upload}})
              body (json-body resp)]
        {:status (.-status resp)
         :body body
         :imported @imported
         :ready-updates @ready-updates
         :uploading-during @uploading-during
         :uploading-after (storage/get-meta sql :snapshot-uploading?)}))))

(def ^:private upload-rows [[7 "row-7" nil]])

;; Fails if, in `maybe-decompress-stream`, `if` becomes `if-not`, `and` becomes `or` or `=` becomes `not=`.
;; Fails if, in `handle-sync-snapshot-upload`, `or` becomes `and`, `and` becomes `or` or `not` becomes `identity`.
(deftest snapshot-upload-decompresses-only-gzip-bodies-test
  (async done
    (let [frame (framed-rows upload-rows)]
      (finish-async!
       done
       #(p/let [plain (upload! {:query "&finished=true" :body frame})
                gzipped (upload! {:query "&finished=true"
                                  :body (js/Uint8Array. (zlib/gzipSync frame))
                                  :headers {"content-encoding" "gzip"}})]
          (doseq [[label result] [["plain" plain] ["gzip" gzipped]]]
            (testing label
              (is (= 200 (:status result)))
              (is (= {:ok true :count 1} (:body result)))
              (is (= [[upload-rows true]] (:imported result))))))))))

;; Fails if, in `maybe-decompress-stream`, `if` becomes `if-not`.
;; Fails if, in `handle-sync-snapshot-upload`, `or` becomes `and`, `and` becomes `or`, `=` becomes `not=` or `not` becomes `identity`.
(deftest snapshot-upload-without-decompression-stream-rejects-only-gzip-test
  (async done
    (let [frame (framed-rows upload-rows)
          original (.-DecompressionStream js/globalThis)
          restore! #(aset js/globalThis "DecompressionStream" original)]
      (aset js/globalThis "DecompressionStream" js/undefined)
      (-> (p/let [plain (upload! {:query "&finished=true" :body frame})
                  gzipped (upload! {:query "&finished=true"
                                    :body (js/Uint8Array. (zlib/gzipSync frame))
                                    :headers {"content-encoding" "gzip"}})]
            (restore!)
            (is (= 200 (:status plain)))
            (is (= [[upload-rows true]] (:imported plain)))
            (is (= 500 (:status gzipped)))
            (is (= {:error "gzip not supported"} (:body gzipped)))
            (is (= [] (:imported gzipped))))
          (p/then (fn [_] (done)))
          (p/catch (fn [error]
                     (restore!)
                     (is false (str error))
                     (done)))))))

;; Fails if, in `import-snapshot-stream!`, `and` becomes `or`.
;; Fails if, in `parse-reset-param`, `if` becomes `if-not`, `nil?` becomes `some?` or `not` becomes `identity`.
;; Fails if, in `handle-sync-snapshot-upload`, `when` becomes `when-not`, `false` becomes `true` or `true` becomes `false`.
(deftest snapshot-upload-reset-param-test
  (async done
    (let [frame (framed-rows upload-rows)]
      (finish-async!
       done
       #(p/let [reset-false (upload! {:query "&reset=false&finished=true" :body frame})
                reset-zero (upload! {:query "&reset=0&finished=true" :body frame})
                reset-true (upload! {:query "&reset=true&finished=true" :body frame})]
          (is (= [[upload-rows false]] (:imported reset-false)))
          (is (= [true] (:ready-updates reset-false)))
          (is (= [[upload-rows false]] (:imported reset-zero)))
          (is (= [[upload-rows true]] (:imported reset-true)))
          (is (= [false true] (:ready-updates reset-true))))))))

;; Fails if, in `handle-sync-snapshot-upload`, `when` becomes `when-not`, `true` becomes `false` or `false` becomes `true`.
(deftest snapshot-upload-marks-graph-uploading-until-finished-test
  (async done
    (let [frame (framed-rows upload-rows)]
      (finish-async!
       done
       #(p/let [first-part (upload! {:query "" :body frame})
                last-part (upload! {:query "&finished=true" :body frame})]
          (testing "an unfinished reset upload"
            (is (= 200 (:status first-part)))
            (is (= ["true"] (:uploading-during first-part)))
            (is (= "true" (:uploading-after first-part)))
            (is (= [false] (:ready-updates first-part))))
          (testing "a finished reset upload"
            (is (= ["true"] (:uploading-during last-part)))
            (is (= "false" (:uploading-after last-part)))
            (is (= [false true] (:ready-updates last-part)))))))))

;; Fails if, in `sqlite-too-big-error?`, `or` becomes `and`.
(deftest snapshot-upload-returns-413-for-a-non-error-too-big-rejection-test
  (async done
    (let [self #js {:sql (test-sql/make-sql)
                    :conn (d/create-conn db-schema/schema)
                    :schema-ready true
                    :env #js {}}
          request (js/Request. "http://localhost/sync/graph-1/snapshot/upload?graph-id=graph-1&finished=true"
                               #js {:method "POST" :body (js/Uint8Array. 0)})]
      (finish-async!
       done
       #(p/with-redefs [sync-handler/import-snapshot-stream! (fn [_self _stream _reset?]
                                                               (p/rejected #js {:message "SQLITE_TOOBIG"}))
                        sync-handler/<set-graph-ready-for-use! (fn [& _] (p/resolved true))]
          (p/let [resp (sync-handler/handle {:self self :request request :url (js/URL. (.-url request))
                                             :route {:handler :sync/snapshot-upload}})
                  body (json-body resp)]
            (is (= 413 (.-status resp)))
            (is (= {:error "snapshot row too large"} body))))))))
