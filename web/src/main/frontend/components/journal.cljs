(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.state :as state :refer [edit-content]]
            [frontend.components.content :as content]))

(defn split-first [re s]
  (clojure.string/split s re 2))

(defn- split-heading-body
  [content]
  (let [result (split-first #"\n" content)]
    (if (= 1 (count result))
      [result ""]
      [(string/trim (first result))
       (string/trim (second result))])))

(rum/defc journal-cp < rum/reactive
  [{:keys [uuid title content] :as journal}]
  (let [{:keys [edit? edit-journal]} (rum/react state/state)
        [heading content] (split-heading-body content)
        id uuid]
    [:div.flex-1
     [:h1.text-gray-600 {:style {:font-weight "450"}}
      title]
     (content/content id
                      nil
                      :org
                      {:content content
                       :on-click (fn []
                                   (handler/edit-journal! journal))
                       :on-hide (fn []
                                  (handler/save-current-edit-journal! (str heading "\n" (string/trimr @edit-content) "\n\n")))})]))

(rum/defc journals < rum/reactive
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    (for [journal latest-journals]
      [:div.journal.content {:key (cljs.core/random-uuid)}
       (journal-cp journal)])
    {:on-load (fn []
                (handler/load-more-journals!))})])
