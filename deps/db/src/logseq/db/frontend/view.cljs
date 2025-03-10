(ns logseq.db.frontend.view
  "Main namespace for view fns."
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]))

(defn get-property-value-for-search
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

(defn get-value-for-sort
  [property]
  (let [db-ident (or (:db/ident property) (:id property))
        closed-values (seq (:property/closed-values property))
        closed-value->sort-number (when closed-values
                                    (->> (zipmap (map :db/id closed-values)
                                                 (if (every? :block/order closed-values)
                                                   (map :block/order closed-values)
                                                   (range 0 (count closed-values))))
                                         (into {})))]
    (fn [row]
      (cond
        closed-values
        (closed-value->sort-number (:db/id (get row db-ident)))
        :else
        (let [v (if (de/entity? property)
                  (get-property-value-for-search row property)
                  (get row db-ident))
              ;; need to check value type, otherwise `compare` can be failed,
              ;; then crash the UI.
              valid-type? (some-fn number? string? boolean?)]
          (when (valid-type? v)
            v))))))

(defn hidden-or-internal-tag?
  [e]
  (or (entity-util/hidden? e) (db-class/internal-tags (:db/ident e))))

(defn by [sorting]
  (fn [a b]
    (loop [[{:keys [asc? get-value]} & orderings] sorting]
      (let [;; non-entity property such as Backlinks
            v1 (get-value a)
            v2 (get-value b)
            ordering (if (and (number? v1) (number? v2))
                       (if asc? < >)
                       (if asc? compare #(compare %2 %1)))
            order (ordering)]
        (if (and (zero? order) orderings)
          (recur orderings)
          order)))))

(defn- sort-by-single-property
  [db {:keys [id asc?]} rows]
  (let [datoms (cond->> (d/datoms db :avet id)
                 true
                 (common-util/distinct-by :e)
                 (not asc?)
                 reverse)
        row-ids (set (map :db/id rows))
        id->row (zipmap (map :db/id rows) rows)]
    (keep
     (fn [d]
       (when (row-ids (:e d))
         (id->row (:e d))))
     datoms)))

(defn- sort-by-multiple-properties
  [db sorting rows]
  (let [sorting' (map (fn [{:keys [id asc?]}]
                        (let [property (or (d/entity db id) {:id id})]
                          {:asc? asc?
                           :get-value (fn [row] ((get-value-for-sort property) row))})) sorting)]
    (sort (by sorting') rows)))

(defn sort-rows
  "Support multiple sorts"
  [db sorting rows]
  (let [[single-property asc?] (case (count sorting)
                                 0
                                 [:block/updated-at false]
                                 1
                                 (let [{:keys [id asc?]} (first sorting)]
                                   (when-let [property (d/entity db id)]
                                     [(:db/ident property) asc?]))
                                 nil)]
    (if single-property
      (sort-by-single-property db {:id single-property :asc? asc?} rows)
      (sort-by-multiple-properties db sorting rows))))

(defn get-view-data
  [db view-id]
  (let [view (d/entity db view-id)
        feat-type (:logseq.property.view/feature-type view)
        index-attr (case feat-type
                     :all-pages
                     :block/name
                     :class-objects
                     :block/tags
                     :property-objects
                     (let [view-for (:logseq.property/view-for view)]
                       (:db/ident view-for))
                     nil)
        all-pages? (= feat-type :all-pages)]
    (when index-attr
      (let [datoms (d/datoms db :avet index-attr)
            entities (->> datoms
                          (keep (fn [d]
                                  (let [e (d/entity db (:e d))]
                                    (when-not (and all-pages? (hidden-or-internal-tag? e))
                                      e)))))
            sorting (let [sorting* (:logseq.property.table/sorting view)]
                      (if (or (= sorting* :logseq.property/empty-placeholder) (empty? sorting*))
                        [{:id :block/updated-at, :asc? false}]
                        sorting*))
            data (->> entities
                      (sort-rows db sorting)
                      (take 100)
                      (map (fn [e]
                             (cond->
                              (-> (into {} e)
                                  (assoc :db/id (:db/id e)))
                               all-pages?
                               (assoc :block.temp/refs-count (count (:block/_refs e)))))))]
        {:count (count entities)
         :data (vec data)}))))
