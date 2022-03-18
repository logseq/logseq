(ns frontend.modules.instrumentation.sentry
  (:require [frontend.version :refer [version]]
            [frontend.util :as util]
            [frontend.config :as cfg]
            ["@sentry/browser" :as Sentry]
            ["@sentry/electron" :as Sentry-electron]
            ["posthog-js" :as posthog]
            [frontend.mobile.util :as mobile-util]))

(def config
  {:dsn "https://636e9174ffa148c98d2b9d3369661683@o416451.ingest.sentry.io/5311485"
   :release (util/format "logseq%s@%s" (cond
                                         (mobile-util/native-android?) "-android"
                                         (mobile-util/native-ios?) "-ios"
                                         :else "")
                         version)
   :environment (if cfg/dev? "development" "production")
   :integrations [(new posthog/SentryIntegration posthog "logseq" 5311485)]
   :debug cfg/dev?
   :tracesSampleRate 1.0})

(defn init []
  (let [config (clj->js config)
        init-fn (if (util/electron?) Sentry-electron/init Sentry/init)]
    (init-fn config)))
