(ns frontend.components.views
  "Different views of blocks"
  (:require [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.impl.entity :as de]
            [dommy.core :as dom]
            [frontend.components.dnd :as dnd]
            [frontend.components.property.config :as property-config]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.hooks :as hooks]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [logseq.db :as ldb]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.shui.table.core :as table-core]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(defn- get-latest-entity
  [e]
  (let [transacted-ids (:updated-ids @(:db/latest-transacted-entity-uuids @state/state))]
    (if (and transacted-ids (contains? transacted-ids (:block/uuid e)))
      (assoc (db/entity (:db/id e))
             :id (:id e)
             :block.temp/refs-count (:block.temp/refs-count e))
      e)))

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

(rum/defc header-index < rum/static
  []
  [:label.h-8.w-6.flex.items-center.justify-center
   {:html-for "header-index"
    :title "Row number"}
   "ID"])

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

(defonce *last-header-action-target (atom nil))

(defn header-cp
  [{:keys [view-entity column-set-sorting! state]} column]
  (let [sorting (:sorting state)
        [asc?] (some (fn [item] (when (= (:id item) (:id column))
                                  (when-some [asc? (:asc? item)]
                                    [asc?]))) sorting)
        property (db/entity (:id column))
        pinned? (when property
                  (contains? (set (map :db/id (:logseq.property.table/pinned-columns view-entity)))
                             (:db/id property)))
        sub-content (fn [{:keys [id]}]
                      [:<>
                       (when property
                         (shui/dropdown-menu-sub
                          (shui/dropdown-menu-sub-trigger
                           [:div.flex.flex-row.items-center.gap-1
                            (ui/icon "settings" {:size 15})
                            [:div "Configure"]])
                          (shui/dropdown-menu-sub-content
                           [:div.ls-property-dropdown-editor.-m-1
                            (property-config/dropdown-editor property nil {})])))
                       (shui/dropdown-menu-item
                        {:key "asc"
                         :on-click #(column-set-sorting! sorting column true)}
                        [:div.flex.flex-row.items-center.gap-1
                         (ui/icon "arrow-up" {:size 15})
                         [:div "Sort ascending"]])
                       (shui/dropdown-menu-item
                        {:key "desc"
                         :on-click #(column-set-sorting! sorting column false)}
                        [:div.flex.flex-row.items-center.gap-1
                         (ui/icon "arrow-down" {:size 15})
                         [:div "Sort descending"]])
                       (when property
                         (shui/dropdown-menu-item
                          {:on-click (fn [_e]
                                       (if pinned?
                                         (db-property-handler/delete-property-value! (:db/id view-entity)
                                                                                     :logseq.property.table/pinned-columns
                                                                                     (:db/id property))
                                         (property-handler/set-block-property! (state/get-current-repo)
                                                                               (:db/id view-entity)
                                                                               :logseq.property.table/pinned-columns
                                                                               (:db/id property)))
                                       (shui/popup-hide! id))}
                          [:div.flex.flex-row.items-center.gap-1
                           (ui/icon "pin" {:size 15})
                           [:div (if pinned? "Unpin" "Pin")]]))])]
    (shui/button
     {:variant "text"
      :class "h-8 !pl-4 !px-2 !py-0 hover:text-foreground w-full justify-start"
      :on-mouse-up (fn [^js e]
                     (when-let [^js el (some-> (.-target e) (.closest "[aria-roledescription=sortable]"))]
                       (when (and (or (nil? @*last-header-action-target)
                                      (not= el @*last-header-action-target))
                                  (string/blank? (some-> el (.-style) (.-transform))))
                         (shui/popup-show! el sub-content
                                           {:align "start" :as-dropdown? true
                                            :on-before-hide (fn []
                                                              (reset! *last-header-action-target el)
                                                              (js/setTimeout #(reset! *last-header-action-target nil) 128))}))))}
     (let [title (str (:name column))]
       [:span {:title title
               :class "max-w-full overflow-hidden text-ellipsis"}
        title])
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

(defn- get-property-value-content
  [entity]
  (when entity
    (cond
      (uuid? entity)
      (db-property/property-value-content (db/entity [:block/uuid entity]))
      (de/entity? entity)
      (db-property/property-value-content entity)
      (keyword? entity)
      (str entity)
      :else
      entity)))

(defn- get-property-value-for-search
  [block property]
  (let [type (:logseq.property/type property)
        many? (= :db.cardinality/many (get property :db/cardinality))
        number-type? (= :number type)
        v (get block (:db/ident property))
        v' (if many? v [v])
        col (->> (if (db-property-type/all-ref-property-types type) (map db-property/property-value-content v') v')
                 (remove nil?))]
    (if number-type?
      (reduce + (filter number? col))
      (string/join ", " col))))

(rum/defcs block-container < rum/reactive db-mixins/query
  (rum/local false ::deleted?)
  [state config row table]
  (let [*deleted? (::deleted? state)
        container (state/get-component :block/container)
        row' (db/sub-block (:db/id row))]
    (if (nil? row')                    ; this row has been deleted
      (when-not @*deleted?
        (when-let [f (get-in table [:data-fns :set-data!])]
          (f (remove (fn [r] (= (:id r) (:id row))) (:data table)))
          (reset! *deleted? true)
          nil))
      [:div.relative.w-full
       (container config row')])))

(defn build-columns
  [config properties & {:keys [with-object-name? with-id? add-tags-column?]
                        :or {with-object-name? true
                             with-id? true
                             add-tags-column? true}}]
  (let [;; FIXME: Shouldn't file graphs have :block/tags?
        add-tags-column?' (and (config/db-based-graph? (state/get-current-repo)) add-tags-column?)
        properties' (->>
                     (if (or (some #(= (:db/ident %) :block/tags) properties) (not add-tags-column?'))
                       properties
                       (conj properties (db/entity :block/tags)))
                     (remove nil?))]
    (->> (concat
          [{:id :select
            :name "Select"
            :header (fn [table _column] (header-checkbox table))
            :cell (fn [table row column]
                    (row-checkbox table row column))
            :column-list? false
            :resizable? false}
           (when with-id?
             {:id :id
              :name "ID"
              :header (fn [_table _column] (header-index))
              :cell (fn [table row _column]
                      (let [rows (map :id (:rows table))]
                        (inc (.indexOf rows (:id row)))))
              :resizable? false})
           (when with-object-name?
             {:id :block/title
              :name "Name"
              :type :string
              :header header-cp
              :cell (fn [table row _column]
                      (block-container (assoc config
                                              :raw-title? (ldb/asset? row)
                                              :table? true)
                                       row
                                       table))
              :disable-hide? true})]
          (keep
           (fn [property]
             (when-let [ident (or (:db/ident property) (:id property))]
               ;; Hide properties that shouldn't ever be editable or that do not display well in a table
               (when-not (or (contains? #{:logseq.property/built-in? :logseq.property.asset/checksum :logseq.property.class/properties
                                          :block/created-at :block/updated-at :block/order :block/collapsed?
                                          :logseq.property/created-from-property}
                                        ident)
                             (and with-object-name? (= :block/title ident))
                             (contains? #{:map :entity} (:logseq.property/type property)))
                 (let [property (if (de/entity? property)
                                  property
                                  (or (merge (db/entity ident) property) property)) ; otherwise, :cell/:header/etc. will be removed
                       get-value (or (:get-value property)
                                     (when (de/entity? property)
                                       (fn [row] (get-property-value-for-search row property))))
                       closed-values (seq (:property/closed-values property))
                       closed-value->sort-number (when closed-values
                                                   (->> (zipmap (map :db/id closed-values) (range 0 (count closed-values)))
                                                        (into {})))
                       get-value-for-sort (fn [row]
                                            (cond
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
                                  (pv/property-value row property {}))))
                    :get-value get-value
                    :get-value-for-sort get-value-for-sort
                    :type (:type property)}))))
           properties')

          [{:id :block/created-at
            :name (t :page/created-at)
            :type :datetime
            :header header-cp
            :cell timestamp-cell-cp}
           {:id :block/updated-at
            :name (t :page/updated-at)
            :type :datetime
            :header header-cp
            :cell timestamp-cell-cp}])
         (remove nil?))))

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
       "Columns visibility")
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
  [column sized-columns]
  (let [id (:id column)
        size (get sized-columns id)]
    (cond
      (= id :id)
      48

      (number? size)
      size

      (= id :logseq.property/query)
      400

      :else
      (case id
        :select 32
        :add-property 160
        (:block/title :block/name) 360
        (:block/created-at :block/updated-at) 160
        180))))

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
       :class "h-8 !pl-0 !px-2 !py-0 text-muted-foreground hover:text-foreground w-full justify-start"
       :on-click (fn []
                   (on-delete-rows table selected-rows))}
      (ui/icon "trash")))))

(rum/defc column-resizer
  [_column on-sized!]
  (let [*el (rum/use-ref nil)
        [dx set-dx!] (rum/use-state nil)
        [width set-width!] (rum/use-state nil)
        add-resizing-class #(dom/add-class! js/document.documentElement "is-resizing-buf")
        remove-resizing-class #(dom/remove-class! js/document.documentElement "is-resizing-buf")]

    (hooks/use-effect!
     (fn []
       (when (number? dx)
         (some-> (rum/deref *el)
                 (dom/set-style! :transform (str "translate3D(" dx "px , 0, 0)")))))
     [dx])

    (hooks/use-effect!
     (fn []
       (when-let [el (and (fn? js/window.interact) (rum/deref *el))]
         (let [*field-rect (atom nil)
               min-width 40
               max-width 500]
           (-> (js/interact el)
               (.draggable
                (bean/->js
                 {:listeners
                  {:start (fn []
                            (let [{:keys [width right] :as rect} (bean/->clj (.toJSON (.getBoundingClientRect (.closest el ".ls-table-header-cell"))))
                                  left-dx (if (>= width min-width) (- min-width width) 0)
                                  right-dx (if (<= width max-width) (- max-width width) 0)]
                              (reset! *field-rect rect)
                              (swap! *field-rect assoc
                                 ;; calculate left/right boundary
                                     :left-dx left-dx
                                     :right-dx right-dx
                                     :left-b (inc (+ left-dx right))
                                     :right-b (inc (+ right-dx right)))
                              (dom/add-class! el "is-active")))
                   :move (fn [^js e]
                           (let [dx (.-dx e)
                                 pointer-x (js/Math.floor (.-clientX e))
                                 {:keys [left-b right-b]} @*field-rect
                                 left-b (js/Math.floor left-b)
                                 right-b (js/Math.floor right-b)]
                             (when (and (> pointer-x left-b)
                                        (< pointer-x right-b))
                               (set-dx! (fn [dx']
                                          (if (contains? #{min-width max-width} (abs dx'))
                                            dx'
                                            (let [to-dx (+ (or dx' 0) dx)
                                                  {:keys [left-dx right-dx]} @*field-rect]
                                              (cond
                                                 ;; left
                                                (neg? to-dx) (if (> (abs left-dx) (abs to-dx)) to-dx left-dx)
                                                 ;; right
                                                (pos? to-dx) (if (> right-dx to-dx) to-dx right-dx)))))))))
                   :end (fn []
                          (set-dx!
                           (fn [dx]
                             (let [w (js/Math.round (+ dx (:width @*field-rect)))]
                               (set-width! (cond
                                             (< w min-width) min-width
                                             (> w max-width) max-width
                                             :else w)))
                             (reset! *field-rect nil)
                             (dom/remove-class! el "is-active")
                             0)))}}))
               (.styleCursor false)
               (.on "dragstart" add-resizing-class)
               (.on "dragend" remove-resizing-class)
               (.on "mousedown" util/stop-propagation)))))
     [])

    (hooks/use-effect!
     (fn []
       (when (number? width)
         (on-sized! width)))
     [width])

    [:a.ls-table-resize-handle
     {:data-no-dnd true
      :ref *el}]))

(defn- table-header-cell
  [table column]
  (let [header-fn (:header column)
        sized-columns (get-in table [:state :sized-columns])
        set-sized-columns! (get-in table [:data-fns :set-sized-columns!])
        width (get-column-size column sized-columns)
        select? (= :select (:id column))]
    [:div.ls-table-header-cell
     {:style {:width width
              :min-width width}
      :class (when select? "!border-0")}
     (if (fn? header-fn)
       (header-fn table column)
       header-fn)
                                   ;; resize handle
     (when-not (false? (:resizable? column))
       (column-resizer column
                       (fn [size]
                         (set-sized-columns! (assoc sized-columns (:id column) size)))))]))

(defn- table-header
  [table {:keys [show-add-property? add-property!] :as option} selected-rows]
  (let [set-ordered-columns! (get-in table [:data-fns :set-ordered-columns!])
        pinned (get-in table [:state :pinned-columns])
        unpinned (get-in table [:state :unpinned-columns])
        build-item (fn [column]
                     {:id (:name column)
                      :value (:id column)
                      :content (table-header-cell table column)
                      :disabled? (= (:id column) :select)})
        pinned-items (mapv build-item pinned)
        unpinned-items (if show-add-property?
                         (conj (mapv build-item unpinned)
                               {:id "add property"
                                :prop {:style {:width "-webkit-fill-available"
                                               :min-width 160}
                                       :on-click (fn [] (when (fn? add-property!) (add-property!)))}
                                :value :add-new-property
                                :content (add-property-button)
                                :disabled? true})
                         (mapv build-item unpinned))
        selection-rows-count (count selected-rows)]
    (shui/table-header
     (when (seq pinned-items)
       [:div.sticky-columns.flex.flex-row
        (dnd/items pinned-items {:vertical? false
                                 :on-drag-end (fn [ordered-columns _m]
                                                (set-ordered-columns! ordered-columns))})])
     (when (seq unpinned-items)
       [:div.flex.flex-row
        (dnd/items unpinned-items
                   {:vertical? false
                    :on-drag-end (fn [ordered-columns _m]
                                   (set-ordered-columns! ordered-columns))})])
     (when (pos? selection-rows-count)
       [:div.table-action-bar.absolute.top-0.left-8
        (action-bar table selected-rows option)]))))

(rum/defc row-cell < rum/static
  [table row column render cell-opts idx first-col-rendered? set-first-col-rendered!]
  (let [primary-key? (or (= idx 1) (= (:id column) :block/title))]
    (when primary-key?
      (hooks/use-effect!
       (fn []
         (let [timeout (js/setTimeout #(set-first-col-rendered! true) 0)]
           #(js/clearTimeout timeout)))
       []))

    (shui/table-cell cell-opts
                     (when (or primary-key? first-col-rendered?)
                       (render table row column)))))

(rum/defc table-row-inner < rum/static
  [{:keys [row-selected?] :as table} row props {:keys [show-add-property?]}]
  (let [[first-col-rendered? set-first-col-rendered!] (rum/use-state false)
        pinned-columns (get-in table [:state :pinned-columns])
        unpinned (get-in table [:state :unpinned-columns])
        unpinned-columns (if show-add-property?
                           (conj (vec unpinned)
                                 {:id :add-property
                                  :cell (fn [_table _row _column])})
                           unpinned)
        sized-columns (get-in table [:state :sized-columns])
        row-cell-f (fn [idx column]
                     (let [idx (inc idx)
                           id (str (:id row) "-" (:id column))
                           render (get column :cell)
                           width (get-column-size column sized-columns)
                           select? (= (:id column) :select)
                           add-property? (= (:id column) :add-property)
                           cell-opts {:key id
                                      :select? select?
                                      :add-property? add-property?
                                      :style {:width width
                                              :min-width width}}]
                       (when render
                         (row-cell table row column render cell-opts idx first-col-rendered? set-first-col-rendered!))))]
    (shui/table-row
     (merge
      props
      {:key (str (:id row))
       :data-state (when (row-selected? row) "selected")})
     [:div.sticky-columns.flex.flex-row
      (map-indexed row-cell-f pinned-columns)]
     [:div.flex.flex-row
      (map-indexed row-cell-f unpinned-columns)])))

(rum/defc table-row < rum/reactive
  [table row props option]
  (let [row' (db/sub-block (:id row))
        ;; merge entity temporal attributes
        row (reduce (fn [e [k v]] (assoc e k v)) row' (.-kv ^js row))]
    (table-row-inner table row props option)))

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

(defn- get-property-values
  [rows property]
  (let [property-ident (:db/ident property)
        values (->> (mapcat (fn [e] (let [e' (db/entity (:db/id e))
                                          v (get e' property-ident)]
                                      (if (set? v) v #{v}))) rows)
                    (remove nil?)
                    (distinct))]
    (->>
     (map (fn [e]
            (let [label (get-property-value-content e)]
              {:label (str label) :value e}))
          values)
     (sort-by :label))))

(defn datetime-property?
  [property]
  (or
   (= :datetime (:logseq.property/type property))
   (contains? #{:block/created-at :block/updated-at} (:db/ident property))))

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
        timestamp? (datetime-property? property)
        set-filters! (:set-filters! data-fns)
        filters (get-in table [:state :filters])
        columns (remove #(or (false? (:column-list? %))
                             (= :id (:id %))) columns)
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
                                                      :logseq.property/type (:type column)}]
                               (if (or property
                                       (= :db.cardinality/many (:db/cardinality (get schema id)))
                                       (not= (:type column) :string))
                                 (set-property! (or property internal-property))
                                 (do
                                   (shui/popup-hide!)
                                   (let [property internal-property
                                         new-filter [(:db/ident property) :text-contains]
                                         filters' (if (seq (:filters filters))
                                                    (conj (:filters filters) new-filter)
                                                    [new-filter])]
                                     (set-filters! {:or? (:or? filters)
                                                    :filters filters'}))))))}
        option (cond
                 timestamp?
                 (merge option
                        {:items timestamp-options
                         :input-default-placeholder (if property (:block/title property) "Select")
                         :on-chosen (fn [value]
                                      (shui/popup-hide!)
                                      (let [filters' (conj (:filters filters) [(:db/ident property) :after value])]
                                        (set-filters! {:or? (:or? filters)
                                                       :filters filters'})))})
                 property
                 (if (= :checkbox (:logseq.property/type property))
                   (let [items [{:value true :label "true"}
                                {:value false :label "false"}]]
                     (merge option
                            {:items items
                             :input-default-placeholder (if property (:block/title property) "Select")
                             :on-chosen (fn [value]
                                          (let [filters' (conj (:filters filters) [(:db/ident property) :is value])]
                                            (set-filters! {:or? (:or? filters)
                                                           :filters filters'})))}))
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
                                                           (conj (:filters filters) [(:db/ident property) :is selected-value])
                                                           (:filters filters))]
                                            (set-filters! {:or? (:or? filters)
                                                           :filters filters'})))})))
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
  (if (datetime-property? property)
    [:before :after]
    (concat
     [:is :is-not]
     (case (:logseq.property/type property)
       (:default :url :node)
       [:text-contains :text-not-contains]
       (:date)
       [:date-before :date-after]
       :number
       [:number-gt :number-lt :number-gte :number-lte :between]
       nil))))

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
                      (let [new-filters (update filters :filters
                                                (fn [col]
                                                  (update col idx
                                                          (fn [[property _old-operator value]]
                                                            (let [value' (get-filter-with-changed-operator property operator value)]
                                                              (if value'
                                                                [property operator value']
                                                                [property operator]))))))]
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
                   (let [new-filters (update filters :filters
                                             (fn [col]
                                               (update col idx
                                                       (fn [[property operator _old_value]]
                                                         (if (nil? value)
                                                           [property operator]
                                                           [property operator value])))))]
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
                   (let [new-filters (update filters :filters
                                             (fn [col]
                                               (update col idx
                                                       (fn [[property operator _old_value]]
                                                         (if (nil? value)
                                                           [property operator]
                                                           [property operator value])))))]
                     (set-filters! new-filters))))
     :class "w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"})])

(rum/defc filter-value-select < rum/static
  [{:keys [data-fns] :as table} property value operator idx]
  (let [type (:logseq.property/type property)
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
                                    new-filters (update filters :filters
                                                        (fn [col]
                                                          (update col idx
                                                                  (fn [[property operator _value]]
                                                                    [property operator value']))))]
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
       (let [value (cond
                     (uuid? value)
                     (db/entity [:block/uuid value])
                     (and (coll? value) (every? uuid? value))
                     (set (map #(db/entity [:block/uuid %]) value))
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
            "All")])))
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
       {:auto-focus false
        :value (or value "")
        :onChange (fn [e]
                    (let [value (util/evalue e)
                          number-value (and number-operator? (when-not (string/blank? value)
                                                               (util/safe-parse-float value)))]
                      (let [new-filters (update filters :filters
                                                (fn [col]
                                                  (update col idx
                                                          (fn [[property operator _value]]
                                                            (if (and number-operator? (nil? number-value))
                                                              [property operator]
                                                              [property operator (or number-value value)])))))]
                        (set-filters! new-filters))))
        :class "w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"})

      (filter-value-select table property value operator idx))))

(rum/defc filters-row < rum/static
  [{:keys [data-fns columns] :as table}]
  (let [filters (get-in table [:state :filters])
        {:keys [set-filters!]} data-fns]
    (when (seq (:filters filters))
      [:div.filters-row.flex.flex-row.items-center.gap-4.justify-between.flex-wrap.py-2
       [:div.flex.flex-row.items-center.gap-2
        (map-indexed
         (fn [idx filter']
           (let [[property-ident operator value] filter'
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
               {:class "!px-1 rounded-none text-muted-foreground"
                :variant "ghost"
                :size :sm
                :on-click (fn [_e]
                            (let [new-filters (update filters :filters (fn [col] (vec (remove #{filter'} col))))]
                              (set-filters! new-filters)))}
               (ui/icon "x"))]))
         (:filters filters))]
       (when (> (count (:filters filters)) 1)
         [:div
          (shui/select
           {:default-value (if (:or? filters) "or" "and")
            :on-value-change (fn [v]
                               (set-filters! (assoc filters :or? (= v "or"))))}
           (shui/select-trigger
            {:class "opacity-75 hover:opacity-100 !px-2 !py-0 !h-6"}
            (shui/select-value
             {:placeholder "Match"}))
           (shui/select-content
            (shui/select-group
             (shui/select-item {:value "and"} "Match all filters")
             (shui/select-item {:value "or"} "Match any filter"))))])])))

(defn- row-matched?
  [row input filters]
  (let [row (get-latest-entity row)
        or? (:or? filters)
        check-f (if or? some every?)]
    (and
     ;; full-text-search match
     (if (string/blank? input)
       true
       (when row
       ;; fuzzy search is too slow
         (string/includes? (string/lower-case (:block/title row)) (string/lower-case input))))
     ;; filters check
     (check-f
      (fn [[property-ident operator match]]
        (if (nil? match)
          true
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
                  (some (fn [v]
                          (if-let [property-value (get-property-value-content v)]
                            (string/includes? (string/lower-case property-value) (string/lower-case match))
                            false))
                        value')

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
            result)))
      (:filters filters)))))

(rum/defc new-record-button < rum/static
  [table view-entity]
  (let [asset? (and (:logseq.property/built-in? view-entity)
                    (= (:block/name view-entity) "asset"))]
    (ui/tooltip
     (shui/button
      {:variant "ghost"
       :class "!px-1 text-muted-foreground"
       :size :sm
       :on-click (get-in table [:data-fns :add-new-object!])}
      (ui/icon (if asset? "upload" "plus")))
     [:div "New record"])))

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
       (if (some? matches')
         [property operator matches']
         [property operator])))
   filters))

(defn- db-set-table-state!
  [entity {:keys [set-sorting! set-filters! set-visible-columns!
                  set-ordered-columns! set-sized-columns!]}]
  (let [repo (state/get-current-repo)]
    {:set-sorting!
     (fn [sorting]
       (set-sorting! sorting)
       (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/sorting sorting))
     :set-filters!
     (fn [filters]
       (let [filters (-> (update filters :filters table-filters->persist-state)
                         (update :or? boolean))]
         (set-filters! filters)
         (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/filters filters)))
     :set-visible-columns!
     (fn [columns]
       (let [hidden-columns (vec (keep (fn [[column visible?]]
                                         (when (false? visible?)
                                           column)) columns))]
         (set-visible-columns! columns)
         (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/hidden-columns hidden-columns)))
     :set-ordered-columns!
     (fn [ordered-columns]
       (let [ids (vec (remove #{:select} ordered-columns))]
         (set-ordered-columns! ordered-columns)
         (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/ordered-columns ids)))
     :set-sized-columns!
     (fn [sized-columns]
       (set-sized-columns! sized-columns)
       (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/sized-columns sized-columns))}))

(rum/defc table-view < rum/static
  [table option row-selection add-new-object! *scroller-ref]
  (let [selected-rows (shui/table-get-selection-rows row-selection (:rows table))
        [ready? set-ready?] (rum/use-state false)
        *rows-wrap (rum/use-ref nil)]

    (hooks/use-effect!
     (fn [] (set-ready? true))
     [])

    (shui/table
     (let [rows (:rows table)]
       [:div.ls-table-rows.content.overflow-x-auto.force-visible-scrollbar
        {:ref *rows-wrap}
        (when ready?
          [:div.relative
           (table-header table option selected-rows)

           (ui/virtualized-list
            {:ref #(reset! *scroller-ref %)
             :custom-scroll-parent (or (some-> (rum/deref *rows-wrap) (.closest ".sidebar-item-list"))
                                       (gdom/getElement "main-content-container"))
             :increase-viewport-by {:top 300 :bottom 300}
             :compute-item-key (fn [idx]
                                 (let [block (nth rows idx)]
                                   (str "table-row-" (:db/id block))))
             :total-count (count rows)
             :item-content (fn [idx]
                             (let [row (nth rows idx)]
                               (table-row table row {} option)))})

           (when add-new-object!
             (shui/table-footer (add-new-row table)))])]))))

(rum/defc list-view < rum/static
  [config view-entity result]
  (when-let [->hiccup (state/get-component :block/->hiccup)]
    (let [group-by-page? (not (every? db/page? result))
          result (if group-by-page?
                   (group-by :block/page result)
                   result)]
      (->hiccup result
                (assoc config
                       :custom-query? true
                       :current-block (:db/id view-entity)
                       :query (:block/title view-entity)
                       :breadcrumb-show? (if group-by-page? true false)
                       :group-by-page? group-by-page?
                       :ref? true)))))

(rum/defc gallery-card-item
  [table view-entity block config]
  [:div.ls-card-item.content
   {:key (str "view-card-" (:db/id view-entity) "-" (:db/id block))}
   [:div.-ml-4
    (block-container (assoc config
                            :id (str (:block/uuid block))
                            :gallery-view? true)
                     block
                     table)]])

(rum/defcs gallery-view < rum/static mixins/container-id
  [state config table view-entity blocks *scroller-ref]
  (let [config' (assoc config :container-id (:container-id state))]
    [:div.ls-cards
     (when (seq blocks)
       (ui/virtualized-grid
        {:ref #(reset! *scroller-ref %)
         :total-count (count blocks)
         :custom-scroll-parent (gdom/getElement "main-content-container")
         :item-content (fn [idx]
                         (when-let [block (nth blocks idx)]
                           (gallery-card-item table view-entity block config')))}))]))

(defn- run-effects!
  [option {:keys [data columns state data-fns]} input input-filters set-input-filters! *scroller-ref gallery?]
  (let [{:keys [filters sorting]} state
        {:keys [set-row-filter! set-data!]} data-fns]
    (hooks/use-effect!
     (fn []
       (let [new-input-filters [input filters]]
         (when-not (= input-filters new-input-filters)
           (set-input-filters! [input filters])
           (set-row-filter!
            (fn []
              (fn [row]
                (row-matched? row input filters)))))))
     [input filters])

    (hooks/use-effect!
     (fn []
       ;; Entities might be outdated
       (let [;; TODO: should avoid this for better performance, 300ms for 40k pages
             new-data (map get-latest-entity data)
             ;; TODO: db support native order-by, limit, offset, 350ms for 40k pages
             data' (table-core/table-sort-rows new-data sorting columns)]
         (when (not= data' data)
           (set-data! data'))
         (when (and (:current-page? (:config option)) (seq data) (map? (first data)) (:block/uuid (first data)))
           (ui-handler/scroll-to-anchor-block @*scroller-ref data' gallery?)
           (state/set-state! :editor/virtualized-scroll-fn #(ui-handler/scroll-to-anchor-block @*scroller-ref data' gallery?)))))
     [sorting data])))

(rum/defc view-sorting-item
  [table sorting id name asc? set-sorting!]
  [:div.flex.flex-row.gap-2.items-center.justify-between.px-2
   [:div:div.flex.flex-row.gap-1.items-center
    (shui/button
     {:size :sm
      :class "!px-1"
      :variant :ghost
      :title "Drag && Drop to reorder"}
     (shui/tabler-icon "grip-vertical" {:size 14}))
    [:div.text-muted-foreground.whitespace-nowrap (str name ":")]]

   [:div.flex.flex-row.gap-2.items-center
    (shui/select
     {:default-value (if asc? "asc" "desc")
      :on-value-change (fn [v]
                         (let [asc? (= v "asc")
                               f (:column-set-sorting! table)]
                           (when f
                             (f sorting {:id id} asc?))))}
     (shui/select-trigger
      {:class "order-button !px-2 !py-0 !h-8"}
      (shui/select-value
       {:placeholder "Select order"}))
     (shui/select-content
      (shui/select-group
       (shui/select-item {:value "asc"} "Ascending")
       (shui/select-item {:value "desc"} "Descending"))))
    (shui/button
     {:variant "ghost"
      :class "text-muted-foreground !px-1"
      :size :sm
      :on-click (fn []
                  (let [f (:column-set-sorting! table)
                        new-sorting (f sorting {:id id} nil)
                        f (get-in table [:data-fns :set-sorting!])]
                    (set-sorting! new-sorting)
                    (f new-sorting)
                    (when (empty? new-sorting)
                      (shui/popup-hide!))))}
     (ui/icon "x"))]])

(rum/defc view-sorting-config
  [table sorting columns]
  (let [[sorting set-sorting!] (rum/use-state sorting)]
    [:div.ls-view-order-setting.flex.flex-col.gap-2.py-2.text-sm
     (let [items (for [{:keys [id asc?]} sorting]
                   (when-let [name (some (fn [column] (when (= id (:id column))
                                                        (:name column))) columns)]
                     {:id (str id)
                      :value id
                      :content (view-sorting-item table sorting id name asc? set-sorting!)}))]
       (dnd/items items
                  {:on-drag-end (fn [ordered-columns]
                                  (let [f (get-in table [:data-fns :set-sorting!])
                                        new-sorting (mapv (fn [column] (some #(when (= column (:id %)) %) sorting)) ordered-columns)]
                                    (set-sorting! new-sorting)
                                    (f new-sorting)))}))
     (shui/dropdown-menu-item
      {:class "text-muted-foreground"
       :on-click (fn []
                   (let [f (get-in table [:data-fns :set-sorting!])]
                     (set-sorting! nil)
                     (f nil)
                     (shui/popup-hide!)))}
      (ui/icon "trash" {:size 15})
      [:span.ml-1 "Delete sort"])]))

(rum/defc view-sorting
  [table columns sorting]
  (shui/button
   {:variant "ghost"
    :class "text-muted-foreground !px-1"
    :size :sm
    :on-click (fn [e]
                (shui/popup-show! (.-target e)
                                  (fn [] (view-sorting-config table sorting columns))
                                  {:align :end}))}
   (ui/icon "arrows-up-down")))

(rum/defc ^:large-vars/cleanup-todo view-inner < rum/static
  [view-entity {:keys [data set-data! columns add-new-object! views-title title-key render-empty-title?] :as option
                :or {render-empty-title? false}}
   *scroller-ref]
  (let [[input set-input!] (rum/use-state "")
        sorting* (:logseq.property.table/sorting view-entity)
        sorting (if (= sorting* :logseq.property/empty-placeholder) nil sorting*)
        [sorting set-sorting!] (rum/use-state sorting)
        filters (:logseq.property.table/filters view-entity)
        [filters set-filters!] (rum/use-state (or filters {}))
        default-visible-columns (if-let [hidden-columns (conj (:logseq.property.table/hidden-columns view-entity) :id)]
                                  (zipmap hidden-columns (repeat false))
                                  ;; This case can happen for imported tables
                                  (if (seq (:logseq.property.table/ordered-columns view-entity))
                                    (zipmap (set/difference (set (map :id columns))
                                                            (set (:logseq.property.table/ordered-columns view-entity))
                                                            #{:select :block/created-at :block/updated-at})
                                            (repeat false))
                                    {}))
        [visible-columns set-visible-columns!] (rum/use-state default-visible-columns)
        ordered-columns (vec (concat [:select] (:logseq.property.table/ordered-columns view-entity)))
        sized-columns (:logseq.property.table/sized-columns view-entity)
        [ordered-columns set-ordered-columns!] (rum/use-state ordered-columns)
        [sized-columns set-sized-columns!] (rum/use-state sized-columns)
        {:keys [set-sorting! set-filters! set-visible-columns! set-ordered-columns! set-sized-columns!]}
        (db-set-table-state! view-entity {:set-sorting! set-sorting!
                                          :set-filters! set-filters!
                                          :set-visible-columns! set-visible-columns!
                                          :set-sized-columns! set-sized-columns!
                                          :set-ordered-columns! set-ordered-columns!})
        row-filter-fn (fn []
                        (fn [row]
                          (row-matched? row input filters)))
        [row-filter set-row-filter!] (rum/use-state row-filter-fn)
        [input-filters set-input-filters!] (rum/use-state [input filters])
        [row-selection set-row-selection!] (rum/use-state {})
        columns (sort-columns columns ordered-columns)
        select? (first (filter (fn [item] (= (:id item) :select)) columns))
        id? (first (filter (fn [item] (= (:id item) :id)) columns))
        pinned-properties (set (cond->> (map :db/ident (:logseq.property.table/pinned-columns view-entity))
                                 id?
                                 (cons :id)
                                 select?
                                 (cons :select)))
        {pinned true unpinned false} (group-by (fn [item]
                                                 (contains? pinned-properties (:id item)))
                                               (remove (fn [column]
                                                         (false? (get visible-columns (:id column))))
                                                       columns))
        table-map {:view-entity view-entity
                   :data data
                   :columns columns
                   :state {:sorting sorting
                           :filters filters
                           :row-filter row-filter
                           :row-selection row-selection
                           :visible-columns visible-columns
                           :sized-columns sized-columns
                           :ordered-columns ordered-columns
                           :pinned-columns pinned
                           :unpinned-columns unpinned}
                   :data-fns {:set-data! set-data!
                              :set-row-filter! set-row-filter!
                              :set-filters! set-filters!
                              :set-sorting! set-sorting!
                              :set-visible-columns! set-visible-columns!
                              :set-ordered-columns! set-ordered-columns!
                              :set-sized-columns! set-sized-columns!
                              :set-row-selection! set-row-selection!
                              :add-new-object! add-new-object!}}
        table (shui/table-option table-map)
        *view-ref (rum/use-ref nil)
        display-type (or (:db/ident (get view-entity :logseq.property.view/type))
                         :logseq.property.view/type.table)
        gallery? (= display-type :logseq.property.view/type.gallery)]

    (run-effects! option table-map input input-filters set-input-filters! *scroller-ref gallery?)

    [:div.flex.flex-col.gap-2.grid
     {:ref *view-ref}
     (ui/foldable
      [:div.flex.flex-1.flex-wrap.items-center.justify-between.gap-1
       (when-not render-empty-title?
         [:div.flex.flex-row.items-center.gap-2
          (or
           views-title
           [:div.font-medium.opacity-50.text-sm
            (t (or title-key :views.table/default-title)
               (count (:rows table)))])])
       [:div.view-actions.flex.items-center.gap-1

        (when (seq sorting)
          (view-sorting table columns sorting))

        (filter-properties columns table)

        (search input {:on-change set-input!
                       :set-input! set-input!})

        [:div.text-muted-foreground.text-sm
         (pv/property-value view-entity (db/entity :logseq.property.view/type) {})]

        (more-actions columns table)

        (when add-new-object! (new-record-button table view-entity))]]
      [:div.ls-view-body.flex.flex-col.gap-2.grid
       (filters-row table)

       (case display-type
         :logseq.property.view/type.list
         (list-view (:config option) view-entity (:rows table))

         :logseq.property.view/type.gallery
         (gallery-view (:config option) table view-entity (:rows table) *scroller-ref)

         (table-view table option row-selection add-new-object! *scroller-ref))]
      {:title-trigger? false})]))

(rum/defcs view
  "Provides a view for data like query results and tagged objects, multiple
   layouts such as table and list are supported. Args:
   * view-entity: a db Entity
   * option:
     * title-key: dict key defaults to `:views.table/default-title`
     * data: a collections of entities
     * set-data!: `fn` to update `data`
     * columns: view columns including properties and db attributes, which could be built by `build-columns`
     * add-new-object!: `fn` to create a new object (or row)
     * show-add-property?: whether to show `Add property`
     * add-property!: `fn` to add a new property (or column)
     * on-delete-rows: `fn` to trigger when deleting selected objects"
  < rum/reactive
  (rum/local nil ::scroller-ref)
  [state view-entity option]
  (let [view-entity' (db/sub-block (:db/id view-entity))]
    (rum/with-key (view-inner view-entity'
                              (cond-> option
                                config/publishing?
                                (dissoc :add-new-object!))
                              (::scroller-ref state))
      (str "view-" (:db/id view-entity')))))
