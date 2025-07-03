(ns frontend.mobile.flows
  "common flows for mobile"
  (:require [frontend.common.missionary :as c.m]
            [missionary.core :as m]
            [promesa.core :as p]))

;; Can't require ["@capacitor/network" :refer [^js Network]] here
;; because the node js environment doesn't have `Window`
(defonce *network (atom nil))

(def *mobile-network-status (atom nil))
(def *mobile-app-state (atom nil))

(def ^:private mobile-network-init-status-flow
  (m/observe
   (fn ctor [emit!]
     (p/let [init-network-status (.getStatus ^js @*network)]
       (emit! init-network-status))
     (fn dtor []))))

(def mobile-network-status-flow
  (->> (c.m/mix mobile-network-init-status-flow (m/watch *mobile-network-status))
       (m/eduction (map #(js->clj % :keywordize-keys true)))))

(def mobile-app-state-flow
  (m/watch *mobile-app-state))

(comment
  (c.m/run-background-task
   ::test
   (m/reduce (fn [_ x]
               (prn ::xxx x))
             (m/latest vector mobile-network-status-flow mobile-app-state))))
