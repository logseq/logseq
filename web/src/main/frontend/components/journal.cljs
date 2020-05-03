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
            [frontend.components.reference :as reference]
            [frontend.utf8 :as utf8]))

(rum/defc journal-cp
  [[title headings]]
  (let [headings (db/with-dummy-heading headings)
        ;; Don't edit the journal title
        headings (if (seq headings)
                   (update headings 0 assoc :heading/lock? true))
        encoded-page-name (util/url-encode (string/capitalize title))]
    [:div.flex-1
     [:a.initial-color {:href (str "/page/" encoded-page-name)}
      [:h1.title
       title]]
     (content/content encoded-page-name :org
                      {:hiccup (hiccup/->hiccup headings {:id encoded-page-name})})

     (reference/references title)]))

(rum/defc journals
  [latest-journals]
  [:div#journals
   (ui/infinite-list
    (for [[journal-name body] latest-journals]
      [:div.journal.content {:key journal-name}
       (journal-cp [journal-name body])])
    {:on-load (fn []
                (handler/load-more-journals!))})])
