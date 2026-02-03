(ns frontend.handler.agent-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.handler.agent :as agent-handler]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.user :as user-handler]
            [promesa.core :as p]))

(deftest start-session-sends-initial-message-test
  (async done
         (let [calls (atom [])
               block {:block/uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (swap! calls conj {:url url :opts opts})
                                                    (cond
                                                      (= url "http://base/sessions")
                                                      (p/resolved {:session-id "sess-1"
                                                                   :status "created"
                                                                   :stream-url "http://stream"})

                                                      (= url "http://base/sessions/sess-1/messages")
                                                      (p/resolved {:ok true})

                                                      :else
                                                      (p/rejected (ex-info "unexpected url" {:url url}))))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               agent-handler/task-ready? (fn [_] true)
                               agent-handler/build-session-body (fn [_]
                                                                  {:session-id "sess-1"
                                                                   :node-id "node-1"
                                                                   :node-title "Task"
                                                                   :content "Tell me the weather today in Hangzhou."
                                                                   :attachments []
                                                                   :project {:id "proj-1"
                                                                             :title "Project"
                                                                             :repo-url "https://github.com/example/repo"}
                                                                   :agent {:provider "Codex"}})]
                 (p/let [_ (agent-handler/<start-session! block)
                         [create-call message-call] @calls]
                   (is (= "Tell me the weather today in Hangzhou."
                          (:content (agent-handler/build-session-body block))))
                   (is (= "http://base/sessions" (:url create-call)))
                   (is (= "POST" (get-in create-call [:opts :method])))
                   (is (= "http://base/sessions/sess-1/messages" (:url message-call)))
                   (is (= "POST" (get-in message-call [:opts :method])))
                   (is (string/includes?
                        (get-in message-call [:opts :body])
                        "\"message\":\"Tell me the weather today in Hangzhou.\""))
                   (is (string/includes?
                        (get-in message-call [:opts :body])
                        "\"kind\":\"user\""))
                   (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))

(deftest start-session-skips-empty-message-test
  (async done
         (let [calls (atom [])
               block {:block/uuid #uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}]
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (swap! calls conj {:url url :opts opts})
                                                    (p/resolved {:session-id "sess-1"
                                                                 :status "created"
                                                                 :stream-url "http://stream"}))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               agent-handler/task-ready? (fn [_] true)
                               agent-handler/build-session-body (fn [_]
                                                                  {:session-id "sess-1"
                                                                   :node-id "node-1"
                                                                   :node-title "Task"
                                                                   :content ""
                                                                   :attachments []
                                                                   :project {:id "proj-1"
                                                                             :title "Project"
                                                                             :repo-url "https://github.com/example/repo"}
                                                                   :agent {:provider "Codex"}})]
                 (p/let [_ (agent-handler/<start-session! block)]
                   (is (= 1 (count @calls)))
                   (is (= "http://base/sessions" (:url (first @calls))))
                   (done)))
               (p/catch (fn [e]
                          (is false (str e))
                          (done)))))))
