(ns frontend.components.query.builder
  "DSL query builder."
  (:require [frontend.ui :as ui]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.query.builder :as query-builder]
            [frontend.components.select :as component-select]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.search :as search]
            [frontend.mixins :as mixins]
            [logseq.db.default :as db-default]
            [rum.core :as rum]
            [clojure.string :as string]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.page-ref :as page-ref]))

(rum/defc page-block-selector
  [*find]
  [:div.filter-item {:on-mouse-down (fn [e] (util/stop-propagation e))}
   (ui/select [{:label "Blocks"
                :value "block"
                :selected (not= @*find :page)}
               {:label "Pages"
                :value "page"
                :selected (= @*find :page)}]
     (fn [e v]
       ;; Prevent opening the current block's editor
       (util/stop e)
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
  [state id placeholder {:keys [auto-focus]}]
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
  [state {:keys [tree loc] :as opts}]
  [:div.between-date {:on-mouse-down (fn [e] (util/stop-propagation e))}
   [:div.flex.flex-row
    [:div.font-medium.mt-2 "Between: "]
    (datepicker :start "Start date" (merge opts {:auto-focus true}))
    (datepicker :end "End date" opts)]
   (ui/button "Submit"
     :on-click (fn []
                 (let [{:keys [start end]} @*between-dates]
                   (when (and start end)
                     (let [clause [:between start end]]
                       (append-tree! tree opts loc clause)
                       (reset! *between-dates {}))))))])

(defn- query-filter-picker
  [state *find *tree loc clause opts]
  (let [*mode (::mode state)
        *property (::property state)
        repo (state/get-current-repo)]
    [:div
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
                             [(if (= @*find :page) :page-property :property) @*property]
                             [(if (= @*find :page) :page-property :property) @*property value])]
                     (reset! *property nil)
                     (append-tree! *tree opts loc x)))))

       "sample"
       (select (range 1 101)
               (fn [value]
                 (append-tree! *tree opts loc [:sample (util/safe-parse-int value)])))

       "task"
       (select db-default/built-in-markers
               (fn [value]
                 (when (seq value)
                   (append-tree! *tree opts loc (vec (cons :task value)))))
               {:multiple-choices? true
                ;; Need the existing choices later to improve the UX
                :selected-choices #{}
                :prompt-key :select/default-select-multiple
                :close-modal? false
                :on-apply (:toggle-fn opts)})

       "priority"
       (select db-default/built-in-priorities
         (fn [value]
           (when (seq value)
             (append-tree! *tree opts loc (vec (cons :priority value)))))
         {:multiple-choices? true
          :selected-choices #{}
          :prompt-key :select/default-select-multiple
          :close-modal? false
          :on-apply (:toggle-fn opts)})

       "page"
       (let [pages (sort (db-model/get-all-page-original-names repo))]
         (select pages
                 (fn [value]
                   (append-tree! *tree opts loc [:page value]))))

       "page reference"
       (let [pages (sort (db-model/get-all-page-original-names repo))]
         (select pages
                 (fn [value]
                   (append-tree! *tree opts loc [:page-ref value]))
                 {}))

       "full text search"
       (search (fn [v] (append-tree! *tree opts loc v))
               (:toggle-fn opts))

       "between"
       (between (merge opts
                       {:tree *tree
                        :loc loc
                        :clause clause}))

       nil)]))

