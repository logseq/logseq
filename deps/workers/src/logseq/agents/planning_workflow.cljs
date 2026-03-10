(ns logseq.agents.planning-workflow
  (:require [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.agents.planning-store :as planning-store]
            [logseq.sync.platform.core :as platform]))

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed)
        trimmed))))

(defn- task-content
  [task]
  (or (some-> (:content task) non-empty-str)
      (let [title (some-> (:title task) non-empty-str)
            description (some-> (:description task) non-empty-str)]
        (cond
          (and title description) (str title "\n" description)
          title title
          description description
          :else nil))))

(defn- maybe-task-uuid
  [idx task]
  (or (some-> (:task-uuid task) non-empty-str)
      (some-> (:block-uuid task) non-empty-str)
      (str "task-" (inc idx))))

(declare native-promise)

(defn normalize-task
  [idx task]
  (when (map? task)
    (when-let [content (task-content task)]
      (cond-> {:title (or (some-> (:title task) non-empty-str)
                          (str "Task " (inc idx)))
               :content content}
        (some-> (:description task) non-empty-str) (assoc :description (non-empty-str (:description task)))
        (sequential? (:dependencies task)) (assoc :dependencies (vec (:dependencies task)))
        (sequential? (:acceptance-criteria task)) (assoc :acceptance-criteria (vec (:acceptance-criteria task)))))))

(defn- normalize-planner-task
  [idx task]
  (when-let [normalized (normalize-task idx task)]
    (cond-> (assoc normalized
                   :task-uuid (maybe-task-uuid idx task)
                   :status "Todo"
                   :marker "#Task")
      (some-> (:block-uuid task) non-empty-str) (assoc :block-uuid (non-empty-str (:block-uuid task))))))

(defn normalize-tasks
  [tasks]
  (->> tasks
       (map-indexed normalize-task)
       (remove nil?)
       vec))

(defn- normalize-planner-tasks
  [tasks]
  (->> tasks
       (map-indexed normalize-planner-task)
       (remove nil?)
       vec))

(defn- fallback-task-title
  [goal fallback]
  (or (some-> goal :title non-empty-str)
      (some-> goal :node-title non-empty-str)
      fallback))

(defn- planning-message-text
  [message]
  (cond
    (string? message)
    (non-empty-str message)

    (map? message)
    (or (some-> (:content message) non-empty-str)
        (some-> (:message message) non-empty-str)
        (some-> (:text message) non-empty-str))

    :else
    nil))

(defn- planning-message-texts
  [params]
  (->> (:planning-messages params)
       (keep planning-message-text)
       vec))

(defn- repo-note
  [params]
  (let [repo-url (some-> (get-in params [:project :repo-url]) non-empty-str)
        base-branch (some-> (get-in params [:project :base-branch]) non-empty-str)]
    (when (string? repo-url)
      (str "Repository: " repo-url
           (when (string? base-branch)
             (str " (base branch: " base-branch ")"))))))

(defn- planning-context-texts
  [params]
  (let [goal (:goal params)]
    (->> [(some-> goal :title non-empty-str)
          (some-> goal :description non-empty-str)
          (some-> goal :node-title non-empty-str)
          (some-> (:replan-note params) non-empty-str)
          (some-> (get-in params [:approval :comment]) non-empty-str)
          (repo-note params)]
         (concat (planning-message-texts params))
         (keep non-empty-str)
         vec)))

(defn- parse-json-safe
  [value]
  (if (string? value)
    (try
      (js->clj (js/JSON.parse value) :keywordize-keys true)
      (catch :default _
        nil))
    nil))

