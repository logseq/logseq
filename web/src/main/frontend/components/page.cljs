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
            [frontend.format :as format]
            [frontend.components.content :as content]
            [frontend.config :as config]
            [frontend.db :as db]
            [goog.object :as gobj]))

(defn- get-page-name
  [state]
  (let [route-match (first (:rum/args state))]
    (get-in route-match [:parameters :path :name])))

(defn- get-headings
  [page-name journal? heading?]
  (if heading?
    (rum/react (db/pull-many '[*] [[:heading/uuid (uuid page-name)]]))
    (let [page-headings (db/get-page-headings page-name)
          page-headings (if journal?
                          (update (vec page-headings) 0 assoc :heading/lock? true)
                          page-headings)]
      page-headings)))

;; A page is just a logical heading
(rum/defcs page < rum/reactive
  [state option]
  (let [encoded-page-name (get-page-name state)
        page-name (string/capitalize (util/url-decode encoded-page-name))
        format (db/get-page-format page-name)
        journal? (db/journal-page? page-name)
        heading? (util/uuid-string? page-name)
        heading-id (and heading? (uuid page-name))
        page-headings (get-headings page-name journal? heading?)
        page-headings (if heading?
                        page-headings
                        (db/with-dummy-heading page-headings format))
        start-level (if journal? 2 1)
        hiccup (hiccup/->hiccup page-headings {:id encoded-page-name
                                               :start-level start-level})

        page-name (if heading?
                    (:page/name (db/entity (:db/id (:heading/page (first page-headings)))))
                    page-name)
        repo (state/get-current-repo)
        starred? (contains? (set
                             (some->> (state/sub [:config repo :starred])
                                      (map string/capitalize)))
                            page-name)
        sidebar? (:sidebar? option)]
    [:div.flex-1
     (when-not sidebar?
       [:div.flex.flex-row
        [:a {:on-click (fn [e]
                         (util/stop e)
                         (when (gobj/get e "shiftKey")
                           (state/sidebar-add-block! :page {:name page-name})
                           (handler/show-right-sidebar)))}
         [:h1.title
          page-name]]
        [:a.ml-1.text-gray-500.hover:text-gray-700
         {:class (if starred? "text-gray-800")
          :on-click (fn []
                      (handler/star-page! page-name starred?))}
         (if starred?
           (svg/star-solid "stroke-current")
           (svg/star-outline "stroke-current h-5 w-5"))]])

     (content/content encoded-page-name
                      {:hiccup hiccup})

     (reference/references page-name)]))

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
