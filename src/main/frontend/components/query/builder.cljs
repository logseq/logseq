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
            [frontend.modules.outliner.tree :as tree]
            [clojure.string :as string]))

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

(rum/defc actions
  [*find *tree pos {:keys [group?]}]
  [:div.query-builder-filters.flex.flex-row.items-center
   (when group?
     [:a {:title "Add clause"
          :on-click (fn [])}
      (ui/icon "circle-plus" {:style {:font-size 20}})])

   [:a.ml-2 {:title "Wrap by (and/or/not)"
             :on-click (fn [])}
    (ui/icon "parentheses" {:style {:font-size 20}})]

   [:a.ml-2 {:title "Remove this clause"
             :on-click (fn [])}
    (ui/icon "x" {:style {:font-size 20}})]


   ;; [:div.ml-1
   ;;  (if (= @*find :block)
   ;;    [:div.grid.grid-cols-4.gap-1
   ;;     (filter-item "Page reference" #(reset! *tree '(page-ref)))
   ;;     (filter-item "Property" #(reset! *tree '(property)))]
   ;;    [:div
   ;;     (filter-item "Property" #(reset! *tree '(property)))])]
   ])

(declare clauses-group)

(rum/defc clause
  [*tree *find pos clause]
  [:div.query-builder-clause.p-1
   (let [kind (keyword (first clause))]
     (if (#{:and :or :not} kind)
       (clauses-group *tree *find pos kind (rest clause))

       [:div.flex.flex-row.items-center
        (case kind
          :page-ref
          [:div
           [:span.mr-1 "Page reference:"]
           [:span (str (second clause))]]

          ;; :property
          (str clause))

        (actions *find *tree pos {:group? false})]))])

(rum/defc clauses-group
  [*tree *find pos kind clauses]
  [:div.flex.flex-row.border.p-1
   [:div.text-xs.font-bold.uppercase.toned-down.mr-2
    (name kind)]

   [:div.flex.flex-col
    [:div
     (map-indexed (fn [i item]
                    (clause *tree *find (conj pos i) item))
                  clauses)]
    (actions *find *tree pos {:group? true})]])

;; '(and (page-ref foo) (property key value))
(rum/defc clause-tree
  [*tree *find]
  (let [kind (#{:and :or :not} (keyword (string/lower-case (str (first @*tree)))))
        [kind' clauses] (if kind
                          [kind (rest @*tree)]
                          [:and [@*tree]])]
    (clauses-group *tree *find [0] kind' clauses)))

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
        *tree (::tree state)

        ;; debug
        *tree (atom '(and (page-ref foo)
                          (property key value)
                          (or (page-ref bar)
                              (page-ref baz))))
        ]
    [:div.query-builder.mt-2.ml-2
     (page-block-selector *find)
     [:hr]
     (clause-tree *tree *find)
     [:hr]
     (query *tree)]))
