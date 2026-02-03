(ns frontend.handler.agent
  "Agent sessions for tasks."
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.db-based.sync :as db-sync]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.db-sync.malli-schema :as db-sync-schema]
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

(defn- resolve-entity [value]
  (cond
    (map? value) value
    (integer? value) (db/entity value)
    (uuid? value) (db/entity [:block/uuid value])
    (string? value) (db/entity [:block/name (string/lower-case value)])
    :else nil))

(defn- agent-config
  [agent-page]
  (let [api-token (blank->nil (pu/get-block-property-value agent-page :logseq.property/agent-api-token))
        auth-json (blank->nil (pu/get-block-property-value agent-page :logseq.property/agent-auth-json))
        provider (blank->nil (:block/title agent-page))]
    (cond-> {}
      (string? provider) (assoc :provider provider)
      (string? api-token) (assoc :api-token api-token)
      (string? auth-json) (assoc :auth-json auth-json))))

(defn- project-config
  [project-page]
  (let [repo-url (blank->nil (pu/get-block-property-value project-page :logseq.property/git-repo))
        project-id (some-> (:block/uuid project-page) str)
        title (blank->nil (:block/title project-page))]
    (when (and project-id title repo-url)
      {:id project-id
       :title title
       :repo-url repo-url})))

(defn- task-context
  [block]
  (let [block-uuid (:block/uuid block)
        node-id (some-> block-uuid str)
        node-title (or (blank->nil (:block/raw-title block))
                       (blank->nil (:block/title block))
                       "")
        content (or (blank->nil (:block/raw-title block))
                    (blank->nil (:block/title block))
                    "")
        project-page (resolve-entity (pu/get-block-property-value block :logseq.property/project))
        agent-page (resolve-entity (pu/get-block-property-value block :logseq.property/agent))
        project (when project-page (project-config project-page))
        agent (when agent-page (agent-config agent-page))]
    {:block-uuid block-uuid
     :node-id node-id
     :node-title node-title
     :content content
     :attachments []
     :project project
     :agent agent}))

(defn task-ready?
  [block]
  (let [{:keys [project agent node-id]} (task-context block)]
    (and (string? node-id)
         (map? project)
         (seq project)
         (map? agent)
         (seq agent))))

(defn- build-session-body
  [block]
  (let [{:keys [block-uuid node-id node-title content attachments project agent]} (task-context block)
        session-id (some-> block-uuid str)]
    (when (and session-id node-id (string? node-title) (string? content) (map? project) (map? agent))
      {:session-id session-id
       :node-id node-id
       :node-title node-title
       :content content
       :attachments attachments
       :project project
       :agent agent})))

(def ^:private session-status->task-status
  {"created" :logseq.property/status.todo
   "running" :logseq.property/status.doing
   "paused" :logseq.property/status.todo
   "completed" :logseq.property/status.done
   "failed" :logseq.property/status.canceled
   "canceled" :logseq.property/status.canceled})

(defn- terminal-status? [status]
  (contains? #{"completed" "failed" "canceled"} status))

(defn- status->label [status-ident]
  (some-> (db/entity status-ident) :block/title))

(defn- maybe-update-task-status!
  [block-uuid status]
  (when-let [status-ident (get session-status->task-status status)]
    (when-let [block (db/entity [:block/uuid block-uuid])]
      (let [current (pu/get-block-property-value block :logseq.property/status)
            desired (status->label status-ident)]
        (when (and desired (not= current desired))
          (property-handler/set-block-property! block-uuid :logseq.property/status status-ident))))))

(defn- update-session-state!
  [block-uuid data]
  (state/update-state! :agent/sessions
                       (fn [sessions]
                         (update sessions (str block-uuid) merge data))))

(defonce ^:private session-pollers (atom {}))

(defn- stop-session-poller!
  [block-uuid]
  (when-let [{:keys [interval-id]} (get @session-pollers (str block-uuid))]
    (js/clearInterval interval-id)
    (swap! session-pollers dissoc (str block-uuid))))

(defn- <poll-session!
  [base block-uuid session-id]
  (p/let [resp (db-sync/fetch-json (str base "/sessions/" session-id)
                                   {:method "GET"}
                                   {:response-schema :sessions/get})]
    (let [status (:status resp)]
      (update-session-state! block-uuid {:status status
                                         :updated-at (:updated-at resp)})
      (maybe-update-task-status! block-uuid status)
      (when (terminal-status? status)
        (stop-session-poller! block-uuid)))))

(defn- start-session-poller!
  [base block-uuid session-id]
  (stop-session-poller! block-uuid)
  (let [block-uuid (str block-uuid)
        poll! (fn []
                (-> (<poll-session! base block-uuid session-id)
                    (p/catch (fn [error]
                               (log/error :agent/session-poll-failed {:error error
                                                                      :session-id session-id})
                               nil))))
        interval-id (js/setInterval poll! 2000)]
    (swap! session-pollers assoc block-uuid {:interval-id interval-id
                                             :session-id session-id})
    (poll!)))

(defn <start-session!
  [block]
  (let [base (db-sync/http-base)]
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
      (p/let [_ (js/Promise. user-handler/task--ensure-id&access-token)
              body (build-session-body block)
              body (coerce-http-request :sessions/create body)]
        (if (nil? body)
          (do
            (notification/show! "Invalid agent session payload." :error false)
            nil)
          (p/let [resp (db-sync/fetch-json (str base "/sessions")
                                           {:method "POST"
                                            :headers {"content-type" "application/json"}
                                            :body (js/JSON.stringify (clj->js body))}
                                           {:response-schema :sessions/create})
                  session-id (:session-id resp)
                  status (:status resp)
                  stream-url (:stream-url resp)
                  block-uuid (:block/uuid block)]
            (update-session-state! block-uuid {:session-id session-id
                                               :status status
                                               :stream-url stream-url
                                               :started-at (util/time-ms)})
            (maybe-update-task-status! block-uuid status)
            (start-session-poller! base block-uuid session-id)
            resp))))))
