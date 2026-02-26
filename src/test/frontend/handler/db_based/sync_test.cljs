(ns frontend.handler.db-based.sync-test
  (:require [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [logseq.db.sqlite.util :as sqlite-util]
            [promesa.core :as p]))

(def ^:private test-text-encoder (js/TextEncoder.))

(defn- frame-bytes [^js data]
  (let [len (.-byteLength data)
        out (js/Uint8Array. (+ 4 len))
        view (js/DataView. (.-buffer out))]
    (.setUint32 view 0 len false)
    (.set out data 4)
    out))

(defn- encode-framed-rows [rows]
  (let [payload (.encode test-text-encoder (sqlite-util/write-transit-str rows))]
    (frame-bytes payload)))

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

(deftest rtc-start-skips-when-graph-missing-from-remote-list-test
  (async done
         (let [called (atom [])]
           (-> (p/with-redefs [state/get-rtc-graphs (fn [] [{:url "repo-other"}])
                               state/<invoke-db-worker (fn [& args]
                                                         (swap! called conj args)
                                                         (p/resolved :ok))]
                 (db-sync/<rtc-start! "repo-current"))
               (p/then (fn [_]
                         (is (= [[:thread-api/db-sync-stop]] @called))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest rtc-start-invokes-worker-when-graph-in-remote-list-test
  (async done
         (let [called (atom nil)]
           (-> (p/with-redefs [state/get-rtc-graphs (fn [] [{:url "repo-current"}])
                               state/<invoke-db-worker (fn [& args]
                                                         (reset! called args)
                                                         (p/resolved :ok))]
                 (db-sync/<rtc-start! "repo-current"))
               (p/then (fn [_]
                         (is (= [:thread-api/db-sync-start "repo-current"] @called))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

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
                           (is (= :logseq.kv/graph-rtc-e2ee?
                                  (get-in tx-data [2 :db/ident])))
                           (is (= true
                                  (get-in tx-data [2 :kv/value]))))
                         (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

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

(deftest rtc-download-graph-imports-snapshot-once-test
  (async done
         (let [import-calls (atom [])
               fetch-calls (atom [])
               rows [[1 "content-1" "addresses-1"]
                     [2 "content-2" "addresses-2"]]
               framed-bytes (encode-framed-rows rows)
               original-fetch js/fetch
               stream-url "http://base/sync/graph-1/snapshot/stream"]
           (-> (p/let [gzip-bytes (<gzip-bytes framed-bytes)]
                 (set! js/fetch
                       (fn [url opts]
                         (let [method (or (aget opts "method") "GET")]
                           (swap! fetch-calls conj [url method])
                           (cond
                             (and (= url stream-url) (= method "GET"))
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

                                                            :else
                                                            (p/rejected (ex-info "unexpected fetch-json URL"
                                                                                 {:url url}))))
                                     user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                                 (resolve true))
                                     state/<invoke-db-worker (fn [& args]
                                                               (swap! import-calls conj args)
                                                               (p/resolved :ok))
                                     state/set-state! (fn [& _] nil)
                                     state/pub-event! (fn [& _] nil)]
                       (db-sync/<rtc-download-graph! "demo-graph" "graph-1" false))
                     (p/finally (fn [] (set! js/fetch original-fetch)))))
               (p/then (fn [_]
                         (is (= 1 (count @import-calls)))
                         (let [[op graph imported-rows reset? graph-uuid remote-tx graph-e2ee?] (first @import-calls)]
                           (is (= :thread-api/db-sync-import-kvs-rows op))
                           (is (string/ends-with? graph "demo-graph"))
                           (is (= rows imported-rows))
                           (is (= true reset?))
                           (is (= "graph-1" graph-uuid))
                           (is (= 42 remote-tx))
                           (is (= false graph-e2ee?)))
                         (is (= [[stream-url "GET"]]
                                @fetch-calls))
                         (done)))
               (p/catch (fn [error]
                          (set! js/fetch original-fetch)
                          (is false (str error))
                          (done)))))))
