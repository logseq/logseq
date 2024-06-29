(ns frontend.components.objects
  "Tagged objects"
  (:require [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [clojure.string :as string]
            [frontend.components.block :as component-block]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.state :as state]
            [frontend.date :as date]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [logseq.db :as ldb]
            [frontend.db :as db]
            [frontend.search.fuzzy :as fuzzy-search]
            [logseq.outliner.property :as outliner-property]
            [frontend.mixins :as mixins]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [clojure.set :as set]))

(defn header-checkbox [{:keys [selected-all? selected-some? toggle-selected-all!]}]
  (shui/checkbox
   {:checked (or selected-all? (and selected-some? "indeterminate"))
    :on-checked-change toggle-selected-all!
    :aria-label "Select all"}))

(defn row-checkbox [{:keys [row-selected? row-toggle-selected!]} row _column]
  (shui/checkbox
   {:checked (row-selected? row)
    :on-checked-change (fn [v] (row-toggle-selected! row v))
    :aria-label "Select row"}))

(defn- header-cp
  [{:keys [column-toggle-sorting! state]} column]
  (let [sorting (:sorting state)
        [asc?] (some (fn [item] (when (= (:id item) (:id column))
                                  (when-some [asc? (:asc? item)]
                                    [asc?]))) sorting)]
    (shui/button
     {:variant "text"
      :class "!pl-0 !py-0 hover:text-foreground"
      :onClick #(column-toggle-sorting! column)}
     (:name column)
     (case asc?
       true
       (ui/icon "arrow-up")
       false
       (ui/icon "arrow-down")
       nil))))

(defn- timestamp-cell-cp
  [_table row column]
  (some-> (get row (:id column))
          date/int->local-time-2))

(defn- get-property-value-for-search
  [block property]
  (let [type (get-in property [:block/schema :type])
        many? (= :db.cardinality/many (get property :db/cardinality))
        ref-types (into db-property-type/value-ref-property-types #{:entity})
        number-type? (= :number type)
        v (get block (:db/ident property))
        v' (if many? v [v])
        col (->> (if (ref-types type) (map db-property/property-value-content v') v')
                 (remove nil?))]
    (if number-type?
      (reduce + (filter number? col))
      (string/join ", " col))))

(defn- build-columns
  [class config]
  (let [properties (outliner-property/get-class-properties class)]
    (concat
     [{:id :select
       :name "Select"
       :header (fn [table _column] (header-checkbox table))
       :cell (fn [table row column] (row-checkbox table row column))
       :column-list? false}
      {:id :object/name
       :name "Name"
       :header header-cp
       :cell (fn [_table row _column]
               [:div.primary-cell
                (component-block/block-container (assoc config :table? true) row)])}]
     (map
      (fn [property]
        {:id (:db/ident property)
         :name (:block/original-name property)
         :header header-cp
         :cell (fn [_table row _column]
                 (pv/property-value row property (get row (:db/ident property)) {}))
         :get-value (fn [row] (get-property-value-for-search row property))})
      properties)

     [{:id :block/created-at
       :name "Created At"
       :header header-cp
       :cell timestamp-cell-cp}
      {:id :block/updated-at
       :name "Updated At"
       :header header-cp
       :cell timestamp-cell-cp}])))

(defn- get-all-objects
  [class]
  ;; FIXME: async
  (:block/_tags class))

(rum/defc more-actions
  [columns {:keys [column-visible? column-toggle-visiblity]}]
  (shui/dropdown-menu
   (shui/dropdown-menu-trigger
    {:asChild true}
    (shui/button
     {:variant "ghost"
      :class "text-muted-foreground !px-1"
      :size :sm
      :on-click #()}
     (ui/icon "dots")))
   (shui/dropdown-menu-content
    {:align "end"}
    (shui/dropdown-menu-group
     (shui/dropdown-menu-sub
      (shui/dropdown-menu-sub-trigger
       "Properties")
      (shui/dropdown-menu-sub-content
       (for [column (remove #(false? (:column-list? %)) columns)]
         (shui/dropdown-menu-checkbox-item
          {:key (str (:id column))
           :className "capitalize"
           :checked (column-visible? column)
           :onCheckedChange #(column-toggle-visiblity column %)
           :onSelect (fn [e] (.preventDefault e))}
          (:name column)))))))))

(defn table-header
  [table columns]
  (shui/table-row
   {:class "bg-gray-01 shadow"}
   (for [column columns]
     (let [style (case (:id column)
                   :block/original-name
                   {}
                   :select
                   {:width 32}
                   {:width 180})]
       (shui/table-head
        {:key (str (:id column))
         :style style}
        (let [header-fn (:header column)]
          (if (fn? header-fn)
            (header-fn table column)
            header-fn)))))))

(defn table-row
  [{:keys [row-selected?] :as table} rows columns props]
  (let [idx (gobj/get props "data-index")
        row (nth rows idx)]
    (shui/table-row
     (merge
      (bean/->clj props)
      {:key (str (:id row))
       :data-state (when (row-selected? row) "selected")})
     (for [column columns]
       (let [id (str (:id row) "-" (:id column))
             render (get column :cell)]
         (shui/table-cell
          {:key id}
          (render table row column)))))))

(rum/defc search
  [input {:keys [on-change]}]
  (let [[show-input? set-show-input!] (rum/use-state false)]
    (if show-input?
      (shui/input
       {:placeholder "Type to search"
        :auto-focus true
        :value input
        :onChange (fn [e]
                    (let [value (util/evalue e)]
                      (on-change value)))
        :on-key-down (fn [e]
                       (when (= "Escape" (util/ekey e))
                         (set-show-input! false)))
        :class "max-w-sm !h-7 !py-0 border-none"})
      (shui/button
       {:variant "ghost"
        ;; FIXME: remove ring when focused
        :class "text-muted-foreground !px-1"
        :size :sm
        :on-click #(set-show-input! true)}
       (ui/icon "search")))))

(defn- property-ref-type?
  [property]
  (let [schema (:block/schema property)
        type (:type schema)]
    (db-property-type/ref-property-types type)))

(defn- get-property-value-content
  [e property]
  (if (property-ref-type? property)
    (db-property/property-value-content e)
    (str e)))

(rum/defc filter-property < rum/static
  [columns {:keys [rows data-fns] :as table}]
  (let [[property-ident set-property-ident!] (rum/use-state nil)
        set-filters! (:set-filters! data-fns)
        property (when property-ident (db/entity property-ident))
        filters (get-in table [:state :filters])
        columns (remove #(false? (:column-list? %)) columns)
        items (map (fn [column]
                     {:label (:name column)
                      :value (:id column)}) columns)
        option {:input-default-placeholder "Filter"
                :input-opts {:class "!px-3 !py-1"}
                :items items
                :extract-fn :label
                :extract-chosen-fn :value
                :on-chosen (fn [value]
                             (set-property-ident! value))}
        option (if property
                 (let [items (let [values (->> (mapcat (fn [e] (let [v (get e property-ident)]
                                                                 (if (set? v) v #{v}))) rows)
                                               (remove nil?)
                                               (distinct))]
                               (->>
                                (map (fn [e]
                                       {:label (get-property-value-content e property)
                                        :value e})
                                     values)
                                (sort-by :label)))]
                   (merge option
                          {:items items
                           :input-default-placeholder "Select"
                           :multiple-choices? true
                           :on-chosen (fn [_value _selected? selected]
                                        (when (seq selected)
                                          (let [filters' (conj filters [property :is selected])]
                                            (set-filters! filters'))))}))
                 option)]
    (select/select option)))

(rum/defc filter-properties < rum/static
  [columns table]
  (shui/button
   {:variant "ghost"
    :class "text-muted-foreground !px-1"
    :size :sm
    :on-click (fn [e]
                (shui/popup-show! (.-target e)
                                  (fn []
                                    (filter-property columns table))
                                  {:align :end
                                   :as-dropdown? true
                                   :auto-focus? true}))}
   (ui/icon "filter")))

(rum/defc filters-row < rum/static
  [{:keys [data-fns] :as table}]
  (let [filters (get-in table [:state :filters])
        {:keys [set-filters!]} data-fns]
    (when (seq filters)
      [:div.filters-row.flex.flex-row.items-center.gap-4.flex-wrap.pb-2
       (map-indexed
        (fn [idx filter]
          (let [[property operator value] filter]
            (when (seq value)
              (let [is? (= :is operator)]
                [:div.flex.flex-row.items-center.border.rounded
                 (shui/button
                  {:class "!px-2 rounded-none border-r"
                   :variant "ghost"
                   :size :sm
                   :disabled true}
                  [:span.text-xs (:block/original-name property)])
                 (shui/button
                  {:class "!px-2 rounded-none border-r"
                   :variant "ghost"
                   :size :sm
                   :on-click (fn [_e]
                               (let [new-filters (update filters idx
                                                         (fn [[property operator value]]
                                                           ;; TODO: support more operators like `contains`, `between` for different types
                                                           ;; and switch to use dropdown instead of toggle
                                                           (let [operator' (if (= operator :is) :not :is)]
                                                             [property operator' value])))]
                                 (set-filters! new-filters)))}
                  [:span.text-xs (if is? "is" "is not")])
                 (shui/button
                  {:class "!px-2 rounded-none border-r"
                   :variant "ghost"
                   :size :sm}
                  [:div.flex.flex-row.items-center.gap-1.text-xs
                   (->> (map (fn [v] [:div (get-property-value-content v property)]) value)
                        (interpose [:div "or"]))])
                 (shui/button
                  {:class "!px-1 rounded-none"
                   :variant "ghost"
                   :size :sm
                   :on-click (fn [e]
                               (let [new-filters (vec (remove #{filter} filters))]
                                 (set-filters! new-filters)))}
                  (ui/icon "x"))]))))
        filters)])))

(defn- row-matched?
  [row input filters]
  (and
   ;; full-text-search match
   (if (string/blank? input)
     true
     (when row
       (pos? (fuzzy-search/score (string/lower-case input) (:object/name row)))))
   ;; filters check
   (every?
    (fn [[property operator match]]
      (let [value (get row (:db/ident property))
            value' (cond
                     (set? value) value
                     (nil? value) #{}
                     :else #{value})]
        (case operator
          :is
          (boolean (seq (set/intersection value' match)))
          :not
          (boolean (empty? (set/intersection value' match)))
          true)))
    filters)))

(rum/defc objects-inner < rum/static
  [config class]
  (let [[input set-input!] (rum/use-state "")
        ;; TODO: block.temp/tagged-at
        [sorting set-sorting!] (rum/use-state [{:id :block/updated-at, :asc? false}])
        [filters set-filters!] (rum/use-state [])
        [row-filter set-row-filter!] (rum/use-state nil)
        [visible-columns set-visible-columns!] (rum/use-state {})
        [row-selection set-row-selection!] (rum/use-state {})
        [data set-data!] (rum/use-state (get-all-objects class))
        _ (rum/use-effect!
           (fn []
             ;; (when-let [^js worker @state/*db-worker]
             ;;   (p/let [result-str (.get-page-refs-count worker (state/get-current-repo))
             ;;           result (ldb/read-transit-str result-str)
             ;;           data (map (fn [row] (assoc row :block.temp/refs-count (get result (:db/id row) 0))) data)]
             ;;     (set-data! data)))
             )
           [])
        columns (build-columns class config)
        table (shui/table-option {:data data
                                  :columns columns
                                  :state {:sorting sorting
                                          :filters filters
                                          :row-filter row-filter
                                          :row-selection row-selection
                                          :visible-columns visible-columns}
                                  :data-fns {:set-filters! set-filters!
                                             :set-sorting! set-sorting!
                                             :set-visible-columns! set-visible-columns!
                                             :set-row-selection! set-row-selection!}})
        selected-rows (shui/table-get-selection-rows row-selection (:rows table))
        selected-rows-count (count selected-rows)
        selected? (pos? selected-rows-count)]
    (rum/use-effect!
     (fn []
       (set-row-filter! (fn []
                          (fn [row]
                            (row-matched? row input filters)))))
     [input filters])
    [:div.w-full.flex.flex-col.gap-2
     [:div.flex.items-center.justify-between
      [:div.flex.flex-row.items-center.gap-2
       [:div.font-medium (str (count data) " Objects")]]
      [:div.flex.items-center.gap-1

       (filter-properties columns table)

       (search input {:on-change set-input!})

       (more-actions columns table)]]

     (filters-row table)

     (let [columns' (:columns table)
           rows (:rows table)]
       [:div.rounded-md.border.content
        (ui/virtualized-table
         {:custom-scroll-parent (gdom/getElement "main-content-container")
          :total-count (count rows)
          :fixedHeaderContent (fn [] (table-header table columns'))
          :components {:Table (fn [props]
                                (shui/table {}
                                            (.-children props)))
                       :TableRow (fn [props] (table-row table rows columns' props))}})])

     (let [rows-count (count (:rows table))]
       [:div.flex.items-center.justify-end.space-x-2.py-4
        [:div.flex-1.text-sm.text-muted-foreground
         (if (pos? selected-rows-count)
           (str selected-rows-count " of " rows-count " row(s) selected.")
           (str "Total: " rows-count))]])]))

(rum/defcs objects < mixins/container-id
  [state class]
  (objects-inner {:container-id (:container-id state)} class))