(defn- extract-file-references
  [params]
  (let [seen (volatile! #{})]
    (->> (planning-context-texts params)
         (mapcat #(re-seq #"[A-Za-z0-9_./-]+\.(?:clj|cljs|cljc|edn|sql|ts|tsx|js|jsx)" %))
         (keep (fn [file-path]
                 (let [normalized (non-empty-str file-path)]
                   (when (and (string? normalized)
                              (not (contains? @seen normalized)))
                     (vswap! seen conj normalized)
                     normalized))))
         vec)))

(defn- planner-api-token
  [^js env params]
  (or (some-> (get-in params [:agent :api-token]) non-empty-str)
      (some-> (aget env "OPENAI_API_KEY") non-empty-str)))

(defn- planner-base-url
  [^js env params]
  (let [base-url (or (some-> (get-in params [:agent :base-url]) non-empty-str)
                     (some-> (aget env "OPENAI_BASE_URL") non-empty-str)
                     "https://api.openai.com/v1")]
    (string/replace base-url #"/+$" "")))

(defn- planner-model
  [params]
  (or (some-> (get-in params [:agent :model]) non-empty-str)
      "gpt-4.1-mini"))

(defn- generic-clarifications
  [params]
  (let [goal (:goal params)
        goal-description (or (some-> goal :description non-empty-str)
                             (some-> goal :title non-empty-str)
                             (some-> goal :node-title non-empty-str))
        repo-url (some-> (get-in params [:project :repo-url]) non-empty-str)
        replan-note (some-> (:replan-note params) non-empty-str)]
    (vec
     (keep identity
           [(when-not (string? repo-url)
              "Confirm the target repository and branch before final implementation work begins.")
            (when (and (string? goal-description)
                       (< (count goal-description) 48))
              "Clarify the expected user-visible outcome so the plan can stay focused.")
            (when (string? replan-note)
              (str "Address the replanning feedback: " replan-note))]))))

(defn- generic-workstreams
  [params tasks]
  (let [file-references (extract-file-references params)]
    (cond
      (seq tasks)
      (->> tasks
           (take 4)
           (mapv (fn [task]
                   {:title (or (some-> (:title task) non-empty-str)
                               "Implementation task")
                    :description (or (some-> (:description task) non-empty-str)
                                     (task-content task)
                                     "Complete the planned workstream.")})))

      (seq file-references)
      [{:title "Codebase review"
        :description (str "Review the referenced files and current implementation constraints: "
                          (string/join ", " file-references)
                          ".")}
       {:title "Implementation"
        :description "Translate the requested change into concrete code and data-flow updates."}
       {:title "Validation"
        :description "Check the result end-to-end and summarize any follow-up work."}]

      :else
      [{:title "Investigation"
        :description "Review the current state, surrounding constraints, and open questions."}
       {:title "Implementation"
        :description "Translate the request into concrete implementation tasks."}
       {:title "Validation"
        :description "Verify the outcome and capture remaining risks."}])))

(defn- generic-milestones
  [workstreams]
  (mapv (fn [workstream]
          {:title (str (:title workstream) " completed")
           :description (:description workstream)})
        workstreams))

(defn- generic-dependencies
  [params]
  (vec
   (keep identity
         [(when-let [repo (repo-note params)]
            (str "Use " repo " as the source of truth for planning and validation."))
          (when (true? (:require-approval params))
            "Execution should remain blocked until the approval state is explicitly updated.")])))

(defn- generic-risks
  [params]
  (vec
   (keep identity
         [(when (true? (:require-approval params))
            "Approval and execution state can drift if the planning UI is not refreshed after control actions.")
          (when-not (string? (some-> (get-in params [:project :repo-url]) non-empty-str))
            "Repository-aware planning will stay shallow until repo metadata is available.")])))

(defn- generic-planner-tasks
  [params]
  (let [goal (:goal params)
        goal-description (or (some-> goal :description non-empty-str)
                             (some-> goal :title non-empty-str)
                             (some-> goal :node-title non-empty-str)
                             "Complete the requested work.")
        file-references (extract-file-references params)]
    [{:title "Inspect current state"
      :description (str "Review the goal, current codebase, and constraints. "
                        goal-description
                        (when-let [repo (repo-note params)]
                          (str "\n" repo))
                        (when (seq file-references)
                          (str "\nReferenced files: " (string/join ", " file-references))))}
     {:title (str "Implement " (fallback-task-title goal "the requested change"))
      :description goal-description}
     {:title "Validate and summarize"
      :description "Check the result, note risks, and summarize follow-up work."}]))

(def ^:private planner-json-schema
  {:type "object"
   :additionalProperties false
   :required ["goal_understanding" "clarifications" "workstreams" "milestones" "tasks" "dependencies" "risks"]
   :properties {"goal_understanding" {:type "string"}
                "clarifications" {:type "array"
                                  :items {:type "string"}}
                "workstreams" {:type "array"
                               :items {:type "object"
                                       :additionalProperties false
                                       :required ["title" "description"]
                                       :properties {"title" {:type "string"}
                                                    "description" {:type "string"}}}}
                "milestones" {:type "array"
                              :items {:type "object"
                                      :additionalProperties false
                                      :required ["title" "description"]
                                      :properties {"title" {:type "string"}
                                                   "description" {:type "string"}}}}
                "tasks" {:type "array"
                         :items {:type "object"
                                 :additionalProperties false
                                 :required ["title" "description"]
                                 :properties {"title" {:type "string"}
                                              "description" {:type "string"}
                                              "content" {:type "string"}
                                              "task_uuid" {:type "string"}
                                              "block_uuid" {:type "string"}
                                              "dependencies" {:type "array"
                                                              :items {:type "string"}}
                                              "acceptance_criteria" {:type "array"
                                                                     :items {:type "string"}}}}}
                "dependencies" {:type "array"
                                :items {:type "string"}}
                "risks" {:type "array"
                         :items {:type "string"}}}})

(defn- planner-prompt
  [params]
  (let [goal (:goal params)
        existing-tasks (or (:tasks params)
                           (:planned-tasks params)
                           (:existing-tasks params)
                           [])
        context {:goal {:title (some-> goal :title non-empty-str)
                        :description (or (some-> goal :description non-empty-str)
                                         (some-> goal :node-title non-empty-str))
                        :node-title (some-> goal :node-title non-empty-str)}
                 :project {:repo-url (some-> (get-in params [:project :repo-url]) non-empty-str)
                           :base-branch (some-> (get-in params [:project :base-branch]) non-empty-str)}
                 :planning-messages (planning-message-texts params)
                 :existing-tasks (->> existing-tasks
                                      (keep #(select-keys % [:task-uuid :block-uuid :title :description :content :status :session-id]))
                                      vec)
                 :require-approval (true? (:require-approval params))
                 :auto-dispatch (if (boolean? (:auto-dispatch params))
                                  (:auto-dispatch params)
                                  true)
                 :replan-note (some-> (:replan-note params) non-empty-str)}]
    (str "You are a software planning model. Produce a concise implementation plan as strict JSON.\n"
         "Do not anchor on technology or file names unless they are present in the provided context.\n"
         "Use repo metadata and planning messages only as supporting context.\n"
         "Return implementation-oriented workstreams, milestones, tasks, dependencies, and risks.\n\n"
         "Planning context JSON:\n"
         (js/JSON.stringify (clj->js context) nil 2))))

(defn- normalize-model-plan
  [payload params]
  (when (map? payload)
    (let [tasks (normalize-tasks (:tasks payload))
          workstreams (if (sequential? (:workstreams payload))
                        (->> (:workstreams payload)
                             (keep #(when (map? %)
                                      (select-keys % [:title :description])))
                             vec)
                        [])
          milestones (if (sequential? (:milestones payload))
                       (->> (:milestones payload)
                            (keep #(when (map? %)
                                     (select-keys % [:title :description])))
                            vec)
                       [])]
      (when (seq tasks)
        {:goal-understanding (or (some-> (:goal_understanding payload) non-empty-str)
                                 (some-> (:goal-understanding payload) non-empty-str)
                                 (some-> (:goal params) :description non-empty-str)
                                 (some-> (:goal params) :title non-empty-str)
                                 "")
         :clarifications (if (sequential? (:clarifications payload))
                           (vec (keep non-empty-str (:clarifications payload)))
                           [])
         :workstreams workstreams
         :milestones milestones
         :tasks tasks
         :dependencies (if (sequential? (:dependencies payload))
                         (vec (keep non-empty-str (:dependencies payload)))
                         [])
         :risks (if (sequential? (:risks payload))
                  (vec (keep non-empty-str (:risks payload)))
                  [])}))))

(defn- <planner-model-plan!
  [^js env params]
  (if-let [token (planner-api-token env params)]
    (let [headers (js/Headers.)
          _ (.set headers "content-type" "application/json")
          _ (.set headers "authorization" (str "Bearer " token))
          request-body {:model (planner-model params)
                        :messages [{:role "system"
                                    :content "You are a planning model that produces structured implementation plans for software tasks."}
                                   {:role "user"
                                    :content (planner-prompt params)}]
                        :response_format {:type "json_schema"
                                          :json_schema {:name "planning_plan"
                                                        :strict true
                                                        :schema planner-json-schema}}}
          url (str (planner-base-url env params) "/chat/completions")]
      (-> (js/fetch url
                    #js {:method "POST"
                         :headers headers
                         :body (js/JSON.stringify (clj->js request-body))})
          (.then (fn [response]
                   (if-not (.-ok response)
                     nil
                     (-> (.json response)
                         (.then (fn [payload]
                                  (let [payload (js->clj payload :keywordize-keys true)
                                        content (some-> payload :choices first :message :content non-empty-str)
                                        plan-payload (or (parse-json-safe content)
                                                         (some-> payload :choices first :message :parsed))]
                                    (normalize-model-plan plan-payload params))))))))
          (.catch (fn [error]
                    (log/warn :agent/planning-model-plan-failed error)
                    nil))))
    (native-promise nil)))

(defn- <with-timeout
  [promise timeout-ms timeout-value]
  (if-not (and (number? timeout-ms)
               (pos? timeout-ms))
    promise
    (js/Promise.race
     #js [promise
          (js/Promise.
           (fn [resolve _reject]
             (js/setTimeout
              (fn [] (resolve timeout-value))
              timeout-ms)))])))

(defn enrich-params-with-model-plan
  ([^js env params]
   (enrich-params-with-model-plan env params nil))
  ([^js env params {:keys [timeout-ms]}]
   (-> (<planner-model-plan! env params)
       (<with-timeout timeout-ms nil)
       (.then (fn [plan]
                (if (map? plan)
                  (assoc params
                         :plan plan
                         :tasks (:tasks plan))
                  params))))))

(defn- planner-source-tasks
  [params]
  (let [tasks (or (:tasks params) (:planned-tasks params) (some-> params :plan :tasks))]
    (if (seq tasks)
      tasks
      (generic-planner-tasks params))))

(defn build-plan
  [params]
  (let [goal (:goal params)
        tasks (normalize-tasks (planner-source-tasks params))
        existing-plan (when (map? (:plan params)) (:plan params))
        workstreams (or (some-> existing-plan :workstreams seq vec)
                        (generic-workstreams params tasks))]
    {:goal-understanding (or (some-> existing-plan :goal-understanding non-empty-str)
                             (some-> goal :description non-empty-str)
                             (some-> goal :title non-empty-str)
                             (some-> goal :node-title non-empty-str)
                             "")
     :clarifications (or (some-> existing-plan :clarifications seq vec)
                         (generic-clarifications params))
     :workstreams workstreams
     :milestones (or (some-> existing-plan :milestones seq vec)
                     (generic-milestones workstreams))
     :tasks tasks
     :dependencies (or (some-> existing-plan :dependencies seq vec)
                       (generic-dependencies params))
     :risks (or (some-> existing-plan :risks seq vec)
                (generic-risks params))}))

(defn- approval-decision
  [params]
  (let [decision (some-> (get-in params [:approval :decision])
                         non-empty-str
                         string/lower-case)]
    (cond
      (contains? #{"approved" "pending" "rejected"} decision)
      decision

      (true? (:require-approval params))
      "pending"

      :else
      "approved")))

(defn- started-task?
  [task]
  (or (string? (some-> (:session-id task) non-empty-str))
      (contains? #{"Doing" "Done" "In Review" "Canceled"}
                 (some-> (:status task) non-empty-str))))

(def ^:private execution-owned-fields
  #{:session-id
    :status
    :runtime-provider
    :runner-id
    :pr-url
    :runtime
    :sandbox-checkpoint
    :checkpoint-metadata})

(defn- preserve-execution-owned-fields
  [existing planned]
  (merge planned
         (select-keys existing execution-owned-fields)
         (select-keys existing [:title :content :description :block-uuid])))

(defn- task-match
  [existing task]
  (let [task-uuid (some-> (:task-uuid task) non-empty-str)]
    (some (fn [candidate]
            (when (= task-uuid (some-> (:task-uuid candidate) non-empty-str))
              candidate))
          existing)))

(defn- reconcile-planned-tasks
  [existing-tasks planned-tasks]
  (let [existing (vec (filter map? existing-tasks))
        matched-task-uuids (volatile! #{})
        reconciled (mapv (fn [task]
                           (if-let [matched (task-match existing task)]
                             (do
                               (when-let [task-uuid (some-> (:task-uuid matched) non-empty-str)]
                                 (vswap! matched-task-uuids conj task-uuid))
                               (if (started-task? matched)
                                 (preserve-execution-owned-fields matched task)
                                 (merge matched task)))
                             task))
                         planned-tasks)
        untouched-existing (->> existing
                                (remove (fn [task]
                                          (contains? @matched-task-uuids
                                                     (or (some-> (:task-uuid task) non-empty-str)
                                                         ""))))
                                (remove nil?)
                                vec)]
    (vec (concat reconciled untouched-existing))))

(defn- planning-status
  [approval-status dispatch-sessions auto-dispatch?]
  (cond
    (= "pending" approval-status) "waiting-approval"
    (= "rejected" approval-status) "rejected"
    (and auto-dispatch? (seq dispatch-sessions)) "dispatching"
    :else "planned"))

(defn- dispatch-session-id
  [planning-session-id task]
  (or (some-> (:session-id task) non-empty-str)
      (some-> (:goal task) :node-id non-empty-str)
      (some-> (:goal task) :block-uuid non-empty-str)
      (some-> (:goal task) :id non-empty-str)
      (some-> task :parent-session-id non-empty-str)
      (some-> planning-session-id non-empty-str)))

(defn- dispatch-session
  [planning-session-id params task]
  (let [runtime-provider (some-> (:runtime-provider params) non-empty-str string/lower-case)
        runner-id (some-> (:runner-id params) non-empty-str)
        parent-session-id (or (some-> (:execution-session-id params) non-empty-str)
                              (some-> (:goal params) :node-id non-empty-str)
                              (some-> (:goal params) :block-uuid non-empty-str))
        goal-title (or (some-> (:goal params) :title non-empty-str)
                       (some-> (:goal params) :node-title non-empty-str)
                       "Planning Task")]
    (cond-> {:id (dispatch-session-id planning-session-id
                                      (assoc task :parent-session-id parent-session-id))
             :source {:node-id planning-session-id
                      :node-title goal-title}
             :intent {:content (:content task)}
             :project (:project params)
             :agent (:agent params)
             :task-uuid (:task-uuid task)
             :capabilities {:push-enabled true
                            :pr-enabled true}}
      (string? runtime-provider) (assoc :runtime-provider runtime-provider)
      (string? runner-id) (assoc :runner-id runner-id))))

(defn- ready-dispatch-task?
  [task]
  (not (started-task? task)))

(defn- next-dispatchable-tasks
  [planning-session-id params tasks]
  (if-let [task (some ready-dispatch-task? tasks)]
    [(dispatch-session planning-session-id params task)]
    []))

(defn- repo-aware-state
  [params]
  {:enabled (boolean (some-> (get-in params [:project :repo-url]) non-empty-str))
   :repo-url (some-> (get-in params [:project :repo-url]) non-empty-str)
   :base-branch (some-> (get-in params [:project :base-branch]) non-empty-str)
   :agent-provider (or (some-> (:agent params) :provider non-empty-str)
                       (some-> (:agent params) non-empty-str))})

(defn- scheduled-actions
  [dispatch-ready? dispatch-sessions auto-replan? replan-delay-sec]
  (if (and dispatch-ready?
           (seq dispatch-sessions)
           auto-replan?
           (pos-int? replan-delay-sec))
    [{:type "replan"
      :delay-sec replan-delay-sec}]
    []))

(defn- session-stub
  [^js env session-id]
  (when-let [^js namespace (aget env "LOGSEQ_AGENT_SESSION_DO")]
    (let [do-id (.idFromName namespace session-id)]
      (.get namespace do-id))))

(defn- <dispatch-session!
  [^js env user-id session-task]
  (if-let [^js stub (session-stub env (:id session-task))]
    (let [headers (js/Headers.)]
      (.set headers "content-type" "application/json")
      (when (string? user-id)
        (.set headers "x-user-id" user-id))
      (let [request (platform/request "https://planning.internal/__session__/init"
                                      #js {:method "POST"
                                           :headers headers
                                           :body (js/JSON.stringify (clj->js session-task))})]
        (-> (.fetch stub request)
            (.then (fn [response]
                     {:session-id (:id session-task)
                      :ok (.-ok response)
                      :status (.-status response)}))
            (.catch (fn [error]
                      {:session-id (:id session-task)
                       :ok false
                       :status 500
                       :error (str error)})))))
    (native-promise {:session-id (:id session-task)
                     :ok false
                     :status 503
                     :error "session durable object unavailable"})))

(defn- <dispatch-sessions!
  [^js env user-id dispatch-sessions]
  (js/Promise.all
   (clj->js
    (mapv (fn [session-task]
            (<dispatch-session! env user-id session-task))
          dispatch-sessions))))

(defn- orchestrate
  [params]
  (let [planning-session-id (or (some-> (:planning-session-id params) non-empty-str)
                                (str (random-uuid)))
        planned-tasks (normalize-planner-tasks (planner-source-tasks params))
        existing-tasks (if (sequential? (:existing-tasks params))
                         (vec (:existing-tasks params))
                         [])
        reconciled-tasks (reconcile-planned-tasks existing-tasks planned-tasks)
        approval-status (approval-decision params)
        auto-dispatch? (if (boolean? (:auto-dispatch params))
                         (:auto-dispatch params)
                         true)
        auto-replan? (true? (:auto-replan params))
        replan-delay-sec (let [delay (if (number? (:replan-delay-sec params))
                                       (:replan-delay-sec params)
                                       (some-> (:replan-delay-sec params) str js/parseInt))]
                           (if (and (number? delay) (not (js/isNaN delay)))
                             (max 0 delay)
                             0))
        dispatch-ready? (and auto-dispatch?
                             (= "approved" approval-status))
        dispatch-sessions (if dispatch-ready?
                            (next-dispatchable-tasks planning-session-id params reconciled-tasks)
                            [])
        status (planning-status approval-status dispatch-sessions auto-dispatch?)
        plan (build-plan params)]
    {:ok true
     :status status
     :planning-session-id planning-session-id
     :plan plan
     :reconciled-tasks reconciled-tasks
     :dispatch-sessions dispatch-sessions
     :scheduled-actions (scheduled-actions dispatch-ready? dispatch-sessions auto-replan? replan-delay-sec)
     :planning-state {:planning-session-id planning-session-id
                      :phase (if (= "waiting-approval" status) "approval" "planning")
                      :approval-status approval-status
                      :requires-approval (true? (:require-approval params))
                      :auto-dispatch auto-dispatch?
                      :auto-replan auto-replan?
                      :replan-delay-sec replan-delay-sec
                      :repo-aware (repo-aware-state params)}
     :goal (:goal params)
     :require-approval (true? (:require-approval params))}))

(defn workflow-response
  [instance details]
  {:workflow-id (or (some-> instance .-id)
                    (:id details))
   :status (or (:status details)
               "queued")
   :details details})

(defn orchestrate-response
  [params]
  (orchestrate params))

(defn- native-promise
  [value]
  (js/Promise.resolve value))

(defn- <run-step-do
  [step step-name f]
  (let [step-do (when step (aget step "do"))]
    (if (fn? step-do)
      (.call step-do
             step
             step-name
             (fn []
               (native-promise (f))))
      (native-promise (f)))))

(defn- <dispatch-sessions-with-step!
  [^js env user-id dispatch-sessions step step-name]
  (if (and (seq dispatch-sessions)
           (string? user-id)
           env)
    (<run-step-do step
                  step-name
                  (fn []
                    (<dispatch-sessions! env user-id dispatch-sessions)))
    (native-promise nil)))

(defn- with-dispatched-task-sessions
  [orchestrated]
  (let [dispatch-sessions (:dispatch-sessions orchestrated)
        session-id-by-task (->> dispatch-sessions
                                (reduce (fn [acc session]
                                          (if-let [task-uuid (some-> (:task-uuid session) non-empty-str)]
                                            (assoc acc task-uuid (:id session))
                                            acc))
                                        {}))]
    (if (empty? session-id-by-task)
      orchestrated
      (update orchestrated
              :reconciled-tasks
              (fn [tasks]
                (mapv (fn [task]
                        (if-let [session-id (get session-id-by-task
                                                 (some-> (:task-uuid task) non-empty-str))]
                          (cond-> (assoc task :session-id session-id)
                            (not (started-task? task)) (assoc :status "Doing"))
                          task))
                      (or tasks [])))))))

(defn- workflow-event-payload
  [event]
  (let [event (if (map? event)
                event
                (js->clj event :keywordize-keys true))]
    (when (map? event)
      (if (contains? event :payload)
        (:payload event)
        event))))

(defn- approval-decision-from-event
  [event]
  (let [payload (workflow-event-payload event)
        decision (some-> (:decision payload) non-empty-str string/lower-case)]
    (cond
      (contains? #{"approved" "pending" "rejected"} decision)
      decision

      (true? (:approved payload))
      "approved"

      (false? (:approved payload))
      "rejected"

      :else
      "pending")))

(defn- <wait-for-approval-event!
  [step]
  (let [wait-for-event (when step (aget step "waitForEvent"))]
    (if (fn? wait-for-event)
      (-> (.call wait-for-event
                 step
                 "wait-for-approval"
                 #js {:type "approval"
                      :timeout "30 days"})
          (.then approval-decision-from-event)
          (.catch (fn [_]
                    "pending")))
      (js/Promise.resolve "pending"))))

(defn- replan-action
  [orchestrated]
  (->> (:scheduled-actions orchestrated)
       (filter map?)
       (some (fn [action]
               (when (= "replan" (some-> (:type action) non-empty-str string/lower-case))
                 action)))))

(defn- <sleep-for-replan!
  [step delay-sec]
  (let [delay-sec (if (and (number? delay-sec)
                           (not (js/isNaN delay-sec)))
                    (max 0 delay-sec)
                    0)
        step-sleep (when step (aget step "sleep"))]
    (cond
      (and (pos-int? delay-sec)
           (fn? step-sleep))
      (.call step-sleep
             step
             (str "scheduled-replan-delay-" delay-sec)
             (str delay-sec " seconds"))

      (pos-int? delay-sec)
      (js/Promise.
       (fn [resolve _reject]
         (js/setTimeout resolve (* delay-sec 1000))))

      :else
      (js/Promise.resolve nil))))

(defn- <persist-planning-session!
  [^js env params orchestrated]
  (let [user-id (some-> (:user-id params) non-empty-str)
        planning-session-id (some-> (:planning-session-id orchestrated) non-empty-str)
        workflow-id (some-> (:workflow-id params) non-empty-str)
        persisted-plan (assoc (:plan orchestrated)
                              :tasks (:reconciled-tasks orchestrated))]
    (if (and env
             (planning-store/available? env)
             (string? user-id)
             (string? planning-session-id))
      (native-promise
       (planning-store/<upsert-planning-session! env
                                                 {:planning-session-id planning-session-id
                                                  :user-id user-id
                                                  :workflow-id workflow-id
                                                  :status (:status orchestrated)
                                                  :goal (:goal params)
                                                  :project (:project params)
                                                  :agent (:agent params)
                                                  :plan persisted-plan
                                                  :approval-status (get-in orchestrated [:planning-state :approval-status])
                                                  :require-approval (true? (:require-approval params))
                                                  :auto-dispatch (if (boolean? (:auto-dispatch params))
                                                                   (:auto-dispatch params)
                                                                   true)
                                                  :auto-replan (true? (:auto-replan params))
                                                  :replan-delay-sec (:replan-delay-sec params)
                                                  :scheduled-actions (:scheduled-actions orchestrated)
                                                  :dispatch-sessions (:dispatch-sessions orchestrated)}))
      (native-promise nil))))

(defn- replan-event-params
  [event]
  (let [payload (workflow-event-payload event)
        params (:params payload)]
    (when (map? params)
      params)))

(defn- <wait-for-replan-event!
  [step]
  (let [wait-for-event (when step (aget step "waitForEvent"))]
    (if (fn? wait-for-event)
      (-> (.call wait-for-event
                 step
                 "wait-for-replan"
                 #js {:type "replan"
                      :timeout "30 days"})
          (.then replan-event-params)
          (.catch (fn [_]
                    nil)))
      (js/Promise.resolve nil))))

(defn- <dispatch-and-schedule!
  [^js env user-id step params orchestrated]
  (-> (<dispatch-sessions-with-step! env
                                     user-id
                                     (:dispatch-sessions orchestrated)
                                     step
                                     "execution-dispatch")
      (.then (fn [dispatch-results]
               (let [orchestrated (cond-> orchestrated
                                    (some? dispatch-results) (assoc :dispatch-results dispatch-results))
                     orchestrated (with-dispatched-task-sessions orchestrated)]
                 (-> (<persist-planning-session! env params orchestrated)
                     (.then (fn [_]
                              (if-let [action (when step
                                                (replan-action orchestrated))]
                                (let [delay-sec (:delay-sec action)]
                                  (-> (<sleep-for-replan! step delay-sec)
                                      (.then (fn [_]
                                               (let [next-params (assoc params :existing-tasks (:reconciled-tasks orchestrated))
                                                     replan-orchestrated (orchestrate next-params)]
                                                 (-> (<dispatch-and-schedule! env
                                                                              user-id
                                                                              step
                                                                              next-params
                                                                              replan-orchestrated)
                                                     (.then (fn [result]
                                                              (assoc result
                                                                     :scheduler {:executed true
                                                                                 :action action
                                                                                 :base-status (:status orchestrated)})))))))))
                                (-> (<wait-for-replan-event! step)
                                    (.then (fn [replan-params]
                                             (if-not (map? replan-params)
                                               orchestrated
                                               (let [next-params (merge params
                                                                        replan-params
                                                                        {:existing-tasks (:reconciled-tasks orchestrated)})
                                                     replan-orchestrated (orchestrate next-params)]
                                                 (<dispatch-and-schedule! env
                                                                          user-id
                                                                          step
                                                                          next-params
                                                                          replan-orchestrated)))))))))))))))

(defn run
  [this event step]
  (let [params (if (map? (:params event))
                 (merge (:params event)
                        (dissoc event :params))
                 event)
        env (some-> this .-env)
        user-id (some-> (:user-id params) non-empty-str)
        orchestrated (orchestrate params)]
    (-> (if (= "waiting-approval" (:status orchestrated))
          (-> (<persist-planning-session! env params orchestrated)
              (.then (fn [_]
                       (<wait-for-approval-event! step)))
              (.then (fn [approval-status]
                       (let [approval-status (if (contains? #{"approved" "pending" "rejected"} approval-status)
                                               approval-status
                                               "pending")
                             approved-params (assoc params :approval {:decision approval-status})
                             next-orchestrated (orchestrate approved-params)]
                         (if (= "approved" approval-status)
                           (<dispatch-and-schedule! env user-id step approved-params next-orchestrated)
                           (-> (<persist-planning-session! env approved-params next-orchestrated)
                               (.then (fn [_]
                                        next-orchestrated))))))))
          (<dispatch-and-schedule! env user-id step params orchestrated))
        (.catch (fn [error]
                  (log/error :agent/planning-workflow-run-failed error)
                  (-> (<persist-planning-session! env
                                                  params
                                                  {:status "failed"
                                                   :planning-session-id (or (:planning-session-id orchestrated)
                                                                            (:planning-session-id params))
                                                   :plan (:plan orchestrated)
                                                   :reconciled-tasks (:reconciled-tasks orchestrated)
                                                   :dispatch-sessions []
                                                   :scheduled-actions []
                                                   :planning-state {:approval-status (get-in orchestrated [:planning-state :approval-status])}})
                      (.then (fn [_]
                               {:ok false
                                :status "failed"
                                :error (str error)}))))))))
