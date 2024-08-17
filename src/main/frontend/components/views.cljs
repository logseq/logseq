(ns frontend.components.views
  "Different views of blocks"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.impl.entity :as de]
            [frontend.components.block :as component-block]
            [frontend.components.dnd :as dnd]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.handler.property :as property-handler]
            [frontend.common.search-fuzzy :as fuzzy]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [goog.functions :refer [debounce]]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [promesa.core :as p]))

(rum/defc header-checkbox < rum/static
  [{:keys [selected-all? selected-some? toggle-selected-all!]}]
  (let [[show? set-show!] (rum/use-state false)]
    [:label.h-8.w-8.flex.items-center.justify-center.cursor-pointer
     {:html-for "header-checkbox"
      :on-mouse-over #(set-show! true)
      :on-mouse-out #(set-show! false)}
     (shui/checkbox
      {:id "header-checkbox"
       :checked (or selected-all? (and selected-some? "indeterminate"))
       :on-checked-change toggle-selected-all!
       :aria-label "Select all"
       :class (str "flex transition-opacity "
                   (if (or show? selected-all? selected-some?) "opacity-100" "opacity-0"))})]))

(rum/defc row-checkbox < rum/static
  [{:keys [row-selected? row-toggle-selected!]} row _column]
  (let [id (str (:id row) "-" "checkbox")
        [show? set-show!] (rum/use-state false)
        checked? (row-selected? row)]
    [:label.h-8.w-8.flex.items-center.justify-center.cursor-pointer
     {:html-for (str (:id row) "-" "checkbox")
      :on-mouse-over #(set-show! true)
      :on-mouse-out #(set-show! false)}
     (shui/checkbox
      {:id id
       :checked checked?
       :on-checked-change (fn [v] (row-toggle-selected! row v))
       :aria-label "Select row"
       :class (str "flex transition-opacity "
                   (if (or show? checked?) "opacity-100" "opacity-0"))})]))

(defn- header-cp
  [{:keys [column-toggle-sorting! state]} column]
  (let [sorting (:sorting state)
        [asc?] (some (fn [item] (when (= (:id item) (:id column))
                                  (when-some [asc? (:asc? item)]
                                    [asc?]))) sorting)]
    (shui/button
     {:variant "text"
      :class "h-8 !pl-4 !px-2 !py-0 hover:text-foreground w-full justify-start"
      :on-click #(column-toggle-sorting! column)}
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
    (cond
      (uuid? entity)
      (db-property/property-value-content (db/entity [:block/uuid entity]))
      (de/entity? entity)
      (db-property/property-value-content entity)
      :else
      entity)))

(defn- get-property-value-for-search
  [block property]
  (let [type (get-in property [:block/schema :type])
        many? (= :db.cardinality/many (get property :db/cardinality))
        ref-types (into db-property-type/ref-property-types #{:entity})
        number-type? (= :number type)
        v (get block (:db/ident property))
        v' (if many? v [v])
        col (->> (if (ref-types type) (map db-property/property-value-content v') v')
                 (remove nil?))]
    (if number-type?
      (reduce + (filter number? col))
      (string/join ", " col))))

(rum/defc block-title < rum/static
  [config row]
  (let [[show-open? set-show-open!] (rum/use-state false)]
    [:div.relative.w-full
     {:on-mouse-over #(set-show-open! true)
      :on-mouse-out #(set-show-open! false)}
     (component-block/block-container (assoc config :table? true) row)
     [:div.absolute.-top-1.right-0.transition-opacity
      {:class (if show-open? "opacity-100" "opacity-0")}
      (shui/button
       {:variant :ghost
        :size :sm
        :class "!px-2 !py-0 text-muted-foreground"
        :on-click (fn [e]
                    (util/stop e)
                    (let [page? (db/page? row)]
                      (state/sidebar-add-block!
                       (state/get-current-repo)
                       (:db/id row)
                       (if page? :page :block))))}
       [:span.text-xs "Open"]
       (ui/icon "layout-sidebar-right" {:size 14}))]]))

(defn build-columns
  [config properties & {:keys [with-object-name?]
                        :or {with-object-name? true}}]
  (->> (concat
          [{:id :select
            :name "Select"
            :header (fn [table _column] (header-checkbox table))
            :cell (fn [table row column]
                    (row-checkbox table row column))
            :column-list? false}
           (when with-object-name?
             {:id :block/title
              :name "Name"
              :type :string
              :header header-cp
              :cell (fn [_table row _column]
                      (block-title config row))
              :disable-hide? true})]
          (map
           (fn [property]
             (let [ident (or (:db/ident property) (:id property))
                   property (if (de/entity? property)
                              property
                              (or (db/entity ident) property))
                   get-value (or (:get-value property)
                                 (when (de/entity? property)
                                   (fn [row] (get-property-value-for-search row property))))
                   closed-values (seq (:property/closed-values property))
                   closed-value->sort-number (when closed-values
                                               (->> (zipmap (map :db/id closed-values) (range 0 (count closed-values)))
                                                    (into {})))
                   get-value-for-sort (fn [row]
                                        (cond
                                          (= (:db/ident property) :logseq.task/deadline)
                                          (:block/journal-day (get row :logseq.task/deadline))
                                          closed-values
                                          (closed-value->sort-number (:db/id (get row (:db/ident property))))
                                          :else
                                          (if (fn? get-value)
                                            (get-value row)
                                            (get row ident))))]
               {:id ident
                :name (or (:name property)
                          (:block/title property))
                :header (or (:header property)
                            header-cp)
                :cell (or (:cell property)
                          (when (de/entity? property)
                            (fn [_table row _column]
                              (pv/property-value row property (get row (:db/ident property)) {}))))
                :get-value get-value
                :get-value-for-sort get-value-for-sort
                :type (:type property)}))
           properties)

          [{:id :block/created-at
            :name (t :page/created-at)
            :type :date-time
            :header header-cp
            :cell timestamp-cell-cp}
           {:id :block/updated-at
            :name (t :page/updated-at)
            :type :date-time
            :header header-cp
            :cell timestamp-cell-cp}])
         (remove nil?)))

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
       "Properties visibility")
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
    :select 32
    :add-property 160
    (:block/title :block/name) 360
    (:block/created-at :block/updated-at) 160
    180))

(rum/defc add-property-button < rum/static
  []
  [:div.ls-table-header-cell.!border-0
   (shui/button
    {:variant "text"
     :class "h-8 !pl-4 !px-2 !py-0 hover:text-foreground w-full justify-start"}
    (ui/icon "plus")
    "New property")])

(rum/defc action-bar < rum/static
  [table selected-rows {:keys [on-delete-rows]}]
  (shui/table-actions
   {}
   (shui/button
    {:variant "ghost"
     :class "h-8 !pl-4 !px-2 !py-0 hover:text-foreground w-full justify-start"
     :disabled true}
    (str (count selected-rows) " selected"))
   (when (fn? on-delete-rows)
     (shui/button
      {:variant "ghost"
       :class "h-8 !pl-4 !px-2 !py-0 hover:text-foreground w-full justify-start"
       :on-click (fn []
                   (on-delete-rows table selected-rows))}
      (ui/icon "trash")))))

(defn- table-header
  [table columns {:keys [show-add-property? add-property!] :as option} selected-rows]
  (let [set-ordered-columns! (get-in table [:data-fns :set-ordered-columns!])
        items (mapv (fn [column]
                      {:id (:name column)
                       :value (:id column)
                       :content (let [header-fn (:header column)
                                      width (get-column-size column)
                                      select? (= :select (:id column))]
                                  [:div.ls-table-header-cell
                                   {:style {:width width
                                            :min-width width}
                                    :class (when select? "!border-0")}
                                   (if (fn? header-fn)
                                     (header-fn table column)
                                     header-fn)])
                       :disabled? (= (:id column) :select)}) columns)
        items (if show-add-property?
                (conj items
                      {:id "add property"
                       :prop {:style {:width "-webkit-fill-available"
                                      :min-width 160}
                              :on-click (fn [] (when (fn? add-property!) (add-property!)))}
                       :value :add-new-property
                       :content (add-property-button)
                       :disabled? true})
                items)
        selection-rows-count (count selected-rows)]
    (shui/table-header
     (dnd/items items {:vertical? false
                       :on-drag-end (fn [ordered-columns _m]
                                      (set-ordered-columns! ordered-columns))})
     (when (pos? selection-rows-count)
       [:div.absolute.top-0.left-8
        (action-bar table selected-rows option)]))))

(rum/defc table-row < rum/reactive
  [{:keys [row-selected?] :as table} row columns props {:keys [show-add-property?]}]
  (let [row' (db/sub-block (:id row))
        ;; merge entity temporal attributes
        row (reduce (fn [e [k v]] (assoc e k v)) row' (.-kv ^js row))
        columns (if show-add-property?
                  (conj (vec columns)
                        {:id :add-property
                         :cell (fn [_table _row _column])})
                  columns)]
    (shui/table-row
     (merge
      props
      {:key (str (:id row))
       :data-state (when (row-selected? row) "selected")})
     (for [column columns]
       (let [id (str (:id row) "-" (:id column))
             render (get column :cell)
             width (get-column-size column)
             select? (= (:id column) :select)
             add-property? (= (:id column) :add-property)]
         (when render
           (shui/table-cell
            {:key id
             :select? select?
             :add-property? add-property?
             :style {:width width
                     :min-width width}}
            (render table row column))))))))

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
        block-type? (= property-ident :block/type)
        values (->> (mapcat (fn [e] (let [v (get e property-ident)]
                                      (if (set? v) v #{v}))) rows)
                    (remove nil?)
                    (distinct))]
    (->>
     (map (fn [e]
            (let [label (get-property-value-content e)
                  label' (if (and block-type? (= label "class")) "tag" label)]
              {:label label' :value e}))
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
        schema (:schema (db/get-db))
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
                                                      :block/title (:name column)
                                                      :block/schema {:type (:type column)}}]
                               (if (or property
                                       (= :db.cardinality/many (:db/cardinality (get schema id)))
                                       (not= (:type column) :string))
                                 (set-property! (or property internal-property))
                                 (do
                                   (shui/popup-hide!)
                                   (let [property internal-property
                                         new-filter [(:db/ident property) (if (= (:db/ident property) :block/type) :is :text-contains)]
                                         filters' (if (seq filters)
                                                    (conj filters new-filter)
                                                    [new-filter])]
                                     (set-filters! filters'))))))}
        option (cond
                 timestamp?
                 (merge option
                        {:items timestamp-options
                         :input-default-placeholder (if property (:block/title property) "Select")
                         :on-chosen (fn [value]
                                      (shui/popup-hide!)
                                      (let [filters' (conj filters [(:db/ident property) :after value])]
                                        (set-filters! filters')))})
                 property
                 (if (= :checkbox (get-in property [:block/schema :type]))
                   (let [items [{:value true :label "true"}
                                {:value false :label "false"}]]
                     (merge option
                            {:items items
                             :input-default-placeholder (if property (:block/title property) "Select")
                             :on-chosen (fn [value]
                                          (let [filters' (conj filters [(:db/ident property) :is value])]
                                            (set-filters! filters')))}))
                   (let [items (get-property-values (:data table) property)]
                     (merge option
                            {:items items
                             :input-default-placeholder (if property (:block/title property) "Select")
                             :multiple-choices? true
                             :on-chosen (fn [_value _selected? selected]
                                          (let [selected-value (if (de/entity? (first selected))
                                                                 (set (map :block/uuid selected))
                                                                 selected)
                                                filters' (if (seq selected)
                                                           (conj filters [(:db/ident property) :is selected-value])
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
     (when-not (= :block/type (:db/ident property))
       (case (get-in property [:block/schema :type])
         (:default :url :node)
         [:text-contains :text-not-contains]
         :date
         [:date-before :date-after]
         :number
         [:number-gt :number-lt :number-gte :number-lte :between]
         nil)))))

(defn- get-filter-with-changed-operator
  [_property operator value]
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
  [_property [start end] filters set-filters! idx]
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
                (->> (get-property-values (:data table) property)
                     (map (fn [{:keys [value label]}]
                            {:label label
                             :value (or (:block/uuid value) value)}))))
        filters (get-in table [:state :filters])
        set-filters! (:set-filters! data-fns)
        many? (if (or (contains? #{:date-before :date-after :before :after} operator)
                      (contains? #{:checkbox} type))
                false
                true)
        option (cond->
                {:input-default-placeholder (:block/title property)
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
       (let [block-type? (= (:db/ident property) :block/type)
             value (cond
                     (uuid? value)
                     (db/entity [:block/uuid value])
                     (and (coll? value) (every? uuid? value))
                     (set (map #(db/entity [:block/uuid %]) value))
                     (and block-type? (coll? value))
                     (map (fn [v] (if (= v "class") "tag" v)) value)
                     (and block-type? (= value "class"))
                     "tag"
                     :else
                     value)]
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
            "Empty")])))
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
  [{:keys [data-fns columns] :as table}]
  (let [filters (get-in table [:state :filters])
        {:keys [set-filters!]} data-fns]
    (when (seq filters)
      [:div.filters-row.flex.flex-row.items-center.gap-4.flex-wrap.pb-2
       (map-indexed
        (fn [idx filter]
          (let [[property-ident operator value] filter
                property (if (= property-ident :block/title)
                           {:db/ident property-ident
                            :block/title "Name"}
                           (or (db/entity property-ident)
                               (some (fn [column] (when (= (:id column) property-ident)
                                                    {:db/ident (:id column)
                                                     :block/title (:name column)})) columns)))]
            [:div.flex.flex-row.items-center.border.rounded
             (shui/button
              {:class "!px-2 rounded-none border-r"
               :variant "ghost"
               :size :sm
               :disabled true}
              [:span.text-xs (:block/title property)])
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
  (pos? (fuzzy/score (string/lower-case (str input))
                     (string/lower-case (str s)))))

(defn- row-matched?
  [row input filters]
  (and
   ;; full-text-search match
   (if (string/blank? input)
     true
     (when row
       (fuzzy-matched? input (:block/title row))))
   ;; filters check
   (every?
    (fn [[property-ident operator match]]
      (let [value (get row property-ident)
            value' (cond
                     (set? value) value
                     (nil? value) #{}
                     :else #{value})
            entity? (de/entity? (first value'))
            result
            (case operator
              :is
              (if (boolean? match)
                (= (boolean (get-property-value-content (get row property-ident))) match)
                (cond
                  (empty? match)
                  true
                  (and (empty? match) (empty? value'))
                  true
                  :else
                  (if entity?
                    (boolean (seq (set/intersection (set (map :block/uuid value')) match)))
                    (boolean (seq (set/intersection (set value') match))))))

              :is-not
              (if (boolean? match)
                (not= (boolean (get-property-value-content (get row property-ident))) match)
                (cond
                  (and (empty? match) (seq value'))
                  true
                  (and (seq match) (empty? value'))
                  true
                  :else
                  (if entity?
                    (boolean (empty? (set/intersection (set (map :block/uuid value')) match)))
                    (boolean (empty? (set/intersection (set value') match))))))

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

(rum/defc new-record-button < rum/static
  [table]
  (ui/tooltip
   (shui/button
    {:variant "ghost"
     :class "!px-1 text-muted-foreground"
     :size :sm
     :on-click (get-in table [:data-fns :add-new-object!])}
    (ui/icon "plus"))
   [:div "New record"]))

(rum/defc add-new-row < rum/static
  [table]
  [:div.py-1.px-2.cursor-pointer.flex.flex-row.items-center.gap-1.text-muted-foreground.hover:text-foreground.w-full.text-sm.border-b
   {:on-click (get-in table [:data-fns :add-new-object!])}
   (ui/icon "plus" {:size 14})
   [:div "New"]])

(defn- table-filters->persist-state
  [filters]
  (mapv
   (fn [[property operator matches]]
     (let [matches' (cond
                      (de/entity? matches)
                      (:block/uuid matches)

                      (and (coll? matches) (every? de/entity? matches))
                      (set (map :block/uuid matches))

                      :else
                      matches)]
       (if matches'
         [property operator matches']
         [property operator])))
   filters))

(defn- db-set-table-state!
  [entity {:keys [set-sorting! set-filters! set-visible-columns! set-ordered-columns! create-view!]}]
  (let [repo (state/get-current-repo)]
    {:set-sorting!
     (fn [sorting]
       (set-sorting! sorting)
       (p/let [entity (or entity (create-view!))]
         (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/sorting sorting)))
     :set-filters!
     (fn [filters]
       (let [filters (table-filters->persist-state filters)]
         (set-filters! filters)
         (p/let [entity (or entity (create-view!))]
           (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/filters filters))))
     :set-visible-columns!
     (fn [columns]
       (let [hidden-columns (vec (keep (fn [[column visible?]]
                                         (when (false? visible?)
                                           column)) columns))]
         (set-visible-columns! columns)
         (p/let [entity (or entity (create-view!))]
           (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/hidden-columns hidden-columns))))
     :set-ordered-columns!
     (fn [ordered-columns]
       (let [ids (vec (remove #{:select} ordered-columns))]
         (set-ordered-columns! ordered-columns)
         (p/let [entity (or entity (create-view!))]
           (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/ordered-columns ids))))}))

(rum/defc view-inner < rum/static
  [view-entity {:keys [data set-data! columns add-new-object! create-view! title-key] :as option}]
  (let [[input set-input!] (rum/use-state "")
        sorting (:logseq.property.table/sorting view-entity)
        [sorting set-sorting!] (rum/use-state (or sorting [{:id :block/updated-at, :asc? false}]))
        filters (:logseq.property.table/filters view-entity)
        [filters set-filters!] (rum/use-state (or filters []))
        hidden-columns (:logseq.property.table/hidden-columns view-entity)
        [visible-columns set-visible-columns!] (rum/use-state (zipmap hidden-columns (repeat false)))
        ordered-columns (vec (concat [:select] (:logseq.property.table/ordered-columns view-entity)))
        [ordered-columns set-ordered-columns!] (rum/use-state ordered-columns)
        {:keys [set-sorting! set-filters! set-visible-columns! set-ordered-columns!]}
        (db-set-table-state! view-entity {:set-sorting! set-sorting!
                                          :set-filters! set-filters!
                                          :set-visible-columns! set-visible-columns!
                                          :set-ordered-columns! set-ordered-columns!
                                          :create-view! create-view!})
        row-filter-fn (fn []
                        (fn [row]
                          (row-matched? row input filters)))
        [row-filter set-row-filter!] (rum/use-state row-filter-fn)
        debounced-set-row-filter! (debounce set-row-filter! 200)
        [row-selection set-row-selection!] (rum/use-state {})
        columns (sort-columns columns ordered-columns)
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
                                             :set-row-selection! set-row-selection!
                                             :add-new-object! add-new-object!}})
        selected-rows (shui/table-get-selection-rows row-selection (:rows table))]

    (rum/use-effect!
     (fn [] (debounced-set-row-filter!
             (fn []
               (fn [row]
                 (row-matched? row input filters)))))
     [input filters])

    [:div.flex.flex-col.gap-2.grid
     [:div.flex.items-center.justify-between
      [:div.flex.flex-row.items-center.gap-2
       [:div.font-medium.opacity-50
        (t (or title-key :views.table/default-title)
           (count (:rows table)))]]
      [:div.flex.items-center.gap-1

       (filter-properties columns table)

       (search input {:on-change set-input!
                      :set-input! set-input!})

       (more-actions columns table)

       (when add-new-object! (new-record-button table))]]

     (filters-row table)

     (shui/table
      (let [columns' (:columns table)
            rows (:rows table)]
        [:div.ls-table-rows.content.overflow-x-auto.force-visible-scrollbar
         [:div.relative
          (table-header table columns' option selected-rows)

          (ui/virtualized-list
           {:custom-scroll-parent (gdom/getElement "main-content-container")
            :increase-viewport-by 128
            :overscan 128
            :compute-item-key (fn [idx]
                                (let [block (nth rows idx)]
                                  (str "table-row-" (:db/id block))))
            :total-count (count rows)
            :item-content (fn [idx]
                            (let [row (nth rows idx)]
                              (table-row table row columns' {} option)))})

          (when add-new-object!
            (shui/table-footer (add-new-row table)))]]))]))

(rum/defc view < rum/reactive
  [view-entity option]
  (let [view-entity' (db/sub-block (:db/id view-entity))]
    (view-inner view-entity' option)))
