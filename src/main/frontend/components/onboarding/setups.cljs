(ns frontend.components.onboarding.setups
  (:require [frontend.state :as state]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [clojure.string :as string]))

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
     [:section.b.flex.items-center.flex-col
      [:p.flex
       [:i.as-flex-center (ui/icon "zoom-question" {:style {:fontSize "22px"}})]
       [:span.flex-1.flex.flex-col
        [:strong "How logseq saves your work"]
        [:small.opacity-60 "Inside the directory you choose, logseq will create 4 folders."]]]

      [:p.text-sm.pt-5.tracking-wide
       [:span "Each page is a file stored only on your computer."]
       [:br]
       [:span "You may choose to sync it later."]]

      [:ul
       (for [[title label icon]
             [["Graphics & Documents" "/assets" "artboard"]
              ["Daily notes" "/journals" "calendar-plus"]
              ["PAGES" "/pages" "file-text"]
              []
              ["APP Internal" "/logseq" "tool"]
              ["Configs File" "/logseq/config.edn"]]]
         (if-not title
           [:li.hr]
           [:li
            {:key   title}
            [:i.as-flex-center
             {:class (when (string/ends-with? label ".edn") "is-file")}
             (when icon (ui/icon icon))]
            [:span
             [:strong.uppercase title]
             [:small.opacity-50 label]]]))]]]]])
