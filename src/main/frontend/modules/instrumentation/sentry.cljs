(ns frontend.modules.instrumentation.sentry
  (:require [frontend.version :refer [version]]
            [frontend.util :as util]
            [frontend.config :as cfg]
            ["@sentry/react" :as Sentry]
            ["@sentry/tracing" :refer [BrowserTracing]]
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
   :initialScope {:tags
                  {:platform (cond
                               (util/electron?) "electron"
                               (mobile-util/is-native-platform?) "mobile"
                               :else "web")
                   :publishing cfg/publishing?}}
   :integrations [(new posthog/SentryIntegration posthog "logseq" 5311485)
                  (new BrowserTracing)]
   :debug cfg/dev?
   :tracesSampleRate 1.0})

(defn init []
  (let [config (clj->js config)]
    (Sentry/init config)))
