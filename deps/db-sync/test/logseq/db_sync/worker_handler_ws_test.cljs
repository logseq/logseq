(ns logseq.db-sync.worker-handler-ws-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.handler.ws :as ws-handler]
            [logseq.db-sync.worker.presence :as presence]
            [logseq.db-sync.worker.ws :as ws]))

(deftest presence-message-broadcast-excludes-source-client-test
  (let [source-ws #js {:readyState 1}
        peer-ws #js {:readyState 1}
        send-events (atom [])
        self #js {:state #js {:getWebSockets (fn [] #js [source-ws peer-ws])}}
        raw (protocol/encode-message {:type "presence"
                                      :editing-block-uuid "block-1"})]
    (with-redefs [presence/get-user (fn [_self _ws] {:user-id "user-1"})
                  presence/update-presence! (fn [_self _ws _patch] nil)
                  ws/send! (fn [target msg]
                             (swap! send-events conj {:ws target
                                                      :msg msg}))]
      (ws-handler/handle-ws-message! self source-ws raw))

    (is (= [peer-ws]
           (mapv :ws @send-events)))
    (is (= [{:type "presence"
             :editing-block-uuid "block-1"
             :user-id "user-1"}]
           (mapv :msg @send-events)))))

(deftest hello-message-sends-only-pull-ok-when-client-behind-test
  (let [source-ws #js {:readyState 1}
        send-events (atom [])
        self #js {:state #js {}}
        raw (protocol/encode-message {:type "hello"
                                      :client "test"
                                      :since 2})]
    (with-redefs [sync-handler/t-now (fn [_self] 5)
                  sync-handler/pull-response (fn [_self since]
                                               {:type "pull/ok"
                                                :t 5
                                                :txs [{:t 5 :tx (str "since-" since)}]})
                  ws/send! (fn [_target msg]
                             (swap! send-events conj msg))]
      (ws-handler/handle-ws-message! self source-ws raw))

    (is (= [{:type "pull/ok" :t 5 :txs [{:t 5 :tx "since-2"}]}]
           @send-events))))

(deftest hello-message-skips-pull-ok-when-client-is-up-to-date-test
  (let [source-ws #js {:readyState 1}
        send-events (atom [])
        pull-calls (atom 0)
        self #js {:state #js {}}
        raw (protocol/encode-message {:type "hello"
                                      :client "test"
                                      :since 5})]
    (with-redefs [sync-handler/t-now (fn [_self] 5)
                  sync-handler/pull-response (fn [_self _since]
                                               (swap! pull-calls inc)
                                               {:type "pull/ok" :t 5 :txs []})
                  ws/send! (fn [_target msg]
                             (swap! send-events conj msg))]
      (ws-handler/handle-ws-message! self source-ws raw))

    (is (= 0 @pull-calls))
    (is (= [{:type "hello" :t 5}]
           @send-events))))
