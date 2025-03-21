(ns logseq.db.frontend.view
  "Main namespace for view fns."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.rules :as rules]))

(defn get-property-value-for-search
  [block property]
  (let [typ (:logseq.property/type property)
        many? (= :db.cardinality/many (get property :db/cardinality))
        number-type? (= :number typ)
        v (get block (:db/ident property))
        v' (if many? v [v])
        col (->> (if (db-property-type/all-ref-property-types typ) (map db-property/property-value-content v') v')
                 (remove nil?))]
    (if number-type?
      (reduce + (filter number? col))
      (string/join ", " col))))

(defn- get-value-for-sort
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

(defn- by [sorting]
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
                 rseq)
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
  "Support multiple properties sort"
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

(defn get-property-value-content
  [db entity]
  (when entity
    (cond
      (uuid? entity)
      (db-property/property-value-content (d/entity db [:block/uuid entity]))
      (de/entity? entity)
      (db-property/property-value-content entity)
      (keyword? entity)
      (str entity)
      :else
      entity)))

(defn- ^:large-vars/cleanup-todo row-matched?
  [db row filters]
  (let [or? (:or? filters)
        check-f (if or? some every?)]
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
                   (= (boolean (get-property-value-content db (get row property-ident))) match)
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
                   (not= (boolean (get-property-value-content db (get row property-ident))) match)
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
                         (if-let [property-value (get-property-value-content db v)]
                           (string/includes? (string/lower-case property-value) (string/lower-case match))
                           false))
                       value')

                 :text-not-contains
                 (not-any? #(string/includes? (str (get-property-value-content db %)) match) value')

                 :number-gt
                 (if match (some #(> (get-property-value-content db %) match) value') true)
                 :number-gte
                 (if match (some #(>= (get-property-value-content db %) match) value') true)
                 :number-lt
                 (if match (some #(< (get-property-value-content db %) match) value') true)
                 :number-lte
                 (if match (some #(<= (get-property-value-content db %) match) value') true)

                 :between
                 (if (seq match)
                   (some (fn [value-entity]
                           (let [[start end] match
                                 value (get-property-value-content db value-entity)
                                 conditions [(if start (<= start value) true)
                                             (if end (<= value end) true)]]
                             (if (seq match) (every? true? conditions) true))) value')
                   true)

                 :date-before
                 (if match (some #(< (:block/journal-day %) (:block/journal-day match)) value') true)

                 :date-after
                 (if match (some #(> (:block/journal-day %) (:block/journal-day match)) value') true)

                 :before
                 (let [search-value (common-util/get-timestamp match)]
                   (if search-value (<= (get row property-ident) search-value) true))

                 :after
                 (let [search-value (common-util/get-timestamp match)]
                   (if search-value (>= (get row property-ident) search-value) true))

                 true)]
           result)))
     (:filters filters))))

(defn- get-linked-references
  [db id]
  (let [entity (d/entity db id)
        ids (set (cons id (ldb/get-block-alias db id)))
        refs (mapcat (fn [id] (:block/_refs (d/entity db id))) ids)]
    (->> refs
         (remove (fn [block]
                   (or
                    (= (:db/id block) id)
                    (= id (:db/id (:block/page block)))
                    (ldb/hidden? (:block/page block))
                    (contains? (set (map :db/id (:block/tags block))) (:db/id entity))
                    (some? (get block (:db/ident entity))))))
         (common-util/distinct-by :db/id))))

(defn- get-unlinked-references
  [db id]
  (let [entity (d/entity db id)
        title (string/lower-case (:block/title entity))]
    (when-not (string/blank? title)
      (let [ids (->> (d/datoms db :avet :block/title)
                     (keep (fn [d]
                             (when (and (not= id (:e d)) (string/includes? (string/lower-case (:v d)) title))
                               (:e d)))))]
        (keep
         (fn [eid]
           (let [e (d/entity db eid)]
             (when-not (or (some #(= id %) (map :db/id (:block/refs e)))
                           (:block/link e)
                           (ldb/page? e))
               e)))
         ids)))))

(defn- get-entities
  [db view feat-type property-ident]
  (let [view-for (:logseq.property/view-for view)
        non-hidden-e (fn [id] (let [e (d/entity db id)]
                                (when-not (entity-util/hidden? e)
                                  e)))]
    (case feat-type
      :all-pages
      (keep (fn [d]
              (let [e (d/entity db (:e d))]
                (when-not (or (ldb/hidden-or-internal-tag? e)
                              (entity-util/property? e)
                              (entity-util/built-in? e))
                  e)))
            (d/datoms db :avet property-ident))

      :class-objects
      (let [class-id (:db/id view-for)
            class-children (db-class/get-structured-children db class-id)
            class-ids (distinct (conj class-children class-id))
            datoms (mapcat (fn [id] (d/datoms db :avet :block/tags id)) class-ids)]
        (keep (fn [d] (non-hidden-e (:e d))) datoms))

      :property-objects
      (->>
       (d/q
        '[:find [?b ...]
          :in $ % ?prop
          :where
          (has-property-or-default-value? ?b ?prop)]
        db
        (rules/extract-rules rules/db-query-dsl-rules [:has-property-or-default-value]
                             {:deps rules/rules-dependencies})
        property-ident)
       (keep (fn [id] (non-hidden-e id))))

      :linked-references
      (get-linked-references db (:db/id view-for))

      :unlinked-references
      (get-unlinked-references db (:db/id view-for))

      :query-result
      nil

      nil)))

(defonce *view-cache (atom {}))
(defn get-view-data
  [repo db view-id {:keys [journals?]}]
  ;; TODO: create a view for journals maybe?
  (if journals?
    (let [ids (->> (ldb/get-latest-journals db)
                   (mapv :db/id))]
      {:count (count ids)
       :data ids})
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
          group-by-property (:logseq.property.view/group-by-property view)
          group-by-property-ident (:db/ident group-by-property)
          group-by-closed-values? (some? (:property/closed-values group-by-property))
          ref-property? (= (:db/valueType group-by-property) :db.type/ref)
          filters (:logseq.property.table/filters view)]
      (or (get-in @*view-cache [repo view-id])
          (let [entities (get-entities db view feat-type index-attr)
                sorting (let [sorting* (:logseq.property.table/sorting view)]
                          (if (or (= sorting* :logseq.property/empty-placeholder) (empty? sorting*))
                            [{:id :block/updated-at, :asc? false}]
                            sorting*))
                filtered-entities (if (seq filters)
                                    (filter (fn [row] (row-matched? db row filters)) entities)
                                    entities)
                group-by-page? (= group-by-property-ident :block/page)
                result (if group-by-property
                         (->> filtered-entities
                              (group-by group-by-property-ident)
                              (seq)
                              (sort-by (fn [[by-value _]]
                                         (cond
                                           group-by-page?
                                           (:block/updated-at by-value)
                                           group-by-closed-values?
                                           (:block/order by-value)
                                           ref-property?
                                           (db-property/property-value-content by-value)
                                           :else
                                           by-value))
                                       (if group-by-page? #(compare %2 %1) compare)))
                         (sort-rows db sorting filtered-entities))
                data {:count (count filtered-entities)
                      :data (if group-by-property
                              (map
                               (fn [[by-value entities]]
                                 [(if (de/entity? by-value)
                                    (select-keys by-value [:db/id :block/uuid :block/title :block/name :logseq.property/value :logseq.property/icon :block/tags])
                                    by-value)
                                  (->> entities
                                       ldb/sort-by-order
                                       (map :db/id))])
                               result)
                              (mapv :db/id result))}]
            (swap! *view-cache assoc-in [repo view-id] data)
            data)))))
