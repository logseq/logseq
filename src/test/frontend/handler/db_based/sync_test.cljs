(ns frontend.handler.db-based.sync-test
  (:require [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [logseq.db-sync.snapshot :as snapshot]
            [promesa.core :as p]))

(defn- encode-datoms-jsonl [datoms]
  (snapshot/encode-datoms-jsonl datoms))

(defn- <gzip-bytes [^js payload]
  (if (exists? js/CompressionStream)
    (p/let [stream (js/ReadableStream.
                    #js {:start (fn [controller]
                                  (.enqueue controller payload)
                                  (.close controller))})
            compressed (.pipeThrough stream (js/CompressionStream. "gzip"))
            resp (js/Response. compressed)
            buf (.arrayBuffer resp)]
      (js/Uint8Array. buf))
    (p/resolved payload)))

(defn- bytes->stream
  [^js payload chunk-size]
  (js/ReadableStream.
   #js {:start (fn [controller]
                 (loop [offset 0]
                   (when (< offset (.-byteLength payload))
                     (.enqueue controller (.slice payload offset (min (+ offset chunk-size)
                                                                      (.-byteLength payload))))
                     (recur (+ offset chunk-size))))
                 (.close controller))}))

(deftest remove-member-request-test
  (async done
         (let [called (atom nil)]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (reset! called {:url url :opts opts})
                                                    (p/resolved {:ok true}))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))]
                 (p/let [_ (db-sync/<rtc-remove-member! "graph-1" "user-2")
                         {:keys [url opts]} @called]
                   (is (= "http://base/graphs/graph-1/members/user-2" url))
                   (is (= "DELETE" (:method opts)))
                   (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest leave-graph-uses-current-user-test
  (async done
         (let [called (atom nil)]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (reset! called {:url url :opts opts})
                                                    (p/resolved {:ok true}))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               user-handler/user-uuid (fn [] "user-1")]
                 (p/let [_ (db-sync/<rtc-leave-graph! "graph-1")
                         {:keys [url opts]} @called]
                   (is (= "http://base/graphs/graph-1/members/user-1" url))
                   (is (= "DELETE" (:method opts)))
                   (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest leave-graph-missing-user-test
  (async done
         (-> (p/with-redefs [user-handler/user-uuid (fn [] nil)]
               (db-sync/<rtc-leave-graph! "graph-1"))
             (p/then (fn [_]
                       (is false "expected rejection")
                       (done)))
             (p/catch (fn [e]
                        (is (= :db-sync/invalid-member (:type (ex-data e))))
                        (done))))))

(deftest rtc-create-graph-persists-disabled-e2ee-flag-test
  (async done
         (let [fetch-called (atom nil)
               tx-called (atom nil)]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               db/get-db (fn [] :db)
                               ldb/get-graph-schema-version (fn [_] {:major 65})
                               db-sync/fetch-json (fn [url opts _]
                                                    (reset! fetch-called {:url url :opts opts})
                                                    (p/resolved {:graph-id "graph-1"
                                                                 :graph-e2ee? false}))
                               ldb/transact! (fn [repo tx-data]
                                               (reset! tx-called {:repo repo :tx-data tx-data})
                                               nil)]
                 (db-sync/<rtc-create-graph! "logseq_db_demo" false))
               (p/then (fn [graph-id]
                         (let [request-body (-> @fetch-called
                                                (get-in [:opts :body])
                                                js/JSON.parse
                                                (js->clj :keywordize-keys true))
                               tx-data (:tx-data @tx-called)]
                           (is (= "graph-1" graph-id))
                           (is (= "http://base/graphs" (:url @fetch-called)))
                           (is (= false (:graph-e2ee? request-body)))
                           (is (= :logseq.kv/graph-rtc-e2ee?
                                  (get-in tx-data [2 :db/ident])))
                           (is (= false
                                  (get-in tx-data [2 :kv/value]))))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest rtc-create-graph-defaults-e2ee-enabled-test
  (async done
         (let [fetch-called (atom nil)
               tx-called (atom nil)]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               db/get-db (fn [] :db)
                               ldb/get-graph-schema-version (fn [_] {:major 65})
                               db-sync/fetch-json (fn [url opts _]
                                                    (reset! fetch-called {:url url :opts opts})
                                                    (p/resolved {:graph-id "graph-2"}))
                               ldb/transact! (fn [repo tx-data]
                                               (reset! tx-called {:repo repo :tx-data tx-data})
                                               nil)]
                 (db-sync/<rtc-create-graph! "logseq_db_demo"))
               (p/then (fn [graph-id]
                         (let [request-body (-> @fetch-called
                                                (get-in [:opts :body])
                                                js/JSON.parse
                                                (js->clj :keywordize-keys true))
                               tx-data (:tx-data @tx-called)]
                           (is (= "graph-2" graph-id))
                           (is (= "http://base/graphs" (:url @fetch-called)))
                           (is (= true (:graph-e2ee? request-body)))
                           (is (= true (:graph-ready-for-use? request-body)))
                           (is (= :logseq.kv/graph-rtc-e2ee?
                                  (get-in tx-data [2 :db/ident])))
                           (is (= true
                                  (get-in tx-data [2 :kv/value]))))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest rtc-upload-graph-creates-remote-graph-as-not-ready-test
  (async done
         (let [fetch-called (atom nil)
               tx-called (atom nil)
               upload-calls (atom [])
               refresh-calls (atom 0)
               start-calls (atom [])]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               db/get-db (fn [] :db)
                               ldb/get-graph-schema-version (fn [_] {:major 65})
                               db-sync/fetch-json (fn [url opts _]
                                                    (reset! fetch-called {:url url :opts opts})
                                                    (p/resolved {:graph-id "graph-3"
                                                                 :graph-e2ee? false}))
                               ldb/transact! (fn [repo tx-data]
                                               (reset! tx-called {:repo repo :tx-data tx-data})
                                               nil)
                               state/<invoke-db-worker (fn [& args]
                                                         (swap! upload-calls conj args)
                                                         (p/resolved :ok))
                               db-sync/<get-remote-graphs (fn []
                                                            (swap! refresh-calls inc)
                                                            (p/resolved []))
                               db-sync/<rtc-start! (fn [repo & _]
                                                     (swap! start-calls conj repo)
                                                     (p/resolved :ok))]
                 (db-sync/<rtc-upload-graph! "logseq_db_demo" false))
               (p/then (fn [_]
                         (let [request-body (-> @fetch-called
                                                (get-in [:opts :body])
                                                js/JSON.parse
                                                (js->clj :keywordize-keys true))]
                           (is (= false (:graph-ready-for-use? request-body)))
                           (is (= [[:thread-api/db-sync-upload-graph "logseq_db_demo"]]
                                  @upload-calls))
                           (is (= 1 @refresh-calls))
                           (is (= ["logseq_db_demo"] @start-calls))
                           (is (= :logseq.kv/graph-rtc-e2ee?
                                  (get-in (:tx-data @tx-called) [2 :db/ident]))))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest rtc-create-graph-and-start-sync-does-not-upload-snapshot-test
  (async done
         (let [create-calls (atom [])
               refresh-calls (atom 0)
               start-calls (atom [])
               upload-calls (atom [])]
           (-> (p/with-redefs [db-sync/<rtc-create-graph! (fn [repo graph-e2ee? & [graph-ready-for-use?]]
                                                            (swap! create-calls conj [repo graph-e2ee? graph-ready-for-use?])
                                                            (p/resolved "graph-4"))
                               db-sync/<get-remote-graphs (fn []
                                                            (swap! refresh-calls inc)
                                                            (p/resolved []))
                               db-sync/<rtc-start! (fn [repo & _]
                                                     (swap! start-calls conj repo)
                                                     (p/resolved :ok))
                               state/<invoke-db-worker (fn [& args]
                                                         (swap! upload-calls conj args)
                                                         (p/resolved :ok))]
                 (db-sync/<rtc-create-graph-and-start-sync! "logseq_db_demo" true))
               (p/then (fn [_]
                         (is (= [["logseq_db_demo" true true]] @create-calls))
                         (is (= 1 @refresh-calls))
                         (is (= ["logseq_db_demo"] @start-calls))
                         (is (empty? @upload-calls))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest rtc-start-skips-while-graph-upload-is-active-test
  (async done
         (let [worker-prev @state/*db-worker
               state-prev @state/state
               calls (atom [])]
           (reset! state/*db-worker :worker)
           (swap! state/state assoc
                  :rtc/uploading? true
                  :rtc/loading-graphs? false)
           (-> (p/with-redefs [state/get-rtc-graphs (fn [] [{:url "demo-graph"}])
                               state/<invoke-db-worker (fn [& args]
                                                         (swap! calls conj args)
                                                         (p/resolved :ok))]
                 (db-sync/<rtc-start! "demo-graph"))
               (p/then (fn [_]
                         (is (not-any? #(= :thread-api/db-sync-start (first %)) @calls))
                         (is (some #(= :thread-api/db-sync-stop (first %)) @calls))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))
               (p/finally (fn []
                            (reset! state/*db-worker worker-prev)
                            (reset! state/state state-prev)))))))

(deftest rtc-start-skips-when-remote-graph-is-not-ready-for-use-test
  (async done
         (let [worker-prev @state/*db-worker
               state-prev @state/state
               calls (atom [])]
           (reset! state/*db-worker :worker)
           (swap! state/state assoc
                  :rtc/uploading? false
                  :rtc/loading-graphs? false)
           (-> (p/with-redefs [state/get-rtc-graphs (fn [] [{:url "demo-graph"
                                                             :graph-ready-for-use? false}])
                               state/<invoke-db-worker (fn [& args]
                                                         (swap! calls conj args)
                                                         (p/resolved :ok))]
                 (db-sync/<rtc-start! "demo-graph"))
               (p/then (fn [_]
                         (is (not-any? #(= :thread-api/db-sync-start (first %)) @calls))
                         (is (some #(= :thread-api/db-sync-stop (first %)) @calls))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))
               (p/finally (fn []
                            (reset! state/*db-worker worker-prev)
                            (reset! state/state state-prev)))))))

(deftest rtc-download-graph-emits-feedback-before-snapshot-fetch-test
  (let [trace (atom [])
        log-events (atom [])]
    (with-redefs [db-sync/http-base (fn [] "http://base")
                  state/set-state! (fn [k v]
                                     (swap! trace conj [:set k v]))
                  state/pub-event! (fn [[event payload :as e]]
                                     (when (and (= :rtc/log event)
                                                (= "graph-1" (:graph-uuid payload)))
                                       (swap! trace conj :log)
                                       (swap! log-events conj e)))
                  ;; Keep auth pending so we only validate immediate click-time feedback.
                  user-handler/task--ensure-id&access-token (fn [_resolve _reject] nil)
                  db-sync/fetch-json (fn [url _opts _schema]
                                       (swap! trace conj [:fetch url])
                                       (p/resolved {:t 1}))]
      (db-sync/<rtc-download-graph! "demo-graph" "graph-1")
      (is (= [[:set :rtc/downloading-graph-uuid "graph-1"] :log]
             (take 2 @trace)))
      (let [[event {:keys [type sub-type graph-uuid message]}] (first @log-events)]
        (is (= :rtc/log event))
        (is (= :rtc.log/download type))
        (is (= :download-progress sub-type))
        (is (= "graph-1" graph-uuid))
        (is (and (string? message)
                 (string/includes? message "Preparing")))))))

(deftest get-remote-graphs-includes-ready-for-use-flag-test
  (async done
         (let [graphs-state (atom nil)]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               db-sync/fetch-json (fn [_url _opts _schema]
                                                    (p/resolved {:graphs [{:graph-id "graph-1"
                                                                           :graph-name "demo"
                                                                           :schema-version "65"
                                                                           :graph-e2ee? true
                                                                           :graph-ready-for-use? false
                                                                           :created-at 1
                                                                           :updated-at 2}]}))
                               state/set-state! (fn [k v]
                                                  (when (= k :rtc/graphs)
                                                    (reset! graphs-state v))
                                                  nil)
                               repo-handler/refresh-repos! (fn [] nil)]
                 (db-sync/<get-remote-graphs))
               (p/then (fn [graphs]
                         (is (= false (:graph-ready-for-use? (first graphs))))
                         (is (= false (:graph-ready-for-use? (first @graphs-state))))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest rtc-download-graph-imports-snapshot-once-test
  (async done
         (let [import-calls (atom [])
               fetch-calls (atom [])
               datoms [{:e 1 :a :db/ident :v :logseq.class/Page :tx 1 :added true}
                       {:e 2 :a :block/title :v "hello" :tx 1 :added true}]
               jsonl-bytes (encode-datoms-jsonl datoms)
               original-fetch js/fetch
               download-url "http://base/sync/graph-1/snapshot/download"
               asset-url "http://base/assets/graph-1/snapshot-1.snapshot"]
           (-> (p/let [gzip-bytes (<gzip-bytes jsonl-bytes)]
                 (set! js/fetch
                       (fn [url opts]
                         (let [method (or (aget opts "method") "GET")]
                           (swap! fetch-calls conj [url method])
                           (cond
                             (and (= url asset-url) (= method "GET"))
                             (js/Promise.resolve
                              #js {:ok true
                                   :status 200
                                   :headers #js {:get (fn [header]
                                                        (when (= header "content-length")
                                                          (str (.-byteLength gzip-bytes))))}
                                   :arrayBuffer (fn [] (js/Promise.resolve (.-buffer gzip-bytes)))})

                             :else
                             (js/Promise.resolve
                              #js {:ok true
                                   :status 200})))))
                 (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                                     db-sync/fetch-json (fn [url _opts _schema]
                                                          (cond
                                                            (string/ends-with? url "/pull")
                                                            (p/resolved {:t 42})

                                                            (= url download-url)
                                                            (p/resolved {:ok true
                                                                         :url asset-url
                                                                         :key "graph-1/snapshot-1.snapshot"
                                                                         :content-encoding "gzip"})

                                                            :else
                                                            (p/rejected (ex-info "unexpected fetch-json URL"
                                                                                 {:url url}))))
                                     user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                                 (resolve true))
                                     state/<invoke-db-worker (fn [& args]
                                                               (swap! import-calls conj args)
                                                               (if (= :thread-api/db-sync-import-prepare (first args))
                                                                 (p/resolved {:import-id "import-1"})
                                                                 (p/resolved :ok)))
                                     state/set-state! (fn [& _] nil)
                                     state/pub-event! (fn [& _] nil)]
                       (db-sync/<rtc-download-graph! "demo-graph" "graph-1" false))
                     (p/finally (fn [] (set! js/fetch original-fetch)))))
               (p/then (fn [_]
                         (is (= 3 (count @import-calls)))
                         (let [[prepare-op graph reset? graph-uuid graph-e2ee?] (first @import-calls)
                               [chunk-op imported-datoms chunk-graph-uuid import-id] (second @import-calls)
                               [finalize-op finalize-graph finalize-graph-uuid remote-tx finalize-import-id] (nth @import-calls 2)]
                           (is (= :thread-api/db-sync-import-prepare prepare-op))
                           (is (string/ends-with? graph "demo-graph"))
                           (is (= true reset?))
                           (is (= "graph-1" graph-uuid))
                           (is (= false graph-e2ee?))
                           (is (= :thread-api/db-sync-import-datoms-chunk chunk-op))
                           (is (= datoms imported-datoms))
                           (is (= "graph-1" chunk-graph-uuid))
                           (is (= "import-1" import-id))
                           (is (= :thread-api/db-sync-import-finalize finalize-op))
                           (is (string/ends-with? finalize-graph "demo-graph"))
                           (is (= "graph-1" finalize-graph-uuid))
                           (is (= 42 remote-tx))
                           (is (= "import-1" finalize-import-id)))
                         (is (= [[asset-url "GET"]]
                                @fetch-calls))
                         (done)))
               (p/catch (fn [error]
                          (set! js/fetch original-fetch)
                          (is false (str error))
                          (done)))))))

;; Simulates real-world fetch() behaviour: the body is already decompressed
;; (plain NDJSON) but the `content-encoding: gzip` header is still present.
;; The old `response-body-stream` trusted that header and piped through
;; DecompressionStream again, causing Z_DATA_ERROR: incorrect header check.
(deftest rtc-download-graph-streams-gzip-snapshot-test
  (async done
         (let [import-calls (atom [])
               datoms [{:e 1 :a :db/ident :v :logseq.class/Page :tx 1 :added true}
                       {:e 2 :a :block/title :v "hello" :tx 1 :added true}]
               jsonl-bytes (encode-datoms-jsonl datoms)
               original-fetch js/fetch
               download-url "http://base/sync/graph-1/snapshot/download"
               asset-url "http://base/assets/graph-1/snapshot-1.snapshot"
               worker-prev @state/*db-worker]
           (reset! state/*db-worker nil)
           (-> (p/let [stream (bytes->stream jsonl-bytes 3)]
                 (set! js/fetch
                       (fn [url opts]
                         (let [method (or (aget opts "method") "GET")]
                           (cond
                             (and (= url asset-url) (= method "GET"))
                             ;; Body is plain NDJSON but header still says gzip —
                             ;; exactly what browsers/Node do after auto-decompression.
                             (js/Promise.resolve
                              #js {:ok true
                                   :status 200
                                   :headers #js {:get (fn [header]
                                                        (case header
                                                          "content-length" (str (.-byteLength jsonl-bytes))
                                                          "content-encoding" "gzip"
                                                          nil))}
                                   :body stream
                                   :arrayBuffer (fn [] (throw (js/Error. "arrayBuffer should not be used")))})
                             :else
                             (js/Promise.resolve #js {:ok false :status 404})))))
                 (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                                     db-sync/fetch-json (fn [url _opts _schema]
                                                          (cond
                                                            (string/ends-with? url "/pull")
                                                            (p/resolved {:t 42})

                                                            (= url download-url)
                                                            (p/resolved {:ok true
                                                                         :url asset-url
                                                                         :key "graph-1/snapshot-1.snapshot"
                                                                         :content-encoding "gzip"})

                                                            :else
                                                            (p/rejected (ex-info "unexpected fetch-json URL"
                                                                                 {:url url}))))
                                     user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                                 (resolve true))
                                     state/<invoke-db-worker (fn [& args]
                                                               (swap! import-calls conj args)
                                                               (if (= :thread-api/db-sync-import-prepare (first args))
                                                                 (p/resolved {:import-id "import-1"})
                                                                 (p/resolved :ok)))
                                     state/set-state! (fn [& _] nil)
                                     state/pub-event! (fn [& _] nil)]
                       (db-sync/<rtc-download-graph! "demo-graph" "graph-1" false))
                     (p/finally (fn [] (set! js/fetch original-fetch)))))
               (p/then (fn [_]
                         (is (= 3 (count @import-calls)))
                         (let [[chunk-op imported-datoms _ import-id] (second @import-calls)]
                           (is (= :thread-api/db-sync-import-datoms-chunk chunk-op))
                           (is (= datoms imported-datoms))
                           (is (= "import-1" import-id)))
                         (done)))
               (p/catch (fn [error]
                          (reset! state/*db-worker worker-prev)
                          (set! js/fetch original-fetch)
                          (is false (str error))
                          (done)))
               (p/finally (fn []
                            (reset! state/*db-worker worker-prev)))))))
