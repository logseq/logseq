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
            [frontend.mixins :as mixins]
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

(defn append-tree!
  [*tree *show-picker? loc x]
  (swap! *tree #(query-builder/append-element % loc x))
  (reset! *show-picker? false))

(rum/defcs search < (rum/local nil ::input-value)
  (mixins/event-mixin
   (fn [state]
     (mixins/on-key-down
      state
      {;; enter
       13 (fn [state e]
            (let [input-value (get state ::input-value)]
              (when-not (string/blank? @input-value)
                (util/stop e)
                (let [on-submit (first (:rum/args state))]
                  (on-submit @input-value))
                (reset! input-value nil))))
       ;; escape
       27 (fn [_state _e]
            (let [[_on-submit on-cancel] (:rum/args state)]
              (on-cancel)))})))
  [state _on-submit _on-cancel]
  (let [*input-value (::input-value state)]
    [:input#query-builder-search.form-input.block.sm:text-sm.sm:leading-5
    {:auto-focus true
     :placeholder "Full text search"
     :aria-label "Full text search"
     :on-change #(reset! *input-value (util/evalue %))}]))

(rum/defcs picker <
  (rum/local nil ::mode)                ; pick mode
  [state *find *tree *show-picker? loc]
  (let [*mode (::mode state)
                repo (state/get-current-repo)
        filters (if (= @*find :block)
                  query-builder/block-filters
                  query-builder/page-filters)
        filters-and-ops (concat filters query-builder/operators)
        operator? #(contains? query-builder/operators-set (keyword %))]
    [:div.query-builder-picker.mt-8
     (if @*mode
       (when-not (operator? @*mode)
         [:div.ml-2.mt-2
          (case @*mode
            "namespace"
            (let [items (sort (db-model/get-all-namespace-parents repo))]
              (select items
                (fn [value]
                  (append-tree! *tree *show-picker? loc [:namespace value]))))

            "tags"
            (let [items (->> (db-model/get-all-tagged-pages repo)
                             (map second)
                             sort)]
              (select items
                (fn [value]
                  (append-tree! *tree *show-picker? loc [:page-tags value]))))

            "property"
            (let [properties (search/get-all-properties)]
              (select properties
                (fn [value]
                  (append-tree! *tree *show-picker? loc [:property (keyword value)]))))

            "sample"
            (select (range 1 101)
              (fn [value]
                (append-tree! *tree *show-picker? loc [:sample (util/safe-parse-int value)])))

            "task"
            (select db-default/built-in-markers
              (fn [value]
                (append-tree! *tree *show-picker? loc [:task value])))

            "priority"
            (select db-default/built-in-priorities
              (fn [value]y
                (append-tree! *tree *show-picker? loc [:priority value])))

            "page"
            (let [pages (sort (db-model/get-all-page-original-names repo))]
              (select pages
                (fn [value]
                  (append-tree! *tree *show-picker? loc [:page value]))))

            "page-ref"
            (let [pages (sort (db-model/get-all-page-original-names repo))]
              (select pages
                (fn [value]
                  (append-tree! *tree *show-picker? loc [:page-ref value]))))

            "full-text-search"
            (search (fn [v] (append-tree! *tree *show-picker? loc v))
                    (fn [] (reset! *show-picker? false)))

            "between"
            "todo" ; start - date picker, end(optional) - date picker

            nil)])
       (select
         (map name filters-and-ops)
         (fn [value]
           (cond
             (= value "all-tags")
             (append-tree! *tree *show-picker? loc [:all-page-tags])

             (operator? value)
             (append-tree! *tree *show-picker? loc (keyword value))

             :else
             (reset! *mode value)))
         {:input-default-placeholder "Add operator/filter"}))]))

(rum/defcs actions < (rum/local false ::show-picker?)
  [state *find *tree loc {:keys [group?]}]
  (let [*show-picker? (::show-picker? state)]
    [:div
     [:div.query-builder-filters.flex.flex-row.items-center
      (when group?
        [:div
         [:a.grid {:title "Add clause"
              :on-click #(reset! *show-picker? true)}
          (ui/icon "circle-plus" {:style {:font-size 20}})]])

      [:div.flex.flex-row.items-center
       (for [op query-builder/operators]
         [:a.ml-2.grid {:title (str "Wrapped by " (name op) " operator")
                        :on-click (fn []
                                    (let [loc' (if group? (vec (butlast loc)) loc)]
                                      (swap! *tree (fn [q] (query-builder/wrap-operator q loc' op)))))}
          (str "(" (name op) ")")])]

      [:a.grid.ml-2 {:title "Remove this clause"
                     :on-click (fn []
                                 (let [loc' (if group? (vec (butlast loc)) loc)]
                                   (swap! *tree (fn [q]
                                                  (query-builder/remove-element q loc')))))}
       (ui/icon "x" {:style {:font-size 20}})]]

     (when @*show-picker?
       (picker *find *tree *show-picker? loc))]))

(declare clauses-group)

(rum/defc clause
  [*tree *find loc clause]
  (when (seq clause)
    [:div.query-builder-clause.p-1
     (let [kind (keyword (first clause))]
       (if (query-builder/operators-set kind)
         (clauses-group *tree *find (conj loc 0) kind (rest clause))

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
  [:div.border.p-1.grid.grid-flow-col.auto-cols-max.gap-1
   [:div.text-xs.font-bold.uppercase.toned-down.mr-2.grow
    (name kind)]

   [:div
    [:div
     (map-indexed (fn [i item]
                    (clause *tree *find (update loc (dec (count loc))
                                                #(+ % i 1)) item))
                  clauses)]
    (rum/with-key (actions *find *tree loc {:group? true})
      (str loc))]])

;; '(and (page-ref foo) (property key value))
(rum/defc clause-tree < rum/reactive
  [*tree *find]
  (let [tree (rum/react *tree)
        kind ((set query-builder/operators) (first tree))
        [kind' clauses] (if kind
                          [kind (rest tree)]
                          [:and [@tree]])]
    (clauses-group *tree *find [0] kind' clauses)))

(rum/defc query < rum/reactive
  [*tree]
  [:div
   "Query: "
   (str (query-builder/->dsl (rum/react *tree)))])

(rum/defcs builder <
  (rum/local :block ::find)
  (rum/local '() ::tree)
  [state]
  (let [*find (::find state)
        *tree (::tree state)

        ;; debug
        *tree (atom
               [:and]
               ;; '(and (page-ref foo)
               ;;            (property key value)
               ;;            (or (page-ref bar)
               ;;                (page-ref baz)))
               )]
    [:div.cp__query-builder
     (page-block-selector *find)
     (clause-tree *tree *find)
     (query *tree)]))
