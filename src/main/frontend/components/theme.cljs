(ns frontend.components.theme
  (:require [rum.core :as rum]))

(rum/defc container
  [{:keys [theme on-click] :as props} child]
  rum/use-effect! (let [doc js/document.documentElement
                        cls (.-classList doc)]
                    (.setAttribute doc "data-theme" (if (= theme "white") "light" theme))
                    (if (= theme "dark")                    ;; for tailwind dark mode
                      (.add cls "dark")
                      (.remove cls "dark")))

  [theme]
  [:div
   {:class (str theme "-theme")
    :on-click on-click}
   child])
