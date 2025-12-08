(ns logseq.db.common.view
  "Main namespace for view fns."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.common.reference :as db-reference]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.rules :as rules]))

(def valid-type-for-sort? (some-fn number? string? boolean?))

(defn get-property-value-for-search
  [block property]
  (let [v (get block (:db/ident property))]
    (if (valid-type-for-sort? v)        ;fast path
      v
      (let [typ (:logseq.property/type property)
            many? (keyword-identical? :db.cardinality/many (get property :db/cardinality))
            number-type? (or (keyword-identical? :number typ)
                             (keyword-identical? :datetime typ))]
        (if many?
          (let [col (->> (if (db-property-type/all-ref-property-types typ) (map db-property/property-value-content v) v)
                         (remove nil?))]
            (if number-type?
              (reduce + (filter number? col))
              (string/join ", " col)))
          (let [v' (if (db-property-type/all-ref-property-types typ) (db-property/property-value-content v) v)]
            (cond
              (and number-type? (number? v')) v'
              :else v')))))))

(defn- get-value-for-sort
  [property]
  (let [db-ident (or (:db/ident property) (:id property))
        closed-values (seq (:property/closed-values property))
        closed-value->sort-number (when closed-values
                                    (->> (zipmap (map :db/id closed-values)
                                                 (if (every? :block/order closed-values)
                                                   (map :block/order closed-values)
                                                   (range 0 (count closed-values))))
                                         (into {})))
        get-property-value-fn (fn [entity]
                                (if (de/entity? property)
                                  (if (= :date (:logseq.property/type property))
                                    (:block/journal-day (get entity db-ident))
                                    (get-property-value-for-search entity property))
                                  (get entity db-ident)))]
    (fn [entity]
      (cond
        closed-values
        (closed-value->sort-number (:db/id (get entity db-ident)))
        :else
        (let [v (get-property-value-fn entity)]
          (when (valid-type-for-sort? v)
            v))))))

(defn- by-one-sorting
  [{:keys [asc? get-value]}]
  (let [cmp (if asc? compare #(compare %2 %1))]
    (fn [a b]
      (cmp (get-value a) (get-value b)))))

(defn- sort-ref-entities-by-single-property
  "get all entities sorted by `major-sorting`"
  [entities {:keys [_id asc?]} get-value-fn]
  (let [sorting {:asc? asc?
                 :get-value get-value-fn}
        sort-cmp (by-one-sorting sorting)]
    (sort sort-cmp entities)))

(defn- sort-by-single-property
  [db {:keys [id asc?] :as sorting} entities partition?]
  (let [property (or (d/entity db id) {:db/ident id})
        get-value-fn (memoize (get-value-for-sort property))
        sorted-entities (->>
                         (cond
                           (= id :block.temp/refs-count)
                           (cond-> (sort-by :block.temp/refs-count entities)
                             (not asc?)
                             reverse)

                           :else
                           (let [ref-type? (= :db.type/ref (:db/valueType property))]
                             (if (or ref-type? (not (contains?
                                                     #{:block/updated-at :block/created-at :block/title}
                                                     (:db/ident property))))
                               (sort-ref-entities-by-single-property entities sorting get-value-fn)
                               (let [datoms (cond->
                                             (->> (d/datoms db :avet id)
                                                  (common-util/distinct-by :e)
                                                  vec)
                                              (not asc?)
                                              rseq)
                                     row-ids (set (map :db/id entities))
                                     id->row (zipmap (map :db/id entities) entities)]
                                 (keep
                                  (fn [d]
                                    (when (row-ids (:e d))
                                      (id->row (:e d))))
                                  datoms)))))

                         distinct)]
    (if partition?
      (partition-by get-value-fn sorted-entities)
      sorted-entities)))

(defn- sort-entities-by-minor-sorting
  "minor-sorting - [{:keys [id asc?]} ...]"
  [db partitioned-entities-by-major-sorting minor-sorting]
  (let [sorting
        (map (fn [{:keys [id asc?]}]
               (let [property (d/entity db id)]
                 {:asc? asc?
                  :get-value (memoize (get-value-for-sort property))}))
             minor-sorting)
        sort-cmp (common-util/by-sorting sorting)]
    (mapcat (fn [entities] (sort sort-cmp entities)) partitioned-entities-by-major-sorting)))

(defn sort-entities
  [db sorting entities]
  (let [major-sorting (or (first sorting)
                          {:id :block/updated-at :asc? false})
        minor-sorting (seq (rest sorting))
        major-sorted-entities
        (sort-by-single-property db major-sorting entities (not-empty minor-sorting))]
    (if minor-sorting
      (sort-entities-by-minor-sorting db major-sorted-entities minor-sorting)
      major-sorted-entities)))

(defn get-property-value-content
  [db value]
  (when value
    (cond
      (uuid? value)
      (db-property/property-value-content (d/entity db [:block/uuid value]))
      (de/entity? value)
      (db-property/property-value-content value)
      (keyword? value)
      (str value)
      :else
      value)))

(defn- match-property-value-as-entity?
  "Determines if the property value entity should be treated as an entity. For some property types
   like :default, we want match on the entity's content as that is what the user sees and interacts with"
  [property-value-entity property-entity]
  ;; Allow pvalue entities with :db/ident e.g. closed values like status OR for any type
  ;; that aren't text types
  (or (:db/ident property-value-entity)
      (not (contains? db-property-type/closed-value-property-types (:logseq.property/type property-entity)))))

(defn- empty-value?
  [v]
  (or (nil? v)
      (= :logseq.property/empty-placeholder v)
      (and (string? v) (string/blank? v))
      (and (coll? v) (empty? v))))

(defn- ^:large-vars/cleanup-todo row-matched?
  [db row filters input]
  (let [or? (:or? filters)
        check-f (if or? some every?)]
    (and
     (if (string/blank? input)
       true
       (string/includes? (string/lower-case (:block/title row)) (string/lower-case input)))
     (check-f
      (fn [[property-ident operator match]]
        (if (nil? match)
          true
          (boolean
           (let [value (get row property-ident)
                 value' (cond
                          (set? value) value
                          (nil? value) nil
                          :else #{value})
                 entity? (de/entity? (first value'))
                 result
                 (case operator
                   :is
                   (cond
                     (boolean? match)
                     (= (boolean (get-property-value-content db (get row property-ident))) match)
                     (= :empty match)
                     (empty-value? value)
                     (empty? match)
                     true
                     (and (empty? match) (empty? value'))
                     true
                     :else
                     (if entity?
                       (let [property (d/entity db property-ident)]
                         (if (match-property-value-as-entity? (first value') property)
                           (boolean (seq (set/intersection (set (map :block/uuid value')) match)))
                           (boolean (seq (set/intersection (set (map db-property/property-value-content value'))
                                                           (set (map (comp db-property/property-value-content #(d/entity db [:block/uuid %]))
                                                                     match)))))))
                       (boolean (seq (set/intersection (set value') match)))))

                   :is-not
                   (cond
                     (boolean? match)
                     (not= (boolean (get-property-value-content db (get row property-ident))) match)
                     (= :empty match)
                     (not (empty-value? value))
                     (and (empty? match) (seq value'))
                     true
                     (and (seq match) (empty? value'))
                     true
                     :else
                     (if entity?
                       (let [property (d/entity db property-ident)]
                         (if (match-property-value-as-entity? (first value') property)
                           (boolean (empty? (set/intersection (set (map :block/uuid value')) match)))
                           (boolean (empty? (set/intersection (set (map db-property/property-value-content value'))
                                                              (set (map (comp db-property/property-value-content #(d/entity db [:block/uuid %]))
                                                                        match)))))))
                       (boolean (empty? (set/intersection (set value') match)))))

                   :text-contains
                   (some (fn [v]
                           (if-let [property-value (get-property-value-content db v)]
                             (string/includes? (string/lower-case property-value) (string/lower-case match))
                             false))
                         value')

                   :text-not-contains
                   (not-any? #(string/includes? (str (get-property-value-content db %)) match) value')

                   :number-gt
                   (when value
                     (if match (some #(> (get-property-value-content db %) match) value') true))
                   :number-gte
                   (when value
                     (if match (some #(>= (get-property-value-content db %) match) value') true))
                   :number-lt
                   (when value
                     (if match (some #(< (get-property-value-content db %) match) value') true))
                   :number-lte
                   (when value
                     (if match (some #(<= (get-property-value-content db %) match) value') true))

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
                   (when value
                     (if match (some #(< (:block/journal-day %) (:block/journal-day match)) value') true))

                   :date-after
                   (when value
                     (if match (some #(> (:block/journal-day %) (:block/journal-day match)) value') true))

                   :before
                   (when value
                     (let [search-value (common-util/get-timestamp match)]
                       (if search-value (<= value search-value) true)))

                   :after
                   (when value
                     (let [search-value (common-util/get-timestamp match)]
                       (if search-value (>= value search-value) true)))

                   true)]
             result))))
      (:filters filters)))))

(defn- get-exclude-page-ids
  [db]
  (->>
   (concat
    (d/datoms db :avet :logseq.property/hide? true)
    (d/datoms db :avet :logseq.property/built-in? true)
    (d/datoms db :avet :block/tags (:db/id (d/entity db :logseq.class/Property))))
   (map :e)
   set))

(defn- get-entities-for-all-pages [db sorting property-ident {:keys [db-based?]}]
  (let [refs-count? (and (coll? sorting) (some (fn [m] (= (:id m) :block.temp/refs-count)) sorting))
        exclude-ids (when db-based? (get-exclude-page-ids db))]
    (keep (fn [d]
            (let [e (entity-plus/unsafe->Entity db (:e d))]
              (when-not (if db-based?
                          (exclude-ids (:db/id e))
                          (or (ldb/hidden-or-internal-tag? e)
                              (entity-util/property? e)
                              (entity-util/built-in? e)))
                (cond-> e
                  refs-count?
                  (assoc :block.temp/refs-count (common-initial-data/get-block-refs-count db (:e d)))))))
          (d/datoms db :avet property-ident))))

(defn- get-entities
  [db view feat-type property-ident view-for-id* sorting]
  (let [view-for (:logseq.property/view-for view)
        view-for-id (or (:db/id view-for) view-for-id*)
        non-hidden-e (fn [id] (let [e (d/entity db id)]
                                (when-not (entity-util/hidden? e)
                                  e)))
        db-based? (entity-plus/db-based-graph? db)]
    (case feat-type
      :all-pages
      (get-entities-for-all-pages db sorting property-ident {:db-based? db-based?})

      :class-objects
      (db-class/get-class-objects db view-for-id)

      :property-objects
      (->>
       (d/q
        '[:find [?b ...]
          :in $ % ?prop
          :where
          (has-property-or-object-property? ?b ?prop)]
        db
        (rules/extract-rules rules/db-query-dsl-rules [:has-property-or-object-property]
                             {:deps rules/rules-dependencies})
        property-ident)
       (keep (fn [id] (non-hidden-e id))))

      :linked-references
      (db-reference/get-linked-references db view-for-id)

      :unlinked-references
      (db-reference/get-unlinked-references db view-for-id)

      :query-result
      nil

      nil)))

(defn- get-view-entities
  [db view-id & {:keys [view-for-id view-feature-type sorting]}]
  (let [view (d/entity db view-id)
        feat-type (or view-feature-type (:logseq.property.view/feature-type view))
        sorting (or sorting (:logseq.property.table/sorting view))
        index-attr (case feat-type
                     :all-pages
                     :block/name
                     :class-objects
                     :block/tags
                     :property-objects
                     (let [view-for (:logseq.property/view-for view)]
                       (:db/ident view-for))
                     nil)]
    (get-entities db view feat-type index-attr view-for-id sorting)))

(defn- get-view-property-values
  [db property-ident {:keys [view-id query-entity-ids]}]
  (let [empty-id (:db/id (d/entity db :logseq.property/empty-placeholder))
        entities-result (get-view-entities db view-id)
        entities (cond
                   query-entity-ids
                   (keep #(d/entity db %) query-entity-ids)
                   (map? entities-result)
                   (:ref-blocks entities-result)
                   :else
                   entities-result)]
    (->> (mapcat (fn [entity]
                   (let [v (get entity property-ident)]
                     (if (set? v) v #{v})))
                 entities)
         (remove nil?)
         (keep (fn [e]
                 (when-let [label (get-property-value-content db e)]
                   (when-not (or (string/blank? (str label))
                                 (= empty-id (:db/id e)))
                     {:label (str label)
                      :value (if (de/entity? e)
                               (select-keys e [:db/id :block/uuid])
                               e)}))))
         (common-util/distinct-by :label))))

(defn ^:api get-property-values
  [db property-ident {:keys [view-id _query-entity-ids] :as option}]
  (let [property (d/entity db property-ident)
        default-value (:logseq.property/default-value property)
        ref-type? (= :db.type/ref (:db/valueType property))
        values (if view-id
                 (get-view-property-values db property-ident option)
                 ;; get all values
                 (->> (d/datoms db :avet property-ident)
                      (map (fn [d]
                             (:v d)))
                      distinct
                      (map (fn [v]
                             (let [e (when ref-type? (d/entity db v))
                                   [label value] (cond ref-type?
                                                       [(db-property/property-value-content e)
                                                        (select-keys e [:db/id :block/uuid])]
                                                       ;; FIXME: Move query concerns out of :label as UI labels are usually strings
                                                       ;; All non-string values need to be passed to the query builder since non-ref prop values use the actual value
                                                       ;; This check is less fragile than listing all the property types to support e.g. :datetime, :checkbox, :keyword, :any
                                                       (not (string? v))
                                                       [v v]
                                                       :else
                                                       [(str v) v])]
                               {:label label
                                :value value})))))]
    (->>
     (if default-value
       (cons {:label (get-property-value-content db default-value)
              :value (select-keys default-value [:db/id :block/uuid])}
             values)
       values)
     (common-util/distinct-by :label))))

(defn- get-query-properties
  [query entities]
  (let [properties (when (and (coll? query) (= :find (first query)))
                     (let [expr (second query)]
                       (when (= 'pull (first expr))
                         (last expr))))]
    (if (and (seq properties) (not= properties ['*]))
      properties
      (distinct (mapcat keys entities)))))

(defn ^:api ^:large-vars/cleanup-todo get-view-data
  [db view-id {:keys [journals? _view-for-id view-feature-type group-by-property-ident input query-entity-ids query filters sorting]
               :as opts}]
  ;; TODO: create a view for journals maybe?
  (cond
    journals?
    (let [ids (->> (ldb/get-latest-journals db)
                   (mapv :db/id))]
      {:count (count ids)
       :data ids})
    :else
    (let [view (d/entity db view-id)
          group-by-property (:logseq.property.view/group-by-property view)
          db-based? (entity-plus/db-based-graph? db)
          list-view? (or (= :logseq.property.view/type.list (:db/ident (:logseq.property.view/type view)))
                         (and (not db-based?)
                              (contains? #{:linked-references :unlinked-references} view-feature-type)))
          group-by-property-ident (or (:db/ident group-by-property) group-by-property-ident)
          group-by-closed-values? (some? (:property/closed-values group-by-property))
          ref-property? (= (:db/valueType group-by-property) :db.type/ref)
          filters (or (:logseq.property.table/filters view) filters)
          feat-type (or view-feature-type (:logseq.property.view/feature-type view))
          query? (= feat-type :query-result)
          query-entity-ids (when (seq query-entity-ids) (set query-entity-ids))
          entities-result (if query?
                            (keep (fn [id]
                                    (let [e (d/entity db id)]
                                      (when-not (= :logseq.property/query (:db/ident (:logseq.property/created-from-property e)))
                                        e)))
                                  query-entity-ids)
                            (get-view-entities db view-id opts))
          entities (if (= feat-type :linked-references)
                     (:ref-blocks entities-result)
                     entities-result)
          sorting (let [sorting* (:logseq.property.table/sorting view)]
                    (if (or (= sorting* :logseq.property/empty-placeholder) (empty? sorting*))
                      (or sorting [{:id :block/updated-at, :asc? false}])
                      sorting*))
          filtered-entities (if (or (seq filters) (not (string/blank? input)))
                              (filter (fn [row] (row-matched? db row filters input)) entities)
                              entities)
          group-by-page? (= group-by-property-ident :block/page)
          readable-property-value-or-ent
          (fn readable-property-value-or-ent [ent]
            (let [pvalue (get ent group-by-property-ident)]
              (if (de/entity? pvalue)
                (if (match-property-value-as-entity? pvalue group-by-property)
                  pvalue
                  (db-property/property-value-content pvalue))
                pvalue)))
          result (if group-by-property-ident
                   (let [groups-sort-by-property-ident (or (:db/ident (:logseq.property.view/sort-groups-by-property view))
                                                           :block/journal-day)
                         desc? (:logseq.property.view/sort-groups-desc? view)
                         result (->> filtered-entities
                                     (group-by readable-property-value-or-ent)
                                     (seq))
                         keyfn (fn [groups-sort-by-property-ident]
                                 (fn [[by-value _]]
                                   (cond
                                     group-by-page?
                                     (let [v (get by-value groups-sort-by-property-ident)]
                                       (if (and (= groups-sort-by-property-ident :block/journal-day) (not desc?)
                                                (nil? (:block/journal-day by-value)))
                                         ;; Use MAX_SAFE_INTEGER so non-journal pages (without :block/journal-day) are sorted
                                         ;; after all journal pages when sorting by journal date.
                                         js/Number.MAX_SAFE_INTEGER
                                         v))
                                     group-by-closed-values?
                                     (:block/order by-value)
                                     ref-property?
                                     (db-property/property-value-content by-value)
                                     :else
                                     by-value)))]
                     (sort (common-util/by-sorting
                            (cond->
                             [{:get-value (keyfn groups-sort-by-property-ident)
                               :asc? (not desc?)}]
                              (not= groups-sort-by-property-ident :block/title)
                              (conj {:get-value (keyfn :block/title)
                                     :asc? (not desc?)})))
                           result))
                   (sort-entities db sorting filtered-entities))
          data' (if group-by-property-ident
                  (map
                   (fn [[by-value entities]]
                     (let [by-value' (if (de/entity? by-value)
                                       (select-keys by-value [:db/id :db/ident :block/uuid :block/title :block/name :logseq.property/value :logseq.property/icon :block/tags])
                                       by-value)
                           pages? (not (some :block/page entities))
                           group (if (and list-view? (not pages?))
                                   (let [parent-groups (->> entities
                                                            (group-by :block/parent)
                                                            (sort-by (fn [[parent _]] (:block/order parent))))]
                                     (map
                                      (fn [[_parent blocks]]
                                        [(:block/uuid (first blocks))
                                         (map (fn [b]
                                                {:db/id (:db/id b)
                                                 :block/parent (:block/uuid (:block/parent b))})
                                              (ldb/sort-by-order blocks))])
                                      parent-groups))
                                   (->> (sort-entities db sorting entities)
                                        (map :db/id)))]
                       [by-value' group]))
                   result)
                  (map :db/id result))]
      (cond->
       {:count (count filtered-entities)
        :data (distinct data')}
        (= feat-type :linked-references)
        (merge (select-keys entities-result [:ref-pages-count :ref-matched-children-ids]))
        query?
        (assoc :properties (get-query-properties query entities-result))))))
