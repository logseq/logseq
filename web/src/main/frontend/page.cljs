(ns frontend.page
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [frontend.components.sidebar :as sidebar]))

(rum/defc current-page < rum/reactive
  []
  (let [route-match (state/sub :route-match)]
    (if route-match
      (when-let [view (:view (:data route-match))]
        (sidebar/sidebar route-match
         (view route-match)))
      [:div "404 Page"])))
