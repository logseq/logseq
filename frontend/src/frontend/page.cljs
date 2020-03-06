(ns frontend.page
  (:require [uix.core.alpha :as uix]
            [frontend.state :as state]))

(defn current-page
  []
  (let [route-match @(uix/state (:route-match @state/state))]
    (prn "route-match: " route-match)
    (if route-match
      (when-let [view (:view (:data route-match))]
        (view route-match)))))
