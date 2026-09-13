(ns logseq.outliner.view
  "Atomic table reordering and moves between view groups."
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.common.view :as db-view]
            [logseq.db.common.view-order :as view-order]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.property :as outliner-property]))

(defn- reject-drop!
  []
  (throw (ex-info "Table changed or drop is not allowed"
                  {:type :notification
                   :payload {:message "The table changed or this move is not allowed. Try again."
                             :i18n-key :view.table/reorder-failed
                             :type :warning}})))

(defn- view-options
  [db context]
  (cond-> (-> context
              (dissoc :feature-type :query-row-uuids :initial-row-count)
              (assoc :view-feature-type (:feature-type context)))
    (= :query-result (:feature-type context))
    (assoc :query-entity-ids
           (mapv (fn [row-uuid]
                   (or (:db/id (d/entity db [:block/uuid row-uuid]))
                       (reject-drop!)))
                 (:query-row-uuids context)))))

(defn- row-groups
  [db view-id options group-property]
  (let [data (:data (db-view/get-view-data db view-id options))
        row-uuids (fn [rows] (mapv #(:block/uuid (d/entity db %)) rows))]
    (if group-property
      (into {} (map (fn [[value rows]] [(view-order/group-value value) (row-uuids rows)])) data)
      {nil (row-uuids data)})))

(defn- drop-state
  [db view-uuid {:keys [context rows expected-order row-uuid source-group target-group anchor-uuid]}]
  (let [view (d/entity db [:block/uuid view-uuid])
        group-property (:db/ident (:logseq.property.view/group-by-property view))
        options (view-options db context)
        visible (row-groups db (:db/id view) options group-property)]
    (when-not (and view
                   (contains? #{nil :logseq.property.view/type.table}
                              (:db/ident (:logseq.property.view/type view)))
                   (= group-property (:group-by-property-ident context))
                   (= expected-order (:logseq.property.table/sort-order view))
                   (= visible rows)
                   (some #{row-uuid} (get visible source-group))
                   (contains? visible target-group)
                   (or (nil? anchor-uuid) (some #{anchor-uuid} (get visible target-group))))
      (reject-drop!))
    (let [full-options (assoc options :unfiltered? true)
          full-groups (row-groups db (:db/id view) full-options group-property)
          flat (get (row-groups db (:db/id view) (assoc full-options :ungrouped? true) nil) nil)
          order (assoc (or (view-order/table-order view) {:flat [] :groups {}}) :flat flat)
          order (if group-property (assoc-in order [:groups group-property] full-groups) order)]
      {:view view :group-property group-property :visible visible
       :full-groups full-groups :order order})))

(defn- group-property-value
  [db group]
  (case (:kind group)
    :empty nil
    :scalar (:value group)
    :entity (or (:db/id (d/entity db [:block/uuid (:uuid group)])) (reject-drop!))
    (reject-drop!)))

(defn- move-between-pages!
  [conn row destination]
  (let [page (when (= :entity (:kind destination))
               (d/entity @conn [:block/uuid (:uuid destination)]))]
    (when-not (and page (ldb/page? page) (:block/page row) (not (ldb/page? row)))
      (reject-drop!))
    (outliner-core/move-blocks! conn [row] page {:sibling? false :bottom? true})
    ;; Some protected outliner moves are no-ops. Do not save a misleading row order.
    (when-not (= (:db/id page) (:db/id (:block/page (d/entity @conn (:db/id row)))))
      (reject-drop!))))

(defn- move-between-properties!
  [conn row property-ident source destination]
  (let [property (d/entity @conn property-ident)
        target-value (group-property-value @conn destination)]
    (if (or (nil? target-value) (not (db-property/many? property)))
      (outliner-property/set-block-property! conn (:db/id row) property-ident target-value)
      (let [retained (remove #(= source (view-order/group-value (db-view/property-group-value property %)))
                             (get row property-ident))
            values (mapv #(if (de/entity? %) (:db/id %) %) retained)]
        (outliner-property/batch-set-property! conn [(:db/id row)] property-ident
                                              (vec (distinct (conj values target-value))) {})))))

(defn- reordered-groups
  [{:keys [full-groups visible]} {:keys [row-uuid source-group target-group anchor-uuid placement]}]
  (let [destination (get visible target-group)
        reordered (if (= row-uuid anchor-uuid)
                    destination
                    (view-order/insert-row destination row-uuid anchor-uuid placement))]
    (if (= source-group target-group)
      (assoc full-groups source-group
             (view-order/replace-visible-slots (get full-groups source-group) destination reordered))
      (-> full-groups
          (update source-group #(into [] (remove #{row-uuid}) %))
          (update target-group #(if (= row-uuid anchor-uuid)
                                  %
                                  (view-order/insert-row % row-uuid anchor-uuid placement)))))))

(defn reorder-rows!
  "Called inside apply-ops!'s temporary connection; one drop produces one commit."
  [conn view-uuid {:keys [row-uuid source-group target-group] :as request}]
  (let [{:keys [view group-property order full-groups] :as snapshot} (drop-state @conn view-uuid request)
        groups (reordered-groups snapshot request)]
    (when (or (not= groups full-groups) (not= source-group target-group))
      (when (not= source-group target-group)
        (let [row (d/entity @conn [:block/uuid row-uuid])]
          (if (= :block/page group-property)
            (move-between-pages! conn row target-group)
            (move-between-properties! conn row group-property source-group target-group))))
      (let [order (if group-property
                    (assoc-in order [:groups group-property] groups)
                    (assoc order :flat (get groups nil)))]
        (outliner-property/set-block-property! conn (:db/id view) :logseq.property.table/sort-order order)
        (outliner-property/remove-block-property! conn (:db/id view) :logseq.property.table/sorting)))))
