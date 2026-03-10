(ns logseq.agents.worker
  ;; Turn off false defclass errors
  {:clj-kondo/config {:linters {:unresolved-symbol {:level :off}}}}
  (:require ["agents" :refer [Agent]]
            ["cloudflare:workers" :refer [DurableObject WorkflowEntrypoint]]
            [logseq.agents.dispatch :as dispatch]
            [logseq.agents.do :as agent-do]
            [logseq.agents.planning-agent :as planning-agent]
            [logseq.agents.planning-workflow :as planning-workflow]
            [logseq.sync.logging :as logging]
            [logseq.sync.sentry.worker :as sentry]
            [promesa.core :as p]
            [shadow.cljs.modern :refer (defclass)]))

(logging/install!)

(def worker
  (sentry/wrap-handler
   #js {:fetch (fn [request env _ctx]
                 (dispatch/handle-worker-fetch request env))}))

(defclass AgentSessionDO
  (extends DurableObject)

  (constructor [this ^js state env]
               (super state env)
               (set! (.-state this) state)
               (set! (.-env this) env)
               (set! (.-storage this) (.-storage state))
               (set! (.-streams this) (js/Map.)))

  Object
  (fetch [this request]
         (agent-do/handle-fetch this request)))

(defclass PlanningWorkflow
  (extends WorkflowEntrypoint)

  (constructor [this ctx env]
               (super ctx env)
               (set! (.-ctx this) ctx)
               (set! (.-env this) env))

  Object
  (run [this event step]
       (planning-workflow/run this event step)))

(defn- planning-session-id
  [this props]
  (or (some-> props :planning-session-id str)
      (some-> this .-name str)
      "default"))

(defn- get-planning-state
  [this props]
  (let [planning-session-id (planning-session-id this props)
        current-state (some-> this .-state (js->clj :keywordize-keys true))]
    (planning-agent/normalize-state planning-session-id current-state)))

(defn- set-planning-state!
  [^js this state]
  (let [state' (clj->js state)
        set-state (aget this "setState")
        set-state-internal (aget this "_setStateInternal")]
    (cond
      (fn? set-state)
      (.call set-state this state')

      (fn? set-state-internal)
      (.call set-state-internal this state' "server")

      :else
      (set! (.-_state this) state')))
  state)

(defclass PlanningSessionAgent
  (extends Agent)

  (constructor [this ctx env]
               (super ctx env)
               (set! (.-ctx this) ctx)
               (set! (.-env this) env))

  Object
  (onStart [this props]
           (let [props (when (some? props)
                         (js->clj props :keywordize-keys true))]
             (set-planning-state! this (get-planning-state this props))))

  (onRequest [this request]
             (let [method (.-method request)]
               (cond
                 (= method "GET")
                 (planning-agent/json-response (get-planning-state this nil) 200)

                 (= method "POST")
                 (-> (.text request)
                     (p/then (fn [raw]
                               (if-let [content (planning-agent/parse-message-content raw)]
                                 (let [session-id (planning-session-id this nil)
                                       next-state (-> (get-planning-state this nil)
                                                      (planning-agent/append-message session-id "user" content)
                                                      (set-planning-state! this))]
                                   (planning-agent/json-response {:ok true
                                                                  :state next-state}
                                                                 200))
                                 (planning-agent/json-response {:error "invalid message"} 400))))
                     (p/catch (fn [_error]
                                (planning-agent/json-response {:error "invalid message"} 400))))

                 :else
                 (planning-agent/json-response {:error "method not allowed"} 405))))

  (onConnect [this connection _ctx]
             (let [state (get-planning-state this nil)]
               (.send connection
                      (js/JSON.stringify
                       (clj->js {:type "planning.state"
                                 :state state})))))

  (onMessage [this connection message]
             (let [content (planning-agent/parse-message-content message)]
               (if-not (string? content)
                 (.send connection
                        (js/JSON.stringify
                         #js {:type "planning.error"
                              :message "invalid message"}))
                 (let [session-id (planning-session-id this nil)
                       next-state (-> (get-planning-state this nil)
                                      (planning-agent/append-message session-id "user" content)
                                      (set-planning-state! this))
                       latest-message (last (:messages next-state))]
                   (.broadcast this
                               (js/JSON.stringify
                                (clj->js {:type "planning.message"
                                          :message latest-message
                                          :state next-state}))))))))
