(ns frontend.components.table.columns
  "Column construction helpers for Logseq table views."
  (:require [datascript.impl.entity :as de]
            [frontend.components.property.value :as pv]
            [frontend.components.table.property-cell :as table-property-cell]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.property :as db-property]
            [logseq.shui.table.core :as shui-table]))

(def hidden-property-idents
  "Property columns hidden from regular table column construction."
  #{:logseq.property/built-in? :logseq.property.asset/checksum :logseq.property.class/properties
    :block/created-at :block/updated-at :block/order :block/collapsed?
    :logseq.property/created-from-property})

(defn- column-behavior->table-column
  "Converts an internal column behavior map to the shui table column map."
  [column]
  (cond-> (dissoc column :kind :property :render-header :render-cell)
    (:render-header column)
    (assoc :header (:render-header column))

    (:render-cell column)
    (assoc :cell (:render-cell column))))

(defn- select-column-behavior
  [{:keys [header-checkbox row-checkbox]}]
  {:id :select
   :kind :select
   :name (t :view.table/select-column)
   :render-header (fn [table column] (header-checkbox table column))
   :render-cell (fn [table row column]
                  (row-checkbox table row column))
   :editable? false
   :column-list? false
   :resizable? false})

(defn- id-column-behavior
  [{:keys [header-index]}]
  {:id :id
   :kind :index
   :name "#"
   :render-header (fn [_table _column] (header-index))
   :render-cell (fn [table row _column]
                  (let [row-id (:db/id row)
                        row-idx (first
                                 (keep-indexed
                                  (fn [idx item]
                                    (when (= row-id (shui-table/table-row-id item))
                                      idx))
                                  (:rows table)))]
                    (some-> row-idx inc)))
   :editable? false
   :resizable? false})

(defn- title-column-behavior
  [config {:keys [header-cp block-title]}]
  {:id :block/title
   :kind :title
   :name (t :view.table/name-column)
   :type :string
   :render-header header-cp
   :render-cell (fn [_table row _column style]
                  (block-title row {:property-ident :block/title
                                    :sidebar? (:sidebar? config)
                                    :width (:width style)}))
   :editable? true
   :disable-hide? true})

(defn- property-column-hidden?
  [with-object-name? property ident]
  (or (contains? hidden-property-idents ident)
      (and with-object-name? (= :block/title ident))
      (contains? #{:map :entity} (:logseq.property/type property))))

(defn- normalize-column-property
  [property ident]
  (if (de/entity? property)
    property
    (or (merge (db/entity ident) property) property)))

(defn- property-column-behavior
  [config context {:keys [header-cp block-title]} property]
  (when-let [ident (or (:db/ident property) (:id property))]
    (let [property (normalize-column-property property ident)
          editable? (and (de/entity? property)
                         (table-property-cell/editable? context property))
          get-value (when (de/entity? property)
                      (fn [row] (db-view/get-property-value-for-search row property)))]
      {:id ident
       :kind :property
       :property property
       :name (or (:name property)
                 (db-property/built-in-display-title property t))
       :render-header (or (:header property)
                          header-cp)
       :render-cell (or (:cell property)
                        (when (de/entity? property)
                          (fn [_table row _column style]
                            (let [opts (cond->
                                         {:view? true
                                          :table-view? true
                                          :closed-value-display (when (or (= :block/tags (:db/ident property))
                                                                          (seq (:property/closed-values property)))
                                                                  :chip)
                                          :table-text-property-render
                                          (fn [block opts]
                                            (block-title block (assoc opts
                                                                      :row row
                                                                      :property property
                                                                      :width (:width style)
                                                                      :sidebar? (:sidebar? config))))}
                                         (not editable?)
                                         (assoc :readonly? true))]
                              (pv/property-value row property opts)))))
       :editable? editable?
       :get-value get-value
       :type (or (:type property)
                 (:logseq.property/type property))})))

(defn- timestamp-column-behavior
  [id name {:keys [header-cp timestamp-cell]}]
  {:id id
   :kind :system
   :name name
   :type :datetime
   :render-header header-cp
   :render-cell timestamp-cell
   :editable? false})

(defn build-columns
  "Builds table columns from view `properties` and renderer callbacks.

  `renderers` supplies UI callbacks owned by the caller, keeping this namespace
  focused on column shape and policy.

  Renderer keys:

  | key                | description
  |--------------------|-------------
  | `:header-checkbox` | Header checkbox renderer for row selection.
  | `:row-checkbox`    | Row checkbox renderer for row selection.
  | `:header-index`    | Header renderer for the `#` index column.
  | `:header-cp`       | Default property header renderer.
  | `:block-title`     | Title/value renderer used by title and text property cells.
  | `:timestamp-cell`  | Cell renderer for readonly timestamp system columns.

  Options:

  | key                         | description
  |-----------------------------|-------------
  | `:with-object-name?`        | Include the object title column.
  | `:with-id?`                 | Include the `#` index column.
  | `:add-tags-column?`         | Add `:block/tags` when it is not already present.
  | `:advanced-query?`          | Only include requested timestamp columns for advanced query tables.
  | `:readonly-property-idents` | Property idents that should render as readonly columns.
  | `:class-ident`              | Class ident used by column editability policy."
  [config properties renderers & {:keys [with-object-name? with-id? add-tags-column? advanced-query?
                                         readonly-property-idents class-ident]
                                  :or {with-object-name? true
                                       with-id? true
                                       add-tags-column? true
                                       readonly-property-idents #{}}}]
  (let [properties' (->>
                     (if (or (some #(= (:db/ident %) :block/tags) properties) (not add-tags-column?))
                       properties
                       (conj properties (db/entity :block/tags)))
                     (remove (fn [property]
                               (or (nil? property)
                                   (contains? #{:logseq.property/hide?} (:db/ident property))))))
        property-keys (set (map :db/ident properties'))
        context {:class-ident class-ident
                 :publishing? config/publishing?
                 :readonly-property-idents readonly-property-idents}]
    (->> (concat
          [(select-column-behavior renderers)
           (when with-id?
             (id-column-behavior renderers))
           (when with-object-name?
             (title-column-behavior config renderers))]
          (keep
           (fn [property]
             (when-let [ident (or (:db/ident property) (:id property))]
               (when-not (property-column-hidden? with-object-name? property ident)
                 (property-column-behavior config context renderers property))))
           properties')
          [(when (or (not advanced-query?)
                     (and advanced-query? (property-keys :block/created-at)))
             (timestamp-column-behavior :block/created-at (t :page/created-at) renderers))
           (when (or (not advanced-query?)
                     (and advanced-query? (property-keys :block/updated-at)))
             (timestamp-column-behavior :block/updated-at (t :page/updated-at) renderers))])
         (remove nil?)
         (map column-behavior->table-column))))
