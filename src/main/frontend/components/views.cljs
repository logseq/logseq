(ns frontend.components.views
  "Different views of blocks"
  (:require [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [clojure.set :as set]
            [clojure.string :as string]
            [dommy.core :as dom]
            [frontend.components.block.image :as block-image]
            [frontend.components.dnd :as dnd]
            [frontend.components.icon :as icon-component]
            [frontend.components.property.config :as property-config]
            [frontend.components.property.value :as pv]
            [frontend.components.select :as select]
            [frontend.components.selection :as selection]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.dicts :as dicts]
            [frontend.date :as date]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.async :as db-async]
            [frontend.handler.db-based.export :as db-export-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.entity :as entity]
            [logseq.common.config :as common-config]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.property :as db-property]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [medley.core :as medley]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(def ^:private yyyy-MM-dd-formatter (tf/formatter "yyyy-MM-dd"))

(defn- virtualized-list
  [{:keys [total-count item-content compute-item-key] :as option}
   disable-virtualized?]
  (if disable-virtualized?
    [:div.content
     (for [i (range 0 total-count)]
       ^{:key (compute-item-key i)}
       [:<> (item-content i)])]
    (ui/virtualized-list option)))

(defn- get-scroll-parent
  [config]
  (if (:sidebar? config)
    (dom/sel1 ".sidebar-item-list")
    (if-let [view-el (:viewel config)]
      (util/app-scroll-container-node view-el)
      (util/app-scroll-container-node))))

(defn- view-container-id
  [config]
  (let [container-key (select-keys config [:id :sidebar? :embed? :custom-query? :query :current-block :table? :block? :db/id :page-name])]
    (or (:container-id config) (state/get-container-id container-key))))

(defn- table-selection-id
  [table]
  (get-in table [:state :selection-id]))

(defn- table-selection-path
  [table & path]
  (into [:view/table-selection (table-selection-id table)] path))

(defn- built-in-property
  [ident]
  (if-let [{:keys [title schema closed-values]} (get db-property/built-in-properties ident)]
    (cond-> {:db/ident ident
             :block/title title
             :logseq.property/type (:type schema)}
      (:cardinality schema)
      (assoc :db/cardinality
             (case (:cardinality schema)
               :many :db.cardinality/many
               :one :db.cardinality/one
               (:cardinality schema)))

      (seq closed-values)
      (assoc :property/closed-values closed-values))
    (some (fn [[_ {:keys [closed-values]}]]
            (some (fn [{:keys [db-ident value icon]}]
                    (when (= ident db-ident)
                      {:db/ident db-ident
                       :block/title value
                       :logseq.property/icon icon}))
                  closed-values))
          db-property/built-in-properties)))

(defn- column-property
  [column]
  (or (:property column)
      (built-in-property (or (:id column) (:db/ident column)))))

(defn- get-table-row-selection
  [table]
  (if (table-selection-id table)
    (or (rfx/snapshot-sub (table-selection-path table :row-selection)) {})
    {}))

(defn- use-table-row-selection
  [table]
  (if (table-selection-id table)
    (or (rfx/use-sub (table-selection-path table :row-selection)) {})
    {}))

(defn- set-table-row-selection!
  [selection-id row-selection]
  (state/set-state! [:view/table-selection selection-id :row-selection] (or row-selection {})))

(defn- table-last-selected-idx-path
  [table]
  (table-selection-path table :last-selected-idx))

(defn- get-table-last-selected-idx
  [table]
  (when (table-selection-id table)
    (rfx/snapshot-sub (table-last-selected-idx-path table))))

(defn- set-table-last-selected-idx!
  [table idx]
  (state/set-state! (table-last-selected-idx-path table) idx))

(defn- row-selection-map
  [row-selection k]
  (or (get row-selection k) {}))

(defn- table-row-id
  [row]
  (if (map? row)
    (or (:block/uuid row) (:db/id row))
    row))

(defn- table-row-selected?
  [row-selection row-id]
  (if (:selected-all? row-selection)
    (not (true? (get (row-selection-map row-selection :excluded-ids) row-id)))
    (true? (get (row-selection-map row-selection :selected-ids) row-id))))

(defn- use-table-row-selected?
  [table row]
  (if (table-selection-id table)
    (let [row-id (table-row-id row)
          selected-all? (boolean (rfx/use-sub (table-selection-path table :row-selection :selected-all?)))
          selected? (boolean (rfx/use-sub (table-selection-path table :row-selection :selected-ids row-id)))
          excluded? (boolean (rfx/use-sub (table-selection-path table :row-selection :excluded-ids row-id)))]
      (if selected-all?
        (not excluded?)
        selected?))
    false))

(defn- set-table-row-selected!
  [table row-id selected?]
  (let [row-selection (get-table-row-selection table)]
    (if (:selected-all? row-selection)
      (state/set-state! (table-selection-path table :row-selection :excluded-ids row-id) (not selected?))
      (state/set-state! (table-selection-path table :row-selection :selected-ids row-id) (boolean selected?)))))

