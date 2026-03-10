(ns frontend.handler.agent
  "Agent sessions for tasks."
  (:require [clojure.string :as string]
            [electron.ipc :as electron-ipc]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.agent-cancel :as agent-cancel]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [logseq.sync.malli-schema :as db-sync-schema]
            [promesa.core :as p]))

(def ^:private invalid-coerce ::invalid-coerce)
(defn- coerce
  [coercer value context]
  (try
    (coercer value)
    (catch :default e
      (log/error :db-sync/malli-coerce-failed (merge context {:error e :value value}))
      invalid-coerce)))

(defn- coerce-http-request [schema-key body]
  (if-let [coercer (get db-sync-schema/http-request-coercers schema-key)]
    (let [coerced (coerce coercer body {:schema schema-key :dir :request})]
      (when-not (= coerced invalid-coerce)
        coerced))
    body))

(defn- blank->nil [value]
  (when (string? value)
    (let [value (string/trim value)]
      (when-not (string/blank? value) value))))

(defn- parse-uuid-safe
  [value]
  (cond
    (uuid? value) value
    (string? value)
    (try
      (uuid value)
      (catch :default _
        nil))
    :else nil))

(declare <start-session!
         task-session-created?
         task-session-id
         task-pr-url
         maybe-store-task-session-id!
         session-state
         update-session!
         update-session-state!)

(def ^:private task-sandbox-checkpoint-property :logseq.property/sandbox-checkpoint)
(def ^:private task-session-id-property :logseq.property/agent-session-id)
(def ^:private task-pr-property :logseq.property/pr)

(defn- normalize-sandbox-checkpoint
  [checkpoint]
  (when (map? checkpoint)
    (let [snapshot-id (blank->nil (or (:snapshot-id checkpoint) (get checkpoint "snapshot-id")))
          provider (some-> (or (:provider checkpoint) (get checkpoint "provider"))
                           str
                           string/trim
                           string/lower-case
                           blank->nil)]
      (when (string? snapshot-id)
        (cond-> {}
          (string? snapshot-id) (assoc :snapshot-id snapshot-id)
          (string? provider) (assoc :provider provider))))))

(defn task-sandbox-checkpoint
  [block]
  (let [checkpoint (or (pu/get-block-property-value block task-sandbox-checkpoint-property)
                       (:logseq.property/sandbox-checkpoint block))]
    (normalize-sandbox-checkpoint checkpoint)))

(defn- checkpoint->property-value
  [checkpoint]
  (normalize-sandbox-checkpoint checkpoint))

(defn- agent-config
  [agent-page opts]
  (let [provider (blank->nil (:block/title agent-page))]
    (cond-> {}
      (string? provider) (assoc :provider provider))))

(defn- codex-agent?
  [agent]
  (= "codex" (some-> (:provider agent) blank->nil string/lower-case)))

(defn- project-config
  ([project-page]
   (project-config project-page nil))
  ([project-page {:keys [base-branch]}]
   (let [repo-url (blank->nil (or (pu/get-block-property-value project-page :logseq.property/git-repo)
                                  (:logseq.property/git-repo project-page)))
         docker-file (blank->nil (or (pu/get-block-property-value project-page :logseq.property/project-sandbox-docker-file)
                                     (:logseq.property/project-sandbox-docker-file project-page)))
         sandbox-init-setup (blank->nil (or (pu/get-block-property-value project-page :logseq.property/project-sandbox-init-setup)
                                            (:logseq.property/project-sandbox-init-setup project-page)))
         project-id (some-> (:block/uuid project-page) str)
         graph-id (some-> (ldb/get-graph-rtc-uuid (db/get-db)) str blank->nil)
         title (blank->nil (:block/title project-page))
         base-branch (blank->nil base-branch)]
     (when (and project-id title repo-url)
       (cond-> {:id project-id
                :title title
                :repo-url repo-url}
         (string? base-branch) (assoc :base-branch base-branch)
         (string? graph-id) (assoc :graph-id graph-id)
         (string? docker-file) (assoc :docker-file docker-file)
         (string? sandbox-init-setup) (assoc :sandbox-init-setup sandbox-init-setup))))))

(defn- block-line-content
  [block]
  (blank->nil (:block/title block)))

