(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.mixins :as mixins]
            [frontend.db :as db]))

(defonce content-atom (atom ""))
(defonce edit?-atom (atom false))

(defn today
  []
  (.toLocaleDateString (js/Date.) "default"
                       (clj->js {:month "long"
                                 :year "numeric"
                                 :day "numeric"
                                 :weekday "long"})))


(rum/defc editor-box <
  (mixins/event-mixin
   (fn [state]
     (mixins/close-when-esc-or-outside
      state
      edit?-atom
      :on-close (fn []
                  (reset! edit?-atom false)
                  (handler/alter-file (util/current-journal-path) "Auto save" @content-atom false)))))
  [content-atom]
  (ui/textarea-autosize
   {:on-change (fn [e]
                 (reset! content-atom (util/evalue e)))
    :default-value @content-atom
    :auto-focus true
    :style {:border "none"
            :border-radius 0
            :background "transparent"
            :margin-top 12.5}}))

(rum/defcs journal < rum/reactive
  {:will-mount (fn [state]
                 (reset! content-atom (db/get-current-journal))
                 state)}
  [state]
  (let [content (rum/react content-atom)
        edit? (rum/react edit?-atom)
        show-textarea? (or edit? (string/blank? content))]
    (when (and show-textarea? (not edit?))
      (reset! edit?-atom true))
    [:div#content
     [:h1 {:style {:color "#202b33"
                   :font-weight 450}}
      (today)]
     (if show-textarea?
       (editor-box content-atom)
       [:div.flex-1 {:on-click (fn []
                                 (reset! edit?-atom true))
                     :style {:padding 8
                             :min-height 200}}
        (util/raw-html (format/to-html content "org"))])]))
