(ns frontend.extensions.handbooks.core
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.state :as state]))

(rum/defc link-card
  [opts child]

  [:div.link-card
   opts
   child])

(rum/defc pane-category-topics
  []

  [:div.pane.pane-category-topics
   [:div.topics-list
    (take
     3 (repeat
        [:div.topic-card.flex
         [:div.l ""]
         [:div.r.flex.flex-col
          [:strong "Switching your notetaking process"]
          [:span "What makes Logseq different from your previous tools?"]]]))

    (take
     3 (repeat
        [:div.topic-card.flex
         [:div.r.flex.flex-col
          [:strong "Switching your notetaking process"]
          [:span "What makes Logseq different from your previous tools?"]]]))]])

(rum/defc pane-topic-detail
  []

  [:div.pane.pane-topic-detail
   [:h1.text-2xl.pb-3.font-semibold "PDF Highlights"]

   [:div.flex.demos
    [:img {:src "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsPWsZWt-6pMQ7mZ-cGuHw2AsDhwxl3quWlA&usqp=CAU"}]]

   [:div.content-wrap
    [:div.content
     "Lorem ipsum dolor sit amet consectetur. Congue vivamus libero consequat
     tortor lacus nulla sit massa. Imperdiet nec bibendum amet turpis bibendum
     consequat tortor lacus nulla sit massa. Imperdiet nec bibendum amet turpis bibendum
     pellentesque. Egestas sit sed lectus dui suspendisse. Mi cursus pharetra
     sit facilisi consectetur risus."]]])

(rum/defc pane-dashboard
  []
  [:div.pane.dashboard-pane
   [:h2 "Popular topics"]
   [:div.topics-list
    (take
     3 (repeat
        [:div.topic-card.flex
         [:div.l ""]
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
     [:strong "Shortcuts"]
     [:span "5 onboarding articles"]]]])

(rum/defc search-bar
  []
  [:div.search.relative
   [:span.icon.absolute.opacity-90
    {:style {:top 6 :left 7}}
    (ui/icon "search" {:size 12})]
   [:input {:placeholder "Search"
            :auto-focus  true}]])

(rum/defc related-topics
  []
  [:div.related-topics
   (link-card {}
              [:strong.text-md "How to do something?"])
   (link-card {}
              [:strong.text-md "How to do something?"])])

(rum/defc content
  []

  [:div.cp__handbooks-content
   [:div.pane-wrap
    [:div.hd.flex.justify-between.select-none.draggable-handle

     [:h1.text-lg.flex.items-center
      [:span.pr-2.flex.items-center.cursor-pointer
       (ui/icon "chevron-left")]
      [:span "Handbooks"]]

     [:a {:on-click #(state/toggle! :ui/handbooks-open?)}
      (ui/icon "x")]]

    ;; search bar
    (search-bar)

    ;; entry pane
    (pane-dashboard)
    ;(pane-category-topics)
    ;(pane-topic-detail)
    ]

   ;; footer
   [:div.ft
    [:h2.uppercase.opacity-60 "Related"]
    (related-topics)]])
