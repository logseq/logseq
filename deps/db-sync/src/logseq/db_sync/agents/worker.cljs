(ns logseq.db-sync.agents.worker
  ;; Turn off false defclass errors
  {:clj-kondo/config {:linters {:unresolved-symbol {:level :off}}}}
  (:require ["@cloudflare/sandbox" :as cf-sandbox]
            ["cloudflare:workers" :refer [DurableObject]]
            [logseq.db-sync.logging :as logging]
            [logseq.db-sync.sentry.worker :as sentry]
            [logseq.db-sync.worker.agent.do :as agent-do]
            [logseq.db-sync.worker.agents-dispatch :as dispatch]
            [shadow.cljs.modern :refer (defclass)]))

(logging/install!)

(def Sandbox (.-Sandbox cf-sandbox))

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
