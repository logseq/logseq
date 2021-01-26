(ns frontend.components.theme
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.version :refer [version]]
            [frontend.components.svg :as svg]))

(rum/defc frame-title-bar
  []
  [:div.ls-window-frame-title-bar
   [:div.l
    [:a.it {:title "Go Back" :on-click #(js/window.history.back)} (svg/big-arrow-left)]
    [:a.it {:title "Go Forward" :on-click #(js/window.history.forward)} (svg/big-arrow-right)]]
   ; TODO: center region should display current page title or important background notifications
   [:span.c (str "Logseq - " version)]
   [:div.r
    (when util/win32?
      [:div.inner
       [:a.it {:title "Minimize Window" :on-click #(js/window.apis.toggleMaxOrMinActiveWindow true)} svg/minus]
       [:a.it.maximize {:title "Maximize Window" :on-click #(js/window.apis.toggleMaxOrMinActiveWindow)} svg/rectangle]
       [:a.it {:title "Close Window" :on-click #(js/window.apis._callApplication "quit")} svg/close]])]])

(rum/defc container
  [{:keys [theme on-click] :as props} child]
  (rum/use-effect!
   #(let [doc js/document.documentElement
          cls (.-classList doc)]
      (.setAttribute doc "data-theme" (if (= theme "white") "light" theme))
      (if (= theme "dark")                                 ;; for tailwind dark mode
        (.add cls "dark")
        (.remove cls "dark")))
   [theme])
  [:div
   {:class    (str theme "-theme")
    :on-click on-click}
   (when (util/electron?) (frame-title-bar))
   child])
