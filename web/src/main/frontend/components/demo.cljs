(ns frontend.components.demo
  (:require [rum.core :as rum]
            [frontend.handler :as handler]
            [frontend.ui :as ui]
            [frontend.components.widgets :as widgets]))

(rum/defc demo
  []
  [:div#demo
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
        (handler/run-demo!)))

    [:span.ml-2.mr-2 "-OR-"]

    (ui/button
      "Org Mode"
      :on-click
      (fn []
        (handler/set-preferred-format! :org)
        (handler/run-demo!)))]])
