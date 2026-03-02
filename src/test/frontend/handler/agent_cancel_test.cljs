(ns frontend.handler.agent-cancel-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db :as db]
            [frontend.handler.agent-cancel :as agent-cancel]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest maybe-cancel-session-on-status-change-test
  (async done
         (let [fetch-calls (atom [])
               block {:block/uuid #uuid "aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb"}
               prev-state @state/state]
           (swap! state/state assoc :agent/sessions {(str (:block/uuid block))
                                                     {:session-id "sess-cancel-status-1"
                                                      :status "running"}})
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (swap! fetch-calls conj {:url url :opts opts})
                                                    (p/resolved {:ok true}))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))]
                 (p/let [_ (agent-cancel/maybe-cancel-session-on-status-change!
                            block
                            :logseq.property/status
                            :logseq.property/status.canceled)
                         session (get (:agent/sessions @state/state) (str (:block/uuid block)))
                         [first-call] @fetch-calls
                         _ (reset! state/state prev-state)]
                   (is (= "http://base/sessions/sess-cancel-status-1/cancel" (:url first-call)))
                   (is (= "POST" (get-in first-call [:opts :method])))
                   (is (= "canceled" (:status session)))
                   (done)))
               (p/catch (fn [e]
                          (reset! state/state prev-state)
                          (is false (str e))
                          (done)))))))

(deftest maybe-cancel-session-on-status-change-ignores-non-canceled-status-test
  (async done
         (let [fetch-calls (atom [])
               block {:block/uuid #uuid "cccccccc-1111-2222-3333-dddddddddddd"}
               prev-state @state/state]
           (swap! state/state assoc :agent/sessions {(str (:block/uuid block))
                                                     {:session-id "sess-cancel-status-2"
                                                      :status "running"}})
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (swap! fetch-calls conj {:url url :opts opts})
                                                    (p/resolved {:ok true}))]
                 (p/let [_ (agent-cancel/maybe-cancel-session-on-status-change!
                            block
                            :logseq.property/status
                            :logseq.property/status.done)
                         _ (reset! state/state prev-state)]
                   (is (empty? @fetch-calls))
                   (done)))
               (p/catch (fn [e]
                          (reset! state/state prev-state)
                          (is false (str e))
                          (done)))))))

(deftest maybe-cancel-sessions-on-db-change-test
  (async done
         (let [fetch-calls (atom [])
               block-uuid #uuid "abababab-1111-2222-3333-cdcdcdcdcdcd"
               prev-state @state/state]
           (swap! state/state assoc :agent/sessions {(str block-uuid)
                                                     {:session-id "sess-cancel-status-3"
                                                      :status "running"}})
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (swap! fetch-calls conj {:url url :opts opts})
                                                    (p/resolved {:ok true}))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               db/entity (fn [lookup]
                                           (if (= 42 lookup)
                                             {:block/uuid block-uuid}
                                             nil))]
                 (p/let [_ (agent-cancel/maybe-cancel-sessions-on-db-change!
                            [{:e 42
                              :a :logseq.property/status
                              :v :logseq.property/status.canceled
                              :added true}
                             {:e 42
                              :a :logseq.property/status
                              :v :logseq.property/status.canceled
                              :added true}])
                         session (get (:agent/sessions @state/state) (str block-uuid))
                         _ (reset! state/state prev-state)]
                   (is (= 1 (count @fetch-calls)))
                   (is (= "http://base/sessions/sess-cancel-status-3/cancel"
                          (:url (first @fetch-calls))))
                   (is (= "canceled" (:status session)))
                   (done)))
               (p/catch (fn [e]
                          (reset! state/state prev-state)
                          (is false (str e))
                          (done)))))))

(deftest maybe-cancel-sessions-on-db-change-ignores-non-status-datoms-test
  (async done
         (let [fetch-calls (atom [])
               prev-state @state/state]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (swap! fetch-calls conj {:url url :opts opts})
                                                    (p/resolved {:ok true}))
                               db/entity (fn [_] nil)]
                 (p/let [_ (agent-cancel/maybe-cancel-sessions-on-db-change!
                            [{:e 7
                              :a :block/title
                              :v "Task"
                              :added true}
                             {:e 8
                              :a :logseq.property/status
                              :v :logseq.property/status.done
                              :added true}])
                         _ (reset! state/state prev-state)]
                   (is (empty? @fetch-calls))
                   (done)))
               (p/catch (fn [e]
                          (reset! state/state prev-state)
                          (is false (str e))
                          (done)))))))
