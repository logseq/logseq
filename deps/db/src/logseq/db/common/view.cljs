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
        entities' (if (vector? entities) entities (vec entities))
        datom-sort-supported? (contains? #{:block/updated-at :block/created-at :block/title}
                                         (:db/ident property))
        use-datom-sort? (and datom-sort-supported?
                             (not= :db.type/ref (:db/valueType property))
                             (> (count entities') 10000))
        sorted-entities (->>
                         (cond
                           (= id :block.temp/refs-count)
                           (cond-> (sort-by :block.temp/refs-count entities')
                             (not asc?)
                             reverse)

                           use-datom-sort?
                           (let [datoms (cond->
                                         (->> (d/datoms db :avet id)
                                              (common-util/distinct-by :e)
                                              vec)
                                          (not asc?)
                                          rseq)
                                 row-ids (set (map :db/id entities'))
                                 id->row (zipmap (map :db/id entities') entities')]
                             (keep
                              (fn [d]
                                (when (row-ids (:e d))
                                  (id->row (:e d))))
                              datoms))

                           :else
                           (sort-ref-entities-by-single-property entities' sorting get-value-fn))

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
                           (boolean (some match (map :block/uuid value')))
                           (boolean (seq (set/intersection (set (map db-property/property-value-content value'))
                                                           (set (map (comp db-property/property-value-content #(d/entity db [:block/uuid %]))
                                                                     match)))))))
                       (boolean (some match value'))))

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
                           (not (some match (map :block/uuid value')))
                           (empty? (set/intersection (set (map db-property/property-value-content value'))
                                                     (set (map (comp db-property/property-value-content #(d/entity db [:block/uuid %]))
                                                               match))))))
                       (not (some match value'))))

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

(defn- ->filter-match-id
  [db v]
  (cond
    (nil? v) nil
    (number? v) v
    (uuid? v) (some-> (d/entity db [:block/uuid v]) :db/id)
    (de/entity? v) (:db/id v)
    (and (map? v) (contains? v :db/id)) (:db/id v)
    :else nil))

(defn- build-fast-filter-pred
  "Build a faster matcher for common filter shapes while preserving semantics.
   Currently optimized for a single ref property filter with :is/:is-not."
  [db filters input]
  (when (and (string/blank? input)
             (map? filters)
             (not (:or? filters)))
    (let [clauses (:filters filters)]
      (when (= 1 (count clauses))
        (let [[property-ident operator match] (first clauses)
              property (d/entity db property-ident)
              ref-property? (= :db.type/ref (:db/valueType property))]
          (when (and ref-property?
                     (#{:is :is-not} operator)
                     (set? match)
                     (seq match)
                     (not (contains? match :empty)))
            (let [match-ids (set (keep #(->filter-match-id db %) match))]
              (when (seq match-ids)
                (fn [row]
                  (let [v (get row property-ident)
                        value-col (cond
                                    (set? v) v
                                    (nil? v) nil
                                    :else #{v})
                        hit? (boolean (some match-ids (keep #(->filter-match-id db %) value-col)))]
                    (if (= operator :is) hit? (not hit?))))))))))))

(defn- ident-eid
  [db ident]
  (when-let [datom (first (d/datoms db :avet :db/ident ident))]
    (:e datom)))

(defn- get-exclude-page-ids
  [db]
  (let [property-tag-id (ident-eid db :logseq.class/Property)]
    (persistent!
     (reduce (fn [result d]
               (conj! result (:e d)))
             (transient #{})
             (concat
              (d/datoms db :avet :logseq.property/hide? true)
              (d/datoms db :avet :logseq.property/deleted-at)
              (d/datoms db :avet :logseq.property/built-in? true)
              (d/datoms db :avet :block/tags property-tag-id))))))

(defn- get-entities-for-all-pages [db sorting property-ident]
  (let [refs-count? (and (coll? sorting) (some (fn [m] (= (:id m) :block.temp/refs-count)) sorting))
        exclude-ids (get-exclude-page-ids db)]
    (persistent!
     (reduce (fn [result d]
               (let [eid (:e d)]
                 (if (contains? exclude-ids eid)
                   result
                   (let [e (entity-plus/unsafe->Entity db eid)]
                     (if (entity-util/hidden? e)
                       result
                       (conj! result
                              (cond-> e
                                refs-count?
                                (assoc :block.temp/refs-count (common-initial-data/get-block-refs-count db eid)))))))))
             (transient [])
             (d/datoms db :avet property-ident)))))

(defn- indexed-attr-value
  [db eid attr]
  (when-let [datom (first (d/datoms db :eavt eid attr))]
    (:v datom)))

(defn- indexed-attr-values
  [db eid attr]
  (mapv :v (d/datoms db :eavt eid attr)))

(defn- attr-keyword
  [db eid attr]
  (when-let [v (indexed-attr-value db eid attr)]
    (if (integer? v)
      (indexed-attr-value db v :db/ident)
      v)))

(defn- uuid->eid
  [db block-uuid]
  (when-let [datom (first (d/datoms db :avet :block/uuid block-uuid))]
    (:e datom)))

(defn- ref-value-content
  [db value-eid]
  (or (indexed-attr-value db value-eid :block/title)
      (indexed-attr-value db value-eid :logseq.property/value)))

(defn- match-item->id
  [db v]
  (cond
    (nil? v) nil
    (uuid? v) (uuid->eid db v)
    (keyword? v) (ident-eid db v)
    (number? v) v
    (de/entity? v) (:db/id v)
    (and (map? v) (contains? v :db/id)) (:db/id v)
    :else nil))

(defn- match-item-content
  [db v]
  (cond
    (uuid? v)
    (some-> (uuid->eid db v) (->> (ref-value-content db)))

    (keyword? v)
    (some-> (ident-eid db v) (->> (ref-value-content db)))

    (and (integer? v) (indexed-attr-value db v :block/uuid))
    (ref-value-content db v)

    (de/entity? v)
    (or (:block/title v) (:logseq.property/value v))

    (map? v)
    (or (:block/title v) (:logseq.property/value v))

    :else v))

(defn- match-journal-day
  [db match]
  (cond
    (and (map? match) (contains? match :block/journal-day))
    (:block/journal-day match)

    (de/entity? match)
    (:block/journal-day match)

    (uuid? match)
    (indexed-attr-value db (uuid->eid db match) :block/journal-day)

    (integer? match)
    (or (indexed-attr-value db match :block/journal-day) match)

    :else nil))

(defn- property-attr-schema
  [db property-ident]
  (let [prop-eid (ident-eid db property-ident)
        value-type (when prop-eid (attr-keyword db prop-eid :db/valueType))
        cardinality (when prop-eid (attr-keyword db prop-eid :db/cardinality))
        prop-type (when prop-eid (attr-keyword db prop-eid :logseq.property/type))
        built-in-ref? (contains? #{:block/page :block/tags :block/refs :block/parent} property-ident)
        ref? (or built-in-ref?
                 (= value-type :db.type/ref)
                 (contains? db-property-type/all-ref-property-types prop-type))
        closed-eids (when prop-eid
                      (mapv :e (d/datoms db :avet :block/closed-value-property prop-eid)))
        closed-order (when (seq closed-eids)
                       (if (every? #(indexed-attr-value db % :block/order) closed-eids)
                         (into {} (map (fn [eid]
                                         [eid (indexed-attr-value db eid :block/order)])
                                       closed-eids))
                         (into {} (map-indexed (fn [idx eid] [eid idx])
                                               (sort-by #(or (indexed-attr-value db % :block/order) "")
                                                        closed-eids)))))]
    {:ident property-ident
     :type prop-type
     :ref? ref?
     :many? (or (= property-ident :block/tags)
                (= cardinality :db.cardinality/many))
     :closed-order closed-order}))

(defn- eid-sort-value
  [db {:keys [ident ref? many? closed-order] :as schema} eid]
  (let [prop-type (:type schema)]
  (cond
    (= ident :block.temp/refs-count)
    (common-initial-data/get-block-refs-count db eid)

    :else
    (let [vs (indexed-attr-values db eid ident)]
      (cond
        (empty? vs)
        nil

        closed-order
        (closed-order (first vs))

        (and ref? (= prop-type :date))
        (indexed-attr-value db (first vs) :block/journal-day)

        (and many? (or (= prop-type :number) (= prop-type :datetime)))
        (let [nums (keep (fn [v]
                           (let [n (if ref?
                                     (or (indexed-attr-value db v :logseq.property/value)
                                         (ref-value-content db v))
                                     v)]
                             (when (number? n) n)))
                         vs)]
          (when (seq nums)
            (reduce + nums)))

        many?
        (let [col (keep (fn [v]
                          (if ref? (ref-value-content db v) v))
                        vs)]
          (when (seq col)
            (string/join ", " col)))

        ref?
        (let [v (first vs)]
          (if (or (= prop-type :number) (= prop-type :datetime))
            (or (indexed-attr-value db v :logseq.property/value)
                (ref-value-content db v))
            (ref-value-content db v)))

        :else
        (first vs))))))

(defn- compare-sort-values
  [va vb asc?]
  (cond
    (and (nil? va) (nil? vb)) 0
    (nil? va) 1
    (nil? vb) -1
    :else (let [c (compare va vb)]
            (if asc? c (- c)))))

(def ^:private avet-first-window-sort-attrs
  #{:block/updated-at :block/created-at :block/title :block/name})

(defn- avet-ordered-datoms
  "AVET is a sorted-set slice. `nth` from the high end is O(n) per
  step and took 1719ms to pick 26 All Pages rows."
  [db attr asc?]
  (if asc?
    (d/datoms db :avet attr)
    (d/rseek-datoms db :avet attr)))

(defn- avet-take-eids
  [datoms match? row-limit row-offset]
  (let [xf (cond-> (comp (map :e) (filter match?) (distinct))
             (pos? (or row-offset 0)) (comp (drop row-offset))
             row-limit (comp (take row-limit)))]
    (into [] xf datoms)))

(defn- sort-eids-from-avet
  "Walk one AVET attr instead of reading a sort value per row. A 40k All
  Pages first window was spending ~2s in sort-eids-by-sorting."
  [db match? sorting row-limit leftover-eids row-offset]
  (let [sorts (or (seq sorting) [{:id :block/updated-at :asc? false}])]
    (when (= 1 (count sorts))
      (let [{:keys [id asc?]} (first sorts)]
        (when (contains? avet-first-window-sort-attrs id)
          (let [                ;; All Pages rseek+take is 1ms. Movies copied 79034 updated-at
                ;; datoms in 132ms to pick 26 recent rows. Tags with 21 eids
                ;; never reach here: take-sorted-eids sorts those eids.
                use-rseek-window? (boolean row-limit)
                datoms (if use-rseek-window?
                         (avet-ordered-datoms db id (boolean asc?))
                         (let [all (vec (d/datoms db :avet id))]
                           (if asc? all (rseq all))))]
            (when (seq datoms)
              (let [matched (avet-take-eids datoms match? row-limit row-offset)]
                (if (or row-limit (nil? leftover-eids))
                  matched
                  (let [seen (set matched)]
                    (into matched (remove seen) leftover-eids)))))))))))

(defn- sort-eids-by-sorting
  [db eids sorting]
  (let [sorts (or (seq sorting) [{:id :block/updated-at :asc? false}])
        schemas (mapv (fn [{:keys [id asc?]}]
                        (assoc (property-attr-schema db id)
                               :asc? (boolean asc?)))
                      sorts)
        eid-vec (vec eids)
        value-maps (mapv (fn [schema]
                           (persistent!
                            (reduce (fn [acc eid]
                                      (if-let [v (eid-sort-value db schema eid)]
                                        (assoc! acc eid v)
                                        acc))
                                    (transient {})
                                    eid-vec)))
                         schemas)]
    (sort (fn [a b]
            (loop [i 0]
              (if (>= i (count schemas))
                0
                (let [c (compare-sort-values (get (nth value-maps i) a)
                                             (get (nth value-maps i) b)
                                             (:asc? (nth schemas i)))]
                  (if (zero? c)
                    (recur (inc i))
                    c)))))
          eid-vec)))

(defn- take-sorted-eids
  [db eids sorting row-limit row-offset]
  (let [eid-vec (vec eids)
        wanted (set eid-vec)
        match? #(contains? wanted %)
        ;; 21 Tags spent 165ms copying 79034 updated-at datoms. The leftover
        ;; set already fits the window, so sort those eids directly.
        use-eid-sort? (and row-limit (<= (count eid-vec) row-limit))
        avet (when-not use-eid-sort?
               (sort-eids-from-avet db match? sorting row-limit eid-vec row-offset))
        sorted (or avet (sort-eids-by-sorting db eid-vec sorting))]
    (if avet
      (vec sorted)
      (if row-limit
        (vec (->> sorted (drop (or row-offset 0)) (take row-limit)))
        (vec sorted)))))

(defn- feature-filters?
  [filters input]
  (or (not (string/blank? input))
      (seq (or (:filters filters) []))))

(defn- avet-slice-count
  "Datascript AVET slices are Iters. `count` walked 41111 :block/name
  datoms in 72ms. BTSet est-count is a tree distance. nbb-logseq does
  not load that ns, so tests fall back to `count` on small fixtures."
  [datoms]
  (cond
    (nil? datoms) 0
    (counted? datoms) (count datoms)
    (exists? js/me.tonsky.persistent_sorted_set.est_count)
    (js/me.tonsky.persistent_sorted_set.est_count datoms)
    :else (count datoms)))

(defn- count-all-page-ids
  [db exclude-ids]
  (- (avet-slice-count (d/datoms db :avet :block/name))
     (count (keep #(when (indexed-attr-value db % :block/name) %)
                  exclude-ids))))

(defn- all-pages-eid?
  [db exclude-ids eid]
  (and (not (contains? exclude-ids eid))
       (some? (indexed-attr-value db eid :block/name))))

(defn- first-window-feature-row-data
  "A 26-row All Pages window does not need the 40938-id vector. Count
  pages, then walk AVET until the window is full. Returns nil when the
  sort attr is not an AVET first-window attr so the collect path runs."
  [db feat-type class-id sorting row-limit row-offset]
  (case feat-type
    :all-pages
    (let [exclude-ids (get-exclude-page-ids db)
          data (sort-eids-from-avet db
                                    #(all-pages-eid? db exclude-ids %)
                                    sorting
                                    row-limit
                                    nil
                                    row-offset)]
      (when data
        {:count (count-all-page-ids db exclude-ids)
         :data data}))

    :class-objects
    (when class-id
      (let [class-ids (cons class-id (db-class/get-structured-children db class-id))
            tag-eids (db-class/filter-visible-class-object-ids
                      db
                      (mapcat (fn [id]
                                (map :e (d/datoms db :avet :block/tags id)))
                              class-ids))]
        {:count (count tag-eids)
         :data (take-sorted-eids db tag-eids sorting row-limit row-offset)}))

    nil))

(defn- empty-attr-values?
  [raw empty-id]
  (or (empty? raw)
      (every? (fn [v]
                (or (nil? v)
                    (= v empty-id)
                    (and (string? v) (string/blank? v))
                    (and (coll? v) (empty? v))))
              raw)))

(defn- compile-filter-clause
  [db [property-ident operator match]]
  (let [schema (property-attr-schema db property-ident)
        match-set? (set? match)]
    {:schema schema
     :operator operator
     :match match
     :match-eids (when (and match-set? (seq match) (not (contains? match :empty)))
                   (into #{} (keep #(match-item->id db %)) match))
     :match-contents (when (and match-set? (seq match) (not (contains? match :empty)))
                       (into #{} (keep #(match-item-content db %)) match))
     :journal-day (when (#{:date-before :date-after} operator)
                    (match-journal-day db match))
     :timestamp (when (#{:before :after} operator)
                  (common-util/get-timestamp match))}))

(defn- clause-row
  [db eid {:keys [ident ref?] :as schema} empty-id]
  (let [prop-type (:type schema)
        raw (indexed-attr-values db eid ident)
        first-raw (first raw)]
    {:raw raw
     :ref? ref?
     :contents (mapv (fn [v]
                       (if (and ref? (integer? v))
                         (ref-value-content db v)
                         v))
                     raw)
     :treat-as-entity? (and ref?
                            (integer? first-raw)
                            (or (indexed-attr-value db first-raw :db/ident)
                                (not (contains? db-property-type/closed-value-property-types prop-type))))
     :empty-values? (empty-attr-values? raw empty-id)}))

(defn- hits-values?
  [vs match-set]
  (boolean (some #(contains? match-set %) vs)))

(defn- match-is-clause
  [{:keys [raw ref? contents treat-as-entity? empty-values?]} match match-eids match-contents]
  (let [scalar-match (if (set? match) match #{match})]
    (cond
      (boolean? match)
      (= (boolean (first contents)) match)

      (= :empty match)
      empty-values?

      (and (coll? match) (empty? match))
      true

      (and ref? (set? match))
      (if treat-as-entity?
        (hits-values? raw match-eids)
        (boolean (seq (set/intersection (set contents) match-contents))))

      :else
      (hits-values? (if ref? contents raw) scalar-match))))

(defn- match-is-not-clause
  [{:keys [raw ref? contents treat-as-entity? empty-values?]} match match-eids match-contents]
  (let [scalar-match (if (set? match) match #{match})]
    (cond
      (boolean? match)
      (not= (boolean (first contents)) match)

      (= :empty match)
      (not empty-values?)

      (and (coll? match) (empty? match) (seq raw))
      true

      (and (coll? match) (seq match) empty-values?)
      true

      (and ref? (set? match))
      (if treat-as-entity?
        (not (hits-values? raw match-eids))
        (empty? (set/intersection (set contents) match-contents)))

      :else
      (not (hits-values? (if ref? contents raw) scalar-match)))))

(defn- number-compare-match
  [contents match pred]
  (when (seq contents)
    (if match
      (some (fn [c] (and (number? c) (pred c match))) contents)
      true)))

(defn- journal-day-of
  [db v]
  (if (integer? v)
    (indexed-attr-value db v :block/journal-day)
    v))

(defn- match-text-or-number-clause
  [{:keys [contents]} operator match]
  (case operator
    :text-contains
    (some (fn [c]
            (and (some? c)
                 (string/includes? (string/lower-case (str c))
                                   (string/lower-case (str match)))))
          contents)

    :text-not-contains
    (not-any? (fn [c]
                (string/includes? (str c) (str match)))
              contents)

    :number-gt (number-compare-match contents match >)
    :number-gte (number-compare-match contents match >=)
    :number-lt (number-compare-match contents match <)
    :number-lte (number-compare-match contents match <=)

    :between
    (if (seq match)
      (let [[start end] match]
        (some (fn [c]
                (and (number? c)
                     (if start (<= start c) true)
                     (if end (<= c end) true)))
              contents))
      true)

    ::unhandled))

(defn- match-temporal-clause
  [db {:keys [raw ref? contents]} operator match journal-day timestamp]
  (case operator
    :date-before
    (when (seq raw)
      (if match
        (some (fn [v]
                (let [day (journal-day-of db v)]
                  (and day journal-day (< day journal-day))))
              raw)
        true))

    :date-after
    (when (seq raw)
      (if match
        (some (fn [v]
                (let [day (journal-day-of db v)]
                  (and day journal-day (> day journal-day))))
              raw)
        true))

    :before
    (when (seq raw)
      (if timestamp
        (some (fn [v] (and (number? v) (<= v timestamp)))
              (if ref? contents raw))
        true))

    :after
    (when (seq raw)
      (if timestamp
        (some (fn [v] (and (number? v) (>= v timestamp)))
              (if ref? contents raw))
        true))

    true))

(defn- match-compare-clause
  [db row operator match journal-day timestamp]
  (let [text-or-number (match-text-or-number-clause row operator match)]
    (if (= ::unhandled text-or-number)
      (match-temporal-clause db row operator match journal-day timestamp)
      text-or-number)))

(defn- eid-clause-match?
  [db eid {:keys [schema operator match match-eids match-contents journal-day timestamp]} empty-id]
  (if (nil? match)
    true
    (let [row (clause-row db eid schema empty-id)]
      (boolean
       (case operator
         :is (match-is-clause row match match-eids match-contents)
         :is-not (match-is-not-clause row match match-eids match-contents)
         (match-compare-clause db row operator match journal-day timestamp))))))

(defn- title-matches-input?
  [db eid input]
  (or (string/blank? input)
      (when-let [title (indexed-attr-value db eid :block/title)]
        (string/includes? (string/lower-case title) (string/lower-case input)))))

(defn- filter-eids
  [db eids filters input]
  (let [clauses (or (:filters filters) [])]
    (if (and (string/blank? input) (empty? clauses))
      (vec eids)
      (let [compiled (mapv #(compile-filter-clause db %) clauses)
            empty-id (ident-eid db :logseq.property/empty-placeholder)
            check-f (if (:or? filters) some every?)]
        (into []
              (filter (fn [eid]
                        (and (title-matches-input? db eid input)
                             (or (empty? compiled)
                                 (check-f #(eid-clause-match? db eid % empty-id)
                                          compiled)))))
              eids)))))

(defn- get-all-page-ids
  [db]
  (let [exclude-ids (get-exclude-page-ids db)]
    (persistent!
     (reduce (fn [result datom]
               (let [eid (:e datom)]
                 (if (contains? exclude-ids eid)
                   result
                   (conj! result eid))))
             (transient [])
             (d/datoms db :avet :block/name)))))

(defn- get-feature-row-data
  "ID-only Tags/All Pages path: collect, filter, and sort without hydrating row entities.
  A row-limit first window must not sort every remaining id."
  [db feat-type class-id sorting filters input row-limit row-offset]
  (let [first-window? (and row-limit (not (feature-filters? filters input)))]
    (or (when first-window?
          (first-window-feature-row-data db feat-type class-id sorting row-limit row-offset))
        (when-let [eids (case feat-type
                          :all-pages
                          (get-all-page-ids db)

                          :class-objects
                          (when class-id
                            (db-class/get-class-object-ids db class-id))

                          nil)]
          (let [filtered (filter-eids db eids filters input)]
            {:count (count filtered)
             :data (take-sorted-eids db filtered sorting row-limit row-offset)})))))

(defn- maybe-limit-rows
  [rows row-limit row-offset]
  (if row-limit
    (vec (->> rows (drop (or row-offset 0)) (take row-limit)))
    (vec rows)))

(defn- get-entities
  [db view feat-type property-ident view-for-id* sorting {:keys [include-ref-pages-count?]
                                                          :or {include-ref-pages-count? true}}]
  (let [view-for (:logseq.property/view-for view)
        view-for-id (or (:db/id view-for) view-for-id*)
        non-hidden-e (fn [id] (let [e (d/entity db id)]
                                (when-not (entity-util/hidden? e)
                                  e)))]
    (case feat-type
      :all-pages
      (get-entities-for-all-pages db sorting property-ident)

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
      (db-reference/get-linked-references db view-for-id
                                          {:include-ref-pages-count?
                                           (not (false? include-ref-pages-count?))})

      :unlinked-references
      (db-reference/get-unlinked-references db view-for-id)

      :query-result
      nil

      nil)))

(defn- get-view-entities
  [db view-id & {:keys [view-for-id view-feature-type sorting include-ref-pages-count?]}]
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
    (get-entities db view feat-type index-attr view-for-id sorting
                  (cond-> {}
                    (some? include-ref-pages-count?)
                    (assoc :include-ref-pages-count? include-ref-pages-count?)))))

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
                 (when-not (and (de/entity? e) (entity-util/recycled? e))
                   (when-let [label (get-property-value-content db e)]
                     (when-not (or (string/blank? (str label))
                                   (= empty-id (:db/id e)))
                       {:label (str label)
                        :value (if (de/entity? e)
                                 (select-keys e [:db/id :block/uuid])
                                 e)})))))
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
                      (keep (fn [v]
                              (let [e (when ref-type? (d/entity db v))]
                                (when-not (and ref-type? (entity-util/recycled? e))
                                  (let [[label value] (cond ref-type?
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
                                     :value value})))))))]
    (->>
     (if (and default-value (not (entity-util/recycled? default-value)))
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

(defn- linked-references-page-list-view-data
  [view entities-result entities]
  (let [groups-sort-by-property-ident (or (:db/ident (:logseq.property.view/sort-groups-by-property view))
                                          :block/journal-day)
        desc? (:logseq.property.view/sort-groups-desc? view)
        page-sort-value (fn [page]
                          (let [v (get page groups-sort-by-property-ident)]
                            (if (and (= groups-sort-by-property-ident :block/journal-day)
                                     (not desc?)
                                     (nil? (:block/journal-day page)))
                              js/Number.MAX_SAFE_INTEGER
                              v)))
        page-sorters (cond->
                      [{:get-value (fn [[page _blocks]] (page-sort-value page))
                        :asc? (not desc?)}]
                       (not= groups-sort-by-property-ident :block/title)
                       (conj {:get-value (fn [[page _blocks]] (:block/title page))
                              :asc? (not desc?)}))
        sorted-page-groups (sort (common-util/by-sorting page-sorters)
                                 (group-by #(or (:block/page %) %) entities))
        block-row (fn [block]
                    {:db/id (:db/id block)
                     :block/parent (:block/uuid (:block/parent block))})
        nested-group (fn [[_parent blocks]]
                       [(:block/uuid (first blocks))
                        (map block-row (ldb/sort-by-order blocks))])
        data (map (fn [[page blocks]]
                    [(select-keys page [:db/id :db/ident :block/uuid :block/title :block/name
                                        :logseq.property/value :logseq.property/icon :block/tags])
                     (->> blocks
                          (group-by :block/parent)
                          (sort-by (fn [[parent _]] (:block/order parent)))
                          (map nested-group))])
                  sorted-page-groups)]
    (merge
     {:count (count entities)
      :data data}
     (select-keys entities-result [:ref-pages-count :ref-matched-children-ids]))))

(defn ^:api ^:large-vars/cleanup-todo get-view-data
  [db view-id {:keys [journals? view-for-id view-feature-type group-by-property-ident input query-entity-ids query filters sorting row-limit row-offset]
               :as opts}]
  ;; TODO: create a view for journals maybe?
  (cond
     journals?
     (let [journals (vec (ldb/get-latest-journals db))
           index (mapv #(select-keys % [:db/id :block/journal-day]) journals)]
       {:count (count index)
        :data index})
     :else
     (let [view (d/entity db view-id)
           group-by-property (:logseq.property.view/group-by-property view)
           list-view? (= :logseq.property.view/type.list (:db/ident (:logseq.property.view/type view)))
           group-by-property-ident (or (:db/ident group-by-property) group-by-property-ident)
           group-by-closed-values? (some? (:property/closed-values group-by-property))
           ref-property? (= (:db/valueType group-by-property) :db.type/ref)
           filters (or (:logseq.property.table/filters view) filters)
           feat-type (or view-feature-type (:logseq.property.view/feature-type view))
           query? (= feat-type :query-result)
           query-entity-ids (when (seq query-entity-ids) (set query-entity-ids))
           sorting (let [sorting* (:logseq.property.table/sorting view)]
                     (if (or (= sorting* :logseq.property/empty-placeholder) (empty? sorting*))
                       (or sorting [{:id :block/updated-at :asc? false}])
                       sorting*))
           class-id (or view-for-id (:db/id (:logseq.property/view-for view)))
           fast-row-data (when (and (contains? #{:all-pages :class-objects} feat-type)
                                    (not query?)
                                    (nil? group-by-property-ident))
                           (get-feature-row-data db feat-type class-id sorting filters input
                                                 row-limit row-offset))]
       (if fast-row-data
         fast-row-data
         (let [entities-result (if query?
                                 (keep (fn [id]
                                         (let [e (d/entity db id)]
                                           (when-not (= :logseq.property/query (:db/ident (:logseq.property/created-from-property e)))
                                             e)))
                                       query-entity-ids)
                                 (get-view-entities db view-id opts))
               entities (if (= feat-type :linked-references)
                          (:ref-blocks entities-result)
                          entities-result)
               filtered-entities (if (or (seq filters) (not (string/blank? input)))
                                   (let [filter-pred (or (build-fast-filter-pred db filters input)
                                                         (fn [row] (row-matched? db row filters input)))]
                                     (into [] (filter filter-pred) entities))
                                   entities)
               nested-list-view? (and list-view?
                                       (some :block/page filtered-entities))
               group-by-page? (= group-by-property-ident :block/page)
               linked-references-page-list-fast-path?
               (and (= feat-type :linked-references)
                    group-by-page?
                    list-view?
                    (empty? filters)
                    (string/blank? input))
               group-values
               (fn group-values [ent]
                 (let [pvalue (get ent group-by-property-ident)
                       values (if (and (not (de/entity? pvalue))
                                       (coll? pvalue)
                                       (not (map? pvalue)))
                                (seq pvalue)
                                [pvalue])]
                   (or
                    (seq
                     (map
                       (fn [value]
                         (if (de/entity? value)
                           (if (match-property-value-as-entity? value group-by-property)
                             value
                             (db-property/property-value-content value))
                           value))
                       values))
                    [nil])))
               result (if linked-references-page-list-fast-path?
                        nil
                        (if group-by-property-ident
                        (let [groups-sort-by-property-ident (or (:db/ident (:logseq.property.view/sort-groups-by-property view))
                                                                :block/journal-day)
                              desc? (:logseq.property.view/sort-groups-desc? view)
                              result (->> filtered-entities
                                          (reduce (fn [groups ent]
                                                    (reduce
                                                     (fn [groups value]
                                                       (update groups value (fnil conj []) ent))
                                                     groups
                                                     (group-values ent)))
                                                  {})
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
                                          ;; For value-ref types (e.g. :number), group-values has already
                                          ;; extracted the scalar content, so by-value is no longer an entity.
                                          ;; Only re-extract for entity group keys (e.g. :node/:class).
                                          (if (de/entity? by-value)
                                            (db-property/property-value-content by-value)
                                            by-value)
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
                        (sort-entities db sorting filtered-entities)))
               data' (if linked-references-page-list-fast-path?
                       nil
                       (if group-by-property-ident
                       (map
                         (fn [[by-value entities]]
                           (let [by-value' (if (de/entity? by-value)
                                             (select-keys by-value [:db/id :db/ident :block/uuid :block/title :block/name :logseq.property/value :logseq.property/icon :block/tags])
                                             by-value)
                                 group (if nested-list-view?
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
                       (map :db/id result)))
               dedupe-data? (or (= feat-type :property-objects) query?)]
           (if linked-references-page-list-fast-path?
             (linked-references-page-list-view-data view entities-result entities)
             (cond->
             {:count (count filtered-entities)
              :data (let [rows (if dedupe-data?
                                 (distinct data')
                                 data')]
                      (if (and row-limit (nil? group-by-property-ident))
                        (maybe-limit-rows rows row-limit row-offset)
                        rows))}
             (= feat-type :linked-references)
             (merge (select-keys entities-result [:ref-pages-count :ref-matched-children-ids]))
             query?
             (assoc :properties (get-query-properties query entities-result)))))))))
