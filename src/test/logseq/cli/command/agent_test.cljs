(ns logseq.cli.command.agent-test
  (:require ["child_process" :as child-process]
            ["events" :as events]
            ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.reader :as reader]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.cli.command.agent :as agent-command]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.commands :as commands]
            [logseq.cli.format :as cli-format]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.db.frontend.property :as db-property]
            [promesa.core :as p]))

(defn- temp-root
  []
  (.mkdtempSync fs (node-path/join (.tmpdir os) "logseq-agent-bridge-test-")))

(defn- read-dict
  [filename]
  (reader/read-string
   (.toString
    (fs/readFileSync
     (node-path/join (.cwd js/process) "src" "resources" "dicts" filename))
    "utf8")))

(defn- task-block
  [overrides]
  (merge {:db/id 42
          :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
          :block/title "Ship the CLI bridge"
          :block/tags [{:db/ident :logseq.class/Task
                        :block/title "Task"}]
          :logseq.property/status {:db/ident :logseq.property/status.todo}
          :logseq.property/assignee [{:db/id 101
                                      :block/title "build-host"}]}
         overrides))

(defn- comment-block
  [overrides]
  (merge {:db/id 50
          :block/uuid #uuid "55555555-5555-5555-5555-555555555555"
          :block/title "[[build-host]] please summarize the selected blocks"
          :block/tags [{:db/ident :logseq.class/Comment
                        :block/title "Comment"}]
          :block/parent {:db/id 60
                         :block/uuid #uuid "66666666-6666-6666-6666-666666666666"}}
         overrides))

(defn- comments-area-block
  [overrides]
  (merge {:db/id 60
          :block/uuid #uuid "66666666-6666-6666-6666-666666666666"
          :block/title "Comments"
          :block/tags [{:db/ident :logseq.class/Comments
                        :block/title "Comments"}]
          :logseq.property.comments/blocks [{:db/id 70
                                             :block/uuid #uuid "77777777-7777-7777-7777-777777777777"
                                             :block/title "Target block A"}
                                            {:db/id 80
                                             :block/uuid #uuid "88888888-8888-8888-8888-888888888888"
                                             :block/title "Target block B"}]}
         overrides))

(def codex-exec-prefix
  ["codex" "--sandbox" "danger-full-access" "exec" "--json" "--skip-git-repo-check"])

(def codex-resume-prefix
  ["codex" "--sandbox" "danger-full-access" "exec" "resume" "--json" "--skip-git-repo-check"])

(deftest test-agent-bridge-built-in-properties
  (testing "Assignee is public and queryable"
    (let [property (get db-property/built-in-properties :logseq.property/assignee)]
      (is (= "Assignee" (:title property)))
      (is (= :node (get-in property [:schema :type])))
      (is (= :many (get-in property [:schema :cardinality])))
      (is (= true (get-in property [:schema :public?])))
      (is (= true (:queryable? property)))
      (is (contains? db-property/public-built-in-properties :logseq.property/assignee))))

  (testing "agent session id is an internal built-in property"
    (let [property (get db-property/built-in-properties :logseq.property.agent/session-id)]
      (is (= "Agent Session ID" (:title property)))
      (is (= :string (get-in property [:schema :type])))
      (is (not (contains? (:schema property) :db/cardinality)))
      (is (= true (get-in property [:schema :public?])))
      (is (= true (get-in property [:schema :hide?])))
      (is (= "Stores the AgentBridge session ID for a routed task."
             (get-in property [:properties :logseq.property/description])))
      (is (contains? db-property/public-built-in-properties :logseq.property.agent/session-id))
      (is (db-property/logseq-property? :logseq.property.agent/session-id))
      (is (db-property/internal-property? :logseq.property.agent/session-id))
      (let [i18n-key (db-property/built-in-ident->i18n-key :logseq.property.agent/session-id)]
        (is (= :property.built-in/agent-session-id i18n-key))
        (is (contains? (read-dict "en.edn") i18n-key))
        (is (contains? (read-dict "zh-cn.edn") i18n-key))))))

(deftest test-agent-command-entries
  (testing "parse agent bridge command surface"
    (let [bridge (commands/parse-args ["agent" "bridge" "--graph" "demo"])]
      (is (true? (:ok? bridge)))
      (is (= :agent-bridge (:command bridge)))
      (is (= "demo" (get-in bridge [:options :graph])))
      (is (not (contains? (:options bridge) :dry-run)))))

  (testing "agent bridge dry-run is not accepted"
    (let [result (commands/parse-args ["agent" "bridge" "--graph" "demo" "--dry-run"])]
      (is (false? (:ok? result)))))

  (testing "agent bridge help does not mention dry-run"
    (let [summary (:summary (commands/parse-args ["agent" "bridge" "--help"]))]
      (is (not (string/includes? summary "--dry-run")))))

  (testing "agent bridge list is not a command"
    (let [result (commands/parse-args ["agent" "bridge" "list"])]
      (is (false? (:ok? result)))
      (is (= :unknown-command (get-in result [:error :code])))))

  (testing "top-level help exposes the agent utility group"
    (let [summary (:summary (commands/parse-args ["--help"]))]
      (is (string/includes? summary "agent"))
      (is (string/includes? summary "Run task agent bridge")))))

(deftest test-build-action
  (testing "agent bridge requires a resolved graph"
    (let [result (commands/build-action {:ok? true
                                         :command :agent-bridge
                                         :options {}
                                         :args []}
                                        {})]
      (is (false? (:ok? result)))
      (is (= :missing-repo (get-in result [:error :code])))))

  (testing "agent bridge uses normal graph config precedence"
    (let [parsed {:ok? true
                  :command :agent-bridge
                  :options {}
                  :args []}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :agent-bridge (get-in result [:action :type])))
      (is (= "demo" (get-in result [:action :graph])))
      (is (= "logseq_db_demo" (get-in result [:action :repo])))
      (is (not (contains? (:action result) :dry-run?)))))

  (testing "agent bridge list action is not supported"
    (let [result (commands/build-action {:ok? true
                                         :command :agent-bridge-list
                                         :options {}
                                         :args []}
                                        {})]
      (is (false? (:ok? result)))
      (is (= :unknown-command (get-in result [:error :code]))))))

(deftest test-resolve-agent-name
  (testing "config overrides hostname"
    (is (= {:ok? true :agent-name "bridge-a"}
           (agent-command/resolve-agent-name {:agent-name " bridge-a "}
                                             {:hostname "fallback-host"}))))

  (testing "hostname is the default when config omits agent-name"
    (is (= {:ok? true :agent-name "fallback-host"}
           (agent-command/resolve-agent-name {}
                                             {:hostname "fallback-host"}))))

  (testing "blank config value fails instead of falling back"
    (let [result (agent-command/resolve-agent-name {:agent-name "   "}
                                                   {:hostname "fallback-host"})]
      (is (false? (:ok? result)))
      (is (= :agent-name-invalid (get-in result [:error :code])))))

  (testing "missing hostname fails when no config value exists"
    (let [result (agent-command/resolve-agent-name {}
                                                   {:hostname ""})]
      (is (false? (:ok? result)))
      (is (= :agent-name-invalid (get-in result [:error :code]))))))

(deftest test-routable-task
  (testing "routes opted-in TODO Task assigned to current AgentBridge"
    (is (true? (agent-command/routable-task? (task-block {}) "build-host"))))

  (testing "routes built-in Assignee node values with many cardinality"
    (is (true? (agent-command/routable-task?
                (task-block {:logseq.property/assignee [{:db/id 101
                                                         :block/title "build-host"}]})
                "build-host"))))

  (testing "rejects non-routable blocks with explicit reasons"
    (is (= :missing-stable-uuid
           (:reason (agent-command/routable-task-decision (task-block {:block/uuid nil}) "build-host"))))
    (is (= :missing-task-tag
           (:reason (agent-command/routable-task-decision (task-block {:block/tags []}) "build-host"))))
    (is (= :not-todo
           (:reason (agent-command/routable-task-decision (task-block {:logseq.property/status {:db/ident :logseq.property/status.done}})
                                                          "build-host"))))
    (is (= :assignee-mismatch
           (:reason (agent-command/routable-task-decision (task-block {:logseq.property/assignee [{:db/id 102
                                                                                                   :block/title "other-host"}]})
                                                          "build-host"))))
    (is (= :already-routed
           (:reason (agent-command/routable-task-decision (task-block {:logseq.property.agent/session-id "codex-1"})
                                                          "build-host"))))))

(deftest test-prompt-and-command
  (let [prompt (agent-command/build-codex-prompt
                {:graph "demo"
                 :agent-name "build-host"
                 :block (task-block {})
                 :tree-text "- Ship the CLI bridge\n  - Add tests"})
        command (agent-command/build-codex-command prompt {:codex-bin "codex"})
        preview (agent-command/command-preview command)]
    (testing "prompt carries graph, block, tree, identity, and write-back instructions"
      (is (string/includes? prompt "Graph: demo"))
      (is (string/includes? prompt "Block UUID: 11111111-1111-1111-1111-111111111111"))
      (is (string/includes? prompt "AgentBridge name: build-host"))
      (is (string/includes? prompt "Do not operate outside the target graph."))
      (is (string/includes? prompt "Write task results back into the graph."))
      (is (string/includes? prompt "- Ship the CLI bridge")))

    (testing "codex command uses exec and shell-safe preview"
      (is (= (conj codex-exec-prefix prompt) command))
      (is (string/starts-with? preview "codex --sandbox danger-full-access exec --json --skip-git-repo-check '"))
      (is (string/includes? preview "Ship the CLI bridge")))))

(deftest test-default-comment-prompt-documents-db-graph-block-ref-syntax
  (let [prompt (#'agent-command/build-comment-codex-prompt
                {:graph "demo"
                 :agent-name "build-host"
                 :comment (comment-block {})
                 :target-tree-texts ["- Target block"]
                 :comments-area-tree-text "- Comments"
                 :comment-tree-text "- [[build-host]] summarize"})]
    (is (string/includes? prompt "reference result blocks with [[block-uuid]], not ((block-uuid))"))
    (is (not (string/includes? prompt "reference result blocks with ((block-uuid))")))))

(deftest test-prompt-templates
  (testing "prompt builders render supplied graph templates"
    (let [prompt (agent-command/build-codex-prompt
                  {:graph "demo"
                   :agent-name "build-host"
                   :block (task-block {})
                   :tree-text "- Ship the CLI bridge"
                   :prompt-template "Task {{graph}} {{block-uuid}} {{agent-name}}\n{{task-block-tree}}"})
          comment-prompt (#'agent-command/build-comment-codex-prompt
                          {:graph "demo"
                           :agent-name "build-host"
                           :comment (comment-block {})
                           :target-tree-texts ["- Target block"]
                           :comments-area-tree-text "- Comments"
                           :comment-tree-text "- [[build-host]] summarize"
                           :prompt-template "Comment {{graph}} {{comment-uuid}} {{agent-name}}\n{{comment-target-context}}\n{{comment-thread-context}}\n{{requesting-comment}}"})]
      (is (= "Task demo 11111111-1111-1111-1111-111111111111 build-host\n- Ship the CLI bridge"
             prompt))
      (is (string/includes? comment-prompt
                            "Comment demo 55555555-5555-5555-5555-555555555555 build-host"))
      (is (string/includes? comment-prompt "- Target block"))
      (is (string/includes? comment-prompt "- [[build-host]] summarize"))))

  (testing "template lint fails on missing and unknown vars"
    (let [missing-result (#'agent-command/validate-prompt-template
                          :task
                          "Task {{graph}} {{block-uuid}} {{agent-name}}")
          unknown-result (#'agent-command/validate-prompt-template
                          :task
                          "Task {{graph}} {{block-uuid}} {{agent-name}} {{task-block-tree}} {{extra}}")]
      (is (false? (:ok? missing-result)))
      (is (= :missing-template-vars (get-in missing-result [:error :code])))
      (is (= #{"task-block-tree"} (get-in missing-result [:error :vars])))
      (is (false? (:ok? unknown-result)))
      (is (= :unknown-template-vars (get-in unknown-result [:error :code])))
      (is (= #{"extra"} (get-in unknown-result [:error :vars]))))))

(deftest test-prompt-template-reader-ignores-documentation-code-fences
  (testing "template reader ignores variable documentation code fences"
    (let [template (#'agent-command/prompt-template-from-block
                    :task
                    {:block/title agent-command/task-prompt-template-title
                     :block/children [{:block/title "```text\n'{{graph}}': Graph name\n'{{block-uuid}}': Block UUID\n'{{agent-name}}': AgentBridge name\n'{{task-block-tree}}': Task tree\n```"}
                                      {:block/title "```text\nTask {{graph}} {{block-uuid}} {{agent-name}}\n{{task-block-tree}}\n```"}]})]
      (is (= "Task {{graph}} {{block-uuid}} {{agent-name}}\n{{task-block-tree}}\n"
             template)))))

(deftest test-agent-bridge-initializes-default-prompt-templates
  (async done
         (let [calls* (atom [])
               page-uuid (uuid "33333333-3333-3333-3333-333333333333")]
           (-> (p/with-redefs [transport/invoke
                               (fn [_cfg method args]
                                 (swap! calls* conj [method args])
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & _query-args]] args]
                                     (cond
                                       (= query agent-command/agent-bridge-registry-page-query)
                                       (p/resolved [])

                                       (= query agent-command/agent-bridge-prompt-template-blocks-query)
                                       (p/resolved [])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query}))))

                                   :thread-api/apply-outliner-ops
                                   (let [[_ ops _] args]
                                     (if (= [[:create-page [agent-command/agent-bridge-registry-page {}]]] ops)
                                       (p/resolved [agent-command/agent-bridge-registry-page page-uuid])
                                       (p/resolved {:ok true})))

                                   :thread-api/pull
                                   (p/resolved {:db/id 300
                                                :block/uuid page-uuid
                                                :block/title agent-command/agent-bridge-registry-page})

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (p/let [templates (agent-command/ensure-agent-bridge-prompt-templates!
                                    {:root-dir "/tmp/logseq"}
                                    "logseq_db_demo")]
                   (is (string/includes? (:task templates) "{{task-block-tree}}"))
                   (is (string/includes? (:comment templates) "{{requesting-comment}}"))
                   (let [insert-ops (->> @calls*
                                         (filter #(= :thread-api/apply-outliner-ops (first %)))
                                         (mapv (comp second second)))]
                     (is (= [[:create-page [agent-command/agent-bridge-registry-page {}]]]
                            (first insert-ops)))
                     (let [inserted-blocks (-> (second insert-ops) first second first)
                           root-blocks (filter #(nil? (:block/parent %)) inserted-blocks)
                           root-uuids (set (map :block/uuid root-blocks))
                           child-blocks (remove #(nil? (:block/parent %)) inserted-blocks)]
                       (is (= #{agent-command/task-prompt-template-title
                                agent-command/comment-prompt-template-title}
                              (set (map :block/title root-blocks))))
                       (is (= 8 (count inserted-blocks)))
                       (is (some #(string/includes? (:block/title %) "```text\n'{{graph}}'")
                                 child-blocks))
                       (is (not-any? #(re-find #"- \{\{[A-Za-z0-9-]+\}\}:"
                                               (:block/title %))
                                     child-blocks))
                       (is (every? #(contains? root-uuids (second (:block/parent %))) child-blocks))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-agent-bridge-ignores-recycled-registry-page
  (async done
         (let [calls* (atom [])
               recycled-page {:db/id 188
                              :block/uuid (uuid "22222222-2222-2222-2222-222222222222")
                              :block/name "agentbridge"
                              :block/title agent-command/agent-bridge-registry-page
                              :block/parent {:db/id 183
                                             :logseq.property/deleted-at 1}}
               live-page-uuid (uuid "33333333-3333-3333-3333-333333333333")
               live-page {:db/id 300
                          :block/uuid live-page-uuid
                          :block/name "agentbridge"
                          :block/title agent-command/agent-bridge-registry-page}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_cfg method args]
                                 (swap! calls* conj [method args])
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & _query-args]] args]
                                     (cond
                                       (= query agent-command/agent-bridge-registry-page-query)
                                       (p/resolved [recycled-page])

                                       (= query agent-command/agent-bridge-prompt-template-blocks-query)
                                       (p/resolved [])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query}))))

                                   :thread-api/apply-outliner-ops
                                   (let [[_ ops _] args]
                                     (if (= [[:create-page [agent-command/agent-bridge-registry-page {}]]] ops)
                                       (p/resolved [agent-command/agent-bridge-registry-page live-page-uuid])
                                       (p/resolved {:ok true})))

                                   :thread-api/pull
                                   (p/resolved live-page)

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (p/let [templates (agent-command/ensure-agent-bridge-prompt-templates!
                                    {:root-dir "/tmp/logseq"}
                                    "logseq_db_demo")]
                   (is (string/includes? (:task templates) "{{task-block-tree}}"))
                   (is (some #(= [:thread-api/apply-outliner-ops
                                  ["logseq_db_demo"
                                   [[:create-page [agent-command/agent-bridge-registry-page {}]]]
                                   {}]]
                                 %)
                             @calls*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-agent-bridge-repairs-template-root-without-code-block
  (async done
         (let [calls* (atom [])
               page-uuid (uuid "33333333-3333-3333-3333-333333333333")
               comment-template-uuid (uuid "44444444-4444-4444-4444-444444444444")
               page {:db/id 300
                     :block/uuid page-uuid
                     :block/title agent-command/agent-bridge-registry-page}
               broken-comment-template {:db/id 401
                                        :block/uuid comment-template-uuid
                                        :block/title agent-command/comment-prompt-template-title}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_cfg method args]
                                 (swap! calls* conj [method args])
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & _query-args]] args]
                                     (cond
                                       (= query agent-command/agent-bridge-registry-page-query)
                                       (p/resolved [page])

                                       (= query agent-command/agent-bridge-prompt-template-blocks-query)
                                       (p/resolved [broken-comment-template])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query}))))

                                   :thread-api/apply-outliner-ops
                                   (p/resolved {:ok true})

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (p/let [templates (agent-command/ensure-agent-bridge-prompt-templates!
                                    {:root-dir "/tmp/logseq"}
                                    "logseq_db_demo")]
                   (is (string/includes? (:task templates) "{{task-block-tree}}"))
                   (is (string/includes? (:comment templates) "{{requesting-comment}}"))
                   (let [insert-ops (->> @calls*
                                         (filter #(= :thread-api/apply-outliner-ops (first %)))
                                         (mapv (comp second second)))
                         child-repair-op (first (filter #(= comment-template-uuid
                                                            (-> % first second second))
                                                        insert-ops))]
                     (is (some? child-repair-op))
                     (is (some #(string/includes? (:block/title %) "{{requesting-comment}}")
                               (-> child-repair-op first second first))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-agent-bridge-template-initialization-lints-existing-page
  (async done
         (let [bad-template-block {:db/id 401
                                   :block/title agent-command/task-prompt-template-title
                                   :block/children [{:db/id 402
                                                     :block/title "```text\nTask {{graph}} {{block-uuid}} {{agent-name}} {{unknown}}\n```"}]}
               page {:db/id 300
                     :block/uuid (uuid "33333333-3333-3333-3333-333333333333")
                     :block/title agent-command/agent-bridge-registry-page}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_cfg method args]
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & _query-args]] args]
                                     (cond
                                       (= query agent-command/agent-bridge-registry-page-query)
                                       (p/resolved [page])

                                       (= query agent-command/agent-bridge-prompt-template-blocks-query)
                                       (p/resolved [bad-template-block])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query}))))

                                   :thread-api/apply-outliner-ops
                                   (p/resolved {:ok true})

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (agent-command/ensure-agent-bridge-prompt-templates!
                  {:root-dir "/tmp/logseq"}
                  "logseq_db_demo"))
               (p/then (fn [_]
                         (is false "expected template lint to fail")))
               (p/catch (fn [e]
                          (is (= :agent-prompt-template-invalid
                                 (:code (ex-data e))))
                          (is (= :task
                                 (:template (ex-data e))))))
               (p/finally done)))))

