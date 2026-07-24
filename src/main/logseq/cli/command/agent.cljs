(ns logseq.cli.command.agent
  "Agent bridge command helpers."
  (:require ["child_process" :as child-process]
            ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs.reader :as reader]
            [clojure.set :as set]
            [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.cli.command.core :as core]
            [logseq.cli.command.show :as show-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def entries
  [(core/command-entry ["agent" "bridge"]
                       :agent-bridge
                       "Run task agent bridge"
                       {}
                       {:examples ["logseq agent bridge --graph my-graph"]})])

(defn- trim-non-empty
  [value]
  (some-> value str string/trim not-empty))

(defn resolve-agent-name
  ([config]
   (resolve-agent-name config {:hostname (.hostname os)}))
  ([config {:keys [hostname]}]
   (let [configured? (contains? config :agent-name)
         configured (trim-non-empty (:agent-name config))
         hostname (trim-non-empty hostname)
         agent-name (if configured?
                      configured
                      hostname)]
     (if (seq agent-name)
       {:ok? true
        :agent-name agent-name}
       {:ok? false
        :error {:code :agent-name-invalid
                :message (if configured?
                           "agent-name in cli.edn must be a non-empty string"
                           "agent-name cannot be resolved from cli.edn or hostname")}}))))

(defn build-action
  [command _options repo graph]
  (case command
    :agent-bridge
    (if-not (seq repo)
      {:ok? false
       :error {:code :missing-repo
               :message "repo is required for agent bridge"}}
      {:ok? true
       :action {:type :agent-bridge
                :repo repo
                :graph graph}})

    {:ok? false
     :error {:code :unknown-command
             :message (str "unknown agent command: " command)}}))

(def ^:private agent-session-id-property-ident :logseq.property.agent/session-id)

(defn- task-tag?
  [tag]
  (= :logseq.class/Task (:db/ident tag)))

(defn- code-block-tag?
  [tag]
  (= :logseq.class/Code-block
     (if (keyword? tag)
       tag
       (:db/ident tag))))

(defn- assignee-values
  [block]
  (->> (:logseq.property/assignee block)
       (keep (comp trim-non-empty :block/title))
       set))

(defn- agent-session-id-present?
  [block]
  (some? (get block agent-session-id-property-ident)))

(defn routable-task-decision
  [block agent-name]
  (let [uuid (:block/uuid block)
        status-ident (get-in block [:logseq.property/status :db/ident])
        assignees (assignee-values block)]
    (cond
      (nil? uuid)
      {:routable? false :reason :missing-stable-uuid}

      (not-any? task-tag? (:block/tags block))
      {:routable? false :reason :missing-task-tag}

      (not= :logseq.property/status.todo status-ident)
      {:routable? false :reason :not-todo}

      (not (contains? assignees agent-name))
      {:routable? false :reason :assignee-mismatch}

      (agent-session-id-present? block)
      {:routable? false :reason :already-routed}

      :else
      {:routable? true})))

(defn routable-task?
  [block agent-name]
  (true? (:routable? (routable-task-decision block agent-name))))

(defn- block-uuid-str
  [block]
  (some-> (:block/uuid block) str))

(def task-prompt-template-title "Task prompt template")

(def comment-prompt-template-title "Comment prompt template")

(def ^:private graph-scope-line
  "Do not operate outside the target graph.")

(def ^:private task-result-line
  "Write task results back into the graph.")

(def ^:private task-finish-reaction-line
  "When the task or subagent finishes, remove the `eyes` reaction from the task block whether it succeeded or failed.")

(def ^:private comment-completion-line
  "Complete the request from the mentioned comment.")

(def ^:private graph-report-lines
  ["If the target graph is sync-enabled, make sure it is synced after writing back to the graph."
   "Keep the report short when possible."
   "Report blockers only if there is a blocker."
   "Report root cause and Steps to verify only for bug fixes."])

(def ^:private comment-reply-instruction-lines
  ["Reply instructions:"
   "For a short reply, append a comment after the requesting comment."
   "For a long reply, write a normal block tree after the comments area and append a comment that references that tree."
   "When referencing result blocks in DB graphs, reference result blocks with [[block-uuid]], not ((block-uuid))."
   "If the request is blocked or fails, make that clear in the reply."])

(def ^:private default-task-prompt-template
  (string/join
   "\n"
   (concat
    ["You are handling a Logseq AgentBridge task."
     ""
     "Graph: {{graph}}"
     "Block UUID: {{block-uuid}}"
     "AgentBridge name: {{agent-name}}"
	     ""
	     graph-scope-line
	     task-result-line]
	    [task-finish-reaction-line]
	    graph-report-lines
    [""
     "Task block tree:"
     "{{task-block-tree}}"])))

(def ^:private default-comment-prompt-template
  (string/join
   "\n"
   (concat
    ["You are handling a Logseq AgentBridge comment request."
     ""
     "Graph: {{graph}}"
     "Comment UUID: {{comment-uuid}}"
     "AgentBridge name: {{agent-name}}"
     ""
     graph-scope-line
     comment-completion-line]
    graph-report-lines
    [""
     "Comment target context:"
     "{{comment-target-context}}"
     ""
     "Comment thread context:"
     "{{comment-thread-context}}"
     ""
     "Requesting comment:"
     "{{requesting-comment}}"
     ""]
    comment-reply-instruction-lines)))

(def ^:private prompt-template-vars
  {:task #{"graph"
           "block-uuid"
           "agent-name"
           "task-block-tree"}
   :comment #{"graph"
              "comment-uuid"
              "agent-name"
              "comment-target-context"
              "comment-thread-context"
              "requesting-comment"}})

(def ^:private required-prompt-template-vars prompt-template-vars)

