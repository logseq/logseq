(ns frontend.mobile.flows
  "common flows for mobile"
  (:require [missionary.core :as m]))

(def *mobile-network-status (atom nil))
(def *mobile-app-state (atom nil))

(def mobile-network-status-flow
  (->> (m/watch *mobile-network-status)
       (m/eduction (map #(js->clj % :keywordize-keys true)))))

(def mobile-app-state
  (m/watch *mobile-app-state))

(comment
  (c.m/run-background-task
   ::test
   (m/reduce (fn [_ x]
               (prn ::xxx x))
             (m/latest vector mobile-network-status-flow mobile-app-state))))