(defn- block-tree->lines
  ([block]
   (block-tree->lines block 0))
  ([block depth]
   (let [indent (apply str (repeat (max 0 depth) "  "))
         content (block-line-content block)
         children (:block/_parent block)
         own-line (when (string? content)
                    [(str indent "- " content)])
         child-lines (mapcat #(block-tree->lines % (inc depth)) children)]
     (into (or own-line [])
           child-lines))))

(defn- task-content
  [block]
  (let [lines (block-tree->lines block)]
    (some->> lines seq (string/join "\n"))))

(defn- task-context
  ([block]
   (task-context block nil))
  ([block opts]
   (let [block-uuid (:block/uuid block)
         node-id (some-> block-uuid str)
         node-title (blank->nil (:block/title block))
         content (task-content block)
         project-page (:logseq.property/project block)
         sandbox-checkpoint (or (task-sandbox-checkpoint block)
                                (when project-page
                                  (task-sandbox-checkpoint project-page)))
         agent-page (:logseq.property/agent block)
         project (when project-page (project-config project-page opts))
         agent (when agent-page
                 (cond-> (agent-config agent-page opts)
                   (string? (blank->nil (:agent/mode opts))) (assoc :mode (blank->nil (:agent/mode opts)))
                   (string? (blank->nil (:agent/permission-mode opts))) (assoc :permission-mode (blank->nil (:agent/permission-mode opts)))))]
     {:block-uuid block-uuid
      :node-id node-id
      :node-title node-title
      :content content
      :attachments []
      :sandbox-checkpoint sandbox-checkpoint
      :project project
      :agent agent})))

(defn task-runnable?
  [block]
  (and (:logseq.property/project block)
       (:logseq.property/agent block)))

(defn task-ready?
  [block]
  (let [{:keys [project agent node-id node-title content]} (task-context block)]
    (and (string? node-id)
         (string? node-title)
         (string? content)
         project
         agent)))

(defn managed-auth-enabled-task?
  [block]
  (let [{:keys [agent]} (task-context block)]
    (and (map? agent)
         (codex-agent? agent))))

(defn planning-enabled?
  []
  (or config/dev?
      config/feature-agent-planning-on?
      (user-handler/alpha-or-beta-user?)))

(def ^:private planning-intent-pattern
  #"(?i)\b(plan|planning|roadmap|break down|decompose|architecture|research|investigate|clarify|phases?|milestones?|workstreams?)\b")

(def ^:private execution-intent-pattern
  #"(?i)\b(implement|build|create|fix|refactor|update|change|add|remove|debug|repair|ship)\b")

(defn session-start-strategy
  [block]
  (let [{:keys [content]} (task-context block)
        content (blank->nil content)
        lines (if (string? content)
                (count (string/split-lines content))
                0)
        content-length (count (or content ""))
        planning-signals (cond-> 0
                           (and (string? content)
                                (re-find planning-intent-pattern content)) inc
                           (> lines 6) inc
                           (> content-length 260) inc
                           (and (string? content)
                                (>= (count (re-seq #"\band\b|," content)) 3)) inc)
        _ (prn :debug :planning-signals planning-signals
               :content content)
        execution-signal? (and (string? content)
                               (re-find execution-intent-pattern content))
        planning? (and (planning-enabled?)
                       (or (>= planning-signals 2)
                           (and (>= planning-signals 1)
                                (not execution-signal?))))]
    {:mode (if planning? :planning :execution)
     :planning? planning?
     :reason (cond
               planning?
               "Task looks broad enough to benefit from planning first."

               :else
               "Task looks concrete enough to execute directly.")}))

(defn- login-required-error?
  [error]
  (let [status (:status (ex-data error))
        message (some-> (ex-data error) :body :error blank->nil)]
    (and (= 401 status)
         (contains? #{"chatgpt login required"
                      "chatgpt login expired, reconnect required"}
                    message))))

(defn- start-session-error-message
  [error]
  (or (some-> (ex-data error) :body :error)
      (some-> error ex-message)
      "Failed to start agent session."))

(defn- <start-managed-auth-login!
  [block opts]
  (let [base (db-sync/http-base)]
    (cond
      (not util/electron?)
      (do
        (notification/show! "ChatGPT login is only supported in Electron right now." :warning false)
        (p/resolved nil))

      (not (string? base))
      (do
        (notification/show! "DB sync is not configured." :error false)
        (p/resolved nil))

      :else
      (-> (electron-ipc/ipc :openai/authenticate)
          (p/then (fn [credentials]
                    (db-sync/fetch-json (str base "/auth/chatgpt/import")
                                        {:method "POST"
                                         :headers {"content-type" "application/json"}
                                         :body (js/JSON.stringify (clj->js credentials))}
                                        {:response-schema :auth.chatgpt/import})))
          (p/then (fn [_]
                    (<start-session! block (assoc opts :managed-auth/skip-login-redirect? true))))
          (p/catch (fn [error]
                     (notification/show! (start-session-error-message error) :error false)
                     nil))))))

(defn project-repo-url
  [block]
  (some-> block
          :logseq.property/project
          (pu/get-block-property-value :logseq.property/git-repo)))

(defn- github-repo-ref
  [repo-url]
  (let [repo-url (blank->nil repo-url)]
    (or (when-let [[_ owner repo]
                   (some->> repo-url
                            (re-matches #"^https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$"))]
          {:owner owner :name repo})
        (when-let [[_ owner repo]
                   (some->> repo-url
                            (re-matches #"^git@github\.com:([^/]+)/([^/]+?)(?:\.git)?$"))]
          {:owner owner :name repo})
        (when-let [[_ owner repo]
                   (some->> repo-url
                            (re-matches #"^ssh://git@github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$"))]
          {:owner owner :name repo}))))

(def ^:private github-install-required-notification-uid :agent/github-install-required)

(defn- first-url-in-text
  [text]
  (some-> (when (string? text)
            (re-find #"https?://[^\s)\]}]+" text))
          (string/replace #"[,.;:!?]+$" "")))

(defn- start-session-install-url
  [error]
  (first-url-in-text (some-> (ex-data error) :body :error)))

(defn- open-external-url!
  [url]
  (when (string? url)
    (if (util/electron?)
      (js/window.apis.openExternal url)
      (js/window.open url "_blank" "noopener,noreferrer"))))

(defn- show-github-install-required-notification!
  [error retry-fn]
  (let [message (start-session-error-message error)
        install-url (start-session-install-url error)
        can-retry? (fn? retry-fn)]
    (notification/show!
     [:div.space-y-2
      [:div.whitespace-pre-line message]
      [:div.flex.flex-wrap.gap-2
       (when (string? install-url)
         (shui/button
          {:size :sm
           :on-click (fn []
                       (open-external-url! install-url))}
          "Install GitHub App"))
       (when can-retry?
         (shui/button
          {:variant :outline
           :size :sm
           :on-click (fn []
                       (retry-fn))}
          "retry"))]]
     :warning false github-install-required-notification-uid)))

(defn- normalize-branches
  [branches]
  (->> branches
       (keep (fn [branch]
               (when (string? branch)
                 (let [branch (string/trim branch)]
                   (when-not (string/blank? branch)
                     branch)))))
       distinct
       vec))

(defn- <fetch-project-branches-from-github!
  [repo-url]
  (if-let [{:keys [owner name]} (github-repo-ref repo-url)]
    (-> (js/fetch (str "https://api.github.com/repos/"
                       owner
                       "/"
                       name
                       "/branches?per_page=100")
                  #js {:method "GET"
                       :headers #js {"accept" "application/vnd.github+json"
                                     "x-github-api-version" "2022-11-28"}})
        (p/then (fn [resp]
                  (if-not (.-ok resp)
                    []
                    (-> (.json resp)
                        (p/then (fn [data]
                                  (->> (js->clj data :keywordize-keys true)
                                       (keep (fn [item]
                                               (when (map? item)
                                                 (:name item))))
                                       normalize-branches)))))))
        (p/catch (fn [_] [])))
    (p/resolved [])))

(defn build-session-body
  ([block]
   (build-session-body block nil))
  ([block opts]
   (let [{:keys [block-uuid node-id node-title content attachments sandbox-checkpoint project agent]} (task-context block opts)
         session-id (or (some-> (:session-id opts) blank->nil)
                        (some-> block-uuid str))]
     (when (and session-id node-id (string? node-title) (string? content) (map? project) (map? agent))
       (cond-> {:session-id session-id
                :node-id node-id
                :node-title node-title
                :content content
                :attachments attachments
                :project project
                :agent agent
                :capabilities {:push-enabled true
                               :pr-enabled true}}
         (map? sandbox-checkpoint) (assoc :sandbox-checkpoint sandbox-checkpoint))))))

(def ^:private planner-default-status :logseq.property/status.todo)

(defn- parse-block-uuid
  [value]
  (cond
    (uuid? value) value
    (string? value)
    (try
      (uuid value)
      (catch :default _ nil))
    :else nil))

(defn- planner-task-title
  [{:keys [title content description]}]
  (or (blank->nil title)
      (some-> (or (blank->nil content)
                  (blank->nil description))
              (string/split #"\n")
              first
              blank->nil)))

(defn- planner-task-content
  [{:keys [content title description]}]
  (or (blank->nil content)
      (let [title (blank->nil title)
            description (blank->nil description)]
        (cond
          (and title description) (str title "\n" description)
          title title
          description description
          :else nil))))

(defn- unwrap-json-code-fence
  [text]
  (when-let [text (blank->nil text)]
    (or (some->> text
                 (re-find #"(?is)```(?:json)?\s*\n(.*?)\n```")
                 second
                 blank->nil)
        text)))

(defn- parse-json-safe
  [text]
  (when-let [text (unwrap-json-code-fence text)]
    (try
      (js->clj (js/JSON.parse text) :keywordize-keys true)
      (catch :default _ nil))))

(defn planner-tasks-from-text
  [text]
  (let [parsed (parse-json-safe text)
        tasks (cond
                (vector? parsed) parsed
                (sequential? (:tasks parsed)) (vec (:tasks parsed))
                :else nil)]
    (when (seq tasks)
      (->> tasks
           (keep (fn [task]
                   (when (map? task)
                     (let [task' (cond-> {}
                                   (parse-block-uuid (:block-uuid task)) (assoc :block-uuid (parse-block-uuid (:block-uuid task)))
                                   (string? (blank->nil (:title task))) (assoc :title (blank->nil (:title task)))
                                   (string? (blank->nil (:description task))) (assoc :description (blank->nil (:description task)))
                                   (string? (blank->nil (:content task))) (assoc :content (blank->nil (:content task))))]
                       (when (planner-task-content task')
                         task')))))
           vec
           seq
           vec))))

(defn- planning-summary-task
  [task]
  (when (map? task)
    (let [title (blank->nil (:title task))
          description (blank->nil (:description task))
          content (blank->nil (:content task))
          task-uuid (blank->nil (:task-uuid task))
          block-uuid (blank->nil (:block-uuid task))
          session-id (blank->nil (:session-id task))]
      (cond-> {}
        (string? title) (assoc :title title)
        (string? description) (assoc :description description)
        (string? content) (assoc :content content)
        (string? task-uuid) (assoc :task-uuid task-uuid)
        (string? block-uuid) (assoc :block-uuid block-uuid)
        (string? session-id) (assoc :session-id session-id)))))

(defn- planning-session-summary
  [planning-session]
  (let [tasks (or (some-> planning-session :plan :tasks)
                  [])
        tasks (->> tasks
                   (keep planning-summary-task)
                   vec)
        status (blank->nil (:status planning-session))
        approval-status (blank->nil (:approval-status planning-session))
        workflow-id (blank->nil (:workflow-id planning-session))
        scheduled-actions (or (:scheduled-actions planning-session) [])
        header-lines (cond-> []
                       (string? status) (conj (str "Planning status: " status "."))
                       (string? approval-status) (conj (str "Approval status: " approval-status "."))
                       (string? workflow-id) (conj (str "Workflow id: " workflow-id "."))
                       (seq scheduled-actions) (conj (str "Scheduled actions: "
                                                          (pr-str scheduled-actions)
                                                          ".")))]
    (when (or (seq tasks) (seq header-lines))
      (str (string/join "\n" header-lines)
           (when (seq header-lines) "\n\n")
           "```json\n"
           (js/JSON.stringify (clj->js {:tasks tasks}) nil 2)
           "\n```"))))

(defn- planning-summary-messages
  [planning-session]
  (when-let [summary (planning-session-summary planning-session)]
    [{:id (str "planning-summary-" (or (:planning-session-id planning-session)
                                       (random-uuid)))
      :role "assistant"
      :parts [{:type "text"
               :text summary}]}]))

(defn- planning-chat-message
  [message]
  (let [content (blank->nil (:content message))
        role (blank->nil (:role message))
        message-id (blank->nil (:id message))]
    (when (and (string? content)
               (string? role))
      {:id (or message-id (str "planning-message-" (random-uuid)))
       :role role
       :parts [{:type "text"
                :text content}]})))

(defn- planning-chat-messages
  [planning-state]
  (->> (:messages planning-state)
       (keep planning-chat-message)
       vec))

(defn- planning-summary-message?
  [message]
  (string/starts-with? (or (:id message) "") "planning-summary-"))

(defn- merge-planning-summary-messages
  [block-uuid planning-session]
  (let [existing-messages (or (get-in (session-state block-uuid) [:planning-messages]) [])
        non-summary (remove planning-summary-message? existing-messages)]
    (into (or (planning-summary-messages planning-session) [])
          non-summary)))

(defn- planning-session-state-update
  [block-uuid planning-session]
  (let [planning-session-id (or (:planning-session-id planning-session)
                                (:session-id planning-session))
        session-id (blank->nil planning-session-id)]
    {:session-id session-id
     :session-kind "planning"
     :planning-session-id session-id
     :planning-chat-path (or (blank->nil (:chat-path planning-session))
                             (when (string? session-id)
                               (str "/planning/chat/" session-id)))
     :workflow-id (:workflow-id planning-session)
     :status (:status planning-session)
     :plan (:plan planning-session)
     :dispatch-sessions (:dispatch-sessions planning-session)
     :scheduled-actions (:scheduled-actions planning-session)
     :approval-status (:approval-status planning-session)
     :require-approval (true? (:require-approval planning-session))
     :auto-dispatch (if (boolean? (:auto-dispatch planning-session))
                      (:auto-dispatch planning-session)
                      true)
     :auto-replan (true? (:auto-replan planning-session))
     :replan-delay-sec (:replan-delay-sec planning-session)
     :planning-messages (merge-planning-summary-messages block-uuid planning-session)
     :planning-loaded? true
     :planning-loading? false}))

(defn- enrich-planning-task-state
  [task]
  (if-let [block (some-> (:block-uuid task) parse-uuid-safe (vector :block/uuid) db/entity)]
    (cond-> task
      true (assoc :status (or (pu/get-block-property-value block :logseq.property/status)
                              (:status task)))
      (string? (task-session-id block)) (assoc :session-id (task-session-id block))
      (string? (task-pr-url block)) (assoc :pr-url (task-pr-url block)))
    task))

(defn- apply-planning-session!
  [block-uuid planning-session]
  (when (map? planning-session)
    (let [planning-session (update-in planning-session [:plan :tasks]
                                      (fn [tasks]
                                        (if (sequential? tasks)
                                          (mapv enrich-planning-task-state tasks)
                                          tasks)))]
      (doseq [task (get-in planning-session [:plan :tasks])]
        (when (and (:block-uuid task) (:session-id task))
          (maybe-store-task-session-id! (:block-uuid task) (:session-id task))))
      (update-session-state! block-uuid
                             (planning-session-state-update block-uuid planning-session)))
    planning-session))

(defn replace-planning-messages!
  [block-uuid planning-state]
  (let [existing-summary (->> (get-in (session-state block-uuid) [:planning-messages])
                              (filter #(string/starts-with? (or (:id %) "") "planning-summary-"))
                              vec)
        messages (into existing-summary (planning-chat-messages planning-state))]
    (update-session-state! block-uuid {:planning-messages messages
                                       :planning-agent-state planning-state})))

(defn append-planning-message!
  [block-uuid role content]
  (when-let [content (blank->nil content)]
    (update-session! block-uuid
                     (fn [session]
                       (let [messages (vec (or (:planning-messages session) []))]
                         (assoc session
                                :planning-messages
                                (conj messages {:id (str "planning-local-" (random-uuid))
                                                :role role
                                                :parts [{:type "text"
                                                         :text content}]}))))
                     :agent/planning-sessions)))

(defn- planner-goal-context
  [goal-block {:keys [project agent] :as _opts}]
  {:project (or project (:logseq.property/project goal-block))
   :agent (or agent (:logseq.property/agent goal-block))})

(defn- task-tagged?
  [block class-ident]
  (boolean
   (some #(= class-ident (:db/ident %))
         (:block/tags block))))

(defn- maybe-set-planner-task-defaults!
  [block-uuid {:keys [project agent]}]
  (when-let [block (db/entity [:block/uuid block-uuid])]
    (when-not (task-tagged? block :logseq.class/Task)
      (property-handler/set-block-property! block-uuid :block/tags :logseq.class/Task))
    (when-not (pu/get-block-property-value block :logseq.property/status)
      (property-handler/set-block-property! block-uuid :logseq.property/status planner-default-status))
    (when (and project
               (not= (:db/id (:logseq.property/project block))
                     (:db/id project)))
      (property-handler/set-block-property! block-uuid :logseq.property/project (:block/title project)))
    (when (and agent
               (not= (:db/id (:logseq.property/agent block))
                     (:db/id agent)))
      (property-handler/set-block-property! block-uuid :logseq.property/agent (:block/title agent)))))

(defn- maybe-update-planner-task-content!
  [block task]
  (when-let [content (planner-task-content task)]
    (when (not= (:block/title block) content)
      (editor-handler/save-block! (state/get-current-repo) (:block/uuid block) content))))

(defn- <create-planner-task!
  [goal-block anchor-block-uuid task context]
  (let [target-block-id (or anchor-block-uuid (:db/id goal-block))
        sibling? (some? anchor-block-uuid)
        content (planner-task-content task)]
    (if-not (and target-block-id (string? content))
      (p/resolved nil)
      (p/let [result (editor-handler/insert-block-tree-after-target target-block-id sibling? [{:content content}] :markdown false)
              block-uuid (some-> result :blocks first :block/uuid)]
        (when block-uuid
          (maybe-set-planner-task-defaults! block-uuid context)
          {:block-uuid block-uuid})))))

(defn- <upsert-planner-task!
  [goal-block anchor-block-uuid task context]
  (if-let [block (when-let [block-uuid (:block-uuid task)]
                   (db/entity [:block/uuid block-uuid]))]
    (if (task-session-created? block)
      (p/resolved {:block-uuid (:block/uuid block)})
      (do
        (maybe-update-planner-task-content! block task)
        (maybe-set-planner-task-defaults! (:block/uuid block) context)
        (p/resolved {:block-uuid (:block/uuid block)})))
    (<create-planner-task! goal-block anchor-block-uuid task context)))

(defn- <sync-planning-task-bindings!
  [planning-session-id tasks]
  (let [base (db-sync/http-base)
        bindings (->> tasks
                      (keep (fn [task]
                              (let [task-uuid (blank->nil (:task-uuid task))
                                    block-uuid (some-> (:block-uuid task) str blank->nil)
                                    session-id (blank->nil (:session-id task))]
                                (when (and (string? task-uuid)
                                           (string? block-uuid))
                                  (cond-> {:task-uuid task-uuid
                                           :block-uuid block-uuid}
                                    (string? session-id) (assoc :session-id session-id))))))
                      vec)]
    (if-not (and (string? base)
                 (string? (blank->nil planning-session-id))
                 (seq bindings))
      (p/resolved nil)
      (db-sync/fetch-json (str base "/planning/sessions/" planning-session-id "/tasks/sync")
                          {:method "POST"
                           :headers {"content-type" "application/json"}
                           :body (js/JSON.stringify (clj->js {:tasks bindings}))}
                          {:response-schema :planning.sessions/get}))))

(defn <upsert-planner-tasks!
  ([goal-block-uuid tasks]
   (<upsert-planner-tasks! goal-block-uuid tasks nil))
  ([goal-block-uuid tasks opts]
   (if-let [goal-block (db/entity [:block/uuid goal-block-uuid])]
     (let [context (planner-goal-context goal-block opts)
           planning-session-id (blank->nil (:planning-session-id opts))]
       (p/loop [remaining (seq tasks)
                acc []
                anchor-block-uuid nil]
         (if-let [task (first remaining)]
           (p/let [result (<upsert-planner-task! goal-block anchor-block-uuid task context)]
             (p/recur (next remaining)
                      (cond-> acc result (conj (merge task result)))
                      (or (:block-uuid result)
                          anchor-block-uuid)))
           (p/let [_ (<sync-planning-task-bindings! planning-session-id acc)]
             (mapv (fn [task]
                     (select-keys task [:task-uuid :block-uuid :session-id]))
                   acc)))))
     (p/resolved []))))

(def ^:private stream-reconnect-delay-ms 1500)

(defn- session-key [block-uuid]
  (some-> block-uuid str))

(defn- auth-headers []
  (when-let [token (state/get-auth-id-token)]
    {"authorization" (str "Bearer " token)}))

(defn- session-stream-url [base session-id]
  (str base "/sessions/" session-id "/stream"))

(defn- websocket-base-url [base]
  (when (string? base)
    (cond
      (string/starts-with? base "https://")
      (str "wss://" (subs base (count "https://")))

      (string/starts-with? base "http://")
      (str "ws://" (subs base (count "http://")))

      :else
      base)))

(defn terminal-websocket-url
  [base session-id {:keys [token cols rows]}]
  (let [ws-base (websocket-base-url base)]
    (when (and (string? ws-base) (string? session-id))
      (let [url (js/URL. (str ws-base "/sessions/" session-id "/terminal"))
            search-params (.-searchParams url)]
        (when (string? token)
          (.set search-params "token" token))
        (when (number? cols)
          (.set search-params "cols" (str cols)))
        (when (number? rows)
          (.set search-params "rows" (str rows)))
        (.toString url)))))

(def ^:private session-status->task-status
  {"created" :logseq.property/status.doing
   "running" :logseq.property/status.doing
   "paused" :logseq.property/status.todo
   "completed" :logseq.property/status.done
   "pr-created" :logseq.property/status.in-review
   "failed" :logseq.property/status.canceled
   "canceled" :logseq.property/status.canceled})
(defn- terminal-status? [status]
  (contains? #{"completed" "failed" "canceled"} status))

(defn- normalize-runtime-provider [provider]
  (some-> provider str string/trim string/lower-case not-empty))

(defn- runtime-provider-terminal-enabled? [provider]
  (contains? #{"e2b"}
             (normalize-runtime-provider provider)))

(defn- event-runtime-provider [event]
  (when (= "session.provisioned" (:type event))
    (some-> (get-in event [:data :provider]) normalize-runtime-provider)))

(defn- event->sandbox-checkpoint
  [event runtime-provider]
  (when (contains? #{"sandbox.snapshot.succeeded"
                     "sandbox.checkpoint.succeeded"}
                   (:type event))
    (normalize-sandbox-checkpoint
     (cond-> (:data event)
       (and (map? (:data event))
            (nil? (get-in event [:data :provider]))
            (string? runtime-provider))
       (assoc :provider runtime-provider)))))

(defn session-terminal-enabled?
  [session]
  (let [provider (or (normalize-runtime-provider (:runtime-provider session))
                     (some->> (:events session)
                              reverse
                              (keep event-runtime-provider)
                              first))]
    (runtime-provider-terminal-enabled? provider)))

(defn- status->label [status-ident]
  (some-> (db/entity status-ident) :block/title))

(defn- maybe-update-task-status!
  [block-uuid status]
  (prn :debug :status status
       :ident (get session-status->task-status status))
  (when-let [status-ident (get session-status->task-status status)]
    (when-let [block (db/entity [:block/uuid block-uuid])]
      (let [current (pu/get-block-property-value block :logseq.property/status)
            desired (status->label status-ident)]
        (when (and desired (not= current desired))
          (when (= status-ident :logseq.property/status.canceled)
            (agent-cancel/suppress-next-cancel! block-uuid))
          (property-handler/set-block-property! block-uuid :logseq.property/status status-ident))))))

(defn- maybe-update-task-pr-url!
  [block-uuid pr-url]
  (when-let [pr-url (blank->nil pr-url)]
    (when-let [block (db/entity [:block/uuid block-uuid])]
      (let [current (blank->nil (pu/get-block-property-value block task-pr-property))]
        (when (not= current pr-url)
          (property-handler/set-block-property! block-uuid task-pr-property pr-url))))))

(defn task-session-id
  [block]
  (blank->nil (pu/get-block-property-value block task-session-id-property)))

(defn task-pr-url
  [block]
  (blank->nil (pu/get-block-property-value block task-pr-property)))

(defn task-session-created?
  [block]
  (string? (task-session-id block)))

(defn- maybe-store-task-session-id!
  [block-uuid session-id]
  (when-let [block (db/entity [:block/uuid block-uuid])]
    (let [session-id (blank->nil session-id)
          current-session-id (task-session-id block)]
      (when (and session-id (not= current-session-id session-id))
        (property-handler/set-block-property! block-uuid task-session-id-property session-id)))))

(def ^:private planning-started-task-statuses
  #{"Doing" "Done" "In Review" "Canceled"})

(defn- planning-task-started?
  [task]
  (or (string? (blank->nil (:session-id task)))
      (contains? planning-started-task-statuses
                 (some-> (:status task) str string/trim not-empty))))

(defn <fetch-planning-session!
  [block-uuid planning-session-id]
  (let [base (db-sync/http-base)
        planning-session-id (blank->nil planning-session-id)]
    (if-not (and (string? base) (string? planning-session-id))
      (p/resolved nil)
      (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
              resp (db-sync/fetch-json (str base "/planning/sessions/" planning-session-id)
                                       {:method "GET"}
                                       {:response-schema :planning.sessions/get})]
        (apply-planning-session! block-uuid resp)))))

(defn <set-planning-approval!
  ([block-uuid approval-status]
   (<set-planning-approval! block-uuid approval-status nil))
  ([block-uuid approval-status opts]
   (let [base (db-sync/http-base)
         planning-session-id (or (some-> (session-state block-uuid) :planning-session-id blank->nil)
                                 (some-> (session-state block-uuid) :session-id blank->nil))
         approval-status (some-> approval-status str string/trim string/lower-case not-empty)
         approval-comment (some-> (:comment opts) blank->nil)]
     (if-not (and (string? base)
                  (string? planning-session-id)
                  (contains? #{"pending" "approved" "rejected"} approval-status))
       (p/resolved nil)
       (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
               resp (db-sync/fetch-json (str base "/planning/sessions/" planning-session-id "/approval")
                                        {:method "POST"
                                         :headers {"content-type" "application/json"}
                                         :body (js/JSON.stringify
                                                (clj->js (cond-> {:approval {:decision approval-status}}
                                                           (string? approval-comment) (assoc-in [:approval :comment] approval-comment))))}
                                        {:response-schema :planning.sessions/get})]
         (apply-planning-session! block-uuid resp))))))

(defn <replan-planning-session!
  ([block-uuid]
   (<replan-planning-session! block-uuid nil))
  ([block-uuid opts]
   (let [base (db-sync/http-base)
         planning-session-id (or (some-> (session-state block-uuid) :planning-session-id blank->nil)
                                 (some-> (session-state block-uuid) :session-id blank->nil))
         replan-note (some-> (:replan-note opts) blank->nil)]
     (if-not (and (string? base)
                  (string? planning-session-id))
       (p/resolved nil)
       (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
               resp (db-sync/fetch-json (str base "/planning/sessions/" planning-session-id "/replan")
                                        {:method "POST"
                                         :headers {"content-type" "application/json"}
                                         :body (js/JSON.stringify
                                                (clj->js (cond-> {}
                                                           (string? replan-note) (assoc :replan-note replan-note))))}
                                        {:response-schema :planning.sessions/get})]
         (apply-planning-session! block-uuid resp))))))

(defn- <start-planned-task!
  [goal-block-uuid task]
  (let [goal-block (db/entity [:block/uuid goal-block-uuid])
        parent-session-id (or (some-> goal-block task-session-id blank->nil)
                              (some-> goal-block-uuid str blank->nil))
        block-uuid (:block-uuid task)
        block (when block-uuid
                (db/entity [:block/uuid block-uuid]))
        existing-session-id (or (blank->nil (:session-id task))
                                (some-> goal-block task-session-id blank->nil)
                                (some-> block task-session-id blank->nil))]
    (cond
      (not block)
      (p/resolved nil)

      (or existing-session-id
          (task-session-created? block)
          (planning-task-started? task))
      (let [session-id (or existing-session-id
                           (task-session-id block))]
        (when (string? session-id)
          (when goal-block-uuid
            (maybe-store-task-session-id! goal-block-uuid session-id))
          (maybe-store-task-session-id! block-uuid session-id))
        (p/resolved (cond-> (select-keys task [:task-uuid :block-uuid])
                      (string? session-id) (assoc :session-id session-id))))

      :else
      (p/let [resp (<start-session! block {:session-id parent-session-id})
              session-id (or (some-> resp :session-id blank->nil)
                             (some-> (db/entity [:block/uuid goal-block-uuid])
                                     task-session-id
                                     blank->nil)
                             (some-> (db/entity [:block/uuid block-uuid])
                                     task-session-id
                                     blank->nil))]
        (when (string? session-id)
          (when goal-block-uuid
            (maybe-store-task-session-id! goal-block-uuid session-id))
          (maybe-store-task-session-id! block-uuid session-id))
        (cond-> (select-keys task [:task-uuid :block-uuid])
          (string? session-id) (assoc :session-id session-id))))))

(defn <execute-planned-tasks!
  ([goal-block-uuid tasks]
   (<execute-planned-tasks! goal-block-uuid tasks nil))
  ([goal-block-uuid tasks opts]
   (let [planning-session-id (blank->nil (:planning-session-id opts))
         selected-task-uuids (set (keep blank->nil (:selected-task-uuids opts)))]
     (p/let [persisted-tasks (<upsert-planner-tasks! goal-block-uuid
                                                     tasks
                                                     {:planning-session-id planning-session-id})
             persisted-by-task-uuid (into {}
                                          (keep (fn [task]
                                                  (when-let [task-uuid (blank->nil (:task-uuid task))]
                                                    [task-uuid task])))
                                          persisted-tasks)
             selected-tasks (->> tasks
                                 (map (fn [task]
                                        (merge task
                                               (get persisted-by-task-uuid
                                                    (blank->nil (:task-uuid task))))))
                                 (filter (fn [task]
                                           (or (empty? selected-task-uuids)
                                               (contains? selected-task-uuids
                                                          (blank->nil (:task-uuid task))))))
                                 vec)
             results (p/loop [remaining selected-tasks
                              acc []]
                       (if-let [task (first remaining)]
                         (p/let [result (<start-planned-task! goal-block-uuid task)]
                           (p/recur (next remaining)
                                    (cond-> acc result (conj result))))
                         acc))
             sync-response (<sync-planning-task-bindings! planning-session-id results)]
       (when (map? sync-response)
         (apply-planning-session! goal-block-uuid sync-response))
       results))))

(defn- maybe-store-task-sandbox-checkpoint!
  [block-uuid checkpoint]
  (when-let [block (db/entity [:block/uuid block-uuid])]
    (when-let [checkpoint (normalize-sandbox-checkpoint checkpoint)]
      (let [current (task-sandbox-checkpoint block)]
        (when (not= current checkpoint)
          (property-handler/set-block-property! block-uuid
                                                task-sandbox-checkpoint-property
                                                (checkpoint->property-value checkpoint))))
      (when-let [project-page (:logseq.property/project block)]
        (let [project-uuid (:block/uuid project-page)
              current-project-checkpoint (task-sandbox-checkpoint project-page)]
          (when (and project-uuid
                     (not= current-project-checkpoint checkpoint))
            (property-handler/set-block-property! project-uuid
                                                  task-sandbox-checkpoint-property
                                                  (checkpoint->property-value checkpoint))))))))

(defn- update-session!
  ([block-uuid f]
   (update-session! block-uuid f nil))
  ([block-uuid f bucket-key]
   (let [bucket-key (or bucket-key :agent/sessions)]
     (state/update-state! bucket-key
                          (fn [sessions]
                            (let [key (session-key block-uuid)
                                  session (get sessions key {})]
                              (assoc sessions key (f session))))))))

(defn- session-bucket-key
  [block-uuid data]
  (let [session-kind (some-> (:session-kind data)
                             blank->nil
                             string/lower-case)
        planning-sessions (state/sub :agent/planning-sessions)
        key (session-key block-uuid)]
    (cond
      (= "planning" session-kind) :agent/planning-sessions
      (= "session" session-kind) :agent/sessions
      (contains? planning-sessions key) :agent/planning-sessions
      :else :agent/sessions)))

(defn- update-session-state!
  [block-uuid data]
  (update-session! block-uuid
                   #(merge % data)
                   (session-bucket-key block-uuid data)))

(defn- event->status [event]
  (case (:type event)
    "session.created" "created"
    "session.running" "running"
    "session.paused" "paused"
    "session.completed" "completed"
    "session.failed" "failed"
    "session.canceled" "canceled"
    nil))

(defn- merge-events [session events]
  (let [existing-ids (or (:event-ids session) #{})
        [new-events new-ids] (reduce (fn [[acc ids] event]
                                       (let [event-id (:event-id event)]
                                         (if (and (string? event-id) (contains? ids event-id))
                                           [acc ids]
                                           [(conj acc event) (if (string? event-id) (conj ids event-id) ids)])))
                                     [[] existing-ids]
                                     events)
        last-ts (reduce (fn [acc event]
                          (max acc (or (:ts event) 0)))
                        (or (:last-event-ts session) 0)
                        new-events)]
    (cond-> session
      (seq new-events)
      (-> (update :events (fnil into []) new-events)
          (assoc :event-ids new-ids
                 :last-event-ts last-ts)))))

(defn- append-events!
  [block-uuid events]
  (update-session! block-uuid #(merge-events % events)))

(declare session-state)

(defn- seen-event?
  [block-uuid event]
  (let [event-id (:event-id event)
        event-ids (get-in (session-state block-uuid) [:event-ids])]
    (and (string? event-id)
         (contains? (or event-ids #{}) event-id))))

(defn- parse-sse-frame [frame]
  (let [lines (string/split frame #"\n")
        data-lines (keep (fn [line]
                           (when (string/starts-with? line "data:")
                             (string/trim (subs line 5))))
                         lines)
        payload (string/join "\n" data-lines)]
    (when (seq payload)
      (try
        (js->clj (js/JSON.parse payload) :keywordize-keys true)
        (catch :default _
          {:raw payload})))))

(defn- split-sse-frames [buffer]
  (loop [remaining buffer
         frames []]
    (let [idx (.indexOf ^string remaining "\n\n")]
      (if (neg? idx)
        [frames remaining]
        (let [frame (subs remaining 0 idx)
              tail (subs remaining (+ idx 2))]
          (recur tail (conj frames frame)))))))

(defn- message-body
  [content]
  (when-let [message (blank->nil content)]
    {:message message
     :kind "user"}))

(defn- session-state [block-uuid]
  (let [key (session-key block-uuid)]
    (or (get (state/sub :agent/planning-sessions) key)
        (get (state/sub :agent/sessions) key))))

(defn <fetch-events!
  [block]
  (let [base (db-sync/http-base)
        block-uuid (:block/uuid block)
        session-id (or (:session-id (session-state block-uuid))
                       (task-session-id block)
                       (some-> block-uuid str))
        session (session-state block-uuid)
        since (when (number? (:last-event-ts session)) (:last-event-ts session))
        query (when since (str "?since=" since))]
    (when (and base session-id (task-ready? block))
      (-> (db-sync/fetch-json (str base "/sessions/" session-id "/events" (or query ""))
                              {:method "GET"}
                              {:response-schema :sessions/events})
          (p/then (fn [resp]
                    (when (seq (:events resp))
                      (append-events! block-uuid (:events resp))
                      (let [provider (some->> (:events resp)
                                              reverse
                                              (keep event-runtime-provider)
                                              first)]
                        (when-let [checkpoint (some->> (:events resp)
                                                       reverse
                                                       (keep #(event->sandbox-checkpoint % provider))
                                                       first)]
                          (maybe-store-task-sandbox-checkpoint! block-uuid checkpoint))
                        (when provider
                          (update-session-state! block-uuid {:runtime-provider provider
                                                             :terminal-enabled (runtime-provider-terminal-enabled? provider)}))))))
          (p/catch (fn [_] nil))))))

(defn <fetch-project-branches!
  [block]
  (let [base (db-sync/http-base)
        block-uuid (:block/uuid block)
        session-id (or (:session-id (session-state block-uuid))
                       (task-session-id block)
                       (some-> block-uuid str))
        repo-url (project-repo-url block)]
    (if-not (and (string? base) (string? session-id) (string? repo-url))
      (p/resolved [])
      (let [url (str base
                     "/sessions/"
                     session-id
                     "/branches?repo-url="
                     (js/encodeURIComponent repo-url))]
        (-> (db-sync/fetch-json url
                                {:method "GET"}
                                {:response-schema :sessions/branches})
            (p/then (fn [resp]
                      (->> (:branches resp)
                           (filter string?)
                           normalize-branches)))
            (p/catch (fn [error]
                       (if (= 404 (:status (ex-data error)))
                         (<fetch-project-branches-from-github! repo-url)
                         []))))))))

(defn- session-terminal? [block-uuid]
  (terminal-status? (:status (session-state block-uuid))))

(defn- stream-controller [block-uuid]
  (get-in (session-state block-uuid) [:stream-controller]))

(defn- stream-controller-active? [controller]
  (and controller (not (.-aborted (.-signal controller)))))

(defn- stop-session-stream! [block-uuid]
  (when-let [controller (stream-controller block-uuid)]
    (.abort controller)
    (update-session-state! block-uuid {:streaming? false
                                       :stream-controller nil})))

(defn- handle-stream-event!
  [block-uuid event]
  (when-not (seen-event? block-uuid event)
    (append-events! block-uuid [event])
    (when-let [provider (event-runtime-provider event)]
      (update-session-state! block-uuid {:runtime-provider provider
                                         :terminal-enabled (runtime-provider-terminal-enabled? provider)}))
    (let [runtime-provider (or (event-runtime-provider event)
                               (:runtime-provider (session-state block-uuid)))]
      (when-let [checkpoint (event->sandbox-checkpoint event runtime-provider)]
        (maybe-store-task-sandbox-checkpoint! block-uuid checkpoint)))
    (when-let [status (event->status event)]
      (update-session-state! block-uuid {:status status})
      (maybe-update-task-status! block-uuid status)
      (when (terminal-status? status)
        (stop-session-stream! block-uuid)))))

(defn- <consume-sse-stream!
  [block-uuid resp]
  (let [reader (.getReader (.-body resp))
        decoder (js/TextDecoder.)
        buffer (atom "")]
    (letfn [(step []
              (p/let [result (.read reader)]
                (if (.-done result)
                  nil
                  (let [chunk (.decode decoder (.-value result) #js {:stream true})
                        chunk (string/replace chunk #"\r\n" "\n")
                        merged (str @buffer chunk)
                        [frames remainder] (split-sse-frames merged)]
                    (reset! buffer remainder)
                    (doseq [frame frames]
                      (when-let [event (parse-sse-frame frame)]
                        (handle-stream-event! block-uuid event)))
                    (step)))))]
      (step))))

(declare schedule-reconnect!)
(defn- <connect-session-stream!
  [block-uuid stream-url]
  (let [session (session-state block-uuid)]
    (if (or (:streaming? session)
            (stream-controller-active? (:stream-controller session)))
      (p/resolved nil)
      (when (string? stream-url)
        (let [stream-url (if-let [since-ts (when (number? (:last-event-ts session))
                                             (:last-event-ts session))]
                           (let [url (js/URL. stream-url)]
                             (.set (.-searchParams url) "since" (str since-ts))
                             (.toString url))
                           stream-url)
              controller (js/AbortController.)
              headers (auth-headers)
              opts (cond-> {:method "GET"
                            :signal (.-signal controller)}
                     headers (assoc :headers headers))]
          (update-session-state! block-uuid {:streaming? true
                                             :stream-error nil
                                             :stream-controller controller})
          (-> (p/let [resp (js/fetch stream-url (clj->js opts))]
                (if-not (.-ok resp)
                  (throw (ex-info "agent session stream failed"
                                  {:status (.-status resp)
                                   :stream-url stream-url}))
                  (<consume-sse-stream! block-uuid resp)))
              (p/then (fn [_]
                        (update-session-state! block-uuid {:streaming? false
                                                           :stream-controller nil})))
              (p/catch (fn [error]
                         (if (.-aborted (.-signal controller))
                           (update-session-state! block-uuid {:streaming? false
                                                              :stream-controller nil})
                           (do
                             (update-session-state! block-uuid {:streaming? false
                                                                :stream-error (str error)
                                                                :stream-controller nil})
                             (schedule-reconnect! block-uuid stream-url)))))))))))

(defn- schedule-reconnect!
  [block-uuid stream-url]
  (js/setTimeout
   (fn []
     (when-not (session-terminal? block-uuid)
       (when-not (:streaming? (session-state block-uuid))
         (<connect-session-stream! block-uuid stream-url))))
   stream-reconnect-delay-ms))

(defn- planning-session?
  [session]
  (let [session-kind (some-> (:session-kind session)
                             str
                             string/trim
                             string/lower-case)]
    (or (= "planning" session-kind)
        (string? (blank->nil (:planning-chat-path session))))))

(defn <ensure-session!
  [block]
  (let [block-uuid (:block/uuid block)
        base (db-sync/http-base)
        session (session-state block-uuid)
        planning? (planning-session? session)
        session-id (or (:session-id session)
                       (task-session-id block)
                       (some-> block-uuid str))]
    (when (and base session-id (task-ready? block))
      (cond
        (:loading? session)
        (p/resolved nil)

        (:session-id session)
        (if planning?
          (do
            (when (and (not (:planning-loaded? session))
                       (not (:planning-loading? session)))
              (update-session-state! block-uuid {:planning-loading? true})
              (-> (db-sync/fetch-json (str base "/planning/sessions/" session-id)
                                      {:method "GET"}
                                      {:response-schema :planning.sessions/get})
                  (p/then (fn [resp]
                            (apply-planning-session! block-uuid resp)))
                  (p/catch (fn [error]
                             (update-session-state! block-uuid {:planning-loading? false})
                             (let [status (:status (ex-data error))]
                               (when-not (= status 404)
                                 (log/error :agent/ensure-planning-session-failed error)))
                             nil))))
            (p/resolved session))
          (do
            (maybe-store-task-session-id! block-uuid (:session-id session))
            (when-not (:streaming? session)
              (-> (<fetch-events! block)
                  (p/then (fn [_]
                            (<connect-session-stream! block-uuid (or (:stream-url (session-state block-uuid))
                                                                     (session-stream-url base session-id)))))))
            (p/resolved session)))

        :else
        (if planning?
          (p/resolved nil)
          (do
            (update-session-state! block-uuid {:loading? true})
            (-> (p/let [resp (db-sync/fetch-json (str base "/sessions/" session-id)
                                                 {:method "GET"}
                                                 {:response-schema :sessions/get})
                        session-id' (or (:session-id resp) session-id)
                        stream-url (session-stream-url base session-id')]
                  (update-session-state! block-uuid {:session-id session-id'
                                                     :status (:status resp)
                                                     :runtime-provider (:runtime-provider resp)
                                                     :terminal-enabled (true? (:terminal-enabled resp))
                                                     :stream-url stream-url
                                                     :loading? false})
                  (maybe-store-task-session-id! block-uuid session-id')
                  (maybe-update-task-status! block-uuid (:status resp))
                  (<fetch-events! block)
                  (<connect-session-stream! block-uuid (or (:stream-url (session-state block-uuid))
                                                           stream-url))
                  resp)
                (p/catch (fn [error]
                           (update-session-state! block-uuid {:loading? false})
                           (let [status (:status (ex-data error))]
                             (when-not (= status 404)
                               (log/error :agent/ensure-session-failed error)))
                           nil)))))))))

(defn- <ensure-auth!
  []
  (js/Promise. user-handler/task--ensure-id&access-token))

(defn- planning-create-path?
  [create-path]
  (= "/planning/sessions" (some-> create-path str string/trim)))

(defn <start-session!
  ([block]
   (<start-session! block nil))
  ([block opts]
   (<start-session! block opts "/sessions"))
  ([block opts create-path]
   (let [base (db-sync/http-base)
         opts (or opts {})
         planning? (planning-create-path? create-path)
         response-schema (if planning?
                           :planning.sessions/create
                           :sessions/create)]
     (cond
       (not base)
       (do
         (notification/show! "DB sync is not configured." :error false)
         (p/resolved nil))

       (not (task-ready? block))
       (do
         (notification/show! "Task needs Project (with Git Repo) and Agent." :warning)
         (p/resolved nil))

       :else
       (p/let [_ (<ensure-auth!)
               raw-body (build-session-body block opts)
               body (coerce-http-request :sessions/create raw-body)]
         (if (nil? body)
           (do
             (notification/show! "Invalid agent session payload." :error false)
             nil)
           (-> (p/let [resp (db-sync/fetch-json (str base create-path)
                                                {:method "POST"
                                                 :headers {"content-type" "application/json"}
                                                 :body (js/JSON.stringify (clj->js body))}
                                                {:response-schema response-schema})
                       session-id (or (:session-id resp)
                                      (:planning-session-id resp))
                       status (:status resp)
                       stream-url (when-not planning?
                                    (:stream-url resp))
                       planning-chat-path (when planning?
                                            (or (blank->nil (:chat-path resp))
                                                (when (string? session-id)
                                                  (str "/planning/chat/" session-id))))
                       block-uuid (:block/uuid block)
                       _ (when (and (not planning?)
                                    (string? session-id))
                           (when-let [raw-message (message-body (:content raw-body))]
                             (let [coerced (coerce-http-request :sessions/message raw-message)
                                   msg-body (if (map? coerced) coerced raw-message)]
                               (db-sync/fetch-json (str base "/sessions/" session-id "/messages")
                                                   {:method "POST"
                                                    :headers {"content-type" "application/json"}
                                                    :body (js/JSON.stringify (clj->js msg-body))}
                                                   {:response-schema :sessions/message}))))]
                 (notification/clear! github-install-required-notification-uid)
                 (if planning?
                   (update-session-state! block-uuid {:session-id session-id
                                                      :session-kind "planning"
                                                      :planning-session-id session-id
                                                      :planning-chat-path planning-chat-path
                                                      :workflow-id (:workflow-id resp)
                                                      :status status
                                                      :approval-status (:approval-status resp)
                                                      :require-approval (true? (:require-approval resp))
                                                      :auto-dispatch (if (boolean? (:auto-dispatch resp))
                                                                       (:auto-dispatch resp)
                                                                       true)
                                                      :auto-replan (true? (:auto-replan resp))
                                                      :replan-delay-sec (:replan-delay-sec resp)
                                                      :runtime-provider nil
                                                      :terminal-enabled false
                                                      :stream-url nil
                                                      :streaming? false
                                                      :stream-controller nil
                                                      :plan nil
                                                      :dispatch-sessions nil
                                                      :scheduled-actions nil
                                                      :planning-messages nil
                                                      :planning-loaded? false
                                                      :planning-loading? false
                                                      :started-at (util/time-ms)})
                   (update-session-state! block-uuid {:session-id session-id
                                                      :session-kind "session"
                                                      :planning-session-id nil
                                                      :planning-chat-path nil
                                                      :status status
                                                      :runtime-provider (:runtime-provider resp)
                                                      :terminal-enabled (true? (:terminal-enabled resp))
                                                      :stream-url stream-url
                                                      :started-at (util/time-ms)}))
                 (when (and (not planning?)
                            (string? session-id))
                   (maybe-store-task-session-id! block-uuid session-id)
                   (<connect-session-stream! block-uuid stream-url))
                 resp)
               (p/catch (fn [error]
                          (cond
                            (and (managed-auth-enabled-task? block)
                                 (not (:managed-auth/skip-login-redirect? opts))
                                 (login-required-error? error))
                            (<start-managed-auth-login! block opts)

                            (= 412 (:status (ex-data error)))
                            (show-github-install-required-notification!
                             error
                             (fn []
                               (-> (<start-session! block opts create-path)
                                   (p/catch (fn [_] nil)))))
                            :else
                            (notification/show! (start-session-error-message error) :error false))
                          nil)))))))))

(defn <start-planning-session!
  ([block]
   (<start-planning-session! block nil))
  ([block opts]
   (if-not (planning-enabled?)
     (do
       (notification/show! "Planning is not enabled for this build/account." :warning false)
       (p/resolved nil))
     (let [opts (cond-> (or opts {})
                  (nil? (:agent/permission-mode opts))
                  (assoc :agent/permission-mode "read-only"))]
       (<start-session! block opts "/planning/sessions")))))

(defn <start-auto-session!
  ([block]
   (<start-auto-session! block nil))
  ([block opts]
   (let [{:keys [planning?]} (session-start-strategy block)]
     (if planning?
       (<start-planning-session! block opts)
       (<start-session! block opts)))))

(defn- publish-request-body
  [{:keys [title body commit-message head-branch base-branch create-pr? force?]}]
  (cond-> {:create-pr (if (nil? create-pr?) true (true? create-pr?))
           :force (true? force?)}
    (string? (blank->nil title)) (assoc :title (blank->nil title))
    (string? (blank->nil body)) (assoc :body (blank->nil body))
    (string? (blank->nil commit-message)) (assoc :commit-message (blank->nil commit-message))
    (string? (blank->nil head-branch)) (assoc :head-branch (blank->nil head-branch))
    (string? (blank->nil base-branch)) (assoc :base-branch (blank->nil base-branch))))

(defn- maybe-insert-pr-sibling-blocks!
  [block-uuid summary]
  (when-let [summary (blank->nil summary)]
    (editor-handler/api-insert-new-block! (str "PR Summary: " summary)
                                          {:block-uuid block-uuid
                                           :sibling? false})))

(defn- publish-status-message
  [resp]
  (or (:message resp)
      (case (:status resp)
        "pushed" "Branch pushed."
        "pr-created" "Pull request created."
        "manual-pr-required" "Branch pushed. Create pull request manually."
        "Publish finished.")))

(defn- publish-error-message
  [error]
  (or (some-> (ex-data error) :body :message)
      (some-> (ex-data error) :body :error)
      (some-> error ex-message)
      "Publish failed."))

(defn- snapshot-status-message
  [resp]
  (or (:message resp)
      "Sandbox snapshot created."))

(defn- snapshot-error-message
  [error]
  (or (some-> (ex-data error) :body :message)
      (some-> (ex-data error) :body :error)
      (some-> error ex-message)
      "Snapshot failed."))

(defn <publish-session!
  [block opts]
  (let [base (db-sync/http-base)
        block-uuid (:block/uuid block)
        session (session-state block-uuid)
        session-id (or (:session-id session)
                       (task-session-id block)
                       (some-> block-uuid str))]
    (cond
      (not base)
      (do
        (notification/show! "DB sync is not configured." :error false)
        (p/resolved nil))

      (not (task-ready? block))
      (do
        (notification/show! "Task needs Project (with Git Repo) and Agent." :warning)
        (p/resolved nil))

      (not (string? session-id))
      (do
        (notification/show! "Start the agent session before publishing." :warning)
        (p/resolved nil))

      :else
      (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
              raw-body (publish-request-body opts)
              body (coerce-http-request :sessions/pr raw-body)]
        (if (nil? body)
          (do
            (notification/show! "Invalid publish payload." :error false)
            nil)
          (-> (db-sync/fetch-json (str base "/sessions/" session-id "/pr")
                                  {:method "POST"
                                   :headers {"content-type" "application/json"}
                                   :body (js/JSON.stringify (clj->js body))}
                                  {:response-schema :sessions/pr})
              (p/then (fn [resp]
                        (let [status (:status resp)]
                          (update-session-state! block-uuid {:last-publish resp
                                                             :last-publish-at (util/time-ms)})
                          (when (= "pr-created" status)
                            (maybe-update-task-pr-url! block-uuid (:pr-url resp)))
                          (maybe-update-task-status! block-uuid status))
                        (when (:create-pr raw-body)
                          (maybe-insert-pr-sibling-blocks! block-uuid (:body raw-body)))
                        (notification/show! (publish-status-message resp)
                                            (if (= "manual-pr-required" (:status resp))
                                              :warning
                                              :success)
                                            false)
                        (<fetch-events! block)
                        resp))
              (p/catch (fn [error]
                         (notification/show! (publish-error-message error) :error false)
                         (p/rejected error)))))))))

(defn <snapshot-session!
  [block]
  (let [base (db-sync/http-base)
        block-uuid (:block/uuid block)
        session (session-state block-uuid)
        session-id (or (:session-id session)
                       (task-session-id block)
                       (some-> block-uuid str))]
    (cond
      (not base)
      (do
        (notification/show! "DB sync is not configured." :error false)
        (p/resolved nil))

      (not (task-ready? block))
      (do
        (notification/show! "Task needs Project (with Git Repo) and Agent." :warning)
        (p/resolved nil))

      (not (string? session-id))
      (do
        (notification/show! "Start the agent session before snapshotting." :warning)
        (p/resolved nil))

      :else
      (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
              body (coerce-http-request :sessions/snapshot {})]
        (if (nil? body)
          (do
            (notification/show! "Invalid snapshot payload." :error false)
            nil)
          (-> (db-sync/fetch-json (str base "/sessions/" session-id "/snapshot")
                                  {:method "POST"
                                   :headers {"content-type" "application/json"}
                                   :body (js/JSON.stringify (clj->js body))}
                                  {:response-schema :sessions/snapshot})
              (p/then (fn [resp]
                        (update-session-state! block-uuid {:last-snapshot resp
                                                           :last-snapshot-at (util/time-ms)})
                        (notification/show! (snapshot-status-message resp) :success false)
                        (<fetch-events! block)
                        resp))
              (p/catch (fn [error]
                         (notification/show! (snapshot-error-message error) :error false)
                         (p/rejected error)))))))))
