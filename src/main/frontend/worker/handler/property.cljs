(ns frontend.worker.handler.property
  "Property and class operations for the db worker."
  (:require [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.plain-value :as worker-plain]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.order :as db-order]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.property :as outliner-property]
            [logseq.outliner.validate :as outliner-validate]))

(defn- first-url-property-value
  [db block-id]
  (when-let [block (d/entity db block-id)]
    (some (fn [datom]
            (let [property-id (:a datom)]
              (when (db-property/property? property-id)
                (when-let [property (d/entity db property-id)]
                  (when (= :url (:logseq.property/type property))
                    (let [value (:v datom)
                          value (if (number? value) (d/entity db value) value)]
                      (or (:block/title value)
                          (when (string? value) value))))))))
          (d/datoms db :eavt (:db/id block)))))

(def-thread-api :thread-api/get-first-url-property-value
  [repo block-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (first-url-property-value @conn block-id)))

(defn get-all-classes
  [db {:keys [except-root-class? except-private-tags? except-extends-hidden-tags?]
       :or {except-root-class? false
            except-private-tags? true
            except-extends-hidden-tags? false}}]
  (let [classes (->> (d/datoms db :avet :block/tags :logseq.class/Tag)
                     (map (fn [datom]
                            (d/entity db (:e datom))))
                     (remove ldb/recycled?)
                     (remove (fn [class]
                               (and except-private-tags?
                                    (contains? ldb/private-tags (:db/ident class)))))
                     (remove (fn [class]
                               (and except-extends-hidden-tags?
                                    (contains? ldb/extends-hidden-tags (:db/ident class))))))]
    (cond->> classes
      except-root-class?
      (remove #(= :logseq.class/Root (:db/ident %)))

      true
      (map entity-util/entity->map))))

(defn class-extends-children-tree
  ([db class-id]
   (class-extends-children-tree db class-id #{}))
  ([db class-id seen]
   (when-not (contains? seen class-id)
     (let [seen' (conj seen class-id)]
       (->> (d/datoms db :avet :logseq.property.class/extends class-id)
            (keep (fn [datom]
                    (when-let [child (d/entity db (:e datom))]
                      (assoc (select-keys (entity-util/entity->map child)
                                          [:db/id :block/title :block/uuid :db/ident])
                             :class/children
                             (class-extends-children-tree db (:e datom) seen')))))
            (sort-by :block/title)
            vec)))))

(def ^:private broad-scoped-node-class-idents
  #{:logseq.class/Page})

(defn- broad-scoped-node-property?
  [property classes]
  (and (= :node (:logseq.property/type property))
       (some #(contains? broad-scoped-node-class-idents (:db/ident %)) classes)))

(defn- property-node-selector-initial-choices
  [db property non-root-classes option]
  (cond
    (= :property (:logseq.property/type property))
    nil

    (seq non-root-classes)
    (if (broad-scoped-node-property? property non-root-classes)
      (db-view/get-property-values db (:db/ident property) option)
      (->> non-root-classes
           (mapcat (fn [class] (db-class/get-class-objects db (:db/id class))))
           distinct
           (mapv #(worker-plain/worker-plain-value db %))))

    :else
    (db-view/get-property-values db (:db/ident property) option)))

(defn property-node-selector-data
  [db {:keys [property block] :as option}]
  (let [all-classes (get-all-classes db {:except-root-class? false
                                         :except-private-tags? false})
        class-options (get-all-classes db {:except-root-class? true
                                           :except-private-tags? (not (contains? #{:logseq.property/template-applied-to}
                                                                                 (:db/ident property)))})
        extends-class-options (get-all-classes db {:except-extends-hidden-tags? true})
        classes (:logseq.property/classes property)
        class? (= :class (:logseq.property/type property))
        tag-class (some (fn [class]
                          (when (= :logseq.class/Tag (:db/ident class))
                            class))
                        all-classes)
        non-root-classes (cond-> (remove (fn [class]
                                           (= (:db/ident class) :logseq.class/Root))
                                         classes)
                           (and class? tag-class)
                           (conj tag-class))
        extends-property? (= (:db/ident property) :logseq.property.class/extends)
        class-ids (->> (concat all-classes classes [(when extends-property? block)])
                       (keep :db/id)
                       distinct)
        structured-children-by-class-id (->> class-ids
                                             (map (fn [class-id]
                                                    [class-id (db-class/get-structured-children db class-id)]))
                                             (into {}))]
    {:all-classes all-classes
     :class-options class-options
     :extends-class-options extends-class-options
     :structured-children-by-class-id structured-children-by-class-id
     :initial-choices (property-node-selector-initial-choices db property non-root-classes option)}))

(def-thread-api :thread-api/get-all-classes
  [repo opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (get-all-classes @conn opts)))

(def-thread-api :thread-api/get-structured-children
  [repo class-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (db-class/get-structured-children @conn class-id)))

(def-thread-api :thread-api/get-class-extends-children-tree
  [repo class-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (class-extends-children-tree @conn class-id)))

(def-thread-api :thread-api/get-block-class-default-properties
  [repo block-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (when-let [classes-properties (some-> (outliner-property/get-block-classes-properties db block-id)
                                            :classes-properties)]
        (->> classes-properties
             (keep (fn [property]
                     (when-let [default-value (:logseq.property/default-value property)]
                       [(:db/ident property)
                        (if (:db/id default-value)
                          (entity-util/entity->map default-value)
                          default-value)])))
             (into {}))))))

(def-thread-api :thread-api/get-class-properties
  [repo class-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (when-let [class (d/entity db class-id)]
        (mapv #(worker-plain/entity-forward-map db % {})
              (outliner-property/get-class-properties class))))))

(def-thread-api :thread-api/get-alias-source-page
  [repo page-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (some-> (ldb/get-alias-source-page @conn page-id)
            entity-util/entity->map)))

(def-thread-api :thread-api/get-property-closed-values
  [repo property-ident]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (when-let [property (d/entity @conn property-ident)]
      (mapv (fn [entity]
              (select-keys (entity-util/entity->map entity)
                           [:db/id :block/uuid :block/title :block/order
                            :logseq.property/value
                            :logseq.property/icon
                            :logseq.property/choice-checkbox-state]))
            (:block/_closed-value-property property)))))

(def-thread-api :thread-api/get-property-node-selector-data
  [repo option]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (property-node-selector-data @conn option)))

(def-thread-api :thread-api/get-class-objects
  [repo class-id]
  (let [db @(worker-state/get-datascript-conn repo)]
    (->> (db-class/get-class-objects db class-id)
         (map #(worker-plain/worker-plain-value db %))
         worker-plain/with-explicit-ref-fields-recursive)))

(def-thread-api :thread-api/validate-block-tag
  [repo block-id tag-id]
  (let [db @(worker-state/get-datascript-conn repo)
        block (d/entity db [:block/uuid block-id])
        tag (d/entity db tag-id)]
    (try
      (outliner-validate/validate-unique-by-name-and-tags
       db
       (:block/title block)
       (update block :block/tags (fnil conj #{}) tag))
      {:valid? true}
      (catch :default e
        (if (= :notification (:type (ex-data e)))
          {:valid? false
           :payload (:payload (ex-data e))}
          (throw e))))))

(defn- convert-tag-to-page-tx
  [db class-id]
  (let [objects (db-class/get-class-objects db class-id)
        page-txs [[:db/retract class-id :db/ident]
                  [:db/retract class-id :block/tags :logseq.class/Tag]
                  [:db/retract class-id :logseq.property.class/extends]
                  [:db/retract class-id :logseq.property.class/properties]
                  [:db/add class-id :block/tags :logseq.class/Page]]
        object-txs (mapcat (fn [obj]
                             [{:db/id (:db/id obj)
                               :block/title (db-content/replace-tag-refs-with-page-refs
                                             (:block/title obj)
                                             (:block/tags obj))}
                              [:db/retract (:db/id obj) :block/tags class-id]])
                           objects)]
    (vec (concat page-txs object-txs))))

(def-thread-api :thread-api/convert-tag-to-page
  [repo class-id]
  (let [conn (worker-state/get-datascript-conn repo)]
    (worker-state/set-db-latest-tx-time! repo)
    (ldb/transact! conn
                   (convert-tag-to-page-tx @conn class-id)
                   {:outliner-op :save-block})
    nil))

(defn- convert-page-to-tag-tx
  [db page-id]
  (let [page (d/entity db page-id)
        class-tx (db-class/build-new-class db
                                           {:block/uuid (:block/uuid page)
                                            :block/title (:block/title page)
                                            :block/created-at (:block/created-at page)})]
    [class-tx
     [:db/retract page-id :block/tags :logseq.class/Page]]))

(def-thread-api :thread-api/convert-page-to-tag
  [repo page-id]
  (let [conn (worker-state/get-datascript-conn repo)]
    (worker-state/set-db-latest-tx-time! repo)
    (ldb/transact! conn
                   (convert-page-to-tag-tx @conn page-id)
                   {:outliner-op :save-block})
    nil))

(def-thread-api :thread-api/get-property-values
  [repo {:keys [property-ident] :as option}]
  (let [conn (worker-state/get-datascript-conn repo)]
    (db-view/get-property-values @conn property-ident option)))

(def-thread-api :thread-api/get-bidirectional-properties
  [repo {:keys [target-id]}]
  (let [conn (worker-state/get-datascript-conn repo)]
    (worker-util/profile "get-bidirectional-properties"
                         (ldb/get-bidirectional-properties @conn target-id))))

(defn- ui-non-suitable-property?
  [block property {:keys [class-schema?]}]
  (when block
    (let [block-page? (entity-util/page? block)
          block-types (let [types (entity-util/get-entity-types block)]
                        (cond-> types
                          (and block-page? (not (contains? types :page)))
                          (conj :page)
                          (empty? types)
                          (conj :block)))
          view-context (get property :logseq.property/view-context :all)]
      (or (contains? #{:logseq.property/query} (:db/ident property))
          (and (not block-page?) (contains? #{:block/alias} (:db/ident property)))
          (and (not= view-context :all) (not (contains? block-types view-context)))
          (and (entity-util/built-in? block) (contains? #{:logseq.property.class/extends} (:db/ident property)))
          (and class-schema? (db-property/public-built-in-property? property) (:logseq.property/view-context property))))))

(defn- get-all-properties
  [db {:keys [remove-built-in-property? remove-non-queryable-built-in-property? remove-ui-non-suitable-properties?
              class-schema? block]
       :or {remove-built-in-property? true
            remove-non-queryable-built-in-property? false
            remove-ui-non-suitable-properties? false}}]
  (let [result (sort-by (juxt (fn [property]
                                (some-> (:db/ident property)
                                        (db-property/plugin-property?)))
                              entity-util/built-in?
                              :block/title)
                        (remove entity-util/recycled? (ldb/get-all-properties db)))]
    (cond->> result
      remove-built-in-property?
      (remove (fn [property]
                (let [ident (:db/ident property)]
                  (and (entity-util/built-in? property)
                       (not (db-property/public-built-in-property? property))
                       (not= ident :logseq.property/icon)))))
      remove-non-queryable-built-in-property?
      (remove (fn [property]
                (let [ident (:db/ident property)]
                  (and (entity-util/built-in? property)
                       (not (:queryable? (db-property/built-in-properties ident)))))))
      remove-ui-non-suitable-properties?
      (remove (fn [property]
                (ui-non-suitable-property? block property {:class-schema? class-schema?})))
      true
      (map entity-util/entity->map))))

(def-thread-api :thread-api/get-all-properties
  [repo opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (get-all-properties @conn opts)))

(def-thread-api :thread-api/validate-property-value
  [repo {:keys [property value]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (outliner-property/validate-property-value @conn property value)))

(def-thread-api :thread-api/reorder-display-property
  [repo {:keys [block-id active-ident over-ident direction property-idents]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          sorted-properties (db-property/sort-properties
                             (keep #(d/entity db %) property-idents))
          normalize-tx-data (db-property/normalize-sorted-entities-block-order sorted-properties)
          move-down? (= direction :down)
          over (d/entity db over-ident)
          active (d/entity db active-ident)
          over-order (:block/order over)
          new-order (if move-down?
                      (let [next-order (db-order/get-next-order db nil (:db/id over))]
                        (db-order/gen-key over-order next-order))
                      (let [prev-order (db-order/get-prev-order db nil (:db/id over))]
                        (db-order/gen-key prev-order over-order)))]
      (ldb/transact! conn
                     (conj (vec normalize-tx-data)
                           {:block/uuid (:block/uuid active)
                            :block/order new-order}
                           (outliner-core/block-with-updated-at
                            {:db/id block-id}))
                     {:outliner-op :save-block}))))

(def ^:private display-property-keys
  [:db/id
   :db/ident
   :block/title
   :block/uuid
   :block/name
   :block/order
   :db/cardinality
   :logseq.property/type
   :logseq.property/public?
   :logseq.property/built-in?
   :logseq.property/hide?
   :logseq.property/hide-empty-value
   :logseq.property/ui-position
   :logseq.property/view-context
   :logseq.property/scalar-default-value
   :logseq.property/default-value])

(def ^:private display-property-value-keys
  [:db/id
   :db/ident
   :block/title
   :block/uuid
   :logseq.property/value
   :logseq.property/icon
   :logseq.property/deleted-at])

(defn- entity-direct-values
  [db entity-or-id attr]
  (let [eid (cond
              (number? entity-or-id) entity-or-id
              (map? entity-or-id) (:db/id entity-or-id)
              :else (:db/id (d/entity db entity-or-id)))]
    (map :v (d/datoms db :eavt eid attr))))

(defn entity-direct-value
  [db entity-or-id attr]
  (first (entity-direct-values db entity-or-id attr)))

(defn entity-direct-map
  [db entity keys]
  (select-keys (worker-plain/entity-forward-map db entity {}) keys))

(defn- display-property-description
  [db property]
  (when-let [description-id (entity-direct-value db property :logseq.property/description)]
    (when-let [description (d/entity db description-id)]
      (entity-direct-map db description [:db/id :block/title :block/uuid]))))

(defn- display-property-closed-values
  [db property]
  (->> (d/datoms db :avet :block/closed-value-property (:db/id property))
       (keep (fn [datom]
               (when-let [value (d/entity db (:e datom))]
                 (when-not (ldb/recycled? value)
                   value))))
       (sort-by :block/order)
       (mapv #(entity-direct-map db % display-property-value-keys))))

(defn display-property-map
  [db property-id]
  (when-let [entity (d/entity db property-id)]
    (let [description (display-property-description db entity)
          closed-values (display-property-closed-values db entity)]
      (cond-> (entity-direct-map db entity display-property-keys)
        description
        (assoc :logseq.property/description description)

        (seq closed-values)
        (assoc :property/closed-values closed-values)))))

(defn- display-property-value
  [db property-id value]
  (worker-plain/attribute-value->plain db property-id value))

(defn- entity-tagged-with?
  [db entity tag-ident]
  (some (fn [datom]
          (= tag-ident (:db/ident (d/entity db (:v datom)))))
        (d/datoms db :eavt (:db/id entity) :block/tags)))

(defn display-properties-for-block
  [db block]
  (let [properties (if (de/entity? block)
                     (->> (d/datoms db :eavt (:db/id block))
                          (keep (fn [{:keys [a v]}]
                                  (when (db-property/property? a)
                                    [a (display-property-value db a v)])))
                          (reduce (fn [result [property-id value]]
                                    (if (= :db.cardinality/many
                                           (or (get-in (d/schema db) [property-id :db/cardinality])
                                               (entity-direct-value db property-id :db/cardinality)))
                                      (update result property-id (fnil conj #{}) value)
                                      (assoc result property-id value)))
                                  {}))
                     (:block/properties block))]
    (cond-> properties
      (and (entity-tagged-with? db block :logseq.class/Tag)
           (not (ldb/built-in? block)))
      (update :logseq.property.class/enable-bidirectional? #(if (nil? %) false %)))))

(defn- entity-ref-value?
  [value]
  (and (map? value)
       (or (contains? value :db/id)
           (contains? value :block/uuid))))

(defn- contains-recycled-entity-value?
  [value]
  (cond
    (entity-ref-value? value)
    (ldb/recycled? value)

    (and (coll? value) (not (map? value)))
    (some (fn [item]
            (and (entity-ref-value? item)
                 (ldb/recycled? item)))
          value)

    :else
    false))

(defn- filter-recycled-entity-values
  [value]
  (let [active-entity-value? (fn [item]
                               (or (not (entity-ref-value? item))
                                   (not (ldb/recycled? item))))]
    (cond
      (and (entity-ref-value? value) (ldb/recycled? value))
      nil

      (set? value)
      (let [value' (set (filter active-entity-value? value))]
        (when (seq value') value'))

      (vector? value)
      (let [value' (vec (filter active-entity-value? value))]
        (when (seq value') value'))

      (and (coll? value) (not (map? value)))
      (let [value' (vec (filter active-entity-value? value))]
        (when (seq value') value'))

      :else
      value)))

(defn- sanitize-property-values-for-display
  [properties]
  (reduce-kv
   (fn [{:keys [properties recycled-only-property-ids] :as result} property-id property-value]
     (let [property-value' (filter-recycled-entity-values property-value)]
       (if (and (nil? property-value')
                (contains-recycled-entity-value? property-value))
         (assoc result
                :properties (assoc properties property-id nil)
                :recycled-only-property-ids (conj recycled-only-property-ids property-id))
         (assoc result :properties (assoc properties property-id property-value')))))
   {:properties {}
    :recycled-only-property-ids #{}}
   properties))

(defn- display-property-row
  [db property-id value]
  (when-let [property (display-property-map db property-id)]
    {:property-id property-id
     :property property
     :value value}))

(defn- sort-display-property-pairs
  [db property-pairs]
  (let [property-pair-map (into {} property-pairs)
        sorted-properties (db-property/sort-properties
                           (keep (fn [[property-id _]]
                                   (d/entity db property-id))
                                 property-pairs))]
    (keep (fn [property]
            (when-let [[property-id value] (find property-pair-map (:db/ident property))]
              (display-property-row db property-id value)))
          sorted-properties)))

(defn display-properties
  [db block {:keys [gallery-view? page-title? sidebar-properties? tag-dialog?
                    publishing? state-hide-empty-properties?]} show-empty-and-hidden-properties?]
  (let [block-entity (or (some->> (:db/id block) (d/entity db)) block)
        page-properties-area? (and (or page-title?
                                       sidebar-properties?
                                       tag-dialog?)
                                   (or (entity-tagged-with? db block-entity :logseq.class/Page)
                                       (entity-tagged-with? db block-entity :logseq.class/Tag)
                                       (entity-tagged-with? db block-entity :logseq.class/Property)
                                       (entity-tagged-with? db block-entity :logseq.class/Journal)))
        properties* (display-properties-for-block db block-entity)
        {:keys [properties recycled-only-property-ids]}
        (sanitize-property-values-for-display properties*)
        remove-built-in-or-other-position-properties
        (fn [property-pairs show-in-hidden-properties?]
          (remove (fn [property]
                    (let [id (if (vector? property) (first property) property)]
                      (or
                       (= id :block/tags)
                       (when-let [ent (d/entity db id)]
                         (or
                          (and (not (ldb/public-built-in-property? ent))
                               (ldb/built-in? ent))
                          (when-not (or page-properties-area?
                                        show-empty-and-hidden-properties?
                                        show-in-hidden-properties?)
                            (outliner-property/property-with-other-position? db block-entity ent))
                          (and gallery-view?
                               (contains? #{:logseq.property.class/properties} (:db/ident ent))))))))
                  property-pairs))
        {:keys [all-classes classes-properties]} (outliner-property/get-block-classes-properties db (:db/id block-entity))
        classes-properties-set (set (map :db/ident classes-properties))
        block-own-properties (->> properties
                                  (remove (fn [[id _]] (contains? recycled-only-property-ids id)))
                                  (remove (fn [[id _]] (classes-properties-set id))))
        hide-with-property-id (fn [property-id]
                                (let [property (d/entity db property-id)]
                                  (boolean
                                   (cond
                                     show-empty-and-hidden-properties?
                                     false
                                     state-hide-empty-properties?
                                     (nil? (get properties property-id))
                                     (and (:logseq.property/hide-empty-value property)
                                          (nil? (get properties property-id)))
                                     true
                                     :else
                                     (boolean (:logseq.property/hide? property))))))
        property-hide-f (cond
                          publishing?
                          (fn [[property-id property-value]]
                            (or (nil? property-value)
                                (hide-with-property-id property-id)))
                          state-hide-empty-properties?
                          (fn [[property-id property-value]]
                            (if (:logseq.property/hide? (d/entity db property-id))
                              (hide-with-property-id property-id)
                              (nil? property-value)))
                          :else
                          (comp hide-with-property-id first))
        {block-hidden-properties true
         block-own-properties' false} (group-by property-hide-f block-own-properties)
        class-properties (loop [classes all-classes
                                existing-properties (set (map first block-own-properties'))
                                result []]
                           (if-let [class (first classes)]
                             (let [cur-properties (->> (db-property/get-class-ordered-properties class)
                                                       (map :db/ident)
                                                       (remove existing-properties))]
                               (recur (rest classes)
                                      (into existing-properties cur-properties)
                                      (if (seq cur-properties)
                                        (into result cur-properties)
                                        result)))
                             result))
        class-property-pairs (->> class-properties
                                  (map (fn [property-id] [property-id (get properties property-id)]))
                                  (remove (fn [[property-id _]]
                                            (contains? recycled-only-property-ids property-id))))
        full-properties (-> (concat block-own-properties'
                                    (remove property-hide-f class-property-pairs))
                            (remove-built-in-or-other-position-properties false))
        hidden-properties (remove (fn [[property-id _]]
                                    (= property-id :logseq.property/query))
                                  (remove-built-in-or-other-position-properties
                                   (concat block-hidden-properties
                                           (filter property-hide-f class-property-pairs))
                                   true))]
    {:full-properties (vec (sort-display-property-pairs db full-properties))
     :hidden-properties (vec (sort-display-property-pairs db hidden-properties))
     :description-property (display-property-map db :logseq.property/description)
     :class-properties-property (display-property-map db :logseq.property.class/properties)}))

(def-thread-api :thread-api/get-display-properties
  [repo {:keys [block opts show-empty-and-hidden-properties?]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (display-properties @conn block opts show-empty-and-hidden-properties?)))

(def render-property-positions
  [:block-left :block-right :block-below])

(defn- render-schema-or-tag-related-property?
  [property-id]
  (let [property-ns (some-> property-id namespace)]
    (or (= :block/tags property-id)
        (= "logseq.property.class" property-ns)
        (contains? db-property/schema-properties property-id))))

(defn- render-tag-class-page?
  [db block]
  (or (= :logseq.class/Tag (:db/ident block))
      (ldb/class-instance? (entity-plus/entity-memoized db :logseq.class/Tag) block)))

(defn direct-block-property-ids
  [db block-id]
  (->> (d/datoms db :eavt block-id)
       (keep (fn [datom]
               (let [property-id (:a datom)]
                 (when (db-property/property? property-id)
                   property-id))))
       distinct))

(defn- property-has-closed-values?
  [db property]
  (boolean (seq (d/datoms db :avet :block/closed-value-property (:db/id property)))))

(defn- render-bottom-position-property?
  [db property]
  (let [property-id (:db/ident property)
        property-type (:logseq.property/type property)
        node-many? (and (= :node property-type)
                        (= :db.cardinality/many (:db/cardinality property)))]
    (and (not (contains? #{:url :asset} property-type))
         (or node-many?
             (not= :default property-type)
             (property-has-closed-values? db property))
         (not (render-schema-or-tag-related-property? property-id)))))

(defn- render-property-position
  [db property]
  (let [ui-position (:logseq.property/ui-position property)]
    (cond
      (contains? #{:properties :block-left :block-right :block-below} ui-position)
      ui-position

      (render-bottom-position-property? db property)
      :block-below

      :else
      :properties)))

(defn- block-direct-property-value
  [db block-id property-id]
  (entity-direct-value db block-id property-id))

(defn- render-positioned-property?
  [db block-id property-id position {:keys [allow-empty-block-below?]}]
  (when-let [property (d/entity db property-id)]
    (let [property-position (render-property-position db property)
          property-value (block-direct-property-value db block-id property-id)]
      (and
       (not (false? (:logseq.property/public? property)))
       (= property-position position)
       (not (and (:logseq.property/hide-empty-value property)
                 (nil? property-value)))
       (not (:logseq.property/hide? property))
       (not (and
             (= property-position :block-below)
             (nil? property-value)
             (not allow-empty-block-below?)
             (not (render-tag-class-page? db (d/entity db block-id)))))))))

(defn- block-positioned-property-ids
  [db block-id position]
  (let [block (d/entity db block-id)
        own-property-ids (direct-block-property-ids db block-id)
        classes-properties (when-not (render-tag-class-page? db block)
                             (some-> (outliner-property/get-block-classes-properties db block-id)
                                     :classes-properties))
        classes-property-ids-set (set (map :db/ident classes-properties))
        property-ids (if (render-tag-class-page? db block)
                       own-property-ids
                       (->> classes-properties
                            (map :db/ident)
                            (concat own-property-ids)
                            distinct))]
    (->> property-ids
         (filter (fn [property-id]
                   (render-positioned-property? db block-id property-id position
                                                {:allow-empty-block-below?
                                                 (contains? classes-property-ids-set property-id)})))
         (keep #(d/entity db %))
         db-property/sort-properties
         (map :db/ident))))

(defn block-positioned-properties
  [db block-id position]
  (->> (block-positioned-property-ids db block-id position)
       (keep #(display-property-map db %))
       vec))

(defn- sort-by-order-recursive
  [form]
  (walk/postwalk (fn [value]
                   (if (and (map? value)
                            (:block/_parent value))
                     (let [children (:block/_parent value)]
                       (-> value
                           (dissoc :block/_parent)
                           (assoc :block/children (ldb/sort-by-order children))))
                     value))
                 form))

(defn- group-by-page
  [blocks]
  (if (:block/page (first blocks))
    (some->> blocks
             (group-by :block/page))
    blocks))

(def ^:private scheduled-deadline-pull-selector
  '[:*
    {:block/page [:db/id :block/title :block/uuid]}])

(defn- get-date-scheduled-or-deadlines
  [db start-time end-time]
  (->> (d/q '[:find [(pull ?block ?block-attrs) ...]
              :in $ ?start-time ?end-time ?block-attrs
              :where
              (or [?block :logseq.property/scheduled ?n]
                  [?block :logseq.property/deadline ?n])
              [(>= ?n ?start-time)]
              [(<= ?n ?end-time)]
              [?block :logseq.property/status ?status]
              [?status :db/ident ?status-ident]
              [(not= ?status-ident :logseq.property/status.done)]
              [(not= ?status-ident :logseq.property/status.canceled)]]
            db
            start-time
            end-time
            scheduled-deadline-pull-selector)
       sort-by-order-recursive
       group-by-page))

(def-thread-api :thread-api/get-date-scheduled-or-deadlines
  [repo start-time end-time]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (get-date-scheduled-or-deadlines @conn start-time end-time)))
