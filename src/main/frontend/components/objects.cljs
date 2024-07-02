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
            [frontend.components.dnd :as dnd]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.date :as date]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.search.fuzzy :as fuzzy-search]
            [logseq.outliner.property :as outliner-property]
            [frontend.mixins :as mixins]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [clojure.set :as set]
            [datascript.impl.entity :as de]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [frontend.db.async :as db-async]
            [frontend.db-mixins :as db-mixins]))

(defn header-checkbox [{:keys [selected-all? selected-some? toggle-selected-all!]}]
  (shui/checkbox
   {:checked (or selected-all? (and selected-some? "indeterminate"))
    :on-checked-change toggle-selected-all!
    :aria-label "Select all"
    :class "flex"}))

(defn row-checkbox [{:keys [row-selected? row-toggle-selected!]} row _column]
  (shui/checkbox
   {:checked (row-selected? row)
    :on-checked-change (fn [v] (row-toggle-selected! row v))
    :aria-label "Select row"
    :class "flex"}))

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
       [:div {:style {:width 18 :height 18}}]))))

(defn- timestamp-cell-cp
  [_table row column]
  (some-> (get row (:id column))
          date/int->local-time-2))

(defn- get-property-value-content
  [entity]
  (when entity
    (if (map? entity)
      (db-property/property-value-content entity)
      (str entity))))

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
  (let [properties (outliner-property/get-class-properties class)
        container-id (state/get-next-container-id)]
    (concat
     [{:id :select
       :name "Select"
       :header (fn [table _column] (header-checkbox table))
       :cell (fn [table row column] (row-checkbox table row column))
       :column-list? false}
      {:id :object/name
       :name "Name"
       :type :string
       :header header-cp
       :cell (fn [_table row _column]
               [:div.primary-cell
                (component-block/block-container (assoc config :table? true) row)])
       :disable-hide? true}]
     (map
      (fn [property]
        {:id (:db/ident property)
         :name (:block/original-name property)
         :header header-cp
         :cell (fn [_table row _column]
                 (pv/property-value row property (get row (:db/ident property)) {:container-id container-id}))
         :get-value (fn [row] (get-property-value-for-search row property))})
      properties)

     [{:id :block/created-at
       :name "Created At"
       :type :date-time
       :header header-cp
       :cell timestamp-cell-cp}
      {:id :block/updated-at
       :name "Updated At"
       :type :date-time
       :header header-cp
       :cell timestamp-cell-cp}])))

(defn- sort-columns
  [columns ordered-column-ids]
  (if (seq ordered-column-ids)
    (let [id->columns (zipmap (map :id columns) columns)
          ordered-id-set (set ordered-column-ids)]
      (concat
       (keep (fn [id]
               (get id->columns id))
             ordered-column-ids)
       (remove
        (fn [column] (ordered-id-set (:id column)))
        columns)))
    columns))

;; TODO: block.temp/tagged-at
(defn- get-all-objects
  [class]
  (->> (:block/_tags class)
       (map (fn [row] (assoc row :id (:db/id row))))))

(rum/defc more-actions
  [columns {:keys [column-visible? column-toggle-visibility]}]
  (shui/dropdown-menu
   (shui/dropdown-menu-trigger
    {:asChild true}
    (shui/button
     {:variant "ghost"
      :class "text-muted-foreground !px-1"
      :size :sm}
     (ui/icon "dots")))
   (shui/dropdown-menu-content
    {:align "end"}
    (shui/dropdown-menu-group
     (shui/dropdown-menu-sub
      (shui/dropdown-menu-sub-trigger
       "Properties")
      (shui/dropdown-menu-sub-content
       (for [column (remove #(or (false? (:column-list? %))
                                 (:disable-hide? %)) columns)]
         (shui/dropdown-menu-checkbox-item
          {:key (str (:id column))
           :className "capitalize"
           :checked (column-visible? column)
           :onCheckedChange #(column-toggle-visibility column %)
           :onSelect (fn [e] (.preventDefault e))}
          (:name column)))))))))

