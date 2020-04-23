(ns frontend.components.page
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.sidebar :as sidebar]
            [frontend.components.hiccup :as hiccup]
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
  (let [page-name (get-page-name state)
        id (uuid page-name)
        headings (db/get-heading-with-children id)
        headings (db/with-dummy-heading headings)
        hiccup (hiccup/->hiccup headings {:id id})]
    (sidebar/sidebar
     [:div.flex-1
      (content/content id :org
                       {:hiccup hiccup})])))
