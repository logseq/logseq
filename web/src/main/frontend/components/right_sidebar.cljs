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
            [medley.core :as medley]
            [frontend.graph.vis :as vis]
            [clojure.string :as string]))

(rum/defc heading-cp < rum/reactive
  [heading]
  (let [id (:heading/uuid heading)]
    (page/page {:parameters {:path {:name (str id)}}
                :sidebar? true})))

(defn build-sidebar-item
  [db-id block-type block-data]
  (case block-type
    :heading-ref
    ["Block reference"
     [:div.ml-2
      (heading-cp (:heading block-data))]]

    :heading
    ["Block"
     [:div.ml-2
      (heading-cp block-data)]]

    :page
    (let [page-name (get-in block-data [:page :page/name])]
      [page-name (page/page {:parameters {:path {:name page-name}}
                             :sidebar? true})])

    ["" [:span]]))

(rum/defc sidebar-item < rum/reactive
  [idx db-id block-type block-data]
  (let [collapse? (state/sub [:ui/sidebar-collapsed-blocks db-id])]
    [:div.sidebar-item.content
     (let [[title component] (build-sidebar-item db-id block-type block-data)]
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

               (util/journal-name))]
    (if page
      (util/url-decode (string/lower-case page)))))

(defn render-graph
  [state]
  (when-let [graph (first (:rum/args state))]
    (vis/new-network "page-graph" graph))
  state)

(rum/defc graph < rum/static
  {:did-mount render-graph
   :did-update render-graph}
  [graph-data dark?]
  [:div.sidebar-item.flex-col.flex-1
   [:div#theme-selector.flex.flex-row.justify-between
    [:div.ml-2.font-bold "Dark theme"]
    [:div.px-1
     (ui/toggle dark? (fn []
                        (state/set-theme! (if dark? "white" "dark"))))]]
   [:div#page-graph]])

(rum/defcs sidebar < rum/reactive
  [state]
  (let [blocks (state/sub :sidebar/blocks)
        repo (state/sub :git/current-repo)
        starred (state/sub [:config repo :starred])]
    [:div#right-sidebar.flex.flex-col.p-2.shadow-xs.overflow-y-auto {:style {:padding-bottom 300}}
     (for [[idx [db-id block-type block-data]] (medley/indexed blocks)]
       (rum/with-key
         (sidebar-item idx db-id block-type block-data)
         (str "sidebar-block-" idx)))
     (let [match (state/sub :route-match)
           theme (state/sub :ui/theme)
           dark? (= "dark" theme)
           page (get-page match)
           graph-data (db/build-page-graph page theme)]
       (graph graph-data dark?))
     (when (and repo (seq starred))
       [:div.sidebar-item.flex-col.flex-1.content
        [:div.flex.flex-row
         [:div.ml-2.font-bold "Starred pages"]]
        (for [page starred]
          (let [encoded-page (util/url-encode page)]
            [:a.mt-1.flex.items-center.pl-2.py-2.text-base.leading-6
             {:key encoded-page
              :href (str "/page/" encoded-page)}
             (util/capitalize-all page)]))])]))
