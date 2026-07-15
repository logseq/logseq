(ns frontend.components.views
  "Different views of blocks"
  (:require [cljs-bean.core :as bean]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
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
            [frontend.dicts :as dicts]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.async :as db-async]
            [frontend.db.react :as react]
            [frontend.handler.db-based.export :as db-export-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
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

(hsx/defc header-checkbox
  [{:keys [selected-all? selected-some? toggle-selected-all!] :as table}]
  (let [[show? set-show!] (hooks/use-state false)]
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
  [{:keys [row-selected? row-toggle-selected! data state data-fns]} row _column]
  (let [id (str (:db/id row) "-" "checkbox")
        [show? set-show!] (hooks/use-state false)
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
       :aria-label (t :view.table/select-row)
       :class (str "flex transition-opacity "
                   (if (or show? checked?) "opacity-100" "opacity-0"))})]))

(hsx/defc gallery-card-checkbox
  [{:keys [row-selected? row-toggle-selected! data state data-fns]} row]
  (let [id (str (:db/id row) "-gallery-checkbox")
        checked? (row-selected? row)
        {:keys [last-selected-idx row-selection]} state
        {:keys [set-last-selected-idx! set-row-selection!]} data-fns]
    [:label.ls-gallery-card-select.flex.items-center.justify-center.cursor-pointer
     {:html-for id
      :on-click util/stop-propagation}
     (shui/checkbox
      {:id id
       :checked checked?
       :on-click (fn [e]
                   (when (and (.-shiftKey e) last-selected-idx)
                     (util/stop e)
                     (let [idx (.indexOf data (:db/id row))]
                       (when (not= last-selected-idx idx)
                         (let [new-ids (keep (fn [idx] (util/nth-safe data idx))
                                             (range (min last-selected-idx idx)
                                                    (inc (max last-selected-idx idx))))]
                           (when (seq new-ids)
                             (set-row-selection! (update row-selection :selected-ids set/union (set new-ids)))))))))
       :on-checked-change (fn [v]
                            (p/do!
                             (when v
                               (db-async/<get-block (state/get-current-repo) (:db/id row) {:skip-refresh? true
                                                                                           :children? false}))
                             (let [idx (.indexOf data (:db/id row))]
                               (if v
                                 (set-last-selected-idx! idx)
                                 (when (= idx last-selected-idx)
                                   (set-last-selected-idx! nil))))
                             (row-toggle-selected! row-selection row v)))
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
        property (db/entity (:id column))
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
                                           (when property
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
  (db-view/get-property-value-content (db/get-db) entity))

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

(hsx/defc ^:large-vars/cleanup-todo block-title
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
               (page-cp {:disable-preview? true} page))))})

(defn build-columns
  [config properties & {:keys [with-object-name? with-id? add-tags-column? add-page-column? advanced-query?]
                        :or {with-object-name? true
                             with-id? true
                             add-tags-column? true}}]
  (let [properties' (->>
                     (if (or (some #(= (:db/ident %) :block/tags) properties) (not add-tags-column?))
                       properties
                       (conj properties (db/entity :block/tags)))
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
                 (let [property (if (de/entity? property)
                                  property
                                  (or (merge (db/entity ident) property) property)) ; otherwise, :cell/:header/etc. will be removed
                       get-value (when (de/entity? property)
                                   (fn [row] (db-view/get-property-value-for-search row property)))]
                   {:id ident
                    :name (or (:name property)
                              (db-property/built-in-display-title property t))
                    :header (or (:header property)
                                header-cp)
                    :cell (or (:cell property)
                              (when (de/entity? property)
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
          (when-let [property (db/entity id)]
            (and (contains? groupable-property-types (:logseq.property/type property))
                 (or (not (db-property/many? property))
                     (contains? groupable-many-property-types (:logseq.property/type property)))))))))

(defn- set-view-property!
  [view-entity property-ident value]
  (property-handler/set-block-property! (:db/id view-entity) property-ident value))

(defn- property-ident->id
  [property-ident]
  (:db/id (db/entity property-ident)))

(defn- gallery-asset-columns
  [columns]
  (filter (fn [column]
            (when-let [property (db/entity (:id column))]
              (= :asset (:logseq.property/type property))))
          columns))

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
  [db column]
  (cond
    (de/entity? column) column
    (gallery-column-ident column) (d/entity db (gallery-column-ident column))))

(defn- gallery-asset-property-column?
  [db column]
  (= :asset (:logseq.property/type (gallery-column-property db column))))

(defn- gallery-asset-property-idents
  [db columns]
  (->> columns
       (filter #(gallery-asset-property-column? db %))
       (keep gallery-column-ident)
       vec))

(defn- gallery-asset-property-ident
  [db view columns]
  (let [configured-ident (:db/ident (:logseq.property.view/gallery-asset-property view))
        view-for (:logseq.property/view-for view)
        feature-type (:logseq.property.view/feature-type view)
        asset-tag? (= :logseq.class/Asset (:db/ident view-for))
        tag-view? (and (= :class-objects feature-type)
                       (ldb/class? view-for))
        query-view? (= :query-result feature-type)]
    (cond
      asset-tag?
      :block/uuid

      configured-ident
      configured-ident

      (or tag-view? query-view?)
      (let [asset-idents (gallery-asset-property-idents db columns)]
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
  (set-view-property! view-entity
                      :logseq.property.view/gallery-display-properties
                      (vec (keep property-ident->id property-idents))))

(defn- gallery-display-properties-menu
  [view-entity columns]
  (let [asset-property-ident (gallery-asset-property-ident (db/get-db) view-entity columns)
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
      (let [asset-property-ident (gallery-asset-property-ident (db/get-db) view-entity columns)]
        (shui/dropdown-menu-sub
         (shui/dropdown-menu-sub-trigger
          (t :view.gallery/asset-property))
         (shui/dropdown-menu-sub-content
          (for [column asset-columns]
            (shui/dropdown-menu-checkbox-item
             {:key (str "gallery-asset-" (:id column))
              :checked (= asset-property-ident (:id column))
              :onCheckedChange (fn [checked?]
                                 (when checked?
                                   (set-view-property! view-entity
                                                       :logseq.property.view/gallery-asset-property
                                                       (property-ident->id (:id column)))))
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
                             (let [property-id (:db/id (db/entity (groups-sort-by-name->property-identity option-key)))]
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
  [view-entity columns {:keys [column-visible? rows column-toggle-visibility]} {:keys [group-by-property-ident]}]
  (let [display-type (:db/ident (:logseq.property.view/type view-entity))
        table? (= display-type :logseq.property.view/type.table)
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
     :class "h-8 !pl-4 !px-2 !py-0 hover:text-foreground w-full justify-start"}
    (ui/icon "plus")
    (t :view/new-property))])

(hsx/defc action-bar
  [table selected-rows {:keys [on-delete-rows]}]
  (shui/table-actions
   {}
   [:div (t :view.table/selected-count (count selected-rows))]
   (selection/action-bar
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

(hsx/defc lazy-table-cell
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

(hsx/defc table-cell-container
  [cell-opts body]
  (let [*ref (hooks/use-ref nil)]
    (shui/table-cell
     (assoc cell-opts
            :tabIndex 0
            :ref *ref
            :on-click (fn [e]
                        (when-not (dom/has-class? (.-target e) "jtrigger")
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

(hsx/defc table-row-inner
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
  (let [block (db/sub-block (:db/id row))
        block' (if (contains? #{:self :full} (:block.temp/load-status block)) block row)
        row' (when block'
               (-> block'
                   (update :block/tags (fn [tags]
                                         (keep (fn [tag]
                                                 (when-let [id (:db/id tag)]
                                                   (db/entity id)))
                                               tags)))
                   (assoc :block.temp/refs-count (:block.temp/refs-count row))))]
    (table-row-inner table row' props option)))

(hsx/defc search
  [input {:keys [on-change set-input!]}]
  (let [[show-input? set-show-input!] (hooks/use-state false)]
    (if show-input?
      [:div.flex.flex-row.items-center
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
        [values set-values!] (hooks/use-state nil)
        schema (:schema (db/get-db))
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
                   (if checkbox?
                     (let [items [{:value true :label (string/lower-case (t :ui/true))}
                                  {:value false :label (string/lower-case (t :ui/false))}]]
                       (merge option
                              {:items items
                               :input-default-placeholder (if property (db-property/built-in-display-title property t) (t :select/default-prompt))
                               :on-chosen (fn [value]
                                            (let [filters' (conj (:filters filters) [(:db/ident property) :is value])]
                                              (set-filters! {:or? (:or? filters)
                                                             :filters filters'})))}))
                     (let [items values]
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

(hsx/defc filter-operator
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
                      (set-filters!
                       (update filters :filters
                               (fn [col]
                                 (update col idx
                                         (fn [[property _old-operator value]]
                                           (let [value' (get-filter-with-changed-operator property operator value)]
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
       {:class "!px-2 rounded-none border-r min-w-0 max-w-full overflow-hidden"
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
                                    (timestamp-options)
                                    (= type :checkbox)
                                    [{:value true :label (string/lower-case (t :ui/true))}
                                     {:value false :label (string/lower-case (t :ui/false))}]
                                    :else
                                    values)]
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
        [:div.ls-view-filter-value.flex.flex-row.items-center.gap-1.text-xs.min-w-0.max-w-full.overflow-hidden
         (cond
           (de/entity? value)
           [:div.ls-view-filter-value-item (get-property-value-content value)]

           (string? value)
           [:div.ls-view-filter-value-item value]

           (boolean? value)
           [:div.ls-view-filter-value-item (str value)]

           (= value :empty)
           [:div.ls-view-filter-value-item (t :view.filter/empty)]

           (seq value)
           (->> (map (fn [v] [:span (get-property-value-content v)]) value)
                (interpose [:span.flex-none ", "])
                (into [:div.ls-view-filter-value-item]))
           :else
           (t :view/all))])))))

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
                            (or (db/entity property-ident)
                                (some (fn [column] (when (= (:id column) property-ident)
                                                     {:db/ident (:id column)
                                                      :block/title (:name column)})) columns)))]
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
       (p/do!
        (property-handler/set-block-property! (:db/id entity) :logseq.property.table/hidden-columns hidden-columns)
        (set-visible-columns! columns))))
   :set-ordered-columns!
   (fn [ordered-columns]
     (let [ids (vec (remove #{:select} ordered-columns))]
       (p/do!
        (property-handler/set-block-property! (:db/id entity) :logseq.property.table/ordered-columns ids)
        (set-ordered-columns! ordered-columns))))
   :set-sized-columns!
   (fn [sized-columns]
     (p/do!
      (property-handler/set-block-property! (:db/id entity) :logseq.property.table/sized-columns sized-columns)
      (set-sized-columns! sized-columns)))})

(hsx/defc lazy-item
  [data idx {:keys [properties list-view? gallery-view? scrolling?]} item-render]
  (let [item (util/nth-safe data idx)
        db-id (cond (map? item) (:db/id item)
                    (number? item) item
                    :else nil)
        entity (when db-id
                 (let [e (db/entity db-id)]
                   (when (= :full (:block.temp/load-status e))
                     e)))
        [item set-item!] (hooks/use-state entity)
        list-or-gallery? (or list-view? gallery-view?)
        opts (if list-or-gallery?
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
                 block' (if list-or-gallery? (db/entity db-id) block)]
             (set-item! block')))))
     [db-id scrolling?])
    (let [item' (cond (map? item) item (number? item) {:db/id item})]
      (item-render item'))))

(hsx/defc table-body
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

(hsx/defc table-view
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

(hsx/defc list-view
  [{:keys [config ref-matched-children-ids disable-virtualized?] :as option} view-entity {:keys [rows]} *scroller-ref]
  (let [view-feature-type (:logseq.property.view/feature-type view-entity)
        references-view? (contains? #{:linked-references :unlinked-references} view-feature-type)
        config (assoc config :container-id (view-container-id config))
        lazy-item-render (fn [rows idx]
                           (lazy-item rows idx (assoc option :list-view? true)
                                      (fn [block]
                                        (let [config' (cond->
                                                       (assoc config
                                                              :list-view? true
                                                              :block-level 1)
                                                        references-view?
                                                        (assoc :ref? true)
                                                        (= :linked-references view-feature-type)
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
          ^{:key (str "partition-" idx)}
          [:<> (lazy-item-render rows idx)])))))

(defn- gallery-property-value-opts
  [config]
  {:view? true
   :gallery-view? true
   :view-parent (:view-parent config)})

(hsx/defc gallery-property-value
  [block property-ident config]
  (if (= :block/title property-ident)
    [:div.ls-gallery-card-title
     (some->> (:block/title block)
              string/trim
              string/split-lines
              first)]
    (when-let [property (db/entity property-ident)]
      [:div.ls-gallery-card-property
       (pv/property-value block property (gallery-property-value-opts config))])))

(defn gallery-card-asset-block
  [block asset-property-ident]
  (let [asset-value (when (and block asset-property-ident (not= :block/uuid asset-property-ident))
                      (get block asset-property-ident))
        ->entity (fn [value]
                   (cond
                     (de/entity? value) value
                     (number? value) (db/entity value)
                     (uuid? value) (db/entity [:block/uuid value])
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

(hsx/defc gallery-card-item
  [table view-entity block config {:keys [asset-property-ident display-property-idents]}]
  (let [asset-block (gallery-card-asset-block block asset-property-ident)
        asset-cp (state/get-component :block/asset-cp)
        render-asset? (and asset-block (fn? asset-cp))
        selected? ((:row-selected? table) block)]
    [:div.ls-card-item.content
     {:key (str "view-card-" (:db/id view-entity) "-" (:db/id block))
      :data-state (when selected? "selected")
      :class (str (when render-asset? "has-gallery-asset")
                  (when selected? " is-selected"))
      :on-click (fn [e]
                  (when-not (some-> (.-target e) (.closest (str "button, a, input, textarea, select, [role='menuitem'], "
                                                                 ".ls-gallery-card-media, .ls-gallery-card-property")))
                    (route-handler/redirect-to-page! (:block/uuid block))))}
     [:div.ls-gallery-card-content
      [:div.ls-gallery-card-media
       (gallery-card-checkbox table block)
       (when render-asset?
         (asset-cp (assoc config :disable-resize? true :gallery-view? true) asset-block))]
      [:div.ls-gallery-card-meta
       (for [property-ident display-property-idents
             :let [property-value (gallery-property-value block property-ident config)]
             :when property-value]
         ^{:key (str "gallery-property-" (:db/id block) "-" property-ident)}
         [:<> property-value])]]]))

(defn gallery-lazy-item-opts
  [option]
  (select-keys option [:properties]))

(defn view-row-ids
  [rows]
  (mapcat
   (fn [row]
     (cond
       (number? row)
       [row]

       (map? row)
       (when-let [id (:db/id row)]
         [id])

       (and (vector? row) (= 2 (count row)))
       (view-row-ids (second row))

       :else
       []))
   rows))

(defn grouped-gallery-row-ids
  [groups]
  (vec (distinct (view-row-ids groups))))

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
  [table option view-parent view-feature-type selected-rows]
  (when (seq selected-rows)
    (let [checkbox-id (str (:db/id (:view-entity table)) "-gallery-select-all")
          checked? (or (:selected-all? table)
                       (and (:selected-some? table) "indeterminate"))]
      [:div.ls-gallery-action-bar-slot
       [:div.ls-gallery-action-bar
        [:label.ls-gallery-action-select-all
         {:html-for checkbox-id
          :title (t :view.table/select-all)}
         (shui/checkbox
          {:id checkbox-id
           :checked checked?
           :on-checked-change (fn [value]
                                (p/do
                                  (when value
                                    (db-async/<get-blocks (state/get-current-repo) (:rows table) {}))
                                  ((:toggle-selected-all! table) table value)))
           :aria-label (t :view.table/select-all)
           :class "flex"})]
        (action-bar table selected-rows
                    (assoc option
                           :on-delete-rows (fn [table selected-ids]
                                             (on-delete-rows view-parent view-feature-type table selected-ids))))]])))

(hsx/defc gallery-view
  [{:keys [config view-parent view-feature-type] :as option} table view-entity blocks row-selection *scroller-ref]
  (let [config' (assoc config :container-id (view-container-id config))
        columns (:columns table)
        dimensions (gallery-card-dimensions view-entity)
        asset-property-ident (gallery-asset-property-ident (db/get-db) view-entity columns)
        display-property-idents (gallery-display-property-idents view-entity columns asset-property-ident)
        selected-rows (shui/table-get-selection-rows row-selection (:rows table))
        render-card (fn [idx]
                      (lazy-item blocks idx
                                 (assoc (gallery-lazy-item-opts option)
                                        :gallery-view? true)
                                 (fn [block]
                                   (gallery-card-item table view-entity block config'
                                                      {:asset-property-ident asset-property-ident
                                                       :display-property-idents display-property-idents}))))]
    [:div.ls-cards
     {:style {"--ls-gallery-card-width" (str (:width dimensions) "px")
              "--ls-gallery-card-height" (str (:height dimensions) "px")}}
     (when (seq blocks)
       (if (:disable-virtualized? option)
         [:div.virtuoso-grid-list
          (for [idx (range (count blocks))]
            [:div.virtuoso-grid-item
             {:key (str (:db/id view-entity) "-card-" (util/nth-safe blocks idx))}
             (render-card idx)])]
         (ui/virtualized-grid
          {:ref #(reset! *scroller-ref %)
           :total-count (count blocks)
           :custom-scroll-parent (get-scroll-parent config)
           :skipAnimationFrameInResizeObserver true
           :compute-item-key (fn [idx]
                               (str (:db/id view-entity) "-card-" (util/nth-safe blocks idx)))
           :item-content render-card})))
     (when-not (:hide-action-bar? option)
       (gallery-action-bar table option view-parent view-feature-type selected-rows))]))

(hsx/defc gallery-group
  [view-entity option row-selection *scroller-ref groups idx table-map group-by-page? group-by-property]
  (let [[value group] (nth groups idx)
        table' (shui/table-option (assoc table-map :data group))
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

(hsx/defc grouped-gallery-view
  [table-map table option view-entity groups row-selection group-by-property group-by-property-ident *scroller-ref]
  (let [gallery-rows (grouped-gallery-row-ids groups)
        gallery-action-table (shui/table-option
                              (assoc table-map
                                     :data gallery-rows
                                     :full-data (:full-data table)))
        selected-rows (shui/table-get-selection-rows row-selection (:rows gallery-action-table))
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
  [option {:keys [data]} *scroller-ref gallery? set-ready?]
  (hooks/use-effect!
   (fn []
     (when (and (:current-page? (:config option)) (seq data) (map? (first data)) (:block/uuid (first data)))
       (ui-handler/scroll-to-anchor-block @*scroller-ref data gallery?)
       (state/set-state! :editor/virtualized-scroll-fn #(ui-handler/scroll-to-anchor-block @*scroller-ref data gallery?)))
     (util/schedule #(set-ready? true)))
   []))

(hsx/defc view-sorting-item
  [table sorting id name asc? set-sorting!]
  [:div.flex.flex-row.gap-2.items-center.justify-between.px-2
   [:div:div.flex.flex-row.gap-1.items-center
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
     (shui/dropdown-menu-item
      {:class "text-muted-foreground pl-3"
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
                                   :dropdown-menu? true
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
                           (t :view/linked-references)
                           :unlinked-references
                           (t :view/unlinked-references)
                           :class-objects
                           (t :view/all)
                           :property-objects
                           (t :view/all)
                           :all-pages
                           (t :view/all)
                           ""))
            view-block-id (common-uuid/gen-uuid :view-block-uuid (str (:block/uuid view-parent) view-feature-type))
            result (editor-handler/api-insert-new-block! view-title
                                                         (cond->
                                                          {:page (:block/uuid page)
                                                           :properties properties
                                                           :edit-block? false
                                                           :outliner-op :create-view}
                                                           auto-triggered?
                                                           (assoc :custom-uuid view-block-id)))]
      (db/entity [:block/uuid (:block/uuid result)]))))

(def ^:private default-view-title-key-by-feature-type
  {:linked-references :view/linked-references
   :unlinked-references :view/unlinked-references
   :class-objects :view/all
   :property-objects :view/all
   :all-pages :view/all})

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
  [view-parent current-view view* {:keys [views data items-count set-view-entity! set-data! set-views! show-items-count? config references?]}]
  (let [refs-total-count (:refs-total-count config)
        view (db/sub-block (:db/id view*))
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
                          (t :view/rename))
                         (shui/dropdown-menu-sub-content
                          (when-let [block-container-cp (state/get-component :block/container)]
                            (block-container-cp {:display-title (display-view-title view)
                                                 :hide-block-control? true} view))))
                        (when (> (count views) 1)
                          (shui/dropdown-menu-item
                           {:key "Delete"
                            :on-click (fn []
                                        (p/do!
                                         (editor-handler/delete-block-aux! view)
                                         (let [views' (remove (fn [v] (= (:db/id v) (:db/id view))) views)]
                                           (set-views! views')
                                           (set-view-entity! (first views'))
                                           (shui/popup-hide!))))}
                           (t :ui/delete)))])
                     {:as-dropdown? true
                      :dropdown-menu? true
                      :align "start"
                      :focus-trigger? false
                      :content-props {:onClick shui/popup-hide!
                                      :onCloseAutoFocus #(.preventDefault %)}})
                    (do
                      (set-view-entity! view)
                      (set-data! nil))))}
     (when-not references?
       (let [display-type (or (:db/ident (get view :logseq.property.view/type))
                              :logseq.property.view/type.table)]
         (when-let [icon (:logseq.property/icon (db/entity display-type))]
           (icon-component/icon icon {:color? true
                                      :size 15}))))
     (display-view-title view)
     (when (and current-view? show-items-count? (> items-count 0) (seq data))
       [:span.text-muted-foreground.text-xs
        items-count
        (when (and refs-total-count
                   (> refs-total-count items-count))
          [:span
           [:span "/"]
           [:span {:title (t :view.table/total-refs-count)} refs-total-count]])]))))

(hsx/defc views-tab
  [view-parent current-view {:keys [views set-views! view-feature-type opacity] :as opts}]
  [:div.views
   (for [view* views]
     ^{:key (:db/id view*)}
     (view-tab-button view-parent current-view view* opts))

     (shui/button
       {:variant :text
       :size :sm
        :title (t :view/add-new-view)
        :class (str "!px-1 -ml-1 text-muted-foreground hover:text-foreground transition-opacity ease-in duration-300 " opacity)
        :on-click (fn []
                    (p/let [view (create-view! view-parent view-feature-type {:auto-triggered? false})]
                      (set-views! (concat views [view]))))}
       (ui/icon "plus" {:size 15}))])

(hsx/defc view-head
  [view-parent view-entity table columns input sorting
   set-input! add-new-object!
   {:keys [view-feature-type title-key additional-actions]
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
        (views-tab view-parent view-entity (assoc option
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
       (pv/property-value view-entity (db/entity :logseq.property.view/type) {:icon? true
                                                                              :popup-focus-trigger? false
                                                                              :popup-auto-focus-trigger? false})]

      (more-actions view-entity columns table option)

      (when add-new-object! (new-record-button table view-entity))]]))

(hsx/defc group-item
  [view-entity table' group group-by-property value option view-opts {:keys [list-view? gallery? group-by-page? readable-property-value]}]
  (let [title [:div
               {:class (when-not list-view? "my-2")}
               (cond
                         group-by-page?
                         (if value
                           (let [c (state/get-component :block/page-cp)
                                 page (if (de/entity? value)
                                        (select-keys value [:db/id :block/uuid :block/title :block/name])
                                        value)]
                             (if (fn? c)
                               (c {:disable-preview? true} page)
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
                                        (assoc table' :rows group)
                                        (assoc option
                                                                      ;; disabled virtualization for nested view
                                               :disable-virtualized? true
                                               :hide-action-bar? gallery?)
                                        view-opts)]
                    (if (and list-view? (not (util/mobile?)))
                      [:div.-ml-2 render]
                      render)))]
    (if (util/mobile?)
      [:div.flex.flex-1.flex-col  title (body-fn)]
      (ui/foldable title body-fn {:title-trigger? false}))))

(hsx/defc ^:large-vars/cleanup-todo view-inner
  [view-entity {:keys [view-parent data full-data set-data! columns add-new-object! foldable-options input set-input! sorting set-sorting! filters set-filters! display-type group-by-property-ident config] :as option*}
   *scroller-ref]
  (let [journals? (:journals? config)
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
        [visible-columns set-visible-columns!] (hooks/use-state default-visible-columns)
        ordered-columns (vec (concat [:select] (:logseq.property.table/ordered-columns view-entity)))
        sized-columns (:logseq.property.table/sized-columns view-entity)
        [ordered-columns set-ordered-columns!] (hooks/use-state ordered-columns)
        [sized-columns set-sized-columns!] (hooks/use-state sized-columns)
        {:keys [set-sorting! set-filters! set-visible-columns! set-ordered-columns! set-sized-columns!]}
        (db-set-table-state! view-entity {:set-sorting! set-sorting!
                                          :set-filters! set-filters!
                                          :set-visible-columns! set-visible-columns!
                                          :set-sized-columns! set-sized-columns!
                                          :set-ordered-columns! set-ordered-columns!})
        [row-selection set-row-selection!] (hooks/use-state {})
        [last-selected-idx set-last-selected-idx!] (hooks/use-state nil)
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
        *view-ref (hooks/use-ref nil)
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
                                          add-new-object! (when (fn? add-new-object!)
                                                            (fn [_]
                                                              (add-new-object! view-entity table
                                                                               {:properties {(:db/ident group-by-property) (or (and (map? value) (:db/id value)) value)}})))
                                          table' (shui/table-option (-> table-map
                                                                        (assoc-in [:data-fns :add-new-object!] add-new-object!)
                                                                        (assoc :data group)))]
                                      (group-item view-entity table' group group-by-property value option view-opts
                                                  {:list-view? list-view?
                                                   :group-by-page? (= :block/page group-by-property-ident)
                                                   :readable-property-value group-readable-property-value})))}
                   disable-virtualized?)]))
             (view-cp view-entity table
                      (assoc option
                             :group-by-property-ident group-by-property-ident
                             :disable-virtualized? disable-virtualized?)
                      view-opts)))])
      (merge {:title-trigger? false} foldable-options))]))

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
    ^{:key (str "view-" (:db/id view-entity))}
    [view-inner view-entity
     (cond-> option
       (or config/publishing? (:logseq.property.view/group-by-property view-entity))
       (dissoc :add-new-object!))
     *scroller-ref]))

(defn <load-view-data
  [view opts]
  (state/<invoke-db-worker :thread-api/get-view-data (state/get-current-repo) (:db/id view) opts))

(defn- get-query-columns
  [config view-entity properties]
  (let [advanced-query? (->> (:logseq.property/query view-entity)
                             :logseq.property.node/display-type
                             (= :code))]
    (->> properties
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

(hsx/defc view-aux
  [view-entity {:keys [config view-parent view-feature-type data query-entity-ids query set-view-entity!] :as option}]
  (let [[input set-input!] (hooks/use-state "")
        [properties set-properties!] (hooks/use-state nil)
        group-by-property (:logseq.property.view/group-by-property view-entity)
        display-type (or (:db/ident (get view-entity :logseq.property.view/type))
                         (when (= (:view-type option) :linked-references)
                           :logseq.property.view/type.list)
                         :logseq.property.view/type.table)
        list-view? (= display-type :logseq.property.view/type.list)
        group-by-property-ident (or (:db/ident group-by-property)
                                    (when (and list-view? (nil? group-by-property))
                                      :block/page))
        sorting* (:logseq.property.table/sorting view-entity)
        sorting (if (or (= sorting* :logseq.property/empty-placeholder) (empty? sorting*))
                  [{:id :block/updated-at, :asc? false}]
                  sorting*)
        [sorting set-sorting!] (hooks/use-state sorting)
        view-filters (:logseq.property.table/filters view-entity)
        [filters set-filters!] (hooks/use-state (or view-filters {}))
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
       (for [idx (range 3)]
         (shui/skeleton {:key idx :class "h-6 w-full"}))]
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
  (let [repo (state/get-current-repo)
        k (case view-feature-type
            :class-objects :frontend.worker.react/objects
            :property-objects :frontend.worker.react/objects
            :linked-references :frontend.worker.react/refs
            nil)
        *version (hooks/use-memo #(atom 0) [repo k (:db/id view-parent)])
        query-ref (when (and repo view-parent k)
                    (react/q repo [k (:db/id view-parent)]
                             {:query-fn (fn [_] (swap! *version inc))}
                             nil))]
    (db-hooks/use-query query-ref)))

(hsx/defc sub-view
  [view-entity option]
  (let [view (or (db/sub-block (:db/id view-entity)) view-entity)
        data-changes-version (sub-view-data-changes (:view-parent option) (:view-feature-type option))]
    (view-aux view (assoc option :data-changes-version data-changes-version))))

(hsx/defc view
  [{:keys [view-parent view-feature-type] view-entity* :view-entity :as option}]
  (let [[views set-views!] (hooks/use-state nil)
        [view-entity set-view-entity!] (hooks/use-state view-entity*)
        query? (= view-feature-type :query-result)]
    (hooks/use-effect!
     #(c.m/run-task*
       (m/sp
         (when-not query?
           (let [repo (state/get-current-repo)]
             (set-views! nil)
             (set-view-entity! view-entity*)
             (when-not view-entity*
               (c.m/<? (db-async/<get-views repo (:db/id view-parent) view-feature-type))
               (let [views (get-views view-parent view-feature-type)]
                 (if-let [v (first views)]
                   (do
                     (set-views! views)
                     (when-not view-entity* (set-view-entity! v)))
                   (when (and view-parent view-feature-type (not view-entity*))
                     (let [new-view (c.m/<? (create-view! view-parent view-feature-type {:auto-triggered? true}))]
                       (set-views! (concat views [new-view]))
                       (set-view-entity! new-view))))))))))
     [(:db/id view-parent) view-feature-type (:db/id view-entity*) query?])
    (when view-entity
      (let [option' (assoc option
                           :view-feature-type (or view-feature-type
                                                  (:logseq.property.view/feature-type view-entity))
                           :views views
                           :set-views! set-views!
                           :set-view-entity! set-view-entity!)]
        ^{:key (str "view-" (:db/id view-entity))}
        [sub-view view-entity option']))))
