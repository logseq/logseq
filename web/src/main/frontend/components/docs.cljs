(ns frontend.components.docs
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.ui :as ui]
            [frontend.state :as state]
            [frontend.components.widgets :as widgets]))

(rum/defc docs <
  {:will-mount (fn [state]
                 (if (state/logged?)
                   (handler/load-docs!))
                 state)}
  []
  [:div#docs
   [:h1.title {:style {:margin-bottom "0.25rem"}}
    "What's your preferred mode?"]
   [:span.text-gray-500.text-sm.ml-1
    "It'll be used for new pages."]

   [:div.mt-4.ml-1
    (ui/button
      "Markdown"
      :on-click
      (fn []
        (handler/set-preferred-format! :markdown)
        (handler/load-docs!)))

    [:span.ml-2.mr-2 "-OR-"]

    (ui/button
      "Org Mode"
      :on-click
      (fn []
        (handler/set-preferred-format! :org)
        (handler/load-docs!)))]])
