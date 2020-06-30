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
            [clojure.string :as string]
            [frontend.extensions.slide :as slide]
            [cljs-bean.core :as bean]
            [goog.object :as gobj]
            [frontend.graph :as graph]))

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
      [[:a {:href (str "/page/" (util/url-encode page-name))}
        (util/capitalize-all page-name)]
       [:div.ml-2
        (page/page {:parameters {:path {:name page-name}}
                    :sidebar? true
                    :repo repo})]])

    :page-presentation
    (let [page-name (get-in block-data [:page :page/name])
          journal? (:journal? block-data)
          headings (db/get-page-headings repo page-name)
          headings (if journal?
                     (rest headings)
                     headings)
          sections (hiccup/build-slide-sections headings {:id "bingo"
                                                          :start-level 2
                                                          :slide? true
                                                          :sidebar? true})]
      [[:a {:href (str "/page/" (util/url-encode page-name))}
        (util/capitalize-all page-name)]
       [:div.ml-2.slide.mt-2
        (slide/slide sections)]])

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
          [:div.ml-1.font-medium
           title]]
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

(defonce *show-page-graph? (atom false))

(rum/defc page-graph < rum/reactive
  [dark?]
  (let [match (:route-match @state/state)
        theme (:ui/theme @state/state)
        page (get-page match)
        graph (db/build-page-graph page theme)]
    [:div.sidebar-item.flex-col.flex-1
     (ui/force-graph-2d (graph/build-graph-opts graph dark? {:width 600}))]))

(rum/defcs starred-cp <
  (rum/local true ::show?)
  [state repo starred]
  (let [show? (get state ::show?)]
    (when @show?
      (when (and repo (seq starred))
        [:div.sidebar-item.flex-col.content {:key "starred-pages"}
         [:div.flex.flex-row.justify-between
          [:div.flex.flex-row.items-center.mb-2
           (svg/star-outline "stroke-current h-4 w-4")
           [:div.ml-2 {:style {:font-weight 500}}
            "Starred"]]
          [:a.close.hover:text-gray-900.text-gray-500.flex.items-center
           {:on-click (fn [] (reset! show? false))}
           svg/close]]
         [:div.flex.flex-row.justify-start
          (for [page starred]
            (let [encoded-page (util/url-encode page)]
              [:a.flex.items-center.pb-2.px-2.text-sm
               {:key encoded-page
                :href (str "/page/" encoded-page)}
               (util/capitalize-all page)]))]]))))

(rum/defcs sidebar < rum/reactive
  [state]
  (let [blocks (state/sub :sidebar/blocks)
        repo (state/sub :git/current-repo)
        starred (state/sub [:config repo :starred])
        match (state/sub :route-match)
        theme (state/sub :ui/theme)
        dark? (= "dark" theme)
        show-page-graph? (rum/react *show-page-graph?)]
    [:div#right-sidebar.flex.flex-col.p-2.shadow-xs.overflow-y-auto
     [:div#theme-selector.ml-3.mb-2
      [:div.flex.flex-row
       [:div.flex.flex-row {:key "right-sidebar-settings"}
        [:div.mr-1.text-sm
         (let [theme (if dark? "white" "dark")]
           [:a {:title (str "Switch to "
                            theme
                            " theme")
                :on-click (fn []
                            (state/set-theme! theme))}
            (str (string/capitalize theme) " theme")])]]

       [:div.flex.flex-row.ml-4
        [:div.mr-1.text-sm
         [:a {:on-click (fn []
                          (swap! *show-page-graph? not))}
          (if @*show-page-graph?
            "Close page graph"
            "Open page graph")]]]]]
     (for [[idx [repo db-id block-type block-data]] (medley/indexed blocks)]
       (rum/with-key
         (sidebar-item repo idx db-id block-type block-data)
         (str "sidebar-block-" idx)))
     (when show-page-graph?
       (page-graph dark?))
     (starred-cp repo starred)]))
