(ns frontend.components.draw
  (:require [rum.core :as rum]
            [goog.object :as gobj]))

(rum/defc draw
  []
  [:div#draw.relative
   [:iframe {:title "Excalidraw"
             :src "https://excalidraw.com"}]
   [:div.absolute.bottom-15.left-2.hidden.md:block
    [:a {:on-click (fn [] (.back (gobj/get js/window "history")))}
     [:img.h-8.w-auto
      {:alt "Logseq"
       :src "/static/img/logo.png"}]]]])
