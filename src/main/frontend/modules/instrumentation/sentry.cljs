(ns frontend.modules.instrumentation.sentry
  (:require [frontend.version :refer [version]]
            [frontend.util :as util]
            [frontend.config :as cfg]
            ["@sentry/browser" :as Sentry]
            ["posthog-js" :as posthog]))

(def config
  {:dsn "https://636e9174ffa148c98d2b9d3369661683@o416451.ingest.sentry.io/5311485"
   :release (util/format "logseq@%s" version)
   :environment (if cfg/dev? "development" "production")
   :integrations [(new posthog/SentryIntegration posthog "logseq" 5311485)]
   :debug cfg/dev?
   :tracesSampleRate 1.0})

(defn init []
  (Sentry/init (clj->js config)))
