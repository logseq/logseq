(ns frontend.worker.sync.presence-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.handle-message :as sync-handle-message]))

(deftest presence-message-with-no-editing-block-clears-the-users-editing-block-test
  (testing "when another user stops editing (their presence message has a null editing-block-uuid, as the server broadcasts it), this client stops showing them on the old block"
    (let [client {:repo "r"
                  :online-users (atom [{:user/uuid "u1" :user/name "Alice"}
                                       {:user/uuid "u2" :user/name "Bob"}])
                  :ws-state (atom :open)}
          message (fn [editing-block-uuid]
                    (js/JSON.stringify (clj->js {:type "presence"
                                                 :user-id "u2"
                                                 :editing-block-uuid editing-block-uuid})))
          bob (fn [] (second @(:online-users client)))]
      (with-redefs [worker-state/get-id-token (fn [] "token")
                    worker-util/parse-jwt (fn [_] {:sub "u1"})
                    client-op/get-local-tx (fn [_repo] 0)
                    shared-service/broadcast-to-clients! (fn [& _] nil)]
        (sync-handle-message/handle-message! "r" client (message "block-2"))
        (is (= "block-2" (:user/editing-block-uuid (bob))))
        (sync-handle-message/handle-message! "r" client (message nil))
        (is (nil? (:user/editing-block-uuid (bob))) "Bob no longer edits block-2")
        (is (= "Alice" (:user/name (first @(:online-users client)))) "other users are unchanged")))))
