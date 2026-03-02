(ns frontend.handler.agent-test
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.agent :as agent-handler]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest build-session-body-includes-project-sandbox-init-setup-test
  (let [project-page {:block/uuid #uuid "11111111-1111-1111-1111-111111111111"
                      :block/title "Project"}
        block {:block/uuid #uuid "22222222-2222-2222-2222-222222222222"
               :block/title "Task"
               :logseq.property/project project-page
               :logseq.property/agent {:block/title "Codex"}}]
    (p/with-redefs [pu/get-block-property-value (fn [entity k]
                                                  (if (= entity project-page)
                                                    (case k
                                                      :logseq.property/git-repo "https://github.com/example/repo"
                                                      :logseq.property/project-sandbox-init-setup "yarn install"
                                                      nil)
                                                    (get entity k)))]
      (is (= "yarn install"
             (get-in (agent-handler/build-session-body block)
                     [:project :sandbox-init-setup]))))))

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

(deftest publish-session-pr-created-sets-in-review-and-inserts-summary-sibling-block-test
  (async done
         (let [insert-calls (atom [])
               fetch-calls (atom [])
               property-calls (atom [])
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
                               db/entity (fn [lookup]
                                           (cond
                                             (= lookup [:block/uuid (:block/uuid block)])
                                             {:block/uuid (:block/uuid block)}

                                             (= lookup :logseq.property/status.in-review)
                                             {:block/title "In review"}

                                             :else nil))
                               pu/get-block-property-value (fn [block k]
                                                             (get block k))
                               property-handler/set-block-property! (fn [block-id k v]
                                                                      (swap! property-calls conj {:block-id block-id
                                                                                                  :key k
                                                                                                  :value v}))
                               editor-handler/api-insert-new-block! (fn [content opts]
                                                                      (swap! insert-calls conj {:content content :opts opts}))]
                 (p/let [_ (agent-handler/<publish-session! block {:create-pr? true
                                                                   :body "Agent summary for PR"})
                         [first-call] @fetch-calls
                         _ (reset! state/state prev-state)]
                   (is (= "http://base/sessions/sess-pr-1/pr" (:url first-call)))
                   (is (= #{[:logseq.property/pr "https://github.com/example/repo/pull/123"]
                            [:logseq.property/status :logseq.property/status.in-review]}
                          (set (map (juxt :key :value) @property-calls))))
                   (is (= 1 (count @insert-calls)))
                   (is (= "PR Summary: Agent summary for PR"
                          (:content (first @insert-calls))))
                   (is (every? #(= true (get-in % [:opts :sibling?])) @insert-calls))
                   (is (every? #(= (:block/uuid block) (get-in % [:opts :block-uuid])) @insert-calls))
                   (done)))
               (p/catch (fn [e]
                          (reset! state/state prev-state)
                          (is false (str e))
                          (done)))))))

(deftest publish-session-manual-pr-inserts-summary-sibling-block-test
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
                   (is (= 1 (count @insert-calls)))
                   (is (= "PR Summary: Agent summary for manual PR"
                          (:content (first @insert-calls))))
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

(deftest cancel-session-calls-endpoint-and-updates-status-test
  (async done
         (let [fetch-calls (atom [])
               block {:block/uuid #uuid "99999999-9999-9999-9999-999999999999"}
               prev-state @state/state]
           (swap! state/state assoc :agent/sessions {(str (:block/uuid block))
                                                     {:session-id "sess-cancel-1"
                                                      :status "running"}})
           (-> (p/with-redefs [db-sync/http-base (fn [] "http://base")
                               db-sync/fetch-json (fn [url opts _]
                                                    (swap! fetch-calls conj {:url url :opts opts})
                                                    (p/resolved {:ok true}))
                               user-handler/task--ensure-id&access-token (fn [resolve _reject]
                                                                           (resolve true))]
                 (p/let [_ (agent-handler/<cancel-session! block)
                         session (get (:agent/sessions @state/state) (str (:block/uuid block)))
                         [first-call] @fetch-calls
                         _ (reset! state/state prev-state)]
                   (is (= "http://base/sessions/sess-cancel-1/cancel" (:url first-call)))
                   (is (= "POST" (get-in first-call [:opts :method])))
                   (is (= "canceled" (:status session)))
                   (done)))
               (p/catch (fn [e]
                          (reset! state/state prev-state)
                          (is false (str e))
                          (done)))))))

(deftest cancel-session-if-task-canceled-triggers-only-for-active-session-test
  (async done
         (let [calls (atom 0)
               block {:block/uuid #uuid "12121212-1212-1212-1212-121212121212"}
               prev-state @state/state]
           (swap! state/state assoc :agent/sessions {(str (:block/uuid block))
                                                     {:session-id "sess-cancel-2"
                                                      :status "running"}})
           (-> (p/with-redefs [pu/get-block-property-value (fn [_entity key]
                                                             (when (= key :logseq.property/status)
                                                               :logseq.property/status.canceled))
                               agent-handler/<cancel-session! (fn [_]
                                                                (swap! calls inc)
                                                                (p/resolved {:ok true}))]
                 (p/let [_ (agent-handler/<cancel-session-if-task-canceled! block)
                         _ (swap! state/state assoc-in [:agent/sessions (str (:block/uuid block)) :status] "completed")
                         _ (agent-handler/<cancel-session-if-task-canceled! block)
                         _ (reset! state/state prev-state)]
                   (is (= 1 @calls))
                   (done)))
               (p/catch (fn [e]
                          (reset! state/state prev-state)
                          (is false (str e))
                          (done)))))))

(deftest terminal-websocket-url-test
  (let [url (agent-handler/terminal-websocket-url
             "https://db-sync.example.com"
             "sess-1"
             {:token "jwt-123"
              :cols 120
              :rows 40})
        parsed (js/URL. url)]
    (is (= "wss:" (.-protocol parsed)))
    (is (= "/sessions/sess-1/terminal" (.-pathname parsed)))
    (is (= "jwt-123" (.get (.-searchParams parsed) "token")))
    (is (= "120" (.get (.-searchParams parsed) "cols")))
    (is (= "40" (.get (.-searchParams parsed) "rows")))))

(deftest session-terminal-enabled-test
  (is (true? (agent-handler/session-terminal-enabled?
              {:runtime-provider "cloudflare"})))
  (is (false? (agent-handler/session-terminal-enabled?
               {:runtime-provider "sprites"})))
  (is (true? (agent-handler/session-terminal-enabled?
              {:events [{:type "session.provisioned"
                         :data {:provider "cloudflare"}}]})))
  (is (false? (agent-handler/session-terminal-enabled?
               {:events [{:type "session.provisioned"
                          :data {:provider "local-dev"}}]}))))
