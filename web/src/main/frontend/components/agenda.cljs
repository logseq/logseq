(ns frontend.components.agenda
  (:require [rum.core :as rum]
            [frontend.format.org.block :as block]
            [clojure.string :as string]
            [frontend.components.sidebar :as sidebar]
            [frontend.components.content :as content]
            [frontend.components.hiccup :as hiccup]
            [frontend.db :as db]))

(rum/defc agenda < rum/reactive
  []
  (let [tasks (db/get-agenda)]
    [:div#agenda
     [:h1.title "Agenda"]
     (if (seq tasks)
       [:div.ml-1
        (let [tasks (block/sort-tasks tasks)
              id "agenda"]
          (content/content id :org
                           {:hiccup (hiccup/->hiccup tasks {:id id})}))]
       "Empty")]))