(defn- get-column-size
  [column]
  (case (:id column)
    :select 16
    :object/name 360
    (:block/created-at :block/updated-at) 160
    180))

(defn- table-header
  [table columns]
  (let [set-ordered-columns! (get-in table [:data-fns :set-ordered-columns!])
        items (mapv (fn [column]
                      {:id (:name column)
                       :value (:id column)
                       :content (let [header-fn (:header column)
                                      width (get-column-size column)]
                                  [:div.overflow-x-hidden
                                   {:class (when-not (= :select (:id column))
                                             "px-4")
                                    :style {:width width
                                            :max-width width}}
                                   (if (fn? header-fn)
                                     (header-fn table column)
                                     header-fn)])}) columns)]
    (shui/table-row
     {:class "bg-gray-01 shadow"}
     (dnd/items items {:vertical? false
                       :on-drag-end (fn [ordered-columns _m]
                                      (set-ordered-columns! ordered-columns))}))))

(rum/defc table-row < rum/reactive
  [{:keys [row-selected?] :as table} rows columns props]
  (let [idx (gobj/get props "data-index")
        row (nth rows idx)
        row (db/sub-block (:id row))
        row (assoc row :id (:db/id row))]
    (shui/table-row
     (merge
      (bean/->clj props)
      {:key (str (:id row))
       :data-state (when (row-selected? row) "selected")})
     (for [column columns]
       (let [id (str (:id row) "-" (:id column))
             render (get column :cell)
             width (get-column-size column)]
         (shui/table-cell
          {:key id
           :style {:width width
                   :max-width width}}
          (render table row column)))))))

(rum/defc search
  [input {:keys [on-change set-input!]}]
  (let [[show-input? set-show-input!] (rum/use-state false)]
    (if show-input?
      [:div.flex.flex-row.items-center
       (shui/input
        {:placeholder "Type to search"
         :auto-focus true
         :value input
         :onChange (fn [e]
                     (let [value (util/evalue e)]
                       (on-change value)))
         :on-key-down (fn [e]
                        (when (= "Escape" (util/ekey e))
                          (set-show-input! false)
                          (set-input! "")))
         :class "max-w-sm !h-7 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"})
       (shui/button
        {:variant "ghost"
         :class "text-muted-foreground !px-1"
         :size :sm
         :on-click #(do
                      (set-show-input! false)
                      (set-input! ""))}
        (ui/icon "x"))]
      (shui/button
       {:variant "ghost"
        ;; FIXME: remove ring when focused
        :class "text-muted-foreground !px-1"
        :size :sm
        :on-click #(set-show-input! true)}
       (ui/icon "search")))))

(comment
  (defn- property-ref-type?
   [property]
   (let [schema (:block/schema property)
         type (:type schema)]
     (db-property-type/ref-property-types type))))

