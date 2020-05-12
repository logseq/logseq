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
  (let [page-name (string/capitalize page-name)
        encoded-page-name (util/url-encode page-name)
        ref-headings (db/get-page-referenced-headings page-name)
        ref-headings (mapv (fn [heading] (assoc heading :heading/show-page? true)) ref-headings)
        ref-hiccup (hiccup/->hiccup ref-headings {:id encoded-page-name
                                                  :start-level 2
                                                  :ref? true})]
    [:div.page-references
     (let [n-ref (count ref-headings)]
       (if (> n-ref 0)
         [:h2.font-bold.text-gray-400.mt-6 (let []
                                             (str n-ref " Linked References"))]))
     (content/content encoded-page-name
                      {:hiccup ref-hiccup})]))
