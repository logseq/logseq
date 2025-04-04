(ns logseq.db.common.view
  "Main namespace for view fns."
  (:require [cljs.reader :as reader]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.log :as log]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-plus :as entity-plus]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.rules :as rules]))

(defn get-property-value-for-search
  [block property]
  (let [typ (:logseq.property/type property)
        many? (= :db.cardinality/many (get property :db/cardinality))
        number-type? (or (= :number typ) (= :datetime typ))
        v (get block (:db/ident property))
        v' (if many? v [v])
        col (->> (if (db-property-type/all-ref-property-types typ) (map db-property/property-value-content v') v')
                 (remove nil?))]
    (cond
      number-type?
      (reduce + (filter number? col))
      :else
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
            order (ordering v1 v2)]
        (if (and (zero? order) orderings)
          (recur orderings)
          order)))))

(defn- sort-by-single-property
  [db {:keys [id asc?]} rows]
  (if (= id :block.temp/refs-count)
    (cond-> (sort-by :block.temp/refs-count rows)
      (not asc?)
      reverse)
    (let [datoms (cond->
                  (->> (d/datoms db :avet id)
                       (common-util/distinct-by :e)
                       vec)
                   (not asc?)
                   rseq)
          row-ids (set (map :db/id rows))
          id->row (zipmap (map :db/id rows) rows)]
      (keep
       (fn [d]
         (when (row-ids (:e d))
           (id->row (:e d))))
       datoms))))

(defn- sort-by-multiple-properties
  [db sorting rows]
  (let [sorting' (map (fn [{:keys [id asc?]}]
                        (let [property (or (d/entity db id) {:id id})]
                          {:asc? asc?
                           :get-value (fn [row]
                                        ((get-value-for-sort property) row))})) sorting)]
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
      (:filters filters)))))

(defn filter-blocks
  [filters ref-blocks]
  (let [exclude-ids (set (map :db/id (:excluded filters)))
        include-ids (set (map :db/id (:included filters)))
        get-ids (fn [block]
                  (set (map :db/id (:block/path-refs block))))]
    (cond->> ref-blocks
      (seq exclude-ids)
      (remove (fn [block]
                (let [ids (get-ids block)]
                  (seq (set/intersection exclude-ids ids)))))

      (seq include-ids)
      (filter (fn [block]
                (let [ids (get-ids block)]
                  (set/subset? include-ids ids)))))))

