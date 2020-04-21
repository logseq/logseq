(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.db :as db]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.state :as state :refer [edit-content]]
            [frontend.components.content :as content]
            [frontend.components.hiccup :as hiccup]
            ))

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
  [[title headings]]
  (let [page-id (str (db/get-page-uuid title))
        headings (next headings)
        hiccup (hiccup/->hiccup headings {:id page-id})]
    [:div.flex-1
     [:h1.text-gray-600 {:style {:font-weight "450"}}
      title]
     (content/content page-id :org
                      {:hiccup hiccup
                       :content "hello world"
                       :on-click (fn []
                                   ;; (handler/edit-journal! page)
                                   )
                       :on-hide (fn []
                                  ;; (handler/save-current-edit-journal! (str heading "\n" (string/trimr @edit-content) "\n\n"))
                                  )})]))

(rum/defc journals < rum/reactive
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    (for [[journal-name body] latest-journals]
      [:div.journal.content {:key journal-name}
       (journal-cp [journal-name body])])
    {:on-load (fn []
                (handler/load-more-journals!))})])
