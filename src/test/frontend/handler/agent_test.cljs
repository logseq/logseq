(ns frontend.handler.agent-test
  (:require [cljs.test :refer [async deftest is testing use-fixtures]]
            [frontend.db :as db]
            [frontend.handler.agent :as agent-handler]
            [frontend.handler.property.util :as pu]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [promesa.core :as p]))

(use-fixtures :each
  {:before test-helper/start-test-db!
   :after test-helper/destroy-test-db!})

(defn- setup-source-task!
  []
  (test-helper/load-test-files
   [{:page {:block/title "Planning"}
     :blocks [{:block/title "Parent planning task"
               :build/properties {:block/tags #{:logseq.class/Task}}}]}])
  {:source (test-helper/find-block-by-content "Parent planning task")})

(deftest build-session-body-includes-planning-workflow-test
  (testing "execution prompts require plan and post-review artifacts in the same session"
    (let [{:keys [source]} (setup-source-task!)
          block-uuid (:block/uuid source)
          body (with-redefs [agent-handler/task-context
                             (fn [_block _opts]
                               {:block-uuid block-uuid
                                :node-id (str block-uuid)
                                :node-title "Parent planning task"
                                :content "- Parent planning task"
                                :attachments []
                                :sandbox-checkpoint nil
                                :project {:id "project-1"
                                          :title "Demo Project"
                                          :repo-url "https://github.com/logseq/logseq"}
                                :agent {:provider "codex"}})]
                 (agent-handler/build-session-body source))]
      (is (string? (:content body)))
      (is (re-find #"<logseq-plan>" (:content body)))
      (is (re-find #"<logseq-post-review>" (:content body)))
      (is (re-find #"continue implementation in the same session" (:content body)))
      (is (re-find #"reviewMarkdown" (:content body)))
      (is (not (re-find #"shouldSplit" (:content body)))))))

(deftest-async sync-task-artifacts-from-event-test
  (let [{:keys [source]} (setup-source-task!)
        plan-event {:type "item.completed"
                    :data {:item {:kind "message"
                                  :content [{:type "text"
                                             :text (str
                                                    "Planning phase done.\n"
                                                    "<logseq-plan>{\"planMarkdown\":\"## Plan\\n- Inspect code\\n- Implement change\",\"subtasks\":[{\"title\":\"Extract artifact parser\",\"status\":\"todo\"},{\"title\":\"Persist post-review\",\"status\":\"doing\"}]}</logseq-plan>")}]}}}
        review-event {:type "session.completed"
                      :data {:last-agent-message
                             (str
                              "Work complete.\n"
                              "<logseq-post-review>{\"reviewMarkdown\":\"## Post-review\\n- Tests passed\\n- Risk: parser relies on tagged artifacts\"}</logseq-post-review>")}}]
    (p/let [_ (agent-handler/<sync-task-artifacts-from-event! source plan-event)
            updated (db/entity [:block/uuid (:block/uuid source)])
            _ (is (= "## Plan\n- Inspect code\n- Implement change"
                     (pu/get-block-property-value updated :logseq.property/agent-plan)))
            child-statuses (->> (:block/_parent updated)
                                (map (fn [child]
                                       [(:block/title child)
                                        (some-> (:logseq.property/status child) :db/ident)]))
                                (into {}))
            _ (is (= :logseq.property/status.todo (get child-statuses "Extract artifact parser")))
            _ (is (= :logseq.property/status.doing (get child-statuses "Persist post-review")))
            _ (agent-handler/<sync-task-artifacts-from-event! source review-event)
            updated (db/entity [:block/uuid (:block/uuid source)])]
      (is (= "## Plan\n- Inspect code\n- Implement change"
             (pu/get-block-property-value updated :logseq.property/agent-plan)))
      (is (= "## Post-review\n- Tests passed\n- Risk: parser relies on tagged artifacts"
             (pu/get-block-property-value updated :logseq.property/post-review))))))

(deftest chunked-plan-artifact-creates-subtasks-test
  (async done
         (let [{:keys [source]} (setup-source-task!)
               block-uuid (:block/uuid source)
               chunk-events [{:type "agent.runtime"
                              :data {:method "session/update"
                                     :session-id "runtime-1"
                                     :update {:sessionUpdate "agent_message_chunk"
                                              :content {:type "text"
                                                        :text "<logseq-plan>{\"planMarkdown\":\"## Plan\\n- Split work\",\"subtasks\":[{\"title\":\"Build board\",\"status\":\"todo\"},{\"title\":\"Handle rotation\",\"status\":\"doing\"}]}"}}}}
                             {:type "agent.runtime"
                              :data {:method "session/update"
                                     :session-id "runtime-1"
                                     :update {:sessionUpdate "agent_message_chunk"
                                              :content {:type "text"
                                                        :text "</logseq-plan>"}}}}
                             {:type "agent.runtime"
                              :data {:jsonrpc "2.0"
                                     :id 4
                                     :result {:stopReason "end_turn"}}}]]
           (-> (reduce (fn [promise event]
                         (p/let [_ promise]
                           (agent-handler/<sync-task-artifacts-from-event! source event)))
                       (p/resolved nil)
                       chunk-events)
               (p/then (fn [_]
                         (let [updated (db/entity [:block/uuid block-uuid])
                               child-statuses (->> (:block/_parent updated)
                                                   (map (fn [child]
                                                          [(:block/title child)
                                                           (some-> (:logseq.property/status child) :db/ident)]))
                                                   (into {}))]
                           (is (= "## Plan\n- Split work"
                                  (pu/get-block-property-value updated :logseq.property/agent-plan)))
                           (is (= :logseq.property/status.todo (get child-statuses "Build board")))
                           (is (= :logseq.property/status.doing (get child-statuses "Handle rotation"))))))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally (fn []
                            (done)))))))

(deftest chunked-plan-artifact-does-not-write-before-message-completes-test
  (async done
         (let [{:keys [source]} (setup-source-task!)
               block-uuid (:block/uuid source)
               partial-events [{:type "agent.runtime"
                                :data {:method "session/update"
                                       :session-id "runtime-1"
                                       :update {:sessionUpdate "agent_message_chunk"
                                                :content {:type "text"
                                                          :text "<logseq-plan>{\"planMarkdown\":\"## Plan\\n- Split work\",\"subtasks\":[{\"title\":\"Build board\",\"status\":\"todo\"}]}"}}}}
                               {:type "agent.runtime"
                                :data {:method "session/update"
                                       :session-id "runtime-1"
                                       :update {:sessionUpdate "agent_message_chunk"
                                                :content {:type "text"
                                                          :text "</logseq-plan>Trailing narrative that should not trigger writes yet."}}}}]]
           (-> (reduce (fn [promise event]
                         (p/let [_ promise]
                           (agent-handler/<sync-task-artifacts-from-event! source event)))
                       (p/resolved nil)
                       partial-events)
               (p/then (fn [_]
                         (let [updated (db/entity [:block/uuid block-uuid])
                               child-titles (->> (:block/_parent updated)
                                                 (map :block/title)
                                                 set)]
                           (is (nil? (pu/get-block-property-value updated :logseq.property/agent-plan)))
                           (is (not (contains? child-titles "Build board"))))))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally (fn []
                            (done)))))))

(deftest placeholder-subtasks-are-ignored-test
  (async done
         (let [{:keys [source]} (setup-source-task!)
               block-uuid (:block/uuid source)
               event {:type "item.completed"
                      :data {:item {:kind "message"
                                    :content [{:type "text"
                                               :text "<logseq-plan>{\"planMarkdown\":\"## Plan\\n- Real task\",\"subtasks\":[{\"title\":\"subtask 1\",\"status\":\"todo\"},{\"title\":\"subtask 2\",\"status\":\"doing\"}]}</logseq-plan>"}]}}}]
           (-> (agent-handler/<sync-task-artifacts-from-event! source event)
               (p/then (fn [_]
                         (let [updated (db/entity [:block/uuid block-uuid])
                               child-titles (->> (:block/_parent updated)
                                                 (map :block/title)
                                                 set)]
                           (is (= "## Plan\n- Real task"
                                  (pu/get-block-property-value updated :logseq.property/agent-plan)))
                           (is (not (contains? child-titles "subtask 1")))
                           (is (not (contains? child-titles "subtask 2"))))))
               (p/catch (fn [error]
                          (is false (str error))))
               (p/finally (fn []
                            (done)))))))
