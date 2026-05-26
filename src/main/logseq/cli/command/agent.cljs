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

(def ^:private bridge-spec
  {:dry-run {:desc "Print Codex commands without starting Codex or writing agent-session-id"
             :coerce :boolean}})

(def entries
  [(core/command-entry ["agent" "bridge"]
                       :agent-bridge
                       "Run task agent bridge"
                       bridge-spec
                       {:examples ["logseq agent bridge --graph my-graph"
                                   "logseq agent bridge --graph my-graph --dry-run"]})])

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
  [command options repo graph]
  (case command
    :agent-bridge
    (if-not (seq repo)
      {:ok? false
       :error {:code :missing-repo
               :message "repo is required for agent bridge"}}
      {:ok? true
       :action {:type :agent-bridge
                :repo repo
                :graph graph
                :dry-run? (boolean (:dry-run options))}})

    {:ok? false
     :error {:code :unknown-command
             :message (str "unknown agent command: " command)}}))

(def ^:private agent-session-id-property-ident :logseq.property.agent/session-id)

(defn- task-tag?
  [tag]
  (= :logseq.class/Task (:db/ident tag)))

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

(def ^:private default-task-prompt-template
  (string/join
   "\n"
   ["You are handling a Logseq AgentBridge task."
    ""
    "Graph: {{graph}}"
    "Block UUID: {{block-uuid}}"
    "AgentBridge name: {{agent-name}}"
    ""
    "Do not operate outside the target graph."
    "Write task results back into the graph."
    "If the target graph is sync-enabled, make sure it is synced after writing back to the graph."
    "Keep the report short when possible."
    "Report blockers only if there is a blocker."
    "Report root cause and Steps to verify only for bug fixes."
    ""
    "Task block tree:"
    "{{task-block-tree}}"]))

(def ^:private default-comment-prompt-template
  (string/join
   "\n"
   ["You are handling a Logseq AgentBridge comment request."
    ""
    "Graph: {{graph}}"
    "Comment UUID: {{comment-uuid}}"
    "AgentBridge name: {{agent-name}}"
    ""
    "Do not operate outside the target graph."
    "Complete the request from the mentioned comment."
    "If the target graph is sync-enabled, make sure it is synced after writing back to the graph."
    "Keep the report short when possible."
    "Report blockers only if there is a blocker."
    "Report root cause and Steps to verify only for bug fixes."
    ""
    "Comment target context:"
    "{{comment-target-context}}"
    ""
    "Comment thread context:"
    "{{comment-thread-context}}"
    ""
    "Requesting comment:"
    "{{requesting-comment}}"
    ""
    "Reply instructions:"
    "For a short reply, append a comment after the requesting comment."
    "For a long reply, write a normal block tree after the comments area and append a comment that references that tree."
    "When referencing result blocks in DB graphs, reference result blocks with [[block-uuid]], not ((block-uuid))."
    "If the request is blocked or fails, make that clear in the reply."]))

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

