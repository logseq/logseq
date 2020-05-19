(ns frontend.components.right-sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.components.page :as page]
            [frontend.components.hiccup :as hiccup]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [frontend.db :as db]
            [medley.core :as medley]))

(rum/defc heading-cp < rum/reactive
  [heading]
  (let [id (:heading/uuid heading)
        heading (db/sub-heading id)]
    (hiccup/heading {:id id
                     :sidebar? true}
                    (assoc heading
                           :heading/show-page? true))))

(defn build-sidebar-item
  [db-id block-type block-data]
  (case block-type
    :page-ref
    ["Page reference"
     [:div.ml-2
      (heading-cp (:heading block-data))]]

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
    [:div.sidebar-item
     (let [[title component] (build-sidebar-item db-id block-type block-data)]
       [:div.flex.flex-col
        [:div.flex.flex-row.justify-between
         [:div.flex.flex-row.justify-center
          [:a.hover:text-gray-900.text-gray-500.flex.items-center.pl-1.pr-1
           {:on-click #(state/sidebar-block-toggle-collapse! db-id)}
           (if collapse?
             (svg/caret-right)
             (svg/caret-down))]
          [:div.ml-1 {:style {:font-size "1.5rem"}} title]]
         [:a.close.hover:text-gray-900.text-gray-500.flex.items-center
          {:on-click (fn []
                       (state/sidebar-remove-block! idx)
                       (when (empty? (state/get-sidebar-blocks))
                         (handler/hide-right-sidebar)))}
          svg/close]]
        [:div {:class (if collapse? "hidden" "initial")}
         component]])]))

(rum/defc sidebar < rum/reactive
  []
  (let [blocks (state/sub :sidebar/blocks)]
    [:div#right-sidebar.flex.flex-col.p-2.shadow-xs.overflow-y-auto.content {:style {:padding-bottom 300}}
     (for [[idx [db-id block-type block-data]] (medley/indexed blocks)]
       (rum/with-key
         (sidebar-item idx db-id block-type block-data)
         (str "sidebar-block-" idx)))]))