(deftest test-default-master-prompt-documents-routing-policy
  (let [prompt (#'agent-command/default-master-prompt)]
    (doseq [expected ["Do not operate outside the target graph."
                      "Only the master agent may write task results back into the target graph."
                      "Subagents may read graph context but must not write graph content."
                      "When dispatching a subagent for a task, write the subagent Codex session id to the task block's `:logseq.property.agent/session-id` property."
                      "Child task blocks and comment requests under a task with `:logseq.property.agent/session-id` must continue in that same subagent session."
                      "When the task or subagent finishes, remove the `eyes` reaction from the task block whether it succeeded or failed."
                      "If the target graph is sync-enabled, make sure it is synced after writing back to the graph."
                      "| Simple | Translation, rewrite, small lookup, simple search | Fresh temporary directory | No project writes | Can run concurrently |"
                      "| Read-only project | Code review, code explanation, implementation lookup | Project directory | No writes | Can run concurrently |"
                      "| Read/write project | Bug fix, feature implementation, test update | Project directory on new branch from `origin/master` | Writes allowed after branch setup | Only one at a time |"
                      "Writable project subagents must start from `origin/master` and create a new branch before modifying the project."
                      "Serialize writable project subagents; keep only one writable project subagent active at a time."
                      "Keep graph reports short unless a blocker occurs."
                      "Report root cause and Steps to verify only for bug fixes."]]
      (is (string/includes? prompt expected)))))

(deftest test-agent-bridge-initializes-master-prompt-on-empty-agent-page
  (async done
         (let [calls* (atom [])
               agent-page {:db/id 400
                           :block/uuid (uuid "44444444-4444-4444-4444-444444444444")
                           :block/name "build-host"
                           :block/title "build-host"}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_ method args]
                                 (swap! calls* conj [method args])
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & query-args]] args]
                                     (cond
                                       (and (= query agent-command/registered-agent-query)
                                            (= ["build-host"] query-args))
                                       (p/resolved [agent-page])

                                       (= query agent-command/agent-master-prompt-blocks-query)
                                       (p/resolved [])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query
                                                             :query-args query-args}))))

                                   :thread-api/apply-outliner-ops
                                   (p/resolved {:ok true})

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (p/let [prompt (agent-command/ensure-agent-master-prompt!
                                 {:root-dir "/tmp/logseq"}
                                 "logseq_db_demo"
                                 "build-host")]
                   (is (string/includes? prompt "Only the master agent may write task results back"))
                   (let [insert-op (some (fn [[method args]]
                                           (when (= :thread-api/apply-outliner-ops method)
                                             (second args)))
                                         @calls*)
                         inserted-blocks (-> insert-op first second first)
                         wrapper (some #(when (= agent-command/master-prompt-wrapper-title
                                                 (:block/title %))
                                          %)
                                       inserted-blocks)
                         prompt-block (some #(when (some #{:logseq.class/Code-block}
                                                         (:block/tags %))
                                               %)
                                            inserted-blocks)]
                     (is (= [[:insert-blocks [inserted-blocks
                                              (:block/uuid agent-page)
                                              {:outliner-op :insert-blocks
                                               :sibling? false
                                               :bottom? false
                                               :keep-uuid? true}]]]
                            insert-op))
                     (is (some? wrapper))
                     (is (some? prompt-block))
                     (is (string/includes? (:block/title prompt-block)
                                           "Only the master agent may write task results back"))
                     (is (= :code (:logseq.property.node/display-type prompt-block)))
                     (is (= "markdown" (:logseq.property.code/lang prompt-block)))
                     (is (= (:block/uuid wrapper)
                            (second (:block/parent prompt-block)))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-agent-bridge-reads-initialized-master-prompt-on-next-start
  (async done
         (let [inserted-blocks* (atom nil)
               agent-page {:db/id 400
                           :block/uuid (uuid "44444444-4444-4444-4444-444444444444")
                           :block/name "build-host"
                           :block/title "build-host"}
               inserted-master-blocks (fn [blocks]
                                        (let [wrapper (first (filter #(= agent-command/master-prompt-wrapper-title
                                                                         (:block/title %))
                                                                     blocks))]
                                          [(assoc wrapper
                                                  :block/order "a0"
                                                  :block/_parent (filter #(= [:block/uuid (:block/uuid wrapper)]
                                                                             (:block/parent %))
                                                                         blocks))]))]
           (-> (p/with-redefs [transport/invoke
                               (fn [_ method args]
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & query-args]] args]
                                     (cond
                                       (and (= query agent-command/registered-agent-query)
                                            (= ["build-host"] query-args))
                                       (p/resolved [agent-page])

                                       (= query agent-command/agent-master-prompt-blocks-query)
                                       (p/resolved (if-let [blocks @inserted-blocks*]
                                                     (inserted-master-blocks blocks)
                                                     []))

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query
                                                             :query-args query-args}))))

                                   :thread-api/apply-outliner-ops
                                   (let [[_ [[_ [blocks]]]] args]
                                     (reset! inserted-blocks* blocks)
                                     (p/resolved {:ok true}))

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (p/let [first-prompt (agent-command/ensure-agent-master-prompt!
                                       {:root-dir "/tmp/logseq"}
                                       "logseq_db_demo"
                                       "build-host")
                         second-prompt (agent-command/ensure-agent-master-prompt!
                                        {:root-dir "/tmp/logseq"}
                                        "logseq_db_demo"
                                        "build-host")]
                   (is (= first-prompt second-prompt))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-agent-bridge-keeps-existing-master-prompt-code-block
  (async done
         (let [calls* (atom [])
               agent-page {:db/id 400
                           :block/uuid (uuid "44444444-4444-4444-4444-444444444444")
                           :block/name "build-host"
                           :block/title "build-host"}
               custom-prompt "Custom master prompt"
               prompt-block {:db/id 402
                             :block/uuid (uuid "66666666-6666-6666-6666-666666666666")
                             :block/title custom-prompt
                             :block/tags [{:db/ident :logseq.class/Code-block
                                           :block/title "Code"}]}
               wrapper {:db/id 401
                        :block/uuid (uuid "55555555-5555-5555-5555-555555555555")
                        :block/title agent-command/master-prompt-wrapper-title
                        :block/order "a0"
                        :block/_parent [prompt-block]}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_ method args]
                                 (swap! calls* conj [method args])
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & query-args]] args]
                                     (cond
                                       (and (= query agent-command/registered-agent-query)
                                            (= ["build-host"] query-args))
                                       (p/resolved [agent-page])

                                       (= query agent-command/agent-master-prompt-blocks-query)
                                       (p/resolved [wrapper])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query
                                                             :query-args query-args}))))

                                   :thread-api/apply-outliner-ops
                                   (p/rejected (ex-info "should not write existing prompt"
                                                        {:args args}))

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (p/let [prompt (agent-command/ensure-agent-master-prompt!
                                 {:root-dir "/tmp/logseq"}
                                 "logseq_db_demo"
                                 "build-host")]
                   (is (= custom-prompt prompt))
                   (is (not-any? #(= :thread-api/apply-outliner-ops (first %)) @calls*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-agent-bridge-master-prompt-fails-on-plain-fenced-child
  (async done
         (let [agent-page {:db/id 400
                           :block/uuid (uuid "44444444-4444-4444-4444-444444444444")
                           :block/name "build-host"
                           :block/title "build-host"}
               prompt-block {:db/id 402
                             :block/uuid (uuid "66666666-6666-6666-6666-666666666666")
                             :block/title "```markdown\nPlain fenced prompt\n```"}
               wrapper {:db/id 401
                        :block/uuid (uuid "55555555-5555-5555-5555-555555555555")
                        :block/title agent-command/master-prompt-wrapper-title
                        :block/order "a0"
                        :block/_parent [prompt-block]}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_ method args]
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & query-args]] args]
                                     (cond
                                       (and (= query agent-command/registered-agent-query)
                                            (= ["build-host"] query-args))
                                       (p/resolved [agent-page])

                                       (= query agent-command/agent-master-prompt-blocks-query)
                                       (p/resolved [wrapper])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query
                                                             :query-args query-args}))))

                                   :thread-api/apply-outliner-ops
                                   (p/rejected (ex-info "should not accept plain fenced prompt"
                                                        {:args args}))

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (agent-command/ensure-agent-master-prompt!
                  {:root-dir "/tmp/logseq"}
                  "logseq_db_demo"
                  "build-host"))
               (p/then (fn [_]
                         (is false "expected plain fenced master prompt to fail")))
               (p/catch (fn [e]
                          (is (= :agent-master-prompt-invalid (:code (ex-data e))))
                          (is (= :missing-master-prompt-code-block (:reason (ex-data e))))))
               (p/finally done)))))

