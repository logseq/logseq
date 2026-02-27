(ns logseq.sync.sentry.worker
  (:require ["@sentry/cloudflare" :as sentry]
            [logseq.sync.sentry :as sentry-config]))

(defn wrap-handler [handler]
  (sentry/withSentry (fn [^js env]
                       (clj->js (or (sentry-config/options-from-env env) {})))
                     handler))

(defn capture-exception! [error]
  (sentry/captureException error))
