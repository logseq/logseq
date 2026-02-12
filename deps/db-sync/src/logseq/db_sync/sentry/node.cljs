(ns logseq.db-sync.sentry.node
  (:require ["@sentry/node" :as sentry]
            [logseq.db-sync.sentry :as sentry-config]))

(defn init! []
  (when-let [opts (sentry-config/options-from-env (.-env js/process))]
    (sentry/init (clj->js opts))))

(defn capture-exception! [error]
  (sentry/captureException error))
