(ns frontend.components.right-sidebar
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.components.page :as page]
            [frontend.handler :as handler]
            [frontend.state :as state]
            [medley.core :as medley]))

(defn sidebar-item
  [block-type block-data]
  (case block-type
    :page-ref
    ["Page reference" (str block-data)]

    :heading-ref
    ["Block reference" (str block-data)]

    :heading
    ["Block " (str block-data)]

    :page
    (let [page-name (:name block-data)]
      [page-name (page/page {:parameters {:path {:name page-name}}
                             :sidebar? true})])

    ["" [:span]]))

(rum/defc sidebar < rum/reactive
  []
  (let [blocks (state/sub :sidebar/blocks)]
    [:div#right-sidebar.flex.flex-col.p-2.shadow-xs.overflow-y-auto {:style {:padding-bottom 300}}
     (for [[idx [block-type block-data]] (medley/indexed blocks)]
       [:div.sidebar-item {:key (str "sidebar-block-" idx)}
        (let [[title component] (sidebar-item block-type block-data)]
          [:div.flex.flex-col
           [:div.flex.flex-row.justify-between
            [:div.flex.flex-row.justify-center
             [:a.hover:text-gray-900.text-gray-500.flex.items-center
              svg/plus]
             [:div.ml-2 {:style {:font-size "1.5rem"}} title]]
            [:a.close.hover:text-gray-900.text-gray-500.flex.items-center
             {:on-click (fn []
                          (state/sidebar-remove-block! idx)
                          (when (empty? (state/get-sidebar-blocks))
                            (handler/hide-right-sidebar)))}
             svg/close]]
           [:div component]])])]))
