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
  [page-name]
  (when page-name
    (let [heading? (util/uuid-string? page-name)
          heading-id (and heading? (uuid page-name))
          page-name (string/lower-case page-name)
          encoded-page-name (util/url-encode page-name)
          ref-headings (if heading-id
                         (db/get-heading-referenced-headings heading-id)
                         (db/get-page-referenced-headings page-name))
          ref-hiccup (hiccup/->hiccup ref-headings {:id encoded-page-name
                                                    :start-level 2
                                                    :show-page? true
                                                    :ref? true})]
      [:div.page-references
       (let [n-ref (count ref-headings)]
         (if (> n-ref 0)
           [:h2.font-bold.mt-6 (let []
                                 (str n-ref " Linked References"))]))
       (content/content encoded-page-name
                        {:hiccup ref-hiccup})])))
