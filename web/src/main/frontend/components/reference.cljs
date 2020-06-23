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
  [page-or-tag-name tag?]
  (when page-or-tag-name
    (let [heading? (util/uuid-string? page-or-tag-name)
          heading-id (and heading? (uuid page-or-tag-name))
          page-or-tag-name (string/lower-case page-or-tag-name)
          encoded-page-or-tag-name (util/url-encode page-or-tag-name)
          ref-headings (cond
                         tag?
                         (db/get-tag-referenced-headings page-or-tag-name)
                         heading-id
                         (db/get-heading-referenced-headings heading-id)
                         :else
                         (db/get-page-referenced-headings page-or-tag-name))
          ref-hiccup (hiccup/->hiccup ref-headings
                                      {:id encoded-page-or-tag-name
                                       :start-level 2
                                       :ref? true
                                       :group-by-page? true}
                                      {})]
      [:div.references
       (let [n-ref (count ref-headings)]
         (if (> n-ref 0)
           [:h2.font-medium.mt-6 (let []
                                 (str n-ref " Linked References"))]))
       (content/content encoded-page-or-tag-name
                        {:hiccup ref-hiccup})])))
