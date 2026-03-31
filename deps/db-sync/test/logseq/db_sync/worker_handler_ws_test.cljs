(ns logseq.db-sync.worker-handler-ws-test
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.test-sql :as test-sql]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.handler.ws :as ws-handler]
            [logseq.db-sync.worker.presence :as presence]
            [logseq.db-sync.worker.ws :as ws]
            [promesa.core :as p]))

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

(deftest hello-message-includes-checksum-test
  (let [sql (test-sql/make-sql)
        conn (storage/open-conn sql)
        ws #js {:readyState 1}
        sent (atom nil)
        self #js {:conn conn
                  :schema-ready true
                  :sql sql}
        raw (protocol/encode-message {:type "hello"
                                      :client "test"})]
    (d/transact! conn [{:block/uuid (random-uuid)
                        :block/title "hello"}])
    (with-redefs [ws/send! (fn [_target msg]
                             (reset! sent msg))]
      (ws-handler/handle-ws-message! self ws raw))
    (is (= "hello" (:type @sent)))
    (is (number? (:t @sent)))
    (is (string? (:checksum @sent)))))

(deftest hello-message-omits-nil-checksum-test
  (let [sql (test-sql/make-sql)
        conn (storage/open-conn sql)
        ws #js {:readyState 1}
        sent (atom nil)
        self #js {:conn conn
                  :schema-ready true
                  :sql sql}
        raw (protocol/encode-message {:type "hello"
                                      :client "test"})]
    (with-redefs [ws/send! (fn [_target msg]
                             (reset! sent msg))]
      (ws-handler/handle-ws-message! self ws raw))
    (is (= "hello" (:type @sent)))
    (is (false? (contains? @sent :checksum)))))

(deftest websocket-connection-is-rejected-while-snapshot-upload-is-in-progress-test
  (async done
         (let [accepted (atom [])
               presence-events (atom [])
               self #js {:state #js {:acceptWebSocket (fn [socket]
                                                        (swap! accepted conj socket))}}
               request (js/Request. "http://localhost/sync/graph-1/ws?graph-id=graph-1"
                                    #js {:method "GET"})]
           (-> (p/with-redefs [sync-handler/<ready-for-sync? (fn [_ _] (p/resolved false))
                               presence/add-presence! (fn [& _]
                                                        (swap! presence-events conj :add))
                               presence/broadcast-online-users! (fn [& _]
                                                                  (swap! presence-events conj :broadcast))]
                 (ws-handler/handle-ws self request))
               (p/then (fn [response]
                         (is (= 409 (.-status response)))
                         (is (empty? @accepted))
                         (is (empty? @presence-events))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
