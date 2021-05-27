(ns frontend.modules.instrumentation.core
  (:require [frontend.modules.instrumentation.posthog :as posthog]
            [frontend.modules.instrumentation.sentry :as sentry]
            [frontend.state :as state]
            [frontend.storage :as storage]))

(defn init
  []
  (when-not (:instrument/disabled? @state/state)
    (posthog/init)
    (sentry/init)))

(defn disable-instrument [disable?]
  (state/set-state! :instrument/disabled? disable?)
  (storage/set "instrument-disabled" disable?)
  (posthog/opt-out disable?)
  (when-not disable?
    (sentry/init)))
