(ns frontend.components.query.builder
  "DSL query builder."
  (:require [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.clock :as clock]
            [frontend.util.property :as property]
            [frontend.format.block :as block]
            [medley.core :as medley]
            [rum.core :as rum]
            [frontend.modules.outliner.tree :as tree]))

(rum/defc page-block-selector
  [*find]
  [:div.flex.flex-row
   [:div.mr-2 "Find: "]
   (ui/radio-list [{:label "Blocks"
                    :value "block"
                    :selected (= @*find :block)}
                   {:label "Pages"
                    :value "page"
                    :selected (= @*find :page)}]
                  (fn [v]
                    (reset! *find (keyword v)))
                  nil)])

(rum/defc filter-item
  [text on-click]
  [:div
   [:a {:on-click on-click}
    text]])

(rum/defc filters
  [*find *tree]
  [:div.query-builder-filters.flex.flex-row.items-center
   (ui/icon "circle-plus" {:style {:font-size 20}})
   [:div.ml-1
    (if (= @*find :block)
      [:div.grid.grid-cols-4.gap-1
       (filter-item "Page reference" #(reset! *tree '(page-ref)))
       (filter-item "Property" #(reset! *tree '(property)))]
      [:div
       (filter-item "Property" #(reset! *tree '(property)))])]])

(rum/defc clause
  [*tree position clause]
  )

;; '(and (page-ref foo) (property key value))
(rum/defc clause-tree
  [*tree]
  (map @*tree))

(rum/defc query
  [*tree]
  [:div
   "Query: "
   (str @*tree)])

(rum/defcs builder <
  (rum/local :block ::find)
  (rum/local '() ::tree)
  [state]
  (let [*find (::find state)
        *tree (::tree state)]
    [:div.query-builder.mt-2.ml-2
     (page-block-selector *find)
     (filters *find *tree)
     [:hr]
     (clause-tree *tree)
     [:hr]
     (query *tree)]))
