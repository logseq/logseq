(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.mixins :as mixins]))

(defonce content-atom (atom ""))
(defonce edit?-atom (atom false))

(rum/defc editor-box <
  (mixins/event-mixin
   (fn [state]
     (mixins/close-when-esc-or-outside state
                                       true
                                       :on-close (fn []
                                                   (reset! edit?-atom false)))))
  [content-atom]
  [:textarea
   {:rows 10
    :on-change #(reset! content-atom (.. % -target -value))
    :value @content-atom
    :auto-focus true
    :style {:border "none"
            :border-radius 0
            :background "transparent"}}])

(rum/defcs journal < rum/reactive
  [state]
  (let [content (rum/react content-atom)
        edit? (rum/react edit?-atom)]
    [:div#content
     [:h1.text-gray-600 "April 4th, 2020"]
     (if (or edit? (string/blank? content))
       (editor-box content-atom)
       [:div {:on-click (fn []
                          (reset! edit?-atom true))}
        (util/raw-html (format/to-html content "org"))])]))
