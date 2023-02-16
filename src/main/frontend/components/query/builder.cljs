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
  [:div.filter-item
   (ui/select [{:label "Blocks"
                :value "block"
                :selected (= @*find :block)}
               {:label "Pages"
                :value "page"
                :selected (= @*find :page)}]
     (fn [v]
       (reset! *find (keyword v))))])

(defn- select
  ([items on-chosen]
   (select items on-chosen {}))
  ([items on-chosen options]
   (component-select/select (merge
                             {:items items
                              :on-chosen on-chosen
                              :extract-fn nil}
                             options))))

(defn append-tree!
  [*tree {:keys [toggle-fn toggle?]
          :or {toggle? true}} loc x]
  (swap! *tree #(query-builder/append-element % loc x))
  (when toggle? (toggle-fn)))

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

(defonce *shown-datepicker (atom nil))
(defonce *between-dates (atom {}))
(rum/defcs datepicker < rum/reactive
  (rum/local nil ::input-value)
  {:init (fn [state]
           (when (:auto-focus (last (:rum/args state)))
             (reset! *shown-datepicker (first (:rum/args state))))
           state)
   :will-unmount (fn [state]
                   (swap! *between-dates dissoc (first (:rum/args state)))
                   state)}
  [state id placeholder {:keys [auto-focus tree loc clause]}]
  (let [*input-value (::input-value state)
        show? (= id (rum/react *shown-datepicker))]
    [:div.ml-4
     [:input.query-builder-datepicker.form-input.block.sm:text-sm.sm:leading-5
      {:auto-focus (or auto-focus false)
       :placeholder placeholder
       :aria-label placeholder
       :value @*input-value
       :on-click #(reset! *shown-datepicker id)}]
     (when show?
       (ui/datepicker nil {:on-change (fn [_e date]
                                        (let [journal-date (date/journal-name date)]
                                          (reset! *input-value journal-date)
                                          (reset! *shown-datepicker nil)
                                          (swap! *between-dates assoc id journal-date)))}))]))

(rum/defcs between <
  (rum/local nil ::start)
  (rum/local nil ::end)
  [state {:keys [tree loc clause] :as opts}]
  [:div
   [:div.flex.flex-row
    [:div.font-medium.mt-2 "Between: "]
    (datepicker :start "Start date" (merge opts {:auto-focus true}))
    (datepicker :end "End date (optional)" opts)]
   (ui/button "Submit"
     :on-click (fn []
                 (let [{:keys [start end]} @*between-dates]
                   (when start
                     (let [clause (cond-> [:between start]
                                    (some? end)
                                    (conj end))]
                       (append-tree! tree opts loc clause)
                       (reset! *between-dates {}))))))])

(rum/defcs option-item < rum/reactive
  {:init (fn [state]
           (assoc state ::checked? (atom (first (:rum/args state)))))}
  [state _checked? value on-click]
  (let [*checked? (::checked? state)]
    [:div.flex.flex-row.items-center
     {:on-mouse-down (fn [e] (util/stop e)
                       (swap! *checked? not)
                       (on-click @*checked? value))}
     (ui/checkbox {:checked (rum/react *checked?)})
     value]))

(rum/defcs picker <
  (rum/local nil ::mode)                ; pick mode
  (rum/local nil ::property)
  [state *find *tree loc clause {:keys [toggle-fn] :as opts}]
  (let [*mode (::mode state)
        *property (::property state)
        repo (state/get-current-repo)
        filters (if (= @*find :block)
                  query-builder/block-filters
                  query-builder/page-filters)
        filters-and-ops (concat filters query-builder/operators)
        operator? #(contains? query-builder/operators-set (keyword %))]
    [:div.query-builder-picker
     (if @*mode
       (when-not (operator? @*mode)
         [:div.ml-2.mt-2
          (case @*mode
            "namespace"
            (let [items (sort (db-model/get-all-namespace-parents repo))]
              (select items
                (fn [value]
                  (append-tree! *tree opts loc [:namespace value]))))

            "tags"
            (let [items (->> (db-model/get-all-tagged-pages repo)
                             (map second)
                             sort)]
              (select items
                (fn [value]
                  (append-tree! *tree opts loc [:page-tags value]))))

            "property"
            (let [properties (search/get-all-properties)]
              (select properties
                (fn [value]
                  (reset! *mode "property-value")
                  (reset! *property (keyword value)))))

            "property-value"
            (let [values (cons "Select all" (db-model/get-property-values @*property))]
              (select values
                (fn [value]
                  (let [x (if (= value "Select all")
                            [:property @*property]
                            [:property @*property value])]
                    (reset! *property nil)
                    (append-tree! *tree opts loc x)))))

            "sample"
            (select (range 1 101)
              (fn [value]
                (append-tree! *tree opts loc [:sample (util/safe-parse-int value)])))

            "task"
            (select db-default/built-in-markers
              (fn [value]
                (append-tree! *tree opts loc [:task value])))

            "priority"
            (select db-default/built-in-priorities
              (fn [value]
                (append-tree! *tree opts loc [:priority value])))

            "page"
            (let [pages (sort (db-model/get-all-page-original-names repo))]
              (select pages
                (fn [value]
                  (append-tree! *tree opts loc [:page value]))))

            "page-ref"
            (let [pages (sort (db-model/get-all-page-original-names repo))]
              (select pages
                (fn [value]
                  (append-tree! *tree opts loc [:page-ref value]))
                {}
                ;; {:item-cp (fn [value]
                ;;             (option-item false value (fn [checked? value]
                ;;                                        (append-tree! *tree (assoc opts :toggle? false) loc [:page-ref value]))))}
                ))

            "full-text-search"
            (search (fn [v] (append-tree! *tree opts loc v))
                    (:toggle-fn opts))

            "between"
            (between (merge opts
                            {:tree *tree
                             :loc loc
                             :clause clause}))

            nil)])
       (select
         (map name filters-and-ops)
         (fn [value]
           (cond
             (= value "all-tags")
             (append-tree! *tree opts loc [:all-page-tags])

             (operator? value)
             (append-tree! *tree opts loc [(keyword value)])

             :else
             (reset! *mode value)))
         {:input-default-placeholder "Add operator/filter"}))]))

(rum/defc add-filter
  [*find *tree loc clause]
  (ui/dropdown
   (fn [{:keys [toggle-fn]}]
     [:a.flex {:title "Add clause"
               :on-click toggle-fn}
      (ui/icon "plus" {:style {:font-size 20}})])
   (fn [{:keys [toggle-fn]}]
     (picker *find *tree loc clause {:toggle-fn toggle-fn}))
   {:modal-class (util/hiccup->class
                  "origin-top-right.absolute.left-0.mt-2.ml-2.rounded-md.shadow-lg")}))

(declare clauses-group)

(defn- dsl-human-output
  [clause]
  (let [f (first clause)]
    (cond
      (string? clause)
      (str "search: " clause)

      (= f :tags)
      (str "# (second clause)")

      (= f :property)
      (str (name (second clause)) ": " (last clause))

      (= f :between)
      (str "between: " (second clause) " - " (last clause))

      (= 2 (count clause))
      (str (name f) ": " (second clause))

      :else
      (str (query-builder/->dsl clause)))))

(rum/defc clause-inner
  [*tree *find loc clause & {:keys [operator?]}]
  (ui/dropdown
   (fn [{:keys [toggle-fn]}]
     (if operator?
       [:a.flex.text-sm {:on-click toggle-fn}
        clause]

       [:div.flex.flex-row.items-center.gap-2.p-1.rounded.border
        [:a.flex {:on-click toggle-fn}
         (dsl-human-output clause)]]))
   (fn [{:keys [toggle-fn]}]
     [:div.p-4.flex.flex-col.gap-2
      [:a {:title "Delete"
           :on-click (fn []
                       (swap! *tree (fn [q]
                                      (let [loc' (if operator? (vec (butlast loc)) loc)]
                                        (query-builder/remove-element q loc'))))
                       (toggle-fn))}
       "Delete (X)"]

      [:div.font-medium.text-sm "Wrap with: "]
      [:div.flex.flex-row.gap-2
       (for [op query-builder/operators]
         (ui/button (string/upper-case (name op))
           :intent "logseq"
           :small? true
           :on-click (fn []
                       (swap! *tree (fn [q]
                                      (let [loc' (if operator? (vec (butlast loc)) loc)]
                                        (query-builder/wrap-operator q loc' op))))
                       (toggle-fn))))]

      (when operator?
        [:div
         [:div.font-medium.text-sm "Replace with: "]
         [:div.flex.flex-row.gap-2
          (for [op (remove #{(keyword (string/lower-case clause))} query-builder/operators)]
            (ui/button (string/upper-case (name op))
              :intent "logseq"
              :small? true
              :on-click (fn []
                          (swap! *tree (fn [q]
                                         (query-builder/replace-element q loc op)))
                          (toggle-fn))))]])])
   {:modal-class (util/hiccup->class
                  "origin-top-right.absolute.left-0.mt-2.ml-2.rounded-md.shadow-lg.w-64")}))

(rum/defc clause
  [*tree *find loc clause]
  (when (seq clause)
    [:div.query-builder-clause
     (let [kind (keyword (first clause))]
       (if (query-builder/operators-set kind)
         [:div.operator-clause.flex.flex-row.items-center {:data-level (count loc)}
          [:div.text-4xl.mr-1.font-thin "{"]
          (clauses-group *tree *find (conj loc 0) kind (rest clause))
          [:div.text-4xl.ml-1.font-thin "}"]]
         (clause-inner *tree *find loc clause)))]))

(rum/defc clauses-group
  [*tree *find loc kind clauses]
  [:div.flex.flex-row.gap-1.flex-wrap.items-center
   (when-not (and (= loc [0])
                  (= kind :and)
                  (<= (count clauses) 1))
     (clause-inner *tree *find loc
                   (string/upper-case (name kind))
                   :operator? true))

   (map-indexed (fn [i item]
                  (clause *tree *find (update loc (dec (count loc)) #(+ % i 1)) item))
                clauses)

   (when (not= loc [0])
     (add-filter *find *tree loc []))])

;; '(and (page-ref foo) (property key value))
(rum/defc clause-tree < rum/reactive
  [*tree *find]
  (let [tree (rum/react *tree)
        kind ((set query-builder/operators) (first tree))
        [kind' clauses] (if kind
                          [kind (rest tree)]
                          [:and [@tree]])]
    (clauses-group *tree *find [0] kind' clauses)))

(rum/defcs builder <
  (rum/local :block ::find)
  (rum/local [:and] ::tree)
  [state]
  (let [*find (::find state)
        *tree (::tree state)]
    [:div.cp__query-builder
     [:div.cp__query-builder-filter
      (page-block-selector *find)
      (clause-tree *tree *find)
      (add-filter *find *tree [0] [])]]))
