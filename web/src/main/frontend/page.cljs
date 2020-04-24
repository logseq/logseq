(ns frontend.page
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [frontend.handler :as handler]))

(rum/defc current-page < rum/reactive
  {:did-mount (fn [state]
                (handler/set-root-component! (:rum/react-component state))
                state)}
  []
  (let [route-match (state/sub :route-match)]
    (if route-match
      (when-let [view (:view (:data route-match))]
        (view route-match))
      [:div "404 Page"])))
