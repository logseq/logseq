(ns logseq.db-sync.worker-handler-ws-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db-sync.protocol :as protocol]
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
