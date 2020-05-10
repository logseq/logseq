(ns frontend.components.agenda
  (:require [rum.core :as rum]
            [frontend.format.block :as block]
            [frontend.components.content :as content]
            [frontend.components.hiccup :as hiccup]
            [frontend.state :as state]
            [frontend.db :as db]))

(rum/defc agenda < rum/reactive
  []
  [:div#agenda
   [:h1.title "Agenda"]
   (let [current-repo (state/sub :git/current-repo)
         tasks (db/get-agenda current-repo)]
     (if (seq tasks)
       [:div.ml-1
        (let [tasks (block/sort-tasks tasks)
              id "agenda"]
          (content/content id :org
                           {:hiccup (hiccup/->hiccup tasks {:id id})}))]
       "Empty"))])