(deftest test-agent-bridge-master-prompt-fails-on-invalid-first-block
  (async done
         (let [agent-page {:db/id 400
                           :block/uuid (uuid "44444444-4444-4444-4444-444444444444")
                           :block/name "build-host"
                           :block/title "build-host"}
               malformed-wrapper {:db/id 401
                                  :block/uuid (uuid "55555555-5555-5555-5555-555555555555")
                                  :block/title "Not a prompt"
                                  :block/order "a0"
                                  :block/_parent [{:db/id 402
                                                   :block/uuid (uuid "66666666-6666-6666-6666-666666666666")
                                                   :block/title "```markdown\nWrong prompt\n```"}]}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_ method args]
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & query-args]] args]
                                     (cond
                                       (and (= query agent-command/registered-agent-query)
                                            (= ["build-host"] query-args))
                                       (p/resolved [agent-page])

                                       (= query agent-command/agent-master-prompt-blocks-query)
                                       (p/resolved [malformed-wrapper])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query
                                                             :query-args query-args}))))

                                   :thread-api/apply-outliner-ops
                                   (p/rejected (ex-info "should not repair invalid first block"
                                                        {:args args}))

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (agent-command/ensure-agent-master-prompt!
                  {:root-dir "/tmp/logseq"}
                  "logseq_db_demo"
                  "build-host"))
               (p/then (fn [_]
                         (is false "expected invalid master prompt to fail")))
               (p/catch (fn [e]
                          (is (= :agent-master-prompt-invalid (:code (ex-data e))))
                          (is (= :invalid-master-prompt-wrapper (:reason (ex-data e))))))
               (p/finally done)))))

(deftest test-agent-bridge-master-prompt-fails-on-nested-prompt-code
  (async done
         (let [agent-page {:db/id 400
                           :block/uuid (uuid "44444444-4444-4444-4444-444444444444")
                           :block/name "build-host"
                           :block/title "build-host"}
               nested-prompt {:db/id 403
                              :block/uuid (uuid "77777777-7777-7777-7777-777777777777")
                              :block/title "Nested prompt"
                              :block/tags [{:db/ident :logseq.class/Code-block
                                            :block/title "Code"}]}
               wrapper {:db/id 401
                        :block/uuid (uuid "55555555-5555-5555-5555-555555555555")
                        :block/title agent-command/master-prompt-wrapper-title
                        :block/order "a0"
                        :block/_parent [{:db/id 402
                                         :block/uuid (uuid "66666666-6666-6666-6666-666666666666")
                                         :block/title "Prompt notes"
                                         :block/_parent [nested-prompt]}]}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_ method args]
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & query-args]] args]
                                     (cond
                                       (and (= query agent-command/registered-agent-query)
                                            (= ["build-host"] query-args))
                                       (p/resolved [agent-page])

                                       (= query agent-command/agent-master-prompt-blocks-query)
                                       (p/resolved [wrapper])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query
                                                             :query-args query-args}))))

                                   :thread-api/apply-outliner-ops
                                   (p/rejected (ex-info "should not repair invalid prompt shape"
                                                        {:args args}))

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (agent-command/ensure-agent-master-prompt!
                  {:root-dir "/tmp/logseq"}
                  "logseq_db_demo"
                  "build-host"))
               (p/then (fn [_]
                         (is false "expected nested master prompt code to fail")))
               (p/catch (fn [e]
                          (is (= :agent-master-prompt-invalid (:code (ex-data e))))
                          (is (= :missing-master-prompt-code-block (:reason (ex-data e))))))
               (p/finally done)))))