(defn- get-property-values
  [rows property]
  (let [property-ident (:db/ident property)
        values (->> (mapcat (fn [e] (let [v (get e property-ident)]
                                      (if (set? v) v #{v}))) rows)
                    (remove nil?)
                    (distinct))]
    (->>
     (map (fn [e]
            {:label (get-property-value-content e)
             :value e})
          values)
     (sort-by :label))))

(defn timestamp-property?
  [ident]
  (contains? #{:block/created-at :block/updated-at} ident))

(def timestamp-options
  [{:value "1 week ago"
    :label "1 week ago"}
   {:value "1 month ago"
    :label "1 month ago"}
   {:value "3 months ago"
    :label "3 months ago"}
   {:value "1 year ago"
    :label "1 year ago"}
   ;; TODO: support date picker
   ;; {:value "Custom time"
   ;;  :label "Custom time"}
   ])

(defn- get-timestamp
  [value]
  (let [now (t/now)
        f t/minus]
    (case value
      "1 week ago"
      (tc/to-long (f now (t/weeks 1)))
      "1 month ago"
      (tc/to-long (f now (t/months 1)))
      "3 months ago"
      (tc/to-long (f now (t/months 3)))
      "1 year ago"
      (tc/to-long (f now (t/years 1)))
      nil)))

(rum/defc filter-property < rum/static
  [columns {:keys [data-fns] :as table}]
  (let [[property set-property!] (rum/use-state nil)
        timestamp? (timestamp-property? (:db/ident property))
        set-filters! (:set-filters! data-fns)
        filters (get-in table [:state :filters])
        columns (remove #(false? (:column-list? %)) columns)
        items (map (fn [column]
                     {:label (:name column)
                      :value column}) columns)
        option {:input-default-placeholder "Filter"
                :input-opts {:class "!px-3 !py-1"}
                :items items
                :extract-fn :label
                :extract-chosen-fn :value
                :on-chosen (fn [column]
                             (let [id (:id column)
                                   property (db/entity id)
                                   internal-property {:db/ident (:id column)
                                                      :block/original-name (:name column)}]
                               (if (or property (timestamp-property? id))
                                 (set-property! (or property internal-property))
                                 (do
                                   (shui/popup-hide!)
                                   (let [property internal-property
                                         new-filter [property :text-contains]
                                         filters' (if (seq filters)
                                                    (conj filters new-filter)
                                                    [new-filter])]
                                     (set-filters! filters'))))))}
        option (cond
                 timestamp?
                 (merge option
                        {:items timestamp-options
                         :input-default-placeholder (if property (:block/original-name property) "Select")
                         :on-chosen (fn [value]
                                      (shui/popup-hide!)
                                      (let [filters' (conj filters [property :after value])]
                                        (set-filters! filters')))})
                 property
                 (if (= :checkbox (get-in property [:block/schema :type]))
                   (let [items [{:value true :label "true"}
                                {:value false :label "false"}]]
                     (merge option
                            {:items items
                             :input-default-placeholder (if property (:block/original-name property) "Select")
                             :on-chosen (fn [value]
                                          (let [filters' (conj filters [property :is value])]
                                            (set-filters! filters')))}))
                   (let [items (get-property-values (:data table) property)]
                     (merge option
                            {:items items
                             :input-default-placeholder (if property (:block/original-name property) "Select")
                             :multiple-choices? true
                             :on-chosen (fn [_value _selected? selected]
                                          (let [filters' (if (seq selected)
                                                           (conj filters [property :is selected])
                                                           filters)]
                                            (set-filters! filters')))})))
                 :else
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
                                   :auto-focus? true}))}
   (ui/icon "filter")))

(defn operator->text
  [operator]
  (case operator
    :is "is"
    :is-not "is not"
    :text-contains "text contains"
    :text-not-contains "text not contains"
    :date-before "date before"
    :date-after "date after"
    :before "before"
    :after "after"
    :number-gt ">"
    :number-lt "<"
    :number-gte ">="
    :number-lte "<="
    :between "between"))

(defn get-property-operators
  [property]
  (if (contains? #{:block/created-at :block/updated-at} (:db/ident property))
    [:before :after]
    (concat
     [:is :is-not]
     (case (get-in property [:block/schema :type])
       (:default :url :page :object)
       [:text-contains :text-not-contains]
       :date
       [:date-before :date-after]
       :number
       [:number-gt :number-lt :number-gte :number-lte :between]
       nil))))

(defn- get-filter-with-changed-operator
  [property operator value]
  (case operator
    (:is :is-not)
    (when (set? value) value)

    (:text-contains :text-not-contains)
    (when (string? value) value)

    (:number-gt :number-lt :number-gte :number-lte)
    (when (number? value) value)

    :between
    (when (and (vector? value) (every? number? value))
      value)

    (:date-before :date-after :before :after)
    ;; FIXME: should be a valid date number
    (when (number? value) value)))

(rum/defc filter-operator < rum/static
  [property operator filters set-filters! idx]
  (shui/dropdown-menu
   (shui/dropdown-menu-trigger
    {:asChild true}
    (shui/button
     {:class "!px-2 rounded-none border-r"
      :variant "ghost"
      :size :sm}
     [:span.text-xs (operator->text operator)]))
   (shui/dropdown-menu-content
    {:align "start"}
    (let [operators (get-property-operators property)]
      (for [operator operators]
        (shui/dropdown-menu-item
         {:on-click (fn []
                      (let [new-filters (update filters idx
                                                (fn [[property _old-operator value]]
                                                  (let [value' (get-filter-with-changed-operator property operator value)]
                                                    (if value'
                                                      [property operator value']
                                                      [property operator]))))]
                        (set-filters! new-filters)))}
         (operator->text operator)))))))

(rum/defc between < rum/static
  [property [start end] filters set-filters! idx]
  [:<>
   (shui/input
    {:auto-focus true
     :placeholder "from"
     :value (str start)
     :onChange (fn [e]
                 (let [input-value (util/evalue e)
                       number-value (when-not (string/blank? input-value)
                                      (util/safe-parse-float input-value))
                       value [number-value end]
                       value (if (every? nil? value) nil value)]
                   (let [new-filters (update filters idx
                                             (fn [[property operator _old_value]]
                                               (if (nil? value)
                                                 [property operator]
                                                 [property operator value])))]
                     (set-filters! new-filters))))
     :class "w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"})
   (shui/input
    {:value (str end)
     :placeholder "to"
     :onChange (fn [e]
                 (let [input-value (util/evalue e)
                       number-value (when-not (string/blank? input-value)
                                      (util/safe-parse-float input-value))
                       value [start number-value]
                       value (if (every? nil? value) nil value)]
                   (let [new-filters (update filters idx
                                             (fn [[property operator _old_value]]
                                               (if (nil? value)
                                                 [property operator]
                                                 [property operator value])))]
                     (set-filters! new-filters))))
     :class "w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"})])

(rum/defc filter-value-select < rum/static
  [{:keys [data-fns] :as table} property value operator idx]
  (let [type (get-in property [:block/schema :type])
        items (cond
                (contains? #{:before :after} operator)
                timestamp-options
                (= type :checkbox)
                [{:value true :label "true"} {:value false :label "false"}]
                :else
                (get-property-values (:data table) property))
        filters (get-in table [:state :filters])
        set-filters! (:set-filters! data-fns)
        many? (if (or (contains? #{:date-before :date-after :before :after} operator)
                      (contains? #{:checkbox} type))
                false
                true)
        option (cond->
                {:input-default-placeholder (:block/original-name property)

                 :input-opts {:class "!px-3 !py-1"}
                 :items items
                 :extract-fn :label
                 :extract-chosen-fn :value
                 :on-chosen (fn [value _selected? selected]
                              (when-not many?
                                (shui/popup-hide!))
                              (let [value' (if many? selected value)
                                    new-filters (update filters idx
                                                        (fn [[property operator _value]]
                                                          [property operator value']))]
                                (set-filters! new-filters)))}
                 many?
                 (assoc
                  :multiple-choices? true
                  :selected-choices value))]
    (shui/dropdown-menu
     (shui/dropdown-menu-trigger
      {:asChild true}
      (shui/button
       {:class "!px-2 rounded-none border-r"
        :variant "ghost"
        :size :sm}
       [:div.flex.flex-row.items-center.gap-1.text-xs
        (cond
          (de/entity? value)
          [:div (get-property-value-content value)]

          (string? value)
          [:div value]

          (boolean? value)
          [:div (str value)]

          (seq value)
          (->> (map (fn [v] [:div (get-property-value-content v)]) value)
               (interpose [:div "or"]))
          :else
          "Empty")]))
     (shui/dropdown-menu-content
      {:align "start"}
      (select/select option)))))

(rum/defc filter-value < rum/static
  [table property operator value filters set-filters! idx]
  (let [number-operator? (string/starts-with? (name operator) "number-")]
    (case operator
      :between
      (between property value filters set-filters! idx)

      (:text-contains :text-not-contains :number-gt :number-lt :number-gte :number-lte)
      (shui/input
       {:auto-focus true
        :value (or value "")
        :onChange (fn [e]
                    (let [value (util/evalue e)
                          number-value (and number-operator? (when-not (string/blank? value)
                                                               (util/safe-parse-float value)))]
                      (let [new-filters (update filters idx
                                                (fn [[property operator _value]]
                                                  (if (and number-operator? (nil? number-value))
                                                    [property operator]
                                                    [property operator (or number-value value)])))]
                        (set-filters! new-filters))))
        :class "w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"})


      (filter-value-select table property value operator idx))))

(rum/defc filters-row < rum/static
  [{:keys [data-fns] :as table}]
  (let [filters (get-in table [:state :filters])
        {:keys [set-filters!]} data-fns]
    (when (seq filters)
      [:div.filters-row.flex.flex-row.items-center.gap-4.flex-wrap.pb-2
       (map-indexed
        (fn [idx filter]
          (let [[property operator value] filter]
            [:div.flex.flex-row.items-center.border.rounded
             (shui/button
              {:class "!px-2 rounded-none border-r"
               :variant "ghost"
               :size :sm
               :disabled true}
              [:span.text-xs (:block/original-name property)])
             (filter-operator property operator filters set-filters! idx)
             (filter-value table property operator value filters set-filters! idx)
             (shui/button
              {:class "!px-1 rounded-none"
               :variant "ghost"
               :size :sm
               :on-click (fn [_e]
                           (let [new-filters (vec (remove #{filter} filters))]
                             (set-filters! new-filters)))}
              (ui/icon "x"))]))
        filters)])))

(defn- fuzzy-matched?
  [input s]
  (pos? (fuzzy-search/score (string/lower-case (str input))
                            (string/lower-case (str s)))))

(defn- row-matched?
  [row input filters]
  (and
   ;; full-text-search match
   (if (string/blank? input)
     true
     (when row
       (fuzzy-matched? input (:object/name row))))
   ;; filters check
   (every?
    (fn [[property operator match]]
      (let [property-ident (:db/ident property)
            value (get row property-ident)
            value' (cond
                     (set? value) value
                     (nil? value) #{}
                     :else #{value})
            result
            (case operator
              :is
              (if (boolean? match)
                (= (boolean (get-property-value-content (get row property-ident))) match)
                (when (coll? value)
                  (boolean (seq (set/intersection value' match)))))

              :is-not
              (if (boolean? match)
                (not= (boolean (get-property-value-content (get row property-ident))) match)
                (when (coll? value)
                  (boolean (empty? (set/intersection value' match)))))

              :text-contains
              (some #(fuzzy-matched? match (get-property-value-content %)) value')

              :text-not-contains
              (not-any? #(string/includes? (str (get-property-value-content %)) match) value')

              :number-gt
              (if match (some #(> (get-property-value-content %) match) value') true)
              :number-gte
              (if match (some #(>= (get-property-value-content %) match) value') true)
              :number-lt
              (if match (some #(< (get-property-value-content %) match) value') true)
              :number-lte
              (if match (some #(<= (get-property-value-content %) match) value') true)

              :between
              (if (seq match)
                (some (fn [value-entity]
                        (let [[start end] match
                              value (get-property-value-content value-entity)
                              conditions [(if start (<= start value) true)
                                          (if end (<= value end) true)]]
                          (if (seq match) (every? true? conditions) true))) value')
                true)

              :date-before
              (if match (some #(< (:block/journal-day %) (:block/journal-day match)) value') true)

              :date-after
              (if match (some #(> (:block/journal-day %) (:block/journal-day match)) value') true)

              :before
              (let [search-value (get-timestamp match)]
                (if search-value (<= (get row property-ident) search-value) true))

              :after
              (let [search-value (get-timestamp match)]
                (if search-value (>= (get row property-ident) search-value) true))

              true)]
        result))
    filters)))

(defn- add-new-object!
  [table class]
  (p/let [block (editor-handler/api-insert-new-block! ""
                                                      {:page (:block/uuid class)
                                                       :properties {:block/tags (:db/id class)}
                                                       :edit-block? false})
          set-data! (get-in table [:data-fns :set-data!])
          _ (set-data! (get-all-objects (db/entity (:db/id class))))]
    (editor-handler/edit-block! (db/entity [:block/uuid (:block/uuid block)]) 0 :unknown-container)))

(rum/defc new-record-button < rum/static
  [class table]
  (ui/tooltip
   (shui/button
    {:variant "ghost"
     :class "!px-1 text-muted-foreground"
     :size :sm
     :on-click (fn [] (add-new-object! table class))}
    (ui/icon "plus"))
   [:div "New record"]))

(rum/defc add-new-row < rum/static
  [table class]
  [:div.py-2.pr-4.cursor-pointer.flex.flex-row.items-center.gap-1.text-muted-foreground.hover:text-foreground.w-full.text-sm
   {:on-click #(add-new-object! table class)}
   (ui/icon "plus" {:size 14})
   [:div "New"]])

(rum/defc objects-inner < rum/static
  [config class object-ids]
  (let [[input set-input!] (rum/use-state "")
        [sorting set-sorting!] (rum/use-state [{:id :block/updated-at, :asc? false}])
        [filters set-filters!] (rum/use-state [])
        [row-filter set-row-filter!] (rum/use-state nil)
        [visible-columns set-visible-columns!] (rum/use-state {})
        [ordered-columns set-ordered-columns!] (rum/use-state [])
        [row-selection set-row-selection!] (rum/use-state {})
        [data set-data!] (rum/use-state [])
        _ (rum/use-effect!
           (fn []
             (p/let [_result (db-async/<get-tag-objects (state/get-current-repo) (:db/id class))]
               (set-data! (get-all-objects (db/entity (:db/id class))))))
           [object-ids])
        columns (-> (build-columns class config)
                    (sort-columns ordered-columns))
        table (shui/table-option {:data data
                                  :columns columns
                                  :state {:sorting sorting
                                          :filters filters
                                          :row-filter row-filter
                                          :row-selection row-selection
                                          :visible-columns visible-columns
                                          :ordered-columns ordered-columns}
                                  :data-fns {:set-data! set-data!
                                             :set-filters! set-filters!
                                             :set-sorting! set-sorting!
                                             :set-visible-columns! set-visible-columns!
                                             :set-ordered-columns! set-ordered-columns!
                                             :set-row-selection! set-row-selection!}})
        selected-rows (shui/table-get-selection-rows row-selection (:rows table))
        selected-rows-count (count selected-rows)]
    (rum/use-effect!
     (fn []
       (set-row-filter! (fn []
                          (fn [row]
                            (row-matched? row input filters)))))
     [input filters])
    [:div.ls-table.flex.flex-col.gap-2.grid
     [:div.flex.items-center.justify-between
      (let [rows-count (count (:rows table))]
        [:div.flex.flex-row.items-center.gap-2
         [:div.font-medium (str (if (pos? selected-rows-count)
                                  selected-rows-count
                                  rows-count)
                                " Objects")]])
      [:div.flex.items-center.gap-1

       (filter-properties columns table)

       (search input {:on-change set-input!
                      :set-input! set-input!})

       (more-actions columns table)

       (new-record-button class table)]]

     (filters-row table)

     (let [columns' (:columns table)
           rows (:rows table)]
       [:div.ls-table-rows.rounded-md.content.overflow-x-auto.force-visible-scrollbar
        (table-header table columns)

        (ui/virtualized-table
         {:custom-scroll-parent (gdom/getElement "main-content-container")
          :total-count (count rows)
          :components {:Table (fn [props]
                                (shui/table {}
                                            (.-children props)))
                       :TableRow (fn [props] (table-row table rows columns' props))}})
        (add-new-row table class)])]))

(rum/defcs objects < mixins/container-id rum/reactive db-mixins/query
  [state class]
  [:div.ml-2
   (let [object-ids (db-model/get-class-objects (state/get-current-repo) (:db/id class))]
    (objects-inner {:container-id (:container-id state)} class object-ids))])
