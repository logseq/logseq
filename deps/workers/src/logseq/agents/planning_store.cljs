(ns logseq.agents.planning-store
  (:require [clojure.string :as string]
            [logseq.sync.common :as common]
            [promesa.core :as p]))

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed)
        trimmed))))

(defn- normalize-int
  [value default-value]
  (let [parsed (if (number? value)
                 value
                 (some-> value str js/parseInt))]
    (if (and (number? parsed)
             (not (js/isNaN parsed)))
      parsed
      default-value)))

(defn- bool->int
  [value]
  (if (true? value) 1 0))

(defn- int->bool
  [value]
  (pos? (normalize-int value 0)))

(defn- parse-json
  [value default-value]
  (if-let [raw (non-empty-str value)]
    (try
      (js->clj (js/JSON.parse raw) :keywordize-keys true)
      (catch :default _
        default-value))
    default-value))

(defn- serialize-json
  [value]
  (when (some? value)
    (js/JSON.stringify (clj->js value))))

(defn- db-binding
  [^js env]
  (aget env "AGENTS_DB"))

(defn available?
  [^js env]
  (boolean (db-binding env)))

(declare <get-planning-session!)
(declare <get-planning-session-by-id!)

(defn- row->planning-session
  [row]
  (when row
    (let [planning-session-id (aget row "planning_session_id")
          user-id (aget row "user_id")
          workflow-id (non-empty-str (aget row "workflow_id"))
          status (or (non-empty-str (aget row "status")) "queued")
          approval-status (or (non-empty-str (aget row "approval_status")) "pending")
          require-approval (int->bool (aget row "require_approval"))
          auto-dispatch (int->bool (aget row "auto_dispatch"))
          auto-replan (int->bool (aget row "auto_replan"))
          replan-delay-sec (normalize-int (aget row "replan_delay_sec") 0)
          created-at (normalize-int (aget row "created_at") 0)
          updated-at (normalize-int (aget row "updated_at") 0)
          last-error (non-empty-str (aget row "last_error"))
          goal (parse-json (aget row "goal_json") nil)
          plan (parse-json (aget row "plan_json") nil)
          project (parse-json (aget row "project_json") nil)
          agent (parse-json (aget row "agent_json") nil)
          scheduled-actions (parse-json (aget row "scheduled_actions_json") [])
          dispatch-sessions (parse-json (aget row "dispatch_sessions_json") [])]
      (when (and (string? planning-session-id)
                 (string? user-id))
        (cond-> {:planning-session-id planning-session-id
                 :user-id user-id
                 :status status
                 :approval-status approval-status
                 :require-approval require-approval
                 :auto-dispatch auto-dispatch
                 :auto-replan auto-replan
                 :replan-delay-sec replan-delay-sec
                 :scheduled-actions (if (sequential? scheduled-actions)
                                      (vec scheduled-actions)
                                      [])
                 :dispatch-sessions (if (sequential? dispatch-sessions)
                                      (vec dispatch-sessions)
                                      [])
                 :created-at created-at
                 :updated-at updated-at}
          (string? workflow-id) (assoc :workflow-id workflow-id)
          (map? goal) (assoc :goal goal)
          (map? plan) (assoc :plan plan)
          (map? project) (assoc :project project)
          (some? agent) (assoc :agent agent)
          (string? last-error) (assoc :last-error last-error))))))

