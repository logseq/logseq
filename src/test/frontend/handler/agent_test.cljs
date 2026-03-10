(ns frontend.handler.agent-test
  (:require [clojure.string :as string]
            [clojure.test :refer [deftest is testing use-fixtures]]
            [frontend.db :as db]
            [frontend.handler.agent :as agent-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [promesa.core :as p]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after (fn [] (test-helper/destroy-test-db!))})

(defn- setup-goal-context!
  []
  (test-helper/load-test-files [{:page {:block/title "Goal Page"}
                                 :blocks [{:block/title "Goal"}]}
                                {:page {:block/title "Project Alpha"}}
                                {:page {:block/title "Codex"}}])
  (let [goal (test-helper/find-block-by-content "Goal")
        project-page (db/get-page "Project Alpha")
        agent-page (db/get-page "Codex")]
    (db-property-handler/set-block-property! (:db/id project-page) :block/tags :logseq.class/Project)
    (db-property-handler/set-block-property! (:db/id project-page) :logseq.property/git-repo "https://github.com/logseq/logseq")
    (db-property-handler/set-block-property! (:db/id agent-page) :block/tags :logseq.class/Agent)
    (db-property-handler/set-block-property! (:db/id goal) :logseq.property/project "Project Alpha")
    (db-property-handler/set-block-property! (:db/id goal) :logseq.property/agent "Codex")
    {:goal goal
     :project-page project-page
     :agent-page agent-page}))

(deftest-async persist-planner-tasks-creates-runnable-task-blocks-test
  (p/let [{:keys [goal]} (setup-goal-context!)
          tasks (agent-handler/<upsert-planner-tasks!
                 (:block/uuid goal)
                 [{:title "Implement planner tasks"
                   :description "Create Logseq tasks from planner output"}])
          task-uuid (:block-uuid (first tasks))
          task-block (db/entity [:block/uuid task-uuid])]
    (is (= 1 (count tasks)))
    (is (some #(= :logseq.class/Task (:db/ident %)) (:block/tags task-block)))
    (is (= "Todo" (pu/get-block-property-value task-block :logseq.property/status)))
    (is (= "Project Alpha" (some-> (:logseq.property/project task-block) :block/title)))
    (is (= "Codex" (some-> (:logseq.property/agent task-block) :block/title)))
    (is (some? (agent-handler/build-session-body task-block)))))

(deftest-async upsert-planner-tasks-reconciles-existing-task-by-block-uuid-test
  (p/let [{:keys [goal]} (setup-goal-context!)
          created (agent-handler/<upsert-planner-tasks!
                   (:block/uuid goal)
                   [{:title "Initial title"
                     :description "Initial description"}])
          block-uuid (:block-uuid (first created))
          _ (agent-handler/<upsert-planner-tasks!
             (:block/uuid goal)
             [{:block-uuid block-uuid
               :title "Updated title"
               :description "Updated description"}])
          updated (db/entity [:block/uuid block-uuid])]
    (is (= "Updated title\nUpdated description" (:block/title updated)))
    (is (= "Todo" (pu/get-block-property-value updated :logseq.property/status)))))

(deftest-async upsert-planner-tasks-does-not-overwrite-task-after-session-start-test
  (p/let [{:keys [goal]} (setup-goal-context!)
          created (agent-handler/<upsert-planner-tasks!
                   (:block/uuid goal)
                   [{:title "Locked task"
                     :description "Original"}])
          block-uuid (:block-uuid (first created))
          _ (db-property-handler/set-block-property! block-uuid :logseq.property/agent-session-id "sess-1")
          _ (agent-handler/<upsert-planner-tasks!
             (:block/uuid goal)
             [{:block-uuid block-uuid
               :title "Changed title"
               :description "Changed description"}])
          unchanged (db/entity [:block/uuid block-uuid])]
    (is (= "Locked task\nOriginal" (:block/title unchanged)))
    (is (= "sess-1" (agent-handler/task-session-id unchanged)))))

(deftest-async build-session-body-includes-explicit-agent-permission-mode-test
  (p/let [{:keys [goal]} (setup-goal-context!)
          created (agent-handler/<upsert-planner-tasks!
                   (:block/uuid goal)
                   [{:title "Planning task"
                     :description "Plan safely"}])
          task-block (db/entity [:block/uuid (:block-uuid (first created))])
          body (agent-handler/build-session-body task-block {:agent/permission-mode "read-only"})]
    (is (= "codex" (some-> body :agent :provider string/lower-case)))
    (is (= "read-only" (get-in body [:agent :permission-mode])))))

(deftest planner-tasks-from-text-parses-json-object-and-code-fence-test
  (testing "json object with tasks"
    (is (= [{:title "Task A"
             :description "Desc A"}
            {:title "Task B"
             :content "Explicit content"}]
           (agent-handler/planner-tasks-from-text
            "{\"tasks\":[{\"title\":\"Task A\",\"description\":\"Desc A\"},{\"title\":\"Task B\",\"content\":\"Explicit content\"}]}"))))
  (testing "fenced json array"
    (is (= [{:title "Task C"
             :description "Desc C"}]
           (agent-handler/planner-tasks-from-text
            "```json\n[{\"title\":\"Task C\",\"description\":\"Desc C\"}]\n```"))))
  (testing "prose with fenced json block"
    (is (= [{:title "Task D"
             :description "Desc D"}]
           (agent-handler/planner-tasks-from-text
            "Here is the plan.\n\n```json\n{\"tasks\":[{\"title\":\"Task D\",\"description\":\"Desc D\"}]}\n```\n\nReview it."))))
  (testing "invalid payload returns nil"
    (is (nil? (agent-handler/planner-tasks-from-text "not planner json")))))
