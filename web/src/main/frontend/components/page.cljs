(ns frontend.components.page
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.sidebar :as sidebar]
            [frontend.components.hiccup :as hiccup]
            [frontend.components.reference :as reference]
            [frontend.ui :as ui]
            [frontend.format.org-mode :as org]
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.config :as config]
            [frontend.db :as db]))

(defn- get-page-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

;; A page is just a logical heading
(rum/defcs page
  [state]
  (let [encoded-page-name (get-page-name state)
        page-name (string/capitalize (util/url-decode encoded-page-name))
        page-headings (-> (db/get-page-headings page-name)
                          (db/with-dummy-heading))
        hiccup (hiccup/->hiccup page-headings {:id encoded-page-name})

        ref-headings (db/get-page-referenced-headings page-name)
        ref-headings (mapv (fn [heading] (assoc heading :heading/show-page? true)) ref-headings)
        ref-hiccup (hiccup/->hiccup ref-headings {:id encoded-page-name})]
    (sidebar/sidebar
     [:div.flex-1
      [:h1.mb-2.font-medium.text-3xl {:style {:color "#161E2E"}}
       (string/capitalize page-name)]
      (content/content encoded-page-name :org
                       {:hiccup hiccup})

      [:h2.font-bold.text-gray-400.mt-6 (str (count ref-headings) " Linked References")]
      (content/content encoded-page-name :org
                       {:hiccup ref-hiccup})])))
