(ns logseq.agents.handler
  (:require [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.agents.managed-auth :as managed-auth]
            [logseq.agents.planning-store :as planning-store]
            [logseq.agents.planning-workflow :as planning-workflow]
            [logseq.agents.request :as agent-request]
            [logseq.agents.routes :as routes]
            [logseq.agents.runner-store :as runner-store]
            [logseq.sync.common :as common]
            [logseq.sync.platform.core :as platform]
            [logseq.sync.worker.auth :as auth]
            [logseq.sync.worker.http :as http]
            [promesa.core :as p]))

(defn- session-namespace [^js env]
  (.-LOGSEQ_AGENT_SESSION_DO env))

(defn- session-stub [^js env session-id]
  (when-let [^js namespace (session-namespace env)]
    (let [do-id (.idFromName namespace session-id)]
      (.get namespace do-id))))

(defn- base-headers [request claims]
  (let [headers (js/Headers.)
        token (.get (.-headers request) "authorization")
        user-id (aget claims "sub")
        email (aget claims "email")
        username (aget claims "username")
        idempotency-key (.get (.-headers request) "idempotency-key")]
    (.set headers "content-type" "application/json")
    (when (string? token)
      (.set headers "authorization" token))
    (when (string? user-id)
      (.set headers "x-user-id" user-id))
    (when (string? email)
      (.set headers "x-user-email" email))
    (when (string? username)
      (.set headers "x-user-username" username))
    (when (string? idempotency-key)
      (.set headers "idempotency-key" idempotency-key))
    headers))

(defn- claims-user-id
  [claims]
  (aget claims "sub"))

(defn- planning-session-id-from-route
  [route]
  (some-> (get-in route [:path-params :planning-session-id]) str string/trim not-empty))

(declare planning-agent-binding planning-workflow-binding)

(defn- codex-agent?
  [agent]
  (cond
    (string? agent)
    (= "codex" (string/lower-case agent))

    (map? agent)
    (= "codex" (some-> (:provider agent) str string/lower-case))

    :else
    false))

(defn- agent-auth-present?
  [agent]
  (and (map? agent)
       (or (string? (:api-token agent))
           (string? (:auth-json agent))
           (map? (:managed-auth agent)))))

(defn- <inject-managed-auth
  [env user-id body]
  (let [agent (:agent body)]
    (if (or (not (string? user-id))
            (not (codex-agent? agent))
            (agent-auth-present? agent))
      (p/resolved body)
      (p/let [managed-auth (managed-auth/<get-active-managed-auth-for-user! env user-id)]
        (cond
          (and (map? managed-auth)
               (= "valid" (:auth-state managed-auth)))
          (if (map? agent)
            (assoc-in body [:agent :managed-auth] managed-auth)
            (assoc body :agent {:provider "codex"
                                :managed-auth managed-auth}))

          (and (map? managed-auth)
               (= "expired" (:auth-state managed-auth)))
          ::managed-auth-expired

          :else
          ::managed-auth-missing)))))

(defn- runner-response
  [runner]
  (select-keys runner
               [:runner-id
                :user-id
                :base-url
                :status
                :max-sessions
                :active-sessions
                :last-heartbeat-at
                :created-at
                :updated-at]))

(defn- forward-request [^js stub url method headers body]
  (let [init (cond-> {:method method :headers headers}
               (some? body)
               (assoc :body body))]
    (.fetch stub (platform/request url (clj->js init)))))

(defn- forward-websocket-request [^js stub request url claims]
  (let [headers (js/Headers. (.-headers request))
        user-id (aget claims "sub")
        email (aget claims "email")
        username (aget claims "username")]
    (when (string? user-id)
      (.set headers "x-user-id" user-id))
    (when (string? email)
      (.set headers "x-user-email" email))
    (when (string? username)
      (.set headers "x-user-username" username))
    (let [forwarded-request (js/Request. url
                                         #js {:method (.-method request)
                                              :headers headers})]
      (.fetch stub forwarded-request))))

