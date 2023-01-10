(ns frontend.extensions.handbooks.core
  (:require [rum.core :as rum]
            [frontend.ui :as ui]))

(rum/defc content
  []

  [:div.cp__handbooks-content
   [:div.hd.flex.justify-between
    [:h1.text-lg "Handbooks"]]

   [:div.search.relative
    [:span.icon.absolute.opacity-90
     {:style {:top 7 :left 7}}
     (ui/icon "search" {:size 12})]
    [:input {:placeholder "Search"
             :auto-focus   true}]]

   [:div.bd
    [:h2 "Popular topics"]
    [:div.topics-list
     (take
      3 (repeat
         [:div.topic-card.flex
          [:div.l "Cover"]
          [:div.r.flex.flex-col
           [:strong "Switching your notetaking process"]
           [:span "What makes Logseq different from your previous tools?"]]]))]

    [:h2 "Help categories"]
    [:div.categories-list
     [:div.category-card.bg-red-600
      [:strong "Get started here"]
      [:span "5 onboarding articles"]]

     [:div.category-card.bg-green-600
      [:strong "Get started here"]
      [:span "5 onboarding articles"]]

     [:div.category-card.bg-yellow-600
      [:strong "Get started here"]
      [:span "5 onboarding articles"]]

     [:div.category-card.bg-indigo-600
      [:strong "Get started here"]
      [:span "5 onboarding articles"]]]]])


