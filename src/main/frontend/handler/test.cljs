(ns frontend.handler.test
  "Prepare for running e2e tests"
  (:require [frontend.storage :as storage]
            [frontend.state :as state]))

(defn clear-whiteboard-storage-for-e2e-tests
  []
  (storage/set :whiteboard/onboarding-whiteboard? false)
  (storage/set :whiteboard/onboarding-tour? false)
  (state/set-state! :whiteboard/onboarding-whiteboard? false)
  (state/set-state! :whiteboard/onboarding-tour? false)
  (prn :debug :whiteboard/onboarding-whiteboard? (:whiteboard/onboarding-whiteboard? @state/state)))

(defn setup-test!
  []
  (set! (.-clearWhiteboardStorage js/window) clear-whiteboard-storage-for-e2e-tests))
