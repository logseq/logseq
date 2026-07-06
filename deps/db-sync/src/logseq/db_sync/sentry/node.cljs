(ns logseq.db-sync.sentry.node
  (:require [logseq.db-sync.sentry :as sentry-config]))

(defonce ^:private *sentry (atom nil))

(defn- sentry! []
  (or @*sentry
      (reset! *sentry (js/require "@sentry/node"))))

(defn init! []
  (when-let [opts (sentry-config/options-from-env (.-env js/process))]
    (.init (sentry!) (clj->js opts))))

(defn capture-exception! [error]
  (when-let [^js sentry @*sentry]
    (.captureException sentry error)))
