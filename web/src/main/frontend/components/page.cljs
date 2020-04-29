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
        page-headings (-> (db/get-page-headings page-name)
                          (db/with-dummy-heading))
        hiccup (hiccup/->hiccup page-headings {:id encoded-page-name})

        ref-headings (db/get-page-referenced-headings page-name)
        ref-headings (mapv (fn [heading] (assoc heading :heading/show-page? true)) ref-headings)
        ref-hiccup (hiccup/->hiccup ref-headings {:id encoded-page-name})
        page-name (string/capitalize page-name)
        repo (state/get-current-repo)
        starred? (contains? (set
                             (some->> (state/sub [:config repo :starred])
                                      (map string/capitalize)))
                            page-name)]
    (sidebar/sidebar
     [:div.flex-1
      [:div.flex.flex-row
       [:h1.title
        page-name]
       [:a.ml-1.text-gray-500.hover:text-indigo-900
        {:on-click (fn []
                     (handler/star-page! page-name starred?))}
        (if starred?
          (svg/star-solid "stroke-current")
          (svg/star-outline "stroke-current"))]]

      (content/content encoded-page-name :org
                       {:hiccup hiccup})

      (let [n-ref (count ref-headings)]
        (if (> n-ref 0)
          [:h2.font-bold.text-gray-400.mt-6 (let []
                                              (str n-ref " Linked References"))]))
      (content/content encoded-page-name :org
                       {:hiccup ref-hiccup})])))

(rum/defc all-pages
  []
  (sidebar/sidebar
   [:div.flex-1
    [:h1.mb-2.font-medium.text-3xl {:style {:color "#161E2E"}}
     "All Pages"]
    (let [pages (db/get-pages (state/get-current-repo))]
      (for [page pages]
        (let [page-id (util/url-encode page)]
          [:div {:key page-id}
           [:a {:href (str "/page/" page-id)}
            page]])))]))