(defn get-filters
  [db page]
  (let [db-based? (entity-plus/db-based-graph? db)]
    (if db-based?
      (let [included-pages (:logseq.property.linked-references/includes page)
            excluded-pages (:logseq.property.linked-references/excludes page)]
        (when (or (seq included-pages) (seq excluded-pages))
          {:included included-pages
           :excluded excluded-pages}))
      (let [k :filters
            properties (:block/properties page)
            properties-str (or (get properties k) "{}")]
        (try (let [result (reader/read-string properties-str)]
               (when (seq result)
                 (let [excluded-pages (->> (filter #(false? (second %)) result)
                                           (keep first)
                                           (keep #(ldb/get-page db %)))
                       included-pages (->> (filter #(true? (second %)) result)
                                           (keep first)
                                           (keep #(ldb/get-page db %)))]
                   {:included included-pages
                    :excluded excluded-pages})))
             (catch :default e
               (log/error :syntax/filters e)))))))

(defn- get-linked-references
  [db id]
  (let [entity (d/entity db id)
        ids (set (cons id (ldb/get-block-alias db id)))
        refs (mapcat (fn [id] (:block/_refs (d/entity db id))) ids)
        page-filters (get-filters db entity)
        full-ref-blocks (->> refs
                             (remove (fn [block]
                                       (or
                                        (= (:db/id block) id)
                                        (= id (:db/id (:block/page block)))
                                        (ldb/hidden? (:block/page block))
                                        (contains? (set (map :db/id (:block/tags block))) (:db/id entity))
                                        (some? (get block (:db/ident entity))))))
                             (common-util/distinct-by :db/id))
        ref-blocks (cond->> full-ref-blocks
                     (seq page-filters)
                     (filter-blocks page-filters))
        ref-pages-count (->> (mapcat (fn [block]
                                       (->>
                                        (cons
                                         (:block/title (:block/page block))
                                         (map (fn [b]
                                                (when (and (ldb/page? b) (not= (:db/id b) id))
                                                  (:block/title b)))
                                              (:block/refs block)))
                                        distinct))
                                     full-ref-blocks)
                             (remove nil?)
                             (frequencies))]
    {:ref-pages-count ref-pages-count
     :ref-blocks ref-blocks}))

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
  [db view feat-type property-ident view-for-id*]
  (let [view-for (:logseq.property/view-for view)
        view-for-id (or (:db/id view-for) view-for-id*)
        non-hidden-e (fn [id] (let [e (d/entity db id)]
                                (when-not (entity-util/hidden? e)
                                  e)))]
    (case feat-type
      :all-pages
      (let [sorting (:logseq.property.table/sorting view)
            refs-count? (and (coll? sorting) (some (fn [m] (= (:id m) :block.temp/refs-count)) sorting))]
        (keep (fn [d]
                (let [e (d/entity db (:e d))]
                  (when-not (or (ldb/hidden-or-internal-tag? e)
                                (entity-util/property? e)
                                (entity-util/built-in? e))
                    (cond-> e
                      refs-count?
                      (assoc :block.temp/refs-count (count (:block/_refs e)))))))
              (d/datoms db :avet property-ident)))

      :class-objects
      (let [class-id view-for-id
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
      (get-linked-references db view-for-id)

      :unlinked-references
      (get-unlinked-references db view-for-id)

      :query-result
      nil

      nil)))

(defn- get-view-entities
  [db view-id & {:keys [view-for-id view-feature-type]}]
  (let [view (d/entity db view-id)
        feat-type (or view-feature-type (:logseq.property.view/feature-type view))
        index-attr (case feat-type
                     :all-pages
                     :block/name
                     :class-objects
                     :block/tags
                     :property-objects
                     (let [view-for (:logseq.property/view-for view)]
                       (:db/ident view-for))
                     nil)]
    (get-entities db view feat-type index-attr view-for-id)))

(defn ^:api get-property-values
  [db property-ident {:keys [view-id query-entity-ids]}]
  (let [property (d/entity db property-ident)
        default-value (:logseq.property/default-value property)
        empty-id (:db/id (d/entity db :logseq.property/empty-placeholder))
        ref-type? (= :db.type/ref (:db/valueType property))
        values (if view-id
                 (let [entities-result (get-view-entities db view-id)
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
                        (common-util/distinct-by :label)))
                 ;; get all values
                 (->> (d/datoms db :avet property-ident)
                      (map (fn [d]
                             (:v d)))
                      distinct
                      (map (fn [v]
                             (let [e (when ref-type? (d/entity db v))
                                   [label value] (if ref-type?
                                                   [(db-property/property-value-content e)
                                                    (select-keys e [:db/id :block/uuid])]
                                                   [(str v) v])]
                               {:label label
                                :value value})))
                      (common-util/distinct-by :label)))]
    (if default-value
      (cons {:label (get-property-value-content db default-value)
             :value (select-keys default-value [:db/id :block/uuid])}
            values)
      values)))

(defn ^:api ^:large-vars/cleanup-todo get-view-data
  [db view-id {:keys [journals? _view-for-id view-feature-type input query-entity-ids]
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
          group-by-property-ident (:db/ident group-by-property)
          group-by-closed-values? (some? (:property/closed-values group-by-property))
          ref-property? (= (:db/valueType group-by-property) :db.type/ref)
          filters (:logseq.property.table/filters view)
          list-view? (= :logseq.property.view/type.list (:db/ident (:logseq.property.view/type view)))
          feat-type (or view-feature-type (:logseq.property.view/feature-type view))
          query? (= feat-type :query-result)
          entities-result (if query?
                            (keep #(d/entity db %) query-entity-ids)
                            (get-view-entities db view-id opts))
          entities (if (= feat-type :linked-references)
                     (:ref-blocks entities-result)
                     entities-result)
          sorting (let [sorting* (:logseq.property.table/sorting view)]
                    (if (or (= sorting* :logseq.property/empty-placeholder) (empty? sorting*))
                      [{:id :block/updated-at, :asc? false}]
                      sorting*))
          filtered-entities (if (or (seq filters) (not (string/blank? input)))
                              (filter (fn [row] (row-matched? db row filters input)) entities)
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
          data (cond->
                {:count (count filtered-entities)
                 :data (if group-by-property
                         (map
                          (fn [[by-value entities]]
                            (let [by-value' (if (de/entity? by-value)
                                              (select-keys by-value [:db/id :block/uuid :block/title :block/name :logseq.property/value :logseq.property/icon :block/tags])
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
                                                        :block/parent (:block/uuid (:block/parent b))}) blocks)])
                                             parent-groups))
                                          (map :db/id entities))]
                              [by-value' group]))
                          result)
                         (map :db/id result))}
                 (= feat-type :linked-references)
                 (assoc :ref-pages-count (:ref-pages-count entities-result)))]
      data)))
