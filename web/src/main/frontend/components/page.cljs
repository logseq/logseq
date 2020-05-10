(ns frontend.components.page
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.hiccup :as hiccup]
            [frontend.components.reference :as reference]
            [frontend.components.svg :as svg]
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
(rum/defcs page < rum/reactive
  [state]
  (let [encoded-page-name (get-page-name state)
        page-name (string/capitalize (util/url-decode encoded-page-name))
        journal? (db/journal-page? page-name)
        page-headings (db/get-page-headings page-name)
        page-headings (if journal?
                        (update (vec page-headings) 0 assoc :heading/lock? true)
                        page-headings)
        page-headings (db/with-dummy-heading page-headings)
        start-level (if journal? 2 1)
        hiccup (hiccup/->hiccup page-headings {:id encoded-page-name
                                               :start-level start-level})

        ref-headings (db/get-page-referenced-headings page-name)
        ref-headings (mapv (fn [heading] (assoc heading :heading/show-page? true)) ref-headings)
        ref-hiccup (hiccup/->hiccup ref-headings {:id encoded-page-name
                                                  :start-level start-level})
        page-name (string/capitalize page-name)
        repo (state/get-current-repo)
        starred? (contains? (set
                             (some->> (state/sub [:config repo :starred])
                                      (map string/capitalize)))
                            page-name)]
    [:div.flex-1
     [:div.flex.flex-row
      [:h1.title
       page-name]
      [:a.ml-1.text-gray-500.hover:text-gray-700
       {:class (if starred? "text-gray-800")
        :on-click (fn []
                    (handler/star-page! page-name starred?))}
       (if starred?
         (svg/star-solid "stroke-current")
         (svg/star-outline "stroke-current h-5 w-5"))]]

     (content/content encoded-page-name :org
                      {:hiccup hiccup})

     (let [n-ref (count ref-headings)]
       (if (> n-ref 0)
         [:h2.font-bold.text-gray-400.mt-6 (let []
                                             (str n-ref " Linked References"))]))
     (content/content encoded-page-name :org
                      {:hiccup ref-hiccup})]))

(rum/defc all-pages < rum/reactive
  []
  [:div.flex-1
   [:h1.title
    "All Pages"]
   (when-let [current-repo (state/sub :git/current-repo)]
     (let [pages (db/get-pages current-repo)]
      (for [page pages]
        (let [page-id (util/url-encode page)]
          [:div {:key page-id}
           [:a {:href (str "/page/" page-id)}
            page]]))))])
