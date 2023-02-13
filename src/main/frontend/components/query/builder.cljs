(ns frontend.components.query.builder
  "DSL query builder."
  (:require [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.query.builder :as query-builder]
            [frontend.components.select :as component-select]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.clock :as clock]
            [frontend.util.property :as property]
            [frontend.format.block :as block]
            [frontend.search :as search]
            [logseq.db.default :as db-default]
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

(defn- select
  ([items on-chosen]
   (select items on-chosen {}))
  ([items on-chosen options]
   (prn {:opts (merge
                {:items items
                 :on-chosen on-chosen}
                options)})
   (component-select/select (merge
                             {:items items
                              :on-chosen on-chosen
                              :extract-fn nil}
                             options))))

(rum/defcs picker <
  (rum/local nil ::mode)
  [state *find *tree loc]
  (prn {:loc loc})
  (let [*mode (::mode state)
        repo (state/get-current-repo)
        filters (if (= @*find :block)
                  query-builder/block-filters
                  query-builder/page-filters)
        filters-and-ops (concat filters query-builder/operators)
        operator? #(contains? (set query-builder/operators) (keyword %))]
    [:div.query-builder-picker.mt-8
     (when-not @*mode
       (select
         (map name filters-and-ops)
         (fn [value]
           (when (operator? value)
             ;; TODO
             (prn "operator")
             )
           (reset! *mode value))
         {:input-default-placeholder "Add operator/filter"}))
     (when-not (operator? @*mode)
       [:div.ml-2.mt-2
        (case @*mode
          "all-tags"
          "todo" ; insert (all-page-tags) into query

          "namespace"
          (let [items (sort (db-model/get-all-namespace-parents repo))]
            (select items
              (fn [value]
                (prn "chosen " value))))

          "tags"
          (let [items (->> (db-model/get-all-tagged-pages repo)
                           (map second)
                           sort)]
            (select items
              (fn [value]
                (prn "chosen " value))))

          "property"
          (let [properties (search/get-all-properties)]
            (select properties
             (fn [value]
               (prn "chosen " value))))

          "sample"
          (select (range 1 101)
             (fn [value]
               (prn "chosen " value)))

          "task"
          (select db-default/built-in-markers
            (fn [value]
              (prn "chosen " value)))

          "priority"
          (select db-default/built-in-priorities
            (fn [value]
              (prn "chosen " value)))

          "page"
          (let [pages (sort (db-model/get-all-page-original-names repo))]
            (select pages
             (fn [value]
               (prn "chosen " value))))

          "full-text-search"
          "todo" ; string input

          "between"
          "todo" ; start - date picker, end(optional) - date picker

          "page-ref"
          (let [pages (sort (db-model/get-all-page-original-names repo))]
            (select pages
              (fn [value]
                (prn "chosen " value))))

          nil)])]))

(rum/defcs actions < (rum/local false ::show-picker?)
  [state *find *tree loc {:keys [group?]}]
  (let [*show-picker? (::show-picker? state)]
    [:div
     [:div.query-builder-filters.flex.flex-row.items-center
      (when group?
        [:div
         [:a {:title "Add clause"
              :on-click #(reset! *show-picker? true)}
          (ui/icon "circle-plus" {:style {:font-size 20}})]])

      [:a.ml-2 {:title "Wrap by (and/or/not)"
                :on-click (fn [])}
       (ui/icon "parentheses" {:style {:font-size 20}})]

      [:a.ml-2 {:title "Remove this clause"
                :on-click (fn [])}
       (ui/icon "x" {:style {:font-size 20}})]]

     (when @*show-picker?
       (picker *find *tree loc))]))

(declare clauses-group)

(rum/defc clause
  [*tree *find loc clause]
  (when (seq clause)
    [:div.query-builder-clause.p-1
     (let [kind (keyword (first clause))]
       (if (#{:and :or :not} kind)
         (clauses-group *tree *find loc kind (rest clause))

         [:div.flex.flex-row.items-center
          (case kind
            :page-ref
            [:div
             [:span.mr-1 "Page reference:"]
             [:span (str (second clause))]]

            ;; :property
            (str clause))

          (rum/with-key
            (actions *find *tree loc {:group? false})
            (str loc))]))]))

(rum/defc clauses-group
  [*tree *find loc kind clauses]
  [:div.flex.flex-row.border.p-1
   [:div.text-xs.font-bold.uppercase.toned-down.mr-2
    (name kind)]

   [:div.flex.flex-col
    [:div
     (map-indexed (fn [i item]
                    (clause *tree *find (conj loc i) item))
                  clauses)]
    (rum/with-key (actions *find *tree loc {:group? true})
      (str loc))]])

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
        *tree (atom
               []
               ;; '(and (page-ref foo)
               ;;            (property key value)
               ;;            (or (page-ref bar)
               ;;                (page-ref baz)))
               )
        ]
    (defonce debug-tree *tree)
    [:div.query-builder.mt-2.ml-2
     (page-block-selector *find)
     [:hr]
     (clause-tree *tree *find)
     [:hr]
     (query *tree)]))
