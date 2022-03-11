(ns frontend.components.onboarding.setups
  (:require [frontend.state :as state]
            [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [clojure.string :as string]))

(rum/defc setups-container
  [flag content]

  [:div.cp__onboarding-setups.flex.items-center.justify-center
   (let [picker? (= flag :picker)]
     [:div.inner-card.flex.flex-col.items-center

      [:h1.text-xl
       (if picker?
         [:span [:strong (ui/icon "heart")] "Welcome to " [:strong "Logseq!"]]
         [:span [:strong (ui/icon "file-import")] "Import existing notes"])]

      [:h2
       (if picker?
         "First you need to choose a folder where logseq will store your thoughts, ideas, notes."
         "You can also do this later in the app.")]

      content])])

(rum/defc picker
  []

  (setups-container
    :picker
    [:article.flex
     [:section.a
      [:strong "Let’s get you set up."]
      [:small "Where on your computer do you want to save your work?"]
      [:div.choose.flex.flex-col.items-center
       [:i]
       [:div.control
        [:label.action-input.flex.items-center.justify-center.flex-col
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
            {:key title}
            [:i.as-flex-center
             {:class (when (string/ends-with? label ".edn") "is-file")}
             (when icon (ui/icon icon))]
            [:span
             [:strong.uppercase title]
             [:small.opacity-50 label]]]))]]]))

(rum/defc importer
  []
  (setups-container
    :importer
    [:article.flex.flex-col.items-center.importer
     [:section.c.text-center
      [:h1 "Do you already have notes that you want to import?"]
      [:h2 "If they are in a JSON or Markdown format logseq can work with them."]]
     [:section.d.flex
      [:label.action-input.flex.items-center
       [:span.as-flex-center [:i (svg/roam-research 28)]]
       [:span.flex.flex-col
        [:strong "RoamResearch"]
        [:small "Import a JSON Export of your Roam graph"]]]

      [:label.action-input.flex.items-center
       [:span.as-flex-center (ui/icon "sitemap" {:style {:fontSize "26px"}})]
       [:span.flex.flex-col
        [:strong "OPML"]
        [:small " Import OPML files"]]]]]))