(defn <upsert-planning-session!
  [^js env planning-session]
  (if-let [db (db-binding env)]
    (let [planning-session-id (some-> (:planning-session-id planning-session) non-empty-str)
          user-id (some-> (:user-id planning-session) non-empty-str)
          workflow-id (some-> (:workflow-id planning-session) non-empty-str)
          status (or (some-> (:status planning-session) non-empty-str) "queued")
          approval-status (or (some-> (:approval-status planning-session) non-empty-str)
                              (if (true? (:require-approval planning-session)) "pending" "approved"))
          require-approval (bool->int (true? (:require-approval planning-session)))
          auto-dispatch (bool->int (if (boolean? (:auto-dispatch planning-session))
                                     (:auto-dispatch planning-session)
                                     true))
          auto-replan (bool->int (true? (:auto-replan planning-session)))
          replan-delay-sec (max 0 (normalize-int (:replan-delay-sec planning-session) 0))
          now (common/now-ms)]
      (if (and (string? planning-session-id)
               (string? user-id))
        (p/let [_ (common/<d1-run db
                                  (str "insert into planning_sessions "
                                       "(planning_session_id, user_id, workflow_id, status, goal_json, plan_json, project_json, agent_json, "
                                       "approval_status, require_approval, auto_dispatch, auto_replan, replan_delay_sec, "
                                       "scheduled_actions_json, dispatch_sessions_json, last_error, created_at, updated_at) "
                                       "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
                                       "on conflict(planning_session_id) do update set "
                                       "user_id = excluded.user_id, "
                                       "workflow_id = excluded.workflow_id, "
                                       "status = excluded.status, "
                                       "goal_json = excluded.goal_json, "
                                       "plan_json = excluded.plan_json, "
                                       "project_json = excluded.project_json, "
                                       "agent_json = excluded.agent_json, "
                                       "approval_status = excluded.approval_status, "
                                       "require_approval = excluded.require_approval, "
                                       "auto_dispatch = excluded.auto_dispatch, "
                                       "auto_replan = excluded.auto_replan, "
                                       "replan_delay_sec = excluded.replan_delay_sec, "
                                       "scheduled_actions_json = excluded.scheduled_actions_json, "
                                       "dispatch_sessions_json = excluded.dispatch_sessions_json, "
                                       "last_error = excluded.last_error, "
                                       "updated_at = excluded.updated_at")
                                  planning-session-id
                                  user-id
                                  workflow-id
                                  status
                                  (serialize-json (:goal planning-session))
                                  (serialize-json (:plan planning-session))
                                  (serialize-json (:project planning-session))
                                  (serialize-json (:agent planning-session))
                                  approval-status
                                  require-approval
                                  auto-dispatch
                                  auto-replan
                                  replan-delay-sec
                                  (serialize-json (:scheduled-actions planning-session))
                                  (serialize-json (:dispatch-sessions planning-session))
                                  (some-> (:last-error planning-session) non-empty-str)
                                  now
                                  now)
                stored (<get-planning-session-by-id! env planning-session-id)]
          stored)
        (p/resolved nil)))
    (p/resolved nil)))

(defn <get-planning-session-by-id!
  [^js env planning-session-id]
  (if-let [db (db-binding env)]
    (if-let [planning-session-id (some-> planning-session-id non-empty-str)]
      (p/let [result (common/<d1-all db
                                     (str "select planning_session_id, user_id, workflow_id, status, goal_json, plan_json, project_json, "
                                          "agent_json, approval_status, require_approval, auto_dispatch, auto_replan, replan_delay_sec, "
                                          "scheduled_actions_json, dispatch_sessions_json, last_error, created_at, updated_at "
                                          "from planning_sessions where planning_session_id = ? limit 1")
                                     planning-session-id)
              rows (common/get-sql-rows result)]
        (row->planning-session (first rows)))
      (p/resolved nil))
    (p/resolved nil)))

(defn <get-planning-session!
  [^js env user-id planning-session-id]
  (if-let [db (db-binding env)]
    (if-let [user-id (some-> user-id non-empty-str)]
      (if-let [planning-session-id (some-> planning-session-id non-empty-str)]
        (p/let [result (common/<d1-all db
                                       (str "select planning_session_id, user_id, workflow_id, status, goal_json, plan_json, project_json, "
                                            "agent_json, approval_status, require_approval, auto_dispatch, auto_replan, replan_delay_sec, "
                                            "scheduled_actions_json, dispatch_sessions_json, last_error, created_at, updated_at "
                                            "from planning_sessions where planning_session_id = ? and user_id = ? limit 1")
                                       planning-session-id
                                       user-id)
                rows (common/get-sql-rows result)]
          (row->planning-session (first rows)))
        (p/resolved nil))
      (p/resolved nil))
    (p/resolved nil)))

(defn <update-planning-session!
  [^js env user-id planning-session-id updates]
  (p/let [existing (<get-planning-session! env user-id planning-session-id)]
    (if-not (map? existing)
      nil
      (<upsert-planning-session! env (merge existing updates)))))

(defn <update-planning-session-by-id!
  [^js env planning-session-id updates]
  (p/let [existing (<get-planning-session-by-id! env planning-session-id)]
    (if-not (map? existing)
      nil
      (<upsert-planning-session! env (merge existing updates)))))

(defn <set-planning-approval!
  [^js env user-id planning-session-id approval-status]
  (<update-planning-session! env
                             user-id
                             planning-session-id
                             {:approval-status (or (some-> approval-status non-empty-str)
                                                   "pending")}))