(defn- renderable-prompt-template-var-names
  [template]
  (->> (re-seq #"('?)(\{\{([A-Za-z0-9-]+)\}\})('?)" (or template ""))
       (keep (fn [[_ open-quote _ var-name close-quote]]
               (when-not (and (= "'" open-quote)
                              (= "'" close-quote))
                 var-name)))
       set))

(defn validate-prompt-template
  [template-kind template]
  (let [vars (renderable-prompt-template-var-names template)
        allowed-vars (get prompt-template-vars template-kind)
        required-vars (get required-prompt-template-vars template-kind)]
    (if (nil? allowed-vars)
      {:ok? false
       :error {:code :unknown-template-kind
               :template template-kind}}
      (let [unknown-vars (set/difference vars allowed-vars)
            missing-vars (set/difference required-vars vars)]
        (cond
          (string/blank? (or template ""))
          {:ok? false
           :error {:code :missing-template-code-block
                   :template template-kind}}

          (seq unknown-vars)
          {:ok? false
           :error {:code :unknown-template-vars
                   :template template-kind
                   :vars unknown-vars}}

          (seq missing-vars)
          {:ok? false
           :error {:code :missing-template-vars
                   :template template-kind
                   :vars missing-vars}}

          :else
          {:ok? true})))))

(defn- validate-prompt-templates!
  [templates]
  (doseq [[template-kind template] templates]
    (let [result (validate-prompt-template template-kind template)]
      (when-not (:ok? result)
        (throw (ex-info "agent bridge prompt template is invalid"
                        (assoc (:error result)
                               :code :agent-prompt-template-invalid
                               :reason (get-in result [:error :code])))))))
  templates)

(defn- render-prompt-template
  [template-kind template vars]
  (validate-prompt-templates! {template-kind template})
  (string/replace
   template
   #"\{\{([A-Za-z0-9-]+)\}\}"
   (fn [[_ var-name]]
     (if (contains? vars var-name)
       (str (get vars var-name))
       (throw (ex-info "agent bridge prompt template var has no value"
                       {:code :agent-prompt-template-var-missing
                        :template template-kind
                        :var var-name}))))))

(defn build-codex-prompt
  [{:keys [graph agent-name block tree-text prompt-template]}]
  (render-prompt-template
   :task
   (or prompt-template default-task-prompt-template)
   {"graph" graph
    "block-uuid" (block-uuid-str block)
    "agent-name" agent-name
    "task-block-tree" (or tree-text (:block/title block) "")}))

(defn build-comment-codex-prompt
  [{:keys [graph agent-name comment-tree-text comments-area-tree-text target-tree-texts]
    comment-block :comment
    prompt-template :prompt-template}]
  (render-prompt-template
   :comment
   (or prompt-template default-comment-prompt-template)
   {"graph" graph
    "comment-uuid" (block-uuid-str comment-block)
    "agent-name" agent-name
    "comment-target-context" (string/join "\n" (remove string/blank? target-tree-texts))
    "comment-thread-context" (or comments-area-tree-text (:block/title (:block/parent comment-block)) "")
    "requesting-comment" (or comment-tree-text (:block/title comment-block) "")}))

(defn- project-dir-line
  [project-dir]
  (when-let [project-dir (trim-non-empty project-dir)]
    (str "Project directory: " project-dir)))

(defn- master-dispatch-header-lines
  [{:keys [request-kind graph agent-name project-dir]}]
  (cond-> ["You are handling a Logseq AgentBridge master dispatch request."
           ""
           (str "Request kind: " (name request-kind))
           (str "Graph: " graph)
           (str "AgentBridge name: " agent-name)]
    (project-dir-line project-dir) (conj (project-dir-line project-dir))
    true (into [""
                graph-scope-line
                "Only the master agent may write task results back into the target graph."
                "Subagents may read graph context but must not write graph content."
                "Route this request according to the master prompt policy."])
	    (= :task request-kind) (conj "After launching the subagent with `codex exec`, write that subagent session id to the task block's `:logseq.property.agent/session-id` property.")))

(def ^:private master-task-dispatch-contract-lines
  (into [task-result-line
         task-finish-reaction-line]
        graph-report-lines))

(def ^:private master-comment-dispatch-contract-lines
  (into [comment-completion-line]
        (concat
         graph-report-lines
         [""]
         comment-reply-instruction-lines)))

(defn- inherited-task-session-lines
  [{:keys [parent-block-uuid session-id]}]
  (when (and parent-block-uuid (seq session-id))
    [""
     (str "Inherited parent task UUID: " parent-block-uuid)
     (str "Inherited subagent session id: " session-id)
     "Continue this child task in the inherited subagent session instead of launching a new subagent."]))

(defn- build-master-task-dispatch-prompt
  [{:keys [graph agent-name project-dir block tree-text inherited-session]}]
  (string/join
   "\n"
   (concat
    (master-dispatch-header-lines {:request-kind :task
                                   :graph graph
                                   :agent-name agent-name
                                   :project-dir project-dir})
    [""]
    master-task-dispatch-contract-lines
    [""
     (str "Block UUID: " (block-uuid-str block))
     ""]
    (inherited-task-session-lines inherited-session)
    [""
     "Task block tree:"
     (or tree-text (:block/title block) "")])))

(defn- build-master-comment-dispatch-prompt
  [{:keys [graph agent-name project-dir comment-tree-text comments-area-tree-text target-tree-texts]
    comment-block :comment}]
  (string/join
   "\n"
   (concat
    (master-dispatch-header-lines {:request-kind :comment
                                   :graph graph
                                   :agent-name agent-name
                                   :project-dir project-dir})
    [""]
    master-comment-dispatch-contract-lines
    [""
     (str "Comment UUID: " (block-uuid-str comment-block))
     ""
     "Comment target context:"
     (string/join "\n" (remove string/blank? target-tree-texts))
     ""
     "Comment thread context:"
     (or comments-area-tree-text (:block/title (:block/parent comment-block)) "")
     ""
     "Requesting comment:"
     (or comment-tree-text (:block/title comment-block) "")])))

(defn- codex-exec-prefix
  [codex-bin]
  [(or (trim-non-empty codex-bin) "codex")
   "--sandbox" "danger-full-access"
   "exec"])

(defn build-codex-command
  [prompt {:keys [codex-bin]}]
  (conj (codex-exec-prefix codex-bin)
        "--json" "--skip-git-repo-check" prompt))

(defn- build-codex-resume-command
  [session-id prompt {:keys [codex-bin]}]
  (conj (codex-exec-prefix codex-bin)
        "resume" "--json" "--skip-git-repo-check" session-id prompt))

(defn- shell-quote
  [value]
  (let [text (str value)]
    (if (re-matches #"[A-Za-z0-9._:/=-]+" text)
      text
      (str "'" (string/replace text #"'" "'\"'\"'") "'"))))

(defn command-preview
  [command]
  (string/join " " (map shell-quote command)))

(defn codex-available?
  [codex-bin]
  (let [result (.spawnSync child-process
                           (or (trim-non-empty codex-bin) "codex")
                           #js ["--version"]
                           #js {:encoding "utf8"})]
    (zero? (or (.-status result) 1))))

(defn parse-codex-session-id-line
  [line]
  (try
    (let [payload (js->clj (js/JSON.parse line) :keywordize-keys true)]
      (or (:session-id payload)
          (:session_id payload)
          (:thread-id payload)
          (:thread_id payload)
          (get-in payload [:session :id])
          (get-in payload [:session :session-id])
          (get-in payload [:session :session_id])
          (get-in payload [:thread :id])
          (get-in payload [:thread :thread-id])
          (get-in payload [:thread :thread_id])))
    (catch :default _
      nil)))

(defn start-codex!
  [command {:keys [on-exit]}]
  (p/create
   (fn [resolve reject]
     (let [bin (first command)
           args (clj->js (vec (rest command)))
           child (.spawn child-process bin args #js {:stdio #js ["ignore" "pipe" "pipe"]})
           settled? (atom false)
           session-id* (atom nil)
           child-closed? (atom false)
           stdout-closed? (atom false)
           exit-code* (atom nil)
           stdout-buffer (atom "")
           settle! (fn [f value]
                     (when-not @settled?
                       (reset! settled? true)
                       (f value)))
           handle-line! (fn [line]
                          (when-let [session-id (parse-codex-session-id-line line)]
                            (reset! session-id* session-id)
                            (settle! resolve {:session session-id
                                              :status :running
                                              :process child})))
           flush-stdout-buffer! (fn []
                                  (when (seq @stdout-buffer)
                                    (handle-line! @stdout-buffer)
                                    (reset! stdout-buffer "")))
           finalize! (fn []
                       (when (and @child-closed? @stdout-closed?)
                         (flush-stdout-buffer!)
                         (when (fn? on-exit)
                           (on-exit @exit-code* @session-id*))
                         (when-not @settled?
                           (if (zero? (or @exit-code* 1))
                             (settle! reject (ex-info "codex exited before reporting a session id"
                                                      {:code :codex-session-id-missing}))
                             (settle! reject (ex-info "codex exited before startup completed"
                                                      {:code :codex-start-failed
                                                       :exit-code @exit-code*}))))))]
       (.on child "error"
            (fn [error]
              (settle! reject (ex-info "failed to start codex"
                                       {:code :codex-start-failed
                                        :cause error}))))
       (.on (.-stdout child) "data"
            (fn [chunk]
              (let [text (str @stdout-buffer (.toString chunk "utf8"))
                    lines (vec (.split text #"\r?\n"))
                    complete-lines (butlast lines)
                    trailing (last lines)]
                (reset! stdout-buffer trailing)
                (doseq [line complete-lines]
                  (handle-line! line)))))
       (.on (.-stdout child) "close"
            (fn []
              (reset! stdout-closed? true)
              (finalize!)))
       (.on (.-stderr child) "data" (fn [_chunk] nil))
       (.on child "close"
            (fn [code _signal]
              (reset! exit-code* code)
              (reset! child-closed? true)
              (finalize!)))))))

(defn- now-iso
  []
  (.toISOString (js/Date.)))

(defn- log-line
  [message]
  (str (now-iso) " " message))

(defn- bridge-error
  [code message]
  {:status :error
   :command :agent-bridge
   :error {:code code
           :message message}})

(defn- bridge-lock-name
  [graph agent-name]
  (str (js/encodeURIComponent (str graph))
       "--"
       (js/encodeURIComponent (str agent-name))
       ".lock"))

(defn- bridge-lock-dir
  [{:keys [root-dir]} graph agent-name]
  (node-path/join root-dir "agent-bridge-locks" (bridge-lock-name graph agent-name)))

(defn- bridge-lock-owner-path
  [lock-dir]
  (node-path/join lock-dir "owner.edn"))

(defn- process-running?
  [pid]
  (try
    (.kill js/process pid 0)
    true
    (catch :default e
      (not= "ESRCH" (.-code e)))))

(defn- stale-bridge-lock?
  [lock-dir]
  (try
    (let [owner (reader/read-string
                 (fs/readFileSync (bridge-lock-owner-path lock-dir) "utf8"))
          pid (:pid owner)]
      (and (integer? pid)
           (not (process-running? pid))))
    (catch :default _e
      true)))

(defn- bridge-lock-error
  [graph agent-name]
  {:ok? false
   :error {:code :agent-bridge-already-running
           :message (str "agent bridge is already running for graph '"
                         graph
                         "' and AgentBridge name '"
                         agent-name
                         "'")}})

(defn- acquire-bridge-lock!
  ([config graph agent-name]
   (acquire-bridge-lock! config graph agent-name false))
  ([config graph agent-name retried?]
   (let [lock-dir (bridge-lock-dir config graph agent-name)
         lock-parent (node-path/dirname lock-dir)]
     (fs/mkdirSync lock-parent #js {:recursive true})
     (try
       (fs/mkdirSync lock-dir)
       (let [released? (atom false)
             owner {:pid (.-pid js/process)
                    :graph graph
                    :agent agent-name
                    :started-at (now-iso)}
             release! (fn []
                        (when-not @released?
                          (reset! released? true)
                          (fs/rmSync lock-dir #js {:recursive true :force true})))]
         (fs/writeFileSync (bridge-lock-owner-path lock-dir) (pr-str owner) "utf8")
         (.once js/process "exit" (fn [& _] (release!)))
         {:ok? true
          :release! release!})
       (catch :default e
         (if (and (= "EEXIST" (.-code e))
                  (not retried?)
                  (stale-bridge-lock? lock-dir))
           (do
             (fs/rmSync lock-dir #js {:recursive true :force true})
             (acquire-bridge-lock! config graph agent-name true))
           (bridge-lock-error graph agent-name)))))))

(defn- with-bridge-lock!
  [config graph agent-name f]
  (let [lock-result (acquire-bridge-lock! config graph agent-name)]
    (if-not (:ok? lock-result)
      (bridge-error (get-in lock-result [:error :code])
                    (get-in lock-result [:error :message]))
      (-> (p/let [result (f)]
            result)
          (p/finally (fn []
                       ((:release! lock-result))))))))

(defn- log-bridge-exit!
  [{:keys [repo graph agent-name reason exit-code error]}]
  (log/info :agent-bridge-exit
            (cond-> {:reason reason
                     :exit-code exit-code
                     :repo repo
                     :graph graph
                     :agent-name agent-name
                     :message (or (some-> error ex-message)
                                  (some-> error str))}
              (some-> error ex-data :code)
              (assoc :error-code (-> error ex-data :code)))))

(def agent-bridge-registry-page "AgentBridge")

(def agent-bridge-registry-page-query
  '[:find [(pull ?p [:db/id
                     :block/uuid
                     :block/name
                     :block/title
                     :logseq.property/deleted-at
                     {:block/parent [:db/id
                                     :logseq.property/deleted-at
                                     {:block/parent [:db/id
                                                     :logseq.property/deleted-at]}]}]) ...]
    :in $ ?page-name
    :where
    [?p :block/name ?page-name]])

(def registered-agent-query
  '[:find [(pull ?p [:db/id
                     :block/uuid
                     :block/name
                     :block/title
                     :logseq.property/deleted-at
                     {:block/parent [:db/id
                                     :logseq.property/deleted-at
                                     {:block/parent [:db/id
                                                     :logseq.property/deleted-at]}]}]) ...]
    :in $ ?agent-page-name
    :where
    [?p :block/name ?agent-page-name]])

(def master-prompt-wrapper-title "AgentBridge master prompt")

(defn- default-master-prompt
  []
  (string/join
   "\n"
   ["# AgentBridge Master Agent"
    ""
    "## Role"
    "You are the graph-scoped master agent for Logseq AgentBridge."
    "Classify incoming work and decide whether to dispatch a simple, read-only project, or read/write project subagent."
    ""
    "## Graph Safety"
    "Do not operate outside the target graph."
    "Only the master agent may write task results back into the target graph."
    "Subagents may read graph context but must not write graph content."
	    "Subagents must return graph updates or final report content to the master agent instead of writing to the graph."
	    "When dispatching a subagent for a task, write the subagent Codex session id to the task block's `:logseq.property.agent/session-id` property."
	    "Child task blocks and comment requests under a task with `:logseq.property.agent/session-id` must continue in that same subagent session."
	    task-finish-reaction-line
	    "If the target graph is sync-enabled, make sure it is synced after writing back to the graph."
    ""
    "## Task Classification"
    "| Task type | Examples | Working directory | Write behavior | Concurrency |"
    "| --- | --- | --- | --- | --- |"
    "| Simple | Translation, rewrite, small lookup, simple search | Fresh temporary directory | No project writes | Can run concurrently |"
    "| Read-only project | Code review, code explanation, implementation lookup | Project directory | No writes | Can run concurrently |"
    "| Read/write project | Bug fix, feature implementation, test update | Project directory on new branch from `origin/master` | Writes allowed after branch setup | Only one at a time |"
    ""
    "Fail fast when task type is ambiguous and the consequence of choosing writable mode is material."
    ""
    "## Subagent Execution"
    "Run simple tasks in a clean temporary directory."
    "Run read-only project tasks in the project directory without write access expectations."
    "Writable project subagents must start from `origin/master` and create a new branch before modifying the project."
    "Serialize writable project subagents; keep only one writable project subagent active at a time."
    "Make the writable lock visible in graph reporting when a writable task waits."
    ""
    "## Result Reporting"
    "Keep graph reports short unless a blocker occurs."
    "Report blockers only if there is a blocker."
    "Report root cause and Steps to verify only for bug fixes."
    ""
    "## Failure Handling"
    "Fail fast on malformed graph state or unclear dispatch requirements."
    "Do not silently recover from programmer errors."]))

(def agent-master-prompt-blocks-query
  '[:find [(pull ?b [:db/id
                     :block/uuid
                     :block/title
                     :block/order
                     :logseq.property/deleted-at
                     {:block/parent [:db/id
                                     :logseq.property/deleted-at
                                     {:block/parent [:db/id
                                                     :logseq.property/deleted-at]}]}
                     {:block/_parent [:db/id
                                      :block/uuid
                                      :block/title
                                      :block/order
                                      :logseq.property/deleted-at
                                      {:block/tags [:db/id
                                                    :db/ident
                                                    :block/name
                                                    :block/title]}
                                      {:block/parent [:db/id
                                                      :logseq.property/deleted-at
                                                      {:block/parent [:db/id
                                                                      :logseq.property/deleted-at]}]}
                                      {:block/_parent [:db/id
                                                       :block/uuid
                                                       :block/title
                                                       :block/order
                                                       :logseq.property/deleted-at]}]}]) ...]
    :in $ ?page-id
    :where
    [?b :block/parent ?page-id]])

(declare ensure-registry-page!)

(def agent-bridge-prompt-template-blocks-query
  '[:find [(pull ?b [:db/id
                     :block/uuid
                     :block/title
                     :block/order
                     {:block/_parent [:db/id
                                      :block/uuid
                                      :block/title
                                      :block/order
                                      {:block/_parent [:db/id
                                                       :block/uuid
                                                       :block/title
                                                       :block/order]}]}]) ...]
    :in $ ?page-id
    :where
    [?b :block/parent ?page-id]])

(defn- prompt-template-default
  [template-kind]
  (case template-kind
    :task default-task-prompt-template
    :comment default-comment-prompt-template))

(defn- prompt-template-title
  [template-kind]
  (case template-kind
    :task task-prompt-template-title
    :comment comment-prompt-template-title))

(defn- prompt-template-var-description
  [template-kind]
  (case template-kind
    :task
    (string/join
     "\n"
     ["Template variables:"
      "```text"
      "'{{graph}}': The graph name passed to `logseq agent bridge`."
      "'{{block-uuid}}': The UUID of the routed task block."
      "'{{agent-name}}': The current AgentBridge name."
      "'{{task-block-tree}}': The routed task block tree rendered as outline text."
      "```"])

    :comment
    (string/join
     "\n"
     ["Template variables:"
      "```text"
      "'{{graph}}': The graph name passed to `logseq agent bridge`."
      "'{{comment-uuid}}': The UUID of the requesting comment block."
      "'{{agent-name}}': The current AgentBridge name."
      "'{{comment-target-context}}': The block trees targeted by the comments area."
      "'{{comment-thread-context}}': The complete comments area block tree."
      "'{{requesting-comment}}': The requesting comment block tree."
      "```"])))

(defn- prompt-template-description
  [template-kind]
  (case template-kind
    :task
    "Description: Used when AgentBridge routes an assigned TODO Task block to Codex."
    :comment
    "Description: Used when AgentBridge routes an AgentBridge mention in a Comment block to Codex."))

(defn- default-prompt-template-block
  [template-kind]
  {:block/title (prompt-template-title template-kind)
   :block/children [{:block/title (prompt-template-description template-kind)}
                    {:block/title (prompt-template-var-description template-kind)}
                    {:block/title (str "```text\n"
                                       (prompt-template-default template-kind)
                                       "\n```")}]})

(defn- ensure-prompt-template-block-uuids
  [blocks]
  (mapv (fn ensure-block-uuid [block]
          (let [block (cond-> block
                        (nil? (:block/uuid block))
                        (assoc :block/uuid (random-uuid)))]
            (if (seq (:block/children block))
              (update block :block/children ensure-prompt-template-block-uuids)
              block)))
        blocks))

(defn- flatten-prompt-template-blocks
  [blocks]
  (letfn [(walk [parent-uuid block]
            (let [children (:block/children block)
                  block-uuid (:block/uuid block)
                  block (cond-> (dissoc block :block/children)
                          parent-uuid
                          (assoc :block/parent [:block/uuid parent-uuid]))]
              (into [block]
                    (mapcat #(walk block-uuid %) children))))]
    (->> blocks
         ensure-prompt-template-block-uuids
         (mapcat #(walk nil %))
         vec)))

(defn- child-blocks
  [block]
  (->> (or (:block/children block)
           (:block/_parent block)
           [])
       (sort-by #(or (:block/order %) 0))))

(defn- block-title-tree
  [block]
  (cons (:block/title block)
        (mapcat block-title-tree (child-blocks block))))

(defn- code-blocks-in-text
  [text]
  (when (string? text)
    (map second (re-seq #"(?s)```[^\n`]*\n(.*?)```" text))))

(defn- default-master-prompt-block
  []
  {:block/title master-prompt-wrapper-title
   :block/children [{:block/title (default-master-prompt)
                     :block/tags [:logseq.class/Code-block]
                     :logseq.property.node/display-type :code
                     :logseq.property.code/lang "markdown"}]})

(defn- first-live-child-block
  [blocks]
  (first (remove ldb/recycled? (sort-by #(or (:block/order %) "") blocks))))

(defn- master-prompt-from-block
  [block]
  (when-not (= master-prompt-wrapper-title (:block/title block))
    (throw (ex-info "agent bridge master prompt wrapper is invalid"
                    {:code :agent-master-prompt-invalid
                     :reason :invalid-master-prompt-wrapper})))
  (let [prompts (->> (child-blocks block)
                     (remove ldb/recycled?)
                     (filter #(some code-block-tag? (:block/tags %)))
                     (keep (comp trim-non-empty :block/title))
                     vec)]
    (cond
      (empty? prompts)
      (throw (ex-info "agent bridge master prompt code block is missing"
                      {:code :agent-master-prompt-invalid
                       :reason :missing-master-prompt-code-block}))

      (> (count prompts) 1)
      (throw (ex-info "agent bridge master prompt must contain one code block"
                      {:code :agent-master-prompt-invalid
                       :reason :multiple-master-prompt-code-blocks}))

      :else
      (first prompts))))

(defn- prompt-template-from-block
  [template-kind block]
  (let [templates (vec (mapcat code-blocks-in-text (block-title-tree block)))
        renderable-templates (filterv #(-> (validate-prompt-template template-kind %) :ok?)
                                      templates)]
    (cond
      (empty? templates)
      (throw (ex-info "agent bridge prompt template code block is missing"
                      {:code :agent-prompt-template-invalid
                       :reason :missing-template-code-block
                       :template template-kind}))

      (= 1 (count renderable-templates))
      (first renderable-templates)

      (> (count renderable-templates) 1)
      (throw (ex-info "agent bridge prompt template must contain one code block"
                      {:code :agent-prompt-template-invalid
                       :reason :multiple-template-code-blocks
                       :template template-kind}))

      (= 1 (count templates))
      (do
        (validate-prompt-templates! {template-kind (first templates)})
        (first templates))

      :else
      (throw (ex-info "agent bridge prompt template code block is missing"
                      {:code :agent-prompt-template-invalid
                       :reason :missing-template-code-block
                       :template template-kind})))))

(defn- missing-template-code-block-error?
  [error]
  (let [data (ex-data error)]
    (and (= :agent-prompt-template-invalid (:code data))
         (= :missing-template-code-block (:reason data)))))

(defn- prompt-template-blocks-by-title
  [blocks]
  (reduce (fn [acc block]
            (let [title (:block/title block)]
              (if (contains? #{task-prompt-template-title
                               comment-prompt-template-title}
                             title)
                (assoc acc title block)
                acc)))
          {}
          blocks))

(defn ensure-agent-bridge-prompt-templates!
  [cfg repo]
  (p/let [page (ensure-registry-page! cfg repo)
          page-id (:db/id page)
          page-uuid (:block/uuid page)
          _ (when-not page-id
              (throw (ex-info "agent bridge registry page not found"
                              {:code :agent-prompt-template-initialization-failed})))
          _ (when-not page-uuid
              (throw (ex-info "agent bridge registry page uuid not found"
                              {:code :agent-prompt-template-initialization-failed})))
          blocks (transport/invoke cfg :thread-api/q
                                   [repo [agent-bridge-prompt-template-blocks-query page-id]])]
    (let [blocks-by-title (prompt-template-blocks-by-title blocks)
          template-state (reduce (fn [state template-kind]
                                   (if-let [block (get blocks-by-title (prompt-template-title template-kind))]
                                     (try
                                       (assoc-in state [:templates template-kind]
                                                 (prompt-template-from-block template-kind block))
                                       (catch :default e
                                         (if (missing-template-code-block-error? e)
                                           (assoc-in state [:repair-blocks template-kind] block)
                                           (throw e))))
                                     (update state :missing-kinds conj template-kind)))
                                 {:templates {}
                                  :missing-kinds []
                                  :repair-blocks {}}
                                 [:task :comment])
          existing-templates (:templates template-state)
          _ (validate-prompt-templates! existing-templates)
          missing-kinds (:missing-kinds template-state)
          repair-blocks (:repair-blocks template-state)]
      (p/let [_ (when (seq missing-kinds)
                  (transport/invoke cfg :thread-api/apply-outliner-ops
                                    [repo [[:insert-blocks [(flatten-prompt-template-blocks
                                                             (mapv default-prompt-template-block missing-kinds))
                                                            page-uuid
                                                            {:outliner-op :insert-blocks
                                                             :sibling? false
                                                             :bottom? true
                                                             :keep-uuid? true}]]]
                                     {}]))
              _ (when (seq repair-blocks)
                  (p/all
                   (mapv (fn [[template-kind block]]
                           (transport/invoke cfg :thread-api/apply-outliner-ops
                                             [repo [[:insert-blocks [(flatten-prompt-template-blocks
                                                                      (:block/children (default-prompt-template-block template-kind)))
                                                                     (:block/uuid block)
                                                                     {:outliner-op :insert-blocks
                                                                      :sibling? false
                                                                      :bottom? true
                                                                      :keep-uuid? true}]]]
                                              {}]))
                         repair-blocks)))]
        (validate-prompt-templates!
         (reduce (fn [templates template-kind]
                   (assoc templates
                          template-kind
                          (or (get existing-templates template-kind)
                              (prompt-template-default template-kind))))
                 {}
                 [:task :comment]))))))

(defn- first-live-entity
  [entities]
  (first (remove ldb/recycled? (filter :db/id entities))))

(defn- registry-page-name
  []
  (common-util/page-name-sanity-lc agent-bridge-registry-page))

(defn- agent-page-name
  [agent-name]
  (common-util/page-name-sanity-lc agent-name))

(defn- pull-registry-page
  [cfg repo]
  (p/let [pages (transport/invoke cfg :thread-api/q
                                  [repo [agent-bridge-registry-page-query
                                         (registry-page-name)]])]
    (first-live-entity pages)))

(defn- pull-agent-page
  [cfg repo agent-name]
  (p/let [pages (transport/invoke cfg :thread-api/q
                                  [repo [registered-agent-query
                                         (agent-page-name agent-name)]])]
    (first-live-entity pages)))

(defn- ensure-registry-page!
  [cfg repo]
  (p/let [existing (pull-registry-page cfg repo)]
    (if (:db/id existing)
      existing
      (p/let [result (transport/invoke cfg :thread-api/apply-outliner-ops
                                       [repo [[:create-page [agent-bridge-registry-page {}]]] {}])
              page-uuid (second result)]
        (if page-uuid
          (transport/invoke cfg :thread-api/pull
                            [repo [:db/id :block/uuid :block/name :block/title] [:block/uuid page-uuid]])
          (pull-registry-page cfg repo))))))

(defn register-agent-bridge!
  [cfg repo agent-name]
  (p/let [page (ensure-registry-page! cfg repo)
          page-id (:db/id page)
          page-uuid (:block/uuid page)
          _ (when-not page-id
              (throw (ex-info "agent bridge registry page not found"
                              {:code :agent-registration-failed})))
          _ (when-not page-uuid
              (throw (ex-info "agent bridge registry page uuid not found"
                              {:code :agent-registration-failed})))
          existing (transport/invoke cfg :thread-api/q
                                     [repo [registered-agent-query
                                            (agent-page-name agent-name)]])]
    (if (first-live-entity existing)
      true
      (p/let [result (transport/invoke cfg :thread-api/apply-outliner-ops
                                       [repo [[:create-page [agent-name {}]]] {}])]
        (if (second result)
          true
          (p/let [created (transport/invoke cfg :thread-api/q
                                            [repo [registered-agent-query
                                                   (agent-page-name agent-name)]])]
            (if (first-live-entity created)
              true
              (throw (ex-info "agent bridge agent page not found after create"
                              {:code :agent-registration-failed})))))))))

(defn ensure-agent-master-prompt!
  [cfg repo agent-name]
  (p/let [agent-page (pull-agent-page cfg repo agent-name)
          page-id (:db/id agent-page)
          page-uuid (:block/uuid agent-page)
          _ (when-not page-id
              (throw (ex-info "agent bridge agent page not found"
                              {:code :agent-master-prompt-initialization-failed})))
          _ (when-not page-uuid
              (throw (ex-info "agent bridge agent page uuid not found"
                              {:code :agent-master-prompt-initialization-failed})))
          blocks (transport/invoke cfg :thread-api/q
                                   [repo [agent-master-prompt-blocks-query page-id]])]
    (if-let [first-block (first-live-child-block blocks)]
      (master-prompt-from-block first-block)
      (p/let [_ (transport/invoke cfg :thread-api/apply-outliner-ops
                                  [repo [[:insert-blocks [(flatten-prompt-template-blocks
                                                           [(default-master-prompt-block)])
                                                          page-uuid
                                                          {:outliner-op :insert-blocks
                                                           :sibling? false
                                                           :bottom? false
                                                           :keep-uuid? true}]]]
                                   {}])]
        (default-master-prompt)))))

(defn write-agent-session-id!
  [cfg repo block-uuid session-id]
  (p/let [_ (transport/invoke cfg :thread-api/apply-outliner-ops
                              [repo [[:batch-set-property [[block-uuid]
                                                            agent-session-id-property-ident
                                                            session-id
                                                            {}]]]
                               {}])]
    true))

(def ^:private task-start-reaction "eyes")
(def ^:private comment-start-reaction "eyes")

(def ^:private reaction-query
  '[:find ?r .
    :in $ ?target-uuid ?emoji-id
    :where
    [?target :block/uuid ?target-uuid]
    [?r :logseq.property.reaction/target ?target]
    [?r :logseq.property.reaction/emoji-id ?emoji-id]
    [(missing? $ ?r :logseq.property/created-by-ref)]])

(defn- ensure-reaction!
  [cfg repo target-uuid emoji-id]
  (p/let [existing (transport/invoke cfg :thread-api/q [repo [reaction-query target-uuid emoji-id]])]
    (when-not (some? existing)
      (transport/invoke cfg :thread-api/apply-outliner-ops
                        [repo [[:toggle-reaction [target-uuid emoji-id nil]]] {}]))))

(def ^:private task-status-query
  '[:find ?status-ident .
    :in $ ?block-uuid
    :where
    [?block :block/uuid ?block-uuid]
    [?block :logseq.property/status ?status]
    [?status :db/ident ?status-ident]])

(defn- mark-agent-bridge-task-started!
  [cfg repo block]
  (let [block-uuid (:block/uuid block)]
    (p/let [_ (ensure-reaction! cfg repo block-uuid task-start-reaction)
            current-status (when (contains? block :logseq.property/status)
                             (transport/invoke cfg :thread-api/q [repo [task-status-query block-uuid]]))
            _ (when (= :logseq.property/status.todo current-status)
                (transport/invoke cfg :thread-api/apply-outliner-ops
                                  [repo [[:batch-set-property [[block-uuid]
                                                                :logseq.property/status
                                                                :logseq.property/status.doing
                                                                {}]]]
                                   {}]))]
      true)))

(def ^:private routable-task-query
  '[:find [(pull ?e [:db/id
                     :block/uuid
                     :block/title
                     {:block/tags [:db/ident :block/title]}
                     {:logseq.property/status [:db/ident :block/title]}
                     {:logseq.property/assignee [:db/id :block/title :block/name :db/ident]}
                     :logseq.property.agent/session-id
                     {:block/parent [:db/id]}
                     *]) ...]
    :in $ ?agent-name
    :where
    [?e :block/tags :logseq.class/Task]
    [?e :logseq.property/status ?status]
    [?status :db/ident :logseq.property/status.todo]
    [?assignee-property :block/name "assignee"]
    [?assignee-property :db/ident ?assignee-attr]
    [?e ?assignee-attr ?assignee-ref]
    [?assignee-ref :block/title ?agent-name]])

(defn list-routable-tasks
  [cfg repo agent-name]
  (p/let [blocks (transport/invoke cfg :thread-api/q [repo [routable-task-query agent-name]])]
    (p/all
     (mapv (fn [block]
             (p/let [show-result (show-command/execute-show {:type :show
                                                             :repo repo
                                                             :uuid (block-uuid-str block)
                                                             :level 100
                                                             :linked-references? false
                                                             :ref-id-footer? false}
                                                            cfg)]
               {:block block
                :tree-text (or (get-in show-result [:data :message])
                               (:block/title block))}))
           (filter #(routable-task? % agent-name) blocks)))))

(defn- emit-log!
  [config line]
  (if-let [f (:log-fn config)]
    (f line)
    (.write (.-stdout js/process) (str line "\n"))))

(defn ensure-master-session!
  [cfg {:keys [master-prompt]}]
  (let [command (build-codex-command master-prompt {})
        preview (command-preview command)]
    (emit-log! cfg (log-line (str "Codex master command prepared: " preview)))
    (p/let [{:keys [session] :as result} (start-codex! command {})
            _ (when-not (seq session)
                (throw (ex-info "codex master session id missing"
                                {:code :codex-session-id-missing})))]
      result)))

(defn- dispatch-to-master!
  [cfg {:keys [master-session]} {:keys [prompt request block]}]
  (let [command (build-codex-resume-command master-session prompt {})
        preview (command-preview command)]
    (emit-log! cfg (log-line (str "Codex master dispatch prepared"
                                  (when block (str " for " (block-uuid-str block)))
                                  ": " preview)))
    (p/let [{:keys [session]} (start-codex! command {})
            _ (when-not (seq session)
                (throw (ex-info "codex master dispatch session id missing"
                                {:code :codex-session-id-missing})))]
      {:block (some-> block block-uuid-str)
       :session session
       :backend :codex
       :request request
       :preview preview})))

(declare nearest-ancestor-task-session)

(defn- dispatch-task-to-master!
  [cfg {:keys [repo graph agent-name project-dir] :as opts} {:keys [block tree-text]}]
  (p/let [inherited-session (nearest-ancestor-task-session cfg repo block)
          result (dispatch-to-master!
                  cfg
                  opts
                  {:request :task
                   :block block
                   :prompt (build-master-task-dispatch-prompt {:graph graph
                                                               :agent-name agent-name
                                                               :project-dir project-dir
                                                               :block block
                                                               :tree-text tree-text
                                                               :inherited-session inherited-session})})
          _ (mark-agent-bridge-task-started! cfg repo block)]
    result))

(defn- claim-routing-block!
  [routing-blocks* block-id]
  (loop []
    (let [routing-blocks @routing-blocks*]
      (cond
        (contains? routing-blocks block-id)
        false

        (compare-and-set! routing-blocks* routing-blocks (conj routing-blocks block-id))
        true

        :else
        (recur)))))

(defn- master-session-required-error
  [request opts]
  (when-not (seq (:master-session opts))
    (ex-info "AgentBridge routing requires an active master session"
             {:code :agent-bridge-master-session-required
              :request request})))

(defn- route-task-once!
  [cfg {:keys [routing-blocks*] :as opts} {:keys [block] :as task}]
  (if-let [e (master-session-required-error :task opts)]
    (p/rejected e)
    (let [block-id (block-uuid-str block)]
      (if (and routing-blocks* block-id)
        (if (claim-routing-block! routing-blocks* block-id)
          (-> (dispatch-task-to-master! cfg opts task)
              (p/finally (fn []
                           (swap! routing-blocks* disj block-id))))
          (p/resolved nil))
        (dispatch-task-to-master! cfg opts task)))))

(def ^:private max-concurrent-routes 4)

(defn- p-map-batched
  [limit f coll]
  (reduce (fn [result-promise batch]
            (p/let [result result-promise
                    batch-result (p/all (mapv f batch))]
              (into result batch-result)))
          (p/resolved [])
          (partition-all limit coll)))

(defn- process-tasks!
  [cfg {:keys [repo graph agent-name prompt-templates routing-blocks* master-session project-dir]}]
  (p/let [tasks (list-routable-tasks cfg repo agent-name)]
    (p-map-batched max-concurrent-routes
                   #(route-task-once! cfg {:repo repo
                                           :graph graph
                                           :agent-name agent-name
                                           :prompt-templates prompt-templates
                                           :master-session master-session
                                           :project-dir project-dir
                                           :routing-blocks* routing-blocks*}
                                      %)
                   tasks)))

(def ^:private assignee-property-ident :logseq.property/assignee)

(def ^:private assignee-value-selector
  [:db/id :block/title :block/name])

(def ^:private assignee-property-selector
  [:db/id :db/ident])

(def ^:private task-block-selector
  [:db/id
   :block/uuid
   :block/title
   {:block/tags [:db/ident :block/title]}
   {:logseq.property/status [:db/ident :block/title]}
   {:logseq.property/assignee [:db/id :block/title :block/name :db/ident]}
   :logseq.property.agent/session-id
   {:block/parent [:db/id]}
   '*])

(def ^:private task-ancestor-session-selector
  [:db/id
   :block/uuid
   :block/title
   {:block/tags [:db/ident :block/title]}
   :logseq.property.agent/session-id
   {:block/parent [:db/id]}])

(defn- block-db-id
  [value]
  (cond
    (map? value) (:db/id value)
    (number? value) value
    :else nil))

(defn- parent-block-id
  [block]
  (block-db-id (:block/parent block)))

(defn- nearest-ancestor-task-session
  [cfg repo block]
  (letfn [(step [parent-id]
            (if-not parent-id
              (p/resolved nil)
              (p/let [parent (transport/invoke cfg :thread-api/pull
                                                [repo task-ancestor-session-selector parent-id])
                      session-id (trim-non-empty
                                  (get parent agent-session-id-property-ident))]
                (if (and session-id
                         (some task-tag? (:block/tags parent)))
                  {:parent-block-uuid (:block/uuid parent)
                   :session-id session-id}
                  (step (parent-block-id parent))))))]
    (step (parent-block-id block))))

(def ^:private comment-block-selector
  [:db/id
   :block/uuid
   :block/title
   {:block/tags [:db/ident :block/title]}
   {:block/refs [:db/id :block/title :block/name]}
   {:block/parent [:db/id :block/uuid :block/title {:block/tags [:db/ident :block/title]}]}
   '*])

(defn- comment-target-block-selector
  [session-property-ident]
  (cond-> [:db/id
           :block/uuid
           :block/title
           {:logseq.property/assignee [:db/id :block/title :block/name :db/ident]}]
    session-property-ident (conj session-property-ident)
    true (conj '*)))

(defn- comments-area-selector
  [session-property-ident]
  [:db/id
   :block/uuid
   :block/title
   {:block/tags [:db/ident :block/title]}
   {:logseq.property.comments/blocks (comment-target-block-selector session-property-ident)}])

(defn- unknown-attr-datom?
  [datom]
  (let [attr (:a datom)]
    (and (true? (:added datom))
         (some? attr)
         (not (keyword? attr)))))

(defn- direct-assignee-datom?
  [datom]
  (and (true? (:added datom))
       (= assignee-property-ident (:a datom))))

(defn- comment-title-datom?
  [datom agent-name]
  (and (true? (:added datom))
       (seq agent-name)
       (= :block/title (:a datom))
       (string? (:v datom))
       (or (string/includes? (:v datom) (str "[[" agent-name "]]"))
           (string/includes? (:v datom) "[["))))

(def ^:private routability-entity-selector
  [:db/id :db/ident])

(defn- task-routability-attr?
  [attr]
  (or (= :block/tags attr)
      (= :logseq.property/status attr)))

(defn- task-routability-ident?
  [attr ident]
  (case attr
    :block/tags (= :logseq.class/Task ident)
    :logseq.property/status (= :logseq.property/status.todo ident)
    false))

(defn- resolve-routability-datom-ident
  [cfg repo datom]
  (let [value (:v datom)]
    (if (keyword? value)
      (p/resolved value)
      (p/let [entity (transport/invoke cfg :thread-api/pull [repo routability-entity-selector value])]
        (:db/ident entity)))))

(defn- resolve-routability-datoms
  [cfg repo tx-data]
  (let [candidates (filter #(and (true? (:added %))
                                  (task-routability-attr? (:a %)))
                           tx-data)]
    (p/let [resolved (p/all
                      (mapv (fn [datom]
                              (p/let [ident (resolve-routability-datom-ident cfg repo datom)]
                                (when (task-routability-ident? (:a datom) ident)
                                  datom)))
                            candidates))]
      (keep identity resolved))))

(defn- pull-assignee-property
  [cfg repo]
  (transport/invoke cfg :thread-api/pull [repo assignee-property-selector assignee-property-ident]))

(defn- resolve-assignee-datoms
  [cfg repo tx-data]
  (let [direct-datoms (filter direct-assignee-datom? tx-data)
        unknown-attr-datoms (filter unknown-attr-datom? tx-data)]
    (if (seq unknown-attr-datoms)
      (p/let [property (pull-assignee-property cfg repo)
              property-id (:db/id property)]
        (concat direct-datoms
                (filter #(= property-id (:a %)) unknown-attr-datoms)))
      (p/resolved direct-datoms))))

(defn- direct-assignee-title
  [value]
  (trim-non-empty (:block/title value)))

(defn- assignee-value-matches?
  [cfg repo value agent-name]
  (p/let [entity (transport/invoke cfg :thread-api/pull [repo assignee-value-selector value])]
    (= agent-name (direct-assignee-title entity))))

(defn- pull-task-block
  [cfg repo block-id]
  (transport/invoke cfg :thread-api/pull [repo task-block-selector block-id]))

(defn- show-task-tree
  [cfg repo block]
  (p/let [show-result (show-command/execute-show {:type :show
                                                  :repo repo
                                                  :uuid (block-uuid-str block)
                                                  :level 100
                                                  :linked-references? false
                                                  :ref-id-footer? false}
                                                 cfg)]
    (or (get-in show-result [:data :message])
        (:block/title block))))

(defn- show-block-tree
  [cfg repo block]
  (p/let [show-result (show-command/execute-show {:type :show
                                                  :repo repo
                                                  :uuid (block-uuid-str block)
                                                  :level 100
                                                  :linked-references? false
                                                  :ref-id-footer? false}
                                                 cfg)]
    (or (get-in show-result [:data :message])
        (:block/title block))))

(defn- comment-tag?
  [tag]
  (= :logseq.class/Comment (:db/ident tag)))

(defn- comments-area-tag?
  [tag]
  (= :logseq.class/Comments (:db/ident tag)))

(defn- comment-block?
  [block agent-name]
  (and (:block/uuid block)
       (some comment-tag? (:block/tags block))
       (or (string/includes? (:block/title block) (str "[[" agent-name "]]"))
           (contains? (set (keep :block/title (:block/refs block))) agent-name))))

(defn- comments-area?
  [block]
  (some comments-area-tag? (:block/tags block)))

(defn- pull-comment-block
  [cfg repo block-id]
  (transport/invoke cfg :thread-api/pull [repo comment-block-selector block-id]))

(defn- pull-comments-area
  [cfg repo comment-block session-property-ident]
  (let [parent-id (get-in comment-block [:block/parent :db/id])]
    (when-not parent-id
      (throw (ex-info "comment block parent is missing"
                      {:code :agent-comment-parent-missing
                       :block (block-uuid-str comment-block)})))
    (transport/invoke cfg :thread-api/pull [repo (comments-area-selector session-property-ident) parent-id])))

(defn- ensure-comment-reaction!
  [cfg repo target-uuid emoji-id]
  (ensure-reaction! cfg repo target-uuid emoji-id))

(defn- dispatch-comment-to-master!
  [cfg {:keys [repo graph agent-name project-dir] :as opts} comment-block]
  (p/let [comment-uuid (:block/uuid comment-block)
          _ (when-not comment-uuid
              (throw (ex-info "comment block uuid is missing"
                              {:code :agent-comment-uuid-missing})))
          comments-area (pull-comments-area cfg repo comment-block agent-session-id-property-ident)
          _ (when-not (comments-area? comments-area)
              (throw (ex-info "comment parent is not a comments area"
                              {:code :agent-comment-parent-invalid
                               :block (block-uuid-str comment-block)})))
          target-blocks (vec (:logseq.property.comments/blocks comments-area))
          target-tree-texts (p/all (mapv #(show-block-tree cfg repo %) target-blocks))
          comments-area-tree-text (show-block-tree cfg repo comments-area)
          comment-tree-text (show-block-tree cfg repo comment-block)
          result (dispatch-to-master!
                  cfg
                  opts
                  {:request :comment
                   :block comment-block
                   :prompt (build-master-comment-dispatch-prompt
                            {:graph graph
                             :agent-name agent-name
                             :project-dir project-dir
                             :comment comment-block
                             :target-tree-texts target-tree-texts
                             :comments-area-tree-text comments-area-tree-text
                             :comment-tree-text comment-tree-text})})
          _ (ensure-comment-reaction! cfg repo comment-uuid comment-start-reaction)]
    result))

(defn- route-comment-once!
  [cfg {:keys [routing-blocks*] :as opts} comment-block]
  (if-let [e (master-session-required-error :comment opts)]
    (p/rejected e)
    (let [block-id (block-uuid-str comment-block)]
      (if (and routing-blocks* block-id)
        (if (claim-routing-block! routing-blocks* block-id)
          (-> (dispatch-comment-to-master! cfg opts comment-block)
              (p/finally (fn []
                           (swap! routing-blocks* disj block-id))))
          (p/resolved nil))
        (dispatch-comment-to-master! cfg opts comment-block)))))

(defn- route-assignee-datom!
  [cfg {:keys [repo agent-name] :as opts} datom]
  (let [block-id (:e datom)
        assignee-value (:v datom)]
    (when block-id
      (p/let [matches? (assignee-value-matches? cfg repo assignee-value agent-name)]
        (when matches?
          (p/let [block (pull-task-block cfg repo block-id)]
            (when (routable-task? block agent-name)
              (p/let [tree-text (show-task-tree cfg repo block)]
                (route-task-once! cfg opts {:block block
                                            :tree-text tree-text})))))))))

(defn- route-routability-datom!
  [cfg {:keys [repo agent-name] :as opts} datom]
  (when-let [block-id (:e datom)]
    (p/let [block (pull-task-block cfg repo block-id)]
      (when (routable-task? block agent-name)
        (p/let [tree-text (show-task-tree cfg repo block)]
          (route-task-once! cfg opts {:block block
                                      :tree-text tree-text}))))))

(defn- route-comment-datom!
  [cfg {:keys [repo agent-name] :as opts} datom]
  (when-let [block-id (:e datom)]
    (p/let [comment-block (pull-comment-block cfg repo block-id)]
      (when (comment-block? comment-block agent-name)
        (route-comment-once! cfg opts comment-block)))))

(defn- route-task-candidate-id!
  [cfg {:keys [repo agent-name] :as opts} block-id]
  (when block-id
    (p/let [block (pull-task-block cfg repo block-id)]
      (when (routable-task? block agent-name)
        (p/let [tree-text (show-task-tree cfg repo block)]
          (route-task-once! cfg opts {:block block
                                      :tree-text tree-text}))))))

(defn- route-comment-candidate-id!
  [cfg {:keys [repo agent-name] :as opts} block-id]
  (when block-id
    (p/let [comment-block (pull-comment-block cfg repo block-id)]
      (when (comment-block? comment-block agent-name)
        (route-comment-once! cfg opts comment-block)))))

(defn- process-sync-db-changes-event!
  [cfg {:keys [repo] :as opts} {:keys [tx-data task-route-candidate-ids comment-route-candidate-ids]}]
  (p/let [assignee-datoms (resolve-assignee-datoms cfg repo tx-data)
          routability-datoms (resolve-routability-datoms cfg repo tx-data)]
    (let [comment-datoms (filter #(comment-title-datom? % (:agent-name opts)) tx-data)
          routing (vec (concat (map #(route-assignee-datom! cfg opts %) assignee-datoms)
                               (map #(route-routability-datom! cfg opts %) routability-datoms)
                               (map #(route-comment-datom! cfg opts %) comment-datoms)
                               (map #(route-task-candidate-id! cfg opts %) (distinct task-route-candidate-ids))
                               (map #(route-comment-candidate-id! cfg opts %) (distinct comment-route-candidate-ids))))]
      (when (seq routing)
        (p/all routing)))))

(defn- listen-forever!
  [cfg {:keys [repo graph agent-name prompt-templates routing-blocks* master-session project-dir]}]
  (let [routing-blocks* (or routing-blocks* (atom #{}))
        handle-error! (fn [e]
                        (emit-log! cfg (log-line (str "Codex invocation failed: "
                                                      (or (ex-message e) (str e)))))
                        (log-bridge-exit! {:repo repo
                                           :graph graph
                                           :agent-name agent-name
                                           :reason :task-processing-failed
                                           :exit-code 1
                                           :error e})
                        (.exit js/process 1))
        process! (fn [payload]
                   (try
                     (-> (process-sync-db-changes-event! cfg
                                                         {:repo repo
                                                          :graph graph
                                                          :agent-name agent-name
                                                          :prompt-templates prompt-templates
                                                          :master-session master-session
                                                          :project-dir project-dir
                                                          :routing-blocks* routing-blocks*}
                                                         payload)
                         (p/catch handle-error!))
                     (catch :default e
                       (handle-error! e))))]
    (transport/connect-events! cfg
                               (fn [event-type payload]
                                 (when (= :sync-db-changes event-type)
                                   (emit-log! cfg (log-line "got graph changes: sync-db-changes"))
                                   (process! payload))))
    (p/create (fn [_resolve _reject] nil))))

(defn execute-bridge
  [action config]
  (let [repo (:repo action)
        graph (:graph action)
        logs [(log-line "checking the environment ...")
              (log-line (str "using graph: " graph))]]
    (p/let [agent-name-result (resolve-agent-name config)]
      (if-not (:ok? agent-name-result)
        (bridge-error (get-in agent-name-result [:error :code])
                      (get-in agent-name-result [:error :message]))
        (let [agent-name (:agent-name agent-name-result)
              logs (conj logs
                         (log-line (str "using agent name: " agent-name))
                         (log-line "checking codex cli ..."))]
          (with-bridge-lock! config graph agent-name
            (fn []
              (if-not (codex-available? nil)
                (bridge-error :codex-not-found "codex executable is not available")
                (p/let [cfg (cli-server/ensure-server! config repo)
                        logs (conj logs (log-line "registering agent bridge ..."))
                        _ (register-agent-bridge! cfg repo agent-name)
                        logs (conj logs (log-line "checking master prompt ..."))
                        master-prompt (ensure-agent-master-prompt! cfg repo agent-name)
                        logs (conj logs (log-line "checking prompt templates ..."))
                        prompt-templates (ensure-agent-bridge-prompt-templates! cfg repo)]
                  (if (:process-once? action)
                    (p/let [master-record (ensure-master-session! cfg {:graph graph
                                                                       :agent-name agent-name
                                                                       :master-prompt master-prompt})
                            master-session (:session master-record)]
                      (doseq [line (conj logs (log-line "listening graph changes ..."))]
                        (emit-log! cfg line))
                      (let [routing-blocks* (atom #{})]
                        (p/let [routed (process-tasks! cfg {:repo repo
                                                            :graph graph
                                                            :agent-name agent-name
                                                            :prompt-templates prompt-templates
                                                            :master-session master-session
                                                            :project-dir (:project-dir config)
                                                            :routing-blocks* routing-blocks*})]
                          {:status :ok
                           :command :agent-bridge
                           :data {:mode :processed-once
                                  :graph graph
                                  :agent-name agent-name
                                  :routed routed}})))
                    (p/let [master-record (ensure-master-session! cfg {:graph graph
                                                                       :agent-name agent-name
                                                                       :master-prompt master-prompt})
                            master-session (:session master-record)]
                      (let [routing-blocks* (atom #{})
                            listen-promise (listen-forever! cfg {:repo repo
                                                                 :graph graph
                                                                 :agent-name agent-name
                                                                 :prompt-templates prompt-templates
                                                                 :master-session master-session
                                                                 :project-dir (:project-dir config)
                                                                 :routing-blocks* routing-blocks*})]
                        (doseq [line (conj logs (log-line "listening graph changes ..."))]
                          (emit-log! cfg line))
                        (p/let [_ (process-tasks! cfg {:repo repo
                                                       :graph graph
                                                       :agent-name agent-name
                                                       :prompt-templates prompt-templates
                                                       :master-session master-session
                                                       :project-dir (:project-dir config)
                                                       :routing-blocks* routing-blocks*})]
                          listen-promise)))))))))))))
