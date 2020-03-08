(ns frontend.page
  (:require [rum.core :as rum]
            [frontend.state :as state]))

(rum/defc current-page < rum/reactive
  []
  (let [state (rum/react state/state)
        route-match (:route-match state)]
    (if route-match
      (when-let [view (:view (:data route-match))]
        (view route-match)))))