(defn- table-get-selection-rows
  [row-selection rows]
  (if (:selected-all? row-selection)
    (let [excluded-ids (row-selection-map row-selection :excluded-ids)]
      (remove #(true? (get excluded-ids (table-row-id %))) rows))
    (let [selected-ids (row-selection-map row-selection :selected-ids)]
      (filter #(true? (get selected-ids (table-row-id %))) rows))))

(defn- table-action-rows
  [table]
  (when-not (:full-data-loading? table)
    (or (:full-data table) (:rows table))))

(defn- table-selection-summary
  [table row-selection]
  (let [rows (table-action-rows table)
        selected-rows (table-get-selection-rows row-selection rows)
        selected-count (count selected-rows)
        rows-count (count rows)]
    {:selected-rows selected-rows
     :selected-all? (and (pos? rows-count) (= rows-count selected-count))
     :selected-some? (pos? selected-count)}))

(defn- table-toggle-row-selected!
  [table row selected?]
  (set-table-row-selected! table (table-row-id row) selected?))

(defn- table-toggle-selected-all!
  [table selected?]
  (let [group-by-property (get-in table [:state :group-by-property])]
    (cond
      (and group-by-property selected?)
      (doseq [row-id (map table-row-id (:rows table))]
        (state/set-state! (table-selection-path table :row-selection :selected-ids row-id) true))

      selected?
      (state/set-state! (table-selection-path table :row-selection)
                        {:selected-all? true
                         :selected-ids {}
                         :excluded-ids {}})

      group-by-property
      (doseq [row-id (map table-row-id (:rows table))]
        (state/set-state! (table-selection-path table :row-selection :selected-ids row-id) false))

      :else
      (state/set-state! (table-selection-path table :row-selection) {}))))

(hsx/defc header-checkbox
  [table]
  (let [[show? set-show!] (hooks/use-state false)
        row-selection (use-table-row-selection table)
        {:keys [selected-all? selected-some?]} (table-selection-summary table row-selection)]
    [:label.h-8.w-8.flex.items-center.justify-center.cursor-pointer
     {:html-for "header-checkbox"
      :on-mouse-over #(set-show! true)
      :on-mouse-out #(set-show! false)}
     (shui/checkbox
      {:id "header-checkbox"
       :checked (or selected-all? (and selected-some? "indeterminate"))
       :on-checked-change (fn [value]
                            (table-toggle-selected-all! table value))
       :aria-label (t :view.table/select-all)
       :class (str "flex transition-opacity "
                   (if (or show? selected-all? selected-some?) "opacity-100" "opacity-0"))})]))

(hsx/defc header-index
  []
  [:label.h-8.w-6.flex.items-center.justify-center
   {:html-for "header-index"
    :title (t :view.table/row-number)}
   "#"])

(hsx/defc row-checkbox
  [{:keys [data] :as table} row _column]
  (let [id (str (:db/id row) "-" "checkbox")
        [show? set-show!] (hooks/use-state false)
        checked? (use-table-row-selected? table row)]
    [:label.jtrigger.h-8.w-8.flex.items-center.justify-center.cursor-pointer
     {:html-for (str (:db/id row) "-" "checkbox")
      :data-table-row-select true
      :on-mouse-over #(set-show! true)
      :on-mouse-out #(set-show! false)}
     (shui/checkbox
      {:id id
       :checked checked?
       :on-click (fn [e]
                   (when-let [last-selected-idx (and (.-shiftKey e)
                                                     (get-table-last-selected-idx table))]
                     (util/stop e)
                     (let [idx (.indexOf data (table-row-id row))]
                       (when (not= last-selected-idx idx)
                         (let [new-ids (keep (fn [idx] (util/nth-safe data idx)) (range (min last-selected-idx idx) (inc (max last-selected-idx idx))))]
                           (when (seq new-ids)
                             (doseq [row-id (map table-row-id new-ids)]
                               (state/set-state! (table-selection-path table :row-selection :selected-ids row-id) true))))))))
       :on-checked-change (fn [v]
                            (if v
                              (let [idx (.indexOf data (table-row-id row))]
                                (set-table-last-selected-idx! table idx))
                              (let [idx (.indexOf data (table-row-id row))]
                                (when (= idx (get-table-last-selected-idx table))
                                  (set-table-last-selected-idx! table nil))))
                            (table-toggle-row-selected! table row v))
       :aria-label (t :view.table/select-row)
       :class (str "jtrigger flex transition-opacity "
                   (if (or show? checked?) "opacity-100" "opacity-0"))})]))

(hsx/defc gallery-card-checkbox
  [{:keys [data] :as table} row]
  (let [id (str (:db/id row) "-gallery-checkbox")
        checked? (use-table-row-selected? table row)]
    [:label.ls-gallery-card-select.flex.items-center.justify-center.cursor-pointer
     {:html-for id
      :on-click util/stop-propagation}
     (shui/checkbox
      {:id id
       :checked checked?
       :on-click (fn [e]
                   (when-let [last-selected-idx (and (.-shiftKey e)
                                                     (get-table-last-selected-idx table))]
                     (util/stop e)
                     (let [idx (.indexOf data (table-row-id row))]
                       (when (not= last-selected-idx idx)
                         (let [new-ids (keep (fn [idx] (util/nth-safe data idx))
                                             (range (min last-selected-idx idx)
                                                    (inc (max last-selected-idx idx))))]
                           (when (seq new-ids)
                             (doseq [row-id (map table-row-id new-ids)]
                               (state/set-state! (table-selection-path table :row-selection :selected-ids row-id) true))))))))
       :on-checked-change (fn [v]
                            (let [idx (.indexOf data (table-row-id row))]
                              (if v
                                (set-table-last-selected-idx! table idx)
                                (when (= idx (get-table-last-selected-idx table))
                                  (set-table-last-selected-idx! table nil))))
                            (table-toggle-row-selected! table row v))
       :aria-label (t :view.table/select-row)
       :class "flex"})]))

(defonce *last-header-action-target (atom nil))

(defn- prevent-view-action-button-focus
  [^js e]
  (let [target (.-target e)]
    (when (and (some-> target (.closest "button, [tabindex]"))
               (not (some-> target (.closest "input, textarea, select, [contenteditable='true']"))))
      (.preventDefault e))))

(defn- header-dropdown-click-should-hide?
  [target]
  (let [menu-item (some-> target (.closest "[role='menuitem']"))
        submenu-trigger? (= "menu" (some-> menu-item (.getAttribute "aria-haspopup")))]
    (boolean
     (and target
          (not (util/input? target))
          menu-item
          (not submenu-trigger?)))))

(defn header-cp
  [{:keys [view-entity column-set-sorting! state]} column]
  (let [sorting (:sorting state)
        sortable? (not (false? (:sortable? column)))
        [asc?] (some (fn [item] (when (= (:id item) (:id column))
                                  (when-some [asc? (:asc? item)]
                                    [asc?]))) sorting)
        property (column-property column)
        pinned? (when property
                  (contains? (set (map :db/id (:logseq.property.table/pinned-columns view-entity)))
                             (:db/id property)))
        sub-content (fn [{:keys [id]}]
                      (let [table-options [(when sortable?
                                             (shui/dropdown-menu-item
                                              {:key "asc"
                                               :on-click #(column-set-sorting! sorting column true)}
                                              [:div.flex.flex-row.items-center.gap-1
                                               (ui/icon "arrow-up" {:size 15})
                                               [:div (t :view.table/sort-ascending)]]))
                                           (when sortable?
                                             (shui/dropdown-menu-item
                                              {:key "desc"
                                               :on-click #(column-set-sorting! sorting column false)}
                                              [:div.flex.flex-row.items-center.gap-1
                                               (ui/icon "arrow-down" {:size 15})
                                               [:div (t :view.table/sort-descending)]]))
                                           (when (:db/id property)
                                             (shui/dropdown-menu-item
                                              {:on-click (fn [_e]
                                                           (if pinned?
                                                             (db-property-handler/delete-property-value! (:db/id view-entity)
                                                                                                         :logseq.property.table/pinned-columns
                                                                                                         (:db/id property))
                                                             (property-handler/set-block-property! (:db/id view-entity)
                                                                                                   :logseq.property.table/pinned-columns
                                                                                                   (:db/id property)))
                                                           (shui/popup-hide! id))}
                                              [:div.flex.flex-row.items-center.gap-1
                                               (ui/icon "pin" {:size 15})
                                               [:div (if pinned? (t :view.table/unpin) (t :view.table/pin))]]))]
                            tag (when-let [entity (:logseq.property/view-for view-entity)]
                                  (when (entity/class? entity)
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
      :class "h-8 !pl-2 !px-2 !py-0 hover:text-foreground w-full justify-start"
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
                                           :content-props {:on-click (fn [^js e]
                                                                       (when-let [target (.-target e)]
                                                                         (when (header-dropdown-click-should-hide? target)
                                                                           (shui/popup-hide! popup-id))))}
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
  (cond
    (map? entity)
    (db-property/property-value-content entity)

    (keyword? entity)
    (str entity)

    :else
    entity))

(hsx/defc referenced-filter-value-content
  [block-uuid]
  (some-> (db-hooks/use-block block-uuid)
          get-property-value-content))

(defn- filter-value-content
  [value]
  (let [reference-uuid (cond
                         (uuid? value) value
                         (and (map? value)
                              (nil? (get-property-value-content value)))
                         (:block/uuid value))]
    (if (uuid? reference-uuid)
      [referenced-filter-value-content reference-uuid]
      (get-property-value-content value))))

(hsx/defc block-container
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
  (let [node (hooks/deref *ref)
        cell (util/rec-get-node node "ls-table-cell")]
    (p/do!
     (editor-handler/save-current-block!)
     (when hide-popup?
       (shui/popup-hide!))
     (state/exit-editing-and-set-selected-blocks! [cell])
     (set-focus-timeout! (js/setTimeout #(.focus cell) 100)))))

(defn- mobile-btn-class
  "The sole purpose of this function is to avoid false positives in hardcoded UI detection."
  [opacity]
  (str "h-6 w-6 !p-1 text-muted-foreground transition-opacity duration-100 ease-in bg-gray-01 opacity-" opacity))

(defn- first-window-title-text
  [block]
  (some->> (:block/title block) str string/trim string/split-lines first))

(defn- first-window-title-preview?
  [block]
  (true? (:block.temp/first-window-preview? block)))

(defn- first-window-block-title
  "Tags/Movies first paint spent block-title hooks on every preview row."
  [block]
  [:div.table-block-title.relative.flex.items-center.w-full.h-full.cursor-pointer
   [:div.flex.flex-row
    [:div (first-window-title-text block)]]])

(defn- first-window-list-block
  "List view first paint should show the preview title before full block hydration."
  [block]
  [:div.ls-block.flex.flex-row.items-center
   {:style {:min-height 24}}
   [:div.block-content (first-window-title-text block)]])

(hsx/defc ^:large-vars/cleanup-todo block-title-interactive
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
                        (if (first-window-title-preview? block)
                          (first-window-title-text block)
                          (inline-title
                           {:table? true
                            :block/uuid (:block/uuid block)}
                           (first-window-title-text block)))])]
          (if many?
            (->> (map render block*)
                 (interpose [:div.mr-1 ","]))
            (render block*)))]
       [:div])

     (when (and (not (util/mobile?))
                (not (first-window-title-preview? block)))
       (let [class (mobile-btn-class opacity)]
         [:div.absolute.-right-1
          [:div.flex.flex-row.items-center
           (shui/button
            {:variant :ghost
             :title (t :ui/open)
             :on-click (fn [e]
                         (util/stop-propagation e)
                         (redirect!))
             :class class}
            (ui/icon "arrow-right"))
           (shui/button
            {:variant :ghost
             :title (t :sidebar.right/open)
             :class class
             :on-click (fn [e]
                         (util/stop-propagation e)
                         (add-to-sidebar!))}
            (ui/icon "layout-sidebar-right"))]]))]))

(defn- block-title
  [block* opts]
  (let [block (if (db-property/many? (:property opts))
                (first block*)
                block*)]
    (if (first-window-title-preview? block)
      (first-window-block-title block)
      [block-title-interactive block* opts])))

(defn- page-column
  []
  {:id :block/page
   :name (t :view.table/page)
   :type :node
   :sortable? false
   :header header-cp
   :cell (fn [_table row _column]
           (when-let [page (:block/page row)]
             (when-let [page-cp (state/get-component :block/page-cp)]
               (page-cp {:disable-preview? true
                         :skip-async-load? true} page))))})

(defn build-columns
  [config properties & {:keys [with-object-name? with-id? add-tags-column? add-page-column? advanced-query?]
                        :or {with-object-name? true
                             with-id? true
                             add-tags-column? true}}]
  (let [properties' (->>
                     (if (or (some #(= (:db/ident %) :block/tags) properties) (not add-tags-column?))
                       properties
                       (conj properties (built-in-property :block/tags)))
                     (remove (fn [property]
                               (or (nil? property)
                                   (contains? #{:logseq.property/hide?} (:db/ident property))))))
        property-keys (set (map :db/ident properties'))]
    (->> (concat
          [{:id :select
            :name (t :view.table/select-column)
            :header (fn [table _column] (header-checkbox table))
            :cell (fn [table row column]
                    (row-checkbox table row column))
            :column-list? false
            :resizable? false}
           (when with-id?
             {:id :id
              :name "#"
              :header (fn [_table _column] (header-index))
              :cell (fn [table row _column]
                      (inc (.indexOf (:rows table) (:db/id row))))
              :resizable? false})
           (when with-object-name?
             {:id :block/title
              :name (t :view.table/name-column)
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
                 (let [property (if (:db/ident property)
                                  property
                                  (or (merge (built-in-property ident) property) property)) ; otherwise, :cell/:header/etc. will be removed
                       get-value (when (:db/ident property)
                                   (fn [row] (db-view/get-property-value-for-search row property)))]
                   {:id ident
                    :name (or (:name property)
                              (db-property/built-in-display-title property t))
                    :property property
                    :header (or (:header property)
                                header-cp)
                    :cell (or (:cell property)
                              (when (:db/ident property)
                                (fn [_table row _column style]
                                  (pv/property-value row property {:view? true
                                                                   :table-view? true
                                                                   :view-parent (:view-parent config)
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
              :cell timestamp-cell-cp})
           (when add-page-column?
             (page-column))])
         (remove nil?))))

(defn sort-columns
  [columns ordered-column-ids]
  (if (seq ordered-column-ids)
    (let [id->columns (zipmap (map :id columns) columns)
          distinct-ordered-ids (distinct ordered-column-ids)
          ordered-id-set (set distinct-ordered-ids)]
      (concat
       (keep (fn [id]
               (get id->columns id))
             distinct-ordered-ids)
       (remove
        (fn [column] (ordered-id-set (:id column)))
        columns)))
    columns))

(defonce groups-sort-by-options
  [[:view.table/group-journal-date :block/journal-day]
   [:view.table/group-page-name :block/title]
   [:view.table/group-page-updated-date :block/updated-at]
   [:view.table/group-page-created-date :block/created-at]])

(defonce groups-sort-by-name->property-identity
  (into {} groups-sort-by-options))
(defonce groups-sort-by-property-identity->name
  (set/map-invert groups-sort-by-name->property-identity))

(def ^:private groupable-property-types
  #{:checkbox :class :date :default :node :number :string :url})

(def ^:private groupable-many-property-types
  #{:class :default :node})

(defn group-by-column?
  [column]
  (when-let [id (:id column)]
    (or (= id :block/page)
        (when-not (= id :block/title)
          (let [property (column-property column)]
            (and (contains? groupable-property-types (:logseq.property/type property))
                 (or (not (db-property/many? property))
                     (contains? groupable-many-property-types (:logseq.property/type property)))))))))

(defn- set-view-property!
  [view-entity property-ident value]
  (property-handler/set-block-property! (:db/id view-entity) property-ident value))

(defn- <property-ident->id
  [property-ident]
  (p/let [property (state/<invoke-db-worker :thread-api/pull (state/get-current-repo) [:db/id] property-ident)]
    (:db/id property)))

(def ^:private gallery-cover-property-types
  #{:asset :url})

(def ^:private gallery-default-card-dimensions
  {:width 220
   :height 320})

(def ^:private gallery-compact-card-dimensions
  {:width 160
   :height 232})

(def ^:private gallery-min-card-dimension 100)

(def ^:private gallery-max-card-dimension 1024)

(defn- clamp-gallery-card-dimension
  [value]
  (-> value
      (max gallery-min-card-dimension)
      (min gallery-max-card-dimension)))

(defn- gallery-column-ident
  [column]
  (or (:id column)
      (:db/ident column)))

(defn- gallery-column-property
  [column]
  (cond
    (:logseq.property/type column) column
    (gallery-column-ident column) (column-property column)))

(defn gallery-cover-property-column?
  "Asset and URL properties can supply a gallery card cover."
  [column]
  (contains? gallery-cover-property-types
             (:logseq.property/type (gallery-column-property column))))

(defn- gallery-asset-columns
  [columns]
  (filter gallery-cover-property-column? columns))

(defn- gallery-asset-property-idents
  [columns]
  (->> columns
       (filter gallery-cover-property-column?)
       (keep gallery-column-ident)
       vec))

(defn- gallery-asset-property-ident
  [view columns]
  (let [configured-ident (:logseq.property.view/gallery-asset-property-ident view)
        view-for (:logseq.property/view-for view)
        feature-type (:logseq.property.view/feature-type view)
        asset-tag? (= :logseq.class/Asset (:db/ident view-for))
        tag-view? (and (= :class-objects feature-type)
                       (entity/class? view-for))
        query-view? (= :query-result feature-type)]
    (cond
      asset-tag?
      :block/uuid

      configured-ident
      configured-ident

      (or tag-view? query-view?)
      (let [asset-idents (gallery-asset-property-idents columns)]
        (when (= 1 (count asset-idents))
          (first asset-idents))))))

(defn- gallery-display-property-idents
  [view columns asset-property-ident]
  (let [configured-idents (set (keep :db/ident (:logseq.property.view/gallery-display-properties view)))
        display-idents (if (seq configured-idents)
                         (->> columns
                              (keep gallery-column-ident)
                              (filter configured-idents)
                              vec)
                         [:block/title])]
    (->> display-idents
         (remove #{:select :id asset-property-ident})
         vec)))

(defn- gallery-card-dimensions
  [view]
  (case (:logseq.property.view/gallery-card-size view)
    :compact
    gallery-compact-card-dimensions

    :custom
    (let [width (:logseq.property.view/gallery-card-width view)
          height (:logseq.property.view/gallery-card-height view)]
      (if (and (number? width) (number? height) (pos? width) (pos? height))
        {:width (clamp-gallery-card-dimension width)
         :height (clamp-gallery-card-dimension height)}
        gallery-default-card-dimensions))

    gallery-default-card-dimensions))

(defn- set-gallery-display-properties!
  [view-entity property-idents]
  (p/let [property-ids (p/all (map <property-ident->id property-idents))]
    (set-view-property! view-entity
                        :logseq.property.view/gallery-display-properties
                        (vec (keep identity property-ids)))))

(defn- gallery-display-properties-menu
  [view-entity columns]
  (let [asset-property-ident (gallery-asset-property-ident view-entity columns)
        display-property-idents (set (gallery-display-property-idents view-entity columns asset-property-ident))
        property-columns (remove #(contains? #{:select :id asset-property-ident} (:id %)) columns)]
    (shui/dropdown-menu-sub
     (shui/dropdown-menu-sub-trigger
      (t :view.gallery/display-properties))
     (shui/dropdown-menu-sub-content
      (for [column property-columns]
        (shui/dropdown-menu-checkbox-item
         {:key (str "gallery-display-" (:id column))
          :checked (contains? display-property-idents (:id column))
          :onCheckedChange (fn [checked?]
                             (let [new-idents (if checked?
                                                (conj display-property-idents (:id column))
                                                (disj display-property-idents (:id column)))]
                               (set-gallery-display-properties! view-entity
                                                                (filter new-idents (map :id property-columns)))))
          :onSelect (fn [e] (.preventDefault e))}
         (:name column)))))))

(defn- gallery-asset-property-menu
  [view-entity columns]
  (let [asset-columns (seq (gallery-asset-columns columns))]
    (when asset-columns
      (let [asset-property-ident (gallery-asset-property-ident view-entity columns)]
        (shui/dropdown-menu-sub
         (shui/dropdown-menu-sub-trigger
          (t :view.gallery/cover-property))
         (shui/dropdown-menu-sub-content
          (for [column asset-columns]
            (shui/dropdown-menu-checkbox-item
             {:key (str "gallery-asset-" (:id column))
              :checked (= asset-property-ident (:id column))
              :onCheckedChange (fn [checked?]
                                 (when checked?
                                   (set-view-property! view-entity
                                                       :logseq.property.view/gallery-asset-property
                                                       (<property-ident->id (:id column)))))
              :onSelect (fn [e] (.preventDefault e))}
             (:name column)))))))))

(defn- gallery-slider-value
  [value]
  (-> (js/Math.round value)
      (max gallery-min-card-dimension)
      (min gallery-max-card-dimension)))

(hsx/defc gallery-card-size-slider
  [label value on-change on-commit]
  [:div.flex.flex-col.gap-2
   [:div.flex.flex-row.items-center.justify-between.gap-3.text-sm.leading-none
    [:span label]
    [:span.font-medium.tabular-nums (str value \p \x)]]
   (shui/slider
    {:class "relative flex w-full touch-none select-none items-center"
     :value #js [value]
     :min gallery-min-card-dimension
     :max gallery-max-card-dimension
     :step 1
     :on-value-change (fn [result]
                        (on-change (gallery-slider-value (first result))))
     :on-value-commit (fn [result]
                        (on-commit (gallery-slider-value (first result))))}
    (shui/slider-track
     {:class "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary"}
     (shui/slider-range
      {:class "absolute h-full bg-primary"}))
    (shui/slider-thumb
     {:class "block h-4 w-4 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none"}))])

(hsx/defc gallery-custom-card-size-inputs
  [view-entity dimensions set-size!]
  (let [[width set-width!] (hooks/use-state (:width dimensions))
        [height set-height!] (hooks/use-state (:height dimensions))
        save-dimensions! (fn [width' height']
                           (p/do!
                            (set-size! :custom)
                            (set-view-property! view-entity :logseq.property.view/gallery-card-width width')
                            (set-view-property! view-entity :logseq.property.view/gallery-card-height height')))
        stop-menu-input! (fn [e]
                           (when-not (= "Escape" (util/ekey e))
                             (util/stop-propagation e)))]
    [:div
     {:class "flex flex-col items-stretch gap-2 w-[320px] max-w-[calc(100vw-32px)] px-4 py-2"
      :on-click util/stop-propagation
      :on-key-down stop-menu-input!}
     [:div.w-full.text-sm.leading-8 (t :view.gallery/custom-size)]
     [:div.flex.flex-col.gap-4.w-full
      (gallery-card-size-slider
       (t :view.gallery/width)
       width
       set-width!
       #(save-dimensions! % height))
      (gallery-card-size-slider
       (t :view.gallery/height)
       height
       set-height!
       #(save-dimensions! width %))]]))

(defn- gallery-card-size-menu
  [view-entity]
  (let [size (:logseq.property.view/gallery-card-size view-entity)
        dimensions (gallery-card-dimensions view-entity)
        set-size! #(set-view-property! view-entity :logseq.property.view/gallery-card-size %)]
    (shui/dropdown-menu-sub
     (shui/dropdown-menu-sub-trigger
      (t :view.gallery/card-size))
     (shui/dropdown-menu-sub-content
      (for [[value label] [[:default (t :view.gallery/default-size)]
                           [:compact (t :view.gallery/compact-size)]]]
        (shui/dropdown-menu-checkbox-item
         {:key (str "gallery-size-" (name value))
          :checked (= value (or size :default))
          :onCheckedChange #(when % (set-size! value))
          :onSelect (fn [e] (.preventDefault e))}
         label))
      (gallery-custom-card-size-inputs view-entity dimensions set-size!)))))

(hsx/defc groups-sort
  [view-entity sort-by-value]
  (let [property-ident (or (:db/ident sort-by-value) :block/journal-day)]
    (shui/dropdown-menu-sub
     (shui/dropdown-menu-sub-trigger
      (t :view.table/sort-groups-by))
     (shui/dropdown-menu-sub-content
      (for [[option-key _] groups-sort-by-options]
        (shui/dropdown-menu-checkbox-item
         {:key (name option-key)
          :checked (= option-key (groups-sort-by-property-identity->name property-ident))
          :onCheckedChange (fn [checked?]
                             (p/let [property-id (<property-ident->id (groups-sort-by-name->property-identity option-key))]
                               (if checked?
                                 (db-property-handler/set-block-property! (:db/id view-entity) :logseq.property.view/sort-groups-by-property
                                                                          property-id)
                                 (db-property-handler/remove-block-property! (:db/id view-entity) :logseq.property.view/sort-groups-by-property))))
          :onSelect (fn [e] (.preventDefault e))}
         (t option-key)))))))

(hsx/defc groups-sort-order
  [view-entity desc?]
  (let [descending-label (t :view.table/descending)
        ascending-label (t :view.table/ascending)]
    (shui/dropdown-menu-sub
     (shui/dropdown-menu-sub-trigger
      (t :view.table/sort-groups-order))
     (shui/dropdown-menu-sub-content
      (for [option [descending-label ascending-label]]
        (shui/dropdown-menu-checkbox-item
         {:key option
          :checked (= option (if desc? descending-label ascending-label))
          :onCheckedChange (fn [checked?]
                             (db-property-handler/set-block-property! (:db/id view-entity) :logseq.property.view/sort-groups-desc?
                                                                      (or (and checked? (= descending-label option))
                                                                          (and (not checked?) (not= descending-label option)))))
          :onSelect (fn [e] (.preventDefault e))}
         option))))))

(hsx/defc more-actions
  [view-entity columns {:keys [column-visible? column-toggle-visibility
                               full-data-loading?] :as table}
   {:keys [display-type group-by-property-ident]}]
  (let [table? (= display-type :logseq.property.view/type.table)
        gallery? (= display-type :logseq.property.view/type.gallery)
        group-by-columns (->> (concat (when (or
                                             (contains? #{:linked-references :unlinked-references}
                                                        (:logseq.property.view/feature-type view-entity))
                                             (:logseq.property/query view-entity))
                                        [(page-column)])
                                      (filter group-by-column? columns))
                              (medley/distinct-by :id))
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
      {:align "end"
       :onCloseAutoFocus #(.preventDefault %)}
      (shui/dropdown-menu-group
       (when table?
         (shui/dropdown-menu-sub
          (shui/dropdown-menu-sub-trigger
           (t :view.table/columns-visibility))
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
       (when gallery?
         (gallery-display-properties-menu view-entity columns))
       (when gallery?
         (gallery-asset-property-menu view-entity columns))
       (when gallery?
         (gallery-card-size-menu view-entity))
       (when (seq group-by-columns)
         (shui/dropdown-menu-sub
          (shui/dropdown-menu-sub-trigger
           (t :view.table/group-by))
          (shui/dropdown-menu-sub-content
           (for [column group-by-columns]
             (shui/dropdown-menu-checkbox-item
              {:key (str (:id column))
               :className "capitalize"
               :checked (= (:id column) group-by-property-ident)
               :onCheckedChange (fn [result]
                                  (if result
                                    (p/let [property-id (<property-ident->id (:id column))]
                                      (db-property-handler/set-block-property! (:db/id view-entity) :logseq.property.view/group-by-property
                                                                               property-id))
                                    (db-property-handler/remove-block-property! (:db/id view-entity) :logseq.property.view/group-by-property)))
               :onSelect (fn [e] (.preventDefault e))}
              (:name column))))))
       (when group-by-page?
         (groups-sort view-entity (:logseq.property.view/sort-groups-by-property view-entity)))
       (when group-by-property-ident
         (groups-sort-order view-entity (:logseq.property.view/sort-groups-desc? view-entity)))
       (shui/dropdown-menu-item
        {:key "export-edn"
         :disabled full-data-loading?
         :on-click #(when-let [rows (table-action-rows table)]
                      (db-export-handler/export-view-nodes-data
                       rows
                       {:group-by? (some? group-by-property-ident)}))}
        (t :view/export-edn)))))))

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

(hsx/defc add-property-button
  []
  [:div.ls-table-header-cell.!border-0
   (shui/button
    {:variant "text"
     :class "h-8 !pl-2 !px-2 !py-0 hover:text-foreground w-full justify-start"}
    (ui/icon "plus")
    (t :view/new-property))])

(hsx/defc action-bar
  [table selected-rows {:keys [on-delete-rows]}]
  (shui/toolbar
   {:class "ls-table-actions bg-gray-01"
    :style {:z-index 101}}
   [:div.selection-count.px-2 (t :view.table/selected-count (count selected-rows))]
   (selection/action-group
    {:on-cut #(on-delete-rows table selected-rows)
     :selected-blocks selected-rows
     :hide-dots? true
     :button-border? true
     :outliner? false
     :view-parent (:logseq.property/view-for (:view-entity table))})))

(hsx/defc column-resizer
  [_column on-sized!]
  (let [*el (hooks/use-ref nil)
        [dx set-dx!] (hooks/use-state nil)
        [width set-width!] (hooks/use-state nil)
        add-resizing-class #(dom/add-class! js/document.documentElement "is-resizing-buf")
        remove-resizing-class #(dom/remove-class! js/document.documentElement "is-resizing-buf")]

    (hooks/use-effect!
     (fn []
       (when (number? dx)
         (some-> (hooks/deref *el)
                 (dom/set-style! :transform (str "translate3D(" dx "px , 0, 0)")))))
     [dx])

    (hooks/use-effect!
     (fn []
       (when-let [el (and (fn? js/window.interact) (hooks/deref *el))]
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

(defn delete-pages-needs-confirm?
  [view-parent view-feature-type pages]
  (boolean
   (and (seq pages)
        (case view-feature-type
          :class-objects (not= :logseq.class/Page (:db/ident view-parent))
          (:query-result :all-pages) true
          false))))

(defn- on-delete-rows
  [view-parent view-feature-type table selected-ids]
  (p/let [results (db-async/<get-blocks (state/get-current-repo) selected-ids {:children? false})
          selected-rows (->> (keep :block results)
                             (remove :logseq.property/built-in?))]
    (let [pages (filter entity/page? selected-rows)
          blocks (remove entity/page? selected-rows)
          page-ids (map :db/id pages)
          {:keys [set-row-selection!]} (:data-fns table)
          clear-selection! #(set-row-selection! {})
          confirm-pages? (delete-pages-needs-confirm? view-parent view-feature-type pages)
          ;; Everything that is not a page deletion. Held in a closure so that it can be
          ;; deferred until after confirmation instead of running straight away.
          delete-rest!
          (fn []
            (ui-outliner-tx/transact!
             {:outliner-op :delete-blocks}
             (when (seq blocks)
               (outliner-op/delete-blocks! blocks nil))
             (when (= view-feature-type :property-objects)
               ;; Relationships with built-in properties must not be deleted e.g. built-in? or parent
               (when-not (:logseq.property/built-in? view-parent)
                 (let [tx-data (map (fn [pid] [:db/retract pid (:db/ident view-parent)]) page-ids)]
                   (when (seq tx-data)
                     (outliner-op/transact! tx-data {:outliner-op :save-block})))))))]
      (if confirm-pages?
        ;; Nothing at all is deleted until the user confirms. batch-delete-dialog invokes this
        ;; callback only from its "Yes" handler, so Cancel leaves the pages AND any blocks in
        ;; the same selection untouched.
        (state/pub-event! [:page/show-delete-dialog pages
                           (fn []
                             (p/do!
                              (delete-rest!)
                              (clear-selection!)))])
        (p/do!
         (delete-rest!)
         (when-not (and (= view-feature-type :property-objects)
                        (:logseq.property/built-in? view-parent))
           (clear-selection!)))))))

(defn- always-eager-column?
  [column]
  (contains? #{:block/title :select :id} (:id column)))

(defn- visible-unpinned-columns
  "Movies first paint mounted 24 cells per row. Keep name/select/id
  on the first frame and mount property columns after that paint."
  [unpinned-columns mount-unpinned-cells?]
  (if (false? mount-unpinned-cells?)
    (filterv always-eager-column? unpinned-columns)
    (vec unpinned-columns)))

(defn- table-header
  [table {:keys [show-add-property? add-property! view-parent view-feature-type] :as option}]
  (let [set-ordered-columns! (get-in table [:data-fns :set-ordered-columns!])
        pinned (get-in table [:state :pinned-columns])
        unpinned (get-in table [:state :unpinned-columns])
        row-selection (use-table-row-selection table)
        {:keys [selected-rows]} (table-selection-summary table row-selection)
        build-item (fn [column]
                     {:id (:name column)
                      :value (:id column)
                      :content (table-header-cell table column)
                      :disabled? (= (:id column) :select)})
        pinned-items (mapv build-item pinned)
        unpinned (visible-unpinned-columns
                  unpinned
                  (:mount-unpinned-cells? option))
        unpinned-items (if (and show-add-property?
                                (not (false? (:mount-unpinned-cells? option))))
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

(hsx/defc lazy-table-cell
  [cell-render-f cell-placeholder]
  (let [^js state (ui/useInView #js {:rootMargin "0px"})
        in-view? (.-inView state)]
    [:div.h-full
     {:ref (.-ref state)}
     (if in-view?
       (cell-render-f)
       cell-placeholder)]))

(defn- eager-table-cells?
  "Virtuoso windows rows. Unpinned property columns stay lazy. The name
  column is on-screen even when it is not pinned, so it stays eager."
  [disable-virtualized? column lazy-column?]
  (and (not disable-virtualized?)
       (or (always-eager-column? column)
           (not lazy-column?))))

(defn- click-cell
  [node]
  (when-let [trigger (dom/sel1 node ".jtrigger")]
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

(defn- table-cell-plain-value
  "Plain text used for native title tooltips on clipped table cells."
  [row column]
  (let [id (:id column)]
    (cond
      (contains? #{:select :id :add-property} id)
      nil

      (= :block/title id)
      (some-> (:block/title row) str)

      (fn? (:get-value column))
      (let [value ((:get-value column) row)]
        (when (some? value)
          (str value)))

      :else
      nil)))

(hsx/defc table-cell-container
  [cell-opts body]
  (let [*ref (hooks/use-ref nil)]
    (shui/table-cell
     (assoc cell-opts
            :tabIndex 0
            :ref *ref
            :on-click (fn [e]
                        (when-not (some-> (.-target e) (.closest ".jtrigger"))
                          (click-cell (hooks/deref *ref))))
            :on-key-down (fn [e]
                           (let [container (hooks/deref *ref)]
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

(def ^:private table-fixed-row-height 33)

(hsx/defc ^:large-vars/cleanup-todo table-row-inner
  [table row props {:keys [show-add-property? scrolling? disable-virtualized?
                           mount-unpinned-cells?]}]
  (let [*ref (hooks/use-ref nil)
        pinned-columns (get-in table [:state :pinned-columns])
        unpinned (get-in table [:state :unpinned-columns])
        unpinned-columns (visible-unpinned-columns
                          (if (and show-add-property?
                                   (not (false? mount-unpinned-cells?)))
                            (conj (vec unpinned)
                                  {:id :add-property
                                   :cell (fn [_table _row _column])})
                            unpinned)
                          mount-unpinned-cells?)
        sized-columns (get-in table [:state :sized-columns])
        row-cell-f (fn [column cell-option]
                     (let [id (str (:id row) "-" (:id column))
                           width (get-column-size column sized-columns)
                           select? (= (:id column) :select)
                           add-property? (= (:id column) :add-property)
                           style {:width width :min-width width}
                           cell-title (table-cell-plain-value row column)
                           cell-opts (cond-> {:key id
                                              :select? select?
                                              :add-property? add-property?
                                              :style style}
                                       (not (string/blank? cell-title))
                                       (assoc :title cell-title))
                           lazy-column? (:lazy? cell-option)
                           eager-cell? (eager-table-cells?
                                        disable-virtualized?
                                        column
                                        lazy-column?)]
                       (if (and scrolling? (not (:block/title row)))
                         (table-cell-container cell-opts nil)
                         (when-let [render (get column :cell)]
                           (let [cell-render (fn []
                                               (table-cell-container
                                                cell-opts (render table row column style)))]
                             (cond
                               eager-cell?
                               [:div.h-full (cell-render)]

                               ;; Movies first paint spent ~9ms/row on 23
                               ;; IntersectionObservers. Mount them after
                               ;; the name column has painted.
                               (false? mount-unpinned-cells?)
                               (table-cell-container cell-opts nil)

                               :else
                               (lazy-table-cell cell-render
                                                (table-cell-container cell-opts nil))))))))]
    (shui/table-row
     (merge
      props
      {:key (str (:db/id row))
       :tabIndex 0
       :ref *ref
       :data-id (:db/id row)
       :blockid (str (:block/uuid row))
       :on-key-down (fn [e]
                      (let [container (hooks/deref *ref)]
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
       (into
        [:div.sticky-columns.flex.flex-row]
        (map #(row-cell-f % {}) pinned-columns)))
     (when (seq unpinned-columns)
       (into
        [:div.flex.flex-row]
        (map #(row-cell-f % {:lazy? true}) unpinned-columns))))))

(hsx/defc table-row
  [table row props option]
  (let [row' (-> row
                 (update :block/tags (fn [tags]
                                       (keep (fn [tag]
                                               (when (map? tag)
                                                 tag))
                                             tags)))
                 (assoc :block.temp/refs-count (:block.temp/refs-count row)))]
    (table-row-inner table row' props option)))

(hsx/defc table-row-placeholder
  [table idx option]
  (let [pinned-columns (get-in table [:state :pinned-columns])
        unpinned (get-in table [:state :unpinned-columns])
        show-add-property? (:show-add-property? option)
        sized-columns (get-in table [:state :sized-columns])
        unpinned-columns (cond-> (vec unpinned)
                           show-add-property?
                           (conj {:id :add-property}))
        cell (fn [column]
               (let [width (get-column-size column sized-columns)
                     add-property? (= (:id column) :add-property)
                     select? (= (:id column) :select)]
                 [:div.ls-table-cell.flex.relative.h-full
                  {:key (str "placeholder-" idx "-" (:id column))
                   :style {:width width :min-width width}}
                  [:div {:class (str "flex align-middle w-full overflow-x-clip items-center"
                                      (cond
                                        select? " px-0"
                                        add-property? ""
                                        :else " border-r px-2"))}]]))]
    [:div.ls-table-row.ls-block.flex.flex-row.items-center.border-b.transition-colors.bg-gray-01.items-stretch
     {:key (str "placeholder-" idx)
      :aria-hidden true
      :style {:height table-fixed-row-height
              :max-height table-fixed-row-height
              :overflow "hidden"}}
     (when (seq pinned-columns)
       (into [:div.sticky-columns.flex.flex-row]
             (map cell pinned-columns)))
     (when (seq unpinned-columns)
       (into [:div.flex.flex-row]
             (map cell unpinned-columns)))]))

(hsx/defc search
  [input {:keys [on-change set-input!]}]
  (let [[show-input? set-show-input!] (hooks/use-state false)]
    [:div.flex.flex-row.items-center
     (shui/button
      {:variant "ghost"
       :class "text-muted-foreground !px-1"
       :size :sm
       :on-click #(when-not show-input?
                    (set-show-input! true))}
      (ui/icon "search" {:size 15}))
     (when show-input?
       [:<>
        (shui/input
         {:placeholder (t :view.filter/type-to-search)
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
         (ui/icon "x"))])]))

(defn datetime-property?
  [property]
  (or
   (= :datetime (:logseq.property/type property))
   (contains? #{:block/created-at :block/updated-at} (:db/ident property))))

(defn timestamp-options
  []
  [{:value "1 day ago"
    :label (t :view.filter/relative-1-day-ago)}
   {:value "3 days ago"
    :label (t :view.filter/relative-3-days-ago)}
   {:value "1 week ago"
    :label (t :view.filter/relative-1-week-ago)}
   {:value "1 month ago"
    :label (t :view.filter/relative-1-month-ago)}
   {:value "3 months ago"
    :label (t :view.filter/relative-3-months-ago)}
   {:value "1 year ago"
    :label (t :view.filter/relative-1-year-ago)}
   {:value :custom-date
    :label (t :view.filter/custom-date)}])

(hsx/defc ^:large-vars/cleanup-todo filter-property
  [view-entity columns {:keys [data-fns] :as table} opts]
  (let [[property set-property!] (hooks/use-state nil)
        [filter-data set-filter-data!] (hooks/use-state nil)
        timestamp? (datetime-property? property)
        set-filters! (:set-filters! data-fns)
        filters (get-in table [:state :filters])
        columns (remove #(or (false? (:column-list? %))
                             (= :id (:id %))) columns)
        items (map (fn [column]
                     {:label (:name column)
                      :value column}) columns)
        option {:input-default-placeholder (t :view.filter/filter)
                :input-opts {:class "!px-2 !py-1"}
                :items items
                :extract-fn :label
                :extract-chosen-fn :value
                :on-chosen (fn [column]
                             (let [property (column-property column)
                                   internal-property {:db/ident (:id column)
                                                      :block/title (:name column)
                                                      :logseq.property/type (:type column)}]
                               (if (or property
                                       (= :db.cardinality/many (:db/cardinality property))
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
       (if (and view-entity property-ident)
         (p/let [data (db-async/<get-view-filter-data property
                                                      {:view-id (:db/id view-entity)
                                                       :query-entity-ids (:query-entity-ids opts)})]
           (set-filter-data! data))
         (set-filter-data! nil)))
     [property-ident])
    (let [value-source (or (:value-source filter-data)
                           (cond
                             timestamp? :timestamp
                             checkbox? :checkbox
                             property :property-values))
          option (cond
                   (= :timestamp value-source)
                   (merge option
                          {:items (timestamp-options)
                           :input-default-placeholder (if property (db-property/built-in-display-title property t) (t :select/default-prompt))
                           :on-chosen (fn [value _ _ e]
                                        (shui/popup-hide!)
                                        (let [set-filter-fn (fn [value]
                                                              (let [filters' (conj (:filters filters) [(:db/ident property) :after value])]
                                                                (set-filters! {:or? (:or? filters)
                                                                               :filters filters'})))]
                                          (if (= value :custom-date)
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
                   (if (= :checkbox value-source)
                     (let [items [{:value true :label (string/lower-case (t :ui/true))}
                                  {:value false :label (string/lower-case (t :ui/false))}]]
                       (merge option
                              {:items items
                               :input-default-placeholder (if property (db-property/built-in-display-title property t) (t :select/default-prompt))
                               :on-chosen (fn [value]
                                            (let [filters' (conj (:filters filters) [(:db/ident property) :is value])]
                                              (set-filters! {:or? (:or? filters)
                                                              :filters filters'})))}))
                     (let [items (:values filter-data)]
                       (merge option
                              {:items items
                               :input-default-placeholder (if property (db-property/built-in-display-title property t) (t :select/default-prompt))
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
                       (t :view.filter/is-empty)])
         (shui/button {:variant :ghost :size :sm :class "justify-start"
                       :on-click (fn []
                                   (let [filters' (conj (:filters filters) [(:db/ident property) :is-not :empty])]
                                     (set-filters! {:or? (:or? filters)
                                                    :filters filters'})))}
                      [:span.opacity-75.hover:opacity-100.font-normal.text-sm
                       (t :view.filter/is-not-empty)])]
        (select/select option)))))

(hsx/defc filter-properties
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
                                   :focus-trigger? false
                                   :content-props {:onCloseAutoFocus #(.preventDefault %)}}))}
   (ui/icon "filter")))

(defn operator->text
  [operator]
  (case operator
    :is (t :view.filter/operator-is)
    :is-not (t :view.filter/operator-is-not)
    :text-contains (t :view.filter/operator-text-contains)
    :text-not-contains (t :view.filter/operator-text-not-contains)
    :date-before (t :view.filter/operator-date-before)
    :date-after (t :view.filter/operator-date-after)
    :before (t :view.filter/operator-before)
    :after (t :view.filter/operator-after)
    :number-gt ">"
    :number-lt "<"
    :number-gte ">="
    :number-lte "<="
    :between (t :view.filter/operator-between)))

(hsx/defc filter-operator
  [property operator filters set-filters! idx]
  (let [[operators set-operators!] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [data (db-async/<get-view-filter-data property)]
         (set-operators! (:operators data)))
       nil)
     [(:db/ident property) (:logseq.property/type property)])
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
      (for [operator (or operators [])]
        (shui/dropdown-menu-item
         {:on-click (fn []
                      (p/let [data (db-async/<get-view-filter-data property
                                                                    {:operator operator
                                                                     :value (nth (get-in filters [:filters idx]) 2)})
                              value' (:value-after-operator-change data)]
                        (set-filters!
                         (update filters :filters
                                 (fn [col]
                                   (update col idx
                                           (fn [[property _old-operator _value]]
                                             (if value'
                                               [property operator value']
                                               [property operator]))))))))}
         (operator->text operator)))))))

(hsx/defc between
  [_property [start end] filters set-filters! idx]
  (let [set-filter-range! (fn [value]
                            (set-filters!
                             (update filters :filters
                                     (fn [col]
                                       (update col idx
                                               (fn [[property operator _old_value]]
                                                 (if (nil? value)
                                                   [property operator]
                                                   [property operator value])))))))]
    [:<>
     (shui/input
      {:auto-focus true
       :placeholder (t :view.filter/from)
       :value (str start)
       :onChange (fn [e]
                   (let [input-value (util/evalue e)
                         number-value (when-not (string/blank? input-value)
                                        (util/safe-parse-float input-value))
                         value [number-value end]
                         value (if (every? nil? value) nil value)]
                     (set-filter-range! value)))
       :class "w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"})
     (shui/input
      {:value (str end)
       :placeholder (t :view.filter/to)
       :onChange (fn [e]
                   (let [input-value (util/evalue e)
                         number-value (when-not (string/blank? input-value)
                                        (util/safe-parse-float input-value))
                         value [start number-value]
                         value (if (every? nil? value) nil value)]
                     (set-filter-range! value)))
       :class "w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"})]))

(hsx/defc ^:large-vars/cleanup-todo filter-value-select
  [view-entity {:keys [data-fns] :as table} property value operator idx opts]
  (let [filters (get-in table [:state :filters])
        set-filters! (:set-filters! data-fns)]
    (shui/button
       {:class "!px-2 rounded-none border-r min-w-0 max-w-full overflow-hidden"
        :variant "ghost"
        :size :sm
        :on-click (fn [e]
                    (p/let [filter-data (db-async/<get-view-filter-data property
                                                                        {:view-id (:db/id view-entity)
                                                                         :query-entity-ids (:query-entity-ids opts)
                                                                         :operator operator})
                            many? (:many? filter-data)
                            items (case (:value-source filter-data)
                                    :timestamp
                                    (timestamp-options)

                                    :checkbox
                                    [{:value true :label (string/lower-case (t :ui/true))}
                                     {:value false :label (string/lower-case (t :ui/false))}]

                                    (:values filter-data))]
                      (shui/popup-show!
                       (.-target e)
                       (fn []
                         (let [option (cond->
                                       {:input-default-placeholder (db-property/built-in-display-title property t)
                                        :input-opts {:class "!px-3 !py-1"}
                                        :items items
                                        :extract-fn :label
                                        :extract-chosen-fn :value
                                        :on-chosen (fn [value _selected? selected e]
                                                     (when-not many?
                                                       (shui/popup-hide!))
                                                     (let [value' (if many? selected value)
                                                           set-filters-fn (fn [value']
                                                                            (set-filters!
                                                                             (update filters :filters
                                                                                     (fn [col]
                                                                                       (update col idx
                                                                                               (fn [[property operator _value]]
                                                                                                 [property operator value']))))))]
                                                       (if (= value :custom-date)
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
                                                        (set-filters!
                                                         (update filters :filters
                                                                 (fn [col]
                                                                   (update col idx
                                                                           (fn [[property operator _value]]
                                                                             [property operator :empty]))))))}
                                           [:span.opacity-75.hover:opacity-100.font-normal.text-sm
                                            (t :view.filter/empty)])]
                             (select/select option))))
                       {:align :start})))}
       (let [value (cond
                     (instance? js/Date value)
                     (some->> (tc/to-date value)
                              (t/to-default-time-zone)
                              (tf/unparse yyyy-MM-dd-formatter))
                     :else
                     value)]
        [:div.ls-view-filter-value.flex.flex-row.items-center.gap-1.text-xs.min-w-0.max-w-full.overflow-hidden
         (cond
           (map? value)
           [:div.ls-view-filter-value-item (filter-value-content value)]

           (string? value)
           [:div.ls-view-filter-value-item value]

           (boolean? value)
           [:div.ls-view-filter-value-item (str value)]

           (= value :empty)
           [:div.ls-view-filter-value-item (t :view.filter/empty)]

           (seq value)
           (->> (map (fn [v] [:span (filter-value-content v)]) value)
                (interpose [:span.flex-none ", "])
                (into [:div.ls-view-filter-value-item]))
           :else
           (t :view/all))]))))

(hsx/defc filter-value
  [view-entity table property operator value filters set-filters! idx opts]
  (let [number-operator? (string/starts-with? (name operator) "number-")
        set-filter-value! (fn [input-value number-value]
                            (set-filters!
                             (update filters :filters
                                     (fn [col]
                                       (update col idx
                                               (fn [[property operator _value]]
                                                 (if (and number-operator? (nil? number-value))
                                                   [property operator]
                                                   [property operator (or number-value input-value)])))))))]
    (case operator
      :between
      (between property value filters set-filters! idx)

      (:text-contains :text-not-contains :number-gt :number-lt :number-gte :number-lte)
      (shui/input
       {:auto-focus false
        :value (or value "")
        :onChange (fn [e]
                    (let [input-value (util/evalue e)
                          number-value (and number-operator? (when-not (string/blank? input-value)
                                                               (util/safe-parse-float input-value)))]
                      (set-filter-value! input-value number-value)))
        :class "w-24 !h-6 !py-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"})

      (filter-value-select view-entity table property value operator idx opts))))

(hsx/defc filters-row
  [view-entity {:keys [data-fns columns] :as table} opts]
  (let [filters (get-in table [:state :filters])
        {:keys [set-filters!]} data-fns]
    (when (seq (:filters filters))
      [:div.filters-row.flex.flex-row.items-center.gap-4.justify-between.flex-wrap.py-2.min-w-0.max-w-full
       [:div.flex.flex-row.items-center.gap-2.flex-wrap.min-w-0.max-w-full
        (map-indexed
         (fn [idx filter']
           (let [[property-ident operator value] filter'
                 property (if (= property-ident :block/title)
                            {:db/ident property-ident
                             :block/title (t :view.table/name-column)}
                            (or (some (fn [column]
                                        (when (= (:id column) property-ident)
                                          (or (column-property column)
                                              {:db/ident (:id column)
                                               :block/title (:name column)
                                               :logseq.property/type (:type column)})))
                                      columns)
                                (built-in-property property-ident)))]
             [:div.flex.flex-row.items-center.border.rounded.min-w-0.max-w-full
              (shui/button
               {:class "!px-2 rounded-none border-r"
                :variant "ghost"
                :size :sm
                :disabled true}
               [:span.text-xs (db-property/built-in-display-title property t)])
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
             {:placeholder (t :view.filter/match)}))
           (shui/select-content
            (shui/select-group
             (shui/select-item {:value "and"} (t :view.filter/match-all-filters))
             (shui/select-item {:value "or"} (t :view.filter/match-any-filter)))))])])))

(hsx/defc new-record-button
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
     [:div (t :node/new)])))

(hsx/defc add-new-row
  [view-entity table]
  [:div.py-1.px-2.cursor-pointer.flex.flex-row.items-center.gap-1.text-muted-foreground.hover:text-foreground.w-full.text-sm.border-b
   {:on-click (fn [_]
                (let [f (get-in table [:data-fns :add-new-object!])]
                  (f view-entity table)))}
   (ui/icon "plus" {:size 14})
   [:div (t :view/new)]])

(defn- table-filters->persist-state
  [filters]
  (mapv
   (fn [[property operator matches]]
     (let [matches' (cond
                      (map? matches)
                      (:block/uuid matches)

                      (and (coll? matches) (every? map? matches))
                      (set (map :block/uuid matches))

                      :else
                      matches)]
       (if (some? matches')
         [property operator matches']
         [property operator])))
   filters))

(defn- db-set-table-state!
  [entity {:keys [set-sorting! set-filters!]}]
  {:set-sorting!
   (fn [sorting]
     (p/do!
      (property-handler/set-block-property! (:db/id entity) :logseq.property.table/sorting sorting)
      (set-sorting! sorting)))
   :set-filters!
   (fn [filters]
     (let [filters (-> (update filters :filters table-filters->persist-state)
                       (update :or? boolean))]
       (p/do!
        (property-handler/set-block-property! (:db/id entity) :logseq.property.table/filters filters)
        (set-filters! filters))))
   :set-visible-columns!
   (fn [columns]
     (let [hidden-columns (vec (keep (fn [[column visible?]]
                                       (when (false? visible?)
                                         column)) columns))]
       (property-handler/set-block-property! (:db/id entity) :logseq.property.table/hidden-columns hidden-columns)))
   :set-ordered-columns!
   (fn [ordered-columns]
     (let [ids (vec (remove #{:select} ordered-columns))]
       (property-handler/set-block-property! (:db/id entity) :logseq.property.table/ordered-columns ids)))
   :set-sized-columns!
   (fn [sized-columns]
     (property-handler/set-block-property! (:db/id entity) :logseq.property.table/sized-columns sized-columns))})

(defn- lazy-item-placeholder-height
  [table-view?]
  (if table-view? table-fixed-row-height 24))

(def ^:private table-row-overscan-rows 2)

(defn- table-virtualization-metrics
  "Fixed row height so Virtuoso can skip measurement. Overscan is two
  placeholder rows, not a second snapshot window."
  []
  (let [item-height (lazy-item-placeholder-height true)]
    {:item-height item-height
     :overscan-px (* item-height table-row-overscan-rows)}))

(def ^:private view-prefetch-max-rows 1000)

(def ^:private windowed-view-feature-types
  #{:all-pages :class-objects})

(defn- windowed-view-feature?
  [view-feature-type group-by-property-ident]
  (and (contains? windowed-view-feature-types view-feature-type)
       (nil? group-by-property-ident)))

(defn- offset-view-row-count
  "One screen is already painted. Fetch the current screen plus the next
  so rapid scroll does not run off the window mid-fetch."
  [screen-rows]
  (min view-prefetch-max-rows (* 2 (max 0 screen-rows))))

(defn- offset-view-context
  [window-context row-offset]
  (when (and window-context (integer? row-offset) (pos? row-offset))
    (cond-> (assoc window-context :row-offset row-offset)
      (integer? (:initial-row-count window-context))
      (update :initial-row-count offset-view-row-count))))

(defn- offset-view-data-key
  "Remaining-id leftover collected 40938 pages in 84ms, sorted in 269ms,
  and normalized UUIDs in 496ms. Request one scrolled window instead."
  [view-uuid window-context row-offset]
  (when-let [ctx (offset-view-context window-context row-offset)]
    [:view-data view-uuid ctx]))

(defn- table-row-from-offset
  [offset-rows row-offset idx]
  (when (and (integer? idx)
             (integer? row-offset)
             offset-rows
             (>= idx row-offset)
             (< idx (+ row-offset (count offset-rows))))
    (nth offset-rows (- idx row-offset))))

(defn- table-row-at
  ([first-rows offset-rows row-offset idx]
   (table-row-at first-rows offset-rows row-offset nil nil idx))
  ([first-rows offset-rows row-offset stale-rows stale-offset idx]
   (or (when (and (integer? idx) (not (neg? idx)) (< idx (count first-rows)))
         (nth first-rows idx))
       (table-row-from-offset offset-rows row-offset idx)
       (table-row-from-offset stale-rows stale-offset idx))))

(defn- table-row-key
  [first-rows offset-rows row-offset stale-rows stale-offset idx]
  (str "table-row-"
       idx
       "-"
       (or (table-row-at first-rows offset-rows row-offset
                         stale-rows stale-offset idx)
           "placeholder")))

(defn- windowed-view-row
  [rows {:keys [all-row-ids offset-rows row-offset stale-offset-rows stale-row-offset]} idx]
  (if (seq all-row-ids)
    (table-row-at all-row-ids offset-rows row-offset
                  stale-offset-rows stale-row-offset idx)
    (util/nth-safe rows idx)))

(defn- windowed-view-row-key
  [prefix rows option idx]
  (str prefix "-" idx "-" (or (windowed-view-row rows option idx)
                              "placeholder")))

(defn- matching-stale-offset-window
  [stale-window window-context]
  (when (= (:context stale-window) window-context)
    stale-window))

(defn- scroll-list-offset-top
  "Virtuoso's list sits below page chrome. `#main-content-container`
  scrollTop includes that chrome; the first visible row index does not."
  [scroll-parent]
  (if-let [list (some-> scroll-parent (.querySelector "[data-testid=\"virtuoso-item-list\"]"))]
    (max 0 (+ (- (.-top (.getBoundingClientRect list))
                 (.-top (.getBoundingClientRect scroll-parent)))
              (or (.-scrollTop scroll-parent) 0)))
    0))

(defn- scrolled-row-offset
  ([scroll-top item-height]
   (scrolled-row-offset scroll-top 0 item-height))
  ([scroll-top list-offset-top item-height]
   (max 0 (js/Math.floor (/ (max 0 (- scroll-top (max 0 (or list-offset-top 0))))
                            item-height)))))

(defn- measured-viewport-height
  "0 is a real clientHeight before layout. `(or 0 window-height)` would
  keep it and hydrate one row."
  [parent-height window-height]
  (cond
    (and (number? parent-height) (pos? parent-height)) parent-height
    (and (number? window-height) (pos? window-height)) window-height
    :else 0))

(defn- rows-for-height
  [height-px item-height]
  (max 1 (js/Math.ceil (/ (max 0 height-px) item-height))))

(defn- viewport-filled?
  "Virtuoso mounts after the first screen has hydrated rows. An empty
  prefetch is `every?` true and must not count."
  [initial-rows-ready? hydrate-row-uuids]
  (and initial-rows-ready?
       (boolean (seq hydrate-row-uuids))))

(defn- first-window-titles-ready?
  [row-previews]
  (boolean (seq row-previews)))

(defn- table-body-can-paint?
  "First-window view-data already carries titles. Do not hold an empty
  table for the follow-up use-block snapshot."
  [initial-rows-ready? hydrate-row-uuids row-previews]
  (or (first-window-titles-ready? row-previews)
      (viewport-filled? initial-rows-ready? hydrate-row-uuids)))

(defn- first-paint-view-entity
  "Pending views paint titles before use-block. Swapping in db/id
  re-rendered All Pages / Tags / Movies before the first lazy-item."
  [view-entity pending-view first-paint-done?]
  (if (and first-paint-done?
           (= (:block/uuid view-entity) (:block/uuid pending-view)))
    (or view-entity pending-view)
    pending-view))

(defn first-paint-class-properties
  "Movies fetched 17 class properties before view-data. Keep the first
  table frame on name/select/id."
  [fetched first-paint-done?]
  (if first-paint-done?
    (or fetched [])
    []))

(defn- notify-first-table-paint!
  [*notified? on-first-table-paint!]
  (when (and on-first-table-paint! (not (.-current *notified?)))
    (set! (.-current *notified?) true)
    (js/requestAnimationFrame on-first-table-paint!)))

(defn- empty-table-ready-on-mount?
  "Empty tables skip Virtuoso. items-rendered never flips
   mount-unpinned-cells?, so unused property pages hid the property
   column and left .view-actions unmounted."
  [rows]
  (not (seq rows)))

(defn- view-head-ready-on-mount?
  "View tabs and actions mount with the view chrome. Table rows can
  still wait for their first hydrated window."
  [_display-type _view-partition _rows]
  true)

(defn- lazy-item-should-subscribe?
  "Preview rows painted titles first. Immediate use-block remounted
  every visible All Pages / Movies row before that frame committed."
  [preview mount-unpinned-cells?]
  (or (nil? preview)
      (true? mount-unpinned-cells?)))

(defn- table-total-count
  "First-window view-data already has the full count. Use it for the
  scrollbar so remaining ids do not have to replace the painted rows."
  [rows items-count]
  (max (count rows)
       (if (number? items-count) items-count 0)))

(defn- windowed-view-total-count
  [rows {:keys [all-row-ids items-count]}]
  (if (seq all-row-ids)
    (table-total-count all-row-ids items-count)
    (count rows)))

(defn- viewport-row-range
  "On-screen rows from scroll position. Virtuoso's mounted overscan range
  is not a hydrate window."
  ([scroll-top viewport-height item-height total-count]
   (viewport-row-range scroll-top 0 viewport-height item-height total-count))
  ([scroll-top list-offset-top viewport-height item-height total-count]
   (when (and (pos? item-height) (pos? total-count))
     (let [start (scrolled-row-offset scroll-top list-offset-top item-height)
           end (min (dec total-count)
                    (scrolled-row-offset (+ (max 0 scroll-top)
                                            (max 0 viewport-height)
                                            -1)
                                         list-offset-top
                                         item-height))]
       [start (max start end)]))))

(def ^:private offset-prefetch-lead-rows 8)

(defn- offset-window-covers-visible?
  [row-offset window-size visible-start visible-end]
  (and (integer? row-offset)
       (integer? window-size)
       (pos? window-size)
       (integer? visible-start)
       (integer? visible-end)
       (<= row-offset visible-start)
       (>= (+ row-offset (dec window-size)) visible-end)))

(defn- offset-window-near-end?
  [row-offset window-size visible-end]
  (and (integer? row-offset)
       (integer? window-size)
       (integer? visible-end)
       (>= visible-end (- (+ row-offset window-size) offset-prefetch-lead-rows))))

(defn- next-scrolled-row-offset
  "Keep the current offset window until the visible range leaves it.
  Replacing it every row of scroll left 27 empty Movies rows."
  ([current-offset window-size visible-start visible-end first-window-count]
   (next-scrolled-row-offset current-offset window-size visible-start visible-end
                             first-window-count true))
  ([current-offset window-size visible-start visible-end first-window-count offset-ready?]
   (let [first-end (when (and (integer? first-window-count) (pos? first-window-count))
                     (dec first-window-count))]
     (cond
       (not (integer? visible-start))
       current-offset

       (and (integer? current-offset) (not (true? offset-ready?)))
       (if (and (integer? visible-start)
                (integer? window-size)
                (or (< visible-start current-offset)
                    (> visible-start (+ current-offset window-size))))
         visible-start
         current-offset)

       (offset-window-covers-visible?
        current-offset window-size visible-start visible-end)
       (if (offset-window-near-end? current-offset window-size visible-end)
         visible-start
         current-offset)

       (and first-end
            (integer? visible-end)
            (< visible-end (- first-end offset-prefetch-lead-rows)))
       current-offset

       (and first-end (integer? visible-end) (<= visible-start first-end))
       first-window-count

       :else
       visible-start))))

(defn- initial-view-prefetch-count
  "First paint hydrates only the rows that fit on screen."
  [viewport-height item-height]
  (min view-prefetch-max-rows (rows-for-height viewport-height item-height)))

(defn- view-prefetch-row-count
  "Hydrate one screen. Virtuoso overscan keeps placeholders and does not
  belong in the snapshot batch."
  [viewport-height item-height]
  (initial-view-prefetch-count viewport-height item-height))

(defn- view-prefetch-bounds
  [rows-count start-index end-index window-size]
  (cond
    (zero? rows-count)
    nil

    (<= rows-count window-size)
    [0 (dec rows-count)]

    :else
    (let [max-start (- rows-count window-size)
          visible-count (inc (- end-index start-index))]
      (if (<= visible-count window-size)
        (let [start (min max-start (max 0 start-index))]
          [start (+ start (dec window-size))])
        (let [center-index (quot (+ start-index end-index) 2)
              start (min max-start
                         (max 0 (- center-index
                                   (quot window-size 2))))]
          [start (+ start (dec window-size))])))))

(defn- prefetch-bounds-cover-visible?
  [current-bounds visible-start visible-end rows-count window-size]
  (let [[need-start need-end] (view-prefetch-bounds
                               rows-count visible-start visible-end window-size)]
    (and (some? current-bounds)
         (some? need-start)
         (<= (first current-bounds) need-start)
         (>= (second current-bounds) need-end))))

(defn- next-view-prefetch-bounds
  "Keep the current screen-sized window until the visible range approaches an edge."
  [rows-count current-bounds visible-start visible-end window-size]
  (if (prefetch-bounds-cover-visible?
       current-bounds visible-start visible-end rows-count window-size)
    current-bounds
    (view-prefetch-bounds rows-count visible-start visible-end window-size)))

(defn- rendered-item-index
  [^js item]
  (.-index item))

(defn- prefetch-visible-range
  "Accept the on-screen [start end] or Virtuoso's mounted items. A
  two-index vector is the viewport; a mounted list still works for
  gallery cards."
  [rendered]
  (cond
    (and (vector? rendered)
         (= 2 (count rendered))
         (number? (first rendered))
         (number? (second rendered)))
    rendered

    (array? rendered)
    (when (pos? (alength rendered))
      [(rendered-item-index (aget rendered 0))
       (rendered-item-index (aget rendered (dec (alength rendered))))])

    :else
    nil))

(defn- uuid-row-ids
  [rows]
  (when (and (sequential? rows) (every? uuid? rows))
    rows))

(defn- table-body-row-ids
  "Grouped tables pass [group-value row-uuids] as :all-row-ids. Prefetch
  must see the group's UUIDs, not the scalar group value. List views
  keep :grouped-list partitions; painting those as table rows called
  use-block on [breadcrumb-uuid row-uuids] and crashed the page."
  [all-row-ids table-data rows]
  (or (uuid-row-ids all-row-ids)
      (uuid-row-ids table-data)
      (uuid-row-ids rows)
      []))

(defn- prefetch-rows-in-bounds
  "Offset windows can be shorter than the previous first-window bounds.
  Tags crashed when [0 25] was applied to 11 leftover rows."
  [rows bounds]
  (let [rows-vec (vec rows)]
    (cond
      (empty? rows-vec)
      []

      (nil? bounds)
      rows-vec

      :else
      (let [start (max 0 (min (first bounds) (dec (count rows-vec))))
            end (min (count rows-vec) (inc (second bounds)))]
        (if (< start end)
          (subvec rows-vec start end)
          [])))))

(defn- use-view-row-prefetch
  ([rows]
   (use-view-row-prefetch rows
                          (initial-view-prefetch-count
                           (or (.-innerHeight js/window) 0)
                           (lazy-item-placeholder-height false))
                          (view-prefetch-row-count
                           (or (.-innerHeight js/window) 0)
                           (lazy-item-placeholder-height false))))
  ([rows initial-prefetch-count]
   (use-view-row-prefetch rows initial-prefetch-count initial-prefetch-count))
  ([rows initial-prefetch-count window-size]
   (let [[prefetch-bounds set-prefetch-bounds!] (hooks/use-state nil)
         rows-vec (vec rows)
         prefetch-rows (if prefetch-bounds
                         (prefetch-rows-in-bounds rows-vec prefetch-bounds)
                         (subvec rows-vec 0 (min (count rows-vec) initial-prefetch-count)))
         prefetch-ready? (db-hooks/use-block-prefetch prefetch-rows)
         [initial-prefetch-ready? set-initial-prefetch-ready!] (hooks/use-state prefetch-ready?)]
     (hooks/use-effect!
      (fn []
        (when prefetch-ready?
          (set-initial-prefetch-ready! true)))
      [prefetch-ready?])
     [(or initial-prefetch-ready? prefetch-ready?)
      (set prefetch-rows)
      (fn [rendered]
        (when-let [[visible-start visible-end] (prefetch-visible-range rendered)]
          (set-prefetch-bounds!
           (fn [current-bounds]
             (let [next-bounds (next-view-prefetch-bounds
                                (count rows-vec)
                                current-bounds
                                visible-start
                                visible-end
                                window-size)]
               (if (= current-bounds next-bounds)
                 current-bounds
                 next-bounds))))))])))

(hsx/defc lazy-item-placeholder
  [table-view? gallery-view? table idx option]
  (if gallery-view?
    [:div.ls-card-item {:aria-hidden true}]
    (if (and table-view? table)
      (table-row-placeholder table idx option)
      (let [height (lazy-item-placeholder-height table-view?)]
        [:div {:style (cond-> {:min-height height}
                        table-view?
                        (assoc :height height
                               :max-height height
                               :overflow "hidden"))}]))))

(hsx/defc lazy-item-subscribed
  [row-uuid preview item-render table-view? gallery-view? table idx option]
  (let [item (or (db-hooks/use-block row-uuid) preview)]
    (if item
      (item-render item)
      (lazy-item-placeholder table-view? gallery-view? table idx option))))

(hsx/defc lazy-item
  [data idx {:keys [gallery-view? table-view? row-previews mount-unpinned-cells? table] :as option} item-render]
  (let [row-uuid (util/nth-safe data idx)
        preview (get row-previews row-uuid)
        [subscribe? set-subscribe!] (hooks/use-state (nil? preview))]
    (hooks/use-effect!
     (fn []
       (when (and (not subscribe?)
                  (lazy-item-should-subscribe? preview mount-unpinned-cells?))
         (let [frame (js/requestAnimationFrame #(set-subscribe! true))]
           #(js/cancelAnimationFrame frame))))
     [mount-unpinned-cells?])
    (cond
      (and preview (not subscribe?))
      (item-render preview)

      row-uuid
      [lazy-item-subscribed row-uuid preview item-render table-view? gallery-view? table idx option]

      :else
      (lazy-item-placeholder table-view? gallery-view? table idx option))))

(hsx/defc ^:large-vars/cleanup-todo table-body
  [table option rows *scroller-ref set-items-rendered!]
  (let [scroll-parent (get-scroll-parent
                       (-> (:config option)
                           (assoc :viewel (js/document.getElementById (:viewid option)))))
        {:keys [item-height overscan-px]} (table-virtualization-metrics)
        viewport-height (measured-viewport-height
                         (some-> scroll-parent .-clientHeight)
                         (.-innerHeight js/window))
        initial-prefetch-count (initial-view-prefetch-count
                                viewport-height
                                item-height)
        prefetch-window-size (view-prefetch-row-count
                              viewport-height
                              item-height)
        all-row-ids (table-body-row-ids (:all-row-ids option) (:data table) rows)
        offset-rows (:offset-rows option)
        row-offset (:row-offset option)
        stale-rows (:stale-offset-rows option)
        stale-offset (:stale-row-offset option)
        prefetch-source (if (seq offset-rows) offset-rows all-row-ids)
        row-previews (:row-previews option)
        [initial-rows-ready? hydrate-row-uuids prefetch-rows!]
        (use-view-row-prefetch prefetch-source
                               (if (seq row-previews) 0 initial-prefetch-count)
                               prefetch-window-size)
        mount-unpinned-cells? (:mount-unpinned-cells? option)
        set-mount-unpinned-cells! (:set-mount-unpinned-cells! option)
        on-viewport-filled! (:on-viewport-filled! option)
        total-count (table-total-count all-row-ids (:items-count option))
        request-scrolled-offset!
        (fn []
          (let [scroll-top (or (some-> scroll-parent .-scrollTop) 0)
                list-offset (scroll-list-offset-top scroll-parent)
                window-size (max (if (seq offset-rows)
                                   (count offset-rows)
                                   0)
                                 (offset-view-row-count initial-prefetch-count))
                [vis-start vis-end]
                (or (viewport-row-range
                     scroll-top list-offset
                     viewport-height item-height total-count)
                    [])
                next-offset (next-scrolled-row-offset
                             row-offset window-size
                             vis-start vis-end
                             (count all-row-ids)
                             (boolean (seq offset-rows)))]
            (when (and on-viewport-filled!
                       (pos? scroll-top)
                       (integer? next-offset)
                       (pos? next-offset)
                       (not= next-offset row-offset))
              (on-viewport-filled! next-offset))))
        option (assoc option
                      :table-view? true
                      :table table
                      :mount-unpinned-cells? mount-unpinned-cells?)
        can-paint? (table-body-can-paint?
                    initial-rows-ready? hydrate-row-uuids row-previews)
        *first-paint-notified? (hooks/use-ref false)]
    ;; Offset-window rows replace the 40938-id list. Refresh hydrate
    ;; onto those UUIDs when the scrolled window arrives.
    (hooks/use-effect!
     (fn []
       (when (seq offset-rows)
         (prefetch-rows! [0 (dec (count offset-rows))])))
     [(count offset-rows) row-offset])
    (hooks/use-effect!
     (fn []
       (when can-paint?
         (let [frame (js/requestAnimationFrame request-scrolled-offset!)]
           #(js/cancelAnimationFrame frame))))
     [can-paint? row-offset (count offset-rows) total-count viewport-height])
    (cond
      (not (seq rows))
      nil

      ;; Logs: view-data was ready at 44ms, then skeletons waited for the
      ;; 24-block hydrate. First-window titles skip that gate.
      (not can-paint?)
      [:div.flex.flex-col.space-2.gap-2.my-2
       (for [idx (range 3)]
         (shui/skeleton {:key idx :class "h-6 w-full"}))]

      :else
      (virtualized-list
       {:ref #(reset! *scroller-ref %)
        :increase-viewport-by {:top overscan-px :bottom overscan-px}
        :custom-scroll-parent scroll-parent
        :compute-item-key (fn [idx]
                            (table-row-key all-row-ids offset-rows row-offset
                                           stale-rows stale-offset idx))
        :skipAnimationFrameInResizeObserver true
        :fixed-item-height item-height
        :default-item-height item-height
        :total-count total-count
        :item-content (fn [idx]
                        (let [row-uuid (table-row-at all-row-ids offset-rows row-offset
                                                     stale-rows stale-offset idx)
                              live-offset? (some? (table-row-from-offset offset-rows row-offset idx))
                              stale-offset? (and (not live-offset?)
                                                 (some? (table-row-from-offset stale-rows stale-offset idx)))]
                          (if row-uuid
                            (lazy-item (cond
                                         live-offset? offset-rows
                                         stale-offset? stale-rows
                                         :else all-row-ids)
                                       (cond
                                         live-offset? (- idx row-offset)
                                         stale-offset? (- idx stale-offset)
                                         :else idx)
                                       option
                                       (fn [row]
                                         (table-row table row {} option)))
                            (lazy-item-placeholder true false table idx option))))
        :items-rendered (fn [props]
                          (prefetch-rows!
                           (if (seq offset-rows)
                             [0 (dec (count offset-rows))]
                             (or (viewport-row-range
                                  (or (some-> scroll-parent .-scrollTop) 0)
                                  (scroll-list-offset-top scroll-parent)
                                  viewport-height
                                  item-height
                                  total-count)
                                 props)))
                          (when (seq props)
                            (set-items-rendered! true)
                            (notify-first-table-paint!
                             *first-paint-notified?
                             (:on-first-table-paint! option))
                            (when set-mount-unpinned-cells!
                              (js/requestAnimationFrame
                               #(set-mount-unpinned-cells! true)))
                            (request-scrolled-offset!)))}
       (:disable-virtualized? option)))))

(hsx/defc table-view
  [table option _row-selection *scroller-ref]
  (let [empty-rows? (empty-table-ready-on-mount? (:rows table))
        [items-rendered? set-items-rendered!] (hooks/use-state empty-rows?)
        [mount-unpinned-cells? set-mount-unpinned-cells!] (hooks/use-state empty-rows?)
        option (assoc option
                      :mount-unpinned-cells? mount-unpinned-cells?
                      :set-mount-unpinned-cells! set-mount-unpinned-cells!)]
    (shui/table
     (let [rows (:rows table)]
       [:div.ls-table-rows.content.overflow-x-auto.force-visible-scrollbar
        [:div.relative
         (table-header table option)

         (table-body table option rows *scroller-ref set-items-rendered!)

         (when (and (get-in table [:data-fns :add-new-object!]) (or (empty? rows) items-rendered?))
           (shui/table-footer (add-new-row (:view-entity option) table)))]]))))

(hsx/defc list-view
  [{:keys [config ref-matched-children-ids disable-virtualized?
           on-viewport-filled!] :as option} view-entity {:keys [rows]} *scroller-ref]
  (let [view-feature-type (:logseq.property.view/feature-type view-entity)
        references-view? (contains? #{:linked-references :unlinked-references} view-feature-type)
        config (assoc config :container-id (view-container-id config))
        lazy-item-render (fn [row-uuid]
                           (lazy-item [row-uuid] 0 (assoc option :list-view? true)
                                      (fn [block]
                                        (if (first-window-title-preview? block)
                                          (first-window-list-block block)
                                          (let [config' (cond->
                                                        (assoc config
                                                               :list-view? true
                                                               :block-level 1)
                                                         references-view?
                                                         (assoc :ref? true)
                                                         (= :linked-references view-feature-type)
                                                         (assoc :ref-matched-children-ids ref-matched-children-ids
                                                                :reference-view-parent-uuid
                                                                (:view-parent-uuid option)))]
                                            (block-container config' block))))))
        notify-visible-range! (fn [rendered]
                                (when-let [[visible-start visible-end] (prefetch-visible-range rendered)]
                                  (when-let [next-offset (next-scrolled-row-offset
                                                          (:row-offset option)
                                                          (count (:offset-rows option))
                                                          visible-start
                                                          visible-end
                                                          (or (:initial-row-count option)
                                                              (count rows))
                                                          (seq (:offset-rows option)))]
                                    (when on-viewport-filled!
                                      (on-viewport-filled! next-offset)))))
        list-cp (fn [rows]
                  (when (seq rows)
                    (let [total-count (windowed-view-total-count rows option)]
                      (virtualized-list
                       {:ref #(reset! *scroller-ref %)
                        :class "content"
                        :custom-scroll-parent (get-scroll-parent config)
                        :increase-viewport-by {:top 64 :bottom 64}
                        :compute-item-key (fn [idx]
                                            (windowed-view-row-key "list-row" rows option idx))
                        :total-count total-count
                        :skipAnimationFrameInResizeObserver true
                        :items-rendered notify-visible-range!
                        :item-content (fn [idx]
                                        (if-let [row-uuid (windowed-view-row rows option idx)]
                                          (lazy-item-render row-uuid)
                                          (lazy-item-placeholder false false nil nil nil)))}
                       disable-virtualized?))))
        breadcrumb (state/get-component :block/breadcrumb)
        all-uuids? (every? uuid? rows)]
    (if all-uuids?
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
          ^{:key (str "partition-" idx)}
          [:<> (lazy-item-render row)])))))

(defn- gallery-property-value-opts
  [config]
  {:view? true
   :gallery-view? true
   :view-parent (:view-parent config)})

(hsx/defc gallery-property-value
  [block property-ident property config]
  (if (= :block/title property-ident)
    [:div.ls-gallery-card-title
     (some->> (:block/title block)
              string/trim
              string/split-lines
              first)]
    (when property
      [:div.ls-gallery-card-property
       (pv/property-value block property (gallery-property-value-opts config))])))

(defn gallery-card-asset-block
  [block asset-property-ident]
  (let [asset-value (when (and block asset-property-ident (not= :block/uuid asset-property-ident))
                      (get block asset-property-ident))
        ->entity (fn [value]
                   (cond
                     (map? value) value
                     :else value))]
    (cond
      (= :block/uuid asset-property-ident)
      block

      (set? asset-value)
      (some ->entity asset-value)

      (sequential? asset-value)
      (some ->entity asset-value)

      :else
      (->entity asset-value))))

(defn- gallery-cover-url-string
  [value]
  (let [s (cond
            (string? value) value
            (map? value) (db-property/property-value-content value)
            :else nil)]
    (when (string? s)
      (let [url (string/trim s)]
        (when (and (not (string/blank? url))
                   (block-image/remote-image-url? url))
          url)))))

(defn gallery-card-cover-url
  "Return a remote http(s) URL from a URL-type cover property, or nil."
  [block property-ident]
  (let [value (when (and block property-ident (not= :block/uuid property-ident))
                (get block property-ident))]
    (cond
      (set? value)
      (some gallery-cover-url-string value)

      (sequential? value)
      (some gallery-cover-url-string value)

      :else
      (gallery-cover-url-string value))))

(defn- gallery-cover-url-property?
  [columns property-ident]
  (and property-ident
       (not= :block/uuid property-ident)
       (= :url (:logseq.property/type
                (gallery-column-property
                 (some (fn [column]
                         (when (= (gallery-column-ident column) property-ident)
                           column))
                       columns))))))

(hsx/defc gallery-card-item
  [table view-entity block config {:keys [asset-property-ident display-property-idents]}]
  (let [columns (:columns table)
        url-property? (gallery-cover-url-property? columns asset-property-ident)
        url-cover (when url-property?
                    (gallery-card-cover-url block asset-property-ident))
        asset-block (when-not url-property?
                      (gallery-card-asset-block block asset-property-ident))
        asset-cp (state/get-component :block/asset-cp)
        [url-failed? set-url-failed!] (hooks/use-state false)
        _ (hooks/use-effect!
           (fn []
             (set-url-failed! false)
             (fn []))
           [url-cover])
        render-url? (and url-cover (not url-failed?))
        render-asset? (and asset-block (fn? asset-cp))
        render-cover? (or render-url? render-asset?)
        selected? (use-table-row-selected? table block)]
    [:div.ls-card-item.content
     {:key (str "view-card-" (:db/id view-entity) "-" (:db/id block))
      :data-state (when selected? "selected")
      :class (str (when render-cover? "has-gallery-asset")
                  (when selected? " is-selected"))
      :on-click (fn [e]
                  (when-not (some-> (.-target e) (.closest (str "button, a, input, textarea, select, [role='menuitem'], "
                                                                 ".ls-gallery-card-media, .ls-gallery-card-property")))
                    (route-handler/redirect-to-page! (:block/uuid block))))}
     [:div.ls-gallery-card-content
      [:div.ls-gallery-card-media
       (gallery-card-checkbox table block)
       (when render-url?
         [:div.asset-container
          (block-image/image-or-fallback
           {:src url-cover
            :gallery-view? true
            :on-error (fn [_]
                        (set-url-failed! true))})])
       (when render-asset?
         (asset-cp (assoc config :disable-resize? true :gallery-view? true) asset-block))]
      [:div.ls-gallery-card-meta
       (for [property-ident display-property-idents
             :let [property (some (fn [column]
                                    (when (= (:id column) property-ident)
                                      (column-property column)))
                                  columns)
                   property-value (gallery-property-value block property-ident property config)]
             :when property-value]
         ^{:key (str "gallery-property-" (:db/id block) "-" property-ident)}
         [:<> property-value])]]]))

(defn gallery-lazy-item-opts
  [option]
  (select-keys option [:properties]))

(defn view-row-ids
  [{view-partition :partition :keys [rows groups] :as view-data}]
  (case view-partition
    :flat
    rows

    :grouped
    (mapcat :rows groups)

    :grouped-list
    (mapcat (fn [{:keys [partitions]}]
              (mapcat :rows partitions))
            groups)

    (throw (ex-info "Invalid view data partition"
                    {:view-data view-data}))))

(defn grouped-gallery-row-ids
  [view-data]
  (vec (distinct (view-row-ids view-data))))

(defn group-readable-property-value
  [value]
  (cond
    (and (map? value) (or (:block/title value) (:logseq.property/value value)))
    (db-property/property-value-content value)

    (= (:db/ident value) :logseq.property/empty-placeholder)
    (t :ui/empty)

    :else
    (str value)))

(hsx/defc gallery-action-bar
  [table _option view-parent view-feature-type selected-rows]
  (when (seq selected-rows)
    (let [checkbox-id (str (:db/id (:view-entity table)) "-gallery-select-all")
          row-selection (use-table-row-selection table)
          {:keys [selected-all? selected-some?]} (table-selection-summary table row-selection)
          checked? (or selected-all?
                       (and selected-some? "indeterminate"))]
      [:div.ls-gallery-action-bar-slot
       (shui/toolbar
        {:class "ls-gallery-action-bar"}
        (shui/toolbar-group
         {:class "ls-gallery-action-select-all"}
         [:label.flex.h-full.w-full.cursor-pointer.items-center.justify-center
          {:html-for checkbox-id
           :title (t :view.table/select-all)}
          (shui/checkbox
           {:id checkbox-id
            :checked checked?
            :on-checked-change (fn [value]
                                 (table-toggle-selected-all! table value))
            :aria-label (t :view.table/select-all)
            :class "flex"})])
        [:div.selection-count.px-2 (t :view.table/selected-count (count selected-rows))]
        (selection/action-group
         {:on-cut #(on-delete-rows view-parent view-feature-type table selected-rows)
          :selected-blocks selected-rows
          :hide-dots? true
          :button-border? true
          :outliner? false
          :view-parent (:logseq.property/view-for (:view-entity table))}))])))

(hsx/defc gallery-view
  [{:keys [config view-parent view-feature-type on-viewport-filled!] :as option} table view-entity blocks _row-selection *scroller-ref]
  (let [config' (assoc config :container-id (view-container-id config))
        columns (:columns table)
        dimensions (gallery-card-dimensions view-entity)
        asset-property-ident (gallery-asset-property-ident view-entity columns)
        display-property-idents (gallery-display-property-idents view-entity columns asset-property-ident)
        row-selection (use-table-row-selection table)
        selected-rows (table-get-selection-rows row-selection (:rows table))
        [_initial-rows-ready? _hydrate-row-uuids prefetch-rows!] (use-view-row-prefetch blocks)
        total-count (windowed-view-total-count blocks option)
        notify-visible-range! (fn [rendered]
                                (prefetch-rows! rendered)
                                (when-let [[visible-start visible-end] (prefetch-visible-range rendered)]
                                  (when-let [next-offset (next-scrolled-row-offset
                                                          (:row-offset option)
                                                          (count (:offset-rows option))
                                                          visible-start
                                                          visible-end
                                                          (or (:initial-row-count option)
                                                              (count blocks))
                                                          (seq (:offset-rows option)))]
                                    (when on-viewport-filled!
                                      (on-viewport-filled! next-offset)))))
        render-card (fn [idx]
                      (if-let [row-uuid (windowed-view-row blocks option idx)]
                        (lazy-item [row-uuid] 0
                                 (assoc (gallery-lazy-item-opts option)
                                        :gallery-view? true)
                                 (fn [block]
                                   (gallery-card-item table view-entity block config'
                                                      {:asset-property-ident asset-property-ident
                                                       :display-property-idents display-property-idents})))
                        (lazy-item-placeholder false true nil nil nil)))]
    [:div.ls-cards
     {:style {"--ls-gallery-card-width" (str (:width dimensions) "px")
              "--ls-gallery-card-height" (str (:height dimensions) "px")}}
     (when (seq blocks)
       (if (:disable-virtualized? option)
         [:div.virtuoso-grid-list
          (for [idx (range total-count)]
            [:div.virtuoso-grid-item
             {:key (windowed-view-row-key (str (:db/id view-entity) "-card") blocks option idx)}
             (render-card idx)])]
         (ui/virtualized-grid
          {:ref #(reset! *scroller-ref %)
           :total-count total-count
           :increase-viewport-by {:top (* 2 (:height dimensions))
                                  :bottom (* 2 (:height dimensions))}
           :custom-scroll-parent (get-scroll-parent config)
           :skipAnimationFrameInResizeObserver true
           :compute-item-key (fn [idx]
                               (windowed-view-row-key (str (:db/id view-entity) "-card") blocks option idx))
           :items-rendered notify-visible-range!
           :item-content render-card})))
     (when-not (:hide-action-bar? option)
       (gallery-action-bar table option view-parent view-feature-type selected-rows))]))

(defn- gallery-group-content
  [view-entity option row-selection *scroller-ref table-map group-by-page?
   group-by-property value group]
  (let [table' (shui/table-option (assoc table-map :data group))
        title (cond
                (and group-by-page? (nil? value))
                [:div.text-muted-foreground.text-sm
                 (t :view.table/pages)]

                (some? value)
                (group-readable-property-value value)

                :else
                (t :view.table/no-group-value (:block/title group-by-property)))]
    [:div.ls-gallery-group
     [:div.my-2 title]
     (gallery-view (assoc option
                          :disable-virtualized? true
                          :hide-action-bar? true)
                   table'
                   view-entity
                   group
                   row-selection
                   *scroller-ref)]))

(hsx/defc entity-gallery-group
  [view-entity option row-selection *scroller-ref table-map group-by-page?
   group-by-property entity-uuid group]
  (when-let [entity (db-hooks/use-block entity-uuid)]
    (gallery-group-content view-entity option row-selection *scroller-ref
                           table-map group-by-page? group-by-property entity group)))

(hsx/defc gallery-group
  [view-entity option row-selection *scroller-ref groups idx table-map group-by-page? group-by-property]
  (let [[group-value group] (nth groups idx)]
    (case (:kind group-value)
      :entity
      (entity-gallery-group view-entity option row-selection *scroller-ref
                            table-map group-by-page? group-by-property
                            (:uuid group-value) group)

      :scalar
      (gallery-group-content view-entity option row-selection *scroller-ref
                             table-map group-by-page? group-by-property
                             (:value group-value) group)

      :empty
      (gallery-group-content view-entity option row-selection *scroller-ref
                             table-map group-by-page? group-by-property nil group)

      (throw (ex-info "Invalid view group value"
                      {:group-value group-value})))))

(hsx/defc grouped-gallery-view
  [table-map table option view-entity groups row-selection group-by-property group-by-property-ident *scroller-ref]
  (let [gallery-rows (grouped-gallery-row-ids (:view-data option))
        gallery-action-table (shui/table-option
                              (assoc table-map
                                     :data gallery-rows
                                     :full-data (:full-data table)))
        selected-rows (table-get-selection-rows (use-table-row-selection table) (:rows gallery-action-table))
        group-by-page? (= :block/page group-by-property-ident)]
    [:div.flex.flex-col.border-t.pt-2.gap-2
     (virtualized-list
      {:class "group-gallery-view"
       :custom-scroll-parent (util/app-scroll-container-node)
       :increase-viewport-by {:top 300 :bottom 300}
       :compute-item-key (fn [idx]
                           (str "gallery-group-" (:db/id view-entity) "-" idx))
       :skipAnimationFrameInResizeObserver true
       :total-count (count groups)
       :item-content
       (fn [idx]
         (gallery-group view-entity option row-selection *scroller-ref groups idx table-map group-by-page? group-by-property))}
      false)
     (gallery-action-bar gallery-action-table option (:view-parent option) (:view-feature-type option) selected-rows)]))

(defn- run-effects!
  [option {:keys [data]} *scroller-ref gallery?]
  (hooks/use-effect!
   (fn []
     (when (and (:current-page? (:config option))
                (seq data)
                (uuid? (first data)))
       (ui-handler/scroll-to-anchor-block @*scroller-ref data gallery?)
       (state/set-state! :editor/virtualized-scroll-fn
                         #(ui-handler/scroll-to-anchor-block @*scroller-ref data gallery?))))
   []))

(hsx/defc view-sorting-item
  [table sorting id name asc? set-sorting!]
  [:div.flex.flex-row.gap-2.items-center.justify-between.px-2
   [:div.flex.flex-row.gap-1.items-center
    (shui/button
     {:size :sm
      :class "!px-1"
      :variant :ghost
      :title (t :view.table/drag-to-reorder)}
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
       {:placeholder (t :view.table/select-order)}))
     (shui/select-content
      (shui/select-group
       (shui/select-item {:value "asc"} (t :view.table/ascending))
       (shui/select-item {:value "desc"} (t :view.table/descending)))))
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

(hsx/defc view-sorting-config
  [table sorting columns]
  (let [[sorting set-sorting!] (hooks/use-state sorting)]
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
     (shui/button
      {:variant :ghost
       :size :sm
       :class "text-muted-foreground justify-start pl-3"
       :on-click (fn []
                   (let [f (get-in table [:data-fns :set-sorting!])]
                     (set-sorting! nil)
                     (f nil)
                     (shui/popup-hide!)))}
      (ui/icon "trash" {:size 15})
      [:span.ml-1 (t :view.table/delete-sort)])]))

(hsx/defc view-sorting
  [table columns sorting]
  (shui/button
   {:variant "ghost"
    :class "text-muted-foreground !px-1"
    :size :sm
    :on-click (fn [e]
                (shui/popup-show! (.-target e)
                                  (fn [] (view-sorting-config table sorting columns))
                                  {:align :end
                                   :focus-trigger? false
                                   :content-props {:onCloseAutoFocus #(.preventDefault %)}}))}
   (ui/icon "arrows-up-down")))

(hsx/defc view-cp
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
       (gallery-view option table view-entity (:rows table) row-selection *scroller-ref)

       (table-view table option row-selection *scroller-ref))]))

(defn- view-with-display-type
  [view-entity display-type]
  (if (:logseq.property.view/type view-entity)
    view-entity
    (assoc view-entity :logseq.property.view/type (built-in-property display-type))))

(def ^:private default-view-title-key-by-feature-type
  {:linked-references :view/linked-references
   :unlinked-references :view/unlinked-references
   :class-objects :view/all
   :property-objects :view/all
   :all-pages :view/all})

(defn- default-view-title-key
  [view-feature-type]
  (get default-view-title-key-by-feature-type view-feature-type))

(defn- create-view!
  [view-parent view-feature-type {:keys [auto-triggered?]}]
  (p/let [repo (state/get-current-repo)
          page (db-async/<get-block repo common-config/views-page-name {:children? false})]
    (when page
      (p/let [list-view-type (when (contains? #{:linked-references :unlinked-references} view-feature-type)
                               (state/<invoke-db-worker :thread-api/pull repo [:db/id] :logseq.property.view/type.list))
              block-page-property (when (contains? #{:linked-references :unlinked-references} view-feature-type)
                                    (state/<invoke-db-worker :thread-api/pull repo [:db/id] :block/page))
              properties (cond->
                          {:logseq.property/view-for (:db/id view-parent)
                           :logseq.property.view/feature-type view-feature-type}
                           (contains? #{:linked-references :unlinked-references} view-feature-type)
                           (assoc :logseq.property.view/type (:db/id list-view-type)
                                  :logseq.property.view/group-by-property (:db/id block-page-property)))
            view-title (if auto-triggered?
                         (some-> (default-view-title-key view-feature-type) t)
                         "")
            view-block-id (common-uuid/gen-uuid :view-block-uuid (str (:block/uuid view-parent) view-feature-type))
            result (editor-handler/api-insert-new-block! view-title
                                                         (cond->
                                                          {:page (:block/uuid page)
                                                           :properties properties
                                                           :edit-block? false
                                                           :outliner-op :create-view}
                                                           auto-triggered?
                                                           (assoc :custom-uuid view-block-id)))]
        (db-async/<get-block repo (:block/uuid result) {:children? false})))))

(def ^:private default-view-title-candidates
  (reduce-kv
   (fn [acc feature-type title-key]
     (assoc acc feature-type
            (set (keep #(get % title-key) (vals dicts/dicts)))))
   {}
   default-view-title-key-by-feature-type))

(defn display-view-title
  [view]
  (let [title (:block/title view)
        feature-type (:logseq.property.view/feature-type view)
        title-key (get default-view-title-key-by-feature-type feature-type)]
    (cond
      (= title "")
      (t :view/new-view)

      (and title-key
           (contains? (get default-view-title-candidates feature-type) title))
      (t title-key)

      :else
      title)))

(hsx/defc view-tab-button
  [view-parent current-view-uuid view-uuid
   {:keys [view-uuids data items-count set-current-view-uuid!
           show-items-count? config references?]}]
  (let [hydrated-view (db-hooks/use-block view-uuid)
        view (or hydrated-view {:block/uuid view-uuid})
        refs-total-count (:refs-total-count config)
        current-view? (= current-view-uuid view-uuid)]
    (shui/button
     {:key (str "view-tab-" view-uuid)
      :data-view-tab-id (str "view-tab-" view-uuid)
      :variant :text
      :size :sm
      :class (str "text-sm px-0 py-0 h-6 " (when-not current-view? "text-muted-foreground"))
      :on-click (fn [e]
                  (if (and hydrated-view current-view? (not= (:db/id view) (:db/id view-parent)))
                    (shui/popup-show!
                     (.-target e)
                     (fn []
                       [:<>
                        (shui/dropdown-menu-sub
                         (shui/dropdown-menu-sub-trigger
                          (t :view/rename))
                         (shui/dropdown-menu-sub-content
                          (when-let [block-container-cp (state/get-component :block/container)]
                            (block-container-cp {:display-title (display-view-title view)
                                                 :hide-block-control? true} view))))
                        (when (> (count view-uuids) 1)
                          (shui/dropdown-menu-item
                           {:key "Delete"
                            :on-click (fn []
                                        (set-current-view-uuid!
                                         (first (remove #{view-uuid} view-uuids)))
                                        (p/do!
                                         (editor-handler/delete-block-aux! view)
                                         (shui/popup-hide!)))}
                           (t :ui/delete)))])
                     {:as-dropdown? true
                      :dropdown-menu? true
                      :align "start"
                      :focus-trigger? false
                      :content-props {:onClick shui/popup-hide!
                                      :onCloseAutoFocus #(.preventDefault %)}})
                    (set-current-view-uuid! view-uuid)))}
     (when-not references?
       (let [display-type (or (:db/ident (get view :logseq.property.view/type))
                              :logseq.property.view/type.table)]
         (when-let [icon (:logseq.property/icon (built-in-property display-type))]
           (icon-component/icon icon {:color? true
                                      :size 15}))))
     (if hydrated-view
       (display-view-title view)
       [:span.inline-block.w-8])
     (when (and current-view? show-items-count? (> items-count 0) (seq data))
       [:span.text-muted-foreground.text-xs
        items-count
        (when (and refs-total-count
                   (> refs-total-count items-count))
          [:span
           [:span "/"]
           [:span {:title (t :view.table/total-refs-count)} refs-total-count]])]))))

(hsx/defc views-tab
  [view-parent current-view-uuid
   {:keys [view-uuids set-current-view-uuid! view-feature-type opacity] :as opts}]
  (into
   [:div.views]
   (concat
    (map (fn [view-uuid]
           ^{:key (str "view-tab-" view-uuid)}
           (view-tab-button view-parent current-view-uuid view-uuid opts))
         view-uuids)
    [(shui/button
      {:key "add-view"
       :variant :text
       :size :sm
       :title (t :view/add-new-view)
       :class (str "!px-1 -ml-1 text-muted-foreground hover:text-foreground transition-opacity ease-in duration-300 " opacity)
       :on-click (fn []
                   (p/let [view (create-view! view-parent view-feature-type {:auto-triggered? false})]
                     (set-current-view-uuid! (:block/uuid view))))}
      (ui/icon "plus" {:size 15}))])))

(hsx/defc view-head
  [view-parent view-entity table columns input sorting
   set-input! add-new-object!
   {:keys [view-feature-type title-key additional-actions display-type]
    :as option}]
  (let [[hover? set-hover?] (hooks/use-state nil)
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
      (if (= view-feature-type :query-result)
        [:div.font-medium.opacity-50.text-sm
         (t (or title-key :view.table/default-title)
            (count (:rows table)))]
        (views-tab view-parent (:block/uuid view-entity)
                   (assoc option
                          :hover? hover?
                          :opacity opacity
                          :references? references?)))]
     [:div.view-actions.flex.items-center.gap-1.transition-opacity.ease-in.duration-300
      {:class opacity
       :on-mouse-down prevent-view-action-button-focus}

      (when (seq additional-actions)
        [:<> (for [action additional-actions]
               (if (fn? action)
                 (action option)
                 action))])

      (when (seq sorting)
        (view-sorting table columns sorting))

      (filter-properties view-entity columns table option)

      [:div.view-action-search
       (search input {:on-change set-input!
                      :set-input! set-input!})]

      [:div.view-action-type.text-muted-foreground.text-sm
       (pv/property-value (view-with-display-type view-entity display-type)
                          (built-in-property :logseq.property.view/type)
                          {:icon? true
                           :popup-focus-trigger? false
                           :popup-auto-focus-trigger? false})]

      (more-actions view-entity columns table option)

      (when add-new-object! (new-record-button table view-entity))]]))

(defn- group-item-content
  [view-entity table' group group-by-property value option view-opts
   {:keys [list-view? gallery? group-by-page? readable-property-value
           add-new-object! outer-table]}]
  (let [group-table (if (fn? add-new-object!)
                      (assoc-in table' [:data-fns :add-new-object!]
                                (fn [_]
                                  (add-new-object! view-entity outer-table
                                                   {:properties
                                                    {(:db/ident group-by-property)
                                                     (if (map? value)
                                                       (:db/id value)
                                                       value)}})))
                      table')
        title [:div
               {:class (when-not list-view? "my-2")}
               (cond
                 group-by-page?
                 (if value
                   (let [page-cp (state/get-component :block/page-cp)
                         page (if (map? value)
                                (select-keys value [:db/id :block/uuid :block/title :block/name])
                                value)]
                     (if (fn? page-cp)
                       (page-cp {:disable-preview? true} page)
                       (readable-property-value page)))
                   [:div.text-muted-foreground.text-sm
                    (t :view.table/pages)])

                 (some? value)
                 (let [icon (when (map? value)
                              (pu/get-block-property-value value :logseq.property/icon))]
                   [:div.flex.flex-row.gap-1.items-center
                    (when icon (icon-component/icon icon {:color? true}))
                    (readable-property-value value)])

                 :else
                 (t :view.table/no-group-value (:block/title group-by-property)))]
        body-fn (fn []
                  (let [render (view-cp view-entity
                                        (assoc group-table :rows group)
                                        (-> option
                                            (dissoc :all-row-ids :offset-rows :row-offset
                                                    :stale-offset-rows :stale-row-offset)
                                            (assoc :disable-virtualized? true
                                                   :hide-action-bar? gallery?))
                                        view-opts)]
                    (if (and list-view? (not (util/mobile?)))
                      [:div.-ml-2 render]
                      render)))]
    (if (util/mobile?)
      [:div.flex.flex-1.flex-col title (body-fn)]
      (ui/foldable title body-fn {:title-trigger? false}))))

(hsx/defc entity-group-item
  [view-entity table' group group-by-property entity-uuid option view-opts opts]
  (if-let [entity (db-hooks/use-block entity-uuid)]
    (group-item-content view-entity table' group group-by-property entity
                        option view-opts opts)
    [:div {:style {:min-height 1}}]))

(hsx/defc group-item
  [view-entity table' group group-by-property group-value option view-opts opts]
  (case (:kind group-value)
    :entity
    (entity-group-item view-entity table' group group-by-property
                       (:uuid group-value) option view-opts opts)

    :scalar
    (group-item-content view-entity table' group group-by-property
                        (:value group-value) option view-opts opts)

    :empty
    (group-item-content view-entity table' group group-by-property
                        nil option view-opts opts)

    (throw (ex-info "Invalid view group value"
                    {:group-value group-value}))))

(hsx/defc ^:large-vars/cleanup-todo view-inner
  [view-entity {:keys [view-parent data full-data set-data! columns add-new-object! foldable-options input set-input! sorting set-sorting! filters set-filters! display-type group-by-property-ident config on-first-table-paint!] :as option*}
   *scroller-ref]
  (let [view-partition (:partition option*)
        [head-ready? set-head-ready!] (hooks/use-state (view-head-ready-on-mount? display-type view-partition data))
        journals? (:journals? config)
        option (assoc option* :properties
                      (-> (remove #{:id :select} (map :id columns))
                          (conj :block/uuid :block/name)
                          vec)
                      :on-first-table-paint!
                      (fn []
                        (set-head-ready! true)
                        (when on-first-table-paint!
                          (on-first-table-paint!))))
        visible-columns (-> (if-let [hidden-columns (:logseq.property.table/hidden-columns view-entity)]
                              (zipmap hidden-columns (repeat false))
                              ;; This case can happen for imported tables
                              (if (seq (:logseq.property.table/ordered-columns view-entity))
                                (zipmap (set/difference (set (map :id columns))
                                                        (set (:logseq.property.table/ordered-columns view-entity))
                                                        #{:select :block/created-at :block/updated-at})
                                        (repeat false))
                                {}))
                            (assoc :id false))
        ordered-columns (vec (concat [:select] (:logseq.property.table/ordered-columns view-entity)))
        sized-columns (:logseq.property.table/sized-columns view-entity)
        {:keys [set-sorting! set-filters! set-visible-columns! set-ordered-columns! set-sized-columns!]}
        (db-set-table-state! view-entity {:set-sorting! set-sorting!
                                          :set-filters! set-filters!})
        [selection-id] (hooks/use-state #(str (random-uuid)))
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
                              (some (fn [column]
                                      (when (= (:id column) group-by-property-ident)
                                        (column-property column)))
                                    columns))
        row-selection (get-table-row-selection {:state {:selection-id selection-id}})
        table-map {:view-entity view-entity
                   :data data
                   :full-data full-data
                   :full-data-loading? (:full-data-loading? option*)
                   :columns columns
                   :state {:sorting sorting
                           :filters filters
                           :row-selection row-selection
                           :selection-id selection-id
                           :visible-columns visible-columns
                           :sized-columns sized-columns
                           :ordered-columns ordered-columns
                           :pinned-columns pinned
                           :unpinned-columns unpinned
                           :group-by-property group-by-property
                           :last-selected-idx (get-table-last-selected-idx {:state {:selection-id selection-id}})}
                   :data-fns {:set-data! set-data!
                              :set-filters! set-filters!
                              :set-sorting! set-sorting!
                              :set-visible-columns! set-visible-columns!
                              :set-ordered-columns! set-ordered-columns!
                              :set-sized-columns! set-sized-columns!
                              :set-row-selection! #(set-table-row-selection! selection-id %)
                              :add-new-object! add-new-object!
                              :set-last-selected-idx! #(state/set-state! [:view/table-selection selection-id :last-selected-idx] %)}}
        table (let [table (shui/table-option table-map)
                    row-selection (get-table-row-selection table)
                    {:keys [selected-all? selected-some?]} (table-selection-summary table row-selection)]
                (assoc table
                       :selected-all? selected-all?
                       :selected-some? selected-some?
                       :row-selected? (fn [row]
                                        (table-row-selected? (get-table-row-selection table) (table-row-id row)))
                       :row-toggle-selected! (fn [_row-selection row value]
                                               (table-toggle-row-selected! table row value))
                       :toggle-selected-all! (fn [table value]
                                               (table-toggle-selected-all! table value))))
        *view-ref (hooks/use-ref nil)
        gallery? (= display-type :logseq.property.view/type.gallery)
        list-view? (= display-type :logseq.property.view/type.list)
        disable-virtualized? journals?]

    (hooks/use-effect!
     (fn []
       #(state/set-state! [:view/table-selection selection-id] nil))
     [selection-id])

    (hooks/use-effect!
     (fn []
       (when (view-head-ready-on-mount? display-type view-partition data)
         (set-head-ready! true)
         (when on-first-table-paint!
           (on-first-table-paint!)))
       js/undefined)
     [display-type view-partition (empty-table-ready-on-mount? data)])

    (run-effects! option table-map *scroller-ref gallery?)

    [:div.flex.flex-col.gap-2.grid
     {:ref *view-ref}
     (ui/foldable
      (if head-ready?
        (view-head view-parent view-entity table columns input sorting set-input! add-new-object! option)
        [:div.ls-view-head])
      (fn []
        [:div.ls-view-body.flex.flex-col.gap-2.grid.mt-1
         (filters-row view-entity table option)

         (let [view-opts {:*scroller-ref *scroller-ref
                          :display-type display-type
                          :row-selection row-selection
                          :add-new-object! add-new-object!}]
           (if (contains? #{:grouped :grouped-list} (:partition option))
             (when (seq (:rows table))
               (if gallery?
                 (grouped-gallery-view table-map table option view-entity (:rows table) row-selection
                                       group-by-property group-by-property-ident *scroller-ref)
                 [:div.flex.flex-col.border-t.pt-2.gap-2
                  (virtualized-list
                   {:class (when list-view? "group-list-view")
                    :custom-scroll-parent (util/app-scroll-container-node (hooks/deref *view-ref))
                    :increase-viewport-by {:top 300 :bottom 300}
                    :compute-item-key (fn [idx]
                                        (str "table-group" idx))
                    :skipAnimationFrameInResizeObserver true
                    :total-count (count (:rows table))
                    :item-content (fn [idx]
                                    (let [[value group] (nth (:rows table) idx)
                                          table' (shui/table-option (assoc table-map :data group))]
                                      (group-item view-entity table' group group-by-property value option view-opts
                                                  {:list-view? list-view?
                                                   :group-by-page? (= :block/page group-by-property-ident)
                                                   :add-new-object! add-new-object!
                                                   :outer-table table
                                                   :readable-property-value group-readable-property-value})))}
                   disable-virtualized?)]))
             (view-cp view-entity table
                      (assoc option
                             :group-by-property-ident group-by-property-ident
                             :disable-virtualized? disable-virtualized?)
                      view-opts)))])
      (merge {:title-trigger? false} foldable-options))]))

(defn- view-instance-key
  "Pending views have a UUID before db/id. Keying on db/id remounted
  All Pages / Tags / Movies after the first-window titles were ready."
  [view-entity]
  (str "view-" (or (:block/uuid view-entity) (:db/id view-entity))))

(hsx/defc view-container
  "Provides a view for data like query results and tagged objects, multiple
   layouts such as table and list are supported. Args:
   * view-entity: a db Entity
   * option:
     * title-key: dict key defaults to `:view.table/default-title`
     * data: a collections of entities
     * set-data!: `fn` to update `data`
     * columns: view columns including properties and db attributes, which could be built by `build-columns`
     * add-new-object!: `fn` to create a new object (or row)
     * show-add-property?: whether to show `Add property`
     * add-property!: `fn` to add a new property (or column)"
  [view-entity option]
  (let [*scroller-ref (hooks/use-memo #(atom nil) [])]
    ^{:key (view-instance-key view-entity)}
    [view-inner view-entity
     (cond-> option
       (or config/publishing? (:logseq.property.view/group-by-property view-entity))
       (dissoc :add-new-object!))
     *scroller-ref]))

(defn- get-query-columns
  [config view-entity properties]
  (let [advanced-query? (->> (:logseq.property/query view-entity)
                             :logseq.property.node/display-type
                             (= :code))]
    (->> properties
         (ldb/sort-by-order)
         ((fn [cs] (build-columns config cs {:add-tags-column? false
                                             :advanced-query? advanced-query?}))))))

(defn- view-display-type
  [view-entity view-feature-type]
  (let [view-type (:logseq.property.view/type view-entity)]
    (or (:db/ident view-type)
      (when (contains? #{:linked-references :unlinked-references} view-feature-type)
        :logseq.property.view/type.list)
        :logseq.property.view/type.table)))

(def ^:private default-view-sorting
  [{:id :block/updated-at :asc? false}])

(defn- effective-view-sorting
  [view-entity]
  (let [sorting (:logseq.property.table/sorting view-entity)
        empty-placeholder? (or (= sorting :logseq.property/empty-placeholder)
                               (= (:db/ident sorting)
                                  :logseq.property/empty-placeholder))]
    (cond
      (or (nil? sorting)
          empty-placeholder?
          (and (coll? sorting) (empty? sorting)))
      default-view-sorting

      (vector? sorting)
      sorting

      :else
      (throw (ex-info "Invalid view sorting" {:sorting sorting})))))

(defn- view-data->rows
  [{view-partition :partition :keys [rows groups] :as view-data}]
  (case view-partition
    :flat
    rows

    :grouped
    (mapv (juxt :value :rows) groups)

    :grouped-list
    (mapv (fn [{:keys [value partitions]}]
            [value
             (mapv (fn [{:keys [breadcrumb-uuid rows]}]
                     [breadcrumb-uuid rows])
                   partitions)])
          groups)

    (throw (ex-info "Invalid view data partition"
                    {:view-data view-data}))))

(defn- view-resource-context
  [view-feature-type sorting filters input group-by-property-ident
   query-row-uuids initial-row-count]
  (cond-> {:feature-type view-feature-type
           :sorting sorting
           :input input}
    (some? filters)
    (assoc :filters filters)

    group-by-property-ident
    (assoc :group-by-property-ident group-by-property-ident)

    initial-row-count
    (assoc :initial-row-count initial-row-count)

    (= :query-result view-feature-type)
    (assoc :query-row-uuids query-row-uuids)))

(defn- loaded-view-resource-plan
  [view-uuid view-feature-type sorting filters input group-by-property-ident
   query-row-uuids viewport-height]
  (let [initial-row-count
        (when (windowed-view-feature? view-feature-type group-by-property-ident)
          (initial-view-prefetch-count
           viewport-height
           (lazy-item-placeholder-height true)))
        window-context (when initial-row-count
                         (view-resource-context view-feature-type sorting filters
                                                input
                                                group-by-property-ident
                                                query-row-uuids
                                                initial-row-count))
        full-context (view-resource-context view-feature-type sorting filters
                                            input
                                            group-by-property-ident
                                            query-row-uuids
                                            nil)]
    {:initial-row-count initial-row-count
     :window-context window-context
     :full-context full-context
     :resource-key [:view-data view-uuid (or window-context full-context)]
     :full-key (when window-context
                 [:view-data view-uuid full-context])}))

(defn- loaded-view-paint
  [view-data]
  (if (nil? view-data)
    {:ready? false}
    {:ready? true
     :rows (view-data->rows view-data)
     :items-count (:count view-data)
     :partition (:partition view-data)
     :view-data view-data}))

(defn- view-paint-source
  [view-data previous-view-data]
  (or view-data previous-view-data))

(hsx/defc ^:large-vars/cleanup-todo loaded-view-aux
  [view-entity {:keys [config view-feature-type query-row-uuids
                       deactivate-deferred-view!] :as option}]
  (let [[input set-input!] (hooks/use-state "")
        group-by-property (:logseq.property.view/group-by-property view-entity)
        display-type (view-display-type view-entity view-feature-type)
        list-view? (= display-type :logseq.property.view/type.list)
        group-by-property-ident (or (:db/ident group-by-property)
                                    (when (and list-view? (nil? group-by-property))
                                      :block/page))
        sorting (effective-view-sorting view-entity)
        filters (:logseq.property.table/filters view-entity)
        debounced-input (hooks/use-debounced-value input 300)
        viewport-height (measured-viewport-height
                         (some-> (get-scroll-parent config) .-clientHeight)
                         (.-innerHeight js/window))
        plan (loaded-view-resource-plan (:block/uuid view-entity)
                                        view-feature-type
                                        sorting
                                        filters
                                        debounced-input
                                        group-by-property-ident
                                        query-row-uuids
                                        viewport-height)
        window-context (:window-context plan)
        window-context-key (pr-str window-context)
        window-or-full-data (db-hooks/use-resource (:resource-key plan))
        [previous-view-data set-previous-view-data!] (hooks/use-state nil)
        [full-data-active? set-full-data-active!] (hooks/use-state false)
        full-snapshot (db-hooks/use-resource-snapshot (when full-data-active?
                                                        (:full-key plan)))
        [row-offset-state set-row-offset-state!] (hooks/use-state nil)
        [stale-offset-window set-stale-offset-window!] (hooks/use-state nil)
        *view-layout (hooks/use-ref [display-type group-by-property-ident])
        row-offset (when (= (:context row-offset-state) window-context)
                     (:offset row-offset-state))
        set-current-row-offset! (fn [row-offset]
                                  (set-row-offset-state! {:offset row-offset
                                                          :context window-context}))
        matched-stale-offset-window (matching-stale-offset-window stale-offset-window
                                                                  window-context)
        offset-key (offset-view-data-key (:block/uuid view-entity)
                                         window-context
                                         row-offset)
        offset-snapshot (db-hooks/use-resource-snapshot offset-key)
        offset-data (when offset-key
                      (case (:status offset-snapshot)
                        :ready (:value offset-snapshot)
                        :error (throw (:error offset-snapshot))
                        nil))
        full-view-data (when (and full-data-active? (:full-key plan))
                         (case (:status full-snapshot)
                           :ready (:value full-snapshot)
                           :error (throw (:error full-snapshot))
                           nil))
        view-data (view-paint-source window-or-full-data previous-view-data)
        paint (loaded-view-paint view-data)
        all-row-ids (when (:ready? paint)
                      (view-data->rows view-data))
        full-rows (if (:full-key plan)
                    (some-> full-view-data view-data->rows)
                    all-row-ids)
        offset-rows (when offset-data
                      (view-data->rows offset-data))
        row-previews (merge (:row-previews view-data)
                            (:previews matched-stale-offset-window)
                            (:row-previews offset-data))
        query? (= view-feature-type :query-result)
        properties (:properties view-data)
        option (cond-> (assoc option
                              :view-parent (:logseq.property/view-for view-entity))
                 query?
                 (assoc :columns (get-query-columns config view-entity properties))

                 deactivate-deferred-view!
                 (assoc :foldable-options
                        {:default-collapsed? false
                         :on-pointer-down
                         (fn [collapsed?]
                           (when collapsed?
                             (deactivate-deferred-view!)))})

                 (seq row-previews)
                 (assoc :row-previews row-previews))]
    (hooks/use-effect!
     (fn []
       (when window-or-full-data
         (set-previous-view-data! window-or-full-data))
       js/undefined)
     [window-or-full-data])
    (hooks/use-effect!
     (fn []
       (when (and offset-data (integer? row-offset))
         (set-stale-offset-window! {:row-offset row-offset
                                    :rows (view-data->rows offset-data)
                                    :previews (:row-previews offset-data)
                                    :context window-context}))
       nil)
     [row-offset offset-data window-context-key])
    (hooks/use-effect!
     (fn []
       (set-row-offset-state! nil)
       (set-stale-offset-window! nil)
       js/undefined)
     [window-context-key])
    (hooks/use-effect!
     (fn []
       (let [next-layout [display-type group-by-property-ident]]
         (when (not= (.-current *view-layout) next-layout)
           (set! (.-current *view-layout) next-layout)
           (set-previous-view-data! nil)
           (set-row-offset-state! nil)
           (set-stale-offset-window! nil)))
       js/undefined)
     [display-type group-by-property-ident])
    (if-not (:ready? paint)
      [:div.flex.flex-col.space-2.gap-2.my-2
       (for [idx (range 3)]
         (shui/skeleton {:key idx :class "h-6 w-full"}))]
      (let [data (:rows paint)
            notify-windowed-paint! (fn []
                                     (when (:full-key plan)
                                       (set-full-data-active! true))
                                     (when-let [notify! (:on-first-table-paint! option)]
                                       (notify!)))
            ignore! (fn [_])]
        [:div.flex.flex-col.gap-2
         (view-container view-entity (assoc option
                                            :on-viewport-filled! set-current-row-offset!
                                            :on-first-table-paint! notify-windowed-paint!
                                            :initial-row-count (:initial-row-count plan)
                                            :view-data (:view-data paint)
                                            :partition (:partition paint)
                                            :data data
                                            :full-data full-rows
                                            :full-data-loading? (and (:full-key plan)
                                                                     (nil? full-rows))
                                            :all-row-ids (when (= :flat (:partition paint))
                                                           all-row-ids)
                                            :offset-rows offset-rows
                                            :row-offset row-offset
                                            :stale-offset-rows (:rows matched-stale-offset-window)
                                            :stale-row-offset (:row-offset matched-stale-offset-window)
                                            :filters (or filters {})
                                            :sorting sorting
                                            :set-filters! ignore!
                                            :set-sorting! ignore!
                                            :set-data! ignore!
                                            :set-input! set-input!
                                            :input input
                                            :items-count (:items-count paint)
                                            :group-by-property-ident group-by-property-ident
                                            :ref-pages-count (:ref-pages-count view-data)
                                            :ref-matched-children-ids
                                            (:matched-child-uuids view-data)
                                            :display-type display-type))]))))

(hsx/defc deferred-view-placeholder
  [view-entity {:keys [view-uuids set-current-view-uuid! view-feature-type]
                :as option}
   activate!]
  (ui/foldable
   (views-tab (:logseq.property/view-for view-entity)
              (:block/uuid view-entity)
              (assoc option
                     :view-uuids view-uuids
                     :set-current-view-uuid! set-current-view-uuid!
                     :view-feature-type view-feature-type
                     :references? true
                     :data []
                     :items-count 0))
   (fn [] nil)
   {:title-trigger? false
    :default-collapsed? true
    :on-pointer-down (fn [collapsed?]
                       (when-not collapsed?
                         (activate!)))}))

(hsx/defc view-aux
  [view-entity {:keys [defer-resource?] :as option}]
  (let [[active? set-active!] (hooks/use-state (not defer-resource?))]
    (if active?
      (loaded-view-aux view-entity
                       (cond-> option
                         defer-resource?
                         (assoc :deactivate-deferred-view!
                                #(set-active! false))))
      (deferred-view-placeholder view-entity option #(set-active! true)))))

(hsx/defc sub-view
  [view-entity option]
  (view-aux view-entity option))

(hsx/defc selected-view-hydrate
  "use-block in selected-view re-rendered All Pages before the first
  lazy-item. Keep the subscription off the table render path."
  [view-uuid first-paint-done? set-hydrated-entity!]
  (let [entity (db-hooks/use-block view-uuid)]
    (hooks/use-effect!
     (fn []
       (when (and first-paint-done? entity)
         (set-hydrated-entity! entity))
       js/undefined)
     [first-paint-done? entity])
    nil))

(hsx/defc selected-view
  [view-uuids option]
  (let [[requested-view-uuid set-requested-view-uuid!] (hooks/use-state nil)
        [first-paint-done? set-first-paint-done!] (hooks/use-state false)
        [hydrated-entity set-hydrated-entity!] (hooks/use-state nil)
        selected-view-uuid (if (some #{requested-view-uuid} view-uuids)
                             requested-view-uuid
                             (first view-uuids))
        pending-view {:block/uuid selected-view-uuid}
        view-entity (first-paint-view-entity hydrated-entity pending-view first-paint-done?)]
    [:<>
     [selected-view-hydrate selected-view-uuid first-paint-done? set-hydrated-entity!]
     ^{:key (str "view-" selected-view-uuid)}
     [sub-view view-entity
      (assoc option
             :view-uuids view-uuids
             :set-current-view-uuid! set-requested-view-uuid!
             :on-first-table-paint!
             (fn []
               (set-first-paint-done! true)
               (when-let [notify! (:on-first-table-paint! option)]
                 (notify!))))]]))

(hsx/defc missing-view
  [view-parent-uuid view-feature-type]
  (let [view-parent (db-hooks/use-block view-parent-uuid)
        [error set-error!] (hooks/use-state nil)
        *started? (hooks/use-ref false)]
    (hooks/use-effect!
     (fn []
       (when (and view-parent (not (.-current *started?)))
         (set! (.-current *started?) true)
         (-> (create-view! view-parent view-feature-type {:auto-triggered? true})
             (p/then (fn [view]
                       (when-not view
                         (throw (ex-info "Default view creation returned no view"
                                         {:view-parent-uuid view-parent-uuid
                                          :view-feature-type view-feature-type})))))
             (p/catch set-error!)))
       js/undefined)
     [view-parent view-parent-uuid view-feature-type])
    (when error
      (throw error))))

(hsx/defc view
  [{:keys [view-parent-uuid view-feature-type view-uuid] :as option}]
  (let [query-result? (= :query-result view-feature-type)
        view-uuids (when-not query-result?
                     (db-hooks/use-resource
                      [:views view-parent-uuid view-feature-type]))
        selected-view-uuids (if query-result? [view-uuid] view-uuids)]
    (cond
      (seq selected-view-uuids)
      (selected-view selected-view-uuids option)

      (and (not query-result?) (some? view-uuids))
      (missing-view view-parent-uuid view-feature-type))))
