(ns frontend.components.reference
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.hiccup :as hiccup]
            [frontend.ui :as ui]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.config :as config]
            [frontend.db :as db]))

(rum/defc references < rum/reactive
  [page-name marker? priority?]
  (when page-name
    (let [heading? (util/uuid-string? page-name)
          heading-id (and heading? (uuid page-name))
          page-name (string/lower-case page-name)
          encoded-page-name (util/url-encode page-name)
          ref-headings (cond
                         priority?
                         (db/get-headings-by-priority (state/get-current-repo) page-name)

                         marker?
                         (db/get-marker-headings (state/get-current-repo) page-name)
                         heading-id
                         (db/get-heading-referenced-headings heading-id)
                         :else
                         (db/get-page-referenced-headings page-name))
          n-ref (count ref-headings)]
      (when (> n-ref 0)
        [:div.references.mt-6
         (ui/foldable
          [:h2.font-bold.opacity-50 (let []
                                           (str n-ref " Linked References"))]
          (let [ref-hiccup (hiccup/->hiccup ref-headings
                                            {:id encoded-page-name
                                             :start-level 2
                                             :ref? true
                                             :group-by-page? true}
                                            {})]
            (content/content encoded-page-name
                             {:hiccup ref-hiccup})))]))))
