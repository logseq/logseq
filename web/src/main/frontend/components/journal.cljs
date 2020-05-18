(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.db :as db]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.components.hiccup :as hiccup]
            [frontend.components.reference :as reference]
            [frontend.utf8 :as utf8]
            [goog.object :as gobj]))

(rum/defc journal-cp
  [[title headings format]]
  (let [;; Don't edit the journal title
        headings (when (seq headings)
                   (update (vec headings) 0 assoc :heading/lock? true))
        headings (db/with-dummy-heading headings format)

        encoded-page-name (util/url-encode (string/capitalize title))]
    [:div.flex-1
     [:a.initial-color {:href (str "/page/" encoded-page-name)
                        :on-click (fn [e]
                                    (util/stop e)
                                    (when (gobj/get e "shiftKey")
                                      (state/sidebar-add-block! :page {:name title})
                                      (handler/show-right-sidebar)))}
      [:h1.title
       title]]
     (content/content encoded-page-name
                      {:hiccup (hiccup/->hiccup headings
                                                {:id encoded-page-name
                                                 :start-level 2})})

     (reference/references title)]))

(rum/defc journals
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    (for [[journal-name body format] latest-journals]
      [:div.journal.content {:key journal-name}
       (journal-cp [journal-name body format])])
    {:on-load (fn []
                (handler/load-more-journals!))})])
