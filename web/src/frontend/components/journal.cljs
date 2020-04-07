(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.mixins :as mixins]
            [frontend.db :as db]
            [frontend.state :as state]))

(def edit-content (atom ""))
(rum/defc editor-box <
  (mixins/event-mixin
   (fn [state]
     (mixins/hide-when-esc-or-outside
      state
      nil
      :show-fn (fn []
                 (:edit? @state/state))
      :on-hide (fn []
                 (handler/save-current-edit-journal! @edit-content)))))
  [content]
  [:div.flex-1
   (ui/textarea-autosize
    {:on-change (fn [e]
                  (reset! edit-content (util/evalue e)))
     :default-value content
     :auto-focus true
     :style {:border "none"
             :border-radius 0
             :background "transparent"
             :margin-top 12.5}})])

(rum/defc journal-cp < rum/reactive
  [{:keys [uuid _title content] :as journal}]
  (let [{:keys [edit? edit-journal]} (rum/react state/state)]
    (if (and edit? (= uuid (:uuid edit-journal)))
      (editor-box content)
      [:div.flex-1 {:on-click (fn []
                                (handler/edit-journal! content journal)
                                (reset! edit-content content))
                    :style {:padding 8
                            :min-height 200}}
       (util/raw-html (format/to-html content "org"))])))

(rum/defcs journals < rum/reactive
  {:will-mount (fn [state]
                 (handler/set-latest-journals!)
                 state)}
  [state]
  (let [{:keys [latest-journals]} (rum/react state/state)]
    [:div#journals.content
     (for [journal latest-journals]
       [:div.journal {:key (cljs.core/random-uuid)}
        (journal-cp journal)])]))
