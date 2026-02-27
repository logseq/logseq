(ns logseq.sync.sentry.node
  (:require ["@sentry/node" :as sentry]
            [logseq.sync.sentry :as sentry-config]))

(defn init! []
  (when-let [opts (sentry-config/options-from-env (.-env js/process))]
    (sentry/init (clj->js opts))))

(defn capture-exception! [error]
  (sentry/captureException error))