(defn- handle-session-create
  [{:keys [env request url claims]} normalize-request]
  (p/let [result (common/read-json request)]
    (if (nil? result)
      (http/bad-request "missing body")
      (let [body (js->clj result :keywordize-keys true)
            body (http/coerce-http-request :sessions/create body)
            session-id (:session-id body)
            user-id (claims-user-id claims)]
        (cond
          (nil? body)
          (http/bad-request "invalid body")

          (not (string? session-id))
          (http/bad-request "invalid session id")

          :else
          (p/let [body' (<inject-managed-auth env user-id body)]
            (cond
              (= ::managed-auth-missing body')
              (http/error-response "chatgpt login required" 401)

              (= ::managed-auth-expired body')
              (http/error-response "chatgpt login expired, reconnect required" 401)

              :else
              (if-let [^js stub (session-stub env session-id)]
                (let [headers (base-headers request claims)
                      _ (.set headers "x-stream-base" (.-origin url))
                      task (normalize-request body')
                      body-json (js/JSON.stringify (clj->js task))
                      do-url (str (.-origin url) "/__session__/init")]
                  (forward-request stub do-url "POST" headers body-json))
                (http/error-response "server error" 500)))))))))

(defn- handle-create [{:keys [env request url claims]}]
  (handle-session-create {:env env
                          :request request
                          :url url
                          :claims claims}
                         agent-request/normalize-session-create))

(defn- normalize-planning-session-create
  [body claims]
  (let [planning-session-id (or (some-> (:planning-session-id body) str string/trim not-empty)
                                (some-> (:session-id body) str string/trim not-empty)
                                (str (random-uuid)))
        goal (if (map? (:goal body))
               (:goal body)
               (cond-> {}
                 (some-> (:node-id body) str string/trim not-empty) (assoc :node-id (some-> (:node-id body) str string/trim))
                 (some-> (:node-title body) str string/trim not-empty) (assoc :title (some-> (:node-title body) str string/trim))
                 (some-> (:content body) str string/trim not-empty) (assoc :description (some-> (:content body) str string/trim))))
        require-approval (true? (:require-approval body))
        approval-status (if require-approval "pending" "approved")]
    {:planning-session-id planning-session-id
     :user-id (claims-user-id claims)
     :status "active"
     :goal goal
     :project (when (map? (:project body)) (:project body))
     :agent (:agent body)
     :approval-status approval-status
     :require-approval require-approval
     :auto-dispatch (if (boolean? (:auto-dispatch body))
                      (:auto-dispatch body)
                      false)
     :auto-replan (true? (:auto-replan body))
     :replan-delay-sec (if (number? (:replan-delay-sec body))
                         (max 0 (:replan-delay-sec body))
                         0)}))

(defn- handle-planning-create [{:keys [env request claims]}]
  (cond
    (not (planning-agent-binding env))
    (http/error-response "planning chat transport unavailable" 503)

    (not (planning-store/available? env))
    (http/error-response "planning state unavailable" 503)

    :else
    (p/let [result (common/read-json request)]
      (if (nil? result)
        (http/bad-request "missing body")
        (p/let [body' (js->clj result :keywordize-keys true)
                session (normalize-planning-session-create body' claims)
                planning-session-id (:planning-session-id session)
                user-id (:user-id session)
                params (agent-request/normalize-planning-workflow-create
                        (merge body'
                               {:planning-session-id planning-session-id
                                :user-id user-id
                                :goal (:goal session)
                                :project (:project session)
                                :agent (:agent session)
                                :require-approval (:require-approval session)
                                :auto-dispatch (:auto-dispatch session)
                                :auto-replan (:auto-replan session)
                                :replan-delay-sec (:replan-delay-sec session)}))
                params (when (map? params)
                         (planning-workflow/enrich-params-with-model-plan env
                                                                          params
                                                                          {:timeout-ms 2500}))
                orchestrated (when (map? params)
                               (planning-workflow/orchestrate-response params))]
          (if-not (and (string? planning-session-id)
                       (string? user-id)
                       (map? params)
                       (map? orchestrated))
            (http/bad-request "invalid body")
            (-> (planning-store/<upsert-planning-session! env
                                                          (assoc session
                                                                 :status (:status orchestrated)
                                                                 :goal (:goal params)
                                                                 :project (:project params)
                                                                 :agent (:agent params)
                                                                 :plan (assoc (:plan orchestrated)
                                                                              :tasks (:reconciled-tasks orchestrated))
                                                                 :scheduled-actions (:scheduled-actions orchestrated)
                                                                 :dispatch-sessions (:dispatch-sessions orchestrated)))
                (p/then (fn [_]
                          (http/json-response :planning.sessions/create
                                              {:planning-session-id planning-session-id
                                               :status (:status orchestrated)
                                               :plan (assoc (:plan orchestrated)
                                                            :tasks (:reconciled-tasks orchestrated))
                                               :scheduled-actions (:scheduled-actions orchestrated)
                                               :dispatch-sessions (:dispatch-sessions orchestrated)
                                               :approval-status (:approval-status session)
                                               :require-approval (true? (:require-approval session))
                                               :auto-dispatch (true? (:auto-dispatch session))
                                               :auto-replan (true? (:auto-replan session))
                                               :replan-delay-sec (:replan-delay-sec session)
                                               :chat-path (str "/planning/chat/" planning-session-id)})))
                (p/catch (fn [error]
                           (log/error :agent/planning-session-create-failed error)
                           (http/error-response "failed to create planning session" 500))))))))))

(defn- planning-workflow-binding [^js env]
  (aget env "PLANNING_WORKFLOW"))

(defn- planning-agent-binding [^js env]
  (aget env "PLANNING_AGENT"))

(defn- planning-agent-stub
  [^js env planning-session-id]
  (when-let [^js namespace (planning-agent-binding env)]
    (let [do-id (.idFromName namespace planning-session-id)]
      (.get namespace do-id))))

(def ^:private planning-agent-namespace "planning-agent")

(defn- planning-agent-request
  [request planning-session-id]
  (let [headers (js/Headers. (.-headers request))]
    (.set headers "x-partykit-room" planning-session-id)
    (.set headers "x-partykit-namespace" planning-agent-namespace)
    (js/Request. (.-url request)
                 #js {:method (.-method request)
                      :headers headers
                      :body (when-not (= "GET" (.-method request))
                              (.-body request))
                      :duplex "half"})))

(defn- handle-planning-workflow-create [{:keys [env request claims]}]
  (cond
    (not (planning-workflow-binding env))
    (http/error-response "planning workflow unavailable" 503)

    (not (planning-store/available? env))
    (http/error-response "planning state unavailable" 503)

    :else
    (p/let [result (common/read-json request)]
      (if (nil? result)
        (http/bad-request "missing body")
        (p/let [user-id (claims-user-id claims)
                body' (js->clj result :keywordize-keys true)
                params (agent-request/normalize-planning-workflow-create body')
                planning-session-id (or (:planning-session-id params)
                                        (str (random-uuid)))
                params (cond-> params
                         (string? planning-session-id) (assoc :planning-session-id planning-session-id)
                         (string? user-id) (assoc :user-id user-id))
                params (when (map? params)
                         (planning-workflow/enrich-params-with-model-plan env params))
                workflow-id (or (:workflow-id params)
                                (str planning-session-id "-workflow"))
                workflow-binding (planning-workflow-binding env)]
          (if-not (and (map? params)
                       (string? user-id)
                       (string? planning-session-id))
            (http/bad-request "invalid body")
            (-> (.create workflow-binding
                         (clj->js {:id workflow-id
                                   :params (dissoc params :workflow-id)}))
                (p/then (fn [instance]
                          (let [workflow-id (or (some-> instance .-id)
                                                workflow-id)]
                            (-> (planning-store/<upsert-planning-session! env
                                                                          {:planning-session-id planning-session-id
                                                                           :user-id user-id
                                                                           :workflow-id workflow-id
                                                                           :status (if (true? (:require-approval params))
                                                                                     "waiting-approval"
                                                                                     "queued")
                                                                           :goal (:goal params)
                                                                           :project (:project params)
                                                                           :agent (:agent params)
                                                                           :plan (assoc (:plan params)
                                                                                        :tasks (:tasks params))
                                                                           :approval-status (if (true? (:require-approval params))
                                                                                              "pending"
                                                                                              "approved")
                                                                           :require-approval (true? (:require-approval params))
                                                                           :auto-dispatch (if (boolean? (:auto-dispatch params))
                                                                                            (:auto-dispatch params)
                                                                                            true)
                                                                           :auto-replan (true? (:auto-replan params))
                                                                           :replan-delay-sec (:replan-delay-sec params)})
                                (p/then (fn [_]
                                          (http/json-response :planning.workflows/create
                                                              {:planning-session-id planning-session-id
                                                               :workflow-id workflow-id
                                                               :status "queued"})))))))
                (p/catch (fn [error]
                           (log/error :agent/planning-workflow-create-failed error)
                           (http/error-response "failed to create planning workflow" 500))))))))))

(defn- handle-planning-workflow-get [{:keys [env route]}]
  (let [workflow-id (get-in route [:path-params :workflow-id])
        workflow-binding (planning-workflow-binding env)]
    (cond
      (not workflow-binding)
      (http/error-response "planning workflow unavailable" 503)

      (not (string? workflow-id))
      (http/bad-request "invalid workflow id")

      :else
      (-> (.get workflow-binding workflow-id)
          (p/then (fn [instance]
                    (if-not instance
                      (http/not-found)
                      (-> (.status instance)
                          (p/then (fn [status]
                                    (http/json-response :planning.workflows/get
                                                        {:workflow-id workflow-id
                                                         :status status})))))))
          (p/catch (fn [error]
                     (log/error :agent/planning-workflow-get-failed error)
                     (http/error-response "failed to fetch planning workflow" 500)))))))

(defn- <get-owned-planning-session!
  [^js env user-id planning-session-id]
  (if (and (planning-store/available? env)
           (string? user-id)
           (string? planning-session-id))
    (planning-store/<get-planning-session! env user-id planning-session-id)
    (p/resolved nil)))

(defn- <get-planning-agent-state!
  [^js env planning-session-id]
  (if-let [^js stub (planning-agent-stub env planning-session-id)]
    (let [request (platform/request "https://planning.internal/__planning__/state"
                                    #js {:method "GET"})]
      (-> (.fetch stub (planning-agent-request request planning-session-id))
          (p/then (fn [response]
                    (if-not (.-ok response)
                      nil
                      (-> (.json response)
                          (p/then (fn [payload]
                                    (let [state (js->clj payload :keywordize-keys true)]
                                      (when (map? state)
                                        state))))))))
          (p/catch (fn [_]
                     nil))))
    (p/resolved nil)))

(defn- workflow-event-payload
  [event-type approval-status]
  (let [approved? (= "approved" approval-status)]
    {:type event-type
     :payload {:approved approved?
               :decision approval-status}}))

(defn- <send-workflow-event!
  [workflow-binding workflow-id event]
  (if-not (string? workflow-id)
    (p/rejected (ex-info "invalid workflow id" {:workflow-id workflow-id}))
    (-> (.get workflow-binding workflow-id)
        (p/then (fn [instance]
                  (if-not instance
                    (p/rejected (ex-info "workflow not found" {:workflow-id workflow-id}))
                    (let [send-event (aget instance "sendEvent")]
                      (if (fn? send-event)
                        (.call send-event instance (clj->js event))
                        (p/rejected (ex-info "workflow event transport unavailable"
                                             {:workflow-id workflow-id}))))))))))

(defn- planning-session-status-for-approval
  [approval-status]
  (case approval-status
    "approved" "queued"
    "rejected" "rejected"
    "pending" "waiting-approval"
    "waiting-approval"))

(defn- normalize-task-binding
  [binding]
  (when (map? binding)
    (let [task-uuid (some-> (:task-uuid binding) str string/trim not-empty)
          block-uuid (some-> (:block-uuid binding) str string/trim not-empty)
          session-id (some-> (:session-id binding) str string/trim not-empty)]
      (when (and task-uuid block-uuid)
        (cond-> {:task-uuid task-uuid
                 :block-uuid block-uuid}
          (string? session-id) (assoc :session-id session-id))))))

(defn- merge-task-bindings
  [tasks bindings]
  (let [binding-by-task-uuid (->> bindings
                                  (keep normalize-task-binding)
                                  (reduce (fn [acc binding]
                                            (assoc acc (:task-uuid binding) binding))
                                          {}))]
    (mapv (fn [task]
            (if-let [binding (get binding-by-task-uuid
                                  (some-> (:task-uuid task) str string/trim not-empty))]
              (cond-> (assoc task :block-uuid (:block-uuid binding))
                (string? (:session-id binding)) (assoc :session-id (:session-id binding)
                                                       :status (or (:status task) "Doing")))
              task))
          (or tasks []))))

(defn- handle-planning-session-get [{:keys [env claims route]}]
  (let [user-id (claims-user-id claims)
        planning-session-id (planning-session-id-from-route route)]
    (cond
      (not (planning-store/available? env))
      (http/error-response "planning state unavailable" 503)

      (not (string? user-id))
      (http/unauthorized)

      (not (string? planning-session-id))
      (http/bad-request "invalid planning session id")

      :else
      (p/let [planning-session (<get-owned-planning-session! env
                                                             user-id
                                                             planning-session-id)]
        (if-not (map? planning-session)
          (http/not-found)
          (http/json-response :planning.sessions/get
                              planning-session))))))

(defn- approval-decision
  [body]
  (or (some-> (get-in body [:approval :decision]) str string/trim string/lower-case not-empty)
      (some-> (:decision body) str string/trim string/lower-case not-empty)))

(defn- handle-planning-session-approval [{:keys [env request claims route]}]
  (let [user-id (claims-user-id claims)
        planning-session-id (planning-session-id-from-route route)
        workflow-binding (planning-workflow-binding env)]
    (cond
      (not (planning-store/available? env))
      (http/error-response "planning state unavailable" 503)

      (not (string? user-id))
      (http/unauthorized)

      (not (string? planning-session-id))
      (http/bad-request "invalid planning session id")

      :else
      (p/let [result (common/read-json request)
              body (if (nil? result) {} (js->clj result :keywordize-keys true))
              planning-state (<get-planning-agent-state! env planning-session-id)
              approval-status (approval-decision body)
              approval-status (if (contains? #{"pending" "approved" "rejected"} approval-status)
                                approval-status
                                "pending")
              existing (<get-owned-planning-session! env user-id planning-session-id)]
        (if-not (map? existing)
          (http/not-found)
          (let [workflow-id (some-> (:workflow-id existing) str string/trim not-empty)]
            (cond
              (and workflow-binding (string? workflow-id))
              (-> (<send-workflow-event! workflow-binding
                                         workflow-id
                                         (workflow-event-payload "approval" approval-status))
                  (p/then (fn [_]
                            (planning-store/<update-planning-session! env
                                                                      user-id
                                                                      planning-session-id
                                                                      {:approval-status approval-status
                                                                       :status (planning-session-status-for-approval approval-status)})))
                  (p/then (fn [updated]
                            (if-not (map? updated)
                              (http/not-found)
                              (http/json-response :planning.sessions/get updated))))
                  (p/catch (fn [error]
                             (log/error :agent/planning-session-approval-event-failed error)
                             (http/error-response "failed to apply planning approval" 500))))

              (and (= "approved" approval-status)
                   workflow-binding)
              (p/let [params (planning-workflow/enrich-params-with-model-plan
                              env
                              {:planning-session-id planning-session-id
                               :user-id user-id
                               :goal (:goal existing)
                               :project (:project existing)
                               :agent (:agent existing)
                               :tasks (get-in existing [:plan :tasks])
                               :planning-messages (:messages planning-state)
                               :require-approval (true? (:require-approval existing))
                               :approval {:decision "approved"
                                          :comment (some-> (get-in body [:approval :comment])
                                                           str
                                                           string/trim
                                                           not-empty)}
                               :auto-dispatch (if (boolean? (:auto-dispatch existing))
                                                (:auto-dispatch existing)
                                                true)
                               :auto-replan (true? (:auto-replan existing))
                               :replan-delay-sec (:replan-delay-sec existing)})
                      workflow-id (or workflow-id
                                      (str planning-session-id "-workflow"))]
                (-> (.create workflow-binding
                             (clj->js {:id workflow-id
                                       :params params}))
                    (p/then (fn [instance]
                              (let [workflow-id (or (some-> instance .-id)
                                                    workflow-id)]
                                (planning-store/<update-planning-session! env
                                                                          user-id
                                                                          planning-session-id
                                                                          {:approval-status "approved"
                                                                           :workflow-id workflow-id
                                                                           :status "queued"}))))
                    (p/then (fn [updated]
                              (if-not (map? updated)
                                (http/not-found)
                                (http/json-response :planning.sessions/get updated))))
                    (p/catch (fn [error]
                               (log/error :agent/planning-session-approval-failed error)
                               (http/error-response "failed to queue approved planning workflow" 500)))))

              :else
              (p/let [updated (planning-store/<update-planning-session! env
                                                                        user-id
                                                                        planning-session-id
                                                                        {:approval-status approval-status
                                                                         :status (planning-session-status-for-approval approval-status)})]
                (if-not (map? updated)
                  (http/not-found)
                  (http/json-response :planning.sessions/get updated))))))))))

(defn- handle-planning-session-task-sync [{:keys [env request claims route]}]
  (let [user-id (claims-user-id claims)
        planning-session-id (planning-session-id-from-route route)]
    (cond
      (not (planning-store/available? env))
      (http/error-response "planning state unavailable" 503)

      (not (string? user-id))
      (http/unauthorized)

      (not (string? planning-session-id))
      (http/bad-request "invalid planning session id")

      :else
      (p/let [existing (<get-owned-planning-session! env user-id planning-session-id)
              result (common/read-json request)]
        (if-not (map? existing)
          (http/not-found)
          (let [body (if (nil? result) {} (js->clj result :keywordize-keys true))
                bindings (if (sequential? (:tasks body))
                           (vec (:tasks body))
                           [])
                merged-tasks (merge-task-bindings (get-in existing [:plan :tasks]) bindings)
                updated-session (assoc existing :plan (assoc (:plan existing) :tasks merged-tasks))]
            (p/let [updated (planning-store/<upsert-planning-session! env updated-session)]
              (http/json-response :planning.sessions/get
                                  (or updated
                                      updated-session)))))))))

(defn- handle-planning-session-replan [{:keys [env request claims route]}]
  (let [workflow-binding (planning-workflow-binding env)
        user-id (claims-user-id claims)
        planning-session-id (planning-session-id-from-route route)]
    (cond
      (not workflow-binding)
      (http/error-response "planning workflow unavailable" 503)

      (not (planning-store/available? env))
      (http/error-response "planning state unavailable" 503)

      (not (string? user-id))
      (http/unauthorized)

      (not (string? planning-session-id))
      (http/bad-request "invalid planning session id")

      :else
      (p/let [existing (<get-owned-planning-session! env user-id planning-session-id)
              result (common/read-json request)
              planning-state (<get-planning-agent-state! env planning-session-id)]
        (if-not (map? existing)
          (http/not-found)
          (let [body (if (nil? result)
                       {}
                       (js->clj result :keywordize-keys true))
                params (agent-request/normalize-planning-workflow-create
                        (merge {:planning-session-id planning-session-id
                                :user-id user-id
                                :goal (:goal existing)
                                :project (:project existing)
                                :agent (:agent existing)
                                :planning-messages (:messages planning-state)
                                :require-approval (:require-approval existing)
                                :auto-dispatch (:auto-dispatch existing)
                                :auto-replan (:auto-replan existing)
                                :replan-delay-sec (:replan-delay-sec existing)}
                               body))
                params (when (map? params)
                         (planning-workflow/enrich-params-with-model-plan env params))
                existing-workflow-id (some-> (:workflow-id existing) str string/trim not-empty)
                workflow-id (or (:workflow-id params)
                                existing-workflow-id
                                (str planning-session-id "-replan-" (random-uuid)))
                plan-tasks (or (:tasks params)
                               (get-in existing [:plan :tasks]))
                update-data {:workflow-id workflow-id
                             :status (if (true? (:require-approval params))
                                       "waiting-approval"
                                       "queued")
                             :plan {:tasks plan-tasks}
                             :approval-status (if (true? (:require-approval params))
                                                "pending"
                                                "approved")
                             :require-approval (true? (:require-approval params))
                             :auto-dispatch (if (boolean? (:auto-dispatch params))
                                              (:auto-dispatch params)
                                              true)
                             :auto-replan (true? (:auto-replan params))
                             :replan-delay-sec (:replan-delay-sec params)}]
            (if (string? existing-workflow-id)
              (-> (<send-workflow-event! workflow-binding
                                         existing-workflow-id
                                         {:type "replan"
                                          :payload {:params (assoc (dissoc params :workflow-id)
                                                                   :workflow-id existing-workflow-id)}})
                  (p/then (fn [_]
                            (planning-store/<update-planning-session! env
                                                                      user-id
                                                                      planning-session-id
                                                                      (assoc update-data :workflow-id existing-workflow-id))))
                  (p/then (fn [updated]
                            (http/json-response :planning.sessions/get
                                                (or updated
                                                    existing))))
                  (p/catch (fn [error]
                             (log/error :agent/planning-session-replan-event-failed error)
                             (http/error-response "failed to queue replanning workflow" 500))))
              (-> (.create workflow-binding
                           (clj->js {:id workflow-id
                                     :params (assoc (dissoc params :workflow-id)
                                                    :workflow-id workflow-id)}))
                  (p/then (fn [instance]
                            (let [workflow-id (or (some-> instance .-id)
                                                  workflow-id)]
                              (planning-store/<update-planning-session! env
                                                                        user-id
                                                                        planning-session-id
                                                                        (assoc update-data :workflow-id workflow-id)))))
                  (p/then (fn [updated]
                            (http/json-response :planning.sessions/get
                                                (or updated
                                                    existing))))
                  (p/catch (fn [error]
                             (log/error :agent/planning-session-replan-failed error)
                             (http/error-response "failed to queue replanning workflow" 500)))))))))))

(defn- handle-planning-chat-transport [{:keys [env request claims route]}]
  (let [planning-agent (planning-agent-binding env)
        planning-session-id (planning-session-id-from-route route)
        user-id (claims-user-id claims)]
    (cond
      (not planning-agent)
      (http/error-response "planning chat transport unavailable" 503)

      (not (planning-store/available? env))
      (http/error-response "planning state unavailable" 503)

      (not (string? user-id))
      (http/unauthorized)

      (not (string? planning-session-id))
      (http/bad-request "invalid planning session id")

      :else
      (p/let [owned-session (<get-owned-planning-session! env
                                                          user-id
                                                          planning-session-id)]
        (if-not (map? owned-session)
          (http/not-found)
          (if-let [^js stub (planning-agent-stub env planning-session-id)]
            (-> (.fetch stub (planning-agent-request request planning-session-id))
                (p/catch (fn [error]
                           (log/error :agent/planning-chat-forward-failed error)
                           (http/error-response "planning chat transport failed" 500))))
            (http/error-response "planning chat transport unavailable" 503)))))))

(defn- handle-auth-status [{:keys [env claims]}]
  (let [user-id (claims-user-id claims)]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [managed-auth (managed-auth/<get-active-managed-auth-for-user! env user-id)]
        (http/json-response :auth.chatgpt/status
                            {:managed-auth (some-> managed-auth
                                                   (dissoc :runtime-auth-payload))})))))

(defn- handle-auth-import [{:keys [env request claims]}]
  (let [user-id (claims-user-id claims)]
    (if-not (string? user-id)
      (http/unauthorized)
      (.then (common/read-json request)
             (fn [result]
               (if (nil? result)
                 (http/bad-request "missing body")
                 (let [body (js->clj result :keywordize-keys true)
                       body (http/coerce-http-request :auth.chatgpt/import body)]
                   (if (nil? body)
                     (http/bad-request "invalid body")
                     (-> (managed-auth/<import-credentials! env user-id body)
                         (.then (fn [managed-auth]
                                  (http/json-response :auth.chatgpt/import
                                                      {:managed-auth (some-> managed-auth
                                                                             (dissoc :runtime-auth-payload))})))
                         (.catch (fn [error]
                                   (log/error :agent/managed-auth-import-failed
                                              {:error (str error)
                                               :data (ex-data error)})
                                   (http/error-response "failed to import chatgpt credentials" 400))))))))))))

(defn- handle-get [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/status")]
          (forward-request stub do-url "GET" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-messages [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (.then (common/read-json request)
             (fn [result]
               (if (nil? result)
                 (http/bad-request "missing body")
                 (let [body (js->clj result :keywordize-keys true)
                       body (http/coerce-http-request :sessions/message body)]
                   (cond
                     (nil? body)
                     (http/bad-request "invalid body")

                     :else
                     (if-let [^js stub (session-stub env session-id)]
                       (let [headers (base-headers request claims)
                             body-json (js/JSON.stringify (clj->js body))
                             do-url (str (.-origin url) "/__session__/messages")]
                         (forward-request stub do-url "POST" headers body-json))
                       (http/error-response "server error" 500))))))))))

(defn- handle-cancel [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/cancel")]
          (forward-request stub do-url "POST" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-control [{:keys [env request url claims route]} control-path]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) control-path)]
          (forward-request stub do-url "POST" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-stream [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/stream")]
          (forward-request stub do-url "GET" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-terminal [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [do-url (str (.-origin url) "/__session__/terminal" (.-search url))]
          (forward-websocket-request stub request do-url claims))
        (http/error-response "server error" 500)))))

(defn- handle-events [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/events" (.-search url))]
          (forward-request stub do-url "GET" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-branches [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/branches" (.-search url))]
          (forward-request stub do-url "GET" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-pr [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (.then (common/read-json request)
             (fn [result]
               (let [raw-body (if (nil? result)
                                {}
                                (js->clj result :keywordize-keys true))
                     body (http/coerce-http-request :sessions/pr raw-body)]
                 (if (nil? body)
                   (http/bad-request "invalid body")
                   (if-let [^js stub (session-stub env session-id)]
                     (let [headers (base-headers request claims)
                           body-json (js/JSON.stringify (clj->js body))
                           do-url (str (.-origin url) "/__session__/pr")]
                       (forward-request stub do-url "POST" headers body-json))
                     (http/error-response "server error" 500)))))))))

(defn- handle-snapshot [{:keys [env request url claims route]}]
  (let [session-id (get-in route [:path-params :session-id])]
    (if-not (string? session-id)
      (http/bad-request "invalid session id")
      (if-let [^js stub (session-stub env session-id)]
        (let [headers (base-headers request claims)
              do-url (str (.-origin url) "/__session__/snapshot")]
          (forward-request stub do-url "POST" headers nil))
        (http/error-response "server error" 500)))))

(defn- handle-runners-register [{:keys [env request claims]}]
  (.then (common/read-json request)
         (fn [result]
           (if (nil? result)
             (http/bad-request "missing body")
             (let [body (js->clj result :keywordize-keys true)
                   body (http/coerce-http-request :runners/register body)
                   user-id (claims-user-id claims)
                   runner (agent-request/normalize-runner-register body user-id)]
               (cond
                 (not (string? user-id))
                 (http/unauthorized)

                 (nil? body)
                 (http/bad-request "invalid body")

                 (not (map? runner))
                 (http/bad-request "invalid body")

                 :else
                 (p/let [saved (runner-store/<register-runner! env runner)]
                   (if-not (map? saved)
                     (http/error-response "failed to register runner" 500)
                     (http/json-response :runners/register
                                         {:runner (runner-response saved)})))))))))

(defn- handle-runners-list [{:keys [env claims]}]
  (let [user-id (claims-user-id claims)]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [runners (runner-store/<list-runners-for-user! env user-id)]
        (http/json-response :runners/list
                            {:runners (mapv runner-response runners)})))))

(defn- handle-runners-get [{:keys [env claims route]}]
  (let [user-id (claims-user-id claims)
        runner-id (get-in route [:path-params :runner-id])]
    (cond
      (not (string? user-id))
      (http/unauthorized)

      (not (string? runner-id))
      (http/bad-request "invalid runner id")

      :else
      (p/let [runner (runner-store/<get-runner-for-user! env user-id runner-id)]
        (if-not (map? runner)
          (http/not-found)
          (http/json-response :runners/get
                              {:runner (runner-response runner)}))))))

(defn- handle-runners-heartbeat [{:keys [env request claims route]}]
  (let [user-id (claims-user-id claims)
        runner-id (get-in route [:path-params :runner-id])]
    (cond
      (not (string? user-id))
      (http/unauthorized)

      (not (string? runner-id))
      (http/bad-request "invalid runner id")

      :else
      (.then (common/read-json request)
             (fn [result]
               (let [raw-body (if (nil? result) {} (js->clj result :keywordize-keys true))
                     body (http/coerce-http-request :runners/heartbeat raw-body)
                     heartbeat (agent-request/normalize-runner-heartbeat body)]
                 (if (nil? body)
                   (http/bad-request "invalid body")
                   (p/let [runner (runner-store/<heartbeat-runner! env user-id runner-id heartbeat)]
                     (if-not (map? runner)
                       (http/not-found)
                       (http/json-response :runners/heartbeat
                                           {:runner (runner-response runner)}))))))))))

(defn handle [{:keys [route] :as ctx}]
  (case (:handler route)
    :auth.chatgpt/import (handle-auth-import ctx)
    :auth.chatgpt/status (handle-auth-status ctx)
    :planning.sessions/create (handle-planning-create ctx)
    :planning.sessions/get (handle-planning-session-get ctx)
    :planning.sessions/approval (handle-planning-session-approval ctx)
    :planning.sessions/tasks.sync (handle-planning-session-task-sync ctx)
    :planning.sessions/replan (handle-planning-session-replan ctx)
    :planning.chat/transport (handle-planning-chat-transport ctx)
    :planning.workflows/create (handle-planning-workflow-create ctx)
    :planning.workflows/get (handle-planning-workflow-get ctx)
    :sessions/create (handle-create ctx)
    :sessions/get (handle-get ctx)
    :sessions/messages (handle-messages ctx)
    :sessions/pause (handle-control ctx "/__session__/pause")
    :sessions/resume (handle-control ctx "/__session__/resume")
    :sessions/interrupt (handle-control ctx "/__session__/interrupt")
    :sessions/cancel (handle-cancel ctx)
    :sessions/pr (handle-pr ctx)
    :sessions/snapshot (handle-snapshot ctx)
    :sessions/terminal (handle-terminal ctx)
    :sessions/events (handle-events ctx)
    :sessions/branches (handle-branches ctx)
    :sessions/stream (handle-stream ctx)
    :runners/register (handle-runners-register ctx)
    :runners/list (handle-runners-list ctx)
    :runners/get (handle-runners-get ctx)
    :runners/heartbeat (handle-runners-heartbeat ctx)
    (http/not-found)))

(defn handle-fetch [^js self request]
  (let [env (.-env self)
        url (js/URL. (.-url request))
        path (.-pathname url)
        method (.-method request)]
    (.catch
     (js/Promise.resolve
      (try
        (cond
          (contains? #{"OPTIONS" "HEAD"} method)
          (common/options-response)

          :else
          (p/let [route (routes/match-route method path)
                  claims (auth/auth-claims request env)
                  response (cond
                             (nil? claims)
                             (http/unauthorized)

                             route
                             (handle {:env env
                                      :request request
                                      :url url
                                      :claims claims
                                      :route route})

                             :else
                             (http/not-found))]
            response))
        (catch :default error
          (log/error :agent/session-handler-error error)
          (http/error-response "server error" 500))))
     (fn [error]
       (log/error :agent/session-handler-error error)
       (http/error-response "server error" 500)))))
