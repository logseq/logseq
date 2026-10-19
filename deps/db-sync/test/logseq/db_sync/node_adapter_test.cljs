(ns logseq.db-sync.node-adapter-test
  ;; Linters disabled because commented out FIXME code causes false positives
  {:clj-kondo/config {:ignore true}}
  (:require ["fs" :as fs]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [logseq.db-sync.node.server :as node-server]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.worker.auth :as auth]
            [promesa.core :as p]))

(def test-token "test-token")

(defn- auth-headers []
  #js {"authorization" (str "Bearer " test-token)
       "content-type" "application/json"})

(defn- post-json [url body]
  (js/fetch url #js {:method "POST"
                     :headers (auth-headers)
                     :body (js/JSON.stringify (clj->js body))}))

(defn- get-json [url]
  (js/fetch url #js {:method "GET" :headers (auth-headers)}))

(defn- parse-json [resp]
  (.json resp))

(defn- start-test-server []
  (let [suffix (str (random-uuid))
        dir (str "tmp/db-sync-node-test/" suffix)]
    (p/let [server (node-server/start! {:port 0
                                        :data-dir dir})]
      (assoc server :data-dir dir))))

(defn- open-websocket [url]
  (let [ws-module (js/require "ws")
        WebSocket (or (.-WebSocket ws-module) ws-module)
        client (new WebSocket url #js {:headers (auth-headers)})]
    (js/Promise.
     (fn [resolve reject]
       (.once client "open" (fn [] (resolve client)))
       (.once client "error" reject)))))

(defn- next-message [^js client expected-type]
  (js/Promise.
   (fn [resolve reject]
     (let [handler* (atom nil)
           timeout (js/setTimeout
                    (fn [] (reject (js/Error. (str "timed out waiting for " expected-type))))
                    2000)]
       (reset! handler*
               (fn [data]
                 (let [text (if (string? data) data (.toString data))
                       message (js/JSON.parse text)]
                   (when (= expected-type (aget message "type"))
                     (js/clearTimeout timeout)
                     (.off client "message" @handler*)
                     (resolve message)))))
       (.on client "message" @handler*)))))

(defn- send-and-wait [^js client message expected-type]
  (let [response (next-message client expected-type)]
    (.send client (protocol/encode-message message))
    response))

(deftest node-adapter-websocket-journal-replay-test
  (async done
         (let [server* (atom nil)
               client* (atom nil)
               claims #js {"sub" "node-websocket-user"}]
           (-> (p/with-redefs
                [auth/auth-claims (fn [_request _env] (p/resolved claims))]
                 (p/let [server (start-test-server)
                         _ (reset! server* server)
                         base-url (:base-url server)
                         create-resp (post-json
                                      (str base-url "/graphs")
                                      {:graph-name "WebSocket Journal Replay"
                                       :graph-e2ee? false})
                         create-body (parse-json create-resp)
                         graph-id (aget create-body "graph-id")
                         events-resp (get-json (str base-url "/sync/" graph-id "/events?since=0"))
                         client (open-websocket
                                 (str (string/replace base-url "http" "ws")
                                      "/sync/" graph-id))
                         _ (reset! client* client)
                         initial-message (send-and-wait
                                          client {:type "pull" :since 0}
                                          "pull/ok")
                         page-id (random-uuid)
                         block-id (random-uuid)
                         tx-results (p/all
                                     [(next-message client "changed")
                                      (post-json
                                       (str base-url "/sync/" graph-id "/tx/batch")
                                       {:t-before 0
                                        :txs [{:tx (protocol/tx->transit
                                                    [{:db/id -1
                                                      :block/uuid page-id
                                                      :block/name "websocket-page"
                                                      :block/title "WebSocket Page"}
                                                     {:db/id -2
                                                      :block/uuid block-id
                                                      :block/title "WebSocket Journal"
                                                      :block/order "a0"
                                                      :block/parent [:block/uuid page-id]
                                                      :block/page [:block/uuid page-id]}])
                                               :outliner-op :insert-blocks}]})])
                         changed-message (nth tx-results 0)
                         tx-response (nth tx-results 1)
                         tx-body (parse-json tx-response)
                         replay-message (send-and-wait
                                         client {:type "pull" :since 0}
                                         "pull/ok")]
                   (testing "the removed event-stream route is unavailable"
                     (is (= 404 (.-status events-resp))))
                   (testing "the existing WebSocket replays the canonical journal"
                     (is (= 0 (aget initial-message "t")))
                     (is (empty? (array-seq (aget initial-message "txs"))))
                     (is (.-ok tx-response))
                     (is (= "tx/batch/ok" (aget tx-body "type")))
                     (is (pos? (aget changed-message "t")))
                     (let [txs (array-seq (aget replay-message "txs"))
                           tx-data (mapcat #(protocol/transit->tx (aget % "tx")) txs)]
                       (is (= (aget changed-message "t") (aget replay-message "t")))
                       (is (= 1 (count txs)))
                       (is (some #(= [:db/add (str block-id) :block/title "WebSocket Journal"]
                                     (vec (take 4 %)))
                                 tx-data))))))
               (p/finally
                 (fn []
                   (when-let [client @client*]
                     (.close client))
                   (if-let [server @server*]
                     (p/let [_ ((:stop! server))]
                       (.rmSync fs (:data-dir server) #js {:recursive true :force true}))
                     (p/resolved nil))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest node-adapter-semantic-capture-is-routed-test
  (async done
         (let [server* (atom nil)
               claims #js {"sub" "node-semantic-user"
                           "scope" "logseq/read logseq/write"}]
           (-> (p/with-redefs
                [auth/auth-claims (fn [_request _env] (p/resolved claims))
                 auth/semantic-auth-claims (fn [_request _env] (p/resolved claims))]
                 (p/let [server (start-test-server)
                         _ (reset! server* server)
                         base-url (:base-url server)
                         create-resp (post-json
                                      (str base-url "/graphs")
                                      {:graph-name "Semantic Capture"
                                       :graph-e2ee? false
                                       :graph-ready-for-use? false})
                         create-body (parse-json create-resp)
                         graph-id (aget create-body "graph-id")
                         missing-resp (post-json
                                       (str base-url "/api/v1/graphs/missing-graph/capture")
                                       {:blocks [{:title "Access denied"}]})
                         capture-resp (post-json
                                       (str base-url "/api/v1/graphs/" graph-id "/capture")
                                       {:blocks [{:title "Captured from Chat"}]})]
                   (testing "unknown graphs preserve dev graph-access authorization"
                     (is (= 403 (.-status missing-resp))))
                   (testing "Chat semantic capture is routed instead of 404"
                     (is (not= 404 (.-status capture-resp)))
                     (is (not= 405 (.-status capture-resp))))))
               (p/finally
                 (fn []
                   (if-let [server @server*]
                     (p/let [_ ((:stop! server))]
                       (.rmSync fs (:data-dir server) #js {:recursive true :force true}))
                     (p/resolved nil))))
               (p/then (fn [] (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
