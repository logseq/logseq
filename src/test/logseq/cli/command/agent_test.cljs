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

(defn- task-block
  [overrides]
  (merge {:db/id 42
          :block/uuid #uuid "11111111-1111-1111-1111-111111111111"
          :block/title "Ship the CLI bridge"
          :block/tags [{:block/title "Task"}]
          :logseq.property/status {:db/ident :logseq.property/status.todo}
          "Assignee" "build-host"}
         overrides))

(deftest test-assignee-built-in-property
  (let [property (get db-property/built-in-properties :logseq.property/assignee)]
    (is (= "Assignee" (:title property)))
    (is (= :node (get-in property [:schema :type])))
    (is (= :many (get-in property [:schema :cardinality])))
    (is (= true (get-in property [:schema :public?])))
    (is (= true (:queryable? property)))
    (is (contains? db-property/public-built-in-properties :logseq.property/assignee))))

(deftest test-agent-command-entries
  (testing "parse agent bridge command surface"
    (let [bridge (commands/parse-args ["agent" "bridge" "--graph" "demo" "--dry-run"])
          list-result (commands/parse-args ["agent" "bridge" "list"])]
      (is (true? (:ok? bridge)))
      (is (= :agent-bridge (:command bridge)))
      (is (= "demo" (get-in bridge [:options :graph])))
      (is (true? (get-in bridge [:options :dry-run])))
      (is (true? (:ok? list-result)))
      (is (= :agent-bridge-list (:command list-result)))))

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
                  :options {:dry-run true}
                  :args []}
          result (commands/build-action parsed {:graph "demo"})]
      (is (true? (:ok? result)))
      (is (= :agent-bridge (get-in result [:action :type])))
      (is (= "demo" (get-in result [:action :graph])))
      (is (= "logseq_db_demo" (get-in result [:action :repo])))
      (is (true? (get-in result [:action :dry-run?])))))

  (testing "agent bridge list is root-dir scoped and does not require graph"
    (let [result (commands/build-action {:ok? true
                                         :command :agent-bridge-list
                                         :options {}
                                         :args []}
                                        {})]
      (is (true? (:ok? result)))
      (is (= :agent-bridge-list (get-in result [:action :type]))))))

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
                (task-block {"Assignee" nil
                             :logseq.property/assignee [{:db/id 101
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
           (:reason (agent-command/routable-task-decision (task-block {"Assignee" "other-host"})
                                                          "build-host"))))
    (is (= :already-routed
           (:reason (agent-command/routable-task-decision (task-block {"agent-session-id" "codex-1"})
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
      (is (= ["codex" "exec" "--json" prompt] command))
      (is (string/starts-with? preview "codex exec --json '"))
      (is (string/includes? preview "Ship the CLI bridge")))))

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

(deftest test-registration-writes-agent-name-to-graph
  (async done
         (let [calls* (atom [])
               page-uuid (uuid "33333333-3333-3333-3333-333333333333")]
           (p/finally
             (p/catch
              (p/with-redefs [agent-command/random-bridge-block-uuid (fn [] (uuid "44444444-4444-4444-4444-444444444444"))
                              transport/invoke (fn [_ method args]
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
                (p/let [_ (agent-command/register-agent-bridge! {:root-dir "/tmp/logseq"} "logseq_db_demo" "build-host")]
                  (let [apply-ops (->> @calls*
                                       (filter #(= :thread-api/apply-outliner-ops (first %)))
                                       (mapv (comp second second)))]
                    (is (= [[:create-page [agent-command/agent-bridge-registry-page {}]]]
                           (first apply-ops)))
                    (is (= [[:insert-blocks [[{:block/title "build-host"
                                               :block/uuid (uuid "44444444-4444-4444-4444-444444444444")}]
                                             page-uuid
                                             {:outliner-op :insert-blocks
                                              :sibling? false
                                              :bottom? true
                                              :keep-uuid? true}]]]
                           (second apply-ops))))))
              (fn [e]
                (is false (str "unexpected error: " e))))
             done))))

(deftest test-write-agent-session-id
  (async done
         (let [ops* (atom [])
               property-query-count* (atom 0)
               property-ident :user.property/agent-session-id
               block-uuid (uuid "11111111-1111-1111-1111-111111111111")]
           (-> (p/with-redefs [transport/invoke (fn [_ method args]
                                                  (case method
                                                    :thread-api/q
                                                    (let [[_ [query & _query-args]] args]
                                                      (if (= query agent-command/agent-session-id-property-query)
                                                        (p/resolved (if (= 1 (swap! property-query-count* inc))
                                                                      []
                                                                      [{:db/id 700
                                                                        :db/ident property-ident
                                                                        :block/title "agent-session-id"}]))
                                                        (p/rejected (ex-info "unexpected query"
                                                                             {:query query}))))

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
                   (is (= [[:upsert-property [nil
                                              {:logseq.property/type :default
                                               :db/cardinality :db.cardinality/one}
                                              {:property-name "agent-session-id"}]]
                           [:batch-set-property [[block-uuid] property-ident "session-123" {}]]]
                          @ops*))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-session-store
  (let [root (temp-root)
        config {:root-dir root}]
    (try
      (agent-command/record-session! config {:session "codex-running"
                                             :status :running
                                             :backend :codex
                                             :graph "demo"
                                             :block "11111111-1111-1111-1111-111111111111"
                                             :agent "build-host"
                                             :started-at 1000
                                             :updated-at 2000})
      (agent-command/record-session! config {:session "codex-done"
                                             :status :completed
                                             :backend :codex
                                             :graph "demo"
                                             :block "22222222-2222-2222-2222-222222222222"
                                             :agent "build-host"
                                             :started-at 1000
                                             :updated-at 3000})
      (testing "list hides completed sessions by default"
        (is (= ["codex-running"]
               (mapv :session (agent-command/list-sessions config {})))))
      (testing "list can include completed sessions"
        (is (= ["codex-running" "codex-done"]
               (mapv :session (agent-command/list-sessions config {:all? true})))))
      (testing "session file is EDN data"
        (let [payload (reader/read-string (fs/readFileSync (agent-command/session-store-path config) "utf8"))]
          (is (= 2 (count (:sessions payload))))))
      (finally
        (fs/rmSync root #js {:recursive true :force true})))))

(deftest test-session-store-keeps-terminal-status-after-late-running-record
  (let [root (temp-root)
        config {:root-dir root}]
    (try
      (agent-command/update-session-status! config "codex-fast" :completed)
      (agent-command/record-session! config {:session "codex-fast"
                                             :status :running
                                             :backend :codex
                                             :graph "demo"
                                             :block "11111111-1111-1111-1111-111111111111"
                                             :agent "build-host"
                                             :started-at 1000
                                             :updated-at 2000})
      (let [session (first (agent-command/list-sessions config {:all? true}))]
        (is (= :completed (:status session)))
        (is (= :codex (:backend session)))
        (is (= "demo" (:graph session)))
        (is (= "11111111-1111-1111-1111-111111111111" (:block session)))
        (is (= "build-host" (:agent session)))
        (is (= 1000 (:started-at session)))
        (is (= 2000 (:updated-at session))))
      (finally
        (fs/rmSync root #js {:recursive true :force true})))))

(deftest test-execute-agent-bridge-list-and-format
  (let [root (temp-root)]
    (try
      (agent-command/record-session! {:root-dir root}
                                     {:session "codex-running"
                                      :status :running
                                      :backend :codex
                                      :graph "demo"
                                      :block "11111111-1111-1111-1111-111111111111"
                                      :agent "build-host"
                                      :started-at 1000
                                      :updated-at 2000})
      (let [result (agent-command/execute-list {:type :agent-bridge-list} {:root-dir root})
            output (cli-format/format-result result {:output-format :human :now-ms 3000})]
        (is (= :ok (:status result)))
        (is (string/includes? output "SESSION"))
        (is (string/includes? output "STATUS"))
        (is (string/includes? output "BACKEND"))
        (is (string/includes? output "codex-running"))
        (is (string/includes? output "running"))
        (is (not (string/includes? output ":running")))
        (is (not (string/includes? output ":codex")))
        (is (string/includes? output "Count: 1")))
      (finally
        (fs/rmSync root #js {:recursive true :force true})))))

(deftest test-format-agent-bridge-logs
  (let [output (cli-format/format-result {:status :ok
                                          :command :agent-bridge
                                          :data {:logs ["2026-05-16T00:00:00.000Z checking the environment ..."
                                                        "2026-05-16T00:00:01.000Z listening graph changes ..."]}}
                                         {:output-format :human})]
    (is (= "2026-05-16T00:00:00.000Z checking the environment ...\n2026-05-16T00:00:01.000Z listening graph changes ..."
           output))))

(deftest test-execute-agent-bridge-dry-run
  (async done
         (let [calls (atom [])]
           (-> (p/with-redefs [agent-command/codex-available? (fn [_] true)
                               cli-server/ensure-server! (fn [cfg repo]
                                                           (swap! calls conj [:ensure-server (:root-dir cfg) repo])
                                                           (assoc cfg :base-url "http://127.0.0.1:1234"))
                               agent-command/register-agent-bridge! (fn [cfg repo agent-name]
                                                                      (swap! calls conj [:register (:root-dir cfg) repo agent-name])
                                                                      (p/resolved true))
                               agent-command/list-routable-tasks (fn [_cfg repo agent-name]
                                                                   (swap! calls conj [:list repo agent-name])
                                                                   (p/resolved [{:block (task-block {})
                                                                                 :tree-text "- Ship the CLI bridge"}]))]
                 (p/let [result (agent-command/execute-bridge {:type :agent-bridge
                                                               :repo "logseq_db_demo"
                                                               :graph "demo"
                                                               :dry-run? true}
                                                              {:root-dir "/tmp/logseq"
                                                               :agent-name "build-host"})]
                   (is (= :ok (:status result)))
                   (is (= :dry-run (get-in result [:data :mode])))
                   (is (= [[:ensure-server "/tmp/logseq" "logseq_db_demo"]
                           [:register "/tmp/logseq" "logseq_db_demo" "build-host"]
                           [:list "logseq_db_demo" "build-host"]]
                          @calls))
                   (is (= 1 (count (get-in result [:data :commands]))))
                   (is (string/includes? (first (get-in result [:data :logs]))
                                         "checking the environment"))
                   (is (string/includes? (last (get-in result [:data :logs]))
                                         "would run Codex command"))))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest test-execute-agent-bridge-non-dry-run-routes-task
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
                                agent-command/list-routable-tasks (fn [_cfg repo agent-name]
                                                                    (swap! calls conj [:list repo agent-name])
                                                                    (p/resolved [{:block block
                                                                                  :tree-text "- Ship the CLI bridge"}]))
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
                                                                :dry-run? false
                                                                :process-once? true}
                                                               {:root-dir root
                                                                :agent-name "build-host"
                                                                :log-fn (fn [_] nil)})]
                    (is (= :ok (:status result)))
                    (is (= :processed-once (get-in result [:data :mode])))
                    (is (= [[:ensure-server root "logseq_db_demo"]
                            [:register "logseq_db_demo" "build-host"]
                            [:list "logseq_db_demo" "build-host"]
                            [:codex ["codex" "exec" "--json" (agent-command/build-codex-prompt
                                                              {:graph "demo"
                                                               :agent-name "build-host"
                                                               :block block
                                                               :tree-text "- Ship the CLI bridge"})]]
                            [:ensure-server root "logseq_db_demo"]
                            [:write-session "logseq_db_demo" (:block/uuid block) "session-123"]]
                           @calls))
                    (let [sessions (agent-command/list-sessions {:root-dir root} {})]
                      (is (= [{:session "session-123"
                               :status :running
                               :backend :codex
                               :graph "demo"
                               :block "11111111-1111-1111-1111-111111111111"
                               :agent "build-host"}]
                             (mapv #(select-keys % [:session :status :backend :graph :block :agent]) sessions))))))
                (fn [e]
                  (is false (str "unexpected error: " e))))
               (fn []
                 (fs/rmSync root #js {:recursive true :force true})
                 (done)))
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
                                                                   (p/resolved []))]
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
                                                       :block/title "build-host"}}]})
                   (@handler* :sync-db-changes {:tx-data [{:e 42
                                                           :a :block/title
                                                           :v "renamed"}]})
                   (@handler* :sync-db-changes {:tx-data [{:e 42
                                                           :a :logseq.property/assignee
                                                           :v {:db/id 102
                                                               :block/title "other-host"}}]})
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
                                                               :block/title "build-host"}}]})
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
               block (task-block {"Assignee" nil
                                  :logseq.property/assignee [{:db/id 101
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
                                                              (p/resolved {:session "session-123"
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
                                                       :agent-name "build-host"})
                     (@handler* :sync-db-changes {:tx-data [{:e 42
                                                             :a 900
                                                             :v 101}]})
                     (p/let [_ (p/delay 5)]
                       (is (not-any? #(= :broad-scan (first %)) @calls))
                       (is (some #(= [:thread-api/pull ["logseq_db_demo" [:db/id :db/ident] :logseq.property/assignee]] %)
                                 @calls))
                       (is (some #(= [:thread-api/pull ["logseq_db_demo" [:db/id :block/title :block/name] 101]] %)
                                 @calls))
                       (is (some #(= [:write-session "logseq_db_demo" (:block/uuid block) "session-123"] %)
                                 @calls)))))
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (fs/rmSync root #js {:recursive true :force true})
                              (done))))
             (catch :default e
               (fs/rmSync root #js {:recursive true :force true})
               (is false (str "unexpected setup error: " e))
               (done))))))
