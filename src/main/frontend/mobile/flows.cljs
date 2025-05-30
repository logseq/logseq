(ns frontend.mobile.flows
  "common flows for mobile"
  (:require [missionary.core :as m]))

(def *mobile-network-status (atom nil))
(def *mobile-app-state (atom nil))

(def mobile-network-status-flow
  (m/watch *mobile-network-status))

(def mobile-app-state
  (m/watch *mobile-app-state))
