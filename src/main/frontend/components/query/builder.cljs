(ns frontend.components.query.builder
  "DSL query builder."
  (:require [frontend.date :as date]
            [frontend.ui :as ui]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as db-model]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.query.builder :as query-builder]
            [frontend.components.select :as component-select]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [frontend.mixins :as mixins]
            [logseq.graph-parser.db :as gp-db]
            [rum.core :as rum]
            [clojure.string :as string]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [promesa.core :as p]
            [frontend.config :as config]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.sqlite.util :as sqlite-util]
            [frontend.db-mixins :as db-mixins]
            [logseq.db :as ldb]
            [frontend.hooks :as hooks]))

(rum/defc page-block-selector
  [*find]
  [:div.filter-item {:on-pointer-down (fn [e] (util/stop-propagation e))}
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
                             ;; Allow caller to build :items
                             {:items (if (map? (first items))
                                       items
                                       (map #(hash-map :value %) items))
                              :on-chosen on-chosen}
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

(defonce *between-dates (atom {}))
(rum/defcs datepicker < rum/reactive
  (rum/local nil ::input-value)
  {:will-unmount (fn [state]
                   (swap! *between-dates dissoc (first (:rum/args state)))
                   state)}
  [state id placeholder {:keys [auto-focus on-select]}]
  (let [*input-value (::input-value state)]
    [:div.ml-4
     [:input.query-builder-datepicker.form-input.block.sm:text-sm.sm:leading-5
      {:auto-focus (or auto-focus false)
       :data-key (name id)
       :placeholder placeholder
       :aria-label placeholder
       :value (some-> @*input-value (first))
       :on-focus (fn [^js e]
                   (js/setTimeout
                    #(shui/popup-show! (.-target e)
                                       (let [select-handle! (fn [^js d]
                                                              (let [gd (date/js-date->goog-date d)
                                                                    journal-date (date/js-date->journal-title gd)]
                                                                (reset! *input-value [journal-date d])
                                                                (swap! *between-dates assoc id journal-date))
                                                              (some-> on-select (apply []))
                                                              (shui/popup-hide!))]
                                         (ui/single-calendar
                                          {:initial-focus true
                                           :selected (some-> @*input-value (second))
                                           :on-select select-handle!}))
                                       {:id :query-datepicker
                                        :content-props {:class "p-0"}
                                        :align :start}) 16))}]]))

(rum/defcs between <
  (rum/local nil ::start)
  (rum/local nil ::end)
  [state {:keys [tree loc] :as opts}]
  [:div.between-date.p-4 {:on-pointer-down (fn [e] (util/stop-propagation e))}
   [:div.flex.flex-row
    [:div.font-medium.mt-2 "Between: "]
    (datepicker :start "Start date"
                (merge opts {:auto-focus true
                             :on-select (fn []
                                          (when-let [^js end-input (js/document.querySelector ".query-builder-datepicker[data-key=end]")]
                                            (when (string/blank? (.-value end-input))
                                              (.focus end-input))))}))
    (datepicker :end "End date" opts)]
   [:p.pt-2
    (ui/button "Submit"
               :on-click (fn []
                           (let [{:keys [start end]} @*between-dates]
                             (when (and start end)
                               (let [clause [:between [:page-ref start] [:page-ref end]]]
                                 (append-tree! tree opts loc clause)
                                 (reset! *between-dates {}))))))]])

(rum/defc property-select
  [*mode *property *private-property?]
  (let [[properties set-properties!] (rum/use-state nil)
        properties (cond->> properties
                     (not @*private-property?)
                     (remove ldb/built-in?))]
    (hooks/use-effect!
     (fn []
       (p/let [properties (db-async/<get-all-properties {:remove-built-in-property? false
                                                         :remove-non-queryable-built-in-property? true})]
         (set-properties! properties)))
     [])
    [:div.flex.flex-col.gap-1
     [:div.flex.flex-row.justify-between.gap-1.items-center.px-1.pb-1.border-b
      [:label.opacity-50.cursor.select-none.text-sm
       {:for "built-in"}
       "Show built-in properties"]
      (shui/checkbox
       {:id "built-in"
        :value @*private-property?
        :on-checked-change #(reset! *private-property? (not @*private-property?))})]
     (select (map #(hash-map :db/ident (:db/ident %)
                             :value (:block/title %))
                  properties)
             (fn [{value :value db-ident :db/ident}]
               (reset! *mode "property-value")
               (reset! *property (if (config/db-based-graph? (state/get-current-repo))
                                   db-ident
                                   (keyword value)))))]))

(rum/defc property-value-select-inner
  < rum/reactive db-mixins/query
  [repo *property *private-property? *find *tree opts loc values {:keys [db-graph? ref-property? property-type]}]
  (let [;; FIXME: lazy load property values consistently on first call
        ;; Guard against non ref properties like :logseq.property/icon
        _ (when (and db-graph? ref-property?)
            (doseq [id values] (db/sub-block id)))
        values' (if db-graph?
                  (if ref-property?
                    (map #(db-property/property-value-content (db/entity repo %)) values)
                    (if (contains? #{:checkbox :keyword :raw-number :string} property-type)
                      values
                      ;; Don't display non-ref property values as they don't have display and query support
                      []))
                  values)
        values'' (map #(hash-map :value (str %)
                                   ;; Preserve original-value as some values like boolean do not display in select
                                 :original-value %)
                      (cons "Select all" values'))]
    (select values''
            (fn [{:keys [original-value]}]
              (let [k (cond
                        db-graph? (if @*private-property? :private-property :property)
                        (= (rum/react *find) :page) :page-property
                        :else :property)
                    x (if (= original-value "Select all")
                        [k @*property]
                        [k @*property original-value])]
                (reset! *property nil)
                (append-tree! *tree opts loc x))))))

(rum/defc property-value-select
  [repo *property *private-property? *find *tree opts loc]
  (let [db-graph? (sqlite-util/db-based-graph? repo)
        property-type (when db-graph? (get-in (db/entity repo @*property) [:block/schema :type]))
        ref-property? (and db-graph? (contains? db-property-type/all-ref-property-types property-type))
        [values set-values!] (rum/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [result (if db-graph?
                        (db-async/<get-block-property-values repo @*property)
                        (db-async/<file-get-property-values repo @*property))]
         (when (and db-graph? ref-property?)
           (doseq [db-id result]
             (db-async/<get-block repo db-id :children? false)))
         (set-values! result)))
     [@*property])
    (property-value-select-inner repo *property *private-property? *find *tree opts loc values
                                 {:db-graph? db-graph?
                                  :ref-property? ref-property?
                                  :property-type property-type})))

(rum/defc tags
  [repo *tree opts loc]
  (let [[values set-values!] (rum/use-state nil)
        db-based? (config/db-based-graph? repo)]
    (hooks/use-effect!
     (fn []
       (let [result (db-model/get-all-readable-classes repo {:except-root-class? true})]
         (set-values! result)))
     [])
    (let [items (->> values
                     (map :block/title)
                     sort)]
      (select items
              (fn [{:keys [value]}]
                (append-tree! *tree opts loc [(if db-based? :tags :page-tags) value]))))))

(defn- db-based-query-filter-picker
  [state *find *tree loc clause opts]
  (let [*mode (::mode state)
        *property (::property state)
        *private-property? (::private-property? state)
        repo (state/get-current-repo)]
    [:div
     (case @*mode
       "property"
       (property-select *mode *property *private-property?)

       "property-value"
       (property-value-select repo *property *private-property? *find *tree opts loc)

       "sample"
       (select (range 1 101)
               (fn [{:keys [value]}]
                 (append-tree! *tree opts loc [:sample (util/safe-parse-int value)])))

       "tags"
       (tags repo *tree opts loc)

       "task"
       (let [items (let [values (:property/closed-values (db/entity :logseq.task/status))]
                     (mapv db-property/property-value-content values))]
         (select items
                 (constantly nil)
                 {:multiple-choices? true
                ;; Need the existing choices later to improve the UX
                  :selected-choices #{}
                  :extract-chosen-fn :value
                  :prompt-key :select/default-select-multiple
                  :close-modal? false
                  :on-apply (fn [choices]
                              (when (seq choices)
                                (append-tree! *tree opts loc (vec (cons :task choices)))))}))

       "priority"
       (select (if (config/db-based-graph? repo)
                 (let [values (:property/closed-values (db/entity :logseq.task/priority))]
                   (mapv db-property/property-value-content values))
                 gp-db/built-in-priorities)
               (constantly nil)
               {:multiple-choices? true
                :selected-choices #{}
                :extract-chosen-fn :value
                :prompt-key :select/default-select-multiple
                :close-modal? false
                :on-apply (fn [choices]
                            (when (seq choices)
                              (append-tree! *tree opts loc (vec (cons :priority choices)))))})

       "page"
       (let [pages (sort (db-model/get-all-page-titles repo))]
         (select pages
                 (fn [{:keys [value]}]
                   (append-tree! *tree opts loc [:page value]))))

       ;; TODO: replace with node reference
       "page reference"
       (let [pages (sort (db-model/get-all-page-titles repo))]
         (select pages
                 (fn [{:keys [value]}]
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

(defn- file-based-query-filter-picker
  [state *find *tree loc clause opts]
  (let [*mode (::mode state)
        *property (::property state)
        *private-property? (::private-property? state)
        repo (state/get-current-repo)]
    [:div
     (case @*mode
       "namespace"
       (let [items (sort (map :block/title (db-model/get-all-namespace-parents repo)))]
         (select items
                 (fn [{:keys [value]}]
                   (append-tree! *tree opts loc [:namespace value]))))

       "tags"
       (tags repo *tree opts loc)

       "property"
       (property-select *mode *property *private-property?)

       "property-value"
       (property-value-select repo *property *private-property? *find *tree opts loc)

       "sample"
       (select (range 1 101)
               (fn [{:keys [value]}]
                 (append-tree! *tree opts loc [:sample (util/safe-parse-int value)])))

       "task"
       (select (if (config/db-based-graph? repo)
                 (let [values (:property/closed-values (db/entity :logseq.task/status))]
                   (mapv db-property/property-value-content values))
                 gp-db/built-in-markers)
               (constantly nil)
               {:multiple-choices? true
                ;; Need the existing choices later to improve the UX
                :selected-choices #{}
                :extract-chosen-fn :value
                :prompt-key :select/default-select-multiple
                :close-modal? false
                :on-apply (fn [choices]
                            (when (seq choices)
                              (append-tree! *tree opts loc (vec (cons :task choices)))))})

       "priority"
       (select (if (config/db-based-graph? repo)
                 (let [values (:property/closed-values (db/entity :logseq.task/priority))]
                   (mapv db-property/property-value-content values))
                 gp-db/built-in-priorities)
               (constantly nil)
               {:multiple-choices? true
                :selected-choices #{}
                :extract-chosen-fn :value
                :prompt-key :select/default-select-multiple
                :close-modal? false
                :on-apply (fn [choices]
                            (when (seq choices)
                              (append-tree! *tree opts loc (vec (cons :priority choices)))))})

       "page"
       (let [pages (sort (db-model/get-all-page-titles repo))]
         (select pages
                 (fn [{:keys [value]}]
                   (append-tree! *tree opts loc [:page value]))))

       "page reference"
       (let [pages (sort (db-model/get-all-page-titles repo))]
         (select pages
                 (fn [{:keys [value]}]
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

(rum/defcs picker < rum/reactive
  {:will-mount (fn [state]
                 (state/clear-selection!)
                 state)}
  (rum/local nil ::mode)                ; pick mode
  (rum/local nil ::property)
  (rum/local false ::private-property?)
  [state *find *tree loc clause opts]
  (let [*mode (::mode state)
        db-based? (config/db-based-graph? (state/get-current-repo))
        filters (if db-based?
                  query-builder/db-based-block-filters
                  (if (= :page (rum/react *find))
                    query-builder/page-filters
                    query-builder/block-filters))
        filters-and-ops (concat filters query-builder/operators)
        operator? #(contains? query-builder/operators-set (keyword %))]
    [:div.query-builder-picker
     (if @*mode
       (when-not (operator? @*mode)
         (if db-based?
           (db-based-query-filter-picker state *find *tree loc clause opts)
           (file-based-query-filter-picker state *find *tree loc clause opts)))
       [:div
        (when-not db-based?
          [:<>
           (when-not @*find
             [:div.flex.flex-row.items-center.p-2.justify-between
              [:div.ml-2 "Find: "]
              (page-block-selector *find)])
           (when-not @*find
             [:hr.m-0])])
        (select
         (map name filters-and-ops)
         (fn [{:keys [value]}]
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
  (shui/button
   {:class "jtrigger !px-1 h-6 add-filter text-muted-foreground"
    :size :sm
    :variant :outline
    :on-pointer-down util/stop-propagation
    :on-click (fn [^js e]
                (shui/popup-show! (.-target e)
                                  (fn [{:keys [id]}]
                                    (picker *find *tree loc clause {:toggle-fn #(shui/popup-hide! id)}))
                                  {:align :start}))}
   (ui/icon "plus" {:size 14})
   (when (= [0] loc) "Filter")))

(declare clauses-group)

(defn- dsl-human-output
  [clause]
  (let [f (first clause)]
    (cond
      (string/starts-with? (str f) "?") ; variable
      (str clause)

      (string? clause)
      (str "Search: " clause)

      (= (keyword f) :page-ref)
      (page-ref/->page-ref (second clause))

      (contains? #{:tags :page-tags} (keyword f))
      (cond
        (string? (second clause))
        (str "#" (second clause))
        (symbol? (second clause))
        (str "#" (str (second clause)))
        :else
        (str "#" (second (second clause))))

      (contains? #{:property :private-property :page-property} (keyword f))
      (str (if (and (config/db-based-graph? (state/get-current-repo))
                    (qualified-keyword? (second clause)))
             (:block/title (db/entity (second clause)))
             (some-> (second clause) name))
           ": "
           (cond
             (and (vector? (last clause)) (= :page-ref (first (last clause))))
             (second (last clause))

             (= 2 (count clause))
             "ALL"

             :else
             (last clause)))

      ;; between timestamp start (optional end)
      (and (= (keyword f) :between) (query-dsl/get-timestamp-property clause))
      (let [k (query-dsl/get-timestamp-property clause)
            [_ _property start end] clause
            start (if (or (keyword? start)
                          (symbol? start))
                    (name start)
                    (second start))
            end (if (or (keyword? end)
                        (symbol? end))
                  (name end)
                  (second end))]
        (str (if (= k :block/created-at)
               "Created"
               "Updated")
             " " start
             (when end
               (str " ~ " end))))

      ;; between journal start end
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

       [:div.flex.flex-row.items-center.gap-2.px-1.rounded.border.query-clause-btn
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
  [*tree *find loc clauses]
  (when (seq clauses)
    [:div.query-builder-clause
     (let [operator (first clauses)
           kind (keyword operator)]
       (if (query-builder/operators-set kind)
         [:div.operator-clause.flex.flex-row.items-center {:data-level (count loc)}
          [:div.clause-bracket "("]
          (clauses-group *tree *find (conj loc 0) kind (rest clauses))
          [:div.clause-bracket ")"]]
         (clause-inner *tree loc clauses)))]))

(rum/defc clauses-group
  [*tree *find loc kind clauses]
  (let [parens? (and (= loc [0]) (or (not= kind :and) (> (count clauses) 1)))]
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

(defn sanitize-q
  [q-str]
  (if (string/blank? q-str)
    ""
    (if (or (common-util/wrapped-by-parens? q-str)
            (common-util/wrapped-by-quotes? q-str)
            (page-ref/page-ref? q-str)
            (string/starts-with? q-str "[?"))
      q-str
      (str "\"" q-str "\""))))

(defn- get-q
  [block]
  (sanitize-q (or (:file-version/query-macro-title block)
                  (:block/title block)
                  "")))

(rum/defcs builder <
  (rum/local nil ::find)
  {:init (fn [state]
           (let [block (first (:rum/args state))
                 q-str (get-q block)
                 query (common-util/safe-read-string
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
                 *tree (atom tree)]
             (add-watch *tree :updated (fn [_ _ _old _new]
                                         (when block
                                           (let [q (if (= [:and] @*tree)
                                                     ""
                                                     (let [result (query-builder/->dsl @*tree)]
                                                       (if (string? result)
                                                         (util/format "\"%s\"" result)
                                                         (str result))))
                                                 repo (state/get-current-repo)
                                                 block (db/entity [:block/uuid (:block/uuid block)])]
                                             (if (config/db-based-graph? (state/get-current-repo))
                                               (editor-handler/save-block! repo (:block/uuid block) q)
                                               (let [content (string/replace (:block/title block)
                                                                             #"\{\{query[^}]+\}\}"
                                                                             (util/format "{{query %s}}" q))]
                                                 (editor-handler/save-block! repo (:block/uuid block) content)))))))
             (assoc state ::tree *tree)))
   :will-mount (fn [state]
                 (let [q-str (get-q (first (:rum/args state)))
                       blocks-query? (:blocks? (query-dsl/parse-query q-str))
                       find-mode (cond
                                   blocks-query?
                                   :block
                                   (false? blocks-query?)
                                   :page
                                   :else
                                   nil)]
                   (when find-mode (reset! (::find state) find-mode))
                   state))}
  [state _block _option]
  (let [*find (::find state)
        *tree (::tree state)]
    [:div.cp__query-builder
     [:div.cp__query-builder-filter
      (when (and (seq @*tree)
                 (not= @*tree [:and]))
        (clause-tree *tree *find))
      (add-filter *find *tree [0] [])]]))
