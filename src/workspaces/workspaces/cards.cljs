(ns workspaces.cards
  (:require [nubank.workspaces.core :as ws]
            [nubank.workspaces.model :as wsm]
            [nubank.workspaces.card-types.react :as ct.react]
            [nubank.workspaces.card-types.test :as ct.test]
            [cljs.test :refer [is async]]
            [rum.core :as rum]
            [frontend.ui :as ui]))

;; simple function to create react elemnents
(defn element [name props & children]
  (apply js/React.createElement name (clj->js props) children))

(ws/defcard hello-card
  (ct.react/react-card
   (element "div" {} "Hello World")))

(rum/defc ui-button
  []
  (ui/button "Text"
    :background "green"
    :on-click (fn [] (js/alert "button clicked"))))

(ws/defcard button-card
  (ct.react/react-card
   (ui-button)))
