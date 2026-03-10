(ns logseq.agents.request
  (:require [clojure.string :as string]))

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed)
        trimmed))))

(defn- normalize-base-url
  [value]
  (some-> value non-empty-str (string/replace #"/+$" "")))

(defn- normalize-int
  [value default-value]
  (let [parsed (if (number? value)
                 value
                 (some-> value str js/parseInt))]
    (if (and (number? parsed)
             (not (js/isNaN parsed)))
      parsed
      default-value)))

(defn- non-negative-int
  [value default-value]
  (max 0 (normalize-int value default-value)))

(defn- normalize-bool
  [value default-value]
  (if (boolean? value)
    value
    default-value))

(defn- normalize-approval
  [value]
  (when (map? value)
    (let [decision (some-> (:decision value)
                           non-empty-str
                           string/lower-case)
          decision (if (contains? #{"pending" "approved" "rejected"} decision)
                     decision
                     "pending")
          approval-comment (some-> (:comment value) non-empty-str)]
      (cond-> {:decision decision}
        (string? approval-comment) (assoc :comment approval-comment)))))

(defn normalize-session-create
  [body]
  (when (map? body)
    (let [attachments (:attachments body)
          attachments (when (sequential? attachments) (vec attachments))
          runtime-provider (some-> (:runtime-provider body)
                                   non-empty-str
                                   string/lower-case)
          runner-id (some-> (:runner-id body) non-empty-str)
          capabilities (if (map? (:capabilities body))
                         (:capabilities body)
                         {})
          capabilities (merge {:push-enabled true
                               :pr-enabled true}
                              (select-keys capabilities [:push-enabled :pr-enabled]))]
      (cond-> {:id (:session-id body)
               :source {:node-id (:node-id body)
                        :node-title (:node-title body)}
               :intent {:content (:content body)}
               :project (:project body)
               :agent (:agent body)
               :capabilities capabilities}
        (some? attachments) (assoc-in [:intent :attachments] attachments)
        (string? runtime-provider) (assoc :runtime-provider runtime-provider)
        (string? runner-id) (assoc :runner-id runner-id)))))

(defn normalize-planning-create
  [body]
  (when-let [task (normalize-session-create body)]
    (let [agent (:agent task)]
      (assoc task
             :agent
             (cond
               (string? agent)
               {:provider agent
                :permission-mode "read-only"}

               (map? agent)
               (cond-> agent
                 (and (= "codex" (some-> (:provider agent) non-empty-str string/lower-case))
                      (nil? (:permission-mode agent))
                      (nil? (:permissionMode agent)))
                 (assoc :permission-mode "read-only"))

               :else agent)))))

(defn normalize-planning-workflow-create
  [body]
  (when (map? body)
    (let [workflow-id (some-> (:workflow-id body) non-empty-str)
          planning-session-id (some-> (:planning-session-id body) non-empty-str)
          user-id (some-> (:user-id body) non-empty-str)
          goal (:goal body)
          tasks (or (:tasks body) (:planned-tasks body))
          tasks (when (sequential? tasks) (vec tasks))
          planning-messages (when (sequential? (:planning-messages body))
                              (vec (:planning-messages body)))
          require-approval? (true? (:require-approval body))
          auto-dispatch? (normalize-bool (:auto-dispatch body) true)
          auto-replan? (normalize-bool (:auto-replan body) false)
          replan-delay-sec (non-negative-int (:replan-delay-sec body) 0)
          replan-note (or (some-> (:replan-note body) non-empty-str)
                          (some-> (:comment body) non-empty-str))
          approval (normalize-approval (:approval body))
          project (when (map? (:project body)) (:project body))
          agent (:agent body)
          runtime-provider (some-> (:runtime-provider body)
                                   non-empty-str
                                   string/lower-case)
          runner-id (some-> (:runner-id body) non-empty-str)]
      (cond-> {:require-approval require-approval?
               :auto-dispatch auto-dispatch?
               :auto-replan auto-replan?
               :replan-delay-sec replan-delay-sec}
        (string? workflow-id) (assoc :workflow-id workflow-id)
        (string? planning-session-id) (assoc :planning-session-id planning-session-id)
        (string? user-id) (assoc :user-id user-id)
        (map? goal) (assoc :goal goal)
        (sequential? tasks) (assoc :tasks tasks)
        (sequential? planning-messages) (assoc :planning-messages planning-messages)
        (map? project) (assoc :project project)
        (some? agent) (assoc :agent agent)
        (string? runtime-provider) (assoc :runtime-provider runtime-provider)
        (string? runner-id) (assoc :runner-id runner-id)
        (string? replan-note) (assoc :replan-note replan-note)
        (map? approval) (assoc :approval approval)))))

(defn normalize-runner-register
  [body user-id]
  (when (map? body)
    (let [runner-id (some-> (:runner-id body) non-empty-str)
          user-id (some-> user-id non-empty-str)
          base-url (some-> (:base-url body) normalize-base-url)
          agent-token (some-> (:agent-token body) non-empty-str)
          access-client-id (some-> (:access-client-id body) non-empty-str)
          access-client-secret (some-> (:access-client-secret body) non-empty-str)
          max-sessions (max 1 (normalize-int (:max-sessions body) 1))]
      (when (and (string? runner-id)
                 (string? user-id)
                 (string? base-url))
        (cond-> {:runner-id runner-id
                 :user-id user-id
                 :base-url base-url
                 :max-sessions max-sessions}
          (string? agent-token) (assoc :agent-token agent-token)
          (string? access-client-id) (assoc :access-client-id access-client-id)
          (string? access-client-secret) (assoc :access-client-secret access-client-secret))))))

(defn normalize-runner-heartbeat
  [body]
  (if-not (map? body)
    {}
    (let [active-sessions (:active-sessions body)
          active-sessions (when (some? active-sessions)
                            (max 0 (normalize-int active-sessions 0)))]
      (cond-> {}
        (number? active-sessions) (assoc :active-sessions active-sessions)))))