(defn- build-comment-codex-prompt
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
  [command {:keys [cwd on-exit]}]
  (p/create
   (fn [resolve reject]
     (let [bin (first command)
           args (clj->js (vec (rest command)))
           spawn-opts (cond-> {:stdio #js ["ignore" "pipe" "pipe"]}
                        (seq (trim-non-empty cwd))
                        (assoc :cwd cwd))
           child (.spawn child-process bin args (clj->js spawn-opts))
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

(defn session-store-path
  [{:keys [root-dir]}]
  (node-path/join root-dir "agent-bridge-sessions.edn"))

(defn- read-session-store
  [config]
  (let [path (session-store-path config)]
    (if (fs/existsSync path)
      (reader/read-string (fs/readFileSync path "utf8"))
      {:sessions []})))

(defn- write-session-store!
  [config store]
  (let [path (session-store-path config)
        dir (node-path/dirname path)]
    (fs/mkdirSync dir #js {:recursive true})
    (fs/writeFileSync path (pr-str store) "utf8")
    store))

(def ^:private terminal-session-statuses #{:completed :failed})

(defn- merge-session-record
  [existing session]
  (let [merged (merge existing session)]
    (if (and (contains? terminal-session-statuses (:status existing))
             (= :running (:status session)))
      (assoc merged :status (:status existing))
      merged)))

(defn record-session!
  [config session]
  (let [store (read-session-store config)
        sessions (vec (:sessions store))
        session-id (:session session)
        sessions' (if (some #(= session-id (:session %)) sessions)
                    (mapv (fn [existing]
                            (if (= session-id (:session existing))
                              (merge-session-record existing session)
                              existing))
                          sessions)
                    (conj sessions session))]
    (write-session-store! config (assoc store :sessions sessions'))
    session))

(defn update-session-status!
  [config session-id status]
  (record-session! config {:session session-id
                           :status status
                           :updated-at (js/Date.now)}))

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

(defn- git-command
  [cwd args]
  (let [result (.spawnSync child-process
                           "git"
                           (clj->js (into ["-C" cwd] args))
                           #js {:encoding "utf8"})
        status (or (.-status result) 1)
        stdout (or (.-stdout result) "")
        stderr (or (.-stderr result) "")]
    {:ok? (zero? status)
     :status status
     :stdout stdout
     :stderr stderr}))

(defn- git-command!
  [cwd args error-code message]
  (let [{:keys [ok? status stderr] :as result} (git-command cwd args)]
    (when-not ok?
      (throw (ex-info message
                      {:code error-code
                       :cwd cwd
                       :git-args args
                       :exit-code status
                       :stderr stderr})))
    result))

(defn- workspace-clean?
  [{:keys [cwd]}]
  (let [{:keys [ok? stdout]} (git-command cwd ["status" "--porcelain"])]
    (and ok? (string/blank? stdout))))

(defn- validate-workspace-config!
  [workspace]
  (let [id (trim-non-empty (:id workspace))
        cwd (trim-non-empty (:cwd workspace))]
    (cond
      (not id)
      (throw (ex-info "agent bridge workspace id must be a non-empty string"
                      {:code :agent-workspace-invalid}))

      (not cwd)
      (throw (ex-info "agent bridge workspace cwd must be a non-empty string"
                      {:code :agent-workspace-invalid
                       :workspace-id id}))

      (not (node-path/isAbsolute cwd))
      (throw (ex-info "agent bridge workspace cwd must be an absolute path"
                      {:code :agent-workspace-invalid
                       :workspace-id id
                       :cwd cwd}))

      (not (fs/existsSync cwd))
      (throw (ex-info "agent bridge workspace cwd does not exist"
                      {:code :agent-workspace-invalid
                       :workspace-id id
                       :cwd cwd}))

      (not (.isDirectory (fs/statSync cwd)))
      (throw (ex-info "agent bridge workspace cwd must be a directory"
                      {:code :agent-workspace-invalid
                       :workspace-id id
                       :cwd cwd})))

    (git-command! cwd ["rev-parse" "--is-inside-work-tree"]
                  :agent-workspace-invalid
                  "agent bridge workspace cwd must be a git repository")
    (when-not (workspace-clean? {:cwd cwd})
      (throw (ex-info "agent bridge workspace must be clean before startup"
                      {:code :agent-workspace-invalid
                       :workspace-id id
                       :cwd cwd})))
    {:id id
     :cwd cwd
     :status :idle}))

(defn- resolve-workspaces!
  [config graph]
  (when-let [workspaces-by-graph (:workspaces config)]
    (when-not (map? workspaces-by-graph)
      (throw (ex-info "agent bridge workspaces must be a map keyed by graph name"
                      {:code :agent-workspace-invalid})))
    (let [workspaces (vec (get workspaces-by-graph graph))]
      (when (seq workspaces)
        (let [resolved (mapv validate-workspace-config! workspaces)
              ids (mapv :id resolved)]
          (when-not (= (count ids) (count (set ids)))
            (throw (ex-info "agent bridge workspace ids must be unique"
                            {:code :agent-workspace-invalid
                             :graph graph})))
          resolved)))))

(defn- make-workspace-pool
  [workspaces]
  (when (seq workspaces)
    (atom workspaces)))

(defn- set-workspace-status!
  [workspace-pool workspace-id status]
  (when (and workspace-pool workspace-id)
    (swap! workspace-pool
           (fn [workspaces]
             (mapv (fn [workspace]
                     (if (= workspace-id (:id workspace))
                       (assoc workspace :status status)
                       workspace))
                   workspaces)))))

(defn- acquire-workspace!
  ([workspace-pool]
   (acquire-workspace! workspace-pool nil))
  ([workspace-pool workspace-id]
   (when workspace-pool
     (loop []
       (let [workspaces @workspace-pool
             workspace (first (filter (fn [workspace]
                                        (and (= :idle (:status workspace))
                                             (or (nil? workspace-id)
                                                 (= workspace-id (:id workspace)))))
                                      workspaces))]
         (when workspace
           (if (workspace-clean? workspace)
             (let [claimed (mapv (fn [candidate]
                                   (if (= (:id workspace) (:id candidate))
                                     (assoc candidate :status :running)
                                     candidate))
                                 workspaces)]
               (if (compare-and-set! workspace-pool workspaces claimed)
                 workspace
                 (recur)))
             (let [dirty (mapv (fn [candidate]
                                 (if (= (:id workspace) (:id candidate))
                                   (assoc candidate :status :dirty)
                                   candidate))
                               workspaces)]
               (if (compare-and-set! workspace-pool workspaces dirty)
                 (recur)
                 (recur))))))))))

(defn- release-workspace!
  [workspace-pool workspace]
  (when workspace
    (set-workspace-status! workspace-pool
                           (:id workspace)
                           (if (workspace-clean? workspace) :idle :dirty))))

(defn- workspace-prompt-instructions
  [workspace-session]
  (when-let [cwd (:cwd workspace-session)]
    (string/join
     "\n"
     (cond-> [""
              "Workspace instructions:"
              (str "You are running in this project copy: " cwd)]
       (:branch workspace-session)
       (conj (str "Continue on the existing session branch: " (:branch workspace-session))
             "Do not create or switch to a new branch unless the user explicitly asks for it.")

       (not (:branch workspace-session))
       (conj "Before making code changes, create a new branch from the current master branch."
             "Choose a concise branch name that matches the change, for example fix/some-bug, feat/x-feature, enhance/xxx, or refactor/db-worker.")

       true
       (conj "Before finishing, commit all local changes with a concise commit message you choose.")))))

(defn- append-workspace-prompt-instructions
  [prompt workspace-session]
  (if-let [instructions (workspace-prompt-instructions workspace-session)]
    (str prompt "\n" instructions)
    prompt))

(defn- prepare-workspace-session!
  [workspace-pool]
  (when workspace-pool
    (when-let [workspace (acquire-workspace! workspace-pool)]
      (let [cwd (:cwd workspace)]
        (try
          (git-command! cwd ["checkout" "master"]
                        :agent-workspace-git-failed
                        "failed to checkout master")
          (git-command! cwd ["pull" "--ff-only" "origin" "master"]
                        :agent-workspace-git-failed
                        "failed to pull latest master")
          {:workspace workspace
           :workspace-id (:id workspace)
           :cwd cwd}
          (catch :default e
            (set-workspace-status! workspace-pool (:id workspace) :dirty)
            (throw e)))))))

(defn- prepare-workspace-session-result
  [workspace-pool]
  (try
    {:workspace-session (prepare-workspace-session! workspace-pool)}
    (catch :default e
      {:error e})))

(defn- session-by-id
  [config session-id]
  (first (filter #(= session-id (:session %))
                 (:sessions (read-session-store config)))))

(defn- current-workspace-branch
  [workspace]
  (when workspace
    (let [{:keys [stdout]} (git-command! (:cwd workspace)
                                         ["branch" "--show-current"]
                                         :agent-workspace-git-failed
                                         "failed to read current branch")]
      (trim-non-empty stdout))))

(defn- acquire-existing-workspace-session!
  [config workspace-pool session-id]
  (when workspace-pool
    (let [session (session-by-id config session-id)
          workspace-id (:workspace-id session)
          branch (trim-non-empty (:branch session))]
      (when-not session
        (throw (ex-info "agent bridge session workspace metadata is missing"
                        {:code :agent-workspace-session-missing
                         :session session-id})))
      (when-not workspace-id
        (throw (ex-info "agent bridge session workspace id is missing"
                        {:code :agent-workspace-session-missing
                         :session session-id})))
      (when-not branch
        (throw (ex-info "agent bridge session workspace branch is missing"
                        {:code :agent-workspace-session-missing
                         :session session-id
                         :workspace-id workspace-id})))
      (let [workspace (acquire-workspace! workspace-pool workspace-id)]
        (when-not workspace
          (throw (ex-info "agent bridge session workspace is not available"
                          {:code :agent-workspace-unavailable
                           :session session-id
                           :workspace-id workspace-id})))
        (try
          (git-command! (:cwd workspace)
                        ["checkout" branch]
                        :agent-workspace-git-failed
                        "failed to checkout agent bridge session branch")
          (let [current-branch (current-workspace-branch workspace)]
            (when-not (= branch current-branch)
              (throw (ex-info "agent bridge session workspace branch mismatch"
                              {:code :agent-workspace-git-failed
                               :session session-id
                               :workspace-id workspace-id
                               :expected-branch branch
                               :actual-branch current-branch})))
            {:workspace workspace
             :workspace-id workspace-id
             :cwd (:cwd workspace)
             :branch branch})
          (catch :default e
            (release-workspace! workspace-pool workspace)
            (throw e)))))))

(defn- complete-workspace-session!
  [cfg workspace-pool workspace session-id status]
  (if workspace
    (let [branch (current-workspace-branch workspace)
          clean? (workspace-clean? workspace)
          session-branch? (and branch
                               (not= "master" branch))
          success? (and clean? session-branch?)
          final-status (if success? status :failed)]
      (record-session! cfg (cond-> {:session session-id
                                    :status final-status
                                    :updated-at (js/Date.now)}
                             branch (assoc :branch branch)))
      (set-workspace-status! workspace-pool (:id workspace) (if success? :idle :dirty))
      final-status)
    (do
      (update-session-status! cfg session-id status)
      status)))

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
(def ^:private comment-complete-reaction "white_check_mark")
(def ^:private comment-failed-reaction "x")

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

(defn- mark-agent-bridge-task-in-review!
  [cfg repo block]
  (let [block-uuid (:block/uuid block)]
    (p/let [_ (transport/invoke cfg :thread-api/apply-outliner-ops
                                [repo [[:batch-set-property [[block-uuid]
                                                              :logseq.property/status
                                                              :logseq.property/status.in-review
                                                              {}]]]
                                 {}])]
      true)))

(def ^:private routable-task-query
  '[:find [(pull ?e [:db/id
                     :block/uuid
                     :block/title
                     {:block/tags [:db/ident :block/title]}
                     {:logseq.property/status [:db/ident :block/title]}
                     {:logseq.property/assignee [:db/id :block/title :block/name :db/ident]}
                     :logseq.property.agent/session-id
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

(defn- dry-run-commands
  [graph agent-name prompt-templates tasks]
  (mapv (fn [{:keys [block tree-text]}]
          (let [prompt (build-codex-prompt {:graph graph
                                            :agent-name agent-name
                                            :block block
                                            :tree-text tree-text
                                            :prompt-template (:task prompt-templates)})
                command (build-codex-command prompt {})]
            {:block (block-uuid-str block)
             :backend :codex
             :command command
             :preview (command-preview command)}))
        tasks))

(defn- emit-log!
  [config line]
  (if-let [f (:log-fn config)]
    (f line)
    (.write (.-stdout js/process) (str line "\n"))))

(defn- session-record
  ([graph agent-name block session-id status]
   (session-record graph agent-name block session-id status nil))
  ([graph agent-name block session-id status workspace-session]
   (cond-> {:session session-id
            :status status
            :backend :codex
            :graph graph
            :block (block-uuid-str block)
            :agent agent-name
            :started-at (js/Date.now)
            :updated-at (js/Date.now)}
     (:workspace-id workspace-session)
     (assoc :workspace-id (:workspace-id workspace-session))

     (:cwd workspace-session)
     (assoc :cwd (:cwd workspace-session))

     (:branch workspace-session)
     (assoc :branch (:branch workspace-session)))))

(defn- route-task!
  [cfg {:keys [repo graph agent-name prompt-templates workspace-pool]} {:keys [block tree-text]}]
  (let [{:keys [workspace-session error]} (prepare-workspace-session-result workspace-pool)]
    (cond
      error
      (do
        (log/error :agent-bridge-workspace-prepare-failed error)
        (p/rejected error))

      (and workspace-pool (nil? workspace-session))
      (p/resolved nil)

      :else
      (let [prompt (append-workspace-prompt-instructions
                    (build-codex-prompt {:graph graph
                                         :agent-name agent-name
                                         :block block
                                         :tree-text tree-text
                                         :prompt-template (:task prompt-templates)})
                    workspace-session)
            command (build-codex-command prompt {})
            preview (command-preview command)
            workspace (:workspace workspace-session)]
        (emit-log! cfg (log-line (str "Codex command prepared for " (block-uuid-str block) ": " preview)))
        (p/catch
         (p/let [{:keys [session]} (start-codex! command
                                                 {:cwd (:cwd workspace-session)
                                                  :on-exit (fn [code session-id]
                                                             (let [success? (zero? (or code 1))]
                                                               (when session-id
                                                                 (let [final-status (try
                                                                                      (complete-workspace-session! cfg workspace-pool workspace session-id
                                                                                                                   (if success?
                                                                                                                     :completed
                                                                                                                     :failed))
                                                                                      (catch :default e
                                                                                        (log/error :agent-bridge-workspace-complete-failed e)
                                                                                        (update-session-status! cfg session-id :failed)
                                                                                        (set-workspace-status! workspace-pool (:id workspace) :dirty)
                                                                                        :failed))]
                                                                   (when (= :completed final-status)
                                                                     (-> (p/let [cfg* (cli-server/ensure-server! cfg repo)
                                                                                 _ (mark-agent-bridge-task-in-review! cfg* repo block)]
                                                                           true)
                                                                         (p/catch (fn [e]
                                                                                    (log/error :agent-bridge-task-in-review-failed e)))))))))})
                 _ (when-not (seq session)
                     (throw (ex-info "codex session id missing"
                                     {:code :codex-session-id-missing})))
                 cfg* (cli-server/ensure-server! cfg repo)
                 _ (record-session! cfg* (session-record graph agent-name block session :running workspace-session))
                 _ (write-agent-session-id! cfg* repo (:block/uuid block) session)
                 _ (mark-agent-bridge-task-started! cfg* repo block)]
           (emit-log! cfg (log-line (str "agent-session-id written for " (block-uuid-str block))))
           (cond-> {:block (block-uuid-str block)
                    :session session
                    :backend :codex
                    :preview preview}
             (:workspace-id workspace-session)
             (assoc :workspace-id (:workspace-id workspace-session)
                    :cwd (:cwd workspace-session))))
         (fn [e]
           (release-workspace! workspace-pool workspace)
           (throw e)))))))

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

(defn- route-task-once!
  [cfg {:keys [routing-blocks*] :as opts} {:keys [block] :as task}]
  (let [block-id (block-uuid-str block)]
    (if (and routing-blocks* block-id)
      (if (claim-routing-block! routing-blocks* block-id)
        (-> (route-task! cfg opts task)
            (p/finally (fn []
                         (swap! routing-blocks* disj block-id))))
        (p/resolved nil))
      (route-task! cfg opts task))))

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
  [cfg {:keys [repo graph agent-name prompt-templates routing-blocks* workspace-pool]}]
  (p/let [tasks (list-routable-tasks cfg repo agent-name)]
    (p/let [routed (p-map-batched max-concurrent-routes
                                  #(route-task-once! cfg {:repo repo
                                                          :graph graph
                                                          :agent-name agent-name
                                                          :prompt-templates prompt-templates
                                                          :routing-blocks* routing-blocks*
                                                          :workspace-pool workspace-pool}
                                                     %)
                                  tasks)]
      (filterv some? routed))))

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
   '*])

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

(defn- comment-session-record
  ([graph agent-name comment-block session-id status]
   (comment-session-record graph agent-name comment-block session-id status nil))
  ([graph agent-name comment-block session-id status workspace-session]
   (assoc (session-record graph agent-name comment-block session-id status workspace-session)
          :request :comment)))

(defn- comment-target-session-id
  [agent-name block]
  (if (contains? (assignee-values block) agent-name)
    (p/resolved (trim-non-empty (get block agent-session-id-property-ident)))
    (p/resolved nil)))

(defn- route-comment!
  [cfg {:keys [repo graph agent-name prompt-templates workspace-pool]} comment-block]
  (p/catch
   (p/let [comment-uuid (:block/uuid comment-block)
           _ (when-not comment-uuid
               (throw (ex-info "comment block uuid is missing"
                               {:code :agent-comment-uuid-missing})))
           session-property-ident agent-session-id-property-ident
           comments-area (pull-comments-area cfg repo comment-block session-property-ident)
           _ (when-not (comments-area? comments-area)
               (throw (ex-info "comment parent is not a comments area"
                               {:code :agent-comment-parent-invalid
                                :block (block-uuid-str comment-block)})))
           target-blocks (vec (:logseq.property.comments/blocks comments-area))
           target-session-ids (p/all (mapv #(comment-target-session-id agent-name %)
                                           target-blocks))
           resume-session-id (first (keep identity target-session-ids))]
     (let [{:keys [workspace-session error]} (if resume-session-id
                                               (try
                                                 {:workspace-session (acquire-existing-workspace-session! cfg workspace-pool resume-session-id)}
                                                 (catch :default e
                                                   {:error e}))
                                               (prepare-workspace-session-result workspace-pool))]
       (cond
         error
         (throw error)

         (and workspace-pool (nil? workspace-session))
         nil

         :else
         (p/let [_ (ensure-comment-reaction! cfg repo comment-uuid comment-start-reaction)
                 target-tree-texts (p/all (mapv #(show-block-tree cfg repo %) target-blocks))
                 comments-area-tree-text (show-block-tree cfg repo comments-area)
                 comment-tree-text (show-block-tree cfg repo comment-block)
                 prompt (append-workspace-prompt-instructions
                         (build-comment-codex-prompt {:graph graph
                                                      :agent-name agent-name
                                                      :comment comment-block
                                                      :target-tree-texts target-tree-texts
                                                      :comments-area-tree-text comments-area-tree-text
                                                      :comment-tree-text comment-tree-text
                                                      :prompt-template (:comment prompt-templates)})
                         workspace-session)
                 workspace (:workspace workspace-session)
                 command (if resume-session-id
                           (build-codex-resume-command resume-session-id prompt {})
                           (build-codex-command prompt {}))
                 preview (command-preview command)
                 _ (emit-log! cfg (log-line (str "Codex command prepared for comment " (block-uuid-str comment-block) ": " preview)))
                 {:keys [session]} (start-codex! command
                                                 {:cwd (:cwd workspace-session)
                                                  :on-exit (fn [code session-id]
                                                             (when session-id
                                                               (let [status (if (zero? (or code 1))
                                                                              :completed
                                                                              :failed)]
                                                                 (try
                                                                   (complete-workspace-session! cfg workspace-pool workspace session-id status)
                                                                   (catch :default e
                                                                     (log/error :agent-bridge-workspace-complete-failed e)
                                                                     (update-session-status! cfg session-id :failed)
                                                                     (set-workspace-status! workspace-pool (:id workspace) :dirty)))))
                                                             (-> (ensure-comment-reaction! cfg repo comment-uuid
                                                                                           (if (zero? (or code 1))
                                                                                             comment-complete-reaction
                                                                                             comment-failed-reaction))
                                                                 (p/catch (fn [e]
                                                                            (log/error :agent-bridge-comment-reaction-failed e)))))})
                 _ (when-not (seq session)
                     (throw (ex-info "codex session id missing"
                                     {:code :codex-session-id-missing})))
                 cfg* (cli-server/ensure-server! cfg repo)
                 _ (record-session! cfg* (comment-session-record graph agent-name comment-block session :running workspace-session))]
           (cond-> {:block (block-uuid-str comment-block)
                    :session session
                    :backend :codex
                    :preview preview
                    :request :comment}
             (:workspace-id workspace-session)
             (assoc :workspace-id (:workspace-id workspace-session)
                    :cwd (:cwd workspace-session)))))))
   (fn [e]
     (if-let [comment-uuid (:block/uuid comment-block)]
       (p/let [_ (ensure-comment-reaction! cfg repo comment-uuid comment-failed-reaction)]
         (throw e))
       (p/rejected e)))))

(defn- route-comment-once!
  [cfg {:keys [routing-blocks*] :as opts} comment-block]
  (let [block-id (block-uuid-str comment-block)]
    (if (and routing-blocks* block-id)
      (if (claim-routing-block! routing-blocks* block-id)
        (-> (route-comment! cfg opts comment-block)
            (p/finally (fn []
                         (swap! routing-blocks* disj block-id))))
        (p/resolved nil))
      (route-comment! cfg opts comment-block))))

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

(defn- process-sync-db-changes-event!
  [cfg {:keys [repo] :as opts} {:keys [tx-data]}]
  (p/let [assignee-datoms (resolve-assignee-datoms cfg repo tx-data)
          routability-datoms (resolve-routability-datoms cfg repo tx-data)]
    (let [comment-datoms (filter #(comment-title-datom? % (:agent-name opts)) tx-data)
          routing (vec (concat (map #(route-assignee-datom! cfg opts %) assignee-datoms)
                               (map #(route-routability-datom! cfg opts %) routability-datoms)
                               (map #(route-comment-datom! cfg opts %) comment-datoms)))]
      (when (seq routing)
        (p/all routing)))))

(defn- listen-forever!
  [cfg {:keys [repo graph agent-name prompt-templates routing-blocks* workspace-pool]}]
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
                                                          :routing-blocks* routing-blocks*
                                                          :workspace-pool workspace-pool}
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
          (try
            (let [workspaces (resolve-workspaces! config graph)
                  workspace-pool (make-workspace-pool workspaces)
                  logs (cond-> logs
                         (seq workspaces)
                         (conj (log-line (str "using workspaces: " (count workspaces)))))]
              (if-not (codex-available? nil)
                (bridge-error :codex-not-found "codex executable is not available")
                (p/let [cfg (cli-server/ensure-server! config repo)
                        logs (conj logs (log-line "checking prompt templates ..."))
                        prompt-templates (ensure-agent-bridge-prompt-templates! cfg repo)
                        logs (conj logs (log-line "registering agent bridge ..."))
                        _ (register-agent-bridge! cfg repo agent-name)]
                  (if (:dry-run? action)
                    (p/let [tasks (list-routable-tasks cfg repo agent-name)
                            commands (dry-run-commands graph agent-name prompt-templates tasks)
                            logs (into (conj logs (log-line "listening graph changes ..."))
                                       (map (fn [{:keys [block preview]}]
                                              (log-line (str "would run Codex command for " block ": " preview)))
                                            commands))]
                      {:status :ok
                       :command :agent-bridge
                       :data {:mode :dry-run
                              :graph graph
                              :agent-name agent-name
                              :logs logs
                              :commands commands}})
                    (if (:process-once? action)
                      (do
                        (doseq [line (conj logs (log-line "listening graph changes ..."))]
                          (emit-log! cfg line))
                        (let [routing-blocks* (atom #{})]
                          (p/let [routed (process-tasks! cfg {:repo repo
                                                              :graph graph
                                                              :agent-name agent-name
                                                              :prompt-templates prompt-templates
                                                              :routing-blocks* routing-blocks*
                                                              :workspace-pool workspace-pool})]
                            {:status :ok
                             :command :agent-bridge
                             :data {:mode :processed-once
                                    :graph graph
                                    :agent-name agent-name
                                    :routed routed}})))
                      (let [routing-blocks* (atom #{})
                            listen-promise (listen-forever! cfg {:repo repo
                                                                 :graph graph
                                                                 :agent-name agent-name
                                                                 :prompt-templates prompt-templates
                                                                 :routing-blocks* routing-blocks*
                                                                 :workspace-pool workspace-pool})]
                        (doseq [line (conj logs (log-line "listening graph changes ..."))]
                          (emit-log! cfg line))
                        (p/let [_ (process-tasks! cfg {:repo repo
                                                       :graph graph
                                                       :agent-name agent-name
                                                       :prompt-templates prompt-templates
                                                       :routing-blocks* routing-blocks*
                                                       :workspace-pool workspace-pool})]
                          listen-promise)))))))
            (catch :default e
              (let [data (ex-data e)]
                (bridge-error (or (:code data) :agent-workspace-invalid)
                              (or (ex-message e) (str e)))))))))))
