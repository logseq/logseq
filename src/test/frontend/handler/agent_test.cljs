(ns frontend.handler.agent-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.handler.agent :as agent-handler]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
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

(deftest publish-session-pr-created-inserts-url-and-summary-sibling-blocks-test
  (async done
         (let [insert-calls (atom [])
               fetch-calls (atom [])
               block {:block/uuid #uuid "cccccccc-cccc-cccc-cccc-cccccccccccc"}
               prev-state @state/state]
           (swap! state/state assoc :agent/sessions {(str (:block/uuid block)) {:session-id "sess-pr-1"}})
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (swap! fetch-calls conj {:url url :opts opts})
                                                    (if (string/includes? url "/events")
                                                      (p/resolved {:events []})
                                                      (p/resolved {:status "pr-created"
                                                                   :pr-url "https://github.com/example/repo/pull/123"})))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               agent-handler/task-ready? (fn [_] true)
                               notification/show! (fn [& _] nil)
                               editor-handler/api-insert-new-block! (fn [content opts]
                                                                      (swap! insert-calls conj {:content content :opts opts}))]
                 (p/let [_ (agent-handler/<publish-session! block {:create-pr? true
                                                                   :body "Agent summary for PR"})
                         [first-call] @fetch-calls
                         _ (reset! state/state prev-state)]
                   (is (= "http://base/sessions/sess-pr-1/pr" (:url first-call)))
                   (is (= 2 (count @insert-calls)))
                   (is (= "PR URL: https://github.com/example/repo/pull/123"
                          (:content (first @insert-calls))))
                   (is (= "PR Summary: Agent summary for PR"
                          (:content (second @insert-calls))))
                   (is (every? #(= true (get-in % [:opts :sibling?])) @insert-calls))
                   (is (every? #(= (:block/uuid block) (get-in % [:opts :block-uuid])) @insert-calls))
                   (done)))
               (p/catch (fn [e]
                          (reset! state/state prev-state)
                          (is false (str e))
                          (done)))))))

(deftest publish-session-manual-pr-inserts-manual-url-and-summary-sibling-blocks-test
  (async done
         (let [insert-calls (atom [])
               block {:block/uuid #uuid "dddddddd-dddd-dddd-dddd-dddddddddddd"}
               prev-state @state/state]
           (swap! state/state assoc :agent/sessions {(str (:block/uuid block)) {:session-id "sess-pr-2"}})
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url _opts _]
                                                    (if (string/includes? url "/events")
                                                      (p/resolved {:events []})
                                                      (p/resolved {:status "manual-pr-required"
                                                                   :manual-pr-url "https://github.com/example/repo/compare/a...b"})))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               agent-handler/task-ready? (fn [_] true)
                               notification/show! (fn [& _] nil)
                               editor-handler/api-insert-new-block! (fn [content opts]
                                                                      (swap! insert-calls conj {:content content :opts opts}))]
                 (p/let [_ (agent-handler/<publish-session! block {:create-pr? true
                                                                   :body "Agent summary for manual PR"})
                         _ (reset! state/state prev-state)]
                   (is (= 2 (count @insert-calls)))
                   (is (= "PR URL: https://github.com/example/repo/compare/a...b"
                          (:content (first @insert-calls))))
                   (is (= "PR Summary: Agent summary for manual PR"
                          (:content (second @insert-calls))))
                   (done)))
               (p/catch (fn [e]
                          (reset! state/state prev-state)
                          (is false (str e))
                          (done)))))))

(deftest publish-session-push-only-does-not-insert-pr-sibling-blocks-test
  (async done
         (let [insert-calls (atom [])
               block {:block/uuid #uuid "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"}
               prev-state @state/state]
           (swap! state/state assoc :agent/sessions {(str (:block/uuid block)) {:session-id "sess-pr-3"}})
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url _opts _]
                                                    (if (string/includes? url "/events")
                                                      (p/resolved {:events []})
                                                      (p/resolved {:status "pushed"})))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               agent-handler/task-ready? (fn [_] true)
                               notification/show! (fn [& _] nil)
                               editor-handler/api-insert-new-block! (fn [content opts]
                                                                      (swap! insert-calls conj {:content content :opts opts}))]
                 (p/let [_ (agent-handler/<publish-session! block {:create-pr? false
                                                                   :body "Summary should be ignored"})
                         _ (reset! state/state prev-state)]
                   (is (empty? @insert-calls))
                   (done)))
               (p/catch (fn [e]
                          (reset! state/state prev-state)
                          (is false (str e))
                          (done)))))))

(deftest publish-session-sends-commit-message-test
  (async done
         (let [request-bodies (atom [])
               block {:block/uuid #uuid "ffffffff-ffff-ffff-ffff-ffffffffffff"}
               prev-state @state/state]
           (swap! state/state assoc :agent/sessions {(str (:block/uuid block)) {:session-id "sess-pr-4"}})
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (if (string/includes? url "/events")
                                                      (p/resolved {:events []})
                                                      (do
                                                        (swap! request-bodies conj (js->clj (js/JSON.parse (:body opts))
                                                                                            :keywordize-keys true))
                                                        (p/resolved {:status "pushed"}))))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))
                               agent-handler/task-ready? (fn [_] true)
                               notification/show! (fn [& _] nil)]
                 (p/let [_ (agent-handler/<publish-session! block {:create-pr? false
                                                                   :commit-message "feat: summarize PR changes"})
                         _ (reset! state/state prev-state)]
                   (is (= "feat: summarize PR changes"
                          (:commit-message (first @request-bodies))))
                   (done)))
               (p/catch (fn [e]
                          (reset! state/state prev-state)
                          (is false (str e))
                          (done)))))))