(rum/defcs picker <
  {:will-mount (fn [state]
                 (state/clear-selection!)
                 state)}
  (rum/local nil ::mode)                ; pick mode
  (rum/local nil ::property)
  [state *find *tree loc clause opts]
  (let [*mode (::mode state)
        filters (if (= :page @*find)
                  query-builder/page-filters
                  query-builder/block-filters)
        filters-and-ops (concat filters query-builder/operators)
        operator? #(contains? query-builder/operators-set (keyword %))]
    [:div.query-builder-picker
     (if @*mode
       (when-not (operator? @*mode)
         (query-filter-picker state *find *tree loc clause opts))
       [:div
        (when-not @*find
          [:div.flex.flex-row.items-center.p-2.justify-between
           [:div.ml-2 "Find: "]
           (page-block-selector *find)])
        (when-not @*find
          [:hr.m-0])
        (select
          (map name filters-and-ops)
          (fn [value]
            (cond
              (= value "all page tags")
              (append-tree! *tree opts loc [:all-page-tags])

              (operator? value)
              (append-tree! *tree opts loc [(keyword value)])

              :else
              (reset! *mode value)))
          {:input-default-placeholder "Add filter/operator"})])]))

(rum/defc add-filter
  [*find *tree loc clause]
  (ui/dropdown
   (fn [{:keys [toggle-fn]}]
     [:a.flex.add-filter {:title "Add clause"
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

      (= (keyword f) :page-ref)
      (page-ref/->page-ref (second clause))

      (= (keyword f) :page-tags)
      (cond
        (string? (second clause))
        (str "#" (second clause))
        (symbol? (second clause))
        (str "#" (str (second clause)))
        :else
        (str "#" (second (second clause))))

      (contains? #{:property :page-property} (keyword f))
      (str (name (second clause)) ": "
           (cond
             (and (vector? (last clause)) (= :page-ref (first (last clause))))
             (second (last clause))

             (= 2 (count clause))
             "ALL"

             :else
             (last clause)))

      (= (keyword f) :between)
      (let [start (if (or (keyword? (second clause))
                          (symbol? (second clause)))
                    (name (second clause))
                    (second (second clause)))
            end (if (or (keyword? (last clause))
                        (symbol? (last clause)))
                  (name (last  clause))
                  (second (last clause)))]
        (str "between: " start " ~ " end))

      (contains? #{:task :priority} (keyword f))
      (str (name f) ": "
           (string/join " | " (rest clause)))

      (contains? #{:page :task :namespace} (keyword f))
      (str (name f) ": " (if (vector? (second clause))
                           (second (second clause))
                           (second clause)))

      (= 2 (count clause))
      (str (name f) ": " (second clause))

      :else
      (str (query-builder/->dsl clause)))))

(rum/defc clause-inner
  [*tree loc clause & {:keys [operator?]}]
  (ui/dropdown
   (fn [{:keys [toggle-fn]}]
     (if operator?
       [:a.flex.text-sm.query-clause {:on-click toggle-fn}
        clause]

       [:div.flex.flex-row.items-center.gap-2.p-1.rounded.border.query-clause-btn
        [:a.flex.query-clause {:on-click toggle-fn}
         (dsl-human-output clause)]]))
   (fn [{:keys [toggle-fn]}]
     [:div.p-4.flex.flex-col.gap-2
      [:a {:title "Delete"
           :on-click (fn []
                       (swap! *tree (fn [q]
                                      (let [loc' (if operator? (vec (butlast loc)) loc)]
                                        (query-builder/remove-element q loc'))))
                       (toggle-fn))}
       "Delete"]

      (when operator?
        [:a {:title "Unwrap this operator"
             :on-click (fn []
                         (swap! *tree (fn [q]
                                        (let [loc' (vec (butlast loc))]
                                          (query-builder/unwrap-operator q loc'))))
                         (toggle-fn))}
         "Unwrap"])

      [:div.font-medium.text-sm "Wrap this filter with: "]
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
          [:div.clause-bracket "("]
          (clauses-group *tree *find (conj loc 0) kind (rest clause))
          [:div.clause-bracket ")"]]
         (clause-inner *tree loc clause)))]))

(rum/defc clauses-group
  [*tree *find loc kind clauses]
  (let [parens? (and (= loc [0])
                     (> (count clauses) 1))]
    [:div.clauses-group
     (when parens? [:div.clause-bracket "("])
     (when-not (and (= loc [0])
                    (= kind :and)
                    (<= (count clauses) 1))
       (clause-inner *tree loc
                     (string/upper-case (name kind))
                     :operator? true))

     (map-indexed (fn [i item]
                    (clause *tree *find (update loc (dec (count loc)) #(+ % i 1)) item))
                  clauses)

     (when parens? [:div.clause-bracket ")"])

     (when (not= loc [0])
       (add-filter *find *tree loc []))]))

(rum/defc clause-tree < rum/reactive
  [*tree *find]
  (let [tree (rum/react *tree)
        kind ((set query-builder/operators) (first tree))
        [kind' clauses] (if kind
                          [kind (rest tree)]
                          [:and [@tree]])]
    (clauses-group *tree *find [0] kind' clauses)))

(rum/defcs builder <
  (rum/local nil ::find)
  {:init (fn [state]
           (let [q-str (first (:rum/args state))
                 query (gp-util/safe-read-string
                        query-dsl/custom-readers
                        (query-dsl/pre-transform-query q-str))
                 query' (cond
                          (contains? #{'and 'or 'not} (first query))
                          query

                          query
                          [:and query]

                          :else
                          [:and])
                 tree (query-builder/from-dsl query')
                 *tree (atom tree)
                 config (last (:rum/args state))]
             (add-watch *tree :updated (fn [_ _ _old _new]
                                         (when-let [block (:block config)]
                                           (let [q (if (= [:and] @*tree)
                                                     ""
                                                     (let [result (query-builder/->dsl @*tree)]
                                                       (if (string? result)
                                                         (util/format "\"%s\"" result)
                                                         (str result))))
                                                 repo (state/get-current-repo)
                                                 block (db/pull [:block/uuid (:block/uuid block)])]
                                             (when block
                                               (let [content (string/replace (:block/content block)
                                                                             (util/format "{{query %s" q-str)
                                                                             (util/format "{{query %s" q))]
                                                 (editor-handler/save-block! repo (:block/uuid block) content)))))))
             (assoc state ::tree *tree)))
   :will-mount (fn [state]
                 (let [q-str (first (:rum/args state))
                       parsed-query (query-dsl/parse-query q-str)
                       blocks-query? (:blocks? parsed-query)
                       find-mode (cond
                                   blocks-query?
                                   :block
                                   (false? blocks-query?)
                                   :page
                                   :else
                                   nil)]
                   (when find-mode (reset! (::find state) find-mode))
                   state))}
  [state _query _config]
  (let [*find (::find state)
        *tree (::tree state)]
    [:div.cp__query-builder
     [:div.cp__query-builder-filter
      (when (and (seq @*tree)
                 (not= @*tree [:and]))
        (clause-tree *tree *find))
      (add-filter *find *tree [0] [])]]))
