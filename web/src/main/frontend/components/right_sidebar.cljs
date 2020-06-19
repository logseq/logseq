(ns frontend.components.right-sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.components.page :as page]
            [frontend.components.hiccup :as hiccup]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.util :as util]
            [frontend.date :as date]
            [medley.core :as medley]
            [frontend.graph.vis :as vis]
            [clojure.string :as string]))

(rum/defc heading-cp < rum/reactive
  [repo idx heading]
  (let [id (:heading/uuid heading)]
    (page/page {:parameters {:path {:name (str id)}}
                :sidebar? true
                :sidebar/idx idx
                :repo repo})))

(defn build-sidebar-item
  [repo idx db-id block-type block-data]
  (case block-type
    :heading-ref
    ["Block reference"
     [:div.ml-2
      (heading-cp repo idx (:heading block-data))]]

    :heading
    ["Block"
     [:div.ml-2
      (heading-cp repo idx block-data)]]

    :page
    (let [page-name (get-in block-data [:page :page/name])]
      [page-name
       [:div.ml-2
        (page/page {:parameters {:path {:name page-name}}
                    :sidebar? true
                    :repo repo})]])

    ["" [:span]]))

(rum/defc sidebar-item < rum/reactive
  [repo idx db-id block-type block-data]
  (let [collapse? (state/sub [:ui/sidebar-collapsed-blocks db-id])]
    [:div.sidebar-item.content
     (let [[title component] (build-sidebar-item repo idx db-id block-type block-data)]
       [:div.flex.flex-col
        [:div.flex.flex-row.justify-between
         [:div.flex.flex-row.justify-center
          [:a.hover:text-gray-900.text-gray-500.flex.items-center.pl-1.pr-1
           {:on-click #(state/sidebar-block-toggle-collapse! db-id)}
           (if collapse?
             (svg/caret-right)
             (svg/caret-down))]
          [:div.ml-1 {:style {:font-size "1.2rem"}}
           (util/capitalize-all title)]]
         [:a.close.hover:text-gray-900.text-gray-500.flex.items-center
          {:on-click (fn []
                       (state/sidebar-remove-block! idx))}
          svg/close]]
        [:div {:class (if collapse? "hidden" "initial")}
         component]])]))

(defn- get-page
  [match]
  (let [route-name (get-in match [:data :name])
        page (case route-name
               :page
               (get-in match [:path-params :name])

               :file
               (get-in match [:path-params :path])

               (date/journal-name))]
    (if page
      (util/url-decode (string/lower-case page)))))

(defn render-graph
  [state]
  (let [match (:route-match @state/state)
        theme (:ui/theme @state/state)
        page (get-page match)
        graph (db/build-page-graph page theme)]
    (vis/new-network "page-graph" graph))
  state)

(defonce *show-graph? (atom false))
(rum/defc graph < rum/reactive
  {:did-mount render-graph
   :did-update render-graph}
  [dark?]
  [:div.sidebar-item.flex-col.flex-1
   [:div#page-graph]])

(rum/defcs sidebar < rum/reactive
  [state]
  (let [blocks (state/sub :sidebar/blocks)
        repo (state/sub :git/current-repo)
        starred (state/sub [:config repo :starred])
        match (state/sub :route-match)
        theme (state/sub :ui/theme)
        dark? (= "dark" theme)
        show-graph? (rum/react *show-graph?)]
    [:div#right-sidebar.flex.flex-col.p-2.shadow-xs.overflow-y-auto
     [:div#theme-selector.flex.flex-row.justify-between.sidebar-item {:style {:padding-top 12
                                                                              :margin-bottom 12}}
      [:div.flex.flex-row
       [:div.mr-1.text-sm {:style {:font-weight 500}}
        "Page Graph"]
       [:div.px-1
        (ui/toggle show-graph? (fn []
                                 (swap! *show-graph? not)))]]
      [:div.flex.flex-row {:key "right-sidebar-settings"}
       [:div.mr-1.text-sm {:style {:font-weight 500}}
        "Dark theme"]
       [:div.px-1
        (ui/toggle dark? (fn []
                           (state/set-theme! (if dark? "white" "dark"))))]]]

     (for [[idx [repo db-id block-type block-data]] (medley/indexed blocks)]
       (rum/with-key
         (sidebar-item repo idx db-id block-type block-data)
         (str "sidebar-block-" idx)))
     (when show-graph?
       (graph dark?))
     (when (and repo (seq starred))
       [:div.sidebar-item.flex-col.flex-1.content {:key "starred-pages"}
        [:div.flex.flex-row.items-center
         (svg/star-outline "stroke-current h-4 w-4")
         [:div.ml-2 {:style {:font-weight 500}}
          "Starred"]]
        (for [page starred]
          (let [encoded-page (util/url-encode page)]
            [:a.flex.items-center.pl-1.py-1.text-sm
             {:key encoded-page
              :href (str "/page/" encoded-page)}
             (util/capitalize-all page)]))])]))