(deftest test-agent-bridge-master-prompt-ignores-recycled-first-block
  (async done
         (let [calls* (atom [])
               agent-page {:db/id 400
                           :block/uuid (uuid "44444444-4444-4444-4444-444444444444")
                           :block/name "build-host"
                           :block/title "build-host"}
               recycled-wrapper {:db/id 401
                                 :block/uuid (uuid "55555555-5555-5555-5555-555555555555")
                                 :block/title "Recycled bad prompt"
                                 :block/order "a0"
                                 :block/parent {:db/id 499
                                                :logseq.property/deleted-at 1}}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_ method args]
                                 (swap! calls* conj [method args])
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & query-args]] args]
                                     (cond
                                       (and (= query agent-command/registered-agent-query)
                                            (= ["build-host"] query-args))
                                       (p/resolved [agent-page])

                                       (= query agent-command/agent-master-prompt-blocks-query)
                                       (p/resolved [recycled-wrapper])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query
                                                             :query-args query-args}))))

                                   :thread-api/apply-outliner-ops
                                   (p/resolved {:ok true})

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (p/let [prompt (agent-command/ensure-agent-master-prompt!
                                 {:root-dir "/tmp/logseq"}
                                 "logseq_db_demo"
                                 "build-host")]
                   (is (string/includes? prompt "Only the master agent may write task results back"))
                   (is (some #(= :thread-api/apply-outliner-ops (first %)) @calls*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-master-dispatch-prompts
  (testing "task dispatch prompt is deterministic and scoped"
    (let [prompt (#'agent-command/build-master-task-dispatch-prompt
                  {:graph "demo"
                   :agent-name "build-host"
                   :project-dir "/repo/logseq"
                   :block (task-block {})
                   :tree-text "- Ship the CLI bridge\n  - Add tests"})]
      (doseq [expected ["You are handling a Logseq AgentBridge master dispatch request."
                        "Request kind: task"
                        "Graph: demo"
                        "AgentBridge name: build-host"
                        "Block UUID: 11111111-1111-1111-1111-111111111111"
                        "Project directory: /repo/logseq"
                        "Do not operate outside the target graph."
                        "Only the master agent may write task results back into the target graph."
                        "Write task results back into the graph."
                        "When the task or subagent finishes, remove the `eyes` reaction from the task block whether it succeeded or failed."
                        "If the target graph is sync-enabled, make sure it is synced after writing back to the graph."
                        "Keep the report short when possible."
                        "Report blockers only if there is a blocker."
                        "Report root cause and Steps to verify only for bug fixes."
                        "After launching the subagent with `codex exec`, write that subagent session id to the task block's `:logseq.property.agent/session-id` property."
                        "Task block tree:"
                        "- Ship the CLI bridge\n  - Add tests"]]
        (is (string/includes? prompt expected)))
      (is (not (string/includes? prompt "unrelated graph data")))))
  (testing "comment dispatch prompt includes comment and target context"
    (let [prompt (#'agent-command/build-master-comment-dispatch-prompt
                  {:graph "demo"
                   :agent-name "build-host"
                   :project-dir "/repo/logseq"
                   :comment (comment-block {})
                   :target-tree-texts ["- Target block A" "- Target block B"]
                   :comments-area-tree-text "- Comments\n  - [[build-host]] please summarize"
                   :comment-tree-text "- [[build-host]] please summarize"})]
      (doseq [expected ["You are handling a Logseq AgentBridge master dispatch request."
                        "Request kind: comment"
                        "Graph: demo"
                        "Comment UUID: 55555555-5555-5555-5555-555555555555"
                        "AgentBridge name: build-host"
                        "Project directory: /repo/logseq"
                        "Complete the request from the mentioned comment."
                        "If the target graph is sync-enabled, make sure it is synced after writing back to the graph."
                        "Keep the report short when possible."
                        "Report blockers only if there is a blocker."
                        "Report root cause and Steps to verify only for bug fixes."
                        "Comment target context:"
                        "- Target block A\n- Target block B"
                        "Comment thread context:"
                        "- Comments\n  - [[build-host]] please summarize"
                        "Requesting comment:"
                        "- [[build-host]] please summarize"
                        "Reply instructions:"
                        "For a short reply, append a comment after the requesting comment."
                        "For a long reply, write a normal block tree after the comments area and append a comment that references that tree."
                        "When referencing result blocks in DB graphs, reference result blocks with [[block-uuid]], not ((block-uuid))."
                        "If the request is blocked or fails, make that clear in the reply."]]
        (is (string/includes? prompt expected)))
      (is (not (string/includes? prompt "Task block tree:"))))))

(deftest test-master-task-dispatch-prompt-omits-inherited-session-for-root-task
  (let [prompt (#'agent-command/build-master-task-dispatch-prompt
                {:graph "demo"
                 :agent-name "build-host"
                 :project-dir "/repo/logseq"
                 :block (task-block {})
                 :tree-text "- Ship the CLI bridge"})]
    (is (not (string/includes? prompt "Inherited parent task UUID:")))
    (is (not (string/includes? prompt "Inherited subagent session id:")))
    (is (not (string/includes? prompt "Continue this child task")))))

(deftest test-agent-bridge-master-session-starts-without-local-session-store
  (async done
         (let [root (temp-root)
               session-store-path (node-path/join root "agent-bridge-sessions.edn")
               session-counter* (atom 0)
               calls* (atom [])]
           (try
             (-> (p/with-redefs [agent-command/start-codex!
                                 (fn [command _opts]
                                   (swap! calls* conj [:codex command])
                                   (p/resolved {:session (str "master-session-" (swap! session-counter* inc))
                                                :status :running}))]
                   (p/let [started (#'agent-command/ensure-master-session!
                                    {:root-dir root}
                                    {:graph "demo"
                                     :agent-name "build-host"
                                     :master-prompt "Master prompt"})
                           resumed (#'agent-command/ensure-master-session!
                                    {:root-dir root}
                                    {:graph "demo"
                                     :agent-name "build-host"
                                     :master-prompt "Changed prompt"})]
                     (is (= "master-session-1" (:session started)))
                     (is (= "master-session-2" (:session resumed)))
                     (is (= [[:codex (conj codex-exec-prefix "Master prompt")]
                             [:codex (conj codex-exec-prefix "Changed prompt")]]
                            @calls*))
                     (is (false? (fs/existsSync session-store-path)))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (fs/rmSync root #js {:recursive true :force true})
                              (done))))
             (catch :default e
               (fs/rmSync root #js {:recursive true :force true})
               (is false (str "unexpected setup error: " e))
               (done))))))

(deftest test-agent-bridge-listener-routes-id-valued-task-routability-datoms
  (async done
         (let [calls* (atom [])
               task (task-block {})
               route-opts {:repo "logseq_db_demo"
                           :graph "demo"
                           :agent-name "build-host"
                           :master-session "master-session-123"
                           :routing-blocks* (atom #{})}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_cfg method args]
                                 (swap! calls* conj [method args])
                                 (case method
                                   :thread-api/pull
                                   (let [[_repo _selector lookup] args]
                                     (case lookup
                                       42 (p/resolved task)
                                       900 (p/resolved {:db/id 900
                                                        :db/ident :logseq.class/Task})
                                       901 (p/resolved {:db/id 901
                                                        :db/ident :logseq.property/status.todo})
                                       (p/rejected (ex-info "unexpected pull"
                                                            {:lookup lookup}))))

                                   :thread-api/q
                                   (p/resolved :logseq.property/status.todo)

                                   :thread-api/apply-outliner-ops
                                   (p/resolved {:ok true})

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))
                               show-command/execute-show
                               (fn [_action _cfg]
                                 (p/resolved {:status :ok
                                              :data {:message "- Ship the CLI bridge"}}))
                               cli-server/ensure-server!
                               (fn [cfg _repo]
                                 (assoc cfg :base-url "http://127.0.0.1:1234"))
                               agent-command/start-codex!
                               (fn [command _opts]
                                 (swap! calls* conj [:codex command])
                                 (p/resolved {:session "master-session-123"
                                              :status :running}))
                               agent-command/write-agent-session-id!
                               (fn [_cfg _repo _block-uuid _session-id]
                                 (p/resolved true))]
                 (#'agent-command/process-sync-db-changes-event!
                  {:root-dir "/tmp/logseq"
                   :base-url "http://127.0.0.1:1234"
                   :log-fn (fn [_] nil)}
                  route-opts
                  {:tx-data [{:e 42
                              :a :block/tags
                              :v 900
                              :added true}
                             {:e 42
                              :a :logseq.property/status
                              :v 901
                              :added true}]}))
               (p/then (fn [_]
                         (let [[_ command] (some #(when (= :codex (first %)) %) @calls*)]
                           (is (= (conj codex-resume-prefix "master-session-123")
                                  (vec (take 8 command)))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(defn- expected-task-started-ops
  [block-uuid]
  [[[:toggle-reaction [block-uuid "eyes" nil]]]
   [[:batch-set-property [[block-uuid] :logseq.property/status :logseq.property/status.doing {}]]]])

(defn- assert-task-event-dispatches-to-master-session!
  [done payload]
  (let [calls* (atom [])
        task (task-block {})
        route-opts {:repo "logseq_db_demo"
                    :graph "demo"
                    :agent-name "build-host"
                    :master-session "master-session-123"
                    :routing-blocks* (atom #{})}]
    (-> (p/with-redefs [transport/invoke
                        (fn [_cfg method args]
                          (swap! calls* conj [method args])
                          (case method
                            :thread-api/pull
                            (let [[_repo _selector lookup] args]
                              (case lookup
                                42 (p/resolved task)
                                900 (p/resolved {:db/id 900
                                                 :db/ident :logseq.class/Task})
                                901 (p/resolved {:db/id 901
                                                 :db/ident :logseq.property/status.todo})
                                (p/rejected (ex-info "unexpected pull"
                                                     {:lookup lookup}))))

                            :thread-api/q
                            (if (string/includes? (pr-str args) ":logseq.property/status")
                              (p/resolved :logseq.property/status.todo)
                              (p/resolved nil))

                            :thread-api/apply-outliner-ops
                            (p/resolved {:ok true})

                            (p/rejected (ex-info "unexpected invoke"
                                                 {:method method
                                                  :args args}))))
                        show-command/execute-show
                        (fn [_action _cfg]
                          (p/resolved {:status :ok
                                       :data {:message "- Ship the CLI bridge"}}))
                        agent-command/start-codex!
                        (fn [command _opts]
                          (swap! calls* conj [:codex command])
                          (p/resolved {:session "master-session-123"
                                       :status :running}))]
          (#'agent-command/process-sync-db-changes-event!
           {:root-dir "/tmp/logseq"
            :base-url "http://127.0.0.1:1234"
            :log-fn (fn [_] nil)}
           route-opts
           payload))
        (p/then (fn [_]
                  (let [[_ command] (some #(when (= :codex (first %)) %) @calls*)]
                    (is (= codex-resume-prefix
                           (vec (take (count codex-resume-prefix) command))))
                    (is (= "master-session-123"
                           (nth command (count codex-resume-prefix))))
                    (is (string/includes? (last command) "Request kind: task"))
                    (is (string/includes? (last command) "- Ship the CLI bridge")))
                  (is (= (expected-task-started-ops (:block/uuid task))
                         (mapv (comp second second)
                               (filter #(= :thread-api/apply-outliner-ops (first %)) @calls*))))))
        (p/catch (fn [e]
                   (is false (str "unexpected error: " e))))
        (p/finally done))))

(deftest test-agent-bridge-listener-dispatches-task-event-to-master-session
  (async done
         (assert-task-event-dispatches-to-master-session!
          done
          {:tx-data [{:e 42
                      :a :block/tags
                      :v 900
                      :added true}
                     {:e 42
                      :a :logseq.property/status
                      :v 901
                      :added true}]})))

(deftest test-agent-bridge-listener-dispatches-task-event-from-lightweight-summary
  (async done
         (assert-task-event-dispatches-to-master-session!
          done
          {:task-route-candidate-ids [42]})))

(deftest test-agent-bridge-listener-includes-inherited-parent-session-for-child-task
  (async done
         (let [calls* (atom [])
               parent-uuid (uuid "22222222-2222-2222-2222-222222222222")
               child-task (task-block {:block/title "Follow up in same subagent"
                                       :block/parent {:db/id 700}})
               parent-task {:db/id 700
                            :block/uuid parent-uuid
                            :block/title "Parent task"
                            :block/tags [{:db/ident :logseq.class/Task
                                          :block/title "Task"}]
                            :logseq.property.agent/session-id "subagent-session-123"
                            :block/parent {:db/id 800}}
               route-opts {:repo "logseq_db_demo"
                           :graph "demo"
                           :agent-name "build-host"
                           :master-session "master-session-123"
                           :routing-blocks* (atom #{})}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_cfg method args]
                                 (swap! calls* conj [method args])
                                 (case method
                                   :thread-api/pull
                                   (let [[_repo _selector lookup] args]
                                     (case lookup
                                       42 (p/resolved child-task)
                                       700 (p/resolved parent-task)
                                       900 (p/resolved {:db/id 900
                                                        :db/ident :logseq.class/Task})
                                       901 (p/resolved {:db/id 901
                                                        :db/ident :logseq.property/status.todo})
                                       (p/rejected (ex-info "unexpected pull"
                                                            {:lookup lookup}))))

                                   :thread-api/q
                                   (if (string/includes? (pr-str args) ":logseq.property/status")
                                     (p/resolved :logseq.property/status.todo)
                                     (p/resolved nil))

                                   :thread-api/apply-outliner-ops
                                   (p/resolved {:ok true})

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))
                               show-command/execute-show
                               (fn [_action _cfg]
                                 (p/resolved {:status :ok
                                              :data {:message "- Follow up in same subagent"}}))
                               agent-command/start-codex!
                               (fn [command _opts]
                                 (swap! calls* conj [:codex command])
                                 (p/resolved {:session "master-session-123"
                                              :status :running}))]
                 (#'agent-command/process-sync-db-changes-event!
                  {:root-dir "/tmp/logseq"
                   :base-url "http://127.0.0.1:1234"
                   :log-fn (fn [_] nil)}
                  route-opts
                  {:tx-data [{:e 42
                              :a :block/tags
                              :v 900
                              :added true}
                             {:e 42
                              :a :logseq.property/status
                              :v 901
                              :added true}]}))
               (p/then (fn [_]
                         (let [[_ command] (some #(when (= :codex (first %)) %) @calls*)
                               prompt (last command)]
                           (is (string/includes? prompt "Request kind: task"))
                           (is (string/includes? prompt (str "Inherited parent task UUID: " parent-uuid)))
                           (is (string/includes? prompt "Inherited subagent session id: subagent-session-123"))
                           (is (string/includes? prompt "Continue this child task in the inherited subagent session instead of launching a new subagent."))
                           (is (string/includes? prompt "- Follow up in same subagent")))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-agent-bridge-task-route-requires-master-session
  (async done
         (let [codex-started?* (atom false)
               block (task-block {})
               route-opts {:repo "logseq_db_demo"
                           :graph "demo"
                           :agent-name "build-host"
                           :prompt-templates {:task "Task {{graph}} {{block-uuid}} {{agent-name}}\n{{task-block-tree}}"}
                           :routing-blocks* (atom #{})}]
           (-> (p/with-redefs [agent-command/start-codex!
                               (fn [_command _opts]
                                 (reset! codex-started?* true)
                                 (p/resolved {:session "session-123"
                                              :status :running}))
                               agent-command/write-agent-session-id!
                               (fn [_cfg _repo _block-uuid _session-id]
                                 (p/resolved true))
                               transport/invoke
                               (fn [_ method _args]
                                 (case method
                                   :thread-api/q (p/resolved nil)
                                   :thread-api/apply-outliner-ops (p/resolved {:ok true})
                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method}))))
                               cli-server/ensure-server!
                               (fn [cfg _repo]
                                 (assoc cfg :base-url "http://127.0.0.1:1234"))]
                 (#'agent-command/route-task-once!
                  {:root-dir "/tmp/logseq"}
                  route-opts
                  {:block block
                   :tree-text "- Ship the CLI bridge"}))
               (p/then (fn [_]
                         (is false "expected task route without master-session to fail")))
               (p/catch (fn [e]
                          (is (= :agent-bridge-master-session-required (:code (ex-data e))))
                          (is (= :task (:request (ex-data e))))
                          (is (false? @codex-started?*))))
               (p/finally done)))))

(deftest test-agent-bridge-comment-route-requires-master-session
  (async done
         (let [codex-started?* (atom false)
               request-comment (comment-block {})
               comments-area (comments-area-block {})
               route-opts {:repo "logseq_db_demo"
                           :graph "demo"
                           :agent-name "build-host"
                           :prompt-templates {:comment "Comment {{graph}} {{comment-uuid}} {{agent-name}}\n{{comment-target-context}}\n{{comment-thread-context}}\n{{requesting-comment}}"}
                           :routing-blocks* (atom #{})}]
           (-> (p/with-redefs [agent-command/start-codex!
                               (fn [_command _opts]
                                 (reset! codex-started?* true)
                                 (p/resolved {:session "comment-session-123"
                                              :status :running}))
                               transport/invoke
                               (fn [_ method args]
                                 (case method
                                   :thread-api/pull
                                   (let [[_repo _selector lookup] args]
                                     (if (= (:db/id (:block/parent request-comment)) lookup)
                                       (p/resolved comments-area)
                                       (p/rejected (ex-info "unexpected pull"
                                                            {:lookup lookup}))))

                                   :thread-api/q
                                   (p/resolved nil)

                                   :thread-api/apply-outliner-ops
                                   (p/resolved {:ok true})

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))
                               show-command/execute-show
                               (fn [_action _cfg]
                                 (p/resolved {:status :ok
                                              :data {:message "- comment context"}}))
                               cli-server/ensure-server!
                               (fn [cfg _repo]
                                 (assoc cfg :base-url "http://127.0.0.1:1234"))]
                 (#'agent-command/route-comment-once!
                  {:root-dir "/tmp/logseq"}
                  route-opts
                  request-comment))
               (p/then (fn [_]
                         (is false "expected comment route without master-session to fail")))
               (p/catch (fn [e]
                          (is (= :agent-bridge-master-session-required (:code (ex-data e))))
                          (is (= :comment (:request (ex-data e))))
                          (is (false? @codex-started?*))))
               (p/finally done)))))

(deftest test-agent-bridge-listener-dispatches-comment-event-to-master-session
  (async done
         (let [root (temp-root)
               calls (atom [])
               request-comment (comment-block {})
               comments-area (comments-area-block {})
               comment-uuid (:block/uuid request-comment)
               tree-by-uuid {"55555555-5555-5555-5555-555555555555"
                             "- [[build-host]] please summarize the selected blocks"
                             "66666666-6666-6666-6666-666666666666"
                             "- Comments\n  - [[build-host]] please summarize the selected blocks"
                             "77777777-7777-7777-7777-777777777777"
                             "- Target block A"
                             "88888888-8888-8888-8888-888888888888"
                             "- Target block B"}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_cfg method args]
                                 (swap! calls conj [method args])
                                 (case method
                                   :thread-api/pull
                                   (let [[_repo _selector lookup] args]
                                     (case lookup
                                       50 (p/resolved request-comment)
                                       60 (p/resolved comments-area)
                                       (p/rejected (ex-info "unexpected pull"
                                                            {:lookup lookup}))))

                                   :thread-api/q
                                   (p/resolved nil)

                                   :thread-api/apply-outliner-ops
                                   (p/resolved {:ok true})

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))
                               show-command/execute-show
                               (fn [action _cfg]
                                 (p/resolved {:status :ok
                                              :data {:message (get tree-by-uuid (:uuid action))}}))
                               agent-command/start-codex!
                               (fn [command _opts]
                                 (swap! calls conj [:codex command])
                                 (p/resolved {:session "master-session-123"
                                              :status :running}))]
                 (#'agent-command/process-sync-db-changes-event!
                  {:root-dir root
                   :base-url "http://127.0.0.1:1234"
                   :log-fn (fn [_] nil)}
                  {:repo "logseq_db_demo"
                   :graph "demo"
                   :agent-name "build-host"
                   :master-session "master-session-123"
                   :routing-blocks* (atom #{})}
                  {:tx-data [{:e 50
                              :a :block/title
                              :v (:block/title request-comment)
                              :added true}]}))
               (p/then (fn [_]
                         (let [[_ command] (some #(when (= :codex (first %)) %) @calls)]
                           (is (= codex-resume-prefix
                                  (vec (take (count codex-resume-prefix) command))))
                           (is (= "master-session-123"
                                  (nth command (count codex-resume-prefix))))
                           (is (string/includes? (last command) "Request kind: comment"))
                           (is (string/includes? (last command) "Comment target context:"))
                           (is (string/includes? (last command) "- Target block A")))
                         (is (= [[:thread-api/apply-outliner-ops
                                  ["logseq_db_demo"
                                   [[:toggle-reaction [comment-uuid "eyes" nil]]]
                                   {}]]]
                                (filterv #(= :thread-api/apply-outliner-ops (first %)) @calls)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (fs/rmSync root #js {:recursive true :force true})
                            (done)))))))

(deftest test-agent-bridge-listener-routes-normalized-comment-mention-ref
  (async done
         (let [root (temp-root)
               calls (atom [])
               request-comment (comment-block {:block/title "[[aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa]] please summarize"
                                               :block/refs [{:db/id 101
                                                             :block/title "build-host"}]})
               comments-area (comments-area-block {})
               comment-uuid (:block/uuid request-comment)]
           (-> (p/with-redefs [transport/invoke
                               (fn [_cfg method args]
                                 (swap! calls conj [method args])
                                 (case method
                                   :thread-api/pull
                                   (let [[_repo _selector lookup] args]
                                     (case lookup
                                       50 (p/resolved request-comment)
                                       60 (p/resolved comments-area)
                                       (p/rejected (ex-info "unexpected pull"
                                                            {:lookup lookup}))))
                                   :thread-api/q
                                   (p/resolved nil)
                                   :thread-api/apply-outliner-ops
                                   (p/resolved {:ok true})
                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))
                               show-command/execute-show
                               (fn [_action _cfg]
                                 (p/resolved {:status :ok
                                              :data {:message "- context"}}))
                               cli-server/ensure-server!
                               (fn [cfg _repo] cfg)
                               agent-command/start-codex!
                               (fn [command _opts]
                                 (swap! calls conj [:codex command])
                                 (p/resolved {:session "comment-session-ref"
                                              :status :running}))]
                 (#'agent-command/process-sync-db-changes-event!
                  {:root-dir root
                   :base-url "http://127.0.0.1:1234"
                   :log-fn (fn [_] nil)}
                  {:repo "logseq_db_demo"
                   :graph "demo"
                   :agent-name "build-host"
                   :master-session "master-session-123"
                   :routing-blocks* (atom #{})}
                  {:tx-data [{:e 50
                              :a :block/title
                              :v (:block/title request-comment)
                              :added true}]}))
               (p/then (fn [_]
                         (is (some #(= :codex (first %)) @calls))
                         (let [[_ command] (some #(when (= :codex (first %)) %) @calls)]
                           (is (= (conj codex-resume-prefix "master-session-123")
                                  (vec (take 8 command)))))
                         (is (some #(= [:thread-api/apply-outliner-ops
                                        ["logseq_db_demo"
                                         [[:toggle-reaction [comment-uuid "eyes" nil]]]
                                         {}]]
                                       %)
                                   @calls))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (fs/rmSync root #js {:recursive true :force true})
                            (done)))))))

(deftest test-agent-bridge-listener-ignores-comment-like-title-without-comment-tag
  (async done
         (let [handler* (atom nil)
               calls (atom [])
               non-comment (comment-block {:block/tags []})]
           (-> (p/with-redefs [transport/connect-events! (fn [_cfg handler]
                                                           (reset! handler* handler)
                                                           {:close! (fn [] nil)})
                               transport/invoke (fn [_cfg method args]
                                                  (swap! calls conj [method args])
                                                  (case method
                                                    :thread-api/pull
                                                    (p/resolved non-comment)
                                                    (p/rejected (ex-info "unexpected invoke"
                                                                         {:method method
                                                                          :args args}))))
                               agent-command/start-codex! (fn [command _opts]
                                                            (swap! calls conj [:codex command])
                                                            (p/resolved {:session "should-not-run"
                                                                         :status :running}))]
                 (do
                   (#'agent-command/listen-forever! {:root-dir "/tmp/logseq"
                                                     :base-url "http://127.0.0.1:1234"
                                                     :log-fn (fn [_] nil)}
                                                    {:repo "logseq_db_demo"
                                                     :graph "demo"
                                                     :agent-name "build-host"
                                                     :master-session "master-session-123"})
                   (@handler* :sync-db-changes {:tx-data [{:e 50
                                                           :a :block/title
                                                           :v (:block/title non-comment)
                                                           :added true}]})
                   (p/let [_ (p/delay 10)]
                     (is (not-any? #(= :codex (first %)) @calls)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-codex-session-id-capture
  (testing "captures the first Codex JSONL session id"
    (is (= "session-123"
           (agent-command/parse-codex-session-id-line
            "{\"type\":\"session_configured\",\"session_id\":\"session-123\"}"))))

  (testing "captures the current Codex JSONL thread id"
    (is (= "thread-123"
           (agent-command/parse-codex-session-id-line
            "{\"type\":\"thread.started\",\"thread_id\":\"thread-123\"}"))))

  (testing "ignores non-session JSONL events"
    (is (nil? (agent-command/parse-codex-session-id-line
               "{\"type\":\"agent_message\",\"message\":\"hello\"}")))))

(deftest test-start-codex-waits-for-stdout-after-exit
  (async done
         (let [original-spawn (.-spawn child-process)]
           (set! (.-spawn child-process)
                 (fn [_bin _args _opts]
                   (let [child (events/EventEmitter.)
                         stdout (events/EventEmitter.)
                         stderr (events/EventEmitter.)]
                     (set! (.-stdout child) stdout)
                     (set! (.-stderr child) stderr)
                     (js/setTimeout (fn []
                                      (.emit child "exit" 0 nil)
                                      (.emit stdout "data" "{\"type\":\"thread.started\",\"thread_id\":\"thread-late\"}\n")
                                      (.emit stdout "close")
                                      (.emit child "close" 0 nil))
                                    0)
                     child)))
           (-> (agent-command/start-codex! ["codex" "exec" "--json" "prompt"] {})
               (p/then (fn [result]
                         (is (= {:session "thread-late"
                                 :status :running}
                                (select-keys result [:session :status])))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (set! (.-spawn child-process) original-spawn)
                            (done)))))))

(deftest test-start-codex-parses-complete-jsonl-before-later-output
  (async done
         (let [original-spawn (.-spawn child-process)]
           (set! (.-spawn child-process)
                 (fn [_bin _args _opts]
                   (let [child (events/EventEmitter.)
                         stdout (events/EventEmitter.)
                         stderr (events/EventEmitter.)]
                     (set! (.-stdout child) stdout)
                     (set! (.-stderr child) stderr)
                     (js/setTimeout (fn []
                                      (.emit stdout "data" "{\"type\":\"thread.started\",\"thread_id\":\"thread-first\"}\n")
                                      (.emit stdout "data" "{\"type\":\"turn.started\"}\n")
                                      (.emit stdout "close")
                                      (.emit child "close" 0 nil))
                                    0)
                     child)))
           (-> (agent-command/start-codex! ["codex" "exec" "--json" "prompt"] {})
               (p/then (fn [result]
                         (is (= "thread-first" (:session result)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (set! (.-spawn child-process) original-spawn)
                            (done)))))))

(deftest test-start-codex-waits-for-stdout-close-after-child-close
  (async done
         (let [original-spawn (.-spawn child-process)]
           (set! (.-spawn child-process)
                 (fn [_bin _args _opts]
                   (let [child (events/EventEmitter.)
                         stdout (events/EventEmitter.)
                         stderr (events/EventEmitter.)]
                     (set! (.-stdout child) stdout)
                     (set! (.-stderr child) stderr)
                     (js/setTimeout (fn []
                                      (.emit child "close" 0 nil)
                                      (.emit stdout "data" "{\"type\":\"thread.started\",\"thread_id\":\"thread-after-close\"}\n")
                                      (.emit stdout "close"))
                                    0)
                     child)))
           (-> (agent-command/start-codex! ["codex" "exec" "--json" "prompt"] {})
               (p/then (fn [result]
                         (is (= "thread-after-close" (:session result)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (set! (.-spawn child-process) original-spawn)
                            (done)))))))

(deftest test-registration-creates-agent-name-page
  (async done
         (let [calls* (atom [])
               registry-page-uuid (uuid "33333333-3333-3333-3333-333333333333")
               agent-page-uuid (uuid "44444444-4444-4444-4444-444444444444")]
           (-> (p/with-redefs [transport/invoke
                               (fn [_ method args]
                                 (swap! calls* conj [method args])
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & query-args]] args]
                                     (cond
                                       (= query agent-command/agent-bridge-registry-page-query)
                                       (p/resolved [])

                                       (= query agent-command/registered-agent-query)
                                       (p/resolved [])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query
                                                             :query-args query-args}))))

                                   :thread-api/apply-outliner-ops
                                   (let [[_ ops _] args]
                                     (cond
                                       (= [[:create-page [agent-command/agent-bridge-registry-page {}]]] ops)
                                       (p/resolved [agent-command/agent-bridge-registry-page registry-page-uuid])

                                       (= [[:create-page ["build-host" {}]]] ops)
                                       (p/resolved ["build-host" agent-page-uuid])

                                       :else
                                       (p/rejected (ex-info "unexpected apply-outliner-ops"
                                                            {:ops ops}))))

                                   :thread-api/pull
                                   (p/resolved {:db/id 300
                                                :block/uuid registry-page-uuid
                                                :block/title agent-command/agent-bridge-registry-page})

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (p/let [_ (agent-command/register-agent-bridge! {:root-dir "/tmp/logseq"} "logseq_db_demo" "build-host")]
                   (let [apply-ops (->> @calls*
                                        (filter #(= :thread-api/apply-outliner-ops (first %)))
                                        (mapv (comp second second)))]
                     (is (= [[:create-page [agent-command/agent-bridge-registry-page {}]]]
                            (first apply-ops)))
                     (is (= [[:create-page ["build-host" {}]]]
                            (second apply-ops)))
                     (is (not-any? #(= :insert-blocks (ffirst %)) apply-ops)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-registration-keeps-existing-agent-name-page
  (async done
         (let [calls* (atom [])
               registry-page {:db/id 300
                              :block/uuid (uuid "33333333-3333-3333-3333-333333333333")
                              :block/name "agentbridge"
                              :block/title agent-command/agent-bridge-registry-page}
               agent-page {:db/id 400
                           :block/uuid (uuid "44444444-4444-4444-4444-444444444444")
                           :block/name "build-host"
                           :block/title "build-host"}]
           (-> (p/with-redefs [transport/invoke
                               (fn [_ method args]
                                 (swap! calls* conj [method args])
                                 (case method
                                   :thread-api/q
                                   (let [[_ [query & query-args]] args]
                                     (cond
                                       (and (= query agent-command/agent-bridge-registry-page-query)
                                            (= ["agentbridge"] query-args))
                                       (p/resolved [registry-page])

                                       (and (= query agent-command/registered-agent-query)
                                            (= ["build-host"] query-args))
                                       (p/resolved [agent-page])

                                       :else
                                       (p/rejected (ex-info "unexpected query"
                                                            {:query query
                                                             :query-args query-args}))))

                                   :thread-api/apply-outliner-ops
                                   (p/rejected (ex-info "unexpected apply-outliner-ops"
                                                        {:args args}))

                                   (p/rejected (ex-info "unexpected invoke"
                                                        {:method method
                                                         :args args}))))]
                 (p/let [result (agent-command/register-agent-bridge! {:root-dir "/tmp/logseq"} "logseq_db_demo" "build-host")]
                   (is (true? result))
                   (is (not-any? #(= :thread-api/apply-outliner-ops (first %)) @calls*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-write-agent-session-id
  (async done
         (let [ops* (atom [])
               block-uuid (uuid "11111111-1111-1111-1111-111111111111")]
           (-> (p/with-redefs [transport/invoke (fn [_ method args]
                                                  (case method
                                                    :thread-api/q
                                                    (p/rejected (ex-info "agent session id is built-in and should not be queried"
                                                                         {:args args}))

                                                    :thread-api/apply-outliner-ops
                                                    (let [[_ ops _] args]
                                                      (swap! ops* into ops)
                                                      (p/resolved {:ok true}))

                                                    (p/rejected (ex-info "unexpected invoke"
                                                                         {:method method
                                                                          :args args}))))]
                 (p/let [_ (agent-command/write-agent-session-id! {:root-dir "/tmp/logseq"}
                                                                  "logseq_db_demo"
                                                                  block-uuid
                                                                  "session-123")]
                   (is (= [[:batch-set-property [[block-uuid]
                                                  :logseq.property.agent/session-id
                                                  "session-123"
                                                  {}]]]
                          @ops*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-format-agent-bridge-logs
  (let [output (cli-format/format-result {:status :ok
                                          :command :agent-bridge
                                          :data {:logs ["2026-05-16T00:00:00.000Z checking the environment ..."
                                                        "2026-05-16T00:00:01.000Z listening graph changes ..."]}}
                                         {:output-format :human})]
    (is (= "2026-05-16T00:00:00.000Z checking the environment ...\n2026-05-16T00:00:01.000Z listening graph changes ..."
           output))))

(deftest test-execute-agent-bridge-routes-task
  (async done
         (let [root (temp-root)
               calls (atom [])
               block (task-block {})]
           (try
             (p/finally
               (p/catch
                (p/with-redefs [agent-command/codex-available? (fn [_] true)
                                cli-server/ensure-server! (fn [cfg repo]
                                                            (swap! calls conj [:ensure-server (:root-dir cfg) repo])
                                                            (assoc cfg :base-url "http://127.0.0.1:1234"))
                                agent-command/register-agent-bridge! (fn [_cfg repo agent-name]
                                                                       (swap! calls conj [:register repo agent-name])
                                                                       (p/resolved true))
                                agent-command/ensure-agent-master-prompt!
                                (fn [_cfg repo agent-name]
                                  (swap! calls conj [:master-prompt repo agent-name])
                                  (p/resolved "Master prompt"))
                                agent-command/ensure-agent-bridge-prompt-templates!
                                (fn [_cfg repo]
                                  (swap! calls conj [:prompt-templates repo])
                                  (p/resolved {:task "Task {{graph}} {{block-uuid}} {{agent-name}}\n{{task-block-tree}}"
                                               :comment "Comment {{graph}} {{comment-uuid}} {{agent-name}}\n{{comment-target-context}}\n{{comment-thread-context}}\n{{requesting-comment}}"}))
                                agent-command/list-routable-tasks (fn [_cfg repo agent-name]
                                                                    (swap! calls conj [:list repo agent-name])
                                                                    (p/resolved [{:block block
                                                                                  :tree-text "- Ship the CLI bridge"}]))
                                transport/invoke (fn [_cfg method args]
                                                   (case method
                                                     :thread-api/q
                                                     (if (string/includes? (pr-str args) ":logseq.property/status")
                                                       (p/resolved :logseq.property/status.todo)
                                                       (p/resolved nil))

                                                     :thread-api/apply-outliner-ops
                                                     (let [[repo ops _] args]
                                                       (swap! calls conj [:apply-ops repo ops])
                                                       (p/resolved {:ok true}))

                                                     (p/rejected (ex-info "unexpected invoke"
                                                                          {:method method
                                                                           :args args}))))
                                agent-command/start-codex! (fn [command _opts]
                                                             (swap! calls conj [:codex command])
                                                             (p/resolved {:session "session-123"
                                                                          :status :running}))
                                agent-command/write-agent-session-id! (fn [_cfg repo block-uuid session-id]
                                                                        (swap! calls conj [:write-session repo block-uuid session-id])
                                                                        (p/resolved true))]
                  (p/let [result (agent-command/execute-bridge {:type :agent-bridge
                                                                :repo "logseq_db_demo"
                                                                :graph "demo"
                                                                :process-once? true}
                                                               {:root-dir root
                                                                :agent-name "build-host"
                                                                :log-fn (fn [_] nil)})]
                    (is (= :ok (:status result)))
                    (is (= :processed-once (get-in result [:data :mode])))
                    (is (= [[:ensure-server root "logseq_db_demo"]
                            [:register "logseq_db_demo" "build-host"]
                            [:master-prompt "logseq_db_demo" "build-host"]
                            [:prompt-templates "logseq_db_demo"]
                            [:codex (conj codex-exec-prefix "Master prompt")]
                            [:list "logseq_db_demo" "build-host"]]
                           (vec (take 6 @calls))))
                    (let [[_ dispatch-command] (some #(when (= :codex (first %)) %) (reverse @calls))]
                      (is (= codex-resume-prefix
                             (vec (take (count codex-resume-prefix) dispatch-command))))
                      (is (= "session-123"
                             (nth dispatch-command (count codex-resume-prefix))))
                      (is (string/includes? (last dispatch-command)
                                            "Request kind: task"))
                      (is (string/includes? (last dispatch-command)
                                            "Task block tree:\n- Ship the CLI bridge")))
                    (is (not-any? #(= :write-session (first %)) @calls))
                    (is (= (mapv (fn [ops] [:apply-ops "logseq_db_demo" ops])
                                  (expected-task-started-ops (:block/uuid block)))
                           (filterv #(= :apply-ops (first %)) @calls)))
                    (is (false? (fs/existsSync (node-path/join root "agent-bridge-sessions.edn"))))))
                (fn [e]
                  (is false (str "unexpected error: " e))))
               (fn []
                 (fs/rmSync root #js {:recursive true :force true})
                 (done)))
             (catch :default e
               (fs/rmSync root #js {:recursive true :force true})
               (is false (str "unexpected setup error: " e))
               (done))))))

(deftest test-execute-agent-bridge-connects-listener-before-ready-log-and-initial-scan
  (async done
         (let [calls (atom [])
               call-index (fn [pred]
                            (first (keep-indexed (fn [idx call]
                                                   (when (pred call) idx))
                                                 @calls)))]
           (-> (p/with-redefs [agent-command/codex-available? (fn [_] true)
                               cli-server/ensure-server! (fn [cfg repo]
                                                           (swap! calls conj [:ensure-server repo])
                                                           (assoc cfg :base-url "http://127.0.0.1:1234"))
                               agent-command/register-agent-bridge! (fn [_cfg repo agent-name]
                                                                      (swap! calls conj [:register repo agent-name])
                                                                      (p/resolved true))
                               agent-command/ensure-agent-master-prompt!
                               (fn [_cfg repo agent-name]
                                 (swap! calls conj [:master-prompt repo agent-name])
                                 (p/resolved "Master prompt"))
                               agent-command/ensure-agent-bridge-prompt-templates!
                               (fn [_cfg repo]
                                 (swap! calls conj [:prompt-templates repo])
                                 (p/resolved {:task "Task {{graph}} {{block-uuid}} {{agent-name}}\n{{task-block-tree}}"
                                              :comment "Comment {{graph}} {{comment-uuid}} {{agent-name}}\n{{comment-target-context}}\n{{comment-thread-context}}\n{{requesting-comment}}"}))
                               agent-command/ensure-master-session!
                               (fn [_cfg {:keys [graph agent-name master-prompt]}]
                                 (swap! calls conj [:master-session graph agent-name master-prompt])
                                 (p/resolved {:session "master-session-123"}))
                               transport/connect-events! (fn [_cfg _handler]
                                                           (swap! calls conj [:connect])
                                                           {:close! (fn [] nil)})
                               agent-command/list-routable-tasks (fn [_cfg repo agent-name]
                                                                   (swap! calls conj [:list repo agent-name])
                                                                   (p/resolved []))]
                 (do
                   (agent-command/execute-bridge {:type :agent-bridge
                                                  :repo "logseq_db_demo"
                                                  :graph "demo"}
                                                 {:root-dir "/tmp/logseq"
                                                  :agent-name "build-host"
                                                  :log-fn (fn [line]
                                                            (swap! calls conj [:log line]))})
                   (p/let [_ (p/delay 10)]
                     (let [connect-index (call-index #(= [:connect] %))
                           listening-index (call-index #(and (= :log (first %))
                                                             (string/includes? (second %) "listening graph changes")))
                           list-index (call-index #(= :list (first %)))]
                       (is (some? connect-index))
                       (is (some? listening-index))
                       (is (some? list-index))
                       (is (< connect-index listening-index))
                       (is (< connect-index list-index))))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-agent-bridge-rejects-duplicate-running-bridge
  (async done
         (let [root (temp-root)
               calls (atom [])]
           (try
             (-> (p/with-redefs [agent-command/codex-available? (fn [_] true)
                                 cli-server/ensure-server! (fn [cfg repo]
                                                             (swap! calls conj [:ensure-server repo])
                                                             (assoc cfg :base-url "http://127.0.0.1:1234"))
                                 agent-command/register-agent-bridge! (fn [_cfg repo agent-name]
                                                                        (swap! calls conj [:register repo agent-name])
                                                                        (p/resolved true))
                                 agent-command/ensure-agent-master-prompt!
                                 (fn [_cfg repo agent-name]
                                   (swap! calls conj [:master-prompt repo agent-name])
                                   (p/resolved "Master prompt"))
                                 agent-command/ensure-agent-bridge-prompt-templates!
                                 (fn [_cfg repo]
                                   (swap! calls conj [:prompt-templates repo])
                                   (p/resolved {:task "Task {{graph}} {{block-uuid}} {{agent-name}}\n{{task-block-tree}}"
                                                :comment "Comment {{graph}} {{comment-uuid}} {{agent-name}}\n{{comment-target-context}}\n{{comment-thread-context}}\n{{requesting-comment}}"}))
                                 agent-command/ensure-master-session!
                                 (fn [_cfg {:keys [graph agent-name master-prompt]}]
                                   (swap! calls conj [:master-session graph agent-name master-prompt])
                                   (p/resolved {:session "master-session-123"}))
                                 transport/connect-events! (fn [_cfg _handler]
                                                             (swap! calls conj [:connect])
                                                             {:close! (fn [] nil)})
                                 agent-command/list-routable-tasks (fn [_cfg repo agent-name]
                                                                     (swap! calls conj [:list repo agent-name])
                                                                     (p/resolved []))]
                   (do
                     (agent-command/execute-bridge {:type :agent-bridge
                                                    :repo "logseq_db_demo"
                                                    :graph "demo"}
                                                   {:root-dir root
                                                    :agent-name "build-host"
                                                    :log-fn (fn [_] nil)})
                     (p/let [_ (p/delay 10)
                             duplicate (agent-command/execute-bridge {:type :agent-bridge
                                                                      :repo "logseq_db_demo"
                                                                      :graph "demo"
                                                                      :process-once? true}
                                                                     {:root-dir root
                                                                      :agent-name "build-host"
                                                                      :log-fn (fn [_] nil)})]
                       (is (= :error (:status duplicate)))
                       (is (= :agent-bridge-already-running
                              (get-in duplicate [:error :code])))
                       (let [message (get-in duplicate [:error :message])]
                         (is (and (string? message)
                                  (string/includes? message "already running")))))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (fs/rmSync root #js {:recursive true :force true})
                              (done))))
             (catch :default e
               (fs/rmSync root #js {:recursive true :force true})
               (is false (str "unexpected setup error: " e))
               (done))))))

(deftest test-agent-bridge-lock-recovers-when-owner-file-is-missing
  (let [root (temp-root)
        lock-dir (#'agent-command/bridge-lock-dir {:root-dir root} "demo" "build-host")]
    (try
      (fs/mkdirSync lock-dir #js {:recursive true})
      (let [result (#'agent-command/acquire-bridge-lock! {:root-dir root} "demo" "build-host")]
        (is (true? (:ok? result)))
        (is (fs/existsSync (#'agent-command/bridge-lock-owner-path lock-dir)))
        ((:release! result)))
      (finally
        (fs/rmSync root #js {:recursive true :force true})))))

(deftest test-agent-bridge-lock-recovers-when-owner-file-is-corrupt
  (let [root (temp-root)
        lock-dir (#'agent-command/bridge-lock-dir {:root-dir root} "demo" "build-host")]
    (try
      (fs/mkdirSync lock-dir #js {:recursive true})
      (fs/writeFileSync (#'agent-command/bridge-lock-owner-path lock-dir) "{:pid" "utf8")
      (let [result (#'agent-command/acquire-bridge-lock! {:root-dir root} "demo" "build-host")]
        (is (true? (:ok? result)))
        (is (fs/existsSync (#'agent-command/bridge-lock-owner-path lock-dir)))
        ((:release! result)))
      (finally
        (fs/rmSync root #js {:recursive true :force true})))))

(deftest test-execute-agent-bridge-shares-routing-claims-between-listener-and-initial-scan
  (async done
         (let [root (temp-root)
               handler* (atom nil)
               starts* (atom 0)
               session-writes* (atom [])
               block (task-block {})]
           (try
             (-> (p/with-redefs [agent-command/codex-available? (fn [_] true)
                                 cli-server/ensure-server! (fn [cfg _repo]
                                                             (assoc cfg :base-url "http://127.0.0.1:1234"))
                                 agent-command/register-agent-bridge! (fn [_cfg _repo _agent-name]
                                                                        (p/resolved true))
                                 agent-command/ensure-agent-master-prompt!
                                 (fn [_cfg _repo _agent-name]
                                   (p/resolved "Master prompt"))
                                 agent-command/ensure-agent-bridge-prompt-templates!
                                 (fn [_cfg _repo]
                                   (p/resolved {:task "Task {{graph}} {{block-uuid}} {{agent-name}}\n{{task-block-tree}}"
                                                :comment "Comment {{graph}} {{comment-uuid}} {{agent-name}}\n{{comment-target-context}}\n{{comment-thread-context}}\n{{requesting-comment}}"}))
                                 agent-command/ensure-master-session!
                                 (fn [_cfg _opts]
                                   (p/resolved {:session "master-session-123"}))
                                 transport/connect-events! (fn [_cfg handler]
                                                             (reset! handler* handler)
                                                             {:close! (fn [] nil)})
                                 agent-command/list-routable-tasks (fn [_cfg _repo _agent-name]
                                                                     (p/resolved [{:block block
                                                                                   :tree-text "- Ship the CLI bridge"}]))
                                 show-command/execute-show (fn [_action _cfg]
                                                             (p/resolved {:status :ok
                                                                          :data {:message "- Ship the CLI bridge"}}))
                                 transport/invoke (fn [_cfg method args]
                                                    (case method
                                                      :thread-api/q
                                                      (p/resolved nil)

                                                      :thread-api/pull
                                                      (let [[_repo _selector lookup] args]
                                                        (if (= (:db/id block) lookup)
                                                          (p/resolved block)
                                                          (p/rejected (ex-info "unexpected pull"
                                                                               {:lookup lookup}))))

                                                      :thread-api/apply-outliner-ops
                                                      (p/resolved {:ok true})

                                                      (p/rejected (ex-info "unexpected invoke"
                                                                           {:method method
                                                                            :args args}))))
                                 agent-command/start-codex! (fn [_command _opts]
                                                              (let [start-count (swap! starts* inc)]
                                                                (when (= 1 start-count)
                                                                  (@handler* :sync-db-changes
                                                                             {:tx-data [{:e (:db/id block)
                                                                                         :a :logseq.property/status
                                                                                         :v :logseq.property/status.todo
                                                                                         :added true}]}))
                                                                (p/let [_ (p/delay 20)]
                                                                  {:session (str "session-" start-count)
                                                                   :status :running})))
                                 agent-command/write-agent-session-id! (fn [_cfg repo block-uuid session-id]
                                                                         (swap! session-writes* conj [repo block-uuid session-id])
                                                                         (p/resolved true))]
                   (do
                     (agent-command/execute-bridge {:type :agent-bridge
                                                    :repo "logseq_db_demo"
                                                    :graph "demo"}
                                                   {:root-dir root
                                                    :agent-name "build-host"
                                                    :log-fn (fn [_] nil)})
                     (p/let [_ (p/delay 60)]
                       (is (= 1 @starts*))
                       (is (= [] @session-writes*)))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (fs/rmSync root #js {:recursive true :force true})
                              (done))))
             (catch :default e
               (fs/rmSync root #js {:recursive true :force true})
               (is false (str "unexpected setup error: " e))
               (done))))))

(deftest test-execute-agent-bridge-bounds-initial-task-routing-concurrency
  (async done
         (let [root (temp-root)
               active* (atom 0)
               max-active* (atom 0)
               routed* (atom [])
               blocks (mapv (fn [idx]
                              (task-block {:db/id (+ 42 idx)
                                           :block/uuid (uuid (str "11111111-1111-1111-1111-11111111111" idx))}))
                            (range 5))]
           (try
             (-> (p/with-redefs [agent-command/codex-available? (fn [_] true)
                                 cli-server/ensure-server! (fn [cfg _repo]
                                                             (assoc cfg :base-url "http://127.0.0.1:1234"))
                                 agent-command/register-agent-bridge! (fn [_cfg _repo _agent-name]
                                                                        (p/resolved true))
                                 agent-command/ensure-agent-master-prompt!
                                 (fn [_cfg _repo _agent-name]
                                   (p/resolved "Master prompt"))
                                 agent-command/ensure-agent-bridge-prompt-templates!
                                 (fn [_cfg _repo]
                                   (p/resolved {:task "Task {{graph}} {{block-uuid}} {{agent-name}}\n{{task-block-tree}}"
                                                :comment "Comment {{graph}} {{comment-uuid}} {{agent-name}}\n{{comment-target-context}}\n{{comment-thread-context}}\n{{requesting-comment}}"}))
                                 agent-command/ensure-master-session!
                                 (fn [_cfg _opts]
                                   (p/resolved {:session "master-session-123"}))
                                 agent-command/list-routable-tasks (fn [_cfg _repo _agent-name]
                                                                     (p/resolved (mapv (fn [block]
                                                                                         {:block block
                                                                                          :tree-text (:block/title block)})
                                                                                       blocks)))
                                 agent-command/start-codex! (fn [command _opts]
                                                              (let [active (swap! active* inc)]
                                                                (swap! max-active* max active)
                                                                (p/let [_ (p/delay 20)]
                                                                  (swap! active* dec)
                                                                  (swap! routed* conj (last command))
                                                                  {:session (str "session-" (random-uuid))
                                                                   :status :running})))
                                 transport/invoke (fn [_cfg method _args]
                                                    (case method
                                                      :thread-api/q
                                                      (p/resolved nil)

                                                      :thread-api/apply-outliner-ops
                                                      (p/resolved {:ok true})

                                                      (p/rejected (ex-info "unexpected invoke"
                                                                           {:method method}))))
                                 agent-command/write-agent-session-id! (fn [_cfg _repo block-uuid session-id]
                                                                         (swap! routed* conj [block-uuid session-id])
                                                                         (p/resolved true))]
                   (p/let [result (agent-command/execute-bridge {:type :agent-bridge
                                                                 :repo "logseq_db_demo"
                                                                 :graph "demo"
                                                                 :process-once? true}
                                                                {:root-dir root
                                                                 :agent-name "build-host"
                                                                 :log-fn (fn [_] nil)})]
                     (is (= :ok (:status result)))
                     (is (= 5 (count @routed*)))
                     (is (every? #(string/includes? % "Request kind: task") @routed*))
                     (is (<= @max-active* 4))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (fs/rmSync root #js {:recursive true :force true})
                              (done))))
             (catch :default e
               (fs/rmSync root #js {:recursive true :force true})
               (is false (str "unexpected setup error: " e))
               (done))))))

(deftest test-agent-bridge-listener-ignores-unrelated-events
  (async done
         (let [handler* (atom nil)
               broad-scans* (atom 0)]
           (-> (p/with-redefs [transport/connect-events! (fn [_cfg handler]
                                                           (reset! handler* handler)
                                                           {:close! (fn [] nil)})
                               agent-command/list-routable-tasks (fn [_cfg _repo _agent-name]
                                                                   (swap! broad-scans* inc)
                                                                   (p/resolved []))
                               transport/invoke (fn [_cfg method args]
                                                  (case method
                                                    :thread-api/pull
                                                    (let [[_repo selector lookup] args]
                                                      (if (and (= selector [:db/id :block/title :block/name])
                                                               (= lookup 102))
                                                        (p/resolved {:db/id 102
                                                                     :block/title "other-host"})
                                                        (p/rejected (ex-info "unexpected pull"
                                                                             {:selector selector
                                                                              :lookup lookup}))))
                                                    (p/rejected (ex-info "unexpected invoke"
                                                                         {:method method
                                                                          :args args}))))]
                 (do
                   (#'agent-command/listen-forever! {:root-dir "/tmp/logseq"
                                                     :base-url "http://127.0.0.1:1234"
                                                     :log-fn (fn [_] nil)}
                                                    {:repo "logseq_db_demo"
                                                     :graph "demo"
                                                     :agent-name "build-host"})
                   (@handler* :rtc-log {:tx-data [{:e 42
                                                   :a :logseq.property/assignee
                                                   :v {:db/id 101
                                                       :block/title "build-host"}
                                                   :added true}]})
                   (@handler* :sync-db-changes {:tx-data [{:e 42
                                                           :a :block/title
                                                           :v "renamed"
                                                           :added true}]})
                   (@handler* :sync-db-changes {:tx-data [{:e 42
                                                           :a :logseq.property/assignee
                                                           :v 102
                                                           :added true}]})
                   (p/let [_ (p/delay 5)]
                     (is (= 0 @broad-scans*)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-agent-bridge-listener-logs-exit-reason-before-process-exit
  (async done
         (let [handler* (atom nil)
               exit-calls* (atom [])
               info-logs* (atom [])
               original-exit (.-exit js/process)
               log-handler (fn [record]
                             (when-let [data (get (:message record) :agent-bridge-exit)]
                               (swap! info-logs* conj data)))]
           (set! (.-exit js/process)
                 (fn [code]
                   (swap! exit-calls* conj code)))
           (log/add-handler log-handler)
           (-> (p/with-redefs [transport/connect-events! (fn [_cfg handler]
                                                           (reset! handler* handler)
                                                           {:close! (fn [] nil)})
                               transport/invoke (fn [_cfg _method _args]
                                                  (p/rejected (ex-info "db-worker unavailable"
                                                                       {:code :db-worker-unavailable})))]
                 (do
                   (#'agent-command/listen-forever! {:root-dir "/tmp/logseq"
                                                     :base-url "http://127.0.0.1:1234"
                                                     :log-fn (fn [_] nil)}
                                                    {:repo "logseq_db_demo"
                                                     :graph "demo"
                                                     :agent-name "build-host"})
                   (@handler* :sync-db-changes {:tx-data [{:e 42
                                                           :a :logseq.property/assignee
                                                           :v {:db/id 101
                                                               :block/title "build-host"}
                                                           :added true}]})
                   (p/let [_ (p/delay 5)]
                     (is (= [1] @exit-calls*))
                     (is (= [{:reason :task-processing-failed
                              :exit-code 1
                              :repo "logseq_db_demo"
                              :graph "demo"
                              :agent-name "build-host"
                              :error-code :db-worker-unavailable
                              :message "db-worker unavailable"}]
                            @info-logs*)))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally (fn []
                            (log/remove-handler log-handler)
                            (set! (.-exit js/process) original-exit)
                            (done)))))))

(deftest test-agent-bridge-listener-routes-assignee-datom-without-broad-scan
  (async done
         (let [root (temp-root)
               handler* (atom nil)
               calls (atom [])
               block (task-block {:logseq.property/assignee [{:db/id 101
                                                              :block/title "build-host"}]})]
           (try
             (-> (p/with-redefs [transport/connect-events! (fn [_cfg handler]
                                                             (reset! handler* handler)
                                                             {:close! (fn [] nil)})
                                 agent-command/list-routable-tasks (fn [_cfg repo agent-name]
                                                                     (swap! calls conj [:broad-scan repo agent-name])
                                                                     (p/resolved []))
                                 transport/invoke (fn [_cfg method args]
                                                    (swap! calls conj [method args])
                                                    (case method
                                                      :thread-api/q
                                                      (p/resolved nil)

                                                      :thread-api/apply-outliner-ops
                                                      (p/resolved {:ok true})

                                                      :thread-api/pull
                                                      (let [[_repo selector lookup] args]
                                                        (cond
                                                          (= lookup :logseq.property/assignee)
                                                          (p/resolved {:db/id 900
                                                                       :db/ident :logseq.property/assignee})

                                                          (= lookup 101)
                                                          (p/resolved {:db/id 101
                                                                       :block/title "build-host"})

                                                          (= lookup 42)
                                                          (p/resolved block)

                                                          :else
                                                          (p/rejected (ex-info "unexpected pull"
                                                                               {:selector selector
                                                                                :lookup lookup}))))

                                                      (p/rejected (ex-info "unexpected invoke"
                                                                           {:method method
                                                                            :args args}))))
                                 show-command/execute-show (fn [action _cfg]
                                                             (swap! calls conj [:show action])
                                                             (p/resolved {:status :ok
                                                                          :data {:message "- Ship the CLI bridge"}}))
                                 cli-server/ensure-server! (fn [cfg repo]
                                                             (swap! calls conj [:ensure-server (:root-dir cfg) repo])
                                                             (assoc cfg :base-url "http://127.0.0.1:1234"))
                                 agent-command/start-codex! (fn [command _opts]
                                                              (swap! calls conj [:codex command])
                                                              (p/resolved {:session "master-session-123"
                                                                           :status :running}))
                                 agent-command/write-agent-session-id! (fn [_cfg repo block-uuid session-id]
                                                                         (swap! calls conj [:write-session repo block-uuid session-id])
                                                                         (p/resolved true))]
                   (do
                     (#'agent-command/listen-forever! {:root-dir root
                                                       :base-url "http://127.0.0.1:1234"
                                                       :log-fn (fn [_] nil)}
                                                      {:repo "logseq_db_demo"
                                                       :graph "demo"
                                                       :agent-name "build-host"
                                                       :master-session "master-session-123"})
                     (@handler* :sync-db-changes {:tx-data [{:e 42
                                                             :a 900
                                                             :v 101
                                                             :added true}]})
                     (p/let [_ (p/delay 5)]
                       (is (not-any? #(= :broad-scan (first %)) @calls))
                       (is (some #(= [:thread-api/pull ["logseq_db_demo" [:db/id :db/ident] :logseq.property/assignee]] %)
                                 @calls))
                       (is (some #(= [:thread-api/pull ["logseq_db_demo" [:db/id :block/title :block/name] 101]] %)
                                 @calls))
                       (let [[_ command] (some #(when (= :codex (first %)) %) @calls)]
                         (is (= (conj codex-resume-prefix "master-session-123")
                                (vec (take 8 command))))
                         (is (string/includes? (last command)
                                               (str "Block UUID: " (:block/uuid block))))))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (fs/rmSync root #js {:recursive true :force true})
                              (done))))
             (catch :default e
               (fs/rmSync root #js {:recursive true :force true})
               (is false (str "unexpected setup error: " e))
               (done))))))

(deftest test-agent-bridge-listener-routes-task-tag-and-status-datoms
  (async done
         (let [root (temp-root)
               handler* (atom nil)
               calls (atom [])
               status-block (task-block {:db/id 42})
               tag-block (task-block {:db/id 43
                                      :block/uuid #uuid "22222222-2222-2222-2222-222222222222"})]
           (try
             (-> (p/with-redefs [transport/connect-events! (fn [_cfg handler]
                                                             (reset! handler* handler)
                                                             {:close! (fn [] nil)})
                                 agent-command/list-routable-tasks (fn [_cfg repo agent-name]
                                                                     (swap! calls conj [:broad-scan repo agent-name])
                                                                     (p/resolved []))
                                 transport/invoke (fn [_cfg method args]
                                                    (swap! calls conj [method args])
                                                    (case method
                                                      :thread-api/q
                                                      (p/resolved nil)

                                                      :thread-api/apply-outliner-ops
                                                      (p/resolved {:ok true})

                                                      :thread-api/pull
                                                      (let [[_repo _selector lookup] args]
                                                        (cond
                                                          (= lookup 42) (p/resolved status-block)
                                                          (= lookup 43) (p/resolved tag-block)
                                                          :else (p/rejected (ex-info "unexpected pull"
                                                                                     {:lookup lookup}))))
                                                      (p/rejected (ex-info "unexpected invoke"
                                                                           {:method method
                                                                            :args args}))))
                                 show-command/execute-show (fn [action _cfg]
                                                             (swap! calls conj [:show action])
                                                             (p/resolved {:status :ok
                                                                          :data {:message "- Routed task"}}))
                                 cli-server/ensure-server! (fn [cfg repo]
                                                             (swap! calls conj [:ensure-server (:root-dir cfg) repo])
                                                             (assoc cfg :base-url "http://127.0.0.1:1234"))
                                 agent-command/start-codex! (fn [command _opts]
                                                              (swap! calls conj [:codex command])
                                                              (p/resolved {:session "master-session-123"
                                                                           :status :running}))
                                 agent-command/write-agent-session-id! (fn [_cfg repo block-uuid session-id]
                                                                         (swap! calls conj [:write-session repo block-uuid session-id])
                                                                         (p/resolved true))]
                   (do
                     (#'agent-command/listen-forever! {:root-dir root
                                                       :base-url "http://127.0.0.1:1234"
                                                       :log-fn (fn [_] nil)}
                                                      {:repo "logseq_db_demo"
                                                       :graph "demo"
                                                       :agent-name "build-host"
                                                       :master-session "master-session-123"})
                     (@handler* :sync-db-changes {:tx-data [{:e 42
                                                             :a :logseq.property/status
                                                             :v :logseq.property/status.todo
                                                             :added true}
                                                            {:e 43
                                                             :a :block/tags
                                                             :v :logseq.class/Task
                                                             :added true}]})
                     (p/let [_ (p/delay 10)]
                       (is (not-any? #(= :broad-scan (first %)) @calls))
                       (is (= #{(:block/uuid status-block)
                                (:block/uuid tag-block)}
                              (set (keep (fn [[kind command]]
                                           (when (= :codex kind)
                                             (some (fn [block]
                                                     (when (string/includes? (last command)
                                                                             (str "Block UUID: " (:block/uuid block)))
                                                       (:block/uuid block)))
                                                   [status-block tag-block])))
                                         @calls)))))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (fs/rmSync root #js {:recursive true :force true})
                              (done))))
             (catch :default e
               (fs/rmSync root #js {:recursive true :force true})
               (is false (str "unexpected setup error: " e))
               (done))))))
