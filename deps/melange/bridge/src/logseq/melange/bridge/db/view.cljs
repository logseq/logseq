(ns logseq.melange.bridge.db.view
  "Main namespace for view fns."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private view-workflow-api (.-ViewWorkflow melange-db))
(def ^:private view-property-values-api (.-ViewPropertyValues melange-db))
(def ^:private view-data-workflow-api (.-ViewDataWorkflow melange-db))

(defn get-property-value-for-search
  [block property]
  ((.-propertyValueForSearchWith view-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   block
   property))

(defn get-property-value-content
  [db value]
  ((.-contentWith view-property-values-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   value))

(defn- decode-property-value-entries
  [entries]
  (map (fn [entry]
         {:label (.-label entry)
          :value (.-value entry)})
       (seq entries)))

(defn ^:api get-property-values
  [db property-ident {:keys [view-id query-entity-ids]}]
  (decode-property-value-entries
   ((.-getPropertyValuesWith view-data-workflow-api)
    (runtime/runtime-adapter)
    (d/adapter)
    db
    property-ident
    view-id
    (to-array query-entity-ids))))

(defn ^:api ^:large-vars/cleanup-todo get-view-data
  [db view-id {:keys [journals? view-for-id view-feature-type group-by-property-ident input query-entity-ids query filters sorting]
               :as _opts}]
  (let [^js result
        ((.-getWith view-data-workflow-api)
         (runtime/runtime-adapter)
         (d/adapter)
         db
         view-id
         #js {:journals (boolean journals?)
              :viewForId view-for-id
              :feature (some-> view-feature-type name)
              :groupByPropertyIdent group-by-property-ident
              :input input
              :queryEntityIds (to-array query-entity-ids)
              :query query
              :filters filters
              :sorting (to-array
                        (map (fn [{:keys [id asc?]}]
                               #js {:id id :asc (boolean asc?)})
                             sorting))})
        ref-page-counts (.-refPageCounts result)
        ref-matched-children-ids (.-refMatchedChildrenIds result)
        properties (.-properties result)]
    (cond->
     {:count (.-count result)
      :data (seq (.-data result))}
      (some? ref-page-counts)
      (assoc :ref-pages-count
             (map (fn [^js entry]
                    [(.-label entry) (.-count entry)])
                  (seq ref-page-counts)))
      (some? ref-matched-children-ids)
      (assoc :ref-matched-children-ids
             (set (seq ref-matched-children-ids)))
      (some? properties)
      (assoc :properties (seq properties)))))
