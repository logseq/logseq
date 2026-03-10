(ns logseq.agents.worker
  ;; Turn off false defclass errors
  {:clj-kondo/config {:linters {:unresolved-symbol {:level :off}}}}
  (:require ["cloudflare:workers" :refer [DurableObject]]
            [logseq.agents.dispatch :as dispatch]
            [logseq.agents.do :as agent-do]
            [logseq.sync.logging :as logging]
            [logseq.sync.sentry.worker :as sentry]
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
