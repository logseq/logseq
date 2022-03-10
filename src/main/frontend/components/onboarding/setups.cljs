(ns frontend.components.onboarding.setups
  (:require [frontend.state :as state]
            [rum.core :as rum]
            [frontend.ui :as ui]))

(rum/defc main
  []

  [:div.cp__onboarding-setups.flex.items-center.justify-center
   [:div.inner-card.flex.flex-col.items-center
    [:h1.text-xl [:strong (ui/icon "heart")] "Welcome to " [:strong "Logseq!"]]
    [:h2 "First you need to choose a folder where logseq will store your thoughts, ideas, notes."]

    [:article.flex
     [:section.a
      [:strong "Let’s get you set up."]
      [:small "Where on your computer do you want to save your work?"]
      [:div.choose.flex.flex-col.items-center
       [:i]
       [:div.control
        [:a.open-link.flex.items-center.justify-center.flex-col
         [:strong "Choose a folder"]
         [:small "Open existing directory or Create a new one"]]]]]
     [:section.b.flex.items-center.justify-center
      "2"]]]])
