(ns frontend.modules.instrumentation.core
  (:require [frontend.modules.instrumentation.posthog :as posthog]
            [frontend.modules.instrumentation.sentry :as sentry]
            [frontend.state :as state]
            [frontend.storage :as storage]))

(defn init
  []
  ;; Analytics disabled - instrumentation initialization is a no-op
  nil)

(defn disable-instrument [disable?]
  ;; Analytics disabled - instrumentation disable is a no-op
  nil)
