(ns frontend.components.views
  "Different views of blocks"
  (:require [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.impl.entity :as de]
            [dommy.core :as dom]
            [frontend.common.missionary :as c.m]
            [frontend.components.dnd :as dnd]
            [frontend.components.icon :as icon-component]
            [frontend.components.property.config :as property-config]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.components.selection :as selection]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.async :as db-async]
            [frontend.db.react :as react]
            [frontend.handler.db-based.export :as db-export-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.mixins :as mixins]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.property :as db-property]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [missionary.core :as m]
            [promesa.core :as p]
            [rum.core :as rum]))

(def ^:private yyyy-MM-dd-formatter (tf/formatter "yyyy-MM-dd"))

(defn- virtualized-list
  [{:keys [total-count item-content compute-item-key] :as option}
   disable-virtualized?]
  (if disable-virtualized?
    [:div.content
     (for [i (range 0 total-count)]
       (rum/with-key (item-content i)
         (compute-item-key i)))]
    (ui/virtualized-list option)))

(defn- get-scroll-parent
  [config]
  (if (:sidebar? config)
    (dom/sel1 ".sidebar-item-list")
    (if-let [view-el (:viewel config)]
      (util/app-scroll-container-node view-el)
      (util/app-scroll-container-node))))

(rum/defc header-checkbox < rum/static
  [{:keys [selected-all? selected-some? toggle-selected-all!] :as table}]
  (let [[show? set-show!] (rum/use-state false)]
    [:label.h-8.w-8.flex.items-center.justify-center.cursor-pointer
     {:html-for "header-checkbox"
      :on-mouse-over #(set-show! true)
      :on-mouse-out #(set-show! false)}
     (shui/checkbox
      {:id "header-checkbox"
       :checked (or selected-all? (and selected-some? "indeterminate"))
       :on-checked-change (fn [value]
                            (p/do
                              (when value
                                (db-async/<get-blocks (state/get-current-repo) (:rows table) {}))
                              (toggle-selected-all! table value)))
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
  [{:keys [row-selected? row-toggle-selected! data state data-fns]} row _column]
  (let [id (str (:db/id row) "-" "checkbox")
        [show? set-show!] (rum/use-state false)
        checked? (row-selected? row)
        {:keys [last-selected-idx row-selection]} state
        {:keys [set-last-selected-idx! set-row-selection!]} data-fns]
    [:label.h-8.w-8.flex.items-center.justify-center.cursor-pointer
     {:html-for (str (:db/id row) "-" "checkbox")
      :on-mouse-over #(set-show! true)
      :on-mouse-out #(set-show! false)}
     (shui/checkbox
      {:id id
       :checked checked?
       :on-click (fn [e]
                   (when (and (.-shiftKey e) last-selected-idx)
                     ;; add selection
                     (util/stop e)
                     (let [idx (.indexOf data (:db/id row))]
                       (when (not= last-selected-idx idx)
                         (let [new-ids (keep (fn [idx] (util/nth-safe data idx)) (range (min last-selected-idx idx) (inc (max last-selected-idx idx))))]
                           (when (seq new-ids)
                             (let [row-selection' (update row-selection :selected-ids set/union (set new-ids))]
                               (set-row-selection! row-selection'))))))))
       :on-checked-change (fn [v]
                            (p/do!
                             (when v (db-async/<get-block (state/get-current-repo) (:db/id row) {:skip-refresh? true
                                                                                                 :children? false}))
                             (if v
                               (let [idx (.indexOf data (:db/id row))]
                                 (set-last-selected-idx! idx))
                               (when (= (:db/id row) last-selected-idx)
                                 (set-last-selected-idx! nil)))
                             (row-toggle-selected! row-selection row v)))
       :aria-label "Select row"
       :class (str "flex transition-opacity "
                   (if (or show? checked?) "opacity-100" "opacity-0"))})]))

(defonce *last-header-action-target (atom nil))

(defn header-cp
  [{:keys [view-entity column-set-sorting! state]} column]
  (let [sorting (:sorting state)
        db-based? (config/db-based-graph?)
        [asc?] (some (fn [item] (when (= (:id item) (:id column))
                                  (when-some [asc? (:asc? item)]
                                    [asc?]))) sorting)
        property (db/entity (:id column))
        pinned? (when property
                  (contains? (set (map :db/id (:logseq.property.table/pinned-columns view-entity)))
                             (:db/id property)))
        sub-content (fn [{:keys [id]}]
                      (let [table-options [(shui/dropdown-menu-item
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
                                           (when (and db-based? property)
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
                                               [:div (if pinned? "Unpin" "Pin")]]))]
                            tag (when-let [entity (:logseq.property/view-for view-entity)]
                                  (when (ldb/class? entity)
                                    entity))
                            option (cond->
                                    {:with-title? false
                                     :more-options table-options}
                                     (some? tag)
                                     (assoc :class-schema? true))]
                        [:div.ls-property-dropdown
                         (property-config/property-dropdown property tag option)]))]
    (shui/button
     {:variant "text"
      :class "h-8 !pl-4 !px-2 !py-0 hover:text-foreground w-full justify-start"
      :on-click (fn [^js e]
                  (let [popup-id (str "table-column-" (:id column))]
                    (when-let [^js el (some-> (.-target e) (.closest "[aria-roledescription=sortable]"))]
                      (when (and (or (nil? @*last-header-action-target)
                                     (not= el @*last-header-action-target))
                                 (string/blank? (some-> el (.-style) (.-transform))))
                        (shui/popup-show! el sub-content
                                          {:id popup-id
                                           :align "start"
                                           :as-dropdown? true
                                           :dropdown-menu? true
                                           :on-before-hide (fn []
                                                             (reset! *last-header-action-target el)
                                                             (js/setTimeout #(reset! *last-header-action-target nil) 128))})))))}
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
  (db-view/get-property-value-content (db/get-db) entity))

(rum/defc block-container
  [config row]
  (let [container (state/get-component :block/container)
        config' (cond-> config
                  (not (:popup? config))
                  (assoc :view? true))]
    [:div.relative.w-full {:style {:min-height 24}}
     (if row
       (container config' row)
       [:div])]))

(defn- save-block-and-focus
  [*ref set-focus-timeout! hide-popup?]
  (let [node (rum/deref *ref)
        cell (util/rec-get-node node "ls-table-cell")]
    (p/do!
     (editor-handler/save-current-block!)
     (when hide-popup?
       (shui/popup-hide!))
     (state/exit-editing-and-set-selected-blocks! [cell])
     (set-focus-timeout! (js/setTimeout #(.focus cell) 100)))))

(rum/defc ^:large-vars/cleanup-todo block-title
  "Used on table view"
  [block* {:keys [create-new-block width row property]}]
  (let [*ref (hooks/use-ref nil)
        [opacity set-opacity!] (hooks/use-state 0)
        [focus-timeout set-focus-timeout!] (hooks/use-state nil)
        inline-title (state/get-component :block/inline-title)
        many? (db-property/many? property)
        block (if many? (first block*) block*)
        add-to-sidebar! #(state/sidebar-add-block! (state/get-current-repo)
                                                   (or (and many? (:db/id row)) (:db/id block))
                                                   :block)
        redirect! #(some-> (:block/uuid block) route-handler/redirect-to-page!)]
    (hooks/use-effect!
     (fn []
       #(some-> focus-timeout js/clearTimeout))
     [])
    [:div.table-block-title.relative.flex.items-center.w-full.h-full.cursor-pointer.items-center
     {:ref *ref
      :on-mouse-over #(set-opacity! 100)
      :on-mouse-out #(set-opacity! 0)
      :on-click (fn [e]
                  (p/let [block (or block (and (fn? create-new-block) (create-new-block)))]
                    (when block
                      (cond
                        (or (util/meta-key? e) (util/mobile?))
                        (redirect!)

                        (.-shiftKey e)
                        (add-to-sidebar!)

                        :else
                        (let [popup (fn []
                                      (let [width (-> (max 160 width) (- 18))]
                                        (if many?
                                          [:div.ls-table-block
                                           {:style {:width width :max-width width}
                                            :on-click util/stop-propagation}
                                           (pv/property-value row property {})]
                                          [:div.ls-table-block
                                           {:style {:width width :max-width width}
                                            :on-click util/stop-propagation}
                                           (block-container
                                            {:popup? true
                                             :view? true
                                             :table-block-title? true
                                             :table? true
                                             :on-key-down
                                             (fn [e]
                                               (when (and (= (util/ekey e) "Enter")
                                                          (not (state/get-editor-action)))
                                                 (util/stop e)
                                                 (save-block-and-focus *ref set-focus-timeout! true)))}
                                            block)])))]
                          (p/do!
                           (shui/popup-show!
                            (.closest (.-target e) ".ls-table-cell")
                            popup
                            {:id :ls-table-block-editor
                             :as-mask? true
                             :on-after-hide (fn []
                                              (save-block-and-focus *ref set-focus-timeout! false))})
                           (editor-handler/edit-block! block :max {:container-id :unknown-container})))))))}
     (if block
       [:div.flex.flex-row
        (let [render (fn [block]
                       [:div
                        (inline-title
                         {:table? true
                          :block/uuid (:block/uuid block)}
                         (some->> (:block/title block)
                                  string/trim
                                  string/split-lines
                                  first))])]
          (if many?
            (->> (map render block*)
                 (interpose [:div.mr-1 ","]))
            (render block*)))]
       [:div])

     (when-not (util/mobile?)
       (let [class (str "h-6 w-6 !p-1 text-muted-foreground transition-opacity duration-100 ease-in bg-gray-01 "
                        "opacity-" opacity)]
         [:div.absolute.-right-1
          [:div.flex.flex-row.items-center
           (shui/button
            {:variant :ghost
             :title "Open"
             :on-click (fn [e]
                         (util/stop-propagation e)
                         (redirect!))
             :class class}
            (ui/icon "arrow-right"))
           (shui/button
            {:variant :ghost
             :title "Open in sidebar"
             :class class
             :on-click (fn [e]
                         (util/stop-propagation e)
                         (add-to-sidebar!))}
            (ui/icon "layout-sidebar-right"))]]))]))

(defn build-columns
  [config properties & {:keys [with-object-name? with-id? add-tags-column? advanced-query?]
                        :or {with-object-name? true
                             with-id? true
                             add-tags-column? true}}]
  (let [properties' (->>
                     (if (or (some #(= (:db/ident %) :block/tags) properties) (not add-tags-column?))
                       properties
                       (conj properties (db/entity :block/tags)))
                     (remove nil?))
        property-keys (set (map :db/ident properties'))]
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
                      (inc (.indexOf (:rows table) (:db/id row))))
              :resizable? false})
           (when with-object-name?
             {:id :block/title
              :name "Name"
              :type :string
              :header header-cp
              :cell (fn [_table row _column style]
                      (block-title row {:property-ident :block/title
                                        :sidebar? (:sidebar? config)
                                        :width (:width style)}))
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
                       get-value (when (de/entity? property)
                                   (fn [row] (db-view/get-property-value-for-search row property)))]
                   {:id ident
                    :name (or (:name property)
                              (:block/title property))
                    :header (or (:header property)
                                header-cp)
                    :cell (or (:cell property)
                              (when (de/entity? property)
                                (fn [_table row _column style]
                                  (pv/property-value row property {:view? true
                                                                   :table-view? true
                                                                   :table-text-property-render
                                                                   (fn [block opts]
                                                                     (block-title block (assoc opts
                                                                                               :row row
                                                                                               :property property
                                                                                               :width (:width style)
                                                                                               :sidebar? (:sidebar? config))))}))))
                    :get-value get-value
                    :type (:type property)}))))
           properties')

          [(when (or (not advanced-query?)
                     (and advanced-query? (property-keys :block/created-at)))
             {:id :block/created-at
              :name (t :page/created-at)
              :type :datetime
              :header header-cp
              :cell timestamp-cell-cp})
           (when (or (not advanced-query?)
                     (and advanced-query? (property-keys :block/updated-at)))
             {:id :block/updated-at
              :name (t :page/updated-at)
              :type :datetime
              :header header-cp
              :cell timestamp-cell-cp})])
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

(defonce groups-sort-by-options
  [["Journal date" :block/journal-day]
   ["Page name" :block/title]
   ["Page updated date" :block/updated-at]
   ["Page created date" :block/created-at]])
(defonce groups-sort-by-name->property-identity
  (into {} groups-sort-by-options))
(defonce groups-sort-by-property-identity->name
  (set/map-invert groups-sort-by-name->property-identity))

(rum/defc groups-sort
  [view-entity sort-by-value]
  (let [property-ident (or (:db/ident sort-by-value) :block/journal-day)]
    (shui/dropdown-menu-sub
     (shui/dropdown-menu-sub-trigger
      "Sort groups by")
     (shui/dropdown-menu-sub-content
      (for [[option _] groups-sort-by-options]
        (shui/dropdown-menu-checkbox-item
         {:key option
          :checked (= option (groups-sort-by-property-identity->name property-ident))
          :onCheckedChange (fn [checked?]
                             (let [property-id (:db/id (db/entity (groups-sort-by-name->property-identity option)))]
                               (if checked?
                                 (db-property-handler/set-block-property! (:db/id view-entity) :logseq.property.view/sort-groups-by-property
                                                                          property-id)
                                 (db-property-handler/remove-block-property! (:db/id view-entity) :logseq.property.view/sort-groups-by-property))))
          :onSelect (fn [e] (.preventDefault e))}
         option))))))

(rum/defc groups-sort-order
  [view-entity desc?]
  (shui/dropdown-menu-sub
   (shui/dropdown-menu-sub-trigger
    "Sort groups order")
   (shui/dropdown-menu-sub-content
    (for [option ["Descending" "Ascending"]]
      (shui/dropdown-menu-checkbox-item
       {:key option
        :checked (= option (if desc? "Descending" "Ascending"))
        :onCheckedChange (fn [checked?]
                           (db-property-handler/set-block-property! (:db/id view-entity) :logseq.property.view/sort-groups-desc?
                                                                    (or (and checked? (= "Descending" option))
                                                                        (and (not checked?) (not= "Descending" option)))))
        :onSelect (fn [e] (.preventDefault e))}
       option)))))

(rum/defc more-actions
  [view-entity columns {:keys [column-visible? rows column-toggle-visibility]} {:keys [group-by-property-ident]}]
  (let [display-type (:db/ident (:logseq.property.view/type view-entity))
        table? (= display-type :logseq.property.view/type.table)
        group-by-columns (concat (when (or
                                        (contains? #{:linked-references :unlinked-references}
                                                   (:logseq.property.view/feature-type view-entity))
                                        (:logseq.property/query view-entity))
                                   [{:id :block/page
                                     :name "Page"}])
                                 (filter (fn [column]
                                           (when (:id column)
                                             (when-let [p (db/entity (:id column))]
                                               (and (not (db-property/many? p))
                                                    (contains? #{:default :number :checkbox :url :node :date}
                                                               (:logseq.property/type p)))))) columns))
        group-by-page? (some #{:block/page} (map :id group-by-columns))]
    (shui/dropdown-menu
     (shui/dropdown-menu-trigger
      {:asChild true}
      (shui/button
       {:variant "ghost"
        :class "text-muted-foreground !px-1"
        :size :sm}
       (ui/icon "dots" {:size 15})))
     (shui/dropdown-menu-content
      {:align "end"}
      (shui/dropdown-menu-group
       (when table?
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
              (:name column))))))
       (when (seq group-by-columns)
         (shui/dropdown-menu-sub
          (shui/dropdown-menu-sub-trigger
           "Group by")
          (shui/dropdown-menu-sub-content
           (for [column group-by-columns]
             (shui/dropdown-menu-checkbox-item
              {:key (str (:id column))
               :className "capitalize"
               :checked (= (:id column) group-by-property-ident)
               :onCheckedChange (fn [result]
                                  (if result
                                    (db-property-handler/set-block-property! (:db/id view-entity) :logseq.property.view/group-by-property
                                                                             (:db/id (db/entity (:id column))))
                                    (db-property-handler/remove-block-property! (:db/id view-entity) :logseq.property.view/group-by-property)))
               :onSelect (fn [e] (.preventDefault e))}
              (:name column))))))
       (when group-by-page?
         (groups-sort view-entity (:logseq.property.view/sort-groups-by-property view-entity)))
       (when group-by-property-ident
         (groups-sort-order view-entity (:logseq.property.view/sort-groups-desc? view-entity)))
       (shui/dropdown-menu-item
        {:key "export-edn"
         :on-click #(db-export-handler/export-view-nodes-data rows {:group-by? (some? group-by-property-ident)})}
        "Export EDN"))))))

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
   [:div (str (count selected-rows) " selected")]
   (selection/action-bar
    {:on-cut #(on-delete-rows table selected-rows)
     :selected-blocks selected-rows
     :hide-dots? true
     :button-border? true
     :view-parent (:logseq.property/view-for (:view-entity table))})))

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

(defn- on-delete-rows
  [view-parent view-feature-type table selected-ids]
  (let [selected-rows (->> (map db/entity selected-ids)
                           (remove :logseq.property/built-in?))
        pages (filter ldb/page? selected-rows)
        blocks (remove ldb/page? selected-rows)
        page-ids (map :db/id pages)
        {:keys [set-data! set-row-selection!]} (:data-fns table)
        update-table-state! (fn []
                              (let [data (:full-data table)
                                    selected-ids (set (map :db/id selected-rows))
                                    new-data (if (every? number? data)
                                               (remove selected-ids data)
                                               ;; group
                                               (map (fn [[by-value col]]
                                                      [by-value (remove selected-ids col)]) data))]
                                (set-data! new-data)
                                (set-row-selection! {})))]
    (p/do!
     (ui-outliner-tx/transact!
      {:outliner-op :delete-blocks}
      (when (seq blocks)
        (outliner-op/delete-blocks! blocks nil))
      (case view-feature-type
        :class-objects
        (when (seq page-ids)
          (when-not (= :logseq.class/Page (:db/ident view-parent))
            (doseq [page pages]
              (when-let [id (:block/uuid page)]
                (outliner-op/delete-page! id)))))

        :property-objects
        ;; Relationships with built-in properties must not be deleted e.g. built-in? or parent
        (when-not (:logseq.property/built-in? view-parent)
          (let [tx-data (map (fn [pid] [:db/retract pid (:db/ident view-parent)]) page-ids)]
            (when (seq tx-data)
              (outliner-op/transact! tx-data {:outliner-op :save-block}))))

        :query-result
        (doseq [page pages]
          (when-let [id (:block/uuid page)]
            (outliner-op/delete-page! id)))

        :all-pages
        (state/pub-event! [:page/show-delete-dialog selected-rows update-table-state!])

        nil))

     (when-not (or (= view-feature-type :all-pages)
                   (and (= view-feature-type :property-objects) (:logseq.property/built-in? view-parent)))
       (update-table-state!)))))

(defn- table-header
  [table {:keys [show-add-property? add-property! view-parent view-feature-type] :as option} selected-rows]
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
                                       :on-click (fn [e] (when (fn? add-property!) (add-property! e)))}
                                :value :add-new-property
                                :content (add-property-button)
                                :disabled? true})
                         (mapv build-item unpinned))
        selection-rows-count (count selected-rows)]
    (shui/table-header
     {:main-container (util/app-scroll-container-node)}
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
        (action-bar table selected-rows
                    (assoc option
                           :on-delete-rows (fn [table selected-ids]
                                             (on-delete-rows view-parent view-feature-type table selected-ids))))]))))

(rum/defc lazy-table-cell
  [cell-render-f cell-placeholder]
  (let [^js state (ui/useInView #js {:rootMargin "0px"})
        in-view? (.-inView state)]
    [:div.h-full
     {:ref (.-ref state)}
     (if in-view?
       (cell-render-f)
       cell-placeholder)]))

(defn- click-cell
  [node]
  (when-let [trigger (or (dom/sel1 node ".jtrigger")
                         (dom/sel1 node ".table-block-title"))]
    (.click trigger)))

(defn navigate-to-cell
  [e cell direction]
  (util/stop e)
  (let [row (util/rec-get-node cell "ls-table-row")
        cells (dom/sel row ".ls-table-cell")
        idx (.indexOf cells cell)
        rows-container (util/rec-get-node row "ls-table-rows")
        rows (dom/sel rows-container ".ls-table-row")
        row-idx (.indexOf rows row)
        container-left (.-left (.getBoundingClientRect rows-container))
        next-cell (case direction
                    :left (if (> idx 1)               ; don't focus on checkbox
                            (nth cells (dec idx))
                            ;; last cell in the prev row
                            (let [prev-row (when (> row-idx 0)
                                             (nth rows (dec row-idx)))]
                              (when prev-row
                                (let [cells (dom/sel prev-row ".ls-table-cell")]
                                  (last cells)))))
                    :right (if (< idx (dec (count cells)))
                             (nth cells (inc idx))
                             ;; first cell in the next row
                             (let [next-row (when (< row-idx (dec (count rows)))
                                              (nth rows (inc row-idx)))]
                               (when next-row
                                 (let [cells (dom/sel next-row ".ls-table-cell")]
                                   (second cells)))))
                    :up (let [prev-row (when (> row-idx 0)
                                         (nth rows (dec row-idx)))]
                          (when prev-row
                            (let [cells (dom/sel prev-row ".ls-table-cell")]
                              (nth cells idx))))
                    :down (let [next-row (when (< row-idx (dec (count rows)))
                                           (nth rows (inc row-idx)))]
                            (when next-row
                              (let [cells (dom/sel next-row ".ls-table-cell")]
                                (nth cells idx)))))]
    (when next-cell
      (let [next-cell-left (.-left (.getBoundingClientRect next-cell))]
        (state/clear-selection!)
        (dom/add-class! next-cell "selected")
        (.focus next-cell)
        (when (< next-cell-left container-left)
          (.scrollIntoView next-cell #js {:inline "center"
                                          :block "nearest"}))))))

(rum/defc table-cell-container
  [cell-opts body]
  (let [*ref (hooks/use-ref nil)]
    (shui/table-cell
     (assoc cell-opts
            :tabIndex 0
            :ref *ref
            :on-click (fn [e]
                        (when-not (dom/has-class? (.-target e) "jtrigger")
                          (click-cell (rum/deref *ref))))
            :on-key-down (fn [e]
                           (let [container (rum/deref *ref)]
                             (case (util/ekey e)
                               "Escape"
                               (do
                                 (if (util/input? (.-target e))
                                   (do
                                     (state/exit-editing-and-set-selected-blocks! [container])
                                     (.focus container))
                                   (do
                                     (dom/remove-class! container "selected")
                                     (let [row (util/rec-get-node container "ls-table-row")]
                                       (state/exit-editing-and-set-selected-blocks! [row]))))
                                 (util/stop e))
                               "Enter"
                               (do
                                 (if (util/input? (.-target e)) ; number
                                   (do
                                     (state/exit-editing-and-set-selected-blocks! [container])
                                     (.focus container))
                                   (click-cell container))
                                 (util/stop e))
                               "ArrowUp"
                               (navigate-to-cell e container :up)
                               "ArrowDown"
                               (navigate-to-cell e container :down)
                               "ArrowLeft"
                               (navigate-to-cell e container :left)
                               "ArrowRight"
                               (navigate-to-cell e container :right)
                               nil))))
     body)))

(rum/defc table-row-inner < rum/static
  [{:keys [row-selected?] :as table} row props {:keys [show-add-property? scrolling?]}]
  (let [*ref (hooks/use-ref nil)
        pinned-columns (get-in table [:state :pinned-columns])
        unpinned (get-in table [:state :unpinned-columns])
        unpinned-columns (if show-add-property?
                           (conj (vec unpinned)
                                 {:id :add-property
                                  :cell (fn [_table _row _column])})
                           unpinned)
        sized-columns (get-in table [:state :sized-columns])
        row-cell-f (fn [column {:keys [_lazy?]}]
                     (let [id (str (:id row) "-" (:id column))
                           width (get-column-size column sized-columns)
                           select? (= (:id column) :select)
                           add-property? (= (:id column) :add-property)
                           style {:width width :min-width width}
                           cell-opts {:key id
                                      :select? select?
                                      :add-property? add-property?
                                      :style style}
                           cell-placeholder (table-cell-container cell-opts nil)]
                       (if (and scrolling? (not (:block/title row)))
                         cell-placeholder
                         (when-let [render (get column :cell)]
                           (lazy-table-cell
                            (fn []
                              (table-cell-container
                               cell-opts (render table row column style)))
                            cell-placeholder)))))]
    (shui/table-row
     (merge
      props
      {:key (str (:db/id row))
       :tabIndex 0
       :ref *ref
       :data-state (when (row-selected? row) "selected")
       :data-id (:db/id row)
       :blockid (str (:block/uuid row))
       :on-pointer-down (fn [_e] (db-async/<get-block (state/get-current-repo) (:db/id row) {:children? false}))
       :on-key-down (fn [e]
                      (let [container (rum/deref *ref)]
                        (when (dom/has-class? container "selected")
                          (case (util/ekey e)
                            "Enter"
                            (do
                              (state/sidebar-add-block! (state/get-current-repo) (:db/id row) :block)
                              (state/clear-selection!)
                              (util/stop e))
                            "ArrowLeft"
                            (do
                              (when-let [cell (->> (dom/sel container ".ls-table-cell")
                                                   (remove (fn [node]
                                                             (some? (dom/sel1 node ".ui__checkbox"))))
                                                   first)]
                                (state/clear-selection!)
                                (dom/add-class! cell "selected")
                                (.focus cell))
                              (util/stop e))
                            "ArrowRight"
                            (do
                              (when-let [cell (->> (dom/sel container ".ls-table-cell")
                                                   (remove (fn [node]
                                                             (some? (dom/sel1 node ".ui__checkbox"))))
                                                   last)]
                                (state/clear-selection!)
                                (dom/remove-class! container "selected")
                                (dom/add-class! cell "selected")
                                (.focus cell))
                              (util/stop e))
                            "Escape"
                            (do
                              (state/clear-selection!)
                              (util/stop e))
                            nil))))})
     (when (seq pinned-columns)
       [:div.sticky-columns.flex.flex-row
        (map #(row-cell-f % {}) pinned-columns)])
     (when (seq unpinned-columns)
       [:div.flex.flex-row
        (map #(row-cell-f % {:lazy? true}) unpinned-columns)]))))

(rum/defc table-row < rum/reactive db-mixins/query
  [table row props option]
  (let [block (db/sub-block (:db/id row))
        row' (some->
              (if (:block.temp/load-status block) block row)
              (update :block/tags (fn [tags]
                                    (keep (fn [tag]
                                            (when-let [id (:db/id tag)]
                                              (db/entity id)))
                                          tags))))]
    (table-row-inner table row' props option)))

(rum/defc search
  [input {:keys [on-change set-input!]}]
  (let [[show-input? set-show-input!] (rum/use-state false)]
    (if show-input?
      [:div.flex.flex-row.items-center
       (shui/input
        {:placeholder "Type to search"
         :auto-focus true
         :value input
         :on-change (fn [e]
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
       (ui/icon "search" {:size 15})))))

(defn datetime-property?
  [property]
  (or
   (= :datetime (:logseq.property/type property))
   (contains? #{:block/created-at :block/updated-at} (:db/ident property))))

(def timestamp-options
  [{:value "1 day ago"
    :label "1 day ago"}
   {:value "3 days ago"
    :label "3 days ago"}
   {:value "1 week ago"
    :label "1 week ago"}
   {:value "1 month ago"
    :label "1 month ago"}
   {:value "3 months ago"
    :label "3 months ago"}
   {:value "1 year ago"
    :label "1 year ago"}
   {:value "Custom date"
    :label "Custom date"}])

(rum/defc ^:large-vars/cleanup-todo filter-property < rum/static
  [view-entity columns {:keys [data-fns] :as table} opts]
  (let [[property set-property!] (rum/use-state nil)
        [values set-values!] (rum/use-state nil)
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
                :input-opts {:class "!px-2 !py-1"}
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
        checkbox? (= :checkbox (:logseq.property/type property))
        property-ident (:db/ident property)]
    (hooks/use-effect!
     (fn []
       (when (and view-entity property-ident (not (or timestamp? checkbox?)))
         (p/let [data (db-async/<get-property-values property-ident {:view-id (:db/id view-entity)
                                                                     :query-entity-ids (:query-entity-ids opts)})]
           (set-values! data))))
     [property-ident])
    (let [option (cond
                   timestamp?
                   (merge option
                          {:items timestamp-options
                           :input-default-placeholder (if property (:block/title property) "Select")
                           :on-chosen (fn [value _ _ e]
                                        (shui/popup-hide!)
                                        (let [set-filter-fn (fn [value]
                                                              (let [filters' (conj (:filters filters) [(:db/ident property) :after value])]
                                                                (set-filters! {:or? (:or? filters)
                                                                               :filters filters'})))]
                                          (if (= value "Custom date")
                                            (shui/popup-show!
                                             (.-target e)
                                             (ui/nlp-calendar
                                              {:initial-focus true
                                               :datetime? false
                                               :on-day-click (fn [value]
                                                               (set-filter-fn value)
                                                               (shui/popup-hide!))})
                                             {})
                                            (set-filter-fn value))))})
                   property
                   (if checkbox?
                     (let [items [{:value true :label "true"}
                                  {:value false :label "false"}]]
                       (merge option
                              {:items items
                               :input-default-placeholder (if property (:block/title property) "Select")
                               :on-chosen (fn [value]
                                            (let [filters' (conj (:filters filters) [(:db/ident property) :is value])]
                                              (set-filters! {:or? (:or? filters)
                                                             :filters filters'})))}))
                     (let [items values]
                       (merge option
                              {:items items
                               :input-default-placeholder (if property (:block/title property) "Select")
                               :multiple-choices? true
                               :on-chosen (fn [_value _selected? selected]
                                            (let [selected-value (if (and (map? (first selected))
                                                                          (:block/uuid (first selected)))
                                                                   (set (map :block/uuid selected))
                                                                   selected)
                                                  filters' (if (seq selected)
                                                             (conj (:filters filters) [(:db/ident property) :is selected-value])
                                                             (:filters filters))]
                                              (set-filters! {:or? (:or? filters)
                                                             :filters filters'})))})))
                   :else
                   option)]
      (if (and property (not (contains? #{:block/created-at :block/updated-at} (:db/ident property))))
        [:div.flex.flex-col.gap-1.text-sm
         (select/select option)
         (shui/button {:variant :ghost :size :sm :class "justify-start"
                       :on-click (fn []
                                   (let [filters' (conj (:filters filters) [(:db/ident property) :is :empty])]
                                     (set-filters! {:or? (:or? filters)
                                                    :filters filters'})))}
                      [:span.opacity-75.hover:opacity-100.font-normal.text-sm
                       "Is Empty"])
         (shui/button {:variant :ghost :size :sm :class "justify-start"
                       :on-click (fn []
                                   (let [filters' (conj (:filters filters) [(:db/ident property) :is-not :empty])]
                                     (set-filters! {:or? (:or? filters)
                                                    :filters filters'})))}
                      [:span.opacity-75.hover:opacity-100.font-normal.text-sm
                       "Is Not Empty"])]
        (select/select option)))))

(rum/defc filter-properties < rum/static
  [view-entity columns table opts]
  (shui/button
   {:variant "ghost"
    :class "text-muted-foreground !px-1"
    :size :sm
    :on-click (fn [e]
                (shui/popup-show! (.-target e)
                                  (fn []
                                    (filter-property view-entity columns table opts))
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
     (case (:logseq.property/type property)
       (:datetime)
       [:before :after]
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

(rum/defc ^:large-vars/cleanup-todo filter-value-select < rum/static
  [view-entity {:keys [data-fns] :as table} property value operator idx opts]
  (let [type (:logseq.property/type property)
        property-ident (:db/ident property)]
    (hooks/use-effect!
     (fn []
       (let [values (if (coll? value) value [value])
             ids (filter #(and (uuid? %) (nil? (db/entity [:block/uuid %]))) values)]
         (when (seq ids) (db-async/<get-blocks (state/get-current-repo) ids))))
     [])
    (let [filters (get-in table [:state :filters])
          set-filters! (:set-filters! data-fns)
          many? (if (or (contains? #{:date-before :date-after :before :after} operator)
                        (contains? #{:checkbox} type))
                  false
                  true)]
      (shui/button
       {:class "!px-2 rounded-none border-r"
        :variant "ghost"
        :size :sm
        :on-click (fn [e]
                    (p/let [values (when (and property-ident
                                              (not (contains? #{:data :datetime :checkbox} type)))
                                     (p/let [data (db-async/<get-property-values property-ident {:view-id (:db/id view-entity)
                                                                                                 :query-entity-ids (:query-entity-ids opts)})]
                                       (map (fn [v] (if (map? (:value v))
                                                      (assoc v :value (:block/uuid (:value v)))
                                                      v)) data)))
                            items (cond
                                    (contains? #{:before :after} operator)
                                    timestamp-options
                                    (= type :checkbox)
                                    [{:value true :label "true"} {:value false :label "false"}]
                                    :else
                                    values)]
                      (shui/popup-show!
                       (.-target e)
                       (fn []
                         (let [option (cond->
                                       {:input-default-placeholder (:block/title property)
                                        :input-opts {:class "!px-3 !py-1"}
                                        :items items
                                        :extract-fn :label
                                        :extract-chosen-fn :value
                                        :on-chosen (fn [value _selected? selected e]
                                                     (when-not many?
                                                       (shui/popup-hide!))
                                                     (let [value' (if many? selected value)
                                                           set-filters-fn (fn [value']
                                                                            (let [new-filters (update filters :filters
                                                                                                      (fn [col]
                                                                                                        (update col idx
                                                                                                                (fn [[property operator _value]]
                                                                                                                  [property operator value']))))]
                                                                              (set-filters! new-filters)))]
                                                       (if (= value "Custom date")
                                                         (shui/popup-show!
                                                          (.-target e)
                                                          (ui/nlp-calendar
                                                           {:initial-focus true
                                                            :datetime? false
                                                            :on-day-click (fn [value]
                                                                            (set-filters-fn value)
                                                                            (shui/popup-hide!))})
                                                          {})
                                                         (set-filters-fn value'))))}
                                        many?
                                        (assoc
                                         :multiple-choices? true
                                         :selected-choices (when (coll? value) value)))]
                           (if (and (contains? #{:is :is-not} operator)
                                    (not (contains? #{:block/created-at :block/updated-at} (:db/ident property))))
                             [:div.flex.flex-col.gap-1
                              (select/select option)
                              (shui/button {:variant :ghost :size :sm :class "justify-start"
                                            :on-click (fn []
                                                        (let [new-filters (update filters :filters
                                                                                  (fn [col]
                                                                                    (update col idx
                                                                                            (fn [[property operator _value]]
                                                                                              [property operator :empty]))))]
                                                          (set-filters! new-filters)))}
                                           [:span.opacity-75.hover:opacity-100.font-normal.text-sm
                                            "Empty"])]
                             (select/select option))))
                       {:align :start})))}
       (let [value (cond
                     (uuid? value)
                     (db/entity [:block/uuid value])
                     (instance? js/Date value)
                     (some->> (tc/to-date value)
                              (t/to-default-time-zone)
                              (tf/unparse yyyy-MM-dd-formatter))
                     (and (coll? value) (every? uuid? value))
                     (keep #(db/entity [:block/uuid %]) value)
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

            (= value :empty)
            [:div "Empty"]

            (seq value)
            (->> (map (fn [v] [:div (get-property-value-content v)]) value)
                 (interpose [:div "or"]))
            :else
            "All")])))))

(rum/defc filter-value < rum/static
  [view-entity table property operator value filters set-filters! idx opts]
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

      (filter-value-select view-entity table property value operator idx opts))))

(rum/defc filters-row < rum/static      ;
  [view-entity {:keys [data-fns columns] :as table} opts]
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
              (filter-value view-entity table property operator value filters set-filters! idx opts)
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

(rum/defc new-record-button < rum/static
  [table view-entity]
  (let [asset? (and (:logseq.property/built-in? view-entity)
                    (= (:block/name view-entity) "asset"))]
    (ui/tooltip
     (shui/button
      {:variant "ghost"
       :class "!px-1 text-muted-foreground"
       :size :sm
       :on-click (fn [_]
                   (let [f (get-in table [:data-fns :add-new-object!])]
                     (f view-entity table)))}
      (ui/icon (if asset? "upload" "plus")))
     [:div "New node"])))

(rum/defc add-new-row < rum/static
  [view-entity table]
  [:div.py-1.px-2.cursor-pointer.flex.flex-row.items-center.gap-1.text-muted-foreground.hover:text-foreground.w-full.text-sm.border-b
   {:on-click (fn [_]
                (let [f (get-in table [:data-fns :add-new-object!])]
                  (f view-entity table)))}
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
  (let [repo (state/get-current-repo)
        db-based? (config/db-based-graph?)]
    {:set-sorting!
     (fn [sorting]
       (p/do!
        (when db-based? (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/sorting sorting))
        (set-sorting! sorting)))
     :set-filters!
     (fn [filters]
       (let [filters (-> (update filters :filters table-filters->persist-state)
                         (update :or? boolean))]
         (p/do!
          (when db-based? (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/filters filters))
          (set-filters! filters))))
     :set-visible-columns!
     (fn [columns]
       (let [hidden-columns (vec (keep (fn [[column visible?]]
                                         (when (false? visible?)
                                           column)) columns))]
         (p/do!
          (when db-based?  (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/hidden-columns hidden-columns))
          (set-visible-columns! columns))))
     :set-ordered-columns!
     (fn [ordered-columns]
       (let [ids (vec (remove #{:select} ordered-columns))]
         (p/do!
          (when db-based? (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/ordered-columns ids))
          (set-ordered-columns! ordered-columns))))
     :set-sized-columns!
     (fn [sized-columns]
       (p/do!
        (when db-based? (property-handler/set-block-property! repo (:db/id entity) :logseq.property.table/sized-columns sized-columns))
        (set-sized-columns! sized-columns)))}))

(rum/defc lazy-item
  [data idx {:keys [properties list-view? scrolling?]} item-render]
  (let [item (util/nth-safe data idx)
        db-id (cond (map? item) (:db/id item)
                    (number? item) item
                    :else nil)
        entity (when db-id
                 (let [e (db/entity db-id)]
                   (when (= :full (:block.temp/load-status e))
                     e)))
        [item set-item!] (hooks/use-state entity)
        opts (if list-view?
               {:skip-refresh? true
                :children? false}
               {:children? false
                :properties properties
                :skip-transact? true
                :skip-refresh? true})]
    (hooks/use-effect!
     #(c.m/run-task*
       (m/sp
         (when (and db-id (not item) (not scrolling?))
           (let [block (c.m/<? (db-async/<get-block (state/get-current-repo) db-id opts))
                 block' (if list-view? (db/entity db-id) block)]
             (set-item! block')))))
     [db-id scrolling?])
    (let [item' (cond (map? item) item (number? item) {:db/id item})]
      (item-render item'))))

(rum/defc table-body < rum/static
  [table option rows *scroller-ref set-items-rendered!]
  (let [[scrolling? set-scrolling!] (hooks/use-state false)]
    (when (seq rows)
      (virtualized-list
       {:ref #(reset! *scroller-ref %)
        :increase-viewport-by {:top 300 :bottom 300}
        :custom-scroll-parent (get-scroll-parent
                               (-> (:config option)
                                   (assoc :viewel (js/document.getElementById (:viewid option)))))
        :compute-item-key (fn [idx]
                            (let [block-id (util/nth-safe rows idx)]
                              (str "table-row-" block-id)))
        :skipAnimationFrameInResizeObserver true
        :total-count (count rows)
        :context {:scrolling scrolling?}
        :is-scrolling set-scrolling!
        :item-content (fn [idx _user ^js context]
                        (let [option (assoc option
                                            :scrolling? (when context (.-scrolling context))
                                            :table-view? true)]
                          (lazy-item (:data table) idx option
                                     (fn [row]
                                       (table-row table row {} option)))))
        :items-rendered (fn [props]
                          (when (seq props)
                            (set-items-rendered! true)))}
       (:disable-virtualized? option)))))

(rum/defc table-view < rum/static
  [table option row-selection *scroller-ref]
  (let [selected-rows (shui/table-get-selection-rows row-selection (:rows table))
        [items-rendered? set-items-rendered!] (hooks/use-state false)]
    (shui/table
     (let [rows (:rows table)]
       [:div.ls-table-rows.content.overflow-x-auto.force-visible-scrollbar
        [:div.relative
         (table-header table option selected-rows)

         (table-body table option rows *scroller-ref set-items-rendered!)

         (when (and (get-in table [:data-fns :add-new-object!]) (or (empty? rows) items-rendered?))
           (shui/table-footer (add-new-row (:view-entity option) table)))]]))))

(rum/defc list-view < rum/static
  [{:keys [config ref-matched-children-ids disable-virtualized?] :as option} view-entity {:keys [rows]} *scroller-ref]
  (let [lazy-item-render (fn [rows idx]
                           (lazy-item rows idx (assoc option :list-view? true)
                                      (fn [block]
                                        (let [config' (cond->
                                                       (assoc config
                                                              :list-view? true
                                                              :block-level 1)
                                                        (= :linked-references (:logseq.property.view/feature-type view-entity))
                                                        (assoc :ref-matched-children-ids ref-matched-children-ids))]
                                          (block-container config' block)))))
        list-cp (fn [rows]
                  (when (seq rows)
                    (virtualized-list
                     {:ref #(reset! *scroller-ref %)
                      :class "content"
                      :custom-scroll-parent (get-scroll-parent config)
                      :increase-viewport-by {:top 64 :bottom 64}
                      :compute-item-key (fn [idx]
                                          (let [block-id (util/nth-safe rows idx)]
                                            (str "list-row-" block-id)))
                      :total-count (count rows)
                      :skipAnimationFrameInResizeObserver true
                      :item-content (fn [idx] (lazy-item-render rows idx))}
                     disable-virtualized?)))
        breadcrumb (state/get-component :block/breadcrumb)
        all-numbers? (every? number? rows)]
    (if all-numbers?
      (list-cp rows)
      (for [[idx row] (medley/indexed rows)]
        (if (and (vector? row) (uuid? (first row)))
          (let [[first-block-id blocks] row]
            [:div
             {:key (str "partition-" first-block-id)}
             [:div.ml-6.text-sm.opacity-70.hover:opacity-100.mt-1
              (breadcrumb (assoc config :list-view? true)
                          (state/get-current-repo) first-block-id
                          {:show-page? false})]
             (list-cp blocks)])
          (rum/with-key
            (lazy-item-render rows idx)
            (str "partition-" idx)))))))

(rum/defc gallery-card-item
  [view-entity block config]
  [:div.ls-card-item.content
   {:key (str "view-card-" (:db/id view-entity) "-" (:db/id block))}
   [:div.-ml-4
    (block-container (assoc config
                            :id (str (:block/uuid block))
                            :gallery-view? true
                            :view? true)
                     block)]])

(rum/defcs gallery-view < rum/static mixins/container-id
  [state {:keys [config]} table view-entity blocks *scroller-ref]
  (let [config' (assoc config :container-id (:container-id state))]
    [:div.ls-cards
     (when (seq blocks)
       (ui/virtualized-grid
        {:ref #(reset! *scroller-ref %)
         :total-count (count blocks)
         :custom-scroll-parent (get-scroll-parent config)
         :skipAnimationFrameInResizeObserver true
         :compute-item-key (fn [idx]
                             (str (:db/id view-entity) "-card-" idx))
         :item-content (fn [idx]
                         (lazy-item (:data table) idx {}
                                    (fn [block]
                                      (gallery-card-item view-entity block config'))))}))]))

(defn- run-effects!
  [option {:keys [data]} *scroller-ref gallery? set-ready?]
  (hooks/use-effect!
   (fn []
     (when (and (:current-page? (:config option)) (seq data) (map? (first data)) (:block/uuid (first data)))
       (ui-handler/scroll-to-anchor-block @*scroller-ref data gallery?)
       (state/set-state! :editor/virtualized-scroll-fn #(ui-handler/scroll-to-anchor-block @*scroller-ref data gallery?)))
     (util/schedule #(set-ready? true)))
   []))

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
      {:class "text-muted-foreground pl-3"
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
                                  {:align :end
                                   :dropdown-menu? true}))}
   (ui/icon "arrows-up-down")))

(rum/defc view-cp
  [view-entity table option* {:keys [*scroller-ref display-type row-selection]}]
  (let [[viewid] (hooks/use-state #(random-uuid))
        option (assoc option*
                      :view-entity view-entity
                      :viewid viewid)]
    [:div {:id viewid}
     (case display-type
       :logseq.property.view/type.list
       (list-view option view-entity table *scroller-ref)

       :logseq.property.view/type.gallery
       (gallery-view option table view-entity (:rows table) *scroller-ref)

       (table-view table option row-selection *scroller-ref))]))

(defn- get-views
  [ent view-feature-type]
  (let [entity (db/entity (:db/id ent))
        views (->> (:logseq.property/_view-for entity)
                   (filter (fn [view]
                             (= view-feature-type (:logseq.property.view/feature-type view)))))]
    (ldb/sort-by-order views)))

(defn- create-view!
  [view-parent view-feature-type {:keys [auto-triggered?]}]
  (when-let [page (db/get-case-page common-config/views-page-name)]
    (p/let [properties (cond->
                        {:logseq.property/view-for (:db/id view-parent)
                         :logseq.property.view/feature-type view-feature-type}
                         (contains? #{:linked-references :unlinked-references} view-feature-type)
                         (assoc :logseq.property.view/type (:db/id (db/entity :logseq.property.view/type.list))
                                :logseq.property.view/group-by-property (:db/id (db/entity :block/page))))
            view-exists? (seq (get-views view-parent view-feature-type))
            view-title (if view-exists?
                         ""
                         (case view-feature-type
                           :linked-references
                           "Linked references"
                           :unlinked-references
                           "Unlinked references"
                           :class-objects
                           "All"
                           :property-objects
                           "All"
                           :all-pages
                           "All"
                           ""))
            view-block-id (common-uuid/gen-uuid :view-block-uuid (str (:block/uuid view-parent) view-feature-type))
            result (editor-handler/api-insert-new-block! view-title
                                                         (cond->
                                                          {:page (:block/uuid page)
                                                           :properties properties
                                                           :edit-block? false}
                                                           auto-triggered?
                                                           (assoc :custom-uuid view-block-id)))]
      (db/entity [:block/uuid (:block/uuid result)]))))

(rum/defc views-tab < rum/reactive db-mixins/query
  [view-parent current-view {:keys [views data items-count set-view-entity! set-data! set-views! view-feature-type show-items-count? config references? opacity]}]
  (let [refs-total-count (:refs-total-count config)]
    [:div.views
     (for [view* views]
       (let [view (db/sub-block (:db/id view*))
             current-view? (= (:db/id current-view) (:db/id view))]
         (shui/button
          {:variant :text
           :size :sm
           :class (str "text-sm px-0 py-0 h-6 " (when-not current-view? "text-muted-foreground"))
           :on-click (fn [e]
                       (if (and current-view? (not= (:db/id view) (:db/id view-parent)))
                         (shui/popup-show!
                          (.-target e)
                          (fn []
                            [:<>
                             (shui/dropdown-menu-sub
                              (shui/dropdown-menu-sub-trigger
                               "Rename")
                              (shui/dropdown-menu-sub-content
                               (when-let [block-container-cp (state/get-component :block/container)]
                                 (block-container-cp {} view))))
                             (shui/dropdown-menu-item
                              {:key "Delete"
                               :on-click (fn []
                                           (p/do!
                                            (editor-handler/delete-block-aux! view)
                                            (let [views' (remove (fn [v] (= (:db/id v) (:db/id view))) views)]
                                              (set-views! views')
                                              (set-view-entity! (first views'))
                                              (shui/popup-hide!))))}
                              "Delete")])
                          {:as-dropdown? true
                           :dropdown-menu? true
                           :align "start"
                           :content-props {:onClick shui/popup-hide!}})
                         (do
                           (set-view-entity! view)
                           (set-data! nil))))}
          (when-not references?
            (let [display-type (or (:db/ident (get view :logseq.property.view/type))
                                   :logseq.property.view/type.table)]
              (when-let [icon (:logseq.property/icon (db/entity display-type))]
                (icon-component/icon icon {:color? true
                                           :size 15}))))
          (let [title (:block/title view)]
            (if (= title "")
              "New view"
              title))
          (when (and current-view? show-items-count? (> items-count 0) (seq data))
            [:span.text-muted-foreground.text-xs
             items-count
             (when (and refs-total-count
                        (> refs-total-count items-count))
               [:span
                [:span "/"]
                [:span {:title "Total refs count"} refs-total-count]])]))))

     (shui/button
      {:variant :text
       :size :sm
       :title "Add new view"
       :class (str "!px-1 -ml-1 text-muted-foreground hover:text-foreground transition-opacity ease-in duration-300 " opacity)
       :on-click (fn []
                   (p/let [view (create-view! view-parent view-feature-type {:auto-triggered? false})]
                     (set-views! (concat views [view]))))}
      (ui/icon "plus" {:size 15}))]))

(rum/defc view-head < rum/static
  [view-parent view-entity table columns input sorting
   set-input! add-new-object!
   {:keys [view-feature-type title-key additional-actions]
    :as option}]
  (let [[hover? set-hover?] (hooks/use-state nil)
        db-based? (config/db-based-graph? (state/get-current-repo))
        references? (contains? #{:linked-references :unlinked-references} view-feature-type)
        opacity (cond
                  (and references? (not hover?)) "opacity-0"
                  hover? "opacity-100"
                  :else "opacity-75")]
    [:div.ls-view-head.flex.flex-1.flex-nowrap.items-center.justify-between.gap-1.overflow-hidden
     {:on-mouse-over #(set-hover? true)
      :on-mouse-out #(when-not (or (ui/popup-exists?)
                                   (ui/dropdown-exists?))
                       (set-hover? false))}
     [:div.flex.flex-row.items-center.gap-2
      (if db-based?
        (if (= view-feature-type :query-result)
          [:div.font-medium.opacity-50.text-sm
           (t (or title-key :views.table/default-title)
              (count (:rows table)))]
          (views-tab view-parent view-entity (assoc option
                                                    :hover? hover?
                                                    :opacity opacity
                                                    :references? references?)))
        [:div.font-medium.text-sm
         [:span
          (case view-feature-type
            :all-pages "All pages"
            :linked-references "Linked references"
            :unlinked-references "Unlinked references"
            "Nodes")]
         [:span.ml-1 (count (:rows table))]])]
     [:div.view-actions.flex.items-center.gap-1.transition-opacity.ease-in.duration-300
      {:class opacity}

      (when (seq additional-actions)
        [:<> (for [action additional-actions]
               (if (fn? action)
                 (action option)
                 action))])

      (when (and db-based? (seq sorting))
        (view-sorting table columns sorting))

      (when db-based? (filter-properties view-entity columns table option))

      (search input {:on-change set-input!
                     :set-input! set-input!})

      (when db-based?
        [:div.text-muted-foreground.text-sm
         (pv/property-value view-entity (db/entity :logseq.property.view/type) {})])

      (when db-based? (more-actions view-entity columns table option))

      (when (and db-based? add-new-object!) (new-record-button table view-entity))]]))

(rum/defc ^:large-vars/cleanup-todo view-inner < rum/static
  [view-entity {:keys [view-parent data full-data set-data! columns add-new-object! foldable-options input set-input! sorting set-sorting! filters set-filters! display-type group-by-property-ident config] :as option*}
   *scroller-ref]
  (let [db-based? (config/db-based-graph?)
        journals? (:journals? config)
        option (assoc option* :properties
                      (-> (remove #{:id :select} (map :id columns))
                          (conj :block/uuid :block/name)
                          vec))
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
        [row-selection set-row-selection!] (rum/use-state {})
        [last-selected-idx set-last-selected-idx!] (rum/use-state nil)
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
                                                         (or (false? (get visible-columns (:id column)))
                                                             (nil? (:name column))))
                                                       columns))
        group-by-property (or (:logseq.property.view/group-by-property view-entity)
                              (db/entity group-by-property-ident))
        table-map {:view-entity view-entity
                   :data data
                   :full-data full-data
                   :columns columns
                   :state {:sorting sorting
                           :filters filters
                           :row-selection row-selection
                           :visible-columns visible-columns
                           :sized-columns sized-columns
                           :ordered-columns ordered-columns
                           :pinned-columns pinned
                           :unpinned-columns unpinned
                           :group-by-property group-by-property
                           :last-selected-idx last-selected-idx}
                   :data-fns {:set-data! set-data!
                              :set-filters! set-filters!
                              :set-sorting! set-sorting!
                              :set-visible-columns! set-visible-columns!
                              :set-ordered-columns! set-ordered-columns!
                              :set-sized-columns! set-sized-columns!
                              :set-row-selection! set-row-selection!
                              :add-new-object! add-new-object!
                              :set-last-selected-idx! set-last-selected-idx!}}
        table (shui/table-option table-map)
        *view-ref (rum/use-ref nil)
        gallery? (= display-type :logseq.property.view/type.gallery)
        list-view? (= display-type :logseq.property.view/type.list)
        disable-virtualized? journals?
        [ready? set-ready?] (hooks/use-state false)]

    (run-effects! option table-map *scroller-ref gallery? set-ready?)

    [:div.flex.flex-col.gap-2.grid
     {:ref *view-ref}
     (ui/foldable
      (view-head view-parent view-entity table columns input sorting set-input! add-new-object! option)
      (fn []
        [:div.ls-view-body.flex.flex-col.gap-2.grid.mt-1
         (filters-row view-entity table option)

         (let [view-opts {:*scroller-ref *scroller-ref
                          :display-type display-type
                          :row-selection row-selection
                          :add-new-object! add-new-object!}]
           (if (and group-by-property-ident (not (number? (first (:rows table)))))
             (when (and ready? (seq (:rows table)))
               [:div.flex.flex-col.border-t.pt-2.gap-2
                (virtualized-list
                 {:class (when list-view? "group-list-view")
                  :custom-scroll-parent (util/app-scroll-container-node (rum/deref *view-ref))
                  :increase-viewport-by {:top 300 :bottom 300}
                  :compute-item-key (fn [idx]
                                      (str "table-group" idx))
                  :skipAnimationFrameInResizeObserver true
                  :total-count (count (:rows table))
                  :item-content (fn [idx]
                                  (let [[value group] (nth (:rows table) idx)
                                        add-new-object! (when (fn? add-new-object!)
                                                          (fn [_]
                                                            (add-new-object! view-entity table
                                                                             {:properties {(:db/ident group-by-property) (or (and (map? value) (:db/id value)) value)}})))
                                        table' (shui/table-option (-> table-map
                                                                      (assoc-in [:data-fns :add-new-object!] add-new-object!)
                                                                      (assoc :data group ; data for this group
                                                                             )))
                                        readable-property-value #(cond (and (map? %) (or (:block/title %) (:logseq.property/value %)))
                                                                       (db-property/property-value-content %)
                                                                       (= (:db/ident %) :logseq.property/empty-placeholder)
                                                                       "Empty"
                                                                       :else
                                                                       (str %))
                                        group-by-page? (or (= :block/page group-by-property-ident)
                                                           (and (not db-based?) (contains? #{:linked-references :unlinked-references} display-type)))]
                                    (rum/with-key
                                      (ui/foldable
                                       [:div
                                        {:class (when-not list-view? "my-2")}
                                        (cond
                                          group-by-page?
                                          (if value
                                            (let [c (state/get-component :block/page-cp)]
                                              (c {:disable-preview? true} value))
                                            [:div.text-muted-foreground.text-sm
                                             "Pages"])

                                          (some? value)
                                          (let [icon (pu/get-block-property-value value :logseq.property/icon)]
                                            [:div.flex.flex-row.gap-1.items-center
                                             (when icon (icon-component/icon icon {:color? true}))
                                             (readable-property-value value)])
                                          :else
                                          (str "No " (:block/title group-by-property)))]
                                       (fn []
                                         (let [render (view-cp view-entity
                                                               (assoc table' :rows group)
                                                               (assoc option
                                                                      ;; disabled virtualization for nested view
                                                                      :disable-virtualized? true)
                                                               view-opts)]
                                           (if list-view? [:div.-ml-2 render] render)))
                                       {:title-trigger? false})
                                      (str (:db/id view-entity) "-group-idx-" idx))))}
                 disable-virtualized?)])
             (view-cp view-entity table
                      (assoc option
                             :group-by-property-ident group-by-property-ident
                             :disable-virtualized? disable-virtualized?)
                      view-opts)))])
      (merge {:title-trigger? false} foldable-options))]))

(rum/defcs view-container
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
     * add-property!: `fn` to add a new property (or column)"
  < (rum/local nil ::scroller-ref)
  [state view-entity option]
  (rum/with-key (view-inner view-entity
                            (cond-> option
                              (or config/publishing? (:logseq.property.view/group-by-property view-entity))
                              (dissoc :add-new-object!))
                            (::scroller-ref state))
    (str "view-" (:db/id view-entity))))

(defn <load-view-data
  [view opts]
  (state/<invoke-db-worker :thread-api/get-view-data (state/get-current-repo) (:db/id view) opts))

(defn- get-query-columns
  [config view-entity properties]
  (let [advanced-query? (->> (:logseq.property/query view-entity)
                             :logseq.property.node/display-type
                             (= :code))]
    (->> properties
         (remove #{:logseq.property.embedding/hnsw-label-updated-at})
         (map db/entity)
         (ldb/sort-by-order)
         ((fn [cs] (build-columns config cs {:add-tags-column? false
                                             :advanced-query? advanced-query?}))))))

(defn- load-view-data-aux
  [view-entity view-parent {:keys [query? query query-entity-ids sorting filters input
                                   view-feature-type group-by-property-ident
                                   set-data! set-ref-pages-count! set-ref-matched-children-ids! set-properties! set-loading!]}]
  (c.m/run-task*
   (m/sp
     (let [need-query? (and query? (seq query-entity-ids) (or sorting filters (not (string/blank? input))))]
       (cond
         (and query? (empty? query-entity-ids))
         (set-data! nil)
         (and query? (not (or sorting filters)) (string/blank? input))
         (set-data! query-entity-ids)
         :else
         (when (or (not query?) need-query?)
           (try
             (let [opts (cond->
                         {:view-for-id (or (:db/id (:logseq.property/view-for view-entity))
                                           (:db/id view-parent))
                          :view-feature-type view-feature-type
                          :group-by-property-ident group-by-property-ident
                          :input input
                          :filters filters
                          :sorting sorting}
                          query?
                          (assoc :query-entity-ids query-entity-ids
                                 :query query))
                   {:keys [data ref-pages-count ref-matched-children-ids properties]}
                   (c.m/<? (<load-view-data view-entity opts))]
               (set-data! data)
               (when ref-pages-count
                 (set-ref-pages-count! ref-pages-count)
                 (set-ref-matched-children-ids! ref-matched-children-ids))
               (set-properties! properties))
             (finally
               (set-loading! false)))))))))

(rum/defc view-aux
  [view-entity {:keys [config view-parent view-feature-type data query-entity-ids query set-view-entity!] :as option}]
  (let [[input set-input!] (hooks/use-state "")
        [properties set-properties!] (hooks/use-state nil)
        db-based? (config/db-based-graph?)
        group-by-property (:logseq.property.view/group-by-property view-entity)
        display-type (if (config/db-based-graph?)
                       (or (:db/ident (get view-entity :logseq.property.view/type))
                           (when (= (:view-type option) :linked-references)
                             :logseq.property.view/type.list)
                           :logseq.property.view/type.table)
                       (if (= view-feature-type :all-pages)
                         :logseq.property.view/type.table
                         :logseq.property.view/type.list))
        list-view? (= display-type :logseq.property.view/type.list)
        group-by-property-ident (or (:db/ident group-by-property)
                                    (when (and list-view? (nil? group-by-property))
                                      :block/page)
                                    (when (and (not db-based?) (contains? #{:linked-references :unlinked-references} view-feature-type))
                                      :block/page))
        sorting* (:logseq.property.table/sorting view-entity)
        sorting (if (or (= sorting* :logseq.property/empty-placeholder) (empty? sorting*))
                  [{:id :block/updated-at, :asc? false}]
                  sorting*)
        [sorting set-sorting!] (rum/use-state sorting)
        view-filters (:logseq.property.table/filters view-entity)
        [filters set-filters!] (rum/use-state (or view-filters {}))
        query? (= view-feature-type :query-result)
        option (if query? (assoc option :columns (get-query-columns config view-entity properties)) option)
        [loading? set-loading!] (hooks/use-state (not query?))
        [data set-data!] (hooks/use-state data)
        [ref-pages-count set-ref-pages-count!] (hooks/use-state nil)
        [ref-matched-children-ids set-ref-matched-children-ids!] (hooks/use-state nil)
        load-view-data (fn load-view-data []
                         (load-view-data-aux view-entity view-parent
                                             {:query? query?
                                              :query query
                                              :query-entity-ids query-entity-ids
                                              :sorting sorting :filters filters :input input
                                              :view-feature-type view-feature-type :group-by-property-ident group-by-property-ident
                                              :set-data! set-data! :set-ref-pages-count! set-ref-pages-count! :set-ref-matched-children-ids! set-ref-matched-children-ids!
                                              :set-properties! set-properties! :set-loading! set-loading!}))]
    (let [sorting-filters {:sorting sorting
                           :filters filters}]
      (hooks/use-effect!
       load-view-data
       [(:db/id view-entity)
        (hooks/use-debounced-value input 300)
        sorting-filters
        group-by-property-ident
        (:db/id (:logseq.property.view/type view-entity))
        ;; page filters
        (:logseq.property.linked-references/includes view-parent)
        (:logseq.property.linked-references/excludes view-parent)
        (:filters view-parent)
        query-entity-ids
        (:data-changes-version option)]))
    (if loading?
      [:div.flex.flex-col.space-2.gap-2.my-2
       (repeat 3 (shui/skeleton {:class "h-6 w-full"}))]
      [:div.flex.flex-col.gap-2
       (view-container view-entity (assoc option
                                          :data data
                                          :full-data data
                                          :filters filters
                                          :sorting sorting
                                          :set-filters! set-filters!
                                          :set-sorting! set-sorting!
                                          :set-data! set-data!
                                          :set-input! set-input!
                                          :input input
                                          :items-count (if (every? number? data)
                                                         (count data)
                                                         ;; grouped
                                                         (let [f (fn count-col
                                                                   [data]
                                                                   (reduce (fn [total item]
                                                                             (if (number? item)
                                                                               (+ total 1)
                                                                               (let [[_k col] item]
                                                                                 (if (and (vector? (first col))
                                                                                          (not (map? col))
                                                                                          (uuid? (ffirst col)))
                                                                                   (+ total (count-col col))
                                                                                   (+ total (count col)))))) 0 data))]
                                                           (f data)))
                                          :group-by-property-ident group-by-property-ident
                                          :ref-pages-count ref-pages-count
                                          :ref-matched-children-ids ref-matched-children-ids
                                          :display-type display-type
                                          :load-view-data load-view-data
                                          :set-view-entity! set-view-entity!))])))

(defn sub-view-data-changes
  [view-parent view-feature-type]
  (when view-parent
    (when-let [repo (state/get-current-repo)]
      (when-let [k (case view-feature-type
                     :class-objects :frontend.worker.react/objects
                     :property-objects :frontend.worker.react/objects
                     :linked-references :frontend.worker.react/refs
                     nil)]
        (let [*version (atom 0)]
          (react/q repo [k (:db/id view-parent)]
                   {:query-fn (fn [_] (swap! *version inc))}
                   nil))))))

(rum/defc sub-view < rum/reactive db-mixins/query
  [view-entity option]
  (let [view (or (some-> (:db/id view-entity) db/sub-block) view-entity)
        data-changes-version (some-> (sub-view-data-changes (:view-parent option) (:view-feature-type option)) rum/react)]
    (view-aux view (assoc option :data-changes-version data-changes-version))))

(rum/defc view < rum/static
  [{:keys [view-parent view-feature-type view-entity] :as option}]
  (let [[views set-views!] (hooks/use-state nil)
        [view-entity set-view-entity!] (hooks/use-state view-entity)
        query? (= view-feature-type :query-result)
        db-based? (config/db-based-graph?)]
    (hooks/use-effect!
     #(c.m/run-task*
       (m/sp
         (when-not query?
           (let [repo (state/get-current-repo)]
             (when (and db-based? (not view-entity))
               (c.m/<? (db-async/<get-views repo (:db/id view-parent) view-feature-type))
               (let [views (get-views view-parent view-feature-type)]
                 (if-let [v (first views)]
                   (do
                     (set-views! views)
                     (when-not view-entity (set-view-entity! v)))
                   (when (and view-parent view-feature-type (not view-entity))
                     (let [new-view (c.m/<? (create-view! view-parent view-feature-type {:auto-triggered? true}))]
                       (set-views! (concat views [new-view]))
                       (set-view-entity! new-view))))))))))
     [])
    (when (if db-based? view-entity (or view-entity view-parent
                                        (= view-feature-type :all-pages)))
      (let [option' (assoc option
                           :view-feature-type (or view-feature-type
                                                  (:logseq.property.view/feature-type view-entity))
                           :views views
                           :set-views! set-views!
                           :set-view-entity! set-view-entity!)]
        (rum/with-key
          (sub-view view-entity option')
          (str "view-" (:db/id view-entity)))))))
