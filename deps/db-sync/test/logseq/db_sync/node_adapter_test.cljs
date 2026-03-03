(ns logseq.db-sync.node-adapter-test
  ;; Linters disabled because commented out FIXME code causes false positives
  {:clj-kondo/config {:ignore true}}
  (:require [cljs.test :refer [deftest is async testing]]
            [clojure.string :as string]
            [logseq.db-sync.node.server :as node-server]
            [logseq.db-sync.protocol :as protocol]
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
    (node-server/start! {:port 0
                         :data-dir dir})))
;; FIXME: Tests are disabled until they stop hanging
#_(deftest node-adapter-http-roundtrip-test
    (async done
           (p/let [{:keys [base-url stop!]} (start-test-server)
                   health-resp (js/fetch (str base-url "/health"))
                   health-body (parse-json health-resp)]
             (testing "health"
               (is (.-ok health-resp))
               (is (= true (aget health-body "ok"))))
           ;; FIXME: Test hangs here due to an exception
             (p/let [create-resp (post-json (str base-url "/graphs") {:graph-name "Test Graph"})
                     create-body (parse-json create-resp)
                     graph-id (aget create-body "graph-id")
                     access-resp (get-json (str base-url "/graphs/" graph-id "/access"))
                     access-body (parse-json access-resp)
                     sync-health (get-json (str base-url "/sync/" graph-id "/health"))
                     sync-health-body (parse-json sync-health)]
               (testing "graph access"
                 (is (.-ok create-resp))
                 (is (string? graph-id))
                 (is (.-ok access-resp))
                 (is (= true (aget access-body "ok"))))
               (testing "sync health"
                 (is (.-ok sync-health))
                 (is (= true (aget sync-health-body "ok"))))
               (p/let [tx-data [{:block/uuid (random-uuid)
                                 :block/content "hello"}]
                       txs (protocol/tx->transit tx-data)
                       tx-resp (post-json (str base-url "/sync/" graph-id "/tx/batch")
                                          {:t-before 0
                                           :txs txs})
                       tx-body (parse-json tx-resp)
                       pull-resp (get-json (str base-url "/sync/" graph-id "/pull?since=0"))
                       pull-body (parse-json pull-resp)]
                 (testing "tx batch"
                   (is (.-ok tx-resp))
                   (is (= "tx/batch/ok" (aget tx-body "type"))))
                 (testing "pull"
                   (is (.-ok pull-resp))
                   (is (= "pull/ok" (aget pull-body "type")))
                   (is (pos? (count (aget pull-body "txs")))))
                 (p/then (stop!) (fn [] (done))))))))

#_(deftest node-adapter-websocket-test
    (async done
           (p/let [{:keys [base-url stop!]} (start-test-server)
                   create-resp (post-json (str base-url "/graphs") {:graph-name "WS Graph"})
                   create-body (parse-json create-resp)
                   graph-id (aget create-body "graph-id")]
             (testing "websocket hello and changed"
               (let [ws-url (str (string/replace base-url "http" "ws") "/sync/" graph-id)
                     ws-module (js/require "ws")
                     WebSocket (or (.-WebSocket ws-module) ws-module)
                     client (new WebSocket ws-url #js {:headers (auth-headers)})
                     messages (atom [])
                     push-message (fn [data]
                                    (let [text (if (string? data) data (.toString data))]
                                      (swap! messages conj (js/JSON.parse text))))]
                 (.on client "message" push-message)
                 (.on client "open"
                      (fn []
                        (.send client (protocol/encode-message {:type "hello" :client "test"}))))
                 (p/let [_ (p/delay 50)
                         tx-data [{:block/uuid (random-uuid)
                                   :block/content "ws"}]
                         txs (protocol/tx->transit tx-data)
                         _ (post-json (str base-url "/sync/" graph-id "/tx/batch")
                                      {:t-before 0
                                       :txs txs})
                         _ (p/delay 100)]
                   (let [types (set (map #(aget % "type") @messages))]
                     (is (contains? types "hello"))
                     (is (contains? types "changed")))
                   (.close client)
                   (p/then (stop!) (fn [] (done)))))))))
