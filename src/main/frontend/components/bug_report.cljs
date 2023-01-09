(ns frontend.components.bug-report 
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.header :as header]))

(rum/defc bug-report < rum/reactive
  [{:keys []}]
  [:div.flex.flex-col.items-center
   [:div.flex.items-center
    (ui/icon "bug")
    [:h1.text-3xl.ml-2 "Bug report"]]
   [:div.flex.mt-4.items-center
    [:div.mr-2 "Click the button to report bug"]
    (ui/button "Go" :href header/bug-report-url)]])