(ns frontend.components.journal
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.db :as db]
            [clojure.string :as string]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.components.hiccup :as hiccup]
            [frontend.utf8 :as utf8]))

(rum/defc journal-cp < rum/reactive
  [[title headings]]
  (let [headings (db/with-dummy-heading headings)
        ;; Don't edit the journal title
        headings (update headings 0 assoc :heading/lock? true)
        page-id (util/url-encode title)
        hiccup (hiccup/->hiccup headings {:id page-id})]
    [:div.flex-1
     [:h1.mb-2.font-medium.text-2xl {:style {:color "#161E2E"}}
      [:a {:href (str "/page/" (:heading/uuid (first headings)))}
       "* "]

      title]
     (content/content page-id :org
                      {:hiccup hiccup})]))

(rum/defc journals < rum/reactive
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    (for [[journal-name body] latest-journals]
      [:div.journal.content {:key journal-name}
       (journal-cp [journal-name body])])
    {:on-load (fn []
                (handler/load-more-journals!))})])
