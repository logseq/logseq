(ns logseq.agents.handler-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.agents.handler :as handler]
            [logseq.sync.platform.core :as platform]))

(deftest planning-session-get-requires-planning-store-test
  (async done
         (let [request (platform/request "http://example.com/planning/sessions/plan-1"
                                         #js {:method "GET"})]
           (-> (js/Promise.resolve
                (handler/handle {:env #js {}
                                 :request request
                                 :url (platform/request-url request)
                                 :claims #js {"sub" "user-1"}
                                 :route {:handler :planning.sessions/get
                                         :path-params {:planning-session-id "plan-1"}}}))
               (.then (fn [response]
                        (is (= 503 (.-status response)))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest planning-chat-transport-requires-agent-binding-test
  (async done
         (let [request (platform/request "http://example.com/planning/chat/plan-1"
                                         #js {:method "GET"})]
           (-> (js/Promise.resolve
                (handler/handle {:env #js {}
                                 :request request
                                 :url (platform/request-url request)
                                 :claims #js {"sub" "user-1"}
                                 :route {:handler :planning.chat/transport
                                         :path-params {:planning-session-id "plan-1"}}}))
               (.then (fn [response]
                        (is (= 503 (.-status response)))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))

(deftest planning-session-replan-requires-workflow-binding-test
  (async done
         (let [request (platform/request "http://example.com/planning/sessions/plan-1/replan"
                                         #js {:method "POST"
                                              :headers #js {"content-type" "application/json"}
                                              :body (js/JSON.stringify #js {:tasks #js []})})]
           (-> (js/Promise.resolve
                (handler/handle {:env #js {}
                                 :request request
                                 :url (platform/request-url request)
                                 :claims #js {"sub" "user-1"}
                                 :route {:handler :planning.sessions/replan
                                         :path-params {:planning-session-id "plan-1"}}}))
               (.then (fn [response]
                        (is (= 503 (.-status response)))
                        (done)))
               (.catch (fn [error]
                         (is false (str "unexpected error: " error))
                         (done)))))))
